"""
REST + WebSocket + MJPEG API routes.
"""
from __future__ import annotations
import asyncio
import io
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect,
    Query, Path, Body, status, BackgroundTasks,
)
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db import models
from app.camera.ingestion import camera_manager, CameraConfig
from app.detection.detector import get_detector
from app.tracking.tracker import tracker_registry
from app.speed.calculator import speed_calculator_registry
from app.speed.calibration import calibration_store, CalibrationData
from app.violations.logger import violation_registry
from app.mixer.stream_mixer import stream_mixer
from app.api.websocket import ws_manager, send_violation_alert
from config import settings

router = APIRouter()


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    location: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    zone_type: str = "urban"
    speed_limit: float = 60.0

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    rtsp_url: Optional[str] = None
    location: Optional[str] = None
    speed_limit: Optional[float] = None
    zone_type: Optional[str] = None
    is_active: Optional[bool] = None

class CalibrationIn(BaseModel):
    camera_id: str
    pixel_points: List[List[float]]
    world_points: List[List[float]]
    pixels_per_meter: float = 10.0

class MixerPipRequest(BaseModel):
    camera_id: Optional[str] = None  # None = grid mode


# ─── Camera Management ───────────────────────────────────────────────────────

@router.get("/cameras", tags=["cameras"])
async def list_cameras(db: AsyncSession = Depends(get_db)):
    result = await db.execute(models.Camera.__table__.select())
    rows = result.fetchall()
    status_map = camera_manager.status()
    out = []
    for row in rows:
        d = dict(row._mapping)
        s = status_map.get(d["id"], {})
        d["stream_connected"] = s.get("connected", False)
        d["stream_fps"] = s.get("fps", 0)
        out.append(d)
    return out


@router.post("/cameras", tags=["cameras"], status_code=201)
async def create_camera(body: CameraCreate, db: AsyncSession = Depends(get_db)):
    cam = models.Camera(
        name=body.name,
        rtsp_url=body.rtsp_url,
        location=body.location,
        latitude=body.latitude,
        longitude=body.longitude,
        zone_type=body.zone_type,
        speed_limit=body.speed_limit,
    )
    db.add(cam)
    await db.flush()
    await db.refresh(cam)

    cfg = CameraConfig(
        camera_id=cam.id,
        name=cam.name,
        rtsp_url=cam.rtsp_url,
        location=cam.location or "",
        latitude=cam.latitude or 0.0,
        longitude=cam.longitude or 0.0,
        speed_limit=cam.speed_limit or 60.0,
    )
    stream = camera_manager.register(cfg)
    stream_mixer.register_camera(cam.id, cam.name, cam.location or "")

    vd = violation_registry.get(cam.id, cam.speed_limit or 60.0)
    vd.add_alert_callback(send_violation_alert)

    stream.start()
    return {"id": cam.id, "name": cam.name, "message": "Camera created and stream started"}


