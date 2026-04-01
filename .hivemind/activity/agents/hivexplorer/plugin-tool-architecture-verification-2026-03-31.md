---
title: "Plugin vs Tool Architecture Verification"
date: 2026-03-31
agent: hivexplorer
pass_id: plugin-tool-architecture-verification
scope: src/plugin/, src/hooks/, src/tools/, src/features/, package.json, opencode.json, agents/, skills/, commands/
git_commit: 85f8cbe7
branch: v2.9.5-detox-dev
---

# Plugin vs Tool Architecture Verification — 2026-03-31

**Scope:** Full plugin architecture, custom tool architecture, Tier 3 user-configurable surfaces, feature classification into 4 groups, CQRS compliance, SDK surface usage.
**Git Commit:** `85f8cbe7` on branch `v2.9.5-detox-dev`
**Date:** 2026-03-31

---

## 1. Plugin Architecture

### What Exists

The plugin is a single assembly module at `src/plugin/opencode-plugin.ts` (257 lines). It exports `HiveMindPlugin: Plugin` — an async factory function that receives `PluginInput` and returns a hooks object.

**Hooks actually wired in `opencode-plugin.ts` (lines 115-250):**

| Hook | Handler | File | Status |
|------|---------|------|--------|
| `event` | `createEventHandler(directory)` | `src/hooks/event-handler.ts` | **Active** — handles session.created, session.updated, session.error, session.deleted, session.diff, session.idle, agent.created, session.compacted |
| `tool` (object) | 12 tools registered inline | `src/plugin/opencode-plugin.ts:122-135` | **Active** — all LLM-facing tools |
| `chat.message` | `handleChatMessage()` | `src/hooks/chat-message-handler.ts` | **Active** — captures user messages in session journal |
| `permission.ask` | inline handler | `src/plugin/opencode-plugin.ts:154-171` | **Active** — auto-allows HiveMind managed tools, shows governance toast for writes |
| `tool.execute.before` | `recordToolEvent()` | `src/hooks/runtime-loader/index.ts` | **Active** — records tool execution intent |
| `tool.execute.after` | `handleToolExecution()` | `src/hooks/tool-execution-handler.ts` | **Active** — writes tool_invocation events |
| `shell.env` | inline handler | `src/plugin/opencode-plugin.ts:178-184` | **Active** — injects HIVEMIND_* env vars |
| `command.execute.before` | inline handler | `src/plugin/opencode-plugin.ts:185-225` | **Active** — injects command context with tool precedence |
| `experimental.text.complete` | `createTextCompleteHandler()` | `src/hooks/text-complete-handler.ts` | **Active** — per-turn journal writer |
| `experimental.chat.messages.transform` | `createMessagesTransformHandler()` | `src/plugin/messages-transform-adapter.ts` | **Active** — injects HiveMind context into messages |
| `experimental.session.compacting` | `createCompactionHandler()` + `createCompactionJournalHandler()` | `src/plugin/compaction-adapter.ts` + `src/hooks/compaction-handler.ts` | **Active** — dual handler for compaction |
| `experimental.chat.system.transform` | `createTransformHandler()` | `src/hooks/transform-handler.ts` | **Active** — captures injection payload |

**Plugin-side adapters (not hooks, but plugin internals):**
- `src/plugin/runtime-snapshot.ts` — turn-scoped snapshot caching
- `src/plugin/skill-exposure-map.ts` — skill bundle resolution per agent/purpose/session-state
- `src/plugin/messages-transform-adapter.ts` — orchestrates message injection with start-work routing
- `src/plugin/compaction-adapter.ts` — compaction context injection
- `src/plugin/synthetic-parts.ts` — creates synthetic message parts with `@opencode-ai/sdk` Part type
- `src/plugin/context-renderer.ts` — renders HiveMind context packets
- `src/plugin/system-transform.ts` — system prompt transformation

### What's Missing

**Of the 17 available hooks documented in `.sdk-lib/opencode/opencode-plugins.md` and AGENTS.md:**

