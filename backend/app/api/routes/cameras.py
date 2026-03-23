from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.db.models import Camera, CameraGroup, User
from app.db.schemas import CameraOut, CameraGroupOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/cameras", tags=["cameras"])

def camera_to_out(c: Camera) -> CameraOut:
    return CameraOut(
        id=c.id,
        name=c.name,
        groupId=c.group_id,
        locationLabel=c.location_label,
        status=c.status,
        streamUrl=c.stream_url,
    )

@router.get("", response_model=list[CameraOut])
async def list_cameras(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Camera))
    return [camera_to_out(c) for c in result.scalars().all()]

@router.get("/groups", response_model=list[CameraGroupOut])
async def list_camera_groups(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(CameraGroup).options(selectinload(CameraGroup.cameras)))
    groups = result.scalars().all()
    return [
        CameraGroupOut(
            id=g.id,
            name=g.name,
            cameras=[camera_to_out(c) for c in g.cameras],
        )
        for g in groups
    ]

@router.get("/{camera_id}", response_model=CameraOut)
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()
    if not camera:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera_to_out(camera)
