# Feature Comparison: oh-my-openagent vs harness-experiment

**Date:** 2026-04-02
**Codebase A:** oh-my-openagent (276,598 lines, ~100+ source files)
**Codebase B:** harness-experiment (~3,200 lines, 13 source files)

---

## 1. FEATURE PARITY MATRIX

### Delegation & Session Management

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Custom delegation tool | `delegate-task` (src/tools/delegate-task/) with categories, constraints, priority, model override | `delegate-task` (src/plugin.ts:310) with agent, category, model, constraints, scope | **Partial** — harness has core params but missing priority, session attachment, skill context | Critical |
| Background task execution | `background-task` tool (src/tools/background-task/) with full state machine, polling, cancellation, history | `run_in_background` flag on delegate-task (src/plugin.ts:324) with CompletionDetector | **Partial** — harness has async mode but no task CRUD, no history, no polling API | Critical |
| Agent calling agent | `call_omo_agent` tool (src/tools/call-omo-agent/) — any agent can invoke any other | Not present | **Missing** — harness agents cannot delegate to each other directly | Important |
| Session management | `session-manager` tool (src/tools/session-manager/) — list, get, kill, inspect sessions | Not present (uses SDK wrappers only, src/lib/session-api.ts) | **Missing** — no session introspection API | Important |
| Task CRUD | `task` tool with create/read/update/delete (src/tools/task/) | Not present — harness tracks tasks only in continuity.json | **Missing** — no task lifecycle API | Important |
| Session parent chain | `walkParentChain()` in both | `walkParentChain()` (src/lib/session-api.ts:103) | **Equivalent** | Critical |
| Root budget enforcement | MAX_DESCENDANTS_PER_ROOT=10 | MAX_DESCENDANTS_PER_ROOT=10 (src/lib/types.ts:3) | **Equivalent** | Critical |
| Delegation depth limit | MAX_DEPTH (configurable) | MAX_DEPTH=3 (src/plugin.ts:35) | **Equivalent** | Critical |

### Hook System

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Total hooks | 48+ hooks across 50+ directories | 5 hooks (plugin.ts:117-307) | **Massive gap** | Critical |
| `tool.execute.before` | ✅ | ✅ (plugin.ts:118) | **Equivalent** | Critical |
| `tool.execute.after` | ✅ | ✅ (plugin.ts:159) | **Equivalent** | Critical |
| `event` | ✅ | ✅ (plugin.ts:200) | **Equivalent** | Critical |
| `experimental.session.compacting` | ✅ | ✅ (plugin.ts:211) | **Equivalent** | Critical |
| `shell.env` | ✅ | ✅ (plugin.ts:299) | **Equivalent** | Critical |
| Context window recovery | `anthropic-context-window-limit-recovery` — multi-strategy (aggressive truncation, summarize retry, dedup, tool result storage) | Not present | **Missing** — harness will crash on context overflow | Critical |
| Session recovery with retry | `session-recovery` + `delegate-task-retry` + `runtime-fallback` — automatic retry with fallback models | Not present | **Missing** — single model, no retry | Critical |
| Model fallback | `model-fallback` hook — automatic fallback chain on failure | Not present | **Missing** | Important |
| Todo continuation | `todo-continuation-enforcer` — preserves todos across compactions | Not present | **Missing** — todos lost on compaction | Important |
| Compaction context | `compaction-context-injector` — injects structured context during compaction | Partial (plugin.ts:211) — injects harness snapshot | **Partial** — harness injects less context | Important |
| Atlas orchestrator hooks | `atlas/` — boulder state, session lineage, idle handling, approval gates, wave management | Not present | **Missing** — no orchestration layer | Critical |
| Ralph loop | `ralph-loop` hook — iteration loop controller with config | Not present | **Missing** | Nice-to-have |
| Edit error recovery | `edit-error-recovery` — recovers from failed edits | Not present | **Missing** | Important |
| Hashline editing | `hashline-edit` tool + `hashline-edit-diff-enhancer` + `hashline-read-enhancer` — content-addressable editing with dedup | Not present | **Missing** | Important |
| Interactive bash | `interactive-bash-session` — persistent shell sessions | Not present | **Missing** | Important |
| LSP integration | `lsp` tool + `lsp_*` hooks | Not present | **Missing** | Nice-to-have |
| Agent usage reminder | `agent-usage-reminder` — tracks and reminds agents of their role | Not present | **Missing** | Nice-to-have |
| Keyword detection | `keyword-detector` — detects ultrawork, analyze, search keywords | Not present | **Missing** | Nice-to-have |
| Thinking/validation | `think-mode`, `thinking-block-validator` | Not present | **Missing** | Nice-to-have |
| Guards | `write-existing-file-guard`, `webfetch-redirect-guard`, `stop-continuation-guard` | Not present | **Missing** | Important |
| Directory context | `directory-agents-injector`, `directory-readme-injector` | Not present | **Missing** | Nice-to-have |
| Rules injection | `rules-injector` | Not present | **Missing** | Nice-to-have |
| Non-interactive env | `non-interactive-env` | Partial (shell.env hook) | **Partial** | Important |

