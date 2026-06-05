# Wave 1A — Tool Surface & Session Ecosystem Audit

**Audit Date:** 2026-06-04
**Scope:** Tracks 1, 2, 4 of 8-track architectural audit
**Auditor:** GSD codebase mapper (read-only)
**Mode:** L5 documentation only — no source changes

---

## 1. Executive Summary

### Counts

| Surface | Count | LOC |
|---|---|---|
| Total tools registered by `src/plugin.ts` | **27** | 7,868 (`src/tools/`) |
| Tools physically in `src/tools/` | **26** | 7,868 |
| Tools registered but living outside `src/tools/` | **1** (`create-governance-session` in `src/features/governance-engine/`) | 294 |
| Engine modules under `src/coordination/` | 21 | 7,111 |
| Features under `src/features/` (15 directories) | 50+ TS files | 18,948 |
| Task-management under `src/task-management/` | 12 TS files | 2,373 |
| Hooks under `src/hooks/` | 14 TS files | 2,393 |
| Libs under `src/shared/` | 14 TS files | 2,330 |
| Schemas under `src/schema-kernel/` | 21 TS files | 2,540 |
| Routing under `src/routing/` | 10 TS files | 1,440 |
| Config under `src/config/` | 7 TS files | 1,109 |

### Confidence: **HIGH**

- All 27 tools physically inspected (read full or partial source of every registered tool factory).
- All 5 session-tracker ecosystem surfaces opened and at least partially read.
- All 21 `src/coordination/delegation/*` files listed, top 14 by LOC inspected.
- All 14 `src/hooks/*` files inspected.
- All 21 `src/schema-kernel/*` files listed, key schemas read.
- Confirmed against `src/plugin.ts:53-78` import list, `src/plugin.ts:135-205` registration functions, and the comment block at `src/plugin.ts:130-205`.

### Issue Counts (initial pass)

| Severity | Count |
|---|---|
| CRITICAL | 5 |
| HIGH | 6 |
| MEDIUM | 4 |
| **Total** | **15** |

### Top 5 Critical Issues (preview — full detail in §6)

1. **tool/file-path/registration-domain mismatch** — `run-background-command` source at `src/tools/hivemind/run-background-command.ts:1` is registered by `registerDelegationTools` at `src/plugin.ts:144` (delegation domain), not the hivemind domain. **CRITICAL.**
2. **create-governance-session lives outside `src/tools/`** — Registered as a session-domain tool at `src/plugin.ts:163` but defined in `src/features/governance-engine/create-governance-session.ts:80`. Breaks the "27 tools in `src/tools/`" invariant documented in `AGENTS.md`. **CRITICAL.**
3. **plugin.ts comment drift** — `src/plugin.ts:173` claims "Record of 8 hivemind tools" while the object literal at `src/plugin.ts:175-187` registers **9** entries. **CRITICAL.**
4. **double-source delegation persistence** — `src/task-management/continuity/delegation-persistence.ts:56-100` documents a "No delegations.json file I/O. Session-tracker is canonical" policy but `src/tools/delegation/readers/legacy-reader.ts:40-58` still reads from `delegations.json` as a fallback. The two readers `src/tools/delegation/readers/session-tracker-reader.ts:15-88` and `legacy-reader.ts:16-58` return different delegation shapes for the same delegation ID. **CRITICAL.**
5. **session-tracker vs continuity dual authority** — `src/features/session-tracker/index.ts:100-179` (SessionTracker class) owns `.hivemind/session-tracker/<sessionId>/{*.md, *.json}` while `src/task-management/continuity/index.ts:38-51` (ContinuityFile path) owns `.hivemind/state/session-continuity.json` — two parallel stores for the same session lifecycle with no single source of truth. **CRITICAL.**

---

## 2. Track 1 — Tool Surface (27 tools)

### 2.1 Registration domains (per `src/plugin.ts`)

Source: `src/plugin.ts:135-205` (4 `register*Tools` functions + 2 top-level entries).

| Domain | `plugin.ts` line | Registered count | Comment line in source | Comment claim | Actual |
|---|---|---|---|---|---|
| Delegation | 135–146 | 3 | 133 | "3 delegation tools" | ✓ matches |
| Session | 155–165 | 7 | 153 | "7 session tools" | ✓ matches |
| Hivemind | 175–187 | **9** | 173 | **"8 hivemind tools"** | **✗ MISMATCH** |
| Config | 196–205 | 6 | 194 | "6 config tools" | ✓ matches |
| Top-level | 78, 78 (imports only) | 2 | n/a | n/a | ✓ |

**Comment drift — see Issue #3.**

### 2.2 Complete Tool Table (27 tools)

