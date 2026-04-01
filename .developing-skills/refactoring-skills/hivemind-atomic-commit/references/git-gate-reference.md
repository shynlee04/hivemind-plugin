# Git Gate Reference

## Pre-Commit Command Set

```bash
npx tsc --noEmit 2>&1 | head -10
npm test 2>&1 | head -20
npm run lint 2>&1 | head -20
```

## Scope and Staging Checks

```bash
git diff --cached --name-only
git diff --cached --check
git status --short
```

## IF/THEN Routing

1. **IF** staged files cross unrelated concerns, **THEN** split the commit.
2. **IF** `git diff --cached --check` reports whitespace or conflict markers, **THEN** stop and fix before committing.
3. **IF** verification commands fail, **THEN** do not create the commit.
