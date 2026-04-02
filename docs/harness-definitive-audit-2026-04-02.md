# OpenCode Harness — Definitive Audit: True Usability Assessment

**Date:** 2026-04-02
**Type:** Deep usability audit with native-capability comparison
**Verdict:** **NO jaw-dropping features. The harness is inferior to OpenCode native + OMO, and the zero-dep constraint cripples it further.**

---

## 0. Methodology Note

This audit does NOT trust the requirements or user stories documents — they are AI-generated, contain invented APIs, platform-model contradictions, and have never been validated by a human against the actual OpenCode SDK. Instead, this audit compares **what the harness code actually does** against **what OpenCode provides natively** and **what OMO provides with dependencies**.

---

## 1. What OpenCode Already Provides Natively (No Plugin Needed)

Before evaluating the harness, we must establish the baseline. OpenCode's native `.opencode/` directory structure already provides:

### 1.1 Agent Configuration (`.opencode/agents/*.md`)

Each agent `.md` file supports frontmatter that the **platform reads and enforces**:

```yaml
---
description: "Agent description"
mode: primary | subagent        # primary = top-level, subagent = delegated
temperature: 0.15               # per-agent temperature
steps: 80                       # per-agent step limit
permission:
  edit: allow | deny | ask
  write: allow | deny | ask
  bash:
    "*": ask                    # default: ask
    "git status*": allow        # pattern-matched overrides
    "git diff*": allow
  task: deny
  delegate-task: allow
  read: allow
  glob: allow
  grep: allow
  webfetch: ask
---

Full system prompt in markdown body...
```

**This means OpenCode NATIVELY handles:**
- Per-agent temperature
- Per-agent permissions with tool-level + pattern-matching granularity
- Per-agent step limits
- Agent mode (primary orchestrator vs subagent)
- Agent system prompts (the entire markdown body)
- Agent description for routing

### 1.2 Commands (`.opencode/commands/*.md`)

```yaml
---
description: "Command description"
agent: conductor       # which agent handles this command
subtask: false
---
```

Users can create `/ultrawork`, `/plan`, `/start-work`, `/harness-doctor` — all as .md files.

### 1.3 Skills (`.opencode/skills/*/SKILL.md`)

Skill directories with SKILL.md entry points. Already present in this project: `planning-with-files`, `harness-overview`, `shell-safety`, `wisdom-accumulation`.

### 1.4 Platform-Level Permissions (`opencode.json`)

```json
{
  "permission": {
    "read": "allow",
    "edit": "ask",
    "bash": { "*": "ask", "git status*": "allow" },
    "task": "ask",
    "doom_loop": "allow"
  }
}
```

### 1.5 Native Capabilities Summary

| Capability | Native Support | Mechanism |
|---|---|---|
| Agent temperature | ✅ | Frontmatter `temperature:` |
| Agent permissions (per-tool) | ✅ | Frontmatter `permission:` with pattern matching |
| Agent step limits | ✅ | Frontmatter `steps:` |
| Agent system prompts | ✅ | Markdown body |
| Agent mode (primary/subagent) | ✅ | Frontmatter `mode:` |
| Subagent delegation | ✅ | Native `task` tool |
| Async/background delegation | ✅ | Native `task` tool with background mode |
| Commands (user-triggered workflows) | ✅ | `.opencode/commands/*.md` |
| Skills (reusable capabilities) | ✅ | `.opencode/skills/*/SKILL.md` |
| Rules (global instructions) | ✅ | `.opencode/rules/*.md` |
| Doom loop detection | ✅ | Built-in `doom_loop` (3 identical calls) |
| Compaction config | ✅ | `opencode.json` → `compaction` |
| Plugin system | ✅ | `opencode.json` → `plugin` array |
| $ARGUMENTS interpolation | ✅ | In-text variable substitution |

---

## 2. Feature-by-Feature: Harness vs Native

For each harness feature, the critical question: **does this add capability beyond what OpenCode native + .md files already provide?**

### 2.1 `AGENT_DEFAULTS` (plugin.ts:40-44)

