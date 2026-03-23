from fastapi import APIRouter
from app.api.routes import auth, cameras, search, entities, saved_searches, alerts

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(cameras.router)
api_router.include_router(search.router)
api_router.include_router(entities.router)
api_router.include_router(saved_searches.router)
api_router.include_router(alerts.router)
