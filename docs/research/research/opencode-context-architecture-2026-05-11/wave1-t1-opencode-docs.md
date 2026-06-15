# OpenCode Runtime Architecture: Context & Session Management Research

**Researcher:** hm-l2-researcher  
**Date:** 2026-05-11  
**Source Agent:** hm-l1-coordinator (delegated)  
**Status:** COMPLETED  
**Confidence:** HIGH (live-sourced, multi-validated)

---

## 1. Sources Found

| # | URL / Reference | Type | Description |
|---|----------------|------|-------------|
| 1 | https://opencode.ai/docs/ | Official Docs | Main documentation portal |
| 2 | https://opencode.ai/docs/sdk/ | Official Docs | SDK API reference with client methods, types, events |
| 3 | https://opencode.ai/docs/plugins/ | Official Docs | Plugin system, hooks, events, compaction hooks |
| 4 | https://opencode.ai/docs/server/ | Official Docs | HTTP server architecture, REST API, OpenAPI |
| 5 | https://opencode.ai/docs/agents/ | Official Docs | Agent definitions, permissions, subagent system |
| 6 | https://opencode.ai/docs/skills/ | Official Docs | Skill loading system, permission configuration |
| 7 | https://opencode.ai/docs/commands/ | Official Docs | Custom commands, shell injection, $ARGUMENTS |
| 8 | https://opencode.ai/docs/config/ | Official Docs | Config hierarchy, compaction config |
| 9 | https://github.com/anomalyco/opencode | Source Code | Main repo (157K+ stars, TypeScript) |
| 10 | `packages/opencode/src/session/compaction.ts` | Source Code | Context compaction engine (Effect/TypeScript) |
| 11 | `packages/opencode/src/session/overflow.ts` | Source Code | Overflow detection, token threshold calculation |
| 12 | `packages/opencode/src/session/processor.ts` | Source Code | Session processor: LLM stream, tool execution, compaction trigger |
| 13 | `packages/opencode/src/session/message-v2.ts` | Source Code | Message-to-LLM-prompt conversion, filtering, parts |
| 14 | `packages/opencode/src/session/prompt.ts` | Source Code | Prompt assembly, system messages, permission routing |
| 15 | `packages/opencode/src/session/prompt/` | Source Code | Provider-specific prompt templates (.txt files) |
| 16 | `packages/plugin/src/index.ts` | Source Code | Plugin SDK: Hooks interface, types, tool() helper |
| 17 | https://opencode.ai/docs/custom-tools/ | Official Docs | Custom tools with Zod schemas |
| 18 | https://mintlify.com/anomalyco/opencode/sdk/plugin-api | Third-party | Plugin API reference (mirror) |
| 19 | https://forums.basehub.com/anomalyco/opencode/20 | Community | Deep analysis of compaction process |
| 20 | https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p | Blog | Comprehensive hooks overview |
| 21 | GitHub Issues #5409, #12110, #14164, #16512 | Issues | Session lifecycle hooks, compaction improvements, context preservation |
| 22 | GitHub PRs #10123, #12924, #14662, #15130, #15525 | PRs | Configurable thresholds, compaction models, double-buffer |
| 23 | https://github.com/anomalyco/opencode/issues/2588 | Issue | Subagent context inheritance |
| 24 | https://github.com/anomalyco/opencode/issues/5502 | Issue | Subagent isolation behavior |
| 25 | https://deepwiki.com/anomalyco/opencode | DeepWiki | AI-powered repo documentation |

---

## 2. OpenCode SDK & Architecture

### 2.1 Client-Server Architecture

**Source:** https://opencode.ai/docs/server/ [CONFIDENCE: HIGH]

OpenCode uses a **client-server architecture** with a headless HTTP server that exposes an OpenAPI 3.1 endpoint:

- **Server**: `opencode serve [--port <number>]` starts on port `4096` by default
- **TUI**: The terminal interface is a **client** that talks to the server
- **SDK**: `@opencode-ai/sdk` provides a type-safe JS/TS client
- **Plugin**: `@opencode-ai/plugin` provides the hook/tool registration SDK
- **OpenAPI**: Spec published at `http://<hostname>:<port>/doc`

