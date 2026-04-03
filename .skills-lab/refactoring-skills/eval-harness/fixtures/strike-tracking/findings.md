# Findings

## Root Cause Analysis
The TypeError on line 42 of validate-skill.sh stems from a bash pipeline where `grep -c` returns exit code 1 when no matches are found, and `set -e` causes the script to abort.

## Attempted Fixes
1. Added `|| true` — insufficient, doesn't handle all grep failure modes
2. Added `set +e` / `set -e` around grep — still fails on edge cases with empty input

## Recommended Fix
Replace `grep -c` pattern with `grep ... | wc -l` or use `${var:-0}` default value pattern throughout the script.

## Related Files
- validate-skill.sh line 42
- check-overlaps.sh line 18 (same pattern, potential future failure)
