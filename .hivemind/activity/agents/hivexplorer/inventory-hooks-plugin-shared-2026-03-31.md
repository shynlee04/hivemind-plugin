---
date: 2026-03-31
agent: hivexplorer
scope: src/hooks/, src/plugin/, src/shared/
git_commit: 7da1d535
---

# Hooks + Plugin + Shared Inventory — 2026-03-31

**Scope:** `src/hooks/`, `src/plugin/`, `src/shared/` — read-only investigation
**Git commit:** `7da1d535`
**Date:** 2026-03-31

---

## Hooks

| File | LOC | Event Subscribed | Action | Wired? | Imports From |
|------|-----|-----------------|--------|--------|-------------|
| `event-handler.ts` | 493 | `event` (OpenCode lifecycle events: session.created, session.updated, session.error, session.deleted, session.diff, session.idle, session.compacted, agent.created) | Bridges runtime events into trajectory ledger; creates/updates consolidated session files; records trajectory events; creates recovery checkpoints on compaction | YES — `opencode-plugin.ts:95,116-118` | `core/trajectory/`, `features/agent-work-contract/`, `shared/runtime-attachment.js`, `recovery/`, `features/event-tracker/`, `features/session-journal/`, `./sdk-context.js` |
| `transform-handler.ts` | 46 | `experimental.chat.system.transform` | Captures injection payload from system.transform hook; stores in injection-store for later diagnostic logging | YES — `opencode-plugin.ts:119-121` | `./plugin/injection-store.js` |
| `tool-execution-handler.ts` | 85 | `tool.execute.after` (standalone handler) | Writes tool_invocation events to consolidated session; increments tool call counter; appends to markdown session log | YES — `opencode-plugin.ts:227` | `features/event-tracker/consolidated-writer.js`, `features/event-tracker/markdown-writer.js`, `features/session-journal/session-resolver.js` |
| `text-complete-handler.ts` | 219 | `experimental.text.complete` | Primary per-turn journal writer; captures assistant output; resolves/creates consolidated session; writes turns, events, diagnostics; updates session status | YES — `opencode-plugin.ts:232-244` | `features/event-tracker/types.js`, `./plugin/injection-store.js`, `features/event-tracker/consolidated-writer.js`, `features/event-tracker/markdown-writer.js`, `features/session-journal/session-resolver.js` |
| `compaction-handler.ts` | 159 | `experimental.session.compacting` | Writes compaction events to consolidated session; extracts agent from injection payload; increments compaction counter; appends to markdown | YES — via `./plugin/compaction-adapter.ts` wired in `opencode-plugin.ts:246-249` | `features/event-tracker/consolidated-writer.js`, `features/event-tracker/markdown-writer.js`, `features/session-journal/session-resolver.js`, `./plugin/injection-store.js` |
| `chat-message-handler.ts` | 89 | `chat.message` | Captures user messages in session journal; creates/updates consolidated session with user message as turn entry | YES — `opencode-plugin.ts:136-152` | `features/event-tracker/consolidated-writer.js`, `features/event-tracker/markdown-writer.js`, `features/session-journal/session-resolver.js`, `./plugin/injection-store.js` |
| `soft-governance.ts` | 52 | N/A (utility, not a hook) | Shows governance toasts via SDK `client.tui.showToast()` with per-category throttling (5s cooldown) | YES — used in `opencode-plugin.ts:147-151,166-169` | `./sdk-context.js` |
| `sdk-context.ts` | 98 | N/A (SDK context provider) | Initializes/resets module-level SDK references (client, shell, server URL, project); provides `getClient()`, `withClient()`, `getServerBaseUrl()` | YES — `opencode-plugin.ts:94` | `@opencode-ai/plugin` (PluginInput type) |
| `start-work/start-work-router.ts` | 189 | N/A (routing logic, not a hook) | Resolves authoritative start-work decision: classifies purpose, lineage, readiness, trajectory continuity; produces routing decision with pressure/safety signals | YES — imported by `plugin/messages-transform-adapter.ts:23` | `core/trajectory/`, `core/workflow-management/`, `control-plane/`, `shared/opencode-knowledge.js`, `shared/pressure-contract.js`, `commands/slash-command/`, `features/session-entry/`, `./start-work-router-helpers.js` |
| `start-work/start-work-router-helpers.ts` | 155 | N/A (helper functions) | Risk level resolution, recommended command mapping, traversal outcome, route disposition, pressure signals, auto-route decision | NO — only imported by `start-work-router.ts` | `core/trajectory/`, `features/session-entry/start-work-types.js`, `features/session-entry/lineage-router.js`, `shared/pressure-contract.js` |
| `start-work/index.ts` | 1 | N/A (barrel) | Re-exports `start-work-router.js` | YES — via `hooks/index.ts:7` | `./start-work-router.js` |
| `workflow-integration/workflow-continuity.ts` | 17 | N/A (utility) | Builds workflow integration state (summary + nextSteps) from workflow/handoff records | NO — not imported outside hooks barrel | `core/workflow-management/index.js` |
| `workflow-integration/index.ts` | 5 | N/A (barrel) | Re-exports `workflow-continuity.js` | YES — via `hooks/index.ts:6` | `./workflow-continuity.js` |
| `runtime-loader/tool-governance.ts` | 38 | N/A (utility) | Defines `HIVEMIND_MANAGED_TOOLS` set (12 tools); provides `isHivemindManagedTool()` and `recordToolEvent()` for trajectory tracking | YES — `opencode-plugin.ts:24,158,174,228` | `core/trajectory/index.js`, `shared/runtime-attachment.js` |
| `runtime-loader/runtime-stage.ts` | 20 | N/A (utility) | Resolves runtime load stage (`initial`/`interdependent`/`mid-session`) based on workflow/handoff state | NO — not imported outside hooks barrel | None (pure types + function) |
| `runtime-loader/index.ts` | 6 | N/A (barrel) | Re-exports `runtime-stage.js` and `tool-governance.js` | YES — via `hooks/index.ts:5` and `opencode-plugin.ts:24` | `./runtime-stage.js`, `./tool-governance.js` |
| `auto-slash-command/auto-slash-command.ts` | 65 | N/A (utility) | Creates auto slash command plan from start-work decision; resolves command binding (control-plane vs workflow-command) | NO — not imported outside hooks barrel | `features/session-entry/start-work-types.js`, `control-plane/index.js`, `commands/slash-command/index.js`, `./auto-slash-command-types.js` |
| `auto-slash-command/auto-slash-command-types.ts` | 17 | N/A (types) | Defines `CommandBinding` and `AutoSlashCommandPlan` interfaces | YES — via `hooks/index.ts:8` and imported by `auto-slash-command.ts` | `control-plane/index.js`, `features/session-entry/start-work-types.js`, `commands/slash-command/index.js` |
| `auto-slash-command/index.ts` | 2 | N/A (barrel) | Re-exports types and command logic | YES — via `hooks/index.ts:8` | `./auto-slash-command-types.js`, `./auto-slash-command.js` |
| `hooks/index.ts` | 14 | N/A (barrel) | Barrel export for all hook submodules | YES — `opencode-plugin.ts:47` | All hook submodules |

