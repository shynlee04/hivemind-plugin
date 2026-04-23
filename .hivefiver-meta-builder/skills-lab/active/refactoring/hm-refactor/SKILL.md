---
name: hm-refactor
description: Decide between surgical and structural refactoring with scope, safety, and rollback planning. Use when cleaning code, restructuring modules, or improving architecture. NOT for rewrites that change behavior or for trivial formatting fixes.
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

# Refactor Decision Framework

## 6-NON Defence Table

| NON | Defence |
|-----|---------|
| NON-1 | Pre-authoring audit: refactor taxonomy in `references/refactor-audit.md` |
| NON-2 | Stacks with `hm-debug` + `hm-test-driven-execution`; clashes with rewrite-without-tests |
| NON-3 | Entry: refactor intent identified → Exit: refactored + verified → Loop-back: tests fail |
| NON-4 | `metadata.layer: 2` — picked by pure-orchestrators and task-completers |
| NON-5 | Stacked eval with `hm-test-driven-execution` + `hm-planning-with-files` |
| NON-6 | P2-hybrid pattern: body ~230 LOC, 3 references, 2 scripts |

## The Iron Law

```
Refactoring without tests is restructuring. Restructuring without rollback is reckless.
```

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
