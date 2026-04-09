FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev \
    gcc \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-prod.txt ./
RUN pip install --no-cache-dir -r requirements-prod.txt

# Bake the CLIP ONNX text encoder into the image so queries never trigger a
# runtime download.  64 MB — downloaded once at build time from HuggingFace CDN.
RUN wget -q -O /app/clip_text.onnx \
    "https://huggingface.co/Xenova/clip-vit-base-patch32/resolve/main/onnx/text_model.onnx"

# Pre-cache the CLIP tokenizer files (tiny, avoids first-request latency)
RUN python3 -c "from transformers import CLIPTokenizerFast; CLIPTokenizerFast.from_pretrained('openai/clip-vit-base-patch32')"

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
