[LANGUAGE: Write this file in en per Language Governance.]
# Tools Surface Investigation — UAT Phase 58.9

**Date:** 2026-06-05  
**Subagent:** hm-codebase-mapper  
**Scope:** Session management, coordination, and delegation tools (22 tools)

---

## 1. Per-Tool Schema Table

### A. Delegation Tools

| Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
|------|---------|---------------|---------------|-------------------|--------------------|
| `delegate-task` | execute | agent, prompt | context, stackOnSessionId | "error", "timeout" (result) | `coordinator.dispatch` at `src/tools/delegation/delegate-task.ts:79` |
| `delegation-status` | status, list, control, find-stackable, pool, peek, progress | (varies by action) | delegationId, status, action, control, agentFilter, paneId, maxBytes | dispatched, running, completed, error, timeout, aborted, cancelled (VALID_DELEGATION_STATUSES at `src/tools/delegation/delegation-status.ts:134`) | `delegationManager.getStatus`, `readPersistedDelegations`, `session-intelligence.ts` findStackableSessions |
| `DelegationManager.dispatch` | dispatch | agent, parentSessionId, prompt | currentDepth, queueKey, surface, workingDirectory | dispatched → running → (completed \| error \| timeout) | `coordinator.dispatch` or `runtime.dispatch` at `src/coordination/delegation/manager.ts:165-168` |
| `DelegationCoordinator.dispatch` | dispatch | agent, currentDepth, parentSessionId, prompt, queueKey | surface, workingDirectory, model | dispatched → running (transitions), error, aborted, cancelled, timeout (terminal) | `childSessionStarter.start` → SDK `createSession` + `sendPromptAsync` at `src/coordination/delegation/coordinator.ts:192-312` |
| `sdk-child-session-starter.start` | start | agent, delegationId, parentSessionId, prompt, validatedAgent, workingDirectory | model, onChildSessionId | — (no status; returns childSessionId) | `createSession` SDK API at `src/coordination/delegation/sdk-child-session-starter.ts:32`, `sendPromptAsync` at `:49` |

### B. Session Tracking Tools

| Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
|------|---------|---------------|---------------|-------------------|--------------------|
| `session-tracker` | export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions | action | sessionId, query, limit, format, status, agentType, minDepth, maxDepth, timeRange | "active", "completed", "error", "aborted", "cancelled" (from child records + hierarchy manifests) | `resolveSessionFile`, `safeSessionPath`, `hierarchy-manifest.json` |
| `session-hierarchy` | get-children, get-parent-chain, get-delegation-depth, get-manifest | action, sessionId | includeStatus | "active", "completed", "error", "aborted", "cancelled", "unknown" | `resolveSessionFile`, `readContinuity`, `hierarchy-manifest.json` |
| `session-context` | find-related, cross-reference, synthesize-context, aggregate | action | sessionId, query, maxRelated, groupBy | `groupBy: "status"` aggregates "active", "completed", etc. | `project-continuity.json`, `hierarchy-manifest.json` |
| `session-delegation-query` | list, get | action | rootSessionId, status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore, offset, limit, sessionId | filtered by status string match | `hierarchy-manifest.json` children, `resolveSessionFile` for child records |
| `hivemind-session-view` | get | action, sessionId | — | "running", "dispatched" (for active delegation count) | 3 data roots: session-tracker, delegations, trajectory-ledger |
| `session-journal-export` | (export only) | format | sessionId, pipelineKey, pipelineKeyLabel | — (reads continuity + delegation records) | `listSessionContinuity`, `readPersistedDelegations`, `buildExecutionLineage` |

### C. Hivemind Tools

| Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
|------|---------|---------------|---------------|-------------------|--------------------|
| `hivemind-trajectory` | inspect, traverse, attach, checkpoint, event, close, create | action | trajectoryId, rootSessionId, sessionId, parentTrajectoryId, checkpointId, eventId, eventType, summary, evidenceRef, evidenceRefs, phaseNumber, phaseName, depth | — (trajectory-based state machine) | `trajectory-ledger.json` at `.hivemind/state/trajectory-ledger.json` |
| `hivemind-pressure` | classify, detect, inspect_tool_catalog, attach_event | action | score, tier, toolName, trajectoryId, rootSessionId, sessionId, parentTrajectoryId, eventId, summary, evidenceRef, evidenceRefs | tier 0-9, band labels | `runtime-pressure` feature → `eventTrajectory` for attach_event |
| `hivemind-command-engine` | discover, analyze_contract, render_context, transform_messages, route_preview, list_commands | action | commandName, arguments, context, messages, maxCharacters, score, tier | — (read-side only) | `executeCommandEngineAction` at `src/routing/command-engine/index.ts` |
| `hivemind-agent-work-create` | (create contract) | ownerAgent, taskBoundary, minimumEvidenceLevel | id, ownerSessionId, ownerParentSessionId, allowedSurfaces, dependencies, nonGoals, requiredProof, verificationCommands, blockedStateRules, briefing, summary, anchors, reinjectionPayload, sourceRefs, trajectoryId | — (creates contracts, no status enum) | `createAgentWorkContract` at `src/features/agent-work-contracts/index.ts` |
| `hivemind-agent-work-export` | (export contract) | contractId | format | — (read-only export) | `exportAgentWorkContract` |
| `hivemind-sdk-supervisor` | health, heartbeat, diagnostics, readiness | action | sessionId, maxDiagnostics, score, tier | — (health check only) | `executeSdkSupervisorAction` at `src/features/sdk-supervisor/index.ts` |
| `hivemind-doc` | skim, skim_directory, read, chunk, search | action, path | query, maxCharacters, maxResults | — (read-only document intelligence) | `executeDocIntelligenceAction` at `src/features/doc-intelligence/index.ts` |

### D. Tmux Tools

| Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
|------|---------|---------------|---------------|-------------------|--------------------|
| `tmux-copilot` | send-keys, list-panes, compute-grid, respawn, forward-prompt, take-over, release, peek | action | paneId, text, literal, mainPaneId, tree, sessionId, maxBytes | permission-denied, tmux-not-wired, tmux-not-installed, tmux-timeout, tmux-error, manualOverride, session-not-found | `getSessionManagerAdapter` at `src/features/tmux/types.ts` |
| `tmux-state-query` | list-sessions, get-session, get-summary | action | sessionId | permission-denied, tmux-not-wired | `getSessionManagerAdapter` |

### E. Continuity & Persistence

| Module | Key Methods | Status Values Used | File Path |
|--------|-------------|-------------------|-----------|
| `src/features/tmux/persistence.ts` | persist, remove, restoreAll, generateId | "active", "ready", "paused", "detached", "failed" (SessionState, 5 literals) | `.hivemind/state/tmux-sessions/<id>.json` |
| `src/task-management/continuity/index.ts` | listSessionContinuity, getSessionContinuity, recordSessionContinuity, patchSessionContinuity, deleteSessionContinuity | "pending" (default status in normalizeContinuityRecord) | `.hivemind/state/session-continuity.json` |
| `src/task-management/continuity/delegation-persistence.ts` | persistDelegations, readPersistedDelegations | maps: "dispatched"\|"running" → "active", "completed" → "completed", "aborted" → "aborted", "cancelled" → "cancelled", else "error" | `.hivemind/state/delegations.json` (legacy) + session-tracker dual-write |

---

## 2. Status Value Audit

### 2.1 Canonical DelegationStatus (Source of Truth)

Defined at `src/coordination/delegation/types.ts:1-9`:

| Status | Meaning | Terminal? |
|--------|---------|-----------|
| `dispatched` | Just dispatched, child session created and prompted | No |
| `running` | Child session processing, dual-signal monitoring active | No |
| `completed` | Dual-signal confirmed completion | Yes |
| `error` | Error occurred (child session deleted, SDK error, etc.) | Yes |
| `timeout` | Safety ceiling reached | Yes |
| `aborted` | Aborted by user or connection recovery failure | Yes |
| `cancelled` | Cancelled explicitly or because of connection drop | Yes |

**VALID_DELEGATION_STATUSES** at `src/tools/delegation/delegation-status.ts:134` is the runtime validation set and matches exactly: `{"dispatched", "running", "completed", "error", "timeout", "aborted", "cancelled"}`

### 2.2 DelegationTerminalKind (Subset + Extensions)

Defined at `src/coordination/delegation/types.ts:14-23`:

```
"completed" | "error" | "timeout" | "cancelled" | "restarted"
| "runtime-dispatch-unsupported" | "interrupted-by-signal"
| "non-resumable-after-restart"
```

