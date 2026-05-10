# Graph Report - hivemind-plugin-1  (2026-05-06)

## Corpus Check
- 286 files · ~1,004,011 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1105 nodes · 2486 edges · 76 communities (66 shown, 10 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 240 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5c1e218`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `getNestedValue()` - 33 edges
2. `DelegationManager` - 32 edges
3. `HarnessControlPlane()` - 30 edges
4. `TaskStateManager` - 26 edges
5. `assertPathWithinRoot()` - 24 edges
6. `success()` - 23 edges
7. `renderToolResult()` - 23 edges
8. `DelegationStateMachine` - 21 edges
9. `error()` - 20 edges
10. `handleCompile()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `makeEntry()` --calls--> `createJournalEntry()`  [INFERRED]
  tests/lib/journal-replay.test.ts → src/lib/session-journal.ts
- `makeEntry()` --calls--> `createJournalEntry()`  [INFERRED]
  tests/lib/journal-query.test.ts → src/lib/session-journal.ts
- `HarnessControlPlane()` --calls--> `createPromptSkimTool()`  [INFERRED]
  src/plugin.ts → src/tools/prompt-skim/tools.ts
- `HarnessControlPlane()` --calls--> `loadRuntimePolicy()`  [INFERRED]
  src/plugin.ts → src/lib/runtime-policy.ts
- `HarnessControlPlane()` --calls--> `resolveWorkspaceRuntimePolicy()`  [INFERRED]
  src/plugin.ts → src/lib/workspace-runtime-policy.ts

## Communities (76 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (61): buildEventId(), createJourneyEventFromHook(), eventTypeFromHook(), isToolHookType(), resolveHookType(), resolveRootSessionId(), resolveSessionId(), resolveToolName() (+53 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (41): validateTurnPrecondition(), advanceTurn(), canAdvanceTurn(), cloneWorkflowState(), completeCurrentTurn(), getTurnName(), isWorkflowComplete(), batchCompile() (+33 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (60): buildEventId(), cleanupEventTrackerArtifacts(), createEventTrackerArtifactsFromHook(), createEventTrackerDirectory(), findKnownRootSessionId(), getEventTrackerArtifactPaths(), mergeSessionExportMarkdownArtifacts(), resolveHookType() (+52 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (44): recordCategoryGateask(), cloneCapturedResult(), cloneCompactionCheckpoint(), cloneContinuityRecord(), cloneDelegationMeta(), cloneDelegationPacket(), cloneGovernanceState(), cloneLifecycleState() (+36 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (40): boundCompaction(), boundText(), createAgentWorkContract(), exportAgentWorkContract(), renderList(), renderMarkdownContract(), cloneContract(), cloneStore() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (25): deleteWorkflow(), getWorkflowStorePath(), normalizeWorkflowEntry(), persistWorkflow(), persistWorkflows(), readPersistedWorkflows(), readWorkflow(), getCanonicalStateDir() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (38): chunkMarkdownDocument(), countFrontmatterLines(), countWords(), extractMarkdownOutline(), parseMarkdownDocument(), slugifyHeading(), executeDocIntelligenceAction(), isMarkdownFile() (+30 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (27): buildExecutionLineage(), renderExecutionLineageMarkdown(), queryByEventType(), queryBySession(), queryByTimeRange(), queryJournal(), readJournalEntries(), makeEntry() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (5): CommandDelegationHandler, describeError(), createPtyBuffer(), PtyManager, createPtyManagerIfSupported()

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (5): ensureSessionStats(), getDelegationMeta(), getSessionStats(), hydrateDelegationState(), TaskStateManager

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (22): detectMCPServerGaps(), detectMissingAgentBindings(), detectMissingSkillDependencies(), detectPermissionDeadlocks(), detectRoleOverlaps(), detectRuleFileGaps(), extractServerNames(), partitionBySeverity() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (19): analyzeCommandContract(), discoverCommandBundles(), executeCommandEngineAction(), normalizeContextLimit(), renderCommandContext(), requireCommand(), resolveRouteStatus(), routeCommandPreview() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (19): classifyGateDecision(), isBlockingDecision(), isStateFilePath(), createGatekeeper(), buildRegistry(), detectCircularDependencies(), detectConflicts(), detectDuplicateNames() (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (15): createDelegationEventObserver(), createSessionEntryEventObserver(), createSessionJourneyEventObserver(), createPromptAnalyzeTool(), createSessionPatchTool(), HarnessControlPlane(), createConfigurePrimitiveTool(), createDelegateTaskTool() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.24
Nodes (19): executeTrajectoryToolAction(), createEmptyTrajectoryLedger(), getTrajectoryLedgerPath(), isTrajectoryLedger(), normalizeTrajectoryLedger(), quarantineCorruptLedger(), readTrajectoryLedger(), writeTrajectoryLedger() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.2
Nodes (11): discoverCommands(), validateCommand(), buildHarnessCli(), runCli(), renderError(), renderHelp(), renderJson(), renderTable() (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (9): createRegistryValidator(), resolveIntake(), detectLanguage(), computeConfidence(), resolveCommunicationStyle(), resolveDecisionSpeed(), resolveExpertise(), resolveProfile() (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (8): validAgentFile(), validAgentFm(), validCmdFile(), validCmdFm(), validSkillFile(), validSkillFm(), validToolDef(), validToolFile()

### Community 20 - "Community 20"
Cohesion: 0.26
Nodes (7): buildDelegationQueueKey(), reserveSubagentSpawn(), buildDelegationPromptTools(), resolveAcquireArgs(), resolveConcurrencyForKey(), resolveDelegationConcurrencyKey(), resolveParentWorkingDirectory()

### Community 22 - "Community 22"
Cohesion: 0.31
Nodes (9): detectFrameworks(), detectSingleFramework(), isOverlapping(), validateBoundaries(), buildSimpleCodemap(), buildSimpleScan(), deriveProjectType(), inferLanguage() (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.36
Nodes (7): getRuntimePolicyForSession(), loadRuntimePolicy(), validateBudgetPolicy(), validateCategoryGatePolicy(), validateConcurrencyPolicy(), validateTrustedRuntimePolicy(), resolveWorkspaceRuntimePolicy()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (3): getInternals(), injectDelegation(), seedDelegation()

### Community 26 - "Community 26"
Cohesion: 0.36
Nodes (4): runAutoLoop(), escalationMessage(), formatThrown(), runRalphLoop()

### Community 27 - "Community 27"
Cohesion: 0.28
Nodes (4): isClassifiedDocument(), readClassifiedDocument(), renderClassifiedEventMarkdown(), summarizeOriginal()

### Community 28 - "Community 28"
Cohesion: 0.42
Nodes (6): addPromptToolDenialsForPrimitivePolicy(), buildSdkSpawnRequest(), isPermissionDenied(), isReviewOnlyTask(), resolveDelegationPermissionProfile(), toolsFromAgentMetadata()

### Community 30 - "Community 30"
Cohesion: 0.54
Nodes (7): asString(), classifyEvent(), isClassifiedType(), isDelegationCreated(), isDelegationReturned(), isObject(), resolveClassifiedType()

### Community 31 - "Community 31"
Cohesion: 0.48
Nodes (4): enrichAgentFromPrimitives(), isRecord(), parsePermissionRecord(), parseToolBooleans()

### Community 34 - "Community 34"
Cohesion: 0.7
Nodes (3): allow(), ask(), resolveCategoryGateDecision()

### Community 35 - "Community 35"
Cohesion: 0.8
Nodes (3): isCanonicalStatePath(), readCanonicalState(), refuseCanonicalWrite()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `assertPathWithinRoot()` connect `Community 6` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `TaskStateManager` connect `Community 9` to `Community 32`, `Community 0`, `Community 26`, `Community 20`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `DelegationManager` connect `Community 18` to `Community 32`, `Community 1`, `Community 3`, `Community 37`, `Community 5`, `Community 14`, `Community 20`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `getNestedValue()` (e.g. with `extractLastAssistantText()` and `resolveToolHookSessionId()`) actually correct?**
  _`getNestedValue()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `HarnessControlPlane()` (e.g. with `loadRuntimePolicy()` and `resolveWorkspaceRuntimePolicy()`) actually correct?**
  _`HarnessControlPlane()` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `assertPathWithinRoot()` (e.g. with `handleCompile()` and `resolveAllowedSessionPath()`) actually correct?**
  _`assertPathWithinRoot()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._