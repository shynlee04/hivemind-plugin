---
name: hivemind-power-on
description: >-
  LOAD FIRST — session governance core. Use actual tools to discover session
  state, filter active/resumable sessions, query hierarchy, and aggregate
  cross-session data. No aspirational workflow — only real tool capabilities.
version: 2.1.0
lineage: hivemind
load_priority: 1
consumed-by:
  - hm-l0-orchestrator
  - hf-l0-orchestrator
  - hm-l1-coordinator
  - hf-l1-coordinator
  - hm-l2-conductor
  - hf-l2-meta-builder
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
  - delegation-status
  - hivemind-trajectory
  - prompt-skim
  - prompt-analyze
  - hivemind-doc
  - hivemind-pressure
---

# Hivemind Power-On — Session Governance Core

## 1. Overview (30-second read)

This skill helps you discover which sessions are active on the project, which can be resumed, and how to explore delegation hierarchy through actual tools. The session-tracker at `.hivemind/session-tracker/` records every session that ever ran. Use the tools below to query this data — do not rely on aspirational workflows or undocumented behavior. No hallucination. No fake capabilities.

**What this skill does NOT do:** It does not auto-preserve context across OpenCode restarts. It does not guarantee that resuming a session works without SDK support. It does not provide a magical "just delegate without thinking" protocol. It gives you real tool actions and tells you their honest capabilities.

## 2. Real Tools and How to Use Them (2-minute read)

### 2.1 session-tracker (MOST IMPORTANT)

This tool queries the session-tracker state in `.hivemind/session-tracker/`. Six actions:

| Action | What It Returns | Use Case |
|--------|----------------|----------|
| `list-sessions` | All session IDs with status, depth, timestamps | Getting the full picture of project activity |
| `filter-sessions({status, agentType, minDepth, maxDepth, timeRange})` | Sessions matching filter criteria | Finding active/resumable sessions. Filter `status: "active"` replaces the old `find-resumable` |
| `search-sessions({query, limit})` | Search results across .md AND child .json files | Searching session content including lastMessage, turn.content, journey[].content |
| `get-status({sessionId})` | Status and metadata for one session | Quick check on a specific session |
| `export-session({sessionId})` | Full session data | Getting complete session detail |
| `get-summary({sessionId})` | Summarized session overview | Brief session snapshot |

**Key distinction:** `filter-sessions` is the discovery tool. `search-sessions` is the research tool. Neither performs resume — they provide metadata for you to decide.

### 2.2 session-hierarchy

Explore delegation structure:

| Action | What It Returns | Use Case |
|--------|----------------|----------|
| `get-children({sessionId})` | Direct children in hierarchy tree | View immediate delegations |
| `get-manifest({sessionId})` | Flattened child list from hierarchy-manifest.json | Full delegation list without recursive traversal (NEW) |
| `get-parent-chain({sessionId})` | Chain of parents up to root | Trace delegation path |
| `get-delegation-depth({sessionId})` | Numerical depth value | Quick depth check |

**`get-manifest` is the preferred action** for inspecting delegation trees. It reads `hierarchy-manifest.json` which captures the flattened child list — no recursive tree walking needed.

### 2.3 session-context

Cross-session intelligence:

| Action | What It Returns | Use Case |
|--------|----------------|----------|
| `aggregate({groupBy: "status"})` | Count of sessions per status | "How many active/completed sessions?" (NEW) |
| `aggregate({groupBy: "subagentType"})` | Count per agent type | "What are the top agent types?" (NEW) |
| `find-related({sessionId})` | Related sessions by tool overlap | Finding related work |
| `cross-reference({term})` | Sessions referencing a tool or term | Cross-session reference search |
| `synthesize-context({sessionIds})` | Merged context from multiple sessions | Building a unified picture |

### 2.4 hivemind-session-view (NEW)

Unified read-through query across three data roots:

| Action | What It Returns | Use Case |
|--------|----------------|----------|
| `get({sessionId})` | Nested view: `{session, delegations, trajectory}` | Complete picture from one call |

