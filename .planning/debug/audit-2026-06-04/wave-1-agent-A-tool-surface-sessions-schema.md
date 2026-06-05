# Wave 1 — Agent A — Tool Surface, Session Ecosystem, Status Schema Audit

**Audit date:** 2026-06-05
**Auditor scope:** Tracks T1 (Tool surface), T2 (Session-tracker ecosystem), T5 (Status field unification)
**Author role:** L5 documentation-only audit, no source changes
**Repo root:** `/Users/apple/hivemind-plugin-private/`
**Plugin entry:** `src/plugin.ts` (970 LOC)

---

## 1. Executive Summary

### 1.1 Totals

| Track | Scope | Files touched | Issues found |
|-------|-------|---------------|--------------|
| T1 | 27 custom tools | 23 tool files + `src/plugin.ts` (registration) + 9 schema files | 11 |
| T2 | 5 session surfaces | `src/features/session-tracker/`, `src/task-management/continuity/`, `src/task-management/trajectory/`, `src/features/agent-work-contracts/` | 7 |
| T5 | `status` field across 30+ files | All session/delegation/lifecycle types | 14 |
| **Total** | — | ~50 files | **32 distinct issues** |

### 1.2 Top 5 Critical Findings

1. **`status` field has 12+ divergent enum values across 5 type definitions** (Track T5) — `delegation/delegation/types.ts:1-8` (7 values), `session-tracker/types.ts:51-58` (7 values, different set), `shared/types.ts:3` `TaskStatus` (8 values), `shared/types.ts:144-153` `HarnessStatus` (9 values), `shared/types.ts:9` `TaskNotification.status` (4 values), `coordination/delegation/types.ts:14-22` `DelegationTerminalKind` (8 values), `task-management/trajectory/types.ts:17` `TrajectoryStatus` (5 values), `schema-kernel/agent-work-contract.schema.ts:19` `AgentWorkStatus` (5 values), `shared/types.ts:50` `SessionStatusType` (3 values, OpenCode SDK shape). Plus FIVE `string`-typed `status` fields in `session-tracker/types.ts` (lines 135, 193, 292, 347, 397) that allow any value through.

2. **Plugin startup log says "registering 26 custom tools"** at `src/plugin.ts:471` — but the actual registration is **27** (3 delegation + 7 session + 9 hivemind + 6 config + 2 inline tmux tools). Off-by-one documentation drift in the harness's own self-diagnostic.

3. **Dual-source status mutations: 4 separate files mutate `delegation.status` directly** (`src/coordination/delegation/manager.ts:251-256, 295, 337, 566`; `src/coordination/delegation/lifecycle.ts:63`; `src/coordination/delegation/notification-router.ts:177,192`; `src/coordination/delegation/coordinator.ts:310, 514, 626, 638-639`) — bypassing the state machine guard at `src/coordination/delegation/state-machine.ts:269, 413, 441`.

4. **Session-tracker persistence ignores `persistStore()`** — `src/task-management/continuity/index.ts:313-316` has empty body, comment "REQ-P41D-02: No disk write. In-memory store is kept for current-process reads." — meaning all `recordSessionContinuity` / `patchSessionContinuity` writes are LOST on process restart. Session continuity depends entirely on the session-tracker's fire-and-forget dual-write (`src/task-management/continuity/index.ts:343-368, 414-449`).

5. **Status field at session-tracker boundary is `string` typed in 5 places** (`src/features/session-tracker/types.ts:135, 193, 292, 347, 397`) — the comment in the code at line 134 documents "active | idle | completed | error" but the runtime has no Zod validation enforcing this. Persisted JSON could carry ANY string and would pass the type checker.

### 1.3 Confidence

- **T1 (tool inventory):** HIGH — 100% of tool registrations traced through `src/plugin.ts`
- **T2 (session-tracker surfaces):** HIGH — all 5 surfaces mapped with file:line LOC
- **T5 (status field):** MEDIUM — 12+ enum variants traced, but OpenCode SDK schema only inspected at the wrapper boundary (`src/shared/session-api.ts:165-173`) — full SDK `.d.ts` content not deep-read

---

## 2. Track T1 — Custom Tool Surface Map (27 tools)

### 2.1 Tool registration overview

`src/plugin.ts` registers custom tools in 4 factory functions + 2 inline spreads. Startup log at `src/plugin.ts:471` claims "**registering 26 custom tools**" but actual count is **27** (off-by-one documentation drift).

| Group | Factory | Tool name in object | plugin.ts line | LOC of tool file |
|-------|---------|--------------------|-----------------|------------------|
| Delegation | `registerDelegationTools` | `delegate-task` | 137 | 110 |
| Delegation | `registerDelegationTools` | `delegation-status` | 138 | 891 |
| Delegation | `registerDelegationTools` | `run-background-command` | 144 | 228 |
| Session | `registerSessionTools` | `execute-slash-command` | 157 | 863 |
| Session | `registerSessionTools` | `session-patch` | 158 | (subfolder) |
| Session | `registerSessionTools` | `session-journal-export` | 159 | 117 |
| Session | `registerSessionTools` | `session-tracker` | 160 | 423 |
| Session | `registerSessionTools` | `session-hierarchy` | 161 | 283 |
| Session | `registerSessionTools` | `session-context` | 162 | 301 |
| Session | `registerSessionTools` | `create-governance-session` | 163 | (governance-engine) |
| Hivemind | `registerHivemindTools` | `hivemind-doc` | 177 | 45 |
| Hivemind | `registerHivemindTools` | `hivemind-trajectory` | 178 | 129 |
| Hivemind | `registerHivemindTools` | `hivemind-pressure` | 179 | 94 |
| Hivemind | `registerHivemindTools` | `hivemind-sdk-supervisor` | 180 | 53 |
| Hivemind | `registerHivemindTools` | `hivemind-command-engine` | 181 | 67 |
| Hivemind | `registerHivemindTools` | `hivemind-session-view` | 182 | 155 |
| Hivemind | `registerHivemindTools` | `hivemind-agent-work-create` | 183 | 147 |
| Hivemind | `registerHivemindTools` | `hivemind-agent-work-export` | 184 | 147 |
| Hivemind | `registerHivemindTools` | `session-delegation-query` | 185 | 284 |
| Config | `registerConfigTools` | `configure-primitive` | 198 | 490 |
| Config | `registerConfigTools` | `validate-restart` | 199 | 116 |
| Config | `registerConfigTools` | `bootstrap-init` | 200 | 338 |
| Config | `registerConfigTools` | `bootstrap-recover` | 201 | 239 |
| Config | `registerConfigTools` | `prompt-skim` | 202 | 107 |
| Config | `registerConfigTools` | `prompt-analyze` | 203 | 169 |
| TMUX (inline) | direct spread | `tmux-copilot` | 886 | 487 |
| TMUX (inline) | direct spread | `tmux-state-query` | 890 | 177 |

### 2.2 Tool schema/action/integration map (27 rows)

