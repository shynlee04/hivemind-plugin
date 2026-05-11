---
sessionID: ses_1e7ec6ad2ffeBQ5Hs8YazfaWjd
created: 2026-05-11T17:26:37.117Z
updated: 2026-05-11T17:26:37.117Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent **hm-l1-coordinator**. You are receiving a coordinated-path delegation from **hm-l0-orchestrator**.

## SITUATION

Wave 1 research is **already complete**. Two specialist researchers ran and wrote their outputs to disk:

**Input File 1:** `.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t1-opencode-docs.md`
— OpenCode SDK architecture, session lifecycle, context composition, compaction engine, plugin hooks, subagent isolation model, code references

**Input File 2:** `.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t2-ecosystem-patterns.md`
— 4 OpenCode context plugins (Magic Context, DCP, ACM, LCM), 6 npm packages, 3 research papers (RLM, SRLM, Squeez), 3 competitor deep-dives (Claude Code, Windsurf, Cursor), 30+ GitHub issues/PRs, pain points, actionable patterns

**Task Plan (for reference):** `.hivemind/research/opencode-context-architecture-2026-05-11/task_plan.md`

## YOUR TASK

Complete the remaining waves:

### WAVE 2: Analyze & Map
- Read both input files fully
- Analyze the architecture patterns — map how OpenCode's context system works end-to-end
- Identify the exact hook surface, API methods, and integration points
- Map the ecosystem plugins' approaches to a common taxonomy
- Identify contradictions, gaps, and patterns that converge across implementations

### WAVE 3: Synthesize & Report
Compress all findings into a structured research article with these sections:

1. **Executive Summary** — what was found, why it matters for Hivemind
2. **OpenCode Runtime Architecture** — client-server model, session lifecycle, context composition per LLM turn (what the LLM actually "sees")
3. **Context Window Management** — overflow detection, compaction engine (pre-flight pruning, summary generation, tail preservation, auto-continue), token tracking
4. **Plugin Hook Surface for Context Interception** — every hook relevant to context (experimental.session.compacting, experimental.chat.messages.transform, experimental.chat.system.transform, etc.) with exact signatures
5. **Subagent & Multi-Agent Context Model** — how delegations affect context, isolation model, known limitations
6. **Ecosystem Analysis** — plugin approaches categorized, competitor approaches, npm packages, research papers, what works and what doesn't
7. **Pain Points & Known Gaps** — documented issues, ecosystem gaps, research-only approaches
8. **Actionable Recommendations for Hivemind** — what APIs to use, what architecture to follow, what to avoid
9. **Source Index** — all cited URLs, repos, issues, files

Each section must include:
- Confidence levels (HIGH/MEDIUM/LOW)
- Source citations for every claim
- Gaps and unresolved questions honestly noted

## PROCESS

- Wave 2 (analysis): This can be done by reading both files yourself and mapping findings. No need to dispatch subagents for analysis if you can synthesize from the existing data.
- Wave 3 (synthesis): Write the final structured report.

## OUTPUT

Write the final report to:
**`.hivemind/research/opencode-context-architecture-2026-05-11/FINAL-REPORT.md`**

Also update the task_plan.md to mark all items complete.

## CONSTRAINTS

- The research is already gathered — DO NOT re-run web searches or re-crawl documentation
- DO NOT implement anything — this is research-only
- DO NOT modify any code or configuration files
- Report gaps honestly
- Use the evidence already collected

## SUCCESS METRICS

- [ ] FINAL-REPORT.md written with all 9 sections populated
- [ ] Every claim has confidence level + source citation
- [ ] Gaps explicitly documented
- [ ] Actionable recommendations for Hivemind context continuity system
- [ ] task_plan.md updated
- [ ] All findings committed to disk

## DELEGATION METADATA
- Path type: coordinated (final wave)
- Scope: Analysis + Synthesis only
- Output: `.hivemind/research/opencode-context-architecture-2026-05-11/FINAL-REPORT.md`
- Gate expectations: Quality check on return

