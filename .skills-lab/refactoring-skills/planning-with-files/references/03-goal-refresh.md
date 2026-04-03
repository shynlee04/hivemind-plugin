# Goal Refresh — Enforcement Mechanism

## The Problem

After approximately 50 tool calls, the original goal drifts out of the Agent's attention window. This is the "lost in the middle" effect — content at the start of a long context gets less attention than recent content.

## The Solution

Re-reading `task_plan.md` pulls the goal back into recent attention. But this must be **enforced**, not voluntary.

## Enforcement Layers

### Layer 1: Hook Enforcement (Automatic)

The `hooks/pre-tool-use.json` hook runs before every Write/Edit tool call. It:

1. Checks if `task_plan.md` exists
2. If yes, reads the first 30 lines (Goal + Current Phase + active phase)
3. Injects this into the Agent's context before the tool executes

This means the Agent **sees the goal** before every file modification, regardless of whether it remembered to re-read.

**Hook config:** See `hooks/pre-tool-use.json` in this skill pack.

### Layer 2: Script Enforcement (Session Boundary)

The `hooks/stop.json` hook runs `scripts/check-complete.sh` when the session stops. This:

1. Counts total phases vs complete phases
2. Reports status to stdout
3. If incomplete, reminds the Agent to update `progress.md`

This catches goal drift at session boundaries.

### Layer 3: Algorithm Enforcement (Agent Discipline)

Before each Write/Edit/Bash (non-read-only) tool call, the Agent runs this algorithm:

```
1. Count tool calls since last Read of task_plan.md
2. If count >= 5:
   → Read task_plan.md (first 30 lines minimum)
   → Reset counter to 0
3. Proceed with tool call
```

**Why 5?** This is the sweet spot:
- Low enough to prevent drift (context window holds ~50 tool calls)
- High enough to avoid burning tokens on every single call
- 10 re-reads per 50-call session = goals stay fresh

### Layer 4: Recovery Enforcement (Session Start)

At session start, if planning files exist:

1. Read ALL three planning files immediately
2. Run `scripts/session-catchup.py`
3. Run `git diff --stat`
4. Reconcile plan state with actual state

This ensures the Agent starts with the goal in context, even after `/clear`.

## Token Budget

Goal-refresh has a token cost. Here's the budget:

| Operation | Approximate Tokens | Frequency |
|-----------|-------------------|-----------|
| Read task_plan.md (first 30 lines) | ~500 | Every 5 tool calls |
| Hook injection (pre-tool-use) | ~200 | Every Write/Edit |
| Session start (all 3 files) | ~1500 | Once per session |
| Stop hook (check-complete) | ~100 | Once per session |

**Total per 50-call session:** ~5,000 tokens for goal-refresh. This is <5% of a typical context window.

## What Gets Re-Read

Not the entire file. Only the goal-critical sections:

```markdown
# Task Plan: <title>        ← What are we doing?
## Goal                      ← Why are we doing it?
## Current Phase             ← Where are we?
### Phase N: <title>         ← What's the current work?
- **Status:** in_progress    ← Is it active?
```

This is ~30 lines. Enough to re-orient, not enough to burn tokens.

## When to Re-Read the Full File

Re-read the ENTIRE `task_plan.md` (not just first 30 lines) when:

1. Starting a new phase (need to see all remaining phases)
2. After an error (need to see Errors Encountered table)
3. When the user asks "what's the plan?" (need full context)
4. During VERIFYING state (need to check all phases)

## Anti-Pattern: Over-Refreshing

Reading `task_plan.md` before EVERY tool call burns tokens unnecessarily. The hook handles the minimum injection. The Agent should only do a full Read when the algorithm triggers (every 5 calls) or when the conditions above apply.

## Verification

To verify goal-refresh is working:

1. Check `progress.md` for Read entries of `task_plan.md`
2. Count tool calls between Reads — should be ≤5
3. If >5 calls between Reads, the Agent is drifting
