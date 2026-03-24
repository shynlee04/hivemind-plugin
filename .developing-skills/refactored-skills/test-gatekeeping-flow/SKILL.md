---
name: test-gatekeeping-flow
description: |
  Test-first enforcement methodology across all workflows. Use when: gating implementation behind test existence, gating phase transitions behind test passage, gating completion behind full suite passage, defining test writing order for new features, or enforcing test-first discipline across delegation workflows. Extends tdd-delegation with methodology and hivemind-gatekeeping-delegation with test-specific gate definitions.
---

# test-gatekeeping-flow

Test-first enforcement methodology. Governs WHEN tests are written, WHAT type at each stage, and HOW gates block implementation, phase transitions, and completion.

## Purpose

- Define WHEN tests must be written in any workflow (before implementation, always)
- Specify WHAT type of test at each stage (unit first, integration after, e2e last)
- Gate implementation behind test existence and failure proof
- Gate phase transitions behind test passage evidence
- Gate completion behind full test suite passage

## Use This For

- Any workflow where implementation must be gated by tests
- Setting up test gates for multi-phase plans
- Enforcing test-first across delegation workflows
- Defining test strategies for new features
- Verifying that test evidence is real (not trivially true or stub-based)

## Do Not Use This For

- TDD delegation mechanics (use `tdd-delegation`)
- Writing actual tests (delegate to implementation agent)
- Test infrastructure setup (delegate to implementation agent)
- Debug loops (use `course-correction-delegation`)
- Loop iteration governance (use `hivemind-gatekeeping-delegation`)

## Prerequisites

- `tdd-delegation` loaded for delegation mechanics
- `hivemind-gatekeeping-delegation` loaded for loop gate infrastructure
- Project test framework identified (jest, vitest, node:test, etc.)
- Build and type-check commands known

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `tdd-delegation` | Delegation mechanics — this skill provides the methodology it delegates |
| `hivemind-gatekeeping-delegation` | Gate infrastructure — this skill defines what gates to set |
| `agent-role-boundary` | Role enforcement — separates test-writing from implementation roles |
| `tdd-workflow` | TDD execution — this skill governs the gates that workflow must pass |

## Test Gate Protocol

Five gates, in strict order. No gate may be skipped. Each gate requires COMMAND OUTPUT as evidence, never claims.

### Gate 1: Pre-Implementation (RED Gate)

**Rule:** A test MUST exist and MUST FAIL before any implementation code is written.

| Check | Pass Condition |
|-------|---------------|
| `test_file_exists` | Test file created at expected path |
| `test_describes_behavior` | Test contains meaningful assertion (not `assert(true)`) |
| `test_fails_on_run` | Test command output shows expected failure |
| `no_implementation_exists` | No corresponding implementation file or function yet |

**Evidence required:**
```bash
# Test file must exist
ls tests/<target>.test.ts

# Test must fail (proves it tests real behavior)
npx jest --testPathPattern=<target> 2>&1 | tail -20
# Expected: FAIL with assertion error or "function not found"
```

**Gate failure:** If the test passes immediately, it is trivially true. DELETE it. Write a test that actually asserts behavior. A passing test before implementation proves nothing.

**Gate failure:** If no test file exists, implementation is BLOCKED. Return to red phase.

### Gate 2: Post-Implementation (GREEN Gate)

**Rule:** ALL tests must PASS before claiming green. No exceptions.

| Check | Pass Condition |
|-------|---------------|
| `all_tests_pass` | Test command exits 0, all assertions pass |
| `type_check_clean` | `npx tsc --noEmit` produces zero errors |
| `build_succeeds` | `npm run build` exits 0 |
| `no_new_failures` | Prior tests still pass (regression check) |

**Evidence required:**
```bash
# All tests pass
npm test 2>&1 | tail -5
# Expected: "Tests: X passed, 0 failed"

# Type check clean
npx tsc --noEmit 2>&1
# Expected: (no output = clean)

# Build succeeds
npm run build 2>&1 | tail -3
# Expected: exit 0
```

**Gate failure:** If any test fails, the implementation is incomplete. Fix it. Do not proceed to refactor.

**Gate failure:** If type check fails, the implementation has type errors. Fix them before claiming green.

### Gate 3: Post-Refactor (REFACTOR Gate)

**Rule:** ALL tests still pass after refactoring. No behavior change.

| Check | Pass Condition |
|-------|---------------|
| `all_tests_pass` | Same test output as green gate |
| `type_check_clean` | `npx tsc --noEmit` still zero errors |
| `build_succeeds` | `npm run build` still exits 0 |
| `no_behavior_change` | Test output identical to pre-refactor (same pass count, same assertions) |

