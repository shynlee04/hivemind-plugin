# Session Inspection Export

- ses_id: `ses_2e5b82cd1ffeI4XoW5SLpFcOg8`
- prepared_at: `2026-03-23T10:42:48.981Z`

## Assistant Output

Now I have a complete picture of the injection pipeline. Let me compile the comprehensive audit report.

---

# PRE-SEND HUMAN-USER MESSAGE INJECTION PATHWAY AUDIT

## SOURCE MAPPING FOR EACH FINDING

---

### SOURCE-001: `createMessagesTransformHandler`
```
SOURCE-001:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/messages-transform-adapter.ts
  owning_module: plugin/messages-transform-adapter
  symbols:
    - createMessagesTransformHandler (main export, line 41)
    - MessagesTransformDeps (interface, line 29)
  registration_pipeline: |
    1. opencode-plugin.ts imports createMessagesTransformHandler (line 31)
    2. Creates handler via: createMessagesTransformHandler({ directory, turnSnapshot, nlFirstDispatchKeys })
    3. Registers as: 'experimental.chat.messages.transform': messagesTransform (line 203)
  invocation_pipeline: |
    1. OpenCode SDK invokes 'experimental.chat.messages.transform' hook
    2. Handler receives (transformInput, output) where output.messages is the message array
    3. findLastUserMessage() locates the last user message (line 49)
    4. Turn variant check skips non-'new'/'continue' messages (line 57-59)
    5. resolveStartWork() determines session routing (line 71)
    6. maybeExecuteNlFirstRuntimeDispatch() attempts NL-first dispatch (line 85)
    7. resolveSkillBundle/resolveSessionRole() for skill exposure (lines 119-124)
    8. renderHivemindContext() + renderTurnHierarchy() produce injection blocks (lines 127-133)
    9. createSyntheticPart() wraps blocks as synthetic parts (lines 136-143)
    10. setInjectionPayload() stores for diagnostic logging (lines 155-168)
    11. lastUserMessage.parts prepends injected parts before user parts (line 170)
    12. Route hint appended after user parts if not already dispatched (lines 172-177)
  upstream_callers:
    - OpenCode SDK 'experimental.chat.messages.transform' hook surface
    - Called by plugin system during message history preparation
  downstream_effects: |
    - Injects <hivemind-turn-hierarchy> block as synthetic part
    - Injects <hivemind context_version="v1"> block as synthetic part
    - Injects <available_skills> block conditionally (when skills available)
    - Injects <hivemind-route-hint> block conditionally (when route command exists and not dispatched)
    - Stores injection payload for experimental.text.complete diagnostic logging
  active_dead_analysis: |
    STATUS: ACTIVE (live code path)
    The messages.transform hook is registered and executes for every user turn.
    All downstream injection paths are reachable and functional.
  dependency_classification: |
    Hook type: Plugin hook (SDK 'experimental.chat.messages.transform')
    Injection purpose: system/context injection + session/subsession state enrichment
    Dependency model: SDK-dependent (requires @opencode-ai/plugin)
```

---