**Note:** `aborted` is NOT in the terminal kind union. The terminal kind for aborted is `"cancelled"` (see `coordinator.ts:454`: `terminalKind: "cancelled"`).

### 2.3 DelegationLifecycleStatus (Pool Collapsed)

Defined at `src/coordination/delegation/pool-types.ts:36-43`:

```
"queued" | "dispatched" | "running" | "completed" | "failed" | "aborted" | "paused"
```

**Collapse mapping** from `DelegationStatus`: `error | timeout → "failed"`, `cancelled → "aborted"`. Adds `"queued"` and `"paused"` which don't exist in canonical DelegationStatus.

### 2.4 SessionState (Tmux Persistence)

Defined at `src/features/tmux/persistence.ts:32`:

```
"active" | "ready" | "paused" | "detached" | "failed"
```

**None of these overlap** with `DelegationStatus`.
`"paused"` overlaps with `DelegationLifecycleStatus` only.
`"active"` is used by session-tracker child records but means "session is running" vs tmux "tmux pane is alive."

### 2.5 Inconsistencies Found

| Issue | Location | Impact |
|-------|----------|--------|
| `aborted` missing from `DelegationTerminalKind` | `types.ts:14` | `abortDelegation` uses `terminalKind: "cancelled"` — losing signal fidelity |
| `DelegationLifecycleStatus` re-maps `error\|timeout → failed` | `pool-types.ts` + `manager.ts:251-258` | Downstream consumers see "failed" not "error" or "timeout" |
| `DelegationLifecycleStatus` re-maps `cancelled → aborted` | `manager.ts:256` | Lossy: "cancelled" and "aborted" are semantically different |
| SessionTracker child records use "active" for in-progress | `delegation-persistence.ts:24` | "active" is NOT in canon DelegationStatus; must be mapped FROM "dispatched"\|"running" |
| SessionTracker child records use "completed"\|"error"\|"aborted"\|"cancelled"\|"active" | `session-tracker.ts` passim | No "timeout" status in session-tracker; timeouts collapse to "error" |
| `normalizeContinuityRecord` uses "pending" as default status | `continuity/index.ts:185` | "pending" is NOT in any DelegationStatus type |
| Pool status "queued" has no source DelegationStatus mapping | `pool-types.ts:37` | Only reachable through `default` in the `getPoolSnapshot` switch |

### 2.6 Status Value Cross-Reference Matrix

| Value | DelegationStatus | DelegationTerminalKind | DelegationLifecycleStatus | SessionState | SessionTracker |
|-------|:----------------:|:----------------------:|:-------------------------:|:------------:|:--------------:|
| dispatched | ✓ | | ✓ | | |
| running | ✓ | | ✓ | | |
| completed | ✓ | ✓ | ✓ | | ✓ |
| error | ✓ | ✓ | → failed | | ✓ |
| timeout | ✓ | ✓ | → failed | | |
| aborted | ✓ | | ✓ | | ✓ |
| cancelled | ✓ | ✓ | → aborted | | ✓ |
| restarted | | ✓ | | | |
| runtime-dispatch-unsupported | | ✓ | | | |
| interrupted-by-signal | | ✓ | | | |
| non-resumable-after-restart | | ✓ | | | |
| queued | | | ✓ | | |
| paused | | | ✓ | ✓ | |
| active | | | | ✓ | ✓ |
| ready | | | | ✓ | |
| detached | | | | ✓ | |
| failed | | | ✓ | ✓ | |
| pending | | | | | (continuity default) |
| unknown | | | | | (fallback) |

---

## 3. Overlap Matrix

### 3.1 session-tracker vs session-hierarchy

| Dimension | session-tracker | session-hierarchy |
|-----------|----------------|-------------------|
| **list-sessions** | ✓ Reads continuity index + directory scan | — |
| **filter-sessions** | ✓ By status, agentType, depth range, time range | — |
| **get-children** | — (not exposed) | ✓ Reads hierarchy-manifest |
| **get-manifest** | — (not exposed) | ✓ Flattened child list |
| **get-parent-chain** | — | ✓ Walks parent chain |
| **get-delegation-depth** | — | ✓ Recursive depth compute |
| **Overlap:** | `filter-sessions` iterates manifests to build child list; `get-manifest` provides the same data. **PARTIAL OVERLAP** — filter-sessions aggregates across ALL root sessions; get-manifest is for ONE root session. |

