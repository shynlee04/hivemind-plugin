---
name: hivemind-power-on
description: >-
  LOAD FIRST — session governance core. Use actual tools to discover session
  state, filter active/resumable sessions, query hierarchy, and aggregate
  cross-session data. No aspirational workflow — only real tool capabilities.
version: 2.2.0
lineage: hivemind
load_priority: 1
consumed-by:
  - orchestrator (L0)
  - coordinator (L1)
  - conductor (L2)
  - meta-builder (L2)
allowed-tools:
  - skill
  - read
  - grep
  - glob
  - bash
  - task
  - todowrite
  - session-tracker
  - session-hierarchy
  - session-context
  - hivemind-session-view
  - delegate-task
  - delegation-status
  - prompt-skim
  - prompt-analyze
  - hivemind-doc
  # TBD tools — kept in catalog for future reference; use with awareness of partial state:
  - hivemind-trajectory  # TBD: P24, basic operational — state machine untested
  - hivemind-pressure   # TBD: P26, basic operational — redesign pending
---

# Hivemind Power-On — Session Governance Core

## 1. Overview (30-second read)

This skill discovers which sessions are active, which can be resumed, and how to explore delegation hierarchy through actual tools. The session-tracker at `.hivemind/session-tracker/` records every session that ever ran. Use the tools below to query this data — no aspirational workflows, no fake capabilities.

**What this skill does NOT do:** It does not auto-preserve context across restarts. It does not guarantee resume works without SDK support. It does not provide detailed session operation workflows (those belong to `session-foundation`).

**Boundary with session-foundation:** This skill governs session authority and load-first discovery. `session-foundation` provides detailed session workflows (discover→navigate→aggregate→act), tool reference tables, and self-correction patterns. Load `session-foundation` when you need step-by-step session operations.

## 2. Core Tools — Discovery and Navigation

### Primary tools (always available)

| Tool | Purpose | Key Actions |
|------|---------|-------------|
| `session-tracker` | Session discovery | `list-sessions`, `filter-sessions`, `search-sessions`, `get-status`, `get-summary` |
| `session-hierarchy` | Delegation structure | `get-children`, `get-manifest` (preferred), `get-parent-chain`, `get-delegation-depth` |
| `session-context` | Cross-session aggregation | `aggregate({groupBy})`, `find-related`, `cross-reference`, `synthesize-context` |
| `hivemind-session-view` | Unified cross-root view | `get({sessionId})` — reads session data + delegations + trajectory |
| `delegate-task` | Create child session | Dispatch subagents; stack onto existing sessions via `parentSessionId` |
| `delegation-status` | Poll delegation state | `status({delegationId})`, `list({status})` |

### TBD tools (future capability reference)

These tools are catalogued but have partial or pending implementations. Use with awareness of their current state:

| Tool | Status | Future Purpose |
|------|--------|----------------|
| `hivemind-trajectory` | 🟡 PARTIAL (P24) | Execution trajectory inspection, checkpointing, event tracking |
| `hivemind-pressure` | 🟡 PARTIAL (P26) | Runtime pressure classification, tool authority inspection |

For the complete tool catalog with permission levels, load `tool-capability-matrix`.

## 3. Resuming Sessions — The Truth

Context is NOT auto-preserved across restarts. Resume depends on SDK support.

### The real resume workflow:

1. **Discover:**
   ```
   session-tracker({action: "filter-sessions", status: "active"})
   ```

2. **Inspect:**
   ```
   session-hierarchy({action: "get-manifest", sessionId: "<id>"})
   ```

3. **Unified view (optional):**
   ```
   hivemind-session-view({action: "get", sessionId: "<id>"})
   ```

4. **Attempt resume:**
   ```
   task({subagent_type: "<agentType>", task_id: "<sessionId>", prompt: "Continue"})
   ```

**Critical caveat:** Task tool resume DEPENDS ON SDK support. If the SDK does not support `task_id` context restoration, the resume starts a new session instead of continuing the existing one. Verify SDK version before attempting resume.

### Decision Matrix: Resume vs Stack vs Create

| Situation | Approach | Tool |
|-----------|----------|------|
| Session active, same agent type | **Resume** | `task` tool with `task_id` |
| Session completed, add work | **Stack** | `task` tool with `task_id` (preferred) or `delegate-task` with `parentSessionId` (async background only) |
| No relevant session exists | **Create** | `task` tool (PREFERRED, full control) or `delegate-task` (async background only) |
| Not sure if resumable | **Check first** | `delegation-status` before dispatch |

## 4. Jump Links — Reference Files

Read on demand, not all at once:

| # | File | Contains | Read When |
|---|------|----------|-----------|
| 1 | `references/01-session-tracker-anatomy.md` | Full session-tracker schemas | You need data format details |
| 2 | `references/02-task-tool-resume.md` | Real resume workflow with step-by-step | Planning a resume |
| 3 | `references/03-lineage-routing-tree.md` | Lineage routing decision tree | Unsure which lineage to route to |
| 4 | `references/04-project-phase-routing.md` | Phase-to-specialist mapping | Dispatching a phase |
| 5 | `references/05-continuity-navigation.md` | Manual continuity.json navigation | Navigating data without tools |
| 6 | `references/06-delegation-depth-recovery.md` | Deep recovery cascade protocol | Recovering from deep delegation chain |
| 7 | `references/terminology-map.md` | Harness terminology (session, delegation, tool, agent) | Clarifying runtime concepts |
| 8 | `references/philosophy.md` | Governance philosophy — why load-first, why tool-first | Understanding the design rationale |

## 5. Quality Gate Triad

Every delegation return should pass the gate triad. Load gate skills independently:

```
Sequence: lifecycle-integration → spec-compliance → evidence-truth
HALT rule: If any gate FAILS, stop. Produce remediation. Do not proceed.
```

For detailed gate execution, load `gate-orchestrator` or individual gate skills:
- `gate-lifecycle-integration` — 9-surface mutation authority, CQRS boundaries, actor hierarchy
- `gate-spec-compliance` — Bidirectional traceability, gap detection, EARS criteria
- `gate-evidence-truth` — L1-L5 evidence hierarchy, mock detection

## 6. Load at Every User Turn

This is not a "load once at start" skill:

| When | Why |
|------|-----|
| Session start | Get the current session landscape |
| Every user turn | Session state may have changed |
| After disconnect | Find sessions needing attention |
| After compact | Reconstruct awareness from disk |
| Before delegation | Check if resume vs stack vs create |

## 7. Escalation — When to Tell the User

| Situation | Action |
|-----------|--------|
| 3 consecutive gate failures on same delegation | Escalate with full gap report and retry history |
| Delegation depth reaches 3 | "This chain is too deep. Consider architectural split." |
| session-tracker not responding | Fallback: `glob(".hivemind/session-tracker/*/")` |
| Ambiguous lineage routing | Load `user-intent-interactive-loop` → clarify with user |
| task_id not found | Session may not be resumable. Check SDK version. Create fresh dispatch. |
