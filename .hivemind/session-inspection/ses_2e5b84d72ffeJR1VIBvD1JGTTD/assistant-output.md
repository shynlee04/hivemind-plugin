# Session Inspection Export

- ses_id: `ses_2e5b84d72ffeJR1VIBvD1JGTTD`
- prepared_at: `2026-03-23T10:43:37.262Z`

## Assistant Output

Now I have a complete picture. Let me compile the comprehensive audit findings:

---

## PRE-SEND HUMAN-USER MESSAGE INJECTION PATHWAY AUDIT

Based on my deep investigation of `dist/**`, here are all findings related to pre-send human-user message injection pathways:

---

### FINDING-001:
```
FINDING-001:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/messages-transform-adapter.js
  symbol: createMessagesTransformHandler (exported function, lines 22-134)
  hook_type: experimental.chat.messages.transform (registered at opencode-plugin.js:171)
  trigger_stage: Runs when a fresh human-user message is about to be sent to the model - transforms the last user message by injecting synthetic parts BEFORE send
  injection_purpose: Injects HiveMind context blocks (turn hierarchy, context packet, skill focus, route hint) as synthetic parts into the user's message
  runtime_status: Alive (directly registered as a plugin hook)
  evidence:
    - Registration: opencode-plugin.js:171 `'experimental.chat.messages.transform': messagesTransform`
    - Guard condition (line 32): Only runs if `lastMsg.info?.variant === 'new' || lastMsg.info?.variant === 'continue'` - skips tool results and thinking turns
    - Injection chain (lines 96-131):
        1. createSyntheticPart with turnHierarchyPacket (line 97)
        2. createSyntheticPart with context packet (line 98)
        3. createSyntheticPart with skillFocusPacket (line 102, conditional)
        4. createSyntheticPart with routeReminder (line 130, conditional - appended AFTER user parts)
    - Message modification (line 126): `lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]`
    - Payload storage (lines 112-125): setInjectionPayload for diagnostic log
  notes: This is the PRIMARY pre-send injection pathway. It modifies the user's message parts array by prepending synthetic context parts.
```

---

### FINDING-002:
```
FINDING-002:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/hooks/start-work/start-work-router.js
  symbol: resolveStartWork (exported function, lines 19-155)
  hook_type: Helper function called BY messages-transform-adapter (not a direct hook)
  trigger_stage: Called during experimental.chat.messages.transform execution (line 43-49 of messages-transform-adapter.js)
  injection_purpose: Classifies user message purpose, resolves lineage, session state, trajectory, workflow authority, readiness gates, and routing decision that feed INTO the injection blocks
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Call site: messages-transform-adapter.js:43-49
    - Input: createStartWorkInput with userMessage, sessionId, snapshot, activeAgent
    - Outputs (line 97-130): Full routing decision including purposeClass, sessionState, lineage, readiness, trajectoryAssessment, riskLevel, autoRoute, nextTransition, etc.
    - Key sub-components:
        - classifyPurpose() - keyword matching for purpose classification (discovery, brainstorming, research, planning, implementation, tdd, gatekeeping, course-correction)
        - resolveLineage() - determines agent lineage (hivefiver vs hiveminder)
        - detectSessionState() - determines session state (fresh, ongoing, continuation, sub-session)
        - assessTrajectoryEntrySync() - trajectory continuity assessment
        - inspectWorkflowAuthority() - workflow state inspection
        - resolveReadinessGates() - readiness gate resolution
  notes: Not a direct hook but CRITICAL to the injection as it determines WHAT gets injected based on purpose classification and routing decisions
```

---

### FINDING-003:
```
FINDING-003:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/features/session-entry/purpose-classifier.js
  symbol: classifyPurpose (exported function, lines 24-60)
  hook_type: Purpose classifier - called as part of resolveStartWork
  trigger_stage: Called by start-work-router.js:21 during messages.transform execution
  injection_purpose: Classifies the user's message purpose to determine routing and skill bundle injection
  runtime_status: Alive (called transitively by messages-transform-adapter)
  evidence:
    - PURPOSE_PATTERNS map (lines 2-11): Maps purposes to keyword lists
    - PURPOSE_ORDER (lines 12-21): Priority order for purpose detection
    - Returns: { purposeClass, confidence, reasons }
    - Purpose classes: discovery, brainstorming, research, planning, implementation, gatekeeping, tdd, course-correction
  notes: Purpose classification directly influences skill bundle selection in skill-exposure-map.js
```

