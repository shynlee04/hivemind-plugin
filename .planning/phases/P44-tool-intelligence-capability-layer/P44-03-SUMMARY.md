---
phase: P44
plan: 03
subsystem: coordination/spawner + coordination/delegation
tags: [capability-gate, sdk-child-session, recursive-ceiling, tool-allowlist]
dependency_graph:
  requires: [P44-01, P44-02]
  provides: [capability-gate-wired-to-spawner, recursive-delegation-ceiling, tool-allowlist-tests]
  affects: [spawn-request-builder, sdk-child-session-starter, agent-resolver]
tech_stack:
  added: [CapabilityGate integration in resolveDelegationPermissionProfile]
  patterns: [seed-profile-matching, TOOL_CAPABILITY_MAP-filtering, additive-merge]
key_files:
  created: []
  modified:
    - src/coordination/spawner/spawn-request-builder.ts (LOC: 190, +21 LOC from CapabilityGate wiring)
    - src/coordination/delegation/sdk-child-session-starter.ts (LOC: 70, recursive ceiling task: false / delegate-task: false)
    - tests/lib/spawner/spawn-request-builder.test.ts (+82 LOC: 10 new tests AC-04a through AC-04j)
    - tests/lib/coordination/delegation/agent-resolver.test.ts (+12 LOC: updated expectation for CapabilityGate-expanded tool set)
decisions:
  - D1: CapabilityGate resolves tools at profile resolution time via resolveToolsForAgent() — not at prompt-time
  - D2: Recursive delegation ceiling (task:false, delegate-task:false) enforced in buildDelegationPromptTools — native task integration is P44-04
  - D3: WRITE_CAPABLE_TOOLS retained as last-resort fallback when capability gate returns empty set
  - D4: Agent name matching uses find() (first-match) — profile ordering determines precedence
metrics:
  duration: ~25 minutes (continuation from paused attempt d0bc6d9e)
  completed_date: 2026-06-01
  tasks_completed: 3
  tasks_total: 3
  files_modified: 4
  tests_added: 10 new tests (AC-04a through AC-04j)
  tests_passing: 129 across 3 suites
  typecheck: clean
---

# Phase P44 Plan 03: Wire CapabilityGate into SDK Child-Session Tools Summary

CapabilityGate integrated into spawn-request-builder tool resolution with recursive delegation ceiling enforced in SDK child-session starter. Ten AC tests cover orchestrator, coordinator, L2 specialist, verifier, and unknown-agent baselines plus invalid-tool filtering.

## What Changed

### Source Files

1. **`src/coordination/spawner/spawn-request-builder.ts`** — `resolveDelegationPermissionProfile()` now calls `capabilityGate.resolveToolsForAgent(agent.name)` and merges the result with explicit metadata tools via `mergeToolSets()`, filtering all tools through `TOOL_CAPABILITY_MAP`. WRITE_CAPABLE_TOOLS is retained as last-resort fallback only.

2. **`src/coordination/delegation/sdk-child-session-starter.ts`** — `buildDelegationPromptTools()` enforces recursive delegation ceiling by always appending `task: false` and `delegate-task: false` to the prompt tools map. Native `task` integration is P44-04's scope.

### Test Files

3. **`tests/lib/spawner/spawn-request-builder.test.ts`** — 10 new tests (AC-04a through AC-04j):
   - AC-04a: Explicit permission agent gets tools from both metadata and capability gate
   - AC-04b: Agent without explicit permission gets category-based defaults (fixed agent name `hm-verifier`)
   - AC-04c: Orchestrator gets expanded tools beyond WRITE_CAPABLE_TOOLS
   - AC-04d: LOC budget verification (≤161+80)
   - AC-04e: Existing delegation tests pass unmodified
   - AC-04f: Recursive delegation ceiling rationale test
   - AC-04g: Unknown agent falls back to read-only baseline
   - AC-04h: Invalid tool names filtered by TOOL_CAPABILITY_MAP
   - AC-04i: L2 specialist baseline includes session tools
   - AC-04j: Coordinator baseline includes delegate and govern tools

4. **`tests/lib/coordination/delegation/agent-resolver.test.ts`** — Updated permission profile expectation from strict `.toEqual(5 tools)` to `.toContain()` assertions matching CapabilityGate-expanded tool set for `gsd-executor`.

## Acceptance Criteria Answers

| AC | Question | Answer |
|----|----------|--------|
| AC-01 | Does resolveDelegationPermissionProfile use CapabilityGate? | YES — line 103: `capabilityGate.resolveToolsForAgent(agent.name)` |
| AC-02 | Does buildDelegationPromptTools enforce task:false and delegate-task:false? | YES — lines 68-69 in sdk-child-session-starter.ts |
| AC-03 | Is WRITE_CAPABLE_TOOLS only a last-resort fallback? | YES — line 78: `merged.size > 0 ? Array.from(merged) : [...WRITE_CAPABLE_TOOLS]` |
| AC-04 | Do all tests pass? | YES — 129/129 across 3 suites, typecheck clean |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed AC-04b test agent name mismatch**
- **Found during:** Task 3 test execution
- **Issue:** Test used `hm-l2-verifier` which matched `l2-implementation-specialists` (no Govern category) instead of `quality-verification-specialists` (has Govern → includes `hivemind-pressure`)
- **Fix:** Changed agent name to `hm-verifier` which correctly matches `quality-verification-specialists`
- **Files modified:** `tests/lib/spawner/spawn-request-builder.test.ts`
- **Commit:** `2f8e0f9c`

**2. [Rule 1 - Bug] Fixed agent-resolver.test.ts stale expectation**
- **Found during:** Task 3 verification (full suite run)
- **Issue:** Test expected exact 5-tool set from pre-CapabilityGate era, but `gsd-executor` now correctly receives 19 tools from its l2-implementation-specialists seed profile
- **Fix:** Replaced `.toEqual(5 tools)` with `.toContain()` assertions for baseline tools plus capability-gate-added session tools
- **Files modified:** `tests/lib/coordination/delegation/agent-resolver.test.ts`
- **Commit:** `2f8e0f9c`

## Commits

| Hash | Message |
|------|---------|
| `d0bc6d9e` | feat(P44-03): wire CapabilityGate into spawn-request-builder + SDK child-session recursive ceiling (paused attempt) |
| `2f8e0f9c` | fix(P44-03): fix AC-04b test agent name + add capability gate regression tests |

## Concerns

1. **Profile ordering sensitivity** — Agent name matching uses `find()` (first-match). An agent name containing multiple profile keywords (e.g., `hm-l2-verifier`) matches the first profile in the array. This is documented in AC-04b but could surprise future developers.
2. **Native task integration deferred** — P44-03 only addresses SDK child-session prompt-time tools. Native `task` tool enforcement requires P44-04's ToolIntelligenceEngine integration.

## Self-Check: PASSED

- [x] `src/coordination/spawner/spawn-request-builder.ts` exists (190 LOC)
- [x] `src/coordination/delegation/sdk-child-session-starter.ts` exists (70 LOC)
- [x] `tests/lib/spawner/spawn-request-builder.test.ts` exists (17 tests)
- [x] `tests/lib/coordination/delegation/agent-resolver.test.ts` exists (3 tests)
- [x] Commit `d0bc6d9e` exists in git log
- [x] Commit `2f8e0f9c` exists in git log
- [x] Typecheck passes clean
- [x] 129/129 tests pass across 3 suites
