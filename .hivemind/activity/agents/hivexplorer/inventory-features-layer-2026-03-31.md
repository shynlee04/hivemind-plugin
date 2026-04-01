---
title: "Features Layer Inventory — src/features/"
date: 2026-03-31
author: hivexplorer
scope: src/features/**/*.ts (non-test)
git_commit: HEAD
---

# Features Layer Inventory — 2026-03-31

**Scope:** All `.ts` files under `src/features/` (99 non-test files, 11,010 LOC)
**Git commit:** HEAD (2026-03-31)
**Investigator:** hivexplorer (read-only)

---

## Per-Feature Breakdown

### agent-work-contract

**Files (22 non-test):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 18 | Barrel export — re-exports schema, types, hooks |
| `types.ts` | 204 | TypeScript interfaces: ContractStoreOperations, IntentClassifierResult, AnchorPointType, ChainActionEvent, CreateContractInput, UpdateContractInput, UpdateTaskInput |
| `schema/index.ts` | 17 | Schema barrel — re-exports contract, intent, delegation schemas |
| `schema/contract.ts` | 244 | Zod schemas: PurposeClass, DelegationMode, ResponseMode, TaskStatus, Task, UserIntent, WorkflowFrame, ChainActions, Briefing, AnchorPoint, AgentWorkContract, CompactionPreservationPacket |
| `schema/delegation.ts` | 71 | Zod schemas: DelegationStatus, DelegationRecord, HandoffContext, HandoffPacket |
| `schema/intent.ts` | 41 | Zod schemas: IntentSignal, IntentClassification |
| `engine/index.ts` | 24 | Engine barrel — ContractStore, classifyIntent, resolveResponseMode, recordAnchor, ChainExecutor |
| `engine/contract-store.ts` | 15 | Re-export of composed ContractStore from archive module |
| `engine/contract-store.base.ts` | 143 | Abstract base class: directory ops, forward-compat fields, error detection |
| `engine/contract-store.crud.ts` | 146 | CRUD class: create/get/update/delete with file locking (proper-lockfile) |
| `engine/contract-store.archive.ts` | 96 | Archive class: list/archive operations; exports composed ContractStore |
| `engine/contract-store.types.ts` | 34 | Constants: CONTRACT_DIR, ContractStore interface |
| `engine/chain-executor.ts` | 293 | ChainExecutor class (handler registration/dispatch) + dispatchDelegationHandoffPacketAction |
| `engine/intent-classifier.ts` | 158 | Regex-based intent classification: quick-action, research-brainstorm, project-driven |
| `engine/response-mode-resolver.ts` | 56 | Pure function: PurposeClass → ResponseMode mapping |
| `engine/anchor-recorder.ts` | 60 | Records anchor points to contract's anchors array |
| `engine/command-session-contract.ts` | 245 | Links hm-plan/hm-implement command execution to session contracts |
| `hooks/index.ts` | 18 | Hook helpers barrel — event packet extraction, compaction preservation |
| `hooks/agent-work-event-handler.ts` | 88 | Extracts validated event packets from OpenCode events (session.compacted, command.executed) |
| `hooks/compaction-preservation.ts` | 101 | Creates compaction-safe preservation packets from contracts |
| `tools/index.ts` | 19 | Tool factories barrel — create/export/classify tools |
| `tools/create-contract-tool.ts` | 155 | Tool factory: create/update agent-work contract via Zod args |
| `tools/create-contract-tool.schema.ts` | 71 | Tool arg types and DEFAULT_CHAIN_ACTIONS constant |
| `tools/create-contract-tool.helpers.ts` | 90 | Helpers: resolveProjectRoot, createMetadata, askToEditContract, buildCreateContractId |
| `tools/create-contract-tool.normalizers.ts` | 68 | Normalizers for responseMode, workflow, chainActions, briefing, anchors |
| `tools/create-contract-tool.operations.ts` | 150 | Operations: createContract, updateContract with intent classification |
| `tools/export-contract-tool.ts` | 67 | Tool factory: export contract or compaction summary |
| `tools/classify-intent-tool.ts` | 50 | Tool factory: classify raw user intent |

