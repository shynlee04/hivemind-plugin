#!/usr/bin/env bash

set -euo pipefail

usage() {
  printf 'Usage: %s <research-output.json> [min-evidence]\n' "$0" >&2
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit 1
fi

json_path=$1
min_evidence=${2:-1}

if [[ ! -f "$json_path" ]]; then
  printf 'ERROR: file not found: %s\n' "$json_path" >&2
  exit 1
fi

if ! [[ "$min_evidence" =~ ^[0-9]+$ ]]; then
  printf 'ERROR: min-evidence must be an integer, got: %s\n' "$min_evidence" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  printf 'ERROR: python3 is required for JSON validation\n' >&2
  exit 1
fi

python3 - "$json_path" "$min_evidence" <<'PY'
import json
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
min_evidence = int(sys.argv[2])
iso_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
placeholder_pattern = re.compile(r"\b(TODO|TBD|FIXME)\b|<[^>]+>|\[(insert|fill|placeholder)[^\]]*\]", re.IGNORECASE)

try:
    data = json.loads(path.read_text())
except Exception as exc:
    print(f"ERROR: invalid JSON: {exc}")
    sys.exit(1)

errors = []

meta = data.get("_meta")
if not isinstance(meta, dict):
    errors.append("missing _meta object")
else:
    for field in ("created_at", "updated_at"):
        value = meta.get(field)
        if not isinstance(value, str) or not iso_pattern.match(value):
            errors.append(f"invalid or missing _meta.{field}")

evidence = data.get("evidence")
if not isinstance(evidence, list):
    errors.append("missing evidence array")
    evidence = []

if len(evidence) < min_evidence:
    errors.append(f"evidence count {len(evidence)} is below threshold {min_evidence}")

for index, item in enumerate(evidence, start=1):
    if not isinstance(item, dict):
        errors.append(f"evidence[{index}] is not an object")
        continue
    score = item.get("credibility_score")
    if not isinstance(score, (int, float)):
        errors.append(f"evidence[{index}] missing credibility_score")
    breakdown = item.get("credibility_breakdown")
    if not isinstance(breakdown, dict):
        errors.append(f"evidence[{index}] missing credibility_breakdown")

def walk(value):
    if isinstance(value, str):
        if placeholder_pattern.search(value):
            errors.append(f"placeholder text detected: {value[:80]}")
    elif isinstance(value, dict):
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(data)

if errors:
    print("VALIDATION FAILED")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("VALIDATION PASSED")
print(f"- file: {path}")
print(f"- evidence_count: {len(evidence)}")
print(f"- min_evidence: {min_evidence}")
PY
