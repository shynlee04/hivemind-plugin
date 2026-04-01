---
title: "Runtime Event Wiring Investigation"
date: 2026-03-31
author: hivexplorer
type: investigation-report
status: complete
git_commit: d48dd1b6
branch: v2.9.5-detox-dev
---

# Runtime Event Wiring Investigation — 2026-03-31

## Summary

The HiveMind plugin wires into **13 OpenCode hooks** across its plugin assembly (`src/plugin/opencode-plugin.ts`). Of these, **10 are actively registered** and **3 are experimental**. The event handler (`src/hooks/event-handler.ts`) intercepts **8 session-level events** from OpenCode's event bus, but **session.fork, session.resume, session.redo, and session.undo are NOT handled** — they don't exist as OpenCode events. The plugin registers **12 tools** (not 7 as AGENTS.md claims — 5 additional tools were added: `hivemind_hm_init`, `hivemind_hm_doctor`, `hivemind_hm_setting`, `hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`). A critical finding: `addEvent()` and `addDiagnostic()` in `consolidated-writer.ts` are **no-op stubs** (V3 migration), meaning all event/diagnostic writes from hooks silently do nothing. The `dashboard-v2/` directory is dead code (only contains `package-lock.json`). `doc-surface-router` is exported but its consumption is limited to `src/intelligence/doc/`. `classify-intent-tool` is exported from agent-work-contract but NOT registered as a plugin tool.

## Hook Wiring Status

| Hook | File | Status | Evidence |
|------|------|--------|----------|
| `event` | `src/plugin/opencode-plugin.ts:116-118` | **ACTIVE** | Delegates to `createEventHandler(directory)` |
| `chat.message` | `src/plugin/opencode-plugin.ts:136-153` | **ACTIVE** | Calls `handleChatMessage()`, resets turn snapshot, shows degraded mode toast |
| `permission.ask` | `src/plugin/opencode-plugin.ts:154-171` | **ACTIVE** | Auto-allows HiveMind managed tools, shows governance toast for writes |
| `tool.execute.before` | `src/plugin/opencode-plugin.ts:172-177` | **ACTIVE** | Records pre-execution event via `recordToolEvent()` |
| `tool.execute.after` | `src/plugin/opencode-plugin.ts:226-231` | **ACTIVE** | Calls `handleToolExecution()`, records post-execution event |
| `shell.env` | `src/plugin/opencode-plugin.ts:178-184` | **ACTIVE** | Injects `HIVEMIND_*` env vars |
| `command.execute.before` | `src/plugin/opencode-plugin.ts:185-225` | **ACTIVE** | Injects command context with tool precedence chain |
| `experimental.text.complete` | `src/plugin/opencode-plugin.ts:232-244` | **ACTIVE (experimental)** | Calls `createTextCompleteHandler()` for per-turn journaling |
| `experimental.chat.messages.transform` | `src/plugin/opencode-plugin.ts:245` | **ACTIVE (experimental)** | Delegates to `messagesTransform` adapter |
| `experimental.session.compacting` | `src/plugin/opencode-plugin.ts:246-249` | **ACTIVE (experimental)** | Runs both `compactionHandler` and `compactionJournalHandler` |
| `experimental.chat.system.transform` | `src/plugin/opencode-plugin.ts:119-121` | **ACTIVE (experimental)** | Delegates to `transformHandler` for system prompt injection |
| `tool` (tool registration) | `src/plugin/opencode-plugin.ts:122-135` | **ACTIVE** | Registers 12 tools as object map |

**Total hooks registered: 12** (11 hook handlers + 1 tool registration block)

## Session Lifecycle

### How Sessions Are Created

**Entry point:** `event` hook → `event-handler.ts:187-238`

