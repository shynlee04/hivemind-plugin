# Delegation Envelopes

Canonical dispatch envelope templates for subagent delegation across the Hivemind harness.

## Standard Envelope (Level-3 Task-Completer)

```
You are <subagent-role-name>, delegated by <parent-role-name>.

## Handoff Metadata
source_agent: <parent-role-name>
target_agent: <subagent-role-name>
handoff_reason: <why this boundary is correct>
allowed_destinations: []
history_policy: <verbatim task only | summarized context | filtered files>
expected_return: <status + artifacts + evidence + checkpoint shape>
resume_pointer: <where to continue if interrupted>

## Identity Announcement
I am subagent <name>, role <role>. I will not delegate further unless this packet
explicitly allows it. I will return findings in the handoff report below.

## Your Task
<FULL TASK TEXT — paste verbatim; do not reference>

## Scene-Setting
<Where this fits in the larger project; why it matters; what came before.>

## Scope
- Include: <specific files/paths/concerns>
- Exclude: <what NOT to touch>

## Allowed Delegations (if any)
- <list of agent names, empty if none>

## Output Format
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Artifacts: <paths>
- Findings: <structured list, each with file:line evidence>
- Guardrail Evidence: <commands/checks run and results>
- Next-step handoff (if not DONE)
```

## Boundary Guardrail Block

Add this block when correctness depends on strict scope or chain-of-custody:

```markdown
## Boundary Guardrails
- You may touch only: <paths>
- You may use only: <tools>
- You may NOT delegate unless `allowed_destinations` lists a target.
- Before DONE, report: output shape check, scope check, verification check, and any unauthorized edge attempted.
```

## Status Protocol

| Status | Meaning | Parent Action |
|--------|---------|---------------|
| DONE | Complete, verified against scope | Proceed |
| DONE_WITH_CONCERNS | Complete but doubts surfaced | Parse concerns; if correctness → address; if observation → note |
| NEEDS_CONTEXT | Knowledge gap blocks completion | Provide missing context, re-dispatch |
| BLOCKED | Cannot proceed under current permissions/scope | Escalate up the chain; reconsider plan |

## Two-Stage Review (Every Subagent Return)

1. **Stage 1 — Spec Compliance.** Does the output match the task envelope? Nothing extra, nothing missing? If no → bounce back with NEEDS_CONTEXT.
2. **Stage 2 — Quality.** Well-constructed? Follows patterns? Passes validators? If no → bounce back with DONE_WITH_CONCERNS.

**Stage 1 must pass before Stage 2 is considered.**

## Depth Limits and Budget

- Hard-harness `DelegationMeta` enforces **max depth = 3**. This is a structural invariant, not a convention.
- `budgetUsed` per session is tracked; primary coordinator owns the root budget envelope.
- A level-3 task-completer calling another level-3 task-completer pushes depth to 4 only if the orchestrator explicitly allows it; otherwise it will be rejected by the hard harness.

## Envelope Variants

### Pure-Swarm Envelope (Read-Only, No Delegation)

```
You are <swarm-role-name>, part of a parallel pure-swarm investigation.

## Identity Announcement
I am subagent <name>, role <role>. I am read-only. I will NOT delegate.
I will return structured findings only.

## Your Task
<FULL TASK TEXT>

## Scope
- Include: <paths>
- Exclude: <mutating operations>

## Output Format
- Findings: <structured list with file:line evidence>
- Status: DONE
```

### Resume Envelope (Continuation)

```
You are <subagent-role-name>, resuming a previously delegated task.

## Identity Announcement
I am subagent <name>, role <role>. This is a RESUME of task <task_id>.
I will not delegate further unless explicitly allowed.

## Previous State
- Last checkpoint: <checkpoint>
- Completed tasks: <list>
- Current task: <name>
- Blockers: <list>
- Cursor: <task_id, iteration, verification state, resume_pointer>

## Your Task (Resume From)
<FULL TASK TEXT>

## Output Format
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Artifacts: <paths>
- Findings: <structured list>
```

## Handoff Trace

Record one trace row per edge so a later coordinator can audit lineage:

| source_agent | target_agent | reason | guardrail_result | evidence | next |
|--------------|--------------|--------|------------------|----------|------|
| parent | child | domain split | pass/fail | file/command | accept/retry/escalate |