**Total LOC:** 2,847 (non-test)
**Purpose:** Manages agent-work contracts — persistent JSON contracts that govern agent-work interactions including intent classification, workflow framing, chain actions, and compaction preservation.
**Exports:** AgentWorkContractSchema, ContractStore, ChainExecutor, classifyIntent, resolveResponseMode, recordAnchor, createCompactionPreservationPacket, extractAgentWorkEventPacket, 3 tool factories
**Imports from:** `shared/` (tool-response, tool-helpers, keyword-matcher), `delegation/` (delegation-store), `core/` (workflow-management), `commands/` (slash-command types)
**Called by tools:** `hivemind_runtime_command` (via runtime-observability), `hivemind_task` (via workflow), `hivemind_handoff` (via handoff)
**God files:** `schema/contract.ts` (244), `engine/chain-executor.ts` (293), `engine/command-session-contract.ts` (245), `types.ts` (204) — none exceed 300

---

### doc-intelligence

**Files (2):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 1 | Barrel — re-exports doc.ts |
| `doc.ts` | 102 | Feature adapter: executeHivemindDocAction — skim, skim_directory, read, chunk, search on markdown documents |

**Total LOC:** 103
**Purpose:** Document intelligence feature — provides markdown document operations (skim, read sections, chunk, search) by delegating to `intelligence/doc/` layer.
**Exports:** executeHivemindDocAction, DocFeatureResult
**Imports from:** `intelligence/doc/` (readChunked, readSection, searchDocuments, skimDirectory, skimDocument), `tools/doc/types.js` (pressure contracts, tool args)
**Called by tools:** `hivemind_doc` tool (`src/tools/doc/tools.ts`)
**God files:** none

---

### event-tracker

**Files (19 non-test):**
| File | LOC | Purpose |
|------|-----|---------|
| `types.ts` | 380 | Core type definitions: EventType, Importance, Lineage, PurposeClass, TurnType, DelegationMode, DelegationStatus, SessionMeta, TurnMeta, EventEntry, TurnEntry, DelegationRecord, SessionV3, IndexEntry, SynthesisInput, SessionTreeNode |
| `paths.ts` | 178 | Path resolution for all session/event file locations under .hivemind/sessions/ |
| `consolidated-writer.ts` | 442 | V3 session writer — single JSON per session with atomic writes (temp+rename), initSession, addTurn, incrementCounter, updateStatus, linkSubSession |
| `markdown-writer.ts` | 434 | Human-readable events.md generation — append-only turns, tool batches, delegations, diagnostics, TOC generation |
| `session-structure.ts` | 107 | Session structure utilities |
| `classifier/event-classifier.ts` | 119 | Event classification logic |
| `classifier/event-id.ts` | 20 | Event ID generation |
| `classifier/delegation-returned-evidence.ts` | 69 | Delegation returned evidence classification |
| `classifier/writer-adapter.ts` | 93 | Writer adapter for classifier output |
| `parser/counter.ts` | 31 | Counter parsing utilities |
| `parser/delegation-extractor.ts` | 35 | Delegation extraction from session data |
| `parser/header-parser.ts` | 42 | Header parsing utilities |
| `parser/meta-parser.ts` | 50 | Metadata parsing utilities |
| `parser/splitter.ts` | 17 | Content splitting utilities |
| `parser/turn-parser.ts` | 90 | Turn parsing utilities |
| `parser/types.ts` | 58 | Parser type definitions |
| `writers/formatter.ts` | 145 | Output formatting utilities |
| `writers/index-writer.ts` | 146 | Session index writer |
| `writers/synthesizer.ts` | 145 | Session synthesis writer |

**Total LOC:** 2,584 (non-test)
**Purpose:** Session journal and event tracking system — records all session lifecycle events (user messages, assistant output, tool invocations, delegations, compactions) in both JSON (V3 schema) and human-readable markdown formats.
**Exports:** All types, path helpers, consolidated writer API (initSession, addTurn, addEvent, addDiagnostic, incrementCounter, updateStatus, linkSubSession, loadSession, findSessionBySdkId), markdown writer API (initEventsMarkdown, appendTurnToMarkdown, generateTOC, appendToolBatch, appendDelegation, updateSessionTimestamp, appendDiagnosticToMarkdown)
**Imports from:** `shared/paths.js`, `session-journal/hierarchy-writer.js`
**Called by hooks:** `tool-execution-handler.ts`, `compaction-handler.ts`, `text-complete-handler.ts`, `chat-message-handler.ts`, `event-handler.ts`
**Called by tools:** `hivemind_journal` tool (`src/tools/hivemind-journal.ts`)
**God files:** `types.ts` (380), `consolidated-writer.ts` (442), `markdown-writer.ts` (434) — **3 god files**

