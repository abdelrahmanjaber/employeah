from __future__ import annotations

import argparse
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

    found = _SQ_RE.findall(s) or _DQ_RE.findall(s)
    if not found:
        if "," in s:
            found = [p.strip() for p in s.split(",") if p.strip()]
        else:
            return []

    out: list[str] = []
    for f in found:
        t = " ".join(str(f).replace("\n", " ").strip().split())
        if not t:
            continue
        if len(t) > 255:
            continue
        out.append(t)
    return out


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    default_in = repo_root / "backend" / "app" / "seed_data" / "jobs.csv"
    default_out = repo_root / "backend" / "app" / "seed_data" / "jobs.json"

    ap = argparse.ArgumentParser(description="Build clean jobs.json from jobs.csv")
    ap.add_argument("--input", type=Path, default=default_in)
    ap.add_argument("--output", type=Path, default=default_out)
    ap.add_argument("--pretty", action="store_true")
    args = ap.parse_args()

    rows = []
    with args.input.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            title = " ".join((r.get("Job Title") or "").strip().split())
            if not title:
                continue

            continent = " ".join((r.get("Continent") or "").strip().split()) or None
            country = " ".join((r.get("Country") or "").strip().split()) or None
            city = " ".join((r.get("City") or "").strip().split()) or None
            date = (r.get("Date") or "").strip() or None
            company = " ".join((r.get("Company") or "").strip().split()) or None
            url = (r.get("URL") or "").strip() or None
            website = " ".join((r.get("Website") or "").strip().split()) or "unknown"
            level = (r.get("Level") or "").strip() or None
            field = " ".join((r.get("Field") or "").strip().split()) or None

            rows.append(
                {
                    "Job Title": title,
                    "Continent": continent,
                    "Country": country,
                    "City": city,
                    "Date": date,
                    "Company": company,
                    "URL": url,
                    "Website": website,
                    "Level": level,
                    "Field": field,
                    "Skills": parse_skills(r.get("Skills")),
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

    print(f"Wrote {len(rows)} jobs to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

