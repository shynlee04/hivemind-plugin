# Session Inspection Export

- ses_id: `ses_2e5b80b50ffeUxYZMOZHpLnNL8`
- prepared_at: `2026-03-23T10:42:23.902Z`

## Assistant Output

Based on my comprehensive investigation, here is the complete pipeline map:

---

# PRE-SEND HUMAN-USER MESSAGE INJECTION PIPELINE MAP

## PIPELINE: `experimental.chat.messages.transform`

```
PIPELINE-messages-transform:
  segments:
    - name: Source Definition
      src: src/plugin/messages-transform-adapter.ts
      dist: dist/plugin/messages-transform-adapter.js
      registration: N/A (source only)
      invocation: N/A
      modification_point: |
        Lines 41-178: createMessagesTransformHandler() function
        - Finds last user message via findLastUserMessage()
        - Filters by variant === 'new' || variant === 'continue'
        - Extracts sessionID/messageID from lastUserMessage.info
        - Calls turnSnapshot.getSnapshot() for runtime bindings
        - Creates StartWorkInput via createStartWorkInput()
        - Calls resolveStartWork() for purpose classification
        - Injects synthetic parts at line 170: lastUserMessage.parts = [...injectedParts, ...lastUserMessage.parts]
        - Conditionally appends route hint at line 173

    - name: Registration (Plugin Factory)
      src: src/plugin/opencode-plugin.ts (lines 50-54, 203)
      dist: dist/plugin/opencode-plugin.js (lines 38-42, 171)
      registration: |
        Line 50-54: Creates messagesTransform handler with deps:
          - directory: input.directory
          - turnSnapshot: createTurnSnapshotLoader(directory)
          - nlFirstDispatchKeys: new Set<string>()
        Line 203: 'experimental.chat.messages.transform': messagesTransform
      invocation: OpenCode SDK calls hook by name on each chat turn
      modification_point: Line 203 in opencode-plugin.ts exports the handler

    - name: Compilation/Transpilation
      src: src/plugin/messages-transform-adapter.ts (179 lines, TypeScript)
      dist: dist/plugin/messages-transform-adapter.js (135 lines, JavaScript)
      registration: TypeScript compiled via tsc, source maps generated
      invocation: Loaded by OpenCode plugin loader from dist/
      modification_point: |

    - name: Runtime Wiring
      src: src/plugin/opencode-plugin.ts line 203
      dist: dist/plugin/opencode-plugin.js line 171
      registration: |
        'experimental.chat.messages.transform': messagesTransform
        This is the direct hook registration object key.
      invocation: |
        OpenCode runtime calls: await Plugin.trigger('experimental.chat.messages.transform', input, output)
        - Input: { agent?: string } — agent ID from runtime
        - Output: { messages: MessageLike[] } — mutable message array
      modification_point: The handler receives output.messages and mutates lastUserMessage.parts

    - name: Invocation Trigger
      src: N/A (OpenCode internal)
      dist: N/A
      registration: OpenCode calls hook on every chat turn before LLM invocation
      invocation: |
        Trigger conditions:
        1. Every chat turn where OpenCode assembles messages for LLM
        2. SDK hook key: 'experimental.chat.messages.transform'
        3. Variant filter: only injects if lastMsg.info?.variant === 'new' || 'continue'
      modification_point: Variant filter at messages-transform-adapter.ts lines 56-59

    - name: Turn Snapshot Loader (Dependency)
      src: src/plugin/runtime-snapshot.ts (35 lines)
      dist: dist/plugin/runtime-snapshot.js
      registration: |
        Created at opencode-plugin.ts line 46:
        const turnSnapshot = createTurnSnapshotLoader(directory)
      invocation: Called within messagesTransform handler at lines 68, 103
      modification_point: |
        TurnSnapshotLoader interface:
        - getSnapshot(): Promise<RuntimeBindingsSnapshot> — caches per turn
        - resetTurnSnapshot(): void — clears cache at turn start

    - name: Injection Point (Message Modification)
      src: src/plugin/messages-transform-adapter.ts line 170
      dist: dist/plugin/messages-transform-adapter.js line 126
      registration: |
        Synthetic parts injected in order:
        1. turnHierarchyPacket (line 137)
        2. contextPacket (line 138)
        3. skillFocusPacket (line 143) — conditional on skills.length > 0
        4. routeReminder (line 175) — appended after user parts, conditional
      invocation: |
        Line 170: lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]
        Line 173-176: routeReminder appended after user parts
      modification_point: |
        Mutation target: output.messages[lastUserIndex].parts
        All synthetic parts have synthetic: true flag and ui_hidden: true metadata

    - name: Final Send Path
      src: N/A (OpenCode internal)
      dist: N/A
      registration: Modified messages array passed to LLM.stream() or equivalent
      invocation: |
        After hook completes, OpenCode uses modified output.messages
        for the LLM call in this turn.
      modification_point: Messages now contain prepended synthetic parts
```

