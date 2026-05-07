# Safety Checklist

- [ ] All existing tests pass before refactor
- [ ] On a branch (not main)
- [ ] Each step committed
- [ ] Tests pass after each commit
- [ ] Rollback plan known
- [ ] Affected callers/importers are listed
- [ ] Behavior invariants are stated before edits
- [ ] Each step has a verification command

## Rollback Commands

```bash
# Revert specific files
git checkout HEAD~1 -- <files>

# Revert a step commit when commits are part of the workflow
git revert <step-commit>
```

Do not use `git clean` or blanket working-tree resets from an agent worktree. They can delete files produced by sibling workstreams. Revert only files or commits owned by the current refactor step.
