"""
WILDTRACK Ingest Pipeline
==========================
Processes WILDTRACK frames into:
  - Segments (5-second windows)
  - Thumbnails (saved to /data/thumbnails/)
  - CLIP embeddings (stored in Postgres via pgvector)
  - Entities + sightings (from annotation tracks)
  - Ground plane positions (from calibration)

Run after downloading WILDTRACK:
  python -m scripts.ingest_wildtrack

Requirements:
  pip install open_clip_torch torch Pillow tqdm opencv-python-headless
"""
import asyncio
import json
import os
import uuid
import sys
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DATA_DIR = Path(__file__).parent.parent.parent / "data"
WILDTRACK_DIR = DATA_DIR / "wildtrack"
THUMBNAILS_DIR = DATA_DIR / "thumbnails"
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

# WILDTRACK: 25 FPS, frames every 10th frame (approximately 2.5 FPS effective)
FRAME_RATE = 2.5
SEGMENT_SECONDS = 5
FRAMES_PER_SEGMENT = int(FRAME_RATE * SEGMENT_SECONDS)  # ~12 frames per segment
BASE_TIME = datetime(2024, 1, 15, 9, 0, 0)  # Synthetic start time

CAMERA_NAMES = {
    "C1": "Entrance North",
    "C2": "Entrance South",
    "C3": "Plaza West",
    "C4": "Plaza Center",
    "C5": "Plaza East",
    "C6": "Exit Northwest",
    "C7": "Exit Northeast",
}

async def load_annotations():
    """Load all annotation JSON files. Returns dict: frame_idx -> list of person annotations."""
    ann_dir = WILDTRACK_DIR / "annotations_positions"
    annotations = {}
    for f in sorted(ann_dir.glob("*.json")):
        frame_idx = int(f.stem)
        with open(f) as fp:
            annotations[frame_idx] = json.load(fp)
    return annotations

def frame_to_time(frame_idx: int) -> datetime:
    """Convert WILDTRACK frame index to a synthetic datetime."""
    seconds = frame_idx / FRAME_RATE
    return BASE_TIME + timedelta(seconds=seconds)

async def get_or_create_entity(db, person_id: int, entity_map: dict):
    """Get or create an Entity row for a WILDTRACK person ID."""
    from app.db.models import Entity
    if person_id not in entity_map:
        entity = Entity(
            id=str(uuid.uuid4()),
            type="person",
            primary_thumbnail_url="",
            attributes={"wildtrack_id": str(person_id)},
        )
        db.add(entity)
        await db.flush()
        entity_map[person_id] = entity.id
    return entity_map[person_id]

async def embed_frames(frame_paths: list[Path]) -> list[float] | None:
    """Compute average CLIP embedding for a list of frame paths."""
    try:
        import open_clip
        import torch
        from PIL import Image

        model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
        model.eval()

        embeddings = []
        for fp in frame_paths[:3]:  # Use up to 3 keyframes
            if not fp.exists():
                continue
            img = Image.open(fp).convert("RGB")
            tensor = preprocess(img).unsqueeze(0)
            with torch.no_grad():
                feat = model.encode_image(tensor)
                feat = feat / feat.norm(dim=-1, keepdim=True)
            embeddings.append(feat[0].numpy())

        if not embeddings:
            return None
        avg = np.mean(embeddings, axis=0)
        avg = avg / np.linalg.norm(avg)
        return avg.tolist()
    except ImportError:
        print("  open_clip not installed -- skipping embeddings (install: pip install open_clip_torch torch)")
        return None

async def save_thumbnail(frame_path: Path, segment_id: str) -> str:
    """Save a thumbnail and return its URL path."""
    try:
        from PIL import Image
        img = Image.open(frame_path).convert("RGB")
        img.thumbnail((320, 240))
        out_path = THUMBNAILS_DIR / f"{segment_id}.jpg"
        img.save(out_path, "JPEG", quality=75)
        return f"/media/thumbnails/{segment_id}.jpg"
    except Exception as e:
        print(f"  Could not save thumbnail: {e}")
        return ""

