from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    name: str
    email: str

class LoginResponse(BaseModel):
    token: str
    user: UserOut

# Camera
class CameraOut(BaseModel):
    id: str
    name: str
    groupId: str | None
    locationLabel: str
    status: str
    streamUrl: str

    class Config:
        from_attributes = True

class CameraGroupOut(BaseModel):
    id: str
    name: str
    cameras: list[CameraOut]

    class Config:
        from_attributes = True

# Search
class DetectedObject(BaseModel):
    type: str
    bbox: list[float]
    colorHints: list[str] = []
    detectionId: str = ""
    relevanceScore: float = 0.0

class EntityCandidateOut(BaseModel):
    entityId: str
    score: float

class SegmentResult(BaseModel):
    id: str
    cameraId: str
    cameraName: str
    startTime: str
    endTime: str
    confidence: float
    thumbnailUrl: str
    videoUrl: str = ""
    tags: list[str]
    objects: list[DetectedObject]
    entityCandidates: list[EntityCandidateOut] = []

class SearchFilters(BaseModel):
    query: str = ""
    objectType: str = "all"
    cameraIds: list[str] = []
    cameraGroupId: str | None = None
    confidenceMin: float = 0.0
    startDate: str | None = None
    endDate: str | None = None
    sortBy: str = "time"
    sortOrder: str = "desc"

# Entity
class SightingOut(BaseModel):
    cameraId: str
    cameraName: str
    time: str
    segmentId: str

class EntityOut(BaseModel):
    id: str
    type: str
    primaryThumbnailUrl: str
    attributes: dict
    sightings: list[SightingOut]

# Saved Search
class SavedSearchCreate(BaseModel):
    name: str
    query: str
    filters: dict = {}
    resultCount: int = 0

class SavedSearchOut(BaseModel):
    id: str
    name: str
    query: str
    filters: dict
    createdAt: str
    resultCount: int

# Alert
class AlertCreate(BaseModel):
    name: str
    query: str
    cameras: list[str] = []
    timeWindow: str = "24/7"
    notificationChannel: str = "email"

class AlertUpdate(BaseModel):
    active: bool | None = None

class AlertOut(BaseModel):
    id: str
    name: str
    query: str
    cameras: list[str]
    timeWindow: str
    notificationChannel: str
    active: bool
    createdAt: str
    lastTriggered: str | None = None
