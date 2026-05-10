<!-- generated-by: gsd-doc-writer -->
# Implementation Inventory — Hivemind Harness `src/` Layer

**Analysis Date:** 2026-05-05  
**Updated:** 2026-05-06  
**Total Files Analyzed:** 175  
**Total LOC (src/):** 22,036  
**Total LOC (src/lib/):** 16,389  

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| `src/lib/` files | 106 |
| `src/tools/` files | 22 |
| `src/hooks/` files | 8 |
| `src/schema-kernel/` files | 15 |
| `src/shared/` files | 2 |
| `src/cli/` files | 5 |
| Top-level (`src/*.ts`) | 2 |
| **Total** | **160** |

### Soft Meta-Concepts (`.opencode/`)

| Metric | Value |
|--------|-------|
| Agents | 89 (45 hm-*, 33 gsd-*, 11 hf-*) |
| Skills | 123 directories (65 gsd-*, 35 hm-*, 13 hf-*, 6 stack-*, 3 gate-*, 1 opencode-*) |
| Commands | 18 |
| Tests passing | 1,604 (2 failing in session-journal) |

### Top 5 Largest Modules (src/lib/)

| Module | LOC |
|--------|-----|
| `src/lib/delegation-manager.ts` | 468 |
| `src/lib/continuity.ts` | 455 |
| `src/lib/delegation-state-machine.ts` | 426 |
| `src/lib/command-delegation.ts` | 418 |
| `src/lib/types.ts` | 415 |

### Top 5 Largest Files (all src/)

| File | LOC |
|------|-----|
| `src/tools/configure-primitive.ts` | 490 |
| `src/lib/delegation-manager.ts` | 468 |
| `src/lib/continuity.ts` | 455 |
| `src/lib/delegation-state-machine.ts` | 426 |
| `src/lib/command-delegation.ts` | 418 |

### Files < 20 LOC (likely stubs/barrels)

| File | LOC | Classification |
|------|-----|----------------|
| `src/lib/trajectory/index.ts` | 3 | Barrel re-export |
| `src/lib/agent-work-contracts/index.ts` | 3 | Barrel re-export |
| `src/lib/runtime-pressure/index.ts` | 4 | Barrel re-export |
| `src/lib/runtime-detection/index.ts` | 4 | Barrel re-export |
| `src/lib/spawner/parent-directory.ts` | 9 | Small utility |
| `src/lib/event-tracker/index.ts` | 12 | Barrel re-export |
| `src/lib/doc-intelligence/index.ts` | 14 | Barrel re-export |
| `src/lib/spawner/concurrency-key.ts` | 13 | Small utility |
| `src/lib/event-tracker/writer.ts` | 15 | Thin wrapper |
| `src/lib/supervisor/index.ts` | 17 | Barrel re-export |
| `src/lib/prompt-packet/index.ts` | 18 | Barrel re-export |

---

## Complete Module Inventory

