---
name: tdd-phase-execution
description: Phase-granular TDD enforcement for multi-phase plans. Use when: each plan phase needs its own red-green-refactor cycle, phase transitions require test evidence, incremental test suites must build across phases, or TDD discipline must be enforced per phase rather than per feature. Extends tdd-delegation with phase-level test gates and multi-phase state tracking.
---

# tdd-phase-execution

Phase-granular TDD enforcement for multi-phase plan execution. Governs per-phase red-green-refactor cycles, phase transition gates, and multi-phase test state tracking.

## Purpose

- Execute red-green-refactor cycles PER PLAN PHASE (not per feature or per slice)
- Enforce phase-level test gates before any phase transition occurs
- Build phase-specific test strategies (unit → integration → e2e per phase)
- Track TDD state across multi-phase plans with cumulative test evidence
- Provide granular evidence per phase TDD cycle for audit and rollback

## Use This For

- Multi-phase plans where each phase needs TDD discipline
- Phase transitions requiring test evidence before proceeding
- Incremental test suite building across sequential phases
- Workflows where TDD must be enforced at phase granularity
- Plans from `plan-engineering` that define discrete phases with deliverables

## Do Not Use This For

- Single-loop TDD on a single feature — use `tdd-delegation` directly
- Debug loops — use `course-correction-delegation`
- Test infrastructure setup — use `hitea` agent directly
- Plans without defined phases — use `tdd-delegation` for flat TDD

## Prerequisites

- `tdd-delegation` MUST be loaded — this skill extends it with phase granularity
- `use-hivemind-delegation` MUST be loaded — base delegation protocol
- A plan with defined phases must exist (from `plan-engineering` or equivalent)
- Test framework must be identified (jest, vitest, node:test, etc.)

## Sibling Skills

| Skill                               | Relationship                                                              |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `tdd-delegation`                  | Base TDD delegation — this skill extends it with phase granularity       |
| `use-hivemind-delegation`         | Base delegation protocol — all dispatches go through this               |
| `hivemind-gatekeeping-delegation` | Loop control — TDD iteration control within phases uses this            |
| `course-correction-delegation`    | Debug fallback — if a phase TDD fails, transition to debug delegation   |
| `tdd-workflow`                    | TDD methodology — this skill handles phase-level enforcement of it      |

## Phase TDD Lifecycle

Each plan phase is a complete TDD cycle. Phases are sequential — Phase N+1 cannot start until Phase N passes its transition gate.

### Per-Phase Red — Write Phase-Scoped Tests

- Child writes tests that define expected behavior FOR THIS PHASE ONLY
- Tests MUST fail when run — this proves they test real behavior
- Phase tests cover only the deliverables scoped to this phase
- Prior phase tests must continue to pass during red (no regressions)
- Child returns: test files written, test output showing expected failures
- Gate: phase test command produces expected failures, prior tests still pass

### Per-Phase Green — Implement Phase Minimum

- Child implements minimum code to make THIS PHASE's tests pass
- No cross-phase scope creep — do not implement Phase N+2 behavior in Phase N
- No refactoring beyond what's needed for green
- Prior phase tests must continue to pass
- Child returns: implementation files, test output showing all passes
- Gate: phase tests pass, ALL prior phase tests pass, build succeeds

### Per-Phase Refactor — Clean Phase Code

- Child improves code structure within THIS PHASE's scope
- All tests (this phase + all prior phases) must still pass after refactoring
- Refactoring must not introduce behavior from future phases
- Child returns: refactored files, test output showing all passes
- Gate: all tests pass, build succeeds, no behavior change

### Phase Transition Gate

Before moving from Phase N to Phase N+1, ALL of the following must pass:

| Check                        | Command                    | Pass Condition                         |
| ---------------------------- | -------------------------- | -------------------------------------- |
| Phase N tests pass           | Phase-specific test cmd    | All phase tests green                  |
| All prior phase tests pass   | Full test suite            | No regressions across phases           |
| Type check passes            | `npx tsc --noEmit`        | Zero type errors                       |
| Build succeeds               | `npm run build`            | Exit code 0                            |
| Lint passes                  | `npm run lint`             | No errors                              |
| Phase deliverable verified   | Phase-specific verification| Deliverable matches phase scope        |

**If any check fails → phase is NOT complete. Fix and re-run. No exceptions.**

