#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: hm-refactor-verify.sh [file ...]

Runs a pre/post refactor verification bundle.

Arguments:
  file ...   Optional file list used to scope git diff --stat output.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

declare -a TARGET_FILES=("$@")
declare -a VERIFY_COMMANDS=(
  "npx tsc --noEmit"
  "npm test"
  "npm run lint"
  "npm run build"
)

run_cmd() {
  local label="$1"
  local command="$2"

  printf '\n[%s]\n' "$label"
  if bash -lc "$command"; then
    printf '[status] PASS\n'
  else
    printf '[status] FAIL\n'
    return 1
  fi
}

diff_stat() {
  if ((${#TARGET_FILES[@]} > 0)); then
    git diff --stat -- "${TARGET_FILES[@]}"
  else
    git diff --stat
  fi
}

rollback_command() {
  if ((${#TARGET_FILES[@]} > 0)); then
    printf 'git checkout --'
    for file in "${TARGET_FILES[@]}"; do
      printf ' %q' "$file"
    done
    printf '\n'
  else
    printf 'git checkout -- .\n'
  fi
}

printf '== Refactor Verification ==\n'
printf 'Timestamp: %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

printf '\n== Pre/Post Snapshot ==\n'
if ! diff_stat; then
  printf 'Unable to compute git diff --stat.\n' >&2
fi

printf '\n== Verification Gates ==\n'
for command in "${VERIFY_COMMANDS[@]}"; do
  run_cmd "$command" "$command"
done

printf '\n== Regression Detection ==\n'
printf 'Type, test, lint, and build gates all passed. No regression detected by scripted checks.\n'

printf '\n== Suggested Rollback ==\n'
rollback_command

printf '\n== Review Reminders ==\n'
printf '%s\n' \
  '- Re-run lsp findReferences for renamed or moved symbols.' \
  '- Compare git diff --stat output against the planned files_affected list.' \
  '- Record any known baseline failures separately from refactor regressions.'
