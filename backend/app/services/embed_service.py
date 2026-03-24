"""
Embedding service using OpenCLIP (ViT-B/32).
Falls back to None if model not loaded (API still works, search falls back to text matching).
"""
import numpy as np
from typing import Optional

_model = None
_preprocess = None
_tokenizer = None

def _load_model():
    global _model, _preprocess, _tokenizer
    if _model is not None:
        return True
    try:
        import open_clip
        import torch
        _model, _, _preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
        _tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _model.eval()
        return True
    except ImportError:
        return False

async def get_text_embedding(text: str, prompt_template: str = "a photo of {text}") -> Optional[list[float]]:
    """Embed a text query. Returns None if model not available."""
    if not _load_model():
        return None
    try:
        import torch
        prompted = prompt_template.format(text=text)
        tokens = _tokenizer([prompted])
        with torch.no_grad():
            features = _model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)
        return features[0].tolist()
    except Exception:
        return None

async def get_image_embedding(image_path: str) -> Optional[list[float]]:
    """Embed an image file. Returns None if model not available."""
    if not _load_model():
        return None
    try:
        import torch
        from PIL import Image
        img = Image.open(image_path).convert("RGB")
        img_tensor = _preprocess(img).unsqueeze(0)
        with torch.no_grad():
            features = _model.encode_image(img_tensor)
            features = features / features.norm(dim=-1, keepdim=True)
        return features[0].tolist()
    except Exception:
        return None

async def get_image_embedding_from_array(arr: np.ndarray) -> Optional[list[float]]:
    """Embed a numpy image array (H,W,C BGR). Returns None if model not available."""
    if not _load_model():
        return None
    try:
        import torch
        from PIL import Image
        rgb = arr[:, :, ::-1]  # BGR -> RGB
        img = Image.fromarray(rgb.astype(np.uint8))
        img_tensor = _preprocess(img).unsqueeze(0)
        with torch.no_grad():
            features = _model.encode_image(img_tensor)
            features = features / features.norm(dim=-1, keepdim=True)
        return features[0].tolist()
    except Exception:
        return None
