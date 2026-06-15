# Worktree Control — Git Worktree Isolation

## Why Worktrees Matter

From session evidence, agents fail when they can't control isolation:
- Fork a session to multiple → start at any turn
- Start in parallel different kinds of task
- If not controlling git worktree → mostly failure

**The rule:** Implementation work happens in worktrees. Main branch is for integration only.

## Git Worktree Commands

### Create a worktree
```bash
git worktree add ../worktree-<name> -b <branch-name>
```

### List worktrees
```bash
git worktree list
```

### Remove a worktree
```bash
git worktree remove ../worktree-<name>
```

### Prune stale worktrees
```bash
git worktree prune
```

## Fork Session Patterns

### Fork from current state
```bash
git worktree add ../worktree-feature -b feature-branch
cd ../worktree-feature
# Work in isolation
```

### Fork from a specific commit
```bash
git worktree add ../worktree-experiment -b experiment-branch <commit-sha>
```

## Parallel Task Isolation Rules

1. **Independent tasks** (no shared files) → Can run in parallel worktrees
2. **Dependent tasks** (task B needs task A's output) → Sequential, same worktree
3. **Same file tasks** → Never parallel, always sequential

## When to Use Worktrees vs Main Branch

| Scenario | Use | Why |
|----------|-----|-----|
| Implementing a feature | Worktree | Isolation, easy rollback |
| Quick investigation | Main branch | Read-only, no changes |
| Parallel experiments | Multiple worktrees | No interference |
| Bug fix while working | Worktree | Don't lose current state |
| Merging completed work | Main branch | Integration point |

## Session Recovery with Worktrees

If a session is interrupted:
1. `git worktree list` — find your worktrees
2. `cd ../worktree-<name>` — resume in the right worktree
3. `git status` — see what was in progress
4. `git log --oneline -5` — see recent commits
5. Resume from where you left off
