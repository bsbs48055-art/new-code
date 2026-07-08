"""
Module E — Violation Detection & Logging
Flags vehicles exceeding speed limit and persists evidence.
"""
from __future__ import annotations
import asyncio
import os
import time
import cv2
import numpy as np
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, Optional, Set, Callable, Awaitable
from datetime import datetime
from loguru import logger

from app.tracking.tracker import Track
from config import settings


@dataclass
class ViolationEvent:
    camera_id: str
    track_id: int
    vehicle_class: str
    detected_speed: float
    speed_limit: float
    overspeed_by: float
    timestamp: float
    snapshot_path: Optional[str] = None
    snapshot_url: Optional[str] = None
    license_plate: Optional[str] = None
    confidence: float = 0.0
    bbox: tuple = (0, 0, 0, 0)
    frame_number: int = 0

    def to_dict(self) -> dict:
        return {
            "camera_id": self.camera_id,
            "track_id": self.track_id,
            "vehicle_class": self.vehicle_class,
            "detected_speed": round(self.detected_speed, 1),
            "speed_limit": self.speed_limit,
            "overspeed_by": round(self.overspeed_by, 1),
            "timestamp": datetime.fromtimestamp(self.timestamp).isoformat(),
            "snapshot_url": self.snapshot_url,
            "license_plate": self.license_plate,
            "confidence": round(self.confidence, 3),
            "bbox": list(self.bbox),
        }


class ViolationDetector:
    """
    Tracks consecutive frames where a vehicle exceeds the speed limit.
    Triggers once N consecutive frames confirm the violation (reduces false positives).
    """

    def __init__(
        self,
        camera_id: str,
        speed_limit: float = settings.DEFAULT_SPEED_LIMIT,
        frame_threshold: int = settings.VIOLATION_FRAME_THRESHOLD,
        snapshot_dir: str = settings.SNAPSHOT_DIR,
    ):
        self.camera_id = camera_id
        self.speed_limit = speed_limit
        self.frame_threshold = frame_threshold
        self.snapshot_dir = snapshot_dir
        os.makedirs(snapshot_dir, exist_ok=True)

        # track_id → count of consecutive over-limit frames
        self._over_frames: Dict[int, int] = defaultdict(int)
        # track_ids already flagged in this session (avoid repeat alerts for same pass)
        self._alerted: Dict[int, float] = {}
        self._alert_cooldown = 30.0  # seconds before same vehicle can re-trigger

        self._callbacks: list[Callable[[ViolationEvent], Awaitable[None]]] = []

    def add_alert_callback(self, cb: Callable[[ViolationEvent], Awaitable[None]]):
        self._callbacks.append(cb)

    def check(
        self,
        track: Track,
        speed_kmh: float,
        frame: np.ndarray,
        frame_number: int,
        timestamp: float,
    ) -> Optional[ViolationEvent]:
        tid = track.track_id

        if speed_kmh <= self.speed_limit:
            self._over_frames[tid] = 0
            return None

        self._over_frames[tid] += 1

        if self._over_frames[tid] < self.frame_threshold:
            return None

        # Check cooldown
        last_alert = self._alerted.get(tid, 0)
        if timestamp - last_alert < self._alert_cooldown:
            return None

        self._alerted[tid] = timestamp
        self._over_frames[tid] = 0

        snapshot_path = self._save_snapshot(frame, track, speed_kmh, timestamp)

        event = ViolationEvent(
            camera_id=self.camera_id,
            track_id=tid,
            vehicle_class=track.class_name,
            detected_speed=speed_kmh,
            speed_limit=self.speed_limit,
            overspeed_by=speed_kmh - self.speed_limit,
            timestamp=timestamp,
            snapshot_path=snapshot_path,
            confidence=track.confidence,
            bbox=track.bbox,
            frame_number=frame_number,
        )

        logger.warning(
            f"[VIOLATION] Camera={self.camera_id} Track=#{tid} "
            f"Class={track.class_name} Speed={speed_kmh:.1f}km/h "
            f"(limit={self.speed_limit}km/h, over by {event.overspeed_by:.1f})"
        )

        asyncio.create_task(self._dispatch(event))
        return event

    def _save_snapshot(
        self,
        frame: np.ndarray,
        track: Track,
        speed: float,
        timestamp: float,
    ) -> str:
        ts_str = datetime.fromtimestamp(timestamp).strftime("%Y%m%d_%H%M%S")
        filename = f"violation_{self.camera_id}_{track.track_id}_{ts_str}.jpg"
        path = os.path.join(self.snapshot_dir, filename)

        # Crop vehicle region with padding
        x1, y1, x2, y2 = [int(v) for v in track.bbox]
        pad = 20
        h, w = frame.shape[:2]
        cx1 = max(0, x1 - pad)
        cy1 = max(0, y1 - pad)
        cx2 = min(w, x2 + pad)
        cy2 = min(h, y2 + pad)
        crop = frame[cy1:cy2, cx1:cx2].copy()

        # Stamp the violation info onto snapshot
        overlay = f"SPEED: {speed:.0f} km/h  |  LIMIT: {self.speed_limit:.0f} km/h  |  {ts_str}"
        cv2.putText(
            crop, overlay,
            (5, crop.shape[0] - 10),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA
        )
        cv2.imwrite(path, crop, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return path

    async def _dispatch(self, event: ViolationEvent):
        for cb in self._callbacks:
            try:
                await cb(event)
            except Exception as e:
                logger.error(f"Violation callback error: {e}")


class ViolationRegistry:
    def __init__(self):
        self._detectors: Dict[str, ViolationDetector] = {}

    def get(self, camera_id: str, speed_limit: float = settings.DEFAULT_SPEED_LIMIT) -> ViolationDetector:
        if camera_id not in self._detectors:
            self._detectors[camera_id] = ViolationDetector(camera_id, speed_limit)
        return self._detectors[camera_id]


violation_registry = ViolationRegistry()
