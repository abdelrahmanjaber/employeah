from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Company, Course, Job, Location, Skill


SEED_PATH_DEFAULT = Path(__file__).parent / "seed_data" / "mock_data.json"


@dataclass
class Cache:
    companies: dict[str, Company]
    locations: dict[str, Location]
    skills: dict[str, Skill]
    courses: dict[str, Course]


def _norm(s: str) -> str:
    return " ".join(s.strip().split()).lower()


def _parse_date(d: str | None) -> datetime | None:
    if not d:
        return None
    dt = datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return dt


def get_or_create_company(db: Session, cache: Cache, name: str | None) -> Company | None:
    if not name:
        return None
    k = _norm(name)
    if k in cache.companies:
        return cache.companies[k]
    obj = db.query(Company).filter(Company.name == name).one_or_none()
    if obj is None:
        obj = Company(name=name)
        db.add(obj)
        db.flush()
    cache.companies[k] = obj
    return obj


def get_or_create_location(db: Session, cache: Cache, city: str | None) -> Location | None:
    if not city:
        return None
    k = _norm(city)
    if k in cache.locations:
        return cache.locations[k]
    obj = db.query(Location).filter(Location.city == city).one_or_none()
    if obj is None:
        obj = Location(city=city, country=None, continent=None)
        db.add(obj)
        db.flush()
    cache.locations[k] = obj
    return obj


def get_or_create_skill(db: Session, cache: Cache, name: str) -> Skill:
    k = _norm(name)
    if k in cache.skills:
        return cache.skills[k]
    obj = db.query(Skill).filter(Skill.name == name).one_or_none()
    if obj is None:
        obj = Skill(name=name, description=None)
        db.add(obj)
        db.flush()
    cache.skills[k] = obj
    return obj


def get_or_create_course(
    db: Session,
    cache: Cache,
    title: str,
    semester: str | None,
    url: str | None,
) -> Course:
    k = _norm(title)
    if k in cache.courses:
        obj = cache.courses[k]
    else:
        obj = db.query(Course).filter(Course.title == title).one_or_none()
        if obj is None:
            obj = Course(title=title)
            db.add(obj)
            db.flush()
        cache.courses[k] = obj

    obj.semester = semester
    obj.url = url
    return obj


def upsert_job(db: Session, cache: Cache, item: dict) -> Job:
    job_id = item.get("id")
    title = item.get("title")
    if not title:
        raise ValueError("Job missing title")

    obj = None
    if job_id is not None:
        obj = db.query(Job).filter(Job.id == int(job_id)).one_or_none()

    if obj is None:
        obj = Job(
            id=int(job_id) if job_id is not None else None,
            title=title,
        )
        db.add(obj)
        db.flush()

    obj.title = title
    obj.date = _parse_date(item.get("date_posted"))
    obj.salary = item.get("salary")
    obj.description = item.get("description")

    comp = get_or_create_company(db, cache, item.get("company"))
    obj.company = comp

    loc = get_or_create_location(db, cache, item.get("location"))
    if loc is not None:
        obj.locations = [loc]
    else:
        obj.locations = []

    skills = item.get("skills") or []
    obj.skills = [get_or_create_skill(db, cache, s) for s in skills if str(s).strip()]
    return obj


def reset_db(db: Session) -> None:
    db.execute(
        text(
            """
            TRUNCATE
              job_skills,
              job_location,
              course_skills,
              university_course,
              job_field,
              data_source,
              job,
              course,
              company,
              skill,
              location,
              field,
              university
            RESTART IDENTITY CASCADE;
            """
        )
    )


def seed(seed_path: Path, reset: bool) -> None:
    raw = json.loads(seed_path.read_text(encoding="utf-8"))
    jobs = raw.get("jobs") or []
    courses = raw.get("courses") or []

    with SessionLocal() as db:
        if reset:
            reset_db(db)
            db.commit()

        cache = Cache(companies={}, locations={}, skills={}, courses={})

        for c in courses:
            title = c.get("title")
            if not title:
                continue
            course = get_or_create_course(db, cache, title=title, semester=c.get("semester"), url=c.get("url"))
            course.skills = [get_or_create_skill(db, cache, s) for s in (c.get("skills") or []) if str(s).strip()]

        for j in jobs:
            upsert_job(db, cache, j)

        db.commit()

        db.execute(text("SELECT setval('job_id_seq', COALESCE((SELECT MAX(id) FROM job), 1), true);"))
        db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Postgres with frontend mock data.")
    parser.add_argument("--path", type=str, default=str(SEED_PATH_DEFAULT), help="Path to mock_data.json")
    parser.add_argument("--reset", action="store_true", help="Wipe DB tables before seeding")
    args = parser.parse_args()

    seed_path = Path(args.path)
    if not seed_path.exists():
        raise FileNotFoundError(f"Seed file not found: {seed_path}. Run scripts/export_mock_data.mjs first.")

    seed(seed_path=seed_path, reset=args.reset)


if __name__ == "__main__":
    main()