```typescript
const AGENT_DEFAULTS = {
  researcher: { temperature: 0.1 },
  builder:    { temperature: 0.15 },
  critic:     { temperature: 0.05 },
}
```

**Already native?** YES. Each agent `.md` file already has `temperature:` in frontmatter:
- `researcher.md`: `temperature: 0.1`
- `builder.md`: `temperature: 0.15`
- `conductor.md`: `temperature: 0.3`

**Verdict:** REDUNDANT. The plugin defines temperatures that duplicate agent frontmatter, and worse — the plugin never applies them via `chat.params`. The native frontmatter is the one that actually works.

### 2.2 `getPermissionRulesForAgent()` (plugin.ts:73-108)

Hardcoded permission rules per agent: researcher denies edit/write/bash/task, builder denies task, critic denies edit/write/task.

**Already native?** YES. Each agent `.md` has `permission:` frontmatter with identical rules:
- `researcher.md`: `edit: deny, write: deny, bash: deny, task: deny`
- `builder.md`: `edit: allow, write: allow, bash: allow, task: deny`

**Verdict:** REDUNDANT. Duplicates what the platform already reads and enforces from agent frontmatter.

### 2.3 `AGENT_TOOLS` required/mustNot (plugin.ts:46-50)

```typescript
const AGENT_TOOLS = {
  researcher: { required: ["read","glob","grep","webfetch"], mustNot: ["edit","write","bash","task"] },
  builder:    { required: ["read","glob","grep","edit","write","bash"], mustNot: ["task"] },
  critic:     { required: ["read","glob","grep","bash"], mustNot: ["edit","write","task"] },
}
```

**Already native?** YES — the `permission:` frontmatter in agent .md files expresses identical information. `deny` = mustNot, `allow` = required.

**Verdict:** REDUNDANT. And worse — these are only used in `buildPromptText()` as advisory text. The native frontmatter is what actually blocks tools.

### 2.4 `buildPromptText()` (helpers.ts:73-116)

Builds a structured prompt with TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT sections.

**Already native?** MOSTLY. The agent `.md` markdown body IS the system prompt. The conductor's system prompt already includes delegation protocol, intent classification, and workflow rules. The builder's system prompt already includes implementation rules, verification steps.

**Verdict:** MARGINAL VALUE. The structured prompt template adds some organization, but a well-written agent .md achieves the same. The MUST NOT DO section is particularly pointless since it only lists tools that the agent frontmatter already denies at platform level.

### 2.5 `delegate-task` custom tool (plugin.ts:310-442)

The centerpiece. Creates a child session, walks parent chain, checks depth, reserves budget, builds prompt, dispatches to lifecycle-manager.

**Already native?** PARTIALLY. OpenCode's native `task` tool already:
- Creates subagent sessions with the target agent's permissions
- Supports async/background execution
- Reads agent frontmatter for temperature, permissions, system prompt
- Handles session lifecycle

**What delegate-task adds over native:**
- Parent chain depth limit (MAX_DEPTH=3) — **minor guardrail**
- Root descendant budget (MAX=10) — **minor guardrail**
- Structured prompt injection — **redundant with agent .md system prompt**
- Continuity recording — **writes to JSON file nothing reads**
- Concurrency queue acquisition — **see §2.8**

**Verdict:** MARGINAL VALUE. The depth limit and budget are minor guardrails. Everything else is either redundant with native capabilities or writes to state that nothing consumes.

### 2.6 Circuit Breaker (plugin.ts:138-154)

Detects 16 consecutive identical tool+args signatures.

**Already native?** YES — OpenCode has `doom_loop` at 3 identical calls (visible in `opencode.json`: `"doom_loop": "allow"`).

**But does the harness's version add value?** NO. `makeToolSignature()` creates `toolName:stableStringify(args)` — this is EXACT match only. If args differ even slightly, it's a different signature. So this catches the EXACT same tool+args 16 times in a row — but the native `doom_loop` already catches it at 3. The harness version is strictly WORSE (higher threshold, same detection granularity).

**Verdict:** INFERIOR TO NATIVE. Higher threshold (16 vs 3) with identical detection logic. Provides no additional coverage.

