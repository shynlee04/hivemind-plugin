# HiveMind Init → Bootstrap → .hivemind Trace Index

**Date:** 2026-03-24
**Worktree:** product-detox
**Scope:** Execution flow, folder creation, lifecycle, and state analysis for `hivemind init` through `.hivemind/` runtime artifact production

---

## 1. Init Entry Points

### 1.1 CLI Invocation Chain

#### 1.1.1 Full Execution Flow

```
CLI: hm-init or `hivemind init`
  └─> src/cli.ts::runCli()
        └─> src/cli/init.ts::initProject()
              └─> src/features/runtime-entry/init-project.ts::initProject()
                    ├─> findControlPlanePrimitive('hm-init')
                    ├─> resolveControlPlaneIntakeGate()
                    ├─> findSlashCommandBundle('hm-init')
                    └─> executeSlashCommandBundle()
                          └─> src/commands/slash-command/command-runner.ts::executeSlashCommandBundle()
                                └─> executeRuntimeEntryCommandBundle()
                                      ├─> loadCommandAsset('hm-init')
                                      └─> executeControlPlaneHandler() or recovery handler
                                            └─> src/control-plane/control-plane-handler.ts::executeControlPlaneHandler()
                                                  └─> runInitHandler()
                                                        ├─> createManagedRuntime() [SDK]
                                                        ├─> syncRuntimeSurface()
                                                        │     └─> writes .opencode/plugins/hivemind-context-governance.ts
                                                        ├─> saveBootstrapRuntimeAttachmentSettings()
                                                        │     └─> writes .hivemind/config/runtime-attachment.json
                                                        ├─> markEntryKernelQaPending()
                                                        │     └─> writes .hivemind/config/entry-kernel-state.json
                                                        ├─> bootstrapWorkflowAuthority()
                                                        │     └─> creates .hivemind/project/planning/ structure
                                                        ├─> activateWorkflowTask()
                                                        ├─> bootstrapTrajectoryLedger()
                                                        │     └─> writes .hivemind/state/trajectory-ledger.json
                                                        ├─> createRecoveryCheckpoint()
                                                        │     └─> updates trajectory-ledger.json
                                                        └─> createPlanningGovernanceProjection()
                                                              └─> writes .hivemind/project/planning/trajectory-projections/{id}.json
```

### 1.2 Key Files in Init Chain

#### 1.2.1 Source Files with Line References

| File | Lines | Function | ALIVE/DEAD |
|------|-------|----------|------------|
| `src/cli.ts` | 103–183 | `runCli()` | ALIVE |
| `src/cli/command-routing.ts` | 24–49 | `resolveCliInvocation()` | ALIVE |
| `src/cli/init.ts` | n/a | thin re-export wrapper | ALIVE |
| `src/features/runtime-entry/init-project.ts` | 31–126 | `initProject()` | ALIVE |
| `src/features/runtime-entry/init.handler.ts` | 56–274 | `runInitHandler()` — MAIN BOOTSTRAP | ALIVE |
| `src/commands/slash-command/command-bundles.ts` | 4–22 | `slashCommandBundles` array | ALIVE |
| `src/control-plane/control-plane-registry.ts` | 132–155 | `controlPlanePrimitives` | ALIVE |
| `src/control-plane/control-plane-handler.ts` | 21–32 | `executeControlPlaneHandler()` | ALIVE |
| `src/shared/bootstrap-profile.ts` | 39–59 | `createBootstrapProfile()` | ALIVE |
| `src/plugin/opencode-plugin.ts` | 42–206 | `HiveMindPlugin` | ALIVE |

---

## 2. .hivemind/ Folder Creation

### 2.1 Path Resolution Authority

#### 2.1.1 Path Constants (`src/shared/paths.ts` lines 1–89)

