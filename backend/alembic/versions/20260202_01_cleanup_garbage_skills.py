from __future__ import annotations

import re

import sqlalchemy as sa
from alembic import context, op


revision = "20260202_01"
down_revision = "20260201_03"
branch_labels = None
depends_on = None


_WORD_RE = re.compile(r"[A-Za-z]{2,}")


def _is_garbage_skill(name: str) -> bool:
    s = " ".join(str(name).strip().split())
    if not s:
        return True

    if len(s) > 100:
        return True

    spaces = s.count(" ")
    transitions = sum(1 for i in range(1, len(s)) if s[i].isupper() and s[i - 1].islower())
    words = _WORD_RE.findall(s)

    if len(s) >= 25 and spaces <= 2 and transitions >= 3 and len(words) >= 4:
        return True

    if len(s) >= 40 and spaces <= 1 and len(words) >= 6:
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