```
┌─────────────────────────────────────────────────────────┐
│  TUI (Terminal Client)  │  IDE Client  │  Web Client    │
└────────────┬─────────────┴──────┬───────┴──────┬────────┘
             │                    │              │
             ▼                    ▼              ▼
        ┌─────────────────────────────────────────────┐
        │         HTTP Server (port 4096)             │
        │         OpenAPI 3.1 Spec                    │
        │         SSE Event Stream                    │
        └──────────────┬──────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────────────┐
        │    Session Engine (Effect/TypeScript)       │
        │    - Session Prompt Loop                    │
        │    - Context Compaction                     │
        │    - Tool Execution                         │
        │    - Permission System                      │
        └─────────────────────────────────────────────┘
```

### 2.2 SDK API Surface

**Source:** https://opencode.ai/docs/sdk/ [CONFIDENCE: HIGH]

Key SDK operations relevant to context management:

| Method | Description |
|---|---|
| `session.prompt({ path, body })`, `body.noReply: true` | Inject context without AI response |
| `session.messages({ path })` | List all messages + parts in a session |
| `session.message({ path })` | Get single message details |
| `session.summarize({ path, body })` | Summarize session |
| `session.revert({ path, body })` | Revert a message |
| `session.unrevert({ path })` | Restore reverted messages |
| `session.list()` | List all sessions |
| `session.children({ path })` | List child/subagent sessions |
| `session.update({ path, body })` | Update session properties |
| `event.subscribe()` | SSE event stream (real-time) |

### 2.3 Plugin Registration

**Source:** https://opencode.ai/docs/plugins/ [CONFIDENCE: HIGH]

Plugins are loaded in order:
1. Global config (`~/.config/opencode/opencode.json`)
2. Project config (`opencode.json`)
3. Global plugin directory (`~/.config/opencode/plugins/`)
4. Project plugin directory (`.opencode/plugins/`)

npm packages specified in `opencode.json` under `"plugin": [...]` are auto-installed via Bun at startup.

---

## 3. Session & Context Management

### 3.1 Session Lifecycle

**Source:** `packages/opencode/src/session/prompt.ts`, `packages/opencode/src/session/processor.ts` [CONFIDENCE: HIGH]

The session lifecycle follows this flow:

```
User Prompt → SessionPrompt.prompt()
  ├─ Create user message (MessageV2.User)
  ├─ Update session permissions
  ├─ SessionPrompt.loop() → iterative agent loop
  │   ├─ Request LLM completion via LLM.stream()
  │   ├─ Process stream events (text, tool calls, reasoning)
  │   ├─ Execute tools via ToolRegistry.Service
  │   ├─ Check overflow: isOverflow(tokens, model)
  │   │   └─ If overflow → trigger compaction
  │   └─ Return "continue" | "compact" | "stop"
  ├─ SessionSummary.summarize() → calculate changes
  └─ Session persists to SQLite (via Drizzle ORM)
```

**Parent-Child Session Model:** Sessions form a tree via `parentID`. Subagent invocations create child sessions. The TUI supports hierarchical navigation (up/down between levels, left/right among siblings).

### 3.2 How Context Is Composed for Each LLM Turn

**Source:** `packages/opencode/src/session/message-v2.ts → toModelMessages()` [CONFIDENCE: HIGH]

The LLM "sees" a context composed from these sources:

1. **System Prompts** — assembled from:
   - Agent-specific prompt (from agent definition)
   - Provider-specific prompt templates (e.g., `anthropic.txt`, `gpt.txt`, `codex.txt`)
   - Custom system prompt from the last user message
   - Plugin transformations via `experimental.chat.system.transform` hook

2. **Conversation History** — `MessageV2.WithParts[]` converted to provider-specific format via `toModelMessages()`:
   - **User messages**: text parts, file attachments (media), compaction markers, subtask markers
   - **Assistant messages**: text parts, reasoning blocks, tool calls (with input/output/error), step markers
   - **Compact-compacted tool outputs**: Pruned to `"[Old tool result content cleared]"` or truncated to `TOOL_OUTPUT_MAX_CHARS` (2,000 chars during compaction)
   - **Media handling**: For providers that don't support media in tool results, media is extracted and injected as a separate synthetic user message

3. **Tool Definitions** — resolved by `SessionPrompt.resolveTools()`, including plugin-registered custom tools

4. **Model Options** — temperature, topP, maxOutputTokens merged from model capabilities, agent config, provider transforms

