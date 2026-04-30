---
phase: "02"
plan: "01"
subsystem: "runtime-policy"
tags: ["runtime-config", "concurrency", "circuit-breaker", "tdd"]
dependency_graph:
  requires: ["types.ts (RuntimePolicy, BudgetPolicy, ConcurrencyPolicy)"]
  provides: ["runtime-policy.ts", "policy-driven tool guard hooks"]
  affects: ["create-tool-guard-hooks.ts", "plugin.ts (future: will wire policy)"]
tech_stack:
  added: ["src/lib/runtime-policy.ts"]
  patterns: ["policy-as-seam", "defaults-with-override-merge", "validation-gate"]
key_files:
  created:
    - "src/lib/runtime-policy.ts"
    - "tests/lib/runtime-policy.test.ts"
    - "tests/hooks/create-tool-guard-hooks.test.ts"
    - "tests/lib/concurrency.test.ts"
  modified:
    - "src/hooks/create-tool-guard-hooks.ts"
decisions:
  - "runtime-policy.ts as single seam for all runtime config (concurrency + budget)"
  - "ToolGuardDependencies accepts optional runtimePolicy, falls back to DEFAULT_RUNTIME_POLICY"
  - "Validation throws [Harness]-prefixed errors for out-of-range policy values"
  - "resolveConcurrencyForKey and resolveBudgetForSession as convenience resolvers for hook consumers"
  - "No per-session override wiring yet — deferred to plugin.ts integration (Plan 02-02)"
metrics:
  duration: "14m 17s"
  completed: "2026-04-08"
  tasks_completed: 2
  tests_added: 27
  tests_total: 61
  loc_created: ~380
---

# Phase 02 Plan 01: Runtime Policy Foundation Summary

Runtime policy module with defaults, validation, session overrides, and policy-driven tool guard hooks replacing hardcoded CIRCUIT_BREAKER_THRESHOLD and MAX_TOOL_CALLS_PER_SESSION constants.

## What Changed

### Task 1 — Runtime Policy Module (TDD: RED → GREEN)

Created `src/lib/runtime-policy.ts` with:

- `DEFAULT_RUNTIME_POLICY` — mirrors current production constants (globalLimit=3, maxToolCalls=400, repeatedSignatureThreshold=16)
- `loadRuntimePolicy(workspacePolicy?)` — validates and merges workspace-level policy over defaults
- `getRuntimePolicyForSession(workspacePolicy, sessionOverride?)` — resolves per-session overrides with validation
- `resolveConcurrencyForKey(policy, key)` — per-key concurrency with fallback to global limit
- `resolveBudgetForSession(policy)` — convenience resolver returning full budget policy
- Validation helpers that throw `[Harness]`-prefixed errors for invalid values

19 tests covering: defaults, partial overrides, full overrides, invalid values, per-key resolution, session merge.

### Task 2 — Policy-Driven Tool Guard Hooks (TDD: RED → GREEN)

Modified `src/hooks/create-tool-guard-hooks.ts`:

- Added optional `runtimePolicy` field to `ToolGuardDependencies` interface
- Replaced hardcoded `CIRCUIT_BREAKER_THRESHOLD` (16) with `policy.budget.repeatedSignatureThreshold`
- Replaced hardcoded `MAX_TOOL_CALLS_PER_SESSION` (400) with `policy.budget.maxToolCallsPerSession`
- Falls back to `DEFAULT_RUNTIME_POLICY` when no override provided — backward-compatible

5 concurrency timeout tests (already passing — feature existed), 3 policy-driven budget tests (new).

## Commits

| Hash | Message |
|------|---------|
| `75553497` | test(02-01): add failing tests for runtime policy module |
| `91d702a3` | feat(02-01): implement runtime policy module with defaults, overrides, validation |
| `15349e95` | test(02-01): add RED tests for policy-driven budgets and timeout-aware concurrency |
| `f848f8ba` | feat(02-01): wire runtimePolicy into tool guard hooks (GREEN) |

## Requirements Satisfied

- **RUN-3c** (concurrency): `resolveConcurrencyForKey()` with per-key limits and timeout support
- **RUN-3h** (circuit breaker/budgets): Policy-driven `maxToolCallsPerSession` and `repeatedSignatureThreshold`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
✓ tests/lib/runtime-policy.test.ts    19 tests
✓ tests/hooks/create-tool-guard-hooks.test.ts    18 tests
✓ tests/lib/concurrency.test.ts    24 tests
---
Total: 61 tests passed, 0 failures
TypeScript: typecheck clean
```

## Next Steps (for Plan 02-02)

- Wire `loadRuntimePolicy()` call into `plugin.ts` composition root
- Accept workspace policy from `opencode.json` config
- Pass resolved policy to `createToolGuardHooks()` deps bundle
- Add `resolveConcurrencyForKey()` calls to `DelegationConcurrencyQueue` integration

## Self-Check: PASSED

| File | Status |
|------|--------|
| `src/lib/runtime-policy.ts` | FOUND |
| `src/hooks/create-tool-guard-hooks.ts` | FOUND |
| `tests/lib/runtime-policy.test.ts` | FOUND |
| `tests/hooks/create-tool-guard-hooks.test.ts` | FOUND |
| `tests/lib/concurrency.test.ts` | FOUND |

| Commit | Status |
|--------|--------|
| `75553497` | FOUND |
| `91d702a3` | FOUND |
| `15349e95` | FOUND |
| `f848f8ba` | FOUND |
