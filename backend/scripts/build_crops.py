"""
Build per-detection crops and CLIP embeddings for query-level bounding box grounding.

For each segment's detected objects, this script:
  1. Crops the person/vehicle region from the thumbnail
  2. Computes a CLIP embedding for that crop
  3. Stores it in the object_detections table

After running this, searching "yellow backpack" or "blue jacket" will score each
bounding box in the result against the query and highlight the most relevant ones.

Run:
  docker compose exec backend python -m scripts.build_crops

Requires open_clip_torch:
  pip install open_clip_torch torch
"""
import asyncio
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DATA_DIR = Path("/data")
THUMBNAILS_DIR = DATA_DIR / "thumbnails"
CROPS_DIR = DATA_DIR / "crops"
CROPS_DIR.mkdir(parents=True, exist_ok=True)

# WILDTRACK original frame dimensions
ORIG_W, ORIG_H = 1920, 1080
THUMB_W, THUMB_H = 320, 180  # after thumbnail((320,240)) with 16:9 aspect


def scale_bbox(bbox: list, orig_w=ORIG_W, orig_h=ORIG_H, thumb_w=THUMB_W, thumb_h=THUMB_H):
    """Scale bbox from original frame coords to thumbnail coords."""
    sx = thumb_w / orig_w
    sy = thumb_h / orig_h
    x, y, w, h = bbox
    return [int(x * sx), int(y * sy), max(1, int(w * sx)), max(1, int(h * sy))]


async def main():
    from app.db.database import AsyncSessionLocal
    from app.db.models import Segment, ObjectDetection
    from app.services.embed_service import get_image_embedding
    from sqlalchemy import select, delete
    from tqdm import tqdm
    from PIL import Image

    async with AsyncSessionLocal() as db:
        # Clear existing detections so we can rebuild cleanly
        await db.execute(delete(ObjectDetection))
        await db.commit()

        result = await db.execute(
            select(Segment).where(Segment.thumbnail_url != "")
        )
        segments = result.scalars().all()
        print(f"Processing crops for {len(segments)} segments...")

        inserted = 0
        for seg in tqdm(segments):
            if not seg.objects:
                continue

            # Load thumbnail
            relative = seg.thumbnail_url.replace("/media/", "")
            thumb_path = DATA_DIR / relative
            if not thumb_path.exists():
                continue

            try:
                img = Image.open(thumb_path).convert("RGB")
                actual_w, actual_h = img.size
            except Exception:
                continue

            for obj in seg.objects:
                bbox = obj.get("bbox", [])
                if len(bbox) != 4:
                    continue

                # Scale bbox to actual thumbnail dimensions
                sx = actual_w / ORIG_W
                sy = actual_h / ORIG_H
                x = max(0, int(bbox[0] * sx))
                y = max(0, int(bbox[1] * sy))
                w = max(8, int(bbox[2] * sx))
                h = max(8, int(bbox[3] * sy))

                # Clamp to image bounds
                x2 = min(actual_w, x + w)
                y2 = min(actual_h, y + h)
                if x2 <= x or y2 <= y:
                    continue

                # Crop and save
                crop = img.crop((x, y, x2, y2))
                det_id = str(uuid.uuid4())
                crop_path = CROPS_DIR / f"{det_id}.jpg"
                crop.save(crop_path, "JPEG", quality=80)

                # CLIP embedding for this crop
                emb = await get_image_embedding(str(crop_path))

                detection = ObjectDetection(
                    id=det_id,
                    segment_id=seg.id,
                    type=obj.get("type", "person"),
                    bbox=bbox,
                    color_hints=obj.get("colorHints", []),
                    crop_url=f"/media/crops/{det_id}.jpg",
                    embedding=emb,
                )
                db.add(detection)
                inserted += 1

            if inserted % 50 == 0 and inserted > 0:
                await db.commit()

        await db.commit()
        print(f"✅ Built {inserted} detection crops → /data/crops/")
        if inserted == 0:
            print("⚠️  No crops built. Make sure open_clip_torch is installed and thumbnails exist.")


if __name__ == "__main__":
    asyncio.run(main())
