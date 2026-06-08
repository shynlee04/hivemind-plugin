# Status Checking Protocol

Detailed protocol for monitoring delegations dispatched via `delegate-task`. The `task` tool handles monitoring automatically — this protocol applies only to WaiterModel delegations that require manual status polling.

## Table of Contents

1. [When to Check Status](#when-to-check-status)
2. [Status Lifecycle](#status-lifecycle)
3. [Checking Specific Delegations](#checking-specific-delegations)
4. [Listing and Filtering Delegations](#listing-and-filtering-delegations)
5. [Supplementary Monitoring Tools](#supplementary-monitoring-tools)
6. [Recovery from Terminal States](#recovery-from-terminal-states)

## When to Check Status

| Scenario | Check Frequency | Rationale |
|----------|----------------|-----------|
| Short task (<30s estimated) | Once after 30-60s | Polling too frequent wastes tool calls |
| Medium task (1-5 min) | Every 1-2 min | Balance visibility vs overhead |
| Long task (5+ min) | Every 2-5 min | Long-running tasks need periodic progress verification |
| Critical task | Every 1-2 min + on workflow decision points | Cannot miss completion signal |
| Batch dispatch (N parallel) | Check all before proceeding to next phase | Gate on batch completion |

**Golden rule:** Do not sit in a tight loop polling `delegation-status`. The tool is async by design — dispatch, continue other work, check when needed.

## Status Lifecycle

```
dispatched → running → completed
                     → error
                     → timeout
```

| Status | Transition triggers | Agent behavior |
|--------|-------------------|----------------|
| `dispatched` | `delegate-task` called successfully | Subagent not yet started; waiting for capacity or queue position |
| `running` | Subagent begins execution | Subagent actively processing: making tool calls, reading files, generating output |
| `completed` | Subagent finishes successfully | Output available; delegation record contains final result |
| `error` | Subagent encounters fatal error | Error message available; delegation may be re-dispatched after fixing the cause |
| `timeout` | Subagent exceeds budget or time limit | Partial output may be available; re-dispatch with larger budget or split task |

**Transition time expectations:**
- `dispatched` → `running`: Typically <5s, but may be longer under load
- `running` → `completed`: Depends entirely on task complexity
- `running` → `error`: Immediate upon error
- `running` → `timeout`: After configured timeout or budget exhaustion

## Checking Specific Delegations

Check a specific delegation by its ID:

```
delegation-status delegationId: "<delegation-id>"
```

Returns the current state (status), any available output, and error details if applicable.

**Interpreting results:**

```
If status is "dispatched":
  → Wait, re-check after 30s

If status is "running":
  → Continue current work, re-check later

If status is "completed":
  → Read output. Verify it meets success criteria.
  → If yes → proceed to next workflow step
  → If no → re-dispatch with corrected instructions

If status is "error":
  → Read error message. Determine if fixable.
  → If fixable → fix the cause, re-dispatch
  → If not fixable → escalate with error evidence

If status is "timeout":
  → Determine if partial output is usable
  → If task is partially done → split remaining work, re-dispatch
  → If task must be complete → re-dispatch with larger budget
```

## Listing and Filtering Delegations

List all delegations or filter by status:

```
# List all delegations
delegation-status action: "list"

# Filter delegations by status
delegation-status status: "completed"
delegation-status status: "running"
delegation-status status: "error"
```

**Use listing when:**
- Managing batch dispatch — need to check which of N parallel delegations have completed
- Recovering from context switch — need to rediscover what was dispatched
- Gateway gating — proceed to next phase only when ALL delegations are complete

## Supplementary Monitoring Tools

For deeper session visibility beyond simple status polling:

| Tool | Use Case | How |
|------|----------|-----|
| `session-tracker` | Find sessions, filter by status/agent/date | `action: "list-sessions"`, `action: "filter-sessions"`, `action: "search-sessions"` |
| `session-hierarchy` | Navigate delegation tree | `action: "get-children"`, `action: "get-parent-chain"`, `action: "get-delegation-depth"` |
| `session-context` | Cross-reference across sessions | `action: "find-related"`, `action: "cross-reference"`, `action: "aggregate"` |
| `hivemind-session-view` | Unified view (tracker + delegation + trajectory) | `action: "get" sessionId: "<session-id>"` |
| `session-journal-export` | Export delegation lineage summary | `format: "markdown"` or `format: "json"` |

**When to use supplementary tools:**

- `session-hierarchy`: When you need to understand parent-child relationships across sessions
- `session-context`: When you need to find related work across multiple session chains
- `hivemind-session-view`: When you need a complete picture of a session's state
- `session-journal-export`: When you need to create a handoff summary of delegation history
- `session-tracker`: When you need to discover sessions across the system

## Recovery from Terminal States

### Error Recovery

```
1. Read error message from delegation-status
2. Classify error:
   a. Agent permission error → verify agent tools via configure-primitive
   b. Tool execution error → check if task is compatible with agent's tools
   c. Budget exhaustion → increase turn/token limits in re-dispatch
   d. Invalid prompt → simplify and re-dispatch
3. Fix the root cause
4. Re-dispatch with updated parameters
```

### Timeout Recovery

```
1. Check if partial output exists in delegation-status
2. If partial output is usable:
   → Extract completed parts
   → Split remaining work into smaller delegations
   → Dispatch each with appropriate budget
3. If no partial output:
   → Re-dispatch with larger budget (2x original)
   → Or split task into 2-3 smaller delegations
```

### Stale Delegation Recovery

If a delegation was dispatched in a previous session and the ID was lost:

```
1. Use session-tracker → list-sessions to find recent delegations
2. Use delegation-status → list to find all current delegations
3. Cross-reference by agent type, timestamp, or task description
4. If delegation is found → check status and resume monitoring
5. If delegation cannot be found → consider it lost; re-dispatch
```
