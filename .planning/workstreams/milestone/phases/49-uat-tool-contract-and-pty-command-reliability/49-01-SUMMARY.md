---
phase: 49-uat-tool-contract-and-pty-command-reliability
plan: 01
subsystem: command-tool
status: complete-with-partial-runtime-evidence
completed: 2026-04-28
key_files:
  modified:
    - src/tools/run-background-command.ts
    - tests/tools/run-background-command.test.ts
  created:
    - .planning/workstreams/milestone/phases/49-uat-tool-contract-and-pty-command-reliability/49-01-UAT-EVIDENCE-2026-04-28.md
---

# Phase 49 Plan 01: Command Tool Contract Summary

Stabilized the `run-background-command` public contract by converting unsupported action and accidental shell-string cases into actionable tool-response errors before dispatch.

## What Changed

- Added validated input parsing that returns user-facing guidance for unsupported `start` and `read` actions.
- Added pre-dispatch command-shape validation so shell strings cannot report successful-looking starts.
- Preserved the safe executable+args contract and existing PTY ownership checks.
- Added UAT regression coverage for action guidance, shell-string rejection, identifier discoverability, and first-output reads.

## Verification Evidence

| Command | Result |
|---|---|
| Focused Phase 49 tools test run | PASS — 4 files, 39 tests |
| `npm run typecheck` | PASS |
| LOC gate | PASS — changed source files under 500 LOC |

## Known Stubs

None.

## Threat Flags

None. Command spawning remains behind the existing `DelegationManager.dispatchCommand()` and PTY ownership gates.
