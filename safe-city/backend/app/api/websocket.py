"""
WebSocket hub for real-time alerts, speed updates, and system events.
"""
from __future__ import annotations
import asyncio
import json
import time
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger


class ConnectionManager:
    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}  # room → connections
        self._all: List[WebSocket] = []

    async def connect(self, ws: WebSocket, room: str = "global"):
        await ws.accept()
        self._all.append(ws)
        if room not in self._connections:
            self._connections[room] = []
        self._connections[room].append(ws)
        logger.info(f"[WS] Client connected to room='{room}'. Total: {len(self._all)}")

    def disconnect(self, ws: WebSocket, room: str = "global"):
        self._all.discard(ws) if isinstance(self._all, set) else (ws in self._all and self._all.remove(ws))
        if room in self._connections:
            conns = self._connections[room]
            if ws in conns:
                conns.remove(ws)
        logger.info(f"[WS] Client disconnected from room='{room}'. Total: {len(self._all)}")

    async def broadcast(self, message: dict, room: str = "global"):
        payload = json.dumps(message)
        targets = list(self._connections.get(room, []))
        dead = []
        for ws in targets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, room)

    async def broadcast_all(self, message: dict):
        payload = json.dumps(message)
        dead = []
        for ws in list(self._all):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self._all:
                self._all.remove(ws)

    async def send(self, ws: WebSocket, message: dict):
        try:
            await ws.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"[WS] Send error: {e}")


ws_manager = ConnectionManager()


async def send_violation_alert(event):
    """Called by violation_detector when a new violation is confirmed."""
    payload = {
        "type": "violation",
        "data": event.to_dict(),
        "ts": time.time(),
    }
    await ws_manager.broadcast_all(payload)


async def send_speed_update(camera_id: str, speeds: dict):
    payload = {
        "type": "speed_update",
        "camera_id": camera_id,
        "speeds": speeds,
        "ts": time.time(),
    }
    await ws_manager.broadcast(payload, room=f"camera:{camera_id}")
    await ws_manager.broadcast(payload, room="global")


async def send_camera_status(camera_id: str, status: str, message: str = ""):
    payload = {
        "type": "camera_status",
        "camera_id": camera_id,
        "status": status,
        "message": message,
        "ts": time.time(),
    }
    await ws_manager.broadcast_all(payload)
