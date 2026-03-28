# Git Command Reference

## Retrieval Commands

```bash
git log --oneline --grep "decision:" -10
git show --stat --summary HEAD
git rev-list --max-count=20 HEAD
```

## Diff and Branch Commands

```bash
git diff --stat HEAD~1..HEAD
git branch --show-current
git stash list
```

## IF/THEN Routing

1. **IF** the decision already has a commit anchor, **THEN** start with `git show`.
2. **IF** only a keyword is known, **THEN** start with `git log --grep`.
3. **IF** the branch context is unclear, **THEN** check `git branch --show-current` before summarizing state.
