# Task Envelope: TASK-W1-C1
## Task
Fix the `validate-gate.sh` script in skill-synthesis to support the `synthesize` action. The script currently crashes when a user tries to use synthesize-from-GitHub workflows.

## Scope
- **Include:** `.opencode/skills/skill-synthesis/scripts/validate-gate.sh`
- **Do NOT touch:** Any other files in the repository

## Context
The `validate-gate.sh` script in skill-synthesis has actions for `create`, `audit`, `stack`, `doctor`. The `synthesize` action is missing. When a user invokes the synthesize workflow, the script exits with an error at the case statement.

The script uses a `case` statement to dispatch based on `$1`. Add `synthesize|Synthesize)` as a valid action that either:
- Delegates to the `create` action logic (since synthesize uses create under the hood), OR
- Has its own validation logic

Verify the fix works by running: `bash .opencode/skills/skill-synthesis/scripts/validate-gate.sh synthesize` — should exit 0.

## Expected Output
- Modified `validate-gate.sh` with `synthesize` as a valid action
- Confirmation that `bash .opencode/skills/skill-synthesis/scripts/validate-gate.sh synthesize` exits 0

## Verification
Run: `bash .opencode/skills/skill-synthesis/scripts/validate-gate.sh synthesize; echo "Exit code: $?"`
Must exit 0.