When OpenCode emits `session.created`:
1. `event-handler.ts:187` checks `event.type === 'session.created'`
2. `event-handler.ts:191-206` checks for subagent sessions via `parentSessionId` — **subagents skip file creation** and only link to parent
3. `event-handler.ts:208-213` calls `initSession()` from `consolidated-writer.ts:235-274` which creates a V3 JSON file at `.hivemind/sessions/journey-events/{truncatedId}.json`
4. `event-handler.ts:216-228` writes a `session_created` event (but this is a **no-op** — see Critical Finding #1)
5. `event-handler.ts:230-237` links parent/child sessions via `linkSubSession()`

### Session Resume

**UNVERIFIED / NOT HANDLED.** There is no explicit `session.resumed` event handler. The `session.updated` event (`event-handler.ts:270-288`) is the closest match, but it only records a `session_updated` event (also a no-op). Session resumption is implicitly handled by `sessionResolver.resolve()` in hooks that need to find existing sessions.

### Session Fork

**NOT HANDLED.** No `session.fork` event exists in OpenCode's event list (`.sdk-lib/opencode/opencode-plugins.md:126-133`). No code references fork semantics.

### Session Redo/Undo

**NOT HANDLED.** No `session.redo` or `session.undo` events exist in OpenCode. The SDK does provide `session.revert()` and `session.unrevert()` API methods (`.sdk-lib/opencode/opencode-sdk.md:207-208`), but these are client-side operations, not events.

### Session Delete

**HANDLED.** `event-handler.ts:337-356` handles `session.deleted` by writing a `session_deleted` event and updating status to `'abandoned'` (mapped to `'errored'` in V3).

### Session Idle

**HANDLED.** `event-handler.ts:381-425` handles `session.idle` by:
1. Fetching session data via SDK client (`client.session.get()`, `client.session.messages()`)
2. Resolving existing session
3. Writing `session_idle` event (no-op in V3)

### Session Error

**HANDLED.** `event-handler.ts:290-335` handles `session.error` by writing events, diagnostics, and appending to error log.

## Runtime Interception Points

### Event Interception (`src/hooks/event-handler.ts`)

**File:** `src/hooks/event-handler.ts` (493 lines)

Intercepts these OpenCode events:
| Event Type | Handler Lines | Action |
|-----------|--------------|--------|
| `session.created` | 187-238 | Init consolidated session, link parent/child |
| `agent.created` | 240-268 | Record in parent session (subagents don't get own files) |
| `session.updated` | 270-288 | Record update event |
| `session.error` | 290-335 | Record error event + diagnostic + error log |
| `session.deleted` | 337-356 | Record delete event, mark abandoned |
| `session.diff` | 358-378 | Record diff event |
| `session.idle` | 381-425 | Fetch session data, record idle event |
| `session.compacted` | 449-458 | Create recovery checkpoint |

**Known event types list** at `event-handler.ts:104-121` includes 16 types. Unknown types are silently accepted (no error thrown).

### Tool Execution Interception (`src/hooks/tool-execution-handler.ts`)

**File:** `src/hooks/tool-execution-handler.ts` (85 lines)

Wired via `tool.execute.after` hook (`opencode-plugin.ts:226-231`):
1. Resolves semantic session ID
2. Writes `tool_invocation` event (no-op in V3)
3. Increments `toolCallCount` counter (WORKS — `incrementCounter` is not a no-op)
4. Appends to markdown journal file

### Compaction Interception (`src/hooks/compaction-handler.ts`)

**File:** `src/hooks/compaction-handler.ts` (159 lines)

Two handlers exist:
- `createCompactionJournalHandler()` — factory used by plugin (`opencode-plugin.ts:248`)
- `handleCompaction()` — standalone handler (NOT wired to plugin)

The compaction adapter (`src/plugin/compaction-adapter.ts:23-45`) injects HiveMind context into the compaction prompt. Both the adapter and journal handler run on `experimental.session.compacting`.

### Text Complete Interception (`src/hooks/text-complete-handler.ts`)

**File:** `src/hooks/text-complete-handler.ts` (219 lines)

Primary per-turn journal writer. Two handlers:
- `createTextCompleteHandler()` — factory used by plugin (`opencode-plugin.ts:240`)
- `handleTextComplete()` — standalone handler (NOT wired to plugin)

The factory version uses in-memory caches (`sessionCache`, `turnCounter`) for performance. Writes:
1. Turn entry via `addTurn()` (WORKS)
2. `assistant_output` event (no-op in V3)
3. `assistantOutputCount` counter (WORKS)
4. Diagnostic entry (no-op in V3)
5. Session status update to `'active'` (WORKS)

### Session Idle Handler

**File does NOT exist.** `src/hooks/session-idle-handler.ts` was requested but does not exist. Session idle handling is embedded directly in `event-handler.ts:381-425` and exported as `handleSessionIdleEvent()` at `event-handler.ts:469-493`.

## OpenCode SDK Coverage

### What OpenCode Supports (from `.sdk-lib/opencode/opencode-plugins.md`)

| Hook Category | Available Hooks |
|--------------|----------------|
| Session Events | `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated` |
| Tool Events | `tool.execute.before`, `tool.execute.after` |
| Message Events | `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated` |
| Command Events | `command.executed` |
| Permission Events | `permission.asked`, `permission.replied` |
| File Events | `file.edited`, `file.watcher.updated` |
| Shell Events | `shell.env` |
| TUI Events | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
| LSP Events | `lsp.client.diagnostics`, `lsp.updated` |
| Server Events | `server.connected` |
| Todo Events | `todo.updated` |
| Installation Events | `installation.updated` |

### What HiveMind Uses vs What's Available

| Hook | OpenCode Supports? | HiveMind Uses? | Gap |
|------|-------------------|----------------|-----|
| `event` | YES | YES | — |
| `chat.message` | NO (custom) | YES | Custom hook — may not fire |
| `permission.ask` | YES (`permission.asked`) | YES | Name mismatch — `permission.ask` vs `permission.asked` |
| `tool.execute.before` | YES | YES | — |
| `tool.execute.after` | YES | YES | — |
| `shell.env` | YES | YES | — |
| `command.execute.before` | NO (`command.executed` exists) | YES | Name mismatch — `command.execute.before` vs `command.executed` |
| `experimental.text.complete` | NO | YES | Custom/experimental |
| `experimental.chat.messages.transform` | NO | YES | Custom/experimental |
| `experimental.session.compacting` | YES | YES | — |
| `experimental.chat.system.transform` | NO | YES | Custom/experimental |
| `tool` (registration) | YES | YES | — |

### Critical Gaps

1. **`chat.message` hook** — Not listed in OpenCode's official event list. May be an internal/custom hook.
2. **`permission.ask` vs `permission.asked`** — OpenCode docs say `permission.asked` but plugin uses `permission.ask`.
3. **`command.execute.before` vs `command.executed`** — OpenCode docs say `command.executed` but plugin uses `command.execute.before`.
4. **No `message.*` event hooks used** — OpenCode provides `message.part.updated`, `message.removed`, etc. but HiveMind doesn't subscribe to these.
5. **No `file.edited` hook used** — Could be useful for tracking file mutations.
6. **No `tui.*` hooks used** — TUI events are available but not intercepted.

## Tool Registration Audit

### Tools Registered in Plugin (`opencode-plugin.ts:122-135`)

| # | Tool Name | Factory | Source File |
|---|-----------|---------|-------------|
| 1 | `hivemind_runtime_status` | `createHivemindRuntimeStatusTool()` | `src/tools/runtime/tools.ts` |
| 2 | `hivemind_runtime_command` | `createHivemindRuntimeCommandTool()` | `src/tools/runtime/tools.ts` |
| 3 | `hivemind_agent_work_create_contract` | `createAgentWorkCreateContractTool()` | `src/features/agent-work-contract/tools/index.js` |
| 4 | `hivemind_agent_work_export_contract` | `createAgentWorkExportContractTool()` | `src/features/agent-work-contract/tools/index.js` |
| 5 | `hivemind_doc` | `createHivemindDocTool()` | `src/tools/doc/tools.ts` |
| 6 | `hivemind_task` | `createTaskTool()` | `src/tools/task/tools.ts` |
| 7 | `hivemind_trajectory` | `createTrajectoryTool()` | `src/tools/trajectory/tools.ts` |
| 8 | `hivemind_handoff` | `createHivemindHandoffTool()` | `src/tools/handoff/tools.ts` |
| 9 | `hivemind_journal` | `createHivemindJournalTool()` | `src/tools/hivemind-journal.ts` |
| 10 | `hivemind_hm_init` | `createHivemindHmInitTool()` | `src/tools/hivefiver-init/tools.ts` |
| 11 | `hivemind_hm_doctor` | `createHivemindHmDoctorTool()` | `src/tools/hivefiver-doctor/tools.ts` |
| 12 | `hivemind_hm_setting` | `createHivemindHmSettingTool()` | `src/tools/hivefiver-setting/tools.ts` |

**Total registered: 12 tools**

### Tool Catalog (`src/tools/index.ts:28-137`)

The `agentToolCatalog` array lists **12 entries** matching the registered tools. Each entry includes contract file, host event, workflow phase, purpose classes, state authority, and pressure contract.

### Unregistered Tools

| Tool | Exported From | Registered? | Status |
|------|--------------|-------------|--------|
| `classify-intent-tool` | `src/features/agent-work-contract/tools/classify-intent-tool.js` | **NO** | Exported from barrel but NOT in plugin tool map |

## Dead Code & Zombies

### Confirmed Dead Code

| Item | Location | Evidence |
|------|----------|----------|
| `dashboard-v2/` | `src/dashboard-v2/` | Only contains `package-lock.json`. No imports from `src/`. Directory is empty stub. |
| `handleCompaction()` standalone | `src/hooks/compaction-handler.ts:109-159` | Exported but never imported by plugin. Only `createCompactionJournalHandler()` is used. |
| `handleTextComplete()` standalone | `src/hooks/text-complete-handler.ts:171-219` | Exported but never imported by plugin. Only `createTextCompleteHandler()` is used. |
| `handleSessionIdleEvent()` standalone | `src/hooks/event-handler.ts:469-493` | Exported but never imported by plugin. Idle handling is inline in `createEventHandler()`. |
| `workflows/` | Root directory | ALL 22 YAML files deleted (confirmed by `git status`). Disconnected from build. |
| `conductor/` | Root directory | ALL files deleted. Disconnected from build. |
| `.planning/` | Root directory | ALL files deleted. Disconnected from build. |
| `addEvent()` V3 | `src/features/event-tracker/consolidated-writer.ts:325-331` | **No-op stub.** Comment: "V3 does not store events in-session; events go to separate files. Kept as no-op for API compatibility." |
| `addDiagnostic()` V3 | `src/features/event-tracker/consolidated-writer.ts:342-348` | **No-op stub.** Comment: "V3 does not store diagnostics in-session. Kept as no-op for API compatibility." |

### Archive Contents

`src/archive/schema-kernel/` contains 5 files that re-export legacy schema types:
- `shared.ts`
- `lifecycle-records.ts`
- `orchestration-records.ts`
- `evidence-records.ts`
- `index.ts` (barrel re-export)

These are **re-exports for backward compatibility**, not dead code. They provide schema types for the schema-kernel layer.

### Suspicious Patterns

| Pattern | Location | Concern |
|---------|----------|---------|
| `doc-surface-router` | `src/intelligence/doc/index.ts:1` | Exported from barrel. Used by `hivemind_doc` tool chain. Not dead, but narrow usage. |
| `classify-intent-tool` | `src/features/agent-work-contract/tools/index.ts:15` | Exported from barrel but NOT registered as a plugin tool. May be intended for internal use only. |
| `chat.message` hook name | `src/plugin/opencode-plugin.ts:136` | Not in OpenCode's official hook list. May silently fail. |
| `permission.ask` hook name | `src/plugin/opencode-plugin.ts:154` | OpenCode docs say `permission.asked`. Name mismatch may cause silent failure. |
| `command.execute.before` hook name | `src/plugin/opencode-plugin.ts:185` | OpenCode docs say `command.executed`. Name mismatch may cause silent failure. |

## Verified Facts

1. **Plugin entry point** is `src/plugin/opencode-plugin.ts` (257 lines) exporting `HiveMindPlugin` as the default export.
2. **12 tools** are registered in the plugin's `tool` object map (`opencode-plugin.ts:122-135`).
3. **AGENTS.md claims 7 custom tools** but the actual count is 12 — the document is stale.
4. **`addEvent()` and `addDiagnostic()` are no-ops** in V3 (`consolidated-writer.ts:325-348`). All event/diagnostic writes from hooks silently do nothing.
5. **`incrementCounter()` and `addTurn()` still work** — they modify the session JSON file directly.
6. **Session lifecycle handles:** created, updated, error, deleted, diff, idle, compacted. Does NOT handle: fork, resume, redo, undo (these don't exist as OpenCode events).
7. **Subagent sessions don't get their own files** — they're linked to parent sessions only (`event-handler.ts:191-206`).
8. **`dashboard-v2/` is dead** — only contains `package-lock.json`, no source files, no imports.
9. **`workflows/`, `conductor/`, `.planning/` are all deleted** — confirmed by git status showing `D` prefix.
10. **Hook name mismatches exist** — `permission.ask` vs `permission.asked`, `command.execute.before` vs `command.executed`. These may be OpenCode internal names not documented, or they may silently fail.
11. **`session.idle` handler fetches session data** via SDK client before writing (`event-handler.ts:391-399`).
12. **Compaction creates recovery checkpoints** when `workflowId` is present (`event-handler.ts:449-458`).
13. **`shell.env` injects 4 env vars:** `HIVEMIND_RUNTIME_ATTACHED`, `HIVEMIND_ATTACHMENT_MODE`, `HIVEMIND_ACTIVE_TRAJECTORY`, `HIVEMIND_ACTIVE_WORKFLOW` (`opencode-plugin.ts:178-184`).
14. **`chat.message` hook resets turn snapshot** after handling (`opencode-plugin.ts:142`).
15. **`transform-handler.ts` stores injection payload** with `purposeClass: 'system'` which is NOT a valid PurposeClass value (valid values are defined in `types.ts`).

## Open Questions

1. **Do `permission.ask`, `command.execute.before`, and `chat.message` hooks actually fire?** They don't match OpenCode's documented hook names. This needs runtime verification.
2. **Where do V3 events actually go?** `addEvent()` is a no-op. The comment says "events go to separate files" but no separate file writer is called. This is a data loss gap.
3. **Is `classify-intent-tool` intentionally unregistered?** It's exported from the barrel but not wired into the plugin. May be dead code or intended for future use.
4. **What is the `experimental.chat.system.transform` hook?** It's not in OpenCode's documentation. Does it fire?
5. **Does `handleChatMessage()` work correctly?** It uses `resolveOrCreate()` with hardcoded `lineage: 'hiveminder'` and `purposeClass: 'implementation'`, ignoring the actual agent/purpose from the session.
6. **Are there any consumers of the markdown journal files?** Both JSON and markdown writers run in parallel. Is the markdown output consumed by anything?
7. **What is the `nlFirstDispatchKeys` Set for?** It's created at `opencode-plugin.ts:97` and passed to `messagesTransform` but never populated or read in the visible code.
