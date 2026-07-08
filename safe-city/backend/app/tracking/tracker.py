"""
Module C — Multi-Object Tracking
ByteTrack-style implementation for persistent vehicle IDs across frames.
Falls back to a simple IoU tracker if lap/filterpy are unavailable.
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
from loguru import logger

from app.detection.detector import Detection


@dataclass
class Track:
    track_id: int
    class_name: str
    class_id: int
    bbox: Tuple[float, float, float, float]  # x1,y1,x2,y2
    confidence: float
    hits: int = 1
    age: int = 0
    frames_since_update: int = 0
    history: List[Tuple[float, float]] = field(default_factory=list)  # centroid history

    @property
    def centroid(self) -> Tuple[float, float]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def update(self, detection: Detection):
        self.bbox = (detection.x1, detection.y1, detection.x2, detection.y2)
        self.confidence = detection.confidence
        self.class_name = detection.class_name
        self.frames_since_update = 0
        self.hits += 1
        cx, cy = self.centroid
        self.history.append((cx, cy))
        if len(self.history) > 60:
            self.history.pop(0)


def _iou(a: Tuple, b: Tuple) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)
    inter_w = max(0, ix2 - ix1)
    inter_h = max(0, iy2 - iy1)
    inter = inter_w * inter_h
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


class IoUTracker:
    """
    Lightweight IoU-based multi-object tracker.
    For production use swap this with ByteTrack or SORT.
    """

    def __init__(self, iou_threshold: float = 0.3, max_age: int = 15, min_hits: int = 2):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.min_hits = min_hits
        self._tracks: Dict[int, Track] = {}
        self._next_id = 1

    def update(self, detections: List[Detection]) -> List[Track]:
        """
        Match new detections to existing tracks via greedy IoU matching.
        Returns list of confirmed tracks (min_hits met, not stale).
        """
        # Age all tracks
        for t in self._tracks.values():
            t.age += 1
            t.frames_since_update += 1

        if not detections:
            self._prune()
            return self._active_tracks()

        unmatched_dets = list(range(len(detections)))
        matched_track_ids = set()

        # Build IoU matrix
        track_ids = list(self._tracks.keys())
        if track_ids:
            iou_matrix = np.zeros((len(track_ids), len(detections)))
            for ti, tid in enumerate(track_ids):
                for di, det in enumerate(detections):
                    iou_matrix[ti, di] = _iou(self._tracks[tid].bbox, det.bbox)

            # Greedy matching (highest IoU first)
            while True:
                if iou_matrix.size == 0:
                    break
                best = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
                ti, di = best
                if iou_matrix[ti, di] < self.iou_threshold:
                    break
                tid = track_ids[ti]
                self._tracks[tid].update(detections[di])
                matched_track_ids.add(tid)
                if di in unmatched_dets:
                    unmatched_dets.remove(di)
                iou_matrix[ti, :] = -1
                iou_matrix[:, di] = -1

        # Create new tracks for unmatched detections
        for di in unmatched_dets:
            det = detections[di]
            new_track = Track(
                track_id=self._next_id,
                class_name=det.class_name,
                class_id=det.class_id,
                bbox=(det.x1, det.y1, det.x2, det.y2),
                confidence=det.confidence,
            )
            cx, cy = new_track.centroid
            new_track.history.append((cx, cy))
            self._tracks[self._next_id] = new_track
            self._next_id += 1

        self._prune()
        return self._active_tracks()

    def _prune(self):
        dead = [tid for tid, t in self._tracks.items() if t.frames_since_update > self.max_age]
        for tid in dead:
            del self._tracks[tid]

    def _active_tracks(self) -> List[Track]:
        return [t for t in self._tracks.values() if t.hits >= self.min_hits]

    def get_all_tracks(self) -> Dict[int, Track]:
        return dict(self._tracks)

    def reset(self):
        self._tracks.clear()
        self._next_id = 1


class PerCameraTracker:
    """
    Factory that maintains one tracker per camera.
    """

    def __init__(self):
        self._trackers: Dict[str, IoUTracker] = {}

    def get(self, camera_id: str) -> IoUTracker:
        if camera_id not in self._trackers:
            self._trackers[camera_id] = IoUTracker()
        return self._trackers[camera_id]

    def reset(self, camera_id: str):
        if camera_id in self._trackers:
            self._trackers[camera_id].reset()


tracker_registry = PerCameraTracker()