## Phase Test Strategy Matrix

Different phase types require different test strategies. Map each phase to its strategy before starting red.

| Phase Type            | Primary Test Level | Secondary          | Test Strategy                                       |
| --------------------- | ------------------ | ------------------ | --------------------------------------------------- |
| **Foundation**        | Unit               | —                  | Test core types, interfaces, data structures        |
| **Core Logic**        | Unit               | Integration        | Test business logic; integration for external calls |
| **API / Interface**   | Unit               | Integration        | Test request/response; integration for endpoints    |
| **Data Layer**        | Unit               | Integration        | Test queries/mutations; integration for DB ops      |
| **Integration**       | Integration        | Unit               | Test cross-module flows; unit for edge cases        |
| **UI / Presentation** | Unit               | E2E                | Test component logic; E2E for user flows            |
| **Infrastructure**    | Unit               | Integration        | Test config/pipelines; integration for deployment   |
| **E2E / Polish**      | E2E                | Integration        | Test user journeys; integration for subsystems      |

### Strategy Rules

1. Foundation phases are ALWAYS unit-first — no integration tests until core types pass
2. Integration phases may write integration tests, but unit tests for edge cases come first
3. E2E phases only begin after ALL integration tests across prior phases pass
4. Each phase may only write tests at its designated levels — no cross-level scope creep

## Multi-Phase TDD State Tracking

Track TDD state across all phases in a single checkpoint file.

### Checkpoint Location

```
{project}/.hivemind/activity/delegation/phase-tdd-{plan_id}-checkpoint.json
```

