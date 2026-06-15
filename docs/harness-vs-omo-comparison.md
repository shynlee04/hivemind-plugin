# Harness vs Oh-My-Openagent: Brutal Feature Comparison

**Date:** 2026-04-02
**Harness LOC:** ~2,800 (13 source files)
**Oh-My-Openagent LOC:** ~276,598 (packed XML, estimated 15,000+ source lines across 300+ files)

---

## 1. FEATURE PARITY MATRIX

| Feature | Oh-My-Openagent | Harness | Gap | Importance |
|---------|----------------|---------|-----|------------|
| **Delegation Tool** | `delegate-task` with sync/async, retry, unstable-agent handling, token limiting | `delegate-task` with sync/async, depth limit (3), tool budgets (400) | **Partial** — no retry, no token limits, no unstable-agent fallback | Critical |
| **Background Task System** | `background-task` tool with full state machine (pending→queued→running→polling→complete/error/cancelled), circuit breaker, stale-timeout detection, compaction-aware message resolver, process cleanup | `run_in_background` flag on delegate-task + `CompletionDetector` + `notifyParentSession` | **Partial** — basic state machine exists, but no polling manager, no stale detection, no compaction-aware resolution | Critical |
| **Agent Nesting (call_omo_agent)** | `call_omo_agent` tool — spawns nested agents with sync executor, session creator, subagent session creator, completion poller | None — harness has no equivalent of nesting agents inside agents | **Missing** — harness only delegates from parent→child, no recursive nesting | Important |
| **Session Management** | `session-manager` tool — list, create, delete, format sessions with storage layer | SDK wrappers only (`createSession`, `getSession`, `abortSession`) — no dedicated tool | **Missing** — no session management tool, just typed SDK wrappers | Nice-to-have |
| **Skill System** | `skill` tool — skill discovery, loading, metadata | None — harness has no skill tool | **Missing** | Important |
| **Skill MCP** | `skill-mcp` tool — isolated MCP server per skill with builtin-MCP hints | None | **Missing** | Nice-to-have |
| **Content-Addressable Editing** | `hashline-edit` — 18-file subsystem: edit deduplication, hash computation, file canonicalization, edit ordering, formatter triggers, diff utilities | None — relies on OpenCode's native `edit` tool | **Missing** — harness has zero editing intelligence | Important |
| **LSP Integration** | `lsp_*` tools — full LSP client: diagnostics, find-references, goto-definition, rename, server management, workspace edits | None | **Missing** | Nice-to-have |
| **Interactive Bash** | `interactive-bash` with tmux session management, tmux path resolver, session tracking | None — harness only sets `TERM=dumb` via `shell.env` hook | **Missing** | Important |
| **Look-At (Multimodal)** | `look-at` tool — image conversion, MIME inference, multimodal fallback chain, session polling | None | **Missing** | Nice-to-have |
| **AST-Grep** | `ast-grep` tool — structural code search with compact JSON output | None — harness only has `grep` (text-based) | **Missing** | Nice-to-have |
| **Glob/Grep** | Dedicated `glob` and `grep` tools with CLI wrappers, result formatters, type definitions | None — harness relies on OpenCode's native tools | **Missing** — no custom search tools | Nice-to-have |
| **Task CRUD** | `task` tool — create, get, list, update tasks with todo-sync | None | **Missing** | Important |

---

## 2. HOOK SYSTEM COMPARISON

### Oh-My-Openagent: 48 hooks across 3 categories

**createCoreHooks (39 hooks):**
- Atlas orchestration hook (boulder continuation, session lineage, verification reminders, edit policy)
- Auto-slash-command detector/executor
- Auto-update-checker with background checks and toasts
- Comment-checker hook
- Compaction-todo-preserver
- Delegate-task-retry hook
- Directory-agents-injector
- Directory-readme-injector
- Edit-error-recovery
- Hashline-edit-diff-enhancer
- Hashline-read-enhancer
- Interactive-bash-session tracker
- JSON-error-recovery
- Keyword-detector (ultrawork variants for GPT/Gemini/Claude)
- Legacy-plugin-toast
- Model-fallback hook
- No-hephaestus-non-gpt / No-sisyphus-gpt (model-agent compatibility guards)
- Non-interactive-env detector
- Ralph-loop hook (iteration loop controller)
- Read-image-resizer
- Rules-injector (project rule discovery and injection)
- Runtime-fallback (agent resolver, auto-retry, fallback models, session status handling)
- Session-recovery (14-file subsystem: empty content recovery, thinking block recovery, tool result recovery, resume)
- Sisyphus-junior-notepad
- Start-work hook with worktree detection
- Stop-continuation-guard
- Task-reminder
- Task-resume-info
- Tasks-todowrite-disabler
- Think-mode detector/switcher

