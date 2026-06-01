---
status: testing
phase: 45-vendor-sync-script
source: 45-02-SUMMARY.md
started: 2026-06-01T20:40:00Z
updated: 2026-06-01T20:40:00Z
---

## Current Test

number: 1
name: Usage & Help
expected: |
  Running `./scripts/sync-fork.sh` without arguments shows usage instructions and exits cleanly.
awaiting: user response

## Tests

### 1. Usage & Help
expected: Running `./scripts/sync-fork.sh` without arguments shows usage instructions and exits cleanly.
result: [pending]

### 2. `--dry-run` Preview Mode
expected: Running `./scripts/sync-fork.sh --dry-run` with upstream changes available shows a preview summary of what would merge, which files conflict, and exits without modifying any files in the working tree.
result: [pending]

### 3. Clean Fast-Forward Merge
expected: Running `./scripts/sync-fork.sh` with non-conflicting upstream changes successfully merges them into the vendored fork. Exit code 0.
result: [pending]

### 4. Pinned File Conflict Abort
expected: When an upstream change modifies a Hivemind-pinned file (`opencode-tmux/src/tmux.ts`, `src/grid-planner.ts`, `src/session-manager.ts`, or `src/fork-bridge.ts`), the script aborts with exit code 1 and prints a clear error message identifying the pinned file. NEVER silently overwrites Hivemind changes.
result: [pending]

### 5. Test Suite Passes
expected: `npx bats tests/scripts/sync-fork.bats` runs all 3 scenarios and reports 3/3 pass.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps

<!-- YAML format for plan-phase --gaps consumption -->
