---
name: use-hivemind-tdd
description: |
  The TDD domain. Write the test first. Make it fail. Make it pass. Clean it up. Repeat for every phase. No exceptions.
---

# use-hivemind-tdd

You're building something. The test comes first — always. This skill governs the entire TDD lifecycle: from writing the first failing test to claiming completion after the last refactor. It consolidates delegation mechanics, phase-level enforcement, and gate protocol into one place.

## Load Position

**Slot: 2. Requires `use-hivemind` in Slot 1.**

| Constraint | Rule |
|-----------|------|
| Stack position | Slot 2 of 3 |
| Load order | After entry router |
| Max active | 3 skills total |
| Parent | `use-hivemind` |

## The TDD Loop

Three steps. In order. Never combined. Never skipped.

**RED** — Write a test that defines what the code *should* do. Run it. It *must* fail. If it passes immediately, it's testing nothing. Delete it and write one that actually asserts behavior.

**GREEN** — Write the minimum code to make the test pass. Don't optimize. Don't refactor. Don't add features the test doesn't ask for. Just make it green.

**REFACTOR** — Now clean up. Better names. Extract functions. Reduce duplication. Tests must still pass. If they break, revert the refactor — you changed behavior.

Then you do it again. For the next piece of behavior. And the next. Until the phase is done.

## Gate 1: RED (Pre-Implementation)

**Rule:** No implementation code exists until a test exists and fails.

| Check | Pass Condition |
|-------|---------------|
| `test_file_exists` | Test file created at expected path |
| `test_is_meaningful` | Contains real assertion — not `assert(true)` |
| `test_fails` | Command output shows expected failure |
| `no_implementation` | No corresponding implementation file or function yet |

```bash
# The test must fail. That's the proof it tests real behavior.
npx jest --testPathPattern=<target> 2>&1 | tail -20
# Expected: FAIL with assertion error or "function not found"
```

**If it passes immediately:** it's trivially true. Delete it. Write a test that actually asserts behavior. A passing test before implementation proves nothing.

**If no test exists:** implementation is BLOCKED. Return to red.

## Gate 2: GREEN (Post-Implementation)

**Rule:** ALL tests pass. Build succeeds. Types are clean. No exceptions.

| Check | Pass Condition |
|-------|---------------|
| `all_tests_pass` | Test command exits 0, all assertions pass |
| `type_check_clean` | `npx tsc --noEmit` — zero errors |
| `build_succeeds` | `npm run build` — exits 0 |
| `no_regressions` | Prior tests still pass |

```bash
npm test 2>&1 | tail -5
# Expected: "Tests: X passed, 0 failed"

npx tsc --noEmit 2>&1
# Expected: (no output = clean)

npm run build 2>&1 | tail -3
# Expected: exit 0
```

**If any test fails:** implementation is incomplete. Fix it. Do not proceed to refactor.

**If type check fails:** you have type errors. Fix them before claiming green.

## Gate 3: REFACTOR (Post-Cleanup)

**Rule:** ALL tests still pass. Same pass count. Same assertions. No behavior change.

| Check | Pass Condition |
|-------|---------------|
| `all_tests_pass` | Same test output as green gate |
| `type_check_clean` | `npx tsc --noEmit` still zero errors |
| `build_succeeds` | `npm run build` still exits 0 |
| `no_behavior_change` | Test output identical to pre-refactor |

```bash
npm test 2>&1 | tail -5
# Expected: "Tests: X passed, 0 failed" (same X as green gate)

git diff --stat
# Structural changes only — no logic changes in implementation
```

**If any test breaks after refactor:** REVERT the refactor. Refactoring must not change behavior.

## Gate 4: Phase Transition

**Rule:** Current phase + ALL prior phases + build + types + lint must pass before advancing.

| Check | Pass Condition |
|-------|---------------|
| `current_phase_tests_pass` | Tests for current phase all pass |
| `prior_phase_tests_pass` | All tests from previous phases still pass |
| `type_check_clean` | `npx tsc --noEmit` zero errors |
| `build_succeeds` | `npm run build` exits 0 |
| `lint_clean` | `npm run lint` — no errors |

