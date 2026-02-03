from __future__ import annotations

import ast
import json
from pathlib import Path

import sqlalchemy as sa
from alembic import context, op


revision = "20260201_01"
down_revision = "20260108_01"
branch_labels = None
depends_on = None


def _parse_skills(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(s).strip() for s in value if str(s).strip()]
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return []
        try:
            parsed = ast.literal_eval(s)
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
        return [p.strip() for p in s.split(",") if p.strip()]
    return []


def upgrade() -> None:
    op.add_column("course", sa.Column("description", sa.Text(), nullable=True))

    if context.is_offline_mode():
        return

    courses_path = Path(__file__).resolve().parents[2] / "app" / "seed_data" / "courses.json"
    if not courses_path.exists():
        return

    raw = json.loads(courses_path.read_text(encoding="utf-8"))
    if not isinstance(raw, list) or len(raw) == 0:
        return

    conn = op.get_bind()

    course = sa.table(
        "course",
        sa.column("id", sa.Integer()),
        sa.column("title", sa.Text()),
        sa.column("semester", sa.Text()),
        sa.column("url", sa.Text()),
        sa.column("description", sa.Text()),
    )
    skill = sa.table(
        "skill",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.Text()),
    )
    course_skills = sa.table(
        "course_skills",
        sa.column("course_id", sa.Integer()),
        sa.column("skill_id", sa.Integer()),
    )

    for item in raw:
        title = (item.get("Title") or "").strip()
        if not title:
            continue

        semester = item.get("Semester")
        url = item.get("URL")
        description = item.get("Description")

        course_stmt = (
            sa.dialects.postgresql.insert(course)
            .values(title=title, semester=semester, url=url, description=description)
            .on_conflict_do_update(
                index_elements=["title"],
                set_={
                    "semester": semester,
                    "url": url,
                    "description": description,
                },
            )
            .returning(course.c.id)
        )
        course_id = conn.execute(course_stmt).scalar_one()

        for s in _parse_skills(item.get("Skills")):
            skill_stmt = (
                sa.dialects.postgresql.insert(skill)
                .values(name=s)
                .on_conflict_do_nothing(index_elements=["name"])
                .returning(skill.c.id)
            )
            skill_id = conn.execute(skill_stmt).scalar_one_or_none()
            if skill_id is None:
                skill_id = conn.execute(sa.select(skill.c.id).where(skill.c.name == s)).scalar_one()

            link_stmt = (
                sa.dialects.postgresql.insert(course_skills)
                .values(course_id=course_id, skill_id=skill_id)
                .on_conflict_do_nothing(index_elements=["course_id", "skill_id"])
            )
            conn.execute(link_stmt)


def downgrade() -> None:
    op.drop_column("course", "description")

