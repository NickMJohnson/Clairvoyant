from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
import numpy as np
from app.db.database import get_db
from app.db.models import Segment, Camera, EntityCandidate, ObjectDetection, User
from app.db.schemas import SearchFilters, SegmentResult, DetectedObject, EntityCandidateOut
from app.api.deps import get_current_user
from app.services.embed_service import get_text_embedding

router = APIRouter(prefix="/search", tags=["search"])


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom > 0 else 0.0


def segment_to_result(
    seg: Segment,
    camera: Camera,
    detection_scores: dict[str, float] | None = None,
    detections_map: dict[str, list] | None = None,
) -> SegmentResult:
    # Prefer ObjectDetection rows (have embeddings) over raw JSON objects
    if detections_map and seg.id in detections_map:
        objects = [
            DetectedObject(
                type=d.type,
                bbox=d.bbox,
                colorHints=d.color_hints or [],
                detectionId=d.id,
                relevanceScore=round(detection_scores.get(d.id, 0.0), 3) if detection_scores else 0.0,
            )
            for d in detections_map[seg.id]
        ]
    else:
        objects = [
            DetectedObject(
                type=o.get("type", "person"),
                bbox=o.get("bbox", [0, 0, 100, 100]),
                colorHints=o.get("colorHints", []),
            )
            for o in (seg.objects or [])
        ]

    candidates = [
        EntityCandidateOut(entityId=ec.entity_id, score=ec.score)
        for ec in (seg.entity_candidates or [])
    ]
    return SegmentResult(
        id=seg.id,
        cameraId=seg.camera_id,
        cameraName=camera.name,
        startTime=seg.start_time.isoformat() + "Z",
        endTime=seg.end_time.isoformat() + "Z",
        confidence=seg.confidence,
        thumbnailUrl=seg.thumbnail_url,
        videoUrl=seg.video_url or "",
        tags=seg.tags or [],
        objects=objects,
        entityCandidates=candidates,
    )


@router.post("", response_model=list[SegmentResult])
async def search_segments(
    filters: SearchFilters,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = (
        select(Segment)
        .options(
            selectinload(Segment.camera),
            selectinload(Segment.entity_candidates),
        )
    )

    conditions = []

    if filters.cameraIds:
        conditions.append(Segment.camera_id.in_(filters.cameraIds))
    elif filters.cameraGroupId:
        cam_result = await db.execute(
            select(Camera.id).where(Camera.group_id == filters.cameraGroupId)
        )
        cam_ids = list(cam_result.scalars().all())
        if cam_ids:
            conditions.append(Segment.camera_id.in_(cam_ids))

    if filters.objectType and filters.objectType != "all":
        conditions.append(
            Segment.objects.cast(__import__('sqlalchemy').Text).contains(filters.objectType)
        )

    if filters.confidenceMin > 0:
        conditions.append(Segment.confidence >= filters.confidenceMin)

    if filters.startDate:
        try:
            start = datetime.fromisoformat(filters.startDate.replace("Z", ""))
            conditions.append(Segment.start_time >= start)
        except ValueError:
            pass
    if filters.endDate:
        try:
            end = datetime.fromisoformat(filters.endDate.replace("Z", ""))
            conditions.append(Segment.end_time <= end)
        except ValueError:
            pass

    if conditions:
        query = query.where(and_(*conditions))

    query_embedding = None
    if filters.query and filters.query.strip():
        query_embedding = await get_text_embedding(filters.query)
        if query_embedding is not None:
            query = query.where(Segment.embedding.isnot(None))
            query = query.order_by(Segment.embedding.cosine_distance(query_embedding))
        else:
            search_term = f"%{filters.query.lower()}%"
            query = query.where(
                Segment.tags.cast(__import__('sqlalchemy').Text).ilike(search_term)
            )
            query = query.order_by(
                Segment.start_time.desc() if filters.sortOrder == "desc" else Segment.start_time.asc()
            )
    else:
        if filters.sortBy == "confidence":
            query = query.order_by(
                Segment.confidence.desc() if filters.sortOrder == "desc" else Segment.confidence.asc()
            )
        else:
            query = query.order_by(
                Segment.start_time.desc() if filters.sortOrder == "desc" else Segment.start_time.asc()
            )

    query = query.limit(50)
    result = await db.execute(query)
    segments = result.scalars().all()

    if not segments:
        return []

    # Fetch ObjectDetection rows for these segments (for per-bbox grounding)
    seg_ids = [s.id for s in segments]
    det_result = await db.execute(
        select(ObjectDetection).where(ObjectDetection.segment_id.in_(seg_ids))
    )
    all_detections = det_result.scalars().all()

    # Group by segment
    detections_map: dict[str, list] = {}
    for d in all_detections:
        detections_map.setdefault(d.segment_id, []).append(d)

    # Score each detection against the query embedding
    detection_scores: dict[str, float] = {}
    if query_embedding and all_detections:
        for d in all_detections:
            if d.embedding is not None:
                detection_scores[d.id] = cosine_similarity(query_embedding, d.embedding)

    return [
        segment_to_result(seg, seg.camera, detection_scores, detections_map)
        for seg in segments
    ]
