---
title: "Remaining Layers Inventory"
date: 2026-03-31
agent: hivexplorer
scope: "src/core/, src/intelligence/, src/sdk-supervisor/, src/schema-kernel/, src/delegation/, src/cli/, src/control-plane/, src/governance/, src/recovery/, src/commands/, src/context/"
commit: 7da1d535
---

# Remaining Layers Inventory — 2026-03-31

**Scope:** `src/core/`, `src/intelligence/`, `src/sdk-supervisor/`, `src/schema-kernel/`, `src/delegation/`, `src/cli/`, `src/control-plane/`, `src/governance/`, `src/recovery/`, `src/commands/`, `src/context/`
**Excluded:** `src/tools/`, `src/features/`, `src/hooks/`, `src/plugin/`, `src/shared/`
**Git commit:** `7da1d535`

---

## src/core/

### trajectory/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `trajectory-types.ts` | 155 | `TrajectoryStatus`, `TrajectoryRecoveryOutcome`, `TrajectoryAssessmentAction`, `TrajectoryEvent`, `TrajectoryCore`, `TrajectoryBindings`, `TrajectoryEvidence`, `TrajectoryPlanning`, `TrajectoryRecord`, `TrajectoryCheckpoint`, `TrajectoryRecoveryLogEntry`, `TrajectoryLedger`, `BootstrapTrajectoryInput`, `CloseTrajectoryInput`, `CreateTrajectoryCheckpointInput`, `RecordTrajectoryRecoveryInput`, `TrajectoryLedgerInspection`, `AssessTrajectoryEntryInput`, `TrajectoryAssessment` | Type definitions for trajectory identity, lifecycle, evidence, planning, and ledger structures | `trajectory-store.ts`, `trajectory-assessment.ts`, `trajectory-store.operations.ts`, `trajectory-store.ledger.ts`, `src/recovery/recovery-types.ts:3`, `src/core/trajectory/index.ts:1` |
| `trajectory-store.types.ts` | 14 | `TRAJECTORY_LEDGER_VERSION`, `getTrajectoryLedgerPath` | Version constant and path resolution for trajectory-ledger.json | `trajectory-store.ts:26`, `trajectory-store.ledger.ts:11-12` |
| `trajectory-store.ts` | 46 | Re-exports all trajectory store sub-modules | Barrel/composition module — re-exports types, version, ledger ops, and high-level ops | `src/core/index.ts:5`, `src/sdk-supervisor/runtime-status.ts:16`, `src/hooks/event-handler.ts:3,11`, `src/governance/planning-projection.ts:5`, `src/recovery/recovery-engine.ts:2-8` |
| `trajectory-assessment.ts` | 127 | `assessTrajectoryEntry`, `assessTrajectoryEntrySync` | Entry-point assessment: matches user message against ledger to decide attach-active, resume-closed, create-new, or refuse-conflict | `src/core/trajectory/index.ts:3` (exported); no src/ consumers found — **potential dead export** |
| `trajectory-store.operations.ts` | 231 | `bootstrapTrajectoryLedger`, `recordTrajectoryEvent`, `closeTrajectory`, `createTrajectoryCheckpoint`, `recordTrajectoryRecoveryOutcome` | High-level CRUD: bootstrap trajectory with workflow/task activation, record events, close, checkpoint, recovery logging | `src/core/trajectory/index.ts` (via store), `src/recovery/recovery-engine.ts:2-8`, `src/hooks/event-handler.ts:11`, tests |
| `trajectory-store.ledger.ts` | 184 | `createEmptyLedger`, `normalizeLedger`, `saveTrajectoryLedger`, `loadTrajectoryLedger`, `loadTrajectoryLedgerSync`, `inspectTrajectoryLedger`, `ensureTrajectoryLedger` | Low-level ledger file I/O: create, read, write, normalize, inspect, ensure | `trajectory-store.ts:29-37`, `trajectory-assessment.ts:4`, `trajectory-store.operations.ts:12` |
| `index.ts` | 3 | Re-exports trajectory-types, trajectory-store, trajectory-assessment | Barrel export for trajectory submodule | `src/core/index.ts:5` |

