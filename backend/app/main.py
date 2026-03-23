from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.db.database import init_db
from app.api.router import api_router
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_data()
    yield

app = FastAPI(title="Clairvoyant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Serve thumbnails/video from /data
data_dir = settings.data_dir
if os.path.exists(data_dir):
    app.mount("/media", StaticFiles(directory=data_dir), name="media")

@app.get("/health")
async def health():
    return {"status": "ok"}

async def seed_demo_data():
    """Seed demo user + cameras if DB is empty."""
    from sqlalchemy import select, func
    from app.db.database import AsyncSessionLocal
    from app.db.models import User, CameraGroup, Camera
    from app.core.security import get_password_hash
    import uuid

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(func.count()).select_from(User))
        if result.scalar() > 0:
            return

        # Demo user
        user = User(
            id=str(uuid.uuid4()),
            email=settings.demo_email,
            name="Demo User",
            hashed_password=get_password_hash(settings.demo_password),
        )
        db.add(user)

        # Camera groups + cameras (matching frontend mock data structure)
        groups_data = [
            ("Main Entrance", [
                ("Entrance A", "Front Door", "online"),
                ("Entrance B", "Side Door", "online"),
            ]),
            ("Parking Lot", [
                ("Parking North", "North Lot", "online"),
                ("Parking South", "South Lot", "maintenance"),
            ]),
            ("Building Interior", [
                ("Lobby Camera", "Main Lobby", "online"),
                ("Hallway 1", "East Hallway", "online"),
                ("Elevator Bank", "Elevator Area", "offline"),
            ]),
            ("Perimeter", [
                ("Perimeter NE", "Northeast Corner", "online"),
                ("Perimeter NW", "Northwest Corner", "online"),
                ("Perimeter SE", "Southeast Corner", "online"),
            ]),
        ]

        for group_name, cameras in groups_data:
            group = CameraGroup(id=str(uuid.uuid4()), name=group_name)
            db.add(group)
            await db.flush()
            for cam_name, location, status in cameras:
                cam = Camera(
                    id=str(uuid.uuid4()),
                    name=cam_name,
                    group_id=group.id,
                    location_label=location,
                    status=status,
                    stream_url="",
                )
                db.add(cam)

        await db.commit()
        print("Demo data seeded.")
