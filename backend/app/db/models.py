import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Boolean, JSON, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.db.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    saved_searches: Mapped[list["SavedSearch"]] = relationship(back_populates="user")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="user")

class CameraGroup(Base):
    __tablename__ = "camera_groups"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String)
    cameras: Mapped[list["Camera"]] = relationship(back_populates="group")

class Camera(Base):
    __tablename__ = "cameras"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String)
    group_id: Mapped[str | None] = mapped_column(String, ForeignKey("camera_groups.id"), nullable=True)
    location_label: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="online")  # online/offline/maintenance
    stream_url: Mapped[str] = mapped_column(String, default="")
    # WILDTRACK calibration data (optional)
    calibration: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    group: Mapped["CameraGroup | None"] = relationship(back_populates="cameras")
    segments: Mapped[list["Segment"]] = relationship(back_populates="camera")

class Segment(Base):
    __tablename__ = "segments"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    camera_id: Mapped[str] = mapped_column(String, ForeignKey("cameras.id"), index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    thumbnail_url: Mapped[str] = mapped_column(String, default="")
    video_url: Mapped[str] = mapped_column(String, default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    objects: Mapped[list] = mapped_column(JSON, default=list)
    # CLIP embedding (512-dim for ViT-B/32)
    embedding: Mapped[list | None] = mapped_column(Vector(512), nullable=True)

    camera: Mapped["Camera"] = relationship(back_populates="segments")
    entity_candidates: Mapped[list["EntityCandidate"]] = relationship(back_populates="segment")

class Entity(Base):
    __tablename__ = "entities"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    type: Mapped[str] = mapped_column(String)  # person / vehicle
    primary_thumbnail_url: Mapped[str] = mapped_column(String, default="")
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    # Averaged appearance embedding for ReID
    embedding: Mapped[list | None] = mapped_column(Vector(512), nullable=True)

    sightings: Mapped[list["Sighting"]] = relationship(back_populates="entity")
    candidates: Mapped[list["EntityCandidate"]] = relationship(back_populates="entity")

class Sighting(Base):
    __tablename__ = "sightings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    entity_id: Mapped[str] = mapped_column(String, ForeignKey("entities.id"), index=True)
    camera_id: Mapped[str] = mapped_column(String, ForeignKey("cameras.id"))
    segment_id: Mapped[str] = mapped_column(String, ForeignKey("segments.id"))
    time: Mapped[datetime] = mapped_column(DateTime)

    entity: Mapped["Entity"] = relationship(back_populates="sightings")
    camera: Mapped["Camera"] = relationship()
    segment: Mapped["Segment"] = relationship()

class EntityCandidate(Base):
    __tablename__ = "entity_candidates"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    segment_id: Mapped[str] = mapped_column(String, ForeignKey("segments.id"), index=True)
    entity_id: Mapped[str] = mapped_column(String, ForeignKey("entities.id"))
    score: Mapped[float] = mapped_column(Float)

    segment: Mapped["Segment"] = relationship(back_populates="entity_candidates")
    entity: Mapped["Entity"] = relationship(back_populates="candidates")

class SavedSearch(Base):
    __tablename__ = "saved_searches"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    query: Mapped[str] = mapped_column(String)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)
    result_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="saved_searches")

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    query: Mapped[str] = mapped_column(String)
    cameras: Mapped[list] = mapped_column(JSON, default=list)
    time_window: Mapped[str] = mapped_column(String, default="24/7")
    notification_channel: Mapped[str] = mapped_column(String, default="email")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_triggered: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="alerts")
