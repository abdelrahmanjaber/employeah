from __future__ import annotations

import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import sqlalchemy as sa
from alembic import context, op


revision = "20260201_02"
down_revision = "20260201_01"
branch_labels = None
depends_on = None


_SKILL_RE = re.compile(r"'([^']+)'")
_SKILL_DQ_RE = re.compile(r"\"([^\"]+)\"")


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

    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass

    found = _SKILL_RE.findall(s) or _SKILL_DQ_RE.findall(s)
    if found:
        return [f.strip() for f in found if str(f).strip()]

    return [p.strip() for p in s.split(",") if p.strip()]


def _iter_json_array(fp):
    decoder = json.JSONDecoder()
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
            obj, end = decoder.raw_decode(buf, idx=i)
            yield obj
            buf = buf[end:]
        except ValueError:
            chunk = fp.read(65536)
            if not chunk:
                return
            buf += chunk


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def has_column(table: str, col: str) -> bool:
        if not insp.has_table(table):
            return False
        return col in {c["name"] for c in insp.get_columns(table)}

    if not has_column("job", "level"):
        op.add_column("job", sa.Column("level", sa.Float(), nullable=True))

    if has_column("job", "description"):
        op.drop_column("job", "description")


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def has_column(table: str, col: str) -> bool:
        if not insp.has_table(table):
            return False
        return col in {c["name"] for c in insp.get_columns(table)}

    if has_column("job", "level"):
        op.drop_column("job", "level")

