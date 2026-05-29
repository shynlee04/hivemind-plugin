# Phase 25 Code Review — Fix Report

**Date:** 2026-05-29
**Findings fixed:** 3/3 warnings

## Fixes Applied

### WR-001: Off-by-one in boundText
**File:** `src/features/agent-work-contracts/operations.ts`
**Fix:** Changed `value.slice(0, Math.max(0, limit - 1)).trimEnd()` to `value.slice(0, limit).trimEnd()`. The `- 1` was dead code from an unimplemented truncation marker — `boundText` truncates to `limit - 1` (1199 chars) instead of `limit` (1200 chars). No truncation marker is appended, so the full limit should be used.
**Commit:** `094c417d`

### WR-002: Double-persistence in lifecycle
**File:** `src/features/agent-work-contracts/lifecycle.ts`
**Fix:** `transitionContract` previously called `upsertAgentWorkContract` internally, then `blockContract`, `completeContract`, and `cancelContract` mutated the returned contract and called `upsertAgentWorkContract` again — two writes per transition. A crash between writes would lose reason/proof data. Fixed by making `transitionContract` a pure validator (no write), and having each public transition function do a single `upsertAgentWorkContract` call after all mutations are applied. `startContract` (no additional mutations) also calls `upsertAgentWorkContract` directly.
**Commit:** `f845c43c`

### WR-003: Missing .max() constraints
**File:** `src/schema-kernel/agent-work-contract.schema.ts`
**Fix:** Added `.max(BRIEFING_LIMIT)` to the `briefing` field and `.max(SUMMARY_LIMIT)` to the `summary` field in `AgentWorkCreateToolInputSchema`. These constraints now match `AgentWorkCompactionSchema`, ensuring unbounded tool input is rejected by Zod before reaching runtime truncation.
**Commit:** `c1937fcd`

## Verification

- Typecheck: ✅ zero errors
- Tests: ✅ all pass (2844 passed, 2 skipped)

---

_Fixed: 2026-05-29_
_Fixer: gsd-code-fixer_
_Iteration: 1_
