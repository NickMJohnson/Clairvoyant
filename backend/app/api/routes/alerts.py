from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models import Alert, User
from app.db.schemas import AlertCreate, AlertUpdate, AlertOut
from app.api.deps import get_current_user
import uuid

router = APIRouter(prefix="/alerts", tags=["alerts"])

def alert_to_out(a: Alert) -> AlertOut:
    return AlertOut(
        id=a.id,
        name=a.name,
        query=a.query,
        cameras=a.cameras or [],
        timeWindow=a.time_window,
        notificationChannel=a.notification_channel,
        active=a.active,
        createdAt=a.created_at.isoformat() + "Z",
        lastTriggered=a.last_triggered.isoformat() + "Z" if a.last_triggered else None,
    )

@router.get("", response_model=list[AlertOut])
async def list_alerts(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Alert).where(Alert.user_id == user.id).order_by(Alert.created_at.desc())
    )
    return [alert_to_out(a) for a in result.scalars().all()]

@router.post("", response_model=AlertOut)
async def create_alert(
    body: AlertCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    alert = Alert(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=body.name,
        query=body.query,
        cameras=body.cameras,
        time_window=body.timeWindow,
        notification_channel=body.notificationChannel,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert_to_out(alert)

@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: str,
    body: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if body.active is not None:
        alert.active = body.active
    await db.commit()
    await db.refresh(alert)
    return alert_to_out(alert)

@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()