| # | Tool name | Schema file (Zod) | Actions | Engine/lib owner | Output envelope | Read/Write authority |
|---|-----------|-------------------|---------|------------------|------------------|---------------------|
| 1 | `delegate-task` | inline `DelegateTaskV2Schema` (`delegate-task.ts:10-15`) | (1 action: dispatch) | `coordination/delegation/coordinator.ts` | `renderToolResult(success|error)` | **WRITE** (creates delegation record) |
| 2 | `delegation-status` | `DelegationStatusInputSchema` (`delegation-status.ts:34-44`) | 8 actions: `status`, `get`, `list`, `control`, `find-stackable`, `pool`, `peek`, `progress` (line 37) | `coordination/delegation/manager.ts` | `renderToolResult` + redacted secrets | **WRITE** (control actions: abort/cancel/restart/resume/chain) |
| 3 | `run-background-command` | inline `z.literal` actions (`run-background-command.ts:12-36`) | 5 actions: `run`, `output`, `input`, `list`, `terminate` | `features/background-command/pty/pty-runtime.ts` | `renderToolResult` | **WRITE** (spawns PTY session) |
| 4 | `execute-slash-command` | inline (`execute-slash-command.ts`) | 1 action: dispatch | `coordination/delegation/coordinator.ts` + `features/session-tracker/` | `renderToolResult` | **WRITE** (creates child session) |
| 5 | `session-patch` | `SessionPatchInputSchema` (subfolder) | 1 action: patch | `features/session-tracker/persistence/` | `renderToolResult` | **WRITE** (modifies session file) |
| 6 | `session-journal-export` | inline (`session-journal-export.ts:14-16`) | 1 action: export | `task-management/journal/` | `renderToolResult` | **READ** |
| 7 | `session-tracker` | `SessionTrackerInputSchema` (`session-tracker.schema.ts:38-73`) | 6 actions: `export-session`, `get-status`, `get-summary`, `list-sessions`, `search-sessions`, `filter-sessions` | `features/session-tracker/persistence/atomic-write.ts` | `renderToolResult` | **READ** (CQRS read-side) |
| 8 | `session-hierarchy` | `SessionHierarchyInputSchema` (`session-tracker.schema.ts:87-105`) | 4 actions: `get-children`, `get-parent-chain`, `get-delegation-depth`, `get-manifest` | `features/session-tracker/persistence/hierarchy-manifest.js` | `renderToolResult` | **READ** |
| 9 | `session-context` | `SessionContextInputSchema` (`session-tracker.schema.ts:119-138`) | 4 actions: `find-related`, `cross-reference`, `synthesize-context`, `aggregate` | `features/session-tracker/persistence/` | `renderToolResult` | **READ** |
| 10 | `create-governance-session` | (governance-engine internal) | 1 action: create | `features/governance-engine/create-governance-session.ts` | `renderToolResult` | **WRITE** (creates child session with `hm-governance:` prefix) |
| 11 | `hivemind-doc` | inline | 1 action: skim/read | `features/doc-intelligence/` | `renderToolResult` | **READ** |
| 12 | `hivemind-trajectory` | `TrajectoryActionSchema` (`trajectory.schema.ts:6`) | 7 actions: `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`, `create` | `task-management/trajectory/` | `renderToolResult` | **WRITE** (trajectory mutations) |
| 13 | `hivemind-pressure` | `RuntimePressureActionSchema` (`runtime-pressure.schema.ts:6`) | 4 actions: `classify`, `detect`, `inspect_tool_catalog`, `attach_event` | `features/runtime-pressure/` | `renderToolResult` | **MIXED** (read + trajectory attach) |
| 14 | `hivemind-sdk-supervisor` | `SdkSupervisorActionSchema` (`sdk-supervisor.schema.ts:4`) | 4 actions: `health`, `heartbeat`, `diagnostics`, `readiness` | `features/sdk-supervisor/` | `renderToolResult` | **READ** |
| 15 | `hivemind-command-engine` | inline | 1 action: discover/route | `routing/command-engine/` | `renderToolResult` | **READ** (route preview) |
| 16 | `hivemind-session-view` | `SessionViewInputSchema` (`session-view.schema.ts:16`) | 1 action: `get` | unifies session-tracker + delegations + trajectory | `renderToolResult` | **READ** |
| 17 | `hivemind-agent-work-create` | `AgentWorkCreateToolInputSchema` (`agent-work-contract.schema.ts`) | 1 action: create | `features/agent-work-contracts/operations.ts` | `renderToolResult` | **WRITE** (creates contract) |
| 18 | `hivemind-agent-work-export` | `ExportAgentWorkContractInput` | 1 action: export | `features/agent-work-contracts/operations.ts` | `renderToolResult` | **READ** |
| 19 | `session-delegation-query` | `SessionDelegationQueryInputSchema` (`session-delegation-query.schema.ts`) | 2 actions: `list`, `get` | `features/session-tracker/persistence/` | `renderToolResult` | **READ** |
| 20 | `configure-primitive` | inline (`configure-primitive.ts:35-48`) | 6 actions: `compile`, `decompile`, `read`, `list`, `inspect`, `resume` | `tools/config/configure-primitive.ts` | `renderToolResult` | **WRITE** (compiles to `.opencode/`) |
| 21 | `validate-restart` | inline | 1 action: validate | `tools/config/validate-restart.ts` | `renderToolResult` | **READ** (validation only) |
| 22 | `bootstrap-init` | `BootstrapInitInputSchema` | 1 action: init | `tools/config/bootstrap-init.ts` | `renderToolResult` | **WRITE** (creates `.hivemind/` surfaces) |
| 23 | `bootstrap-recover` | inline | 1 action: recover | `tools/config/bootstrap-recover.ts` | `renderToolResult` | **WRITE** (repairs symlinks) |
| 24 | `prompt-skim` | `PromptSkimInputSchema` | 1 action: skim | `tools/prompt/prompt-skim/tools.ts` | `renderToolResult` | **READ** |
| 25 | `prompt-analyze` | `PromptAnalyzeInputSchema` | 1 action: analyze | `tools/prompt/prompt-analyze/tools.ts` | `renderToolResult` | **READ** |
| 26 | `tmux-copilot` | inline (`tmux-copilot.ts:132-176`) | 8 actions: `send-keys`, `list-panes`, `compute-grid`, `respawn`, `forward-prompt`, `take-over`, `release`, `peek` | `features/tmux/integration.ts` | `renderToolResult` | **WRITE** (sends keys, take-over/release) |
| 27 | `tmux-state-query` | inline (`tmux-state-query.ts:60-69`) | 3 actions: `list-sessions`, `get-session`, `get-summary` | `features/tmux/session-manager.ts` | `renderToolResult` | **READ** |

### 2.3 T1 Issues found

| ID | Severity | File:line | Issue | Impact |
|----|----------|-----------|-------|--------|
| T1-1 | MEDIUM | `src/plugin.ts:471` | Comment claims "registering 26 custom tools" but actual count is 27 | Self-diagnostic drift; misleading to users reading logs |
| T1-2 | MEDIUM | `src/plugin.ts:863-891` | All 27 tools spread in a single `tool: { ... }` block | Hard to selectively disable; no per-tool permission boundary declaration |
| T1-3 | LOW | `src/tools/delegation/delegation-status.ts:24-44` | `DelegationStatusInputSchema.status: z.string().optional()` (line 36) | No enum validation on status filter — accepts arbitrary strings |
| T1-4 | LOW | `src/tools/session/session-tracker.ts:35` | `status: tool.schema.string().optional()` | Same as T1-3 — free-form string filter |
| T1-5 | LOW | `src/tools/session/session-delegation-query.ts:44` | `status: tool.schema.string().optional()` | Same as T1-3 — free-form string filter |
| T1-6 | LOW | `src/tools/session/session-context.ts:49` | `groupBy: tool.schema.enum(["subagentType", "status"])` | `groupBy: "status"` is a string-keyed aggregator (line 49) but `status` is free-form — aggregator may produce inconsistent buckets |
| T1-7 | MEDIUM | `src/tools/delegation/delegation-status.ts:25, 37` | Two separate `action` enums (control vs read) inside the same tool | Tool surface mixes READ and WRITE actions under one name; permission boundary unclear |
| T1-8 | MEDIUM | `src/tools/delegation/delegation-status.ts:447, 562` | Mutates `delegation.status = "cancelled"` directly bypassing `DelegationStateMachine` | Bypasses state-machine guards at `state-machine.ts:269, 413, 441` |
| T1-9 | MEDIUM | `src/tools/hivemind/hivemind-session-view.ts:149` | Hardcodes `d.status === "running" \|\| d.status === "dispatched"` for "active" count | When `d.status === "queued"` (from `DelegationLifecycleStatus`) exists, it's NOT counted as active |
| T1-10 | LOW | `src/tools/hivemind/hivemind-session-view.ts:96-101` | Fallback path reads `delegations.json` (legacy file) | REQ-P41D-01 says no delegations.json I/O; this is a violation |
| T1-11 | LOW | `src/tools/delegation/delegation-status.ts:19-21` | Per-invocation cache for hierarchy-manifest.json with 5s TTL | Stale reads during rapid tool invocations (5-second window) |

---

## 3. Track T2 — Session-Tracker Ecosystem Map (5 surfaces)

### 3.1 Surface inventory

