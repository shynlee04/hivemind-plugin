#!/usr/bin/env bash
# schema-guard.sh — Atomic git snapshot + frontmatter preservation for framework assets
# Enforces that YAML frontmatter/schema/SOT modifications NEVER silently drop user-set fields.
#
# Usage:
#   schema-guard.sh snapshot <filepath> [workdir]  — Save pre-edit snapshot
#   schema-guard.sh verify  <filepath> [workdir]  — After edit, verify no keys removed
#   schema-guard.sh diff    <filepath> [workdir]  — Show frontmatter changes
#   schema-guard.sh commit  <filepath> [workdir]  — Atomic git commit of single file
#
# Exit codes: 0=success, 1=violation/error
# Output: JSON to stdout (machine-parseable)

set -Eeuo pipefail

readonly ACTION="${1:-}"
readonly FILEPATH_ARG="${2:-}"
readonly WORKDIR="${3:-.}"

# --- Helpers ---

die() { printf '{"error": "%s"}\n' "$1" >&2; exit 1; }

resolve_path() {
  local path="$1"
  if [[ "${path:0:1}" != "/" ]]; then
    path="$WORKDIR/$path"
  fi
  printf '%s' "$path"
}

relative_path() {
  local full="$1" base="$2"
  # Portable relative path (works on macOS without realpath --relative-to)
  python3 -c "import os; print(os.path.relpath('$full', '$base'))" 2>/dev/null || printf '%s' "$full"
}

# Extract YAML frontmatter key names (top-level only) from a markdown file
extract_frontmatter_keys() {
  local file="$1"
  if [[ ! -f "$file" ]]; then return; fi
  sed -n '2,/^---$/p' "$file" 2>/dev/null | \
    grep -v '^---$' | \
    grep -E '^[a-zA-Z_][a-zA-Z0-9_-]*:' | \
    sed 's/:.*//' | \
    sort
}

# Extract full frontmatter block (between first and second ---)
extract_frontmatter() {
  local file="$1"
  if [[ ! -f "$file" ]]; then return; fi
  sed -n '/^---$/,/^---$/p' "$file" 2>/dev/null
}

# --- Validate inputs ---

if [[ -z "$ACTION" || -z "$FILEPATH_ARG" ]]; then
  die "Usage: schema-guard.sh <snapshot|verify|diff|commit> <filepath> [workdir]"
fi

FILEPATH="$(resolve_path "$FILEPATH_ARG")"

if [[ "$ACTION" != "commit" && ! -f "$FILEPATH" ]]; then
  die "File not found: $FILEPATH"
fi

# Guard file stores pre-edit frontmatter for comparison
GUARD_FILE="${FILEPATH}.guard"

# --- Actions ---

do_snapshot() {
  # Save frontmatter snapshot for later verification
  extract_frontmatter "$FILEPATH" > "$GUARD_FILE"

  local relpath
  relpath="$(relative_path "$FILEPATH" "$WORKDIR")"

  printf '{"action":"snapshot","file":"%s","guard":"%s","status":"saved"}\n' \
    "$relpath" "$GUARD_FILE"
}

do_verify() {
  if [[ ! -f "$GUARD_FILE" ]]; then
    printf '{"action":"verify","status":"no_guard","message":"No pre-edit snapshot. Run snapshot before editing."}\n'
    return 0
  fi

  local before_keys after_keys removed_keys
  before_keys="$(grep -v '^---$' "$GUARD_FILE" | grep -E '^[a-zA-Z_]' | sed 's/:.*//' | sort || true)"
  after_keys="$(extract_frontmatter_keys "$FILEPATH")"

  removed_keys="$(comm -23 <(printf '%s\n' "$before_keys") <(printf '%s\n' "$after_keys") || true)"

  if [[ -n "$removed_keys" ]]; then
    local removed_list
    removed_list="$(printf '%s' "$removed_keys" | tr '\n' ',' | sed 's/,$//')"
    printf '{"action":"verify","status":"VIOLATION","removed_keys":"%s","message":"BLOCKED: Frontmatter keys silently removed. Guard file preserved for recovery: %s"}\n' \
      "$removed_list" "$GUARD_FILE"
    return 1
  fi

  # All keys preserved — clean up guard
  rm -f "$GUARD_FILE"
  printf '{"action":"verify","status":"clean","message":"All frontmatter keys preserved"}\n'
}

do_diff() {
  if [[ ! -f "$GUARD_FILE" ]]; then
    printf '{"action":"diff","status":"no_guard"}\n'
    return 0
  fi

  local current_fm saved_fm
  current_fm="$(extract_frontmatter "$FILEPATH")"
  saved_fm="$(cat "$GUARD_FILE")"

  if [[ "$current_fm" == "$saved_fm" ]]; then
    printf '{"action":"diff","status":"unchanged"}\n'
  else
    printf '--- BEFORE (guard)\n%s\n--- AFTER (current)\n%s\n' "$saved_fm" "$current_fm"
  fi
}

do_commit() {
  # Atomic git commit of a single file with descriptive message
  local relpath
  relpath="$(relative_path "$FILEPATH" "$WORKDIR")"

  cd "$WORKDIR"
  if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    die "Not a git repository: $WORKDIR"
  fi

  # Check if file has changes
  if git diff --quiet -- "$relpath" 2>/dev/null && git diff --cached --quiet -- "$relpath" 2>/dev/null; then
    printf '{"action":"commit","status":"no_changes","file":"%s"}\n' "$relpath"
    return 0
  fi

  git add -- "$relpath"
  local commit_hash
  commit_hash="$(git commit -m "schema-guard: atomic save $relpath" -- "$relpath" 2>/dev/null | head -1 || echo "commit-failed")"

  printf '{"action":"commit","status":"committed","file":"%s","commit":"%s"}\n' \
    "$relpath" "$commit_hash"
}

# --- Dispatch ---

case "$ACTION" in
  snapshot) do_snapshot ;;
  verify)   do_verify ;;
  diff)     do_diff ;;
  commit)   do_commit ;;
  *)        die "Unknown action: $ACTION. Valid: snapshot, verify, diff, commit" ;;
esac
