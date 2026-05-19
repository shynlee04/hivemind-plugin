---
phase: 15-delegate-task-gap-remediation-resume-delivery-rich-
plan: 02
type: tdd
subsystem: coordination/delegation + tools/delegation
tags: [chain-append, control-schema, coordinators, delegation-status]
requires: [15-01]
provides: [chain-append-to-child-session, adjust-prompt-and-change-agent-in-schema]
affects: [coordinator.ts, delegation-status.ts, types.ts]
tech-stack:
  runtime: TypeScript 5.8, Node.js 20, ES2022
  test: Vitest 4.1.6
key-files:
  created: []
  modified:
    - src/coordination/delegation/coordinator.ts
    - src/coordination/delegation/types.ts
    - src/tools/delegation/delegation-status.ts
    - tests/lib/coordination/delegation/coordinator.test.ts
    - tests/tools/delegation/delegation-status-v2.test.ts
decisions:
  - D-15-02-01: dispatch() return value extended with childSessionId for chain-append context propagation
  - D-15-02-02: chain-append uses buildChainResult helper instead of full dispatch for steps 2+
metrics:
  duration_minutes: 7
  typecheck: clean
  tests_pass: 259/259 (15 files, including broader delegation suite)
  commits: 2
completed: 2026-05-19
---

# Phase 15 Plan 02: Chain-Append & Control Schema Extension Summary

Extends coordinator.ts `chain()` to accept `sendPromptAsync` and append to completed child sessions, and extends delegation-status.ts `DelegationControlSchema` to accept `adjust-prompt` and `change-agent` actions with validated required fields.

## TDD Protocol

### RED (test commit) — `c13b2fa8`
- Added `chainedFrom` field to `DelegationResult` interface in types.ts
- Added `describe("chain with append")` test block to coordinator.test.ts with 3 tests:
  - First step dispatches normally, subsequent steps use sendPromptAsync
  - Second step reuses childSessionId and sets chainedFrom
  - Falls back to dispatch without sendPromptAsync (backward compat)
- Added `describe("DelegationControlSchema adjust-prompt / change-agent")` test block to delegation-status-v2.test.ts with 4 tests:
  - accepts adjust-prompt with restartPrompt
  - rejects adjust-prompt without restartPrompt
  - accepts change-agent with agent
  - rejects change-agent without agent
- **RED confirmed:** 3 coordinator tests + 2 schema tests failed (actions not in enum)

### GREEN (feat commit) — `0b11646f`
- coordinator.ts:
  - Added optional `sendPromptAsync` parameter to `chain()`
  - Added `buildChainResult` private helper with `chainedFrom` tracking
  - Modified chain() to use append path for steps 1+ when sendPromptAsync is available
  - Fixed: `dispatch()` return now includes `childSessionId` (needed for chain tracking)
- delegation-status.ts:
  - Extended `DelegationControlSchema` action enum with `adjust-prompt` and `change-agent`
  - Added `agent` optional field to schema
  - Added `.refine()` validators for adjust-prompt (requires restartPrompt) and change-agent (requires agent)
  - Extended `ManagerLike.controlDelegation` type union
  - Updated `handleControl` to pass `agent` field to manager

## Verification

| Check | Result |
|-------|--------|
| `npx vitest run tests/lib/coordination/delegation/coordinator.test.ts -t "chain"` | 3/3 passed |
| `npx vitest run tests/tools/delegation/delegation-status-v2.test.ts -t "adjust-prompt\|change-agent\|DelegationControlSchema"` | 8/8 passed |
| `npx vitest run tests/lib/coordination/delegation/ tests/tools/delegation/ tests/lib/delegation-manager.test.ts` | 259/259 passed (15 files) |
| `npm run typecheck` | clean |

## Deviations from Plan

### Rule 2 - Auto-add missing critical functionality

**1. dispatch() missing childSessionId in return value**
- **Found during:** GREEN implementation of chain-append
- **Issue:** `dispatch()` returned DelegationResult without `childSessionId`, causing `previousChildSessionId` in chain() to always be `undefined`
- **Fix:** Added `childSessionId: record.childSessionId` to the dispatch return object
- **Files modified:** `src/coordination/delegation/coordinator.ts`
- **Commit:** `0b11646f`

## Success Criteria

1. ✅ coordinator.chain() appends to previous childSessionId via sendPromptAsync from step 2+
2. ✅ chain() without sendPromptAsync uses dispatch for all steps (backward compat)
3. ✅ DelegationControlSchema accepts adjust-prompt and change-agent with required field validation
4. ✅ ManagerLike.controlDelegation type includes adjust-prompt, change-agent, and agent
5. ✅ handleControl passes agent field to manager.controlDelegation
6. ✅ TypeScript compiles clean — all type mismatches resolved