| # | Surface | Directory | Entry file | Total LOC | Authority | Persists to |
|---|---------|-----------|------------|-----------|-----------|-------------|
| 1 | **session-tracker** | `src/features/session-tracker/` | `index.ts` | ~900 (11 files) | OWNER: hook events → SessionTracker → persistence | `.hivemind/session-tracker/{sessionID}/` |
| 2 | **session-continuity** | `src/task-management/continuity/` | `index.ts` | 468 (4 files) | In-memory store; fire-and-forget dual-write to session-tracker | `.hivemind/state/session-continuity.json` *(no-op persistStore)* |
| 3 | **project-continuity** | `src/features/session-tracker/project-continuity.ts` | (single file) | 95 | PROJECT-level index: all root main sessions across project | `.hivemind/session-tracker/project-continuity.json` |
| 4 | **trajectory** | `src/task-management/trajectory/` | `store-operations.ts` | 226 (types) + 15k (store) | PHASE-level ledger (5 states: planning→executing→verifying→completed→closed) | `.hivemind/state/trajectory-ledger.json` |
| 5 | **agent-work-contracts** | `src/features/agent-work-contracts/` | `store.ts` | 215 (types) + 5.8k (store) | Durable contract store (5 states: created/running/blocked/completed/cancelled) | `.hivemind/state/agent-work-contracts.json` |

> **Note:** The task prompt referenced `src/task-management/continuity/project-continuity.ts`, but the actual file is at `src/features/session-tracker/project-continuity.ts` (verified by `ls` and `rg`). This is a project inconsistency to flag (the `project-continuity.ts` lives under session-tracker, not under continuity).

### 3.2 Surface 1 — session-tracker (`src/features/session-tracker/`)

**Files (12, all `.ts`):**
- `bootstrap.ts` (5834 bytes)
- `capture/` (directory — 5 sub-files)
- `child-recorder.ts` (5596 bytes)
- `classification.ts` (5002 bytes)
- `hooks/` (directory)
- `index.ts` (24549 bytes — SessionTracker class)
- `initialization.ts` (10116 bytes)
- `orphan-cleanup.ts` (12391 bytes)
- `persistence/` (directory — 13 sub-files including `atomic-write.ts`, `child-writer.ts`, `hierarchy-manifest.ts`, `retry-queue.ts`)
- `project-continuity.ts` (4083 bytes)
- `recovery/` (directory)
- `session-router.ts` (3479 bytes)
- `streaming/` (directory)
- `tool-delegation-utils.ts` (4613 bytes)
- `tool-delegation.ts` (21966 bytes)
- `transform/` (directory)
- `types.ts` (17511 bytes — core type definitions)

**API surface (read-side tools query these):**

| Function | File:line | Authority | Caller(s) |
|----------|-----------|-----------|-----------|
| `SessionTracker.handleSessionEvent` | `index.ts:184` | WRITE | `hooks/observers/session-tracker-consumer.ts` (via `consumeSessionTrackerFact` at `plugin.ts:750-762`) |
| `SessionTracker.handleToolExecuteAfter` | `index.ts` (referenced `plugin.ts:909`) | WRITE | `plugin.ts:909-912` |
| `SessionTracker.handleToolExecuteBefore` | `index.ts` | WRITE | `plugin.ts:821-843` (via `createToolBeforeGuard`) |
| `SessionTracker.handleChatMessage` | `index.ts` | WRITE | `plugin.ts:849-861` (via `createChatMessageCapture`) |
| `SessionTracker.initialize` | `index.ts` | WRITE | `plugin.ts:651` |
| `SessionTracker.constructCoreDependencies` | `index.ts` | WRITE | `plugin.ts:593` |
| `getManualOverrideState` | `index.ts:56-59` | READ | `plugin.ts:954` (replayPendingDelegationNotifications) |
| `setManualOverrideState` | `index.ts:65-67` | WRITE | `tmux-copilot.ts` (take-over/release) |
| `SessionTracker.getLastMessageCapture` | `index.ts:148-150` | READ | `plugin.ts:811` |

**Consumers (tools that READ session-tracker state):**
- `src/tools/session/session-tracker.ts` (entire file)
- `src/tools/session/session-hierarchy.ts` (entire file)
- `src/tools/session/session-context.ts` (entire file)
- `src/tools/session/session-delegation-query.ts` (entire file)
- `src/tools/hivemind/hivemind-session-view.ts:55-66`
- `src/tools/delegation/delegation-status.ts:7, 12-13, 79-114` (manifest cache + child file reader)
- `src/task-management/continuity/delegation-persistence.ts:103-227` (`readPersistedDelegations`)

### 3.3 Surface 2 — session-continuity (`src/task-management/continuity/`)

**Files (4):**
- `index.ts` (468 lines, 17790 bytes) — API surface
- `delegation-persistence.ts` (227 lines, 9761 bytes)
- `continuity-reader.ts` (4203 bytes) — `enrichContinuityListWithTracker`
- `store-cache.ts` (1636 bytes) — in-memory cache

**API surface:**

| Function | File:line | Authority | Notes |
|----------|-----------|-----------|-------|
| `getSessionContinuity` | `index.ts:326-329` | READ | Returns deep-cloned record |
| `listSessionContinuity` | `index.ts:322-324` | READ | All records |
| `recordSessionContinuity` | `index.ts:331-371` | WRITE | In-memory; fire-and-forget session-tracker dual-write |
| `patchSessionContinuity` | `index.ts:373-452` | WRITE | In-memory; fire-and-forget session-tracker dual-write |
| `deleteSessionContinuity` | `index.ts:454-462` | WRITE | In-memory only |
| `getContinuityStoragePath` | `index.ts:464-466` | READ | Returns `.hivemind/state/session-continuity.json` |
| `getCanonicalStateDir` | `index.ts:22-25` | READ | `.hivemind/state` |
| `getLegacyStateDir` | `index.ts:27-31` | READ | `.opencode/state/hivemind` |
| `persistDelegations` | `delegation-persistence.ts:56-101` | WRITE | Dual-write to session-tracker child files |
| `readPersistedDelegations` | `delegation-persistence.ts:103-227` | READ | Reads session-tracker manifest + child files |
| `getDelegationsFilePath` | `delegation-persistence.ts:15-17` | READ | `.hivemind/state/delegations.json` |

**Consumers of continuity API:**
- `src/plugin.ts:90-91` (imports)
- `src/plugin.ts:255-284` (`persistPendingDelegationNotifications` — writes via `patchSessionContinuity` + `recordSessionContinuity`)
- `src/plugin.ts:939-968` (`replayPendingDelegationNotifications` — reads via `listSessionContinuity`)
- `src/task-management/lifecycle/index.ts:108-131, 170-191` (reads + patches)
- `src/coordination/completion/notification-handler.ts:50-67, 159` (uses `task.status` from pending notifications)

**Schema (`SessionContinuityRecord` in `src/shared/types.ts:323-328`):**
- `metadata.status: TaskStatus` (8 values: `pending | queued | running | completed | failed | error | cancelled | interrupt`)
- `metadata.lifecycle?: SessionLifecycleState` (6 phases: `created | queued | dispatching | running | completed | failed`)

### 3.4 Surface 3 — project-continuity (`src/features/session-tracker/project-continuity.ts`)

**Single file (95 LOC, 4083 bytes).**

**Class:** `ProjectContinuityChecker`
- Constructs the `project-continuity.json` index
- Adds/removes root main sessions
- Syncs with directory listing

**Output schema (`ProjectSessionEntry` at `src/features/session-tracker/types.ts:385-402`):**
- `status: string` — **FREE-FORM STRING** (no Zod validation)
- `dir: string`, `mainFile: string`, `continuityIndex: string`
- `created: string`, `updated: string`
- `childCount: number`, `totalDelegationDepth: number`

**Consumers:**
- `src/features/session-tracker/initialization.ts` (constructs)
- `src/tools/session/session-context.ts:71-76` (reads `project-continuity.json` directly)

### 3.5 Surface 4 — trajectory (`src/task-management/trajectory/`)

**Files (3 + 1 types):**
- `types.ts` (226 lines) — `TrajectoryStatus` = `planning | executing | verifying | completed | closed` (5 values)
- `ledger.ts` (93 lines, 3569 bytes) — version marker + helpers
- `store-operations.ts` (15525 bytes) — CRUD
- `index.ts` (93 lines, 117 bytes) — barrel re-export

