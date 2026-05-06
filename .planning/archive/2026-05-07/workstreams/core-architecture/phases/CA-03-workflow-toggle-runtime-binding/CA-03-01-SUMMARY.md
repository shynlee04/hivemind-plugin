---
phase: CA-03-workflow-toggle-runtime-binding
plan: 01
subsystem: hooks
tags: [governance, toggles, hooks, TDD, system.transform, hivemind-configs]

# Dependency graph
requires:
  - phase: CA-01-configs-schema-runtime-binding
    provides: HivemindConfigs schema v2, getDefaultConfigs(), config subscriber
  - phase: CA-02-behavioral-profile-mode-dispatch
    provides: ResolvedBehavioralProfile type, getBehavioralProfile hook dep
provides:
  - Structured "--- Governance ---" block injected into every system prompt via system.transform
  - buildGovernanceBlock() pure function for governance block formatting
  - isToggleEnabled() + getDiscussMode() toggle gate helper functions
  - BooleanToggle type for type-safe toggle reads
affects: [create-core-hooks, system.transform, governance, workflow-toggles]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Governance block injection: push at position 0 of system array before intake/behavioral blocks"
    - "Toggle gate: config ?? getDefaultConfigs() fallback pattern for undefined config"
    - "Hybrid instruction+fields format per D-06 for governance block layout"

key-files:
  created:
    - src/hooks/governance-block.ts
    - src/hooks/toggle-gates.ts
    - tests/hooks/governance-block.test.ts
    - tests/hooks/toggle-gates.test.ts
  modified:
    - src/hooks/create-core-hooks.ts
    - tests/hooks/create-core-hooks.test.ts

key-decisions:
  - "Governance block injected at position 0 of system array, before intake/behavioral per RESEARCH.md Pitfall 1"
  - "buildGovernanceBlock accepts optional profile — gracefully skips field:value line when undefined"
  - "isToggleEnabled resolves config via config ?? getDefaultConfigs() — always returns boolean, never undefined"
  - "discuss_mode excluded from BooleanToggle type — it's an enum, not a boolean toggle"
  - "All toggle gate helpers use Zod defaults as single source of truth"

patterns-established:
  - "Hook-level governance injection: deps.hivemindConfig → buildGovernanceBlock → output.system.push at position 0"
  - "Toggle gate: functions read resolved config, use Zod defaults as fallback, return deterministic values"
  - "TDD no-mock: Construct authentic HivemindConfigs via HivemindConfigsSchema.parse({}) — per D-20"

requirements-completed: [CA-03-01, CA-03-02]

# Metrics
duration: 15min
completed: 2026-05-06
---

# Phase CA-03 Plan 01: Governance Block + Toggle Gate Runtime Binding Summary

**Structured governance block injected at position 0 of system.transform with isToggleEnabled() and getDiscussMode() toggle gate helpers for runtime toggle state access**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-06T07:35:00Z (approx)
- **Completed:** 2026-05-06T07:49:27Z
- **Tasks:** 3 (all TDD — paired RED/GREEN commits)
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments
- `buildGovernanceBlock(config, profile?)` — Pure function producing hybrid instruction+fields governance block per D-06 format with 3 modes, 5 expertise levels, and language combinations
- `isToggleEnabled()` + `getDiscussMode()` — Type-safe toggle gate helpers with Zod default fallback; BooleanToggle type excludes discuss_mode (enum accessor)
- Governance block injected at position 0 of `system.transform` output array, before intake and behavioral injection blocks
- All existing behavioral profile and intake injection tests pass without regression (32 total tests in create-core-hooks.test.ts)

## Task Commits

Each task was committed atomically following TDD discipline (RED → GREEN):

1. **Task 1: Build governance block builder** — `43476030` (test) → `d934dc16` (feat)
2. **Task 2: Build toggle gate helpers** — `2c36011d` (test) → `c972fb68` (feat)
3. **Task 3: Wire governance block into system.transform** — `43da9337` (test) → `269a17bf` (feat)

**Plan metadata:** TBD (docs commit follows)

## Files Created/Modified
- `src/hooks/governance-block.ts` — Pure function building D-06 governance block string with mode/expertise/language mappings and optional field:value context
- `src/hooks/toggle-gates.ts` — isToggleEnabled() and getDiscussMode() with getDefaultConfigs() fallback
- `tests/hooks/governance-block.test.ts` — 8 tests covering all modes, expertise levels, language combos, and undefined profile behavior
- `tests/hooks/toggle-gates.test.ts` — 10 tests covering all 5 boolean toggles, undefined config fallback, discuss_mode enum access
- `src/hooks/create-core-hooks.ts` — Modified: governance block injected at position 0 before intake/behavioral blocks
- `tests/hooks/create-core-hooks.test.ts` — Modified: 12 new governance injection tests, helper functions moved to file-level scope

## Decisions Made
- Governance block injected at position 0 (before intake/behavioral) — per RESEARCH.md Pitfall 1 warning
- buildGovernanceBlock gracefully handles undefined profile — skips field:value line (no crash)
- isToggleEnabled always returns boolean via `config ?? getDefaultConfigs()` — never undefined
- discuss_mode excluded from BooleanToggle type — enum, not boolean, gets its own accessor
- Followed TDD no-mock discipline per D-20 — all tests use authentic HivemindConfigsSchema.parse({})

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Helper functions scoped inside sibling describe block**

- **Found during:** Task 3 (RED phase — governance injection tests)
- **Issue:** `createFakeIntake()` and `createFakeBehavioralProfile()` were defined inside `describe("behavioral profile injection")` and inaccessible from the new `describe("governance block injection")` sibling block
- **Fix:** Moved both helper functions from describe-block scope to file-level (describe `createCoreHooks`) scope so they're accessible from all sibling describe blocks
- **Files modified:** tests/hooks/create-core-hooks.test.ts
- **Verification:** All 32 tests pass after move
- **Committed in:** 43da9337 (Task 3 test commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Blocking issue resolved by moving helpers to shared scope. No behavioral changes.

## Issues Encountered
None — all plan expectations were met. The BooleanToggle type excluded discuss_mode per implementation spec (enum, not boolean), so Test 4 covers 5 boolean toggles instead of 6 as the plan description suggested. This is a spec alignment, not a deviation — the implementation section of the plan explicitly stated discuss_mode is excluded from BooleanToggle.

## Next Phase Readiness
This plan provides the governance block injection and toggle gate helpers needed by downstream CA phases. CA-03-02 (future toggles documentation + execution field consumers) can proceed — it requires buildGovernanceBlock and isToggleEnabled/getDiscussMode which are now available.

---

*Phase: CA-03-workflow-toggle-runtime-binding*
*Completed: 2026-05-06*