| Hook | Wired? | Notes |
|------|--------|-------|
| `event` | ✅ Yes | Active |
| `chat.message` | ✅ Yes | Active |
| `chat.params` | ❌ No | Available but not wired |
| `chat.headers` | ❌ No | Available but not wired |
| `permission.ask` | ✅ Yes | Active |
| `command.execute.before` | ✅ Yes | Active |
| `tool.execute.before` | ✅ Yes | Active |
| `tool.execute.after` | ✅ Yes | Active |
| `tool.definition` | ❌ No | Available but not wired |
| `shell.env` | ✅ Yes | Active |
| `system.transform` | ✅ Yes (experimental) | Wired as `experimental.chat.system.transform` |
| `messages.transform` | ✅ Yes (experimental) | Wired as `experimental.chat.messages.transform` |
| `session.compacting` | ✅ Yes (experimental) | Wired as `experimental.session.compacting` |
| `config` | ❌ No | Available but not wired |
| `auth` | ❌ No | Available but not wired |
| `text.complete` | ✅ Yes (experimental) | Wired as `experimental.text.complete` |
| `session.compacting` (legacy) | ❌ No | Superseded by experimental |

**12 of 17 hooks wired (71%). 5 hooks unused: `chat.params`, `chat.headers`, `tool.definition`, `config`, `auth`.**

### Evidence

- `src/plugin/opencode-plugin.ts` lines 115-250 — all hook registrations
- `src/hooks/event-handler.ts` lines 172-459 — event handler implementation
- `src/hooks/chat-message-handler.ts` lines 40-89 — chat message handler
- `src/hooks/tool-execution-handler.ts` lines 31-85 — tool execution handler
- `src/hooks/soft-governance.ts` lines 26-45 — governance toast via `client.tui.showToast()`
- `src/hooks/sdk-context.ts` lines 1-98 — SDK context management (clientRef, shellRef, serverUrlRef)
- `.sdk-lib/opencode/opencode-plugins.md` lines 102-144 — full event list
- AGENTS.md "Plugin Hooks (17 Available)" table — hook status table

---

## 2. Custom Tool Architecture

### What Exists

**Tool registration:** `src/plugin/opencode-plugin.ts` lines 122-135 registers 12 tools directly in the plugin's `tool` object. The `src/tools/index.ts` barrel exports are NOT used for runtime registration — they serve as a catalog (`agentToolCatalog` array, lines 28-137).

**All 12 registered tools:**

| Tool Name | Source File | Schema | Context Usage |
|-----------|-------------|--------|---------------|
| `hivemind_runtime_status` | `src/tools/runtime/tools.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent` |
| `hivemind_runtime_command` | `src/tools/runtime/tools.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent` |
| `hivemind_agent_work_create_contract` | `src/features/agent-work-contract/tools/create-contract-tool.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent`, `context.directory`, `context.worktree` |
| `hivemind_agent_work_export_contract` | `src/features/agent-work-contract/tools/export-contract-tool.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent`, `context.directory`, `context.worktree` |
| `hivemind_doc` | `src/tools/doc/tools.ts` | `tool.schema` ✅ | Not directly (uses directory param) |
| `hivemind_task` | `src/tools/task/tools.ts` | `tool.schema` ✅ | `context.sessionID` |
| `hivemind_trajectory` | `src/tools/trajectory/tools.ts` | `tool.schema` ✅ | `context.sessionID` |
| `hivemind_handoff` | `src/tools/handoff/tools.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent` |
| `hivemind_journal` | `src/tools/hivemind-journal.ts` | `tool.schema` ✅ | `context.directory` |
| `hivemind_hm_init` | `src/tools/hivefiver-init/tools.ts` | `tool.schema` ✅ | Not directly (uses directory param) |
| `hivemind_hm_doctor` | `src/tools/hivefiver-doctor/tools.ts` | `tool.schema` ✅ | Not directly (uses directory param) |
| `hivemind_hm_setting` | `src/tools/hivefiver-setting/tools.ts` | `tool.schema` ✅ | `context.sessionID`, `context.agent`, `context.directory` |

**Additional tools in features (not registered in plugin yet):**
- `src/features/agent-work-contract/tools/classify-intent-tool.ts` — uses `tool.schema` ✅, `context.sessionID`, `context.agent`, `context.directory`, `context.worktree`

**Schema compliance:** ALL tools use `tool.schema` (Zod re-export from `@opencode-ai/plugin/tool`). Zero violations found.

**Context usage:** All tools receive `context` via the `execute(args, context)` signature. The most commonly used fields are `context.sessionID` (10 tools), `context.agent` (7 tools), `context.directory` (4 tools), `context.worktree` (3 tools).