---

### handoff

**Files (2):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 1 | Barrel — re-exports handoff.ts |
| `handoff.ts` | 271 | Feature adapter: executeHivemindHandoffAction — create, read, list, update, validate, close delegation handoffs with continuity sync |

**Total LOC:** 272
**Purpose:** Delegation handoff management — creates, validates, updates, and closes delegation handoff packets between sessions, syncing with workflow continuity and chain executor dispatch.
**Exports:** executeHivemindHandoffAction, HandoffFeatureContext, HandoffFeatureResult
**Imports from:** `delegation/` (all handoff CRUD), `core/trajectory/` (recordTrajectoryEvent), `agent-work-contract/engine/chain-executor.js` (dispatchDelegationHandoffPacketAction), `runtime-entry/workflow-continuity.js` (upsertWorkflowDelegationContinuityLinkage), `shared/tool-helpers.js`, `tools/handoff/types.js`
**Called by tools:** `hivemind_handoff` tool (`src/tools/handoff/tools.ts`)
**God files:** none

---

### runtime-entry

**Files (24):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 11 | Barrel — re-exports all runtime-entry modules |
| `attachment.ts` | 46 | Barrel — re-exports attachment types, defaults, builder, persistence, snapshot |
| `attachment.types.ts` | 132 | Type definitions: AttachmentCore, RuntimeAuthority, AttachmentProfile, AttachmentFeatures, RuntimeAttachmentSettings, RuntimeBindingsSnapshot, entry kernel types |
| `attachment.builder.ts` | 110 | Kernel builder: normalizeRuntimeAuthority, normalizeOptionalString, mergeStringArray, buildRuntimeAttachmentEntryKernel |
| `attachment.defaults.ts` | 46 | Default factory: getRuntimeAttachmentSettingsPath, defaultRuntimeAttachmentSettings |
| `attachment.persistence.ts` | 144 | Persistence: load/save/bootstrap runtime attachment settings with normalization |
| `snapshot-loader.ts` | 73 | Loads complete runtime bindings snapshot combining settings + trajectory + workflow + health |
| `init.ts` | 25 | Barrel — re-exports init types, helpers, project, handler |
| `init.types.ts` | 57 | InitOptions, InitProjectResult type definitions |
| `init.helpers.ts` | 37 | Helpers: buildInitReport, createRuntimeId |
| `init-project.ts` | 126 | High-level initProject() — resolves intake gates, executes hm-init bundle |
| `init.handler.ts` | 266 | runInitHandler() — bootstraps managed SDK, workflow authority, trajectory ledger, recovery checkpoint, planning projection |
| `doctor.ts` | 150 | runDoctorCommand() + runDoctorHandler() — repairs runtime state, creates recovery checkpoints |
| `harness.ts` | 300 | runHarnessCommand() + runHarnessHandler() — validates runtime attachment, probes server health, writes harness artifacts |
| `command.ts` | 296 | executeRuntimeEntryCommandBundle() — auto-recovery, handler dispatch, turn output export, session contract linkage |
| `settings.ts` | 200 | runSettingsHandler() — profile intake gate resolution, settings update with dashboard proof |
| `invocation.ts` | 106 | Runtime invocation V1 creation: createRuntimeInvocation, resolveRuntimeInvokerClass |
| `instruction-loader.ts` | 148 | Loads command assets from markdown files with YAML frontmatter parsing and contract analysis |
| `turn-output.ts` | 174 | Turn output envelope V1 creation and export (YAML + markdown projections) |
| `handler-shared.ts` | 80 | Shared handler utilities: hasAttachedSdkAuthority, snapshotProfileValidated, resolveEntityBindings, resolveRuntimeIds, createQuestionGateResult |
| `runtime-command-handlers.ts` | 27 | Handler registry map: hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct |
| `workflow-command-handler.ts` | 141 | runPlanHandler, runImplementHandler — workflow command execution with authority checks |
| `workflow-continuity.ts` | 289 | Workflow continuity transactions V1 — upsert, load, delegation linkage across sessions |
| `inspection-command-handler.ts` | 231 | runResearchHandler, runVerifyHandler, runTddHandler, runCourseCorrectHandler — inspection command profiles |
| `nl-first-dispatch.ts` | 86 | NL-first runtime dispatch — route hints for control-plane and workflow commands (currently no-op execution) |

