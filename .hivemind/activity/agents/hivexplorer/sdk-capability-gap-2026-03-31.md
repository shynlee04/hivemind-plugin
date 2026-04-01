# SDK Capability Gap Analysis — 2026-03-31

**Investigation Date:** 2026-03-31
**Git HEAD:** `85f8cbe75d580e720854bf796742602ae4b13c31`
**Scope:** Full comparison of OpenCode SDK surface vs HiveMind plugin actual usage
**Investigator:** hivexplorer (terminal agent)

---

## 1. SDK Surface Summary

### 1.1 Available Plugin Hooks (from SDK docs)

| # | Hook | Purpose | HiveMind Uses? |
|---|------|---------|----------------|
| 1 | `event` | All lifecycle events (session, message, tool, command, permission, file, LSP, TUI) | ✅ YES |
| 2 | `tool.execute.before` | Pre-tool validation/interception | ✅ YES |
| 3 | `tool.execute.after` | Post-tool observation | ✅ YES |
| 4 | `tool.definition` | Dynamic tool description modification | ❌ NO |
| 5 | `shell.env` | Inject environment variables | ✅ YES |
| 6 | `experimental.chat.system.transform` | Modify system prompt per-session | ✅ YES |
| 7 | `experimental.chat.messages.transform` | Transform message history | ✅ YES |
| 8 | `experimental.session.compacting` | Customize compaction prompt | ✅ YES |
| 9 | `experimental.text.complete` | Streaming text injection | ✅ YES |
| 10 | `chat.message` | Track messages per-session | ✅ YES |
| 11 | `chat.params` | Control temperature/topP per-agent | ❌ NO |
| 12 | `chat.headers` | Custom auth headers per request | ❌ NO |
| 13 | `permission.ask` | Gate file/state mutations | ✅ YES |
| 14 | `command.execute.before` | Pre-command context injection | ✅ YES |
| 15 | `config` | React to config changes | ❌ NO |
| 16 | `auth` | OAuth and API key auth | ❌ NO |
| 17 | `text.complete` | (see #9) | ✅ YES |

**Summary:** HiveMind uses 11 of ~17 documented hook surfaces. Misses: `tool.definition`, `chat.params`, `chat.headers`, `config`, `auth`.

### 1.2 Available Client APIs (from SDK docs)

| # | API | Purpose | HiveMind Uses? | Where |
|---|-----|---------|----------------|-------|
| 1 | `client.app.log()` | Structured logging | ✅ YES | `src/shared/logging.ts:24` |
| 2 | `client.app.agents()` | List available agents | ❌ NO | — |
| 3 | `client.tui.showToast()` | Toast notifications | ✅ YES | `src/hooks/soft-governance.ts:41` |
| 4 | `client.tui.appendPrompt()` | Append to prompt | ❌ NO | — |
| 5 | `client.tui.executeCommand()` | Execute command | ❌ NO | — |
| 6 | `client.session.get()` | Get session data | ✅ YES | `src/hooks/event-handler.ts:393` |
| 7 | `client.session.messages()` | Get session messages | ✅ YES | `src/hooks/event-handler.ts:395` |
| 8 | `client.session.list()` | List sessions | ❌ NO | — |
| 9 | `client.session.create()` | Create session | ❌ NO | — |
| 10 | `client.session.prompt()` | Send prompt to session | ❌ NO | — |
| 11 | `client.session.share()` | Share session | ❌ NO | — |
| 12 | `client.find.text()` | Search text in files | ❌ NO | — |
| 13 | `client.find.files()` | Find files by name | ❌ NO | — |
| 14 | `client.file.read()` | Read file | ❌ NO | — |
| 15 | `client.file.status()` | File status | ❌ NO | — |
| 16 | `client.config.get()` | Get config | ❌ NO | — |
| 17 | `client.config.providers()` | List providers | ❌ NO | — |
| 18 | `client.event.subscribe()` | SSE event stream | ❌ NO | — |
| 19 | `client.auth.set()` | Set credentials | ❌ NO | — |
| 20 | `client.global.health()` | Server health | ❌ NO | — |
| 21 | `client.path.get()` | Current path info | ❌ NO | — |
| 22 | `client.project.current()` | Current project | ❌ NO | — |

**Summary:** HiveMind uses only 4 of 22 documented client APIs. Vast majority of SDK client surface is unused.

### 1.3 Available Tool Features

| Feature | SDK Provides | HiveMind Uses? |
|---------|-------------|----------------|
| `tool()` helper | ✅ | ✅ All 12 tools use it |
| `tool.schema` (Zod) | ✅ | ✅ All 12 tools use it |
| `context.sessionID` | ✅ | ✅ Used in 8 of 12 tools |
| `context.agent` | ✅ | ✅ Used in 4 of 12 tools |
| `context.directory` | ✅ | ✅ Used in 1 tool (journal:147) |
| `context.worktree` | ✅ | ❌ NOT used by any tool |
| `context.messageID` | ✅ | ❌ NOT used by any tool |
| `context.metadata()` | ✅ | ✅ Used in 8 of 12 tools |
| `context.ask()` | ✅ | ❌ NOT used by any tool |
| `context.abort` | ✅ | ❌ NOT used by any tool |
| Raw TypeScript interfaces for args | ❌ (anti-pattern) | ✅ Used as supplementary types |

---

## 2. HiveMind SDK Usage Matrix

| SDK Feature | HiveMind Uses? | How? | File:Line |
|-------------|---------------|------|-----------|
| **Plugin type import** | ✅ YES | `import { type Plugin } from '@opencode-ai/plugin'` | `src/plugin/opencode-plugin.ts:8` |
| **tool() helper** | ✅ YES | `import { tool } from '@opencode-ai/plugin/tool'` | All 12 tool files |
| **tool.schema (Zod)** | ✅ YES | Every tool defines args via `tool.schema.string()/.enum()/.object()/.array()` | All 12 tool files |
| **context.sessionID** | ✅ YES | Extracted for session tracking | `src/tools/task/tools.ts:28`, `src/tools/trajectory/tools.ts:34`, etc. |
| **context.agent** | ✅ YES | Used for agent lineage tracking | `src/tools/runtime/tools.ts:28`, `src/tools/handoff/tools.ts:40` |
| **context.metadata()** | ✅ YES | Attaches metadata to tool responses | `src/tools/task/tools.ts:37`, `src/tools/runtime/tools.ts:30` |
| **context.directory** | ✅ YES | Used for project root resolution | `src/tools/hivemind-journal.ts:147` |
| **context.worktree** | ❌ NO | Available but never accessed | — |
| **context.messageID** | ❌ NO | Available but never accessed | — |
| **context.ask()** | ❌ NO | Never used for user authorization | — |
| **context.abort** | ❌ NO | Never used for cancellation | — |
| **client.app.log()** | ✅ YES | Structured logging via `withClient()` wrapper | `src/shared/logging.ts:24` |
| **client.tui.showToast()** | ✅ YES | Governance toast notifications | `src/hooks/soft-governance.ts:41` |
| **client.session.get()** | ✅ YES | Fetch session data on idle event | `src/hooks/event-handler.ts:393` |
| **client.session.messages()** | ✅ YES | Fetch messages on idle event | `src/hooks/event-handler.ts:395` |
| **client.find.text()** | ❌ NO | Never used for file search | — |
| **client.find.files()** | ❌ NO | Never used for file discovery | — |
| **client.file.read()** | ❌ NO | Never used for file reads | — |
| **client.event.subscribe()** | ❌ NO | Never uses SSE stream | — |
| **client.config.get()** | ❌ NO | Never reads SDK config | — |
| **client.project.current()** | ❌ NO | Never reads project info via SDK | — |

---

## 3. Hooks Registration Matrix (Actual Wiring)

**File:** `src/plugin/opencode-plugin.ts:115-250`

| Hook Name | Registered? | Handler | What It Does |
|-----------|-------------|---------|--------------|
| `event` | ✅ L116 | `eventHandler(eventInput)` | Bridges SDK events into trajectory ledger, session tracking, recovery checkpoints |
| `experimental.chat.system.transform` | ✅ L119 | `transformHandler(input, output)` | Captures system prompt injection for session journal diagnostics |
| `chat.message` | ✅ L136 | `handleChatMessage(...)` | Records user messages in consolidated session file + markdown |
| `permission.ask` | ✅ L154 | inline | Auto-allows HiveMind managed tools; surfaces governance toast for write ops |
| `tool.execute.before` | ✅ L172 | inline | Records pre-execution event for HiveMind managed tools in trajectory |
| `shell.env` | ✅ L178 | inline | Injects `HIVEMIND_RUNTIME_ATTACHED`, `HIVEMIND_ATTACHMENT_MODE`, trajectory/workflow IDs |
| `command.execute.before` | ✅ L185 | inline | Injects command context (trajectory, workflow, task IDs) as synthetic parts |
| `tool.execute.after` | ✅ L226 | `handleToolExecution(...)` | Records tool_invocation event + increments counter in session journal |
| `experimental.text.complete` | ✅ L232 | `createTextCompleteHandler(...)` | Records assistant output, increments counters, writes diagnostics per turn |
| `experimental.chat.messages.transform` | ✅ L245 | `messagesTransform` | Injects HiveMind context, turn hierarchy, skill focus, route hints into user messages |
| `experimental.session.compacting` | ✅ L246 | `compactionHandler(...)` | Injects trajectory/task context into compaction; writes compaction event to journal |

---

## 4. Reimplementations Detected

### 4.1 Custom Session Tracking (vs SDK `client.session`)

| Aspect | SDK Provides | HiveMind Reimplements | Risk | Evidence |
|--------|-------------|----------------------|------|----------|
| Session creation | `client.session.create()` | Custom: `initSession()` in consolidated-writer | MEDIUM | `src/features/event-tracker/consolidated-writer.ts` |
| Session listing | `client.session.list()` | Custom: `loadSession()` reads from `.hivemind/sessions/` | MEDIUM | `src/features/event-tracker/consolidated-writer.ts` |
| Session resolution | `client.session.get()` | Custom: `sessionResolver.resolve()` maps SDK IDs → semantic IDs | MEDIUM | `src/features/session-journal/session-resolver.ts` |
| Session messages | `client.session.messages()` | Custom: markdown writer + JSON consolidated file | HIGH | `src/features/event-tracker/markdown-writer.ts` |
| Session status | `client.session.update()` | Custom: `updateStatus()` writes to `.hivemind/sessions/` | MEDIUM | `src/features/event-tracker/consolidated-writer.ts` |
| Semantic session IDs | SDK uses raw IDs only | Custom: truncation + semantic naming resolution | MEDIUM | `src/features/event-tracker/paths.ts:truncateSessionId()` |

**Rationale:** HiveMind's session tracking adds semantic naming, parent-child linking, markdown journaling, and diagnostic overlays — features the SDK's bare session API doesn't provide. This is **legitimate extension**, not pure reimplementation. However, the custom session.idle handler at `event-handler.ts:393` DOES call `client.session.get()` and `client.session.messages()` but discards the results — the fetched data is never used.

### 4.2 Custom Config Management (vs SDK `client.config`)

| Aspect | SDK Provides | HiveMind Reimplements | Risk | Evidence |
|--------|-------------|----------------------|------|----------|
| Config reading | `client.config.get()` | Custom: `getConfigGroup()` reads from Zod schema defaults | LOW | `src/shared/config-groups.ts:93` |
| Config validation | SDK has `opencode.json` schema | Custom: `validateConfigUpdate()` + Zod | LOW | `src/shared/config-groups.ts:116` |
| Config persistence | SDK `opencode.json` | Custom: `.hivemind/config/runtime-attachment.json` | MEDIUM | `src/shared/paths.ts:67` |
| User preferences | Not in SDK | Custom: `UserPreferences` schema in schema-kernel | NONE | `src/schema-kernel/config-records.ts` |

**Rationale:** HiveMind manages user preferences (language, expertise, governance) that the SDK doesn't model. This is domain-specific config, not SDK overlap.

### 4.3 Custom Event System (vs SDK `client.event.subscribe`)

| Aspect | SDK Provides | HiveMind Reimplements | Risk | Evidence |
|--------|-------------|----------------------|------|----------|
| Event subscription | `client.event.subscribe()` SSE stream | Custom: `event` hook processes events inline | LOW | `src/hooks/event-handler.ts:175` |
| Event bus | Not a formal bus in SDK | No event bus exists in HiveMind | NONE | Grep confirms: 0 matches for `event-bus\|EventBus` |

**Rationale:** HiveMind uses the SDK's `event` hook correctly for event processing. There is NO custom event bus. The AGENTS.md explicitly bans importing from `shared/event-bus.ts`.

### 4.4 Custom Logging (vs SDK `client.app.log()`)

| Aspect | SDK Provides | HiveMind Reimplements | Risk | Evidence |
|--------|-------------|----------------------|------|----------|
| Structured logging | `client.app.log()` | Custom: dual-path — `console.*` + `client.app.log()` | LOW | `src/shared/logging.ts:34-55` |
| Log levels | SDK supports debug/info/warn/error | Same levels, dual-emission | LOW | `src/shared/logging.ts:10` |

**Rationale:** HiveMind wraps `client.app.log()` in a `withClient()` fallback pattern. Console output acts as safety net when SDK client is unavailable. The 23 `console.*` calls outside of `logging.ts` are spread across: `delegation-store.ts` (3), `skill-injection-loader.ts` (2), `plugin/opencode-plugin.ts` (2), `skill-exposure-map.ts` (1), `evidence-reporter.ts` (1), `workflow-continuity.ts` (1), `chain-executor.ts` (1), `cli.ts` (3). These should migrate to the `log` helper.

### 4.5 Custom Tool Response Format (vs SDK raw returns)

| Aspect | SDK Provides | HiveMind Reimplements | Risk | Evidence |
|--------|-------------|----------------------|------|----------|
| Tool return format | Raw string/JSON | Custom: `ToolResponse<T>` with status/message/data/metadata | LOW | `src/shared/tool-response.ts:6-11` |
| Response factories | Not in SDK | Custom: `success()`, `error()`, `pending()` | LOW | `src/shared/tool-response.ts:14-24` |

**Rationale:** The SDK expects tools to return strings. HiveMind adds a structured response envelope before stringifying. This is a convenience pattern, not a conflict.

---

## 5. json-render Integration

### 5.1 What json-render Offers

Based on the repomix at `.sdk-lib/json-render/repomix-json-render.xml` (175,539 lines):

- **Core library** (`@json-render/core`): Schema-driven JSON spec system for defining UI component trees as data
- **Ink renderer** (`@json-render/ink`): Terminal/CLI rendering from json-render specs — used for TUI dashboards
- **React renderer** (`@json-render/react`): Web rendering from json-render specs
- **Schema system** (`@json-render/ink/schema`): Zod-based schema for component definitions
- **Catalog system** (`@json-render/ink/catalog`): Standard component/action definitions

Key concepts: **Spec** (JSON tree describing UI layout), **Catalog** (registry of available components), **Renderer** (renders spec to target platform).

### 5.2 How HiveMind Uses json-render

**Package dependencies** (from `package.json`):
```
"@json-render/core": "^0.16.0"
"@json-render/ink": "^0.16.0"
"@json-render/react": "^0.16.0"
```

**Source usage:**

| File | Usage | Purpose |
|------|-------|---------|
| `src/tools/hivefiver-setting/render.ts:2-5` | `defineCatalog`, `createRenderer`, `standardComponents`, `standardActionDefinitions`, `schema` | TUI rendering for settings dashboard |
| `src/tools/hivefiver-setting/spec-builder.ts:156,251` | References json-render spec system | Building dashboard spec from settings proof |
| `src/tools/hivefiver-setting/types.ts:127,183,200` | Type definitions for Spec elements | json-render Spec types for dashboard output |

**Side-car app usage:**
- `apps/side-car/lib/registry.tsx` uses `@json-render/core` (`defineCatalog`), `@json-render/react` (`defineRegistry`, `schema`), and `@json-render/shadcn` for the web dashboard

**Assessment:** json-render is used correctly for its intended purpose — schema-driven UI rendering for both TUI (ink) and web (React) surfaces. The `render.ts` file has deprecation warnings suggesting future migration to spec constructors (P4 planned). Integration is focused on the settings dashboard feature only.

---

## 6. Reference Repo Patterns

### 6.1 dynamic-context-prunning (DCP) — Relevant Patterns

**Source:** `.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml`

**Key Architecture:**
- `lib/compress/` — Compression pipeline: message utils, range-based compression, protected content detection, search
- `lib/messages/` — Message management: injection, priority, pruning, reasoning stripping, sync
- `lib/prompts/` — Prompt engineering for compression: compress-message, context-limit-nudge, iteration-nudge
- `lib/strategies/` — Deduplication, purge-errors
- `lib/state/` — State persistence, tool caching

**Relevance to HiveMind:**
- DCP implements a sophisticated context window management system that operates at the message level
- HiveMind's `experimental.session.compacting` hook injects trajectory/task context but does NOT implement its own pruning/compression
- HiveMind could potentially use DCP's range-based compression to manage large session journals
- DCP's protected-content pattern (preventing certain messages from being compressed) maps to HiveMind's trajectory preservation packets

### 6.2 oh-my-openagents (OMO) — Relevant Patterns

**Source:** `.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml`

**Key Architecture:**
- `.opencode/skills/` — Uses native OpenCode skill system (SKILL.md definitions)
- `.opencode/command/` — Custom slash commands (get-unpublished-changes, omomomo, publish, remove-deadcode)
- `.sisyphus/rules/` — Modular code enforcement rules
- Skill evaluation framework: `work-with-pr-workspace/evals/` contains 5 evaluation runs comparing with/without skill performance
- Background tasks: `background-tasks.json`

**Relevance to HiveMind:**
- OMO uses the same `.opencode/skills/` directory pattern that HiveMind uses
- OMO's skill evaluation framework (eval JSONs with grading) is a pattern HiveMind could adopt for verifying skill effectiveness
- OMO's `pre-publish-review` skill demonstrates the review-before-publish workflow
- OMO's `.sisyphus/rules/` pattern mirrors HiveMind's governance approach but via a separate rules directory

### 6.3 opencode-workspace-background-agents

**Source:** `.sdk-lib/opencode-workspace-background-agents/repomix-output-kdcokenny-opencode-workspace.xml` (exists but not scanned in depth for this report)

---

## 7. Key Findings

### 7.1 SDK Utilization Score: Moderate (11/17 hooks, 4/22 client APIs)

HiveMind uses hooks extensively (11 of 17) but barely touches the client API surface (4 of 22). The plugin is hook-heavy but client-light.

### 7.2 No Dangerous Reimplementations

The AGENTS.md anti-patterns are respected:
- ✅ No `shared/event-bus.ts` imports (confirmed: 0 matches)
- ✅ No `core/session/kernel.ts` imports (dead code, removed)
- ✅ All tools use `tool.schema` (Zod) — no raw TypeScript interfaces for args
- ✅ No tools defined inline in `opencode-plugin.ts` — all extracted to `src/tools/`
- ✅ No duplicated helpers across tool files — centralized in `shared/tool-helpers.ts`
- ✅ No hand-written `.hivemind/` files in tools — uses `hivemind_runtime_command`

### 7.3 Unused SDK Client APIs (Opportunities)

| Opportunity | Current State | Potential |
|-------------|---------------|-----------|
| `client.find.text()` | HiveMind's doc tool uses `node:fs` directly | Could use SDK for file search |
| `client.find.files()` | Glob patterns via `node:fs` | Could use SDK for file discovery |
| `client.file.read()` | Custom file reading logic | Could delegate to SDK |
| `client.session.list()` | Custom session listing from `.hivemind/sessions/` | Could cross-reference with SDK sessions |
| `client.config.get()` | Custom config reading from schema defaults | Could read actual runtime config |
| `client.project.current()` | Uses `input.directory` from plugin init | Could get richer project info |
| `chat.params` hook | Not registered | Could set temperature/topP per-agent per Hivemind governance |
| `tool.definition` hook | Not registered | Could dynamically update tool descriptions based on runtime state |

### 7.4 Unused context Fields in Tools

| Field | Status | Risk |
|-------|--------|------|
| `context.worktree` | Never used | LOW — `directory` is sufficient for most operations |
| `context.messageID` | Never used | MEDIUM — could improve event correlation |
| `context.ask()` | Never used | HIGH — tools declare `authorizationRequired: true` but never actually call `ask()` |
| `context.abort` | Never used | LOW — long-running operations could benefit |

### 7.5 The `context.ask()` Gap

This is the most significant finding. Multiple tools document `authorizationRequired: true` in their responses (init, doctor, setting) but NONE actually invoke `context.ask()` for user confirmation. The permission is handled at the hook level (`permission.ask` at `opencode-plugin.ts:154`) but tools never use the inline authorization mechanism. This means:
- Tools return "authorization required" messages but don't gate writes
- The LLM must decide whether to proceed, not the SDK
- `context.ask()` exists specifically for this purpose and is being bypassed

### 7.6 Session.idle Data Fetch Is Wasted

At `src/hooks/event-handler.ts:393-398`, the idle handler calls `client.session.get()` and `client.session.messages()` but the return values are discarded — not assigned to any variable. This is dead code that makes API calls for no purpose.

### 7.7 Logging Discipline Gap

23 `console.*` calls exist outside of `src/shared/logging.ts`. These bypass the SDK `client.app.log()` structured logging. Files affected: `delegation-store.ts`, `skill-injection-loader.ts`, `opencode-plugin.ts`, `skill-exposure-map.ts`, `evidence-reporter.ts`, `workflow-continuity.ts`, `chain-executor.ts`, `cli.ts`.

### 7.8 json-render Integration Is Sound

json-render is used appropriately for its designed purpose: schema-driven UI rendering for both TUI and web. No misuse detected. Migration to spec constructors is planned (P4).

---

## 8. Gap Summary Table

| SDK Feature | HiveMind Uses? | Reimplements Instead? | Severity |
|-------------|---------------|---------------------|----------|
| `event` hook | ✅ | No | — |
| `tool.execute.before/after` | ✅ | No | — |
| `shell.env` | ✅ | No | — |
| `system.transform` | ✅ | No | — |
| `messages.transform` | ✅ | No | — |
| `session.compacting` | ✅ | No | — |
| `text.complete` | ✅ | No | — |
| `chat.message` | ✅ | No | — |
| `permission.ask` | ✅ | No | — |
| `command.execute.before` | ✅ | No | — |
| `tool()` + `tool.schema` | ✅ | No | — |
| `context.ask()` | ❌ | Returns "authorization required" string instead | HIGH |
| `chat.params` hook | ❌ | No equivalent | LOW |
| `tool.definition` hook | ❌ | Static tool descriptions only | LOW |
| `client.find.text()` | ❌ | Custom file search via node:fs | MEDIUM |
| `client.find.files()` | ❌ | Custom glob via node:fs | MEDIUM |
| `client.file.read()` | ❌ | Custom file reading | LOW |
| `client.session.list()` | ❌ | Custom session listing from .hivemind/ | MEDIUM |
| `client.config.get()` | ❌ | Custom config from schema defaults | LOW |
| `client.event.subscribe()` | ❌ | Uses `event` hook instead (correct) | NONE |
| `context.worktree` | ❌ | Uses `directory` instead | LOW |
| `context.messageID` | ❌ | Not tracked per-tool | MEDIUM |
| `client.app.log()` | ✅ | Dual-path with console fallback | LOW |
| `client.tui.showToast()` | ✅ | No | — |

---

*Investigation completed at 2026-03-31. All file paths verified against git HEAD 85f8cbe7. All line numbers referenced from current source state.*
