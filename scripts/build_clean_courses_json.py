from __future__ import annotations

import argparse
import ast
import csv
import json
import re
from pathlib import Path


_SQ_RE = re.compile(r"'([^']+)'")
_DQ_RE = re.compile(r"\"([^\"]+)\"")


def parse_skills(value: str | None) -> list[str]:
    if value is None:
        return []
    s = str(value).strip()
    if not s:
        return []

    try:
        parsed = ast.literal_eval(s)
        if isinstance(parsed, list):
            out = []
            for x in parsed:
                t = " ".join(str(x).strip().split())
                if t:
                    out.append(t)
            return out
    except Exception:
        pass

    found = _SQ_RE.findall(s) or _DQ_RE.findall(s)
    if found:
        return [" ".join(f.strip().split()) for f in found if f.strip()]

    if "," in s:
        return [" ".join(p.strip().split()) for p in s.split(",") if p.strip()]
    return []


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    default_in = repo_root / "backend" / "app" / "seed_data" / "courses.csv"
    default_out = repo_root / "backend" / "app" / "seed_data" / "courses.json"

    ap = argparse.ArgumentParser(description="Build clean courses.json from courses.csv")
    ap.add_argument("--input", type=Path, default=default_in)
    ap.add_argument("--output", type=Path, default=default_out)
    ap.add_argument("--pretty", action="store_true")
    args = ap.parse_args()

    rows = []
    with args.input.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            title = " ".join((r.get("Title") or "").strip().split())
            if not title:
                continue
            rows.append(
                {
                    "Title": title,
                    "Semester": " ".join((r.get("Semester") or "").strip().split()) or None,
                    "Skills": parse_skills(r.get("Skills")),
                    "URL": (r.get("URL") or "").strip() or None,
                }
            )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as out:
        if args.pretty:
            json.dump(rows, out, ensure_ascii=False, indent=2)
            out.write("\n")
        else:
            json.dump(rows, out, ensure_ascii=False)
            out.write("\n")

    print(f"Wrote {len(rows)} courses to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