Report back to hm-l0-orchestrator with completion status and report path when done.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-coordinating-loop"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-coordinating-loop
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t1-opencode-docs.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t1-opencode-docs.md</path>
<type>file</type>
<content>
1: # OpenCode Runtime Architecture: Context & Session Management Research
2: 
3: **Researcher:** hm-l2-researcher  
4: **Date:** 2026-05-11  
5: **Source Agent:** hm-l1-coordinator (delegated)  
6: **Status:** COMPLETED  
7: **Confidence:** HIGH (live-sourced, multi-validated)
8: 
9: ---
10: 
11: ## 1. Sources Found
12: 
13: | # | URL / Reference | Type | Description |
14: |---|----------------|------|-------------|
15: | 1 | https://opencode.ai/docs/ | Official Docs | Main documentation portal |
16: | 2 | https://opencode.ai/docs/sdk/ | Official Docs | SDK API reference with client methods, types, events |
17: | 3 | https://opencode.ai/docs/plugins/ | Official Docs | Plugin system, hooks, events, compaction hooks |
18: | 4 | https://opencode.ai/docs/server/ | Official Docs | HTTP server architecture, REST API, OpenAPI |
19: | 5 | https://opencode.ai/docs/agents/ | Official Docs | Agent definitions, permissions, subagent system |
20: | 6 | https://opencode.ai/docs/skills/ | Official Docs | Skill loading system, permission configuration |
21: | 7 | https://opencode.ai/docs/commands/ | Official Docs | Custom commands, shell injection, $ARGUMENTS |
22: | 8 | https://opencode.ai/docs/config/ | Official Docs | Config hierarchy, compaction config |
23: | 9 | https://github.com/anomalyco/opencode | Source Code | Main repo (157K+ stars, TypeScript) |
24: | 10 | `packages/opencode/src/session/compaction.ts` | Source Code | Context compaction engine (Effect/TypeScript) |
25: | 11 | `packages/opencode/src/session/overflow.ts` | Source Code | Overflow detection, token threshold calculation |
26: | 12 | `packages/opencode/src/session/processor.ts` | Source Code | Session processor: LLM stream, tool execution, compaction trigger |
27: | 13 | `packages/opencode/src/session/message-v2.ts` | Source Code | Message-to-LLM-prompt conversion, filtering, parts |
28: | 14 | `packages/opencode/src/session/prompt.ts` | Source Code | Prompt assembly, system messages, permission routing |
29: | 15 | `packages/opencode/src/session/prompt/` | Source Code | Provider-specific prompt templates (.txt files) |
30: | 16 | `packages/plugin/src/index.ts` | Source Code | Plugin SDK: Hooks interface, types, tool() helper |
31: | 17 | https://opencode.ai/docs/custom-tools/ | Official Docs | Custom tools with Zod schemas |
32: | 18 | https://mintlify.com/anomalyco/opencode/sdk/plugin-api | Third-party | Plugin API reference (mirror) |
33: | 19 | https://forums.basehub.com/anomalyco/opencode/20 | Community | Deep analysis of compaction process |
34: | 20 | https://dev.to/einarcesar/does-opencode-support-hooks-a-complete-guide-to-extensibility-k3p | Blog | Comprehensive hooks overview |
35: | 21 | GitHub Issues #5409, #12110, #14164, #16512 | Issues | Session lifecycle hooks, compaction improvements, context preservation |
36: | 22 | GitHub PRs #10123, #12924, #14662, #15130, #15525 | PRs | Configurable thresholds, compaction models, double-buffer |
37: | 23 | https://github.com/anomalyco/opencode/issues/2588 | Issue | Subagent context inheritance |
38: | 24 | https://github.com/anomalyco/opencode/issues/5502 | Issue | Subagent isolation behavior |
39: | 25 | https://deepwiki.com/anomalyco/opencode | DeepWiki | AI-powered repo documentation |
40: 
41: ---
42: 
43: ## 2. OpenCode SDK & Architecture
44: 
45: ### 2.1 Client-Server Architecture
46: 
47: **Source:** https://opencode.ai/docs/server/ [CONFIDENCE: HIGH]
48: 
49: OpenCode uses a **client-server architecture** with a headless HTTP server that exposes an OpenAPI 3.1 endpoint:
50: 
51: - **Server**: `opencode serve [--port <number>]` starts on port `4096` by default
52: - **TUI**: The terminal interface is a **client** that talks to the server
53: - **SDK**: `@opencode-ai/sdk` provides a type-safe JS/TS client
54: - **Plugin**: `@opencode-ai/plugin` provides the hook/tool registration SDK
55: - **OpenAPI**: Spec published at `http://<hostname>:<port>/doc`
56: 
57: ```
58: ┌─────────────────────────────────────────────────────────┐
59: │  TUI (Terminal Client)  │  IDE Client  │  Web Client    │
60: └────────────┬─────────────┴──────┬───────┴──────┬────────┘
61:              │                    │              │
62:              ▼                    ▼              ▼
63:         ┌─────────────────────────────────────────────┐
64:         │         HTTP Server (port 4096)             │
65:         │         OpenAPI 3.1 Spec                    │
66:         │         SSE Event Stream                    │
67:         └──────────────┬──────────────────────────────┘
68:                        │
69:                        ▼
70:         ┌─────────────────────────────────────────────┐
71:         │    Session Engine (Effect/TypeScript)       │
72:         │    - Session Prompt Loop                    │
73:         │    - Context Compaction                     │
74:         │    - Tool Execution                         │
75:         │    - Permission System                      │
76:         └─────────────────────────────────────────────┘
77: ```
78: 
79: ### 2.2 SDK API Surface
80: 
81: **Source:** https://opencode.ai/docs/sdk/ [CONFIDENCE: HIGH]
82: 
83: Key SDK operations relevant to context management:
84: 
85: | Method | Description |
86: |---|---|
87: | `session.prompt({ path, body })`, `body.noReply: true` | Inject context without AI response |
88: | `session.messages({ path })` | List all messages + parts in a session |
89: | `session.message({ path })` | Get single message details |
90: | `session.summarize({ path, body })` | Summarize session |
91: | `session.revert({ path, body })` | Revert a message |
92: | `session.unrevert({ path })` | Restore reverted messages |
93: | `session.list()` | List all sessions |
94: | `session.children({ path })` | List child/subagent sessions |
95: | `session.update({ path, body })` | Update session properties |
96: | `event.subscribe()` | SSE event stream (real-time) |
97: 
98: ### 2.3 Plugin Registration
99: 
100: **Source:** https://opencode.ai/docs/plugins/ [CONFIDENCE: HIGH]
101: 
102: Plugins are loaded in order:
103: 1. Global config (`~/.config/opencode/opencode.json`)
104: 2. Project config (`opencode.json`)
105: 3. Global plugin directory (`~/.config/opencode/plugins/`)
106: 4. Project plugin directory (`.opencode/plugins/`)
107: 
108: npm packages specified in `opencode.json` under `"plugin": [...]` are auto-installed via Bun at startup.
109: 
110: ---
111: 
112: ## 3. Session & Context Management
113: 
114: ### 3.1 Session Lifecycle
115: 
116: **Source:** `packages/opencode/src/session/prompt.ts`, `packages/opencode/src/session/processor.ts` [CONFIDENCE: HIGH]
117: 
118: The session lifecycle follows this flow:
119: 
120: ```
121: User Prompt → SessionPrompt.prompt()
122:   ├─ Create user message (MessageV2.User)
123:   ├─ Update session permissions
124:   ├─ SessionPrompt.loop() → iterative agent loop
125:   │   ├─ Request LLM completion via LLM.stream()
126:   │   ├─ Process stream events (text, tool calls, reasoning)
127:   │   ├─ Execute tools via ToolRegistry.Service
128:   │   ├─ Check overflow: isOverflow(tokens, model)
129:   │   │   └─ If overflow → trigger compaction
130:   │   └─ Return "continue" | "compact" | "stop"
131:   ├─ SessionSummary.summarize() → calculate changes
132:   └─ Session persists to SQLite (via Drizzle ORM)
133: ```
134: 
135: **Parent-Child Session Model:** Sessions form a tree via `parentID`. Subagent invocations create child sessions. The TUI supports hierarchical navigation (up/down between levels, left/right among siblings).
136: 
137: ### 3.2 How Context Is Composed for Each LLM Turn
138: 
139: **Source:** `packages/opencode/src/session/message-v2.ts → toModelMessages()` [CONFIDENCE: HIGH]
140: 
141: The LLM "sees" a context composed from these sources:
142: 
143: 1. **System Prompts** — assembled from:
144:    - Agent-specific prompt (from agent definition)
145:    - Provider-specific prompt templates (e.g., `anthropic.txt`, `gpt.txt`, `codex.txt`)
146:    - Custom system prompt from the last user message
147:    - Plugin transformations via `experimental.chat.system.transform` hook
148: 
149: 2. **Conversation History** — `MessageV2.WithParts[]` converted to provider-specific format via `toModelMessages()`:
150:    - **User messages**: text parts, file attachments (media), compaction markers, subtask markers
151:    - **Assistant messages**: text parts, reasoning blocks, tool calls (with input/output/error), step markers
152:    - **Compact-compacted tool outputs**: Pruned to `"[Old tool result content cleared]"` or truncated to `TOOL_OUTPUT_MAX_CHARS` (2,000 chars during compaction)
153:    - **Media handling**: For providers that don't support media in tool results, media is extracted and injected as a separate synthetic user message
154: 
155: 3. **Tool Definitions** — resolved by `SessionPrompt.resolveTools()`, including plugin-registered custom tools
156: 
157: 4. **Model Options** — temperature, topP, maxOutputTokens merged from model capabilities, agent config, provider transforms
158: 
159: 5. **Filtering Rules**:
160:    - `filterCompacted()`: After compaction, history is truncated at the compaction summary; messages before it are excluded
161:    - Failed assistant messages (with errors) are skipped unless they contain meaningful parts
162:    - `step-start` parts are filtered out before sending to the LLM
163:    - Messages from a different model/provider have their provider metadata stripped
164: 
165: ### 3.3 Context Overflow & Compaction
166: 
167: **Source:** `packages/opencode/src/session/compaction.ts`, `packages/opencode/src/session/overflow.ts` [CONFIDENCE: HIGH]
168: 
169: #### 3.3.1 Overflow Detection (`overflow.ts`)
170: 
171: ```typescript
172: // Usable context = model's context limit - output buffer - reserved space
173: export function usable(input) {
174:   const reserved = cfg.compaction?.reserved ?? Math.min(20000, maxOutputTokens)
175:   return input.model.limit.input
176:     ? Math.max(0, input.model.limit.input - reserved)
177:     : Math.max(0, context - maxOutputTokens)
178: }
179: 
180: // Overflow = token count >= usable context
181: export function isOverflow(input) {
182:   if (cfg.compaction?.auto === false) return false
183:   const count = tokens.total || tokens.input + tokens.output + tokens.cache.read
184:   return count >= usable(input)
185: }
186: ```
187: 
188: - **Default buffer**: 20,000 tokens reserved for compaction headroom
189: - **Disabled with**: `compaction.auto: false` in opencode.json (but ONLY prevents proactive checks — provider-level overflow errors still trigger compaction in current code)
190: - **Per-model override**: `compaction.models` allows model-specific thresholds
191: - **Configurable thresholds**: `compaction.token_threshold` (absolute) and `compaction.context_threshold` (ratio), both per-model-aware (PR #10123)
192: 
193: #### 3.3.2 Compaction Process (`compaction.ts`)
194: 
195: ```
196: 1. PRE-CHECK: Before sending user prompt, check if previous response overflowed
197: 2. POST-CHECK: After assistant response, check token usage → if overflow, mark needsCompaction
198: 3. COMPACTION:
199:    a. Create user message with CompactionPart (mode: "compaction", auto: true/false)
200:    b. Select messages to include (exclude already-compacted if using tail_start_id)
201:    c. Build compaction prompt: "Create an anchored summary..." + structured template
202:    d. Allow plugins to inject context or replace prompt (experimental.session.compacting)
203:    e. Allow plugins to transform messages (experimental.chat.messages.transform)
204:    f. Convert to model format, strip media, truncate tool outputs to 2,000 chars
205:    g. Send to dedicated "compaction" agent (no tools)
206:    h. If successful, publish session.compacted event
207:    i. Auto-continue: inject synthetic user message "Continue if you have next steps..."
208: ```
209: 
210: **Compaction Summary Template** (hardcoded in compaction.ts):
211: ```
212: ## Goal
213: ## Constraints & Preferences
214: ## Progress (Done / In Progress / Blocked)
215: ## Key Decisions
216: ## Next Steps
217: ## Critical Context
218: ## Relevant Files
219: ```
220: 
221: Note: The template was expanded to 8 sections in PR #14662 to improve fidelity.
222: 
223: #### 3.3.3 Token Tracking
224: 
225: Tokens are tracked per-assistant-message via the `MessageV2.Assistant.tokens` field:
226: - `input`: Input tokens used
227: - `output`: Output tokens generated
228: - `reasoning`: Thinking/reasoning tokens
229: - `cache.read` / `cache.write`: Prompt caching stats
230: - `total`: Provider-reported total (preferred over sum when available)
231: 
232: #### 3.3.4 Tool Output Pruning (`compaction.ts:prune()`)
233: 
234: Before compaction runs, a separate pruning pass:
235: - **Protects**: Most recent ~40,000 tokens of tool outputs
236: - **Protects**: `skill` tool outputs (always preserved)
237: - **Minimum**: Only prunes if >20,000 tokens of tool output is eligible
238: - **Preserves**: At least 2 user turns before pruning
239: - **Mechanism**: Marks old tool parts with `state.time.compacted`, which causes output to render as `"[Old tool result content cleared]"`
240: - **Max chars during compaction**: Tool outputs are truncated to `TOOL_OUTPUT_MAX_CHARS` (2,000) when building compaction context
241: 
242: #### 3.3.5 Tail Preservation
243: 
244: Recent messages are preserved by the `select()` function:
245: - Default: 2 tail turns preserved (configurable via `compaction.tail_turns`)
246: - Budget: 2,000–8,000 tokens for preserved recent messages (or 25% of usable context)
247: - Preserved messages are included after compaction summary via `tail_start_id` in CompactionPart
248: 
249: ### 3.4 Double-Buffer Compaction (PR #15130)
250: 
251: A two-phase strategy proposed to improve quality:
252: 1. **Checkpoint phase** (~50%): Background compaction generates summary, stored in per-session state
253: 2. **Concurrent phase** (50-75%): Normal operation continues
254: 3. **Swap phase** (~75%): Uses pre-computed summary instead of stop-the-world compaction
255: 
256: ### 3.5 Compaction Model Selection
257: 
258: **Source:** PR #15525 [CONFIDENCE: MEDIUM]
259: 
260: Users can use a different model for compaction than for chat:
261: - Config: `agent.compaction.model` (static)
262: - TUI: Runtime switching via `/compaction-models` or command menu
263: - Resolution: TUI selection > config > session model
264: 
265: ### 3.6 Session Persistence
266: 
267: **Source:** `packages/opencode/src/session/session.sql.ts` [CONFIDENCE: MEDIUM]
268: 
269: Sessions and messages are persisted to SQLite via Drizzle ORM:
270: - `SessionTable`: session metadata, parentID, project, workspace
271: - `MessageTable`: message ID, session ID, role, time created, data (JSON)
272: - `PartTable`: part ID, message ID, session ID, data (JSON)
273: 
274: ---
275: 
276: ## 4. Agent Profiles & Primitives
277: 
278: ### 4.1 Agent Types
279: 
280: **Source:** https://opencode.ai/docs/agents/ [CONFIDENCE: HIGH]
281: 
282: Two agent types:
283: - **Primary agents**: Direct user interaction (Build, Plan). Shown in TUI, cycled with Tab.
284: - **Subagents**: Invoked by primary agents via `@agent-name` or Task tool. (General, Explore, Scout)
285: 
286: ### 4.2 Agent Configuration
287: 
288: Agents can be defined in two ways:
289: 1. **YAML frontmatter Markdown files**: `.opencode/agents/*.md` or `~/.config/opencode/agents/*.md`
290: 2. **JSON in opencode.json**: Under `"agent"` key
291: 
292: Key configuration options affecting context:
293: | Option | Effect |
294: |---|---|
295: | `model` | Override the LLM model (different context windows, costs) |
296: | `permission` | Control which tools are available → affects what enters context |
297: | `mode` | "primary" or "subagent" (or both) |
298: | `permission.task` | Which subagents can be invoked (glob patterns) |
299: | `permission.skill` | Which skills can be loaded |
300: | `tools` | Enable/disable specific tools per agent |
301: 
302: ### 4.3 Skills System
303: 
304: **Source:** https://opencode.ai/docs/skills/ [CONFIDENCE: HIGH]
305: 
306: Skills are loaded **on-demand** via the native `skill` tool:
307: - Agent sees available skills listed in the `skill` tool description
308: - Agent calls `skill({ name: "skill-name" })` to load the full SKILL.md content
309: - Loaded skill content becomes part of the agent's next turn context
310: - Skills are searched in: `.opencode/skills/`, `.claude/skills/`, `.agents/skills/`, `~/.config/opencode/skills/`
311: - Permission-controlled via `permission.skill` (allow/deny/ask) with wildcard patterns
312: 
313: ### 4.4 Commands System
314: 
315: **Source:** https://opencode.ai/docs/commands/ [CONFIDENCE: HIGH]
316: 
317: Custom commands defined as markdown files in `.opencode/commands/`:
318: - Support `$ARGUMENTS` placeholder for argument passing
319: - Support `!command` for shell output injection
320: - Support `@filename` for file reference injection
321: - Can specify `agent`, `model`, `subtask` per command
322: - `subtask: true` forces subagent invocation → isolates command context from parent
323: - Context injection: file contents + shell output + arguments become part of the prompt
324: 
325: ### 4.5 Subagent Delegation & Context Isolation
326: 
327: **Source:** GitHub Issues #2588, #5502, #11012, PR #7756 [CONFIDENCE: MEDIUM]
328: 
329: Subagent context characteristics:
330: - **Default**: Subagents are **stateless** — each invocation creates a new, isolated child session with only the task prompt
331: - **Isolation**: Subagents do NOT inherit the parent agent's conversation history
332: - **Parent persistence**: Parent agent's context window is NOT consumed by subagent execution (child sessions have separate context windows)
333: - **Session tree**: Sessions form a hierarchy via `parentID`; depth limit is configurable (default: 5 levels)
334: - **Task budget**: Configurable `task_budget` per agent to prevent infinite delegation loops
335: - **Permission isolation**: Subagents have their own permission ruleset (merged from subagent definition + child session)
336: - **Known limitation**: Subagent permissions may not inherit parent agent's permissions correctly (Issue #12566)
337: - **Known limitation**: Sessions cannot be automatically resumed across calls unless `session_id` is provided
338: - **Feature request** (#2588): "Fork" mode for subagents to inherit parent context instead of spawning fresh
339: 
340: ---
341: 
342: ## 5. Context Pruning & Interception
343: 
344: ### 5.1 Plugin Hook System
345: 
346: **Source:** https://opencode.ai/docs/plugins/ and `packages/plugin/src/index.ts` [CONFIDENCE: HIGH]
347: 
348: The complete Hooks interface available to plugins:
349: 
350: #### 5.1.1 Chat/Context Hooks (DIRECT context interception)
351: 
352: | Hook | When | What You Can Modify |
353: |---|---|---|
354: | `chat.message` | New message received | `output.message` (UserMessage), `output.parts` |
355: | `chat.params` | LLM parameters being built | temperature, topP, topK, maxOutputTokens, options |
356: | `chat.headers` | HTTP headers for LLM request | Custom headers |
357: | `experimental.chat.messages.transform` | Messages being sent to LLM | `output.messages` — the FULL message array |
358: | `experimental.chat.system.transform` | System prompt being assembled | `output.system` — array of system strings |
359: 
360: #### 5.1.2 Tool Execution Hooks
361: 
362: | Hook | When | What You Can Modify |
363: |---|---|---|
364: | `tool.execute.before` | Before tool runs | `output.args` — tool arguments |
365: | `tool.execute.after` | After tool completes | title, output, metadata |
366: | `tool.definition` | Tool definitions sent to LLM | description, parameters |
367: | `shell.env` | Shell command about to execute | Environment variables |
368: 
369: #### 5.1.3 Compaction Hooks (context preservation)
370: 
371: | Hook | When | What You Can Modify |
372: |---|---|---|
373: | `experimental.session.compacting` | Before LLM generates summary | `output.context` (inject additional context), `output.prompt` (replace entire prompt) |
374: | `experimental.compaction.autocontinue` | After compaction, before auto-continue | `output.enabled` (prevent synthetic continue message) |
375: | `experimental.text.complete` | Text output completed | `output.text` (modify LLM text output) |
376: 
377: #### 5.1.4 Session Events (monitoring, not interception)
378: 
379: | Event | Description |
380: |---|---|
381: | `session.created` | New session |
382: | `session.compacted` | After compaction completes |
383: | `session.deleted` | Session deleted |
384: | `session.error` | Error in session |
385: | `session.idle` | Session becomes idle |
386: | `session.diff` | Diff changed |
387: | `session.status` | Status changed |
388: | `session.updated` | Session properties updated |
389: 
390: #### 5.1.5 Other Events
391: 
392: | Event | Type |
393: |---|---|
394: | `message.part.removed/updated`, `message.removed/updated` | Message mutation |
395: | `tool.execute.before/after` | Tool lifecycle |
396: | `file.edited`, `file.watcher.updated` | File changes |
397: | `command.executed` | Command execution |
398: | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` | TUI interactions |
399: | `permission.asked/replied` | Permission flow |
400: | `shell.env` | Shell environment |
401: | `todo.updated` | Todo state |
402: | `server.connected` | Server connection |
403: 
404: ### 5.2 Custom Tools
405: 
406: **Source:** https://opencode.ai/docs/plugins/ [CONFIDENCE: HIGH]
407: 
408: Plugins can register custom tools via the `tool()` helper:
409: - Uses Zod schema for argument validation
410: - Tools appear alongside built-in tools in the LLM's tool definitions
411: - Plugin tools override built-in tools with the same name
412: - Execute function receives: `args`, `context` (sessionID, messageID, agent, directory, worktree, abort signal)
413: 
414: ### 5.3 Event Streaming (SSE)
415: 
416: **Source:** https://opencode.ai/docs/sdk/ [CONFIDENCE: HIGH]
417: 
418: Real-time events via Server-Sent Events:
419: - `client.event.subscribe()` returns an async iterable stream
420: - First event is always `server.connected`
421: - Subsequent events are bus events (session state, tool calls, messages)
422: 
423: ### 5.4 Key Interception Points for Context Continuity/Pruning
424: 
425: **For building a context continuity system, these are the most relevant hooks:**
426: 
427: | Priority | Hook | Why Important |
428: |---|---|---|
429: | **CRITICAL** | `experimental.session.compacting` | Inject or replace compaction prompt — can preserve critical context that default compaction would lose |
430: | **CRITICAL** | `experimental.chat.messages.transform` | Full access to the message array before it goes to the LLM — can filter, prune, or inject context |
431: | **HIGH** | `experimental.chat.system.transform` | Modify system prompt — can inject persistent context/instructions |
432: | **HIGH** | `chat.params` | Control temperature, max tokens — useful for different phases of context management |
433: | **MEDIUM** | `tool.execute.before` | Intercept tool calls — could add context-rotation logic |
434: | **LOW** | `event` hook + `session.compacted` | Monitor for post-hoc analysis |
435: 
436: ---
437: 
438: ## 6. Code References
439: 
440: ### 6.1 Key Source Files in anomalyco/opencode
441: 
442: | File | Purpose |
443: |---|---|
444: | `packages/opencode/src/session/compaction.ts` | Compaction engine: overflow detection, pruning, summary generation, tail preservation, plugin hooks |
445: | `packages/opencode/src/session/overflow.ts` | Token counting, usable context calculation, `isOverflow()` check |
446: | `packages/opencode/src/session/processor.ts` | Session processing loop: LLM stream handling, tool execution, error recovery, compaction triggering |
447: | `packages/opencode/src/session/message-v2.ts` | Message types (User, Assistant, parts), `toModelMessages()` → LLM prompt conversion, `filterCompacted()` |
448: | `packages/opencode/src/session/prompt.ts` | Prompt assembly, system message construction, permission routing, agent loop |
449: | `packages/opencode/src/session/prompt/*.txt` | Provider-specific system prompt templates |
450: | `packages/opencode/src/session/session.ts` | Session CRUD operations |
451: | `packages/opencode/src/session/session.sql.ts` | SQLite schema for sessions, messages, parts |
452: | `packages/opencode/src/session/summary.ts` | Session summary (diff aggregation) |
453: | `packages/opencode/src/session/instruction.ts` | Instruction loading (AGENTS.md, CLAUDE.md) |
454: | `packages/opencode/src/tool/task.ts` | Task/subagent delegation tool |
455: | `packages/opencode/src/tool/skill.ts` | Skill loading tool |
456: | `packages/plugin/src/index.ts` | Plugin SDK: Hooks type interface, Plugin type, tool() helper |
457: | `packages/plugin/src/tool.ts` | Custom tool definition helper |
458: | `packages/sdk/js/src/gen/types.gen.ts` | Generated TypeScript types from OpenAPI spec |
459: 
460: ### 6.2 Architecture Stack
461: 
462: | Layer | Technology |
463: |---|---|
464: | Runtime | Bun (JavaScript runtime) |
465: | Effect System | Effect (TypeScript functional effect system) |
466: | Database | SQLite via Drizzle ORM |
467: | LLM SDK | Vercel AI SDK (`ai` package) |
468: | Schema Validation | Zod (v3→v4), Effect Schema |
469: | HTTP Server | Bun.serve / Hono |
470: | State Management | Effect Context services + Bus events |
471: | Plugin Loading | Dynamic import of TypeScript/JavaScript modules |
472: 
473: ---
474: 
475: ## 7. Gaps
476: 
477: ### 7.1 Information NOT Found
478: 
479: | Gap | Description | Impact |
480: |---|---|---|
481: | **Exact session-to-LLM prompt mapping** | The precise format of the final prompt sent to LLM providers is abstracted by the Vercel AI SDK's `convertToModelMessages()`. The exact text the LLM receives is provider-specific and depends on the AI SDK's conversion logic. | Cannot predict exact prompt structure without reading AI SDK source. |
482: | **Context budget management hooks** | No hooks exist for pre-turn context budget calculation or dynamic injection based on remaining budget. The `chat.params` hook gives control over parameters but not over message selection. | Would need to use `experimental.chat.messages.transform` as a workaround, but budget information isn't directly exposed. |
483: | **Session resume context loading** | Documentation does not detail what context is loaded when a session is resumed via `--continue`/`--session`. Known from Issue #5409 that resume is a "UI navigation operation that doesn't fire a bus event." | Session resume may not trigger expected lifecycle hooks. |
484: | **Subagent context window behavior** | No documentation on subagent's independent context window limits. Known from issues that they are stateless per invocation. | Subagents may re-read files repeatedly, wasting tokens. |
485: | **Tool output size limits per turn** | `TOOL_OUTPUT_MAX_CHARS` (2,000) is only applied during compaction, not during normal turns. No clear per-turn output limit documented. | Large tool outputs could consume excessive context during normal operations. |
486: | **Thinking/reasoning block handling** | Reasoning blocks from Claude/Gemini models are preserved as `ReasoningPart` and included in context when the same model is used. When switching models, reasoning is converted to text. | Context consumption from reasoning blocks varies by provider. |
487: | **Prompt caching details** | Cache read/write tokens are tracked but there's no documented mechanism for manual cache invalidation or optimization. | Cannot programmatically manage prompt caching. |
488: | **Message ID continuity** | Message IDs use `MessageID.ascending()` — unclear if these are globally unique or session-scoped. | Implications for cross-session context stitching. |
489: | **Configuration drift between branches** | PRs #10123, #15130, #15525 describe features that may or may not be merged. The main branch behavior may differ. | Need to verify exact version being used. |
490: 
491: ### 7.2 Unresolved Questions
492: 
493: 1. **What is the exact system prompt the LLM receives?** Depends on the provider-specific `.txt` template + agent config + instruction loading. The templates exist in the repo but assembling them requires understanding the `SessionPrompt` resolution logic.
494: 
495: 2. **How does the `skill` tool actually inject content into context?** The skill tool loads SKILL.md content, but the mechanism for how it becomes part of the next turn's prompt is not documented in the sources reviewed.
496: 
497: 3. **Is there any mechanism for "pinned" messages that survive compaction?** Issues #8932 and #8455 reference this as a feature request. The compaction template has tail preservation, but no general pinning mechanism exists.
498: 
499: 4. **What happens when a parent session compacts while subagents are running?** The interaction between parent compaction and child session state is not documented.
500: 
501: ---
502: 
503: ## 8. Key Takeaways for Hivemind Context Continuity
504: 
505: ### 8.1 What We Can Hook Into
506: 
507: 1. **`experimental.session.compacting`**: Replace or augment the compaction prompt to preserve Hivemind-specific context (trajectory, session state, work contracts). This is the primary injection point.
508: 
509: 2. **`experimental.chat.messages.transform`**: Full access to the message array. Can filter/prune/reorder messages before they reach the LLM. Key for dynamic context pruning.
510: 
511: 3. **`experimental.chat.system.transform`**: Inject persistent system-level context about Hivemind state, work contracts, trajectory.
512: 
513: 4. **Custom tools via `tool()`**: Register Hivemind-specific tools that agents can call to query state (session continuity, delegation records, etc.).
514: 
515: 5. **`event` hook + `session.compacted`**: Monitor compaction events to trigger Hivemind state persistence.
516: 
517: ### 8.2 What OpenCode Doesn't Give Us
518: 
519: 1. **No pre-turn context budget hook**: Cannot dynamically calculate remaining budget and inject prioritized context — must use `messages.transform` as a workaround but lacks budget awareness.
520: 
521: 2. **No built-in context pruning beyond compaction**: Compaction is the only built-in mechanism for reducing context. No per-message importance scoring or dynamic eviction.
522: 
523: 3. **No persistent cross-session context injection**: OpenCode provides `session.summarize` (which calls an LLM) but no mechanism for programmatic, structured context injection across sessions.
524: 
525: 4. **Session resume is a UI operation**: Resuming a session doesn't fire hooks that plugins can intercept (per Issue #5409).
526: 
527: ### 8.3 Architectural Implications
528: 
529: 1. **Context continuity must be compaction-aware**: The `experimental.session.compacting` hook is our best friend. We can completely replace the default compaction prompt to preserve Hivemind trajectory, work contracts, and session lineage.
530: 
531: 2. **Message transformation is possible but fragile**: `experimental.chat.messages.transform` gives us access to the full message array, but without knowing the remaining context budget, we risk removing messages that would have fit or keeping messages that cause overflow.
532: 
533: 3. **Subagent isolation is both a feature and a limitation**: Subagents start fresh, which means Hivemind context MUST be explicitly injected into subagent prompts. There's no "inherit parent context" mechanism.
534: 
535: 4. **The Effect system is the backbone**: OpenCode uses Effect (functional effect system) extensively. Any Hivemind plugin needs to be compatible with this architecture — but since plugins are plain async functions returning hooks objects, direct Effect integration isn't required.
536: 
537: ---
538: 
539: ## Evidence Index
540: 
541: | Finding | Source | Evidence Level | Date Verified |
542: |---|---|---|---|
543: | Client-server architecture with HTTP/OpenAPI | opencode.ai/docs/server/ | L2 (tool-verified docs) | 2026-05-11 |
544: | Plugin system with hooks interface | opencode.ai/docs/plugins/ + plugin/src/index.ts | L2 (tool-verified docs + source) | 2026-05-11 |
545: | Compaction process with token thresholds | compaction.ts + overflow.ts | L2 (tool-verified source code) | 2026-05-11 |
546: | Message-to-LLM conversion via toModelMessages | message-v2.ts | L2 (tool-verified source code) | 2026-05-11 |
547: | Session lifecycle with prompt loop | processor.ts + prompt.ts | L3 (documented observation) | 2026-05-11 |
548: | Skill loading system | opencode.ai/docs/skills/ | L2 (tool-verified docs) | 2026-05-11 |
549: | Agent permission system | opencode.ai/docs/agents/ | L2 (tool-verified docs) | 2026-05-11 |
550: | Subagent isolation (stateless, fresh sessions) | GitHub Issues #2588, #5502, #11012 | L3 (documented community observation) | 2026-05-11 |
551: | Double-buffer compaction proposal | PR #15130 | L3 (documented observation) | 2026-05-11 |
552: | Compaction model selection | PR #15525 | L3 (documented observation) | 2026-05-11 |
553: | Tail preservation in compaction | compaction.ts (DEFAULT_TAIL_TURNS, preserveRecentBudget) | L2 (tool-verified source code) | 2026-05-11 |
554: | Tool output pruning | compaction.ts (PRUNE_PROTECT, PRUNE_MINIMUM) | L2 (tool-verified source code) | 2026-05-11 |
555: | Event streaming via SSE | opencode.ai/docs/sdk/ | L2 (tool-verified docs) | 2026-05-11 |

(End of file - total 555 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .hivemind/:** Directory count verified at 11 subdirectories. Q6 canonical state root boundary unchanged.  
**Next work affecting .hivemind/:** CP-ST-01 (Session Tracker Revamp) will add `.hivemind/session-tracker/` as a new persistence root.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t2-ecosystem-patterns.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t2-ecosystem-patterns.md</path>
<type>file</type>
<content>
1: # Wave 1 / Task 2: Ecosystem Patterns — Context Management for OpenCode & AI Coding Agents
2: 
3: **Agent:** hm-l2-researcher (delegated by hm-l1-coordinator)
4: **Date:** 2026-05-11
5: **Research archetype:** Technology Scan + Competitive Audit
6: **Search window:** Live searches via Exa, Tavily, GitHub Issues API, DeepWiki
7: **Live source ratio:** 100% (all findings from live MCP tools, not cached assets)
8: 
9: ---
10: 
11: ## 1. Ecosystem Projects
12: 
13: ### 1.1 OpenCode-Specific Plugins/Extensions
14: 
15: #### Magic Context (`cortexkit/opencode-magic-context`)
16: - **URL:** https://github.com/cortexkit/opencode-magic-context
17: - **Status:** Active (last updated 2026-04-14 fork: bf-frieder/opencode-magic-context)
18: - **Confidence:** HIGH
19: - **What it does:** Cache-aware "infinite context" plugin for OpenCode and Pi coding agents. Background historian model compresses older conversation while main agent keeps working. Cross-session project memory with SQLite storage. Requires disabling OpenCode's built-in compaction (`compaction.auto: false, compaction.prune: false`) to prevent conflicts.
20: - **Key patterns:**
21:   - Background historian (deferred compaction)
22:   - Cache-aware operations (avoids Anthropic prompt cache invalidation)
23:   - Cross-session memory persistence to SQLite
24:   - `/ctx-status`, `/ctx-flush`, `/ctx-recomp`, `/ctx-aug`, `/ctx-dream` commands
25:   - Conflict detection on startup (warns about built-in compaction, DCP plugin conflicts)
26:   - Desktop app companion with live sidebar (context breakdown bar)
27: - **Architecture:** Listens to OpenCode events, maintains state in `magic-context.jsonc`, separate SQLite DB for memories/embeddings/dreams
28: 
29: #### Dynamic Context Pruning (`Opencode-DCP/opencode-dynamic-context-pruning`)
30: - **URL:** https://github.com/Opencode-DCP/opencode-dynamic-context-pruning
31: - **Status:** Active
32: - **Confidence:** HIGH
33: - **What it does:** Automatically reduces token usage by managing conversation context. Session history is never modified — DCP replaces pruned content with placeholders before sending to LLM. Exposes a `compress` tool that the model can call to replace closed, stale conversation content with high-fidelity technical summaries.
34: - **Key patterns:**
35:   - Model-triggered compression (not threshold-based)
36:   - "Compress" tool — model picks when to activate based on task completion
37:   - Per-message or range-based compression (`compress.mode`)
38:   - `/dcp sweep`, `/dcp context`, `/dcp stats`, `/dcp compress` commands
39:   - `protectedFilePatterns`, `protectedTools` for critical content
40:   - Manual mode override (`manualMode.enabled`)
41:   - `turnProtection` — doesn't prune for N turns after tool invocation
42:   - Experimental subagent support (`allowSubAgents`)
43: 
44: #### ACM — Sliding Window Context Management (`rickross/opencode-acm`)
45: - **URL:** https://github.com/rickross/opencode-acm (converted to plugin from fork)
46: - **Related issue:** https://github.com/anomalyco/opencode/issues/4659 (45 reactions, 25 comments)
47: - **Status:** Active (rewritten as plugin for stock OpenCode 1.3.11+)
48: - **Confidence:** HIGH
49: - **What it does:** Battle-tested sliding window context management from months of production use. Core concepts:
50:   - **Sliding window:** Nothing is deleted — user marks a "compaction boundary" and everything after stays active
51:   - **Inception messages:** Messages marked `preserve: true` survive ALL compactions (architectural decisions, constraints, key requirements)
52:   - **Chess-clock auto-pruning:** Measures active conversation time, not wall-clock time. `keep_active_minutes=30, gap_threshold=60` configuration
53:   - **Heuristic pruning:** Priority levels 1-10; system makes smart decisions at capacity pressure
54:   - **External management CLI:** Inspect/manage sessions without consuming tokens
55:   - **Results:** 3-5x longer sessions, zero rebuild time
56: - **Tools provided:** `acm_preserve`, `acm_prune`, `acm_compact`, `acm_diagnose`, `acm_repair`
57: 
58: #### LCM — Lossless Context Memory (`plutarch01/opencode-lcm`)
59: - **URL:** https://github.com/plutarch01/opencode-lcm
60: - **Status:** Early community plugin
61: - **Confidence:** MEDIUM
62: - **What it does:** Transparent long-memory plugin based on LCM research by Voltropy. Captures older session context outside the active prompt, compresses into searchable summaries/artifacts, and automatically recalls relevant details when needed.
63: - **Key patterns:**
64:   - SQLite FTS5 for full-text search across archived messages
65:   - Deterministic summary nodes for archived turns
66:   - TF-IDF weighted retrieval with bigram phrase queries
67:   - Session lineage tracking (parent/root relationships for branched sessions)
68:   - Artifact externalization with deduplicated storage
69:   - `experimental.chat.messages.transform` hook for prompt injection
70:   - Context-mode interop to reduce tool-output token waste
71:   - 16 dedicated tools (`lcm_grep`, `lcm_resume`, `lcm_describe`, `lcm_lineage`, etc.)
72: 
73: #### `/context` command (PR #24210, anomalyco/opencode)
74: - **URL:** https://github.com/anomalyco/opencode/pull/24210
75: - **Status:** Open PR (contributor label)
76: - **Confidence:** HIGH
77: - **What it does:** Adds a `/context` slash command showing authoritative token numbers (current/usable with colored bar), system prompt breakdown, skills, rules, agent/tool allocations, per-tool MCP entries, and message history categories. Uses `Token.estimate()` (chars/4 heuristic) for per-item estimates.
78: 
79: ### 1.2 npm Packages (Framework-Agnostic)
80: 
81: #### `@context-chef/core` (MyPrototypeWhat/context-chef)
82: - **URL:** https://github.com/MyPrototypeWhat/context-chef
83: - **Stars:** 12 | **Confidence:** MEDIUM
84: - **What it does:** Context compiler for TypeScript/JavaScript AI agents. Automatically compiles agent state into optimized LLM payloads.
85: - **Key features:**
86:   - History compression (Janitor — two paths: tokenizer-based + summarization model)
87:   - Tool pruning via namespaces + lazy loading (two-layer architecture)
88:   - Multi-provider adapters (OpenAI/Anthropic/Gemini)
89:   - `@context-chef/ai-sdk-middleware` for Vercel AI SDK drop-in integration
90:   - Long-tail tools registered as lightweight XML directory; LLM loads schemas on demand via `load_toolkit`
91:   - Memory persistence across sessions via tool calls
92:   - `pruneMessages` mechanical pruning (reasoning, tool calls, empty messages)
93:   - Truncate large tool outputs to head+tail with optional VFS offloading
94: 
95: #### `ai-sdk-context-management` (pablof7z)
96: - **URL:** https://github.com/pablof7z/ai-sdk-context-management | **npm:** `ai-sdk-context-management`
97: - **Confidence:** HIGH
98: - **What it does:** Context management middleware for Vercel AI SDK agents. Explicit prompt preparation, optional agent tools, and structured telemetry.
99: - **Strategy matrix (10+ strategies):**
100:   - `SlidingWindowStrategy` — keeps recent tail; optional preserved head
101:   - `SummarizationStrategy` — replaces older turns with tagged summary block
102:   - `ToolResultDecayStrategy` — pressure-aware decay; replaces heavy results with placeholders
103:   - `PinnedMessagesStrategy` — marks specific tool call IDs as protected
104:   - `CompactionToolStrategy` — agent calls `compact_context()`; both agent-controlled and host-controlled
105:   - `ScratchpadStrategy` — persisted scratchpad state; agent-driven transcript compaction
106:   - `RemindersStrategy` — context window status warnings before hard pruning
107:   - `AnthropicPromptCachingStrategy` — cache-aware for Anthropic
108: - **Composition:** Strategies are order-sensitive and composable. Full graduated stack in `examples/04-composed-strategies.ts`.
109: 
110: #### `context-compact`
111: - **URL:** https://www.npmjs.com/package/context-compact
112: - **Confidence:** MEDIUM
113: - **What it does:** LLM context window compactor. Summarizes old conversation history to free up space.
114: - **Key features:**
115:   - Chunking — splits messages that exceed summarization model's own context limit; sequential with running summary carry-forward
116:   - Parallel parts for very long histories — summarize independently then merge
117:   - Identifier preservation (`identifierPolicy: "strict"`) — preserves identifiers verbatim
118:   - Token estimation via `chars/4` heuristic with configurable `safetyMargin`
119:   - `compactIfNeeded(params)` + `compact(params)` API
120:   - `tool_result.details` stripping before summarization
121: 
122: #### `slimcontext`
123: - **URL:** https://www.npmjs.com/package/slimcontext
124: - **Confidence:** MEDIUM
125: - **What it does:** Lightweight, model-agnostic chat history compression (trim + summarize).
126: - **Key features:**
127:   - `TrimCompressor` — token-aware trimming; keeps system messages and recent tail
128:   - `SummarizeCompressor` — AI-powered summarization via `invoke()` interface (BYOM)
129:   - LangChain adapter for `BaseChatModel` integration
130:   - `minRecentMessages` protection
131:   - Simple threshold-based triggering
132: 
133: #### `context-mem`
134: - **URL:** https://www.npmjs.com/package/context-mem
135: - **Confidence:** MEDIUM
136: - **What it does:** Memory + context infrastructure for AI agents. Full local operation, zero cloud cost.
137: - **Notable claims:**
138:   - 14 content-aware summarizers (JSON, shell, code, logs, errors, TS errors, tests, builds, git, HTML, markdown, CSV, binary, network)
139:   - Adaptive 4-tier compression: verbatim (0-7 days) → light → medium → distilled (90+ days)
140:   - 365 KB → 3.2 KB verified on 50-tool-output coding session (99.1% savings)
141:   - Hybrid search: BM25 + vector (nomic-embed-text-v1.5, 768-dim) + optional LLM judge
142:   - Pinned entries never compress
143:   - Entity intelligence (100+ aliases), topic detection, decision trails
144: 
145: #### `railroad-memory`
146: - **URL:** https://www.npmjs.com/package/railroad-memory
147: - **Confidence:** LOW
148: - **What it does:** Dynamic context memory for long-running AI agent tasks. Claims to work "forever" past traditional 280K token limits.
149: - **Key patterns:**
150:   - Stores structured state, not raw history
151:   - Hierarchical memory tiers: working memory → long-term memory (grouped by week, 2-3 sentence summaries) → core facts
152:   - Importance decay (configurable half-life)
153:   - `getPrunedPrompt()` and `getPrunedContext()` API
154:   - Token savings: 60% at 30 days, 80% at 90 days, 87% at 180 days
155: 
156: ### 1.3 Research Projects
157: 
158: #### Recursive Language Models (RLM) — MIT CSAIL
159: - **URL:** https://arxiv.org/abs/2512.24601 | **GitHub:** https://github.com/alexzhang13/rlm
160: - **Confidence:** HIGH
161: - **What it is:** Paradigm-shifting approach: treat context as external environment, NOT consumed directly by neural network. Model writes code to query/decompose/recursively process context in a REPL environment.
162: - **Performance:** 10M+ token inputs (2 orders of magnitude beyond context windows). RLM-Qwen3-8B outperforms base Qwen3-8B by 28.3% on average and approaches vanilla GPT-5 quality.
163: - **Ecosystem adoption:** DSPy v3.1.2+ ships with RLM support. Google ADK has enterprise implementation. VentureBeat called it "the most exciting Agentic Paradigm of 2026."
164: - **Key insight from MIT:** "Long prompts should NOT be fed into the neural network directly but should instead be treated as part of the EXTERNAL ENVIRONMENT that the LLM can symbolically interact with."
165: 
166: #### Self-Reflective Program Search (SRLM) — arXiv:2603.15653
167: - **Confidence:** MEDIUM
168: - **What it is:** Extension of RLM. Adds uncertainty-aware self-reflection to improve programmatic context interaction. Key finding: recursive decomposition alone is NOT the main factor behind RLM performance — the improvements stem from the external programmatic way of handling context interaction.
169: 
170: #### Squeez: Task-Conditioned Tool-Output Pruning
171: - **URL:** https://arxiv.org/html/2604.04979v1
172: - **Confidence:** MEDIUM
173: - **What it is:** Fine-tuned Qwen 3.5 2B for tool-output pruning. Given a query and a tool observation, returns the smallest verbatim evidence block. 0.86 recall while removing 92% of input tokens. Outperforms 18× larger models (Qwen 3.5 35B).
174: 
175: ---
176: 
177: ## 2. Community Discussions (OpenCode Issues/PRs)
178: 
179: ### 2.1 Core Context Management Discussions
180: 
181: | Issue/PR | Title | Date | Reactions | Key Points |
182: |----------|-------|------|-----------|------------|
183: | [#4659](https://github.com/anomalyco/opencode/issues/4659) | Sliding window context management for long-running sessions | 2025-11-23 | 45 total (20👍, 11❤️, 14🚀) | Most-discussed context feature. Inception messages, chess-clock time, heuristic pruning 1-10, external CLI. Converted to plugin: opencode-acm |
184: | [#24893](https://github.com/anomalyco/opencode/issues/24893) | Pluggable Context Management Method | 2026-04-29 | 0 reactions | User-controllable context compression; classify context by content; persistent memory across conversations |
185: | [#11829](https://github.com/anomalyco/opencode/issues/11829) | RLM Context Management — Context as External Environment | 2026-02-02 | 12 total (10👍) | Builds on #4659. Proposes treating context as external environment using MIT's RLM paradigm. 5-phase implementation plan |
186: | [#4102](https://github.com/sst/opencode/issues/4102) | Epic: Compaction Update | 2025-11-09 | N/A | Comprehensive audit: boundary detection bugs, rules not preserved after compaction, insufficient summary prompt, underutilized pruning, minimal observability |
187: | [#1990](https://github.com/anomalyco/opencode/issues/1990) | Add User Controls for Context Management | 2025-08-16 | Active discussion | Inspired by Aider: `/drop`, `/list`, `/tokens`, `/clear`, `/reset` commands |
188: | [#21760](https://github.com/anomalyco/opencode/issues/21760) | Session Summarization with New Session Creation | 2026-04-09 | 0 reactions | Button + `/summarize-to-new` command. Creates new session with summary, avoids lossy compaction |
189: | [#1207](https://github.com/anomalyco/opencode/issues/1207) | Support `--continue` flag to persist context in new session | 2025-07-22 | Discussion ongoing | Sessions disappearing from list; recovery from storage files; import bugs |
190: 
191: ### 2.2 Compaction Bug Fixes & Improvements
192: 
193: | PR | Title | Date | Status |
194: |-----|-------|------|--------|
195: | [#20718](https://github.com/anomalyco/opencode/pull/20718) | fix(compaction): prune context before overflow compaction to prevent unrecoverable 413 errors | 2026-04-02 | Open (4 comments) |
196: | [#15130](https://github.com/anomalyco/opencode/pull/15130) | feat(opencode): add double-buffer context management | 2026-02-25 | Open (6 comments) |
197: | [#25180](https://github.com/anomalyco/opencode/pull/25180) | fix: enable auto-compaction for sub-agents and improve context overflow detection | 2026-04-30 | Open (3 comments) |
198: | [#18683](https://github.com/anomalyco/opencode/pull/18683) | fix: treat Anthropic long context billing error as context overflow | 2026-03-23 | Open (1 comment) |
199: | [#24210](https://github.com/anomalyco/opencode/pull/24210) | feat(opencode): add /context command | 2026-04-24 | Open (contributor) |
200: 
201: ### 2.3 Known Bugs
202: 
203: | Issue | Title | Date |
204: |-------|-------|------|
205: | [#26707](https://github.com/anomalyco/opencode/issues/26707) | Forked session inherits full uncompressed context after parent compaction | 2026-05-10 |
206: | [#17340](https://github.com/anomalyco/opencode/issues/17340) | Session compaction fails with "context exceeds model limit" error | 2026-03-13 |
207: | [#15556](https://github.com/anomalyco/opencode/issues/15556) | Context auto-compression seems ineffective with GLM-5 | 2026-03-01 |
208: | [#23892](https://github.com/anomalyco/opencode/issues/23892) | New chat does not preserve worktree/role context | 2026-04-22 |
209: 
210: ---
211: 
212: ## 3. Patterns & Approaches
213: 
214: ### 3.1 The Canonical Tiered Compaction Architecture
215: 
216: Derived from Claude Code's implementation (5 layers) and OpenCode's approach:
217: 
218: ```
219: Layer 1: Microcompact (zero LLM cost)
220:   └─ Replaces old tool results with placeholders [cleared to save context]
221:   └─ Cache-aware (preserves Anthropic prompt cache keys)
222:   └─ Runs every turn, invisible to user
223: 
224: Layer 2: Tool-result clearing / pruning (zero LLM cost)
225:   └─ Mechanical pruning: replaces tool_result blocks older than N turns
226:   └─ Protects recent tool outputs (keep 3 most recent)
227:   └─ Protects skill tool outputs, critical memory tools
228:   └─ Typical threshold: ~40,000 tokens of tool outputs protected
229: 
230: Layer 3: Session memory compact (zero LLM cost if notes exist)
231:   └─ Maintains structured notes file throughout session
232:   └─ Incremental extraction at regular intervals (amortized cost)
233:   └─ "Free" compaction — uses pre-extracted notes as summary
234:   └─ Claude Code: `sessionMemoryCompact.ts` — "most interesting design in the entire system"
235: 
236: Layer 4: Full compaction (LLM cost — summarization call)
237:   └─ Structured 9-section summary prompt
238:   └─ Cache-aware forking: shares parent's cached prefix to avoid cache_creation cost
239:   └─ Fire at ~85-89% context capacity
240:   └─ Post-compact rehydration: re-read recent files, restore todo state, inject continuation message
241: 
242: Layer 5: Reactive / emergency compaction (LLM cost, triggered by errors)
243:   └─ Catches context overflow errors from API response
244:   └─ Compacts and retries automatically
245:   └─ Circuit breaker: stops after 3 consecutive failures
246: ```
247: 
248: ### 3.2 Post-Compaction Hydration (File Re-reading)
249: 
250: Claude Code re-injects after compaction:
251: 1. Boundary marker (marks the compaction point in transcript)
252: 2. Summary message (the compressed working state)
253: 3. Recently-read files (sorted by timestamp, within token budget)
254: 4. Todo list (preserved from before)
255: 5. Plan state (if in plan mode)
256: 6. Hook outputs (from startup hooks)
257: 7. Continuation message ("continue from where you left off")
258: 
259: OpenCode supports this via `experimental.session.compacting` hook — plugins can inject custom context:
260: ```typescript
261: "experimental.session.compacting": async (input, output) => {
262:   output.context.push(`
263: ## Custom Context
264: - Current task status
265: - Important decisions made
266: - Files being actively worked on
267: `);
268: }
269: ```
270: 
271: ### 3.3 Agent Self-Managed Context
272: 
273: Multiple implementations give models visibility into and control over their context:
274: - ACM: System reminder at end of each turn showing context level (same math as TUI indicator) — "game changer for agent self-management"
275: - DCP: Model calls `compress` tool when it decides context is stale
276: - Context-chef: `RemindersStrategy` adds context warnings before hard pruning
277: - Claude Code: `/context` shows colored grid; model can call `/compact` manually
278: 
279: ### 3.4 Context-as-External-Environment (RLM Paradigm)
280: 
281: The most radical approach — from MIT:
282: 
283: ```
284: Traditional:  Context → [Stuff into Window] → Model
285: RLM:          Context → [External Storage] ← Model queries via code → [Relevant Snippets] → Model
286: ```
287: 
288: Key mechanisms:
289: - Context lives in REPL environment as a variable
290: - Model writes code (Python, JS) to query/decompose/process it
291: - Recursive sub-calls on context slices
292: - Symbolic compression: frequent context → short symbol IDs (expand on demand)
293: - 10M+ tokens effective processing
294: 
295: ### 3.5 Configurable Threshold Patterns
296: 
297: | Tool | Default Threshold | Config Key |
298: |------|------------------|------------|
299: | Claude Code | context - min(20000, output) - 13000 (~89%) | N/A (hardcoded) |
300: | OpenCode | contextTokens ≥ context - reserved (where reserved = min(20000, model_output_limit)), ~96-99% | `compaction.reserved` |
301: | Gemini CLI | 50% of context window | `~/.gemini/settings.json` |
302: | Anthropic API Compact | 150,000 tokens (minimum 50K) | `trigger.tokens` |
303: | Aider (altimate) | reserved: 20000 (max(reserved, model_max_output)) | `compaction.reserved` |
304: 
305: ### 3.6 Double-Buffer Context Management (PR #15130)
306: 
307: Two-phase compaction:
308: 1. **Checkpoint phase** (~50%): Background compaction generates summary; stores in per-session state
309: 2. **Concurrent phase** (50-75%): Normal operation; checkpoint ready
310: 3. **Swap phase** (~75%): Uses pre-computed summary instead of stop-the-world compaction
311: 
312: ### 3.7 Tool-Output Pruning Patterns
313: 
314: From across tools, the consensus on tool-output handling:
315: - **Keep:** Most recent 2-3 tool results verbatim
316: - **Clear:** Older tool results → placeholder `[cleared to save context]`
317: - **Protect:** `skill` tool outputs, memory tool outputs, stateful results
318: - **Clear-at-least:** Minimum 20,000 tokens recovered per operation (to justify cache invalidation)
319: - **Exclude patterns:** Glob-based file patterns and tool name exclusions from clearing
320: - **Pre-compaction pruning:** Always prune tool outputs BEFORE attempting full compaction (PR #20718)
321: 
322: ---
323: 
324: ## 4. Pain Points & Known Issues
325: 
326: ### 4.1 Context Window Overflow / Stuck Sessions
327: - **Unrecoverable 413 errors:** Compaction itself fails because it sends full oversized context to LLM for summarization (PR #20718 fix: pre-flight pruning)
328: - **Compaction-while-overflow loop:** Session compacted, but post-compact token count still exceeds threshold → immediate re-compaction → loop (Claude Code guard: reject results that would already exceed auto-compact threshold)
329: - **Subagent hangs:** Sub-agents never trigger auto-compaction (PR #25180 fix, not yet merged)
330: 
331: ### 4.2 Lossy Compaction
332: - **Information loss:** Summaries are lossy — "AI forgets too much and becomes foolish" (#24893)
333: - **Rules/constraints dropped:** After compaction, user rules (e.g., "no git push") are not reliably preserved (#4102)
334: - **Context rot pre-compaction:** Compaction quality degrades if context was already "rotting" — trigger at ~70%, not ~90%+ window fill
335: 
336: ### 4.3 Forked/Child Session Context Inheritance
337: - **Forked sessions:** Inherit full uncompressed context after parent compaction, causing immediate overflow (#26707)
338: - **Subagent context pollution:** Parent's context bleeds into child via overly detailed task descriptions
339: - **Child silence mistaken for failure:** Parents redo work that subagents are still processing → duplicate work and token waste
340: 
341: ### 4.4 Provider-Specific Issues
342: - **Anthropic billing tier error:** "Extra usage is required for long context requests" not matched as overflow (PR #18683)
343: - **Silent overflow acceptance:** Some providers (z.ai, OpenAI-compatible) accept overflows silently — no error, no token count → subagent hangs forever (#25180)
344: - **Model metadata gaps:** Sub-agents often lack correct model context window metadata
345: 
346: ### 4.5 User Experience
347: - **No clear overflow indication:** Users can't tell when context is approaching limits (PR #24210 adds `/context` command for visibility)
348: - **Session disappearance:** Sessions can disappear from list even though files exist on disk (#1207)
349: - **No checkpoint before compaction:** Compaction happens mid-task without warning — "Claude Code's compaction is the sneakiest — it happens mid-task without warning, so you often don't realize the AI has lost important context until it gives you bad code."
350: 
351: ---
352: 
353: ## 5. Competitor Approaches
354: 
355: ### 5.1 Claude Code (Anthropic)
356: - **5-tier cascade:** Microcompact → Tool clearing → Session memory compact → Full compact → Reactive compact
357: - **Context engineering:** Structured 9-section compaction prompt; cache-aware forking; file rehydration after compaction
358: - **Session memory:** Continuous background extraction to structured notes file → "free" compaction via pre-extracted notes
359: - **Context visibility:** `/context` grid visualization, status bar, `/compact` manual trigger
360: - **Mechanical pruning:** 20,000+ clearable tool result tokens threshold; keeps 3 most recent
361: - **Circuit breaker:** 3 consecutive failures stops auto-compaction for session
362: - **Key insight:** "Defer as long as possible, keep it as cheap as possible, escalate in stages"
363: 
364: ### 5.2 Windsurf (Codeium)
365: - **Flow paradigm:** AI maintains continuous understanding across session — tracks file edits, terminal commands, navigation patterns in real time
366: - **Context assembly pipeline (7 layers):** Rules → Memories → Active editor state → @-commands → Flow context → Model constraints
367: - **RAG-based codebase indexing:** Semantic map of repository; automatic (not manual like Cursor's @references)
368: - **Memories:** Persistent facts that survive across sessions. Can be auto-generated or manually created
369: - **Limitation:** Once Cascade session closes, context is gone — no cross-session resumption without Memory system
370: - **Key differentiator:** "Cascade is optimized for depth. Tab is optimized for latency. Different context windows."
371: 
372: ### 5.3 Cursor
373: - **Request-based paradigm:** User explicitly provides context via @file, @codebase, @docs
374: - **Codebase indexing:** Deep, precise codebase index with semantic search
375: - **Tab-based isolation:** Each tab has its own context; switching tabs = losing prior context
376: - **Weakness:** "Loses the most context in absolute numbers" — especially when multi-tasking. Silent drops when context window fills
377: - **No auto-compaction:** Does not automatically manage growing conversation context
378: 
379: ### 5.4 OpenHands (condensation)
380: - **Agent-initiated:** The agent itself requests condensation via `request_condensation` tool call
381: - **No LLM work by default:** Default condenser does no LLM work; only fires when agent triggers it
382: - **CondensationAction:** Persists event IDs to suppress in raw history
383: - **Threshold:** Not token-based — agent's own judgment
384: 
385: ### 5.5 Anthropic API (Server-side compaction)
386: - **`compact_20260112`:** Server-side context edit; automatic at configurable threshold (default 150K, minimum 50K)
387: - **Typed blocks:** Returns `compaction` content block; API drops everything before it on next request
388: - **Returns:** structured summary in API response; serialization-friendly
389: - **Custom prompts:** `instructions` parameter completely replaces default prompt
390: - **Pause mode:** `pause_after_compaction` for adding context blocks before response
391: 
392: ---
393: 
394: ## 6. Actionable Patterns for Hivemind
395: 
396: ### 6.1 Most Applicable: OpenCode Plugin Hooks
397: 
398: OpenCode exposes these hooks specifically for context management (from DeepWiki analysis):
399: 
400: ```
401: Plugin hooks usable for context management:
402:   ├── experimental.session.compacting    — Inject context into compaction prompt or replace it entirely
403:   ├── experimental.compaction.autocontinue — Control synthetic "continue" after compaction
404:   ├── experimental.chat.system.transform — Modify system prompt before LLM call
405:   ├── experimental.chat.messages.transform — Transform messages before sending (used by LCM plugin)
406:   ├── session.compacted                   — Event fired after compaction completes
407:   └── session.error                       — Event for context overflow errors
408: ```
409: 
410: ### 6.2 Recommended Architecture: Tiered Cascade
411: 
412: Based on the consensus across Claude Code, OpenCode plugins, and npm packages:
413: 
414: ```
415: TIER 0: Mechanical Pruning (zero LLM cost)
416:   └─ Replace old tool results (>3 turns) with placeholders
417:   └─ Protect skill outputs, memory tool outputs, critical tool outputs
418:   └─ Configurable: clear_at_least tokens (20K minimum)
419:   └─ Use OpenCode's built-in prune mechanism (40K protected zone, automatic)
420: 
421: TIER 1: Session Memory / Notes (zero LLM cost if incremental)
422:   └─ Maintain structured state file updated incrementally
423:   └─ Capture: decisions made, files touched, errors encountered, pending tasks
424:   └─ On compaction: use notes as summary (no API call needed)
425: 
426: TIER 2: Background Compaction (LLM cost, non-blocking)
427:   └─ Pre-compute checkpoint at ~70% capacity using separate model
428:   └─ Main agent continues working uninterrupted
429:   └─ Use `experimental.session.compacting` hook for custom prompt
430: 
431: TIER 3: Full Compaction (LLM cost, blocking)
432:   └─ Trigger at ~85-90% capacity with pre-flight pruning
433:   └─ Structured summary: intent, decisions, files, errors, pending tasks, next step
434:   └─ Post-compact rehydration: re-read recent files, restore state
435: 
436: TIER 4: Emergency Compaction (LLM cost, reactive)
437:   └─ Catch overflow errors from API
438:   └─ Aggressive pre-flight pruning, then compact
439:   └─ Circuit breaker: max 3 consecutive attempts
440: 
441: TIER 5: External Memory (persistent across sessions)
442:   └─ Survives compaction and session boundaries
443:   └─ Embedding-based or FTS-based retrieval
444:   └─ Inject at session start + after compaction
445: ```
446: 
447: ### 6.3 Cross-Session Continuity Pattern
448: 
449: From Magic Context, ACM, and LCM plugins:
450: 
451: ```
452: Session start:
453:   1. Load project memories from persistent store (SQLite/JSON)
454:   2. Inject active memories into system prompt or initial context
455:   3. Restore recent file context from session lineage
456: 
457: During session:
458:   1. Incrementally extract decisions, facts, and state to notes file
459:   2. On each turn, remind model of context usage level
460:   3. Allow model to request compaction via tool call
461: 
462: Session end / compaction:
463:   1. Promote qualifying facts to persistent memory
464:   2. Write structured summary with lineage metadata
465:   3. Track parent/root session relationships for forked sessions
466: 
467: Session resumption:
468:   1. Inherit project memories from previous sessions
469:   2. Read session lineage to understand context chain
470:   3. Inject summary from parent session
471: ```
472: 
473: ### 6.4 Context Visibility & Self-Management
474: 
475: From ACM's "game changer" finding:
476: - Show context level to model at end of each turn (same math as TUI indicator)
477: - Let model decide when to prune, compact, or request summary
478: - Expose tools for context inspection (`/context`, `/dcp context`, etc.)
479: 
480: ### 6.5 Protect Critical Context During Compaction
481: 
482: Pattern from ACM and Claude Code:
483: - Inception/preserved messages: Mark messages that survive ALL compactions
484: - Priority levels: Assign 1-10; system prunes lowest priority first under pressure
485: - Post-compaction re-injection: Always re-read recently accessed files
486: - Rules preservation: Explicitly include AGENTS.md/rules in summary
487: - Compaction prompt requirements: Require structured output with sections for rules, pending tasks, current work
488: 
489: ---
490: 
491: ## 7. Gaps — What's Missing or Underdeveloped
492: 
493: ### 7.1 OpenCode-Specific Gaps
494: 
495: | Gap | Evidence | Impact |
496: |-----|----------|--------|
497: | No pluggable context management strategy | #24893 open, no merge | All plugins work around OpenCode's fixed compaction |
498: | Sub-agents don't compact automatically | #25180 not merged | Sub-agents hang on long tasks |
499: | Forked sessions inherit pre-compaction context | #26707 open | Forks fail immediately after parent compaction |
500: | Rules not preserved after compaction | #4102 epic open | Model forgets user constraints after compact |
501: | No session-linking / lineage in core | Only LCM plugin implements lineage tracking | Can't chain sessions or resume across days |
502: | `/compact` prompt not customizable via config | Only via plugin hook (`experimental.session.compacting`) | Users can't customize without plugin |
503: 
504: ### 7.2 Ecosystem-Wide Gaps
505: 
506: | Gap | Evidence | Impact |
507: |-----|----------|--------|
508: | **No standard for memory portability** | Each tool has own store (SQLite, JSON, file) | Can't share memory across tools |
509: | **No context budget tracking in OpenCode** | PR #24210 adds `/context` but not merged | Users/agents can't see where tokens go |
510: | **No incremental extraction standard** | Each plugin invents own format | Fragmentation across ecosystem |
511: | **Multi-agent context isolation immature** | Only Codex has explicit subagent context docs | Subagent delegation often breaks context |
512: | **No cross-harness memory sharing** | Only Magic Context supports OpenCode + Pi | Users switching tools lose context |
513: | **No semantic pruning of conversation** | All pruning is time/recency-based or tool-output-only | Could drop crucial old information |
514: | **Compaction quality measurement absent** | No standard metric for "did compaction preserve critical info?" | Quality regression is detected only via model behavior |
515: 
516: ### 7.3 Research-Only (Not Production-Ready)
517: 
518: | Approach | Maturity | Gap |
519: |----------|----------|-----|
520: | RLM (MIT) | Research paper + open-source code | Requires REPL sandbox; not integrated into any coding agent |
521: | SRLM | Research paper | Extension of RLM; even less mature |
522: | Squeez | Research paper + fine-tuned model | Only covers tool-output pruning; model-specific |
523: | Symbolic compression (Signal Zero) | Proprietary product | Not open-source; limited to one product |
524: 
525: ---
526: 
527: ## 8. Key Architectural Decisions from Ecosystem
528: 
529: ### 8.1 Cache Economics Dominate Compaction Design
530: 
531: The most cited constraint across all implementations: **preserving Anthropic API prompt cache keys**. Compaction that invalidates cached prefixes costs 2-4× more in API fees. This drives:
532: - Deferred compaction (wait until necessary)
533: - Cache-aware microcompact (preserves cache keys)
534: - Forked agent for compaction (shares than discards parent cache)
535: - Session memory approach (avoids compaction call entirely)
536: 
537: ### 8.2 Tool-Output Pruning Before Full Compaction is Standard
538: 
539: Almost every implementation prunes tool outputs BEFORE attempting full LLM summarization. The rationale: tool outputs are the largest token consumers, are re-fetchable, and clearing them is free (no API call). This should ALWAYS happen before the expensive compaction call.
540: 
541: ### 8.3 The 70% Threshold Consensus
542: 
543: Trigger compaction at ~70% of effective context window, not at 95%+. Evidence:
544: - Claude Code auto-compact: ~89% (deobfuscated constant: `contextWindow - min(maxOutput, 20k) - 13k`)
545: - "Context rot" degrades summarization quality if triggered too late
546: - The model producing the summary is the same model experiencing context pressure — quality of summary correlates with available headroom
547: - Pre-rot threshold recommended: ~70% for models with 128K effective windows
548: 
549: ### 8.4 Post-Compaction Continuity = Summary + Files + State
550: 
551: The pattern across Claude Code, DCP, and Magic Context: compaction is NOT just summarization. It's:
552: 1. **Summarize** — structured working state
553: 2. **Rehydrate** — re-read recently accessed files
554: 3. **Restore** — todo state, plan state, pinned context
555: 4. **Continue** — explicit continuation instruction
556: 
557: ### 8.5 Plugin-Based Context Management is the Viable Path
558: 
559: Rickross's ACM (45 reactions on issue #4659) successfully converted from a fork to a plugin for stock OpenCode 1.3.11+. The `experimental.session.compacting` hook provides enough surface area for sophisticated context management plugins without requiring forks.
560: 
561: ---
562: 
563: ## 9. Source Index
564: 
565: | # | Source | URL | Type | Date |
566: |---|--------|-----|------|------|
567: | 1 | Magic Context (cortexkit) | https://github.com/cortexkit/opencode-magic-context | REPO | 2026-03-26 |
568: | 2 | Dynamic Context Pruning (Opencode-DCP) | https://github.com/Opencode-DCP/opencode-dynamic-context-pruning | REPO | 2025-11-20 |
569: | 3 | ACM Plugin (rickross) | https://github.com/rickross/opencode-acm | REPO | Live |
570: | 4 | LCM Plugin (plutarch01) | https://github.com/plutarch01/opencode-lcm | REPO | 2026-04-01 |
571: | 5 | Context-chef (MyPrototypeWhat) | https://github.com/MyPrototypeWhat/context-chef | REPO | 2026-02-21 |
572: | 6 | ai-sdk-context-management (pablof7z) | https://github.com/pablof7z/ai-sdk-context-management | REPO | 2026-03-10 |
573: | 7 | context-compact (npm) | https://www.npmjs.com/package/context-compact | PKG | 2026-03-06 |
574: | 8 | slimcontext (npm) | https://www.npmjs.com/package/slimcontext | PKG | 2025-08-22 |
575: | 9 | context-mem (npm) | https://www.npmjs.com/package/context-mem | PKG | 2026-03-17 |
576: | 10 | railroad-memory (npm) | https://www.npmjs.com/package/railroad-memory | PKG | - |
577: | 11 | OpenCode #4659 (Sliding Window) | https://github.com/anomalyco/opencode/issues/4659 | ISSUE | 2025-11-23 |
578: | 12 | OpenCode #24893 (Pluggable Context) | https://github.com/anomalyco/opencode/issues/24893 | ISSUE | 2026-04-29 |
579: | 13 | OpenCode #11829 (RLM Proposal) | https://github.com/anomalyco/opencode/issues/11829 | ISSUE | 2026-02-02 |
580: | 14 | OpenCode #4102 (Compaction Epic) | https://github.com/sst/opencode/issues/4102 | ISSUE | 2025-11-09 |
581: | 15 | OpenCode #20718 (Pre-flight pruning PR) | https://github.com/anomalyco/opencode/pull/20718 | PR | 2026-04-02 |
582: | 16 | OpenCode #15130 (Double-buffer PR) | https://github.com/anomalyco/opencode/pull/15130 | PR | 2026-02-25 |
583: | 17 | OpenCode #25180 (Subagent compaction PR) | https://github.com/anomalyco/opencode/pull/25180 | PR | 2026-04-30 |
584: | 18 | OpenCode #24210 (/context PR) | https://github.com/anomalyco/opencode/pull/24210 | PR | 2026-04-24 |
585: | 19 | OpenCode #26707 (Fork context bug) | https://github.com/anomalyco/opencode/issues/26707 | ISSUE | 2026-05-10 |
586: | 20 | OpenCode #1990 (Context Controls) | https://github.com/anomalyco/opencode/issues/1990 | ISSUE | 2025-08-16 |
587: | 21 | OpenCode #21760 (Session Summarization) | https://github.com/anomalyco/opencode/issues/21760 | ISSUE | 2026-04-09 |
588: | 22 | OpenCode #1207 (--continue flag) | https://github.com/anomalyco/opencode/issues/1207 | ISSUE | 2025-07-22 |
589: | 23 | RLM Paper (arXiv:2512.24601) | https://arxiv.org/abs/2512.24601 | PAPER | 2025-12-31 |
590: | 24 | SRLM Paper (arXiv:2603.15653) | https://arxiv.org/abs/2603.15653 | PAPER | 2026-03 |
591: | 25 | Squeez Paper (arXiv:2604.04979) | https://arxiv.org/html/2604.04979v1 | PAPER | 2026-04 |
592: | 26 | Claude Code Compaction Deep Dive | https://oldeucryptoboi.com/blog/context-compaction-deep-dive/ | BLOG | 2026-04-07 |
593: | 27 | Claude Code Compaction System | https://decodeclaude.com/compaction-deep-dive/ | BLOG | 2026-01-22 |
594: | 28 | Claude Code 5-Layer Cascade | https://finisky.github.io/en/claude-code-context-compaction/ | BLOG | - |
595: | 29 | Auto-Compact (Claude Wiki) | https://claude-wiki.com/auto-compact.html | DOCS | - |
596: | 30 | Context Engineering for AI Agents | https://callsphere.ai/blog/context-window-management-ai-agents-summarization-pruning-sliding-2026.md | BLOG | 2026 |
597: | 31 | How AI Coding Agents Handle Full Context | https://wasnotwas.com/writing/context-compaction/ | BLOG | 2026-03-04 |
598: | 32 | Context Engineering (Anthropic) | https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools | DOCS | 2026-03-20 |
599: | 33 | Subagent Pattern (AIPatternBook) | https://aipatternbook.com/subagent | DOCS | - |
600: | 34 | Subagent Context Poisoning | https://ranjankumar.in/subagents-parallelism-inside-session | BLOG | 2026-04-17 |
601: | 35 | Codex Subagents | https://developers.openai.com/codex/concepts/subagents | DOCS | - |
602: | 36 | DeepWiki OpenCode Context | https://deepwiki.com/search/opencode-context-management | WIKI | 2026-05-11 |
603: | 37 | OpenCode Plugin Docs | https://opencode.ai/docs/plugins/ | DOCS | - |
604: | 38 | OpenCode Plugin Guide | https://gist.github.com/rstacruz/946d02757525c9a0f49b25e316fbe715 | GIST | 2025-11-05 |
605: | 39 | Compaction (AIPatternBook) | https://aipatternbook.com/compaction | DOCS | - |
606: | 40 | Context Management (altimate) | https://docs.altimate.sh/configure/context-management/ | DOCS | - |
607: | 41 | OpenClaw Compaction | https://clawdhub.mintlify.app/concepts/compaction | DOCS | - |
608: 
609: ---
610: 
611: ## 10. Research Quality Score: **A**
612: - Multi-source (41 distinct cited sources)
613: - >90% live verification (all findings from Exa, GitHub API, DeepWiki, npm registry — no cached assets)
614: - All versions contextualized with dates
615: - No unresolved contradictions
616: - Gaps explicitly documented
617: 
618: *— hm-l2-researcher, research chain wave1-t2 complete*

(End of file - total 618 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/task_plan.md"
}
```


### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_O48qmOwyZfklwOQF0aTk5395"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ITpvssleMDJhn75zFbvE5801"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Mjq5CyMZyzmeMzBFcqh12873"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_bSzPGSrVe75oOe9cKwEM3861"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_x9XGd23SkmwprJmUgBkt9272"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_FiQ7XJR45MlRYrrMDfAc6107"
}
```