### SOURCE-002: `renderHivemindContext` and `renderTurnHierarchy`
```
SOURCE-002:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/context-renderer.renderers.ts
  owning_module: plugin/context-renderer
  symbols:
    - renderHivemindContext (line 27)
    - renderTurnHierarchy (line 67)
    - renderToolPrecedence (line 97) [unused in messages.transform]
  registration_pipeline: |
    1. context-renderer.ts re-exports from context-renderer.renderers.js (line 42)
    2. messages-transform-adapter.ts imports renderHivemindContext, renderTurnHierarchy (lines 11-12)
    3. Also imported by compaction-adapter.ts (line 8)
  invocation_pipeline: |
    renderHivemindContext:
      1. Called at line 127 of messages-transform-adapter.ts
      2. Receives HivemindContextPacket built by createHivemindContextPacket()
      3. Outputs: <hivemind context_version="v1">...</hivemind> block
      4. 44 fields rendered in stable order with key=value pairs
      
    renderTurnHierarchy:
      1. Called at line 132 of messages-transform-adapter.ts
      2. Receives TurnHierarchyContext with trajectory_path, turn_depth, etc.
      3. Outputs: <hivemind-turn-hierarchy>...</hivemind-turn-hierarchy> block
  upstream_callers:
    - messages-transform-adapter.ts:127 (renderHivemindContext)
    - messages-transform-adapter.ts:132 (renderTurnHierarchy)
    - compaction-adapter.ts:43 (renderHivemindContext)
  downstream_effects: |
    - renderHivemindContext: Injects session_id, lineage, trajectory, workflow, task_ids, 
      entry_state, purpose, risk, route_command, governance_mode, language, and agent-work fields
    - renderTurnHierarchy: Injects turn_depth, turn_type, parent_turn_id, sibling_count, 
      trajectory_path, pending_parent
  active_dead_analysis: |
    STATUS: ACTIVE
    Both renderers are actively called by messages-transform-adapter.ts and compaction-adapter.ts.
    No code paths lead to dead code elimination.
  dependency_classification: |
    Hook type: Message transformer (helper function)
    Injection purpose: system/context injection
    Dependency model: Mixed - both SDK-dependent (via messages-transform-adapter) and SDK-independent 
    (pure rendering functions that could be called standalone)
```

---

### SOURCE-003: `renderSkillFocusBlock`
```
SOURCE-003:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-focus-renderer.ts
  owning_module: plugin/skill-focus-renderer
  symbols:
    - renderSkillFocusBlock (line 32)
    - renderSkillLine (line 18, helper)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports renderSkillFocusBlock (line 26)
    2. Called at line 133: renderSkillFocusBlock(skillBundle, sessionRole)
    3. Only called if skillBundle exists and sessionRole resolved
  invocation_pipeline: |
    1. Receives: SkillEntry[] (resolved from skill-exposure-map) and optional SessionRole
    2. Renders <available_skills> XML block with skill_N= entries
    3. Includes natural-language REMINDER line about skill tool usage
    4. Includes session role directive (orchestrate/specialist/standalone)
    5. Returns string, wrapped in createSyntheticPart() by caller
  upstream_callers:
    - messages-transform-adapter.ts:133
  downstream_effects: |
    - Conditionally injects <available_skills> block into user message parts
    - Only injected when skillBundle.length > 0 (line 142 check)
    - Provides behavioral directive to LLM about skill usage and delegation
  active_dead_analysis: |
    STATUS: ACTIVE but conditionally dead in practice
    The function is called and returns a string, but injection only occurs if 
    skillBundle has entries (line 142: if (skillFocusPacket.length > 0)).
    For some agent types or session states, skillBundle may be empty.
  dependency_classification: |
    Hook type: Message transformer helper
    Injection purpose: plugin-provided content (skill enumeration + behavioral directive)
    Dependency model: SDK-dependent via messages-transform-adapter
```

---

### SOURCE-004: `renderRouteHint`
```
SOURCE-004:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/route-hint.ts
  owning_module: plugin/route-hint
  symbols:
    - renderRouteHint (line 12)
    - RouteHintInput (interface, line 1)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports renderRouteHint (line 14)
    2. Called at line 149: renderRouteHint({ routeCommand: routedCommand, risk: startWork.riskLevel })
    3. Result stored in routeReminder variable
  invocation_pipeline: |
    1. Receives { routeCommand?: string, risk: string }
    2. Returns undefined if no routeCommand (guards at line 13-15)
    3. Returns <hivemind-route-hint>...</hivemind-route-hint> block
    4. Appended AFTER user parts (not prepended like other blocks)
    5. Only added if NOT alreadyDispatched AND NOT dispatchedNow (line 147)
  upstream_callers:
    - messages-transform-adapter.ts:149
  downstream_effects: |
    - Conditionally injects <hivemind-route-hint> after user message parts
    - Only injected when:
      (a) routedCommand exists (requiredCommandId or recommendedCommandId)
      (b) dispatch has NOT already occurred for this turn
    - Provides route_command and risk to LLM for context
  active_dead_analysis: |
    STATUS: ACTIVE but conditionally dead in practice
    The route hint is suppressed when:
    - No routed command is available (routedCommand is undefined/null)
    - alreadyDispatched is true (NL-first dispatch occurred earlier in turn)
    - dispatchedNow is true (NL-first dispatch occurring now)
    
    The DISPATCH_UNAVAILABLE_REASON in nl-first-dispatch.ts explicitly states:
    "NL-first runtime dispatch execution is not available in the messages transform flow"
    This means the route hint is ALWAYS suppressed when nl-first dispatch would fire,
    which appears to be the design intent.
    
    HOWEVER: For non-NL-first turns, route hints ARE injected.
  dependency_classification: |
    Hook type: Message transformer helper
    Injection purpose: system/context injection (route reminder + risk level)
    Dependency model: SDK-dependent via messages-transform-adapter
```

---

### SOURCE-005: `createSyntheticPart` and `findLastUserMessage`
```
SOURCE-005:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/synthetic-parts.ts
  owning_module: plugin/synthetic-parts
  symbols:
    - createSyntheticPart (line 12)
    - findLastUserMessage (line 35)
    - getMessageText (line 28)
    - MessageLike (type, line 3)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports createSyntheticPart, findLastUserMessage (lines 17-18)
    2. opencode-plugin.ts imports createSyntheticPart (line 30)
    3. createSyntheticPart used for:
       - Prepending turn hierarchy and context blocks (lines 137-138)
       - Skill focus block (line 143)
       - Route hint block (line 175)
       - Command context block in command.execute.before (line 145)
    4. findLastUserMessage called at line 49 to locate target message
  invocation_pipeline: |
    createSyntheticPart:
      1. Receives (sessionID, messageID, text)
      2. Returns Part object with:
         - Generated ID: prt_hm_<timestamp>_<random>
         - sessionID and messageID propagation
         - type: 'text'
         - text: the rendered block content
         - synthetic: true
         - experimental_providerMetadata.opencode.ui_hidden: true (hides from UI)
      
    findLastUserMessage:
      1. Iterates messages array backwards
      2. Returns first message where info?.role === 'user'
      3. Returns undefined if no user message found
  upstream_callers:
    - messages-transform-adapter.ts (multiple calls)
    - opencode-plugin.ts:145 (command context injection)
  downstream_effects: |
    - createSyntheticPart: Creates synthetic Part objects that become part of message history
      These parts are marked as synthetic and hidden from UI, but visible to the LLM as context
    - findLastUserMessage: Identifies injection target (the last user message in history)
  active_dead_analysis: |
    STATUS: ACTIVE
    Both functions are actively used in the injection pipeline.
    findLastUserMessage guards against missing user messages (line 51-53 in messages-transform-adapter)
    createSyntheticPart is the core primitive for all synthetic part creation.
  dependency_classification: |
    Hook type: Message transformer primitives
    Injection purpose: system/context injection (synthetic part factory)
    Dependency model: SDK-dependent (@opencode-ai/sdk for Part type), SDK-independent for logic
```

---