---

### FINDING-004:
```
FINDING-004:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/features/session-entry/lineage-router.js
  symbol: resolveLineage (exported function, lines 14-27)
  hook_type: Lineage router - called as part of resolveStartWork
  trigger_stage: Called by start-work-router.js:20 during messages.transform execution
  injection_purpose: Determines agent lineage (hivefiver vs hiveminder) based on message content
  runtime_status: Alive (called transitively by messages-transform-adapter)
  evidence:
    - HIVEFIVER_KEYWORDS (lines 1-13): ['hook', 'plugin', 'workflow', 'agent', 'command', 'hivemind', 'session runtime', 'context', 'governance', 'doc-intel', 'refactor']
    - Returns: { lineage, reasons }
  notes: Lineage influences context packet content and routing decisions
```

---

### FINDING-005:
```
FINDING-005:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/features/session-entry/session-state.js
  symbol: detectSessionState (exported function, lines 1-12)
  hook_type: Session state detector - called as part of resolveStartWork
  trigger_stage: Called by start-work-router.js:49-51 during messages.transform execution
  injection_purpose: Determines session state (fresh, ongoing, continuation, sub-session) which influences skill bundle and session role resolution
  runtime_status: Alive (called transitively by messages-transform-adapter)
  evidence:
    - Detection logic: sub-session > handoff > workflow > fresh
    - Continuity alerts detection (lines 13-18): missing-task-link alert
  notes: Session state directly influences skill bundle additions (sub-session gets git-continuity-memory skill)
```

---

### FINDING-006:
```
FINDING-006:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/context-renderer.builder.js
  symbol: createHivemindContextPacket (exported function, lines 59-87)
  hook_type: Context packet builder - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:88-92 to build context packet for injection
  injection_purpose: Creates the canonical `<hivemind context_version="v1">` packet with session, trajectory, workflow, purpose, and agent-work fields
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Creates packet with: session_id, lineage, trajectory, workflow, task_ids, entry_state, purpose, risk, route_command, governance_mode, language
    - Agent-work fields (when agentWorkPacket exists): contract_id, delegation_export_session_id, response_mode, workflow_phase, active_task_ids, pending_task_ids, briefing_summary, follow_up, recent_anchors, compaction_action, TDD/BMAD/Research fields
  notes: This packet is rendered and injected as a synthetic part BEFORE the user's message parts
```

---

### FINDING-007:
```
FINDING-007:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/context-renderer.renderers.js
  symbol: renderHivemindContext (exported function, lines 22-53)
  hook_type: Context renderer - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:88 to render context packet
  injection_purpose: Renders the context packet as a `<hivemind context_version="v1">` XML block
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Output format: `<hivemind context_version="v1">\nname=value\n...</hivemind>`
    - Field order per HIVEMIND_CONTEXT_FIELD_ORDER
  notes: The rendered output is wrapped in a synthetic part and prepended to user message parts
```

---

### FINDING-008:
```
FINDING-008:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/context-renderer.renderers.js
  symbol: renderTurnHierarchy (exported function, lines 60-79)
  hook_type: Turn hierarchy renderer - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:93 to render turn hierarchy block
  injection_purpose: Renders `<hivemind-turn-hierarchy>` block with turn_depth, turn_type, sibling_count, trajectory_path
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Output format: `<hivemind-turn-hierarchy>\nfield=value\n...</hivemind-turn-hierarchy>`
    - Turn hierarchy context built at messages-transform-adapter.js:72-83
  notes: Injected as FIRST synthetic part (before context packet) per line 97
```

---

### FINDING-009:
```
FINDING-009:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/skill-exposure-map.js
  symbol: resolveSkillBundle (exported function, lines 118-159)
  hook_type: Skill bundle resolver - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:85 during messages.transform execution
  injection_purpose: Resolves the 6-7 skills to expose based on agent, purpose class, and session state
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - AGENT_BUNDLES (lines 30-78): Per-agent skill lists for 9 registered agents
    - SHARED_SKILLS (lines 16-21): Always-added skills
    - PURPOSE_CONDITIONAL (lines 80-105): Purpose-specific skill additions
    - SUBSESSION_ADDITIONS (lines 107-109): Sub-session specific skills
    - MAX_SKILLS = 7 (line 23)
  notes: Skills are rendered as `<available_skills>` block and injected as a synthetic part
```