### Agent System

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Specialist agents | 8+ agents: Atlas (orchestrator), Hephaestus (code), Prometheus (planning), Sisyphus (verification), Oracle (guidance), Librarian (docs), Metis (research), Explore (discovery), Sisyphus-Junior, Momus, Multimodal-Looker | 3 agents: researcher, builder, critic (src/lib/types.ts:5) | **Missing 5+ agents** | Critical |
| Dynamic prompt builder | `dynamic-agent-prompt-builder` (src/agents/dynamic-agent-prompt-builder.ts:530 LOC) — runtime composition based on category/agent/context/skills | `buildPromptText()` (src/lib/helpers.ts:73) — static template | **Missing** — harness uses flat string template | Critical |
| Model-specific prompts | Per-model variants: `gpt.ts`, `gpt-5-4.ts`, `gemini.ts`, `gpt-5-3-codex.ts` for each agent | Not present — single prompt per agent | **Missing** | Important |
| Model fallback chains | `resolveModelPipeline()` with per-agent fallback arrays | Not present | **Missing** | Critical |
| Agent overrides | `agent-overrides.ts` — runtime agent config modification | Not present | **Missing** | Nice-to-have |
| Custom agent summaries | `custom-agent-summaries.ts` | Not present | **Missing** | Nice-to-have |
| Agent trust/delegation | `delegation-trust-prompt.ts` | Not present | **Missing** | Important |
| Tool restrictions per agent | `tool-restrictions.test.ts` + inline in agent configs | `AGENT_TOOLS` + `getPermissionRulesForAgent()` (src/plugin.ts:46-108) | **Equivalent approach, less granular** | Important |

### Concurrency

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Concurrency model | Per-model FIFO queues with global limits (`max_background_agents`), per-model capacity tracking | Keyed semaphore per (model/agent/category) (src/lib/concurrency.ts:36) | **Partial** — harness lacks global limit, per-model capacity | Important |
| Queue management | `BackgroundManager` with pending→queued→running→polling→complete/error/cancelled state machine | Simple acquire/release with Promise-based waiting (src/lib/concurrency.ts:41) | **Partial** — no explicit state machine for queue positions | Important |
| Subagent spawn limits | `subagent-spawn-limits.ts` — configurable max concurrent subagents | MAX_DESCENDANTS_PER_ROOT=10 (src/lib/types.ts:3) | **Partial** — harness has budget but no configurable limits | Important |
| Circuit breaker | Per-task circuit breaker in `manager-circuit-breaker.test.ts` | Tool signature loop detection, threshold=16 (src/plugin.ts:37) | **Different approach** — harness detects loops, not failures | Important |
| Error classification | `error-classifier.ts` — classifies errors for retry decisions | Not present | **Missing** | Important |
| Fallback retry handler | `fallback-retry-handler.ts` — retries with fallback models | Not present | **Missing** | Critical |

### State & Continuity

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Plan state persistence | Boulder state at `.sisyphus/boulder.json` — plan progress, wave state, approval gates | Continuity JSON at `.opencode/state/hivemind/session-continuity.json` | **Different** — boulder is plan-centric, continuity is session-centric | Important |
| Plan progress tracking | `getPlanProgress()` in boulder-state | Not present | **Missing** | Important |
| Worktree sync | `boulder-state/worktree-sync.ts` — syncs state across worktrees | Not present | **Missing** | Nice-to-have |
| Session state tracking | In-memory Maps + boulder.json + SQLite (session-last-agent.sqlite) | In-memory Maps (state.ts) + continuity.json | **Partial** — harness lacks SQLite, has simpler persistence | Important |
| Task history | `task-history.ts` — persistent task status tracking | `task-status.ts` — type system only, no persistence | **Missing** — harness has types but no history | Important |
| Compaction-aware resolution | `compaction-aware-message-resolver.ts` — resolves messages after compaction | Not present | **Missing** | Important |

