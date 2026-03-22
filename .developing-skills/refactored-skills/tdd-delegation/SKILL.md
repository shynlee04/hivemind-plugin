---
name: tdd-delegation
description: |
  TDD-aware delegation for test-driven work. Use when: delegating red-green-refactor loops to subagents, enforcing test gates before implementation proceeds, running build-verify cycles, designing test-first delegation packets, or building incremental test suites. Extends use-hivemind-delegation with TDD-specific packet fields and phase gates.
---

# tdd-delegation

TDD-aware delegation for test-driven development workflows. Governs red-green-refactor loop delegation, test gate enforcement, and build-verify cycles.

## Purpose

- Delegate red-green-refactor loops to subagents with explicit phase boundaries
- Enforce test gates — no implementation proceeds without passing tests
- Run build-verify cycles after each green phase
- Design test-first delegation packets with TDD-specific fields
- Build incremental test suites (unit first, integration after unit passes)

## Use This For

- Delegating TDD work to subagents with red-green-refactor discipline
- Enforcing test gates before implementation proceeds
- Build-verify cycles (tsc + test suite after green phase)
- Incremental test suite building
- Any work where tests must be written before implementation

## Do Not Use This For

- Single-pass verification without TDD loop — use `use-hivemind-delegation` verification mode
- Non-test work — use standard delegation
- Research or evidence collection — use `research-delegation`
- Debug loops — use `course-correction-delegation`

## Prerequisites

- `use-hivemind-delegation` MUST be loaded first — this skill extends it with TDD fields
- Test framework must be identified before delegation (jest, vitest, node:test, etc.)

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-delegation` | Base delegation protocol — this skill extends it |
| `hivemind-gatekeeping-delegation` | Loop governance — used for TDD loop iteration control |
| `course-correction-delegation` | Debug fallback — if TDD fails, transition to debug delegation |
| `tdd-workflow` | TDD methodology — this skill handles delegation of TDD work |

## Red-Green-Refactor Loop Delegation

Each TDD phase is a separate delegation. Never combine red+green in one packet.

### Red Phase — Write Failing Tests

- Child writes tests that define expected behavior
- Tests MUST fail when run — this proves they test real behavior
- Child returns: test files written, test output showing failures
- Gate: test command produces expected failures

### Green Phase — Implement Minimum to Pass

- Child implements minimum code to make tests pass
- No refactoring, no optimization — just green
- Child returns: implementation files, test output showing passes
- Gate: all tests pass, build succeeds

### Refactor Phase — Improve Structure

- Child improves code structure without changing behavior
- All tests must still pass after refactoring
- Child returns: refactored files, test output showing passes
- Gate: all tests pass, build succeeds, no behavior change

### Phase Transition Rules

| From | To | Condition |
|------|----|-----------|
| Red | Green | Failing test output provided |
| Green | Refactor | All tests pass, build succeeds |
| Refactor | Red (next cycle) | All tests pass after refactor |
| Any | Blocked | Test gate fails — return with evidence |

## Test Gate Enforcement

A test gate is: command + expected output pattern.

### Gate Rules

1. Child CANNOT claim complete without running the gate command
2. Gate failure → return `status: "partial"` with test output as evidence
3. Gate command is specified in the delegation packet's `test_gate_command` field
4. Gate must be runnable in the child's environment

### Gate Types

| Gate | Command Pattern | Pass Condition |
|------|----------------|----------------|
| Unit test | `npx jest --testPathPattern=<files>` | All tests pass |
| Type check | `npx tsc --noEmit` | No type errors |
| Build | `npm run build` | Exit code 0 |
| Lint | `npm run lint` | No errors |
| Integration | `npx jest --testPathPattern=integration` | All integration tests pass |

## Build-Verify Cycles

After every green phase, run build-verify:

1. `npx tsc --noEmit` — type check
2. `npm test` — full test suite
3. Record checkpoint with: tests_written, tests_passing, tests_failing, build_output

If build-verify fails, the green phase is not truly green — return partial with evidence.

## Test-First Packet Design

Extends standard delegation packet with TDD-specific fields:

| Field | Type | Purpose |
|-------|------|---------|
| `tdd_phase` | `red \| green \| refactor` | Current TDD phase |
| `test_gate_command` | string | Command to verify phase completion |
| `test_files` | string[] | Test files this phase touches |
| `implementation_files` | string[] | Implementation files this phase touches |
| `build_verify_command` | string | Build verification command (green/refactor only) |

## Incremental Test Suite Building

Test order must be:
1. Unit tests first — test individual functions/methods
2. Integration tests only after all unit tests pass
3. E2E tests only after integration tests pass

Do not write integration tests while unit tests are still failing.

## Anti-Patterns

| Anti-Pattern | Why Dangerous |
|--------------|---------------|
| Combining red+green in one delegation | Skips the failing-test proof — tests may be trivially true |
| Skipping refactor phase | Technical debt accumulates — later refactors become harder |
| Writing integration tests before unit passes | Integration failures hide unit-level bugs |
| Claiming green without running gate | No evidence that tests actually pass |
| Refactoring without test coverage | No safety net — behavior may change silently |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/tdd-loop-delegation.md` | Red-green-refactor delegation mechanics |
| `references/test-gate-enforcement.md` | Test gate rules and enforcement details |
| `references/test-first-packet.md` | TDD packet extension specification |
| `templates/tdd-delegation-packet.md` | Extended packet JSON template |
| `templates/build-verify-checkpoint.md` | Build-verify checkpoint JSON template |
| `tests/tdd-delegation.md` | TDD delegation scenario with validation |

## Independence Rules

- This package extends `use-hivemind-delegation` — it does not replace it
- It may be selected directly or composed with `hivemind-gatekeeping-delegation` for loop control
- TDD artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime
