from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_db
from app.db.models import SavedSearch, User
from app.db.schemas import SavedSearchCreate, SavedSearchOut
from app.api.deps import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/saved-searches", tags=["saved-searches"])

def ss_to_out(ss: SavedSearch) -> SavedSearchOut:
    return SavedSearchOut(
        id=ss.id,
        name=ss.name,
        query=ss.query,
        filters=ss.filters or {},
        createdAt=ss.created_at.isoformat() + "Z",
        resultCount=ss.result_count,
    )

@router.get("", response_model=list[SavedSearchOut])
async def list_saved_searches(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SavedSearch).where(SavedSearch.user_id == user.id).order_by(SavedSearch.created_at.desc())
    )
    return [ss_to_out(ss) for ss in result.scalars().all()]

@router.post("", response_model=SavedSearchOut)
async def create_saved_search(
    body: SavedSearchCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ss = SavedSearch(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=body.name,
        query=body.query,
        filters=body.filters,
        result_count=body.resultCount,
    )
    db.add(ss)
    await db.commit()
    await db.refresh(ss)
    return ss_to_out(ss)

@router.delete("/{search_id}", status_code=204)
async def delete_saved_search(
    search_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SavedSearch).where(SavedSearch.id == search_id, SavedSearch.user_id == user.id)
    )
    ss = result.scalar_one_or_none()
    if not ss:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(ss)
    await db.commit()
