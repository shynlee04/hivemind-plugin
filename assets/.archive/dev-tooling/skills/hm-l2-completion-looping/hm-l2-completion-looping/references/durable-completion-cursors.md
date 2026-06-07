# Durable Completion Cursors

Use this reference when a verification loop can cross a session boundary. The purpose is to make completion evidence replayable without trusting conversation memory.

## Cursor Template

```yaml
cursor_version: 1
task_id: "<task or delegation id>"
owner: "<coordinator/subagent role>"
target_artifacts:
  - "<path>"
iteration: 0
max_iterations: 5
verification:
  command: "<command, script, or manual check>"
  expected: "<observable pass condition>"
termination_predicates:
  output_gate: pending
  quality_gate: pending
  scope_gate: pending
  max_iteration: pass
  external_stop: pass
last_result:
  status: pending
  evidence: "<file, command output, or checkpoint id>"
resume_pointer: "<next concrete action>"
```

## Resume Rules

1. Read the cursor first; do not infer state from chat.
2. Verify target artifacts still exist before continuing.
3. Re-run the verification command unless the cursor says the next action is a human/action checkpoint.
4. If the cursor is missing or malformed, report degraded recovery and restart from the last verified artifact.
5. If `iteration >= max_iterations`, stop and escalate; do not increase the cap silently.

## Evidence Span

Each loop iteration should append one evidence span:

```yaml
- iteration: 2
  gate: quality_gate
  command: "npm run typecheck"
  result: fail
  summary: "2 type errors in touched files"
  next: "fix typed null handling, then rerun typecheck"
```

This adapts LangGraph durable execution, AutoGen termination predicates, and OpenAI tracing into local, dependency-free skill practice.
