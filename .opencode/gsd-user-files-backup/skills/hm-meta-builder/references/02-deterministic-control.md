# Deterministic Control — Execution Protocol

## The Problem

LLMs are probabilistic. The same prompt can produce different outputs. MINDNETWORK solves this by making **execution paths deterministic** — the graph structure determines what happens next, not LLM improvisation.

## Node Execution Protocol

Every node follows this exact protocol:

### PRE-EXECUTION (Before)

1. **Check dependencies:** All nodes in `depends_on[]` must be in `completed_nodes[]`
2. **Verify conditions:** At least one `execute_conditions[]` must be true
3. **Load skill:** Call `skill({ name: "<skill-name>" })` if node has a skill
4. **Log entry:** Update `checkpoint.json` with `active_node: "<node-id>"`
5. **Set context:** Prepare the task envelope (what to do, scope, expected output)

### EXECUTION (During)

6. **Execute within skill's workflow:** Follow the loaded skill's gates and phases
7. **Do NOT bypass skill rules:** If the skill has validation loops, run them
8. **Track progress:** Update `progress.md` with actions taken

### POST-EXECUTION (After)

9. **Run validation checks:** Evaluate each item in `validates[]`
10. **If ALL pass:**
    - Add node to `completed_nodes[]`
    - Clear `active_node`
    - Log to `traversal_path[]`
    - Save checkpoint
    - Traverse to next node(s)
11. **If ANY fail:**
    - Add node to `failed_nodes[]`
    - Read failure details
    - Determine root cause
    - Retry with modified approach (max 3)
    - If 3rd failure → escalate to user

## Rollback Rules

When a node fails:

```
Node X fails validation
    │
    ├── Retry count < 3:
    │   1. Read failure details from validates[]
    │   2. Identify root cause
    │   3. Modify approach (different method, different skill, more context)
    │   4. Re-execute Node X
    │   5. Go back to step 9 (post-execution validation)
    │
    └── Retry count = 3:
        1. Add to failed_nodes[] with reason
        2. Rollback active_node to most recent in completed_nodes[]
        3. Escalate to user with:
           - What was attempted
           - What failed and why
           - What approaches were tried
           - What is needed to proceed
```

**Critical:** Rollback does NOT undo file changes. It resets the traversal state. File changes from failed nodes remain — the user or next attempt decides what to do with them.

## Retry Strategy

Each retry must use a **different approach**:

| Retry | Strategy |
|-------|----------|
| 1st | Same approach, more context or clearer instructions |
| 2nd | Different skill, different method, or different decomposition |
| 3rd | Escalate to user — do not retry again |

**Never retry the same approach twice.** If it failed once, it will fail again without a change.

## State Machine

Node states:

```
                    ┌─────────┐
                    │ PENDING  │ ← Initial state
                    └────┬────┘
                         │
                    dependencies met?
                    conditions true?
                         │
                         ▼
                    ┌──────────┐
              ┌─────│ ACTIVE   │
              │     └────┬─────┘
              │          │
              │     executes skill
              │          │
              │          ▼
              │     ┌──────────┐
              │     │VALIDATING│
              │     └────┬─────┘
              │          │
         ┌────┴────┐     │
         │         │     │
    FAIL │     PASS │     │
         │         │     │
         ▼         ▼     │
    ┌────────┐ ┌──────────┐│
    │ FAILED │ │COMPLETED ││
    └───┬────┘ └────┬─────┘│
        │           │      │
   retry<3?    traverse   │
        │     to next     │
        │     node(s)     │
        │           │     │
        └───────────┴─────┘
              (rollback)
```

## Determinism Guarantees

MINDNETWORK guarantees:

1. **Same intent → same traversal path** — The routing table is fixed
2. **Same node → same validation checks** — Validates array is explicit
3. **Same failure → same rollback behavior** — Rollback rules are algorithmic
4. **Same session → recoverable state** — Checkpoint enables resumption

What is NOT deterministic:
- LLM output within a node (that's the skill's job)
- User responses to questions
- External system state (file contents, git status)

## Execution Timeout

Each node has a soft timeout:
- **Intent clarification:** Max 3 questions, then route with assumption
- **Research:** Max 5 file reads or 3 web searches, then synthesize
- **Planning:** Max 10 phases, then split into sub-graphs
- **Authoring:** Max 5 validation loop iterations, then escalate
- **Coordination:** Max 3 ralph-loop cycles per child, then escalate

These are not hard timeouts — the agent uses judgment. But if a node exceeds these bounds, it should check in with the user.
