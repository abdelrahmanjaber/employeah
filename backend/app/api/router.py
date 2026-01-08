from fastapi import APIRouter

from app.api import meta, reports, skills


api_router = APIRouter(prefix="/api/v1")

api_router.include_router(meta.router, tags=["meta"])
api_router.include_router(skills.router, tags=["skills"])
api_router.include_router(reports.router, tags=["reports"])
