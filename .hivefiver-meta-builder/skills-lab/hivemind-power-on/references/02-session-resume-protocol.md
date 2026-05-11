# Reference 02: Session Resume Protocol

> **Jump targets:** [ref-02 §1]–[ref-02 §5]

## ⚠️ STOP. READ THIS BEFORE ANYTHING ELSE.

**"Aborted" status in session-tracker DOES NOT mean the user cancelled the task. It means the CONNECTION was lost. The subagent's ENTIRE state — prompt, turns, tool calls, files — is PRESERVED on disk. The task_id IS the session ID. Resuming with task_id restores EVERYTHING. There is NO scenario where you "start fresh" when an active/aborted delegation exists.**

If you see "aborted" and your first thought is "start a new task," you are WRONG.
The session-tracker data is the TRUTH. The .json says the session exists → you resume it. Period.

## §1 — MECHANICAL RESUME (No decisions. No thinking. Execute.)

**Trigger:** You see a session-tracker child with ANY status. Or the user just reconnected.

```
STEP 0 — READ THE INDEX
  read(".hivemind/session-tracker/project-continuity.json")
  → Find the most recently updated session.
  → If no sessions exist at all → go to §2 (fresh start).
  → If sessions exist, proceed to STEP 1 regardless of status.

STEP 1 — READ THE HIERARCHY  
  read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
  → Look at hierarchy.children
  → Find ALL children. Do NOT filter by status. Resume every child.
  → For each child:
    - Record: childId = that child's key
    - Record: delegatedBy = that child's delegatedBy field
  → If a child is truly completed, task(task_id) returns immediately (no harm).
  → If a child is in any other state, it continues from where it left off.
  → The agent CANNOT determine completion from JSON — only the runtime.

STEP 2 — RESUME (the ONLY valid action)
  For EACH child found in STEP 1:
    task(
      description = "resume",
      subagent_type = "<EXACT delegatedBy value>",
      task_id = "<childId>"
    )
    That's it. No other parameters. No "prompt" field. No thinking.
  Resume sequentially (NOT parallel): complete first child, then next.
```

**If you create a NEW task(task_id="<new>") instead of the above, you have FAILED the protocol.**

## §2 — THE TASK TOOL: EXACT PARAMETERS

The `task` tool resumes an existing session when `task_id` matches. The agent SEES its prior conversation. NO prompt needed.

```
task(
  description = "resume",          // REQUIRED. Use "resume" literally.
  subagent_type = "<delegatedBy>",  // REQUIRED. Copy exactly from session-continuity.json.
  task_id = "<sessionId>"           // REQUIRED. The child's session ID from the .json key.
)
```

**DO NOT include `prompt`. DO NOT include "args". DO NOT include anything else.**

If the platform forces a non-empty prompt: use the literal string `"Resume session."` — nothing more.

### Where to find delegatedBy

Read the child entry in `session-continuity.json`:

```json
{
  "hierarchy": {
    "children": {
      "ses_1ebe39941ffecHehSRcc13IqeD": {
        "file": "ses_1ebe39941ffecHehSRcc13IqeD.json",
        "depth": 1,
        "status": "active",
        "delegatedBy": "hm-l2-auditor",
        "children": {}
      }
    }
  }
}
```