### SOURCE-006: `setInjectionPayload` and `getAndClearInjectionPayload`
```
SOURCE-006:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/injection-store.ts
  owning_module: plugin/injection-store
  symbols:
    - setInjectionPayload (line 27)
    - getAndClearInjectionPayload (line 31)
    - InjectionPayload (interface, line 10)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports setInjectionPayload (line 27)
    2. opencode-plugin.ts imports getAndClearInjectionPayload (line 32)
    3. Both use a module-level Map store keyed by sessionId
  invocation_pipeline: |
    setInjectionPayload (messages-transform-adapter.ts:155):
      1. Called after all injection blocks are created
      2. Stores full InjectionPayload in Map with sessionId as key
      3. Payload includes all rendered blocks and metadata for diagnostic logging
      
    getAndClearInjectionPayload (opencode-plugin.ts:179):
      1. Called in experimental.text.complete hook
      2. Reads and DELETES payload from store (getAndClear pattern)
      3. Payload passed to writeDiagnosticLog()
      4. Store entry is consumed after single read
      
    Store lifecycle:
      - Written once per messages.transform execution
      - Read once on text.complete execution
      - Keyed by sessionId, not messageId
  upstream_callers:
    - setInjectionPayload: messages-transform-adapter.ts:155
    - getAndClearInjectionPayload: opencode-plugin.ts:179
  downstream_effects: |
    - Enables diagnostic logging of what was injected in messages.transform
    - Passes injection details to .hivemind/error-log/ files
    - Does NOT affect message construction (separate concern)
  active_dead_analysis: |
    STATUS: ACTIVE
    The store is written during messages.transform and read during text.complete.
    The getAndClear pattern ensures single consumption per turn.
    This is a diagnostic pipeline, not message injection.
  dependency_classification: |
    Hook type: Diagnostic store (in-process Map)
    Injection purpose: Metadata augmentation for diagnostic logging
    Dependency model: Plugin-only (module-level state, no SDK dependency)
```

---

### SOURCE-007: `resolveStartWork`
```
SOURCE-007:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/hooks/start-work/start-work-router.ts
  owning_module: hooks/start-work
  symbols:
    - resolveStartWork (line 38)
    - StartWorkDecision (type, exported from start-work-types.ts)
    - Multiple helper functions from start-work-router-helpers.ts
  registration_pipeline: |
    1. messages-transform-adapter.ts imports resolveStartWork (line 23)
    2. createStartWorkInput() in input-helpers.ts creates the input
    3. Called at line 71: resolveStartWork(createStartWorkInput({...}))
  invocation_pipeline: |
    1. resolveStartWork is a pure function (no side effects)
    2. Input: StartWorkInput with userMessage, sessionId, snapshot, etc.
    3. Processing pipeline:
       - resolveLineage() - determine session lineage
       - classifyPurpose() - classify intent (discovery, planning, etc.)
       - assessTrajectoryEntrySync() - check trajectory state
       - inspectWorkflowAuthority() - verify workflow exists
       - detectContinuityAlerts() - check for gaps
       - detectSessionState() - fresh/ongoing/continuation/sub-session
       - resolveReadinessGates() - prerequisites
       - resolveRiskLevel() - compute risk
       - pickRuntimePressureContract() - select pressure contract
    4. Output: StartWorkDecision with 25+ fields including:
       - sessionState, purposeClass, lineage
       - requiredCommandId, recommendedCommandId
       - riskLevel, readiness
       - trajectoryAssessment, workflowAuthority
  upstream_callers:
    - messages-transform-adapter.ts:71
  downstream_effects: |
    - StartWorkDecision drives all subsequent injection decisions:
      - Which context blocks to render
      - What route command to suggest
      - What risk level to communicate
      - What skill bundle to expose
      - Whether to attempt NL-first dispatch
      - Whether to show route hint
    - Builds entry kernel that canonicalizes the routing decision
  active_dead_analysis: |
    STATUS: ACTIVE
    Called for every user turn via messages.transform pipeline.
    No conditional branching makes this dead code.
  dependency_classification: |
    Hook type: Lifecycle hook / Session orchestrator
    Injection purpose: session/subsession state enrichment (determines all injection content)
    Dependency model: Mixed - uses core/, control-plane/, features/session-entry/, commands/
    No direct SDK dependency (pure business logic)
```

---