### Hook Wiring Summary (in `opencode-plugin.ts`)

| Hook Key | Handler | Line |
|----------|---------|------|
| `event` | `createEventHandler(directory)` | 116-118 |
| `experimental.chat.system.transform` | `createTransformHandler({ directory })` | 119-121 |
| `chat.message` | `handleChatMessage(...)` | 136-152 |
| `permission.ask` | Inline (auto-allow managed tools + toast) | 154-171 |
| `tool.execute.before` | Inline (`recordToolEvent`) | 172-177 |
| `shell.env` | Inline (inject env vars) | 178-184 |
| `command.execute.before` | Inline (synthetic part injection) | 185-225 |
| `tool.execute.after` | `handleToolExecution(...)` + `recordToolEvent` | 226-231 |
| `experimental.text.complete` | `createTextCompleteHandler({ directory })` | 232-244 |
| `experimental.chat.messages.transform` | `createMessagesTransformHandler(...)` | 245 |
| `experimental.session.compacting` | `createCompactionHandler(...)` + `createCompactionJournalHandler(...)` | 246-249 |

---

## Plugin Assembly

### opencode-plugin.ts

**File:** `src/plugin/opencode-plugin.ts` — 257 LOC

**Tools registered (13):**
1. `hivemind_runtime_status` — `src/tools/runtime/index.js` (line 123)
2. `hivemind_runtime_command` — `src/tools/runtime/index.js` (line 124)
3. `hivemind_agent_work_create_contract` — `src/features/agent-work-contract/tools/index.js` (line 125)
4. `hivemind_agent_work_export_contract` — `src/features/agent-work-contract/tools/index.js` (line 126)
5. `hivemind_doc` — `src/tools/doc/index.js` (line 127)
6. `hivemind_task` — `src/tools/task/index.js` (line 128)
7. `hivemind_trajectory` — `src/tools/trajectory/index.js` (line 129)
8. `hivemind_handoff` — `src/tools/handoff/index.js` (line 130)
9. `hivemind_journal` — `src/tools/hivemind-journal.js` (line 131)
10. `hivemind_hm_init` — `src/tools/hivefiver-init/index.js` (line 132)
11. `hivemind_hm_doctor` — `src/tools/hivefiver-doctor/index.js` (line 133)
12. `hivemind_hm_setting` — `src/tools/hivefiver-setting/index.js` (line 134)

