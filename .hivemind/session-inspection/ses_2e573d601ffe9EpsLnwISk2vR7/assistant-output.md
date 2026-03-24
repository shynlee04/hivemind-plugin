# Session Inspection Export

- ses_id: `ses_2e573d601ffe9EpsLnwISk2vR7`
- prepared_at: `2026-03-23T11:55:40.200Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** OpenCode SDK hooks, plugin hook registrations, event handling, trajectory tracking, all hook implementations, and compaction adapter
**Question:** What hooks exist in the SDK, which are registered, and what do they do?

---

### Task 1: OpenCode SDK Hook Definitions

**File:** `node_modules/@opencode-ai/plugin/dist/index.d.ts` (lines 108–232)

The `Hooks` interface defines **16 hook surfaces**:

| Hook Key | Signature | Purpose |
|----------|-----------|---------|
| `event` | `(input: { event: Event }) => Promise<void>` | All OpenCode lifecycle events |
| `config` | `(input: Config) => Promise<void>` | React to config changes |
| `tool` | `{ [key: string]: ToolDefinition }` | Tool registration (not a callback) |
| `auth` | `AuthHook` | Auth provider (not a callback) |
| `chat.message` | `(input: { sessionID, agent?, model?, messageID?, variant? }, output: { message: UserMessage, parts: Part[] })` | New message received |
| `chat.params` | `(input: { sessionID, agent, model, provider, message }, output: { temperature, topP, topK, options })` | Modify LLM parameters |
| `chat.headers` | `(input: { sessionID, agent, model, provider, message }, output: { headers })` | Custom auth headers |
| `permission.ask` | `(input: Permission, output: { status: "ask"|"deny"|"allow" })` | Gate file/state mutations |
| `command.execute.before` | `(input: { command, sessionID, arguments }, output: { parts: Part[] })` | Pre-command context injection |
| `tool.execute.before` | `(input: { tool, sessionID, callID }, output: { args })` | Pre-validate/transform tool args |
| `shell.env` | `(input: { cwd, sessionID?, callID? }, output: { env })` | Inject environment variables |
| `tool.execute.after` | `(input: { tool, sessionID, callID, args }, output: { title, output, metadata })` | Post-tool observation |
| `experimental.chat.messages.transform` | `(input: {}, output: { messages: { info, parts }[] })` | Transform message history |
| `experimental.chat.system.transform` | `(input: { sessionID?, model }, output: { system: string[] })` | Modify system prompt |
| `experimental.session.compacting` | `(input: { sessionID }, output: { context: string[], prompt?: string })` | Customize compaction prompt |
| `experimental.text.complete` | `(input: { sessionID, messageID, partID }, output: { text })` | Streaming text injection |
| `tool.definition` | `(input: { toolID }, output: { description, parameters })` | Modify tool descriptions |

---

### Task 2: Hook Registrations in opencode-plugin.ts

**File:** `src/plugin/opencode-plugin.ts` (212 lines)

**10 hooks registered** (out of 16 available):

| # | Hook | Lines | Handler Behavior |
|---|------|-------|-----------------|
| 1 | `event` | 62–64 | Delegates to `createEventHandler(directory)` — records trajectory events, creates recovery checkpoints on `session.compacted` |
| 2 | `tool` | 65–74 | Registers **8 tools**: `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`, `hivemind_doc`, `hivemind_task`, `hivemind_trajectory`, `hivemind_handoff` |
| 3 | `chat.message` | 75–87 | Resets turn snapshot, shows degraded-mode warning toast if HiveMind unhealthy |
| 4 | `permission.ask` | 88–105 | Auto-allows HiveMind-managed tools; surfaces governance toast for `write` permission requests |
| 5 | `tool.execute.before` | 106–111 | Records `tool:pre` event for managed tools via `recordToolEvent()` |
| 6 | `shell.env` | 112–118 | Injects `HIVEMIND_RUNTIME_ATTACHED=1`, `HIVEMIND_ATTACHMENT_MODE`, `HIVEMIND_ACTIVE_TRAJECTORY`, `HIVEMIND_ACTIVE_WORKFLOW` env vars |
| 7 | `command.execute.before` | 119–158 | Looks up slash command bundle, builds tool-precedence chain, injects synthetic `<hivemind-command-context>` part with trajectory/workflow/task state |
| 8 | `tool.execute.after` | 160–164 | Records tool execution for managed tools via `recordToolEvent()` |
| 9 | `experimental.text.complete` | 165–201 | Exports session inspection data + writes diagnostic log with assistant text, purpose, trajectory, workflow, agent, injection metadata |
| 10 | `experimental.chat.messages.transform` | 203 | Delegates to `createMessagesTransformHandler()` — synthetic part injection into message history |
| 11 | `experimental.session.compacting` | 204 | Delegates to `createCompactionHandler()` — injects HiveMind context into compaction prompt |

**6 hooks NOT registered:** `config`, `chat.params`, `chat.headers`, `auth`, `experimental.chat.system.transform`, `tool.definition`

---

### Task 3: Event Handler

**File:** `src/hooks/event-handler.ts` (125 lines)

**Known event types tracked** (line 27–37):
- `session.started`, `session.ended`, `session.compacted`
- `message.added`, `message.updated`
- `tool.executed`, `command.executed`
- `agent.created`
- `trajectory.started`, `trajectory.ended`

**Handler logic:**
1. Validates event shape (lines 13–44) — warns on malformed/unknown types
2. Loads runtime bindings snapshot to get active `trajectoryId` (line 91)
3. Early-returns if no active trajectory (line 93)
4. Validates event's session matches active trajectory session (lines 96–101)
5. Resolves agent-work evidence from `ContractStore` (lines 46–68)
6. Records trajectory event via `recordTrajectoryEvent()` with kind `note` (line 108)
7. On `session.compacted` with active workflow: creates recovery checkpoint (lines 114–123)

---

### Task 4: Trajectory Data Structures

**File:** `src/core/trajectory/trajectory-types.ts` (155 lines, first 60 shown)

Composed via intersection types (following the interface decomposition principle):

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `TrajectoryCore` | `id`, `lineage`, `purposeClass`, `status`, `createdAt`, `updatedAt` | Identity and lifecycle |
| `TrajectoryBindings` | `workflowIds[]`, `sessionIds[]`, `taskIds[]`, `subtaskIds[]`, `delegationIds[]` | Entity attachments |
| `TrajectoryEvidence` | `events[]`, `eventSummaries[]`, `evidenceRefs[]`, `checkpointIds[]` | Event history |
| `TrajectoryPlanning` | `planningRefs[]`, `graphNodeBindings[]`, `rerouteNotes[]`, `branchNotes[]`, `nextAllowedTransitions[]` | Routing metadata |

**Full type:** `TrajectoryRecord = TrajectoryCore & TrajectoryBindings & TrajectoryEvidence` (line 58–60, plus `TrajectoryPlanning` beyond line 60)

**TrajectoryEvent** (line 14–19): `{ kind: 'summary'|'handoff'|'evidence'|'transition'|'note', summary, evidenceRefs?, createdAt? }`

**Statuses:** `'active' | 'closed'`
**Assessment actions:** `'attach-active' | 'resume-closed' | 'create-new' | 'defer-pending' | 'refuse-conflict'`

---

### Task 5: ALL Existing Hook Implementations

**Directory:** `src/hooks/` — **16 files across 7 sub-modules:**

| Sub-Module | Files | Purpose |
|------------|-------|---------|
| **Root** | `event-handler.ts` | OpenCode `event` hook — trajectory event recording |
| | `sdk-context.ts` | Cached SDK client/shell references |
| | `soft-governance.ts` | Toast notifications via `client.tui.showToast()` |
| | `index.ts` | Barrel export |
| **start-work/** | `index.ts`, `start-work-router.ts`, `start-work-router-helpers.ts`, `start-work-router.test.ts` | Session lifecycle — purpose classification, lineage, readiness gates |
| **runtime-loader/** | `index.ts`, `tool-governance.ts`, `runtime-stage.ts` | Post-tool state observation (`tool.execute.after`) and managed tool detection |
| **workflow-integration/** | `index.ts`, `workflow-continuity.ts` | Session compaction context injection |
| **auto-slash-command/** | `index.ts`, `auto-slash-command.ts`, `auto-slash-command-types.ts` | Auto-detect and route slash commands |

**Note:** Several hook modules referenced in `src/hooks/AGENTS.md` (`context-injection/`, `prompt-transformation/`, `runtime-bridge/`) do NOT have corresponding directories — these appear to be either deprecated, moved to `src/plugin/`, or described aspirationally.

---

### Task 6: Compaction Adapter

**File:** `src/plugin/compaction-adapter.ts` (46 lines)

Exports `createCompactionHandler(deps: CompactionDeps)` which:
1. Gets turn snapshot via `turnSnapshot.getSnapshot()`
2. Resolves agent-work contract packet via `resolveCompactionAgentWorkPacket(directory, sessionId)`
3. Creates a HiveMind context packet via `createHivemindContextPacket({ sessionId, snapshot, agentWorkPacket })`
4. Renders the full context via `renderHivemindContext(packet)`
5. Pushes the rendered string into `output.context[]`

**Data injected into compaction context:**
- Session ID
- Runtime snapshot (trajectory ID, workflow ID, task IDs, attachment mode)
- Agent-work contract data (contract ID, trigger, evidence)

---

### Gaps

1. **Missing hook directories:** `context-injection/`, `prompt-transformation/`, `runtime-bridge/` are referenced in `src/hooks/AGENTS.md` but do not exist as directories under `src/hooks/`. The `messages.transform` adapter lives in `src/plugin/messages-transform-adapter.ts` instead.
2. **Unregistered hooks:** `chat.params`, `chat.headers`, `config`, `auth`, `tool.definition`, `experimental.chat.system.transform` are available in the SDK but not registered by HiveMind.
3. **`experimental.chat.system.transform`** is listed as "Retired" in the plugin AGENTS.md — system prompt injection was removed in Phase 11.

### Structure Map

```
src/hooks/
├── index.ts                          (barrel export)
├── event-handler.ts                  (event hook → trajectory)
├── sdk-context.ts                    (SDK client cache)
├── soft-governance.ts                (toast notifications)
├── start-work/                       (session lifecycle)
│   ├── index.ts
│   ├── start-work-router.ts
│   ├── start-work-router-helpers.ts
│   └── start-work-router.test.ts
├── runtime-loader/                   (tool.execute.after)
│   ├── index.ts
│   ├── tool-governance.ts
│   └── runtime-stage.ts
├── workflow-integration/             (session.compacting)
│   ├── index.ts
│   └── workflow-continuity.ts
└── auto-slash-command/               (chat.message → slash routing)
    ├── index.ts
    ├── auto-slash-command.ts
    └── auto-slash-command-types.ts
```