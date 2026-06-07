---
name: hm-test-driven
description: >
  Execute TDD cycles with RED-GREEN-REFACTOR discipline. Use when the user wants
  to write a failing test, implement minimum code to pass, and refactor for
  cleanliness. Triggers on verbs like "test", "TDD", "red-green", "coverage",
  "vitest", "write a failing test", "assert". Pairs with `hm-spec-authoring` for
  the upstream spec, and `hm-arch-refactor` for post-cycle refactor decisions.
  Pattern 3 Process — multi-step workflow with explicit gates. Tech-agnostic +
  stack-agnostic. NOT for exploratory coding (load `hm-spec-authoring` first),
  NOT for debugging existing tests (load `hm-debug-systematic`).
metadata:
  consumed-by:
    - "hm-executor"
    - "hm-orchestrator"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P3-Process"
  realm: "test,spec,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - delegate-task
  - hivemind-trajectory
---

# Test-Driven Execution

Execute one TDD cycle: write a failing test, implement minimum code to pass,
refactor for cleanliness. Each cycle is atomic, with fresh evidence captured.

## When This Skill Loads — Do This First

1. **Verify a spec exists.** If no REQ-NNN acceptance test to drive, refuse:
   "I cannot TDD without a spec. Load `hm-spec-authoring` first or
   provide an acceptance test."
2. **Identify the REQ.** Pick ONE REQ-NNN to drive in this cycle.
3. **Write the test FIRST.** A test that fails for the reason the spec
   describes (not an unrelated error).
4. **Confirm RED.** Run the test, capture the failure as evidence.
5. **Write the minimum code.** The smallest change to turn the test green.
6. **Confirm GREEN.** Run the test, capture the pass.
7. **Coverage claim.** Run `npm test` (or focused) + `npm run typecheck`,
   capture output.
8. **Refactor (only if needed).** Clean up duplication, rename for clarity.
   The test must stay green throughout the refactor.

## The 5-Stage Cycle

### Stage 1: RED (failing test first)

Write a test that asserts the behavior described in the spec. The test
MUST fail before any implementation. Failure must be the asserted behavior,
not an unrelated error (typo, missing import, etc.).

**Anti-pattern:** "I'll write the test alongside the implementation" →
this is test-after, not test-first. Reject.

**Anti-pattern:** "The test passes because the assertion is wrong" →
the test is not actually testing the spec. Reject.

### Stage 2: GREEN (minimum implementation)

The smallest change that makes the test pass. No extra features, no
defensive code, no premature optimization.

**Anti-pattern:** "I'll add error handling while I'm here" → not minimum.
Add error handling in a separate cycle if the spec requires it.

**Anti-pattern:** "I'll refactor the existing code too" → not minimum.
Refactor in a separate cycle (Stage 5).

### Stage 3: Coverage claim

```bash
npm run typecheck  # 0 errors
npm test -- <focused-pattern>  # green
npm run test:coverage  # report PASS / PARTIAL / MISSING / BLOCKED
```

Capture all 3 outputs as evidence. Coverage state:
- **PASS** — coverage command ran, percentage reported
- **PARTIAL** — tests ran but coverage command incomplete
- **MISSING** — coverage tooling absent
- **BLOCKED** — setup or dependency failure

### Stage 4: REFACTOR (only if needed)

If the GREEN implementation introduced duplication, magic strings, or
unclear naming, refactor. Tests must stay green throughout. Capture
post-refactor test output as evidence.

**Skip Stage 4** if GREEN implementation is already clean.

### Stage 5: COMMIT

One atomic commit per cycle:

```
test(REQ-NNN): <one-line description>

Refs: AUDIT-04 / TDD cycle
Evidence: <test output path>
```

## Public-Interface Discipline (binding)

Tests assert against externally observable surfaces. The binding public
seams for this skill:

- **Tool functions**: the `execute` function + the JSON envelope
- **Hook functions**: the mutation passed to next middleware
- **State stores**: the public `get`/`read` method
- **Lifecycles**: the phase transition via the public manager API

Mocking internals is acceptable only when the helper is itself the slice's
public contract. If a test needs to mock several internals to pass, the
public seam is in the wrong place — pause and re-design.

## Evidence Hierarchy (binding)

| Level | Type | Use |
|---|---|---|
| L1 | runtime-truthful | Required for any acceptance claim |
| L2 | transport-mocked | OK for SDK wrapper changes when SDK out of scope |
| L3 | mock-heavy | Insufficient alone; pair with L1 or L2 |
| L4 | manual-only | Insufficient for automated gates |
| L5 | documentation-summary | Insufficient for acceptance claims |

L3 and L4 cannot close L1 acceptance criteria.

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Test-after (write impl first) | Test passes for wrong reason (or trivially) | Write test first, see it fail |
| Bundle of failing tests | Hides which behavior drove which design | One failing test at a time |
| "Just one more try" at iteration 6 | Loop theater | After 3 same-hypothesis failures, escalate |
| Refactor before green | Refactor can regress the test | Refactor only after green |
| Mock-heavy to skip real impl | Mock returns what impl would return → test passes for any impl | Use L1 evidence; mock only the seam, not the body |
| L3/L4 evidence for L1 claim | "I ran it manually" is not proof | Re-run with L1 (focused test, typecheck) |

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-spec-authoring` | Upstream — provides the REQ-NNN + acceptance test to drive |
| `hm-debug-systematic` | Downstream — when a test fails unexpectedly, load this to diagnose |
| `hm-arch-refactor` | Parallel — refactor strategy when cycles are done |
| `hm-coord-loop` | Multi-cycle coordination (3+ cycles in one phase) |
| `hm-gate-triad` | Validates TDD output at end of phase |

## Additional Resources

### Reference Files
- **`references/red-green-refactor-protocol.md`** — detailed protocol per stage
- **`references/evidence-labels.md`** — L1-L5 hierarchy with examples
- **`references/coverage-states.md`** — PASS/PARTIAL/MISSING/BLOCKED definitions

### Templates
- **`templates/tdd-cycle-card.md`** — one-card-per-cycle for the planner

### Workflows
- **`workflows/one-cycle.md`** — 5-stage sequence with checklist
- **`workflows/multi-cycle-coordination.md`** — 3+ cycles with checkpoints

### Scripts
- **`scripts/run-cycle.sh`** — one-shot wrapper for the 5 stages

### Evaluation
- **`evals/evals.json`** — 5 TDD test cases (spec → failing test → impl)
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
