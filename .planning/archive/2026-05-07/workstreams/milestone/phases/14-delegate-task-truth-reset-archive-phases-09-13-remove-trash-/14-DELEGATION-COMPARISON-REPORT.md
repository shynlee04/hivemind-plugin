# Phase 14: delegate-task Usability Report — Real Development Use Cases (REVISED)

**Date:** 2026-04-17
**Phase:** 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash
**Focus:** Critical gaps in actual development workflows for orchestrator agents
**Revision:** Focus on the VALID_AGENTS design flaw and correct fix

---

## What This Report Is

NOT a theoretical comparison. NOT a feature list. This is a real-world usability audit for a developer orchestrating work across multiple agent sessions. The question: **can an orchestrator actually USE delegate-task in typical day-to-day work, and if not, where does it break?**

---

## The Core Orchestrator Use Case

You are an orchestrator agent. Your job is to:
1. Break a task into subtasks
2. Delegate subtasks to specialist agents
3. Collect results and synthesize
4. Continue working in your session while subagents run in background

**Key requirement:** You need to delegate work, switch to other tasks, and check back later for results.

---

## The Root Problem: Hardcoded VALID_AGENTS Whitelist

### Current Implementation (BROKEN)

```typescript
// src/lib/delegation-manager.ts line 326-331
private validateAgent(agent: string): string {
  if (!VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number])) {
    throw new Error(`[Harness] Invalid agent: ${agent}`)
  }
  return agent
}

// src/lib/types.ts line 23-25
export const VALID_AGENTS = [
  "researcher", "builder", "critic", "general",
] as const
```

**This validates against a hardcoded list that excludes:**
- All built-in OpenCode agents (`explore`, and any others)
- All custom/project-level agents
- All global agents

### What the SDK Actually Provides

The task tool test revealed the SDK returns full agent metadata:

```typescript
client.app.agents()  // Returns Array<Agent> where Agent = {
  name: string           // "explore", "researcher", etc.
  description?: string
  mode: "subagent" | "primary" | "all"
  builtIn: boolean        // true for OpenCode built-ins
  topP?: number
  temperature?: number
  color?: string
  permission: { edit, bash, webfetch, doom_loop, external_directory }
  model?: { modelID, providerID }
  prompt?: string
  tools: { [key: string]: boolean }
  options: { [key: string]: unknown }
  maxSteps?: number
}
```

### The Fix Should Be

Instead of validating against a hardcoded list, `validateAgent` should:

1. Call `client.app.agents()` to get all available agents
2. Check if the requested agent name exists in that list
3. Accept ANY agent that the SDK says exists (built-in OR custom/project/global)

```typescript
// CORRECT implementation (not yet implemented)
private async validateAgent(agent: string): Promise<string> {
  const agents = await this.client.app.agents()
  const agentNames = agents.map(a => a.name)
  if (!agentNames.includes(agent)) {
    throw new Error(`[Harness] Agent not found: ${agent}. Available: ${agentNames.join(', ')}`)
  }
  return agent
}
```

---

## Evidence

### Test 1: Explore Agent Rejection

```
delegate-task(agent: "explore", prompt: "Find all test files")
→ [Harness] Invalid agent: explore

task tool(agent: "explore", prompt: "Find all test files")
→ Works (task_id: ses_2648fec92ffewhEIMvDLe9vCrY)
```

**The `explore` agent exists** (returned by `client.app.agents()` per task tool test) but is rejected by the hardcoded whitelist.

### Test 2: Async Background File Write

Both mechanisms work for actual file writes:

| Check | delegate-task | task tool |
|-------|---------------|-----------|
| File created | ✅ `/tmp/delegate-async-20260417-193106.txt` | ✅ `/tmp/task-async-1776429067.txt` |
| Content correct | ✅ "delegate-task async works" | ✅ "task tool async works" |
| Persisted to delegations.json | ✅ YES | N/A |
| Can resume with ID | ✅ delegationId | ✅ task_id |

### Test 3: Researcher Timeout

```
delegate-task(agent: "researcher", prompt: "Read README + types")
→ [Delegation Timeout] researcher: timeout

task tool(agent: "researcher", prompt: "Read README + types")
→ Completed successfully
```

**Possible cause:** `researcher` is in VALID_AGENTS so it passes validation, but something else causes timeout. Not enough data to diagnose.

---

## The Orchestrator's Dilemma

### Current State: Two Mechanisms, Unclear Boundaries

| Situation | Use delegate-task? | Use task tool? |
|-----------|---------------------|----------------|
| Explore codebase (`explore`) | ❌ NOT VALID | ✅ Works |
| Custom project agent | ❌ NOT VALID | ✅ Works |
| Global agent | ❌ NOT VALID | ✅ Works |
| Built-in GSD agents (`researcher`, `builder`, `critic`, `general`) | ✅ Works | ✅ Works |
| Long-running research | ⚠️ researcher may timeout | ✅ Works |
| Background work needing tracking | ✅ YES | ❌ No persistence |

**The orchestrator cannot use `delegate-task` as the primary mechanism because it rejects ALL agents not in the hardcoded `VALID_AGENTS` list — including `explore` (the most common exploration agent) and ALL custom/project/global agents.**

---

## What Works vs What Doesn't

### Works: GSD Built-in Agents (VALID_AGENTS list only)

| Agent | delegate-task | Notes |
|-------|---------------|-------|
| `general` | ✅ Works | Tested, works reliably |
| `researcher` | ⚠️ Timeout issue | 30s timeout, not diagnosed |
| `builder` | (not tested) | Unknown |
| `critic` | (not tested) | Unknown |