---

### FINDING-010:
```
FINDING-010:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/skill-exposure-map.js
  symbol: resolveSessionRole (exported function, lines 174-195)
  hook_type: Session role resolver - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:86 during messages.transform execution
  injection_purpose: Determines session role (orchestrate/specialist/standalone) that influences prompting
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Orchestrator agents: hiveminder, hivefiver → "orchestrate"
    - Specialist agents: hiveq, hivemaker, hivehealer, hitea → "specialist" (or when in sub-session)
    - Standalone agents: hivexplorer, hiverd, hiveplanner → "standalone"
  notes: Session role is rendered as a directive inside the `<available_skills>` block
```

---

### FINDING-011:
```
FINDING-011:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/skill-focus-renderer.js
  symbol: renderSkillFocusBlock (exported function, lines 28-42)
  hook_type: Skill focus renderer - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:94 to render skill focus block
  injection_purpose: Renders `<available_skills>` block with skill list and session role directive
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Output format: `<available_skills>\nskill_N="name"\nREMINDER: ...\n\n[session role directive]\n</available_skills>`
    - Conditional (line 100-102): Only injected when skillFocusPacket.length > 0
  notes: Appended after turn hierarchy and context blocks, but BEFORE user's original parts
```

---

### FINDING-012:
```
FINDING-012:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/route-hint.js
  symbol: renderRouteHint (exported function, lines 7-17)
  hook_type: Route hint renderer - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:107-110 to render route reminder
  injection_purpose: Renders `<hivemind-route-hint>` block with route_command and risk level
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Output format: `<hivemind-route-hint>\nroute_command=X\nrisk=Y\n</hivemind-route-hint>`
    - Conditional (lines 105-106): Only injected when NOT already dispatched
    - Appended AFTER user parts (line 128-131) - unlike other injection blocks
  notes: Route hint is the ONLY injection block appended AFTER user message parts
```

---

### FINDING-013:
```
FINDING-013:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/synthetic-parts.js
  symbol: createSyntheticPart (exported function, lines 1-15)
  hook_type: Synthetic part factory - called by messages-transform-adapter
  trigger_stage: Called multiple times during messages.transform execution
  injection_purpose: Creates synthetic message parts with metadata (synthetic: true, ui_hidden: true)
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Creates part with: id (prt_hm_*), sessionID, messageID, type='text', synthetic=true, experimental_providerMetadata.opencode.ui_hidden=true
    - Called at lines 97, 98, 102, 130 of messages-transform-adapter.js
  notes: All injection blocks are wrapped in synthetic parts with ui_hidden flag
```

---

### FINDING-014:
```
FINDING-014:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/synthetic-parts.js
  symbol: findLastUserMessage (exported function, lines 22-30)
  hook_type: Message finder - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:26 to locate the last user message
  injection_purpose: Finds the last message with role === 'user' to inject synthetic parts
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Iterates messages array in reverse (lines 23-28)
    - Returns first message where message.info?.role === 'user'
    - Returns undefined if no user message found
  notes: Guard check at messages-transform-adapter.js:27-28 returns early if no user message
```

---

### FINDING-015:
```
FINDING-015:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/runtime-snapshot.js
  symbol: createTurnSnapshotLoader (exported function, lines 9-20)
  hook_type: Runtime snapshot loader - used by messages-transform-adapter
  trigger_stage: Snapshot loaded at messages-transform-adapter.js:40 and cached for the turn
  injection_purpose: Provides cached runtime bindings snapshot (trajectory, workflow, tasks, profile, etc.)
  runtime_status: Alive (used by messages-transform-adapter)
  evidence:
    - Caches snapshot per turn (line 13: cachedSnapshot ??= loadSnapshot(directory))
    - resetTurnSnapshot() called at line 68 after NL-first dispatch
    - Delegates to loadRuntimeBindingsSnapshot() from shared/runtime-attachment.js
  notes: Snapshot is loaded ONCE per turn and reused across multiple injection components
```

---