### Visualization & UX

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Tmux visualization | `TmuxSessionManager` — multi-pane grid for parallel agent visualization | Not present | **Missing** | Nice-to-have |
| Task toast tracking | `task-toast-manager` + `legacy-plugin-toast` | `formatToastMessage()` (src/lib/notification-handler.ts:47) — no toast manager | **Partial** — harness has formatter but no manager | Nice-to-have |
| Background notifications | `background-notification` hook + `background-task-notification-template.ts` | `notifyParentSession()` (src/lib/notification-handler.ts:55) | **Partial** — harness has basic notification, no templating | Important |
| Doctor/health checks | `cli/doctor/` — checks for tools, LSP, MCP, dependencies | Not present | **Missing** | Nice-to-have |

### MCP & Skills

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| Skill system | `skill` tool + `skill-mcp` — skills as first-class citizens with isolated MCP per skill | Not present | **Missing** | Critical |
| SkillMcpManager | Isolated MCP server per skill | Not present | **Missing** | Important |
| Built-in MCPs | arXiv, and others configured via schema | Not present | **Missing** | Nice-to-have |
| Available skills registry | `available-skills.ts` — tracks skill availability per agent | Not present | **Missing** | Important |
| Category skill reminder | `category-skill-reminder` hook | Not present | **Missing** | Nice-to-have |

### CLI & Configuration

| Feature | oh-my-openagent | harness-experiment | Gap | Importance |
|---------|----------------|-------------------|-----|-----------|
| CLI installer | `cli/config-manager/` — auto-install, config detection, deep merge | Not present | **Missing** | Nice-to-have |
| Config schema | Extensive Zod schemas for all features (background-task, ralph-loop, tmux, hooks, etc.) | Not present — uses hardcoded constants | **Missing** | Important |
| Example configs | `docs/examples/` — coding-focused, planning-focused, default | Not present | **Missing** | Nice-to-have |
| Agent model matching | `docs/guide/agent-model-matching.md` + `model-resolution.ts` | Not present | **Missing** | Important |

---

## 2. ARCHITECTURE COMPARISON

### Hook System: 48 hooks vs 5 hooks

**oh-my-openagent** has hooks organized into functional categories:
- **Core orchestration**: atlas (boulder state, session lineage, wave management, approval gates)
- **Resilience**: session-recovery, delegate-task-retry, runtime-fallback, model-fallback, edit-error-recovery, json-error-recovery, anthropic-context-window-limit-recovery
- **Context management**: compaction-context-injector, todo-continuation-enforcer, compaction-todo-preserver, directory-agents-injector, directory-readme-injector, rules-injector
- **Agent behavior**: agent-usage-reminder, think-mode, thinking-block-validator, keyword-detector, category-skill-reminder, todo-description-override
- **Safety**: write-existing-file-guard, webfetch-redirect-guard, stop-continuation-guard, comment-checker
- **UX**: background-notification, legacy-plugin-toast, task-reminder, task-resume-info, tasks-todowrite-disabler
- **Integration**: claude-code-hooks, interactive-bash-session, hashline-edit-diff-enhancer, hashline-read-enhancer, read-image-resizer, lsp hooks
- **Automation**: auto-update-checker, auto-slash-command, ralph-loop, start-work, prometheus-md-only
- **Model-specific**: no-hephaestus-non-gpt, no-sisyphus-gpt, anthropic-effort

**harness-experiment** has 5 hooks:
1. `tool.execute.before` — tool call counting + circuit breaker
2. `tool.execute.after` — metadata injection
3. `event` — lifecycle state transitions
4. `experimental.session.compacting` — context injection for compaction
5. `shell.env` — CI environment variables

**What matters most that we're missing:**
- **Context window recovery** (Critical) — without this, long sessions will crash
- **Session retry with fallback** (Critical) — single model means single point of failure
- **Todo continuation** (Important) — todos lost on compaction breaks workflow
- **Atlas orchestration** (Critical) — no plan management, no wave approval, no boulder state

### Tool System: 26 tools vs 1 tool

**oh-my-openagent tools:**
1. `delegate-task` — delegation with categories, constraints, priority
2. `background-task` — full async task management
3. `call_omo_agent` — agent-to-agent calling
4. `session-manager` — session CRUD
5. `task` — task CRUD (create/read/update/delete)
6. `glob` — file globbing
7. `grep` — content search
8. `ast-grep` — AST-based code search
9. `hashline-edit` — content-addressable editing
10. `interactive-bash` — persistent shell sessions
11. `look_at` — file viewing
12. `lsp` — language server protocol
13. `skill` — skill management
14. `skill-mcp` — skill-scoped MCP
15. `slashcommand` — slash command execution

