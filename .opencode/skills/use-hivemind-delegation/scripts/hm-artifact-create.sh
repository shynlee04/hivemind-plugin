#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

[[ $# -ge 4 && $# -le 5 ]] || fail "usage: hm-artifact-create.sh <category> <semantic-id> <producer> <extension> [output-dir]"

category="$1"
semantic_id="$2"
producer="$3"
extension="${4#.}"
output_dir="${5:-.}"

[[ -n "$category" ]] || fail "category is required"
[[ -n "$semantic_id" ]] || fail "semantic-id is required"
[[ -n "$producer" ]] || fail "producer is required"
[[ -n "$extension" ]] || fail "extension is required"

filename_date="$(date -u +%Y-%m-%d)"
timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
filename="${category}-${semantic_id}-${filename_date}.${extension}"
output_path="${output_dir%/}/${filename}"

mkdir -p "$(dirname "$output_path")"

if [[ "$extension" == "json" ]]; then
  cat > "$output_path" <<EOF
{
  "_meta": {
    "created_at": "$timestamp",
    "updated_at": "$timestamp",
    "producer": "$producer",
    "producer_version": "1.0.0",
    "parent_packet_id": null
  }
}
EOF
else
  : > "$output_path"
fi

printf '%s\n' "$output_path"