### FINDING-016:
```
FINDING-016:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/input-helpers.js
  symbol: createStartWorkInput (exported function, lines 19-36)
  hook_type: Input builder - called by messages-transform-adapter
  trigger_stage: Called by messages-transform-adapter.js:43-49 to build start-work input
  injection_purpose: Creates StartWorkInput from turn snapshot data for routing resolution
  runtime_status: Alive (called by messages-transform-adapter)
  evidence:
    - Combines: userMessage, sessionId, sessionScope, projectRoot, workflowId, taskIds, runtime attachment status, profile status, lineage, activeAgent
    - sessionScope always set to 'main' (line 23)
  notes: Provides the unified input for start-work-router resolution
```

---

### FINDING-017:
```
FINDING-017:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/injection-store.js
  symbol: setInjectionPayload (exported function, lines 10-12)
  hook_type: Injection payload store - written by messages-transform-adapter, read by text.complete
  trigger_stage: Called by messages-transform-adapter.js:112-125 after building injection payload
  injection_purpose: Stores injection metadata for diagnostic logging
  runtime_status: Alive (written by messages-transform-adapter, read by experimental.text.complete hook)
  evidence:
    - Store is keyed by sessionId (line 11)
    - Cleared after read by getAndClearInjectionPayload()
    - Contains: purposeClass, sessionState, agent, variant, skillBundle, skillFocusBlock, turnHierarchyBlock, contextBlock, routeHintBlock
  notes: This is the bridge between the transform hook and the diagnostic log - NOT a message injection itself, but diagnostic tracking
```

---

### FINDING-018:
```
FINDING-018:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/opencode-plugin.js
  symbol: HiveMindPlugin.['chat.message'] (line 61-67)
  hook_type: chat.message (registered hook - NOT a pre-send injection hook)
  trigger_stage: Runs on chat message receipt
  injection_purpose: Resets turn snapshot and shows governance toast - does NOT modify message content
  runtime_status: Alive (registered) but NOT a pre-send injection pathway
  evidence:
    - Registration: opencode-plugin.js:61
    - Does NOT modify output.messages
    - Only calls turnSnapshot.resetTurnSnapshot() and showGovernanceToast()
  notes: This hook is in scope for investigation but does NOT inject into messages - it's a session state reset hook. Excluded from pre-send injection per task scope.
```

---

### FINDING-019:
```
FINDING-019:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/opencode-plugin.js
  symbol: HiveMindPlugin.['command.execute.before'] (line 98-130)
  hook_type: command.execute.before (registered hook - EXCLUDED per task scope)
  trigger_stage: Runs before command execution
  injection_purpose: Injects command context as synthetic part into command execution
  runtime_status: Alive (registered) but OUT OF SCOPE per task exclusions
  evidence:
    - Registration: opencode-plugin.js:98
    - Injects synthetic part with command context at line 120-129
  notes: EXCLUDED - Command execution hooks are explicitly out of scope per task requirements
```

---

### FINDING-020:
```
FINDING-020:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/compaction-adapter.js
  symbol: createCompactionHandler (exported function, lines 15-30)
  hook_type: experimental.session.compacting (EXCLUDED per task scope)
  trigger_stage: Runs during session compaction (not pre-send)
  injection_purpose: Injects HiveMind context into compaction prompt
  runtime_status: Alive (registered at opencode-plugin.js:172) but OUT OF SCOPE
  evidence:
    - Registration: opencode-plugin.js:172 `'experimental.session.compacting': compactionHandler`
    - Similar context injection but into compaction context, not live messages
  notes: EXCLUDED - Session compaction hooks are explicitly out of scope per task requirements
```

---

### FINDING-021:
```
FINDING-021:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/plugin/opencode-plugin.js
  symbol: HiveMindPlugin.['experimental.text.complete'] (line 136-169)
  hook_type: experimental.text.complete (EXCLUDED per task scope)
  trigger_stage: Runs AFTER response is complete (post-response)
  injection_purpose: Diagnostic logging including injection payload from messages.transform
  runtime_status: Alive (registered) but OUT OF SCOPE - POST-RESPONSE hook
  evidence:
    - Registration: opencode-plugin.js:136
    - Reads injection payload at line 147: getAndClearInjectionPayload(sessionId)
  notes: EXCLUDED - Post-response hooks are explicitly out of scope per task requirements
```

---