**Multi-language tools:** No tools written in other languages. All tools are TypeScript. The SDK docs at `.sdk-lib/opencode/opencode-custom-tools.md` lines 126-157 show Python is possible, but HiveMind does not use this capability.

### What's Missing

- No tools written in Python or other languages (user assumption #2 says "can be in other languages" — capability exists per SDK, but HiveMind doesn't use it)
- The `src/tools/index.ts` barrel exports are NOT the runtime registration mechanism — tools are registered directly in `opencode-plugin.ts`. The barrel serves as a catalog only.
- `classify-intent-tool.ts` exists in features but is NOT registered in the plugin's tool object.

### Evidence

- `src/plugin/opencode-plugin.ts` lines 122-135 — tool registration
- `src/tools/index.ts` lines 1-137 — tool catalog (not runtime registration)
- `src/tools/runtime/tools.ts` lines 8, 47-70 — tool.schema usage
- `src/tools/task/tools.ts` lines 1, 16-24 — tool.schema usage
- `src/tools/trajectory/tools.ts` lines 1, 16-31 — tool.schema usage
- `src/tools/handoff/tools.ts` lines 1, 14-35 — tool.schema usage
- `src/tools/hivemind-journal.ts` lines 17, 68-86 — tool.schema usage
- `.sdk-lib/opencode/opencode-custom-tools.md` lines 126-157 — multi-language tool example

---

## 3. Tier 3 Concepts (User-Configurable)

### What's User-Configurable

**Agents (`agents/` directory — 13 files):**
- `agents/hivefiver.md`, `agents/hiveminder.md`, `agents/hivexplorer.md`, `agents/hivehealer.md`, `agents/hivemaker.md`, `agents/hiveq.md`, `agents/hitea.md`, `agents/hiveplanner.md`, `agents/hiverd.md`, `agents/architect.md`, `agents/code-skeptic.md`, `agents/explore.md`, `agents/general.md`
- These are **bundled with the npm package** (see `package.json` line 31: `"files": [..., "agents", ...]`)
- The plugin auto-projects `hivefiver.md` to `.opencode/agents/hivefiver.md` on first run via `ensureAgentProjection()` in `opencode-plugin.ts` lines 70-82
- **Critical:** The projection function NEVER overwrites existing files (line 74: `if (existsSync(targetPath)) return`). User customizations are preserved.

**Skills (`skills/` directory — 20 packages):**
- 20 skill packages: `hivemind-architecture/`, `hivemind-atomic-commit/`, `hivemind-codemap/`, `hivemind-execution/`, `hivemind-gatekeeping/`, `hivemind-patterns/`, `hivemind-refactor/`, `hivemind-spec-driven/`, `hivemind-synthesis/`, `hivemind-system-debug/`, `use-hivemind-context/`, `use-hivemind-delegation/`, `use-hivemind-git-memory/`, `use-hivemind-ideating/`, `use-hivemind-planning/`, `use-hivemind-research/`, `use-hivemind-skill-authoring/`, `use-hivemind-tdd/`, `use-hivemind/`
- Plus `registry-internal.yaml` for internal skill registry
- Skills are bundled in the npm package (`package.json` line 29)
- Skill injection is managed via `src/plugin/skill-exposure-map.ts` and `src/shared/skill-injection-loader.ts`

**Commands (`commands/` directory — 45 files):**
- 45 markdown command files, but only `hm-*` commands are registered in `command-bundles.ts`
- Commands are bundled in the npm package (`package.json` line 30)
- Command registration happens via `findSlashCommandBundle()` in `src/commands/slash-command/index.js`

**`opencode.json` (project-level config):**
- Contains: model preference, plugin reference, permissions, 10+ provider configs, 20+ MCP server configs
- This is the **consumer's** config, not HiveMind's. HiveMind references it via `plugin: [".opencode/plugins/hivemind-context-governance.ts"]`

### What's Hard-Wired by HiveMind

**HiveMind writes to `.opencode/` in exactly ONE place:**
- `src/plugin/opencode-plugin.ts` lines 70-82: `ensureAgentProjection()` — creates `.opencode/agents/hivefiver.md` ONLY if it doesn't exist
- `src/features/runtime-observability/sync.ts` line 102: `writeFileIfChanged(pluginFile, renderLocalPluginStub(options))` — writes local plugin stub
- `src/tools/hivefiver-setting/tools.ts` line 5: explicitly states "Does NOT write to .opencode/ without user authorization via context.ask()"

**HiveMind does NOT write to `.opencode/` for:**
- Agent definitions (beyond the one-time projection)
- Skill definitions
- Command definitions
- Plugin configuration

**The `.opencode/` write prohibition in AGENTS.md is respected:** All HiveMind state goes to `.hivemind/`, not `.opencode/`.

### Evidence

- `src/plugin/opencode-plugin.ts` lines 70-82 — `ensureAgentProjection()` function
- `package.json` lines 26-36 — bundled files list
- `agents/` directory — 13 agent definition files
- `skills/` directory — 20 skill packages
- `commands/` directory — 45 command files
- `opencode.json` — project-level config with 20+ MCP servers
- `src/tools/hivefiver-setting/tools.ts` line 5 — explicit .opencode/ write protection
- AGENTS.md ".opencode/ Write Prohibition" section

---

## 4. Feature Classification (4 Groups)

| Feature | Group | Evidence |
|---------|-------|----------|
| **Runtime Status Tool** (`hivemind_runtime_status`) | A — Self-sustaining | `src/tools/runtime/tools.ts` — reads state, returns JSON. No hooks, no external libs. |
| **Runtime Command Tool** (`hivemind_runtime_command`) | A — Self-sustaining | `src/tools/runtime/tools.ts` — executes hm-* commands. No hooks needed. |
| **HM Init Tool** (`hivemind_hm_init`) | A — Self-sustaining | `src/tools/hivefiver-init/tools.ts` — bootstrap tool. Self-contained. |
| **HM Doctor Tool** (`hivemind_hm_doctor`) | A — Self-sustaining | `src/tools/hivefiver-doctor/tools.ts` — diagnostics tool. Self-contained. |
| **HM Setting Tool** (`hivemind_hm_setting`) | A — Self-sustaining | `src/tools/hivefiver-setting/tools.ts` — configuration tool. Self-contained. |
| **Doc Intelligence Tool** (`hivemind_doc`) | A — Self-sustaining | `src/tools/doc/tools.ts` — document reading. Self-contained. |
| **Event Handler** (`event` hook) | B — Hook subscription | `src/hooks/event-handler.ts` — subscribes to 8+ event types. Writes to `.hivemind/sessions/`. |
| **Chat Message Handler** (`chat.message` hook) | B — Hook subscription | `src/hooks/chat-message-handler.ts` — captures user messages. Writes session journal. |
| **Tool Execution Handler** (`tool.execute.after` hook) | B — Hook subscription | `src/hooks/tool-execution-handler.ts` — records tool invocations. |
| **Text Complete Handler** (`experimental.text.complete` hook) | B — Hook subscription | `src/hooks/text-complete-handler.ts` — per-turn journal writer. |
| **Messages Transform Handler** (`experimental.chat.messages.transform` hook) | B — Hook subscription | `src/plugin/messages-transform-adapter.ts` — injects context into messages. |
| **Compaction Handler** (`experimental.session.compacting` hook) | B — Hook subscription | `src/plugin/compaction-adapter.ts` + `src/hooks/compaction-handler.ts` — compaction context. |
| **Transform Handler** (`experimental.chat.system.transform` hook) | B — Hook subscription | `src/hooks/transform-handler.ts` — captures injection payload. |
| **Permission Ask Handler** (`permission.ask` hook) | B — Hook subscription | `src/plugin/opencode-plugin.ts:154-171` — auto-allows HiveMind tools. |
| **Shell Env Handler** (`shell.env` hook) | B — Hook subscription | `src/plugin/opencode-plugin.ts:178-184` — injects env vars. |
| **Command Execute Before** (`command.execute.before` hook) | B — Hook subscription | `src/plugin/opencode-plugin.ts:185-225` — injects command context. |
| **Tool Execute Before** (`tool.execute.before` hook) | B — Hook subscription | `src/plugin/opencode-plugin.ts:172-177` — records tool intent. |
| **Soft Governance Toasts** | C — External library | `src/hooks/soft-governance.ts` — uses `@clack/prompts` for CLI, `client.tui.showToast()` for TUI. |
| **Skill Injection System** | C — External library | `src/plugin/skill-exposure-map.ts` + `src/shared/skill-injection-loader.ts` — uses `yaml`, `fast-glob`, `ignore`. |
| **Event Tracker / Session Journal** | C — External library | `src/features/event-tracker/` — uses `remark`, `unist-util-visit` for markdown processing. |
| **Tree-sitter Code Analysis** | C — External library | `package.json` line 94: `web-tree-sitter` — code structure analysis. |
| **Lockfile Management** | C — External library | `package.json` line 90: `proper-lockfile` — file locking for concurrent writes. |
| **Task Tool** (`hivemind_task`) | D — SDK/MCP interaction | `src/tools/task/tools.ts` — uses `context.sessionID`. Interacts with workflow state. |
| **Trajectory Tool** (`hivemind_trajectory`) | D — SDK/MCP interaction | `src/tools/trajectory/tools.ts` — uses `context.sessionID`. Trajectory control. |
| **Handoff Tool** (`hivemind_handoff`) | D — SDK/MCP interaction | `src/tools/handoff/tools.ts` — uses `context.sessionID`, `context.agent`. Delegation. |
| **Agent Work Contract Tools** | D — SDK/MCP interaction | `src/features/agent-work-contract/tools/` — uses full context (sessionID, agent, directory, worktree). |
| **SDK Context Management** | D — SDK/MCP interaction | `src/hooks/sdk-context.ts` — manages `client`, `$`, `serverUrl` refs from PluginInput. |
| **SDK Client Usage** | D — SDK/MCP interaction | `src/hooks/event-handler.ts:393-398` — `client.session.get()`, `client.session.messages()`. `src/hooks/soft-governance.ts:41` — `client.tui.showToast()`. `src/shared/logging.ts:24` — `client.app.log()`. |
| **Runtime Observability** | D — SDK/MCP interaction | `src/features/runtime-observability/status.ts` — uses `context.sessionID`, `context.agent`. |
| **NL-First Dispatch** | D — SDK/MCP interaction | `src/features/runtime-entry/nl-first-dispatch.ts` — uses `context.sessionID`, `context.agent`. |

### Group Summary

| Group | Count | Description |
|-------|-------|-------------|
| A — Self-sustaining on/off | 6 | Tools that work independently without hook subscriptions |
| B — Hook subscription | 10 | Features that subscribe to OpenCode lifecycle hooks |
| C — External libraries | 5 | Features requiring npm packages beyond SDK |
| D — SDK/MCP interaction | 7 | Features requiring SDK client surfaces or MCP servers |

---

## 5. CQRS Analysis

### Compliant Areas

**Tools (Write-side) — CQRS compliant:**
- All 12 tools in `src/tools/` and `src/features/agent-work-contract/tools/` write to `.hivemind/` state files
- Tools use `context.directory` for path resolution (not hardcoded paths)
- Tools use `context.ask()` for user authorization before mutations (`src/tools/hivefiver-setting/tools.ts:5`, `src/features/agent-work-contract/tools/create-contract-tool.helpers.ts:65`)

**Hooks (Read-side) — MOSTLY compliant:**
- `src/hooks/transform-handler.ts` — read-only, stores in-memory injection payload
- `src/hooks/sdk-context.ts` — read-only SDK reference management
- `src/plugin/messages-transform-adapter.ts` — reads snapshot, injects context (no file writes)
- `src/plugin/compaction-adapter.ts` — reads snapshot, pushes to output.context (no file writes)

### Violations

**CRITICAL: Hooks that WRITE to files (CQRS violation):**

| Hook | File | Write Operation | Severity |
|------|------|-----------------|----------|
| `chat.message` | `src/hooks/chat-message-handler.ts:64-88` | Calls `addTurn()`, `appendTurnToMarkdown()` — writes to `.hivemind/sessions/` | **HIGH** |
| `tool.execute.after` | `src/hooks/tool-execution-handler.ts:46-84` | Calls `addEvent()`, `incrementCounter()`, `appendTurnToMarkdown()` — writes to `.hivemind/sessions/` | **HIGH** |
| `text.complete` | `src/hooks/text-complete-handler.ts:97-156` | Calls `addTurn()`, `addEvent()`, `addDiagnostic()`, `updateStatus()` — writes to `.hivemind/sessions/` | **HIGH** |
| `session.compacting` | `src/hooks/compaction-handler.ts:65-93` | Calls `addEvent()`, `incrementCounter()`, `appendTurnToMarkdown()` — writes to `.hivemind/sessions/` | **HIGH** |
| `event` | `src/hooks/event-handler.ts:208-425` | Calls `initSession()`, `addEvent()`, `addDiagnostic()`, `appendError()`, `updateStatus()` — writes to `.hivemind/sessions/` | **HIGH** |

**Analysis:** The hooks layer is NOT read-only. All 5 major hooks write to `.hivemind/sessions/` via the `consolidated-writer.ts` and `markdown-writer.ts` modules. This is a **systematic CQRS violation** — the hooks layer performs durable writes, not just read-side context injection.

**The actual CQRS boundary in HiveMind is:**
- **Tools** → write to `.hivemind/` state (agent-work-contract, trajectory, handoff, task, journal)
- **Hooks** → ALSO write to `.hivemind/sessions/` (session journal, event tracking)
- **Plugin** → assembly only (correct)

**The write/read boundary is NOT clean.** Hooks perform session journal writes that should arguably be in the tools layer or a dedicated write-side feature module.

### Evidence

- `src/hooks/chat-message-handler.ts` lines 64-88 — `addTurn()`, `appendTurnToMarkdown()` writes
- `src/hooks/tool-execution-handler.ts` lines 46-84 — `addEvent()`, `incrementCounter()` writes
- `src/hooks/text-complete-handler.ts` lines 97-156 — `addTurn()`, `addEvent()`, `addDiagnostic()` writes
- `src/hooks/compaction-handler.ts` lines 65-93 — `addEvent()`, `incrementCounter()` writes
- `src/hooks/event-handler.ts` lines 208-425 — `initSession()`, `addEvent()`, `addDiagnostic()` writes
- `src/features/event-tracker/consolidated-writer.ts` — shared write module used by all hooks
- `src/features/event-tracker/markdown-writer.ts` — markdown write module used by all hooks
- AGENTS.md "CQRS Hard Boundary: Tools write. Hooks read." — stated principle vs actual practice

---

## 6. SDK Surface Usage

### Client API Usage (`client.*`)

| Client Surface | Used? | Where | Frequency |
|----------------|-------|-------|-----------|
| `client.session.get()` | ✅ Yes | `src/hooks/event-handler.ts:393` | 1 call site |
| `client.session.messages()` | ✅ Yes | `src/hooks/event-handler.ts:395-398` | 1 call site |
| `client.tui.showToast()` | ✅ Yes | `src/hooks/soft-governance.ts:41` | 1 call site |
| `client.app.log()` | ✅ Yes | `src/shared/logging.ts:24` | 1 call site |
| `client.session` | ✅ Yes | `src/control-plane/sdk-runtime.ts:71-74` | Client creation |
| `client.*` (other 12 surfaces) | ❌ No | — | Not used |

**4 of 16 client surfaces used (25%).** Unused: `client.command`, `client.vcs`, `client.mcp`, `client.pty`, `client.file`, `client.find`, `client.tool`, `client.config`, `client.provider`, `client.lsp`, `client.formatter`, `client.auth`, `client.event`, `client.global`, `client.path`.

### SDK Package Imports

| Import | Used? | Where |
|--------|-------|-------|
| `@opencode-ai/plugin` (Plugin type) | ✅ Yes | `src/plugin/opencode-plugin.ts:8` |
| `@opencode-ai/plugin/tool` (tool helper) | ✅ Yes | 12 tool files across `src/tools/` and `src/features/` |
| `@opencode-ai/plugin` (ToolContext type) | ✅ Yes | 6 test files + tool files |
| `@opencode-ai/sdk` (Event type) | ✅ Yes | `src/hooks/event-handler.ts:1` |
| `@opencode-ai/sdk` (Part type) | ✅ Yes | `src/plugin/synthetic-parts.ts:1` |
| `@opencode-ai/sdk` (createOpencode, createOpencodeClient) | ✅ Yes | `src/control-plane/sdk-runtime.ts:1` |

### Hook Wiring Rate

| Metric | Value |
|--------|-------|
| Available hooks | 17 |
| Wired hooks | 12 |
| Unused hooks | 5 (`chat.params`, `chat.headers`, `tool.definition`, `config`, `auth`) |
| Wiring rate | 71% |

### Evidence

- `src/hooks/event-handler.ts` lines 393-398 — `client.session.get()`, `client.session.messages()`
- `src/hooks/soft-governance.ts` line 41 — `client.tui.showToast()`
- `src/shared/logging.ts` line 24 — `client.app.log()`
- `src/control-plane/sdk-runtime.ts` line 1 — `createOpencode`, `createOpencodeClient`
- `src/plugin/synthetic-parts.ts` line 1 — `Part` type from SDK
- `package.json` lines 81-82 — `@opencode-ai/plugin` and `@opencode-ai/sdk` dependencies
- AGENTS.md "Plugin Hooks (17 Available)" table — hook availability

---

## Verdict Table

| User Assumption | Verified? | Evidence | Severity if Wrong |
|-----------------|-----------|----------|-------------------|
| **Plugins subscribe to events, add functions via hooks** | ✅ **VERIFIED** | `opencode-plugin.ts` wires 12 hooks including `event`, `chat.message`, `tool.execute.before/after`, `permission.ask`, `shell.env`, `command.execute.before`, `text.complete`, `messages.transform`, `session.compacting`, `system.transform` | N/A — correct |
| **Plugins can install external libraries** | ⚠️ **PARTIALLY** | SDK docs confirm this is possible (`.opencode/package.json`), but HiveMind bundles all deps in its own `package.json`. No runtime library installation occurs. | **LOW** — capability exists but unused |
| **Custom tools are LLM-facing** | ✅ **VERIFIED** | All 12 tools registered in `tool` object of plugin, callable by LLM during conversations | N/A — correct |
| **Custom tools receive context** | ✅ **VERIFIED** | All tools receive `context` with `sessionID`, `agent`, `directory`, `worktree` fields | N/A — correct |
| **Custom tools use Zod schemas** | ✅ **VERIFIED** | 100% of tools use `tool.schema` (Zod re-export). Zero violations found across all tool files. | N/A — correct |
| **Custom tools can be in other languages** | ⚠️ **PARTIALLY** | SDK docs confirm Python/other languages possible, but ALL HiveMind tools are TypeScript. No multi-language tools exist. | **LOW** — capability exists but unused |
| **Tier 3 concepts are user-configurable via .opencode/** | ✅ **VERIFIED** | Agents projected to `.opencode/agents/` (one-time, non-overwriting). Skills and commands bundled in npm package. `opencode.json` is consumer-owned. | N/A — correct |
| **Tier 3 concepts are fragile, shouldn't mix into harness governance** | ✅ **VERIFIED** | HiveMind writes to `.hivemind/` not `.opencode/`. Only one exception: `ensureAgentProjection()` creates `.opencode/agents/hivefiver.md` once. | N/A — correct |
| **Group A: Self-sustaining on/off features exist** | ✅ **VERIFIED** | 6 tools (runtime status, runtime command, hm-init, hm-doctor, hm-setting, doc) are self-contained | N/A — correct |
| **Group B: Features needing hook subscriptions** | ✅ **VERIFIED** | 10 hook handlers actively subscribe to OpenCode lifecycle events | N/A — correct |
| **Group C: Features needing external libraries** | ✅ **VERIFIED** | 5 feature groups use npm packages: skill injection (yaml, fast-glob), event tracker (remark, unist-util-visit), tree-sitter analysis, lockfile management, governance toasts | N/A — correct |
| **Group D: Features needing SDK interaction** | ✅ **VERIFIED** | 7 feature groups use SDK client surfaces: task, trajectory, handoff, agent-work-contract, SDK context, runtime observability, NL-first dispatch | N/A — correct |
| **CQRS is needed everywhere** | ❌ **NOT VERIFIED** | Hooks layer systematically violates CQRS — all 5 major hooks write to `.hivemind/sessions/`. The stated principle "Tools write. Hooks read." is not followed in practice. | **HIGH** — architectural principle vs reality mismatch |
| **Not many features require SDK yet** | ✅ **VERIFIED** | Only 4 of 16 client surfaces used (25%). Only 12 of 17 hooks wired (71%). SDK usage is minimal relative to available surfaces. | N/A — correct |

---

## Key Findings Summary

1. **Plugin architecture is sound** — assembly-only pattern correctly followed. 12 of 17 hooks wired.
2. **Tool architecture is compliant** — 100% Zod schema usage, all tools receive context, all LLM-facing.
3. **Tier 3 isolation is respected** — HiveMind writes to `.hivemind/`, not `.opencode/` (with one benign exception).
4. **Feature classification is valid** — all 4 groups have clear examples in the codebase.
5. **CQRS is VIOLATED by hooks** — the hooks layer writes to `.hivemind/sessions/` via consolidated-writer and markdown-writer modules. This is the most significant finding.
6. **SDK usage is minimal** — 25% of client surfaces used, 71% of hooks wired. Significant headroom for expansion.