### 3.2 delegation-status vs session-delegation-query

| Dimension | delegation-status | session-delegation-query |
|-----------|------------------|--------------------------|
| **list delegations** | ✓ via `list` action — merges manager memory + persisted + session-tracker | ✓ via `list` action — reads hierarchy-manifest only |
| **get single delegation** | ✓ via delegationId — merges 3 sources | ✓ via sessionId — reads child .json via resolveSessionFile |
| **find-stackable** | ✓ via session-intelligence | — |
| **Need delegationId** | ✓ via `delegationId` param | ✗ via `sessionId` (child session ID) |
| **Status filtering** | ✓ | ✓ |
| **Overlap:** | **SIGNIFICANT.** Both list delegations. `delegation-status` has richer merge logic (3 sources + find-stackable). `session-delegation-query` has better filtering (agentType, delegatedBy, depth range). `delegation-status` requires delegationId; `session-delegation-query` accepts sessionId — different primary keys for the same child sessions. |

### 3.3 hivemind-session-view vs session-tracker + session-delegation-query + hivemind-trajectory

| Dimension | hivemind-session-view | session-tracker | session-delegation-query | hivemind-trajectory |
|-----------|----------------------|----------------|--------------------------|---------------------|
| **Session data** | ✓ (from continuity) | ✓ (get-status/get-summary) | — | — |
| **Delegation list** | ✓ (from manifest + legacy) | — (filter-sessions shows children) | ✓ (list action) | — |
| **Trajectory** | ✓ (from ledger file) | — | — | ✓ (inspect action) |
| **Single call** | ✓ All 3 roots | — | — | — |
| **Overlap:** | **UNIFIED VIEWER** — wraps session-tracker data + delegation-query data + trajectory into one envelope. Does not replace them; makes them accessible in one call. |

### 3.4 delegation-status (pool action) vs DelegationManager.getPoolSnapshot

| Dimension | delegation-status (pool) | DelegationManager.getPoolSnapshot |
|-----------|-------------------------|-----------------------------------|
| **Returns Frozen DelegationPool** | ✓ | ✓ |
| **Who calls it** | Agent tool | Coordinator / tmux-copilot / SSE |
| **Overlap:** | **IDENTICAL** — the `pool` action calls `delegationManager.getPoolSnapshot()`. This is a direct passthrough. |

### 3.5 session-context vs session-tracker

| Dimension | session-context | session-tracker |
|-----------|----------------|-----------------|
| **find-related** | ✓ By tool overlap + time proximity | — |
| **cross-reference** | ✓ By tool name/term across sessions | — (search-sessions is content-based) |
| **aggregate (status)** | ✓ Counts per status | — (filter-sessions shows individual, not aggregate) |
| **aggregate (agentType)** | ✓ Counts per subagentType | — |
| **synthesize-context** | ✓ Compact markdown summary | — (get-summary is frontmatter only) |
| **Overlap:** | **COMPLEMENTARY.** session-tracker is raw data queries. session-context is derived intelligence. No direct overlap but `synthesize-context` and `get-summary` both read continuity data. |

### 3.6 tmux-copilot.peek vs delegation-status.peek

| Dimension | tmux-copilot.peek | delegation-status.peek |
|-----------|-------------------|------------------------|
| **Pane content** | ✓ via adapter.getLatestCapture | ✓ via deps.getPaneContent |
| **Permission gate** | Orchestrator + USER_SESSION | (no tier gate shown) |
| **Overlap:** | **VERY HIGH.** Both return pane content. `delegation-status.peek` accepts delegationId (with paneId fallback); `tmux-copilot.peek` requires `paneId`. `delegation-status.peek` can also resolve from delegation records. |

### 3.7 session-journal-export vs hivemind-trajectory

| Dimension | session-journal-export | hivemind-trajectory |
|-----------|----------------------|---------------------|
| **Lineage** | ✓ `buildExecutionLineage` from continuity + delegations | ✓ trajectory ledger with events/checkpoints |
| **Format** | JSON or Markdown export | Read/update actions on ledger |
| **Overlap:** | **PARTIAL.** Both deal with session history. session-journal-export is DERIVED (projected from continuity + delegations). hivemind-trajectory is an explicit ledger (written by events). |

---