**Hooks wired (11):**
1. `event` — line 116
2. `experimental.chat.system.transform` — line 119
3. `chat.message` — line 136
4. `permission.ask` — line 154
5. `tool.execute.before` — line 172
6. `shell.env` — line 178
7. `command.execute.before` — line 185
8. `tool.execute.after` — line 226
9. `experimental.text.complete` — line 232
10. `experimental.chat.messages.transform` — line 245
11. `experimental.session.compacting` — line 246

**Features imported:**
- `features/agent-work-contract/tools/` — contract create/export tools (lines 21-23)

**Side effects on init:**
- `ensureAgentProjection(directory)` — creates `.opencode/agents/hivefiver.md` from bundled source if missing (lines 70-82, 92)
- `initSkillInjection(directory)` — loads skill injection config (line 93)
- `initSdkContext(input)` — initializes SDK context refs (line 94)
- `process.on('exit', resetSdkContext)` — cleanup on exit (lines 255-257)

### Other Plugin Files

| File | LOC | Purpose |
|------|-----|---------|
| `opencode-plugin.ts` | 257 | Main plugin entry — assembles tools, hooks, features |
| `index.ts` | 1 | Barrel — re-exports `HiveMindPlugin` |
| `messages-transform-adapter.ts` | 179 | `experimental.chat.messages.transform` hook adapter — injects HiveMind context, turn hierarchy, skill bundles, route hints into user messages |
| `compaction-adapter.ts` | 46 | `experimental.session.compacting` hook adapter — injects HiveMind context into compaction prompt |
| `context-renderer.ts` | 51 | Barrel — re-exports all context renderer submodules |
| `context-renderer.types.ts` | 168 | Type definitions for `HivemindContextPacket` (44 fields via 7 intersection types), `TurnHierarchyContext`, `ToolPrecedenceChain`, `WorkflowStyle` |
| `context-renderer.constants.ts` | 111 | Context key constants (`HIVEMIND_BASE_CONTEXT_KEYS`, `HIVEMIND_AGENT_WORK_CONTEXT_KEYS`), field order, collision validation |
| `context-renderer.builder.ts` | 98 | `createHivemindContextPacket()` — maps snapshot + routing state into packet fields; `resolveAgentWorkContextFields()` — extracts from contract schema |
| `context-renderer.renderers.ts` | 107 | `renderHivemindContext()`, `renderTurnHierarchy()`, `renderToolPrecedence()` — serialize packets to XML-like blocks |
| `context-renderer.compaction-renderers.ts` | 240 | Workflow-specific compaction renderers: `detectWorkflowStyle()`, `renderTDDCompaction()`, `renderBMADCompaction()`, `renderResearchCompaction()`, `renderDefaultCompaction()` |
| `skill-exposure-map.ts` | 161 | Selective skill bundle resolution per agent/purpose/state; session role classification (`orchestrate`/`specialist`/`standalone`) |
| `skill-focus-renderer.ts` | 53 | Renders `<available_skills>` block for synthetic part injection |
| `runtime-snapshot.ts` | 35 | `createTurnSnapshotLoader()` — lazy cached snapshot reader per turn |
| `runtime-prompt.ts` | 16 | `transformRuntimePrompt()` — delegates to `compilePromptPacket()` |
| `system-transform.ts` | 8 | `createSystemTransform()` — delegates to `transformRuntimePrompt()`, returns systemPacket |
| `messages-transform.ts` | 8 | `createMessagesTransform()` — delegates to `transformRuntimePrompt()`, returns messagePacket |
| `synthetic-parts.ts` | 44 | `createSyntheticPart()`, `getMessageText()`, `findLastUserMessage()` — SDK Part construction helpers |
| `injection-store.ts` | 35 | In-memory Map store for injection payload (written by messages-transform, read by text.complete) |
| `input-helpers.ts` | 66 | `createStartWorkInput()` — builds StartWorkInput from snapshot; `resolveCompactionAgentWorkPacket()` — fetches latest contract |
| `route-hint.ts` | 23 | `renderRouteHint()` — minimal route reminder XML block |
| `evidence-reporter.ts` | 245 | Operator-facing evidence lane status reporting; formats results by lane (LOCAL/INTEG/LIVE) |
| `skill-injection-init.test.ts` | — | Test file (not counted in production) |
| `context-renderer.test.ts` | — | Test file (not counted in production) |