**Total LOC:** 3,000 (non-test)
**Purpose:** Runtime entry point orchestration — handles hm-init, hm-doctor, hm-harness, hm-settings commands; manages runtime attachment lifecycle, auto-recovery, command execution pipeline, turn output export, and workflow continuity transactions.
**Exports:** All attachment types/functions, initProject, runInitHandler, runDoctorCommand, runDoctorHandler, runHarnessCommand, runHarnessHandler, executeRuntimeEntryCommandBundle, runSettingsHandler, createRuntimeInvocation, loadCommandAsset, createTurnOutputEnvelope, exportTurnOutputProjection, runtimeCommandHandlers, runPlanHandler, runImplementHandler, upsertWorkflowContinuityTransaction, upsertWorkflowDelegationContinuityLinkage, maybeExecuteNlFirstRuntimeDispatch
**Imports from:** `core/` (trajectory, workflow-management), `governance/`, `control-plane/`, `commands/slash-command/`, `recovery/`, `shared/` (entry-kernel-state, runtime-attachment, paths, lifecycle-spine, contracts/runtime-status, opencode-agent-registry, opencode-knowledge, bootstrap-profile, keyword-matcher), `sdk-supervisor/`, `tools/hivefiver-setting/`
**Called by tools:** `hivemind_runtime_command` (via runtime-observability), `hivemind_runtime_status` (via runtime-observability)
**God files:** `harness.ts` (300) — **1 god file**

---

### runtime-observability

**Files (3):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 2 | Barrel — re-exports status, sync |
| `status.ts` | 298 | buildHivemindRuntimeStatus() + executeHivemindRuntimeCommand() — runtime status snapshot, capability matrix, command execution with entry decision |
| `sync.ts` | 108 | syncRuntimeSurface() — syncs plugin stub to .opencode/plugins/ and updates opencode.json |

**Total LOC:** 408 (non-test)
**Purpose:** Runtime observability — builds runtime status snapshots (health, capability matrix, latest session contract) and executes runtime commands with slash command bundle dispatch.
**Exports:** buildHivemindRuntimeStatus, executeHivemindRuntimeCommand, syncRuntimeSurface, RuntimeToolContext
**Imports from:** `commands/slash-command/`, `agent-work-contract/engine/contract-store.js`, `agent-work-contract/hooks/index.js`, `runtime-entry/workflow-continuity.js`, `sdk-supervisor/`, `shared/contracts/runtime-status.js`, `shared/runtime-attachment.js`, `tools/runtime/types.js`
**Called by tools:** `hivemind_runtime_status` tool (`src/tools/runtime/tools.ts`), `hivemind_runtime_command` tool (`src/tools/runtime/tools.ts`)
**God files:** none (status.ts at 298 is just under threshold)

---

### session-entry