### workflow-management/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `workflow-types.ts` | 48 | `WorkflowRecord`, `HandoffRecord`, `WorkflowDecision`, `WorkflowTraversalOutcome` | Type definitions for workflow records, handoffs, routing decisions | `workflow-router.ts:1`, `continuity.ts:1`, `task-lifecycle.ts:6`, `src/core/workflow-management/index.ts:5` |
| `workflow-authority.ts` | 209 | `WorkflowAuthorityIssue`, `WorkflowAuthorityInput`, `WorkflowAuthorityStatus`, `inspectWorkflowAuthority`, `bootstrapWorkflowAuthority`, `RepairWorkflowAuthorityResult`, `repairWorkflowAuthority` | Inspect/bootstrap/repair workflow authority: checks .hivemind paths, planning root, task ledgers; creates directory structure and seed files | `src/core/workflow-management/index.ts:8`, `src/recovery/recovery-engine.ts:10`, `src/shared/entry-kernel-state.ts:5`, `trajectory-store.operations.ts:2` |
| `workflow-router.ts` | 23 | `routeWorkflow` | Simple routing: decides delegation and load strategy based on workflow scope/stage | `src/core/workflow-management/index.ts:6` — **no external consumers found** — dead export |
| `task-lifecycle.ts` | 353 | `TaskStatus`, `TaskRecord`, `TaskLifecycleState`, `ActivateWorkflowTaskInput`, `CreateWorkflowTaskInput`, `VerifyWorkflowTaskInput`, `CompleteWorkflowTaskInput`, `TaskLifecycleResult`, `activateWorkflowTask`, `createWorkflowTask`, `verifyWorkflowTask`, `completeWorkflowTask`, `readWorkflowTaskState`, `readWorkflowTask`, `listWorkflowTasks` | Full task lifecycle: activate, create, verify, complete, read, list tasks with corruption-safe loading | `src/core/workflow-management/index.ts:9`, `src/governance/planning-projection.ts:6`, `trajectory-store.operations.ts:1`, tests |
| `continuity.ts` | 20 | `WorkflowContinuity`, `createWorkflowContinuity` | Creates continuity summary from workflow + optional handoff | `src/core/workflow-management/index.ts:7` — **no external consumers found** — dead export |
| `index.ts` | 9 | Re-exports all workflow-management modules | Barrel export for workflow-management submodule | `src/core/index.ts:6` |

### Top-level

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `index.ts` | 6 | Re-exports trajectory and workflow-management | Top-level core barrel | `src/recovery/recovery-engine.ts:9`, tests |

---

## src/intelligence/doc/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `types.ts` | 29 | `HeadingHierarchy`, `DocumentChunk`, `DocumentSkim`, `DocumentSearchResult` | Type definitions for document intelligence operations | `read-ops.ts:12`, `formats/md.ts:5`, `doc/index.ts:2` |
| `safety.ts` | 22 | `safePath`, `isMarkdownDocument`, `relativeProjectPath` | Path traversal protection and markdown file detection | `read-ops.ts:11` |
| `formats/md.ts` | 177 | `estimateTokens`, `readMarkdownOutline`, `readMarkdownMetadata`, `readMarkdownSection`, `chunkMarkdownSections` | Markdown parsing via remark: outlines, metadata, sections, token estimation, chunking | `read-ops.ts:4-10` |
| `read-ops.ts` | 151 | `skimDocument`, `skimDirectory`, `readSection`, `readChunked`, `searchDocuments` | High-level document read operations: skim, section read, chunked read, search | `doc/index.ts:3` |
| `doc-surface-router.ts` | 39 | `DocKnowledgeSurface`, `resolveDocKnowledgeSurfaces` | Maps purpose class to required document knowledge surfaces (planning, handoff, verification, research, artifacts) | `doc/index.ts:1` — **no external consumers found** — dead export |
| `index.ts` | 3 | Re-exports doc-surface-router, types, read-ops | Barrel export for doc intelligence | `src/intelligence/index.ts:1` |

### Top-level

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `index.ts` | 1 | Re-exports doc/index | Top-level intelligence barrel | **No external consumers found** — entire `src/intelligence/` is unwired from src/ |

---

