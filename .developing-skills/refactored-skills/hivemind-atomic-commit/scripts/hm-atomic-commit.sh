#!/usr/bin/env bash
# hm-atomic-commit.sh — Stage + commit with typed message → JSON result to stdout
set -uo pipefail

PROJECT_ROOT="" COMMIT_TYPE="" COMMIT_SCOPE="" COMMIT_DESC="" ROLLBACK="revert-commit" DRY_RUN="false"
FILES=() CLASSES=()

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --cwd) PROJECT_ROOT="$2"; shift 2 ;;
      --type) COMMIT_TYPE="$2"; shift 2 ;;
      --scope) COMMIT_SCOPE="$2"; shift 2 ;;
      --desc) COMMIT_DESC="$2"; shift 2 ;;
      --rollback) ROLLBACK="$2"; shift 2 ;;
      --dry-run) DRY_RUN="true"; shift ;;
      --classes) shift; while [[ $# -gt 0 && "$1" != --* ]]; do CLASSES+=("$1"); shift; done ;;
      --files) shift; while [[ $# -gt 0 && "$1" != --* ]]; do FILES+=("$1"); shift; done ;;
      --help) echo "Usage: hm-atomic-commit.sh --files FILE... --type TYPE --scope SCOPE --desc DESC [options]"; exit 0 ;;
      *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done
  if [[ -z "$COMMIT_TYPE" ]]; then echo '{"error":"--type is required"}' >&2; exit 1; fi
  if [[ -z "$COMMIT_DESC" ]]; then echo '{"error":"--desc is required"}' >&2; exit 1; fi
  if [[ ${#FILES[@]} -eq 0 ]]; then echo '{"error":"--files is required"}' >&2; exit 1; fi
  PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
}

ts_now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

validate_type() { echo "feat fix refactor docs test chore perf ci build revert" | grep -qw "$COMMIT_TYPE"; }

build_msg() {
  local msg; if [[ -n "$COMMIT_SCOPE" ]]; then msg="${COMMIT_TYPE}(${COMMIT_SCOPE}): ${COMMIT_DESC}"
  else msg="${COMMIT_TYPE}: ${COMMIT_DESC}"; fi; echo "$msg"
}

build_footer() {
  local cj="[\""; fj="[\""
  for i in "${!CLASSES[@]}"; do [[ $i -gt 0 ]] && cj="${cj}\",\""; cj="${cj}${CLASSES[$i]}"; done; cj="${cj}\"]"
  for i in "${!FILES[@]}"; do [[ $i -gt 0 ]] && fj="${fj}\",\""; fj="${fj}${FILES[$i]}"; done; fj="${fj}\"]"
  printf "\nactivity_classes: %s\nactivity_files: %s\nrollback_method: %s\ngate_passed: %s" "$cj" "$fj" "$ROLLBACK" "$(ts_now)"
}

json_arr() { local a=("$@") j=""; for i in "${!a[@]}"; do [[ $i -gt 0 ]] && j="${j},"; j="${j}\"${a[$i]}\""; done; echo "[${j}]"; }

parse_args "$@"
if ! validate_type; then echo "{\"error\":\"invalid type: ${COMMIT_TYPE}\"}" >&2; exit 1; fi

STAGED=0; FAILED=""
for f in "${FILES[@]}"; do
  git -C "$PROJECT_ROOT" add "$f" 2>/dev/null && STAGED=$((STAGED + 1)) || FAILED="${FAILED}${f} "
done
if [[ "$STAGED" -eq 0 ]]; then echo "{\"error\":\"no files staged\",\"failed\":\"${FAILED}\"}" >&2; exit 1; fi

MSG=$(build_msg)
if [[ "$DRY_RUN" == "true" ]]; then
  echo "{\"action\":\"dry_run\",\"message\":\"${MSG}\",\"staged_count\":${STAGED},\"files\":$(json_arr "${FILES[@]}"),\"rollback_method\":\"${ROLLBACK}\"}"
  exit 0
fi

FULL_MSG="${MSG}$(build_footer)"
OUT=$(git -C "$PROJECT_ROOT" commit -m "$FULL_MSG" 2>&1 || true)
SHA=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo "")
BR=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

if echo "$OUT" | grep -qiE "error|nothing to commit"; then
  echo "{\"action\":\"commit\",\"success\":false,\"error\":\"${OUT}\",\"staged_count\":${STAGED}}" >&2; exit 1
fi

echo "{\"action\":\"commit\",\"success\":true,\"sha\":\"${SHA}\",\"branch\":\"${BR}\",\"message\":\"${MSG}\",\"staged_count\":${STAGED},\"files\":$(json_arr "${FILES[@]}"),\"activity_classes\":$(json_arr "${CLASSES[@]}"),\"rollback_method\":\"${ROLLBACK}\",\"timestamp\":\"$(ts_now)\"}"