**API surface (consumed by `hivemind-trajectory` tool):**

| Action | Operation | Zod schema |
|--------|-----------|------------|
| `inspect` | get single trajectory | `trajectory.schema.ts` |
| `traverse` | get parent-child tree | same |
| `attach` | attach evidence ref | same |
| `checkpoint` | add checkpoint entry | same |
| `event` | add event entry | same |
| `close` | mark terminal | same |
| `create` | create phase trajectory | `PhaseTrajectoryCreateSchema` |

**State machine (in types):** `TRAJECTORY_TRANSITIONS` (`types.ts:28-34`):
```
planning → executing → verifying → completed → closed
                    ↓                ↓
                    closed ← (any non-closed)
```

**Consumers:**
- `src/tools/hivemind/hivemind-trajectory.ts` (entire file)
- `src/tools/hivemind/hivemind-pressure.ts` (pressure events may attach to trajectories)
- `src/tools/hivemind/hivemind-session-view.ts:104-116` (reads `trajectory-ledger.json` directly)
- `src/features/agent-work-contracts/operations.ts` (cross-link)

### 3.6 Surface 5 — agent-work-contracts (`src/features/agent-work-contracts/`)

**Files (6):**
- `index.ts` (117 bytes) — barrel
- `types.ts` (2153 bytes) — re-exports from schema-kernel
- `bounds.ts` (780 bytes) — size limits
- `lifecycle.ts` (5137 bytes) — `ALLOWED_TRANSITIONS`
- `operations.ts` (5601 bytes) — CRUD
- `store.ts` (5805 bytes) — persistence

**API surface:**

| Operation | File:line | Notes |
|-----------|-----------|-------|
| `createAgentWorkContract` | `operations.ts` (referenced `lifecycle.ts:118`) | `getActiveContractByAgent` filter at `store.ts:97` |
| `getActiveContractByAgent` | `store.ts:97` | Filters by `agentName === agent && status === "running"` |
| Export | `operations.ts` | `hivemind-agent-work-export` tool |

**State machine (in schema-kernel/agent-work-contract.schema.ts:19):**
`AgentWorkStatus = "created" | "running" | "blocked" | "completed" | "cancelled"` (5 values, Zod enum)

**Transition table (`lifecycle.ts:19`):**
```
created → [running, blocked, cancelled]
running → [blocked, completed, cancelled]
blocked → [running, completed, cancelled]
completed → [] (terminal)
cancelled → [] (terminal)
```

**Consumers:**
- `src/tools/hivemind/hivemind-agent-work.ts` (entire file)
- `src/plugin.ts:39` (imports `getActiveContractByAgent`)
- `src/plugin.ts:835-842` (used in `contractEnforcement` for tool guards)

### 3.7 Cross-surface connection diagram

```
              ┌─────────────────────────────────────┐
              │      OpenCode plugin runtime        │
              │      (src/plugin.ts:805-919)         │
              └─────────────────┬───────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│ Hooks        │    │ Custom tools (27)   │    │ Plugin state     │
│ (chat, tool, │    │ Read-side: 19       │    │ (taskState,      │
│ session,     │    │ Write-side: 8       │    │  state machines) │
│ event obs.)  │    │ (T1 matrix)         │    │                  │
└──────┬───────┘    └─────────┬───────────┘    └────────┬─────────┘
       │                      │                        │
       │                      │                        │
       ▼                      ▼                        ▼
┌──────────────────────────────────────────────────────────────────┐
│  Surface 1: session-tracker (features/session-tracker/)           │
│  - SessionTracker class (index.ts)                                │
│  - Persists: .hivemind/session-tracker/{sessionID}/               │
│  - Canonical source per CP-ST-03 D-03                             │
│  - 11 sub-modules including bootstrap, capture, persistence       │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ dual-write (fire-and-forget)
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Surface 2: session-continuity (task-management/continuity/)      │
│  - In-memory store (persistStore is no-op)                       │
│  - Persists: .hivemind/state/session-continuity.json (NO write)  │
│  - Schema: SessionContinuityRecord (TaskStatus enum, 8 values)   │
│  - Legacy fallback: .opencode/state/hivemind/                     │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ writes to recordSessionContinuity trigger dual-write
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Surface 3: project-continuity (features/session-tracker/)       │
│  - ProjectContinuityChecker class                                │
│  - Persists: .hivemind/session-tracker/project-continuity.json   │
│  - Schema: ProjectSessionEntry with FREE-FORM string status      │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ trajectory writes triggered by tool events
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Surface 4: trajectory (task-management/trajectory/)             │
│  - TrajectoryStatus (5 values: planning→closed)                  │
│  - Persists: .hivemind/state/trajectory-ledger.json              │
│  - Phase-level (not per-delegation)                               │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │ contract enforcement on every tool.execute.before
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Surface 5: agent-work-contracts (features/agent-work-contracts/)│
│  - AgentWorkStatus (5 values: created→cancelled)                 │
│  - Persists: .hivemind/state/agent-work-contracts.json           │
│  - getActiveContractByAgent gates tool calls (plugin.ts:835)     │
└──────────────────────────────────────────────────────────────────┘
```

### 3.8 T2 Issues found

| ID | Severity | File:line | Issue | Impact |
|----|----------|-----------|-------|--------|
| T2-1 | CRITICAL | `src/task-management/continuity/index.ts:313-316` | `persistStore()` is a NO-OP — "REQ-P41D-02: No disk write" | All `recordSessionContinuity` / `patchSessionContinuity` writes LOST on process restart. Session continuity depends entirely on session-tracker's fire-and-forget dual-write. |
| T2-2 | MEDIUM | (path mismatch) | `project-continuity.ts` lives at `src/features/session-tracker/project-continuity.ts` but the audit prompt expected `src/task-management/continuity/project-continuity.ts` | Path inconsistency between the prompt and reality — agent reference may be stale |
| T2-3 | MEDIUM | `src/features/session-tracker/types.ts:135, 193, 292, 347, 397` | `status: string` — free-form string in 5 record types | No Zod validation; persisted JSON can carry any status string |
| T2-4 | MEDIUM | `src/features/session-tracker/types.ts:134, 192, 291, 396` | Doc comments claim "active | idle | completed | error" but type is `string` | Doc/code drift; types don't enforce the documented enum |
| T2-5 | LOW | `src/features/agent-work-contracts/store.ts:97` | Filter by `status === "running"` (AgentWorkStatus enum) — but the contract's status field flows from `AgentWorkStatusSchema` (5 values) so this is correct — but **separate from the TaskStatus (8 values) used by continuity** | Status vocabulary mismatch between agent-work-contracts and continuity |
| T2-6 | LOW | `src/task-management/continuity/delegation-persistence.ts:103-227` | `readPersistedDelegations` reads session-tracker manifest + child files; this is the "canonical" path post-P41D-01 | Some tools still try `delegations.json` fallback (`hivemind-session-view.ts:96-101`) — split source of truth |
| T2-7 | LOW | `src/task-management/trajectory/types.ts:17` | `TrajectoryStatus` (5 values) is completely separate vocabulary from `TaskStatus` / `DelegationStatus` / `AgentWorkStatus` | No cross-surface status mapping functions exist (unlike `delegationStatusToHarnessStatus` at `src/shared/types.ts:179-190`) |

---

## 4. Track T5 — Status Field Unification (CRITICAL)

### 4.1 Inventory of `status` enum types

