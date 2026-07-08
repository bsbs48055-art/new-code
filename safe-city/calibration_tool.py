#!/usr/bin/env python3
"""
Interactive Camera Calibration Tool
====================================
Click 4+ ground-plane reference points in the camera frame,
then enter their real-world distances (metres).
Saves a calibration JSON file for use by the speed calculator.

Usage:
  python calibration_tool.py --camera 0            # webcam
  python calibration_tool.py --rtsp rtsp://...     # RTSP stream
  python calibration_tool.py --image frame.jpg     # from a saved frame

Controls:
  Left-click  — place a calibration point
  'u'         — undo last point
  'c'         — clear all points
  'h'         — toggle homography preview
  's' / Enter — save calibration and exit
  'q' / ESC   — quit without saving
"""
import cv2
import numpy as np
import json
import argparse
import sys
import os
from typing import List, Tuple
from datetime import datetime

CALIBRATION_DIR = os.environ.get("CALIBRATION_DIR", "./data/calibrations")

pixel_points: List[Tuple[int, int]] = []
world_points: List[Tuple[float, float]] = []
frame_copy = None
homography_preview = False
H = None
COLORS = [
    (0, 255, 80), (80, 200, 255), (255, 180, 0), (255, 80, 200),
    (0, 160, 255), (255, 80, 80), (80, 255, 200), (200, 80, 255),
]


def draw_overlay(img: np.ndarray, show_grid: bool = False) -> np.ndarray:
    out = img.copy()
    for i, (px, py) in enumerate(pixel_points):
        color = COLORS[i % len(COLORS)]
        cv2.circle(out, (px, py), 7, color, -1)
        cv2.circle(out, (px, py), 9, (255, 255, 255), 2)
        label = f"P{i+1}"
        if i < len(world_points):
            wx, wy = world_points[i]
            label += f" ({wx:.1f}m, {wy:.1f}m)"
        cv2.putText(out, label, (px + 12, py - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

    # Draw guide lines connecting points
    if len(pixel_points) >= 2:
        for i in range(len(pixel_points) - 1):
            cv2.line(out, pixel_points[i], pixel_points[i + 1], (180, 180, 180), 1, cv2.LINE_AA)

    # Status
    n = len(pixel_points)
    msg = f"Points: {n} | Need >= 4 to compute homography"
    if n >= 4:
        msg = f"Points: {n} | Press 'h' for preview, Enter to SAVE"
    cv2.rectangle(out, (0, out.shape[0] - 36), (out.shape[1], out.shape[0]), (20, 20, 30), -1)
    cv2.putText(out, msg, (10, out.shape[0] - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 220, 200), 1)

    if show_grid and H is not None:
        _draw_world_grid(out)
    return out


def _draw_world_grid(img: np.ndarray):
    """Project a metric grid onto the image using inverse homography."""
    try:
        H_inv = np.linalg.inv(H)
        grid_step = 1.0  # 1 metre grid
        max_range = 20
        for wx in np.arange(-max_range, max_range, grid_step):
            pts = np.float32([[[wx, wy]] for wy in np.arange(0, max_range, 0.5)])
            img_pts = cv2.perspectiveTransform(pts, H_inv)
            for i in range(len(img_pts) - 1):
                p1 = tuple(int(v) for v in img_pts[i][0])
                p2 = tuple(int(v) for v in img_pts[i + 1][0])
                if all(0 <= v < dim for v, dim in zip(p1 + p2, [img.shape[1], img.shape[0]] * 2)):
                    cv2.line(img, p1, p2, (60, 100, 60), 1)
    except Exception:
        pass


def mouse_callback(event, x, y, flags, param):
    global frame_copy
    if event == cv2.EVENT_LBUTTONDOWN:
        print(f"\nPoint {len(pixel_points) + 1} placed at pixel ({x}, {y})")
        wx = float(input("  Enter real-world X (metres, 0 = left reference): "))
        wy = float(input("  Enter real-world Y (metres, 0 = near reference): "))
        pixel_points.append((x, y))
        world_points.append((wx, wy))
        _try_compute_homography()
        if frame_copy is not None:
            cv2.imshow("SafeCity Calibration", draw_overlay(frame_copy, homography_preview))


def _try_compute_homography():
    global H
    if len(pixel_points) >= 4:
        src = np.float32(pixel_points)
        dst = np.float32(world_points)
        H, status = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
        inliers = int(status.sum()) if status is not None else 0
        print(f"  Homography computed: {inliers}/{len(pixel_points)} inliers")


def save_calibration(camera_id: str):
    os.makedirs(CALIBRATION_DIR, exist_ok=True)
    out_path = os.path.join(CALIBRATION_DIR, f"{camera_id}.json")
    data = {
        "camera_id": camera_id,
        "pixel_points": [list(p) for p in pixel_points],
        "world_points": [list(p) for p in world_points],
        "homography": H.tolist() if H is not None else None,
        "pixels_per_meter": 10.0,
        "created_at": datetime.now().isoformat(),
    }
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✅ Calibration saved to: {out_path}")


def run(source, camera_id: str):
    global frame_copy, homography_preview

    if source.isdigit():
        cap = cv2.VideoCapture(int(source))
    else:
        cap = cv2.VideoCapture(source)

    ret, frame = cap.read()
    if not ret:
        print(f"ERROR: Cannot read from source: {source}")
        sys.exit(1)
    cap.release()

    frame_copy = frame.copy()
    cv2.namedWindow("SafeCity Calibration", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("SafeCity Calibration", 1280, 720)
    cv2.setMouseCallback("SafeCity Calibration", mouse_callback)

    print(f"\n=== SafeCity Camera Calibration Tool ===")
    print(f"Camera ID: {camera_id}")
    print("Left-click to place points. Enter real-world coords when prompted.")
    print("Press 'h' to toggle homography grid, Enter/'s' to save, 'q' to quit.\n")

    cv2.imshow("SafeCity Calibration", draw_overlay(frame_copy))

    while True:
        key = cv2.waitKey(50) & 0xFF
        if key in (ord("q"), 27):
            print("Cancelled — no calibration saved.")
            break
        elif key == ord("u") and pixel_points:
            pixel_points.pop()
            world_points.pop()
            _try_compute_homography()
            cv2.imshow("SafeCity Calibration", draw_overlay(frame_copy, homography_preview))
        elif key == ord("c"):
            pixel_points.clear()
            world_points.clear()
            H = None
            cv2.imshow("SafeCity Calibration", draw_overlay(frame_copy, False))
        elif key == ord("h"):
            homography_preview = not homography_preview
            cv2.imshow("SafeCity Calibration", draw_overlay(frame_copy, homography_preview))
        elif key in (13, ord("s")):
            if len(pixel_points) < 4:
                print("Need at least 4 points before saving.")
            else:
                save_calibration(camera_id)
                break

    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SafeCity Camera Calibration Tool")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--camera", type=str, help="Camera index (0, 1, …) or RTSP URL")
    group.add_argument("--image", type=str, help="Path to a saved frame image")
    parser.add_argument("--id", type=str, default="cam-001", help="Camera ID for the output file")
    args = parser.parse_args()

    source = args.image or args.camera
    run(source, args.id)
