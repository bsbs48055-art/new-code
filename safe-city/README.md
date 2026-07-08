# SafeCity — Real-Time Vehicle Speed Detection System

A production-grade, modular system for detecting over-speeding vehicles using existing Safe City traffic cameras.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SAFE CITY CAMERAS                            │
│   RTSP/ONVIF IP Cameras (cam-001, cam-002, cam-003, …)             │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ RTSP stream
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND  (FastAPI / Python)                       │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Module A       │  │ Module B         │  │ Module C           │  │
│  │ Camera         │→ │ YOLOv8 Vehicle   │→ │ IoU/ByteTrack      │  │
│  │ Ingestion      │  │ Detection        │  │ Multi-Object Track │  │
│  │ (reconnect)    │  │ (6 classes)      │  │ (persistent IDs)   │  │
│  └────────────────┘  └──────────────────┘  └─────────┬──────────┘  │
│                                                       │             │
│  ┌────────────────┐  ┌──────────────────┐            │             │
│  │ Module D       │← │ Calibration      │            │             │
│  │ Speed Calc     │  │ (Homography)     │←───────────┘             │
│  │ (km/h, smooth) │  │ per camera       │                          │
│  └───────┬────────┘  └──────────────────┘                          │
│          │                                                          │
│  ┌───────▼────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Module E       │  │ STREAM MIXER     │  │ WebSocket Hub      │  │
│  │ Violation      │  │ (the mixing      │  │ Real-time alerts   │  │
│  │ Logger         │→ │  thing)          │  │ to dashboard       │  │
│  │ snapshot+DB    │  │ Mosaic + PiP     │  │                    │  │
│  └────────────────┘  │ Heatmap overlay  │  └────────────────────┘  │
│                      │ OSD + borders    │                          │
│                      └──────────────────┘                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP / WebSocket / MJPEG
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React + Vite)                          │
│                                                                     │
│  Dashboard │ Live Map │ Stream Mixer │ Violation Log │ Analytics    │
└─────────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         PostgreSQL          Redis            MinIO
       (TimescaleDB)    (message queue)  (snapshot storage)
```

---

## Modules

| Module | File | Purpose |
|--------|------|---------|
| A — Camera Ingestion | `backend/app/camera/ingestion.py` | RTSP connection with auto-reconnect, frame buffering |
| B — Vehicle Detection | `backend/app/detection/detector.py` | YOLOv8 (car/motorcycle/bus/truck/rickshaw) |
| C — Tracking | `backend/app/tracking/tracker.py` | IoU-based multi-object tracker (drop-in swap with ByteTrack/SORT) |
| D — Speed Calculation | `backend/app/speed/calculator.py` | Homography + centroid tracking → km/h with smoothing |
| D — Calibration | `backend/app/speed/calibration.py` | Per-camera homography calibration store |
| E — Violation Logging | `backend/app/violations/logger.py` | N-frame threshold check, snapshot crop, async alert |
| **MIXER** | `backend/app/mixer/stream_mixer.py` | **Multi-stream mosaic compositor with heatmap overlay, PiP mode, violation flash, MJPEG output** |
| API | `backend/app/api/routes.py` | REST + WebSocket + MJPEG endpoints |

---

## The Stream Mixer (the "mixing thing")

The stream mixer composites **all active camera feeds** into a single video mosaic in real time.

**Features:**
- **Grid mode** — auto-layout N cameras in a configurable column grid
- **PiP (Picture-in-Picture) mode** — one camera enlarged as main, others as thumbnails
- **Per-cell OSD** — camera name, location, FPS counter, vehicle count, max speed badge
- **Violation flash** — border pulses red when an over-speed event is detected on that camera
- **Speed heatmap overlay** — colour-coded heat accumulates where fast vehicles appear
- **Live indicator dot** — green = connected, grey = offline
- **MJPEG stream** — browser-consumable at `/api/v1/mixer/stream.mjpeg`
- **Snapshot** — `/api/v1/mixer/snapshot` returns a JPEG of the current mosaic
- **Async broadcast** — asyncio queues deliver frames to all WebSocket/MJPEG subscribers simultaneously

---

## Quick Start

### With Docker Compose (recommended)

```bash
# Clone the repo and enter the safe-city directory
cd safe-city

