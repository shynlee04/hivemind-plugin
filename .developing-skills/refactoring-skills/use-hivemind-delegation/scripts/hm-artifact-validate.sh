#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

pass() {
  printf 'PASS: %s\n' "$1"
}

[[ $# -eq 1 ]] || fail "usage: hm-artifact-validate.sh <path>"

artifact_path="$1"
[[ -f "$artifact_path" ]] || fail "file not found: $artifact_path"

artifact_name="$(basename "$artifact_path")"
[[ "$artifact_name" =~ -[0-9]{4}-[0-9]{2}-[0-9]{2}\.[A-Za-z0-9]+$ ]] || fail "filename must end with -YYYY-MM-DD.ext"

python3 - "$artifact_path" <<'PY'
from pathlib import Path
import json
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
markers = ("TODO", "FIXME", "PLACEHOLDER")
for marker in markers:
    if marker in text:
        print(f"FAIL: placeholder marker found: {marker}", file=sys.stderr)
        sys.exit(1)

if path.suffix.lower() == ".json":
    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        print(f"FAIL: invalid JSON: {exc}", file=sys.stderr)
        sys.exit(1)

    meta = data.get("_meta")
    if not isinstance(meta, dict):
        print("FAIL: missing top-level _meta object", file=sys.stderr)
        sys.exit(1)

    missing = [key for key in ("created_at", "updated_at", "producer") if not meta.get(key)]
    if missing:
        print(f"FAIL: missing _meta fields: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

print("PASS: content validation succeeded")
PY

pass "artifact validation succeeded for $artifact_path"