@router.patch("/cameras/{camera_id}", tags=["cameras"])
async def update_camera(
    camera_id: str = Path(...),
    body: CameraUpdate = Body(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        models.Camera.__table__.select().where(models.Camera.id == camera_id)
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if updates:
        await db.execute(
            models.Camera.__table__.update().where(models.Camera.id == camera_id).values(**updates)
        )
    return {"message": "Updated"}


@router.delete("/cameras/{camera_id}", tags=["cameras"])
async def delete_camera(camera_id: str = Path(...), db: AsyncSession = Depends(get_db)):
    s = camera_manager.get(camera_id)
    if s:
        s.stop()
    stream_mixer.unregister_camera(camera_id)
    await db.execute(models.Camera.__table__.delete().where(models.Camera.id == camera_id))
    return {"message": "Deleted"}


# ─── Stream Snapshot ─────────────────────────────────────────────────────────

@router.get("/cameras/{camera_id}/snapshot", tags=["streams"])
async def get_snapshot(camera_id: str = Path(...)):
    stream = camera_manager.get(camera_id)
    if not stream:
        raise HTTPException(status_code=404, detail="Camera not found")
    pkt = stream.latest_frame
    if pkt is None:
        raise HTTPException(status_code=503, detail="No frame available yet")
    import cv2
    _, buf = cv2.imencode(".jpg", pkt.frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return StreamingResponse(io.BytesIO(bytes(buf)), media_type="image/jpeg")


# ─── MJPEG Live Streams ───────────────────────────────────────────────────────

async def _mjpeg_generator(camera_id: str):
    stream = camera_manager.get(camera_id)
    if not stream:
        return
    prev_frame_num = -1
    while True:
        pkt = stream.latest_frame
        if pkt and pkt.frame_number != prev_frame_num:
            prev_frame_num = pkt.frame_number
            import cv2
            _, buf = cv2.imencode(".jpg", pkt.frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            yield (
                b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                bytes(buf) + b"\r\n"
            )
        await asyncio.sleep(0.04)


@router.get("/cameras/{camera_id}/stream.mjpeg", tags=["streams"])
async def camera_mjpeg(camera_id: str = Path(...)):
    return StreamingResponse(
        _mjpeg_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


async def _mixer_mjpeg_generator():
    """MJPEG stream of the composed multi-camera mosaic."""
    q = stream_mixer.subscribe()
    try:
        while True:
            try:
                jpeg = await asyncio.wait_for(q.get(), timeout=2.0)
                yield (
                    b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" +
                    jpeg + b"\r\n"
                )
            except asyncio.TimeoutError:
                continue
    finally:
        stream_mixer.unsubscribe(q)


@router.get("/mixer/stream.mjpeg", tags=["mixer"])
async def mixer_mjpeg():
    """Live composite mosaic MJPEG stream."""
    return StreamingResponse(
        _mixer_mjpeg_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@router.get("/mixer/snapshot", tags=["mixer"])
async def mixer_snapshot():
    jpeg = stream_mixer.get_latest_jpeg()
    if jpeg is None:
        raise HTTPException(status_code=503, detail="No mixed frame available")
    return StreamingResponse(io.BytesIO(jpeg), media_type="image/jpeg")


@router.get("/mixer/status", tags=["mixer"])
async def mixer_status():
    return stream_mixer.status()


@router.post("/mixer/pip", tags=["mixer"])
async def set_pip_mode(body: MixerPipRequest):
    stream_mixer.set_pip_camera(body.camera_id)
    return {"pip_camera": body.camera_id, "mode": "pip" if body.camera_id else "grid"}


# ─── Calibration ─────────────────────────────────────────────────────────────

@router.post("/calibration", tags=["calibration"])
async def set_calibration(body: CalibrationIn):
    cal = CalibrationData(
        camera_id=body.camera_id,
        pixel_points=[tuple(p) for p in body.pixel_points],
        world_points=[tuple(p) for p in body.world_points],
        pixels_per_meter=body.pixels_per_meter,
    )
    calibration_store.save(cal)
    speed_calculator_registry.get(body.camera_id).reload_calibration()
    return {"message": "Calibration saved", "homography_computed": cal.homography is not None}


@router.get("/calibration/{camera_id}", tags=["calibration"])
async def get_calibration(camera_id: str = Path(...)):
    cal = calibration_store.load(camera_id)
    if not cal:
        raise HTTPException(status_code=404, detail="No calibration for this camera")
    return cal.to_dict()


# ─── Violations ───────────────────────────────────────────────────────────────

@router.get("/violations", tags=["violations"])
async def list_violations(
    camera_id: Optional[str] = Query(None),
    min_speed: Optional[float] = Query(None),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    q = models.Violation.__table__.select().order_by(
        models.Violation.timestamp.desc()
    ).limit(limit).offset(offset)
    if camera_id:
        q = q.where(models.Violation.camera_id == camera_id)
    if min_speed:
        q = q.where(models.Violation.detected_speed >= min_speed)
    result = await db.execute(q)
    rows = result.fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/violations/stats", tags=["violations"])
async def violation_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, text
    result = await db.execute(
        models.Violation.__table__.select()
    )
    rows = result.fetchall()
    if not rows:
        return {"total": 0, "by_camera": {}, "avg_overspeed": 0}
    by_cam: Dict[str, int] = {}
    total_over = 0.0
    for r in rows:
        cam = r._mapping["camera_id"]
        by_cam[cam] = by_cam.get(cam, 0) + 1
        total_over += r._mapping["overspeed_by"] or 0
    return {
        "total": len(rows),
        "by_camera": by_cam,
        "avg_overspeed": round(total_over / len(rows), 1),
    }


# ─── Speed Logs ───────────────────────────────────────────────────────────────

@router.get("/speed-logs", tags=["speed"])
async def list_speed_logs(
    camera_id: Optional[str] = Query(None),
    limit: int = Query(200, le=1000),
    db: AsyncSession = Depends(get_db),
):
    q = models.SpeedLog.__table__.select().order_by(
        models.SpeedLog.timestamp.desc()
    ).limit(limit)
    if camera_id:
        q = q.where(models.SpeedLog.camera_id == camera_id)
    result = await db.execute(q)
    return [dict(r._mapping) for r in result.fetchall()]


# ─── System Status ────────────────────────────────────────────────────────────

@router.get("/system/status", tags=["system"])
async def system_status():
    return {
        "cameras": camera_manager.status(),
        "mixer": stream_mixer.status(),
        "ts": time.time(),
    }


# ─── WebSocket ────────────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws, room="global")
    try:
        await ws_manager.send(ws, {"type": "welcome", "message": "Connected to SafeCity WS"})
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "subscribe_camera":
                cid = msg.get("camera_id")
                if cid:
                    await ws_manager.connect(ws, room=f"camera:{cid}")
                    await ws_manager.send(ws, {"type": "subscribed", "camera_id": cid})
    except WebSocketDisconnect:
        ws_manager.disconnect(ws, room="global")
    except Exception as e:
        logger.warning(f"[WS] Error: {e}")
        ws_manager.disconnect(ws, room="global")