### Core Modules (src/lib/ standalone)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `src/lib/types.ts` | 415 | IMPLEMENTED | TaskStatus, RuntimePolicy, HarnessStatus, ContinuityStoreFile + re-exports from delegation-types | Everything |
| `src/lib/delegation-types.ts` | 140 | IMPLEMENTED | DelegationStatus, DelegationSurface, DelegationRecoveryGuarantee, polling constants | types.ts (re-exported) |
| `src/lib/continuity.ts` | 455 | IMPLEMENTED | getSessionContinuity, recordSessionContinuity, patchSessionContinuity, hydrateFromContinuity | plugin.ts, lifecycle-manager, delegation-manager, hooks |
| `src/lib/delegation-manager.ts` | 468 | IMPLEMENTED | DelegationManager class | plugin.ts |
| `src/lib/delegation-state-machine.ts` | 426 | IMPLEMENTED | DelegationStateMachine, canTransitionDelegationStatus, buildDelegationResult | delegation-manager.ts |
| `src/lib/delegation-persistence.ts` | 189 | IMPLEMENTED | persistDelegations, readPersistedDelegations, getDelegationsFilePath | delegation-state-machine.ts, delegation-manager.ts |
| `src/lib/command-delegation.ts` | 418 | IMPLEMENTED | CommandDelegationHandler | delegation-manager.ts |
| `src/lib/sdk-delegation.ts` | 281 | IMPLEMENTED | SdkDelegationHandler | delegation-manager.ts |
| `src/lib/concurrency.ts` | 310 | IMPLEMENTED | DelegationConcurrencyQueue, buildDelegationQueueKey | delegation-manager.ts, index.ts (public API) |
| `src/lib/completion-detector.ts` | 157 | IMPLEMENTED | CompletionDetector class (feed, watch, cancel, feedMessageCount) | lifecycle-manager.ts, sdk-delegation.ts |
| `src/lib/state.ts` | 251 | IMPLEMENTED | sessionStats, rootBudgets, ensureSessionStats, reserveDescendant | lifecycle-manager.ts, delegation-manager.ts |
| `src/lib/helpers.ts` | 257 | IMPLEMENTED | isObject, asString, getNestedValue, unwrapData, stableStringify, makeToolSignature, buildPromptText | Widespread |
| `src/lib/session-api.ts` | 265 | IMPLEMENTED | createSession, getSession, abortSession, getSessionMessages, sendPrompt, sendPromptAsync, walkParentChain | delegation-manager.ts, hooks, sdk-delegation.ts |
| `src/lib/lifecycle-manager.ts` | 243 | IMPLEMENTED | createHarnessLifecycleManager, handleEvent, getCompletionDetector | plugin.ts |
| `src/lib/runtime.ts` | 95 | IMPLEMENTED | inferContinuityStatusFromEvent | hooks/create-core-hooks.ts |
| `src/lib/runtime-policy.ts` | 267 | IMPLEMENTED | loadRuntimePolicy, DEFAULT_RUNTIME_POLICY, resolveConcurrencyForKey | plugin.ts, delegation-manager.ts, hooks |
| `src/lib/notification-handler.ts` | 290 | IMPLEMENTED (ACTIVE — re-activated Phase 16.2) | notifyDelegationTerminal, buildNotificationMessage | delegation-state-machine.ts, lifecycle-manager.ts |
| `src/lib/task-status.ts` | 22 | IMPLEMENTED | canTransition, isTerminal, VALID_TRANSITIONS | index.ts (public API) |
| `src/lib/framework-detector.ts` | 190 | IMPLEMENTED | detectFrameworks | validate-restart.ts, stack-synthesizer.ts |
| `src/lib/runtime-validator.ts` | 352 | IMPLEMENTED | validateRuntime | validate-restart.ts, cross-primitive-validator.ts |
| `src/lib/cross-primitive-validator.ts` | 373 | IMPLEMENTED | validateCrossPrimitive, PrimitiveMap | validate-restart.ts |
| `src/lib/primitive-loader.ts` | 334 | IMPLEMENTED | loadPrimitives, loadPrimitive | configure-primitive.ts, command-engine, agent-primitive-policy.ts |
| `src/lib/primitive-registry.ts` | 291 | IMPLEMENTED | buildRegistry, PrimitiveEntry | control-plane/gatekeeper.ts |
| `src/lib/primitive-scanners.ts` | 182 | IMPLEMENTED | scanAgentFile, scanCommandFile, scanSkillFile | primitive-loader.ts |
| `src/lib/config-compiler.ts` | 410 | IMPLEMENTED | compileAgent, compileCommand, compileSkill, decompileAgent, decompileCommand | configure-primitive.ts |
| `src/lib/category-gates.ts` | 59 | IMPLEMENTED | resolveCategoryGateDecision, DEFAULT_CATEGORY_GATE_POLICY | delegation-manager.ts, runtime-policy.ts |
| `src/lib/category-gate-audit.ts` | 41 | IMPLEMENTED | recordCategoryGateask | delegation-manager.ts |
| `src/lib/session-journal.ts` | 119 | IMPLEMENTED | SessionJournalEntry, createSessionJournal | journal-query.ts, journal-replay.ts |
| `src/lib/journal-query.ts` | 168 | IMPLEMENTED | querySessionJournal | index.ts (public API), session-journal-export.ts |
| `src/lib/journal-replay.ts` | 131 | IMPLEMENTED | replayJournalEntries | index.ts (public API) |
| `src/lib/execution-lineage.ts` | 122 | IMPLEMENTED | buildExecutionLineage | session-journal-export.ts |
| `src/lib/plugin-tool-output-summary.ts` | 22 | IMPLEMENTED | summarizePluginToolOutput | plugin.ts |
| `src/lib/app-api.ts` | 24 | IMPLEMENTED | getAppAgents | delegation-manager.ts |
| `src/lib/auto-loop.ts` | 146 | IMPLEMENTED | runAutoLoop, AutoLoopVerification | hooks (via plugin.ts deps injection) |
| `src/lib/ralph-loop.ts` | 182 | IMPLEMENTED | runRalphLoop, RalphValidation | hooks (via plugin.ts deps injection) |
| `src/lib/recovery-engine.ts` | — | REMOVED (HER-2) | — | — |
| `src/lib/workspace-runtime-policy.ts` | 38 | IMPLEMENTED | resolveWorkspaceRuntimePolicy | plugin.ts |

