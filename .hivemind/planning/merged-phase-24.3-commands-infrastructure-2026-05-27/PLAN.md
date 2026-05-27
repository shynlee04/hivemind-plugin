[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Merged Phase 24.3: Commands Infrastructure & Tooling — PLAN

**Date:** 2026-05-27
**Status:** Planned — blocked by P23.3 (GAP-01)
**Total LOC:** ~15

## Wave 1 Tasks

### T1: Wire contract validation into pipeline
- **File:** `src/tools/session/execute-slash-command.ts`
- **Change:** Add `validateCommandContract()` call after successful command resolution (after line 181)
- **LOC:** ~3
- **Verification:** grep for `validateCommandContract` call in execute-slash-command.ts

### T2: Add `namespace` field to `CommandBundle` type
- **File:** `src/routing/command-engine/types.ts`
- **Change:** Add `namespace?: string` field to `CommandBundle` type
- **LOC:** ~1
- **Verification:** typecheck passes

### T3: Create barrel index.ts for session tools
- **File:** `src/tools/session/index.ts`
- **Change:** Re-export all 7 modules in session/ directory
- **LOC:** ~8
- **Verification:** imports resolve correctly

### T4: Document TUI append confusion gap
- **File:** `src/tools/session/execute-slash-command.ts`
- **Change:** Add comment at TUI dispatch path (line 441-450) noting agent-appended commands appear as user turns
- **LOC:** ~5
- **Verification:** annotation present at line 441

## Verification

1. `npx tsc --noEmit` — typecheck clean
2. `npm test` — no regressions
3. `grep "validateCommandContract" src/tools/session/execute-slash-command.ts` — call exists
4. `grep "namespace?" src/routing/command-engine/types.ts` — field exists
