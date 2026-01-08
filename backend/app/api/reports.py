from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Company, Job, Location, Skill


router = APIRouter(prefix="/reports")


def _cutoff_from_window(window: str) -> datetime:
    now = datetime.now(timezone.utc)
    mapping = {
        "1w": timedelta(days=7),
        "2w": timedelta(days=14),
        "1m": timedelta(days=30),
        "3m": timedelta(days=90),
    }
    return now - mapping.get(window, timedelta(days=30))


@router.get("/job-skill-distribution")
def report_job_skill_distribution(
    job_title: str = Query(..., min_length=1),
    location: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    universe = select(Job.id).where(func.lower(Job.title) == job_title.lower())
    if location:
        universe = (
            universe.join(Job.locations)
            .where(func.lower(Location.city).contains(location.lower()))
        )
    universe = universe.distinct().subquery()

    total_jobs = db.execute(select(func.count()).select_from(universe)).scalar_one()
    if total_jobs == 0:
        return {"job_title": job_title, "location": location, "total_jobs": 0, "skills": []}

    counts_stmt = (
        select(Skill.name, func.count().label("mentions"))
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .join(Job.skills)
        .group_by(Skill.name)
        .order_by(func.count().desc(), Skill.name.asc())
    )
    rows = db.execute(counts_stmt).all()
    total_mentions = sum(int(r[1]) for r in rows) or 0

    skills = []
    for name, mentions in rows:
        pct = (float(mentions) / float(total_mentions) * 100.0) if total_mentions else 0.0
        skills.append({"name": name, "count": int(mentions), "percentage": round(pct, 1)})

    return {"job_title": job_title, "location": location, "total_jobs": total_jobs, "skills": skills}


@router.get("/skill-trend")
def report_skill_trend(
    skill: str = Query(..., min_length=1),
    job_title: str | None = Query(default=None),
    location: str | None = Query(default=None),
    bucket: Literal["month"] = Query(default="month"),
    db: Session = Depends(get_db),
):
    month = func.date_trunc("month", Job.date).label("month")

    stmt = select(
        month,
        func.count(func.distinct(Job.id)).label("total_jobs"),
        func.count(func.distinct(Job.id))
        .filter(func.lower(Skill.name) == skill.lower())
        .label("jobs_with_skill"),
    ).select_from(Job)

    if job_title:
        stmt = stmt.where(func.lower(Job.title) == job_title.lower())
    if location:
        stmt = stmt.join(Job.locations).where(func.lower(Location.city).contains(location.lower()))

    stmt = (
        stmt.outerjoin(Job.skills)
        .where(Job.date.is_not(None))
        .group_by(month)
        .order_by(month.asc())
    )

    rows = db.execute(stmt).all()
    points = []
    for m, total, with_skill in rows:
        if not m:
            continue
        dt: datetime = m
        x = f"{dt.month:02d}.{dt.year}"
        y = (float(with_skill) / float(total) * 100.0) if total else 0.0
        points.append({"x": x, "y": round(y, 1)})

    return {"skill": skill, "job_title": job_title, "location": location, "points": points}


@router.get("/skill-top-job-titles")
def report_skill_top_job_titles(
    skill: str = Query(..., min_length=1),
    limit: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    stmt = (
        select(
            Job.title.label("job_title"),
            func.count(func.distinct(Job.id)).label("total_jobs"),
            func.count(func.distinct(Job.id))
            .filter(func.lower(Skill.name) == skill.lower())
            .label("jobs_with_skill"),
        )
        .select_from(Job)
        .outerjoin(Job.skills)
        .group_by(Job.title)
    )
    rows = db.execute(stmt).all()

    result = []
    for title, total, with_skill in rows:
        if not total or not with_skill:
            continue
        pct = float(with_skill) / float(total) * 100.0
        result.append({"job_title": title, "percentage": round(pct, 1)})

    result.sort(key=lambda r: r["percentage"], reverse=True)
    return result[:limit]


@router.post("/jobs-by-skills")
def report_jobs_by_skills(
    payload: dict = Body(..., examples=[{"skills": ["Python", "SQL"], "location": "London", "time_window": "1m"}]),
    db: Session = Depends(get_db),
):
    skills_in = payload.get("skills") or []
    location = payload.get("location")
    time_window = payload.get("time_window", "1m")
    if not isinstance(skills_in, list) or len(skills_in) == 0:
        return {"job_titles": [], "top_job_title": None, "last_announcements": []}

    skills_lower = [str(s).lower() for s in skills_in if str(s).strip()]
    cutoff = _cutoff_from_window(str(time_window))

    universe = (
        select(Job.id)
        .join(Job.skills)
        .where(func.lower(Skill.name).in_(skills_lower))
        .where(Job.date.is_not(None))
        .where(Job.date >= cutoff)
    )
    if location:
        universe = universe.join(Job.locations).where(func.lower(Location.city).contains(str(location).lower()))

    universe = universe.distinct().subquery()
    total_jobs = db.execute(select(func.count()).select_from(universe)).scalar_one()
    if total_jobs == 0:
        return {"job_titles": [], "top_job_title": None, "last_announcements": []}

    dist_stmt = (
        select(Job.title, func.count(func.distinct(Job.id)).label("count"))
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .group_by(Job.title)
        .order_by(func.count(func.distinct(Job.id)).desc(), Job.title.asc())
    )
    dist_rows = db.execute(dist_stmt).all()

    job_titles = []
    top_job_title = None
    for i, (title, count) in enumerate(dist_rows):
        if i == 0:
            top_job_title = title
        pct = float(count) / float(total_jobs) * 100.0
        job_titles.append({"name": title, "count": int(count), "percent": round(pct, 1)})

    last_stmt = (
        select(Job.id, Job.title, Company.name, Job.date)
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .outerjoin(Company, Company.id == Job.company_id)
        .order_by(Job.date.desc())
        .limit(5)
    )
    last_rows = db.execute(last_stmt).all()
    last_announcements = [
        {
            "id": r[0],
            "title": r[1],
            "company": r[2],
            "date": r[3].date().isoformat() if r[3] else None,
            "url": None,
        }
        for r in last_rows
    ]

    return {"job_titles": job_titles, "top_job_title": top_job_title, "last_announcements": last_announcements}


@router.post("/job-title-details")
def report_job_title_details(
    payload: dict = Body(..., examples=[{"job_title": "Backend Developer", "location": "Remote", "time_window": "1m"}]),
    db: Session = Depends(get_db),
):
    job_title = payload.get("job_title")
    if not job_title:
        return {"top_skills": [], "top_companies": [], "last_announcements": []}

    skills_in = payload.get("skills") or []
    location = payload.get("location")
    time_window = payload.get("time_window", "1m")
    cutoff = _cutoff_from_window(str(time_window))

    base = (
        select(Job.id)
        .where(func.lower(Job.title) == str(job_title).lower())
        .where(Job.date.is_not(None))
        .where(Job.date >= cutoff)
    )
    if location:
        base = base.join(Job.locations).where(func.lower(Location.city).contains(str(location).lower()))
    if isinstance(skills_in, list) and len(skills_in) > 0:
        skills_lower = [str(s).lower() for s in skills_in if str(s).strip()]
        base = base.join(Job.skills).where(func.lower(Skill.name).in_(skills_lower))

    universe = base.distinct().subquery()
    total_jobs = db.execute(select(func.count()).select_from(universe)).scalar_one()
    if total_jobs == 0:
        return {"top_skills": [], "top_companies": [], "last_announcements": []}

    skills_stmt = (
        select(Skill.name, func.count(func.distinct(Job.id)).label("count"))
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .join(Job.skills)
        .group_by(Skill.name)
        .order_by(func.count(func.distinct(Job.id)).desc(), Skill.name.asc())
        .limit(25)
    )
    skill_rows = db.execute(skills_stmt).all()
    top_skills = []
    for name, count in skill_rows:
        pct = float(count) / float(total_jobs) * 100.0
        top_skills.append({"name": name, "count": int(count), "percent": round(pct, 1)})

    comp_stmt = (
        select(Company.name, func.count(func.distinct(Job.id)).label("count"))
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .outerjoin(Company, Company.id == Job.company_id)
        .group_by(Company.name)
        .order_by(func.count(func.distinct(Job.id)).desc())
        .limit(3)
    )
    comp_rows = db.execute(comp_stmt).all()
    top_companies = [{"name": r[0], "count": int(r[1])} for r in comp_rows if r[0]]

    last_stmt = (
        select(Job.id, Job.title, Company.name, Job.date)
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .outerjoin(Company, Company.id == Job.company_id)
        .order_by(Job.date.desc())
        .limit(5)
    )
    last_rows = db.execute(last_stmt).all()
    last_announcements = [
        {
            "id": r[0],
            "title": r[1],
            "company": r[2],
            "date": r[3].date().isoformat() if r[3] else None,
            "url": None,
        }
        for r in last_rows
    ]

    return {"top_skills": top_skills, "top_companies": top_companies, "last_announcements": last_announcements}