### Subdirectory Modules (src/lib/*/)

#### agent-work-contracts/ (4 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `agent-work-contracts/types.ts` | 89 | IMPLEMENTED | AgentWorkContract, AgentWorkContractStore, CreateAgentWorkContractInput | operations.ts, store.ts |
| `agent-work-contracts/store.ts` | 146 | IMPLEMENTED | getAgentWorkContract, upsertAgentWorkContract | operations.ts |
| `agent-work-contracts/operations.ts` | 162 | IMPLEMENTED | createAgentWorkContract, exportAgentWorkContract | hivemind-agent-work.ts tool |
| `agent-work-contracts/index.ts` | 3 | Barrel | Re-exports all | index.ts (public API) |

**NOTE:** `agent-work-contracts/` (plural, under src/lib/) is the ACTIVE module used by the hivemind-agent-work tool. `work-contract/` (singular) is a SEPARATE module with its own types.

#### work-contract/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `work-contract/agent-work-contract.ts` | 182 | IMPLEMENTED (UNUSED) | createContract, validateContract, updateContractStatus | Only internal cross-refs |
| `work-contract/intent-classifier.ts` | 120 | IMPLEMENTED (UNUSED) | classifyIntent | chain-executor.ts |
| `work-contract/chain-executor.ts` | 208 | IMPLEMENTED (UNUSED) | ChainExecutor, createChainExecutionContext | Only internal cross-refs |
| `work-contract/compaction-packet.ts` | 81 | IMPLEMENTED (UNUSED) | contractToCompactionPacket | Only internal cross-refs |
| `work-contract/index.ts` | 22 | Barrel | Re-exports all | **Nobody** — no external consumers |

#### event-tracker/ (11 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `event-tracker/types.ts` | 298 | IMPLEMENTED | SessionJourneyDocument, SessionJourneyEvent, EventTrackerFileSystem | All event-tracker modules |
| `event-tracker/parser.ts` | 292 | IMPLEMENTED | parseProductDetoxSessionMarkdown | document-store.ts |
| `event-tracker/document-store.ts` | 307 | IMPLEMENTED | createEmptyDocument, appendEventToDocument, searchEvents | dual-persistence.ts |
| `event-tracker/hook-event.ts` | 205 | IMPLEMENTED | createEventTrackerArtifactsFromHook | plugin.ts, hooks |
| `event-tracker/artifact-writer.ts` | 247 | IMPLEMENTED | writeJourneyArtifact | dual-persistence.ts |
| `event-tracker/markdown-renderer.ts` | 105 | IMPLEMENTED | renderEventMarkdown | dual-persistence.ts |
| `event-tracker/classifier.ts` | 101 | IMPLEMENTED | classifyEvent | index.ts |
| `event-tracker/delegation-evidence.ts` | 112 | IMPLEMENTED | createDelegationEvidenceTracker | index.ts |
| `event-tracker/dual-persistence.ts` | 183 | IMPLEMENTED | createDualPersistence, renderClassifiedEventMarkdown | index.ts |
| `event-tracker/writer.ts` | 15 | IMPLEMENTED (thin) | writeSessionJourney | index.ts |
| `event-tracker/index.ts` | 12 | Barrel | Re-exports all | plugin.ts, index.ts (public API) |

