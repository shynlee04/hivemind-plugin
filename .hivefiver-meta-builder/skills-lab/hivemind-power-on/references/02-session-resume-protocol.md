# Reference 02: Session Resume Protocol

> **Jump targets:** [ref-02 §1]–[ref-02 §7]

## §1 — RESUME PROTOCOL (Critical 7-Step)

This is the #1 session-recovery fix. Follow EXACTLY. Do not skip steps. This applies whenever you detect a disconnect or see that the session was interrupted.

**Trigger words:** disconnect recovery, resume session, recover from disconnect, continue work after disconnect.

```
STEP 1 — FIND ACTIVE SESSIONS
  Read project-continuity.json:
    read(".hivemind/session-tracker/project-continuity.json")
  Filter: sessions with status === "active", sorted by updated descending.
  If none → FRESH START (§2).

STEP 2 — FIND ABORTED DELEGATIONS
  For EACH active session (starting with most recently updated):
    Read its session-continuity.json:
      read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
    Check hierarchy.children → find any child with status === "active".

STEP 3 — IDENTIFY DEEPEST ACTIVE DELEGATION
  Among all active children across all active sessions:
    Pick the child with the HIGHEST depth value.
    If multiple at same depth → pick the most recently updated.

  Record:
    - rootSessionId: the parent session ID
    - targetChildId: the aborted delegation child ID (task_id)
    - agentType: the delegatedBy field from child metadata

STEP 4 — EXPORT THE ROOT SESSION
  session-tracker(action: "export-session", sessionId: "<rootSessionId>")
  This returns the full .md capture file with all turns, tool calls, and context.

STEP 5 — RECOVER LAST USER INTENT
  grep(pattern: "## USER \\(turn", include: "*.md") on the exported content,
    OR read with offset to find the most recent user turn.
  Read the last ## USER turn to understand what was requested.

STEP 6 — RESUME WITH EXACT task_id
  The child's session ID IS the task_id. Resume using:
    task(description="resume", subagent_type="<SAME agent_type>",
         task_id="<targetChildId>")

STEP 7 — CASCADE TO CHILD
  When the resumed L1 agent spawns, it checks ITS session-continuity.json
  for aborted L2 children and resumes them with EXACT task_id too.

CRITICAL:
  - DO NOT create a new session ID.
  - DO NOT repeat the original prompt — context is preserved.
  - The resumed agent sees its prior conversation state.
```

## §2 — Fresh Start Protocol

When you KNOW no prior sessions exist (first ever start; user explicitly says "new session"):

```
1. Announce: "[Agent] powered on. Classifying workflow…"
2. Run lineage classification → [ref-01 §1]
3. Load the lineage router for the classified lineage
4. Proceed with domain work
```

## §3 — Task Tool Resume Mechanics

### The Golden Rule

```
task_id IS session_id. When you resume with task_id, the agent continues from where it left off.
Context is preserved. Do NOT repeat the prompt.
```

### OpenCode Task Tool Parameters

The `task` tool dispatches subagents. When resuming, use:

```json
{
  "description": "resume",
  "subagent_type": "<SAME agent type as original dispatch>",
  "task_id": "<EXACT session ID of aborted child>"
}
```

| Parameter | Required | Value |
|-----------|----------|-------|
| `description` | Yes | `"resume"` (or brief 3-5 word description) |
| `subagent_type` | Yes | **EXACT SAME** agent type from `delegatedBy` field in session-continuity.json |
| `task_id` | Yes | The child's session ID (24-char hex) |
| `prompt` | **OMIT or MINIMAL** | Do NOT repeat the original prompt — context is preserved |

### Why prompt is omitted/minimal

When you resume with `task_id`, OpenCode restores the subagent's entire conversation state — including the original prompt, all turns, all tool calls. Repeating the prompt would:
1. Waste context budget (the agent already has it)
2. Cause the agent to restart work instead of continuing
3. Confuse the agent about whether this is new or resumed

