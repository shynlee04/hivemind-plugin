# Reference 06: Delegation Depth Recovery

## Multi-Level Recovery Cascade

When a session disconnects mid-delegation, the recovery cascades through all levels.

```
LEVEL 0 (L0 Orchestrator)
  │
  ├── Disconnected while L1 was running?
  │   └── RESUME L0 → L0 resumes L1 with task_id
  │
  └── Disconnected while L2 was running?
      └── RESUME L0 → L0 resumes L1 → L1 resumes L2 with task_id

LEVEL 1 (L1 Coordinator)
  │
  ├── Disconnected while L2 was running?
  │   └── RESUME L1 → L1 resumes L2 with task_id
  │
  └── Disconnected while multiple L2s were running?
      └── RESUME L1 → L1 resumes each L2 sequentially (one at a time)

LEVEL 2 (L2 Specialist)
  │
  └── L2 does NOT spawn further delegations.
      L2 either completes work or returns with errors.
```

## Cascade Protocol

### For L0 Orchestrators:

```
1. ON POWER-ON:
   Read project-continuity.json
   Filter: sessions with status="active" AND (childCount > 0 OR totalDelegationDepth > 0)

2. IF active sessions found:
   For each (starting with most recently updated):
     a. Read session-continuity.json
     b. Find deepest active child (highest depth with status="active")
     c. Record: rootSessionId, targetChildId, delegatedBy

3. RESUME THE PARENT:
   task(description="resume", subagent_type="<your agent type>",
        task_id="<rootSessionId>")

4. INSTRUCT THE PARENT:
   "You are resuming a session. Your session-continuity.json is at:
    .hivemind/session-tracker/<rootSessionId>/session-continuity.json
    Check for aborted children with status='active'.
    Resume them with EXACT task_id. DO NOT create new children.
    DO NOT repeat the prompt. Context is preserved."

5. PARENT (L1) then resumes its children:
   task(description="resume", subagent_type="<delegatedBy>",
        task_id="<childSessionId>")
```

### For L1 Coordinators:

```
1. ON RESUME:
   Read YOUR session-continuity.json:
     read(".hivemind/session-tracker/<your_session_id>/session-continuity.json")

2. Check hierarchy.children:
   For each child with status="active":
     a. Record: childSessionId, depth, delegatedBy
     b. Check if child has grandchildren with status="active"

3. IF grandchildren exist (depth=2):
   Resume the child first → child resumes its grandchildren

4. IF no grandchildren:
   Resume child directly:
     task(description="resume", subagent_type="<delegatedBy>",
          task_id="<childSessionId>")

5. IF multiple active children (parallel dispatch):
   Resume them SEQUENTIALLY (one at a time)
   After each completes, move to next
   Do NOT re-parallelize on resume
```

## Real-World Cascade Example

### Scenario: L0 dispatched L1, L1 dispatched L2. Power loss.

```
Session tree:
  ses_A (L0 orchestrator, status=active)
    └── ses_B (L1 coordinator, status=active)
          └── ses_C (L2 specialist, status=active, depth=2)
```

### Recovery sequence:

```
TURN 1 — User reconnects, L0 powers on:
  L0: Reads project-continuity.json → ses_A: status=active, depth=2
  L0: Reads ses_A/session-continuity.json → ses_B: depth=1, active
  L0: Resumes ses_A:
      task(description="resume", subagent_type="hm-l0-orchestrator",
           task_id="ses_A")

TURN 2 — L0 resumes in context:
  L0 (resumed): Instructs L1 resume
      "L1 coordinator — check session-continuity.json for aborted children."

TURN 3 — L1 checks continuity:
  L1: Reads ses_A/session-continuity.json → ses_B: depth=1, active
  L1: Reads ses_B/session-continuity.json → ses_C: depth=2, active
  L1: Resumes ses_B:
      task(description="resume", subagent_type="hm-l1-coordinator",
           task_id="ses_B")

TURN 4 — L1 resumes in context:
  L1 (resumed): Reads ses_B/session-continuity.json → ses_C: depth=2, active
  L1: Resumes L2:
      task(description="resume", subagent_type="hm-l2-auditor",
           task_id="ses_C")

TURN 5 — L2 resumes in context:
  L2 (resumed): Continues from where it left off
  L2: Completes work, reports to L1
  L1: Gate checks → accepts
  L1: Reports to L0
  L0: Reports to user

→ 5 turns total. NO new sessions created. NO prompts repeated.
```

## Multi-Child Recovery Example (from real data)

### Session: `ses_1ebe832c5ffeeYuFbS1kqleZnD`
```
session-continuity.json:
  children:
    ses_1ebe39941ffecHehSRcc13IqeD: depth=1, active, delegatedBy=main_l0_agent
    ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, active, delegatedBy=main_l0_agent
```

### Recovery:
```
1. L0 resumes ses_1ebe832c5ffeeYuFbS1kqleZnD
2. L0 checks: 2 active children at depth=1
3. L0 resumes first child:
   task(description="resume", subagent_type="main_l0_agent",
        task_id="ses_1ebe39941ffecHehSRcc13IqeD")
4. Child completes → L0 accepts with gates
5. L0 resumes second child:
   task(description="resume", subagent_type="main_l0_agent",
        task_id="ses_1ebd373b1ffeDa7AJ7KJIPShVE")
6. Child completes → L0 accepts with gates
7. L0: session complete

→ Sequential resume of parallel children. Both completed.
```

## Failure Modes

| Failure | Detection | Resolution |
|---------|-----------|------------|
| task_id expired | `task()` returns "session not found" | Export session .md, extract original prompt, create NEW dispatch with same prompt and agent type |
| Child session has no .json | session-continuity.json missing or empty | Search for child's .md file; if missing, treat as lost — re-dispatch |
| Double-resume (resumed, but child already running elsewhere) | Child returns immediately with status "already completed" | Accept the result. Do not re-dispatch. |
| delegatedBy is "main_l0_agent" (ambiguous) | Can't determine exact agent type | Read parent .md → find task dispatch → subagent_type field |
| Deep tree (depth=2 with grandchild) | Multiple levels of active children | Resume parent → parent resumes child → child resumes grandchild. Always bottom-up. |

## Resume Command — Final Form

```json
{
  "description": "resume",
  "subagent_type": "<EXACT delegatedBy from session-continuity.json>",
  "task_id": "<EXACT child session ID>"
}
```

The `prompt` field is **intentionally omitted**. When present, it should contain only `"Resume session."` or be completely absent.

## Verification Checklist After Resume

After a successful resume chain, verify:
- [ ] All active children transitioned to "completed" or "error"
- [ ] No new session IDs were created during resume
- [ ] Each child's depth matches its position in the hierarchy tree
- [ ] Quality gate triad was run on each child output
- [ ] User was informed of recovery state on return