| # | Type name | Values | File:line | Authority |
|---|-----------|--------|-----------|-----------|
| 1 | **`DelegationStatus`** | `dispatched \| running \| completed \| error \| timeout \| aborted \| cancelled` (7) | `src/coordination/delegation/types.ts:1-8` | Coordination layer (the "primary" status) |
| 2 | **`DelegationLifecycleStatus`** | `queued \| dispatched \| running \| completed \| failed \| aborted \| paused` (7) | `src/features/session-tracker/types.ts:51-58` | Session-tracker (G6 redeclaration per SPEC) |
| 3 | **`TaskStatus`** | `pending \| queued \| running \| completed \| failed \| error \| cancelled \| interrupt` (8) | `src/shared/types.ts:3` | Continuity store |
| 4 | **`HarnessStatus`** | `pending \| queued \| dispatching \| running \| completed \| error \| cancelled \| interrupt \| failed` (9) | `src/shared/types.ts:144-153` | Cross-layer (with `delegationStatusToHarnessStatus` mapper at line 179) |
| 5 | **`TaskNotification.status`** | `started \| completed \| failed \| cancelled` (4) | `src/shared/types.ts:9` | TUI notification envelope |
| 6 | **`DelegationPacketStatus`** | `pending \| running \| completed \| failed` (4) | `src/shared/types.ts:155` | Coarse packet view |
| 7 | **`DelegationTerminalKind`** | `completed \| error \| timeout \| cancelled \| restarted \| runtime-dispatch-unsupported \| interrupted-by-signal \| non-resumable-after-restart` (8) | `src/coordination/delegation/types.ts:14-22` | Terminal sub-classification |
| 8 | **`TrajectoryStatus`** | `planning \| executing \| verifying \| completed \| closed` (5) | `src/task-management/trajectory/types.ts:17` | Phase trajectory |
| 9 | **`AgentWorkStatus`** | `created \| running \| blocked \| completed \| cancelled` (5) | `src/schema-kernel/agent-work-contract.schema.ts:19` | Agent work contracts (Zod enum) |
| 10 | **`SessionStatusType`** (OpenCode SDK) | `idle \| busy \| retry \| string` (3 + extension) | `src/shared/types.ts:50` | OpenCode SDK wrapper |
| 11 | **`SessionRecord.status`** (free-form) | `string` (no enum) | `src/features/session-tracker/types.ts:135` | Main session record |
| 12 | **`HierarchyManifestChild.status`** (free-form) | `string` | `src/features/session-tracker/types.ts:193` | Hierarchy child entry |
| 13 | **`ChildSessionRecord.status`** (free-form) | `string` | `src/features/session-tracker/types.ts:292` | Child session record |
| 14 | **`ChildHierarchyEntry.status`** (free-form) | `string` | `src/features/session-tracker/types.ts:347` | Continuity child entry |
| 15 | **`ProjectSessionEntry.status`** (free-form) | `string` | `src/features/session-tracker/types.ts:397` | Project-level entry |

### 4.2 OpenCode SDK native status schema

From `src/shared/session-api.ts:163-173`:
```typescript
/**
 * Get the status map for all sessions.
 * Returns a map of sessionID -> { type: "idle" | "busy" | "retry" }
 */
export async function getSessionStatusMap(client: OpenCodeClient): Promise<...> {
  const response = await client.session.status()
  // ...
  return (data as Record<string, unknown>) as Record<string, { type: string }>
}
```

- **OpenCode SDK** uses: `idle | busy | retry` (3 values, on `client.session.status()`)
- The `SessionStatusType` alias at `src/shared/types.ts:50` documents this but allows extension via `| string`
- The harness never directly translates SDK status into `DelegationStatus` — instead, completion is detected via message-stability (`STABLE_POLLS_REQUIRED = 3` at `src/coordination/delegation/types.ts:203`) and event signals (`session.idle`, `session.error`, `session.deleted` at `src/task-management/lifecycle/index.ts:138-160`)

### 4.3 Status value occurrences (file:line)

| File:line | Snippet (relevant) | Producer/Consumer |
|-----------|--------------------|--------------------|
| `src/plugin.ts:265` | `metadata: { ..., terminalState: ..., status: type === "success" ? "completed" : type === "timeout" \|\| type === "failure" ? "failed" : "started" }` | Producer (notification) |
| `src/plugin.ts:268` | `status: type === "success" ? "completed" : type === "timeout" \|\| type === "failure" ? "failed" : "started"` | Producer (notification envelope) |
| `src/plugin.ts:279` | `status: "running"` | Producer (new continuity record) |
| `src/task-management/lifecycle/index.ts:125` | `phase: currentLifecycle?.phase ?? "running"` | Producer (lifecycle patch) |
| `src/coordination/sdk-delegation/handler.ts:110, 159, 273, 282` | `status.type === "idle"`, `delegation.status !== "running"` | Consumer (OpenCode SDK + DelegationStatus) |
| `src/coordination/completion/detector.ts:250` | `status === "completed" \|\| status === "error" \|\| status === "timeout" \|\| status === "aborted" \|\| status === "cancelled"` | Consumer (terminal check on DelegationStatus) |
| `src/coordination/completion/notification-handler.ts:50-67, 159-160` | `task.status === "started" \| "completed" \| "failed"` | Consumer (TaskNotification.status) |
| `src/coordination/delegation/manager.ts:251-256, 295, 337, 566` | Multiple direct `delegation.status = "..."` mutations | Producer (bypassing state machine) |
| `src/coordination/delegation/manager.ts:331` | `isTerminal = delegation.status === "completed" \|\| ... "timeout"` | Consumer (terminal check) |
| `src/coordination/delegation/lifecycle.ts:63` | `status === "completed" \|\| "error" \|\| "timeout" \|\| "aborted" \|\| "cancelled"` | Consumer (terminal check) |
| `src/coordination/delegation/monitor.ts:12, 192` | Same terminal-check pattern | Consumer |
| `src/coordination/delegation/notification-router.ts:177, 192` | `status: type === "success" ? "completed" : type === "failure" ? "error" : type === "timeout" ? "timeout" : "cancelled"` | Producer (notification) |
| `src/coordination/delegation/state-machine.ts:269, 413, 441` | `delegation.status !== "running" && delegation.status !== "dispatched"` | Consumer (state guard) |
| `src/coordination/delegation/coordinator.ts:310, 514, 516, 626, 638-639` | Multiple status checks + `status: "completed"` | Producer + Consumer |
| `src/coordination/delegation/resume-resolver.ts:110-112` | `delegation.status === "completed" \| "error" \| "timeout"` | Consumer |
| `src/coordination/command-delegation/handler.ts:275` | `delegation.status !== "running" && delegation.status !== "dispatched"` | Consumer (state guard) |
| `src/coordination/sdk-delegation/handler.ts:159, 282` | `delegation.status !== "running"` | Consumer |
| `src/tools/delegation/delegation-status.ts:81, 121-122, 153, 155, 168, 232, 241, 446-447, 561-562, 605, 698` | Multiple terminal checks + direct mutation `delegation.status = "cancelled"` | Producer + Consumer |
| `src/tools/delegation/readers/types.ts:132, 141` | `child.status !== "active"` | Consumer (assumes `active` value) |
| `src/tools/delegation/delegate-task.ts:89` | `resultRecord.status === "error" \|\| resultRecord.status === "timeout"` | Consumer |
| `src/tools/hivemind/hivemind-session-view.ts:149` | `d.status === "running" \|\| d.status === "dispatched"` | Consumer |
| `src/task-management/continuity/delegation-persistence.ts:24-28, 137, 146, 174, 180-184, 195, 204` | `status = "active" \| "completed" \| "aborted" \| "cancelled" \| "error"` mapping | Producer (mapping table) |
| `src/features/agent-work-contracts/store.ts:97` | `contract.status === "running"` | Consumer (AgentWorkStatus) |
| `src/features/ralph-loop/index.ts:25` | `result.status === "error" \|\| result.status === "timeout"` | Consumer |
| `src/hooks/lifecycle/session-hooks.ts:217, 229, 268` | `result.status === "completed" \| "failed" \| "error"` | Consumer (TaskNotification) |
| `src/shared/task-status.ts:21` | `status === "completed" \|\| "failed" \|\| "error" \|\| "cancelled"` | Consumer (TaskStatus) |
| `src/shared/types.ts:179-190` | `delegationStatusToHarnessStatus` mapper | Producer (the only canonical cross-mapping) |

### 4.4 Conflicting enums — diagnostic table

The following table identifies pairs of statuses that semantically overlap but use different names:

