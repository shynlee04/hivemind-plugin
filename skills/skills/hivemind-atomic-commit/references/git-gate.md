# Git Gate

## Gate Checks

Six checks run before any commit proceeds. All must pass.

### 1. Branch

```bash
git rev-parse --abbrev-ref HEAD
```

- Must NOT be `HEAD` (detached)
- Must NOT be `main` or `master` (direct commit to default branch blocked)
- Must be a feature branch or worktree branch

### 2. Worktree

```bash
git rev-parse --show-toplevel
git rev-parse --git-dir
```

- `--git-dir` must contain `.git/worktrees/` or `--show-toplevel` must differ from main repo toplevel
- If not in a worktree, gate warns but does not block (single-branch workflows allowed)

### 3. Clean Tree

```bash
git status --porcelain
```

- No unstaged changes that are not part of the current commit scope
- No untracked files that should be included
- Staged changes must match the commit scope

### 4. Branch Appropriateness

Branch name is checked against activity classes:
- Branches matching `feature/*`, `feat/*` → `code`, `meta` allowed
- Branches matching `docs/*`, `documentation/*` → `artifact` allowed
- Branches matching `fix/*`, `bugfix/*` → `code` allowed
- Branches matching `chore/*`, `refactor/*` → all classes allowed
- `release/*` branches → only `code` and `meta` allowed

### 5. Secrets

```bash
git diff --cached | grep -iE "(api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*['\"]?[A-Za-z0-9+/]{20,}"
```

- Matches common secret patterns in staged diff
- Blocks commit if any match found
- Override: `.hivemind-secret-allow` file lists regex patterns to ignore

### 6. Conflicts

```bash
git diff --cached | grep -cE "^(<{7}|={7}|>{7})"
```

- Unresolved merge conflict markers in staged files block the commit
- Zero conflict markers required to pass

## Gate Result JSON

```json
{
  "_meta": {
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  },
  "gate_id": "gate_1711185600",
  "timestamp": "2026-03-23T10:00:00Z",
  "passed": false,
  "checks": [
    { "name": "branch", "passed": true, "detail": "feature/add-atomic-commit" },
    { "name": "worktree", "passed": true, "detail": "linked worktree" },
    { "name": "clean_tree", "passed": true, "detail": "5 staged files" },
    { "name": "branch_appropriateness", "passed": true, "detail": "feature branch allows code" },
    { "name": "secrets", "passed": false, "detail": "1 secret pattern found in src/config.ts:42" },
    { "name": "conflicts", "passed": true, "detail": "0 conflict markers" }
  ],
  "blocked_reasons": ["Secret pattern detected in src/config.ts:42"],
  "warnings": ["Not in a linked worktree — single-branch workflow"]
}
```

## Commit Message Format

Conventional commits with activity metadata:

```
<type>(<scope>): <description>

[body]

[footer]
activity_classes: [code]
activity_files: [src/tools/commit/classify.ts, src/tools/commit/gate.ts]
rollback_method: revert-commit
gate_passed: 2026-03-23T10:00:00Z
```

### Type Rules

| Type | Use When |
|------|----------|
| `feat` | New functionality added |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |
| `chore` | Maintenance, deps, tooling |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Reverting a prior commit |

### Scope

Scope is the surface class or module name: `tools`, `hooks`, `core`, `shared`, `docs`, `config`.

## Atomic Commit Rules

1. **One concern per commit.** A commit addresses one logical change.
2. **All files in a batch share one activity class** (except combined circular-dependency batches).
3. **Commit message matches the batch.** The `activity_classes` footer lists only classes in the commit.
4. **Rollback method is recorded.** Every commit records how to undo it.
5. **Gate timestamp is recorded.** Proves gate was run at commit time.