## src/sdk-supervisor/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `instance-registry.ts` | 49 | `RegisterSupervisorInstanceInput`, `createSupervisorInstanceRegistry`, `registerSupervisorInstance` | Create and upsert supervisor instance registry with Zod validation | `health.ts:3-4`, `src/sdk-supervisor/index.ts:1` |
| `health.ts` | 75 | `SupervisorHealthSummary`, `CreateSupervisorStatusReportInput`, `SupervisorStatusReport`, `summarizeSupervisorHealth`, `createSupervisorStatusReport` | Aggregate health summary and status report creation for supervisor instances | `runtime-status.ts:19-20`, `src/sdk-supervisor/index.ts:2` |
| `runtime-status.ts` | 300 | `RuntimeKernelStatusSnapshot`, `BuildRuntimeStatusSnapshotInput`, `RuntimeStatusSnapshot`, `buildRuntimeStatusSnapshot` | Builds comprehensive runtime status snapshot from schema-kernel contracts + supervisor health | `src/sdk-supervisor/index.ts:3`, test import only |
| `session-inspection.ts` | 108 | `PreparedPurificationCommand`, `SessionInspectionExportResult`, `createPreparedPurificationCommand`, `upsertSessionInspectionExport` | **@deprecated** — exports session inspection markdown + purification command artifacts | Only imported by its own test file — **DEAD CODE** |
| `diagnostic-log.ts` | 107 | `DiagnosticLogEntry`, `writeDiagnosticLog` | **@deprecated** — writes diagnostic summaries to .hivemind/error-log/ | **No consumers found** — **DEAD CODE** |
| `index.ts` | 3 | Re-exports instance-registry, health, runtime-status | Barrel export — notably excludes session-inspection and diagnostic-log | `src/sdk-supervisor/` consumers only |

---

## src/schema-kernel/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `config-records.ts` | 47 | `UserExpertLevel`, `GovernanceLevel`, `OperationMode`, `SupportedLanguage`, `UserPreferences` (Zod schemas + types) | User preferences and governance configuration schemas | `src/shared/config-groups.ts:14,16`, `src/shared/bootstrap-profile.ts:4`, tests |
| `agent-records.ts` | 65 | `SkillEntry`, `AgentTemplate`, `AgentBundle`, `PurposeClass`, `TaskClassification`, `PhaseClassification` (Zod schemas + types) | Agent template, bundle, purpose class, and task classification schemas | `skill-injection-records.ts:9-10`, `src/shared/tiered-injection.ts:16-17`, `src/plugin/skill-exposure-map.ts:20` |
| `default-agent-templates.ts` | 109 | `HIVEMINDER`, `HIVEDFIVER`, `HIVEHEALER`, `HIVEQ`, `HIVERD`, `HIVEXPLORER`, `HITEA`, `ARCHITECT`, `HIVEMAKER`, `CODE_SKEPTIC`, `DEFAULT_AGENT_TEMPLATES` | 10 default agent template definitions validated against AgentTemplate schema | `src/schema-kernel/index.ts:17` — **no external consumers found** — dead export |
| `skill-injection-records.ts` | 51 | `SkillInjectionRule`, `SkillInjectionConfig`, `SkillValidationResult` (Zod schemas + types) | Skill injection rules, configuration, and validation result schemas | `src/shared/tiered-injection.ts:16`, `src/shared/skill-injection-loader.ts:14` |
| `index.ts` | 22 | Re-exports from `../archive/schema-kernel/` (shared, lifecycle, orchestration, evidence records) + local modules + `SCHEMA_KERNEL_ACTIVE`, `SCHEMA_KERNEL_CANONICAL_PATH` | Active re-export layer — bridges archive schemas with new Phase 1 records | `src/sdk-supervisor/health.ts:1`, `src/sdk-supervisor/instance-registry.ts:4`, `src/sdk-supervisor/runtime-status.ts:9,15` |

---

## src/delegation/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `delegation-packet.ts` | 73 | `DelegationEvidenceItem`, `DelegationPacket`, `createDelegationPacket` | Delegation packet type definitions and factory function | `delegation-store.ts:6-7`, `delegation/index.ts:5` |
| `delegation-record.schema.ts` | 113 | `DelegationEvidenceRecordSchema`, `DelegationPacketSchema`, `DelegationHandoffRecordSchema`, `DelegationRecordValidationResult`, `validateDelegationRecord`, `formatValidationIssues` | Zod schemas for validating delegation handoff records at parse time | `delegation-store.ts:9-11` |
| `delegation-store.ts` | 280 | `DelegationEvidenceRecord`, `DelegationHandoffRecord`, `CreateDelegationHandoffInput`, `UpdateDelegationHandoffInput`, `getDelegationHandoffPath`, `createDelegationHandoff`, `readDelegationHandoff`, `listDelegationHandoffs`, `updateDelegationHandoff`, `validateDelegationHandoff`, `closeDelegationHandoff` | Full CRUD for delegation handoff files: create, read, list, update, validate, close with schema validation | `delegation/index.ts:6`, tests |
| `index.ts` | 6 | Re-exports delegation-packet, delegation-store | Barrel export for delegation module | **No external src/ consumers found** — only tests import directly from sub-paths |