**createContinuationHooks (7 hooks):**
- Boulder continuation injector
- Boulder session lineage
- Continuation prompt builder/injector
- Iteration continuation
- Loop session recovery
- Ralph-loop event handler
- Verification failure handler

**createSkillHooks (2 hooks):**
- Skill loading
- Skill MCP integration

### Harness: 5 hooks

| Hook | Purpose |
|------|---------|
| `tool.execute.before` | Tool call counting, circuit breaker (loop detection), budget enforcement |
| `tool.execute.after` | Metadata injection (harness state snapshot into tool output) |
| `event` | Event→status mapping, lifecycle state updates |
| `experimental.session.compacting` | Continuity snapshot injection into context during compaction |
| `shell.env` | CI mode environment variables |

### Hook Gap Analysis

| Capability | OMO | Harness | Gap |
|-----------|-----|---------|-----|
| Retry on failure | delegate-task-retry hook | None | **Missing** |
| Model fallback | runtime-fallback hook (14 files) | None | **Missing** |
| Session recovery | session-recovery hook (14 files) | None | **Missing** |
| Error recovery (edit/JSON) | edit-error-recovery, json-error-recovery | None | **Missing** |
| Rules injection | rules-injector (14 files) | None | **Missing** |
| Continuation/injection | boulder-continuation, continuation-prompt-injector | Basic continuity snapshot in compaction hook | **Partial** — harness persists state but doesn't inject it into prompts |
| Ralph loop | ralph-loop hook + controller | None | **Missing** |
| Worktree detection | start-work hook | None | **Missing** |
| Model-agent compatibility guards | no-hephaestus-non-gpt, no-sisyphus-gpt | None | **Missing** |
| Think mode | think-mode detector/switcher | None | **Missing** |
| Keyword detection | keyword-detector with model-specific variants | None | **Missing** |
| Update checking | auto-update-checker | None | **Missing** |
| Todo preservation | compaction-todo-preserver, tasks-todowrite-disabler | Basic continuity snapshot (no todo-specific logic) | **Partial** |

---

## 3. AGENT SYSTEM COMPARISON

### Oh-My-Openagent: 8 Specialist Agents

| Agent | Role | Model Preference |
|-------|------|-----------------|
| Atlas | Orchestrator — plan continuation, boulder state, verification | Claude |
| Hephaestus | Code implementation | GPT-4-class |
| Prometheus | Planning | Claude |
| Sisyphus | Verification/review | Claude |
| Oracle | Guidance/advice | Claude |
| Librarian | Documentation | Claude |
| Metis | Research | Claude |
| Explore | Discovery | Claude |

### Harness: 3 Specialist Agents

| Agent | Role | Temperature | Permission Model |
|-------|------|-------------|-----------------|
| researcher | Investigation | 0.1 | Read-only (edit/write/bash/task denied) |
| builder | Implementation | 0.15 | Full edit/write/bash, no task spawning |
| critic | Review | 0.05 | Read + bash for tests, no edits |

### Agent Gap Analysis

| Aspect | OMO | Harness | Assessment |
|--------|-----|---------|------------|
| Agent count | 8 | 3 | **Gap** — 5 agents missing |
| Orchestrator | Atlas (dedicated) | `conductor` agent (in .opencode/agents/, not enforced by plugin) | **Partial** — conductor exists as config, not as plugin-enforced role |
| Model-agent affinity | Enforced (no-hephaestus-non-gpt hook) | None — no model-agent compatibility checks | **Missing** |
| Agent temperature | Per-agent in category config | Hardcoded in `plugin.ts:40-44` | **Equivalent** (simpler is fine) |
| Agent permissions | Complex permission matrices | Simple allow/ask rules in agent `.md` frontmatter | **Equivalent** — harness approach is cleaner |
| Agent discovery | Plugin-based agent loading | Static 3-agent list in `types.ts:5` | **Gap** — not extensible without code changes |
| Agent prompt injection | Dynamic (directory-agents-injector, rules-injector) | Static prompt builder in `helpers.ts:73-116` | **Gap** — harness has no dynamic prompt composition |

**Is 3 agents enough?** For a minimal harness, yes — researcher/builder/critic covers the core triad. But the missing orchestrator (Atlas-equivalent) means there's no agent responsible for plan continuation, state recovery, or multi-phase coordination. The `conductor` agent exists in `.opencode/agents/conductor.md` but is NOT defined in `VALID_AGENTS` and has no permission profile in the plugin.