### SOURCE-008: `resolveSkillBundle` and `resolveSessionRole`
```
SOURCE-008:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/plugin/skill-exposure-map.ts
  owning_module: plugin/skill-exposure-map
  symbols:
    - resolveSkillBundle (line 137)
    - resolveSessionRole (line 212)
    - renderSessionRoleDirective (line 246)
    - SkillEntry (interface, line 16)
    - SessionRole (type, line 196)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports resolveSkillBundle, resolveSessionRole (line 25)
    2. Also imports SkillEntry type and renderSessionRoleDirective
    3. Called at lines 119 and 124 respectively
  invocation_pipeline: |
    resolveSkillBundle:
      1. Receives: (activeAgent, purposeClass, sessionState)
      2. Builds ordered skill list:
         - SHARED_SKILLS always first (use-hivemind-delegation)
         - Agent-specific bundle (9 registered agents)
         - Purpose-conditional skills (tdd, research, planning, etc.)
         - Sub-session additions
      3. Caps at MAX_SKILLS (7)
      4. Uses deduplication via seen Set
      
    resolveSessionRole:
      1. Receives: (sessionState, activeAgent)
      2. Returns: 'orchestrate' | 'specialist' | 'standalone'
      3. Logic:
         - hiveminder/hivefiver + main → orchestrate
         - sub-session → specialist
         - hiveq/hivemaker/hivehealer/hitea → specialist
         - hivexplorer/hiverd/hiveplanner → standalone
  upstream_callers:
    - messages-transform-adapter.ts:119 (resolveSkillBundle)
    - messages-transform-adapter.ts:124 (resolveSessionRole)
  downstream_effects: |
    - resolveSkillBundle: Determines which skills are exposed in <available_skills> block
    - resolveSessionRole: Determines behavioral directive injected via skill-focus-renderer
    - Both feed into renderSkillFocusBlock() output
  active_dead_analysis: |
    STATUS: ACTIVE
    Both functions are called for every user turn.
    skillBundle may be empty if no skills match, but function itself is not dead.
  dependency_classification: |
    Hook type: Message transformer helper
    Injection purpose: plugin-provided content (skill enumeration + role directive)
    Dependency model: Plugin-only (static registry data, no SDK dependency)
```

---

### SOURCE-009: `maybeExecuteNlFirstRuntimeDispatch`
```
SOURCE-009:
  src_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/runtime-entry/nl-first-dispatch.ts
  owning_module: features/runtime-entry
  symbols:
    - maybeExecuteNlFirstRuntimeDispatch (line 32)
    - NlFirstRuntimeDispatchInput (interface, line 11)
    - NlFirstRuntimeDispatchPlan (interface, line 19)
    - NlFirstRuntimeDispatchResult (interface, line 26)
  registration_pipeline: |
    1. messages-transform-adapter.ts imports maybeExecuteNlFirstRuntimeDispatch (line 24)
    2. Called at line 85: await maybeExecuteNlFirstRuntimeDispatch({...})
    3. Result checked: if (dispatch.plan.shouldDispatch) { ... }
  invocation_pipeline: |
    1. Receives projectRoot, startWork, snapshot, userMessage, context
    2. Checks for controlPlanePrimitive via findControlPlanePrimitive()
    3. If found: returns { shouldDispatch: false, routeKind: 'control-plane' }
    4. Otherwise checks for commandId via findSlashCommandBundle()
    5. If found: returns { shouldDispatch: false, routeKind: 'workflow-command' }
    6. If nothing found: returns { shouldDispatch: false, routeKind: 'none' }
    
    CONSTANT: DISPATCH_UNAVAILABLE_REASON (line 30)
    "NL-first runtime dispatch execution is not available in the messages transform flow"
  upstream_callers:
    - messages-transform-adapter.ts:85
  downstream_effects: |
    - ALWAYS returns shouldDispatch: false (hardcoded)
    - Used to set dispatchedNow flag (line 98) which gates route hint injection
    - When dispatchKey is added to nlFirstDispatchKeys Set (line 97),
      subsequent messages in same turn suppress route hint
    - The function is a no-op dispatcher - it documents the dispatch intent
      but cannot actually dispatch because execution is not available
  active_dead_analysis: |
    STATUS: DEAD CODE in practice (though structurally active)
    
    The function is called and returns valid results, but ALWAYS returns 
    shouldDispatch: false due to DISPATCH_UNAVAILABLE_REASON.
    
    The comment explicitly states "NL-first runtime dispatch execution is not 
    available in the messages transform flow" - this is intentional.
    
    The function serves as:
    1. Documentation of dispatch intent
    2. Turn-level deduplication key management (nlFirstDispatchKeys)
    3. Route hint suppression mechanism
    
    To become active: Would need actual dispatch capability in the messages 
    transform flow, which is explicitly noted as unavailable.
  dependency_classification: |
    Hook type: Event listener / registration callback
    Injection purpose: session/subsession state enrichment (dispatch tracking)
    Dependency model: Mixed - uses control-plane/, commands/ but intentionally non-functional
```