---

## src/cli/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `command-routing.ts` | 49 | `CLI_COMMANDS`, `CliCommand`, `resolveCliInvocation` | Resolves CLI command from executable path and positional args using control-plane primitives | `src/cli/` only — **no external consumers found** |
| `init.ts` | 2 | Re-exports `initProject`, `InitOptions`, `InitProjectResult` from features/runtime-entry | Thin re-export shim for init command | **No external consumers found** |
| `doctor.ts` | 2 | Re-exports `runDoctorCommand`, `DoctorOptions`, `DoctorCommandResult` from features/runtime-entry | Thin re-export shim for doctor command | **No external consumers found** |
| `harness.ts` | 2 | Re-exports `runHarnessCommand`, `HarnessOptions`, `HarnessResult` from features/runtime-entry | Thin re-export shim for harness command | **No external consumers found** |
| `settings.ts` | 116 | `SettingsUpdateOptions`, `SettingsUpdateResult`, `SettingsCommandOptions`, `updateProjectSettings`, `runSettingsCommand` | Persist runtime settings and run hm-settings command bundle through control-plane intake | `src/cli/` only — **no external consumers found** |

---

## src/control-plane/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `control-plane-types.ts` | 62 | `ControlPlanePrimitiveId`, `ControlPlaneCliCommand`, `ControlPlaneQuestionnaireId`, `ControlPlaneRecommendedPresetId`, `ControlPlaneProfileFieldId`, `ControlPlaneProfileGroupId`, `ControlPlaneIntakeEvidence`, `ControlPlaneIntakeGateResult`, `ControlPlaneGateDecision`, `ControlPlanePrimitive` | Type definitions for control-plane primitives, intake, gates | `control-plane-registry.ts:3-8`, `control-plane-handler.ts:5`, `src/control-plane/index.ts:1` |
| `control-plane-registry.ts` | 268 | `ControlPlaneGateResolution`, `CONTROL_PLANE_CLI_COMMANDS`, `discoverControlPlanePrimitives`, `findControlPlanePrimitive`, `findControlPlanePrimitiveByCliCommand`, `resolveControlPlaneGate`, `isControlPlanePrimitiveId` | Registry of 4 control-plane primitives (hm-init, hm-doctor, hm-harness, hm-settings) with detection logic and gate resolution | `src/cli/command-routing.ts:2`, `src/cli/settings.ts:4-8`, `src/shared/intake-record.types.ts:19`, `src/shared/intake-record.validation.ts:6`, tests |
| `control-plane-intake.ts` | 1 | Re-exports from `../features/session-entry/intake.js` | Thin re-export shim | `src/control-plane/index.ts:3` |
| `control-plane-handler.ts` | 32 | `executeControlPlaneHandler` | Dispatches control-plane command execution to appropriate handler (init/doctor/harness/settings) | `src/commands/slash-command/command-runner.ts:5`, `src/control-plane/index.ts:4` |
| `sdk-runtime.ts` | 91 | `RuntimeAuthorityRecord`, `CreateManagedRuntimeInput`, `ManagedRuntimeResult`, `AttachManagedRuntimeInput`, `AttachedRuntimeResult`, `createManagedRuntime`, `attachManagedRuntime` | SDK lifecycle management: create managed runtime or attach to existing runtime via @opencode-ai/sdk | `src/features/runtime-entry/init.handler.ts:11`, tests |
| `index.ts` | 4 | Re-exports types, registry, intake, handler | Barrel export for control-plane module | `src/cli/command-routing.ts:2`, `src/cli/settings.ts:8`, `src/shared/intake-record.types.ts:19`, `src/shared/intake-record.validation.ts:6`, `src/control-plane/control-plane-handler.ts:5` |

---

## src/governance/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `planning-projection.ts` | 63 | `PlanningGovernanceProjection`, `createPlanningGovernanceProjection` | Creates a JSON projection of trajectory state (task IDs, checkpoint IDs, recovery outcomes) to .hivemind/project/planning/trajectory-projections/ | `src/governance/index.ts:1` — **no external consumers found** — dead export |
| `index.ts` | 1 | Re-exports planning-projection | Barrel export for governance module | **No external consumers found** |

---