async def main():
    from app.db.database import AsyncSessionLocal, init_db
    from app.db.models import Camera, CameraGroup, Segment, Entity, Sighting, EntityCandidate
    from sqlalchemy import select

    print("Starting WILDTRACK ingest...")

    # Check dataset exists
    if not WILDTRACK_DIR.exists():
        print(f"WILDTRACK not found at {WILDTRACK_DIR}")
        print("   Run: python -m scripts.download_wildtrack")
        return



    print("Loading annotations...")
    annotations = await load_annotations()
    all_frame_indices = sorted(annotations.keys())
    print(f"   Found {len(all_frame_indices)} annotated frames")

    async with AsyncSessionLocal() as db:
        # Get cameras from DB (seeded at startup)
        result = await db.execute(select(Camera).order_by(Camera.name))
        db_cameras = result.scalars().all()

        # Map WILDTRACK C1-C7 to DB cameras
        # We use the first 7 cameras in the DB, or create new ones
        wildtrack_cam_map = {}  # "C1" -> Camera

        result = await db.execute(select(CameraGroup).where(CameraGroup.name == "WILDTRACK"))
        wt_group = result.scalar_one_or_none()
        if not wt_group:
            wt_group = CameraGroup(id=str(uuid.uuid4()), name="WILDTRACK")
            db.add(wt_group)
            await db.flush()

        for cam_key, cam_name in CAMERA_NAMES.items():
            result = await db.execute(select(Camera).where(Camera.name == cam_name))
            cam = result.scalar_one_or_none()
            if not cam:
                cam = Camera(
                    id=str(uuid.uuid4()),
                    name=cam_name,
                    group_id=wt_group.id,
                    location_label=f"WILDTRACK {cam_key}",
                    status="online",
                    stream_url="",
                )
                db.add(cam)
                await db.flush()
            wildtrack_cam_map[cam_key] = cam

        await db.commit()

        print(f"Cameras ready: {list(wildtrack_cam_map.keys())}")

        # Process segments
        entity_map = {}  # wildtrack person_id -> entity UUID
        total_segments = 0

        # Group frame indices into segments
        segment_groups = []
        for i in range(0, len(all_frame_indices), FRAMES_PER_SEGMENT):
            segment_groups.append(all_frame_indices[i:i + FRAMES_PER_SEGMENT])

        print(f"Processing {len(segment_groups)} segments per camera...")

        for cam_key, cam in wildtrack_cam_map.items():
            print(f"  Camera {cam_key}...")
            images_dir = WILDTRACK_DIR / "Image_subsets" / cam_key

            if not images_dir.exists():
                print(f"    Images dir not found: {images_dir}")
                continue

            for seg_frames in segment_groups:
                if not seg_frames:
                    continue

                start_time = frame_to_time(seg_frames[0])
                end_time = frame_to_time(seg_frames[-1])

                # Get frame paths for this segment
                frame_paths = []
                for fi in seg_frames:
                    fp = images_dir / f"{fi:08d}.png"
                    if fp.exists():
                        frame_paths.append(fp)

                if not frame_paths:
                    continue

                # Gather detected persons in this segment
                persons_in_segment = set()
                all_objects = []
                for fi in seg_frames:
                    for ann in annotations.get(fi, []):
                        pid = ann.get("personID", -1)
                        persons_in_segment.add(pid)
                        # Use positionID bbox if available, else default
                        views = ann.get("views", [])
                        for view in views:
                            if view.get("viewNum", -1) == int(cam_key[1]) - 1:
                                xmin = view.get("xmin", 0)
                                ymin = view.get("ymin", 0)
                                xmax = view.get("xmax", 100)
                                ymax = view.get("ymax", 200)
                                all_objects.append({
                                    "type": "person",
                                    "bbox": [xmin, ymin, xmax - xmin, ymax - ymin],
                                    "colorHints": [],
                                })

                # Confidence based on number of detections
                confidence = min(0.95, 0.5 + 0.1 * len(persons_in_segment))
                tags = ["person"] + (["group"] if len(persons_in_segment) > 2 else ["walking"])

                seg_id = str(uuid.uuid4())

                # Thumbnail from first frame
                thumbnail_url = await save_thumbnail(frame_paths[0], seg_id)

                # CLIP embedding (may be None if open_clip not installed)
                embedding = await embed_frames(frame_paths)

                seg = Segment(
                    id=seg_id,
                    camera_id=cam.id,
                    start_time=start_time,
                    end_time=end_time,
                    thumbnail_url=thumbnail_url,
                    confidence=confidence,
                    tags=tags,
                    objects=all_objects[:5],  # cap at 5 objects
                    embedding=embedding,
                )
                db.add(seg)
                await db.flush()

                # Create entities + sightings for each person in this segment
                for pid in list(persons_in_segment)[:3]:  # cap at 3 per segment
                    entity_id = await get_or_create_entity(db, pid, entity_map)

                    # Entity candidate
                    candidate = EntityCandidate(
                        id=str(uuid.uuid4()),
                        segment_id=seg_id,
                        entity_id=entity_id,
                        score=round(confidence * 0.9, 2),
                    )
                    db.add(candidate)

                    # Sighting
                    sighting = Sighting(
                        id=str(uuid.uuid4()),
                        entity_id=entity_id,
                        camera_id=cam.id,
                        segment_id=seg_id,
                        time=start_time,
                    )
                    db.add(sighting)

                total_segments += 1
                if total_segments % 20 == 0:
                    await db.commit()
                    print(f"    ... {total_segments} segments committed")

        await db.commit()
        print(f"\nIngest complete: {total_segments} segments, {len(entity_map)} entities")
        print(f"   Thumbnails saved to: {THUMBNAILS_DIR}")

if __name__ == "__main__":
    asyncio.run(main())
