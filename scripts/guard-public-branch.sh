#!/usr/bin/env bash
set -euo pipefail

# Blocks sensitive "dev-v3 only" content from being merged/pushed to public branch.
# Usage:
#   bash scripts/guard-public-branch.sh [<base-ref> [<head-ref>]]
#
# Examples:
#   bash scripts/guard-public-branch.sh origin/master HEAD
#   bash scripts/guard-public-branch.sh "$GITHUB_BASE_SHA" "$GITHUB_HEAD_SHA"
#
# Override (emergency only):
#   ALLOW_SENSITIVE_PUBLIC=1 bash scripts/guard-public-branch.sh ...

if [[ "${ALLOW_SENSITIVE_PUBLIC:-0}" == "1" ]]; then
  echo "WARNING: Public branch guard bypassed via ALLOW_SENSITIVE_PUBLIC=1"
  exit 0
fi

base_ref="${1:-}"
head_ref="${2:-HEAD}"

if [[ -z "${base_ref}" ]]; then
  if git rev-parse --verify origin/master >/dev/null 2>&1; then
    base_ref="$(git merge-base HEAD origin/master)"
  else
    echo "Usage: bash scripts/guard-public-branch.sh <base-ref> [head-ref]"
    echo "Hint: base-ref missing and origin/master not available locally."
    exit 2
  fi
fi

changed_files=()
while IFS= read -r file; do
  if [[ -n "${file}" ]]; then
    changed_files+=("${file}")
  fi
done < <(git diff --name-only "${base_ref}" "${head_ref}")

if [[ ${#changed_files[@]} -eq 0 ]]; then
  echo "PASS: Public branch guard: no changed files detected."
  exit 0
fi

protected_regexes=(
  '^AGENTS\.md$'
  '^CHANGELOG\.md$'
  '^\.opencode/'
  '^docs/plans/'
  '^docs/reference/'
  '^references/'
  '^prompts/'
  '^templates/'
  '^agents/'
)

violations=()

for file in "${changed_files[@]}"; do
  for re in "${protected_regexes[@]}"; do
    if [[ "${file}" =~ ${re} ]]; then
      exists=0
      for existing in "${violations[@]}"; do
        if [[ "${existing}" == "${file}" ]]; then
          exists=1
          break
        fi
      done
      if [[ ${exists} -eq 0 ]]; then
        violations+=("${file}")
      fi
      break
    fi
  done
done

if [[ ${#violations[@]} -gt 0 ]]; then
  echo "BLOCKED: Public branch guard found sensitive paths:"
  for file in "${violations[@]}"; do
    echo "   - ${file}"
  done
  echo
  echo "Policy: these files are dev-v3 only and must not go to public master."
  echo "If absolutely necessary, require explicit override with ALLOW_SENSITIVE_PUBLIC=1."
  exit 1
fi

echo "PASS: Public branch guard passed."
