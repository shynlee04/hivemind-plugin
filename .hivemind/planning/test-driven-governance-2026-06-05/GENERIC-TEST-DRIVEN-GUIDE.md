[LANGUAGE: Write this file in en per Language Governance.]
# Generic Test-Driven Development Guide

A project-agnostic reference for test-first execution. This guide is intentionally
technology-neutral. It is derived from a community skill that was authored against
three upstream patterns (a general agent-skills test-driven-development
pattern, a TDD skill emphasizing one-test-at-a-time discipline, and a portable
test template from a third-party pattern library). The operational rules, gates,
and evidence requirements have been preserved while all project-specific
vocabulary has been removed.

**Audience.** Implementers and reviewers who need a shared, minimal contract for
how new behavior is added, how defects are fixed, and how evidence is produced.

---

## When to use this guide

Use this guide whenever a change adds or modifies executable behavior. The
contract applies uniformly to:

- A new function, method, command, or API endpoint
- A new field on a record, event, or message
- A new user-visible flow in any interface layer
- A defect fix that affects observable behavior
- A refactor that touches public seams

If a change does not affect observable behavior (a comment, a typo, a build
flag), this guide does not apply. Mark the work as out-of-scope and continue.

---

## Core principles

### 1. Test-First Cycle (RED → GREEN → REFACTOR)

A test that fails for the right reason must exist before any implementation
change. The minimal implementation that makes it pass is written next.
Refactor happens only after the test passes — never before.

- **RED gate.** The test must fail before implementation. If it passes, stop.
  The slice is either already implemented, the test is asserting the wrong
  thing, or the test is not exercising the new behavior. Resolve before
  continuing.
- **GREEN gate.** Write the minimal implementation that makes the failing test
  pass. Avoid unrelated cleanup. Unrelated edits break the cycle's evidence
  chain.
- **REFACTOR gate.** Clean only after green. Behavior-preserving cleanup is
  allowed here, not before. If a refactor regresses a green test, revert the
  refactor or split it into its own cycle.

### 2. One Test at a Time

Each behavior is exercised by exactly one new failing test, which is then
driven to green before the next test is written. A pile of failing tests
written before any implementation hides which behavior independently drove
which design.

- Pick one locked requirement. Write its failing test. Run the focused
  command. Make the test pass. Only then move to the next requirement.
- The only exception is the rare case where a requirement is genuinely
  inseparable. In that case, the bundle must be documented and justified.

### 3. Public-Interface Discipline

Tests assert against externally observable surfaces. The default target is:

- A public API: return value, thrown error, side effect on shared state
- A command-line interface: stdout, stderr, exit code, observed file changes
- A user interface: rendered output, captured event, accessibility tree
- An event stream: emitted record, observed state transition
- A persistence layer: written record, read record, transaction outcome
- A documented contract: the behavior the contract promises

Mocking internals is acceptable only when the helper is itself the slice's
public contract. Tests that need to mock many private helpers to pass usually
indicate that the public seam is in the wrong place. Pause and re-design the
seam before continuing.

### 4. Boundary-Only Mocking with Explicit Preference Order

Mocks are a last resort. The default preference order, highest first, is:

1. **Real implementation** through the public interface. Use when the
   dependency is fast, deterministic, and self-contained.
2. **Fake implementation** for expensive external systems. A fake is a
   hand-rolled in-process implementation of an external dependency with
   realistic but controlled behavior. Use when the real dependency is slow,
   rate-limited, or has a non-deterministic surface (time, network).
3. **Stub** for deterministic boundary values. A stub is a small piece of code
   that returns pre-canned answers. Use when the test only needs a specific
   return value, not realistic behavior.
4. **Mock** for transport, clock, external service, or failure injection. A
   mock verifies call sequences and lets the test inject failures. Use only
   for boundaries that cannot be exercised any other way.

If the test ends up needing mocks at more than one boundary, the test is
probably testing too much. Split it.

### 5. Honest Evidence Labels

Every test result carries an evidence label that describes what the test
actually exercises. Labels form a hierarchy, highest to lowest:

- **`runtime-truthful`** — the test exercises real behavior through public
  seams. Preferred for any acceptance claim.
- **`transport-mocked`** — the test exercises real behavior through public
  seams but replaces a transport (HTTP, message bus, file system) with a fake
  or in-process adapter. Acceptable when the transport itself is not in scope.
- **`mock-heavy`** — the test substitutes enough internals that any
  implementation of the unit would pass. Insufficient on its own for
  acceptance claims; must be paired with runtime-truthful or
  transport-mocked evidence.
