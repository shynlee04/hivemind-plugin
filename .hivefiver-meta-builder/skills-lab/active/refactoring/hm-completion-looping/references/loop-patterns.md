# Loop Patterns

## Verify-After

Subagent completes → verify → loop if fail.

Use for: Most tasks where verification is external.
Max iterations: 5

## Verify-During

Subagent works in iterations, verifies each.

Use for: Long-running tasks with intermediate deliverables.
Max iterations: 10

## Guardrail

External monitor watches for premature completion.

Use for: Critical tasks where false positives are dangerous.
Max iterations: 3