---

## Shared Utilities

| File | LOC | Purpose (one sentence) | Used By (layers) |
|------|-----|----------------------|-----------------|
| `index.ts` | 17 | Barrel export for 12 shared modules | All layers |
| `paths.ts` | 72 | Centralizes `.hivemind/` path constants and builders (`getEffectivePaths()`) | features/runtime-entry, governance, sdk-supervisor |
| `tool-response.ts` | 33 | Standard `ToolResponse<T>` type + `success()`/`error()`/`pending()` factories + type guards | tools/ (all 6 tool modules) |
| `tool-helpers.ts` | 44 | `parseList()`, `parseJsonArray()`, `renderToolResult()` — shared tool utilities | tools/ (all), features/workflow, features/trajectory |
| `logging.ts` | 56 | Structured logging with `[HiveMind]` prefix; dual output to console + SDK `client.app.log()` | hooks/ (indirect via sdk-context) |
| `runtime-attachment.ts` | 1 | Re-export from `features/runtime-entry/attachment.js` | hooks/, plugin/, features/ (heavy consumer) |
| `pressure-contract.ts` | 287 | 10 `RuntimePressureContract` definitions (steady-state through handoff-validation) with safety levels, failure behaviors, evidence specs | hooks/start-work, tools/, features/session-entry, recovery/ |
| `opencode-knowledge.ts` | 138 | Resolves OpenCode knowledge surfaces (commands-are-prompts, plugins-are-runtime, non-interactive-shell) based on purpose class | hooks/start-work, features/session-entry |
| `opencode-skill-registry.ts` | 147 | Scans `.opencode/skills/` and `~/.config/opencode/skills/` for SKILL.md files; parses frontmatter; builds registry | shared/skill-injection-loader |
| `opencode-agent-registry.ts` | 146 | Loads 9 canonical agent `.deprecated.md` files; validates slash command agent bindings | features/runtime-entry/command |
| `tiered-injection.ts` | 236 | Two-tier skill injection: Tier 1 (core init) + Tier 2 (task-conditional rules for tdd/research/debug/refactor/implementation/etc.) | plugin/skill-exposure-map |
| `skill-injection-loader.ts` | 229 | Loads `config/skill-injection.json` with defaults; validates skill names against on-disk registry | plugin/skill-exposure-map |
| `lifecycle-spine.ts` | 68 | Lifecycle state types for entry-kernel, runtime-invocation, turn-output phases | features/runtime-entry, shared/entry-kernel-state |
| `entry-kernel-state.ts` | 199 | Entry kernel state machine (uninitialized → repair-required → qa-pending → ready/blocked); load/save/detect | features/runtime-entry (snapshot-loader, init, harness, doctor) |
| `bootstrap-profile.ts` | 105 | Language normalization (12 language aliases), profile creation with defaults | features/session-entry (profile-resolution, language-resolution, intake) |
| `config-groups.ts` | 191 | 4 config groups (language/expertise/governance/operation-mode) with Zod validation | tools/hivefiver-setting |
| `evidence-lane.ts` | 77 | `EvidenceLane` enum (LOCAL_DIAGNOSTICS, INTEGRATION_CHECKS, LIVE_OFFICIAL_INTERFACE_PROOF) + result factories | plugin/evidence-reporter |
| `keyword-matcher.ts` | 61 | Regex-based keyword matching with word boundaries and special char escaping | features/session-entry/purpose-classifier |
| `errors.ts` | 162 | Error hierarchy: `RuntimeError` → `ValidationError`, `NotFoundError`, `SchemaMigrationError`, `CorruptionError`, `DelegationError`, `SyncError` + `Result<T,E>` type | (no direct importers found in hooks/plugin/shared scope) |
| `intake-record.ts` | 18 | Barrel — re-exports decomposed intake-record submodules | (barrel only) |
| `intake-record.types.ts` | 133 | `IntakeRecord` composed type (Core + Lineage + Workflow + Profile via intersection) | (types only, used by factory/validation) |
| `intake-record.factory.ts` | 65 | `createIntakeRecord()` and `createOrphanedIntakeRecord()` factories | (used internally by intake-record barrel) |
| `intake-record.validation.ts` | 122 | `validateIntakeRecord()` — validates all fields against allowed enums | (used internally by serialization) |
| `intake-record.serialization.ts` | 30 | `serializeIntakeRecord()` / `deserializeIntakeRecord()` with validation | (used internally by intake-record barrel) |
| `contracts/index.ts` | 2 | Barrel for runtime-events and runtime-status | tools/runtime, features/runtime-observability |
| `contracts/runtime-events.ts` | 10 | `RuntimeRecentEvent` Zod schema | contracts/runtime-status, sdk-supervisor |
| `contracts/runtime-status.ts` | 282 | Comprehensive Zod schemas for runtime status, identity, readiness signals, workflow gates; builder functions | tools/runtime, features/runtime-entry, features/runtime-observability, sdk-supervisor |