This tool reads from three sources concurrently:
- `.hivemind/session-tracker/{sessionId}/` — Session data (continuity, hierarchy)
- `.hivemind/state/delegations.json` — Delegation records
- `.hivemind/state/trajectory-ledger.json` — Trajectory checkpoints

Use this when you need a unified view of a session's state. For simple queries (just status, just depth), use the specific tool action instead.

### 2.5 delegation-status

Poll and inspect delegation state:

| Action | What It Returns | Use Case |
|--------|----------------|----------|
| `status({delegationId})` | Delegation status and progress | Checking a specific delegation |
| `list({status})` | All delegations, optionally filtered | Overview of delegation activity |

## 3. Resuming Sessions — The Truth (30-second read)

This is the most important correction from the previous version of this skill. **Context is NOT auto-preserved across OpenCode restarts.** Resume depends on specific SDK capabilities.

### The real resume workflow:

1. **Discover active sessions:**
   ```
    session-tracker({action: "filter-sessions", status: "active"})
    ```
    This returns sessions with `status: "active"`. Filters are applied across all per-session hierarchy-manifest.json files — aggregation is automatic. If a session has no hierarchy-manifest.json, it is not included in filter results (fall back to search-sessions for text-based discovery).

2. **Inspect hierarchy (if needed):**
   ```
   session-hierarchy({action: "get-manifest", sessionId: "<id>"})
   ```
   View the flattened delegation tree for the session.

3. **Get unified view (optional):**
   ```
   hivemind-session-view({action: "get", sessionId: "<id>"})
   ```
   Get session data + delegations + trajectory in one call.

4. **Attempt resume via task tool:**
   ```
   task({subagent_type: "<agentType>", task_id: "<sessionId>", prompt: "Continue"})
   ```

**Critical caveat:** Task tool resume **DEPENDS ON SDK V2** — verify before use. The SDK must support `task_id` resume with context restoration. If the SDK version does not support this, `task(task_id=...)` will start a new session instead of resuming.

**How to verify:**
- Check the SDK version in `node_modules/@opencode-ai/sdk/package.json`
- If SDK version < 2.x, task_id resume may not preserve context
- Run `delegation-status({action: "status", delegationId: "<id>"})` to check if delegation still exists

**Important change from previous guidance.** You SHOULD think about whether resume will work. You SHOULD verify before dispatching. The safety of "even if wrong it returns safely" depends on the SDK correctly handling the task_id — do not assume.

## 4. Jump Links — Reference Files

### Progressive Disclosure — Read Only When Needed

These reference files provide deeper detail on specific topics. Load them on demand, not all at once.

| # | File | Contains | Read When |
|---|------|----------|-----------|
| 1 | `references/01-session-tracker-anatomy.md` | Full session-tracker schemas: project-continuity.json, session-continuity.json, hierarchy-manifest.json | You need to understand the data format behind the tools |
| 2 | `references/02-task-tool-resume.md` | Real resume workflow with filter-sessions, get-manifest, hivemind-session-view | You are planning a resume and need step-by-step guidance |
| 3 | `references/03-lineage-routing-tree.md` | hm vs hf routing decision tree | You are unsure which lineage to route to |
| 4 | `references/04-project-phase-routing.md` | Phase-to-specialist mapping tables | You are dispatching a phase and need the right L2 agent |
| 5 | `references/05-continuity-navigation.md` | project-continuity.json and session-continuity.json navigation | You need to manually navigate the data without tools |
| 6 | `references/06-delegation-depth-recovery.md` | Multi-level recovery cascade protocol | You are recovering from a deep delegation chain |

## 5. Tool Catalog (1-minute read)

All custom tools available via the Hivemind plugin. Callable directly from agent workflows.

