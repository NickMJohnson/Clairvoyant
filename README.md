# Clairvoyant

**AI-powered video search engine for multi-camera surveillance environments.**

Instead of scrubbing through hours of footage, investigators type natural language queries — *"person with yellow backpack"*, *"white SUV near entrance"* — and instantly surface the exact clips across all cameras, ranked by visual similarity.

![Clairvoyant Dashboard](https://via.placeholder.com/1200x600/0d0b09/f59e0b?text=Clairvoyant+%E2%80%94+AI+Video+Search)

---

## Features

- **Natural language search** — Query footage in plain English using CLIP embeddings and pgvector cosine similarity
- **Query-level bounding box grounding** — Highlights the specific detected object matching your query (e.g. the backpack, not just the person)
- **Full camera feeds** — Scrollable clip timeline per camera with an activity scrubber
- **Cross-camera entity tracking** — Track a person across all cameras with a unified subject profile
- **Video playback** — In-app MP4 playback with bounding box overlay toggle
- **Alerts** — Save queries as recurring alerts with configurable time windows and notification channels
- **Saved searches** — Bookmark frequent queries for fast re-execution

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn-ui (Radix UI) + Tailwind CSS |
| Backend | FastAPI (Python, fully async) |
| Database | PostgreSQL 16 + pgvector extension |
| ORM | SQLAlchemy (async) |
| ML model | OpenCLIP ViT-B/32 (512-dim embeddings) |
| Auth | JWT (HS256) + bcrypt |
| Video | ffmpeg |
| Infrastructure | Docker + Docker Compose |
| Dataset (POC) | WILDTRACK — 7 cameras, 238 segments, 39 entities |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 18+

### 1. Start the backend

```bash
docker compose up --build
```

This starts PostgreSQL (with pgvector) and the FastAPI backend. On first run it creates all DB tables and seeds a demo user.

### 2. Start the frontend

```bash
cd clairvoyantcrimewatch
npm install
npm run dev
```

Open **http://localhost:8080**

**Login:** `demo@videosearch.io` / `demo123`

---

## Loading Real Data (WILDTRACK Dataset)

The WILDTRACK dataset provides 7 synchronized cameras, 400 annotated frames, and 39 tracked persons at 1920×1080 resolution.

```bash
# 1. Download from https://www.epfl.ch/labs/cvlab/data/data-wildtrack/
#    Extract to: data/wildtrack/
#    Required folders: Image_subsets/, annotations_positions/, calibrations/

# 2. Ingest frames → segments + thumbnails (~238 segments, 39 entities)
docker compose exec backend python -m scripts.ingest_wildtrack

# 3. Build MP4 clips for in-app video playback
docker compose exec backend python -m scripts.build_clips

# 4. Build per-detection crop embeddings (enables query-level bbox grounding)
docker compose exec backend python -m scripts.build_crops

# 5. Build segment-level CLIP embeddings (enables semantic search)
docker compose exec backend python -m scripts.build_embeddings
```

> Steps 4 and 5 require `open_clip_torch`. It installs automatically in the Docker image but takes a few minutes on first run as the ViT-B/32 model downloads (~350MB).

---

## How Search Works

1. User types a query — *"man with red hat"*
2. Backend encodes the query with OpenCLIP's text encoder using the template `"a photo of {text}"` → 512-dim embedding
3. pgvector runs a cosine distance query against all segment embeddings → returns ranked results
4. For each result, every detected object's crop embedding is scored against the query → the most relevant bounding box is highlighted in green in the Video Drawer
5. Falls back to tag-based text search if CLIP embeddings aren't available

**Search limits:** 200 results by default, max 500.

---

## Project Structure

```
clairvoyant/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # FastAPI routers (search, cameras, entities, alerts)
│   │   ├── db/               # SQLAlchemy models, schemas, migrations
│   │   ├── services/         # CLIP embedding service
│   │   └── core/             # Config, auth dependencies
│   └── scripts/              # Data pipeline scripts
│       ├── ingest_wildtrack.py
│       ├── build_clips.py
│       ├── build_crops.py
│       └── build_embeddings.py
├── clairvoyantcrimewatch/    # React frontend
│   └── src/
│       ├── pages/            # Dashboard, CameraPage, EntityPage, Alerts, ...
│       ├── components/
│       │   ├── layout/       # Sidebar, TopBar, DashboardLayout
│       │   └── search/       # SegmentCard, VideoDrawer, FiltersPanel
│       └── lib/              # API client, types
├── data/                     # Thumbnails, clips, crops (gitignored)
└── docker-compose.yml
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | JWT login |
| `POST` | `/api/v1/search` | Semantic + filter search |
| `GET` | `/api/v1/cameras` | List all cameras |
| `GET` | `/api/v1/cameras/groups` | Camera groups with cameras |
| `GET` | `/api/v1/cameras/:id` | Single camera |
| `GET` | `/api/v1/entities/:id` | Entity profile + sightings |
| `GET` | `/api/v1/entities/:id/segments` | All clips for an entity |
| `GET` | `/api/v1/alerts` | List alerts |
| `POST` | `/api/v1/alerts` | Create alert |
| `GET` | `/api/v1/saved-searches` | List saved searches |

Interactive API docs available at **http://localhost:8000/docs** when the backend is running.

---

## Useful Commands

```bash
# Full restart (fixes network/DB issues)
docker compose down && docker compose up -d

# Backend logs
docker compose logs backend -f

# Direct DB access
docker compose exec db psql -U clairvoyant -d clairvoyant

# Seed mock data (no WILDTRACK needed)
docker compose exec backend python -m scripts.seed_mock_segments
```

---

## Roadmap

- [ ] Live RTSP camera stream ingestion
- [ ] Async embedding worker queue (Celery + Redis)
- [ ] Automatic cross-camera ReID clustering
- [ ] HNSW index on pgvector for faster search at scale
- [ ] Upgrade to ViT-L-14 embeddings for higher accuracy