5. **Filtering Rules**:
   - `filterCompacted()`: After compaction, history is truncated at the compaction summary; messages before it are excluded
   - Failed assistant messages (with errors) are skipped unless they contain meaningful parts
   - `step-start` parts are filtered out before sending to the LLM
   - Messages from a different model/provider have their provider metadata stripped

### 3.3 Context Overflow & Compaction

**Source:** `packages/opencode/src/session/compaction.ts`, `packages/opencode/src/session/overflow.ts` [CONFIDENCE: HIGH]

#### 3.3.1 Overflow Detection (`overflow.ts`)

```typescript
// Usable context = model's context limit - output buffer - reserved space
export function usable(input) {
  const reserved = cfg.compaction?.reserved ?? Math.min(20000, maxOutputTokens)
  return input.model.limit.input
    ? Math.max(0, input.model.limit.input - reserved)
    : Math.max(0, context - maxOutputTokens)
}

// Overflow = token count >= usable context
export function isOverflow(input) {
  if (cfg.compaction?.auto === false) return false
  const count = tokens.total || tokens.input + tokens.output + tokens.cache.read
  return count >= usable(input)
}
```

- **Default buffer**: 20,000 tokens reserved for compaction headroom
- **Disabled with**: `compaction.auto: false` in opencode.json (but ONLY prevents proactive checks — provider-level overflow errors still trigger compaction in current code)
- **Per-model override**: `compaction.models` allows model-specific thresholds
- **Configurable thresholds**: `compaction.token_threshold` (absolute) and `compaction.context_threshold` (ratio), both per-model-aware (PR #10123)

#### 3.3.2 Compaction Process (`compaction.ts`)

```
1. PRE-CHECK: Before sending user prompt, check if previous response overflowed
2. POST-CHECK: After assistant response, check token usage → if overflow, mark needsCompaction
3. COMPACTION:
   a. Create user message with CompactionPart (mode: "compaction", auto: true/false)
   b. Select messages to include (exclude already-compacted if using tail_start_id)
   c. Build compaction prompt: "Create an anchored summary..." + structured template
   d. Allow plugins to inject context or replace prompt (experimental.session.compacting)
   e. Allow plugins to transform messages (experimental.chat.messages.transform)
   f. Convert to model format, strip media, truncate tool outputs to 2,000 chars
   g. Send to dedicated "compaction" agent (no tools)
   h. If successful, publish session.compacted event
   i. Auto-continue: inject synthetic user message "Continue if you have next steps..."
```

**Compaction Summary Template** (hardcoded in compaction.ts):
```
## Goal
## Constraints & Preferences
## Progress (Done / In Progress / Blocked)
## Key Decisions
## Next Steps
## Critical Context
## Relevant Files
```

Note: The template was expanded to 8 sections in PR #14662 to improve fidelity.

#### 3.3.3 Token Tracking

Tokens are tracked per-assistant-message via the `MessageV2.Assistant.tokens` field:
- `input`: Input tokens used
- `output`: Output tokens generated
- `reasoning`: Thinking/reasoning tokens
- `cache.read` / `cache.write`: Prompt caching stats
- `total`: Provider-reported total (preferred over sum when available)

#### 3.3.4 Tool Output Pruning (`compaction.ts:prune()`)

Before compaction runs, a separate pruning pass:
- **Protects**: Most recent ~40,000 tokens of tool outputs
- **Protects**: `skill` tool outputs (always preserved)
- **Minimum**: Only prunes if >20,000 tokens of tool output is eligible
- **Preserves**: At least 2 user turns before pruning
- **Mechanism**: Marks old tool parts with `state.time.compacted`, which causes output to render as `"[Old tool result content cleared]"`
- **Max chars during compaction**: Tool outputs are truncated to `TOOL_OUTPUT_MAX_CHARS` (2,000) when building compaction context

#### 3.3.5 Tail Preservation

Recent messages are preserved by the `select()` function:
- Default: 2 tail turns preserved (configurable via `compaction.tail_turns`)
- Budget: 2,000–8,000 tokens for preserved recent messages (or 25% of usable context)
- Preserved messages are included after compaction summary via `tail_start_id` in CompactionPart

### 3.4 Double-Buffer Compaction (PR #15130)

A two-phase strategy proposed to improve quality:
1. **Checkpoint phase** (~50%): Background compaction generates summary, stored in per-session state
2. **Concurrent phase** (50-75%): Normal operation continues
3. **Swap phase** (~75%): Uses pre-computed summary instead of stop-the-world compaction

### 3.5 Compaction Model Selection

**Source:** PR #15525 [CONFIDENCE: MEDIUM]

Users can use a different model for compaction than for chat:
- Config: `agent.compaction.model` (static)
- TUI: Runtime switching via `/compaction-models` or command menu
- Resolution: TUI selection > config > session model

### 3.6 Session Persistence

**Source:** `packages/opencode/src/session/session.sql.ts` [CONFIDENCE: MEDIUM]

Sessions and messages are persisted to SQLite via Drizzle ORM:
- `SessionTable`: session metadata, parentID, project, workspace
- `MessageTable`: message ID, session ID, role, time created, data (JSON)
- `PartTable`: part ID, message ID, session ID, data (JSON)

---

## 4. Agent Profiles & Primitives

### 4.1 Agent Types

**Source:** https://opencode.ai/docs/agents/ [CONFIDENCE: HIGH]

Two agent types:
- **Primary agents**: Direct user interaction (Build, Plan). Shown in TUI, cycled with Tab.
- **Subagents**: Invoked by primary agents via `@agent-name` or Task tool. (General, Explore, Scout)

### 4.2 Agent Configuration

Agents can be defined in two ways:
1. **YAML frontmatter Markdown files**: `.opencode/agents/*.md` or `~/.config/opencode/agents/*.md`
2. **JSON in opencode.json**: Under `"agent"` key

Key configuration options affecting context:
| Option | Effect |
|---|---|
| `model` | Override the LLM model (different context windows, costs) |
| `permission` | Control which tools are available → affects what enters context |
| `mode` | "primary" or "subagent" (or both) |
| `permission.task` | Which subagents can be invoked (glob patterns) |
| `permission.skill` | Which skills can be loaded |
| `tools` | Enable/disable specific tools per agent |

### 4.3 Skills System

**Source:** https://opencode.ai/docs/skills/ [CONFIDENCE: HIGH]

Skills are loaded **on-demand** via the native `skill` tool:
- Agent sees available skills listed in the `skill` tool description
- Agent calls `skill({ name: "skill-name" })` to load the full SKILL.md content
- Loaded skill content becomes part of the agent's next turn context
- Skills are searched in: `.opencode/skills/`, `.claude/skills/`, `.agents/skills/`, `~/.config/opencode/skills/`
- Permission-controlled via `permission.skill` (allow/deny/ask) with wildcard patterns

### 4.4 Commands System

**Source:** https://opencode.ai/docs/commands/ [CONFIDENCE: HIGH]

Custom commands defined as markdown files in `.opencode/commands/`:
- Support `$ARGUMENTS` placeholder for argument passing
- Support `!command` for shell output injection
- Support `@filename` for file reference injection
- Can specify `agent`, `model`, `subtask` per command
- `subtask: true` forces subagent invocation → isolates command context from parent
- Context injection: file contents + shell output + arguments become part of the prompt

### 4.5 Subagent Delegation & Context Isolation

**Source:** GitHub Issues #2588, #5502, #11012, PR #7756 [CONFIDENCE: MEDIUM]

Subagent context characteristics:
- **Default**: Subagents are **stateless** — each invocation creates a new, isolated child session with only the task prompt
- **Isolation**: Subagents do NOT inherit the parent agent's conversation history
- **Parent persistence**: Parent agent's context window is NOT consumed by subagent execution (child sessions have separate context windows)
- **Session tree**: Sessions form a hierarchy via `parentID`; depth limit is configurable (default: 5 levels)
- **Task budget**: Configurable `task_budget` per agent to prevent infinite delegation loops
- **Permission isolation**: Subagents have their own permission ruleset (merged from subagent definition + child session)
- **Known limitation**: Subagent permissions may not inherit parent agent's permissions correctly (Issue #12566)
- **Known limitation**: Sessions cannot be automatically resumed across calls unless `session_id` is provided
- **Feature request** (#2588): "Fork" mode for subagents to inherit parent context instead of spawning fresh

---

## 5. Context Pruning & Interception

### 5.1 Plugin Hook System

**Source:** https://opencode.ai/docs/plugins/ and `packages/plugin/src/index.ts` [CONFIDENCE: HIGH]

The complete Hooks interface available to plugins:

#### 5.1.1 Chat/Context Hooks (DIRECT context interception)

| Hook | When | What You Can Modify |
|---|---|---|
| `chat.message` | New message received | `output.message` (UserMessage), `output.parts` |
| `chat.params` | LLM parameters being built | temperature, topP, topK, maxOutputTokens, options |
| `chat.headers` | HTTP headers for LLM request | Custom headers |
| `experimental.chat.messages.transform` | Messages being sent to LLM | `output.messages` — the FULL message array |
| `experimental.chat.system.transform` | System prompt being assembled | `output.system` — array of system strings |

#### 5.1.2 Tool Execution Hooks

| Hook | When | What You Can Modify |
|---|---|---|
| `tool.execute.before` | Before tool runs | `output.args` — tool arguments |
| `tool.execute.after` | After tool completes | title, output, metadata |
| `tool.definition` | Tool definitions sent to LLM | description, parameters |
| `shell.env` | Shell command about to execute | Environment variables |

#### 5.1.3 Compaction Hooks (context preservation)

| Hook | When | What You Can Modify |
|---|---|---|
| `experimental.session.compacting` | Before LLM generates summary | `output.context` (inject additional context), `output.prompt` (replace entire prompt) |
| `experimental.compaction.autocontinue` | After compaction, before auto-continue | `output.enabled` (prevent synthetic continue message) |
| `experimental.text.complete` | Text output completed | `output.text` (modify LLM text output) |

#### 5.1.4 Session Events (monitoring, not interception)

| Event | Description |
|---|---|
| `session.created` | New session |
| `session.compacted` | After compaction completes |
| `session.deleted` | Session deleted |
| `session.error` | Error in session |
| `session.idle` | Session becomes idle |
| `session.diff` | Diff changed |
| `session.status` | Status changed |
| `session.updated` | Session properties updated |

#### 5.1.5 Other Events

| Event | Type |
|---|---|
| `message.part.removed/updated`, `message.removed/updated` | Message mutation |
| `tool.execute.before/after` | Tool lifecycle |
| `file.edited`, `file.watcher.updated` | File changes |
| `command.executed` | Command execution |
| `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` | TUI interactions |
| `permission.asked/replied` | Permission flow |
| `shell.env` | Shell environment |
| `todo.updated` | Todo state |
| `server.connected` | Server connection |

### 5.2 Custom Tools

**Source:** https://opencode.ai/docs/plugins/ [CONFIDENCE: HIGH]

Plugins can register custom tools via the `tool()` helper:
- Uses Zod schema for argument validation
- Tools appear alongside built-in tools in the LLM's tool definitions
- Plugin tools override built-in tools with the same name
- Execute function receives: `args`, `context` (sessionID, messageID, agent, directory, worktree, abort signal)

### 5.3 Event Streaming (SSE)

**Source:** https://opencode.ai/docs/sdk/ [CONFIDENCE: HIGH]

Real-time events via Server-Sent Events:
- `client.event.subscribe()` returns an async iterable stream
- First event is always `server.connected`
- Subsequent events are bus events (session state, tool calls, messages)

### 5.4 Key Interception Points for Context Continuity/Pruning

**For building a context continuity system, these are the most relevant hooks:**

| Priority | Hook | Why Important |
|---|---|---|
| **CRITICAL** | `experimental.session.compacting` | Inject or replace compaction prompt — can preserve critical context that default compaction would lose |
| **CRITICAL** | `experimental.chat.messages.transform` | Full access to the message array before it goes to the LLM — can filter, prune, or inject context |
| **HIGH** | `experimental.chat.system.transform` | Modify system prompt — can inject persistent context/instructions |
| **HIGH** | `chat.params` | Control temperature, max tokens — useful for different phases of context management |
| **MEDIUM** | `tool.execute.before` | Intercept tool calls — could add context-rotation logic |
| **LOW** | `event` hook + `session.compacted` | Monitor for post-hoc analysis |

---

## 6. Code References

### 6.1 Key Source Files in anomalyco/opencode

| File | Purpose |
|---|---|
| `packages/opencode/src/session/compaction.ts` | Compaction engine: overflow detection, pruning, summary generation, tail preservation, plugin hooks |
| `packages/opencode/src/session/overflow.ts` | Token counting, usable context calculation, `isOverflow()` check |
| `packages/opencode/src/session/processor.ts` | Session processing loop: LLM stream handling, tool execution, error recovery, compaction triggering |
| `packages/opencode/src/session/message-v2.ts` | Message types (User, Assistant, parts), `toModelMessages()` → LLM prompt conversion, `filterCompacted()` |
| `packages/opencode/src/session/prompt.ts` | Prompt assembly, system message construction, permission routing, agent loop |
| `packages/opencode/src/session/prompt/*.txt` | Provider-specific system prompt templates |
| `packages/opencode/src/session/session.ts` | Session CRUD operations |
| `packages/opencode/src/session/session.sql.ts` | SQLite schema for sessions, messages, parts |
| `packages/opencode/src/session/summary.ts` | Session summary (diff aggregation) |
| `packages/opencode/src/session/instruction.ts` | Instruction loading (AGENTS.md, CLAUDE.md) |
| `packages/opencode/src/tool/task.ts` | Task/subagent delegation tool |
| `packages/opencode/src/tool/skill.ts` | Skill loading tool |
| `packages/plugin/src/index.ts` | Plugin SDK: Hooks type interface, Plugin type, tool() helper |
| `packages/plugin/src/tool.ts` | Custom tool definition helper |
| `packages/sdk/js/src/gen/types.gen.ts` | Generated TypeScript types from OpenAPI spec |

### 6.2 Architecture Stack

| Layer | Technology |
|---|---|
| Runtime | Bun (JavaScript runtime) |
| Effect System | Effect (TypeScript functional effect system) |
| Database | SQLite via Drizzle ORM |
| LLM SDK | Vercel AI SDK (`ai` package) |
| Schema Validation | Zod (v3→v4), Effect Schema |
| HTTP Server | Bun.serve / Hono |
| State Management | Effect Context services + Bus events |
| Plugin Loading | Dynamic import of TypeScript/JavaScript modules |

---

## 7. Gaps

### 7.1 Information NOT Found

| Gap | Description | Impact |
|---|---|---|
| **Exact session-to-LLM prompt mapping** | The precise format of the final prompt sent to LLM providers is abstracted by the Vercel AI SDK's `convertToModelMessages()`. The exact text the LLM receives is provider-specific and depends on the AI SDK's conversion logic. | Cannot predict exact prompt structure without reading AI SDK source. |
| **Context budget management hooks** | No hooks exist for pre-turn context budget calculation or dynamic injection based on remaining budget. The `chat.params` hook gives control over parameters but not over message selection. | Would need to use `experimental.chat.messages.transform` as a workaround, but budget information isn't directly exposed. |
| **Session resume context loading** | Documentation does not detail what context is loaded when a session is resumed via `--continue`/`--session`. Known from Issue #5409 that resume is a "UI navigation operation that doesn't fire a bus event." | Session resume may not trigger expected lifecycle hooks. |
| **Subagent context window behavior** | No documentation on subagent's independent context window limits. Known from issues that they are stateless per invocation. | Subagents may re-read files repeatedly, wasting tokens. |
| **Tool output size limits per turn** | `TOOL_OUTPUT_MAX_CHARS` (2,000) is only applied during compaction, not during normal turns. No clear per-turn output limit documented. | Large tool outputs could consume excessive context during normal operations. |
| **Thinking/reasoning block handling** | Reasoning blocks from Claude/Gemini models are preserved as `ReasoningPart` and included in context when the same model is used. When switching models, reasoning is converted to text. | Context consumption from reasoning blocks varies by provider. |
| **Prompt caching details** | Cache read/write tokens are tracked but there's no documented mechanism for manual cache invalidation or optimization. | Cannot programmatically manage prompt caching. |
| **Message ID continuity** | Message IDs use `MessageID.ascending()` — unclear if these are globally unique or session-scoped. | Implications for cross-session context stitching. |
| **Configuration drift between branches** | PRs #10123, #15130, #15525 describe features that may or may not be merged. The main branch behavior may differ. | Need to verify exact version being used. |

### 7.2 Unresolved Questions

1. **What is the exact system prompt the LLM receives?** Depends on the provider-specific `.txt` template + agent config + instruction loading. The templates exist in the repo but assembling them requires understanding the `SessionPrompt` resolution logic.

2. **How does the `skill` tool actually inject content into context?** The skill tool loads SKILL.md content, but the mechanism for how it becomes part of the next turn's prompt is not documented in the sources reviewed.

3. **Is there any mechanism for "pinned" messages that survive compaction?** Issues #8932 and #8455 reference this as a feature request. The compaction template has tail preservation, but no general pinning mechanism exists.

4. **What happens when a parent session compacts while subagents are running?** The interaction between parent compaction and child session state is not documented.

---

## 8. Key Takeaways for Hivemind Context Continuity

### 8.1 What We Can Hook Into

1. **`experimental.session.compacting`**: Replace or augment the compaction prompt to preserve Hivemind-specific context (trajectory, session state, work contracts). This is the primary injection point.

2. **`experimental.chat.messages.transform`**: Full access to the message array. Can filter/prune/reorder messages before they reach the LLM. Key for dynamic context pruning.

3. **`experimental.chat.system.transform`**: Inject persistent system-level context about Hivemind state, work contracts, trajectory.

4. **Custom tools via `tool()`**: Register Hivemind-specific tools that agents can call to query state (session continuity, delegation records, etc.).

5. **`event` hook + `session.compacted`**: Monitor compaction events to trigger Hivemind state persistence.

### 8.2 What OpenCode Doesn't Give Us

1. **No pre-turn context budget hook**: Cannot dynamically calculate remaining budget and inject prioritized context — must use `messages.transform` as a workaround but lacks budget awareness.

2. **No built-in context pruning beyond compaction**: Compaction is the only built-in mechanism for reducing context. No per-message importance scoring or dynamic eviction.

3. **No persistent cross-session context injection**: OpenCode provides `session.summarize` (which calls an LLM) but no mechanism for programmatic, structured context injection across sessions.

4. **Session resume is a UI operation**: Resuming a session doesn't fire hooks that plugins can intercept (per Issue #5409).

### 8.3 Architectural Implications

1. **Context continuity must be compaction-aware**: The `experimental.session.compacting` hook is our best friend. We can completely replace the default compaction prompt to preserve Hivemind trajectory, work contracts, and session lineage.

2. **Message transformation is possible but fragile**: `experimental.chat.messages.transform` gives us access to the full message array, but without knowing the remaining context budget, we risk removing messages that would have fit or keeping messages that cause overflow.

3. **Subagent isolation is both a feature and a limitation**: Subagents start fresh, which means Hivemind context MUST be explicitly injected into subagent prompts. There's no "inherit parent context" mechanism.

4. **The Effect system is the backbone**: OpenCode uses Effect (functional effect system) extensively. Any Hivemind plugin needs to be compatible with this architecture — but since plugins are plain async functions returning hooks objects, direct Effect integration isn't required.

---

## Evidence Index

| Finding | Source | Evidence Level | Date Verified |
|---|---|---|---|
| Client-server architecture with HTTP/OpenAPI | opencode.ai/docs/server/ | L2 (tool-verified docs) | 2026-05-11 |
| Plugin system with hooks interface | opencode.ai/docs/plugins/ + plugin/src/index.ts | L2 (tool-verified docs + source) | 2026-05-11 |
| Compaction process with token thresholds | compaction.ts + overflow.ts | L2 (tool-verified source code) | 2026-05-11 |
| Message-to-LLM conversion via toModelMessages | message-v2.ts | L2 (tool-verified source code) | 2026-05-11 |
| Session lifecycle with prompt loop | processor.ts + prompt.ts | L3 (documented observation) | 2026-05-11 |
| Skill loading system | opencode.ai/docs/skills/ | L2 (tool-verified docs) | 2026-05-11 |
| Agent permission system | opencode.ai/docs/agents/ | L2 (tool-verified docs) | 2026-05-11 |
| Subagent isolation (stateless, fresh sessions) | GitHub Issues #2588, #5502, #11012 | L3 (documented community observation) | 2026-05-11 |
| Double-buffer compaction proposal | PR #15130 | L3 (documented observation) | 2026-05-11 |
| Compaction model selection | PR #15525 | L3 (documented observation) | 2026-05-11 |
| Tail preservation in compaction | compaction.ts (DEFAULT_TAIL_TURNS, preserveRecentBudget) | L2 (tool-verified source code) | 2026-05-11 |
| Tool output pruning | compaction.ts (PRUNE_PROTECT, PRUNE_MINIMUM) | L2 (tool-verified source code) | 2026-05-11 |
| Event streaming via SSE | opencode.ai/docs/sdk/ | L2 (tool-verified docs) | 2026-05-11 |