**Files (13):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 6 | Barrel — re-exports intake, start-work-types, purpose-classifier, lineage-router, session-state, readiness-gates |
| `intake.ts` | 54 | Intake module barrel — re-exports all decomposed intake sub-modules |
| `intake.types.ts` | 28 | ControlPlaneResolvedProfileInput, ControlPlaneIntakeResolution types |
| `intake.gates.ts` | 175 | Main gate resolution: resolveControlPlaneProfileInput, buildNonInteractiveIntakeError, resolveControlPlaneIntakeGate (hm-init and hm-settings logic) |
| `intake.constants.ts` | 84 | Profile group/field constants, GUIDED_ONBOARDING_PRESET defaults |
| `language-resolution.ts` | 131 | Language detection: isVietnameseMessage, isChineseMessage, isKoreanMessage, isJapaneseMessage, resolveDisplayLanguage |
| `profile-resolution.ts` | 194 | Profile resolution: resolvePresetGroups, resolvePresetProfileInput, resolveProfileFromInput, resolveMissingRequiredFields |
| `settings-delta.ts` | 56 | Settings delta detection: hasAnyRequestedSettingDelta, normalizeRequestedGroups |
| `lineage-router.ts` | 37 | Lineage resolution via keyword matching (hivefiver vs hiveminder) |
| `purpose-classifier.ts` | 79 | Purpose classification via keyword patterns (discovery, brainstorming, research, planning, implementation, gatekeeping, tdd, course-correction) |
| `readiness-gates.ts` | 21 | Readiness gate resolution from control-plane primitives |
| `session-state.ts` | 25 | Session state detection (fresh, ongoing, continuation, sub-session) and continuity alerts |
| `start-work-types.ts` | 159 | Core types: PurposeClass, SessionStateKind, StartWorkInput, StartWorkDecision, StartWorkEntryKernel and sub-interfaces |

**Total LOC:** 1,028 (non-test)
**Purpose:** Session entry/intake system — resolves user profile, language, lineage, purpose classification, and readiness gates for control-plane primitives (hm-init, hm-settings).
**Exports:** All intake functions, classifyPurpose, resolveLineage, detectSessionState, detectContinuityAlerts, resolveReadinessGates, all StartWork types
**Imports from:** `control-plane/`, `commands/slash-command/command-types.js`, `shared/bootstrap-profile.js`, `shared/runtime-attachment.js`, `shared/keyword-matcher.js`, `context/prompt-packet/prompt-packet-types.js`
**Called by hooks:** `start-work-router.ts`, `start-work-router-helpers.ts`, `auto-slash-command.ts`, `text-complete-handler.ts`
**Called by tools:** `hivemind_runtime_command` (via runtime-observability → settings.ts)
**God files:** none

---

### session-journal

**Files (3 non-test):**
| File | LOC | Purpose |
|------|-----|---------|
| `session-resolver.ts` | 72 | SessionResolver interface — resolve or resolveOrCreate sessions by SDK ID |
| `hierarchy-writer.ts` | 79 | Session hierarchy JSON management — appendHierarchyLink for parent-child session relationships |
| `error-log-writer.ts` | 20 | Error log writer — appendError to per-session .log files |

**Total LOC:** 171 (non-test)
**Purpose:** Session journal hierarchy — resolves sessions, maintains parent-child hierarchy JSON, and writes per-session error logs.
**Exports:** createSessionResolver, SessionResolver, writeHierarchyJson, appendHierarchyLink, appendError, ErrorLogEntry, HierarchyNode
**Imports from:** `event-tracker/paths.js`, `event-tracker/consolidated-writer.js`
**Called by hooks:** `tool-execution-handler.ts`, `compaction-handler.ts`, `text-complete-handler.ts`, `chat-message-handler.ts`, `event-handler.ts`
**God files:** none

---

### trajectory

**Files (2):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 1 | Barrel — re-exports trajectory.ts |
| `trajectory.ts` | 178 | Feature adapter: executeHivemindTrajectoryAction — inspect, traverse, attach, checkpoint, event, close on trajectory ledgers |

**Total LOC:** 179
**Purpose:** Trajectory management feature — delegates to core trajectory layer for ledger inspection, traversal, attachment, checkpointing, event recording, and closing.
**Exports:** executeHivemindTrajectoryAction, TrajectoryFeatureContext, TrajectoryFeatureResult
**Imports from:** `core/trajectory/` (bootstrapTrajectoryLedger, closeTrajectory, createTrajectoryCheckpoint, inspectTrajectoryLedger, loadTrajectoryLedger, recordTrajectoryEvent), `core/workflow-management/` (readWorkflowTaskState), `shared/tool-helpers.js`, `tools/trajectory/types.js`
**Called by tools:** `hivemind_trajectory` tool (`src/tools/trajectory/tools.ts`)
**God files:** none

---

### workflow