- **`manual-only`** — the behavior is verified by a human, not by an
  executable test. Insufficient for automated gates.

Mock-heavy and manual-only evidence cannot by themselves close
runtime-truthful acceptance criteria. They may be combined with stronger
evidence, never used alone.

### 6. Coverage Is Evidence, Not a Grade

Coverage claims require fresh command output from the current work session.
There are four valid states:

- **`PASS`** — the coverage command ran and produced a percentage. Report the
  command, the percentage, and the date.
- **`PARTIAL`** — behavioral tests ran, but the coverage command did not
  finish or only covered a subset. Report what ran and what was missing.
- **`MISSING`** — the tooling is absent. Report the tooling gap. Do not
  estimate a percentage.
- **`BLOCKED`** — setup or dependency failure prevented coverage. Report the
  command attempted and the failure.

A high coverage percentage on a slice with invalid RED is still a blocked
slice. Coverage is necessary, not sufficient.

### 7. Test-Size Discipline

Every test is labeled by size. Each size has a different evidence requirement.

- **`small`** — a single unit tested through a public seam. The target
  command runs in milliseconds and filters to the test file.
- **`medium`** — multiple modules or a real persistence or process boundary.
  Setup and teardown must be noted. A focused run command is required.
- **`large`** — end-to-end or browser-driven. The runtime command, the
  environment or server bring-up, and a user-visible behavior note are all
  required.

Do not call a heavily-mocked unit test a "medium" because it imports from
two files. Do not call a 30-second setup a "small" test because the
assertion is single-line.

### 8. Anti-Pattern Catalogue and Retry Budget

Five anti-patterns each have a detection signal and a correction path. When
the correction path is exhausted, the work is blocked, not looped: after
three focused attempts at RED or GREEN, stop and return a blocked handoff
with the command output and the next hypothesis. More attempts without new
evidence is "loop theater," not test-first execution.

| Anti-pattern | Detection | Correction |
|---|---|---|
| Test-After Claim | Implementation existed before tests | Label as test-after or restart with a true RED cycle |
| Fake Green | Test would pass if the implementation were removed | Rewrite assertion against observable behavior |
| Mock Theater | Internals mocked so runtime behavior is untested | Add runtime-truthful or transport-boundary evidence |
| Coverage Lie | Coverage percentage cited without fresh command output | Run coverage now, or mark coverage missing |
| Infinite Fix Loop | Same failing test after repeated attempts | Stop after the retry budget and return blocked evidence |

---

## Workflow

The canonical test-first cycle is one test at a time, with evidence at each
gate.

```
Pick one locked requirement
        │
        ▼
Write a failing test that asserts on a public interface
        │
        ▼
Run the focused test command  ──────►  Test passes?  ──YES──►  STOP: invalid RED.
        │                                                Rewrite the test
        ▼                                                 or report the slice
Test fails for the right reason?                          as not TDD-eligible.
        │
   ┌────┴────┐
   │NO       │YES
   ▼         ▼
  Rewrite   Write the minimal implementation
  the test  that makes the test pass
            │
            ▼
            Run the focused test command
            │
            ▼
            Test passes?  ──NO──►  Attempt 2: minimal fix.  ──NO──►  Attempt 3:  ──NO──►  BLOCKED HANDOFF
                      │                                          diagnose carefully            (3rd attempt failed)
                  YES ▼
            Run coverage on the changed surface  ──►  coverage_status: PASS / PARTIAL / MISSING / BLOCKED
                      │
                  YES ▼
            Refactor only if the surface needs it; run tests after each change
                      │
                      ▼
            Pick the next locked requirement and loop
```

A focused test command filters to the test file or name pattern. Examples by
ecosystem:

| Ecosystem | Focused command |
|---|---|
| Node (vitest) | `npx vitest run path/to/file.spec.ts -t "behavior name"` |
| Node (jest) | `npx jest path/to/file.spec.ts -t "behavior name"` |
| Python (pytest) | `pytest path/to/file_test.py::TestClass::test_behavior -x` |
| Go | `go test -run TestBehavior ./path/to/package -count=1` |
| Rust | `cargo test behavior_name -- --nocapture` |

If the project uses a different runner, detect it before running. Do not
assume a stack. If no runner exists, return `blocked-tooling` or
`manual-only` evidence.

---

## Evidence and coverage

The required evidence for any test-first cycle is:

