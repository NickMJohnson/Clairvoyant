from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.models import Entity, Sighting, Segment, ObjectDetection, User
from app.db.schemas import EntityOut, SightingOut, SegmentResult
from app.api.deps import get_current_user

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("/{entity_id}", response_model=EntityOut)
async def get_entity(
    entity_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Entity)
        .where(Entity.id == entity_id)
        .options(selectinload(Entity.sightings).selectinload(Sighting.camera))
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    sightings = [
        SightingOut(
            cameraId=s.camera_id,
            cameraName=s.camera.name,
            time=s.time.isoformat() + "Z",
            segmentId=s.segment_id,
        )
        for s in entity.sightings
    ]

    return EntityOut(
        id=entity.id,
        type=entity.type,
        primaryThumbnailUrl=entity.primary_thumbnail_url,
        attributes=entity.attributes or {},
        sightings=sightings,
    )


@router.get("/{entity_id}/segments", response_model=list[SegmentResult])
async def get_entity_segments(
    entity_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return the full SegmentResult for every sighting of this entity."""
    # Get all sighting segment IDs for this entity
    sighting_result = await db.execute(
        select(Sighting.segment_id).where(Sighting.entity_id == entity_id)
    )
    segment_ids = [row[0] for row in sighting_result.all()]

    if not segment_ids:
        return []

    # Fetch segments with camera + entity_candidates
    seg_result = await db.execute(
        select(Segment)
        .options(
            selectinload(Segment.camera),
            selectinload(Segment.entity_candidates),
        )
        .where(Segment.id.in_(segment_ids))
        .order_by(Segment.start_time.asc())
    )
    segments = seg_result.scalars().all()

    # Fetch object detections for bbox data
    det_result = await db.execute(
        select(ObjectDetection).where(ObjectDetection.segment_id.in_(segment_ids))
    )
    all_detections = det_result.scalars().all()
    detections_map: dict[str, list] = {}
    for d in all_detections:
        detections_map.setdefault(d.segment_id, []).append(d)

    from app.api.routes.search import segment_to_result
    return [
        segment_to_result(seg, seg.camera, None, detections_map)
        for seg in segments
    ]
