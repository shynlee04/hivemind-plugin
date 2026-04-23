# Safety Checklist

- [ ] All existing tests pass before refactor
- [ ] On a branch (not main)
- [ ] Each step committed
- [ ] Tests pass after each commit
- [ ] Rollback plan known

## Rollback Commands

```bash
# Revert specific files
git checkout HEAD~1 -- <files>

# Nuclear option
git reset --hard <last-good-commit>
```