→ `subagent_type = "hm-l2-auditor"` (the exact string from delegatedBy)
→ `task_id = "ses_1ebe39941ffecHehSRcc13IqeD"` (the child's session ID key)

If `delegatedBy` is `"main_l0_agent"` (ambiguous), read the child's `.json` file to find `delegated_by.agent_name` or `delegated_by.subagent_type`.

## §3 — THE CASCADE: L0→L1→L2 MUST FLOW

When you resume a parent session, you MUST also instruct it to resume ITS children.

### L0 orchestrator power-on sequence:

```
1. Read project-continuity.json → find your session
2. Read your session-continuity.json → find active L1 child
3. Resume L1: task(task_id="<L1_childId>", subagent_type="<delegatedBy>")
4. IN YOUR RESUME PROMPT to L1, include this exact instruction:

   "You are resuming as L1 coordinator. On spawn:
    1. Read YOUR session-continuity.json at 
       .hivemind/session-tracker/<your-session-id>/session-continuity.json
    2. Find ALL children (do NOT filter by status — resume every child).
       Completed ones return instantly. Others continue.
       The agent CANNOT determine completion from JSON — only the runtime.
    3. Resume each with EXACT task_id:
       task(description='resume', subagent_type='<delegatedBy>', task_id='<childId>')
    4. DO NOT create new delegations for work already dispatched."
```

### L1 coordinator resume sequence:

```
1. Read your session-continuity.json
2. Find ALL children (do NOT filter by status — resume EVERY child)
3. For each, extract: { sessionId, delegatedBy }
4. Resume sequentially (NOT parallel):
   task(description="resume", subagent_type="<delegatedBy>", task_id="<sessionId>")
5. Collect results from each
6. Run quality gates on each result
7. Return consolidated results to L0
```

### REAL cascade with REAL IDs:

```
Session tree on disk:
  ses_1ebe832c5ffeeYuFbS1kqleZnD (L0 orchestrator, active)
    ├── ses_1ebe39941ffecHehSRcc13IqeD (L1, depth=1, active, delegatedBy=main_l0_agent)
    │     └── ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2, depth=2, active)
    └── ses_1ebd373b1ffeDa7AJ7KJIPShVE (L1, depth=1, active, delegatedBy=main_l0_agent)

Execution (5 turns):
  T1: L0 resumes ses_1ebe39941ffecHehSRcc13IqeD with instruction cascade
  T2: L1 spawns, reads its session-continuity → finds ses_1ebe28c52ffeIoXFCcAZnCj0IC active
  T3: L1 resumes ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2)
  T4: L2 completes work → returns to L1
  T5: L1 resumes ses_1ebd373b1ffeDa7AJ7KJIPShVE (second child) → completes → returns to L0
```

**NO new session IS EVER created. NO prompt IS EVER repeated.**

## §4 — VERIFICATION: DID YOU DO IT RIGHT?

After resume, verify:

| Check | How | Pass If |
|-------|-----|---------|
| No new sessions created | Compare session-count before/after | Same count as before resume |
| Correct agent type used | Check delegatedBy → subagent_type | Exact match |
| Prompt NOT repeated | Check task args for "prompt" field | Absent or "Resume session." |
| Correct task_id used | Check task_id matches child session ID | Exact match |
| Cascade flowed | L1 resumed its L2 children too | All children completed |

## §5 — FAILURE: WHAT TO DO IF RESUME FAILS

| Problem | Cause | Fix |
|---------|-------|-----|
| task() returns "session not found" | task_id expired from OpenCode's session store | Export the session .md via session-tracker → extract original prompt → create NEW dispatch with SAME agent type and SAME prompt |
| delegatedBy is "main_l0_agent" | Auto-captured value, not actual agent type | Read child's .json file → delegated_by.subagent_type or delegated_by.agent_name |
| Child already "completed" | Previous resume already succeeded | ACCEPT the result. Do not re-dispatch. |
| session-continuity.json missing | Session directory was never created | Read project-continuity.json to find the session dir → read child .json directly |
| Multiple active at same depth | Parallel dispatch was running | Resume sequentially. First complete, then next. Never re-parallelize. |

### CRITICAL: task_id expired fallback

Only if `task_id` is genuinely expired (session store purged):

```
1. session-tracker({action:"export-session", sessionId: "<parentId>"})
2. grep "## USER (turn" on the result → find the original user intent
3. Read the original task dispatch (Tool: task block) to get:
   - Original subagent_type
   - Original description
   - Original arguments
4. Create NEW dispatch with the SAME subagent_type + SAME prompt
   task(description="<original desc>", subagent_type="<original>", 
        prompt="<original prompt from .md>")
5. Document: "task_id expired, re-dispatched from session-tracker evidence"
```

**This is the ONLY case where you create a new task_id. Any other case = protocol violation.**
