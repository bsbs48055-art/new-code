"""
Module D — Speed Calculation
Uses homography-transformed centroid displacements + frame timestamps.
Applies smoothing to reduce jitter.
"""
from __future__ import annotations
import math
from collections import defaultdict, deque
from typing import Dict, Optional, Tuple, Deque
from dataclasses import dataclass, field
import time

from app.speed.calibration import CalibrationData, calibration_store
from config import settings


@dataclass
class SpeedSample:
    timestamp: float
    world_x: float
    world_y: float
    speed_kmh: float = 0.0


class VehicleSpeedEstimator:
    """
    Per-vehicle speed estimator.
    Keeps a rolling window of (timestamp, world_coord) pairs
    and computes smoothed speed.
    """

    def __init__(self, smoothing: int = settings.SPEED_SMOOTHING_FRAMES):
        self.smoothing = smoothing
        self._samples: Deque[SpeedSample] = deque(maxlen=smoothing + 1)
        self.current_speed: float = 0.0
        self.peak_speed: float = 0.0

    def add_observation(self, world_x: float, world_y: float, timestamp: float):
        sample = SpeedSample(timestamp=timestamp, world_x=world_x, world_y=world_y)
        if self._samples:
            prev = self._samples[-1]
            dt = timestamp - prev.timestamp
            if dt > 0:
                dx = world_x - prev.world_x
                dy = world_y - prev.world_y
                dist_m = math.sqrt(dx * dx + dy * dy)
                speed_ms = dist_m / dt
                sample.speed_kmh = speed_ms * 3.6
            else:
                sample.speed_kmh = self._samples[-1].speed_kmh
        self._samples.append(sample)
        self.current_speed = self._smoothed_speed()
        if self.current_speed > self.peak_speed:
            self.peak_speed = self.current_speed

    def _smoothed_speed(self) -> float:
        speeds = [s.speed_kmh for s in self._samples if s.speed_kmh > 0]
        if not speeds:
            return 0.0
        # Weighted average: more recent = higher weight
        weights = list(range(1, len(speeds) + 1))
        return sum(s * w for s, w in zip(speeds, weights)) / sum(weights)


class SpeedCalculator:
    """
    Manages speed estimators for all tracked vehicles on a camera.
    """

    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self._estimators: Dict[int, VehicleSpeedEstimator] = {}
        self._calibration: Optional[CalibrationData] = None
        self._load_calibration()

    def _load_calibration(self):
        self._calibration = calibration_store.load(self.camera_id)
        if self._calibration is None:
            # Create default for this camera
            self._calibration = calibration_store.create_default(self.camera_id)

    def update(self, track_id: int, pixel_cx: float, pixel_cy: float, timestamp: float) -> float:
        """
        Feed a new centroid observation for track_id.
        Returns the current smoothed speed in km/h.
        """
        if track_id not in self._estimators:
            self._estimators[track_id] = VehicleSpeedEstimator()

        wx, wy = self._calibration.pixel_to_world(pixel_cx, pixel_cy)
        self._estimators[track_id].add_observation(wx, wy, timestamp)
        return self._estimators[track_id].current_speed

    def get_speed(self, track_id: int) -> float:
        est = self._estimators.get(track_id)
        return est.current_speed if est else 0.0

    def get_all_speeds(self) -> Dict[int, float]:
        return {tid: est.current_speed for tid, est in self._estimators.items()}

    def remove_track(self, track_id: int):
        self._estimators.pop(track_id, None)

    def reload_calibration(self):
        self._load_calibration()


class SpeedCalculatorRegistry:
    def __init__(self):
        self._calculators: Dict[str, SpeedCalculator] = {}

    def get(self, camera_id: str) -> SpeedCalculator:
        if camera_id not in self._calculators:
            self._calculators[camera_id] = SpeedCalculator(camera_id)
        return self._calculators[camera_id]


speed_calculator_registry = SpeedCalculatorRegistry()