#### runtime-pressure/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `runtime-pressure/types.ts` | 156 | IMPLEMENTED | RuntimePressureTier, PressureDecision, PressureToolAuthority | All RP modules |
| `runtime-pressure/model.ts` | 52 | IMPLEMENTED | detectRuntimePressure | operations.ts, command-engine |
| `runtime-pressure/authority-matrix.ts` | 252 | IMPLEMENTED | resolveToolAuthority, TOOL_AUTHORITY_MATRIX | control-plane.ts |
| `runtime-pressure/control-plane.ts` | 161 | IMPLEMENTED | createPressureControlPlane, resolvePressureAction | index.ts |
| `runtime-pressure/index.ts` | 4 | Barrel | Re-exports all | agent-work-contracts, hivemind-pressure tool |

#### trajectory/ (4 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `trajectory/types.ts` | 128 | IMPLEMENTED | TrajectoryLedger, TrajectoryRecord, TrajectoryEvent | All trajectory modules |
| `trajectory/ledger.ts` | 93 | IMPLEMENTED | createEmptyTrajectoryLedger, readTrajectoryLedger, writeTrajectoryLedger | store-operations.ts |
| `trajectory/store-operations.ts` | 190 | IMPLEMENTED | inspectTrajectoryLedger, attachTrajectoryEvidence, createTrajectoryCheckpoint | agent-work-contracts/operations.ts, hivemind-trajectory tool |
| `trajectory/index.ts` | 3 | Barrel | Re-exports all | index.ts (public API) |

#### doc-intelligence/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `doc-intelligence/types.ts` | 90 | IMPLEMENTED | DocIntelligenceAction, ParsedMarkdownDocument, DocChunk | All doc-intel modules |
| `doc-intelligence/parser.ts` | 96 | IMPLEMENTED | parseMarkdownDocument, extractMarkdownOutline | router.ts |
| `doc-intelligence/chunker.ts` | 92 | IMPLEMENTED | chunkMarkdownDocument | router.ts |
| `doc-intelligence/router.ts` | 162 | IMPLEMENTED | executeDocIntelligenceAction | hivemind-doc tool |
| `doc-intelligence/index.ts` | 14 | Barrel | Re-exports all | index.ts (public API) |

#### sdk-supervisor/ (2 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `sdk-supervisor/types.ts` | 110 | IMPLEMENTED | SdkSupervisorClient, SdkWrapperHealth | index.ts |
| `sdk-supervisor/index.ts` | 202 | IMPLEMENTED | SdkSupervisor class, executeSdkSupervisorAction | hivemind-sdk-supervisor tool |

#### command-engine/ (2 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `command-engine/types.ts` | 155 | IMPLEMENTED | CommandBundle, CommandEngineActionInput, CommandContextRenderResult | index.ts |
| `command-engine/index.ts` | 199 | IMPLEMENTED | discoverCommandBundles, renderCommandContext, previewRoute | hivemind-command-engine tool |

#### control-plane/ (3 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `control-plane/gate-decision.ts` | 122 | IMPLEMENTED | GateDecisionType, isBlockingDecision, classifyGateDecision | gatekeeper.ts |
| `control-plane/gatekeeper.ts` | 212 | IMPLEMENTED | createGatekeeper, BLOCKING_GATES, NON_BLOCKING_GATES | index.ts |
| `control-plane/index.ts` | 31 | Barrel | Re-exports all | index.ts (public API) |

#### config-workflow/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `config-workflow/workflow-types.ts` | 53 | IMPLEMENTED | ConfigWorkflowState, WorkflowTurn, WORKFLOW_TURNS | All config-workflow modules |
| `config-workflow/workflow-state.ts` | 185 | IMPLEMENTED | createWorkflowState, advanceTurn, completeCurrentTurn | workflow-persistence.ts |
| `config-workflow/workflow-persistence.ts` | 182 | IMPLEMENTED | persistWorkflow, readWorkflow, deleteWorkflow | plugin.ts (inline import) |
| `config-workflow/workflow-guards.ts` | 122 | IMPLEMENTED | validateTurnPrecondition, hasCollectedPrerequisites | configure-primitive.ts |
| `config-workflow/index.ts` | 43 | Barrel | Re-exports all | plugin.ts (inline import) |

