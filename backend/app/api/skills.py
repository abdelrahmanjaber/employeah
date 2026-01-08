from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course, Skill


router = APIRouter()


@router.get("/skills/{skill}/courses")
def list_courses_for_skill(
    skill: str = Path(..., min_length=1),
    limit: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Course.title, Course.semester, Course.url)
        .join(Course.skills)
        .where(func.lower(Skill.name).contains(skill.lower()))
        .order_by(Course.title.asc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [{"title": r[0], "semester": r[1], "url": r[2]} for r in rows]