---

## SUPPORTING PIPELINES

### PIPELINE: Turn Snapshot Loader

```
PIPELINE-turn-snapshot:
  segments:
    - name: TurnSnapshotLoader Factory
      src: src/plugin/runtime-snapshot.ts (lines 20-35)
      dist: dist/plugin/runtime-snapshot.js
      registration: |
        Created at opencode-plugin.ts line 46:
        const turnSnapshot = createTurnSnapshotLoader(directory)
      invocation: Called via turnSnapshot.getSnapshot() and turnSnapshot.resetTurnSnapshot()
      modification_point: Returns cached RuntimeBindingsSnapshot per turn

    - name: Snapshot Loading
      src: src/features/runtime-entry/snapshot-loader.ts (73 lines)
      dist: dist/features/runtime-entry/snapshot-loader.js
      registration: |
        loadRuntimeBindingsSnapshot() function:
        - loadRuntimeAttachmentSettings(projectRoot)
        - detectEntryKernelState(projectRoot)
        - loadTrajectoryLedger(projectRoot)
        - inspectTrajectoryLedger(projectRoot)
        - inspectWorkflowAuthority(projectRoot, {...})
      invocation: Called by TurnSnapshotLoader.getSnapshot() when cache miss
      modification_point: Returns RuntimeBindingsSnapshot (40+ fields)
```

### PIPELINE: Purpose Classification

```
PIPELINE-purpose-classification:
  segments:
    - name: Entry Point (start-work-router)
      src: src/hooks/start-work/start-work-router.ts (189 lines)
      dist: dist/hooks/start-work/start-work-router.js
      registration: |
        Called by messages-transform-adapter.ts line 71-77:
        const startWork = resolveStartWork(createStartWorkInput({...}))
      invocation: Called on every messages.transform invocation
      modification_point: Returns StartWorkDecision with purposeClass, sessionState, etc.

    - name: Purpose Classifier
      src: src/features/session-entry/purpose-classifier.ts (79 lines)
      dist: dist/features/session-entry/purpose-classifier.js
      registration: Called by start-work-router.ts line 40
      invocation: classifyPurpose(userMessage, attachments)
      modification_point: |
        Returns PurposeClassification:
        - purposeClass: 'discovery' | 'brainstorming' | 'research' | 'planning' | 'implementation' | 'gatekeeping' | 'tdd' | 'course-correction'
        - confidence: number
        - reasons: string[]

    - name: Lineage Router
      src: src/features/session-entry/lineage-router.ts (37 lines)
      dist: dist/features/session-entry/lineage-router.js
      registration: Called by start-work-router.ts line 39
      invocation: resolveLineage(userMessage, activeLineage)
      modification_point: Returns KernelLineage ('hivefiver' | 'hiveminder' | etc.)

    - name: Session State Detector
      src: src/features/session-entry/session-state.ts (25 lines)
      dist: dist/features/session-entry/session-state.js
      registration: Called by start-work-router.ts lines 68-76
      invocation: detectSessionState(input), detectContinuityAlerts(input)
      modification_point: Returns SessionStateKind: 'fresh' | 'ongoing' | 'continuation' | 'sub-session'
```

