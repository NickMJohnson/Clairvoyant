"""
Build per-detection crops and CLIP embeddings for query-level bounding box grounding.

Crops from ORIGINAL high-res WILDTRACK frames (1920x1080) so CLIP has enough
detail to distinguish faces, clothing, and attributes.

Run:
  docker compose exec backend python -m scripts.build_crops
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DATA_DIR = Path("/data")
WILDTRACK_DIR = DATA_DIR / "wildtrack" / "Image_subsets"
CROPS_DIR = DATA_DIR / "crops"
CROPS_DIR.mkdir(parents=True, exist_ok=True)

ORIG_W, ORIG_H = 1920, 1080
BASE_TIME = datetime(2024, 1, 15, 9, 0, 0)
FRAME_RATE = 2.5

CAM_NAME_TO_KEY = {
    "Entrance North": "C1",
    "Entrance South": "C2",
    "Plaza West": "C3",
    "Plaza Center": "C4",
    "Plaza East": "C5",
    "Exit Northwest": "C6",
    "Exit Northeast": "C7",
}


def time_to_frame(dt: datetime) -> int:
    delta = (dt - BASE_TIME).total_seconds()
    return max(0, round(delta * FRAME_RATE) * 10)  # frames are every 10th index


def find_best_frame(cam_key: str, frame_idx: int) -> Path | None:
    """Find the closest available frame to the given index."""
    images_dir = WILDTRACK_DIR / cam_key
    if not images_dir.exists():
        return None
    # Try exact frame and nearby frames
    for offset in range(0, 50, 10):
        for candidate in [frame_idx + offset, frame_idx - offset]:
            if candidate < 0:
                continue
            p = images_dir / f"{candidate:08d}.png"
            if p.exists():
                return p
    return None


async def main():
    from app.db.database import AsyncSessionLocal
    from app.db.models import Segment, ObjectDetection
    from app.services.embed_service import get_image_embedding
    from sqlalchemy import select, delete
    from sqlalchemy.orm import selectinload
    from tqdm import tqdm
    from PIL import Image

    async with AsyncSessionLocal() as db:
        await db.execute(delete(ObjectDetection))
        await db.commit()

        result = await db.execute(
            select(Segment)
            .options(selectinload(Segment.camera))
            .where(Segment.objects.isnot(None))
        )
        segments = result.scalars().all()
        print(f"Processing crops for {len(segments)} segments...")

        inserted = 0
        skipped = 0

        for seg in tqdm(segments):
            if not seg.objects:
                continue

            cam_key = CAM_NAME_TO_KEY.get(seg.camera.name)

            # Try to load original high-res frame for this segment
            orig_frame = None
            if cam_key:
                frame_idx = time_to_frame(seg.start_time)
                orig_frame_path = find_best_frame(cam_key, frame_idx)
                if orig_frame_path:
                    try:
                        orig_frame = Image.open(orig_frame_path).convert("RGB")
                    except Exception:
                        orig_frame = None

            # Fall back to thumbnail if original frame not available
            if orig_frame is None:
                if not seg.thumbnail_url:
                    skipped += 1
                    continue
                relative = seg.thumbnail_url.replace("/media/", "")
                thumb_path = DATA_DIR / relative
                if not thumb_path.exists():
                    skipped += 1
                    continue
                try:
                    orig_frame = Image.open(thumb_path).convert("RGB")
                    # Scale bboxes are already in ORIG_W/H coords, so adjust
                    actual_w, actual_h = orig_frame.size
                except Exception:
                    skipped += 1
                    continue
                actual_w, actual_h = orig_frame.size
            else:
                actual_w, actual_h = ORIG_W, ORIG_H  # original frame is full res

            img_w, img_h = orig_frame.size

            for obj in seg.objects:
                bbox = obj.get("bbox", [])
                if len(bbox) != 4:
                    continue

                # Scale bbox from ORIG coords to actual image size
                sx = img_w / ORIG_W
                sy = img_h / ORIG_H
                x = max(0, int(bbox[0] * sx))
                y = max(0, int(bbox[1] * sy))
                w = max(8, int(bbox[2] * sx))
                h = max(8, int(bbox[3] * sy))

                x2 = min(img_w, x + w)
                y2 = min(img_h, y + h)
                if x2 <= x or y2 <= y:
                    continue

                # Crop and resize to 224x224 for CLIP
                crop = orig_frame.crop((x, y, x2, y2))
                crop = crop.resize((224, 224), Image.LANCZOS)

                det_id = str(uuid.uuid4())
                crop_path = CROPS_DIR / f"{det_id}.jpg"
                crop.save(crop_path, "JPEG", quality=90)

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
        print(f"✅ Built {inserted} crops from original frames ({skipped} skipped)")


if __name__ == "__main__":
    asyncio.run(main())
