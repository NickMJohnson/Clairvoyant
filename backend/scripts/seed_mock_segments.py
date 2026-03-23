"""
Seed the database with mock video segments so the search page shows results
without needing to run WILDTRACK ingest first.
Run: python -m scripts.seed_mock_segments (from backend/)
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.database import AsyncSessionLocal
from app.db.models import Segment, Camera, Entity, Sighting, EntityCandidate
from sqlalchemy import select

TAGS = [
    ["person", "walking"],
    ["person", "running", "backpack"],
    ["vehicle", "car", "parking"],
    ["person", "red shirt"],
    ["vehicle", "pickup truck"],
    ["person", "group"],
    ["person", "hat"],
    ["vehicle", "SUV"],
    ["person", "bicycle"],
    ["person", "bag"],
]

OBJECTS_PERSON = {"type": "person", "bbox": [100, 80, 60, 180], "colorHints": ["blue", "black"]}
OBJECTS_VEHICLE = {"type": "vehicle", "bbox": [50, 100, 200, 120], "colorHints": ["white", "silver"]}

async def main():

    async with AsyncSessionLocal() as db:
        # Get cameras
        result = await db.execute(select(Camera))
        cameras = result.scalars().all()
        if not cameras:
            print("No cameras found. Make sure the backend has started once to seed cameras.")
            return

        now = datetime.utcnow()

        # Create 2 demo entities
        entity1 = Entity(
            id=str(uuid.uuid4()),
            type="person",
            primary_thumbnail_url="",
            attributes={"clothing": "Blue jacket", "hair": "Short dark hair", "build": "Medium"},
        )
        entity2 = Entity(
            id=str(uuid.uuid4()),
            type="vehicle",
            primary_thumbnail_url="",
            attributes={"color": "White", "type": "Sedan", "make": "Unknown"},
        )
        db.add(entity1)
        db.add(entity2)
        await db.flush()

        # Create 30 segments spread across cameras and the past 24h
        for i in range(30):
            camera = random.choice(cameras)
            offset_minutes = random.randint(0, 60 * 24)
            start = now - timedelta(minutes=offset_minutes)
            end = start + timedelta(seconds=random.randint(5, 30))
            tags = random.choice(TAGS)
            is_vehicle = "vehicle" in tags
            objs = [OBJECTS_VEHICLE.copy() if is_vehicle else OBJECTS_PERSON.copy()]
            confidence = round(random.uniform(0.55, 0.98), 2)

            seg = Segment(
                id=str(uuid.uuid4()),
                camera_id=camera.id,
                start_time=start,
                end_time=end,
                thumbnail_url="",
                confidence=confidence,
                tags=tags,
                objects=objs,
            )
            db.add(seg)
            await db.flush()

            # Link to entity candidate
            entity = entity2 if is_vehicle else entity1
            candidate = EntityCandidate(
                id=str(uuid.uuid4()),
                segment_id=seg.id,
                entity_id=entity.id,
                score=round(confidence * random.uniform(0.8, 1.0), 2),
            )
            db.add(candidate)

            # Add sighting
            sighting = Sighting(
                id=str(uuid.uuid4()),
                entity_id=entity.id,
                camera_id=camera.id,
                segment_id=seg.id,
                time=start,
            )
            db.add(sighting)

        await db.commit()
        print("Seeded 30 mock segments, 2 entities.")

if __name__ == "__main__":
    asyncio.run(main())