1. The test file path and the test name.
2. The test size (`small`, `medium`, or `large`).
3. The evidence label target (`runtime-truthful` preferred).
4. The focused run command that demonstrates the test's state.
5. The output of that command (or a summary, if verbose).
6. The coverage command and its result, with the four-state status.
7. The commit hash that captures the cycle.

A cycle is not complete without items 1, 4, 5, and 6. The remaining items are
expected defaults; their absence is a flag, not a blocker.

---

## Bug fix path (Prove-It)

For defect work, the reproduction is the RED phase.

1. **Reproduce.** Write a test that exhibits the user-visible defect. The
   test must fail for the same reason the user observed.
2. **Prove failure matches.** Run the test and confirm the failure mode
   matches the user-visible defect, not an unrelated error.
3. **Minimal fix.** Make the smallest change that turns the test green. Do
   not refactor adjacent code in the same cycle.
4. **Prove fixed.** Run the test, confirm green, and run the surrounding test
   surface to confirm no regression.
5. **Preserve.** The reproduction test stays in the suite as a permanent
   regression guard. It is never deleted as part of a future cleanup.

If step 2 cannot produce a matching failure, the test is asserting the wrong
thing. Restart step 1 with a test that more directly captures the user-visible
defect.

---

## Anti-patterns: extended notes

The five anti-patterns in Principle 8 share a common shape: they feel
productive in the moment and produce false confidence. Detection is the only
reliable defense.

- **Test-After Claim** is the most common. A test is written against
  existing code, then labelled as RED by arguing "the test would have failed
  if the code were absent." This is not RED. The remedy is to either label
  the work as test-after, or remove the implementation and re-run the cycle
  with a true RED.
- **Fake Green** often appears in tests with weak assertions. The test
  compiles, runs, and passes — but the assertion does not exercise the new
  behavior. The remedy is to assert on the observable outcome, not on
  trivial side effects.
- **Mock Theater** is the default failure mode in layered systems. The test
  replaces so many internals that the assertion is effectively testing the
  mocks. The remedy is to push the assertion outward toward the public seam.
- **Coverage Lie** is the most preventable. A coverage claim without a
  command and a date is untrustworthy by default. The remedy is to run the
  coverage command in the same session as the claim.
- **Infinite Fix Loop** is the failure mode of the retry budget. Three
  attempts with the same hypothesis is the upper bound; the fourth attempt
  is a sign the hypothesis is wrong. The remedy is a blocked handoff with
  evidence and a new hypothesis.

---

## Blocked handoff format

When a cycle is blocked, the implementer returns the following so the next
executor can resume without rebuilding context.

```
cycle_id: <name or requirement id>
slice: <one-line description>
state: <RED | GREEN | REFACTOR>
attempts: <integer 1-3, the reason this is the last>
evidence_label_target: <runtime-truthful | transport-mocked | mock-heavy | manual-only>
focused_command: <the exact command>
focused_output: <the relevant excerpt, not a full log>
hypothesis_tried: <one sentence>
new_hypothesis: <one sentence, what the next executor should try instead>
next_action: <the smallest next step>
blocked_at: <ISO-8601 timestamp>
```

A blocked handoff is not a failure. It is the correct outcome when the
hypothesis is exhausted. A cycle that completes in three attempts and
returns evidence is preferred over a cycle that loops until something
accidentally turns green.

---

## Exit criteria

A test-first cycle is complete when:

- The test exists, fails for the right reason, and now passes.
- The evidence label is `runtime-truthful` or `transport-mocked`, and the
  higher label was not feasible for a documented reason.
- The coverage command ran and produced a valid four-state status.
- The commit captures the test, the implementation, and the evidence.
- No refactor is in flight against an unproven behavior.

A feature or work item is complete when all of its cycles satisfy the
criteria above. A blocked cycle must be either resolved (so the criteria
are met) or explicitly accepted by the next owner with a documented reason.

---

## Source references

The distillation in this guide draws on three upstream test-first patterns:

- A general agent-skill test-driven-development pattern: adopt the Prove-It
  bug-fix pattern, test-size labels, state-over-interactions emphasis, DAMP
  test readability, the real/fake/stub/mock preference order, and the
  runtime-verification warnings.
- A second TDD skill: adopt the one-test-at-a-time vertical cycle, the
  public-interface discipline, and the refactor-only-after-green rule.
- A portable test-template pattern: adapt the action/status vocabulary and
  the portable test template; reject hard-coded command wrappers so the
  guide stays runner-agnostic.

The guide intentionally omits any tooling names, command wrappers, or
ecosystem-specific assumptions. The workflow adapts to the project's test
runner; the principles do not change.
