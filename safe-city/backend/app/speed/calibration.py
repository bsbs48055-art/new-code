"""
Speed calibration — stores per-camera homography matrices.
The homography maps pixel coordinates to real-world ground-plane meters.
"""
from __future__ import annotations
import json
import os
import numpy as np
from typing import Optional, List, Tuple
from dataclasses import dataclass
from loguru import logger
from config import settings


@dataclass
class CalibrationData:
    camera_id: str
    # pixel (u, v) points in image space — at least 4 points
    pixel_points: List[Tuple[float, float]]
    # corresponding real-world (X, Y) points in metres (ground plane)
    world_points: List[Tuple[float, float]]
    homography: Optional[np.ndarray] = None
    pixels_per_meter: float = 10.0  # fallback linear estimate

    def __post_init__(self):
        if self.homography is None and len(self.pixel_points) >= 4:
            self.compute()

    def compute(self):
        src = np.float32(self.pixel_points)
        dst = np.float32(self.world_points)
        H, status = cv_findHomography(src, dst)
        if H is not None:
            self.homography = H
            logger.info(f"[Calibration {self.camera_id}] Homography computed, "
                        f"inliers={status.sum()}/{len(status)}")
        else:
            logger.warning(f"[Calibration {self.camera_id}] Homography failed, using linear fallback")

    def pixel_to_world(self, px: float, py: float) -> Tuple[float, float]:
        if self.homography is not None:
            pt = np.float32([[[px, py]]])
            try:
                import cv2
                wp = cv2.perspectiveTransform(pt, self.homography)
                return float(wp[0][0][0]), float(wp[0][0][1])
            except Exception:
                pass
        return px / self.pixels_per_meter, py / self.pixels_per_meter

    def to_dict(self) -> dict:
        return {
            "camera_id": self.camera_id,
            "pixel_points": self.pixel_points,
            "world_points": self.world_points,
            "homography": self.homography.tolist() if self.homography is not None else None,
            "pixels_per_meter": self.pixels_per_meter,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "CalibrationData":
        cal = cls(
            camera_id=d["camera_id"],
            pixel_points=d["pixel_points"],
            world_points=d["world_points"],
            pixels_per_meter=d.get("pixels_per_meter", 10.0),
        )
        if d.get("homography"):
            cal.homography = np.array(d["homography"])
        return cal


def cv_findHomography(src: np.ndarray, dst: np.ndarray):
    try:
        import cv2
        H, status = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        return H, status
    except Exception as e:
        logger.error(f"findHomography error: {e}")
        return None, np.zeros((len(src),), dtype=np.uint8)


class CalibrationStore:
    def __init__(self, directory: str = settings.CALIBRATION_DIR):
        self.directory = directory
        os.makedirs(directory, exist_ok=True)
        self._cache: dict[str, CalibrationData] = {}

    def _path(self, camera_id: str) -> str:
        return os.path.join(self.directory, f"{camera_id}.json")

    def save(self, cal: CalibrationData):
        self._cache[cal.camera_id] = cal
        with open(self._path(cal.camera_id), "w") as f:
            json.dump(cal.to_dict(), f, indent=2)
        logger.info(f"[CalibrationStore] Saved calibration for camera {cal.camera_id}")

    def load(self, camera_id: str) -> Optional[CalibrationData]:
        if camera_id in self._cache:
            return self._cache[camera_id]
        path = self._path(camera_id)
        if not os.path.exists(path):
            logger.warning(f"[CalibrationStore] No calibration file for camera {camera_id}")
            return None
        with open(path) as f:
            d = json.load(f)
        cal = CalibrationData.from_dict(d)
        self._cache[camera_id] = cal
        logger.info(f"[CalibrationStore] Loaded calibration for camera {camera_id}")
        return cal

    def list(self) -> List[str]:
        return [f.replace(".json", "") for f in os.listdir(self.directory) if f.endswith(".json")]

    def create_default(self, camera_id: str, frame_width: int = 1280, frame_height: int = 720) -> CalibrationData:
        """
        Creates a rough default calibration assuming a standard top-down road view.
        Should be replaced with actual measured points before deployment.
        """
        w, h = frame_width, frame_height
        pixel_points = [
            (w * 0.2, h * 0.8),
            (w * 0.8, h * 0.8),
            (w * 0.7, h * 0.4),
            (w * 0.3, h * 0.4),
        ]
        # Assume the bottom strip spans 12m across, 8m deep
        world_points = [
            (0.0, 0.0),
            (12.0, 0.0),
            (12.0, 8.0),
            (0.0, 8.0),
        ]
        cal = CalibrationData(camera_id=camera_id, pixel_points=pixel_points, world_points=world_points)
        self.save(cal)
        return cal


calibration_store = CalibrationStore()