---

## ADDITIONAL SUPPORTING SOURCE FILES

### Supporting File 1: `src/plugin/context-renderer.ts`
- Role: Canonical re-export barrel for context-renderer module
- Exports all types, constants, and functions from sub-modules
- No business logic

### Supporting File 2: `src/plugin/context-renderer.types.ts`
- Role: Type definitions (44-field HivemindContextPacket decomposed into 7 intersection types)
- Defines TurnHierarchyContext, ToolPrecedenceChain, WorkflowStyle
- No business logic

### Supporting File 3: `src/plugin/context-renderer.builder.ts`
- Role: Packet creation logic (createHivemindContextPacket, resolveAgentWorkContextFields)
- Called by messages-transform-adapter.ts:127 and compaction-adapter.ts:35
- ACTIVE

### Supporting File 4: `src/plugin/input-helpers.ts`
- Role: createStartWorkInput() factory for messages-transform-adapter
- Creates StartWorkInput from turn snapshot data
- ACTIVE

### Supporting File 5: `src/plugin/runtime-snapshot.ts`
- Role: TurnSnapshotLoader factory with per-turn caching
- createTurnSnapshotLoader() returns getSnapshot() and resetTurnSnapshot()
- ACTIVE

### Supporting File 6: `src/features/session-entry/start-work-types.ts`
- Role: Type definitions for start-work pipeline (StartWorkInput, StartWorkDecision, PurposeClass, etc.)
- No business logic

### Supporting File 7: `src/features/runtime-entry/attachment.ts`
- Role: Runtime bindings snapshot types and loaders
- Exports loadRuntimeBindingsSnapshot which TurnSnapshotLoader depends on
- ACTIVE

### Supporting File 8: `src/plugin/opencode-plugin.ts`
- Role: Main plugin entry - registers all hooks and tools
- Registers:
  - 'experimental.chat.messages.transform': messagesTransform (line 203)
  - 'experimental.session.compacting': compactionHandler (line 204)
  - 'experimental.text.complete': diagnostic log writer (line 165)
  - 'command.execute.before': command context injection (line 119)
- ACTIVE

### Supporting File 9: `src/sdk-supervisor/diagnostic-log.ts`
- Role: Writes diagnostic summaries to .hivemind/error-log/
- Consumes injection payload from injection-store
- ACTIVE but diagnostic only (not message injection)

---

## SUMMARY CLASSIFICATION TABLE