## 4. Consolidation Candidates

### CANDIDATE 1: Merge `session-delegation-query` into `delegation-status`

**Evidence:**
- Both list delegations (overlap matrix 3.2)
- `delegation-status` has richer merge logic (3 sources) + find-stackable
- `session-delegation-query` has better filters (agentType, delegatedBy, depth range)
- `session-delegation-query` uses `sessionId` as primary key; `delegation-status` uses `delegationId`
- They are complementary: `session-delegation-query` reads session-tracker only; `delegation-status` merges manager + persisted + tracker

**Recommendation:** Add `session-delegation-query`'s filter capabilities (agentType, delegatedBy, offset/limit) and `sessionId` resolution to `delegation-status`'s `list` action. Retire `session-delegation-query` as standalone tool — it is a read-side subset.

### CANDIDATE 2: Merge `session-hierarchy.get-manifest` into `session-tracker.filter-sessions`

**Evidence:**
- Both read hierarchy-manifest.json (overlap matrix 3.1)
- `filter-sessions` iterates all manifests; `get-manifest` reads one
- `get-manifest` returns richer per-child data (subagentType, turnCount, createdAt)
- `filter-sessions` returns only status, agentType, depth, lastUpdated

**Recommendation:** Add `get-manifest`-level detail to `filter-sessions` response. Keep `session-hierarchy` for `get-children`, `get-parent-chain`, `get-delegation-depth` (these read continuity JSON, not manifest).

### CANDIDATE 3: Normalize `tmux-copilot.peek` and `delegation-status.peek`

**Evidence:**
- Both return pane capture content (overlap matrix 3.6)
- `tmux-copilot.peek` requires `paneId`; `delegation-status.peek` accepts `delegationId` → `paneId` (but resolution not wired, returns error)
- Different permission models (tmux-copilot has user-tier; delegation-status has manager access control)

**Recommendation:** Delegate peek content retrieval to a shared adapter. Make `delegation-status.peek` delegate to the tmux adapter's `getLatestCapture` directly. Consider removing standalone `delegation-status.peek` — the delegation→paneId resolution is not wired and likely won't be.

### CANDIDATE 4: Align status enums across all tools

**Evidence from Section 2:**
- 3 different status enums for essentially the same concept (DelegationStatus, DelegationLifecycleStatus, SessionState)
- Lossy collapses: `error|timeout → failed`, `cancelled → aborted`
- `"active"` in session-tracker means "running" in DelegationStatus
- `"pending"` used as default in continuity but not in DelegationStatus
- Pool `"queued"` has no source mapping

**Recommendation:** 
1. Replace `DelegationLifecycleStatus` with canonical `DelegationStatus` + add `"paused"` if needed
2. Fix `terminalKind: "cancelled"` in `abortDelegation` — should be `"aborted"`
3. Normalize session-tracker child status: `"active"` → `"running"`
4. Remove `"pending"` default in continuity; use `"dispatched"`

### CANDIDATE 5: Deprecate `session-context` find-related and cross-reference

**Evidence:**
- `find-related` only uses tool overlap and time proximity — heuristic-based, low utility
- `cross-reference` is a simple text search across toolSummary keys — covered by `session-tracker.search-sessions` for content search
- `synthesize-context` and `aggregate` are genuinely useful

**Recommendation:** Remove `find-related` and `cross-reference` from `session-context`. Keep `synthesize-context` and `aggregate`. Add aggregation (`groupBy`) capability to `session-tracker.filter-sessions`.

### CANDIDATE 6: hivemind-session-view is a proxy — keep, not merge

**Evidence from 3.3:**
- Unifies 3 data roots in one call
- Does not replace individual tools
- Returns limited detail per root

**Recommendation:** Keep as-is. It is a convenience proxy (fascade pattern), not a replacement.

---

## 5. Notable Findings

### 5.1 Dead Code / Unreachable Paths

| File | Line(s) | Issue |
|------|---------|-------|
| `tmux-state-query.ts:157` | `list-sessions` returns `{sessions: []}` | Adapter does not expose sessions — always empty |
| `tmux-state-query.ts:165` | `get-session` returns `{session: null}` | Adapter does not expose session detail |
| `tmux-state-query.ts:173` | `get-summary` returns `{total: 0, active: 0, spawning: 0}` | Adapter does not provide counts |
| `delegation-status.ts:833` | `peek` with delegationId → paneId resolution error | "not yet wired" — action is half-implemented |