```bash
npm test 2>&1 | tail -5       # All phases included
npx tsc --noEmit 2>&1         # Zero errors
npm run build 2>&1 | tail -3  # Exit 0
npm run lint 2>&1 | tail -3   # No errors
```

**If prior phase tests regress:** the current phase introduced a bug. Fix it before advancing. Never silently advance.

## Gate 5: Completion

**Rule:** FULL suite + integration + build + types + lint. All pass or no completion.

| Check | Pass Condition |
|-------|---------------|
| `full_test_suite_passes` | `npm test` — all tests pass |
| `integration_tests_pass` | Integration test subset passes |
| `type_check_clean` | `npx tsc --noEmit` zero errors |
| `build_succeeds` | `npm run build` exits 0 |
| `lint_clean` | `npm run lint` — no errors |
| `no_regressions` | Entire test history still passes |

```bash
npm test 2>&1 | tail -5
npx tsc --noEmit 2>&1
npm run build 2>&1 | tail -3
npm run lint 2>&1 | tail -3
```

**ANY failure at this gate means the work is NOT complete.** Do not claim done.

## Phase TDD Lifecycle

Each plan phase gets its own complete R-G-R cycle. Phases are sequential — Phase N+1 cannot start until Phase N passes Gate 4.

```
Phase 01: red → green → refactor → Gate 4 (transition)
Phase 02: red → green → refactor → Gate 4 (includes Phase 01 tests)
Phase 03: red → green → refactor → Gate 4 (includes Phase 01+02 tests)
  ...
Phase N:  red → green → refactor → Gate 4 (includes ALL prior tests)
                                          ↓
                                    Gate 5 (completion)
```

### Per-Phase Rules

- **RED:** Tests cover only THIS phase's deliverables. Prior tests must still pass.
- **GREEN:** Implement minimum for THIS phase only. No cross-phase scope creep. Prior tests must still pass.
- **REFACTOR:** Clean THIS phase's code. All tests (this + prior) must still pass.
- **TRANSITION:** Run full suite. If prior tests regress, fix before advancing.

### Phase Test Strategy

| Phase Type | Primary | Secondary | What to Test |
|-----------|---------|-----------|-------------|
| Foundation | Unit | — | Core types, interfaces, data structures |
| Core Logic | Unit | Integration | Business logic; integration for external calls |
| API / Interface | Unit | Integration | Request/response; endpoints |
| Data Layer | Unit | Integration | Queries/mutations; DB ops |
| Integration | Integration | Unit | Cross-module flows; edge cases |
| UI / Presentation | Unit | E2E | Component logic; user flows |
| E2E / Polish | E2E | Integration | User journeys; subsystem integration |

## Test Writing Order

Tests MUST be written in this order. Never skip levels.

```
Level 1: Unit Tests
  ├─ Test individual functions/methods in isolation
  ├─ Mock external dependencies
  ├─ Cover edge cases, error paths, boundary conditions
  └─ ALL must pass before proceeding to Level 2

Level 2: Integration Tests
  ├─ Test interactions between modules
  ├─ Test API contracts, data flow, state transitions
  ├─ Use real dependencies where possible (no stubs for SDK surfaces)
  └─ ALL must pass before proceeding to Level 3

Level 3: E2E Tests
  ├─ Test full user-facing workflows
  ├─ Test across system boundaries
  ├─ Validate against live interfaces where possible
  └─ ALL must pass before claiming completion
```

Writing integration tests while unit tests are still failing hides unit-level bugs behind integration noise. Don't do it.

## Multi-Phase State Tracking

Track TDD state across all phases in a single checkpoint file.

