# Clairvoyant Backend — Setup Guide

FastAPI backend for the Clairvoyant AI video search engine.
Stack: FastAPI + PostgreSQL (pgvector) + SQLAlchemy async + JWT auth.

---

## Quick Start (Docker — recommended)

```bash
cd /Users/mac/Desktop/projects/clairvoyant
docker compose up --build
```

The API will be available at http://localhost:8000.
Interactive docs: http://localhost:8000/docs

Demo credentials (auto-seeded on first start):
- Email: demo@videosearch.io
- Password: demo123

---

## Local Development (without Docker)

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 16 with the pgvector extension
- (Optional) ffmpeg for video processing

### 2. Create and activate a virtual environment

```bash
cd /Users/mac/Desktop/projects/clairvoyant/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Start PostgreSQL with pgvector

The easiest way is to use the Docker image for just the database:

```bash
docker run -d \
  --name clairvoyant-db \
  -e POSTGRES_USER=clairvoyant \
  -e POSTGRES_PASSWORD=clairvoyant \
  -e POSTGRES_DB=clairvoyant \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env if your DB settings differ from the defaults
```

### 5. Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

The app auto-creates all tables and seeds the demo user + cameras on first startup.

---

## Seeding Mock Segments

After the backend starts (and cameras are seeded), populate the search page with 30 demo video segments:

```bash
cd /Users/mac/Desktop/projects/clairvoyant/backend
python -m scripts.seed_mock_segments
```

This creates 2 demo entities (1 person, 1 vehicle) with sightings across all cameras.

---

## WILDTRACK Dataset (optional — real footage)

WILDTRACK is a real multi-camera pedestrian dataset from EPFL. Using it gives the search page actual thumbnails and CLIP semantic embeddings.

### Step 1: Download

1. Go to: https://www.epfl.ch/labs/cvlab/data/data-wildtrack/
2. Fill out the form to get the download link
3. Download and extract to: `/Users/mac/Desktop/projects/clairvoyant/data/wildtrack/`

Verify the structure:

```bash
python -m scripts.download_wildtrack
```

### Step 2: Ingest

```bash
pip install open_clip_torch torch Pillow tqdm
python -m scripts.ingest_wildtrack
```

This creates segments, thumbnails, entities, sightings, and CLIP embeddings.

### Step 3: (Re-)build embeddings

If you ran ingest before installing open_clip_torch, run this to backfill embeddings:

```bash
python -m scripts.build_embeddings
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/login | No | Get JWT token |
| GET | /api/v1/cameras | Yes | List all cameras |
| GET | /api/v1/cameras/:id | Yes | Get single camera |
| GET | /api/v1/cameras/groups | Yes | List camera groups with their cameras |
| POST | /api/v1/search | Yes | Search segments (text + filters) |
| GET | /api/v1/entities/:id | Yes | Get entity with sightings |
| GET | /api/v1/saved-searches | Yes | List saved searches for current user |
| POST | /api/v1/saved-searches | Yes | Save a search |
| DELETE | /api/v1/saved-searches/:id | Yes | Delete a saved search |
| GET | /api/v1/alerts | Yes | List alerts for current user |
| POST | /api/v1/alerts | Yes | Create an alert |
| PATCH | /api/v1/alerts/:id | Yes | Toggle alert active state |
| DELETE | /api/v1/alerts/:id | Yes | Delete an alert |
| GET | /health | No | Health check |

Authentication: `Authorization: Bearer <token>` header. Token is a signed JWT (HS256).

---

## Project Structure

```
backend/
  app/
    core/
      config.py         # Settings (reads .env)
      security.py       # JWT + bcrypt helpers
    db/
      database.py       # SQLAlchemy engine + Base + init_db()
      models.py         # ORM models (User, Camera, Segment, Entity, ...)
      schemas.py        # Pydantic request/response models
    api/
      deps.py           # get_current_user dependency
      router.py         # Mounts all route modules under /api/v1
      routes/
        auth.py
        cameras.py
        search.py
        entities.py
        saved_searches.py
        alerts.py
    services/
      embed_service.py  # OpenCLIP text/image embedding (optional)
    main.py             # FastAPI app, CORS, lifespan, demo seed
  scripts/
    seed_mock_segments.py   # Quick demo data without WILDTRACK
    download_wildtrack.py   # Checks WILDTRACK folder structure
    ingest_wildtrack.py     # Full ingest pipeline
    build_embeddings.py     # Backfill CLIP embeddings
  Dockerfile
  requirements.txt
  .env.example
```

---

## Search Behavior

- Without a text query: returns all segments ordered by time or confidence.
- With a text query + CLIP embeddings available: performs cosine similarity vector search against segment embeddings.
- With a text query but no CLIP (open_clip not installed): falls back to case-insensitive substring match against segment tags.

Install `open_clip_torch` and `torch` to unlock semantic vector search.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql+asyncpg://clairvoyant:clairvoyant@localhost:5432/clairvoyant | Async Postgres URL |
| SECRET_KEY | dev-secret-key-change-in-production | JWT signing key |
| DEMO_EMAIL | demo@videosearch.io | Auto-seeded demo user email |
| DEMO_PASSWORD | demo123 | Auto-seeded demo user password |
| DATA_DIR | /data | Root for thumbnails and video files |
| OPENAI_API_KEY | (empty) | Optional, reserved for LLM query parsing |