**Evidence required:**
```bash
# Same tests, same results
npm test 2>&1 | tail -5
# Expected: "Tests: X passed, 0 failed" (same X as green gate)

# Git diff shows structural changes only (no logic changes in implementation)
git diff --stat
```

**Gate failure:** If any test breaks after refactor, REVERT the refactor. Refactoring must not change behavior.

### Gate 4: Phase Transition Gate

**Rule:** Current phase tests + ALL prior phase tests + build + types must pass before advancing.

Applies to multi-phase plans where each phase builds on the prior.

| Check | Pass Condition |
|-------|---------------|
| `current_phase_tests_pass` | Tests for current phase all pass |
| `prior_phase_tests_pass` | All tests from previous phases still pass |
| `integration_tests_pass` | Cross-phase integration tests pass (if applicable) |
| `type_check_clean` | `npx tsc --noEmit` zero errors |
| `build_succeeds` | `npm run build` exits 0 |

**Evidence required:**
```bash
# Full test suite (all phases)
npm test 2>&1 | tail -5
# Expected: "Tests: X passed, 0 failed" (X includes all phases)

# Type check
npx tsc --noEmit 2>&1
# Expected: (no output)

# Build
npm run build 2>&1 | tail -3
# Expected: exit 0
```

**Gate failure:** If prior phase tests regress, the current phase introduced a bug. Fix it before advancing.

### Gate 5: Completion Gate

**Rule:** FULL suite + integration + build + types + lint must ALL pass before claiming done.

| Check | Pass Condition |
|-------|---------------|
| `full_test_suite_passes` | `npm test` — all tests pass |
| `integration_tests_pass` | Integration test subset passes |
| `type_check_clean` | `npx tsc --noEmit` zero errors |
| `build_succeeds` | `npm run build` exits 0 |
| `lint_clean` | `npm run lint` — no errors |
| `no_regressions` | Entire prior test history still passes |

**Evidence required:**
```bash
# Full suite
npm test 2>&1 | tail -5

# Type check
npx tsc --noEmit 2>&1

# Build
npm run build 2>&1 | tail -3

# Lint
npm run lint 2>&1 | tail -3
```

**Gate failure:** ANY failure at this gate means the work is NOT complete. Do not claim done.

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

**Violation:** Writing integration tests while unit tests are still failing hides unit-level bugs behind integration noise. STOP. Fix unit tests first.

**Violation:** Writing e2e tests before integration tests pass wastes time debugging system-level issues that are actually module-level bugs.

## Evidence Format

Every gate requires EVIDENCE, not claims.

### Required Evidence Structure

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
    },
    "build_succeeds": {
      "command": "npm run build",
      "exit_code": 0,
      "output_excerpt": "Build complete",
      "status": "pass"
    }
  },
  "gate_result": "pass"
}
```

### Evidence Rules

1. **Command output, not claims.** "Tests pass" is a claim. The output of `npm test` is evidence.
2. **Exit codes matter.** Capture and report the exit code of every gate command.
3. **Output excerpts, not full logs.** Last 5-10 lines showing the result summary.
4. **Timestamps required.** When was this gate check run?
5. **No stale evidence.** Gate evidence older than the current implementation is invalid.

## Anti-Patterns

| Anti-Pattern | Why Dangerous |
|--------------|---------------|
| Writing implementation before tests | No proof tests test real behavior; tests may be written to match implementation |
| Claiming green without running gate | No evidence tests pass; downstream agents build on broken foundation |
| Skipping red gate (test must fail first) | Test may be trivially true (`assert(true)`) — proves nothing |
| Writing integration tests before unit passes | Integration failures hide unit-level bugs |
| Refactoring without running tests | No safety net; behavior may change silently |
| Using `assert(true)` or empty tests | Gate passes but tests test nothing |
| Running gate once, reusing evidence | Stale evidence; implementation may have changed since last run |
| Combining red+green in one step | Skips the failing-test proof; cannot verify test validity |
| Claiming done at gate 4 (phase) without gate 5 (completion) | Phase pass != completion; integration and lint may still fail |
| Trusting test output without inspecting assertion | False positives — test may pass for wrong reason (see test-signal skepticism) |

## Independence Rules

- This skill is a HOW-TO methodology — it does not contain delegation mechanics
- It references `tdd-delegation` for delegation packet structure and phase fields
- It references `hivemind-gatekeeping-delegation` for loop gate infrastructure and checkpoint discipline
- It may be loaded alongside either or both sibling skills
- Gate evidence is stored in `{project}/.hivemind/activity/delegation/` at runtime
- This skill does not replace `tdd-delegation` — it provides the methodology that skill delegates