| Tool | Purpose | Key Actions |
|------|---------|------------|
| `session-tracker` | Query session state | list-sessions, filter-sessions, search-sessions, get-status, export-session, get-summary |
| `session-hierarchy` | Explore delegation structure | get-children, get-manifest, get-parent-chain, get-delegation-depth |
| `session-context` | Cross-session aggregation | aggregate({groupBy}), find-related, cross-reference, synthesize-context |
| `hivemind-session-view` | Unified cross-root view | get({sessionId}) |
| `delegation-status` | Poll delegation state | status, list |
| `delegate-task` | Create child session via SDK | dispatch (WaiterModel) |
| `hivemind-trajectory` | Query execution trajectory | inspect, traverse, attach, checkpoint, event, close |
| `hivemind-pressure` | Query runtime pressure | classify, detect, inspect-tool-catalog, attach-event |
| `hivemind-doc` | Read-only document intelligence | skim, skim-directory, read, chunk, search |
| `prompt-skim` | Fast prompt scan | word/lines/tokens count, URL extraction, path verify, complexity score |
| `prompt-analyze` | Deep prompt analysis | contradiction detection, vagueness, missing scope, clarity signals |
| `hivemind-sdk-supervisor` | Inspect SDK client health | health, heartbeat, diagnostics, readiness |
| `hivemind-command-engine` | Command discovery and routing | discover, analyze-contract, render-context, transform-messages, route-preview, list-commands |
| `hivemind-agent-work-create` | Create agent work contract | Contract with task boundary, surfaces, dependencies, evidence requirements |
| `hivemind-agent-work-export` | Export agent work contract | Export as JSON or Markdown |
| `configure-primitive` | Configure OpenCode primitives | compile, decompile, read, list, inspect for agents/commands/skills |
| `validate-restart` | Validate restart safety | Check discoverability, circular deps, missing refs, permission breaks |
| `bootstrap-init` | Initialize harness bootstrap | Create .hivemind surfaces and install primitive symlinks |
| `bootstrap-recover` | Recover bootstrap failures | Repair missing or broken symlinks |

## 6. Quality Gates (shortened)

Every delegation that returns should pass the gate triad. Load the gate skills independently — this skill does not run them.

```
Sequence: gate-lifecycle-integration → gate-spec-compliance → gate-evidence-truth
HALT rule: If any gate FAILS, stop. Produce remediation. Do not proceed.
```

For detailed gate execution, load `hm-l2-gate-orchestrator` or the individual gate skills:
- `gate-l3-lifecycle-integration` — 9-surface mutation authority, CQRS boundaries, actor hierarchy
- `gate-l3-spec-compliance` — Bidirectional traceability, gap detection, EARS criteria
- `gate-l3-evidence-truth` — L1-L5 evidence hierarchy, mock detection

## 7. Short Version (for tight context)

```
1. session-tracker({action:"list-sessions"}) → see what exists
2. session-tracker({action:"filter-sessions", status:"active"}) → find active/resumable
3. session-hierarchy({action:"get-manifest", sessionId}) → inspect delegation tree
4. hivemind-session-view({action:"get", sessionId}) → unified session view
5. task({subagent_type:"<type>", task_id:"<id>"}) → attempt resume (verify SDK v2 first)
6. Quality gate triad on each delegation return
7. Depth max = 3 → escalate to user
```

## 8. Load This at Every User Turn

This is not a "load once at start" skill. Load it:

| When | Why |
|------|-----|
| Session start | Get the current session landscape |
| Every user turn | Session state may have changed. New sessions, new completions. |
| After disconnect | Find sessions that may need attention |
| After compact | Reconstruct awareness from disk |
| Before delegation | Check if there's a session to resume vs create new |

## 9. Escalation — When to Tell the User

| Situation | What to do |
|-----------|-----------|
| 3 consecutive gate failures on same delegation | Escalate with full gap report and retry history |
| delegation depth reaches 3 | Escalate: "This chain is too deep. Need architectural split." |
| session-tracker not responding | Fallback: `glob(".hivemind/session-tracker/*/")` — find directories directly |
| Ambiguous hm vs hf lineage | Load `hm-l2-user-intent-interactive-loop` → clarify with user |
| task_id not found | Session may not be resumable. Check SDK version. Create fresh dispatch. |
