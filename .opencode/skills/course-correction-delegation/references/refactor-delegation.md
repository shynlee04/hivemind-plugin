# Refactor Delegation

## Purpose

Delegate refactor work with the assess→plan→execute→verify pattern.

## Phase Breakdown

### Assess Phase

**Goal:** Understand the current state before changing anything.

**Child must:**
- Map dependencies of the target area
- Identify code smells and structural issues
- Catalog available refactor seams (extractable functions, interfaces, modules)
- Assess risk level of the refactor

**Return:** Dependency map, code smells, seam inventory, risk assessment.

### Plan Phase

**Goal:** Design the refactor before executing.

**Child must:**
- Define refactor steps in order
- Identify which seams to use
- Plan rollback strategy if something breaks
- Estimate blast radius

**Return:** Ordered refactor steps, seam selection, rollback plan.

### Execute Phase

**Goal:** Apply the refactor changes.

**Child must:**
- Execute refactor steps in planned order
- Run tests after each significant change
- Stop if tests fail — do not continue past a failure
- Document what changed and why

**Return:** Modified files, diff summary, test output at each step.

### Verify Phase

**Goal:** Confirm behavior is preserved.

**Child must:**
- Run full test suite
- Run type check
- Compare behavior before/after
- Verify no regressions

**Return:** Test output, type check output, behavior comparison.

## Cross-Reference

Refactor methodology: `use-hivemind-detox-refactor`
Delegation mechanics: `use-hivemind-delegation`
Loop gating: `hivemind-gatekeeping-delegation`
