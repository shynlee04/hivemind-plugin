#!/usr/bin/env bash
set -euo pipefail

# Non-interactive environment
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat GCM_INTERACTIVE=never

# ── Usage ──────────────────────────────────────────────────────────────────────
usage() {
  echo "Usage: ingest-repo.sh <owner/repo> [output-dir]" >&2
  echo "" >&2
  echo "Fetch a GitHub repository and extract skill-related files." >&2
  echo "" >&2
  echo "Arguments:" >&2
  echo "  owner/repo   GitHub repository (e.g. user/my-project)" >&2
  echo "  output-dir   Output directory (default: /tmp/skill-ingest-$$)" >&2
  exit 1
}

# ── Parse args ─────────────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
  usage
fi
REPO="$1"
OUTPUT_DIR="${2:-/tmp/skill-ingest-$$}"

# Validate owner/repo format
if [[ ! "$REPO" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]; then
  echo '{"error": "invalid_repo", "message": "Repository must be in owner/repo format."}' >&2
  exit 1
fi

# ── Setup ──────────────────────────────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"
PACKED_FILE="$OUTPUT_DIR/packed.xml"
ERROR_LOG="$OUTPUT_DIR/repomix-err.log"

# ── Cleanup trap ───────────────────────────────────────────────────────────────
cleanup() {
  rm -f "$ERROR_LOG"
}
trap cleanup EXIT

# ── Run repomix ────────────────────────────────────────────────────────────────
if ! timeout 120 repomix --remote "$REPO" \
  --include "**/SKILL.md,**/skills/**/*.md,**/evals/**/*.json,**/references/**/*.md" \
  --style xml \
  -o "$PACKED_FILE" 2>"$ERROR_LOG"; then
  err=$(cat "$ERROR_LOG" 2>/dev/null || echo "unknown error")
  if echo "$err" | grep -qiE "not found|private|404"; then
    echo '{"error": "repo_not_found", "message": "Repository not found or is private."}' >&2
  elif echo "$err" | grep -qiE "timeout|timed out"; then
    echo '{"error": "timeout", "message": "Ingestion timed out after 120s."}' >&2
  else
    echo "{\"error\": \"repomix_failed\", \"message\": \"$(echo "$err" | head -1)\"}" >&2
  fi
  exit 1
fi

# ── Validate output ────────────────────────────────────────────────────────────
if [ ! -f "$PACKED_FILE" ]; then
  echo '{"error": "no_output", "message": "Repomix did not produce output file."}' >&2
  exit 1
fi

# ── Extract SKILL.md paths and count lines ─────────────────────────────────────
skills_found=0
total_lines=0
files_json="[]"

while IFS= read -r filepath; do
  [ -z "$filepath" ] && continue
  skills_found=$((skills_found + 1))

  # Count lines for this file from the packed XML
  # repomix XML format: <file path="...">content</file>
  # Extract content between tags and count lines
  file_lines=$(sed -n "/<file path=\"${filepath//\//\\/}\">/,/<\/file>/p" "$PACKED_FILE" \
    | sed '1d;$d' \
    | wc -l || echo 0)

  total_lines=$((total_lines + file_lines))

  # Build JSON array entry
  files_json=$(echo "$files_json" | jq --arg p "$filepath" --argjson l "$file_lines" \
    '. + [{"path": $p, "lines": $l}]')
done < <(grep -oP '(?<=<file path=")[^"]*SKILL\.md[^"]*(?=")' "$PACKED_FILE" || true)

# ── Check for empty results ───────────────────────────────────────────────────
if [ "$skills_found" -eq 0 ]; then
  echo '{"error": "no_skills_found", "message": "No SKILL.md files found. Try a broader --include pattern."}' >&2
  exit 1
fi

# ── Output JSON report ────────────────────────────────────────────────────────
jq -n \
  --arg repo "$REPO" \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson skills "$skills_found" \
  --argjson files "$files_json" \
  --argjson total "$total_lines" \
  --arg outfile "$PACKED_FILE" \
  '{
    repo: $repo,
    timestamp: $ts,
    skills_found: $skills,
    files: $files,
    total_lines: $total,
    output_file: $outfile
  }'

exit 0