**Files (2):**
| File | LOC | Purpose |
|------|-----|---------|
| `index.ts` | 1 | Barrel — re-exports task.ts |
| `task.ts` | 190 | Feature adapter: executeHivemindTaskAction — create, get, list, activate, rotate, verify, complete workflow tasks |

**Total LOC:** 191
**Purpose:** Workflow task management feature — delegates to core workflow-management layer for task CRUD, activation, rotation, verification, and completion.
**Exports:** executeHivemindTaskAction, TaskFeatureContext, TaskFeatureResult
**Imports from:** `core/workflow-management/` (activateWorkflowTask, bootstrapWorkflowAuthority, completeWorkflowTask, createWorkflowTask, inspectWorkflowAuthority, listWorkflowTasks, readWorkflowTask, verifyWorkflowTask), `shared/tool-helpers.js`, `tools/task/types.js`
**Called by tools:** `hivemind_task` tool (`src/tools/task/tools.ts`)
**God files:** none

---

## Dependency Summary

| Feature File | Imports From | Layer Violation? |
|---|---|---|
| `trajectory/trajectory.ts` | `core/trajectory/`, `core/workflow-management/`, `shared/`, **`tools/trajectory/types.js`** | ⚠️ Upward import (tool types) |
| `workflow/task.ts` | `core/workflow-management/`, `shared/`, **`tools/task/types.js`** | ⚠️ Upward import (tool types) |
| `handoff/handoff.ts` | `delegation/`, `core/trajectory/`, `agent-work-contract/engine/`, `runtime-entry/workflow-continuity.js`, `shared/`, **`tools/handoff/types.js`** | ⚠️ Upward import (tool types) |
| `doc-intelligence/doc.ts` | `intelligence/doc/`, **`tools/doc/types.js`** | ⚠️ Upward import (tool types) |
| `runtime-observability/status.ts` | `commands/slash-command/`, `agent-work-contract/engine/`, `agent-work-contract/hooks/`, `runtime-entry/workflow-continuity.js`, `sdk-supervisor/`, `shared/`, **`tools/runtime/types.js`** | ⚠️ Upward import (tool types) |
| `runtime-entry/settings.ts` | `control-plane/`, `commands/slash-command/`, `shared/`, `sdk-supervisor/`, **`tools/hivefiver-setting/index.js`** | ⚠️ Upward import (tool module) |
| `agent-work-contract/tools/*` | `shared/`, `@opencode-ai/plugin/tool`, `../schema/`, `../engine/`, `../hooks/` | ✅ Internal feature imports |
| `event-tracker/consolidated-writer.ts` | `session-journal/hierarchy-writer.js` | ✅ Cross-feature (same layer) |
| `session-journal/session-resolver.ts` | `event-tracker/paths.js`, `event-tracker/consolidated-writer.js` | ✅ Cross-feature (same layer) |
| `session-journal/hierarchy-writer.ts` | `event-tracker/paths.js` | ✅ Cross-feature (same layer) |
| `session-journal/error-log-writer.ts` | `event-tracker/paths.js` | ✅ Cross-feature (same layer) |
| `runtime-observability/sync.ts` | `node:fs/promises`, `node:path` | ✅ No internal imports |
| `runtime-entry/nl-first-dispatch.ts` | `control-plane/`, `commands/slash-command/`, `session-entry/start-work-types.js`, `runtime-entry/attachment.js` | ✅ Cross-feature (same layer) |

**Upward import count:** 6 files import from `tools/` layer

---

## Dead Code

