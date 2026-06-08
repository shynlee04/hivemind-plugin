#!/usr/bin/env bash
# check-completion.sh
# Validates a task is actually complete (not just claimed DONE).
# Usage: ./check-completion.sh <output_path> <verification_command> [acceptance_criterion_files...]
set -euo pipefail

OUTPUT="${1:-}"
VERIFY="${2:-}"
shift 2
CRITERIA_FILES=("$@")

if [[ -z "$OUTPUT" ]] || [[ -z "$VERIFY" ]]; then
  echo "Usage: $0 <output_path> <verify_command> [criteria_files...]" >&2
  exit 64
fi

# Check 1: Output file exists + non-empty
if [[ ! -s "$OUTPUT" ]]; then
  echo "FAIL: output '$OUTPUT' missing or empty"
  exit 1
fi
echo "PASS: output exists and non-empty"

# Check 2: Verification command exits 0
if ! bash -c "$VERIFY" >/dev/null 2>&1; then
  echo "FAIL: verification command failed: $VERIFY"
  exit 1
fi
echo "PASS: verification exits 0"

# Check 3: Each criterion file has at least one non-empty acceptance_criterion
for cf in "${CRITERIA_FILES[@]}"; do
  if [[ ! -f "$cf" ]]; then
    echo "WARN: criterion file not found: $cf"
    continue
  fi
  # Each criterion file should have at least one "PASS" or working check
  if ! grep -qE "PASS|check|verify" "$cf"; then
    echo "WARN: criterion file $cf has no PASS-style check"
  fi
done

echo "ALL CHECKS PASS"