#### recovery/ (4 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `recovery/failure-classes.ts` | 168 | IMPLEMENTED | FAILURE_CLASSES, classifyFailure | assess-state.ts |
| `recovery/assess-state.ts` | 218 | IMPLEMENTED | assessRecoveryState, RecoverySeverity | recovery-engine.ts |
| `recovery/create-checkpoint.ts` | 143 | IMPLEMENTED | createRecoveryCheckpoint | recovery-engine.ts |
| `recovery/repair-state.ts` | 205 | IMPLEMENTED | repairRecoveryState | recovery-engine.ts |
| `recovery/index.ts` | 29 | Barrel | Re-exports all | recovery-engine.ts only |

#### session-entry/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `session-entry/purpose-classifier.ts` | 195 | IMPLEMENTED | classifyPurpose, PURPOSE_CLASSES | intake-gate.ts |
| `session-entry/language-resolution.ts` | 153 | IMPLEMENTED | detectLanguage, LanguageDetection | intake-gate.ts |
| `session-entry/profile-resolver.ts` | 148 | IMPLEMENTED | resolveProfile, ProfileMatch | intake-gate.ts |
| `session-entry/intake-gate.ts` | 148 | IMPLEMENTED | resolveIntake, PURPOSE_TO_ROUTING_TARGET | index.ts |
| `session-entry/index.ts` | 23 | Barrel | Re-exports all | hooks/plugin-event-observers.ts (wired via `resolveIntake`) |

#### runtime-detection/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `runtime-detection/codemap.ts` | 109 | IMPLEMENTED | buildCodemap, Codemap | index.ts |
| `runtime-detection/codescan.ts` | 176 | IMPLEMENTED | scanCodebase, CodeScanResult | index.ts |
| `runtime-detection/file-watcher.ts` | 122 | IMPLEMENTED | createPackageJsonWatcher, PackageSnapshot | index.ts |
| `runtime-detection/stack-synthesizer.ts` | 90 | IMPLEMENTED | synthesizeTechStack | index.ts |
| `runtime-detection/index.ts` | 4 | Barrel | Re-exports all | **Nobody** — not wired to plugin.ts or tools |

#### prompt-packet/ (4 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `prompt-packet/kernel-packet.ts` | 149 | IMPLEMENTED | buildKernelPacket | index.ts |
| `prompt-packet/delegation-packet.ts` | 73 | IMPLEMENTED | buildDelegationPacket | index.ts |
| `prompt-packet/compaction-preservation.ts` | 108 | IMPLEMENTED | buildCompactionPreservationPacket | hooks/create-session-hooks.ts (wired) |
| `prompt-packet/index.ts` | 18 | Barrel | Re-exports all | hooks/create-session-hooks.ts (kernel-packet + compaction-preservation wired) |

#### pty/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `pty/pty-manager.ts` | 145 | IMPLEMENTED | PtyManager class (spawn, read, list, kill, isSupported) | command-delegation.ts, plugin.ts |
| `pty/pty-types.ts` | 110 | IMPLEMENTED | PtySpawnRequest, PtySessionRecord, PtyReadResult | pty-manager.ts |
| `pty/pty-buffer.ts` | 67 | IMPLEMENTED | createPtyBuffer | pty-manager.ts |
| `pty/pty-runtime.ts` | 21 | IMPLEMENTED | createPtyManagerIfSupported | plugin.ts |
| `pty/bun-pty.d.ts` | 55 | TYPE DECL | bun-pty ambient type declarations | pty-manager.ts (ambient) |

#### security/ (2 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `security/path-scope.ts` | 105 | IMPLEMENTED | assertPathWithinRoot | continuity.ts, doc-intelligence, recovery |
| `security/redaction.ts` | 118 | IMPLEMENTED | redactBoundaryFields, redactTextSecrets | continuity.ts, plugin-tool-output-summary.ts, event-tracker |