| File | Status | Evidence |
|---|---|---|
| `event-tracker/consolidated-writer.ts:addEvent()` | No-op stub | Lines 325-331: "V3 does not store events in-session; events go to separate files. Kept as no-op for API compatibility." |
| `event-tracker/consolidated-writer.ts:addDiagnostic()` | No-op stub | Lines 342-347: "V3 does not store diagnostics in-session. Kept as no-op for API compatibility." |
| `event-tracker/paths.ts:getSessionFilePath()` | @deprecated | Line 27: "@deprecated Session-scoped directories are deprecated in favor of flat session files." |
| `event-tracker/paths.ts:getEventTrackerSessionDir()` | @deprecated | Line 37: "@deprecated Session-scoped directories are deprecated in favor of flat session files." |
| `event-tracker/paths.ts:getSessionSynthesisPath()` | @deprecated | Line 165: "@deprecated Session-scoped directories are deprecated in favor of flat session files." |
| `event-tracker/paths.ts:getSessionDelegationPath()` | @deprecated | Line 124: "@deprecated Delegation entries now append into the flat journey-events markdown file." |
| `event-tracker/paths.ts:getSessionInjectionPath()` | @deprecated | Line 135: "@deprecated Injection entries now append into the flat journey-events markdown file." |
| `runtime-entry/nl-first-dispatch.ts:maybeExecuteNlFirstRuntimeDispatch()` | No-op execution | Line 30: "NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint." All branches return `shouldDispatch: false`. |
| `event-tracker/classifier/` | Partially used | `event-classifier.ts`, `event-id.ts`, `delegation-returned-evidence.ts`, `writer-adapter.ts` — no external imports found from hooks or tools |
| `event-tracker/parser/` | Partially used | All parser files (counter, delegation-extractor, header-parser, meta-parser, splitter, turn-parser, types) — no external imports found from hooks or tools |
| `event-tracker/writers/` | Partially used | `formatter.ts`, `index-writer.ts`, `synthesizer.ts` — no external imports found from hooks or tools |
| `event-tracker/session-structure.ts` | Unclear usage | No external imports found from hooks or tools |
| `agent-work-contract/tools/` | Not wired to runtime | Tool factories exist but are NOT registered in `src/plugin/` — they are feature-local only (see `tools/index.ts` comment: "Feature-local export surface only. Runtime promotion requires synchronized registration") |

---

## Cross-Feature Import Map

```
event-tracker ← session-journal (paths, consolidated-writer)
agent-work-contract ← handoff (chain-executor)
agent-work-contract ← runtime-observability (contract-store, hooks)
runtime-entry ← handoff (workflow-continuity)
runtime-entry ← runtime-observability (workflow-continuity)
session-entry ← runtime-entry (nl-first-dispatch)
session-entry ← hooks/start-work (multiple)
```

---

## Total Counts

| Metric | Count |
|---|---|
| **Total files (non-test)** | 99 |
| **Total files (including tests)** | 137 |
| **Total LOC (non-test)** | 11,010 |
| **Total LOC (including tests)** | 19,662 |
| **Feature directories** | 10 |
| **God files (>300 LOC, non-test)** | 4 |
| **Upward violations (features → tools)** | 6 |
| **Deprecated functions** | 5 |
| **No-op stubs** | 3 |
| **Unwired tool factories** | 3 (agent-work-contract tools) |
| **Potentially dead subdirectories** | 4 (event-tracker/classifier, parser, writers, session-structure.ts) |

### God Files Detail

| File | LOC | Feature |
|------|-----|---------|
| `event-tracker/consolidated-writer.ts` | 442 | event-tracker |
| `event-tracker/markdown-writer.ts` | 434 | event-tracker |
| `event-tracker/types.ts` | 380 | event-tracker |
| `runtime-entry/harness.ts` | 300 | runtime-entry |

### Upward Violations Detail

| File | Imports From | Line |
|------|---|---|
| `handoff/handoff.ts` | `tools/handoff/types.js` | 16 |
| `runtime-entry/settings.ts` | `tools/hivefiver-setting/index.js` | 13 |
| `runtime-observability/status.ts` | `tools/runtime/types.js` | 23 |
| `doc-intelligence/doc.ts` | `tools/doc/types.js` | 8 |
| `trajectory/trajectory.ts` | `tools/trajectory/types.js` | 11 |
| `workflow/task.ts` | `tools/task/types.js` | 12 |

**Note:** All 6 upward imports are for tool argument types and pressure contracts. This is a structural pattern where features import the tool's Zod schema types to type their execute functions. While technically an upward dependency, it is limited to type-only imports and does not create runtime coupling.

---

## Git Context

- **Investigation date:** 2026-03-31
- **Working tree:** `.worktrees/product-detox`
- **All file paths verified against current filesystem**
- **No uncommitted changes detected in src/features/ during investigation**