---

## Dependency Summary

| File | Imports From | Layer Violation? |
|------|-------------|-----------------|
| `shared/logging.ts` | `hooks/sdk-context.js` | ⚠️ Shared → Hooks (reverse dependency; logging depends on hook-layer SDK context) |
| `plugin/messages-transform-adapter.ts` | `hooks/start-work/start-work-router.ts` | ⚠️ Plugin → Hooks (plugin depends on hook-layer routing) |
| `plugin/input-helpers.ts` | `features/agent-work-contract/hooks/index.js` | ⚠️ Plugin → Feature hooks (cross-layer import) |
| `hooks/event-handler.ts` | `features/agent-work-contract/hooks/index.js` | OK — hooks consuming feature hooks is expected |
| `hooks/runtime-loader/tool-governance.ts` | `core/trajectory/`, `shared/runtime-attachment.js` | OK — hooks reading core/shared |
| `hooks/start-work/start-work-router.ts` | `core/`, `control-plane/`, `commands/`, `features/`, `shared/` | OK — router aggregates from all layers |
| `plugin/evidence-reporter.ts` | `shared/evidence-lane.js` | OK — plugin reading shared |
| `plugin/skill-exposure-map.ts` | `shared/skill-injection-loader.js`, `shared/tiered-injection.js` | OK — plugin reading shared |

### Notable Cross-Layer Dependencies

1. **`shared/logging.ts` → `hooks/sdk-context.ts`** (line 8): Shared layer depends on hooks layer. This is a reverse dependency — shared should be the lowest layer.
2. **`plugin/messages-transform-adapter.ts` → `hooks/start-work/start-work-router.ts`** (line 23): Plugin directly imports from hooks. The router is a hook-layer module but is used as routing logic by the plugin.
3. **`plugin/input-helpers.ts` → `features/agent-work-contract/hooks/`** (line 14): Plugin imports from feature hooks.

---

## Dead Code

### Unused Hook Exports

