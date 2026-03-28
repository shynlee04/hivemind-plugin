---
name: hivemind-atomic-commit
description: Typed commit discipline — classifies changes by activity, validates pre-commit gates, produces structured commit messages with rollback support.
parent: use-hivemind
---

# hivemind-atomic-commit

Local commit discipline family for the refactored pack. Governs how changes are classified, ordered, validated, and committed as atomic, typed units with rollback support.

## Table of Contents

- [Purpose](#purpose)
- [Use This For](#use-this-for)
- [Do Not Use This For](#do-not-use-this-for)
- [Sibling Skills](#sibling-skills)
- [Activity Classification](#activity-classification)
- [Activity Mapping](#activity-mapping)
- [Git Gate Protocol](#git-gate-protocol)
- [Rollback Support](#rollback-support)
- [Core Process](#core-process)
- [Commit Message Format](#commit-message-format)
- [Rollback Plan](#rollback-plan)
- [Surface Ownership](#surface-ownership)
- [Bundled Resources](#bundled-resources)
- [Independence Rules](#independence-rules)
- [.opencode/ Write Prohibition](#opencode-write-prohibition)
- [Orchestrator Integration](#orchestrator-integration)

## Purpose

- Classify every changed file by activity class before committing
- Map dependencies between changed files to determine commit ordering
- Run pre-commit gate checks that block unsafe commits
- Produce typed conventional commit messages with activity metadata
- Generate rollback plans so every commit is reversible
- Enforce atomic commit discipline: one concern, one commit

## Use This For

- Any commit after refactoring, feature work, or bug fixes
- Changes that span multiple activity classes (code + docs + config)
- Commits where rollback safety must be explicit before proceeding
- Multi-file changes requiring dependency-aware batch ordering
- Pre-commit validation when working in worktrees or feature branches

## Do Not Use This For

- Trivial single-file commits with no rollback risk (use `git commit` directly)
- Commits that are purely WIP checkpoints (use `git stash` or WIP branches)
- Rebasing, cherry-picking, or history rewriting (use platform git tools)
- Merging branches (use platform merge tools)

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind-git-memory` | Records commit anchors and session continuity — this skill produces the commits that continuity tracks |
| `use-hivemind-delegation` | Delegation dispatches that need commit discipline use this skill's gate and classification before committing |
| `hivemind-codemap` | Codemap seam discovery informs surface ownership — this skill validates commits against surface boundaries |

## Activity Classification

Every changed file must be classified before committing.

| Class | Description | Granularity | Example Paths |
|-------|-------------|-------------|---------------|
| `artifact` | Design docs, PRDs, ADRs, plans | `whole-file` | `docs/plans/**`, `*.adr.md` |
| `code` | Implementation source, tests, types | `chunk` | `src/**/*.ts`, `tests/**/*.ts` |
| `meta` | Governance, agents, skills, config | `whole-file` | `AGENTS.md`, `opencode.json`, `*.skill.md` |
| `runtime` | Generated runtime state, activity logs | `line` | `.hivemind/**`, `dist/**` |
| `projection` | Mirrored/shim files, generated docs | `whole-file` | `.opencode/agents/**`, `docs/generated/**` |

Granularity levels: `line` (fine-grained), `chunk` (function/block), `section`, `whole-file`.

Hierarchy inheritance: child paths inherit parent class unless explicitly overridden.

Read `references/activity-classifier.md` for classification taxonomy, operations, and path-based rules.

## Activity Mapping

After classification, map dependencies between changed files to determine commit ordering.

Dependency types:
- `import` — file A imports from file B
- `type-ref` — file A references types from file B
- `config` — file A behavior depends on config in file B
- `generate` — file A is generated from file B
- `test-of` — file A tests file B

Ordering rules: dependencies commit first. Circular dependencies force a combined commit.

Read `references/activity-mapper.md` for dependency detection, activity map JSON, and batch detection.

## Git Gate Protocol

Six checks must pass before any commit proceeds:

| # | Check | Fail Condition |
|---|-------|---------------|
| 1 | Branch | Not on a feature branch or detached HEAD |
| 2 | Worktree | Working directory is not a valid linked worktree |
| 3 | Clean tree | Staged or unstaged changes conflict with commit scope |
| 4 | Branch appropriateness | Branch name does not match the activity class being committed |
| 5 | Secrets | Staged diff contains patterns matching secrets (API keys, tokens) |
| 6 | Conflicts | Unresolved merge conflict markers in staged files |

Read `references/git-gate.md` for gate result JSON, commit message format, and atomic commit rules.

## Rollback Support

Every commit must produce a rollback plan describing how to undo it.

Reversibility methods:
- `revert-commit` — standard `git revert`
- `file-restore` — restore specific files to prior state
- `branch-rollback` — reset branch to prior commit
- `manual-steps` — documented manual reversal procedure
- `irreversible` — commit cannot be cleanly undone (requires approval gate)

Read `references/rollback-protocol.md` for rollback plan JSON, approval gates, and execution steps.

## Core Process

1. **Declare intent** — state the concern and what files will be committed
2. **Classify** — classify each changed file using the activity taxonomy
3. **Map** — build the activity map with dependency ordering
4. **Gate** — run all 6 pre-commit gate checks
5. **Execute** — stage files per the ordered activity map
6. **Commit** — produce a typed conventional commit message with activity metadata
7. **Record** — emit the activity record and rollback plan

## Commit Message Format

```
<type>(<scope>): <description>

activity_classes: [<class>, ...]
activity_files: [<file>, ...]
rollback_method: <method>
gate_passed: <timestamp>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.

Read `references/git-gate.md` § Commit Message Format for full specification.

## Rollback Plan

Before committing, the rollback plan must be emitted. If the plan method is `irreversible`, user approval is required before the commit proceeds.

Read `references/rollback-protocol.md` for the approval gate protocol.

## Surface Ownership

Commits must respect surface class ownership boundaries. Each surface class has an authority owner.

Read `references/surface-ownership.md` for the 12 surface classes, ownership verification, and conflict resolution.

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/activity-classifier.md` | Classification taxonomy with 5 classes, 5 operations, 4 granularity levels |
| `references/activity-mapper.md` | Dependency detection, ordering rules, batch detection |
| `references/git-gate.md` | 6 gate checks, commit message format, atomic commit rules |
| `references/rollback-protocol.md` | 5 reversibility methods, rollback plan JSON, approval gates |
| `references/surface-ownership.md` | 12 surface classes, owners, ownership verification |
| `scripts/hm-activity-classify.sh` | Classify a file path → JSON classification |
| `scripts/hm-git-gate.sh` | Pre-commit gate checks → JSON gate result |
| `scripts/hm-atomic-commit.sh` | Stage + commit with typed message → JSON result |
| `templates/activity-record.md` | JSON template for a single file activity |
| `templates/activity-map.md` | JSON template for dependency-aware activity map |
| `templates/commit-gate-result.md` | JSON template for gate check results |
| `templates/rollback-plan.md` | JSON template for rollback planning |
| `tests/direct-invocation.md` | Basic scenario with validation |
| `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |

## Independence Rules

- This package is self-contained for commit discipline.
- It does not require old router-to-router chains.
- It may be selected directly or from any orchestrator workflow.
- Activity records are stored in `{project}/.hivemind/activity/commits/` at runtime.
- Classification rules are path-based with explicit override support.

## .opencode/ Write Prohibition

**DIRECT_WRITE_BAN**: This skill must NOT write to `.opencode/` directory.

- Classification and gate results are emitted to stdout as JSON
- Commit records are stored in `.hivemind/activity/commits/`
- Rollback plans are stored alongside commit records
- `.opencode/` is the user's project configuration space — read-only access for context gathering is permitted

## Orchestrator Integration

When an orchestrator uses this skill:
1. The orchestrator declares the intent and passes the file list
2. A subagent runs classification, mapping, gating, and commit
3. The orchestrator receives: commit SHA, activity classes, rollback method, gate result summary
4. The orchestrator does NOT stage or commit files directly — the subagent executes

If gate checks fail, the subagent returns `gate_failed` with blocked reasons. The orchestrator decides whether to fix and retry or escalate.