**harness-experiment tools:**
1. `delegate-task` — basic delegation

**Which would add real value:**
- `background-task` (Critical) — harness's `run_in_background` is a poor substitute
- `call_omo_agent` (Important) — enables agent-to-agent communication
- `task` CRUD (Important) — task lifecycle management
- `session-manager` (Important) — session introspection

### Agent System: 8+ agents vs 3 agents

**Is 3 enough?** No, for these reasons:
- **No orchestrator** — harness has no Atlas-equivalent to coordinate work waves
- **No planner** — harness has no Prometheus-equivalent to generate structured plans
- **No verifier** — harness has no Sisyphus-equivalent to validate outputs
- **No guidance agent** — harness has no Oracle-equivalent for meta-reasoning
- **No researcher** — harness's "researcher" is a restricted read-only agent, not a Metis-equivalent with search/discovery

The 3 agents (researcher, builder, critic) cover basic read/write/review but lack orchestration, planning, and verification capabilities.

### State Management: boulder.json + tmux vs continuity.json

**oh-my-openagent** uses a multi-layer approach:
- `.sisyphus/boulder.json` — plan state, wave progress, approval gates
- In-memory Maps — session state, task state
- SQLite — session-last-agent tracking
- Worktree sync — cross-worktree state

**harness-experiment** uses:
- `.opencode/state/hivemind/session-continuity.json` — session records
- In-memory Maps — stats, budgets, delegation meta

**Which is better?** Harness's approach is simpler and more focused on session continuity rather than plan state. However, it lacks:
- Plan progress tracking
- Wave management
- Approval gates
- Cross-worktree sync

For a delegation-focused plugin, harness's session-centric approach is appropriate but incomplete.

### Concurrency: per-model global limits vs keyed semaphore

**oh-my-openagent:**
- Per-model FIFO queues
- Global `max_background_agents` limit
- Per-model capacity tracking
- Configurable via schema

**harness-experiment:**
- Keyed semaphore (model/agent/category)
- Default limit of 3 (env-configurable)
- No global limit
- No per-model capacity tracking

Harness's approach is simpler but lacks the safety of global limits and per-model capacity awareness.

---

## 3. WHAT oh-my-openagent DOES THAT OPENCODE NATIVE CANNOT

1. **Coordinated multi-agent orchestration** — Atlas manages work waves, approval gates, and boulder state. OpenCode has no built-in orchestrator.
2. **Background task state machine** — Full pending→queued→running→polling→complete lifecycle with polling API. OpenCode has basic session creation but no task management.
3. **Automatic context window recovery** — Multi-strategy recovery (truncation, summarization, dedup) when hitting Anthropic limits. OpenCode has basic compaction but no recovery.
4. **Model fallback chains** — Automatic retry with fallback models on failure. OpenCode uses a single model per session.
5. **Content-addressable editing** — Hashline-edit with deduplication. OpenCode has basic edit/Write tools.
6. **Skill-scoped MCP servers** — Isolated MCP per skill. OpenCode has MCP but not skill-scoped.
7. **Session-to-agent routing** — Dynamic prompt builder routes to appropriate agent based on category/context. OpenCode has static agent definitions.
8. **Plan continuation** — Boulder state persists plan progress across sessions. OpenCode has no plan state.
9. **Ralph loop** — Iteration loop controller for repeated refinement. OpenCode has no loop controller.
10. **Todo continuation across compactions** — Preserves todos when context is compacted. OpenCode loses todos on compaction.

---

## 4. WHAT harness-experiment DOES THAT oh-my-openagent DOES NOT

1. **Simpler continuity model** — harness uses a single JSON file for all session state vs oh-my-openagent's boulder.json + in-memory + SQLite. Simpler to reason about.
2. **Typed SDK wrappers** — harness's `session-api.ts` uses TypeScript types from `@opencode-ai/sdk` vs oh-my-openagent's untyped client flow.
3. **Cleaner permission model** — harness uses `PermissionRule[]` with allow/deny/ask actions vs oh-my-openagent's more complex tool restriction system.
4. **Two-signal completion detection** — harness's `CompletionDetector` uses both session.idle events AND message count stability vs oh-my-openagent's simpler idle detection.
5. **Zero runtime dependencies** — harness is zero-dep by design vs oh-my-openagent's extensive dependency tree.
6. **Compact codebase** — ~3,200 LOC vs 276,598 lines. Easier to audit, modify, and maintain.

