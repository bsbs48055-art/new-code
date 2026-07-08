"""
Module B — Vehicle Detection
YOLOv8-based multi-class vehicle detector.
"""
from __future__ import annotations
import numpy as np
import cv2
from dataclasses import dataclass
from typing import List, Optional
from loguru import logger

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("ultralytics not installed; detector will return empty results")

from config import settings


@dataclass
class Detection:
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    class_name: str

    @property
    def bbox(self):
        return (self.x1, self.y1, self.x2, self.y2)

    @property
    def centroid(self):
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)

    @property
    def width(self):
        return self.x2 - self.x1

    @property
    def height(self):
        return self.y2 - self.y1

    @property
    def area(self):
        return self.width * self.height

    def to_tlwh(self):
        """top-left x, y, width, height — used by trackers"""
        return [self.x1, self.y1, self.width, self.height]

    def to_xyxy(self):
        return [self.x1, self.y1, self.x2, self.y2]


# Per-class colour palette for bounding boxes
CLASS_COLORS = {
    "car":        (0, 200, 255),
    "motorcycle": (0, 255, 100),
    "bus":        (255, 150, 0),
    "truck":      (200, 0, 255),
    "rickshaw":   (255, 50, 50),
    "unknown":    (180, 180, 180),
}


class VehicleDetector:
    """
    Wraps YOLOv8 and filters only vehicle classes.
    Thread-safe for use from frame-processing worker threads.
    """

    def __init__(
        self,
        model_path: str = settings.YOLO_MODEL,
        confidence: float = settings.YOLO_CONFIDENCE,
        device: str = settings.YOLO_DEVICE,
        vehicle_class_ids: Optional[List[int]] = None,
    ):
        self.confidence = confidence
        self.device = device
        self.vehicle_class_ids = set(
            vehicle_class_ids or settings.VEHICLE_CLASS_IDS
        )
        self._model: Optional[YOLO] = None
        self._model_path = model_path
        self._class_map: dict[int, str] = {}

    def load(self):
        if not YOLO_AVAILABLE:
            logger.error("YOLO not available")
            return
        logger.info(f"Loading YOLO model: {self._model_path} on device={self.device}")
        self._model = YOLO(self._model_path)
        self._model.to(self.device)
        # Build id→name map from COCO names
        self._class_map = {v: k for k, v in self._model.names.items()}
        # Reverse: id→name
        self._class_map = {int(k): v for k, v in self._model.names.items()}
        logger.success(f"YOLO model loaded. Classes: {len(self._class_map)}")

    def detect(self, frame: np.ndarray) -> List[Detection]:
        if self._model is None:
            return []

        results = self._model.predict(
            frame,
            conf=self.confidence,
            verbose=False,
            device=self.device,
        )
        detections: List[Detection] = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if cls_id not in self.vehicle_class_ids:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                class_name = self._class_map.get(cls_id, "unknown")
                detections.append(Detection(
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    confidence=conf,
                    class_id=cls_id,
                    class_name=class_name,
                ))
        return detections

    def draw(
        self,
        frame: np.ndarray,
        detections: List[Detection],
        track_ids: Optional[dict] = None,
        speeds: Optional[dict] = None,
        violations: Optional[set] = None,
    ) -> np.ndarray:
        """
        Draw bounding boxes with optional track IDs and speeds.
        track_ids: {det_idx: track_id}
        speeds:    {track_id: speed_kmh}
        violations: set of track_ids that are over-speed
        """
        out = frame.copy()
        violations = violations or set()

        for i, det in enumerate(detections):
            color = CLASS_COLORS.get(det.class_name, CLASS_COLORS["unknown"])
            tid = track_ids.get(i) if track_ids else None
            spd = speeds.get(tid) if (speeds and tid is not None) else None
            is_violation = tid in violations

            thickness = 3 if is_violation else 2
            box_color = (0, 0, 255) if is_violation else color

            cv2.rectangle(out, (int(det.x1), int(det.y1)), (int(det.x2), int(det.y2)), box_color, thickness)

            label_parts = [det.class_name]
            if tid is not None:
                label_parts.append(f"#{tid}")
            if spd is not None:
                label_parts.append(f"{spd:.0f}km/h")
            label = " ".join(label_parts)

            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
            lx, ly = int(det.x1), int(det.y1) - 5
            cv2.rectangle(out, (lx, ly - th - 4), (lx + tw + 4, ly + 2), box_color, -1)
            cv2.putText(out, label, (lx + 2, ly), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

            if is_violation:
                cv2.putText(out, "! OVERSPEED !", (int(det.x1), int(det.y2) + 18),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
        return out


# Singleton
_detector: Optional[VehicleDetector] = None


def get_detector() -> VehicleDetector:
    global _detector
    if _detector is None:
        _detector = VehicleDetector()
        _detector.load()
    return _detector