### 5.2 Permission Gate Duplication

- `tmux-copilot.ts:59-64` and `tmux-state-query.ts:26-31` both define `ORCHESTRATOR_AGENTS` as separate arrays
- `tmux-copilot` has 4 agent entries; `tmux-state-query` has 4 (slightly different: `hf-l0-orchestrator` vs `hf-coordinator`)
- These will drift — they should share a single source of truth

### 5.3 Data Source Duplication

Both `delegation-persistence.ts` and `delegation-status.ts` independently read hierarchy manifests and child JSON files. The two implementations have slightly different field mappings:
- `delegation-persistence.ts:139-161` (readPersistedDelegations) maps `child.status AS DelegationStatus`
- `delegation-status.ts:224-232` (getSessionTrackerChildren) maps `childMeta.status AS DelegationStatus`

This creates a maintenance risk if the child record format changes.

---

## 6. File:Line Reference Summary

| Tool | File | Key Lines |
|------|------|-----------|
| delegate-task | `src/tools/delegation/delegate-task.ts` | 10-15 (Zod schema), 79 (coordinator.dispatch) |
| delegation-status | `src/tools/delegation/delegation-status.ts` | 34-44 (input schema), 134 (VALID_DELEGATION_STATUSES), 456-641 (main handler) |
| DelegationManager | `src/coordination/delegation/manager.ts` | 82 (class def), 165 (dispatch), 246 (getPoolSnapshot) |
| DelegationCoordinator | `src/coordination/delegation/coordinator.ts` | 185 (class def), 192 (dispatch), 453 (abortDelegation) |
| SDK child starter | `src/coordination/delegation/sdk-child-session-starter.ts` | 19 (factory), 23-58 (start) |
| DelegationStatus type | `src/coordination/delegation/types.ts` | 1-8 (canonical status), 14-23 (terminal kind) |
| DelegationLifecycleStatus | `src/coordination/delegation/pool-types.ts` | 36-43 (pool status) |
| session-tracker | `src/tools/session/session-tracker.ts` | 25-61 (entry point), 166-203 (get-status), 236-275 (list) |
| session-hierarchy | `src/tools/session/session-hierarchy.ts` | 33-57 (entry point), 146-206 (actions) |
| session-context | `src/tools/session/session-context.ts` | 40-67 (entry point), 144-301 (actions) |
| session-delegation-query | `src/tools/session/session-delegation-query.ts` | 35-73 (entry), 99-161 (list), 167-234 (get) |
| hivemind-session-view | `src/tools/hivemind/hivemind-session-view.ts` | 26-52 (entry), 119-155 (buildUnifiedView) |
| session-journal-export | `src/tools/session/session-journal-export.ts` | 65-115 (entry) |
| hivemind-trajectory | `src/tools/hivemind/hivemind-trajectory.ts` | 29-61 (entry), 70-127 (action dispatch) |
| hivemind-pressure | `src/tools/hivemind/hivemind-pressure.ts` | 30-59 (entry), 68-92 (action dispatch) |
| hivemind-command-engine | `src/tools/hivemind/hivemind-command-engine.ts` | 25-53 (entry) |
| hivemind-agent-work | `src/tools/hivemind/hivemind-agent-work.ts` | 28-145 (create + export) |
| hivemind-sdk-supervisor | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | 18-40 (entry) |
| hivemind-doc | `src/tools/hivemind/hivemind-doc.ts` | 21-43 (entry) |
| tmux-copilot | `src/tools/tmux-copilot.ts` | 59-64 (permission agents), 131-190 (schemas), 248-456 (handler) |
| tmux-state-query | `src/tools/tmux-state-query.ts` | 26-35 (permission agents), 108-176 (handler) |
| tmux persistence | `src/features/tmux/persistence.ts` | 32 (SessionState), 39-49 (PersistedSession), 254-406 (factory) |
| session continuity | `src/task-management/continuity/index.ts` | 38-51 (path resolution), 318-467 (public API) |
| delegation-persistence | `src/task-management/continuity/delegation-persistence.ts` | 11-17 (paths), 61-110 (persist), 112-236 (read) |

---

*End of tools surface investigation document. Generated 2026-06-05 by hm-codebase-mapper for UAT phase 58.9.*