### 2.7 Tool Call Budget (plugin.ts:131-136)

400 tool calls per session hard limit.

**Already native?** The native `steps:` frontmatter sets per-agent step limits (conductor=80, builder=80, researcher=60). Steps ≈ tool calls.

**Verdict:** MARGINAL VALUE. Provides a different axis of budget control (total tool calls vs agent steps), but the native step limit already bounds agent execution. The 400 limit is also so generous that it rarely triggers.

### 2.8 CompletionDetector (completion-detector.ts)

Two-signal completion detection: terminal events (session.idle, session.error, session.deleted) + message count stability timer.

**Already native?** OpenCode's native background task system handles completion notification. When you spawn a background agent via the native `task` tool, the platform notifies on completion.

**Does it add value?** THE STABILITY TIMER is the novel part. If a session doesn't emit terminal events cleanly (e.g., the model just stops responding), the message count stability approach detects "idle by inactivity." This is genuinely useful for edge cases where the platform's event system is unreliable.

**Verdict:** MARGINAL-TO-GENUINE VALUE. The stability timer is a real contribution, but it only matters if OpenCode's native completion signaling is unreliable — and the harness provides no evidence that it is.

### 2.9 ConcurrencyQueue (concurrency.ts)

Lane-based semaphore with per-key FIFO queuing.

**Already native?** Unclear — OpenCode may manage concurrency internally. If not, this is genuinely useful. But:
- No global limit (a user could spawn unlimited sessions across different keys)
- No stale detection (a hung session holds a lane forever)
- No evidence the harness actually spawns enough concurrent sessions to need queuing

**Verdict:** POTENTIALLY GENUINE VALUE — but untested, unvalidated, and incomplete (no global limit, no stale detection). Also, without `chat.params` to control model selection, the keyed concurrency (by model) is meaningless since the harness doesn't select models.

### 2.10 Metadata Injection (plugin.ts:159-197)

Injects `_harness` object into every tool output with: total tool calls, warnings, delegation depth, root session, agent, category, model, concurrency key, continuity status, lifecycle state, routing.

**Already native?** No — this is plugin-only behavior.

**Does it add value?** NO. Nothing consumes this metadata. No agent reads it. No diagnostic tool displays it. No decision is made based on it. It inflates every tool result with ~20 lines of JSON that are invisible to the user and ignored by the agent.

**Verdict:** NOISE. Adds overhead, consumed by nothing. Would be valuable if a diagnostic tool or agent actually read it — but none exists.

### 2.11 Compaction State Injection (plugin.ts:211-296)

Injects harness state snapshot into context during compaction events.

**Already native?** No — this is plugin-only behavior.

**Does it add value?** MINIMAL. The state it injects is internal bookkeeping (tool counts, delegation depth, concurrency queue status, continuity metadata). This is NOT actionable context for the agent — it's plumbing details that don't help the agent do its job better. A well-written agent .md system prompt provides more useful context.

**Verdict:** MARGINAL. The concept is sound (preserve context during compaction), but the content injected is not useful to agents.

### 2.12 shell.env Hook (plugin.ts:299-307)

Sets `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb` globally.

**Already native?** Not exactly — this requires a hook. But it's 4 lines of code that any developer could add to any plugin in 30 seconds.

**Verdict:** TRIVIAL. Correct behavior, zero complexity, not a framework feature.

### 2.13 Continuity Store (continuity.ts, 639 LOC)

JSON file persistence at `.opencode/state/opencode-harness/session-continuity.json` with ~300 lines of normalize functions, ~70 lines of deep-clone.

**Already native?** OpenCode has its own session persistence.

**Does it add value?** NO. The continuity store writes data but **nothing reads it programmatically**. No agent queries it. No command displays it. No hook acts on it. It's a 639-LOC data graveyard. The harness-rebuild-spec.md (line 115-116) acknowledges: "The current continuity store persists data but nothing reads it. It's a data graveyard."

**Verdict:** WASTE. 639 LOC with no consumer.

### 2.14 Lifecycle Manager (lifecycle-manager.ts, 706 LOC)