| Constant | Value | Line |
|----------|-------|------|
| `HIVEMIND_DIR` | `'.hivemind'` | 9 |
| `STATE_DIR` | `'state'` | 10 |
| `SESSIONS_DIR` | `'sessions'` | 11 |
| `GRAPH_DIR` | `'graph'` | 12 |
| `CONFIG_DIR` | `'config'` | 13 |
| `ARTIFACTS_DIR` | `'artifacts'` | 14 |
| `CHECKPOINTS_DIR` | `'checkpoints'` | 15 |

#### 2.1.2 `getEffectivePaths()` Return Shape (line 63)

Returns: `root`, `stateDir`, `configDir`, `graphDir`, `sessionsDir`, `sessionInspectionDir`, `projectPlanningDir`, `handoffsDir`, `errorLogDir`

### 2.2 Init-Time Creators

#### 2.2.1 Files Created During `runInitHandler()`

| Creator | Source File | Lines | Creates |
|---------|------------|-------|---------|
| `bootstrapWorkflowAuthority()` | `src/core/workflow-management/workflow-authority.ts` | 145–186 | `.hivemind/project/planning/` |
| `saveTrajectoryLedger()` | `src/core/trajectory/trajectory-store.ledger.ts` | 77 | `.hivemind/state/trajectory-ledger.json` |
| `saveBootstrapRuntimeAttachmentSettings()` | `src/shared/attachment.persistence.ts` | 96, 110 | `.hivemind/config/runtime-attachment.json` |
| `markEntryKernelQaPending()` | `src/shared/entry-kernel-state.ts` | 171–187 | `.hivemind/config/entry-kernel-state.json` |
| `createPlanningGovernanceProjection()` | `src/governance/planning-projection.ts` | 18–63 | `.hivemind/project/planning/trajectory-projections/{id}.json` |

### 2.3 Runtime-Time Creators

#### 2.3.1 Files Created After Init (During Session Lifecycle)

| Creator | Source File | Lines | Creates |
|---------|------------|-------|---------|
| `writeDiagnosticLog()` | `src/sdk-supervisor/diagnostic-log.ts` | 92–104 | `.hivemind/error-log/{sessionId}-{timestamp}.md` |
| `upsertSessionInspectionExport()` | `src/sdk-supervisor/session-inspection.ts` | 76–106 | `.hivemind/session-inspection/{sessionId}/assistant-output.md` |
| delegation-store | `src/delegation/delegation-store.ts` | 56, 124 | `.hivemind/handoffs/{id}.json` |
| turn-output | `src/features/runtime-entry/turn-output.ts` | 151–174 | `.hivemind/project/runtime-turns/{sessionId}/{turnId}.yaml` + `.md` |
| workflow-continuity | `src/features/runtime-entry/workflow-continuity.ts` | 205, 224, 259, 283 | `.hivemind/project/runtime-continuity/{id}.json` |
| contract-store | `src/features/agent-work-contract/contract-store.base.ts` | 91–92 | `.hivemind/agent-work-contract/{id}.json` |

---

## 3. ALIVE vs DEAD vs PHANTOM Status

### 3.1 Classification Definitions

| Status | Meaning |
|--------|---------|
| **ALIVE** | Exists on disk AND referenced in code (creator or consumer) |
| **DEAD** | Exists on disk but NO code references found |
| **PHANTOM** | Documented in AGENTS.md or skills docs but NEVER created by any code path |
| **ORPHANED** | Created by code but referenced path doesn't match actual storage |

### 3.2 ALIVE Paths

#### 3.2.1 Root

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/` | `runInitHandler()` | All tools, hooks, runtime |

#### 3.2.2 Config Directory

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/config/entry-kernel-state.json` | `markEntryKernelQaPending()` | `src/shared/entry-kernel-state.ts` |
| `.hivemind/config/runtime-attachment.json` | `saveBootstrapRuntimeAttachmentSettings()` | `src/shared/attachment.persistence.ts` |

#### 3.2.3 Graph Directory

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/graph/tasks.json` | `bootstrapWorkflowAuthority()` | `hivemind_runtime_status`, `hivemind_task` |

#### 3.2.4 Error Log Directory

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/error-log/` | `writeDiagnosticLog()` | Write-only, not loaded into context |