#### spawner/ (6 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `spawner/spawn-request-builder.ts` | 136 | IMPLEMENTED | buildSdkSpawnRequest, resolveDelegationPermissionProfile, DelegateParams | delegation-manager.ts |
| `spawner/agent-primitive-policy.ts` | 51 | IMPLEMENTED | enrichAgentFromPrimitives, parsePermissionRecord | delegation-manager.ts, spawn-request-builder.ts |
| `spawner/session-creator.ts` | 35 | IMPLEMENTED | spawnDelegatedSession | delegation-manager.ts |
| `spawner/spawner-types.ts` | 84 | IMPLEMENTED | ValidatedAgent | spawn-request-builder.ts |
| `spawner/concurrency-key.ts` | 13 | IMPLEMENTED | resolveDelegationConcurrencyKey | delegation-manager.ts |
| `spawner/parent-directory.ts` | 9 | IMPLEMENTED | resolveParentWorkingDirectory | delegation-manager.ts |

#### supervisor/ (5 files)

| Module Path | LOC | Status | Key Exports | Used By |
|-------------|-----|--------|-------------|---------|
| `supervisor/health.ts` | 125 | IMPLEMENTED | getHealthStatus, getDiagnostics | index.ts |
| `supervisor/command-bundle.ts` | (see supervisor) | IMPLEMENTED | sortCommandBundles, routeCommand | index.ts |
| `supervisor/context-renderer.ts` | 62 | IMPLEMENTED | renderSupervisorContext | index.ts |
| `supervisor/messages-transform.ts` | 83 | IMPLEMENTED | transformMessagesForSupervisor | index.ts |
| `supervisor/index.ts` | 17 | Barrel | Re-exports all | **REMOVED in HER-2** |

### Tools (src/tools/)

| Module Path | LOC | Status | Registered In plugin.ts |
|-------------|-----|--------|------------------------|
| `tools/configure-primitive.ts` | 490 | IMPLEMENTED | Yes |
| `tools/run-background-command.ts` | 221 | IMPLEMENTED | Yes |
| `tools/prompt-analyze/tools.ts` | 169 | IMPLEMENTED | Yes |
| `tools/prompt-skim/tools.ts` | 107 | IMPLEMENTED | Yes |
| `tools/session-patch/tools.ts` | 136 | IMPLEMENTED | Yes |
| `tools/hivemind-agent-work.ts` | 152 | IMPLEMENTED | Yes |
| `tools/delegation-status.ts` | 135 | IMPLEMENTED | Yes |
| `tools/session-journal-export.ts` | 117 | IMPLEMENTED | Yes |
| `tools/validate-restart.ts` | 116 | IMPLEMENTED | Yes |
| `tools/hivemind-trajectory.ts` | 112 | IMPLEMENTED | Yes |
| `tools/hivemind-pressure.ts` | 94 | IMPLEMENTED | Yes |
| `tools/hivemind-doc.ts` | 45 | IMPLEMENTED | Yes |
| `tools/hivemind-command-engine.ts` | 58 | IMPLEMENTED | Yes |
| `tools/hivemind-sdk-supervisor.ts` | 53 | IMPLEMENTED | Yes |
| `tools/delegate-task.ts` | 75 | IMPLEMENTED | Yes |
| `tools/configure-primitive-paths.ts` | 45 | IMPLEMENTED | Helper for configure-primitive |
| `tools/session-patch/types.ts` | 19 | IMPLEMENTED | Types for session-patch |
| `tools/session-patch/index.ts` | 6 | Barrel | — |
| `tools/prompt-skim/types.ts` | 18 | IMPLEMENTED | Types |
| `tools/prompt-skim/index.ts` | 6 | Barrel | — |
| `tools/prompt-analyze/types.ts` | 17 | IMPLEMENTED | Types |
| `tools/prompt-analyze/index.ts` | 6 | Barrel | — |

### Hooks (src/hooks/)