| Export | File | Evidence |
|--------|------|----------|
| `handleSessionIdleEvent()` | `event-handler.ts:469-493` | No importers found outside the file; `createEventHandler()` handles session.idle inline (line 381-425) |
| `handleTextComplete()` | `text-complete-handler.ts:171-219` | Standalone handler; only `createTextCompleteHandler()` factory is wired in plugin (line 240) |
| `handleCompaction()` | `compaction-handler.ts:109-159` | Standalone handler; only `createCompactionJournalHandler()` is wired in plugin (line 248) |
| `handleToolExecution()` | `tool-execution-handler.ts:31-85` | Used in plugin line 227 — NOT dead |
| `handleChatMessage()` | `chat-message-handler.ts:40-89` | Used in plugin line 137 — NOT dead |
| `resolveRuntimeLoadStage()` | `runtime-loader/runtime-stage.ts:10-19` | No importers found outside hooks barrel |
| `buildWorkflowIntegrationState()` | `workflow-integration/workflow-continuity.ts:7-16` | No importers found outside hooks barrel |
| `createAutoSlashCommandPlan()` | `auto-slash-command/auto-slash-command.ts:60-64` | No importers found outside hooks barrel |

### Unused Shared Exports

| Export | File | Evidence |
|--------|------|----------|
| `errors.ts` (all exports) | `shared/errors.ts` | No importers found in hooks/plugin/shared scope; may be used by tools/features |
| `intake-record.*` (all submodules) | `shared/intake-record*.ts` | No direct importers found outside the barrel; may be used by control-plane/features |
| `config-groups.ts` | `shared/config-groups.ts` | Used by `tools/hivefiver-setting/` — NOT dead |

### Plugin Files Not Directly Wired

| File | Status |
|------|--------|
| `system-transform.ts` | Delegated to by `runtime-prompt.ts` chain; not directly imported by plugin |
| `messages-transform.ts` | Delegated to by `runtime-prompt.ts` chain; not directly imported by plugin |
| `runtime-prompt.ts` | Used by `system-transform.ts` and `messages-transform.ts`; not directly imported by plugin |
| `route-hint.ts` | Used by `messages-transform-adapter.ts:14` — NOT dead |

---

## Total Counts

| Metric | Count |
|--------|-------|
| Hook files (non-test) | 19 |
| Hook files (test) | 1 (`event-handler.test.ts`) |
| Plugin files (non-test) | 21 |
| Plugin files (test) | 2 (`context-renderer.test.ts`, `skill-injection-init.test.ts`) |
| Shared files (non-test) | 26 |
| Shared files (test) | 3 (`paths.test.ts`, `config-groups.test.ts`, `tiered-injection.test.ts`, `skill-injection-loader.test.ts`, `skill-registry-path.test.ts`) |
| Hooks wired in plugin | 11 / 11 available hook keys |
| Tools registered | 13 |
| Standalone hook handlers (not wired) | 3 (`handleSessionIdleEvent`, `handleTextComplete`, `handleCompaction`) |
| Barrel/index files | 7 |

### Hook Subscription Map

| OpenCode Hook | Handler | Factory |
|--------------|---------|---------|
| `event` | `createEventHandler()` | `event-handler.ts:172` |
| `experimental.chat.system.transform` | `createTransformHandler()` | `transform-handler.ts:23` |
| `chat.message` | `handleChatMessage()` | `chat-message-handler.ts:40` |
| `permission.ask` | Inline | `opencode-plugin.ts:154` |
| `tool.execute.before` | Inline | `opencode-plugin.ts:172` |
| `shell.env` | Inline | `opencode-plugin.ts:178` |
| `command.execute.before` | Inline | `opencode-plugin.ts:185` |
| `tool.execute.after` | `handleToolExecution()` | `tool-execution-handler.ts:31` |
| `experimental.text.complete` | `createTextCompleteHandler()` | `text-complete-handler.ts:45` |
| `experimental.chat.messages.transform` | `createMessagesTransformHandler()` | `messages-transform-adapter.ts:41` |
| `experimental.session.compacting` | `createCompactionHandler()` + `createCompactionJournalHandler()` | `compaction-adapter.ts:23` + `compaction-handler.ts:34` |
