"""
Build CLIP embeddings for segments that don't have them yet.
Run after ingest if open_clip wasn't installed:
  pip install open_clip_torch torch
  python -m scripts.build_embeddings
"""
import asyncio
import os
import sys
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.database import AsyncSessionLocal
from app.db.models import Segment
from app.services.embed_service import get_image_embedding
from sqlalchemy import select
from tqdm import tqdm

DATA_DIR = Path(__file__).parent.parent.parent / "data"

async def main():

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Segment).where(Segment.embedding.is_(None)).where(Segment.thumbnail_url != "")
        )
        segments = result.scalars().all()
        print(f"Found {len(segments)} segments without embeddings")

        updated = 0
        for seg in tqdm(segments):
            # Derive image path from thumbnail URL
            relative = seg.thumbnail_url.replace("/media/", "")
            img_path = str(DATA_DIR / relative)
            if not os.path.exists(img_path):
                continue
            emb = await get_image_embedding(img_path)
            if emb:
                seg.embedding = emb
                updated += 1

        await db.commit()
        print(f"Updated {updated} segment embeddings")

if __name__ == "__main__":
    asyncio.run(main())
