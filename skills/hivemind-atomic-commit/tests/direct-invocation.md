# Direct Invocation

## Scenario

An orchestrator asks the skill to classify, map, gate, and commit 3 changed files: one source file, one test file, and one doc file.

## Expected Behavior

1. `hm-activity-classify.sh` classifies each file into `code`, `code`, and `artifact` respectively
2. Activity map produces 2 batches: `code` batch and `artifact` batch
3. `hm-git-gate.sh` runs all 6 checks and returns pass/fail per check
4. `hm-atomic-commit.sh` stages files, builds a conventional commit message with activity metadata footer, and commits
5. Rollback plan is generated with `revert-commit` method
6. Activity record is emitted for each committed file

## Validation

| Check | Pass Condition |
|-------|---------------|
| Classification | Each file returns JSON with `class`, `operation`, `granularity` fields |
| Mapping | Activity map JSON contains `commit_batches` ordered by dependency |
| Gate | Gate result JSON contains all 6 checks with `passed` boolean |
| Commit message | Message follows `<type>(<scope>): <description>` format with activity metadata footer |
| Atomicity | Each batch commits with one concern — no mixed activity classes |
| Rollback | Rollback plan JSON contains `rollback_method` and `reversibility` fields |

## Test Steps

```bash
# 1. Classify files
bash scripts/hm-activity-classify.sh src/tools/runtime/status.ts
# Expected: {"class":"code","operation":"M","granularity":"chunk",...}

bash scripts/hm-activity-classify.sh tests/tools/runtime.test.ts
# Expected: {"class":"code","operation":"M","granularity":"chunk",...}

bash scripts/hm-activity-classify.sh docs/plans/feature.md
# Expected: {"class":"artifact","operation":"M","granularity":"whole-file",...}

# 2. Gate check
bash scripts/hm-git-gate.sh --class code
# Expected: {"passed":true/false,"checks":[...6 checks...]}

# 3. Atomic commit (dry run)
bash scripts/hm-atomic-commit.sh --files src/tools/runtime/status.ts --type feat --scope tools --desc "add status check" --classes code --dry-run
# Expected: {"action":"dry_run","message":"feat(tools): add status check",...}
```