| Concept | Coordination | Session-tracker | Continuity (TaskStatus) | Harness | AgentWork | Trajectory | Notification |
|---------|--------------|------------------|-------------------------|---------|-----------|------------|--------------|
| "Started, not yet running" | `dispatched` | `dispatched` | `pending` | `pending` | `created` | `planning` | `started` |
| "In queue" | — | `queued` | `queued` | `queued` | — | — | — |
| "Dispatching" | — | — | — | `dispatching` | — | — | — |
| "Currently running" | `running` | `running` | `running` | `running` | `running` | `executing`/`verifying` | — |
| "Completed OK" | `completed` | `completed` | `completed` | `completed` | `completed` | `completed` | `completed` |
| "Error" | `error` | — | `error` | `error` | — | — | `failed` |
| "Timeout" | `timeout` | — | — | — | — | — | — |
| "Failed (general)" | — | `failed` | `failed` | `failed` | — | — | `failed` |
| "User cancelled" | `cancelled` | `cancelled` | `cancelled` | `cancelled` | `cancelled` | — | `cancelled` |
| "Aborted (system)" | `aborted` | `aborted` | — | — | — | — | — |
| "Paused" | — | `paused` | — | — | `blocked` | — | — |
| "Compacted" | — | — | `interrupt` | `interrupt` | — | — | — |
| "Closed (final)" | — | — | — | — | — | `closed` | — |
| "OpenCode SDK idle" | — | — | — | — | — | — | — (mapped to "completed" or "error" externally) |
| "OpenCode SDK busy" | `running` | `running` | `running` | `running` | `running` | `executing` | — |
| "OpenCode SDK retry" | — | — | — | — | — | — | — (not handled in harness) |

**Counted conflict zones:**
- 16 different status vocabularies total
- 12 distinct enum types in 7 files
- 5 free-form `string` fields in session-tracker types
- 1 only-cross-mapping function (`delegationStatusToHarnessStatus` at `src/shared/types.ts:179-190`)

### 4.5 T5 Issues found

| ID | Severity | File:line | Issue | Impact |
|----|----------|-----------|-------|--------|
| T5-1 | CRITICAL | `src/features/session-tracker/types.ts:135, 193, 292, 347, 397` | 5 `string`-typed `status` fields (SessionRecord, HierarchyManifestChild, ChildSessionRecord, ChildHierarchyEntry, ProjectSessionEntry) | No Zod validation; runtime accepts any string; persisted JSON can carry arbitrary values that pass type-checks but break readers |
| T5-2 | CRITICAL | `src/coordination/delegation/types.ts:1-8` vs `src/features/session-tracker/types.ts:51-58` | `DelegationStatus` (7) and `DelegationLifecycleStatus` (7) have DIFFERENT value sets — `timeout`/`error`/`cancelled` (coordination) vs `failed`/`queued`/`paused` (session-tracker) | Round-trip persistence lossy: when session-tracker reads coordination's `timeout` and re-emits, the value is preserved as `timeout`, but session-tracker readers checking `failed` will miss it |
| T5-3 | HIGH | `src/coordination/delegation/manager.ts:251-256, 295, 337, 566` | Direct mutation of `delegation.status` outside the state machine | State machine at `state-machine.ts:269, 413, 441` is bypassed for 4 of the 7 transitions; guarantees invalidated |
| T5-4 | HIGH | `src/tools/delegation/delegation-status.ts:447, 562` | Tool-level `delegation.status = "cancelled"` mutation | Custom tool has WRITE authority that the comment at the same file (`status tool`) implies it should be READ; violates CQRS |
| T5-5 | HIGH | `src/tools/delegation/delegation-status.ts:36` | `status: z.string().optional()` (filter) | No enum validation; agents can pass arbitrary strings to filter delegations |
| T5-6 | HIGH | `src/tools/session/session-tracker.ts:35` and `src/tools/session/session-delegation-query.ts:44` | Same `status: z.string().optional()` | Same as T5-5; inconsistent enum-allowance across tools |
| T5-7 | MEDIUM | `src/coordination/delegation/manager.ts:255-256` | Mapping: `d.status === "error" \|\| d.status === "timeout"` → "failed", `d.status === "cancelled"` → "aborted" | Mapping INVERTS the semantics — `cancelled` becomes `aborted` (incorrect, since "aborted" and "cancelled" are distinct in `DelegationStatus`) |
| T5-8 | MEDIUM | `src/tools/delegation/readers/types.ts:130, 132, 141` | `child.status !== "active"` then cast `as DelegationTerminalKind` | `active` is NOT a value in `DelegationTerminalKind` (8 values, line 14-22 of `types.ts`) — type cast lies about runtime value |
| T5-9 | MEDIUM | `src/task-management/continuity/delegation-persistence.ts:24-28, 180-184` | Inconsistent mapping: `running`→`active`, but also `running`→`running` in line 180-184 | Same input (`running`) maps to DIFFERENT outputs (`active` vs `running`) depending on path |
| T5-10 | MEDIUM | `src/coordination/delegation/notification-router.ts:177, 192` | `status: type === "success" ? "completed" : type === "failure" ? "error" : type === "timeout" ? "timeout" : "cancelled"` | Maps `failure` to `error` but also uses `cancelled` as default — but `progress` is missing from the ternary, so progress notifications get `cancelled` (incorrect) |
| T5-11 | MEDIUM | `src/shared/types.ts:179-190` | `delegationStatusToHarnessStatus` is the only cross-mapper; missing for `TaskStatus` and `AgentWorkStatus` | Custom logic duplicates the mapping elsewhere (see T5-7) |
| T5-12 | MEDIUM | `src/coordination/delegation/manager.ts:295, 566` | Comments say "emit delegation-terminal event with status='aborted'" but the actual mutation writes `cancelled` (line 295) or `failed` (line 566) | Comments don't match code |
| T5-13 | LOW | `src/coordination/delegation/lifecycle.ts:63` | Terminal check includes `aborted` AND `cancelled` (both) | Both terminal in coordination, but the wider vocabulary has only ONE (`cancelled`); `aborted` is redundant |
| T5-14 | LOW | `src/coordination/delegation/types.ts:34, 85` vs `src/coordination/delegation/types.ts:57` | `Delegation.status: DelegationStatus` and `Delegation.terminalKind?: DelegationTerminalKind` — both fields exist on same record | Status is required; terminalKind is a refinement — but in many places the refinement is ignored and status alone is checked (e.g., `delegation-status.ts:81`) |

### 4.6 RECOMMENDED DRAFT unified status enum (PROPOSAL)

Based on the analysis, the following unified status is RECOMMENDED for a single source of truth:

