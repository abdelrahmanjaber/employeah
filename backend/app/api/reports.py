from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Company, DataSource, Field, Job, JobField, JobLocation, JobSkills, Location, Skill


router = APIRouter(prefix="/reports")


def _cutoff_from_window(window: str) -> datetime:
    now = datetime.now(timezone.utc)
    if window == "all":
        return datetime(1970, 1, 1, tzinfo=timezone.utc)
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
    field: str | None = Query(default=None),
    location: str | None = Query(default=None),
    time_window: str = Query(default="1m"),
    bucket: Literal["day", "week", "month"] = Query(default="month"),
    db: Session = Depends(get_db),
):
    if bucket == "day":
        bucket_col = func.date_trunc("day", Job.date).label("bucket")
    elif bucket == "week":
        bucket_col = func.date_trunc("week", Job.date).label("bucket")
    else:
        bucket_col = func.date_trunc("month", Job.date).label("bucket")

    cutoff = _cutoff_from_window(str(time_window))

    stmt = select(
        bucket_col,
        func.count(func.distinct(Job.id)).label("total_jobs"),
        func.count(func.distinct(Job.id))
        .filter(func.lower(Skill.name) == skill.lower())
        .label("jobs_with_skill"),
    ).select_from(Job)

    if job_title:
        stmt = stmt.where(func.lower(Job.title) == job_title.lower())
    if field:
        stmt = (
            stmt.join(JobField, JobField.job_id == Job.id)
            .join(Field, Field.id == JobField.field_id)
            .where(func.lower(Field.name) == str(field).lower())
        )
    if location:
        stmt = stmt.join(Job.locations).where(func.lower(Location.city).contains(location.lower()))

    stmt = (
        stmt.outerjoin(Job.skills)
        .where(Job.date.is_not(None))
        .where(Job.date >= cutoff)
        .group_by(bucket_col)
        .order_by(bucket_col.asc())
    )

    rows = db.execute(stmt).all()
    points = []
    for m, total, with_skill in rows:
        if not m:
            continue
        dt: datetime = m
        if bucket in ("day", "week"):
            x = dt.strftime("%d/%m/%Y")
        else:
            x = f"{dt.month:02d}.{dt.year}"
        y = (float(with_skill) / float(total) * 100.0) if total else 0.0
        points.append({"x": x, "y": round(y, 1)})

    return {
        "skill": skill,
        "job_title": job_title,
        "field": field,
        "location": location,
        "time_window": time_window,
        "bucket": bucket,
        "points": points,
    }


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


@router.get("/skill-top-fields")
def report_skill_top_fields(
    skill: str = Query(..., min_length=1),
    location: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = (
        select(
            Field.name.label("field"),
            func.count(func.distinct(Job.id)).label("total_jobs"),
            func.count(func.distinct(Job.id))
            .filter(func.lower(Skill.name) == skill.lower())
            .label("jobs_with_skill"),
        )
        .select_from(Job)
        .join(JobField, JobField.job_id == Job.id)
        .join(Field, Field.id == JobField.field_id)
        .outerjoin(Job.skills)
        .where(Job.date.is_not(None))
        .group_by(Field.name)
    )
    if location:
        stmt = stmt.join(Job.locations).where(func.lower(Location.city).contains(str(location).lower()))

    rows = db.execute(stmt).all()
    out: list[dict] = []
    for field_name, total, with_skill in rows:
        if not total or not with_skill or not field_name:
            continue
        pct = float(with_skill) / float(total) * 100.0
        out.append({"field": field_name, "count": int(with_skill), "percentage": round(pct, 1)})

    out.sort(key=lambda r: (r["percentage"], r["count"]), reverse=True)
    return out[:limit]


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

    # include first available data_source.link for each job (if any)
    last_stmt = (
        select(
            Job.id,
            Job.title,
            Company.name,
            Job.date,
            select(DataSource.link).where(DataSource.job_id == Job.id).limit(1).scalar_subquery().label("link"),
        )
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
            "url": r[4].strip() if len(r) > 4 and r[4] else None,
        }
        for r in last_rows
    ]

    return {"job_titles": job_titles, "top_job_title": top_job_title, "last_announcements": last_announcements}


