# Red-Green-Refactor Cycle

## Purpose

Use this reference after reading the main skill body. It expands gate mechanics for test-first execution.

## RED

Write one focused test before implementation.

One-test-at-a-time rule:

1. Pick one locked requirement or one bug reproduction.
2. Write one failing test through a public interface.
3. Run only the focused command needed to prove RED.
4. Implement the minimum GREEN change.
5. Refactor only after GREEN.
6. Repeat for the next behavior.

Do not write a pile of failing tests and then implement all of them. That hides whether each behavior independently drove design.

Required evidence:

- Test file and test name.
- Command run.
- Failure output showing the expected missing behavior.
- Statement that the failure is meaningful, not syntax/setup noise.
- Test size label: `small`, `medium`, or `large`.
- Public interface under test.

If the test passes, the RED gate fails. Rewrite the test or report that the feature already exists.

## Public Interface Discipline

Prefer assertions against public APIs, CLI output, UI semantics, events, persisted state, or documented module contracts. Private helper assertions are acceptable only when the helper itself is the public contract of the slice.

## Bug Fix Prove-It Flow

For defects, RED is the reproduction:

| Step | Required evidence |
|---|---|
| Reproduce | Failing test/command/manual reproduction showing the bug. |
| Prove failure | Why the failure matches the user-visible defect. |
| Fix | Minimal changed files. |
| Prove fixed | Same reproduction now passes plus relevant regression command. |
| Preserve | Permanent regression test or honest manual-only limitation. |

## GREEN

Write minimal implementation only for the failing test.

Required evidence:

- Files changed.
- Same test command now passes.
- No unrelated refactor bundled into GREEN.

## REFACTOR

Clean up after GREEN only.

Required evidence:

- Target tests still pass.
- Relevant broader suite passes or skipped scope is documented.
- Any broken refactor is reverted or split smaller.

## Retry Budget

After three focused attempts in one phase, stop and return a blocked handoff. More attempts without new evidence are loop theater, not TDD.

## Deep-Module Checkpoint

If a requirement is hard to test without mocking many internals, pause before GREEN and identify the public seam that should carry the behavior. A small interface change can be valid; a broad architecture rewrite is not part of a single TDD cycle unless the user authorized that scope.