### Checkpoint Schema

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
        "red": {
          "status": "complete",
          "tests_written": 8,
          "test_files": ["src/core/auth/__tests__/types.test.ts"],
          "failing_output_captured": true,
          "completed_at": "2026-03-24T10:05:00Z"
        },
        "green": {
          "status": "complete",
          "implementation_files": ["src/core/auth/types.ts"],
          "tests_passing": 8,
          "tests_failing": 0,
          "build_verify_passed": true,
          "completed_at": "2026-03-24T10:12:00Z"
        },
        "refactor": {
          "status": "complete",
          "files_refactored": ["src/core/auth/types.ts"],
          "tests_still_passing": true,
          "completed_at": "2026-03-24T10:18:00Z"
        }
      },
      "transition_gate": {
        "phase_tests_pass": true,
        "prior_phases_pass": true,
        "type_check_pass": true,
        "build_pass": true,
        "lint_pass": true,
        "all_green": true,
        "verified_at": "2026-03-24T10:20:00Z"
      }
    },
    {
      "phase_id": "phase-02-core-logic",
      "phase_index": 2,
      "status": "in_progress",
      "tdd_cycle": {
        "red": {
          "status": "complete",
          "tests_written": 12,
          "test_files": ["src/core/auth/__tests__/service.test.ts"],
          "failing_output_captured": true,
          "completed_at": "2026-03-24T10:25:00Z"
        },
        "green": {
          "status": "in_progress",
          "implementation_files": [],
          "tests_passing": 0,
          "tests_failing": 12
        },
        "refactor": {
          "status": "pending"
        }
      },
      "transition_gate": {
        "phase_tests_pass": false,
        "prior_phases_pass": true,
        "all_green": false
      }
    }
  ],
  "cumulative_test_count": 8,
  "cumulative_test_files": ["src/core/auth/__tests__/types.test.ts"],
  "last_verified_phase": 1,
  "blocked": false,
  "blocked_reason": null
}
```

### State Tracking Rules

1. Checkpoint MUST be updated after every TDD sub-phase (red, green, refactor)
2. `cumulative_test_count` reflects ALL tests across all completed phases
3. `cumulative_test_files` lists every test file from every phase
4. `last_verified_phase` is the highest phase index that passed its transition gate
5. If a phase is blocked, set `blocked: true` and `blocked_reason` with specific failure
6. Prior phase transition gates are IMMUTABLE once set — do not retroactively change pass/fail

## Per-Phase Delegation Packet

Extends the standard TDD delegation packet with phase-specific fields:

| Field                    | Type                            | Purpose                                              |
| ------------------------ | ------------------------------- | ---------------------------------------------------- |
| `phase_id`             | string                          | Unique phase identifier (e.g., `phase-01-foundation`) |
| `phase_index`          | number                          | 1-based phase order in the plan                      |
| `phase_type`           | string                          | Phase type from strategy matrix                      |
| `tdd_phase`            | `red \| green \| refactor`    | Current TDD sub-phase within this phase              |
| `test_level`           | `unit \| integration \| e2e`  | Test level this phase is allowed to write            |
| `prior_phase_tests`    | string[]                        | Test files from prior phases (must continue passing) |
| `test_gate_command`    | string                          | Command to verify this sub-phase completion          |
| `transition_gate_cmd`  | string                          | Command to verify full phase transition readiness    |
| `implementation_files` | string[]                        | Implementation files this sub-phase touches          |
| `test_files`           | string[]                        | Test files this sub-phase creates/modifies           |
| `plan_checkpoint_path` | string                          | Path to the multi-phase TDD checkpoint JSON          |

## Cross-Phase Regression Prevention

When executing Phase N, ALL tests from Phases 1..N-1 must continue passing.

### Regression Detection

1. Before green phase: run full test suite — confirm only new tests fail
2. After green phase: run full test suite — confirm zero failures
3. After refactor: run full test suite — confirm zero failures
4. At transition gate: run full test suite + build + type check + lint

### Regression Response

| Scenario                                     | Action                                              |
| -------------------------------------------- | --------------------------------------------------- |
| Prior phase test breaks during current red   | STOP. Fix prior test before writing new tests.      |
| Prior phase test breaks during current green | STOP. Implementation broke prior behavior. Fix.     |
| Prior phase test breaks during refactor      | REVERT refactor. Re-run. Fix if still broken.       |
| Build breaks after green                     | Green is not truly green. Fix and re-verify.         |

## Phase TDD Rollback

If a phase TDD cycle fails irrecoverably:

1. Record failure in checkpoint with `blocked: true` and `blocked_reason`
2. Return `status: "blocked"` with evidence of which sub-phase failed
3. Orchestrator may: re-delegate the sub-phase, decompose the phase further, or skip to next phase (with explicit user approval)
4. NEVER silently advance to next phase after a failure

## Anti-Patterns

| Anti-Pattern                                       | Why Dangerous                                               |
| -------------------------------------------------- | ----------------------------------------------------------- |
| Skipping red for "simple" phases                   | No proof tests are meaningful — may be trivially true       |
| Implementing cross-phase behavior in current green | Scope creep — phase boundaries break down                   |
| Writing e2e tests in a foundation phase            | Wrong test level — e2e depends on infrastructure not yet built |
| Advancing phase without transition gate            | No evidence phase is complete — regressions hide silently   |
| Modifying prior phase tests to pass current phase  | Silently erases prior phase contract — audit trail breaks   |
| Combining multiple phases into one TDD cycle       | Defeats purpose of phase granularity — use tdd-delegation   |
| Refactoring across phase boundaries                | Changes to Phase N code during Phase M refactor violates isolation |
| Claiming phase complete without running gate cmd   | No evidence — same as claiming green without running tests  |

## Bundled Resources

| Resource                                    | Purpose                                              |
| ------------------------------------------- | ---------------------------------------------------- |
| `references/phase-tdd-lifecycle.md`       | Detailed red-green-refactor rules per phase           |
| `references/phase-test-strategy.md`       | Phase type to test level mapping and rules            |
| `references/transition-gates.md`          | Gate checks, failure handling, gate result format     |
| `references/multi-phase-checkpoint.md`    | Full checkpoint schema and state tracking rules       |
| `templates/phase-delegation-packet.md`    | Per-phase delegation packet JSON template             |
| `templates/phase-tdd-checkpoint.md`       | Multi-phase TDD checkpoint JSON template              |
| `templates/transition-gate-result.md`     | Phase transition gate result JSON template            |
| `tests/multi-phase-tdd-scenario.md`       | Multi-phase TDD execution scenario with validation    |
| `tests/regression-detection.md`           | Cross-phase regression detection scenario             |

## Independence Rules

- This package extends `tdd-delegation` — it does not replace it
- It extends `use-hivemind-delegation` via `tdd-delegation` — base protocol always applies
- It may be composed with `hivemind-gatekeeping-delegation` for multi-iteration phase loops
- Phase TDD checkpoints are stored in `{project}/.hivemind/activity/delegation/` at runtime
- This skill is UNIVERSAL and framework-agnostic — applies to any project with multi-phase plans
