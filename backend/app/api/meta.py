from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Job, Location, Skill


router = APIRouter()


@router.get("/job-titles", response_model=list[str])
def list_job_titles(db: Session = Depends(get_db)) -> list[str]:
    rows = db.execute(select(func.distinct(Job.title)).order_by(Job.title.asc())).all()
    return [r[0] for r in rows if r[0]]


@router.get("/locations", response_model=list[str])
def list_locations(db: Session = Depends(get_db)) -> list[str]:
    rows = db.execute(select(func.distinct(Location.city)).order_by(Location.city.asc())).all()
    return [r[0] for r in rows if r[0]]


@router.get("/skills", response_model=list[str])
def list_skills(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Optional substring search"),
    limit: int = Query(default=20, ge=1, le=200),
) -> list[str]:
    stmt = select(Skill.name).order_by(Skill.name.asc())
    if q:
        stmt = stmt.where(func.lower(Skill.name).contains(q.lower()))
    stmt = stmt.limit(limit)
    rows = db.execute(stmt).all()
    return [r[0] for r in rows if r[0]]


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    """Return lightweight site stats such as total announcements."""
    total = db.execute(select(func.count()).select_from(Job)).scalar_one()
    return {"total_announcements": int(total)}