### Minimal prompt (if required by platform)

If the platform demands a non-empty prompt string: `"Resume session."` Never include more than that.

### Finding the Correct agent_type

The `delegatedBy` field in session-continuity.json records the original agent type:

```json
{
  "ses_1ebe39941ffecHehSRcc13IqeD": {
    "depth": 1, "status": "active",
    "delegatedBy": "hm-l2-auditor",
    "children": {}
  }
}
```

→ Use `"hm-l2-auditor"` as the `subagent_type` for resume.

### How Session-Tracker Captures task_id

When a task is dispatched, the session-tracker hook (`tool.execute.after`) captures:
- `tool`: `"task"`
- `sessionID`: the child session ID → stored as task_id
- `args.subagent_type`: the agent type → stored as delegatedBy
- `args.description`: task description

### Resume Invocation Example

```
task(
  description="resume",
  subagent_type="hm-l2-auditor",
  task_id="ses_1ebe39941ffecHehSRcc13IqeD"
)
```

### What Happens on Resume

1. OpenCode looks up the session ID in its session store
2. Restores the subagent with all prior conversation state
3. The agent sees its last turn and continues from there
4. The agent has access to all files it previously read
5. The agent knows what it was doing and what's pending

## §4 — Multi-Level Recovery Cascade

### Cascade Protocol for L0 Orchestrators

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
   "You are resuming. Check session-continuity.json for aborted children.
    Resume them with EXACT task_id. DO NOT create new children."

5. PARENT (L1) then resumes its children:
   task(description="resume", subagent_type="<delegatedBy>",
        task_id="<childSessionId>")
```

### Cascade Protocol for L1 Coordinators

```
1. ON RESUME:
   Read YOUR session-continuity.json

2. Check hierarchy.children:
   For each child with status="active":
     a. Record: childSessionId, depth, delegatedBy
     b. Check if child has grandchildren with status="active"

3. IF grandchildren exist (depth=2):
   Resume the child first → child resumes its grandchildren

4. IF no grandchildren:
   Resume child directly

5. IF multiple active children (parallel dispatch):
   Resume them SEQUENTIALLY (one at a time)
   Do NOT re-parallelize on resume
```

### Delegation Depth Levels

```
LEVEL 0 (L0 Orchestrator)
  ├── Disconnected while L1 was running? → RESUME L0 → L0 resumes L1
  └── Disconnected while L2 was running? → RESUME L0 → L0 resumes L1 → L1 resumes L2

LEVEL 1 (L1 Coordinator)
  ├── Disconnected while L2 was running? → RESUME L1 → L1 resumes L2
  └── Disconnected while multiple L2s were running? → RESUME L1 → resume each sequentially

LEVEL 2 (L2 Specialist)
  └── L2 does NOT spawn further delegations. Completes or returns errors.
```

### L0→L1 Cascade Resume Pattern

When L0 resumes an L1 coordinator, the coordinator must:

```
1. On spawn, L1 coordinator checks its OWN session-continuity.json
2. Finds active L2 children: hierarchy.children.<childId>.status === "active"
3. Resumes each active child with EXACT task_id
4. NEVER creates new child sessions when aborted ones exist
```

## §5 — Session Health Dashboard (L0 Only)

L0 agents should run this on power-on to get an overview:

```
1. List all sessions:
   session-tracker(action: "list-sessions", limit: 50)

2. Count:
   - Active sessions (status === "active")
   - Sessions with active children (childCount > 0)
   - Sessions with totalDelegationDepth > 0

3. Warn if:
   - >5 active sessions exist (leakage)
   - Any session has depth >= 3 (max delegation depth)
   - Any session has been active >24h (stale lock)
```

## §6 — Worked Example: Disconnect Recovery

**Scenario:** L0-orchestrator was deep in a multi-child delegation when the user disconnected. Session `ses_1ebe832c5ffeeYuFbS1kqleZnD` has active children.

**Recovery:**

```
1. read(".hivemind/session-tracker/project-continuity.json")
   → Found ses_1ebe832c5ffeeYuFbS1kqleZnD: status=active