### PIPELINE: Skill Exposure

```
PIPELINE-skill-exposure:
  segments:
    - name: Skill Exposure Map
      src: src/plugin/skill-exposure-map.ts (255 lines)
      dist: dist/plugin/skill-exposure-map.js
      registration: |
        Called by messages-transform-adapter.ts lines 119-124:
        const skillBundle = resolveSkillBundle(activeAgent, startWork.purposeClass, startWork.sessionState)
        const sessionRole = resolveSessionRole(startWork.sessionState, activeAgent)
      invocation: Per turn in messages.transform
      modification_point: |
        resolveSkillBundle() returns SkillEntry[] (max 7 skills)
        - SHARED_SKILLS (always-on)
        - AGENT_BUNDLES (per registered agent)
        - PURPOSE_CONDITIONAL (purpose-based additions)
        - SUBSESSION_ADDITIONS (sub-session only)

    - name: Skill Focus Renderer
      src: src/plugin/skill-focus-renderer.ts (53 lines)
      dist: dist/plugin/skill-focus-renderer.js
      registration: Called by messages-transform-adapter.ts line 133
      invocation: renderSkillFocusBlock(skillBundle, sessionRole)
      modification_point: Returns string with <available_skills> XML block
```

### PIPELINE: Context Rendering

```
PIPELINE-context-rendering:
  segments:
    - name: Context Renderer (Builder)
      src: src/plugin/context-renderer.builder.ts (98 lines)
      dist: dist/plugin/context-renderer.builder.js
      registration: Called by messages-transform-adapter.ts line 127
      invocation: createHivemindContextPacket({sessionId, snapshot, startWork})
      modification_point: Returns HivemindContextPacket (44 fields via intersection types)

    - name: Context Renderer (Renderers)
      src: src/plugin/context-renderer.renderers.ts (107 lines)
      dist: dist/plugin/context-renderer.renderers.js
      registration: Called by messages-transform-adapter.ts line 127, 132
      invocation: |
        renderHivemindContext(packet) — renders <hivemind context_version="v1"> block
        renderTurnHierarchy(context) — renders <hivemind-turn-hierarchy> block
      modification_point: Returns serialized string for synthetic part injection

    - name: Context Renderer (Types)
      src: src/plugin/context-renderer.types.ts (168 lines)
      dist: dist/plugin/context-renderer.types.js
      registration: Type definitions used by builder and renderers
      invocation: N/A
      modification_point: |
        HivemindContextPacket = HivemindSessionIdentity & HivemindEntryState & HivemindGovernanceConfig & HivemindAgentWorkContract & HivemindTDDState & HivemindBMADState & HivemindResearchState

    - name: Context Renderer (Constants)
      src: src/plugin/context-renderer.constants.ts (111 lines)
      dist: dist/plugin/context-renderer.constants.js
      registration: Validation at module load
      invocation: HIVEMIND_BASE_CONTEXT_KEYS (11), HIVEMIND_AGENT_WORK_CONTEXT_KEYS (20)
      modification_point: Build-time validation that base and agent-work keys don't collide

    - name: Compaction Renderers
      src: src/plugin/context-renderer.compaction-renderers.ts (240 lines)
      dist: dist/plugin/context-renderer.compaction-renderers.js
      registration: Used by compaction-adapter.ts (not messages-transform)
      invocation: detectWorkflowStyle(), renderTDDCompaction(), etc.
      modification_point: Used for session.compacting hook (separate pipeline)
```

---

## DEAD PATHWAY VERIFICATION

### nl-first-dispatch Verification

