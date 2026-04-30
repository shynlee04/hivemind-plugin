---
name: hm-refactor
description: >
  Decide between surgical and structural refactoring with scope, safety, and rollback planning.
  Use when cleaning code, restructuring modules, improving architecture, when code has grown
  organically and needs organization, when technical debt is accumulating, or when the user
  says "this code is a mess" or "clean this up." Even when they don't explicitly say "refactor."
  Triggers: "refactor", "clean up code", "restructure", "improve architecture", "technical debt",
  "code organization", "surgical refactor", "structural refactor".
  NOT for rewrites that change behavior or for trivial formatting fixes.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## Overview

Decision framework for choosing between surgical and structural refactoring approaches. Use when cleaning up code, restructuring modules, addressing technical debt, or reorganizing grown-organic codebases. Produces scoped refactoring plans with rollback strategies and safety guardrails.

## The Iron Law

```
Refactoring without tests is restructuring. Restructuring without rollback is reckless.
```

# Refactor Decision Framework
## On Load

1. Read `references/refactor-taxonomy.md` — surgical vs. structural refactor decision tree
2. Read `references/safety-checklist.md` — pre-refactor safety checks

## Refactor Taxonomy

## Gated Refactor Protocol

Adapted from GitHub `awesome-copilot` `refactor-plan`: refactors are planned as deterministic, reversible sequences with verification between changes. Do not start by editing code. First map affected files, dependency direction, test coverage, and rollback.

| Gate | Required output | Stop condition |
|------|-----------------|----------------|
| Scope map | Files/functions/modules touched and why behavior stays unchanged | Unknown callers or side effects |
| Sequence | Ordered steps: types/interfaces first, implementation moves second, tests/fixtures last | Steps cannot be independently verified |
| Safety net | Existing tests or characterization tests before structural moves | No way to detect behavior drift |
| Rollback | Per-step rollback command or commit boundary | Rollback requires blanket reset/clean |
| Verification | Command after each step and final integration command | Verification unavailable or unrelated |

Use `references/refactor-runbook.md` for the execution worksheet.

### Surgical Refactor

| Attribute | Value |
|-----------|-------|
| Scope | Single function, variable rename, inline extraction |
| Risk | Low |
| Tests | Existing tests must pass before and after |
| Rollback | `git checkout -- <file>` |
| Time | Minutes |

**Examples:** Rename variable, extract function, remove dead code.

### Structural Refactor

| Attribute | Value |
|-----------|-------|
| Scope | Module boundaries, dependency direction, file moves |
| Risk | High |
| Tests | Existing + new integration tests required |
| Rollback | `git revert <commit>` or branch delete |
| Time | Hours to days |

**Examples:** Split god object, invert dependency, introduce interface.

## Decision Tree

```
Does the change alter behavior?
├── YES → This is NOT a refactor. Stop. Write spec first.
└── NO → How many files are affected?
    ├── 1 file, 1 function → Surgical
    └── Multiple files or modules → Structural

Structural: Are tests comprehensive?
├── YES → Proceed with branch + incremental commits
└── NO → Write tests FIRST, then refactor
```

## Safety Checklist

- [ ] All existing tests pass before refactor
- [ ] Refactor is on a branch (not main)
- [ ] Each incremental step is committed
- [ ] Tests pass after each commit
- [ ] Rollback plan is known (branch name or commit hash)
- [ ] Affected dependency graph is mapped before moving modules
- [ ] Verification command is attached to every refactor step

## Rollback Protocol

```bash
# If tests fail after refactor:
git diff HEAD~1  # See what changed
git checkout HEAD~1 -- <affected-files>  # Revert specific files
```

Avoid blanket reset/clean operations in agent worktrees. Prefer file-specific checkout for files changed in the current refactor step, or revert the step commit when the workflow allows commits.

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| `github/awesome-copilot` refactor-plan | ADOPT | Safe sequence, affected-file/dependency map, verification between changes, and rollback worksheet. |
| `addyosmani/agent-skills` incremental implementation | ADAPT | Small reversible steps and characterization tests are used as safety gates. |
| GitHub agent skill resource model | ADAPT | Runbook and evals carry detailed reusable material instead of bloating SKILL.md. |

## Independence Notes

This skill works in any Git-backed end-user project. If no git repository exists, replace commit rollback with copied-file checkpoints and document that rollback is degraded. Do not assume GSD, BMAD, or HiveMind phase state.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Behavior Changer** | Refactor changes output or side effects | Stop. This is a rewrite, not a refactor. Write spec. |
| **The Testless Restructure** | Restructures without running tests | Run tests before EVERY step |
| **The Mega-Commit** | Refactors 20 files in one commit | Commit after each file or logical unit |
| **The No-Rollback** | Works on main without branch | `git checkout -b refactor/<name>` before touching code |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/refactor-taxonomy.md` | Choosing between surgical and structural |
| `references/safety-checklist.md` | Pre-refactor safety verification |
| `references/refactor-runbook.md` | Step worksheet, dependency map, rollback table |
| `evals/evals.json` | Trigger and pressure scenarios for no-behavior-change compliance |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-test-driven-execution` | Owns test execution. This skill requires tests as safety gate. |
| `hm-debug` | Investigates failures. This skill may trigger debug if refactor breaks tests. |
| `hm-planning-with-files` | Owns task planning. This skill adds refactor steps to task_plan.md. |