---

## 4. STATE MANAGEMENT COMPARISON

### Oh-My-Openagent: Boulder State + Tmux

- **Boulder state** (`.sisyphus/boulder.json`): Plan continuation state, active phase, worktree path, session lineage
- **TmuxSessionManager**: Multi-pane grid visualization, interactive bash sessions with tmux path resolution
- **Worktree sync**: boulder-state/worktree-sync.ts synchronizes state across git worktrees
- **Top-level task tracking**: boulder-state/top-level-task.ts
- **Session-last-agent**: SQLite-backed agent history (`session-last-agent.sqlite`)
- **Session continuation**: boulder-continuation-injector.ts, boulder-session-lineage.ts

### Harness: Continuity JSON

- **Continuity store** (`.opencode/state/hivemind/session-continuity.json`): Single JSON file with all session records
- **In-memory Maps** (`state.ts`): sessionStats, rootBudgets, sessionToRoot, sessionDelegationMeta
- **Deep-clone-on-read**: Prevents mutation aliasing
- **Module-level singleton** `storeCache`: Known tech debt

### State Management Assessment

| Aspect | OMO | Harness | Better |
|--------|-----|---------|--------|
| Durability | boulder.json + SQLite | Single JSON file | **OMO** — SQLite for agent history is more robust |
| Continuity | Boulder continuation injector + session lineage | Continuity record with full lifecycle state | **Harness** — more structured continuity schema |
| Worktree support | Explicit worktree sync | None | **OMO** |
| Visualization | Tmux multi-pane grid | None | **OMO** |
| Simplicity | Complex (multiple state files) | Single file + in-memory maps | **Harness** — simpler is easier to reason about |
| Recovery | Session-recovery subsystem (14 files) | Basic hydration from continuity file | **OMO** — much more robust |

---

## 5. CONCURRENCY COMPARISON

### Oh-My-Openagent: ConcurrencyManager + BackgroundManager

- **Per-model FIFO queues** with configurable limits
- **Global background agent limit** (`maxBackgroundAgents`, default 5)
- **Provider-specific concurrency** (`providerConcurrency`)
- **Model-specific concurrency** (`modelConcurrency`)
- **Stale timeout detection** (default 180s)
- **Message staleness timeout** (default 30min)
- **Circuit breaker** on background tasks
- **Process cleanup** on shutdown
- **Loop detection** (loop-detector.ts)
- **Polling manager** (task-poller.ts)
- **Compaction-aware message resolver**

### Harness: Keyed Semaphore

- **Per-key lanes** (model, agent, category) with configurable limit (default 3)
- **FIFO queue** per lane with promise-based acquire/release
- **Root budget** (max 10 descendants per root)
- **Tool call budget** (400 per session)
- **Circuit breaker** (16 repeated tool signatures)
- **No global limit** — only per-key
- **No stale detection**
- **No loop detection beyond tool signatures**
- **No polling manager** — CompletionDetector is event-driven only

### Concurrency Assessment

| Aspect | OMO | Harness | Gap |
|--------|-----|---------|-----|
| Per-model limits | Yes (configurable) | Yes (via key: `model:<name>`) | **Equivalent** |
| Global limits | Yes (`maxBackgroundAgents`) | No | **Missing** |
| Provider-specific | Yes | No | **Missing** |
| Stale detection | Yes (180s default) | No | **Missing** |
| Circuit breaker | Yes (background-task) | Yes (tool signature, threshold=16) | **Equivalent** |
| Loop detection | Dedicated loop-detector.ts | Tool signature only | **Partial** |
| Polling | Task-poller with configurable intervals | None (event-driven only) | **Missing** |
| Process cleanup | Yes | No | **Missing** |
| Budget enforcement | Tool call + token limits | Tool call (400) + descendant (10) | **Partial** — no token limits |

---

## 6. WHAT OMO DOES THAT OPENCODE NATIVE CANNOT

Verified against the reference codebase:

1. **Boulder state plan continuation** — OMO persists plan state across sessions with phase tracking. OpenCode native has no plan continuation.
2. **Ralph Loop** — Iteration loop controller with verification-gated progression. OpenCode native has no iteration loop.
3. **Hashline editing** — Content-addressable editing with deduplication. OpenCode native has basic edit, not content-addressable.
4. **Per-skill MCP isolation** — SkillMcpManager creates isolated MCP servers per skill. OpenCode native has global MCP config.
5. **Model fallback chains** — Runtime-fallback subsystem with automatic retry on fallback models. OpenCode native has no fallback.
6. **Session recovery** — 14-file subsystem for recovering from empty content, thinking block issues, missing tool results. OpenCode native has no recovery.
7. **Agent-model compatibility enforcement** — Hooks prevent Hephaestus on non-GPT, Sisyphus on GPT. OpenCode native has no agent-model guards.
8. **Interactive bash with tmux** — Multi-pane tmux grid visualization. OpenCode native has basic bash.
9. **LSP integration** — Full LSP client as tools. OpenCode native has no LSP.
10. **Delegate-task retry** — Automatic retry with guidance on failure. OpenCode native delegate-task has no retry.
11. **Directory-level agent injection** — Agents defined per-directory with automatic discovery. OpenCode native has global agents only.
12. **Rules injection** — Project-specific rules discovered and injected per-request. OpenCode native has static rules.
13. **Compaction-aware message resolution** — Background tasks resolve messages considering compaction state. OpenCode native has no compaction awareness.
14. **Todo preservation across compactions** — Compaction-todo-preserver hook. OpenCode native loses todos on compaction.

---

## 7. WHAT HARNESS DOES THAT OMO DOES NOT

1. **Simpler architecture** — 2,800 LOC vs 276,598. Harness is auditable in a single sitting.
2. **Typed SDK wrappers** — `session-api.ts` uses TypeScript types from `@opencode-ai/plugin` SDK. OMO uses `any` extensively.
3. **Deep-clone-on-read continuity** — Harness prevents mutation aliasing. OMO's boulder state doesn't clone on read.
4. **Tool signature circuit breaker** — Harness detects repeated identical tool calls. OMO has circuit breaker on background tasks but not on tool signatures.
5. **Compaction context injection** — Harness injects full state snapshot into compaction context. OMO has compaction filters but not full state injection.
6. **Shell environment hardening** — Harness sets `CI=true`, `NO_COLOR=1`, `TERM=dumb`, `GIT_TERMINAL_PROMPT=0`. OMO has non-interactive-env but less comprehensive.
7. **Permission-as-code in agent files** — Harness reads permissions from agent `.md` frontmatter. OMO has permission config in code.

---

## 8. WHAT HARNESS DOES WORSE THAN OMO (Specific Code References)

### 8.1 No Retry Logic

**OMO:** `src/tools/delegate-task-retry/hook.ts` + `src/features/background-agent/fallback-retry-handler.ts` — automatic retry with model fallback.

**Harness:** `src/lib/lifecycle-manager.ts:387-399` — background `sendPrompt` catches errors and patches lifecycle to `failed`, then silently drops. No retry, no fallback model, no guidance injection.

```typescript
// harness-experiment/src/lib/lifecycle-manager.ts:387-399
sendPrompt(this.options.client, childSessionID, body).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  this.patchLifecycle(childSessionID, {
    status: "error",
    phase: "failed",
    error: message,
    observation: { source: "dispatch", observedAt: now(), detail: "prompt-dispatch-failed" },
  })
})
```

**Impact:** Any transient API error (rate limit, timeout, model unavailable) permanently fails the task. OMO would retry with a fallback model.

### 8.2 No Model Fallback

**OMO:** `src/features/runtime-fallback/` — 14-file subsystem with fallback chains, auto-retry, model availability checking, retry dispatch.

**Harness:** `src/lib/types.ts:62-63` — `effectiveModel` is either the explicitly requested model or `undefined`. No fallback chain, no model availability checking.

**Impact:** If the preferred model is unavailable, the task fails immediately.

### 8.3 No Session Recovery

**OMO:** `src/features/session-recovery/` — 14 files handling empty content recovery, thinking block order recovery, tool result missing recovery, resume logic.

**Harness:** `src/lib/session-api.ts` — bare SDK calls with `unwrapData()` error extraction. No recovery from malformed responses, no thinking block handling, no tool result recovery.

**Impact:** Any SDK-level error (empty response, malformed JSON, missing fields) propagates as a hard failure.

### 8.4 Prompt Builder is Static

**OMO:** `src/tools/delegate-task/prompt-builder.ts` + `src/features/dynamic-prompt-builder/` — runtime composition based on category, agent, directory, rules, skills, model family.

**Harness:** `src/lib/helpers.ts:73-116` — `buildPromptText()` concatenates fixed sections (TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT). No dynamic composition, no model-family variants, no directory-specific injection.

**Impact:** All agents get the same prompt template regardless of model, directory, or context. OMO adapts prompts per model family (Claude vs GPT vs Gemini).

### 8.5 No Token Budgeting