```typescript
/**
 * RECOMMENDED UNIFIED STATUS ENUM — DRAFT
 *
 * Goals:
 *   1. Single canonical enum referenced by all custom tools and SDK wrappers
 *   2. Cover all 7 distinct concepts (pending, queued, dispatching, running,
 *      completed, error, cancelled) without synonyms
 *   3. Express "terminal" vs "in-flight" via membership helper, not vocabulary
 *   4. Map the OpenCode SDK `idle | busy | retry` to this enum at the wrapper
 *   5. Replace ALL free-form `string` status fields in session-tracker types
 *
 * Migration path: each existing enum retains its definition; the unified
 * enum is the ONLY one allowed at new boundaries. Mapping functions convert
 * at the legacy boundary in both directions.
 */
export type UnifiedStatus =
  // ─── pre-flight (no SDK session yet) ───
  | "pending"          // enqueued in coordination queue, not yet dispatched
  | "queued"           // slot acquired, waiting for SDK availability
  | "dispatching"      // SDK call in flight (transient)
  // ─── in-flight (SDK session exists) ───
  | "running"          // child session active, dual-signal monitoring
  | "busy"             // OpenCode SDK "busy" — synonym for running
  | "retry"            // OpenCode SDK "retry" — transient retry state
  // ─── terminal-ok ───
  | "completed"        // successful terminal state
  // ─── terminal-fail (sub-classified) ───
  | "failed"           // general failure (network, auth, etc.)
  | "error"            // tool / runtime error (e.g., SDK error)
  | "timeout"          // activity-stale ceiling reached
  | "cancelled"        // user-initiated cancellation
  | "aborted"          // system-initiated abort (e.g., restart recovery)
  // ─── special ───
  | "blocked"          // agent-work-contract-only: cannot proceed, awaits input
  | "paused"           // session-tracker-only: halted but resumable
  | "interrupt"        // continuity-only: pre-compact snapshot
  | "idle"             // OpenCode SDK "idle" — synonym for completed-or-pending

/**
 * Terminal state membership helper.
 * Replaces 4+ duplicated isTerminal() functions across:
 *   - src/shared/task-status.ts:20
 *   - src/coordination/delegation/lifecycle.ts:63
 *   - src/coordination/delegation/monitor.ts:12
 *   - src/coordination/completion/detector.ts:250
 *   - src/tools/delegation/delegation-status.ts:81
 *   - src/coordination/delegation/manager.ts:331
 */
export function isUnifiedTerminal(status: UnifiedStatus): boolean {
  return status === "completed"
      || status === "failed"
      || status === "error"
      || status === "timeout"
      || status === "cancelled"
      || status === "aborted"
}

/**
 * OpenCode SDK status → UnifiedStatus mapper
 * Lives in src/shared/session-api.ts (single boundary point).
 */
export function opencodeStatusToUnified(sdkType: "idle" | "busy" | "retry"): UnifiedStatus {
  switch (sdkType) {
    case "busy": return "running"
    case "retry": return "retry"
    case "idle": return "idle"
  }
}

/**
 * DelegationStatus → UnifiedStatus mapper (forward direction)
 * Replaces the inline ternaries in:
 *   - src/task-management/continuity/delegation-persistence.ts:24-28
 *   - src/coordination/delegation/notification-router.ts:177,192
 *   - src/coordination/delegation/manager.ts:251-256
 *   - src/coordination/delegation/manager.ts:295,566
 *   - src/coordination/delegation/lifecycle.ts:63
 *   - src/coordination/delegation/coordinator.ts:310,514,638-639
 *   - src/coordination/delegation/notification-router.ts:177,192
 *   - src/plugin.ts:265,268
 *   - src/features/ralph-loop/index.ts:25
 *   - src/hooks/lifecycle/session-hooks.ts:217,229,268
 *   - src/tools/delegation/delegation-status.ts:81,121-122,153,155,605,698
 */
export function delegationStatusToUnified(s: DelegationStatus): UnifiedStatus {
  switch (s) {
    case "dispatched": return "dispatching"
    case "running":    return "running"
    case "completed":  return "completed"
    case "error":      return "error"
    case "timeout":    return "timeout"
    case "aborted":    return "aborted"
    case "cancelled":  return "cancelled"
  }
}

/**
 * UnifiedStatus → DelegationStatus mapper (reverse direction)
 */
export function unifiedToDelegationStatus(s: UnifiedStatus): DelegationStatus {
  switch (s) {
    case "dispatching": return "dispatched"
    case "running":     return "running"
    case "completed":   return "completed"
    case "error":       return "error"
    case "timeout":     return "timeout"
    case "aborted":     return "aborted"
    case "cancelled":   return "cancelled"
    case "failed":      return "error"       // map failed→error (closest match)
    case "pending":
    case "queued":
    case "busy":
    case "retry":
    case "blocked":
    case "paused":
    case "interrupt":
    case "idle":
      return "dispatched"                     // pre-flight → dispatched
  }
}

/**
 * TaskStatus → UnifiedStatus mapper
 */
export function taskStatusToUnified(s: TaskStatus): UnifiedStatus {
  switch (s) {
    case "pending":    return "pending"
    case "queued":     return "queued"
    case "running":    return "running"
    case "completed":  return "completed"
    case "failed":     return "failed"
    case "error":      return "error"
    case "cancelled":  return "cancelled"
    case "interrupt":  return "interrupt"
  }
}

/**
 * AgentWorkStatus → UnifiedStatus mapper
 */
export function agentWorkStatusToUnified(s: AgentWorkStatus): UnifiedStatus {
  switch (s) {
    case "created":    return "pending"
    case "running":    return "running"
    case "blocked":    return "blocked"
    case "completed":  return "completed"
    case "cancelled":  return "cancelled"
  }
}

/**
 * TrajectoryStatus → UnifiedStatus mapper
 * Trajectory is per-phase, so values don't map 1:1; this returns the closest match.
 */
export function trajectoryStatusToUnified(s: TrajectoryStatus): UnifiedStatus {
  switch (s) {
    case "planning":   return "pending"
    case "executing":  return "running"
    case "verifying":  return "running"
    case "completed":  return "completed"
    case "closed":     return "completed"
  }
}
```

**Migration strategy (documentation only — no source changes):**
1. Add `UnifiedStatus` and mapping functions to `src/shared/types.ts`
2. Convert 5 `string` status fields in `src/features/session-tracker/types.ts` to `UnifiedStatus` (after dual-write validation)
3. Add Zod enum validator: `z.enum(["pending","queued",...,"idle"])` to all 3 `status: z.string().optional()` tool schemas (T5-5, T5-6)
4. Replace 11 duplicated terminal-check functions with `isUnifiedTerminal()`
5. Replace 7 inline status-mapping ternaries with `delegationStatusToUnified()` / `unifiedToDelegationStatus()`
6. Add the only-cross-mapper `delegationStatusToHarnessStatus` (line 179) as a thin alias of `delegationStatusToUnified`

---

## 5. Cross-Track Conflicts

### 5.1 Tool reads status from multiple sources (T1 ↔ T5)

| Tool | Reads status from | Sources |
|------|-------------------|---------|
| `session-tracker` (`status` filter) | `.hivemind/session-tracker/{sid}/*.json` | FREE-FORM `string` (5 types) |
| `delegation-status` (`status` filter) | `DelegationManager.getAllDelegations` | `DelegationStatus` (7) — but with "control" actions mutating |
| `hivemind-session-view` | Same as session-tracker + trajectory | Mix of FREE-FORM + Zod-typed |
| `session-delegation-query` (`status` filter) | session-tracker manifest | FREE-FORM `string` |
| `session-context` (`groupBy: "status"`) | session-tracker + continuity | MIXED — may produce inconsistent buckets |

**Conflict:** A user calling `session-tracker({ action: "filter-sessions", status: "running" })` may see results for delegation-status `running` but miss session-tracker `active` records (which encode the same concept). Same query against `delegation-status` returns different shape.

### 5.2 Status mutation double-source (T1 ↔ T5)

`delegation.status` is mutated in 4 distinct places:

1. **`src/coordination/delegation/state-machine.ts`** (canonical)
2. **`src/coordination/delegation/manager.ts:251-256, 295, 337, 566`** (direct)
3. **`src/coordination/delegation/notification-router.ts:177, 192`** (notification path)
4. **`src/coordination/delegation/coordinator.ts:310, 514, 626, 638-639`** (coordinator logic)
5. **`src/tools/delegation/delegation-status.ts:447, 562`** (tool-level)

The state machine is the only path that enforces transition validity (`state-machine.ts:269, 413, 441`). The other 4 paths bypass validation.

### 5.3 Schema drift (T2 ↔ T5)

`SessionContinuityMetadata.status` (`src/shared/types.ts:307`) is `TaskStatus` (8 values, includes `pending | queued | interrupt`).
`SessionRecord.status` (`src/features/session-tracker/types.ts:135`) is `string` (no validation).
`ProjectSessionEntry.status` (`src/features/session-tracker/types.ts:397`) is `string` (no validation).

Same concept, different types, no mapping function. The 3 fields are persisted to the same JSON file (`.hivemind/state/session-continuity.json` and `.hivemind/session-tracker/project-continuity.json`).

### 5.4 Documentation drift (T1 ↔ T5)

`src/plugin.ts:471`: "registering 26 custom tools" (actual: 27)
`src/features/session-tracker/types.ts:134`: "active | idle | completed | error" (type is `string`, no validation)
`src/features/session-tracker/types.ts:192`: "active | idle | completed | error | aborted | cancelled" (type is `string`)
`src/features/session-tracker/types.ts:291`: "active | completed | error" (type is `string`)
`src/features/session-tracker/types.ts:396`: "active | completed | error" (type is `string`)

Each surface claims a different 4-6 value vocabulary in its comment, but ALL have type `string`.

### 5.5 Cross-track issue matrix

