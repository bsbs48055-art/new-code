"""
Stream Mixer — the "mixing thing"
Composites multiple annotated camera feeds into a single mosaic frame.

Features:
- Grid layout (configurable columns, auto-rows)
- Per-cell OSD: camera name, location, FPS, live speed overlay
- Red border flash on active violations
- Picture-in-Picture (PiP) mode: one camera enlarged, others in corners
- Alpha-blend violation heatmap overlay
- JPEG/MJPEG stream output for the dashboard
- Async frame broadcasting via asyncio queues
"""
from __future__ import annotations

import asyncio
import io
import math
import time
import threading
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple

import cv2
import numpy as np
from loguru import logger

from config import settings


@dataclass
class CellState:
    camera_id: str
    camera_name: str
    location: str
    frame: Optional[np.ndarray] = None
    fps: float = 0.0
    active_tracks: int = 0
    max_speed: float = 0.0
    is_violation: bool = False
    violation_count: int = 0
    connected: bool = False
    last_update: float = 0.0


@dataclass
class MixerConfig:
    cols: int = settings.MIXER_GRID_COLS
    cell_w: int = settings.MIXER_FRAME_WIDTH
    cell_h: int = settings.MIXER_FRAME_HEIGHT
    border: int = 4          # px border between cells
    background_color: Tuple = (20, 20, 30)   # dark navy
    normal_border_color: Tuple = (60, 120, 60)
    alert_border_color: Tuple = (0, 30, 220)
    osd_bg_alpha: float = 0.55
    heatmap_alpha: float = 0.30
    pip_large_fraction: float = 0.65  # fraction of canvas width for PiP main cell
    fps_target: int = 15


