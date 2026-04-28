---
phase: 49-uat-tool-contract-and-pty-command-reliability
plan: 02
subsystem: prompt-tools
status: complete
completed: 2026-04-28
key_files:
  modified:
    - src/tools/prompt-skim/tools.ts
    - src/tools/prompt-analyze/tools.ts
    - tests/tools/prompt-skim.test.ts
    - tests/tools/prompt-analyze.test.ts
---

# Phase 49 Plan 02: Prompt Tool Calibration Summary

Calibrated deterministic prompt-skim and prompt-analyze heuristics against UAT failures for bloated prompts, vague app-improvement prompts, and complementary architecture requirements.

## What Changed

- Added prompt-skim scoring inputs for requirement density, list density, and cross-domain scope breadth.
- Broadened vague and missing-scope detection for app/flow improvement prompts.
- Added a contradiction guard so event sourcing plus CQRS guidance is not falsely flagged when it says not to couple read and write models.
- Added focused UAT fixtures without changing schema-kernel output contracts.

## Verification Evidence

| Command | Result |
|---|---|
| Focused Phase 49 tools test run | PASS — 4 files, 39 tests |
| `npm run typecheck` | PASS |
| LOC gate | PASS — changed source files under 500 LOC |

## Known Stubs

None.

## Threat Flags

None. Prompt analysis remains deterministic local string processing with no persistence or network calls.
