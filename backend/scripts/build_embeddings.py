"""
Build CLIP embeddings for segments that don't have them yet.
Works with both local thumbnail files and absolute R2/HTTP URLs.

Run after ingest:
  pip install open_clip_torch torch
  python -m scripts.build_embeddings

Against Railway DB:
  DATABASE_URL=postgresql+asyncpg://... python -m scripts.build_embeddings
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


def _resolve_thumbnail(thumbnail_url: str, segment_id: str) -> str | None:
    """
    Return a local file path to the thumbnail.
    For R2/HTTP URLs: derive the filename from the URL basename and look it up
    in DATA_DIR/thumbnails/ (where ingest_wildtrack.py wrote them locally).
    Returns None if the file can't be found.
    """
    if not thumbnail_url:
        return None

    if thumbnail_url.startswith("http"):
        # Extract filename from URL and look in local thumbnails dir
        filename = thumbnail_url.rsplit("/", 1)[-1]
        local_path = str(DATA_DIR / "thumbnails" / filename)
        if os.path.exists(local_path):
            return local_path
        # Fallback: try segment_id.jpg directly
        local_path = str(DATA_DIR / "thumbnails" / f"{segment_id}.jpg")
        if os.path.exists(local_path):
            return local_path
        print(f"  Warning: no local thumbnail for {thumbnail_url}")
        return None

    # Relative /media/... path — resolve against DATA_DIR
    relative = thumbnail_url.replace("/media/", "")
    local_path = str(DATA_DIR / relative)
    return local_path if os.path.exists(local_path) else None


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Segment).where(Segment.embedding.is_(None)).where(Segment.thumbnail_url != "")
        )
        segments = result.scalars().all()
        print(f"Found {len(segments)} segments without embeddings")

        updated = 0
        skipped = 0
        for seg in tqdm(segments):
            try:
                img_path = _resolve_thumbnail(seg.thumbnail_url, seg.id)
                if img_path is None:
                    skipped += 1
                    continue

                emb = await get_image_embedding(img_path)
                if emb:
                    seg.embedding = emb
                    updated += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"  Error on segment {seg.id}: {e}")
                skipped += 1

        await db.commit()
        print(f"Updated {updated} segment embeddings, skipped {skipped}")


if __name__ == "__main__":
    asyncio.run(main())