## src/recovery/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `recovery-types.ts` | 50 | `RecoveryFailureClass`, `RecoveryStatus`, `RecoveryAssessmentInput`, `RecoveryAssessment`, `RecoveryRepairResult`, `CreateRecoveryCheckpointInput` | Type definitions for recovery assessment, failure classes, and repair results | `recovery-engine.ts:12-18`, `src/recovery/index.ts:1` |
| `recovery-engine.ts` | 161 | `assessRecoveryState`, `createRecoveryCheckpoint`, `repairRecoveryState` | Recovery engine: assesses state by inspecting workflow authority + trajectory ledger, bootstraps missing components, records recovery outcomes | `src/recovery/index.ts:2`, `src/hooks/event-handler.ts:10` |
| `index.ts` | 2 | Re-exports recovery-types, recovery-engine | Barrel export for recovery module | `src/hooks/event-handler.ts:10` |

---

## src/commands/slash-command/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `command-types.ts` | 135 | `SlashCommandCore`, `SlashCommandRouting`, `SlashCommandContracts`, `SlashCommandBundle`, `CommandExecutionPreview`, `CommandInputCore`, `CommandInputProfile`, `CommandInputBindings`, `CommandInputOverrides`, `CommandExecutionInput`, `CommandEntityBindings`, `CommandExecutionResult` | Type definitions for slash command bundles, execution input, and results | `command-bundles.ts:1`, `command-discovery.ts:1`, `command-runner.ts:7-12`, `command-bundles.ts:1`, `src/control-plane/control-plane-handler.ts:5`, `src/shared/opencode-agent-registry.ts:7` |
| `command-bundles.ts` | 179 | `slashCommandBundles` (array of 10 SlashCommandBundle objects) | Defines 10 command bundles: hm-init, hm-doctor, hm-harness, hm-settings, hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct | `command-discovery.ts:2`, `src/commands/slash-command/index.ts:2` |
| `command-discovery.ts` | 10 | `discoverSlashCommandBundles`, `findSlashCommandBundle` | Discovery functions for command bundles (copy + find by ID) | `src/commands/slash-command/index.ts:3`, `src/cli/settings.ts:1`, `src/plugin/opencode-plugin.ts:13`, tests |
| `command-runner.ts` | 33 | `previewSlashCommandBundle`, `executeSlashCommandBundle`, `executeRecoveryHandler` | Command execution: delegates to runtime-entry command bundle execution, with recovery handler fallback to control-plane | `src/commands/slash-command/index.ts:4`, tests |
| `index.ts` | 4 | Re-exports types, bundles, discovery, runner | Barrel export for slash-command module | `src/commands/index.ts:1`, `src/cli/settings.ts:1`, `src/plugin/opencode-plugin.ts:13`, tests |

### Top-level

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `index.ts` | 1 | Re-exports slash-command/index | Top-level commands barrel | **No external consumers found** |

---

## src/context/prompt-packet/

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `prompt-packet-types.ts` | 54 | `SessionScope`, `KernelLineage`, `PromptSessionCore`, `PromptProfilePrefs`, `PromptWorkflowContext`, `PromptExtensions`, `PromptPacketState`, `CompiledPromptPacket` | Type definitions for prompt packet state, session identity, profile prefs, workflow context | `prompt-packet-normalize.ts:1-5`, `prompt-compiler.ts:1-5`, `src/context/prompt-packet/index.ts:1`, `src/shared/intake-record.types.ts:15`, `src/shared/intake-record.validation.ts:5`, `src/recovery/recovery-types.ts:1` |
| `prompt-packet-normalize.ts` | 77 | `NormalizedPromptPacketState`, `normalizePromptPacketState` | Normalizes partial PromptPacketState into full state with defaults for all fields | `prompt-compiler.ts:6`, `src/context/prompt-packet/index.ts:2` |
| `prompt-packet-renderers.ts` | 118 | `renderMainSystemPacket`, `renderSubsessionSystemPacket`, `renderMainMessagePacket`, `renderSubsessionMessagePacket` | Renders normalized state into XML-tagged packet strings for system and message packets (main vs sub-session) | `prompt-compiler.ts:7-12`, `src/context/prompt-packet/index.ts:3` |
| `prompt-compiler.ts` | 37 | `compilePromptPacket` | Compiles prompt packet: normalizes state, renders appropriate system/message packets based on scope | `src/context/prompt-packet/index.ts:4`, `src/plugin/runtime-prompt.ts:6` |
| `index.ts` | 4 | Re-exports types, normalize, renderers, compiler | Barrel export for prompt-packet module | `src/context/index.ts:5`, `src/plugin/runtime-prompt.ts:6` |

### Top-level

