"""
Embedding service.

Two backends (tried in order):
  1. OpenCLIP ViT-B/32  — full fidelity; requires torch + open_clip_torch (~600 MB RAM).
     Used in local dev when those packages are installed.
  2. ONNX text encoder  — text queries only; requires onnxruntime + transformers (~200 MB RAM).
     Used in production (Railway) where torch is too heavy.
     Downloads a 64 MB ONNX file from HuggingFace on first use, then caches it.
     Embeddings are compatible with the CLIP image embeddings already stored in the DB
     because both use the same OpenAI ViT-B/32 weights.
"""
import numpy as np
from typing import Optional

# ---------------------------------------------------------------------------
# Backend 1: OpenCLIP (local dev)
# ---------------------------------------------------------------------------
_model = None
_preprocess = None
_tokenizer = None


def _load_model() -> bool:
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


# ---------------------------------------------------------------------------
# Backend 2: ONNX text encoder (production)
# ---------------------------------------------------------------------------
_onnx_session = None
_onnx_tokenizer = None
_ONNX_MODEL_URL = (
    "https://huggingface.co/Xenova/clip-vit-base-patch32"
    "/resolve/main/onnx/text_model.onnx"
)
# Prefer a path baked into the image; fall back to /tmp on restarts.
_ONNX_PATHS = ["/app/clip_text.onnx", "/tmp/clip_text.onnx"]


def _load_onnx() -> bool:
    global _onnx_session, _onnx_tokenizer
    if _onnx_session is not None:
        return True
    try:
        import onnxruntime as ort
        import urllib.request
        import os

        # Find or download the ONNX model file
        model_path = None
        for path in _ONNX_PATHS:
            if os.path.exists(path):
                model_path = path
                break

        if model_path is None:
            # Download to /tmp (ephemeral but fine for a demo)
            dest = _ONNX_PATHS[-1]
            print(f"Downloading CLIP ONNX text encoder to {dest} …")
            urllib.request.urlretrieve(_ONNX_MODEL_URL, dest)
            model_path = dest

        _onnx_session = ort.InferenceSession(
            model_path, providers=["CPUExecutionProvider"]
        )

        # CLIPTokenizerFast works without torch
        from transformers import CLIPTokenizerFast
        _onnx_tokenizer = CLIPTokenizerFast.from_pretrained(
            "openai/clip-vit-base-patch32"
        )
        return True
    except Exception as e:
        print(f"ONNX embedding backend unavailable: {e}")
        return False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_text_embedding(
    text: str, prompt_template: str = "a photo of {text}"
) -> Optional[list[float]]:
    """Embed a text query. Returns None if no backend is available."""
    prompted = prompt_template.format(text=text)

    # Try OpenCLIP first (local dev with torch installed)
    if _load_model():
        try:
            import torch
            tokens = _tokenizer([prompted])
            with torch.no_grad():
                features = _model.encode_text(tokens)
                features = features / features.norm(dim=-1, keepdim=True)
            return features[0].tolist()
        except Exception:
            pass

    # Fallback: ONNX text encoder (production)
    if _load_onnx():
        try:
            inputs = _onnx_tokenizer(
                prompted,
                return_tensors="np",
                padding="max_length",
                max_length=77,
                truncation=True,
            )
            outputs = _onnx_session.run(
                None,
                {"input_ids": inputs["input_ids"].astype(np.int64)},
            )
            # text_embeds is the only output
            embedding = outputs[0][0].astype(np.float32)
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return embedding.tolist()
        except Exception as e:
            print(f"ONNX inference failed: {e}")

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