| Module Path | LOC | Status | Used By |
|-------------|-----|--------|---------|
| `hooks/create-session-hooks.ts` | 285 | IMPLEMENTED | plugin.ts |
| `hooks/create-tool-guard-hooks.ts` | 156 | IMPLEMENTED | plugin.ts |
| `hooks/create-core-hooks.ts` | 106 | IMPLEMENTED | plugin.ts |
| `hooks/tool-after-composer.ts` | 71 | IMPLEMENTED | plugin.ts |
| `hooks/messages-transform.ts` | 58 | IMPLEMENTED | hooks internal |
| `hooks/plugin-event-observers.ts` | 49 | IMPLEMENTED | plugin.ts |
| `hooks/hook-cqrs-boundary.ts` | 36 | IMPLEMENTED | hooks internal |
| `hooks/types.ts` | 28 | IMPLEMENTED | hooks internal |

---

## Overlap Clusters

### 1. Delegation Triad (CRITICAL OVERLAP)

Three modules handle delegation dispatch:

| Module | Role | LOC |
|--------|------|-----|
| `delegation-manager.ts` | Orchestrator — owns DelegationManager class | 468 |
| `sdk-delegation.ts` | SDK-mode handler — stability polling | 281 |
| `command-delegation.ts` | PTY/headless-mode handler — process tracking | 418 |

**Verdict:** This is INTENTIONAL architecture — DelegationManager composes the two handlers via Strategy pattern. No overlap; clean separation.

### 2. Agent Work Contract — Single Module (HER-2 cleanup)

| Module Tree | Files | Status | Used By |
|-------------|-------|--------|---------|
| `agent-work-contracts/` (plural) | 4 files, ~400 LOC | ACTIVE — used by hivemind-agent-work tool | plugin.ts via tool |
| `work-contract/` (singular) | — | **REMOVED in HER-2** | — |

**Verdict:** `work-contract/` removed during HER-2 dead code cleanup (~613 LOC). `agent-work-contracts/` is the sole active module.

### 3. Recovery Facade vs. Subsystem (HER-2 cleanup)

| Module | Role | Status |
|--------|------|--------|
| `recovery/index.ts` | Barrel re-export | USED by recovery subsystem |
| `recovery-engine.ts` | Facade bundling all 4 recovery ops | **REMOVED in HER-2** |

**Verdict:** `recovery-engine.ts` removed during HER-2 dead code cleanup (~72 LOC). The recovery subsystem modules (assess-state, repair-state, etc.) remain implemented.

### 4. Prompt Packet (NOW WIRED — HER-2)

| Module | LOC | Status |
|--------|-----|--------|
| `prompt-packet/kernel-packet.ts` | 149 | IMPLEMENTED — imported by hooks/create-session-hooks.ts |
| `prompt-packet/delegation-packet.ts` | 73 | IMPLEMENTED — available via barrel |
| `prompt-packet/compaction-preservation.ts` | 108 | IMPLEMENTED — imported by hooks/create-session-hooks.ts |

**Verdict:** Prompt packet subsystem is now wired into the runtime via `create-session-hooks.ts`. Compaction preservation is active during session compaction events.

### 5. Session Entry (NOW WIRED — HER-2)

| Module | LOC | Status |
|--------|-----|--------|
| `session-entry/purpose-classifier.ts` | 195 | IMPLEMENTED — used by intake-gate.ts |
| `session-entry/language-resolution.ts` | 153 | IMPLEMENTED — used by intake-gate.ts |
| `session-entry/profile-resolver.ts` | 148 | IMPLEMENTED — used by intake-gate.ts |
| `session-entry/intake-gate.ts` | 148 | IMPLEMENTED — imported by hooks/plugin-event-observers.ts |

**Verdict:** Session intake pipeline is now wired into the runtime via `plugin-event-observers.ts`. The `resolveIntake()` function runs on session creation events. Total: 667 LOC active.

### 6. Runtime Detection (STILL DEAD — 195 LOC)

| Module | LOC | Status |
|--------|-----|--------|
| `runtime-detection/codemap.ts` | 109 | IMPLEMENTED, UNUSED |
| `runtime-detection/codescan.ts` | 176 | IMPLEMENTED, UNUSED |
| `runtime-detection/file-watcher.ts` | 122 | IMPLEMENTED, UNUSED |
| `runtime-detection/stack-synthesizer.ts` | 90 | IMPLEMENTED, UNUSED |