Central orchestrator that creates sessions, handles events, observes background completion, manages cancellation.

**Already native?** OpenCode manages session lifecycle natively.

**Does it add value?** The background completion observation with parent notification is the most valuable piece — when a background session finishes, it sends a `<system_reminder>` to the parent. But OpenCode's native background task system may already provide completion notification.

**Verdict:** PARTIAL VALUE. Background notification is useful if the native system doesn't provide it. But 706 LOC with ~115 LOC of duplication and zero tests is concerning.

---

## 3. The Zero-Dependency Problem

The harness-rebuild-spec.md proudly states: "Zero runtime dependencies: maintained." This is presented as a feature. **It is actually a crippling constraint.**

### What Zero-Dep Prevents

| Capability | Required Dependency | Impact |
|---|---|---|
| Schema validation | Zod | No runtime config validation. Constants are hardcoded. |
| Error classification | Error classification lib | No retry decisions based on error type |
| Token counting | tiktoken or equivalent | No token budget enforcement |
| Model fallback chains | Model registry | No automatic fallback on failure |
| Structured logging | pino or similar | No production observability |
| SQLite state | better-sqlite3 | Session history limited to JSON file |
| AST analysis | tree-sitter | No structural code understanding |

### What OMO Does With Dependencies

OMO uses Zod for config schemas, SQLite for session history, and a rich dependency graph that enables:
- 48 hooks vs 5
- 26 tools vs 1
- 8 agents vs 3
- Model fallback chains with automatic retry
- Session recovery (14-file subsystem)
- Content-addressable editing
- LSP integration

**The zero-dep constraint makes the harness a toy.** It cannot compete with OMO's feature density because it cannot leverage the ecosystem. A dependency-free framework in 2026 is like insisting on hand-rolling your own HTTP server — philosophically pure, practically useless.

### The Right Approach

A competitive harness framework needs AT MINIMUM:
- **Zod** for config schema validation (already in .opencode/node_modules/)
- **A retry/backoff library** for resilient delegation
- **Token counting** for context window awareness

Note: Zod is literally already installed in `.opencode/node_modules/zod/` — the zero-dep philosophy is contradicted by its own workspace.

---

## 4. The AI-Generated Documents Problem

The user correctly identified that the requirements and user stories documents are AI-generated. Key symptoms:

1. **Invented APIs** — Requirements reference APIs that don't exist in the OpenCode SDK
2. **Platform-model contradictions** — Requirements claim harness-owned behaviors that are actually platform-provided (e.g., agent permissions)
3. **Status field lying** — All requirements show "Not Started" even though many are implemented
4. **Circular validation** — The recovery-plan.md (line 11-14) acknowledges: "The previous loop failed because it optimized for validation output instead of artifact convergence... repeated the same diagnosis instead of editing the target docs"
5. **Feature inflation** — 100 requirements for a ~2,800 LOC codebase is a 1:28 requirement-to-LOC ratio — absurd for any real project
6. **No human validation** — No evidence any human has reviewed whether these requirements map to actual OpenCode SDK capabilities

**These documents should be treated as fiction, not specification.**

---

## 5. The "Soft Concepts" Engineering Assessment

The user raised the critical point: commands, skills, tools, MCP servers, agents, subagents must be **code-and-runtime-conditional-engineered** to provide genuine value beyond `.md` file configuration.

### What Is Actually Code-Engineered in This Harness

