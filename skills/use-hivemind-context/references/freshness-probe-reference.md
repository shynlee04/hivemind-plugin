# Freshness Probe Reference

## Quick Probe Commands

```bash
find . -name "*.md" -mtime -2 | head -10
git log --oneline --since="48 hours ago" -- . | head -10
git status --short --branch
```

## Session Checks

- Read `.hivemind/activity/sessions/continuity.json`
- Verify `_meta.updated_at` is recent
- Compare active branch and worktree to the last known session anchor

## IF/THEN Routing

1. **IF** docs are stale and code changed recently, **THEN** distrust docs first.
2. **IF** git shows shared-file churn in the last 48 hours, **THEN** mark context at least `SUSPECT`.
3. **IF** continuity state is missing or stale, **THEN** run a fresh context rebuild before routing deeper work.
