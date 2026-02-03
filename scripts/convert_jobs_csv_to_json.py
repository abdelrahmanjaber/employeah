#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


def _indent_json_text(json_text: str, prefix: str) -> str:
    return "\n".join(prefix + line if line else line for line in json_text.splitlines())


def convert_csv_to_json_array(input_csv: Path, output_json: Path, *, pretty: bool) -> None:
    with input_csv.open("r", encoding="utf-8-sig", newline="") as f_in, output_json.open(
        "w", encoding="utf-8"
    ) as f_out:
        reader = csv.DictReader(f_in)
        f_out.write("[\n")

        first = True
        for row in reader:
            if first:
                first = False
            else:
                f_out.write(",\n")

            if pretty:
                obj = json.dumps(row, ensure_ascii=False, indent=2)
                f_out.write(_indent_json_text(obj, "  "))
            else:
                f_out.write(json.dumps(row, ensure_ascii=False))

        f_out.write("\n]\n")


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    default_in = repo_root / "backend" / "app" / "seed_data" / "jobs.csv"
    default_out = repo_root / "backend" / "app" / "seed_data" / "jobs.json"

    parser = argparse.ArgumentParser(description="Convert jobs.csv to jobs.json (JSON array).")
    parser.add_argument("--input", type=Path, default=default_in, help="Path to input CSV.")
    parser.add_argument("--output", type=Path, default=default_out, help="Path to output JSON.")
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON (indented, larger file).",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input CSV not found: {args.input}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    convert_csv_to_json_array(args.input, args.output, pretty=args.pretty)
    print(f"Wrote: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

