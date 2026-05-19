---
phase: 15-delegate-task-gap-remediation-resume-delivery-rich-
plan: 01
type: tdd
subsystem: delegation
tags: [controlDelegation, resume, chain, adjust-prompt, change-agent, sendPromptAsync]
requires: [15-01-PLAN.md]
provides: [Restructured controlDelegation with sendPromptAsync path]
affects: [src/coordination/delegation/manager.ts]
tech-stack:
  added: []
  patterns: [sendPromptAsync dispatch path, FacadeLifecycle.register]
key-files:
  created:
    - tests/lib/coordination/delegation/manager-decomposition.test.ts
  modified:
    - src/coordination/delegation/manager.ts
decisions:
  - "Resume/chain use sendPromptAsync path (reusing childSessionId) when available, fall back to abort+dispatch when not"
  - "Change-agent sends prompt to existing session via sendPromptAsync; actual agent change requires runtime support"
  - "Terminal guard allows resume/chain on completed delegations but blocks all other actions"
metrics:
  duration: "~3 min"
  red_commits: 1
  green_commits: 1
  total_commits: 2
  tests_passing: 12/12 new, 252/252 regression
---

# Phase 15 Plan 01: controlDelegation restructure with sendPromptAsync path

**One-liner:** Restructured `DelegationManager.controlDelegation()` to support four new actions — resume, chain, adjust-prompt, and change-agent — via a `sendPromptAsync` path that reuses the existing `childSessionId`, preserving session context instead of creating new child sessions.

## Summary

This plan addresses three gaps identified in the delegate-task review:
- **GAP-C1 (True Session Resume):** `controlDelegation('resume')` now reuses the existing `childSessionId` via `sendPromptAsync`, creating a new delegation record with `resumedFrom` reference
- **GAP-M1 (Chain-Append):** `controlDelegation('chain')` appends to the same session with `chainedFrom` reference
- **GAP-M2 (Adjust-Prompt/Change-Agent):** `adjust-prompt` sends supplementary prompts to running delegations; `change-agent` aborts + restarts with a new agent

### Implementation Details

**Three interface changes to `manager.ts`:**
1. `FacadeLifecycle.register?: (record: Delegation) => void` — creates new delegation records without `coordinator.dispatch`
2. `DelegationManagerOptions.sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>` — dependency injection for the sendPromptAsync path
3. `DelegationControlRequest` — extended action union to include `"adjust-prompt" | "change-agent"`, added `agent?: string`

**Restructured controlDelegation dispatch paths:**
- **sendPromptAsync path** (resume, chain, adjust-prompt, change-agent): reuses childSessionId
- **abort+dispatch path** (restart, fallback): existing behavior preserved
- **Direct terminal** (abort, cancel): no change

### Test Results

| Test | Result |
|------|--------|
| Resume completed delegation | ✅ Same childSessionId, resumedFrom set |
| Chain completed delegation | ✅ Same childSessionId, chainedFrom set |
| Adjust-prompt running delegation | ✅ Calls sendPromptAsync, same delegation |
| Change-agent running delegation | ✅ Abort + sendPromptAsync with agent |
| Restart on completed throws | ✅ Terminal guard preserved |
| Adjust-prompt on completed throws | ✅ Error thrown |
| Change-agent without agent throws | ✅ Error thrown |
| Resume without sendPromptAsync falls back | ✅ abort+dispatch path works |

### Regression

- `npm run typecheck` — ✅ PASS
- `tests/lib/coordination/delegation/` — 102/102 ✅
- `tests/tools/delegation/` — 29/29 ✅
- `tests/lib/delegation-manager.test.ts` — 121/121 ✅
- **Total: 252/252 tests pass across 15 files**

### Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 6657382a | `test(15-01): add RED tests for controlDelegation resume/chain/adjust-prompt/change-agent` |
| f8e6eefc | `feat(15-01): implement controlDelegation resume/chain/adjust-prompt/change-agent` |

## Self-Check

- [x] `src/coordination/delegation/manager.ts` — 356 LOC (under 500)
- [x] `npm run typecheck` — clean
- [x] All 252 delegation tests pass
- [x] File size under 500 LOC
- [x] No `any` types used
- [x] `verbatimModuleSyntax` preserved (uses `import type`)
- [x] JSDoc on all new/updated methods
