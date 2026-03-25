# Direct Invocation

## Scenario
- A refactor was interrupted after Stage 4 codemap work.
- The next session must recover what slices were selected and why.

## Expected Behavior
- `git-continuity-memory` classifies the task as `resume`.
- It starts from the narrowest relevant history.
- It emits a continuity result with confirmed decisions, inferred gaps, and one next step.