@router.post("/fields-by-skills")
def report_fields_by_skills(
    payload: dict = Body(
        ...,
        examples=[
            {"skills": ["Python", "SQL"], "location": "Munich", "time_window": "3m"},
        ],
    ),
    db: Session = Depends(get_db),
):
    skills_in = payload.get("skills") or []
    location = payload.get("location")
    time_window = payload.get("time_window", "1m")
    if not isinstance(skills_in, list) or len(skills_in) == 0:
        return {"fields": [], "top_field": None, "best_jobs": []}

    skills_lower = [str(s).strip().lower() for s in skills_in if str(s).strip()]
    if not skills_lower:
        return {"fields": [], "top_field": None, "best_jobs": []}

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

    total_sq = (
        select(JobSkills.job_id.label("job_id"), func.count(func.distinct(JobSkills.skill_id)).label("total"))
        .select_from(universe)
        .join(JobSkills, JobSkills.job_id == universe.c.id)
        .group_by(JobSkills.job_id)
        .subquery()
    )
    matched_sq = (
        select(JobSkills.job_id.label("job_id"), func.count(func.distinct(JobSkills.skill_id)).label("matched"))
        .select_from(universe)
        .join(JobSkills, JobSkills.job_id == universe.c.id)
        .join(Skill, Skill.id == JobSkills.skill_id)
        .where(func.lower(Skill.name).in_(skills_lower))
        .group_by(JobSkills.job_id)
        .subquery()
    )

    match_pct = (
        (func.coalesce(matched_sq.c.matched, 0) / func.nullif(total_sq.c.total, 0)) * 100.0
    ).label("match_pct")

    fields_stmt = (
        select(
            Field.name,
            func.avg(match_pct).label("percent"),
            func.count(func.distinct(Job.id)).label("count"),
        )
        .select_from(universe)
        .join(Job, Job.id == universe.c.id)
        .join(JobField, JobField.job_id == Job.id)
        .join(Field, Field.id == JobField.field_id)
        .join(total_sq, total_sq.c.job_id == Job.id)
        .outerjoin(matched_sq, matched_sq.c.job_id == Job.id)
        .group_by(Field.name)
        .order_by(func.avg(match_pct).desc(), Field.name.asc())
    )

    field_rows = db.execute(fields_stmt).all()
    fields_out = [
        {"name": r[0], "percent": round(float(r[1] or 0.0), 1), "count": int(r[2] or 0)}
        for r in field_rows
        if r[0]
    ]
    top_field = fields_out[0]["name"] if fields_out else None

    best_jobs = []
    if top_field:
        link_sq = (
            select(DataSource.link).where(DataSource.job_id == Job.id).limit(1).scalar_subquery()
        )
        best_stmt = (
            select(
                Job.id,
                Job.title,
                Company.name,
                Job.date,
                link_sq.label("link"),
                match_pct,
            )
            .select_from(universe)
            .join(Job, Job.id == universe.c.id)
            .join(JobField, JobField.job_id == Job.id)
            .join(Field, Field.id == JobField.field_id)
            .outerjoin(Company, Company.id == Job.company_id)
            .join(total_sq, total_sq.c.job_id == Job.id)
            .outerjoin(matched_sq, matched_sq.c.job_id == Job.id)
            .where(Field.name == top_field)
            .order_by(match_pct.desc(), Job.date.desc())
            .limit(5)
        )
        rows = db.execute(best_stmt).all()
        best_jobs = [
            {
                "id": r[0],
                "title": r[1],
                "company": r[2],
                "date": r[3].date().isoformat() if r[3] else None,
                "url": (r[4].strip() if r[4] else None),
                "match_percent": round(float(r[5] or 0.0), 1),
            }
            for r in rows
        ]

    return {"fields": fields_out, "top_field": top_field, "best_jobs": best_jobs}


@router.post("/locations-by-skills")
def report_locations_by_skills(
    payload: dict = Body(..., examples=[{"skills": ["Python"], "time_window": "3m"}]),
    db: Session = Depends(get_db),
):
    skills_in = payload.get("skills") or []
    time_window = payload.get("time_window", "1m")
    if not isinstance(skills_in, list) or len(skills_in) == 0:
        return []

    skills_lower = [str(s).strip().lower() for s in skills_in if str(s).strip()]
    if not skills_lower:
        return []

    cutoff = _cutoff_from_window(str(time_window))
    stmt = (
        select(func.distinct(Location.city))
        .select_from(Job)
        .join(Job.skills)
        .join(Job.locations)
        .where(func.lower(Skill.name).in_(skills_lower))
        .where(Job.date.is_not(None))
        .where(Job.date >= cutoff)
        .order_by(Location.city.asc())
    )
    rows = db.execute(stmt).all()
    return [r[0] for r in rows if r[0]]

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

    # include first available data_source.link for each job (if any)
    last_stmt = (
        select(
            Job.id,
            Job.title,
            Company.name,
            Job.date,
            select(DataSource.link).where(DataSource.job_id == Job.id).limit(1).scalar_subquery().label("link"),
        )
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
            "url": r[4].strip() if len(r) > 4 and r[4] else None,
        }
        for r in last_rows
    ]

    return {"top_skills": top_skills, "top_companies": top_companies, "last_announcements": last_announcements, "total_jobs": total_jobs}


@router.post("/field-details")
def report_field_details(
    payload: dict = Body(
        ...,
        examples=[
            {"field": "AI Engineer", "skills": ["Python"], "location": "Munich", "time_window": "3m"},
        ],
    ),
    db: Session = Depends(get_db),
):
    field_name = payload.get("field")
    if not field_name:
        return {"top_skills": [], "top_companies": [], "last_announcements": [], "total_jobs": 0}

    skills_in = payload.get("skills") or []
    location = payload.get("location")
    time_window = payload.get("time_window", "1m")
    cutoff = _cutoff_from_window(str(time_window))

    base = (
        select(Job.id)
        .join(JobField, JobField.job_id == Job.id)
        .join(Field, Field.id == JobField.field_id)
        .where(func.lower(Field.name) == str(field_name).lower())
        .where(Job.date.is_not(None))
        .where(Job.date >= cutoff)
    )
    if location:
        base = base.join(Job.locations).where(func.lower(Location.city).contains(str(location).lower()))
    if isinstance(skills_in, list) and len(skills_in) > 0:
        skills_lower = [str(s).lower() for s in skills_in if str(s).strip()]
        if skills_lower:
            base = base.join(Job.skills).where(func.lower(Skill.name).in_(skills_lower))

    universe = base.distinct().subquery()
    total_jobs = db.execute(select(func.count()).select_from(universe)).scalar_one()
    if total_jobs == 0:
        return {"top_skills": [], "top_companies": [], "last_announcements": [], "total_jobs": 0}

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
        select(
            Job.id,
            Job.title,
            Company.name,
            Job.date,
            select(DataSource.link).where(DataSource.job_id == Job.id).limit(1).scalar_subquery().label("link"),
        )
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
            "url": r[4].strip() if len(r) > 4 and r[4] else None,
        }
        for r in last_rows
    ]

    return {"top_skills": top_skills, "top_companies": top_companies, "last_announcements": last_announcements, "total_jobs": int(total_jobs)}