---

## 5. WHAT harness-experiment DOES WORSE THAN oh-my-openagent

### Critical Gaps

1. **No context window recovery** (oh-my-openagent: `src/hooks/anthropic-context-window-limit-recovery/` — 20+ files)
   - Harness will crash on context overflow with no recovery
   - Evidence: No hook or tool handles context limit errors

2. **No model fallback** (oh-my-openagent: `src/hooks/model-fallback/`, `src/hooks/runtime-fallback/`, `src/hooks/session-recovery/`)
   - Harness uses a single model per session — if it fails, the task fails
   - Evidence: `session-api.ts:56-67` has no retry logic, no fallback chain

3. **No plan management** (oh-my-openagent: `src/features/boulder-state/`, `src/hooks/atlas/`)
   - Harness has no concept of plans, waves, or approval gates
   - Evidence: No plan-related types in `types.ts`, no boulder state

4. **No task lifecycle API** (oh-my-openagent: `src/tools/task/`, `src/tools/background-task/`)
   - Harness tracks tasks only in continuity.json with no CRUD API
   - Evidence: No task tool, no task CRUD functions

5. **No dynamic prompt composition** (oh-my-openagent: `src/agents/dynamic-agent-prompt-builder.ts` — 530 LOC)
   - Harness uses a static template in `buildPromptText()` (src/lib/helpers.ts:73-116)
   - Evidence: No runtime prompt composition, no skill injection, no context-aware building

### Important Gaps

6. **No agent-to-agent communication** (oh-my-openagent: `src/tools/call-omo-agent/`)
   - Harness agents cannot delegate to each other directly
   - Evidence: Only `delegate-task` tool exists

7. **No session introspection** (oh-my-openagent: `src/tools/session-manager/`)
   - Harness cannot list, inspect, or manage sessions
   - Evidence: `session-api.ts` has only create/get/abort/messages/prompt

8. **No config schema** (oh-my-openagent: `src/config/schema/` — multiple Zod schemas)
   - Harness uses hardcoded constants (`MAX_DEPTH=3`, `CIRCUIT_BREAKER_THRESHOLD=16`)
   - Evidence: No Zod schemas, no config validation

9. **No skill system** (oh-my-openagent: `src/tools/skill/`, `src/tools/skill-mcp/`)
   - Harness has no concept of skills or skill-scoped MCP
   - Evidence: No skill-related code

10. **Simpler concurrency** (oh-my-openagent: `src/features/background-agent/concurrency.ts` — 137 LOC with global limits)
    - Harness lacks global concurrency limits and per-model capacity tracking
    - Evidence: `concurrency.ts:36-98` — simple keyed semaphore only

### Code Quality Gaps

11. **No tests** — oh-my-openagent has extensive test coverage (hundreds of test files). Harness has no test files in the current codebase.
12. **No CLI** — oh-my-openagent has `cli/` for installation, config management, doctor checks. Harness has none.
13. **No documentation** — oh-my-openagent has `docs/guide/`, `docs/reference/`, `docs/examples/`. Harness has only AGENTS.md.
14. **`asString` duplication** — exists in both `helpers.ts:33` and `continuity.ts:110` (acknowledged in AGENTS.md code smells)
15. **`continuity.ts` at 638 LOC** — mixes normalization, cloning, and CRUD (acknowledged in AGENTS.md)

---

## 6. SUMMARY ASSESSMENT

**harness-experiment is a minimal viable delegation layer**, not a feature-complete orchestration system. It covers the core delegation workflow (create child session → enforce permissions → track continuity → detect completion) but lacks the resilience, orchestration, and extensibility features that make oh-my-openagent production-ready.

**The gap is approximately 80-85% in feature coverage**, with the most critical missing pieces being:
1. Context window recovery (will cause crashes)
2. Model fallback (single point of failure)
3. Plan/orchestration layer (no coordination)
4. Task lifecycle API (no task management)

**Where harness is better:**
- Simpler mental model (session-centric vs plan-centric)
- Zero runtime dependencies
- Typed SDK wrappers
- Two-signal completion detection (more robust than simple idle detection)
- Easier to audit and modify

**Recommendation:** Harness should prioritize adding context window recovery, model fallback, and a basic task CRUD API before considering it production-ready. The orchestration layer (Atlas-equivalent) and skill system can come later.
