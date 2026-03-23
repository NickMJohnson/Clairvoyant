from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.models import Entity, Sighting, User
from app.db.schemas import EntityOut, SightingOut
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
