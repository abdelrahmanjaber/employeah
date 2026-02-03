from __future__ import annotations

import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import sqlalchemy as sa
from alembic import context, op


revision = "20260201_03"
down_revision = "20260201_02"
branch_labels = None
depends_on = None


_SQ_RE = re.compile(r"'([^']+)'")
_DQ_RE = re.compile(r"\"([^\"]+)\"")


def _norm(s: str) -> str:
    return " ".join(str(s).strip().split()).lower()


def _parse_date(d: str | None) -> datetime | None:
    if not d:
        return None
    try:
        return datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _parse_level(v) -> float | None:
    if v is None:
        return None
    try:
        return float(str(v))
    except Exception:
        return None


def _parse_skills(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(s).strip() for s in value if str(s).strip()]

    s = str(value).strip()
    if not s:
        return []

    if s.startswith("[") and s.endswith("]") and ("'" not in s) and ('"' not in s) and ("," not in s):
        return []

    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass

    found = _SQ_RE.findall(s) or _DQ_RE.findall(s)
    if found:
        return [f.strip() for f in found if str(f).strip()]

    if "," in s:
        return [p.strip() for p in s.split(",") if p.strip()]

    return []


def _iter_json_array(fp):
    dec = json.JSONDecoder()
    buf = ""

    while True:
        chunk = fp.read(65536)
        if not chunk:
            return
        buf += chunk
        i = 0
        while i < len(buf) and buf[i].isspace():
            i += 1
        if i < len(buf) and buf[i] == "[":
            buf = buf[i + 1 :]
            break
        buf = buf[max(0, len(buf) - 1024) :]

    while True:
        i = 0
        while True:
            while i < len(buf) and buf[i].isspace():
                i += 1
            if i < len(buf) and buf[i] == ",":
                i += 1
                continue
            break
        if i < len(buf) and buf[i] == "]":
            return
        try:
            obj, end = dec.raw_decode(buf, idx=i)
            yield obj
            buf = buf[end:]
        except ValueError:
            chunk = fp.read(65536)
            if not chunk:
                return
            buf += chunk