class StreamMixer:
    """
    Blends multiple camera frames into one composite mosaic with
    real-time overlays, violation alerts, and optional PiP mode.
    """

    def __init__(self, config: MixerConfig = MixerConfig()):
        self.config = config
        self._cells: Dict[str, CellState] = {}
        self._cell_order: List[str] = []
        self._lock = threading.Lock()

        # Set of camera_ids currently in violation (flashes the border)
        self._violation_flash: Dict[str, float] = {}  # camera_id → last violation timestamp
        self._flash_duration = 3.0  # seconds to flash after violation

        # Heatmaps per camera (accumulated speed data)
        self._heatmaps: Dict[str, np.ndarray] = {}

        # PiP mode: focus on one camera
        self._pip_camera: Optional[str] = None
        self._pip_show_index: int = 0  # which small cell to cycle

        # Output subscribers: asyncio queues that receive JPEG bytes
        self._subscribers: List[asyncio.Queue] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

        # Background render thread
        self._render_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

        # Latest composed frame (raw numpy)
        self._latest_composed: Optional[np.ndarray] = None

    # ------------------------------------------------------------------ #
    #  Registration                                                        #
    # ------------------------------------------------------------------ #

    def register_camera(self, camera_id: str, name: str, location: str = ""):
        with self._lock:
            if camera_id not in self._cells:
                self._cells[camera_id] = CellState(
                    camera_id=camera_id, camera_name=name, location=location
                )
                self._cell_order.append(camera_id)
                self._heatmaps[camera_id] = None
                logger.info(f"[Mixer] Registered camera {camera_id} ({name})")

    def unregister_camera(self, camera_id: str):
        with self._lock:
            self._cells.pop(camera_id, None)
            if camera_id in self._cell_order:
                self._cell_order.remove(camera_id)
            self._heatmaps.pop(camera_id, None)

    # ------------------------------------------------------------------ #
    #  Frame + Metadata updates                                            #
    # ------------------------------------------------------------------ #

    def update_frame(
        self,
        camera_id: str,
        frame: np.ndarray,
        fps: float = 0.0,
        active_tracks: int = 0,
        max_speed: float = 0.0,
        is_violation: bool = False,
        connected: bool = True,
    ):
        with self._lock:
            if camera_id not in self._cells:
                return
            cell = self._cells[camera_id]
            cell.frame = frame.copy() if frame is not None else None
            cell.fps = fps
            cell.active_tracks = active_tracks
            cell.max_speed = max_speed
            cell.connected = connected
            cell.last_update = time.time()

            if is_violation:
                cell.is_violation = True
                cell.violation_count += 1
                self._violation_flash[camera_id] = time.time()
            else:
                # Clear flag after flash duration
                if camera_id in self._violation_flash:
                    if time.time() - self._violation_flash[camera_id] > self._flash_duration:
                        cell.is_violation = False

            # Accumulate speed heatmap
            if frame is not None and max_speed > 0:
                self._update_heatmap(camera_id, frame, max_speed)

    def set_pip_camera(self, camera_id: Optional[str]):
        """Switch to PiP mode focusing on camera_id, or None for grid mode."""
        with self._lock:
            self._pip_camera = camera_id

    # ------------------------------------------------------------------ #
    #  Heatmap                                                             #
    # ------------------------------------------------------------------ #

    def _update_heatmap(self, camera_id: str, frame: np.ndarray, max_speed: float):
        h, w = frame.shape[:2]
        tw, th = self.config.cell_w, self.config.cell_h
        if self._heatmaps[camera_id] is None:
            self._heatmaps[camera_id] = np.zeros((th, tw), dtype=np.float32)
        scale = min(1.0, max_speed / 200.0)
        # Add a small Gaussian blob at the centre (simplified; production should use actual vehicle positions)
        cx, cy = tw // 2, th // 2
        sigma = max(30, int(tw * 0.1))
        decay = 0.98
        self._heatmaps[camera_id] *= decay
        for i in range(max(0, cy - sigma), min(th, cy + sigma)):
            for j in range(max(0, cx - sigma), min(tw, cx + sigma)):
                r = math.sqrt((i - cy) ** 2 + (j - cx) ** 2)
                if r < sigma:
                    self._heatmaps[camera_id][i, j] += scale * math.exp(-0.5 * (r / (sigma / 2)) ** 2)

    def _apply_heatmap_overlay(self, cell_frame: np.ndarray, camera_id: str) -> np.ndarray:
        hm = self._heatmaps.get(camera_id)
        if hm is None:
            return cell_frame
        h, w = cell_frame.shape[:2]
        hm_resized = cv2.resize(hm, (w, h))
        hm_norm = cv2.normalize(hm_resized, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
        hm_colored = cv2.applyColorMap(hm_norm, cv2.COLORMAP_JET)
        mask = (hm_norm > 10).astype(np.float32)[:, :, np.newaxis]
        alpha = self.config.heatmap_alpha
        blended = (cell_frame.astype(np.float32) * (1 - alpha * mask) +
                   hm_colored.astype(np.float32) * alpha * mask).clip(0, 255).astype(np.uint8)
        return blended

    # ------------------------------------------------------------------ #
    #  OSD rendering                                                       #
    # ------------------------------------------------------------------ #

    def _render_cell(self, cell: CellState) -> np.ndarray:
        cw, ch = self.config.cell_w, self.config.cell_h
        now = time.time()

        if cell.frame is None or not cell.connected:
            bg = np.zeros((ch, cw, 3), dtype=np.uint8)
            bg[:] = (30, 30, 40)
            txt = "NO SIGNAL" if not cell.connected else "WAITING..."
            (tw, th), _ = cv2.getTextSize(txt, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
            cv2.putText(bg, txt, ((cw - tw) // 2, (ch + th) // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (80, 80, 90), 2)
            canvas = bg
        else:
            canvas = cv2.resize(cell.frame, (cw, ch), interpolation=cv2.INTER_LINEAR)
            canvas = self._apply_heatmap_overlay(canvas, cell.camera_id)

        # OSD background strip (bottom)
        osd_h = 52
        osd_strip = canvas[ch - osd_h:ch].copy()
        overlay = osd_strip.copy()
        overlay[:] = (15, 15, 20)
        cv2.addWeighted(overlay, self.config.osd_bg_alpha, osd_strip,
                        1 - self.config.osd_bg_alpha, 0, osd_strip)
        canvas[ch - osd_h:ch] = osd_strip

        # Camera name
        cv2.putText(canvas, cell.camera_name, (8, ch - osd_h + 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.52, (220, 220, 220), 1, cv2.LINE_AA)
        # Location
        cv2.putText(canvas, cell.location, (8, ch - osd_h + 36),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (150, 180, 150), 1, cv2.LINE_AA)

        # FPS (top-right)
        fps_str = f"{cell.fps:.0f} FPS"
        (fw, fh), _ = cv2.getTextSize(fps_str, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.putText(canvas, fps_str, (cw - fw - 8, 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 220, 180), 1, cv2.LINE_AA)

        # Active tracks (top-left)
        tracks_str = f"Vehicles: {cell.active_tracks}"
        cv2.putText(canvas, tracks_str, (8, 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (200, 220, 240), 1, cv2.LINE_AA)

        # Max speed
        if cell.max_speed > 0:
            spd_color = (0, 80, 255) if cell.is_violation else (50, 220, 50)
            spd_str = f"MAX: {cell.max_speed:.0f} km/h"
            (sw, sh), _ = cv2.getTextSize(spd_str, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.putText(canvas, spd_str,
                        (cw - sw - 8, ch - osd_h + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, spd_color, 2, cv2.LINE_AA)

        # Violation count badge
        if cell.violation_count > 0:
            badge = f"! {cell.violation_count} VIOLATIONS"
            cv2.putText(canvas, badge, (cw // 2 - 60, ch - osd_h + 36),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.44, (0, 100, 255), 1, cv2.LINE_AA)

        # Violation flash border
        in_flash = (
            cell.camera_id in self._violation_flash and
            now - self._violation_flash[cell.camera_id] < self._flash_duration
        )
        b = self.config.border
        border_color = self.config.alert_border_color if in_flash else self.config.normal_border_color
        # Pulse alpha
        if in_flash:
            pulse = (math.sin((now - self._violation_flash[cell.camera_id]) * 6) + 1) / 2
            r, g, bv = border_color
            border_color = (int(r * pulse), int(g * pulse), int(min(255, bv + 100 * pulse)))
        cv2.rectangle(canvas, (0, 0), (cw - 1, ch - 1), border_color, b * 2)

        # Live indicator dot
        dot_color = (0, 220, 80) if cell.connected else (80, 80, 100)
        cv2.circle(canvas, (cw - 14, ch - 14), 5, dot_color, -1)

        return canvas

    # ------------------------------------------------------------------ #
    #  Composition                                                         #
    # ------------------------------------------------------------------ #

    def _compose_grid(self) -> np.ndarray:
        with self._lock:
            order = list(self._cell_order)
            cells_snapshot = {cid: self._cells[cid] for cid in order if cid in self._cells}

        if not cells_snapshot:
            blank = np.zeros((self.config.cell_h, self.config.cell_w, 3), dtype=np.uint8)
            blank[:] = self.config.background_color
            cv2.putText(blank, "No cameras registered", (20, self.config.cell_h // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 100), 2)
            return blank

        if self._pip_camera and self._pip_camera in cells_snapshot:
            return self._compose_pip(cells_snapshot, self._pip_camera)
        return self._compose_mosaic(cells_snapshot)

    def _compose_mosaic(self, cells: Dict[str, CellState]) -> np.ndarray:
        n = len(cells)
        cols = min(self.config.cols, n)
        rows = math.ceil(n / cols)
        cw, ch = self.config.cell_w, self.config.cell_h
        b = self.config.border

        canvas_w = cols * cw + (cols + 1) * b
        canvas_h = rows * ch + (rows + 1) * b
        canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
        canvas[:] = self.config.background_color

        for idx, (cid, cell) in enumerate(cells.items()):
            row = idx // cols
            col = idx % cols
            x = b + col * (cw + b)
            y = b + row * (ch + b)
            rendered = self._render_cell(cell)
            canvas[y:y + ch, x:x + cw] = rendered

        # Mixer watermark
        wm = f"SafeCity Mixer  {len(cells)} cameras  {time.strftime('%H:%M:%S')}"
        cv2.putText(canvas, wm, (b, canvas_h - b - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (80, 80, 100), 1)
        return canvas

    def _compose_pip(self, cells: Dict[str, CellState], main_id: str) -> np.ndarray:
        """
        PiP layout: main camera large on left, thumbnails stacked on right.
        """
        cw, ch = self.config.cell_w, self.config.cell_h
        b = self.config.border
        frac = self.config.pip_large_fraction

        other_ids = [cid for cid in cells if cid != main_id]
        n_others = len(other_ids)

        main_w = int(frac * (cw * 3 + b * 4)) if n_others else cw
        main_h = int(main_w * ch / cw)
        thumb_w = max(160, int((1 - frac) * (cw * 3 + b * 4)) - b * 2)
        thumb_h = int(thumb_w * ch / cw)

        canvas_w = main_w + (thumb_w + b * 2) if n_others else main_w
        canvas_h = max(main_h, n_others * (thumb_h + b) + b)
        canvas = np.zeros((canvas_h + b * 2, canvas_w + b * 2, 3), dtype=np.uint8)
        canvas[:] = self.config.background_color

        # Main cell
        main_cell = cells[main_id]
        main_rendered = self._render_cell(main_cell)
        main_resized = cv2.resize(main_rendered, (main_w, main_h))
        # Add "MAIN" label
        cv2.putText(main_resized, "MAIN", (8, 38), cv2.FONT_HERSHEY_SIMPLEX,
                    1.0, (255, 220, 0), 2, cv2.LINE_AA)
        canvas[b:b + main_h, b:b + main_w] = main_resized

        # Thumbnails
        for i, cid in enumerate(other_ids):
            cell = cells[cid]
            rendered = self._render_cell(cell)
            resized = cv2.resize(rendered, (thumb_w, thumb_h))
            ty = b + i * (thumb_h + b)
            tx = b + main_w + b
            if ty + thumb_h <= canvas.shape[0] and tx + thumb_w <= canvas.shape[1]:
                canvas[ty:ty + thumb_h, tx:tx + thumb_w] = resized

        wm = f"PiP Mode  {time.strftime('%H:%M:%S')}"
        cv2.putText(canvas, wm, (b, canvas.shape[0] - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (80, 80, 100), 1)
        return canvas

    # ------------------------------------------------------------------ #
    #  MJPEG / subscriber system                                           #
    # ------------------------------------------------------------------ #

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=4)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    def _broadcast_frame(self, jpeg_bytes: bytes):
        if not self._loop or not self._subscribers:
            return
        for q in list(self._subscribers):
            try:
                if q.full():
                    try:
                        q.get_nowait()
                    except Exception:
                        pass
                asyncio.run_coroutine_threadsafe(q.put(jpeg_bytes), self._loop)
            except Exception:
                pass

    def _encode_jpeg(self, frame: np.ndarray, quality: int = 80) -> bytes:
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        return bytes(buf)

    # ------------------------------------------------------------------ #
    #  Background render loop                                              #
    # ------------------------------------------------------------------ #

    def start(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        self._stop_event.clear()
        self._render_thread = threading.Thread(
            target=self._render_loop, daemon=True, name="mixer-render"
        )
        self._render_thread.start()
        logger.info("[Mixer] Render thread started")

    def stop(self):
        self._stop_event.set()
        if self._render_thread:
            self._render_thread.join(timeout=5)
        logger.info("[Mixer] Stopped")

    def _render_loop(self):
        frame_interval = 1.0 / self.config.fps_target
        while not self._stop_event.is_set():
            t0 = time.time()
            try:
                composed = self._compose_grid()
                self._latest_composed = composed
                jpeg = self._encode_jpeg(composed)
                self._broadcast_frame(jpeg)
            except Exception as e:
                logger.warning(f"[Mixer] Render error: {e}")
            elapsed = time.time() - t0
            sleep = max(0, frame_interval - elapsed)
            time.sleep(sleep)

    def get_latest_jpeg(self, quality: int = 80) -> Optional[bytes]:
        if self._latest_composed is None:
            return None
        return self._encode_jpeg(self._latest_composed, quality)

    def get_latest_frame(self) -> Optional[np.ndarray]:
        return self._latest_composed

    def status(self) -> dict:
        with self._lock:
            return {
                "cameras": len(self._cells),
                "pip_mode": self._pip_camera,
                "cell_states": {
                    cid: {
                        "connected": c.connected,
                        "fps": round(c.fps, 1),
                        "active_tracks": c.active_tracks,
                        "max_speed": round(c.max_speed, 1),
                        "violation_count": c.violation_count,
                        "is_violation": c.is_violation,
                    }
                    for cid, c in self._cells.items()
                }
            }


# Singleton
stream_mixer = StreamMixer()
