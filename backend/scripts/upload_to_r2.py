"""
Upload media files (thumbnails + clips) to Cloudflare R2.

Usage:
  R2_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx \
    python -m scripts.upload_to_r2
"""
import os
import sys
from pathlib import Path
import boto3
from botocore.config import Config
from tqdm import tqdm

DATA_DIR = Path(os.environ.get("DATA_DIR", str(Path(__file__).parent.parent.parent / "data")))
BUCKET = os.environ.get("R2_BUCKET", "clairvoyant-media")

def get_client():
    account_id = os.environ["R2_ACCOUNT_ID"]
    access_key = os.environ["R2_ACCESS_KEY_ID"]
    secret_key = os.environ["R2_SECRET_ACCESS_KEY"]
    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

def upload_dir(client, local_dir: Path, prefix: str):
    files = list(local_dir.glob("*"))
    print(f"Uploading {len(files)} files from {local_dir} → {prefix}/")
    for f in tqdm(files):
        if not f.is_file():
            continue
        content_type = "video/mp4" if f.suffix == ".mp4" else "image/jpeg"
        client.upload_file(
            str(f),
            BUCKET,
            f"{prefix}/{f.name}",
            ExtraArgs={"ContentType": content_type},
        )

if __name__ == "__main__":
    client = get_client()
    upload_dir(client, DATA_DIR / "thumbnails", "thumbnails")
    upload_dir(client, DATA_DIR / "clips", "clips")
    print("Done.")
