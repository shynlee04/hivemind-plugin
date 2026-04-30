# Refactor Runbook

Use this worksheet before editing. It adapts GitHub `refactor-plan` sequencing into a lightweight agent-safe protocol.

## 1. Scope Map

| Item | Evidence |
|------|----------|
| Refactor intent | <why behavior-preserving change is needed> |
| Files/functions/modules touched | <paths and symbols> |
| Callers/importers | <grep or language-server evidence> |
| Behavior invariants | <what must not change> |
| Out-of-scope files | <explicit exclusions> |

## 2. Safe Sequence

| Step | Change type | Files | Verification | Rollback |
|------|-------------|-------|--------------|----------|
| 1 | Types/interfaces or adapters | <paths> | <command> | `git checkout -- <paths>` |
| 2 | Implementation move/extract/rename | <paths> | <command> | `git checkout -- <paths>` |
| 3 | Tests/fixtures/docs update | <paths> | <command> | `git checkout -- <paths>` |

## 3. Decision Rules

- If behavior changes, stop and route to spec-driven work.
- If the dependency graph is unknown, inspect before editing.
- If no verification command exists, add characterization tests or document a manual invariant before structural moves.
- If rollback requires deleting unowned files, stop and ask for architecture/worktree guidance.