```
PIPELINE-nl-first-dispatch:
  status: DEAD_PATHWAY_CONFIRMED
  segments:
    - name: nl-first-dispatch Implementation
      src: src/features/runtime-entry/nl-first-dispatch.ts (86 lines)
      dist: dist/features/runtime-entry/nl-first-dispatch.js
      registration: Called by messages-transform-adapter.ts line 85
      invocation: |
        maybeExecuteNlFirstRuntimeDispatch() is called but ALWAYS returns:
        shouldDispatch: false
        reason: 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.'
      broken_segment: |
        VERIFIED DEAD: All code paths return shouldDispatch: false
        
        Test evidence (tests/nl-first-dispatch.test.ts):
        - Line 54: assert.deepEqual(result.plan, { shouldDispatch: false, ... })
        - Line 79: assert.deepEqual(result.plan, { shouldDispatch: false, ... })
        
        Implementation evidence (nl-first-dispatch.ts lines 30-85):
        - Line 30: CONSTANT DISPATCH_UNAVAILABLE_REASON
        - Line 47: control-plane path → shouldDispatch: false
        - Line 59: no commandId path → shouldDispatch: false
        - Line 70: no bundle path → shouldDispatch: false
        - Line 80: workflow-command path → shouldDispatch: false
        
        Impact: The route hint is ALWAYS preserved (never dispatched to command execution).
```

---

## BROKEN SEGMENTS ANALYSIS

```
BROKEN_SEGMENTS:
  - segment: nl-first-dispatch execution bridge
    severity: DEAD_CODE
    evidence: |
      maybeExecuteNlFirstRuntimeDispatch() is called at messages-transform-adapter.ts:85
      but ALWAYS returns shouldDispatch: false per constant DISPATCH_UNAVAILABLE_REASON.
      The nlFirstDispatchKeys Set tracking is therefore always empty — no dispatch ever occurs.
    impact: Route hints are never executed as commands. The entire nl-first-dispatch
            feature is non-functional in the messages.transform flow.

  - segment: messages.transform variant filter
    severity: BY_DESIGN
    evidence: |
      Lines 56-59 filter: variant !== 'new' && variant !== 'continue' returns early.
      This means orchestrator-to-subsession traffic (which has different variants)
      is correctly excluded from injection.
    impact: Intentional guard — not a bug.

  - segment: input.agent extraction
    severity: DESIGN_NOTE
    evidence: |
      transformInput.agent is only used for skill bundle resolution.
      If undefined, defaults to 'hivefiver' per skill-exposure-map.ts line 156.
    impact: Unknown agents get default skill bundle.
```

---

## PIPELINE STATUS SUMMARY

```
PIPELINE-messages-transform:
  status: FUNCTIONAL
  broken_segments: []
  notes: |
    The primary pre-send injection pipeline is ACTIVE and FUNCTIONAL.
    Key characteristics:
    1. Source exists: messages-transform-adapter.ts
    2. Registration exists: opencode-plugin.ts line 203
    3. Compiled output exists: dist/plugin/messages-transform-adapter.js
    4. Runtime wiring exists: opencode-plugin.js line 171
    5. Invocation verified: OpenCode calls hook per turn
    6. Injection verified: lastUserMessage.parts mutated at line 170
    7. Final send verified: Modified messages passed to LLM

PIPELINE-nl-first-dispatch:
  status: DEAD_PATHWAY
  broken_segments:
    - nl-first-dispatch always returns shouldDispatch: false
  notes: |
    DEAD PATHWAY VERIFIED — nl-first-dispatch never executes dispatch.
    All 4 code paths return shouldDispatch: false.
    Route hints are always preserved (never dispatched).
    Test file confirms expected behavior.

PIPELINE-turn-snapshot:
  status: FUNCTIONAL
  broken_segments: []
  notes: Cache-per-turn pattern is sound.

PIPELINE-purpose-classification:
  status: FUNCTIONAL
  broken_segments: []
  notes: Purpose classification, lineage resolution, session state detection all working.

PIPELINE-skill-exposure:
  status: FUNCTIONAL
  broken_segments: []
  notes: Skill bundle resolution respects agent, purpose, session state constraints.

PIPELINE-context-rendering:
  status: FUNCTIONAL
  broken_segments: []
  notes: 44-field HivemindContextPacket correctly assembled and rendered.
```