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

## Durable Cursor Loop

Use when: a completion loop may be interrupted by compaction, disconnection, human verification, auth gates, or another session taking over.

Persist before every pause:

| Cursor field | Why it matters |
|--------------|----------------|
| `task_id` | Stable identity for resume; do not recreate a new delegation when one exists. |
| `iteration` / `max_iterations` | Prevents infinite retries and preserves loop budget. |
| `verification_command` | Keeps completion tied to executable evidence. |
| `last_gate_result` | Shows which gate failed: output, quality, scope, budget, or external stop. |
| `resume_pointer` | Tells the next agent exactly where to continue. |

Lineage: adapted from LangGraph checkpointer/thread-id durability, AutoGen stateful termination conditions, and OpenAI trace spans. The local package stays framework-independent: write JSON/YAML to the project state location already in use, and document adapter paths when not using `.opencode/state/`.

## Composable Termination Predicates

Replace vague "done" checks with explicit predicates. A task completes only when all required predicates are true or an explicit human override is recorded.

| Predicate | PASS signal | STOP/LOOP signal |
|-----------|-------------|------------------|
| Output gate | Expected artifacts exist | Missing artifact or wrong format |
| Quality gate | Validators/static checks pass | Failing command or unresolved severity |
| Scope gate | No extra/missing scope | Out-of-scope files or unmet envelope item |
| Max-iteration | Under cap | Cap reached; escalate |
| Timeout/budget | Budget available | Budget exhausted; checkpoint |
| External/human stop | Human approval or explicit waiver | Human action/auth/decision pending |