```
{project}/.hivemind/activity/delegation/phase-tdd-{plan_id}-checkpoint.json
```

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00Z",
    "updated_at": "2026-03-24T10:30:00Z",
    "plan_id": "feature-auth-001",
    "total_phases": 4
  },
  "phases": [
    {
      "phase_id": "phase-01-foundation",
      "phase_index": 1,
      "status": "complete",
      "tdd_cycle": {
        "red": { "status": "complete", "tests_written": 8, "test_files": ["types.test.ts"] },
        "green": { "status": "complete", "tests_passing": 8, "tests_failing": 0 },
        "refactor": { "status": "complete", "tests_still_passing": true }
      },
      "transition_gate": { "all_green": true, "verified_at": "2026-03-24T10:20:00Z" }
    }
  ],
  "cumulative_test_count": 8,
  "last_verified_phase": 1,
  "blocked": false,
  "blocked_reason": null
}
```

### Rules

1. Update checkpoint after every sub-phase (red, green, refactor).
2. `cumulative_test_count` reflects ALL tests across all completed phases.
3. `last_verified_phase` is the highest phase that passed Gate 4.
4. Blocked phases: set `blocked: true` + `blocked_reason` with specific failure.
5. Prior phase transition gates are IMMUTABLE once set — never retroactively change pass/fail.

## Evidence Format

Every gate requires COMMAND OUTPUT as evidence, never claims.

```json
{
  "gate_id": "green",
  "timestamp": "2026-03-24T10:00:00Z",
  "checks": {
    "all_tests_pass": {
      "command": "npm test",
      "exit_code": 0,
      "output_excerpt": "Tests: 42 passed, 0 failed",
      "status": "pass"
    },
    "type_check_clean": {
      "command": "npx tsc --noEmit",
      "exit_code": 0,
      "output_excerpt": "",
      "status": "pass"
    }
  },
  "gate_result": "pass"
}
```

"Tests pass" is a claim. The output of `npm test` is evidence. Always show the evidence.

## Anti-Patterns

| Anti-Pattern | Excuse | Reality |
|-------------|--------|---------|
| Writing implementation before tests | "I know what it should do" | Tests written after are reverse-engineered to match, not verify |
| Claiming green without running gate | "It should pass" | Should ≠ does. Run the command. |
| Skipping red gate | "The test is obvious" | Obvious tests are trivially true. They test nothing. |
| Combining red+green in one step | "Saves time" | Saves time hiding bugs. The failing proof is the whole point. |
| Writing integration tests before unit passes | "Integration is more important" | Integration failures hide unit-level bugs you'll never find |
| Refactoring without running tests | "It's just a rename" | Renames break references. Structure changes break assumptions. |
| Using `assert(true)` or empty tests | "Gate passes anyway" | Gate passes. Bugs ship. You chose this. |
| Running gate once, reusing evidence | "Tests haven't changed" | Implementation changed. Evidence is stale. Re-run. |
| Advancing phase without Gate 4 | "Phase 1 was simple" | Simple phases still break things downstream. Prove it passed. |
| Claiming done at Gate 4 without Gate 5 | "Phases all pass" | Phases passing ≠ project complete. Integration and lint may still fail. |

## Regression Response

| Scenario | Action |
|---------|--------|
| Prior phase test breaks during current red | STOP. Fix prior test before writing new ones. |
| Prior phase test breaks during current green | STOP. Implementation broke prior behavior. Fix. |
| Prior phase test breaks during refactor | REVERT refactor. Re-run. Fix if still broken. |
| Build breaks after green | Green is not truly green. Fix and re-verify. |

## Bundled Resources

| Resource | Purpose |
|---------|---------|
| `references/tdd-loop-delegation.md` | Red-green-refactor delegation mechanics |
| `references/test-gate-enforcement.md` | Gate rules and enforcement details |
| `references/phase-tdd-lifecycle.md` | Detailed per-phase R-G-R rules |
| `references/transition-gates.md` | Gate checks, failure handling, result format |
| `references/multi-phase-checkpoint.md` | Full checkpoint schema and state rules |
| `templates/tdd-delegation-packet.md` | Extended delegation packet JSON template |
| `templates/phase-tdd-checkpoint.md` | Multi-phase checkpoint JSON template |
| `templates/transition-gate-result.md` | Phase transition gate result JSON |

## Independence Rules

- This is a **domain router** — it consolidates delegation mechanics, phase enforcement, and gate protocol
- Parent: `use-hivemind` (Slot 1)
- Depth companions: `hivemind-atomic-commit`, `hivemind-gatekeeping-delegation`
- Checkpoints stored in `{project}/.hivemind/activity/delegation/` at runtime
- Universal and framework-agnostic — applies to any project with test-driven development
