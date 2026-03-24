# Session Inspection Export

- ses_id: `ses_2e5714387ffeLjsGWQuHC8ps1b`
- prepared_at: `2026-03-23T12:02:38.279Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Event tracking and diagnostic logging system in HiveMind project  
**Question:** Understand the current `.hivemind/error-log/` structure, `.hivemind/session-inspection/` structure, hooks registration, event tracking, logging patterns, and related types/interfaces

---

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **Error Log Structure** — Files are flat in `.hivemind/error-log/`, named `{sessionId}-{timestamp}.md` | `.hivemind/error-log/` | — | 90+ files with naming pattern `ses_*-{timestamp}.md` |
| 2 | **Error Log Content Format** — YAML frontmatter + markdown body | `.hivemind/error-log/ses_2e5714387ffeLjsGWQuHC8ps1b-1774267065038.md` | 1-13 | `session_id`, `timestamp`, `purpose`, `session_state`, `trajectory`, `workflow`, `agent` fields in frontmatter |
| 3 | **Session Inspection Structure** — Per-session directories with 2 files each | `.hivemind/session-inspection/` | — | Each session has `purification-command.json` and `assistant-output.md` |
| 4 | **Purification Command Schema** — v1 schema with tool hints | `src/sdk-supervisor/session-inspection.ts` | 9-18 | `PreparedPurificationCommand` interface: `version`, `kind`, `status`, `ses_id`, `markdown_path`, `tool_hints`, `instruction`, `prepared_at` |
| 5 | **Diagnostic Log Writer** — Writes to `.hivemind/error-log/` | `src/sdk-supervisor/diagnostic-log.ts` | 92-104 | `writeDiagnosticLog()` creates file at `{sessionId}-{Date.now()}.md` |
| 6 | **Diagnostic Log Entry Interface** — Rich metadata structure | `src/sdk-supervisor/diagnostic-log.ts` | 11-33 | `DiagnosticLogEntry`: `sessionId`, `timestamp`, `assistantText`, `purpose`, `sessionState`, `trajectory`, `workflow`, `agent`, `injection` |
| 7 | **Session Inspection Export** — Upserts per-session inspection artifacts | `src/sdk-supervisor/session-inspection.ts` | 76-106 | `upsertSessionInspectionExport()` writes `assistant-output.md` + `purification-command.json` |
| 8 | **Event Handler** — Central event hook bridging to trajectory ledger | `src/hooks/event-handler.ts` | 87-125 | `createEventHandler()` creates OpenCode `event` hook, records trajectory events |
| 9 | **Known Event Types** — 10 tracked event types | `src/hooks/event-handler.ts` | 26-37 | `session.started`, `session.ended`, `session.compacted`, `message.added`, `message.updated`, `tool.executed`, `command.executed`, `agent.created`, `trajectory.started`, `trajectory.ended` |
| 10 | **Agent-Work Event Types** — Specialized event extraction | `src/features/agent-work-contract/hooks/agent-work-event-handler.ts` | 38-43 | `AgentWorkEventPacketSchema`: `session.compacted`, `command.executed` |
| 11 | **Plugin Hook Registration** — Assembly wiring in plugin entry | `src/plugin/opencode-plugin.ts` | 42-206 | Registers: `event`, `chat.message`, `permission.ask`, `tool.execute.before`, `shell.env`, `command.execute.before`, `tool.execute.after`, `experimental.text.complete`, `experimental.chat.messages.transform`, `experimental.session.compacting` |
| 12 | **Logging Utility** — Dual-output logger (console + SDK) | `src/shared/logging.ts` | 34-56 | `log` object with `debug`, `info`, `warn`, `error` methods, sends to `client.app.log()` |
| 13 | **Path Resolution** — Centralized path builders | `src/shared/paths.ts` | 38-89 | `getErrorLogPath()`, `getSessionInspectionPath()`, `getEffectivePaths()` includes `errorLogDir` and `sessionInspectionDir` |
| 14 | **Injection Store** — In-memory payload storage for diagnostic logs | `src/plugin/injection-store.ts` | 10-35 | `InjectionPayload` interface, `setInjectionPayload()`, `getAndClearInjectionPayload()` |
| 15 | **Tool Event Recording** — Trajectory event logging for managed tools | `src/hooks/runtime-loader/tool-governance.ts` | 19-34 | `recordToolEvent()` records `transition` kind events with tool name and session ID |
| 16 | **Recovery Checkpoint** — Created on session.compacted events | `src/hooks/event-handler.ts` | 114-123 | `createRecoveryCheckpoint()` triggered when `event.type === 'session.compacted'` |
| 17 | **Toast Notifications** — SDK client toast with cooldown | `src/hooks/soft-governance.ts` | 26-45 | `showGovernanceToast()` with 5-second cooldown per category |
| 18 | **SDK Context** — Cached plugin references | `src/hooks/sdk-context.ts` | 21-26 | `initSdkContext()` caches `client`, `shell`, `serverUrl`, `project` |
| 19 | **Session Inspection Test** — Test file exists | `src/sdk-supervisor/session-inspection.test.ts` | — | Test coverage for session inspection exports |
| 20 | **Tools Directory** — 6 custom tools + 2 agent-work contract tools | `src/tools/` | — | `doc/`, `handoff/`, `runtime/`, `task/`, `trajectory/` directories |

---

### Structure Map

```
.hivemind/
├── error-log/                          # Diagnostic logs per assistant completion
│   └── {sessionId}-{timestamp}.md      # YAML frontmatter + assistant output
├── session-inspection/                 # Per-session inspection artifacts
│   └── {sessionId}/
│       ├── assistant-output.md         # Session output snapshot
│       └── purification-command.json   # Async purification command

