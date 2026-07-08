"""
Module A — Camera Ingestion
Connects to RTSP/ONVIF cameras, handles reconnect, frame buffering.
"""
import asyncio
import threading
import time
import cv2
import numpy as np
from collections import deque
from dataclasses import dataclass, field
from typing import Optional, Callable, Deque
from loguru import logger
from config import settings


@dataclass
class CameraConfig:
    camera_id: str
    name: str
    rtsp_url: str
    location: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    speed_limit: float = 60.0
    zone_type: str = "urban"
    is_demo: bool = False
    width: int = 1280
    height: int = 720
    fps: int = 25


@dataclass
class FramePacket:
    camera_id: str
    frame: np.ndarray
    frame_number: int
    timestamp: float
    fps: float


class CameraStream:
    """
    Manages a single camera RTSP stream with automatic reconnect.
    Reads frames in a background thread and exposes the latest frame.
    """

    RECONNECT_DELAYS = [2, 5, 10, 30, 60]

    def __init__(self, config: CameraConfig, frame_buffer_size: int = 5):
        self.config = config
        self._cap: Optional[cv2.VideoCapture] = None
        self._frame_buffer: Deque[FramePacket] = deque(maxlen=frame_buffer_size)
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._frame_count = 0
        self._fps = 0.0
        self._connected = False
        self._last_fps_time = time.time()
        self._fps_frame_count = 0
        self._on_frame_callbacks: list[Callable[[FramePacket], None]] = []
        self._reconnect_attempt = 0

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def latest_frame(self) -> Optional[FramePacket]:
        with self._lock:
            return self._frame_buffer[-1] if self._frame_buffer else None

    def add_frame_callback(self, cb: Callable[[FramePacket], None]):
        self._on_frame_callbacks.append(cb)

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._capture_loop, daemon=True,
            name=f"cam-{self.config.camera_id}"
        )
        self._thread.start()
        logger.info(f"[Camera {self.config.camera_id}] Stream thread started → {self.config.rtsp_url}")

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=10)
        if self._cap:
            self._cap.release()
        self._connected = False
        logger.info(f"[Camera {self.config.camera_id}] Stream stopped")

    def _build_capture(self) -> cv2.VideoCapture:
        url = self.config.rtsp_url
        if self.config.is_demo:
            # Use demo video or generate synthetic frames
            cap = cv2.VideoCapture(url)
        else:
            cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
            cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 8000)
            cap.set(cv2.CAP_PROP_READ_TIMEOUT_MSEC, 5000)
        if self.config.width:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
        return cap

    def _capture_loop(self):
        skip = settings.PROCESS_EVERY_N_FRAMES
        while not self._stop_event.is_set():
            try:
                self._cap = self._build_capture()
                if not self._cap.isOpened():
                    raise ConnectionError(f"Cannot open stream: {self.config.rtsp_url}")
                self._connected = True
                self._reconnect_attempt = 0
                logger.success(f"[Camera {self.config.camera_id}] Connected")

                local_count = 0
                while not self._stop_event.is_set():
                    ret, frame = self._cap.read()
                    if not ret or frame is None:
                        raise ConnectionError("Lost frame")

                    local_count += 1
                    self._frame_count += 1

                    # Compute rolling FPS
                    self._fps_frame_count += 1
                    now = time.time()
                    elapsed = now - self._last_fps_time
                    if elapsed >= 1.0:
                        self._fps = self._fps_frame_count / elapsed
                        self._fps_frame_count = 0
                        self._last_fps_time = now

                    if local_count % skip != 0:
                        continue

                    pkt = FramePacket(
                        camera_id=self.config.camera_id,
                        frame=frame,
                        frame_number=self._frame_count,
                        timestamp=now,
                        fps=self._fps,
                    )
                    with self._lock:
                        self._frame_buffer.append(pkt)
                    for cb in self._on_frame_callbacks:
                        try:
                            cb(pkt)
                        except Exception as e:
                            logger.warning(f"Frame callback error: {e}")

            except Exception as exc:
                self._connected = False
                if self._cap:
                    self._cap.release()
                delay = self.RECONNECT_DELAYS[
                    min(self._reconnect_attempt, len(self.RECONNECT_DELAYS) - 1)
                ]
                self._reconnect_attempt += 1
                logger.warning(
                    f"[Camera {self.config.camera_id}] Error: {exc}. "
                    f"Reconnecting in {delay}s (attempt {self._reconnect_attempt})..."
                )
                self._stop_event.wait(delay)


class CameraManager:
    """
    Manages a registry of CameraStream instances.
    Singleton for the application.
    """

    def __init__(self):
        self._streams: dict[str, CameraStream] = {}

    def register(self, config: CameraConfig) -> CameraStream:
        if config.camera_id in self._streams:
            self._streams[config.camera_id].stop()
        stream = CameraStream(config)
        self._streams[config.camera_id] = stream
        return stream

    def get(self, camera_id: str) -> Optional[CameraStream]:
        return self._streams.get(camera_id)

    def get_all(self) -> dict[str, CameraStream]:
        return dict(self._streams)

    def start_all(self):
        for stream in self._streams.values():
            stream.start()

    def stop_all(self):
        for stream in self._streams.values():
            stream.stop()

    def status(self) -> dict:
        return {
            cid: {
                "connected": s.is_connected,
                "frame_count": s._frame_count,
                "fps": round(s._fps, 1),
                "name": s.config.name,
                "location": s.config.location,
            }
            for cid, s in self._streams.items()
        }


# Global singleton
camera_manager = CameraManager()
