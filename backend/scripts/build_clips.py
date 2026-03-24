"""
Build MP4 video clips from WILDTRACK frames for each segment.
Run after ingest:
  docker compose exec backend python -m scripts.build_clips

Requires ffmpeg (already installed in the Docker image).
"""
import asyncio
import os
import subprocess
import sys
import uuid
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DATA_DIR = Path("/data")
WILDTRACK_DIR = DATA_DIR / "wildtrack" / "Image_subsets"
CLIPS_DIR = DATA_DIR / "clips"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

FRAME_RATE = 2.5  # WILDTRACK effective FPS
BASE_FRAME = 0

from app.db.database import AsyncSessionLocal
from app.db.models import Segment, Camera
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from tqdm import tqdm


def frame_index_from_time(start_time, base_time, frame_rate=2.5):
    """Convert datetime back to approximate WILDTRACK frame index."""
    from datetime import datetime
    base = datetime(2024, 1, 15, 9, 0, 0)
    delta = (start_time - base).total_seconds()
    return max(0, int(delta * frame_rate))


def build_clip(camera_key: str, start_frame: int, end_frame: int, output_path: Path) -> bool:
    """Use ffmpeg to build an MP4 from a range of WILDTRACK frames."""
    images_dir = WILDTRACK_DIR / camera_key

    if not images_dir.exists():
        return False

    # Build a concat list of frames in this segment
    concat_file = output_path.with_suffix(".txt")
    lines = []
    for fi in range(start_frame, end_frame + 1, 10):  # every 10th frame = 1 frame per step
        fp = images_dir / f"{fi:08d}.png"
        if fp.exists():
            lines.append(f"file '{fp}'\nduration 0.4")  # ~2.5 FPS

    if not lines:
        return False

    concat_file.write_text("\n".join(lines))

    try:
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_file),
            "-vf", "scale=640:360",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(output_path)
        ], capture_output=True, check=True)
        concat_file.unlink(missing_ok=True)
        return True
    except subprocess.CalledProcessError:
        concat_file.unlink(missing_ok=True)
        return False


# Map camera names back to WILDTRACK keys
CAM_NAME_TO_KEY = {
    "Entrance North": "C1",
    "Entrance South": "C2",
    "Plaza West": "C3",
    "Plaza Center": "C4",
    "Plaza East": "C5",
    "Exit Northwest": "C6",
    "Exit Northeast": "C7",
}


async def main():


    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Segment)
            .options(selectinload(Segment.camera))
            .where(Segment.video_url == "")
        )
        segments = result.scalars().all()
        print(f"Building clips for {len(segments)} segments...")

        updated = 0
        for seg in tqdm(segments):
            cam_key = CAM_NAME_TO_KEY.get(seg.camera.name)
            if not cam_key:
                continue

            start_frame = frame_index_from_time(seg.start_time, None)
            end_frame = frame_index_from_time(seg.end_time, None)

            clip_path = CLIPS_DIR / f"{seg.id}.mp4"
            success = build_clip(cam_key, start_frame, end_frame, clip_path)

            if success:
                seg.video_url = f"/media/clips/{seg.id}.mp4"
                updated += 1

        await db.commit()
        print(f"✅ Built {updated} clips → /data/clips/")


if __name__ == "__main__":
    asyncio.run(main())