src/
├── hooks/
│   ├── event-handler.ts                # Central event hook (125 lines)
│   ├── sdk-context.ts                  # SDK client/shell references (98 lines)
│   ├── soft-governance.ts              # Toast notifications (52 lines)
│   ├── runtime-loader/
│   │   └── tool-governance.ts          # Tool event recording (34 lines)
│   └── index.ts                        # Barrel exports
├── plugin/
│   ├── opencode-plugin.ts              # Plugin assembly (212 lines)
│   ├── injection-store.ts              # In-memory injection payloads (35 lines)
│   └── messages-transform-adapter.ts   # Messages transform hook (179 lines)
├── sdk-supervisor/
│   ├── diagnostic-log.ts               # Error log writer (104 lines)
│   ├── session-inspection.ts           # Session inspection writer (106 lines)
│   └── index.ts                        # Barrel exports
├── shared/
│   ├── logging.ts                      # Dual-output logger (56 lines)
│   └── paths.ts                        # Path builders (89 lines)
├── recovery/
│   └── recovery-engine.ts              # Recovery checkpoint creation (161 lines)
└── features/
    └── agent-work-contract/hooks/
        └── agent-work-event-handler.ts # Event packet extraction (88 lines)
```

---

### Patterns Found

1. **Hook Registration Pattern** — Plugin entry (`opencode-plugin.ts`) imports factory functions, creates handlers with `directory` parameter, returns hook object mapping SDK hook keys to async handlers.

2. **Event Recording Pattern** — Events flow through `event-handler.ts` → `normalizeEventSummary()` → `recordTrajectoryEvent()` with evidence refs from runtime snapshot.

3. **Diagnostic Log Writing Pattern** — `experimental.text.complete` hook → `writeDiagnosticLog()` → file write to `.hivemind/error-log/{sessionId}-{timestamp}.md`.

4. **Session Inspection Pattern** — `experimental.text.complete` hook → `upsertSessionInspectionExport()` → writes `assistant-output.md` + `purification-command.json` to `.hivemind/session-inspection/{sessionId}/`.

5. **Injection Payload Flow** — `messages-transform-adapter.ts` → `setInjectionPayload()` → `experimental.text.complete` → `getAndClearInjectionPayload()` → included in diagnostic log.

6. **Tool Event Pattern** — `tool.execute.before`/`tool.execute.after` → `recordToolEvent()` → `recordTrajectoryEvent()` with `transition` kind.

7. **Path Resolution Pattern** — All paths derived from `getEffectivePaths(projectRoot)` in `shared/paths.ts`, never hardcoded.

---

### Gaps

1. **No dedicated `diagnostic-log.ts` test file** — `session-inspection.test.ts` exists but no corresponding test for diagnostic log writing.

2. **No event type for trajectory events** — The `trajectory.started` and `trajectory.ended` events are listed in `KNOWN_EVENT_TYPES` but no specific handling logic exists for them in the event handler.

3. **No structured error classification** — Error logs contain raw assistant text but no error classification, stack traces, or failure categorization.

4. **No log rotation or cleanup** — Error logs accumulate without rotation, cleanup, or size limits.

5. **No session inspection for non-text events** — Session inspection only captures `text.complete` events, not tool executions or command results.

---

### Git Context

- Recent commits show the diagnostic logging and session inspection systems are actively used
- The `experimental.text.complete` hook is the primary trigger for both logging systems
- The `injection-store.ts` was recently added to bridge `messages-transform-adapter.ts` and `text.complete` hook