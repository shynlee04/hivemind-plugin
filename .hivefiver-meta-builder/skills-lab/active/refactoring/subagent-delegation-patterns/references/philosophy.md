# Subagent Delegation — Design Philosophy

## 1. Delegate Scope, Not Trust

The core principle behind all delegation patterns:

```
Delegate bounded scope with explicit constraints.
Do not delegate unbounded trust with vague intent.
```

**What "scope" means:**
- **Task boundary**: Exact problem to solve, files/surfaces to touch, constraints to honor
- **Success criteria**: What "done" looks like — output shape, evidence required, verification command
- **Non-goals**: Explicitly what NOT to do — avoids scope creep
- **Budget**: Turn limits, token budgets, time constraints

**What "trust" means (and why not to delegate it):**
- "Figure it out" — no bounded scope, subagent must guess
- "Make it work" — no success criteria, cannot verify completion
- "Be smart" — no tools boundary, subagent may over-reach

## 2. WaiterModel — Always-Background Dispatch

The `delegate-task` tool uses the **WaiterModel**: dispatch returns immediately
with a delegation ID. The subagent runs asynchronously. The caller polls for
completion.

**Why async by default:**
- Caller can continue other work while subagent executes
- Multiple subagents can run in parallel (parallel delegation waves)
- Long-running work does not block the orchestrator
- Context windows are preserved — caller does not wait with a full context

**The cost of async:**
- Caller must remember to poll — delegation-status is opt-in
- No automatic notification on completion (future: notification routing)
- If caller forgets to poll, the subagent result is lost (stored in state,
  but never read by the caller)

## 3. Synthetic Injection — Parent Session Dispatch

The `execute-slash-command` tool with `subtask:false + agent` creates a
**synthetic parent prompt** — the command is injected as an agent utterance
in the current session, the target agent runs one turn, then control is
restored to the original agent.

**Why synthetic:**
- The command is NOT user input — it is system-generated
- Prevents context pollution — synthetic utterances do not appear as user messages
- Agent override is transient — the agent switch lasts exactly one turn

**Key constraint:** The target agent must exist as a registered definition.
You cannot override to a non-existent agent.

## 4. Opt-In Polling — No Push Notifications (Current State)

Delegation status checking is **opt-in**. The caller must explicitly call
`delegation-status` to learn whether a subagent completed.

**Why this is intentional (current architecture):**
- Polling is explicit, predictable, and testable
- No hidden push mechanism that could fire unexpectedly
- Caller controls when to consume subagent results

**Future direction (pending notification redesign phase):**
- Push notifications via stream reactivation
- Automatic delegation monitoring with TTL expiry
- Notification routing with retry (3 retries, configurable backoff)

## 5. Dual-Signal Completion

When a `delegate-task` delegation completes, it produces two signals:

1. **Status signal**: The delegation status transitions from `running` to `completed`/`error`/`timeout` — queryable via `delegation-status`
2. **Output signal**: The subagent's final message and any saved files — accessible from the status response

**Why dual signal matters:**
- Status alone tells you "it's done" but not "what it did"
- Output alone gives results but not context (was there an error? timeout?)
- Together, they provide a complete picture: did it succeed, and what did it produce?

**Verification pattern:**
```
1. Check delegation-status → status is "completed"
2. Read the output → verify it matches success criteria
3. If status is "error" or "timeout" → read error details, re-delegate with fixes
```

## 6. Hierarchy Is the Chain of Trust

Every delegation creates a parent-child relationship. The chain matters:

```
Root session (user)
  └─ L1 coordinator (dispatch specialist)
       ├─ L2 researcher (child 1) — research reports → feeds back to L1
       ├─ L2 reviewer (child 2) — review results → feeds back to L1
       └─ L2 executor (child 3) — implement fixes → feeds back to L1
```

**Why the chain matters:**
- **Context flows down**: Children inherit context from parents
- **Results flow up**: Children return output to parents
- **Depth has limits**: Recommended max depth = 3. Beyond 3, the chain becomes unreliable.
- **Stacking preserves the chain**: Attaching to a parent session maintains the hierarchy rather than creating a new root

## 7. Prompt Is the Contract

The delegation prompt is a **contract** between caller and subagent. It must be:

- **Bounded**: Exact scope, not "figure it out"
- **Explicit**: Success criteria, not "make it work"
- **Structured**: What to do, why, what not to do, what success looks like
- **Minimal**: No session history dump — the parent session chain preserves context

**Bad prompt:**
> "Look at the codebase and fix any issues you find. Make it better."

**Good prompt:**
> "Audit src/tools/delegation/ for the 3 anti-patterns listed in the plan:
> orphan dispatch, context dumping, and budget starvation. Report each
> finding with file:line reference and severity. Do NOT modify files — read-only audit.
> Output: structured audit report with findings table."
