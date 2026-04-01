---
title: "Runtime Lifecycle Map"
date: 2026-03-31
agent: hivexplorer
type: investigation-report
git_commit: 7da1d535
---

# Runtime Lifecycle Map — 2026-03-31

**Scope:** Complete runtime lifecycle of the HiveMind OpenCode plugin — from plugin load through session deletion.
**Question:** Trace the full lifecycle chain: plugin load → session created → message turn → tool execution → session compacted → session idle → session deleted.
**Git Commit:** `7da1d535` (2026-03-31)

---

## 1. Plugin Load

**Entry:** `src/plugin/opencode-plugin.ts` — OpenCode calls the exported `HiveMindPlugin` async function when the plugin is loaded.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode invokes `HiveMindPlugin(input)` — receives `input.directory` (consumer project root) | `src/plugin/opencode-plugin.ts` | 90 |
| 2 | `ensureAgentProjection(directory)` — creates `.opencode/agents/hivefiver.md` from bundled source if missing (never overwrites existing) | `src/plugin/opencode-plugin.ts` | 70–82, 92 |
| 3 | `initSkillInjection(directory)` — initializes skill exposure map for the project | `src/plugin/opencode-plugin.ts` | 93 |
| 4 | `initSdkContext(input)` — initializes SDK context from OpenCode input | `src/plugin/opencode-plugin.ts` | 94 |
| 5 | `createEventHandler(directory)` — creates the event handler closure for lifecycle events | `src/plugin/opencode-plugin.ts` | 95 |
| 6 | `createTurnSnapshotLoader(directory)` — creates lazy snapshot reader (one snapshot per turn, cached) | `src/plugin/opencode-plugin.ts` | 96 |
| 7 | `createMessagesTransformHandler({directory, turnSnapshot, nlFirstDispatchKeys})` — creates messages.transform hook adapter | `src/plugin/opencode-plugin.ts` | 100–104 |
| 8 | `createCompactionHandler({directory, turnSnapshot})` — creates session.compacting hook adapter | `src/plugin/opencode-plugin.ts` | 106–109 |
| 9 | `createTransformHandler({directory})` — creates system.transform hook handler (Plan #10) | `src/plugin/opencode-plugin.ts` | 112 |
| 10 | `createCompactionJournalHandler({directory})` — creates compaction journal handler (Plan #10) | `src/plugin/opencode-plugin.ts` | 113 |
| 11 | Plugin returns object with all hook registrations and tool definitions | `src/plugin/opencode-plugin.ts` | 115–250 |

### Hooks Registered

| Hook | Handler | File | Line |
|------|---------|------|------|
| `event` | `eventHandler(eventInput)` | `src/plugin/opencode-plugin.ts` | 116–118 |
| `experimental.chat.system.transform` | `transformHandler(input, output)` | `src/plugin/opencode-plugin.ts` | 119–121 |
| `chat.message` | `handleChatMessage(messageInput, output, directory)` | `src/plugin/opencode-plugin.ts` | 136–153 |
| `permission.ask` | Inline handler — auto-allow HiveMind managed tools, show governance toast for writes | `src/plugin/opencode-plugin.ts` | 154–171 |
| `tool.execute.before` | `recordToolEvent(directory, sessionID, tool:pre)` for HiveMind tools | `src/plugin/opencode-plugin.ts` | 172–177 |
| `shell.env` | Injects `HIVEMIND_RUNTIME_ATTACHED`, `HIVEMIND_ATTACHMENT_MODE`, `HIVEMIND_ACTIVE_TRAJECTORY`, `HIVEMIND_ACTIVE_WORKFLOW` env vars | `src/plugin/opencode-plugin.ts` | 178–184 |
| `command.execute.before` | Injects `<hivemind-command-context>` synthetic part with trajectory/workflow/task/tool_precedence data | `src/plugin/opencode-plugin.ts` | 185–225 |
| `tool.execute.after` | `handleToolExecution(toolInput, output, directory)` + `recordToolEvent` for HiveMind tools | `src/plugin/opencode-plugin.ts` | 226–231 |
| `experimental.text.complete` | `createTextCompleteHandler({directory})` — per-turn journal writer | `src/plugin/opencode-plugin.ts` | 232–244 |
| `experimental.chat.messages.transform` | `messagesTransform` — injects HiveMind context into user messages | `src/plugin/opencode-plugin.ts` | 245 |
| `experimental.session.compacting` | `compactionHandler` + `compactionJournalHandler` — dual compaction handling | `src/plugin/opencode-plugin.ts` | 246–249 |

### Tools Registered (13 total)

| Tool Name | Creator | File | Line |
|-----------|---------|------|------|
| `hivemind_runtime_status` | `createHivemindRuntimeStatusTool(directory)` | `src/plugin/opencode-plugin.ts` | 123 |
| `hivemind_runtime_command` | `createHivemindRuntimeCommandTool(directory)` | `src/plugin/opencode-plugin.ts` | 124 |
| `hivemind_agent_work_create_contract` | `createAgentWorkCreateContractTool(directory)` | `src/plugin/opencode-plugin.ts` | 125 |
| `hivemind_agent_work_export_contract` | `createAgentWorkExportContractTool(directory)` | `src/plugin/opencode-plugin.ts` | 126 |
| `hivemind_doc` | `createHivemindDocTool(directory)` | `src/plugin/opencode-plugin.ts` | 127 |
| `hivemind_task` | `createTaskTool(directory)` | `src/plugin/opencode-plugin.ts` | 128 |
| `hivemind_trajectory` | `createTrajectoryTool(directory)` | `src/plugin/opencode-plugin.ts` | 129 |
| `hivemind_handoff` | `createHivemindHandoffTool(directory)` | `src/plugin/opencode-plugin.ts` | 130 |
| `hivemind_journal` | `createHivemindJournalTool(directory)` | `src/plugin/opencode-plugin.ts` | 131 |
| `hivemind_hm_init` | `createHivemindHmInitTool(directory)` | `src/plugin/opencode-plugin.ts` | 132 |
| `hivemind_hm_doctor` | `createHivemindHmDoctorTool(directory)` | `src/plugin/opencode-plugin.ts` | 133 |
| `hivemind_hm_setting` | `createHivemindHmSettingTool(directory)` | `src/plugin/opencode-plugin.ts` | 134 |

### State Initialized at Load

- **Agent projection:** `.opencode/agents/hivefiver.md` (if missing) — `src/plugin/opencode-plugin.ts:70–82`
- **Skill injection map:** initialized via `initSkillInjection(directory)` — `src/plugin/opencode-plugin.ts:93`
- **SDK context:** initialized via `initSdkContext(input)` — `src/plugin/opencode-plugin.ts:94`
- **Turn snapshot loader:** lazy reader, no disk state yet — `src/plugin/opencode-plugin.ts:96`
- **NL-first dispatch keys:** empty `Set<string>` — `src/plugin/opencode-plugin.ts:97`
- **Process exit handler:** `resetSdkContext()` on `process.on('exit')` — `src/plugin/opencode-plugin.ts:255–257`

---

## 2. Session Created

**Trigger:** OpenCode fires `session.created` event → caught by `event` hook.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode emits `session.created` event with `properties.sessionID` | `src/hooks/event-handler.ts` | 187 |
| 2 | `createEventHandler(directory)` receives event — extracts `sdkSessionId` from `event.properties.sessionID` | `src/hooks/event-handler.ts` | 181–183 |
| 3 | Checks for subagent: reads `parentSessionId`/`parentSessionID`/`parent_session_id` from properties | `src/hooks/event-handler.ts` | 191–196 |
| 4a | **If subagent:** resolves parent session, links parent→child via `linkSubSession()`, returns early (no file creation) | `src/hooks/event-handler.ts` | 198–206 |
| 4b | **If not subagent:** calls `initSession(sessionsDir, {sessionId, lineage, purposeClass, agent})` — creates consolidated session file | `src/hooks/event-handler.ts` | 208–213 |
| 5 | `initSession()` writes V3 schema JSON to `.hivemind/sessions/journey-events/{truncatedSessionId}.json` with zero-initialized counters | `src/features/event-tracker/consolidated-writer.ts` | 235–274 |
| 6 | `addEvent()` records `session_created` event (V3: no-op for in-session events) | `src/hooks/event-handler.ts` | 216–228 |
| 7 | `linkParentChildSessions()` — if `parentSessionId` present, links parent↔child sessions and appends hierarchy link | `src/hooks/event-handler.ts` | 230–237 |
| 8 | After event handling, if `snapshot.trajectoryId` exists, records trajectory event via `recordTrajectoryEvent()` | `src/hooks/event-handler.ts` | 427–447 |

### State Written

| File | Content | Writer |
|------|---------|--------|
| `.hivemind/sessions/journey-events/{sessionId}.json` | V3 session schema: `_schema: "session/v3"`, `sessionId`, `lineage`, `purposeClass`, `agent`, `status: "active"`, counters at 0 | `consolidated-writer.ts:initSession()` |
| `.hivemind/state/trajectory-ledger.json` | If trajectory active, event recorded via `recordTrajectoryEvent()` | `trajectory-store.operations.ts:recordTrajectoryEvent()` |

### Tools Available After Session Created

All 13 tools registered at plugin load are available. The `shell.env` hook injects `HIVEMIND_RUNTIME_ATTACHED=1` and attachment mode into the shell environment — `src/plugin/opencode-plugin.ts:178–184`.

---

## 3. Message Turn (User Sends Message)

**Trigger:** OpenCode fires `chat.message` hook → `handleChatMessage()` fires, then `experimental.chat.messages.transform` fires before the agent processes the message.

### Chain A: `chat.message` Hook (Journal Recording)

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode calls `chat.message` hook with `{sessionID, agent}` and `{message: {role, content}, parts}` | `src/plugin/opencode-plugin.ts` | 136–153 |
| 2 | `handleChatMessage()` resolves or creates consolidated session via `resolver.resolveOrCreate()` | `src/hooks/chat-message-handler.ts` | 45–52 |
| 3 | Loads existing session to calculate `turnNumber = existing.turnCount + 1` | `src/hooks/chat-message-handler.ts` | 55–56 |
| 4 | Extracts model from injection payload (set by `system.transform` hook) | `src/hooks/chat-message-handler.ts` | 59–61 |
| 5 | `addTurn()` increments `turnCount` and `userMessageCount` in session JSON | `src/hooks/chat-message-handler.ts` | 64–75 |
| 6 | Appends turn to markdown events file if it exists | `src/hooks/chat-message-handler.ts` | 77–88 |
| 7 | `turnSnapshot.resetTurnSnapshot()` clears cached snapshot for next turn | `src/plugin/opencode-plugin.ts` | 142 |
| 8 | `turnSnapshot.getSnapshot()` fetches fresh snapshot | `src/plugin/opencode-plugin.ts` | 143 |
| 9 | If `snapshot.hasHivemind && !snapshot.hivemindHealthy`, shows degraded mode warning toast | `src/plugin/opencode-plugin.ts` | 146–152 |

### Chain B: `experimental.chat.messages.transform` Hook (Context Injection)

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode calls `messagesTransform(transformInput, output)` before agent processes message | `src/plugin/opencode-plugin.ts` | 245 |
| 2 | Finds last user message in `output.messages` array | `src/plugin/messages-transform-adapter.ts` | 49 |
| 3 | Skips injection if not a genuine user turn (`variant !== 'new' && variant !== 'continue'`) | `src/plugin/messages-transform-adapter.ts` | 57–59 |
| 4 | Gets turn snapshot via `turnSnapshot.getSnapshot()` | `src/plugin/messages-transform-adapter.ts` | 68 |
| 5 | `resolveStartWork()` — determines required/recommended command based on session state, user message, snapshot | `src/plugin/messages-transform-adapter.ts` | 70–77 |
| 6 | NL-first dispatch: if not already dispatched, calls `maybeExecuteNlFirstRuntimeDispatch()` for automatic command routing | `src/plugin/messages-transform-adapter.ts` | 84–101 |
| 7 | Builds turn hierarchy context: trajectory path = `[trajectoryId, workflowId, checkpointId, ...taskIds]` | `src/plugin/messages-transform-adapter.ts` | 106–116 |
| 8 | Resolves skill bundle and session role for this turn | `src/plugin/messages-transform-adapter.ts` | 119–124 |
| 9 | Renders injection blocks: `renderHivemindContext()`, `renderTurnHierarchy()`, `renderSkillFocusBlock()` | `src/plugin/messages-transform-adapter.ts` | 127–133 |
| 10 | Creates synthetic parts and prepends them to `lastUserMessage.parts` (turn-hierarchy → context → skill-focus) | `src/plugin/messages-transform-adapter.ts` | 136–144 |
| 11 | Optionally appends route hint after user parts (if not already dispatched) | `src/plugin/messages-transform-adapter.ts` | 147–152 |
| 12 | Stores injection payload via `setInjectionPayload()` for later retrieval by `text.complete` and `compaction` hooks | `src/plugin/messages-transform-adapter.ts` | 155–168 |

### Context the Agent Receives

The agent receives the user message with injected synthetic parts containing:
- **Turn hierarchy:** trajectory path, depth, type, sibling count
- **HiveMind context packet:** session state, trajectory/workflow/task bindings, agent-work contract state
- **Skill focus block:** relevant skills for the current session role and purpose class
- **Route hint:** recommended command if no automatic dispatch occurred

---

## 4. Tool Execution (hivemind_trajectory Example)

**Trigger:** Agent calls `hivemind_trajectory` tool with an action argument.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | Agent invokes `hivemind_trajectory` with `{action, trajectoryId, workflowId, ...}` | `src/tools/trajectory/tools.ts` | 33 |
| 2 | `tool.execute.before` hook fires: `isHivemindManagedTool(toolInput.tool)` → `recordToolEvent(directory, sessionID, "hivemind_trajectory:pre")` | `src/plugin/opencode-plugin.ts` | 172–177 |
| 3 | `createHivemindTrajectoryTool(projectRoot).execute(args, context)` is called | `src/tools/trajectory/tools.ts` | 33–47 |
| 4 | Calls `executeHivemindTrajectoryAction(projectRoot, args, {sessionID})` | `src/tools/trajectory/tools.ts` | 34–36 |
| 5 | `executeHivemindTrajectoryAction` loads trajectory ledger from disk | `src/features/trajectory/trajectory.ts` | 35 |
| 6 | Resolves `selectedTrajectoryId` from args or ledger (`activeTrajectoryId` → `lastClosedTrajectoryId`) | `src/features/trajectory/trajectory.ts` | 36 |
| 7 | **Action dispatch** — switch on `args.action`: | `src/features/trajectory/trajectory.ts` | 38–177 |

### Action: `attach`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7a | Calls `bootstrapTrajectoryLedger(projectRoot, {trajectoryId, workflowId, sessionId, lineage, purposeClass, taskIds, subtaskIds})` | `src/features/trajectory/trajectory.ts` | 88–96 |
| 7b | `bootstrapTrajectoryLedger` calls `bootstrapWorkflowAuthority()` to create workflow state | `src/core/trajectory/trajectory-store.operations.ts` | 65–71 |
| 7c | Activates workflow tasks via `activateWorkflowTask()` for each task/subtask | `src/core/trajectory/trajectory-store.operations.ts` | 72–87 |
| 7d | Ensures ledger exists via `ensureTrajectoryLedger()` — creates empty ledger if missing | `src/core/trajectory/trajectory-store.operations.ts` | 89 |
| 7e | Creates or updates trajectory record in ledger, sets `activeTrajectoryId` | `src/core/trajectory/trajectory-store.operations.ts` | 90–108 |
| 7f | `saveTrajectoryLedger()` writes to `.hivemind/state/trajectory-ledger.json` (atomic: write temp → rename) | `src/core/trajectory/trajectory-store.ledger.ts` | 72–80 |

### Action: `event`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7g | Calls `recordTrajectoryEvent(projectRoot, selectedTrajectoryId, {kind, summary, evidenceRefs})` | `src/features/trajectory/trajectory.ts` | 143–147 |
| 7h | Loads ledger, finds trajectory, pushes event to `trajectory.events[]` | `src/core/trajectory/trajectory-store.operations.ts` | 123–138 |
| 7i | Merges unique `eventSummaries` and `evidenceRefs`, updates `updatedAt` | `src/core/trajectory/trajectory-store.operations.ts` | 134–136 |
| 7j | Saves ledger to disk | `src/core/trajectory/trajectory-store.operations.ts` | 138 |

### Action: `checkpoint`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7k | Calls `createTrajectoryCheckpoint(projectRoot, {trajectoryId, workflowId, taskIds, subtaskIds, source, resumeTarget})` | `src/features/trajectory/trajectory.ts` | 121–128 |
| 7l | Creates checkpoint object with ID `chk_{trajectoryId}_{n}`, pushes to `ledger.checkpoints[]` | `src/core/trajectory/trajectory-store.operations.ts` | 187–205 |
| 7m | Saves ledger to disk | `src/core/trajectory/trajectory-store.operations.ts` | 204 |

### Action: `traverse`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7n | Reads `readWorkflowTaskState(projectRoot)` to get task state | `src/features/trajectory/trajectory.ts` | 61 |
| 7o | Filters tasks/subtasks matching trajectory's `taskIds`/`subtaskIds` | `src/features/trajectory/trajectory.ts` | 67–68 |
| 7p | Returns trajectory, workflows, tasks, subtasks, checkpoints | `src/features/trajectory/trajectory.ts` | 70–81 |

### Action: `close`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7q | Calls `closeTrajectory(projectRoot, selectedTrajectoryId, {closingSummary})` | `src/features/trajectory/trajectory.ts` | 162–164 |
| 7r | Sets `status: "closed"`, `closedAt`, `closingSummary`, clears `activeTrajectoryId`, sets `lastClosedTrajectoryId` | `src/core/trajectory/trajectory-store.operations.ts` | 159–171 |
| 7s | Saves ledger to disk | `src/core/trajectory/trajectory-store.operations.ts` | 171 |

### Action: `inspect`

| Step | Description | File | Line |
|------|-------------|------|------|
| 7t | Calls `inspectTrajectoryLedger(projectRoot)` — checks existence, health, version | `src/features/trajectory/trajectory.ts` | 44 |
| 7u | Returns ledger inspection, active/closed trajectory IDs, selected trajectory | `src/features/trajectory/trajectory.ts` | 40–50 |

### Post-Execution

| Step | Description | File | Line |
|------|-------------|------|------|
| 8 | `tool.execute.after` hook fires: `handleToolExecution()` writes `tool_invocation` event to session journal | `src/plugin/opencode-plugin.ts` | 226–227 |
| 9 | `recordToolEvent(directory, sessionID, "hivemind_trajectory")` records completion | `src/plugin/opencode-plugin.ts` | 228–230 |
| 10 | Tool result rendered via `render(success(result.message, result.data))` and returned to agent | `src/tools/trajectory/tools.ts` | 46 |

### Files Read/Written

| File | Operation | When |
|------|-----------|------|
| `.hivemind/state/trajectory-ledger.json` | Read + Write | Every trajectory action |
| `.hivemind/state/tasks.json` | Read | `traverse` action |
| `.hivemind/sessions/journey-events/{sessionId}.json` | Write (counter increment) | `tool.execute.after` hook |

---

## 5. Session Compacted

**Trigger:** OpenCode fires `experimental.session.compacting` hook when context window approaches limit.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode calls `experimental.session.compacting` with `{sessionID}` and `{context: string[], prompt?: string}` | `src/plugin/opencode-plugin.ts` | 246–249 |
| 2 | **Dual handler execution:** `compactionHandler(input, output)` runs first | `src/plugin/opencode-plugin.ts` | 247 |
| 3 | `compactionHandler` loads turn snapshot via `turnSnapshot.getSnapshot()` | `src/plugin/compaction-adapter.ts` | 30 |
| 4 | Resolves agent-work packet via `resolveCompactionAgentWorkPacket(directory, sessionID)` | `src/plugin/compaction-adapter.ts` | 31–34 |
| 5 | Creates HiveMind context packet with session ID, snapshot, agent-work data | `src/plugin/compaction-adapter.ts` | 35–39 |
| 6 | Renders context via `renderHivemindContext(packet)` and pushes to `output.context[]` — this injects HiveMind state into the compaction prompt | `src/plugin/compaction-adapter.ts` | 42–44 |
| 7 | **Second handler:** `compactionJournalHandler(input, output)` runs | `src/plugin/opencode-plugin.ts` | 248 |
| 8 | `compactionJournalHandler` resolves or creates consolidated session | `src/hooks/compaction-handler.ts` | 58–62 |
| 9 | Adds `compaction` event to session journal (V3: no-op for in-session events) | `src/hooks/compaction-handler.ts` | 65–77 |
| 10 | Increments `compactionCount` counter in session JSON | `src/hooks/compaction-handler.ts` | 80 |
| 11 | Appends compaction entry to markdown events file | `src/hooks/compaction-handler.ts` | 82–93 |
| 12 | **Event handler also catches `session.compacted`:** creates recovery checkpoint via `createRecoveryCheckpoint()` with trajectory/workflow/task state | `src/hooks/event-handler.ts` | 449–458 |

### State Written

| File | Content | Writer |
|------|---------|--------|
| `.hivemind/sessions/journey-events/{sessionId}.json` | `compactionCount` incremented | `consolidated-writer.ts:incrementCounter()` |
| `.hivemind/sessions/journey-events/{sessionId}-events.md` | Compaction entry appended | `markdown-writer.ts:appendTurnToMarkdown()` |
| `.hivemind/activity/state/recovery-checkpoint.json` | Recovery checkpoint with trajectory/workflow/task IDs, source, resume target | `recovery/index.ts:createRecoveryCheckpoint()` |

### State Preserved

The compaction handler injects the full HiveMind context packet into the compaction prompt, ensuring the LLM retains awareness of:
- Active trajectory ID and workflow ID
- Current task/subtask IDs
- Agent-work contract state
- Session lineage and purpose class

---

## 6. Session Idle

**Trigger:** OpenCode fires `session.idle` event → caught by `event` hook.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode emits `session.idle` event with `properties.sessionID` | `src/hooks/event-handler.ts` | 381 |
| 2 | `createEventHandler` receives event, extracts `sessionId` from `event.properties.sessionID` | `src/hooks/event-handler.ts` | 383 |
| 3 | If no `sessionId`, exits early | `src/hooks/event-handler.ts` | 386–389 |
| 4 | If SDK client available, fetches session data and messages via `client.session.get()` and `client.session.messages()` | `src/hooks/event-handler.ts` | 391–399 |
| 5 | Resolves existing session via `sessionResolver.resolve(sessionId)` — does NOT create new files for idle sessions | `src/hooks/event-handler.ts` | 402 |
| 6 | If no consolidated session found, exits early | `src/hooks/event-handler.ts` | 404–406 |
| 7 | Writes `session_idle` event via `addEvent()` (V3: no-op for in-session events) | `src/hooks/event-handler.ts` | 410–421 |
| 8 | If `snapshot.trajectoryId` exists, records trajectory event | `src/hooks/event-handler.ts` | 427–447 |

### State Written

| File | Content | Writer |
|------|---------|--------|
| `.hivemind/state/trajectory-ledger.json` | If trajectory active, idle event recorded | `trajectory-store.operations.ts:recordTrajectoryEvent()` |

**Note:** The `addEvent()` call in V3 schema is a no-op (see `consolidated-writer.ts:325–331`). The idle event is primarily recorded in the trajectory ledger if a trajectory is active. No session JSON is modified for idle events.

---

## 7. Session Deleted

**Trigger:** OpenCode fires `session.deleted` event → caught by `event` hook.

| Step | Description | File | Line |
|------|-------------|------|------|
| 1 | OpenCode emits `session.deleted` event with `properties.sessionID` | `src/hooks/event-handler.ts` | 337 |
| 2 | `createEventHandler` receives event, extracts `sdkSessionId` | `src/hooks/event-handler.ts` | 337 |
| 3 | Resolves consolidated session via `sessionResolver.resolve(sdkSessionId)` | `src/hooks/event-handler.ts` | 338 |
| 4 | If consolidated session found, records `session_deleted` event (V3: no-op) | `src/hooks/event-handler.ts` | 341–352 |
| 5 | Updates session status to `"abandoned"` (maps to `"errored"` in V3) via `updateStatus()` | `src/hooks/event-handler.ts` | 354 |
| 6 | `updateStatus()` sets `endedAt` to current timestamp when status is no longer `"active"` | `src/features/event-tracker/consolidated-writer.ts` | 401–406 |
| 7 | If `snapshot.trajectoryId` exists, records trajectory event | `src/hooks/event-handler.ts` | 427–447 |

### State Written

| File | Content | Writer |
|------|---------|--------|
| `.hivemind/sessions/journey-events/{sessionId}.json` | `status: "errored"`, `endedAt: <timestamp>` | `consolidated-writer.ts:updateStatus()` |
| `.hivemind/state/trajectory-ledger.json` | If trajectory active, deletion event recorded | `trajectory-store.operations.ts:recordTrajectoryEvent()` |

### Cleanup Behavior

- Session file is **NOT deleted** — status is changed to `"errored"` with `endedAt` timestamp
- Trajectory ledger is **NOT cleaned up** — trajectory remains with its events
- No recovery checkpoint is created for deleted sessions (only for `session.compacted`)
- Subsession links remain in parent session's `subsessionIds` array

---

## Lifecycle Event Summary Table

| Event | Hook | Feature Called | State Written | Tools Affected |
|-------|------|---------------|---------------|----------------|
| **Plugin Load** | N/A (plugin entry) | `ensureAgentProjection`, `initSkillInjection`, `initSdkContext` | `.opencode/agents/hivefiver.md` (if missing) | All 13 tools registered |
| **session.created** | `event` | `initSession`, `addEvent`, `linkParentChildSessions` | `.hivemind/sessions/journey-events/{id}.json` | All tools available; `shell.env` injects runtime vars |
| **chat.message** | `chat.message` | `handleChatMessage`, `addTurn` | `.hivemind/sessions/journey-events/{id}.json` (turnCount++) | None directly |
| **messages.transform** | `experimental.chat.messages.transform` | `resolveStartWork`, `maybeExecuteNlFirstRuntimeDispatch`, `renderHivemindContext` | In-memory injection payload (not persisted) | NL-first dispatch may auto-trigger `hivemind_runtime_command` |
| **tool.execute.before** | `tool.execute.before` | `recordToolEvent(tool:pre)` | Tool event tracking (runtime-loader) | All HiveMind tools |
| **tool.execute.after** | `tool.execute.after` | `handleToolExecution`, `recordToolEvent` | `.hivemind/sessions/journey-events/{id}.json` (toolCallCount++) | All HiveMind tools |
| **text.complete** | `experimental.text.complete` | `createTextCompleteHandler` → `addTurn`, `addEvent`, `addDiagnostic` | `.hivemind/sessions/journey-events/{id}.json` + markdown | None directly |
| **session.compacting** | `experimental.session.compacting` | `compactionHandler`, `compactionJournalHandler` | Session JSON (compactionCount++), markdown events, recovery checkpoint | None directly |
| **session.compacted** | `event` | `createRecoveryCheckpoint` | `.hivemind/activity/state/recovery-checkpoint.json` | None directly |
| **session.idle** | `event` | `addEvent` (idle), trajectory event recording | Trajectory ledger (if active) | None directly |
| **session.deleted** | `event` | `addEvent` (deleted), `updateStatus("abandoned")` | Session JSON (status→"errored", endedAt set) | None directly |
| **session.error** | `event` | `addEvent`, `addDiagnostic`, `appendError` | Session JSON + error log | None directly |
| **session.updated** | `event` | `addEvent` (updated) | None (V3 no-op) | None directly |
| **session.diff** | `event` | `addEvent` (diff) | None (V3 no-op) | None directly |
| **agent.created** | `event` | `addEvent` (agent_created in parent) | Parent session JSON | None directly |
| **command.execute.before** | `command.execute.before` | `findSlashCommandBundle`, inject `<hivemind-command-context>` | None (in-memory injection) | `hivemind_runtime_command` precedence chain built |
| **permission.ask** | `permission.ask` | Auto-allow HiveMind tools, governance toast for writes | None | All HiveMind tools auto-allowed |

---

## Disk State Map

All persistent state lives under `.hivemind/` in the consumer project:

```
.hivemind/
├── state/
│   ├── trajectory-ledger.json    ← Trajectory records, events, checkpoints, recovery log
│   └── tasks.json                ← Workflow task state
├── sessions/
│   └── journey-events/
│       ├── {sessionId}.json      ← V3 consolidated session (counters, status, metadata)
│       └── {sessionId}-events.md ← Markdown event log (turns, tool calls, compactions)
├── config/
│   └── runtime-attachment.json   ← Runtime attachment settings
├── activity/
│   └── state/
│       └── recovery-checkpoint.json  ← Recovery checkpoints from compaction
└── project/
    └── planning/                 ← Planning artifacts
```

---

## Key Architectural Observations

1. **CQRS pattern:** Tools write state (trajectory ledger, session JSON), hooks read and inject context. No hook performs durable writes beyond session journaling.
2. **V3 schema migration:** `addEvent()` and `addDiagnostic()` are no-ops in V3 — events go to separate files, not in-session. Counters remain the primary in-session tracking mechanism.
3. **Dual compaction handling:** Both `compactionHandler` (context injection) and `compactionJournalHandler` (journal recording) run on compaction, plus `event` handler creates recovery checkpoints on `session.compacted`.
4. **Subagent isolation:** Subagent sessions (`parentSessionId` present) do NOT get their own session files — they are linked to parent sessions only.
5. **Trajectory as authority:** The trajectory ledger (`.hivemind/state/trajectory-ledger.json`) is the single source of truth for active session bindings, workflow associations, and event history.
6. **Injection store pattern:** `setInjectionPayload()` / `getAndClearInjectionPayload()` provides turn-scoped context transfer between hooks (messages.transform → text.complete → compaction).