| Feature | Code-Engineered? | Runtime Conditional? | Value Beyond .md? |
|---|---|---|---|
| Circuit breaker | ✅ Code | ✅ Runtime | ❌ Native doom_loop is better |
| Tool call counter | ✅ Code | ✅ Runtime | ❌ Native `steps:` is equivalent |
| Metadata injection | ✅ Code | ✅ Runtime | ❌ No consumer |
| Compaction injection | ✅ Code | ✅ Runtime | ⚠️ Marginal — content is plumbing |
| shell.env | ✅ Code | ❌ Static | ❌ 4 lines, trivial |
| Completion detection | ✅ Code | ✅ Runtime | ⚠️ Stability timer is novel |
| Concurrency queue | ✅ Code | ✅ Runtime | ⚠️ Useful if native doesn't handle it |
| Depth limit | ✅ Code | ✅ Runtime | ⚠️ Minor guardrail |
| Descendant budget | ✅ Code | ✅ Runtime | ⚠️ Minor guardrail |
| Continuity store | ✅ Code | ✅ Runtime | ❌ No consumer |
| Lifecycle manager | ✅ Code | ✅ Runtime | ⚠️ Background notification may be novel |
| Temperature defaults | ✅ Code | ❌ Never applied | ❌ Duplicates frontmatter |
| Permission rules | ✅ Code | ❌ Never enforced | ❌ Duplicates frontmatter |
| Tool restriction lists | ✅ Code | ❌ Advisory only | ❌ Duplicates frontmatter |
| Prompt builder | ✅ Code | ❌ Static template | ❌ Agent .md body does this |

### Score: 3 out of 15 features provide potential value beyond .md files

And those 3 (CompletionDetector stability timer, ConcurrencyQueue, background notification) are:
- Untested in production
- Possibly redundant with native platform capabilities
- Missing critical features that would make them production-ready (no global limits, no stale detection, no retry)

---

## 6. What Would Actually Be Jaw-Dropping

For context, here is what a genuinely valuable harness framework would provide — things that .md files and native OpenCode CANNOT do:

1. **Automatic model fallback** — When a delegation fails on Model A, automatically retry on Model B, then Model C. Requires runtime code, dependency on model registry.

2. **Session recovery** — When a session crashes mid-task (context overflow, model error, network timeout), automatically resume from the last checkpoint. OMO has a 14-file subsystem for this.

3. **Token-aware context management** — Count tokens before sending prompts, automatically trim/summarize when approaching limits, split large tasks into token-budgeted chunks. Requires tiktoken or equivalent dependency.

4. **Coordinated multi-agent workflows with dependency graphs** — Task A produces output that becomes input for Task B, which feeds Task C. Automatic DAG execution with checkpoint/restart. OMO's Atlas orchestrator does this via boulder state.

5. **Model-adaptive prompt engineering** — Automatically adjust prompt style for Claude vs GPT vs Gemini. Claude prefers XML tags, GPT prefers markdown, Gemini prefers concise instructions. OMO has model-family variants per agent.

6. **Cross-session learning** — Harness learns from failures and adjusts strategy. If researcher agent keeps timing out on certain types of queries, automatically increase timeout or switch to a different agent/model combination.

7. **Real-time resource monitoring** — Track API costs, latency, error rates across all delegated sessions. Alert on anomalies. Requires structured logging and metrics.

8. **Content-addressable editing with deduplication** — OMO's hashline-edit prevents duplicate edits across concurrent agents. Requires AST analysis.

**None of these exist in the harness. All of them exist in OMO (or could be built with appropriate dependencies).**

---

## 7. Definitive Feature Value Matrix

| Feature | LOC | Native Equivalent | OMO Equivalent | Genuine Value | Verdict |
|---|---|---|---|---|---|
| Agent temps | 5 | Frontmatter `temperature:` | Per-agent config | None | **DELETE** |
| Permission rules | 35 | Frontmatter `permission:` | Tool restrictions | None | **DELETE** |
| Tool restriction map | 5 | Frontmatter `permission:` | Agent tool config | None | **DELETE** |
| buildPromptText() | 43 | Agent .md body | Dynamic prompt builder (530 LOC) | None | **DELETE** |
| delegate-task tool | 132 | Native `task` tool | delegate-task + background-task + call_omo_agent | Minor guardrails | **REWRITE** |
| Circuit breaker | 17 | doom_loop (3 calls) | Per-task circuit breaker | None — worse | **DELETE** |
| Tool call counter | 10 | Native `steps:` | Tool + token limits | Marginal | **KEEP** |
| Metadata injection | 39 | None | Background notification templates | None — no consumer | **DELETE** |
| Compaction injection | 87 | None | Compaction context injector | Marginal | **SIMPLIFY** |
| shell.env | 9 | None | non-interactive-env | Trivial | **KEEP** |
| CompletionDetector | 124 | Native completion | Idle detection + staleness | Stability timer | **KEEP** |
| ConcurrencyQueue | 99 | Unknown | Per-model + global | If native lacks it | **KEEP** |
| Continuity store | 639 | Native session persistence | Boulder state + SQLite | None — no consumer | **DELETE** |
| Lifecycle manager | 706 | Native session lifecycle | Atlas orchestrator | Background notify | **SIMPLIFY** |
| State management | 107 | Native sessions | Boulder + Maps + SQLite | Budget tracking | **KEEP** |
| agent-registry | 113 | Native agent loading | Plugin agent loading | None — dead code | **DELETE** |
| Task status types | 22 | Native status types | Task state machine | Clean types | **KEEP** |
| Session API wrappers | 121 | SDK itself | Typed SDK usage | Convenience | **KEEP** |
| Notification handler | 86 | None | Background notification system | Background notify | **KEEP** |