2. read(".hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json")
   → hierarchy.children.ses_1ebe39941ffecHehSRcc13IqeD: depth=1, status=active
   → hierarchy.children.ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, status=active

3. Both at depth=1. Pick most recently updated child.

4. session-tracker(action: "export-session", sessionId: "ses_1ebe832c5ffeeYuFbS1kqleZnD")
   → .md content returned

5. grep "## USER (turn" on exported content → found last user intent
   "audit the session-tracker module and report all flaws"

6. task(description="resume", subagent_type="hm-l2-auditor",
        task_id="ses_1ebe39941ffecHehSRcc13IqeD")

→ Resumed L2 auditor continues from where it left off.
→ NO new session created. NO prompt repeated.
```

### Real-World Cascade Example

```
Session tree:
  ses_A (L0 orchestrator, status=active)
    └── ses_B (L1 coordinator, status=active)
          └── ses_C (L2 specialist, status=active, depth=2)

Recovery sequence (5 turns total):
  TURN 1: L0 reads project-continuity → finds ses_A active, depth=2
           L0 resumes ses_A: task(task_id="ses_A")
  TURN 2: L0 (resumed) instructs L1 to check for aborted children
  TURN 3: L1 reads ses_B's continuity → finds ses_C active, depth=2
           L1 resumes ses_B: task(task_id="ses_B")
  TURN 4: L1 (resumed) resumes L2: task(task_id="ses_C")
  TURN 5: L2 continues from where it left off, completes work

→ NO new sessions created. NO prompts repeated.
```

### Multi-Child Recovery Example

```
Session: ses_1ebe832c5ffeeYuFbS1kqleZnD
  children:
    ses_1ebe39941ffecHehSRcc13IqeD: depth=1, active, delegatedBy=main_l0_agent
    ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, active, delegatedBy=main_l0_agent

Recovery:
  1. L0 resumes ses_1ebe832c5ffeeYuFbS1kqleZnD
  2. L0 resumes first child with task_id
  3. Child completes → L0 accepts with gates
  4. L0 resumes second child with task_id
  5. Child completes → L0 accepts with gates

→ Sequential resume of parallel children. Both completed.
```

## §7 — Resume Failure Modes

| Failure | Detection | Resolution |
|---------|-----------|------------|
| task_id expired | `task()` returns "session not found" | Export session .md, extract original prompt, create NEW dispatch with same prompt and agent type |
| Child session has no .json | session-continuity.json missing or empty | Search for child's .md file; if missing, treat as lost — re-dispatch |
| Double-resume | Child returns immediately with status "already completed" | Accept the result. Do not re-dispatch. |
| delegatedBy is "main_l0_agent" (ambiguous) | Can't determine exact agent type | Read parent .md → find task dispatch → subagent_type field |
| Deep tree (depth=2 with grandchild) | Multiple levels of active children | Resume parent → parent resumes child → child resumes grandchild. Always bottom-up. |

### Common Mistakes

| Mistake | Why Wrong | Correct |
|---------|-----------|---------|
| `task(description="audit X", prompt="<repeated>", ...)` | Prompt repeated — context wasted, agent restarts | `task(description="resume", task_id="<id>")` |
| Wrong agent type in subagent_type | delegatedBy said "hm-l2-auditor" but used "hm-l2-researcher" | Use EXACT `delegatedBy` value |
| New session created instead of resume | task_id is new instead of existing child ID | Use EXISTING child session ID |
| Missing subagent_type | task_id given without agent type | Include `subagent_type` from `delegatedBy` |

### Resume Verification Checklist

After a successful resume chain, verify:
- [ ] All active children transitioned to "completed" or "error"
- [ ] No new session IDs were created during resume
- [ ] Each child's depth matches its position in the hierarchy tree
- [ ] Quality gate triad was run on each child output
- [ ] User was informed of recovery state on return
