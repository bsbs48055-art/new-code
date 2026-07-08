"""
SafeCity Speed Detection — FastAPI entry point.
Starts the camera processing pipeline and the stream mixer on startup.
"""
import asyncio
import os
import sys
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from config import settings
from app.db.database import init_db, database
from app.api.routes import router
from app.camera.ingestion import camera_manager, CameraConfig
from app.detection.detector import get_detector
from app.tracking.tracker import tracker_registry
from app.speed.calculator import speed_calculator_registry
from app.violations.logger import violation_registry
from app.mixer.stream_mixer import stream_mixer
from app.api.websocket import send_violation_alert, send_camera_status


# ─── Demo seed cameras ────────────────────────────────────────────────────────
DEMO_CAMERAS = [
    CameraConfig(
        camera_id="cam-001",
        name="Main Junction",
        rtsp_url="0",           # webcam / demo; replace with rtsp://...
        location="Sector 7, Block A",
        latitude=31.5204,
        longitude=74.3587,
        speed_limit=60.0,
        zone_type="urban",
        is_demo=True,
        width=1280, height=720,
    ),
    CameraConfig(
        camera_id="cam-002",
        name="School Zone Gate",
        rtsp_url="0",
        location="Model Town School",
        latitude=31.5220,
        longitude=74.3600,
        speed_limit=25.0,
        zone_type="school",
        is_demo=True,
        width=1280, height=720,
    ),
    CameraConfig(
        camera_id="cam-003",
        name="Highway Ramp",
        rtsp_url="0",
        location="M-2 On-ramp",
        latitude=31.5100,
        longitude=74.3500,
        speed_limit=120.0,
        zone_type="highway",
        is_demo=True,
        width=1280, height=720,
    ),
]


async def _seed_demo_cameras():
    """Register demo cameras with the camera manager + mixer."""
    for cfg in DEMO_CAMERAS:
        stream = camera_manager.register(cfg)
        stream_mixer.register_camera(cfg.camera_id, cfg.name, cfg.location)
        vd = violation_registry.get(cfg.camera_id, cfg.speed_limit)
        vd.add_alert_callback(send_violation_alert)
        stream.start()
        logger.info(f"[Demo] Camera {cfg.camera_id} ({cfg.name}) started")


def _build_frame_processor(camera_id: str):
    """
    Returns a callable that the CameraStream will call for each frame.
    Runs: detect → track → speed → violation check → mixer update.
    """
    detector = get_detector()
    tracker = tracker_registry.get(camera_id)
    speed_calc = speed_calculator_registry.get(camera_id)
    vd = violation_registry.get(camera_id)

    def process(pkt):
        frame = pkt.frame
        now = pkt.timestamp

        detections = detector.detect(frame)
        tracks = tracker.update(detections)

        speeds = {}
        violations = set()
        max_speed = 0.0

        for track in tracks:
            cx, cy = track.centroid
            spd = speed_calc.update(track.track_id, cx, cy, now)
            speeds[track.track_id] = round(spd, 1)
            if spd > max_speed:
                max_speed = spd

            event = vd.check(track, spd, frame, pkt.frame_number, now)
            if event:
                violations.add(track.track_id)

        annotated = detector.draw(
            frame,
            detections,
            track_ids={i: t.track_id for i, t in enumerate(tracks)},
            speeds=speeds,
            violations=violations,
        )

        stream_mixer.update_frame(
            camera_id=camera_id,
            frame=annotated,
            fps=pkt.fps,
            active_tracks=len(tracks),
            max_speed=max_speed,
            is_violation=bool(violations),
            connected=True,
        )

    return process


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SafeCity starting up…")
    os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)
    os.makedirs(settings.CALIBRATION_DIR, exist_ok=True)

    # DB
    await database.connect()
    await init_db()

    # Load YOLO once (heavy)
    detector = get_detector()

    # Demo cameras
    await _seed_demo_cameras()

    # Attach frame processors
    for cam_id, stream in camera_manager.get_all().items():
        stream.add_frame_callback(_build_frame_processor(cam_id))

    # Start mixer with current event loop
    loop = asyncio.get_event_loop()
    stream_mixer.start(loop)

    logger.success("SafeCity ready 🚦")
    yield

    # Shutdown
    camera_manager.stop_all()
    stream_mixer.stop()
    await database.disconnect()
    logger.info("SafeCity shut down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

# Serve violation snapshots
if os.path.exists(settings.SNAPSHOT_DIR):
    app.mount("/snapshots", StaticFiles(directory=settings.SNAPSHOT_DIR), name="snapshots")


@app.get("/health")
async def health():
    return {"status": "ok", "ts": time.time(), "version": settings.APP_VERSION}
