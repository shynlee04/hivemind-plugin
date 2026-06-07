---
name: hm-arch-refactor
description: >
  Architecture decisions + structural refactor. Use when the user wants to
  refactor code without changing behavior, restructure modules, or document
  an architecture decision. Triggers on verbs like "refactor", "restructure",
  "extract", "consolidate", "ADR", "architect", "module split". Pattern 3
  Process — multi-step: intent → map → decide → refactor → regression-test.
  Tech-agnostic + stack-agnostic. NOT for routine code cleanup (do inline),
  NOT for bug fixing (load `hm-debug-systematic`), NOT for TDD on a new
  feature (load `hm-test-driven`).
metadata:
  consumed-by:
    - "hm-architect"
    - "hm-executor"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P3-Process"
  realm: "arch,spec,test,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - delegate-task
---

# Architecture + Refactor

Two operations in one skill: (1) write Architecture Decision Records (ADRs)
for high-impact design choices, (2) refactor code structurally without
changing behavior.

## When This Skill Loads — Do This First

1. **Clarify intent.** Is this a structural refactor (no behavior change)
   or a new architecture decision (locks a design choice)? Different
   flows below.
2. **Map the current state.** Read the affected code. List the modules,
   functions, types, and their dependencies. Cite file:line.
3. **Identify the goal.** What does "done" look like? New module
   structure? New ADR? Specific code-level change?

## Flow A: Structural Refactor

For: "refactor X", "split module Y", "consolidate Z", "rename W".

### Step 1: Establish baseline behavior

Before refactoring, capture the current behavior as tests. If tests
don't exist, write them first via `hm-test-driven`. Without a
behavior-preserving test suite, refactor is blind.

**Evidence required:** Test output showing current behavior passes.

### Step 2: Plan the refactor

Document the target structure:
- New module names
- What moves where
- What gets renamed
- What gets deleted
- What cross-references need updating

### Step 3: Refactor incrementally

One atomic commit per logical change. Run tests after each. If tests
break, the refactor changed behavior — revert and re-plan.

**Anti-pattern:** Big-bang refactor in one commit. Bisect becomes
useless when something breaks.

### Step 4: Verify behavior preserved

After all refactor commits, run the full test suite. Behavior must be
identical to baseline.

**Evidence required:** Test output before and after, side-by-side
comparison.

### Step 5: Update cross-references

If the refactor renamed or moved things, update:
- Agents that reference the old name
- Commands that load the refactored module
- Workflows that include the module
- References + templates that mention it

## Flow B: Architecture Decision Record (ADR)

For: high-impact design choices that need to be locked + defended.

### Step 1: State the problem

One paragraph: what decision is needed? Why now? What are the
constraints?

### Step 2: List options

≥3 candidate approaches. For each:
- What it is (1 sentence)
- Trade-offs (pros/cons)
- What it implies for the system

### Step 3: Document the decision

State the chosen option, the rejected alternatives, and the reasoning.
Cite the evidence (research, benchmarks, prior art, constraints).

### Step 4: ADR format

```markdown
# ADR-NNN: <Title>

**Status:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
**Date:** YYYY-MM-DD
**Deciders:** <who>

## Context
<1-2 paragraphs: what problem, why now>

## Decision
<the chosen option + 1-sentence summary>

## Options Considered

### Option 1: <name> (chosen)
- Pros: ...
- Cons: ...
- Implications: ...

### Option 2: <name> (rejected)
- Pros: ...
- Cons: ...
- Why rejected: ...

### Option 3: <name> (rejected)
...

## Consequences
- What becomes possible: ...
- What becomes harder: ...
- What is now out of scope: ...
```

### Step 5: Commit the ADR

ADRs are L5 documentation. Commit to `.planning/architecture/`:

```
docs(adr-NNN): <title>
```

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| Refactor without tests | Blind — you can't tell if behavior changed | Step 1: establish baseline |
| Big-bang refactor | Bisect useless when broken | Step 3: atomic commits |
| ADR without rejected alternatives | Just a decision, not a record | Step 2: list 3+ options |
| ADR that justifies the obvious | Wastes L5 storage | Only ADRs for HIGH-IMPACT choices |
| Renaming in a refactor (instead of just structural move) | Hides the structural change in a rename | Separate refactor from rename |

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-test-driven` | Provides baseline behavior tests before refactor |
| `hm-debug-systematic` | When the refactor surfaces a bug, route to debug |
| `hm-spec-authoring` | For new features, spec first, refactor after |
| `hm-coord-router` | Decides when to invoke this skill (intent = refactor) |

## Additional Resources

### Reference Files
- **`references/adr-template.md`** — full ADR template with examples
- **`references/refactor-checklist.md`** — pre/post-refactor verification

### Templates
- **`templates/adr-stub.md`** — blank ADR with section headers
- **`templates/refactor-plan.md`** — target-structure doc

### Workflows
- **`workflows/structural-refactor.md`** — detailed Flow A
- **`workflows/adr-authoring.md`** — detailed Flow B

### Evaluation
- **`evals/evals.json`** — 5 refactor + ADR cases
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