| Cross-track | Issue | Affected tracks |
|-------------|-------|-----------------|
| T1-3 ↔ T5-5 | `delegation-status` status filter is free-form string | Tool surface + status schema |
| T1-4 ↔ T5-6 | `session-tracker` status filter is free-form string | Tool surface + status schema |
| T1-5 ↔ T5-6 | `session-delegation-query` status filter is free-form string | Tool surface + status schema |
| T1-6 ↔ T5 | `session-context` groupBy=status uses free-form key | Tool surface + status schema |
| T1-8 ↔ T5-3 | Tool mutates delegation.status bypassing state machine | Tool surface + status schema |
| T1-9 ↔ T5-2 | `hivemind-session-view` misses `queued` in active count | Tool surface + status schema |
| T2-1 ↔ T5 | persistStore is no-op, but Zod-validated status is written in-memory only | Session-tracker + status schema |
| T2-3 ↔ T5-1 | session-tracker types use `string` for status (5 places) | Session-tracker + status schema |
| T2-5 ↔ T5 | AgentWorkStatus filter (`running`) vs continuity TaskStatus (`running`) | Session-tracker + status schema |
| T2-7 ↔ T5 | TrajectoryStatus (5 values) has no cross-mapper to TaskStatus / DelegationStatus | Session-tracker + status schema |

---

## 6. Top 15 Critical Issues (L5 documentation only)

> All "remedy" entries are prescriptive documentation notes for future implementation
> phases. This audit introduces no source changes.

| # | Severity | File:line | Issue | Impact | Proposed remedy (documentation only) |
|---|----------|-----------|-------|--------|-------------------------------------|
| 1 | **CRITICAL** | `src/features/session-tracker/types.ts:135, 193, 292, 347, 397` | Five `status: string` fields in session-tracker record types | No Zod validation; persisted JSON can carry any string and pass type checks | Convert all 5 to `UnifiedStatus` (see §4.6); add Zod enum validation at persistence boundary in `features/session-tracker/persistence/atomic-write.ts` |
| 2 | **CRITICAL** | `src/coordination/delegation/types.ts:1-8` vs `src/features/session-tracker/types.ts:51-58` | `DelegationStatus` (7) and `DelegationLifecycleStatus` (7) have different value sets | Round-trip lossy: `timeout`/`error`/`cancelled` vs `failed`/`queued`/`paused` | Pick one as canonical; reduce `DelegationLifecycleStatus` to alias of `DelegationStatus`; document G6 SPEC permits duplication but it must be 1:1 |
| 3 | **CRITICAL** | `src/task-management/continuity/index.ts:313-316` | `persistStore()` is a NO-OP ("REQ-P41D-02: No disk write") | All continuity writes LOST on process restart; only session-tracker dual-write survives | Either (a) restore disk write, (b) document the explicit in-memory constraint in the function comment AND have a startup rehydration step that reads session-tracker files into continuity state |
| 4 | **CRITICAL** | `src/coordination/delegation/manager.ts:251-256, 295, 337, 566` and `src/tools/delegation/delegation-status.ts:447, 562` | 5 places mutate `delegation.status` directly outside `DelegationStateMachine` | State machine transition guards bypassed; guarantees invalidated | Route ALL status mutations through `stateMachine.transition(id, targetStatus)`; or add compile-time check that `Delegation` interface makes `status` private (readonly) |
| 5 | **HIGH** | `src/coordination/delegation/manager.ts:255-256` | Inverse mapping: `cancelled`→`aborted`, `error`/`timeout`→`failed` | Semantically incorrect — `cancelled` and `aborted` are distinct in `DelegationStatus` (lines 7-8 of `types.ts`) | Replace with single canonical mapper (see §4.6 `delegationStatusToUnified`) |
| 6 | **HIGH** | `src/coordination/delegation/manager.ts:295, 566` | Comments claim "emit status='aborted'" / "status='failed'" but mutations write `cancelled` / `failed` (different) | Comments don't match code; future maintainers will be misled | Either fix code to match comments OR fix comments to match code |
| 7 | **HIGH** | `src/tools/delegation/delegation-status.ts:24-44, 36` | Tool named "status" has WRITE authority (control actions) + free-form `status: z.string().optional()` filter | Mixes READ and WRITE; filter accepts any string | Split into 2 tools: `delegation-status` (read-only) and `delegation-control` (write-only); replace `z.string()` with `z.enum()` of canonical `DelegationStatus` values |
| 8 | **HIGH** | `src/tools/session/session-tracker.ts:35` and `src/tools/session/session-delegation-query.ts:44` | Both have `status: z.string().optional()` (free-form filter) | Same as #7 | Add `z.enum()` validation referencing the unified `UnifiedStatus` |
| 9 | **HIGH** | `src/coordination/delegation/notification-router.ts:177, 192` | `progress` notifications get `cancelled` default (line 192 ternary doesn't cover `progress`) | Progress notifications incorrectly marked as terminal | Add explicit `progress` case returning "running" (or a dedicated status); exhaustive switch |
| 10 | **MEDIUM** | `src/plugin.ts:471` | Self-diagnostic says "registering 26 custom tools" but actual count is 27 | Off-by-one documentation drift in the harness's own startup log | Change to "27" (verified: 3 + 7 + 9 + 6 + 2 = 27) |
| 11 | **MEDIUM** | `src/tools/delegation/readers/types.ts:130, 132, 141` | Cast `child.status as DelegationTerminalKind` when `child.status === "active"` is a string | Type assertion lies about runtime value; the cast is incorrect | Validate against the Zod enum first; OR use the unified mapper to convert `active` → `running` → no terminalKind |
| 12 | **MEDIUM** | `src/task-management/continuity/delegation-persistence.ts:24-28, 180-184` | Same input `running` maps to different outputs (`active` vs `running`) depending on path | Inconsistent round-trip | Use the canonical mapper `delegationStatusToUnified` |
| 13 | **MEDIUM** | `src/coordination/completion/detector.ts:250` and `src/coordination/delegation/lifecycle.ts:63` and `src/coordination/delegation/monitor.ts:12` and `src/tools/delegation/delegation-status.ts:81` and `src/coordination/delegation/manager.ts:331` and `src/shared/task-status.ts:20` | Six near-identical `isTerminal()` functions | Duplicated logic; drift risk | Replace with single `isUnifiedTerminal(status: UnifiedStatus)` function |
| 14 | **MEDIUM** | `src/tools/hivemind/hivemind-session-view.ts:96-101` | Fallback path reads `.hivemind/state/delegations.json` (legacy) | REQ-P41D-01 says "no delegations.json I/O"; the tool violates this | Remove the fallback OR document the exception with a tracking issue |
| 15 | **MEDIUM** | `src/features/session-tracker/types.ts:51-58` and `src/coordination/delegation/types.ts:1-8` | G6 SPEC permits duplication, but the value sets diverged (queued/paused in tracker, timeout/error/cancelled in coordination) | No 1:1 round-trip; readers must understand both | Add `equals(a, b)` helper that knows both enums; OR collapse to a single source |

---

## 7. Summary recommendations (for future implementation phases)

These are L5 documentation-only recommendations, no source changes in this audit:

### 7.1 High-priority (correctness)
- **R1**: Restore disk persistence for `session-continuity` OR add startup rehydration from session-tracker files
- **R2**: Route all `delegation.status` mutations through `DelegationStateMachine.transition()`
- **R3**: Add Zod enum validation to the 5 free-form `status: string` fields in session-tracker types

### 7.2 Medium-priority (consistency)
- **R4**: Adopt the `UnifiedStatus` enum (§4.6) as the single source of truth
- **R5**: Replace 6 duplicated `isTerminal()` functions with one
- **R6**: Fix `hivemind-session-view` "active" count to include `queued` status
- **R7**: Split `delegation-status` into read-only status + write-only control tools

### 7.3 Low-priority (documentation)
- **R8**: Fix off-by-one in `src/plugin.ts:471` (26 → 27)
- **R9**: Update doc comments in session-tracker types to match the unified enum
- **R10**: Document the legacy delegations.json fallback in `hivemind-session-view.ts:96-101`

---

*End of audit — Wave 1, Agent A, Tracks T1 + T2 + T5*
*27 tools mapped · 5 surfaces mapped · 32 issues found · 1 unified status enum proposed*
*Confidence: HIGH for T1/T2 inventory, MEDIUM for T5 (OpenCode SDK schema not deep-read beyond wrapper)*