| File | LOC | Exports | Purpose | Used By |
|------|-----|---------|---------|---------|
| `index.ts` | 5 | Re-exports prompt-packet/index | Top-level context barrel | `src/plugin/runtime-prompt.ts:6` |

---

## Dead Code Summary

| File | Reason | Evidence |
|------|--------|----------|
| `src/sdk-supervisor/session-inspection.ts` | Marked `@deprecated` in source (line 1); only imported by its own test file | Line 1: `/** @deprecated — use session journal handlers instead */`; grep shows only `session-inspection.test.ts` imports it |
| `src/sdk-supervisor/diagnostic-log.ts` | Marked `@deprecated` in source (lines 1-7); zero consumers in src/ | Lines 1-7: `@deprecated Use session journal handlers instead`; grep returns 0 matches |
| `src/core/workflow-management/workflow-router.ts` | Exported from index but no external consumers; `routeWorkflow` function is trivial and unused | grep for `workflow-router` returns only the barrel export in `index.ts:6` |
| `src/core/workflow-management/continuity.ts` | Exported from index but no external consumers; `createWorkflowContinuity` is unused | grep for `continuity` from core returns only barrel export; different `workflow-continuity.ts` exists in features/ |
| `src/intelligence/doc/doc-surface-router.ts` | Exported from doc/index but no external consumers | grep for `doc-surface-router` returns only the barrel export |
| `src/intelligence/` (entire module) | No src/ consumers import from `src/intelligence/` at all | grep returns 0 matches for `from.*src/intelligence/` |
| `src/governance/` (entire module) | No src/ consumers import from `src/governance/` at all | grep returns 0 matches for `from.*src/governance/` |
| `src/governance/planning-projection.ts` | Only consumer is its own barrel; no external wiring | grep returns 0 external matches |
| `src/delegation/` (entire module) | No src/ consumers import from `src/delegation/`; only tests import directly from sub-paths | grep returns 0 matches for `from.*src/delegation/` |
| `src/cli/` (entire module) | No src/ consumers import from `src/cli/`; all 5 files are CLI entry points with no internal wiring | grep returns 0 matches for `from.*src/cli/` |
| `src/cli/init.ts`, `src/cli/doctor.ts`, `src/cli/harness.ts` | Thin 2-line re-export shims with no consumers | Each file is 2 lines re-exporting from features/runtime-entry |
| `src/schema-kernel/default-agent-templates.ts` | Exported from index but no external consumers found | grep returns 0 matches for imports of `default-agent-templates` |
| `src/commands/index.ts` | Top-level barrel with no external consumers | grep returns 0 matches for `from.*src/commands/` (consumers import from slash-command sub-path directly) |
| `src/core/trajectory/trajectory-assessment.ts` | Exported from trajectory/index but no external consumers found | grep returns 0 matches for `assessTrajectoryEntry` outside the file itself |

---

## Total Counts

| Metric | Count |
|--------|-------|
| **Total .ts files** | 58 |
| **Total LOC** | ~3,890 |
| **Dead files (zero external consumers)** | 14 |
| **Deprecated files** | 2 |
| **Thin re-export shims (≤5 LOC)** | 8 |
| **Actively wired files** | 36 |

### Breakdown by Directory

| Directory | Files | LOC | Dead |
|-----------|-------|-----|------|
| `src/core/trajectory/` | 7 | 760 | 1 (trajectory-assessment) |
| `src/core/workflow-management/` | 6 | 662 | 2 (workflow-router, continuity) |
| `src/core/` (top) | 1 | 6 | 0 |
| `src/intelligence/doc/` | 6 | 393 | 2 (doc-surface-router, entire module unwired) |
| `src/intelligence/` (top) | 1 | 1 | 1 (entire module unwired) |
| `src/sdk-supervisor/` | 7 | 642 | 2 (session-inspection, diagnostic-log) |
| `src/schema-kernel/` | 5 | 294 | 1 (default-agent-templates) |
| `src/delegation/` | 4 | 472 | 1 (entire module unwired) |
| `src/cli/` | 5 | 171 | 5 (entire module unwired) |
| `src/control-plane/` | 6 | 408 | 0 |
| `src/governance/` | 2 | 64 | 2 (entire module unwired) |
| `src/recovery/` | 3 | 213 | 0 |
| `src/commands/slash-command/` | 5 | 361 | 0 |
| `src/commands/` (top) | 1 | 1 | 1 (top-level barrel) |
| `src/context/prompt-packet/` | 5 | 290 | 0 |
| `src/context/` (top) | 1 | 5 | 0 |