**Verdict:** Entire runtime-detection subsystem remains dead code. No module outside `runtime-detection/` imports any of its files. 195 LOC total. Candidate for HER-3 removal.

### 7. Supervisor (REMOVED — HER-2)

| Module | LOC | Status |
|--------|-----|--------|
| `supervisor/` (entire dir) | — | **REMOVED in HER-2** |

**Verdict:** Entire supervisor subsystem removed during HER-2 dead code cleanup (~287 LOC).

### 8. Auto-Loop / Ralph-Loop (NOW WIRED — HER-2)

| Module | LOC | Status |
|--------|-----|--------|
| `auto-loop.ts` | 146 | IMPLEMENTED — imported by plugin.ts, injected into hook deps |
| `ralph-loop.ts` | 182 | IMPLEMENTED — imported by plugin.ts, injected into hook deps |

**Verdict:** Both loop primitives are now wired into the runtime. `runAutoLoop` and `runRalphLoop` are passed as dependencies to hook factories via `plugin.ts:78`.

---

## Dead Modules (not imported by plugin.ts, tools, or hooks)

*Updated 2026-05-06 — reflects HER-2 dead code removal and wiring.*

| Module | LOC | Reason Dead |
|--------|-----|-------------|
| `runtime-detection/codemap.ts` | 109 | Not wired |
| `runtime-detection/codescan.ts` | 176 | Not wired |
| `runtime-detection/file-watcher.ts` | 122 | Not wired |
| `runtime-detection/stack-synthesizer.ts` | 90 | Not wired |
| `runtime-detection/index.ts` | 4 | Barrel, no consumers |
| **Total Dead LOC** | **~195** | **~1.2% of src/lib/** |

### Removed in HER-2 (no longer in codebase)

| Module | LOC Removed | Reason |
|--------|-------------|--------|
| `work-contract/` (entire dir) | ~613 | Superseded by agent-work-contracts/ |
| `supervisor/` (entire dir) | ~287 | Not wired to plugin |
| `recovery-engine.ts` | ~72 | Facade only, no consumers |
| **HER-2 Total Removed** | **~972 LOC source** | Plus ~955 LOC tests |

---

## Implementation Depth Assessment

### Fully Implemented & Wired to Runtime

These modules have real logic, real tests, and are actively imported by plugin.ts or its transitive dependencies:

- Core: `types.ts`, `continuity.ts`, `delegation-manager.ts`, `delegation-state-machine.ts`, `command-delegation.ts`, `sdk-delegation.ts`, `concurrency.ts`, `completion-detector.ts`, `state.ts`, `helpers.ts`, `session-api.ts`, `lifecycle-manager.ts`, `runtime.ts`, `runtime-policy.ts`
- Delegation: `delegation-persistence.ts`, `delegation-types.ts`, `category-gates.ts`, `category-gate-audit.ts`
- Spawner: all 6 files
- Security: both files
- PTY: all 5 files
- Event Tracker: all 11 files
- Config Workflow: all 5 files
- All 8 hooks files
- All 23 tool files
- All 15 schema-kernel files
- All tools are registered in plugin.ts

### Implemented but NOT Wired (dead code with real logic)

- `runtime-detection/` — codemap + codescan + file-watcher + stack-synthesizer, 195 LOC total — no consumers outside the directory

### Wired in HER-2 (previously dead, now active)

- `auto-loop.ts` — wired via plugin.ts → hook deps injection
- `ralph-loop.ts` — wired via plugin.ts → hook deps injection
- `session-entry/` — wired via hooks/plugin-event-observers.ts (`resolveIntake`)
- `prompt-packet/compaction-preservation.ts` — wired via hooks/create-session-hooks.ts
- `prompt-packet/kernel-packet.ts` — wired via hooks/create-session-hooks.ts

### Removed in HER-2

- `work-contract/` — superseded by agent-work-contracts/ (~613 LOC removed)
- `supervisor/` — health + command + context modules (~287 LOC removed)
- `recovery-engine.ts` — facade for recovery subsystem (~72 LOC removed)

---

*Implementation inventory: 2026-05-05 — updated 2026-05-06 (HER-2 dead code removal + wiring)*
