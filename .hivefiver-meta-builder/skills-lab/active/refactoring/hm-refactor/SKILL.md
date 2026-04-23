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

## Rollback Protocol

```bash
# If tests fail after refactor:
git diff HEAD~1  # See what changed
git checkout HEAD~1 -- <affected-files>  # Revert specific files
# OR
git reset --hard <last-good-commit>  # Nuclear option
```

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

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-test-driven-execution` | Owns test execution. This skill requires tests as safety gate. |
| `hm-debug` | Investigates failures. This skill may trigger debug if refactor breaks tests. |
| `hm-planning-with-files` | Owns task planning. This skill adds refactor steps to task_plan.md. |