### Doesn't Work: Everything Else

| Agent Type | delegate-task | task tool |
|------------|---------------|-----------|
| `explore` (built-in) | ❌ Rejected | ✅ Works |
| Custom project agents | ❌ Rejected | ✅ Works |
| Global agents | ❌ Rejected | ✅ Works |
| Any agent not in VALID_AGENTS | ❌ Rejected | ✅ Works |

---

## The Fix Is Simple

### Current (broken) validateAgent:

```typescript
private validateAgent(agent: string): string {
  if (!VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number])) {
    throw new Error(`[Harness] Invalid agent: ${agent}`)
  }
  return agent
}
```

### Should be (correct):

```typescript
private async validateAgent(agent: string): Promise<string> {
  const agents = await this.client.app.agents()
  const validAgentNames = agents.map(a => a.name)
  
  if (!validAgentNames.includes(agent)) {
    const available = validAgentNames.join(', ')
    throw new Error(`[Harness] Unknown agent: ${agent}. Available agents: ${available}`)
  }
  
  return agent
}
```

**This change would:**
1. Accept `explore` (and any other built-in OpenCode agents)
2. Accept ALL custom/project-level agents
3. Accept ALL global agents
4. Provide useful error message listing actual available agents

**Additional note:** The method changes from sync to async — all callers must be updated to `await validateAgent()`.

---

## Verification: The task Tool Succeeded Because It Doesn't Validate

The task tool accepts `explore` because OpenCode's native task mechanism doesn't do this hardcoded whitelist validation. It just passes the agent name to the session and lets the platform resolve it.

The `delegate-task` tool is more restrictive by design (intending to prevent invalid agent names) but the implementation is wrong — it validates against a static list instead of querying the SDK.

---

## Updated Verdict: Is delegate-task Superior for Background Tasks?

**For the specific use case: "fire background tasks and check results later"**

| Criterion | delegate-task | task tool | Winner |
|-----------|---------------|-----------|--------|
| Background fire-and-forget | ✅ Works | ✅ Works | Tie |
| Tracking via ID | ✅ delegationId + delegations.json | ✅ task_id (not persisted) | delegate-task |
| Result recovery | ✅ Persisted + recoverable | ❌ Lost | delegate-task |
| Idempotency | ⚠️ Multiple calls = duplicate sessions | ⚠️ Same | Tie |
| Session isolation | ✅ Child session independent | ✅ Child session independent | Tie |
| Parent crash survival | ✅ Persisted to disk | ❌ Lost | delegate-task |
| **Agent flexibility** | ❌ Hardcoded whitelist only | ✅ Any agent works | **task tool** |

**delegate-task IS superior for background work persistence.** But it's **broken for agent validation** — the hardcoded VALID_AGENTS list means it can't be used for `explore` or any custom/project/global agents.

**The fix is one method** — change `validateAgent` to query `client.app.agents()` instead of checking a hardcoded list.

---

## Real-World Impact on Orchestrator

### Before Fix (Current State)
```typescript
// Orchestrator must use TWO mechanisms:
if (agent === "explore" || isCustomAgent(agent)) {
  // Must use task tool — delegate-task rejects it
  await taskTool.delegate(agent, prompt)
} else {
  // Can use delegate-task for GSD agents
  await delegateTask(agent, prompt)
}
```

### After Fix
```typescript
// Orchestrator uses ONE mechanism for all agents
await delegateTask(agent, prompt)  // Works for all: explore, custom, global, GSD
```

---

## Recommendations

### R-1: Change validateAgent to Query SDK (CRITICAL)

```typescript
private async validateAgent(agent: string): Promise<string> {
  const agents = await this.client.app.agents()
  const validAgentNames = agents.map(a => a.name)
  
  if (!validAgentNames.includes(agent)) {
    const available = validAgentNames.join(', ')
    throw new Error(`[Harness] Unknown agent: ${agent}. Available: ${available}`)
  }
  
  return agent
}
```

This is the **only change needed** to fix the critical gap. All other validation logic remains.

### R-2: Update All Callers to Await

The `validateAgent` method becomes async, so all call sites in `createDelegation` must `await` it.

### R-3: Investigate researcher Timeout

Separate issue — `researcher` is in VALID_AGENTS but times out. Not related to validation.

### R-4: Delete VALID_AGENTS (after fix)

Once `validateAgent` queries the SDK, the `VALID_AGENTS` constant in `types.ts` becomes unnecessary. Remove it to prevent future confusion.

---

## Final Assessment

### delegate-task for background work: **SUPERIOR** (with caveat)

The durability, persistence, and tracking are all better than task tool. But the agent validation blocks its use for anything except GSD built-in agents.

### The blocker: Hardcoded VALID_AGENTS list

The fix is trivial — one method to query SDK instead of checking static list. But until that fix is made, the orchestrator cannot use delegate-task as the primary delegation mechanism.

### What the orchestrator needs:
1. Call any agent (built-in, project, global, GSD) via delegate-task
2. Track via delegation ID
3. Recover on restart
4. Get structured errors

**All possible once validateAgent is fixed.**

---

**Evidence:**
- `[Harness] Invalid agent: explore` — hardcoded rejection
- `client.app.agents()` returns full agent list with `name`, `builtIn`, `mode` fields
- delegations.json persists all delegate-task calls with correct status
- `/tmp/delegate-async-20260417-193106.txt` — confirmed async persistence works

**Fix location:** `src/lib/delegation-manager.ts` — `validateAgent()` method (lines 326-331)