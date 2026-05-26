# Handoff Edge Guardrails

Use this reference when a task crosses an agent boundary. It adapts OpenAI handoff metadata, AutoGen handoff messages, and Claude Code subagent lifecycle events into a local envelope discipline.

## Edge Record

```yaml
edge_id: "<stable id>"
source_agent: "<parent>"
target_agent: "<child>"
handoff_reason: "<why this agent>"
allowed_destinations: []
history_policy:
  include: ["task", "scope", "relevant evidence"]
  exclude: ["irrelevant chat", "unneeded secrets", "other agents' private scratch"]
expected_return:
  statuses: [DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED]
  artifacts: ["<paths>"]
  evidence: ["verification command", "file:line findings"]
guardrails:
  scope: pending
  output_shape: pending
  verification: pending
  unauthorized_delegation: pending
resume_pointer: "<next action if interrupted>"
```

## Acceptance Rule

Accept the edge only when all applicable guardrails are PASS. If output is useful but a guardrail fails, return `DONE_WITH_CONCERNS` and document whether the parent can fix inline or must re-dispatch.

## Reject Conditions

- Child touches files outside scope without explicit deviation authority.
- Child delegates despite empty `allowed_destinations`.
- Child reports DONE without artifact/evidence paths.
- Parent starts a next child while the previous edge has unresolved NEEDS_CONTEXT/BLOCKED status.