# Build and start all services
docker compose up --build

# Backend API:   http://localhost:8000/api/docs
# Dashboard:     http://localhost:3000
# MinIO console: http://localhost:9001  (user: minioadmin / minioadmin)
```

### Development (no Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Set env vars or create .env file
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## Camera Calibration

Calibration maps pixel coordinates to real-world metres, enabling accurate speed measurement.

```bash
# Grab a frame from a live camera and calibrate
python calibration_tool.py --camera rtsp://user:pass@192.168.1.100/stream --id cam-001

# Or calibrate from a saved image
python calibration_tool.py --image /path/to/frame.jpg --id cam-001
```

**Interactive steps:**
1. Click on 4+ known ground points in the frame (lane markings, road edges, measured distances)
2. Enter the real-world X, Y coordinates (in metres) for each point
3. Press `h` to verify the projected metric grid looks correct
4. Press `s` or Enter to save — output goes to `data/calibrations/cam-001.json`

> **Accuracy tip:** Use physical measurements from Google Maps or a measuring wheel. Calibrate against a vehicle driven at a known GPS-tracked speed to validate.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cameras` | GET/POST | List / create cameras |
| `/api/v1/cameras/{id}/snapshot` | GET | JPEG snapshot from camera |
| `/api/v1/cameras/{id}/stream.mjpeg` | GET | MJPEG live stream (single camera) |
| `/api/v1/mixer/stream.mjpeg` | GET | **MJPEG live mosaic** (all cameras mixed) |
| `/api/v1/mixer/snapshot` | GET | JPEG snapshot of the mosaic |
| `/api/v1/mixer/status` | GET | Per-cell stats (FPS, speeds, violations) |
| `/api/v1/mixer/pip` | POST | Set PiP focus camera (or null for grid) |
| `/api/v1/calibration` | POST | Upload calibration for a camera |
| `/api/v1/violations` | GET | Paginated violation log |
| `/api/v1/violations/stats` | GET | Aggregated stats |
| `/api/v1/ws` | WS | Real-time violation alerts + speed updates |
| `/api/v1/system/status` | GET | Camera + mixer health |

---

## Scaling to Many Cameras

- Each camera runs its own processing thread (`CameraStream._capture_loop`)
- One crash doesn't affect other cameras
- Add a Kafka topic per camera for large deployments
- For GPU acceleration: set `YOLO_DEVICE=cuda` in env and uncomment GPU block in `docker-compose.yml`
- For edge processing: deploy the backend + detection stack on Jetson Nano/Xavier at each camera site; only send metadata + violation clips to central server

---

## Important Considerations

1. **Calibration accuracy is everything** — validate with a test vehicle at known GPS speed
2. **Lighting & weather** — consider IR cameras; log YOLO confidence scores; flag uncertain readings for human review
3. **False positive protection** — violations require `VIOLATION_FRAME_THRESHOLD` (default 5) consecutive frames to trigger
4. **Legal compliance** — check local traffic law on automated fine issuance and data retention periods
5. **Audit trail** — violation records include timestamp, camera ID, speed, snapshot, and track ID
6. **Privacy** — snapshots and video are stored locally (MinIO); no external cloud by default

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://safecity:safecity123@db/safecity` | Async DB URL |
| `REDIS_URL` | `redis://redis:6379/0` | Redis for message queuing |
| `YOLO_MODEL` | `yolov8n.pt` | YOLO weights (`yolov8s.pt` for better accuracy) |
| `YOLO_CONFIDENCE` | `0.45` | Detection confidence threshold |
| `YOLO_DEVICE` | `cpu` | `cpu` or `cuda` |
| `DEFAULT_SPEED_LIMIT` | `60.0` | Default speed limit km/h |
| `VIOLATION_FRAME_THRESHOLD` | `5` | Frames above limit before alert |
| `MIXER_GRID_COLS` | `3` | Columns in mosaic grid |
| `MIXER_FRAME_WIDTH` | `640` | Per-cell width in mosaic |