def upgrade() -> None:
    if context.is_offline_mode():
        return

    conn = op.get_bind()

    conn.execute(
        sa.text(
            """
            TRUNCATE
              data_source,
              job_field,
              job_location,
              job_skills,
              job,
              company,
              location,
              field
            RESTART IDENTITY CASCADE;
            """
        )
    )

    conn.execute(
        sa.text(
            """
            DELETE FROM skill s
            WHERE NOT EXISTS (SELECT 1 FROM course_skills cs WHERE cs.skill_id = s.id);
            """
        )
    )

    jobs_path = Path(__file__).resolve().parents[2] / "app" / "seed_data" / "jobs.json"
    if not jobs_path.exists():
        return

    company = sa.table("company", sa.column("id", sa.Integer()), sa.column("name", sa.Text()))
    field = sa.table("field", sa.column("id", sa.Integer()), sa.column("name", sa.Text()))
    skill = sa.table("skill", sa.column("id", sa.Integer()), sa.column("name", sa.Text()))
    location = sa.table(
        "location",
        sa.column("id", sa.Integer()),
        sa.column("continent", sa.Text()),
        sa.column("country", sa.Text()),
        sa.column("city", sa.Text()),
    )
    job = sa.table(
        "job",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.Text()),
        sa.column("date", sa.DateTime(timezone=True)),
        sa.column("salary", sa.Integer()),
        sa.column("level", sa.Float()),
        sa.column("company_id", sa.Integer()),
    )
    data_source = sa.table(
        "data_source",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.Text()),
        sa.column("link", sa.Text()),
        sa.column("job_id", sa.Integer()),
    )
    job_field = sa.table("job_field", sa.column("field_id", sa.Integer()), sa.column("job_id", sa.Integer()))
    job_skills = sa.table("job_skills", sa.column("job_id", sa.Integer()), sa.column("skill_id", sa.Integer()))
    job_location = sa.table("job_location", sa.column("job_id", sa.Integer()), sa.column("location_id", sa.Integer()))

    companies: dict[str, int] = {}
    fields: dict[str, int] = {}
    skills: dict[str, int] = { _norm(r[0]): int(r[1]) for r in conn.execute(sa.select(skill.c.name, skill.c.id)).all() if r[0] }
    locations: dict[tuple[str, str, str], int] = {}

    def get_or_create_company(name: str | None) -> int | None:
        if not name:
            return None
        name = " ".join(str(name).strip().split())
        if not name or len(name) > 255:
            return None
        k = _norm(name)
        if k in companies:
            return companies[k]
        stmt = (
            sa.dialects.postgresql.insert(company)
            .values(name=name)
            .on_conflict_do_nothing(index_elements=["name"])
            .returning(company.c.id)
        )
        cid = conn.execute(stmt).scalar_one_or_none()
        if cid is None:
            cid = conn.execute(sa.select(company.c.id).where(company.c.name == name)).scalar_one()
        companies[k] = int(cid)
        return int(cid)

    def get_or_create_field(name: str | None) -> int | None:
        if not name:
            return None
        name = " ".join(str(name).strip().split())
        if not name or len(name) > 255:
            return None
        k = _norm(name)
        if k in fields:
            return fields[k]
        stmt = (
            sa.dialects.postgresql.insert(field)
            .values(name=name)
            .on_conflict_do_nothing(index_elements=["name"])
            .returning(field.c.id)
        )
        fid = conn.execute(stmt).scalar_one_or_none()
        if fid is None:
            fid = conn.execute(sa.select(field.c.id).where(field.c.name == name)).scalar_one()
        fields[k] = int(fid)
        return int(fid)

    def get_or_create_skill(name: str) -> int:
        name = " ".join(str(name).strip().split())
        if not name:
            raise ValueError("empty skill")
        if len(name) > 100:
            raise ValueError("skill too long")
        k = _norm(name)
        if k in skills:
            return skills[k]
        stmt = (
            sa.dialects.postgresql.insert(skill)
            .values(name=name)
            .on_conflict_do_nothing(index_elements=["name"])
            .returning(skill.c.id)
        )
        sid = conn.execute(stmt).scalar_one_or_none()
        if sid is None:
            sid = conn.execute(sa.select(skill.c.id).where(skill.c.name == name)).scalar_one()
        skills[k] = int(sid)
        return int(sid)

    def get_or_create_location(continent: str | None, country: str | None, city: str | None) -> int | None:
        if not (continent or country or city):
            return None
        continent = (" ".join(str(continent).strip().split())[:100]) if continent is not None else None
        country = (" ".join(str(country).strip().split())[:100]) if country is not None else None
        city = (" ".join(str(city).strip().split())[:100]) if city is not None else None
        key = (_norm(continent or ""), _norm(country or ""), _norm(city or ""))
        if key in locations:
            return locations[key]
        stmt = (
            sa.dialects.postgresql.insert(location)
            .values(continent=continent, country=country, city=city)
            .on_conflict_do_nothing(constraint="uq_location")
            .returning(location.c.id)
        )
        lid = conn.execute(stmt).scalar_one_or_none()
        if lid is None:
            lid = conn.execute(
                sa.select(location.c.id).where(
                    sa.and_(
                        location.c.continent == continent,
                        location.c.country == country,
                        location.c.city == city,
                    )
                )
            ).scalar_one()
        locations[key] = int(lid)
        return int(lid)

    batch_size = 500
    job_rows: list[dict] = []
    job_meta: list[tuple[int | None, int | None, list[int], str | None, str | None]] = []

    def flush_batch():
        nonlocal job_rows, job_meta
        if not job_rows:
            return
        ids = conn.execute(sa.dialects.postgresql.insert(job).returning(job.c.id), job_rows).scalars().all()

        jf_rows = []
        jl_rows = []
        js_rows = []
        ds_rows = []

        for jid, meta in zip(ids, job_meta):
            field_id, location_id, skill_ids, ds_name, ds_link = meta
            if field_id is not None:
                jf_rows.append({"field_id": field_id, "job_id": int(jid)})
            if location_id is not None:
                jl_rows.append({"job_id": int(jid), "location_id": location_id})
            for sid in skill_ids:
                js_rows.append({"job_id": int(jid), "skill_id": sid})
            if ds_name or ds_link:
                ds_rows.append({"job_id": int(jid), "name": ds_name, "link": ds_link})

        if jf_rows:
            conn.execute(sa.dialects.postgresql.insert(job_field).on_conflict_do_nothing(), jf_rows)
        if jl_rows:
            conn.execute(sa.dialects.postgresql.insert(job_location).on_conflict_do_nothing(), jl_rows)
        if js_rows:
            conn.execute(sa.dialects.postgresql.insert(job_skills).on_conflict_do_nothing(), js_rows)
        if ds_rows:
            conn.execute(sa.dialects.postgresql.insert(data_source), ds_rows)

        job_rows = []
        job_meta = []

    with jobs_path.open("r", encoding="utf-8") as fp:
        for item in _iter_json_array(fp):
            title = " ".join(str(item.get("Job Title") or "").strip().split())
            if not title:
                continue

            company_id = get_or_create_company(item.get("Company"))
            field_id = get_or_create_field(item.get("Field"))
            location_id = get_or_create_location(item.get("Continent"), item.get("Country"), item.get("City"))
            date = _parse_date(item.get("Date"))
            level = _parse_level(item.get("Level"))

            skill_ids: set[int] = set()
            for s in _parse_skills(item.get("Skills")):
                try:
                    sid = get_or_create_skill(s)
                except Exception:
                    continue
                skill_ids.add(sid)

            ds_link = (str(item.get("URL")).strip() if item.get("URL") is not None else None) or None
            ds_name = (str(item.get("Website")).strip() if item.get("Website") is not None else "") or ""
            ds_name = (ds_name[:255].strip() or "unknown")

            job_rows.append({"title": title, "date": date, "company_id": company_id, "level": level})
            job_meta.append((field_id, location_id, list(skill_ids), ds_name, ds_link))

            if len(job_rows) >= batch_size:
                flush_batch()
        flush_batch()


def downgrade() -> None:
    pass