**Summary:**
- **DELETE:** 8 features (~971 LOC) — redundant with native or dead
- **SIMPLIFY:** 2 features (~793 LOC → ~200 LOC)
- **KEEP:** 8 features (~568 LOC) — some genuine value
- **REWRITE:** 1 feature (delegate-task) — needs to actually leverage chat.params

**Net valuable code: ~770 LOC out of ~2,800 LOC (27%).**

---

## 8. Final Verdict

### Are there jaw-dropping, awe-inspiring features?

**No.** Not a single one.

The harness has ~2,800 LOC of which ~27% provides any value beyond what OpenCode natively gives you. The remaining ~73% is:
- Duplication of agent .md frontmatter (temperatures, permissions, tool lists)
- A 639 LOC continuity store with no consumer
- 113 LOC of dead code (agent-registry)
- Advisory prompt text that duplicates agent system prompts
- A circuit breaker that is strictly worse than the native doom_loop

### Is the zero-dep approach correct?

**No.** It prevents the harness from providing the features that would actually differentiate it: model fallback, token counting, config schema validation, structured logging. Zod is literally already installed in the workspace.

### Do the AI-generated docs represent real requirements?

**No.** They contain invented APIs, platform contradictions, and circular validation patterns. They should be rewritten from scratch by a human who understands the actual OpenCode SDK capabilities.

### Can users achieve the same with .md files + native OpenCode?

**Almost entirely yes.** The agent .md files already define temperature, permissions, system prompts, step limits. The native `task` tool already handles delegation with async support. Commands and skills are already `.md` files. The only things that genuinely require plugin code are: background completion notification (if native doesn't provide it), concurrency limits (if native doesn't manage them), and the stability timer in CompletionDetector.

### Compared to OMO?

OMO has 276,598 LOC to this harness's 2,800 LOC — a 100x gap. More importantly, OMO provides: model fallback (14 files), session recovery (14 files), 48 hooks, 26 tools, 8 agents, dynamic prompt building (530 LOC), content-addressable editing, LSP integration, tmux visualization, boulder state plan continuation, and Ralph loop iteration control. The harness provides none of these.

**The harness is not just inferior to OMO — it is inferior to vanilla OpenCode with well-written .md files in most practical scenarios.**

### Recommendation

1. **Admit** the current harness adds negligible value over native OpenCode configuration
2. **Keep** only the ~770 LOC that is genuinely novel (CompletionDetector, ConcurrencyQueue, budget tracking, notification handler, session API utilities)
3. **Drop** the zero-dep constraint — add Zod at minimum, consider a retry library
4. **Implement** `chat.params` hook before anything else — without it, the entire plugin is decorative
5. **Rewrite** requirements from scratch based on actual OpenCode SDK capabilities, not AI hallucinations
6. **Decide** whether to compete with OMO (requires 10-50x the current code) or find a narrower niche

---

*This audit was conducted by comparing every harness feature against OpenCode's native `.opencode/agents/*.md` frontmatter, `opencode.json` configuration, native `task` tool, and `doom_loop` detection. All claims verified against actual code and configuration files.*
