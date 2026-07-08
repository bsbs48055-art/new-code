from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "SafeCity Speed Detection"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://safecity:safecity123@db:5432/safecity"
    DATABASE_URL_SYNC: str = "postgresql://safecity:safecity123@db:5432/safecity"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Storage
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "violations"
    MINIO_SECURE: bool = False

    # YOLO Model
    YOLO_MODEL: str = "yolov8n.pt"
    YOLO_CONFIDENCE: float = 0.45
    YOLO_DEVICE: str = "cpu"  # "cuda" for GPU

    # Vehicle class IDs in COCO dataset
    VEHICLE_CLASS_IDS: List[int] = [2, 3, 5, 7]  # car, motorcycle, bus, truck
    VEHICLE_CLASS_NAMES: List[str] = ["car", "motorcycle", "bus", "truck"]

    # Speed thresholds (km/h) per zone type
    DEFAULT_SPEED_LIMIT: float = 60.0
    SCHOOL_ZONE_LIMIT: float = 25.0
    HIGHWAY_LIMIT: float = 120.0

    # Violation confidence: require N frames over limit before alerting
    VIOLATION_FRAME_THRESHOLD: int = 5
    SPEED_SMOOTHING_FRAMES: int = 10

    # Frame processing
    PROCESS_EVERY_N_FRAMES: int = 2
    MAX_STREAM_FPS: int = 25

    # Calibration data directory
    CALIBRATION_DIR: str = "/app/data/calibrations"
    SNAPSHOT_DIR: str = "/app/data/snapshots"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "*"]

    # Auth
    SECRET_KEY: str = "supersecretkey-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Mixer
    MIXER_GRID_COLS: int = 3
    MIXER_FRAME_WIDTH: int = 640
    MIXER_FRAME_HEIGHT: int = 360

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
