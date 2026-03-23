"""
WILDTRACK Dataset Setup Helper
================================
WILDTRACK requires a brief registration form. Follow these steps:

1. Go to: https://www.epfl.ch/labs/cvlab/data/data-wildtrack/
2. Fill out the short form to get the download link
3. Download the dataset (~3GB) -- it contains:
   - Image frames for 7 synchronized cameras (C1-C7)
   - Annotations (person bounding boxes per frame)
   - Calibration files (camera intrinsics + extrinsics)
4. Extract to: /Users/mac/Desktop/projects/clairvoyant/data/wildtrack/

Expected folder structure after extraction:
  data/wildtrack/
    Image_subsets/
      C1/  (2000 frames: 00000000.png ... 00001990.png)
      C2/
      ...
      C7/
    annotations_positions/
      00000000.json
      00000010.json
      ...
    calibrations/
      extrinsic/
        extr_Camera1.xml ... extr_Camera7.xml
      intrinsic_zero/
        intr_Camera1.xml ... intr_Camera7.xml

After downloading and extracting, run:
  python -m scripts.ingest_wildtrack

This script just verifies the structure is correct.
"""
import os
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "wildtrack")

def check_structure():
    if not os.path.exists(DATA_DIR):
        print(f"Directory not found: {DATA_DIR}")
        print("   Please create it and extract the WILDTRACK dataset there.")
        return False

    ok = True

    images_dir = os.path.join(DATA_DIR, "Image_subsets")
    if not os.path.exists(images_dir):
        print(f"Missing: {images_dir}")
        ok = False
    else:
        cameras_found = [c for c in os.listdir(images_dir) if c.startswith("C")]
        print(f"Found {len(cameras_found)} camera folders: {sorted(cameras_found)}")

    annotations_dir = os.path.join(DATA_DIR, "annotations_positions")
    if not os.path.exists(annotations_dir):
        print(f"Missing: {annotations_dir}")
        ok = False
    else:
        ann_files = [f for f in os.listdir(annotations_dir) if f.endswith(".json")]
        print(f"Found {len(ann_files)} annotation files")

    calib_dir = os.path.join(DATA_DIR, "calibrations")
    if not os.path.exists(calib_dir):
        print(f"Missing: {calib_dir}")
        ok = False
    else:
        print(f"Found calibrations directory")

    if ok:
        print("\nWILDTRACK structure looks good. Run: python -m scripts.ingest_wildtrack")
    else:
        print("\nSee the instructions at the top of this file.")

    return ok

if __name__ == "__main__":
    check_structure()
