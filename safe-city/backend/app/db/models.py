from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import uuid
import enum


def gen_uuid():
    return str(uuid.uuid4())


class ZoneType(str, enum.Enum):
    URBAN = "urban"
    SCHOOL = "school"
    HIGHWAY = "highway"
    RESIDENTIAL = "residential"


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    location = Column(String(200))
    rtsp_url = Column(String(500), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    zone_type = Column(Enum(ZoneType), default=ZoneType.URBAN)
    speed_limit = Column(Float, default=60.0)
    is_active = Column(Boolean, default=True)
    calibration_file = Column(String(300))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    violations = relationship("Violation", back_populates="camera")
    speed_logs = relationship("SpeedLog", back_populates="camera")


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True, default=gen_uuid)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    track_id = Column(Integer, nullable=False)
    vehicle_class = Column(String(50))
    detected_speed = Column(Float, nullable=False)
    speed_limit = Column(Float, nullable=False)
    overspeed_by = Column(Float)
    snapshot_path = Column(String(500))
    snapshot_url = Column(String(500))
    license_plate = Column(String(20))
    confidence = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)
    frame_number = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    reviewed = Column(Boolean, default=False)
    challan_issued = Column(Boolean, default=False)
    meta = Column(JSON)

    camera = relationship("Camera", back_populates="violations")


class SpeedLog(Base):
    __tablename__ = "speed_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    track_id = Column(Integer, nullable=False)
    vehicle_class = Column(String(50))
    speed = Column(Float)
    frame_number = Column(Integer)
    centroid_x = Column(Float)
    centroid_y = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    camera = relationship("Camera", back_populates="speed_logs")


class CalibrationPoint(Base):
    __tablename__ = "calibration_points"

    id = Column(String, primary_key=True, default=gen_uuid)
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    pixel_points = Column(JSON, nullable=False)
    world_points = Column(JSON, nullable=False)
    homography_matrix = Column(JSON)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    violation_id = Column(String, ForeignKey("violations.id"))
    camera_id = Column(String, nullable=False)
    alert_type = Column(String(50))
    message = Column(Text)
    severity = Column(String(20), default="high")
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