**OMO:** `src/tools/delegate-task/token-limiter.ts` — token counting and limiting per delegated task.

**Harness:** `src/plugin.ts:38` — `MAX_TOOL_CALLS_PER_SESSION = 400`. No token counting, no context window awareness.

**Impact:** A delegated task can consume the entire context window without the harness knowing.

### 8.6 Conductor Agent Not Enforced

**OMO:** Atlas agent is enforced by the plugin — it's the orchestrator with dedicated hooks for boulder state, session lineage, verification.

**Harness:** `src/lib/types.ts:5` — `VALID_AGENTS = ["researcher", "builder", "critic"]`. The `conductor` agent exists in `.opencode/agents/conductor.md` but is NOT in `VALID_AGENTS`, has no permission profile in `getPermissionRulesForAgent()`, and cannot be delegated to.

**Impact:** The orchestrator role is a config file, not an enforced plugin concept. The harness cannot delegate to a conductor.

### 8.7 No Stale Task Detection

**OMO:** `src/features/background-agent/manager.ts` — stale timeout (180s default) + message staleness timeout (30min) with automatic interruption.

**Harness:** `src/lib/completion-detector.ts` — only detects terminal events (idle, error, deleted). No staleness detection, no timeout on running tasks (only on the watch promise).

**Impact:** A hung delegated session will occupy a concurrency lane indefinitely until manually cancelled.

### 8.8 No Loop Detection Beyond Tool Signatures

**OMO:** `src/features/background-agent/loop-detector.ts` — dedicated loop detection analyzing message patterns, not just tool calls.

**Harness:** `src/plugin.ts:138-154` — circuit breaker only on repeated identical tool signatures (`makeToolSignature(toolName, args)`). An agent could loop through different tools doing the same thing and never trigger the breaker.

**Impact:** Sophisticated loops (different tools, same intent) are not detected.

### 8.9 Continuity Singleton Prevents Testing

**OMO:** Uses dependency injection for state stores in tests.

**Harness:** `src/lib/continuity.ts:26` — `let storeCache: ContinuityStoreFile | undefined` is a module-level singleton. No way to inject a mock store. Every test that touches continuity shares the same cache.

**Impact:** Unit tests cannot isolate continuity behavior. Tests must either monkey-patch or share state.

### 8.10 No Worktree Support

**OMO:** `src/features/boulder-state/worktree-sync.ts` — synchronizes boulder state across git worktrees.

**Harness:** No worktree awareness. Continuity file is at `.opencode/state/hivemind/session-continuity.json` relative to CWD.

**Impact:** Running harness in a git worktree creates a separate continuity file with no connection to the main worktree.

---

## 9. SUMMARY VERDICT

### Harness is a toy compared to OMO in these areas:

1. **Resilience** — No retry, no fallback, no session recovery. Any transient failure is permanent.
2. **Intelligence** — Static prompt builder, no model-family adaptation, no dynamic context injection.
3. **Observability** — No stale detection, no loop detection beyond tool signatures, no token budgeting.
4. **Ecosystem** — No LSP, no hashline editing, no skill system, no MCP per skill, no AST-grep.
5. **Continuity** — No worktree sync, no plan continuation (boulder state), no Ralph loop.
6. **Agent depth** — 3 agents vs 8, no orchestrator enforcement, no agent-model compatibility guards.

### Harness is better than OMO in these areas:

1. **Simplicity** — 2,800 LOC vs 276,598. The entire harness can be understood in an hour. OMO requires days.
2. **Type safety** — Typed SDK wrappers vs OMO's pervasive `any` usage.
3. **Permission design** — Agent frontmatter permissions are declarative and colocated with agent definitions. OMO scatters permissions across code.
4. **Continuity schema** — Harness has a well-typed, versioned continuity schema with deep-clone-on-read. OMO's boulder state is more ad-hoc.
5. **Zero runtime dependencies** — Harness is truly zero-dep. OMO depends on Zod, SQLite, and other runtime deps.

### Bottom Line

The harness is a **proof-of-concept delegation layer** — it proves that parent→child session delegation with budgets, concurrency, and continuity is possible within the OpenCode plugin system. It is NOT a production-ready agent orchestration system.

Oh-My-Openagent is a **full agent Operating System** — it handles retries, fallbacks, recovery, editing intelligence, LSP, multimodal input, skill isolation, plan continuation, iteration loops, and worktree synchronization.

The gap is approximately **10-15x in feature surface area** and **50x in code volume**. The harness could reach feature parity with OMO, but it would require adding ~20 subsystems that currently don't exist.
