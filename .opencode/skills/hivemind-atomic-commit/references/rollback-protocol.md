# Rollback Protocol

## Reversibility Methods

| Method | Use When | Command | Risk |
|--------|----------|---------|------|
| `revert-commit` | Standard commit on clean history | `git revert <sha>` | Low — creates new commit |
| `file-restore` | Partial rollback of specific files | `git checkout <sha> -- <files>` | Low — restores files only |
| `branch-rollback` | Entire branch needs reset | `git reset --hard <sha>` | High — rewrites history |
| `manual-steps` | Commit has side effects (deployed, shared) | Documented procedure | Medium — requires human action |
| `irreversible` | Commit cannot be cleanly undone | N/A | Critical — requires approval |

## Rollback Plan JSON

```json
{
  "_meta": {
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  },
  "plan_id": "rollback_1711185600",
  "commit_sha": "",
  "commit_message": "feat(tools): add hivemind-atomic-commit skill",
  "rollback_method": "revert-commit",
  "reversibility": "high",
  "affected_files": [
    "src/tools/commit/classify.ts",
    "src/tools/commit/gate.ts"
  ],
  "rollback_command": "git revert <sha>",
  "rollback_risk": "low",
  "prerequisites": [],
  "manual_steps": [],
  "approval_required": false,
  "approval_reason": "",
  "estimated_effort": "seconds",
  "dependencies_reverted": []
}
```

## Approval Gates

When `rollback_method` is `irreversible` or `branch-rollback`:

1. The rollback plan MUST include `approval_required: true`
2. The plan MUST include `approval_reason` explaining why rollback is risky
3. The orchestrator MUST request user approval before committing
4. User approval is captured via `context.ask()` or `permission.ask`

When `rollback_method` is `manual-steps`:

1. `manual_steps` array MUST contain step-by-step instructions
2. Each step must have a description and expected outcome
3. Commit proceeds without user approval but with documented procedure

## Execution Steps

### revert-commit

```bash
git revert --no-edit <sha>
```

### file-restore

```bash
git checkout <sha> -- <file1> <file2>
git commit -m "revert: restore files from <sha>"
```

### branch-rollback

```bash
# Warning: rewrites history
git reset --hard <sha>
git push --force-with-lease
```

### manual-steps

Execute the steps documented in `manual_steps` array in order. Each step is a string describing the action.

## Reversibility Scoring

| Score | Criteria |
|-------|----------|
| `high` | Single commit, no external deps, clean history, `revert-commit` or `file-restore` |
| `medium` | Multiple commits, some external deps, `manual-steps` required |
| `low` | Deployed or shared state, requires coordination |
| `none` | Irreversible — data destroyed or external state mutated |

## Rollback Plan Generation Rules

1. Calculate rollback method BEFORE committing
2. Check if the commit will be pushed or deployed — if yes, method shifts toward `manual-steps`
3. If commit touches `dist/**` or deployed artifacts — method shifts toward `manual-steps`
4. If commit deletes files with no backup — method shifts toward `irreversible`
5. Record `dependencies_reverted` — list of SHAs that would also need reverting
