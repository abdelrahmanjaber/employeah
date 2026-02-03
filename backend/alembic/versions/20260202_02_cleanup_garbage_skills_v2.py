from __future__ import annotations

import re

import sqlalchemy as sa
from alembic import context, op


revision = "20260202_02"
down_revision = "20260202_01"
branch_labels = None
depends_on = None


_SEG_RE = re.compile(r"[A-Z]{2,}(?=[A-Z][a-z]|\b)|[A-Z]?[a-z]+|[0-9]+")


def _is_garbage_skill(name: str) -> bool:
    s = " ".join(str(name).strip().split())
    if not s:
        return True

    if "," in s or ";" in s:
        return False

    spaces = s.count(" ")
    if spaces > 3:
        return False

    segments = _SEG_RE.findall(s.replace("&", " ").replace("/", " ").replace("-", " "))
    seg_count = len([seg for seg in segments if seg])

    if len(s) >= 20 and seg_count >= 6:
        return True

    return False


def upgrade() -> None:
    if context.is_offline_mode():
        return

    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            """
            SELECT s.id, s.name
            FROM skill s
            WHERE NOT EXISTS (SELECT 1 FROM course_skills cs WHERE cs.skill_id = s.id)
            """
        )
    ).all()

    bad_ids = [int(r[0]) for r in rows if _is_garbage_skill(r[1])]
    if not bad_ids:
        return

    conn.execute(sa.text("DELETE FROM job_skills WHERE skill_id = ANY(:ids)"), {"ids": bad_ids})
    conn.execute(sa.text("DELETE FROM skill WHERE id = ANY(:ids)"), {"ids": bad_ids})


def downgrade() -> None:
    pass

