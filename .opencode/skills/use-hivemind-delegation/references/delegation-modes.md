# Delegation Modes

## Purpose

Defines the rules for choosing between sequential and parallel delegation execution modes. Provides the deterministic parallel gate that must be satisfied before parallel dispatch is allowed, and maps each delegation mode to its appropriate use case.

## Sequential First

Default to `sequential`. Stay sequential when:
- One slice depends on another slice's findings
- Two slices touch the same authority surface
- Debugging or verification is still unresolved
- Output of one task feeds the input of another

**Why sequential is the default:** Parallel dispatch without proven independence creates integration conflicts, wasted rework, and undetectable race conditions. The cost of one unnecessary sequential pass is trivial compared to resolving parallel conflicts.

## Parallel Gate

Parallel is allowed ONLY when ALL of:
1. All slices are isolated — no shared file mutations, no shared mutable state, no dependency on another slice's output
2. Merge-by-synthesis is safe — each slice returns independent findings that the orchestrator combines without conflict resolution
3. Explicit accounting exists — batch totals or slice counts are tracked

**Independence proof required:** Before choosing parallel, the orchestrator must answer:
- Do the tasks share any imports, types, or interfaces? → If yes, sequential
- Do the tasks modify the same directory? → If yes, sequential
- Could one task's output be another task's input? → If yes, sequential
- Are the tasks in completely separate codebases/modules with no shared state? → Parallel candidate

**Parallel candidate must pass one more check:** Can the full integration suite run against all parallel results simultaneously without ordering dependencies? If uncertain, sequential.

**Why the gate exists:** Parallel failures are harder to diagnose because the orchestrator must determine whether each failure is independent or cascading. Without proven independence, the orchestrator cannot make that determination.

## Mode Fit

| Mode | Use When | Primary Output | Success Test |
| --- | --- | --- | --- |
| `research` | Evidence or discovery is still missing | handoff brief + findings | All required evidence collected |
| `execution` | The slice is bounded and implementation-ready | handoff brief + slice result | Code compiles, tests pass, scope respected |
| `verification` | The output must be hard proof, not a fix | handoff brief + verification result | All verification checks pass with evidence |
| `planning` | The child should return stages, not edits | handoff brief + bounded plan | Plan covers all known requirements |

**Do not mix modes in one child.** A child doing research AND execution has two different success tests and cannot determine when it's done. Split into two delegations.

## Required Packet Fields

Every delegation packet must include:
- `concern` — what is being investigated or changed
- `objective` — the specific outcome expected
- `scope` — what the child must work on
- `out_of_scope` — what the child must NOT touch
- `execution_mode` — sequential or parallel
- `constraints` — hard boundaries (must/must not)
- `success_metrics` — how to determine the child is done
- `return_contract` — what the child must return
- `return_gate` — what must be true before the child considers itself complete

## Related

- `hivemind-gatekeeping-delegation` for iterative loop control
- `research-delegation` for research-specific mode selection
- `tdd-delegation` for TDD-specific mode selection
- `course-correction-delegation` for debug/refactor mode selection