### FINDING-022:
```
FINDING-022:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/hooks/event-handler.js
  symbol: createEventHandler (exported function, lines 62-94)
  hook_type: event (registered hook - OUT OF SCOPE)
  trigger_stage: Runs on various events (session.started, session.ended, message.added, etc.)
  injection_purpose: Records events to trajectory ledger and creates recovery checkpoints
  runtime_status: Alive (registered at opencode-plugin.js:48-50) but NOT a pre-send injection pathway
  evidence:
    - Registration: opencode-plugin.js:48-50 `event: async (eventInput) => { await eventHandler(eventInput); }`
    - KNOWN_EVENT_TYPES (lines 19-29): session.started, session.ended, session.compacted, message.added, message.updated, tool.executed, command.executed, agent.created, trajectory.started, trajectory.ended
  notes: EXCLUDED - Event processing hooks are explicitly out of scope per task requirements
```

---

### FINDING-023:
```
FINDING-023:
  dist_file: /Users/apple/hivemind-plugin/.worktrees/product-detox/dist/features/runtime-entry/nl-first-dispatch.js
  symbol: maybeExecuteNlFirstRuntimeDispatch (exported async function, lines 4-50)
  hook_type: NL-first runtime dispatch - called during messages.transform
  trigger_stage: Called at messages-transform-adapter.js:55-69 during messages.transform
  injection_purpose: Attempts to dispatch a runtime command on first user message of a turn
  runtime_status: Alive (called by messages-transform-adapter) but DISPATCH IS DISABLED
  evidence:
    - Call site: messages-transform-adapter.js:55
    - ALWAYS returns shouldDispatch: false (lines 14, 25, 38, 47)
    - DISPATCH_UNAVAILABLE_REASON constant (line 3): 'NL-first runtime dispatch execution is not available in the messages transform flow'
  notes: Dead code path - dispatch always fails, but turnSnapshot.resetTurnSnapshot() IS called at line 68 when shouldDispatch would have been true
```

---

## SUMMARY

### Pre-Send Injection Pathways IN SCOPE:

| Finding | File | Symbol | Status |
|---------|------|--------|--------|
| F-001 | messages-transform-adapter.js | createMessagesTransformHandler | **ALIVE** - Primary injection point |
| F-002 | start-work-router.js | resolveStartWork | **ALIVE** - Routing resolution |
| F-003 | purpose-classifier.js | classifyPurpose | **ALIVE** - Purpose classification |
| F-004 | lineage-router.js | resolveLineage | **ALIVE** - Lineage resolution |
| F-005 | session-state.js | detectSessionState | **ALIVE** - Session state detection |
| F-006 | context-renderer.builder.js | createHivemindContextPacket | **ALIVE** - Context packet creation |
| F-007 | context-renderer.renderers.js | renderHivemindContext | **ALIVE** - Context rendering |
| F-008 | context-renderer.renderers.js | renderTurnHierarchy | **ALIVE** - Turn hierarchy rendering |
| F-009 | skill-exposure-map.js | resolveSkillBundle | **ALIVE** - Skill bundle resolution |
| F-010 | skill-exposure-map.js | resolveSessionRole | **ALIVE** - Session role resolution |
| F-011 | skill-focus-renderer.js | renderSkillFocusBlock | **ALIVE** - Skill focus rendering |
| F-012 | route-hint.js | renderRouteHint | **ALIVE** - Route hint rendering |
| F-013 | synthetic-parts.js | createSyntheticPart | **ALIVE** - Synthetic part factory |
| F-014 | synthetic-parts.js | findLastUserMessage | **ALIVE** - User message finder |
| F-015 | runtime-snapshot.js | createTurnSnapshotLoader | **ALIVE** - Snapshot loading |
| F-016 | input-helpers.js | createStartWorkInput | **ALIVE** - Input builder |
| F-017 | injection-store.js | setInjectionPayload | **ALIVE** - Payload storage (diagnostic) |
| F-023 | nl-first-dispatch.js | maybeExecuteNlFirstRuntimeDispatch | **DEAD** - Always returns shouldDispatch: false |

### Out of Scope (Per Task Requirements):

| Finding | Hook | Reason |
|---------|------|--------|
| F-018 | chat.message | Does NOT modify messages |
| F-019 | command.execute.before | Command execution hook (excluded) |
| F-020 | experimental.session.compacting | Session compaction hook (excluded) |
| F-021 | experimental.text.complete | Post-response hook (excluded) |
| F-022 | event | Event processing hook (excluded) |