| Source ID | Function | Hook Type | Injection Purpose | Dependency Model | Status |
|-----------|----------|-----------|-------------------|------------------|--------|
| 001 | createMessagesTransformHandler | Plugin hook | system/context injection | SDK-dependent | ACTIVE |
| 002 | renderHivemindContext/renderTurnHierarchy | Message transformer | system/context injection | Mixed | ACTIVE |
| 003 | renderSkillFocusBlock | Message transformer helper | plugin-provided content | SDK-dependent | ACTIVE (conditional) |
| 004 | renderRouteHint | Message transformer helper | system/context injection | SDK-dependent | ACTIVE (conditional) |
| 005 | createSyntheticPart/findLastUserMessage | Message transformer primitives | system/context injection | SDK-dependent | ACTIVE |
| 006 | setInjectionPayload/getAndClearInjectionPayload | Diagnostic store | metadata augmentation | Plugin-only | ACTIVE |
| 007 | resolveStartWork | Lifecycle hook | session/subsession state enrichment | Mixed | ACTIVE |
| 008 | resolveSkillBundle/resolveSessionRole | Message transformer helper | plugin-provided content | Plugin-only | ACTIVE |
| 009 | maybeExecuteNlFirstRuntimeDispatch | Event listener | session/subsession state enrichment | Mixed | DEAD (intentional) |

---

## KEY FINDINGS

### 1. **Central Orchestrator: `messages-transform-adapter.ts`**

The `createMessagesTransformHandler` function is the primary injection orchestrator. It coordinates:
- Turn snapshot loading
- Start work resolution
- NL-first dispatch attempt
- Skill bundle resolution
- Context rendering
- Synthetic part creation and injection
- Injection payload storage for diagnostics

### 2. **Dead Code: `maybeExecuteNlFirstRuntimeDispatch`**

This function is **intentionally dead** per the constant `DISPATCH_UNAVAILABLE_REASON`. It:
- Is called for every user turn
- Always returns `shouldDispatch: false`
- Documents dispatch intent but cannot execute
- Exists to manage dispatch deduplication keys and route hint suppression

### 3. **Conditional Injection Paths**

Several injection blocks are conditionally rendered:
- **Skill focus block**: Only injected when `skillBundle.length > 0`
- **Route hint block**: Only injected when `routedCommand` exists AND dispatch hasn't occurred

### 4. **Synthetic Part Structure**

All injected blocks share a common structure created by `createSyntheticPart`:
```typescript
{
  id: `prt_hm_${Date.now()}_${random}`,
  sessionID: <session>,
  messageID: <message>,
  type: 'text',
  text: <rendered block>,
  synthetic: true,
  experimental_providerMetadata: { opencode: { ui_hidden: true } }
}
```

### 5. **Diagnostic Pipeline Decoupling**

The `injection-store.ts` creates a separate diagnostic pipeline:
- Written during `messages.transform`
- Read during `text.complete`
- Does NOT affect message construction
- Feeds into `.hivemind/error-log/` files

---

## INVOCATION FLOW DIAGRAM

```
OpenCode 'experimental.chat.messages.transform' hook
    │
    ▼
createMessagesTransformHandler()
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. findLastUserMessage() ──► locate injection target       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. turnSnapshot.getSnapshot() ──► load runtime bindings    │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. resolveStartWork() ──► session routing decision          │
│    - classifyPurpose()                                      │
│    - resolveLineage()                                       │
│    - assessTrajectoryEntrySync()                            │
│    - detectSessionState()                                   │
│    - resolveRiskLevel()                                     │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. maybeExecuteNlFirstRuntimeDispatch() ──► [DEAD]         │
│    - Always returns shouldDispatch: false                   │
│    - Manages nlFirstDispatchKeys Set                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. resolveSkillBundle() + resolveSessionRole()             │
│    - Determine skills to expose                             │
│    - Determine session role directive                       │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Render injection blocks                                 │
│    - renderTurnHierarchy() ──► <hivemind-turn-hierarchy>   │
│    - renderHivemindContext() ──► <hivemind context_version>│
│    - renderSkillFocusBlock() ──► <available_skills>        │
│    - renderRouteHint() ──► <hivemind-route-hint>           │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. setInjectionPayload() ──► store for diagnostics          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Inject synthetic parts into lastUserMessage.parts       │
│    - Prepend: turn-hierarchy, context, skill-focus         │
│    - Append: route-hint (if not dispatched)                │
└─────────────────────────────────────────────────────────────┘
```