- 292 files on disk at time of investigation
- Growth rate: ~2 files per minute
- Trigger: `experimental.text.complete` hook on EVERY assistant message

#### 3.2.5 Session Inspection Directory

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/session-inspection/` | `upsertSessionInspectionExport()` | Write-only |

- 62 session directories on disk
- 7 directories reported as empty
- Silent failures: `.catch(() => undefined)`

#### 3.2.6 Project Planning Directory

| Path | Creator | Consumer |
|------|---------|----------|
| `.hivemind/project/planning/` | `bootstrapWorkflowAuthority()` | `hivemind_task` |
| `.hivemind/project/planning/trajectory-projections/` | `createPlanningGovernanceProjection()` | `hivemind_trajectory` |

### 3.3 PHANTOM Paths

#### 3.3.1 Activity Folder (AGENTS.md lines 93–106)

AGENTS.md documents the following subdirectories under `.hivemind/activity/`. Zero TypeScript creator or consumer references found.

| Documented Path | Documented Purpose | Code Reference |
|----------------|-------------------|----------------|
| `.hivemind/activity/handoff/` | Handoff records between agents/sessions | NONE |
| `.hivemind/activity/delegation/` | Delegation packet JSON and return results | NONE |
| `.hivemind/activity/hierarchy/` | Decision hierarchy tracking JSON | NONE |
| `.hivemind/activity/sessions/` | Session continuity state | NONE |
| `.hivemind/activity/codescan/` | Code scan outputs per pass | NONE |
| `.hivemind/activity/agents/` | Per-agent iteration output folders | NONE |
| `.hivemind/activity/longhaul/` | Long-running task state across turns | NONE |
| `.hivemind/activity/pathing/` | Deterministic path records | NONE |
| `.hivemind/activity/state/` | Active workflow state snapshots | NONE |

#### 3.3.2 Pathing System (AGENTS.md line 113)

| Documented Path | Documented Purpose | Code Reference |
|----------------|-------------------|----------------|
| `.hivemind/pathing/active-paths.json` | Deterministic path registry | NONE — zero TypeScript reads/writes |

#### 3.3.3 Paths Defined in `src/shared/paths.ts` but Never Created

| Path | Defined By | Created By |
|------|-----------|------------|
| `.hivemind/sessions/` | `SESSIONS_DIR` constant (line 11) | NEVER — `session-inspection/` used instead |
| `.hivemind/handoffs/` | `getEffectivePaths()` return | `delegation-store.ts` on demand, but directory does not exist |
| `.hivemind/state/tasks.json` | Referenced in paths | NEVER |
| `.hivemind/state/trajectory-ledger.json` | Referenced in paths | Documented as created by `bootstrapTrajectoryLedger()` but `state/` directory found empty |
| `.hivemind/artifacts/` | `ARTIFACTS_DIR` constant (line 14) | NOT CREATED |
| `.hivemind/checkpoints/` | `CHECKPOINTS_DIR` constant (line 15) | NOT CREATED |

### 3.4 DEAD Paths

#### 3.4.1 Orphaned Files and Empty Directories

| Path | Status | Evidence |
|------|--------|----------|
| `.hivemind/context-check.json` | DEAD — orphaned file | No creator or consumer code reference found |
| `.hivemind/agent-work-contract/` | DEAD — empty directory | `contract-store.ts` would create files on demand; directory exists but contains zero files |
| `.hivemind/state/` | DEAD — empty directory | Directory exists, references `trajectory-ledger.json` and `tasks.json`, but contains no files |

---

## 4. Agent / Tool Matrix

### 4.1 Canonical Tools (6)

#### 4.1.1 Source Directory: `src/tools/`

| # | Tool Name | Source Location | Lines | I/O | Targets |
|---|-----------|----------------|-------|-----|---------|
| 1 | `hivemind_runtime_status` | `src/tools/runtime/tools.ts` | 21–35 | READ | trajectory-ledger, tasks, graph, contracts |
| 2 | `hivemind_runtime_command` | `src/tools/runtime/tools.ts` | 41–82 | READ | session.json, trajectory, workflow |
| 3 | `hivemind_task` | `src/tools/task/tools.ts` | 10–42 | READ/WRITE | tasks.json, graph/tasks.json, planning/ |
| 4 | `hivemind_trajectory` | `src/tools/trajectory/tools.ts` | 10–49 | READ/WRITE | trajectory-ledger.json |
| 5 | `hivemind_handoff` | `src/tools/handoff/tools.ts` | 8–54 | CRUD | handoffs/{id}.json |
| 6 | `hivemind_doc` | `src/tools/doc/tools.ts` | 10–35 | READ | workspace docs |

### 4.2 Additional Tools (Feature-Specific)

#### 4.2.1 Source Directory: `src/features/agent-work-contract/tools/`

| # | Tool Name | I/O |
|---|-----------|-----|
| 7 | `hivemind_agent_work_create_contract` | WRITE |
| 8 | `hivemind_agent_work_export_contract` | READ |

### 4.3 Agent Registry

#### 4.3.1 Registry Source

- File: `src/shared/opencode-agent-registry.ts`
- Lines: 40–50
- Constant: `OPENCODE_AGENT_REGISTRY_IDS` — defines 9 agent identifiers

#### 4.3.2 Agent Canonical Sources

- Location: `agents/*.deprecated.md` (9 files)
- Status: LEGACY SOURCE — still actively loaded at runtime
- Note: Document naming uses `*.deprecated.md` suffix but files remain functional

### 4.4 Hooks Interacting with .hivemind/

| Hook | Interaction | Target |
|------|------------|--------|
| `experimental.text.complete` | WRITE | `error-log/`, `session-inspection/` |
| `command.execute.before` | READ | `session.json`, trajectory, workflow |
| `session.compacting` | WRITE (inject) | context packet injection |
| `event` handler | WRITE | recovery checkpoints on `session.compacted` |

### 4.5 Plugin Hook Registration

- Source: `src/plugin/opencode-plugin.ts` lines 42–206
- Registered hooks: 11
- Registered tools: 8

---

## 5. Main Session vs Sub-Session Differences

### 5.1 SessionScope Type Definition

- File: `src/context/prompt-packet/prompt-packet-types.ts`
- Type: `'main' | 'sub-session'`

### 5.2 Behavioral Differences

| Aspect | Main Session | Sub-Session |
|--------|-------------|-------------|
| `SessionState` | `'fresh'`, `'ongoing'`, `'continuation'` | `'sub-session'` |
| `hasHandoff` | `false` unless explicit | Inferred from `parentSessionId` |
| `PressureSignal` | `'steady-state'`, `'trajectory-continuation'` | `'delegated-handoff'` |
| `RuntimeLoadStage` | `'initial'` or `'mid-session'` | `'interdependent'` |
| `WorkflowLoadStrategy` | `'full'` or `'light'` | `'bounded'` |
| `agentMode` | `'primary'` or `'all'` | `'sub'` |
| `invokerClass` | `'main-agent'` | `'sub-agent'` |
| Prompt Tag | `<hivemind-kernel-packet>` | `<hivemind-delegation-packet>` |
| Delegation Posture | main-session owns todo | bounded-minimal-refresh |
| Todo Authority | Main owns todo | main-session-only unless escalated |
| Session Class | `'workflow-execution'` | `'delegated-sub-session'` |
| Skills Bundle | Agent-specific bundle | Agent-specific + `git-continuity-memory` |
| Session Role | `'orchestrate'` | `'specialist'` |
| Task Link Warning | None | `missing-task-link` if no `taskIds` |

### 5.3 Key Source Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/features/session-entry/session-state.ts` | 4–6 | sub-session detection |
| `src/hooks/start-work/start-work-router.ts` | 65 | `hasHandoff` inference |
| `src/hooks/start-work/start-work-router-helpers.ts` | 127–129 | delegated-handoff pressure signal |
| `src/hooks/runtime-loader/runtime-stage.ts` | 15–16 | interdependent stage |
| `src/core/workflow-management/workflow-router.ts` | 4–5 | bounded strategy |
| `src/features/runtime-entry/invocation.ts` | 47, 91 | sub-agent mode |
| `src/context/prompt-packet/prompt-compiler.ts` | 24–30 | distinct packet compilation |
| `src/context/prompt-packet/prompt-packet-renderers.ts` | 7–118 | distinct renderers |
| `src/plugin/skill-exposure-map.ts` | 124–127, 177–185, 212–239 | skill/role differentiation |

### 5.4 Session Folder Structure

- `getSessionPath()` uses the SAME path for all sessions
- Folder structure is FLAT — no per-session or per-scope subdirectories
- Contrast with `.hivemind/session-inspection/` which creates per-session directories

---

## 6. Context Pollution Sources

### 6.1 Ranked by Severity (Highest First)

| Rank | Source | File Count | Size | Growth Rate | Cleanup? | Trigger |
|------|--------|-----------|------|-------------|----------|---------|
| 1 | `.hivemind/error-log/` | 292 files | ~1.3 MB | ~2 files/min | **NO** | `experimental.text.complete` hook on EVERY assistant message |
| 2 | `.hivemind/session-inspection/` | 62 dirs (7 empty) | ~760 KB | Same as above | **NO** | Same trigger; silent failures (`.catch(() => undefined)`) |
| 3 | `.hivemind/project/runtime-continuity/` | O(n) | — | Per session | **NO** | Reads ALL files on each lookup, no pagination |
| 4 | `.hivemind/handoffs/` | — | — | Per delegation | **NO** | `readdir` on every call, no pagination |
| 5 | `.hivemind/project/runtime-turns/` | 2 per turn | — | Per turn | **NO** | No cleanup |
| 6 | `.hivemind/project/planning/trajectory-projections/` | ~5 files | small | Low | **NO** | Minimal |
| 7 | `_deprecated_hive/` skills | 100+ files | — | N/A | **NO** | Zero code references, dead weight |
| 8 | `.hivemind/context-check.json` | 1 file | — | N/A | **NO** | Orphaned, no references |

### 6.2 Missing Primitives

| Feature | Status |
|---------|--------|
| Pruning | DOES NOT EXIST |
| Retention policy | DOES NOT EXIST |
| Age-based deletion | DOES NOT EXIST |
| Size limits | DOES NOT EXIST |

---

## 7. Long-Haul Workflow State

### 7.1 Persistence Layers

#### 7.1.1 Entry Kernel

- File: `.hivemind/config/entry-kernel-state.json`
- Creator: `markEntryKernelQaPending()` — `src/shared/entry-kernel-state.ts` lines 171–187
- Lifecycle states: `uninitialized`, `repair`, `qa-pending`, `ready`, `blocked`

#### 7.1.2 Trajectory Ledger

- File: `.hivemind/state/trajectory-ledger.json`
- Creator: `bootstrapTrajectoryLedger()` — `src/core/trajectory/trajectory-store.ledger.ts` line 77
- Contents: trajectory records, events, checkpoints with `resumeTarget`, recovery log

#### 7.1.3 Workflow Continuity

- Directory: `.hivemind/project/runtime-continuity/`
- Creator: `src/features/runtime-entry/workflow-continuity.ts` lines 205, 224, 259, 283
- Contents: session chain, turn output refs, linked contracts

#### 7.1.4 Agent Work Contracts

- Directory: `.hivemind/agent-work-contract/`
- Creator: `src/features/agent-work-contract/contract-store.base.ts` lines 91–92
- Contents: contracts with task state, compaction preservation

#### 7.1.5 Runtime Attachment

- File: `.hivemind/config/runtime-attachment.json`
- Creator: `saveBootstrapRuntimeAttachmentSettings()` — `src/shared/attachment.persistence.ts` lines 96, 110
- Contents: snapshot of `trajectoryId`, `workflowId`, `taskIds`

#### 7.1.6 Activity Continuity (Skill-Level — NOT Enforced)

| File | Documented In | Code Reference |
|------|---------------|----------------|
| `.hivemind/activity/sessions/continuity.json` | AGENTS.md | NONE — not enforced by code |
| `.hivemind/activity/longhaul/task-state.json` | AGENTS.md | NONE — not enforced by code |

### 7.2 Compaction Flow

```
session.compacting hook
  └─> captures snapshot
  └─> resolves agent work contract
  └─> creates context packet
  └─> injects into compaction

session.compacted event
  └─> createRecoveryCheckpoint() with resumeTarget
```

### 7.3 Recovery Failure Classes

9 defined failure classes:

| # | Class | Description |
|---|-------|-------------|
| 1 | `missing-hivemind` | .hivemind/ root missing |
| 2 | `missing-planning-root` | project/planning/ missing |
| 3 | `missing-state-tasks` | state/tasks.json missing |
| 4 | `missing-graph-tasks` | graph/tasks.json missing |
| 5 | `missing-trajectory-ledger` | trajectory-ledger.json missing |
| 6 | `corrupt-trajectory-ledger` | trajectory-ledger.json unreadable |
| 7 | `missing-task-link` | task reference broken |
| 8 | `unknown-task-link` | task ID not found |
| 9 | `active-trajectory-conflict` | concurrent trajectory detected |

- Assessor: `assessRecoveryState()`
- Repairer: `repairRecoveryState()`

### 7.4 Session Resume Detection

- Continuation keywords: `continue`, `continuation`, `resume`, `pick up`, `last time`, `validated`, `again`
- Assessor: `assessTrajectoryEntrySync()`
- Entry modes: `'attach-active'`, `'resume-closed'`, `'create-new'`, `'refuse-conflict'`

---

## 8. Deterministic Pathing System

### 8.1 Status: PHANTOM

### 8.2 Evidence

| Source | Claim | Code Reality |
|--------|-------|-------------|
| AGENTS.md line 113 | `pathing/active-paths.json` is the deterministic path registry | Zero TypeScript reads/writes found |
| Skill docs (`git-continuity-memory`, `use-hivemind-delegation`, `hivemind-atomic-commit`) | Reference `pathing/active-paths.json` | Zero TypeScript reads/writes found |
| AGENTS.md line 119 | "Agents resolve output locations from `pathing/active-paths.json`" | No code implements this |
| AGENTS.md line 325 | "Shall resolve paths via `getEffectivePaths()`" | 144 grep matches for `getEffectivePaths()` — this is the actual implementation |

### 8.3 Conflict

- **AGENTS.md line 119**: Use `pathing/active-paths.json`
- **AGENTS.md line 325**: Use `getEffectivePaths()`
- **Actual implementation**: `getEffectivePaths()` exclusively (144 grep matches)
- **Conclusion (observation only)**: The `.hivemind/activity/` folder structure is documented intent only — no code implements or references it

---

## 9. dist/ Folder Status

### 9.1 Build Status

- `dist/` does NOT exist in this worktree
- Build has not been run

### 9.2 Expected Output Structure

#### 9.2.1 Package.json Exports

| Export | Target Path | EXISTS? |
|--------|------------|---------|
| Main | `dist/index.js` | MISSING |
| Plugin | `dist/plugin/opencode-plugin.js` | MISSING |
| CLI | `dist/cli.js` | MISSING |

#### 9.2.2 Source-to-Dist Mapping

- 22 subdirectories in `src/` would compile to `dist/`
- Plugin registers 11 hooks and 8 tools (from source analysis)
- CLI commands: `init`, `doctor`, `settings`, `harness`, `sync`

### 9.3 Shipped Assets (npm content, NOT compiled)

| Type | Count | Location |
|------|-------|----------|
| Agent markdown files | 48 files | `agents/*.md` |
| Workflow YAML files | 24 files | `workflows/*.yaml` |
| Skill items | 31 items | `skills/` |

---

## Summary of Evidence

### All File Paths Examined

| File Path | Lines | Role in Investigation |
|-----------|-------|----------------------|
| `src/cli.ts` | 103–183 | CLI entry point, `runCli()` |
| `src/cli/command-routing.ts` | 24–49 | CLI invocation resolution |
| `src/cli/init.ts` | — | Re-export wrapper |
| `src/features/runtime-entry/init-project.ts` | 31–126 | Init project orchestration |
| `src/features/runtime-entry/init.handler.ts` | 56–274 | Main bootstrap handler |
| `src/commands/slash-command/command-bundles.ts` | 4–22 | Command bundle definitions |
| `src/commands/slash-command/command-runner.ts` | — | Command execution |
| `src/control-plane/control-plane-registry.ts` | 132–155 | Control plane primitive registry |
| `src/control-plane/control-plane-handler.ts` | 21–32 | Control plane handler dispatch |
| `src/shared/bootstrap-profile.ts` | 39–59 | Bootstrap profile creation |
| `src/shared/paths.ts` | 1–89 | Path constants and `getEffectivePaths()` |
| `src/shared/attachment.persistence.ts` | 96, 110 | Runtime attachment persistence |
| `src/shared/entry-kernel-state.ts` | 171–187 | Entry kernel state management |
| `src/shared/opencode-agent-registry.ts` | 40–50 | Agent registry definitions |
| `src/core/workflow-management/workflow-authority.ts` | 145–186 | Workflow authority bootstrap |
| `src/core/trajectory/trajectory-store.ledger.ts` | 77 | Trajectory ledger persistence |
| `src/governance/planning-projection.ts` | 18–63 | Planning projection creation |
| `src/sdk-supervisor/diagnostic-log.ts` | 92–104 | Diagnostic log writer |
| `src/sdk-supervisor/session-inspection.ts` | 76–106 | Session inspection export |
| `src/delegation/delegation-store.ts` | 56, 124 | Delegation record persistence |
| `src/features/runtime-entry/turn-output.ts` | 151–174 | Turn output persistence |
| `src/features/runtime-entry/workflow-continuity.ts` | 205, 224, 259, 283 | Workflow continuity chain |
| `src/features/agent-work-contract/contract-store.base.ts` | 91–92 | Agent work contract persistence |
| `src/features/session-entry/session-state.ts` | 4–6 | Sub-session detection |
| `src/hooks/start-work/start-work-router.ts` | 65 | Handoff inference |
| `src/hooks/start-work/start-work-router-helpers.ts` | 127–129 | Delegated-handoff pressure |
| `src/hooks/runtime-loader/runtime-stage.ts` | 15–16 | Runtime load staging |
| `src/core/workflow-management/workflow-router.ts` | 4–5 | Workflow routing strategy |
| `src/features/runtime-entry/invocation.ts` | 47, 91 | Invocation mode classification |
| `src/context/prompt-packet/prompt-packet-types.ts` | — | SessionScope type definition |
| `src/context/prompt-packet/prompt-compiler.ts` | 24–30 | Prompt packet compilation |
| `src/context/prompt-packet/prompt-packet-renderers.ts` | 7–118 | Prompt packet rendering |
| `src/plugin/skill-exposure-map.ts` | 124–127, 177–185, 212–239 | Skill/role exposure mapping |
| `src/plugin/opencode-plugin.ts` | 42–206 | Plugin assembly and hook registration |
| `src/tools/runtime/tools.ts` | 21–35, 41–82 | Runtime tools (status, command) |
| `src/tools/task/tools.ts` | 10–42 | Task tool |
| `src/tools/trajectory/tools.ts` | 10–49 | Trajectory tool |
| `src/tools/handoff/tools.ts` | 8–54 | Handoff tool |
| `src/tools/doc/tools.ts` | 10–35 | Doc tool |
| `AGENTS.md` | 93–106, 113, 119, 325 | Governance documentation |

---

*This document is a pure factual report. No assumptions, conclusions, or recommendations are included. All findings are traceable to specific file paths and line numbers in the codebase.*