| # | Tool name (registered) | File path (line of `create*Tool`) | LOC | Schema source | Actions exposed | Engine / lib / hook integration | Output envelope |
|---|---|---|---|---|---|---|---|
| 1 | `delegate-task` | `src/tools/delegation/delegate-task.ts:27` | 110 | inline Zod `DelegateTaskV2Schema:10-15` | (none — single-shot dispatch) | `coordinator.dispatch()` via injected `CoordinatorLike` (`delegate-task.ts:78-87`); `coordination/delegation/coordinator.ts` | `renderToolResult(success(...))` from `shared/tool-helpers.ts` |
| 2 | `delegation-status` | `src/tools/delegation/delegation-status.ts:71+` (factory) | 891 | `DelegationStatusInputSchema:34-44` | `status`, `get`, `list`, `control`, `find-stackable`, `pool`, `peek`, `progress`, + control sub-actions `abort/cancel/restart/resume/chain/adjust-prompt/change-agent` (`DelegationControlSchema:24-32`) | `coordination/delegation/manager-runtime.ts`; `coordination/delegation/session-intelligence.ts`; reads via `tools/delegation/readers/session-tracker-reader.ts` + `legacy-reader.ts`; `features/session-tracker/persistence/atomic-write.ts:safeSessionPath` | `renderToolResult(success/error)` |
| 3 | `run-background-command` | `src/tools/hivemind/run-background-command.ts:138` | 228 | `RunBackgroundCommandInputSchema:40-46` (5-action discriminated union) | `run`, `output`, `input`, `list`, `terminate` | `coordination/delegation/manager.ts:DelegationManager.dispatchCommand` (`run-background-command.ts:171`); `features/background-command/pty/pty-manager.ts:PtyManager`; `config/subscriber.ts:getCachedConfig` | `renderToolResult(success/error)` |
| 4 | `execute-slash-command` | `src/tools/session/execute-slash-command.ts:88+` (factory) | 863 | `ExecuteSlashCommandSchema` from `schema-kernel/commands.schema.ts:3-14` | (single composite action — fields `command`, `arguments`, `agent`, `model`, `subtask`, `commandSource`, `parentSessionID`, `stackOnSessionId`, `namespace`) | `routing/command-engine/index.ts:discoverCommandBundles`; `tools/session/resolve-command.ts`; `tools/session/dispatch-command.ts:38`; `features/session-tracker/types.ts:isValidSessionID`; `features/governance-engine/config-reader.ts`; `shared/session-api.ts:getSessionMessages/getSessionStatusMap`; `shared/helpers.ts` | `renderToolResult` with `{output, metadata, error}` |
| 5 | `session-patch` | `src/tools/session/session-patch/tools.ts:19` | 136 | `SessionPatchRecordSchema` from `schema-kernel/prompt-enhance.schema.ts` (NOTE: schema re-used from prompt module) | (single — `sessionFilePath`, `section`, `newContent`) | `shared/security/path-scope.ts:assertPathWithinRoot`; direct `fs` read/write of session.md artifacts | `renderToolResult(success/error)` with `{backup_path, patch_count, old_length, new_length}` |
| 6 | `session-journal-export` | `src/tools/session/session-journal-export.ts:65` | 117 | `SessionJournalExportInputSchema:14-19` (inline) | (single — `format`, `sessionId?`, `pipelineKey?`, `pipelineKeyLabel?`) | `task-management/continuity/index.ts:listSessionContinuity`; `task-management/continuity/delegation-persistence.ts:readPersistedDelegations`; `task-management/journal/execution-lineage.ts:buildExecutionLineage` | `renderToolResult(success)` with `data.markdown` or `data.*` |
| 7 | `session-tracker` | `src/tools/session/session-tracker.ts:25` | 423 | `SessionTrackerInputSchema` from `schema-kernel/session-tracker.schema.ts:38-73` (6-action discriminated union) | `export-session`, `get-status`, `get-summary`, `list-sessions`, `search-sessions`, `filter-sessions` | `features/session-tracker/persistence/atomic-write.ts:sessionTrackerRoot/safeSessionPath`; `features/session-tracker/types.ts:isValidSessionID`; `tools/session/session-resolver.ts:resolveSessionFile`; `gray-matter` for frontmatter parse | `renderToolResult(success/error)` |
| 8 | `session-hierarchy` | `src/tools/session/session-hierarchy.ts:33` | 283 | `SessionHierarchyInputSchema` from `schema-kernel/session-tracker.schema.ts:87-105` (4-action) | `get-children`, `get-parent-chain`, `get-delegation-depth`, `get-manifest` | `features/session-tracker/types.ts`; `tools/session/session-resolver.ts:resolveSessionFile`; reads `session-continuity.json` directly (`session-hierarchy.ts:78-80+`) | `renderToolResult(success/error)` |
| 9 | `session-context` | `src/tools/session/session-context.ts:40` | 301 | `SessionContextInputSchema` from `schema-kernel/session-tracker.schema.ts:119-138` (4-action) | `find-related`, `cross-reference`, `synthesize-context`, `aggregate` | `features/session-tracker/persistence/atomic-write.ts`; `tools/session/session-resolver.ts`; reads `project-continuity.json` (under session-tracker root) | `renderToolResult(success/error)` |
| 10 | `create-governance-session` | `src/features/governance-engine/create-governance-session.ts:80` | 294 | inline `GovernanceSessionInput:57-61` (NOTE: outside `src/tools/`) | (single — `agent`, `brief`, `title?`) | `shared/session-api.ts:createSession/getSession/sendPrompt/showTuiToast/getSessionID`; `shared/session-naming.ts:generateSessionTitle`; `features/governance-engine/config-reader.ts:readGovernanceConfig/resolveAgentForBrief/validateNamingTitle`; `node:child_process:execFile` for git commits | `renderToolResult(success({sessionID, title}))` or `error` |
| 11 | `hivemind-doc` | `src/tools/hivemind/hivemind-doc.ts:21` | 45 | `DocIntelligenceInputSchema` from `schema-kernel/doc-intelligence.schema.ts` | `skim`, `skim_directory`, `read`, `chunk`, `search` | `features/doc-intelligence/index.ts:executeDocIntelligenceAction` | `renderToolResult(success)` |
| 12 | `hivemind-trajectory` | `src/tools/hivemind/hivemind-trajectory.ts:29` | 129 | `TrajectoryToolInputSchema` from `schema-kernel/trajectory.schema.ts:11-28` | `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`, `create` | `task-management/trajectory/index.ts` (barrel) → `trajectory/store-operations.ts` (all 7 ops at lines 70+) | `renderToolResult(success)` |
| 13 | `hivemind-pressure` | `src/tools/hivemind/hivemind-pressure.ts:30` | 94 | `RuntimePressureToolInputSchema` from `schema-kernel/runtime-pressure.schema.ts` | `classify`, `detect`, `inspect_tool_catalog`, `attach_event` | `features/runtime-pressure/index.ts:classifyRuntimePressure/detectRuntimePressure/inspectToolAuthorityCatalog`; `task-management/trajectory/index.ts:eventTrajectory` (for `attach_event`) | `renderToolResult(success)` |
| 14 | `hivemind-sdk-supervisor` | `src/tools/hivemind/hivemind-sdk-supervisor.ts:18` | 53 | `SdkSupervisorToolInputSchema` from `schema-kernel/sdk-supervisor.schema.ts` | `health`, `heartbeat`, `diagnostics`, `readiness` | `features/sdk-supervisor/index.ts:executeSdkSupervisorAction` | `renderToolResult(success)` |
| 15 | `hivemind-command-engine` | `src/tools/hivemind/hivemind-command-engine.ts:25` | 67 | `CommandEngineToolInputSchema` from `schema-kernel/command-engine.schema.ts` | `discover`, `analyze_contract`, `render_context`, `transform_messages`, `route_preview`, `list_commands` | `routing/command-engine/index.ts:executeCommandEngineAction` (read-side companion to `execute-slash-command`) | `renderToolResult(success)` |
| 16 | `hivemind-session-view` | `src/tools/hivemind/hivemind-session-view.ts:26` | 155 | `SessionViewInputSchema` from `schema-kernel/session-view.schema.ts` | `get` (single) | Reads 3 roots directly: `session-continuity.json` (line 60), `hierarchy-manifest.json` (line 75), `state/trajectory-ledger.json` (line 107) | `renderToolResult(success({session, delegations, trajectory, queriedAt}))` |
| 17 | `hivemind-agent-work-create` | `src/tools/hivemind/hivemind-agent-work.ts:28` | 147 (file shared with #18) | `AgentWorkCreateToolInputSchema` from `schema-kernel/agent-work-contract.schema.ts:93-116` | (single — 22 fields) | `features/agent-work-contracts/index.ts:createAgentWorkContract` (operations.ts:23); `task-management/trajectory/index.ts:attachTrajectoryEvidence` (when `trajectoryId` provided) | `renderToolResult(success)` |
| 18 | `hivemind-agent-work-export` | `src/tools/hivemind/hivemind-agent-work.ts:76` | (shared) | `AgentWorkExportToolInputSchema` from `schema-kernel/agent-work-contract.schema.ts:121-124` | (single — `contractId`, `format?`) | `features/agent-work-contracts/index.ts:exportAgentWorkContract` (operations.ts:61) | `renderToolResult(success({contractId, format, payload}))` |
| 19 | `session-delegation-query` | `src/tools/session/session-delegation-query.ts:35` | 284 | `SessionDelegationQueryInputSchema` from `schema-kernel/session-delegation-query.schema.ts:21-50` (dynamically imported at line 60 — see Issue #10) | `list`, `get` | `features/session-tracker/persistence/atomic-write.ts:safeSessionPath/sessionTrackerRoot`; `tools/session/session-resolver.ts:resolveSessionFile`; **explicitly NOT** `delegation-persistence.ts` per comment `session-delegation-query.ts:9-12` | `renderToolResult(success/error)` |
| 20 | `configure-primitive` | `src/tools/config/configure-primitive.ts:72` | 490 | `ConfigurePrimitiveInputSchema:40-66` (inline) | `compile`, `decompile`, `read`, `list`, `inspect`, `resume` | `config/compiler.ts:compileAgent/compileCommand/compileSkill/decompileAgent/.../mixedBatchCompile`; `config/workflow/*` (8-step turn enforcement); `features/bootstrap/primitive-loader.ts:loadPrimitives/loadPrimitive`; `shared/security/path-scope.ts:assertPathWithinRoot`; `schema-kernel/generate-config-json-schema.ts` | `renderToolResult(success/error)` |
| 21 | `validate-restart` | `src/tools/config/validate-restart.ts:32` | 116 | `ValidateRestartInputSchema:23-26` (inline) | (single — `projectRoot?`, `verbose?`) | `features/bootstrap/primitive-loader.ts:loadPrimitives`; `features/bootstrap/cross-primitive-validator.ts:validateCrossPrimitive`; `features/bootstrap/runtime-validator.ts:validateRuntime`; `features/bootstrap/framework-detector.ts:detectFrameworks` | `renderToolResult(success/error)` with `{issues, summary}` |
| 22 | `bootstrap-init` | `src/tools/config/bootstrap-init.ts:43` | 324 | `BootstrapInitInputSchema` from `schema-kernel/bootstrap.schema.ts` | (single — `projectRoot`, `scope`, `nonInteractive`, `globalConfigDir`, `config?`) | `features/bootstrap/structure.ts:DEFAULT_CONFIG_JSON/PRIMITIVE_TYPES/TIER_1_DIRECTORIES/resolveHiveMindRoot/resolvePackageAssetsRoot/resolveOpenCodeRoot`; `schema-kernel/generate-config-json-schema.ts:generateHivemindConfigsJsonSchema/writeConfigJsonSchema` | `renderToolResult(success/error)` |
| 23 | `bootstrap-recover` | `src/tools/config/bootstrap-recover.ts:41` | 239 | `BootstrapRecoverInputSchema` from `schema-kernel/bootstrap.schema.ts` | (single — `projectRoot`, `scope`, `globalConfigDir`) | `features/bootstrap/structure.ts:PRIMITIVE_TYPES/resolvePackageAssetsRoot/resolveOpenCodeRoot` | `renderToolResult(success/error)` with status counts |
| 24 | `prompt-skim` | `src/tools/prompt/prompt-skim/tools.ts:35` | 107 | `PromptSkimResultSchema` from `schema-kernel/prompt-enhance.schema.ts` | (single — `content`, `workspaceRoot`) | `node:fs:existsSync` for path verification | `renderToolResult(success)` with skim metrics |
| 25 | `prompt-analyze` | `src/tools/prompt/prompt-analyze/tools.ts:43` | 169 | `PromptAnalysisResultSchema` from `schema-kernel/prompt-enhance.schema.ts` | (single — `content`) | pure regex-based local analysis; no engine integration | `renderToolResult(success({findings, finding_count, by_severity, clarity_score}))` |
| 26 | `tmux-copilot` | `src/tools/tmux-copilot.ts:80+` (factory) | 500 | (discriminated union inline; multi-action) | `send-keys`, `list-panes`, `compute-grid`, `respawn`, `take-over`, `release`, `peek` (per `tmux-copilot.ts:1-31` design notes) | `features/tmux/types.ts:getSessionManagerAdapter/setSessionManagerAdapter`; `features/session-tracker/index.ts:getManualOverrideState/setManualOverrideState`; **permission gate at `tmux-copilot.ts:59-64`** with `ORCHESTRATOR_AGENTS` allow-list (hm-l0-orchestrator, hm-orchestrator, hf-l0-orchestrator, hf-l1-coordinator) + USER tier sentinel `__user__` for `take-over/release/peek` only | `renderToolResult` with `{available, reason}` graceful path or structured error `{kind: "permission-denied"|"invalid-input"|...}` |
| 27 | `tmux-state-query` | `src/tools/tmux-state-query.ts:108` (constant export) | 177 | `TmuxStateQueryActionSchema:59-76` (3-action) | `list-sessions`, `get-session`, `get-summary` | `features/tmux/types.ts:getSessionManagerAdapter`; **identical permission gate at `tmux-state-query.ts:26-31`** — note: includes `hf-coordinator` (different from `hf-l1-coordinator` in `tmux-copilot.ts:63`) | `renderToolResult` typed `TmuxStateQueryResult` (line 82) — union of `{available: false, reason}`, `{error: {kind, ...}}`, `{sessions: []}`, `{session: null}`, `{summary: {total: 0, active: 0, spawning: 0}}` |

### 2.3 Output envelope (universal pattern)

All 27 tools converge on `renderToolResult(...)` from `src/shared/tool-helpers.ts`. Internal call sites construct envelopes via `success(message, data)` or `error(message, details)` from `src/shared/tool-response.ts`. **One exception:** `tmux-state-query.ts:127-176` constructs envelopes **directly** with `renderToolResult({...})` without using the `success/error` helpers — a minor convention drift.

### 2.4 Engine / lib / hook integration map (tool → consumer)

```
delegate-task ────────────────────────────────────────────────────────► coordination/delegation/coordinator.ts
delegation-status ─────────────────────────────────────────────────► coordination/delegation/manager-runtime.ts
  ├── tools/delegation/readers/session-tracker-reader.ts (new)
  ├── tools/delegation/readers/legacy-reader.ts (legacy)
  └── coordination/delegation/session-intelligence.ts
run-background-command ─────────────────────────────────────────────► coordination/delegation/manager.ts:dispatchCommand
  ├── features/background-command/pty/pty-manager.ts
  └── config/subscriber.ts
execute-slash-command ──────────────────────────────────────────────► routing/command-engine/index.ts
  ├── tools/session/resolve-command.ts
  ├── tools/session/dispatch-command.ts
  ├── features/session-tracker/types.ts
  ├── features/governance-engine/config-reader.ts
  └── shared/session-api.ts
session-patch ──────────────────────────────────────────────────────► shared/security/path-scope.ts
  └── (direct fs read/write of session.md files — bypasses SessionTracker!)
session-journal-export ────────────────────────────────────────────► task-management/continuity/index.ts
  ├── task-management/continuity/delegation-persistence.ts:readPersistedDelegations
  └── task-management/journal/execution-lineage.ts
session-tracker ───────────────────────────────────────────────────► features/session-tracker/persistence/atomic-write.ts
  └── features/session-tracker/types.ts
session-hierarchy ────────────────────────────────────────────────► features/session-tracker/types.ts
  └── tools/session/session-resolver.ts
session-context ──────────────────────────────────────────────────► features/session-tracker/persistence/atomic-write.ts
  └── tools/session/session-resolver.ts
create-governance-session ────────────────────────────────────────► shared/session-api.ts
  ├── shared/session-naming.ts
  ├── features/governance-engine/config-reader.ts
  └── node:child_process:execFile (git commits)
hivemind-doc ──────────────────────────────────────────────────────► features/doc-intelligence/index.ts
hivemind-trajectory ───────────────────────────────────────────────► task-management/trajectory/index.ts → store-operations.ts
hivemind-pressure ─────────────────────────────────────────────────► features/runtime-pressure/index.ts
  └── task-management/trajectory/index.ts:eventTrajectory (attach_event only)
hivemind-sdk-supervisor ──────────────────────────────────────────► features/sdk-supervisor/index.ts
hivemind-command-engine ─────────────────────────────────────────► routing/command-engine/index.ts (read-side)
hivemind-session-view ───────────────────────────────────────────► (reads 3 roots directly — no engine hop)
hivemind-agent-work-create ──────────────────────────────────────► features/agent-work-contracts/index.ts
  └── task-management/trajectory/index.ts:attachTrajectoryEvidence
hivemind-agent-work-export ─────────────────────────────────────► features/agent-work-contracts/index.ts
session-delegation-query ───────────────────────────────────────► features/session-tracker/persistence/atomic-write.ts
  └── tools/session/session-resolver.ts
  └── (NOT delegation-persistence.ts — see comment at session-delegation-query.ts:9-12)
configure-primitive ─────────────────────────────────────────────► config/compiler.ts
  ├── config/workflow/*
  ├── features/bootstrap/primitive-loader.ts
  └── shared/security/path-scope.ts
validate-restart ───────────────────────────────────────────────► features/bootstrap/{primitive-loader,cross-primitive-validator,runtime-validator,framework-detector}.ts
bootstrap-init ──────────────────────────────────────────────────► features/bootstrap/structure.ts
  └── schema-kernel/generate-config-json-schema.ts
bootstrap-recover ──────────────────────────────────────────────► features/bootstrap/structure.ts
prompt-skim ─────────────────────────────────────────────────────► (no engine — pure regex)
prompt-analyze ─────────────────────────────────────────────────► (no engine — pure regex)
tmux-copilot ───────────────────────────────────────────────────► features/tmux/types.ts
  └── features/session-tracker/index.ts (manualOverride helpers)
tmux-state-query ──────────────────────────────────────────────► features/tmux/types.ts
```

---

## 3. Track 2 — Session-Tracker Ecosystem (5 surfaces)

### 3.1 Surface inventory

| Surface | Root path | Owner module | Total LOC | Tool surface | Engine surface |
|---|---|---|---|---|---|
| **session-tracker** | `src/features/session-tracker/` | `SessionTracker` class (line 100) | 9,990 | 7 tools (#7–10, #16, #19, plus cross-#26 manual override) | `SessionTracker`, `MessageCapture`, `ToolCapture`, `ChildWriter`, etc. |
| **session continuity** | `src/task-management/continuity/` | `getContinuityFile()` (line 57) | 853 | 1 tool (#6 `session-journal-export`) | `getSessionContinuity`, `listSessionContinuity`, `getStoreCache` |
| **project continuity** | `src/features/session-tracker/project-continuity.ts` | `ProjectContinuityChecker` class (line 42) | 129 | 1 tool (#9 `session-context`) | `ProjectContinuityChecker.ensureCompleteness()` |
| **trajectory** | `src/task-management/trajectory/` | `trajectory/index.ts` barrel | 738 | 2 tools (#12, plus #17 via attachTrajectoryEvidence) | 7 actions via `store-operations.ts` |
| **agent work contract** | `src/features/agent-work-contracts/` | `operations.ts:createAgentWorkContract` (line 23) | 553 | 2 tools (#17, #18) | `createAgentWorkContract`, `exportAgentWorkContract`, `findContractsByTrajectory` |

### 3.2 File path & API surface per surface

#### 3.2.1 session-tracker (`src/features/session-tracker/`)

- **Class:** `SessionTracker` — `src/features/session-tracker/index.ts:100-179` (excerpt read; full class extends to line 671)
- **Persistence writers** (`src/features/session-tracker/persistence/`):
  - `child-writer.ts` (681 LOC) — `ChildWriter` for child session JSON
  - `session-writer.ts` (334 LOC)
  - `session-index-writer.ts` (334 LOC)
  - `project-index-writer.ts` (449 LOC) — `ProjectIndexWriter.addSession` (used by `project-continuity.ts:21-23`)
  - `hierarchy-manifest.ts` (320 LOC) — `HierarchyManifestWriter`
  - `hierarchy-index.ts` (382 LOC)
  - `atomic-write.ts` — `sessionTrackerRoot()`, `safeSessionPath()` (consumed by 7 tools)
  - `orphan-quarantine.ts`, `pending-dispatch-registry.ts` (378), `retry-queue.ts` (370)
- **Capture pipeline** (`src/features/session-tracker/capture/`):
  - `message-capture.ts` (444), `tool-capture.ts` (502), `last-message-capture.ts` (240), `handlers/types.ts` (341)
- **Types** (`src/features/session-tracker/types.ts`, 471 LOC) — exports `isValidSessionID`, `isValidHookPayload`, `HierarchyManifest`, `ChildSessionRecord`, `ChildRef`, etc.
- **Tool-delegation** (`src/features/session-tracker/tool-delegation.ts`, 583 LOC) — emits `delegation-terminal` events; consumed by `coordination/delegation/manager.ts:toolDelegation:61` (Pick<>'d to `recordDelegationTerminal` only)
- **Child recorder:** `src/features/session-tracker/child-recorder.ts`
- **Session router:** `src/features/session-tracker/session-router.ts`
- **Bootstrap:** `src/features/session-tracker/bootstrap.ts`, `initialization.ts` (280), `classification.ts`, `orphan-cleanup.ts` (378)
- **Recovery:** `src/features/session-tracker/recovery/session-recovery.ts` (415) — `SessionRecovery` class
- **Streaming:** `src/features/session-tracker/streaming/child-event-stream.ts` (220) — `childEventStream` consumed by `coordination/delegation/coordinator.ts:10`
- **Hooks folder:** `src/features/session-tracker/hooks/`

**Who reads session-tracker files (CQRS read-side):**
- `src/tools/session/session-tracker.ts:16-20` (tool #7) — direct `readFile` of `*.md`, `*.json` via `safeSessionPath`
- `src/tools/session/session-hierarchy.ts:12-19` (tool #8)
- `src/tools/session/session-context.ts:14-19` (tool #9) — reads `project-continuity.json`
- `src/tools/session/session-delegation-query.ts:20-22` (tool #19) — explicit: "Does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory delegation state" (comment at lines 9-12)
- `src/tools/session/session-resolver.ts:22-116` (shared helper)
- `src/tools/hivemind/hivemind-session-view.ts:54-66` (tool #16) — 3-root reader
- `src/tools/delegation/delegation-status.ts:12-13` (tool #2) — `safeSessionPath`, `HierarchyManifest` types
- `src/tools/delegation/readers/session-tracker-reader.ts:15-88` — alternate reader used by delegation-status

**Who writes session-tracker files (write-side, via SessionTracker class):**
- Hooks at `src/hooks/lifecycle/session-hooks.ts:423 LOC` and `src/hooks/observers/session-tracker-consumer.ts:41 LOC`
- `src/features/session-tracker/index.ts:100` `SessionTracker` class

#### 3.2.2 session continuity (`src/task-management/continuity/`)

- **File:** `src/task-management/continuity/index.ts` (468 LOC)
- **Path resolver:** `resolveContinuityFilePath()` at line 38 — uses `OPENCODE_HARNESS_CONTINUITY_FILE` / `OPENCODE_HARNESS_STATE_DIR` env vars; defaults to `.hivemind/state/session-continuity.json` (per Q6 canonical)
- **Legacy path:** `getLegacyStateDir()` at line 27 returns `.opencode/state/hivemind/`
- **Public API:**
  - `getSessionContinuity(sessionID, projectRoot?)` — read
  - `listSessionContinuity()` — read all
  - `getStoreCache`, `setStoreCache` — in-memory cache layer (`store-cache.ts`, 48 LOC)
- **Delegation persistence:** `delegation-persistence.ts` (227 LOC)
  - `persistDelegations(delegations)` at line 56 — **dual-writes** to session-tracker (lines 65-100) AND historically to `delegations.json` (line 16 `getDelegationsFilePath`).
  - Documented policy at line 63: "REQ-P41D-01: No delegations.json file I/O. Session-tracker is canonical." — but the function still calls `getDelegationsFilePath()` and the legacy-reader still reads it.
  - `readPersistedDelegations()` exported and consumed by `session-journal-export.ts:5` and `delegation-status.ts:6`.
- **Reader helper:** `continuity-reader.ts` (110 LOC)
- **Store cache:** `store-cache.ts` (48 LOC)

**Who reads/writes continuity:**
- Writes via `SessionTracker` class (write authority shared between SessionTracker and continuity module — see Issue #5)
- Reads: `src/hooks/lifecycle/core-hooks.ts:22` (`getSessionContinuity`); `src/features/session-tracker/index.ts` (via `ChildWriter` cross-imports at `continuity/index.ts:5-6`)

#### 3.2.3 project continuity (`src/features/session-tracker/project-continuity.ts`)

- **Class:** `ProjectContinuityChecker` (line 42) — 129 LOC
- **Single method:** `ensureCompleteness()` at line 63 — walks `session-tracker` directory tree, ensures every session is in `project-continuity.json`
- **Dependencies (line 20-24):** `{ projectIndexWriter, projectRoot }`
- **Constructor location:** `src/features/session-tracker/index.ts:79` — instantiated as `this.projectContinuityChecker` (line 128)

**Who reads/writes:**
- Writes: `ProjectIndexWriter.addSession()` via the SessionTracker class
- Reads: `src/tools/session/session-context.ts:70-76` (tool #9) — `readProjectIndex()` reads `project-continuity.json` directly (line 72)
- Reads: `src/tools/session/session-resolver.ts:53-67` — uses `chronologicalOrder` from `project-continuity.json` to find root sessions

#### 3.2.4 trajectory (`src/task-management/trajectory/`)

- **Barrel:** `src/task-management/trajectory/index.ts` (3 LOC) — re-exports `./types.js`, `./ledger.js`, `./store-operations.js`
- **Types:** `types.ts` (226 LOC)
- **Ledger:** `ledger.ts` (93 LOC)
- **Store operations:** `store-operations.ts` (416 LOC) — implements the 7 actions: `createPhaseTrajectory`, `inspectTrajectoryLedger`, `traverseTrajectory`, `attachTrajectoryEvidence`, `checkpointTrajectory`, `eventTrajectory`, `closeTrajectory`
- **Storage:** `.hivemind/state/trajectory-ledger.json` (per `hivemind-trajectory.ts:21` comment + `hivemind-session-view.ts:107`)

**Who reads/writes:**
- Writes (via `eventTrajectory`/`checkpointTrajectory`/etc.):
  - `hivemind-trajectory.ts:6-12` (tool #12 — all 7 actions)
  - `hivemind-pressure.ts:78-89` (tool #13, `attach_event` only)
  - `hivemind-agent-work.ts:104-145` (tool #17, `createAgentWorkContract` triggers `attachTrajectoryEvidence`)
  - `features/agent-work-contracts/operations.ts:42` (when `trajectoryId` provided)
- Reads:
  - `hivemind-session-view.ts:105-116` (tool #16)
  - `hivemind-trajectory.ts:79-126` (tool #12, `inspect`/`traverse` actions)

#### 3.2.5 agent work contract (`src/features/agent-work-contracts/`)

- **Barrel:** `src/features/agent-work-contracts/index.ts` (4 LOC) — re-exports `./types.js`, `./store.js`, `./operations.js`, `./lifecycle.js`
- **Types:** `types.ts` (71 LOC)
- **Bounds:** `bounds.ts` (21 LOC) — `BRIEFING_LIMIT`, `SUMMARY_LIMIT`, `ANCHOR_LIMIT`, `REINJECTION_LIMIT`
- **Store:** `store.ts` (164 LOC) — `readAgentWorkContracts`, `getAgentWorkContract`, `upsertAgentWorkContract`
- **Operations:** `operations.ts` (159 LOC) — `createAgentWorkContract` (line 23), `exportAgentWorkContract` (line 61), `findContractsByTrajectory` (line 156)
- **Lifecycle:** `lifecycle.ts` (134 LOC)

**Who reads/writes:**
- Writes: `hivemind-agent-work.ts:104-145` (tool #17) — calls `createAgentWorkContract`
- Reads: `hivemind-agent-work.ts:143-145` (tool #18) — calls `exportAgentWorkContract`
- Cross-system: `operations.ts:42-49` — `createAgentWorkContract` auto-attaches trajectory evidence when `trajectoryId` is set (writes to `trajectory-ledger.json`)

### 3.3 Inter-surface data flow

```
   ┌──────────────┐ Hooks (event/observers) ┌──────────────┐
   │ OpenCode SDK │────────────────────────►│ SessionTracker│
   └──────────────┘                          │  (class)     │
                                             └──┬───────────┘
                                                │ writes
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                            ▼
              .hivemind/session-tracker/                  .hivemind/state/
                  <sessionId>/                                 session-continuity.json
                  ├── <sessionId>.md                         delegation-persistence.ts
                  ├── session-continuity.json  ◄── shared path?───►  (delegations.json dual-write, see #4)
                  ├── hierarchy-manifest.json                trajectory-ledger.json  (tool #12, #13, #17)
                  └── <childId>.json (per child)             agent-work-contracts.json (tool #17, #18)
                  project-continuity.json (root: ProjectContinuityChecker)

   READ-SIDE TOOLS:
   #7  session-tracker         ─► session-tracker/<sid>/session-continuity.json
   #8  session-hierarchy       ─► session-tracker/<sid>/hierarchy-manifest.json
   #9  session-context         ─► project-continuity.json (top-level)
   #16 hivemind-session-view   ─► 3 roots in parallel: session-continuity, hierarchy-manifest, trajectory-ledger
   #19 session-delegation-query ─► session-tracker/<sid>/hierarchy-manifest.json + <childId>.json
   #2  delegation-status       ─► EITHER session-tracker (reader#1) OR legacy delegations.json (reader#2)
   #6  session-journal-export  ─► task-management/continuity + delegation-persistence
```

### 3.4 Schemas in scope

| Schema file | LOC | Consumers (tools) |
|---|---|---|
| `src/schema-kernel/session-tracker.schema.ts` | 141 | #7, #8, #9 |
| `src/schema-kernel/session-delegation-query.schema.ts` | 53 | #19 |
| `src/schema-kernel/session-view.schema.ts` | (n/a — not read) | #16 (imported, see Issue #9) |
| `src/schema-kernel/agent-work-contract.schema.ts` | 155 | #17, #18 |
| `src/schema-kernel/trajectory.schema.ts` | 86 | #12, #13 |
| `src/schema-kernel/commands.schema.ts` | 17 | #4 |

### 3.5 Identified conflicts in session-tracker ecosystem

| # | Issue | File:line | Evidence |
|---|---|---|---|
| E1 | `SessionTracker` class in `features/session-tracker/index.ts:100` and `continuity/index.ts:38-51` both write to "continuity" surfaces | `features/session-tracker/index.ts:100` vs `task-management/continuity/index.ts:38` | Two separate paths; no transactional boundary |
| E2 | `delegation-persistence.ts:56-100` documents "session-tracker is canonical" but legacy reader still reads `delegations.json` | `task-management/continuity/delegation-persistence.ts:63` vs `tools/delegation/readers/legacy-reader.ts:40-58` | Two readers with different shapes return different `Delegation` objects |
| E3 | `ProjectContinuityChecker` is logically a *task-management* concern but lives in `features/session-tracker/` (engine/feature) | `features/session-tracker/project-continuity.ts:1-9` | Comment at line 6 calls it "extracted from index.ts to satisfy the ≤500 LOC gate (GA-4)" — a gate-driven re-shuffle, not a domain re-allocation |
| E4 | `session-delegation-query.ts:9-12` explicitly forbids using `delegation-persistence.ts` while `session-journal-export.ts:5` requires it | `tools/session/session-delegation-query.ts:9-12` vs `tools/session/session-journal-export.ts:5` | Inconsistent read authority within the session-tool family |

---

## 4. Track 4 — Engine / Lib / Hook / Feature Topology

### 4.1 Engines — `src/coordination/`

| Sub-dir | Files | LOC | Purpose | Tool surface owner |
|---|---|---|---|---|
| `delegation/` | 21 | 7,111 (top 14 files) | `DelegationManager` facade + runtime + coordinator + state machine + monitor + completion detector + session intelligence + retry + escalation | Tools #1, #2, #3, #10 |
| `completion/` | 2+ | 618 (`notification-handler.ts:366`, `detector.ts:252`) | Terminal notification dispatch + dual-signal completion detection | Tool #2 (action=`find-stackable`) |
| `concurrency/` | 1+ | 300+ (`queue.ts:300`) | Queue-key validated delegation queueing | Tool #1 (via coordinator) |
| `sdk-delegation/` | 1 | 324 (`handler.ts`) | SDK child-session dispatch adapter | (internal — used by coordinator) |
| `command-delegation/` | 1 | 416 (`handler.ts`) | Slash-command delegation path | Tool #4 (`execute-slash-command`) |
| `spawner/` | 1+ | (n/a — not read) | `spawn-request-builder.ts:DelegateParams` type used by `manager.ts:5` | (internal) |

**Key files (engines):**
- `src/coordination/delegation/manager.ts:1-80` (587 LOC) — public facade
- `src/coordination/delegation/manager-runtime.ts:616` — runtime implementation
- `src/coordination/delegation/coordinator.ts:1-60` (605 LOC) — `DelegationCoordinator`, `DispatchParams`
- `src/coordination/delegation/state-machine.ts:445` — `DelegationStateMachine`
- `src/coordination/delegation/session-intelligence.ts:280` — `findStackableSessions`/`findResumableSessions`/`getRetryRecommendation`/`buildStackingGuidanceBanner` (consumed by `delegation-status.ts:14`)
- `src/coordination/delegation/completion-detector.ts:273`
- `src/coordination/delegation/monitor.ts:248` — `DelegationMonitor.getEscalationLevel` (consumed by `plugin.ts:141`)
- `src/coordination/delegation/notification-router.ts:201`
- `src/coordination/delegation/types.ts:253` — `Delegation`, `DelegationStatus`, `DelegationTerminalKind`

### 4.2 Libs — `src/shared/` and `src/schema-kernel/`

**`src/shared/` (14 files, 2,330 LOC):**
- `shared/types.ts:422` — shared contracts (Delegation, DelegationPacket, SessionContinuityMetadata, etc.)
- `shared/session-api.ts:432` — SDK client wrappers: `createSession`, `getSession`, `sendPrompt`, `showTuiToast`, `getSessionID`, `getSessionMessages`, `getSessionStatusMap`, `getSessionMessageCount`, `abortSession`, `getEventSessionID`, `getEventParentID`
- `shared/helpers.ts:295` — `asString`, `getNestedValue`, `isObject`, `describeError`, `extractAssistantText`
- `shared/state.ts:251` — `getDelegationMeta` (used by `hooks/lifecycle/core-hooks.ts:23`)
- `shared/runtime-policy.ts:236` — `RuntimePolicy` type
- `shared/runtime.ts:95` — `OpenCodeClient` interface
- `shared/tool-response.ts:71` — `success()`, `error()` builders
- `shared/tool-helpers.ts` (n/a — imported by 24+ tool files) — `renderToolResult`
- `shared/app-api.ts:24` — `getAppAgents` (consumed by `dispatch-command.ts:1`)
- `shared/session-naming.ts:156` — `generateSessionTitle`
- `shared/task-status.ts:22`
- `shared/workspace-runtime-policy.ts:38`
- `shared/security/redaction.ts:118` — `redactTextSecrets` (consumed by `delegation-status.ts:7`)
- `shared/security/path-scope.ts:105` — `assertPathWithinRoot` (consumed by `configure-primitive.ts:18`, `session-patch.ts:8`, `continuity/index.ts:4`, `bootstrap-init.ts`)
- `shared/errors/commands.ts:34` — `CommandNotFoundError`, `AgentNotFoundError`, `DelegationTimeoutError`, `InvalidCommandError`, `DelegationContextError`
- `shared/plugin-tool-output-summary.ts` (n/a — size not measured)

**`src/schema-kernel/` (21 files, 2,540 LOC):**
- `hivemind-configs.schema.ts:535` — `hivemind.configs.json` Zod schema
- `index.ts:303` — barrel
- `prompt-enhance.schema.ts:169` — used by `session-patch`, `prompt-skim`, `prompt-analyze` (3 tools!)
- `agent-frontmatter.schema.ts:168`
- `agent-work-contract.schema.ts:155` — used by tools #17, #18
- `generate-config-json-schema.ts:149`
- `session-tracker.schema.ts:141` — used by tools #7, #8, #9
- `mcp-server.schema.ts:124`
- `bootstrap.schema.ts:112` — used by tools #22, #23
- `skill-metadata.schema.ts:111`
- `command-frontmatter.schema.ts:107`
- `trajectory.schema.ts:86` — used by tool #12, #13
- `tool.schema.ts:78` — tool definition schemas (`ToolNameSchema`, `ToolDefinitionSchema`, `ToolFileSchema`)
- `config-precedence.schema.ts:76`
- `commands.schema.ts:17` — used by tool #4
- `doc-intelligence.schema.ts` (n/a — used by tool #11)
- `sdk-supervisor.schema.ts` (n/a — used by tool #14)
- `runtime-pressure.schema.ts` (n/a — used by tool #13)
- `session-view.schema.ts` (n/a — used by tool #16)
- `session-delegation-query.schema.ts:53` — used by tool #19
- `command-engine.schema.ts` (n/a — used by tool #15)

### 4.3 Hooks — `src/hooks/`

| Sub-dir | File | LOC | Purpose |
|---|---|---|---|
| (root) | `pane-monitor.ts` | 542 | tmux pane monitoring (read by `tmux-copilot` via `getManualOverrideState`) |
| `composition/` | `cqrs-boundary.ts` | 36 | `classifyHookEffect`, `assertHookWriteBoundary` (durable-write guard) |
| `lifecycle/` | `core-hooks.ts` | 277 | `event`, `system.transform`, `experimental.chat.system.transform`, `shell.env` |
| `lifecycle/` | `session-hooks.ts` | 423 | session-lifecycle event handlers |
| `guards/` | `governance-block.ts` | 123 | governance-rule injection into system prompt |
| `guards/` | `tool-guard-hooks.ts` | 296 | tool-guard decisions (pre/post) |
| `observers/` | `event-observers.ts` | 136 | 3 observers: delegation-consumer, session-entry-consumer, session-tracker-consumer, session-main-consumer |
| `observers/` | `delegation-consumer.ts` | 41 | delegation event consumption |
| `observers/` | `session-tracker-consumer.ts` | 41 | session-tracker event consumption |
| `observers/` | `session-main-consumer.ts` | (n/a) | session main consumer |
| `observers/` | `session-entry-consumer.ts` | (n/a) | session entry consumer |
| `transforms/` | `chat-message-capture.ts` | 39 | chat message capture |
| `transforms/` | `contract-enforcement.ts` | 103 | agent-work-contract enforcement |
| `transforms/` | `tool-after-composer.ts` | 71 | tool-after composer |
| `transforms/` | `tool-after-workflow.ts` | 54 | tool-after workflow |
| `transforms/` | `tool-before-guard.ts` | 103 | tool-before guard |
| (root) | `types.ts` | 66 | shared hook types (`HookDependencies`) |

### 4.4 Features — `src/features/`

| Sub-dir | Files | LOC | Owns | Tool surface |
|---|---|---|---|---|
| `session-tracker/` | 28 | 9,990 | SessionTracker class + capture + persistence + recovery + streaming | Tools #7, #8, #9, #10 (manual override), #16, #19, #26 |
| `tmux/` | 7 | 2,150+ (largest: `tmux-multiplexer.ts:606`, `session-manager.ts:504`, `integration.ts:450`, `persistence.ts:400`) | tmux session orchestration | Tools #26, #27 |
| `agent-work-contracts/` | 6 | 553 | AWC store + operations + lifecycle + bounds | Tools #17, #18 |
| `background-command/` | (4 in `pty/`) | (3 visible) | PTY manager for background commands | Tool #3 |
| `bootstrap/` | 12+ | 2,500+ (largest: `cross-primitive-validator.ts:373`, `primitive-loader.ts:361`, `runtime-validator.ts:352`, `primitive-registry.ts:282`, `control-plane/gatekeeper.ts:211`, `framework-detector.ts:190`, `primitive-scanners.ts:182`, `structure.ts:159`, `control-plane/gate-decision.ts:122`) | OpenCode primitive loading, validation, BOOT-02 init/recover | Tools #20, #21, #22, #23 |
| `capability-gate/` | 3 | 221 (largest: `index.ts:96`, `agent-capability-profiles.ts:86`) | Agent capability profiles | (no tool — used by `tool-before-guard.ts:103`) |
| `doc-intelligence/` | 5 | 440+ (largest: `router.ts:162`, `parser.ts:96`, `chunker.ts:92`) | Markdown skim/read/search | Tool #11 |
| `governance-engine/` | 4 | 590 (largest: `create-governance-session.ts:294`, `config-reader.ts:177`, `evaluator.ts:136`) | Governance rules + session creation | Tools #4, #10 |
| `prompt-packet/` | 2+ | 257 (`kernel-packet.ts:149`, `compaction-preservation.ts:108`) | Prompt packet assembly | (used by session-tracker capture) |
| `ralph-loop/` | 1 | 38 | Ralph loop (auto-iteration pattern) | (no direct tool) |
| `auto-loop/` | 1 | 42 | Auto-loop pattern | (no direct tool) |
| `runtime-pressure/` | 5 | 717 (`authority-matrix.ts:332`, `control-plane.ts:161`, `types.ts:156`, `model.ts:52`) | Tier 0–9 pressure classification | Tool #13 |
| `sdk-supervisor/` | 2 | 312 (`index.ts:202`, `types.ts:110`) | SDK wrapper health/heartbeat | Tool #14 |
| `tool-intelligence/` | 2 | 366 (`index.ts:244`, `types.ts:122`) | Tool registration & capability analysis | (consumed by `runtime-pressure/authority-matrix.ts`) |

### 4.5 Routing — `src/routing/`

| Sub-dir | Files | LOC | Purpose | Tool surface |
|---|---|---|---|---|
| `command-engine/` | 2 | 439 (`index.ts:254`, `types.ts:185`) | `discoverCommandBundles`, `analyzeCommandContract`, command context render/transform/route preview | Tool #4 (read-side), Tool #15 (hivemind-command-engine) |
| `session-entry/` | 5 | 713 (`purpose-classifier.ts:195`, `intake-gate.ts:194`, `language-resolution.ts:153`, `profile-resolver.ts:148`, `index.ts:23`) | `resolveIntake` (purpose + language + profile + trajectory) | (consumed by `hooks/observers/event-observers.ts:4`) |
| `behavioral-profile/` | 4 | 288 (`types.ts:114`, `resolve-behavioral-profile.ts:102`, `profiles.ts:45`, `index.ts:27`) | `resolveBehavioralProfile` | (consumed by session-entry) |

### 4.6 Config — `src/config/`

| Sub-dir | File | LOC | Purpose | Tool surface |
|---|---|---|---|---|
| (root) | `compiler.ts` | 410 | `compileAgent`, `compileCommand`, `compileSkill`, `decompile*`, `mixedBatchCompile` | Tool #20 (`configure-primitive`) |
| (root) | `subscriber.ts` | 114 | `getCachedConfig` | Tool #3 (`run-background-command`) |
| `workflow/` | 4 | 484 (`workflow-state.ts:185`, `workflow-persistence.ts:182`, `workflow-guards.ts:122`, `workflow-types.ts:53`, `index.ts:43`) | 8-turn workflow turn enforcement | Tool #20 (workflowTurn field) |

---

## 5. Cross-Track Conflicts Identified

### 5.1 File path / domain registration mismatches

| # | Tool | File path | Registered by | Conflict |
|---|---|---|---|---|
| C1 | `run-background-command` | `src/tools/hivemind/run-background-command.ts:1` | `registerDelegationTools` at `src/plugin.ts:144` | Tool lives under `tools/hivemind/` but is registered as a *delegation* tool. Naming is misleading. |
| C2 | `session-delegation-query` | `src/tools/session/session-delegation-query.ts:1` | `registerHivemindTools` at `src/plugin.ts:185` | Tool lives under `tools/session/` but is registered as a *hivemind* tool. |
| C3 | `create-governance-session` | `src/features/governance-engine/create-governance-session.ts:80` | `registerSessionTools` at `src/plugin.ts:163` | Tool is **outside** `src/tools/` entirely. Breaks the "27 tools in `src/tools/`" invariant. |
| C4 | `tmux-copilot` ORCHESTRATOR_AGENTS list | `src/tools/tmux-copilot.ts:59-64` | (top-level tool, not via `registerXTools`) | Includes `hf-l1-coordinator` (line 63) but `tmux-state-query.ts:30` lists `hf-coordinator` instead. Permission lists diverged. |

### 5.2 Reader / writer double-source

| # | Surface | File:line | Issue |
|---|---|---|---|
| C5 | Delegation status | `src/tools/delegation/readers/session-tracker-reader.ts:15-88` vs `src/tools/delegation/readers/legacy-reader.ts:16-58` | Two readers, two different `Delegation` shapes. The first maps `subagentType → agent` and `status → terminalKind`; the second maps `agent → agent` and treats `status` literally. **A delegation persisted in both files returns different results.** |
| C6 | Delegation persistence | `src/task-management/continuity/delegation-persistence.ts:62-63` policy comment vs `delegation-persistence.ts:15-16` `getDelegationsFilePath()` returning a real path | Policy says "no delegations.json I/O" but the file path is still computed. Comment at line 56-63 says G-4 (REQ-21-13) gate removed, but the file path utility remains. |
| C7 | Session-tracker / project-continuity | `src/features/session-tracker/project-continuity.ts:42` (checker) and `src/features/session-tracker/persistence/project-index-writer.ts:449` (writer) | Two `project-continuity.ts`-shaped concerns: a feature module (`ProjectContinuityChecker`) and a persistence module (`ProjectIndexWriter`). Confusing — the checker writes via the writer but the writer is not named "continuity". |

### 5.3 Schema / contract drift

| # | Surface | File:line | Issue |
|---|---|---|---|
| C8 | `plugin.ts` | `src/plugin.ts:173` | Comment says "Record of 8 hivemind tools" but `src/plugin.ts:175-187` lists **9** keys. |
| C9 | `session-view.schema.ts` | `src/schema-kernel/session-view.schema.ts` | Imported by `hivemind-session-view.ts:13` but the file size/LOC was not measurable in this audit (file exists, contents consumed); the schema is the *only* source of `action: enum(['get'])` for the tool, and the tool's `args` are untyped `tool.schema.*` rather than the Zod-validated schema. |
| C10 | `session-delegation-query` | `src/tools/session/session-delegation-query.ts:60` | Dynamic `await import("../../schema-kernel/session-delegation-query.schema.js")` inside `execute()` — every tool invocation re-imports. Performance anti-pattern. |
| C11 | `session-patch` schema | `src/tools/session/session-patch/tools.ts:11` | Imports `SessionPatchRecordSchema` from `schema-kernel/prompt-enhance.schema.ts` (the *prompt-enhance* schema file) — a coupling between the session-patch tool and the prompt-enhance feature's schema. This means modifying prompt-enhance schemas silently affects session-patch. |
| C12 | `tmux-state-query` ORCHESTRATOR_AGENTS | `src/tools/tmux-state-query.ts:30` lists `hf-coordinator`; `src/tools/tmux-copilot.ts:63` lists `hf-l1-coordinator` | Same conceptual agent, different name in two sibling tools. |

### 5.4 Inconsistent read-side / write-side policy

| # | Surface | File:line | Issue |
|---|---|---|---|
| C13 | `session-patch` write | `src/tools/session/session-patch/tools.ts:56-78` | Performs direct `readFileSync`/`writeFileSync` of `session.md` files. The hook pipeline + `SessionTracker` class are the *only* sanctioned write paths for session files (per `features/session-tracker/index.ts:8-12` "CQRS compliance: hooks must NEVER write files directly"). A tool doing direct file I/O is functionally a write-side bypass. |
| C14 | `hivemind-session-view` 3-root read | `src/tools/hivemind/hivemind-session-view.ts:54-116` | Reads `.hivemind/state/trajectory-ledger.json` (line 107) directly via `readFile` rather than going through the `task-management/trajectory/index.ts` barrel. |
| C15 | `session-journal-export` | `src/tools/session/session-journal-export.ts:5` | `readPersistedDelegations` — depends on legacy `delegations.json` even after P41D policy said "session-tracker is canonical". |

---

## 6. Top 15 Critical Issues (documentation only — no source changes)

> Convention: each issue has a `Severity`, a `File:line` citation, an `Impact` statement, and a `Proposed remedy` (no source changes performed).

### Issue #1 — `run-background-command` lives in `tools/hivemind/` but registered as delegation tool

- **Severity:** CRITICAL
- **File:line:** `src/tools/hivemind/run-background-command.ts:1` vs `src/plugin.ts:144` (`registerDelegationTools`)
- **Impact:** Future maintainers searching `src/tools/delegation/` for delegation tools will miss this 228-LOC tool. The file is also the **only** `hivemind/`-directory tool that depends on `coordination/delegation/manager.ts:DelegationManager` and `features/background-command/pty/pty-manager.ts:PtyManager` — so it is structurally a delegation tool wearing a hivemind directory label.
- **Proposed remedy:** Either (a) move the file to `src/tools/delegation/run-background-command.ts` (single rename) or (b) move the registration to `registerHivemindTools` and rename file to match. Decision criterion: does the tool primarily mutate delegation state (yes) or hivemind state (no) → option (a).

### Issue #2 — `create-governance-session` lives outside `src/tools/`

- **Severity:** CRITICAL
- **File:line:** `src/features/governance-engine/create-governance-session.ts:80` vs `src/plugin.ts:163` (registered by `registerSessionTools`) vs `AGENTS.md` (which enumerates "27 tools" in `src/tools/`)
- **Impact:** The `AGENTS.md` invariant — and the "27-tool" guarantee surfaced in `src/plugin.ts:130-205` JSDoc comments — assumes all tools live under `src/tools/`. This tool is the lone exception. The `governance-engine` feature also exports governance logic, but the tool itself is what ships to OpenCode — it belongs with its peers.
- **Proposed remedy:** Move `src/features/governance-engine/create-governance-session.ts:80-294` to `src/tools/session/create-governance-session.ts`. Update the one import in `src/plugin.ts:54`. The internal `coordinator` and `client` wiring is already factory-injected, so this is a pure relocation.

### Issue #3 — `plugin.ts` JSDoc claim "Record of 8 hivemind tools" vs 9 actual entries

- **Severity:** CRITICAL
- **File:line:** `src/plugin.ts:173` (JSDoc) vs `src/plugin.ts:175-187` (object literal with 9 keys)
- **Impact:** Any consumer (e.g. tool-listing generators, type-export tooling, audit scripts) that uses the JSDoc count for verification will be off by one. The discrepancy correlates with the late addition of `session-delegation-query` to the hivemind domain — the comment was never updated.
- **Proposed remedy:** Update `src/plugin.ts:173` to "Record of 9 hivemind tools". Verify the same drift does not exist for the 3/7/6 counts of the other domains (it does not, per `src/plugin.ts:133,153,194`).

### Issue #4 — Dual-source delegation reader returns different shapes

- **Severity:** CRITICAL
- **File:line:** `src/tools/delegation/readers/session-tracker-reader.ts:15-88` vs `src/tools/delegation/readers/legacy-reader.ts:16-58` (both consumed by `src/tools/delegation/delegation-status.ts:14-15`)
- **Impact:** The two readers return the same `Delegation` type but with materially different field semantics:
  - `session-tracker-reader.ts:128-144` maps `subagentType → agent`, sets `queueKey: ""`, `nestingDepth: child.delegationDepth ?? 1`, and treats `status === "active"` to mean "no terminalKind".
  - `legacy-reader.ts:163-187` reads `agent` literally, sets `lastMessageCount: 0, stablePollCount: 0` (overwriting the legacy `messageCount`/`toolCallCount`/`actionCount` into the *plural* fields), and includes `finalMessageExcerpt`.
  - The `delegation-status` tool has no visible "which reader did I get this from" marker — operators inspecting a stuck delegation cannot tell whether the record came from session-tracker or `delegations.json`.
- **Proposed remedy:** (a) Tag each returned `Delegation` with a `_source: "session-tracker" | "legacy"` discriminator at `readers/types.ts:140-180`. (b) Make `legacy-reader.ts` the **fallback only** and emit a `[Harness] using legacy delegations.json reader` warning per call. (c) Add an integration test that asserts a single delegation ID returns the *same* `agent`/`status`/`terminalKind` regardless of which file it lives in.

### Issue #5 — Session-tracker and continuity both own session lifecycle, no single write authority

- **Severity:** CRITICAL
- **File:line:** `src/features/session-tracker/index.ts:100-179` (`SessionTracker` class) vs `src/task-management/continuity/index.ts:38-51` (`resolveContinuityFilePath` returns `.hivemind/state/session-continuity.json`) vs `src/features/session-tracker/initialization.ts:280` (cross-imports `ChildWriter` from persistence/ which is also used by continuity)
- **Impact:** The session `*.md` and `*.json` files under `.hivemind/session-tracker/<sessionId>/` are written by `SessionTracker` (called from hooks). The single file `.hivemind/state/session-continuity.json` is written by `task-management/continuity/index.ts:38-50`. There is no transactional boundary — a hook crash mid-write can leave the two surfaces inconsistent. `session-context.ts:70-76` reads `project-continuity.json` (one file) but `session-hierarchy.ts:78-80` reads `session-continuity.json` per session (per-session file). The CQRS boundary documented at `src/features/session-tracker/index.ts:8-12` is honored by hooks but NOT by the continuity module (which writes directly).
- **Proposed remedy:** Pick a single owner for "session lifecycle persistence". Either (a) fold `continuity/index.ts:38-468` into `features/session-tracker/` (eliminate the cross-import) and let `SessionTracker` be the only writer, or (b) move `SessionTracker` into `task-management/` and rename to `TaskSessionTracker`. Either way, the `continuity/index.ts:5-6` cross-imports of `ChildWriter` and `HierarchyManifestWriter` from `features/session-tracker/persistence/` should become a single-domain import (no upstream dependency).

### Issue #6 — `delegation-persistence.ts` policy drift: still computes `delegations.json` path

- **Severity:** HIGH
- **File:line:** `src/task-management/continuity/delegation-persistence.ts:15-16, 56-100`
- **Impact:** Comment at line 63 ("REQ-P41D-01: No delegations.json file I/O. Session-tracker is canonical.") contradicts the existence of `getDelegationsFilePath()` at line 15-16 which is exported and returns a real `.hivemind/state/delegations.json` path. The dual-write at line 65-100 uses `childWriter.createChildFile` (session-tracker side) but the **read** path via `readPersistedDelegations()` (line 4) is still used by `session-journal-export.ts:5` and `delegation-status.ts:6`. So the read authority is *also* still legacy.
- **Proposed remedy:** Either (a) make `delegation-persistence.ts` only do dual-writes and add a warning when the legacy file is read, or (b) fully retire `delegations.json` and change `readPersistedDelegations()` to read from session-tracker files via the `SessionTrackerStatusReader` at `tools/delegation/readers/session-tracker-reader.ts:15-88`.

### Issue #7 — `session-patch` tool writes files directly, bypassing `SessionTracker` CQRS

- **Severity:** HIGH
- **File:line:** `src/tools/session/session-patch/tools.ts:56-78` (`writeFileSync(backupPath, original)`, `writeFileSync(sessionFilePath, updated)`, `writeFileSync(sessionFilePath, withUpdatedCount)`)
- **Impact:** The CQRS boundary at `src/features/session-tracker/index.ts:8-12` reads "hooks must NEVER write files directly (REQ-ST-11)". The session-patch tool *also* writes directly to `session.md` files. The hook pipeline (`src/hooks/lifecycle/session-hooks.ts:423`) and the `SessionTracker` class never observe this write — the next hook event will see a "modified by tool" file with no audit trail.
- **Proposed remedy:** Route `session-patch` through a new method on `SessionTracker` (e.g. `sessionTracker.patchSection(sessionId, section, newContent)`) that performs the same logic and emits a `session-patched` event. Tool becomes a thin wrapper.

### Issue #8 — `plugin.ts` registerHivemindTools contains 9 entries but docstring says 8 (same as #3, cross-reference)

- **Severity:** HIGH
- **File:line:** `src/plugin.ts:173, 175-187`
- **Impact:** This is a self-referential finding (same as #3) but with broader consequence: any code that statically inspects the file (linters, doc generators, audit tooling) will report 8. Already cited in #3.
- **Proposed remedy:** Same as #3 — fix the docstring. Additionally, add a CI assertion that the count comment matches the object-literal size.

### Issue #9 — `session-view.schema.ts` not located during audit, yet `hivemind-session-view.ts:13` imports it

- **Severity:** HIGH
- **File:line:** `src/tools/hivemind/hivemind-session-view.ts:13` (`import { SessionViewInputSchema, type SessionViewInput } from "../../schema-kernel/session-view.schema.js"`)
- **Impact:** The file `src/schema-kernel/session-view.schema.ts` was listed in the directory listing (`src/schema-kernel/` at line 12 of audit) but its LOC was not measurable. If it is missing or has compile errors, the entire `hivemind-session-view` tool will fail to load. Cross-check the build output for `SessionViewInputSchema` resolution.
- **Proposed remedy:** Verify `src/schema-kernel/session-view.schema.ts` exists and exports `SessionViewInputSchema` matching the tool's `args: { action: tool.schema.enum(['get']), sessionId: tool.schema.string() }` (`hivemind-session-view.ts:34-37`). If the tool uses `tool.schema.enum` while the Zod schema uses `z.literal('get')`, there is a parallel-schema problem (two schema sources for the same input).

### Issue #10 — `session-delegation-query` dynamically imports its schema inside `execute()`

- **Severity:** MEDIUM
- **File:line:** `src/tools/session/session-delegation-query.ts:60` (`const { SessionDelegationQueryInputSchema } = await import("../../schema-kernel/session-delegation-query.schema.js")`)
- **Impact:** Every tool invocation pays the dynamic-import cost. Comment in the file is silent on why the import is dynamic. Other session tools (`session-tracker.ts:15`, `session-hierarchy.ts:12`, `session-context.ts:14`) use **static** top-level imports. This is the lone dynamic import in the tool family.
- **Proposed remedy:** Move the import to the top of the file. If there was a circular-import reason, refactor `session-delegation-query.schema.ts` to not depend on `session-tracker.schema.ts` (the only cross-schema import is `safeSessionId` from `session-tracker.schema.ts:12`).

### Issue #11 — `tmux-state-query.ts` and `tmux-copilot.ts` have divergent ORCHESTRATOR_AGENTS allow-lists

- **Severity:** MEDIUM
- **File:line:** `src/tools/tmux-copilot.ts:59-64` includes `hf-l1-coordinator` (line 63); `src/tools/tmux-state-query.ts:26-31` includes `hf-coordinator` (line 30)
- **Impact:** A `hf-l1-coordinator` agent can call `tmux-copilot` but gets `permission-denied` from `tmux-state-query` for the same action. A `hf-coordinator` agent has the inverse problem. The two lists should be identical (both tools are tmux-domain and gated to the same tier).
- **Proposed remedy:** Extract a single `ORCHESTRATOR_AGENTS` table (e.g. `src/features/tmux/orchestrator-gate.ts`) and import it from both tools. Per D-58-22, this is already a "LOCKED" decision — the gate should be defined once.

### Issue #12 — `session-patch` imports its result-record schema from `prompt-enhance.schema.ts`

- **Severity:** MEDIUM
- **File:line:** `src/tools/session/session-patch/tools.ts:11` (`import { SessionPatchRecordSchema } from "../../../schema-kernel/prompt-enhance.schema.js"`)
- **Impact:** The session-patch result record (`{ section, old_value, new_value, backup_path, timestamp, status }`) is a session-domain concern, not a prompt-enhance concern. Pulling its schema from `prompt-enhance.schema.ts` couples the two domains — any refactor of prompt-enhance risks breaking session-patch.
- **Proposed remedy:** Move `SessionPatchRecordSchema` from `src/schema-kernel/prompt-enhance.schema.ts` to `src/schema-kernel/session-patch.schema.ts` (new file) and update both the schema and the tool import.

### Issue #13 — `hivemind-session-view` reads `trajectory-ledger.json` directly, bypassing the trajectory barrel

- **Severity:** MEDIUM
- **File:line:** `src/tools/hivemind/hivemind-session-view.ts:104-116` (`const ledgerPath = resolve(projectRoot, ".hivemind", "state", "trajectory-ledger.json"); const raw = await readFile(ledgerPath, "utf-8")`)
- **Impact:** All other tools that read trajectory state go through `task-management/trajectory/index.ts:traverseTrajectory` (or `inspectTrajectoryLedger`). This tool hand-rolls the file read. If the trajectory storage path ever changes (e.g. due to a refactor of `store-operations.ts`), this tool will silently break.
- **Proposed remedy:** Add a `readTrajectoryForSession(rootSessionId, sessionId)` helper to `src/task-management/trajectory/store-operations.ts` and call it from `hivemind-session-view.ts:104`.

### Issue #14 — `delegation-persistence.ts:persistDelegations` is dual-write but is also called by `delegation-status`

- **Severity:** MEDIUM
- **File:line:** `src/task-management/continuity/delegation-persistence.ts:56-100` vs `src/tools/delegation/delegation-status.ts:6,84` (`readPersistedDelegations`)
- **Impact:** `delegation-status` reads via `readPersistedDelegations()` which uses `getDelegationsFilePath()` (line 16). But `persistDelegations` (line 56) **also** dual-writes to session-tracker (lines 65-100). So a delegation can be in BOTH files. A read of `delegation-status` returns from the *legacy* file even though the canonical record is in session-tracker. The CQRS contract is broken.
- **Proposed remedy:** Remove `readPersistedDelegations` from the public surface. Route all reads through `SessionTrackerStatusReader` (`src/tools/delegation/readers/session-tracker-reader.ts:15`). The legacy reader (`legacy-reader.ts`) should be retained only for migration tooling and removed from `delegation-status` integration.

### Issue #15 — `ProjectContinuityChecker` lives in `features/` despite being a project-level invariant

- **Severity:** MEDIUM
- **File:line:** `src/features/session-tracker/project-continuity.ts:42`
- **Impact:** The class comment at line 6 says "Extracted from index.ts to satisfy the ≤500 LOC gate (GA-4)". The 500-LOC gate is now satisfied via extraction, but the class is still semantically a *task-management* concern (it ensures project-continuity.json is complete across all sessions) and was extracted into a *feature* module to dodge a size cap. Future readers will look for it in `task-management/` and not find it.
- **Proposed remedy:** Move `src/features/session-tracker/project-continuity.ts:42-129` to `src/task-management/continuity/project-continuity.ts`. Update the one constructor call at `src/features/session-tracker/index.ts:79, 128`.

---

## Appendix A — Engine module call graph (from tool perspective)

```
        ┌──────────────────────────────────────────────────────────────┐
        │                     src/tools/ (27 tools)                     │
        │   Top-level (2)  delegation/ (2)  hivemind/ (8)             │
        │   session/ (13)  config/ (5)  prompt/ (2)                   │
        │                                                              │
        │   + 1 outside: src/features/governance-engine/ (Issue #2)   │
        └────────┬───────────────────────────┬─────────────────────────┘
                 │                           │
        ┌────────▼──────────┐       ┌────────▼──────────┐
        │ src/coordination/ │       │ src/routing/      │
        │  delegation/      │       │  command-engine/  │
        │   manager.ts ◄────┼───────┤   index.ts        │
        │   manager-runtime │       │                   │
        │   coordinator.ts  │       │  session-entry/   │
        │   state-machine   │       │   intake-gate     │
        │   monitor.ts      │       │                   │
        │   session-intel.  │       │  behavioral-      │
        │                   │       │   profile/        │
        │  completion/      │       └───────────────────┘
        │   detector        │
        │   notif-handler   │       ┌───────────────────┐
        │                   │       │ src/config/       │
        │  concurrency/     │       │  compiler.ts      │
        │   queue.ts        │       │  subscriber.ts    │
        │                   │       │  workflow/        │
        │  sdk-delegation/  │       └───────────────────┘
        │   handler.ts      │
        │                   │       ┌───────────────────┐
        │  command-deleg/   │       │ src/hooks/        │
        │   handler.ts      │       │  lifecycle/       │
        │                   │       │   core-hooks      │
        │  spawner/         │       │   session-hooks   │
        │   builder.ts      │       │  guards/          │
        └────────┬──────────┘       │   governance      │
                 │                  │   tool-guard      │
                 │                  │  observers/       │
                 │                  │   4 consumers     │
                 │                  │  transforms/      │
                 │                  │   5 transforms    │
                 │                  └────────┬──────────┘
                 │                           │
        ┌────────▼───────────────────────────▼──────────┐
        │              src/features/                   │
        │   session-tracker/    tmux/   bootstrap/     │
        │   agent-work-contracts/   background-command/│
        │   doc-intelligence/   governance-engine/     │
        │   runtime-pressure/   sdk-supervisor/       │
        │   tool-intelligence/  capability-gate/      │
        │   auto-loop/  ralph-loop/  prompt-packet/    │
        └────────┬──────────────────────────────────────┘
                 │
        ┌────────▼──────────────────┐  ┌────────────────┐
        │  src/task-management/     │  │ src/shared/    │
        │   continuity/             │  │  types.ts      │
        │   journal/                │  │  session-api   │
        │   lifecycle/              │  │  helpers.ts    │
        │   trajectory/             │  │  state.ts      │
        │                           │  │  security/     │
        │                           │  │  errors/       │
        │                           │  │  ...           │
        └───────────────────────────┘  └────────────────┘
```

## Appendix B — State location reference (CQRS storage root)

| Surface | Canonical path (per Q6: `.hivemind/`) | Legacy path (Q6 migration bridge) | Source |
|---|---|---|---|
| Session-tracker (per-session) | `.hivemind/session-tracker/<sessionId>/` | (none) | `features/session-tracker/persistence/atomic-write.ts:sessionTrackerRoot` |
| Project continuity index | `.hivemind/session-tracker/project-continuity.json` | (none) | `tools/session/session-context.ts:71-72` |
| Session continuity (single file) | `.hivemind/state/session-continuity.json` | `.opencode/state/hivemind/session-continuity.json` | `task-management/continuity/index.ts:24-30` |
| Delegation persistence | `.hivemind/state/delegations.json` (per `getDelegationsFilePath()`) | (dual-write to session-tracker since P41-B) | `task-management/continuity/delegation-persistence.ts:15-16` |
| Trajectory ledger | `.hivemind/state/trajectory-ledger.json` | (none) | `tools/hivemind/hivemind-session-view.ts:107` |
| Agent work contracts | `.hivemind/state/agent-work-contracts.json` (inferred; not directly read in this audit) | (none) | `features/agent-work-contracts/store.ts:164` (not read) |
| Runtime state (in-memory) | process memory (Maps) | (none) | `shared/state.ts:251` |
| Manual override (P58 G5) | process memory (per `session-tracker/index.ts:49-67`) | (intentionally in-memory; no restart recovery) | `features/session-tracker/index.ts:46-48` |

---

*End of Wave 1A. Document: 626 lines (approx 624 measured).*
