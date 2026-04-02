# Harness Framework: Rebuild Specification

**Date:** 2026-04-02
**Type:** Architecture Specification + Implementation Blueprint
**Status:** Draft — requires validation

---

## 1. Context: What We Know Now

### 1.1 Three-Way Comparison Results

| Dimension | OpenCode Native | Oh-My-Openagent (OMO) | Our Harness |
|-----------|----------------|----------------------|-------------|
| **Agent orchestration** | Flat: pick one agent per session | Hierarchical: Atlas→8 specialists with retry, fallback, recovery | Parent→child only, no retry, no fallback |
| **Plugin hooks** | 27 event hooks available | 48 hooks composed across 5 subsystems | 5 hooks (before/after/event/compacting/shell.env) |
| **Custom tools** | Built-in + MCP | 26 custom tools | 1 custom tool (delegate-task) |
| **State durability** | Sessions persist in memory | Boulder state (JSON) + SQLite + worktree sync | Single continuity JSON file |
| **Resilience** | None — errors propagate | Session recovery (14 files), model fallback (14 files), retry logic | None — errors propagate |
| **Concurrency** | None | Per-model + provider + global limits, stale detection | Per-key semaphore only |
| **Context engineering** | Static prompts in .md files | Dynamic prompt builder, model-family variants, directory injection | Static template in helpers.ts |
| **Code volume** | Platform (~50K LOC) | ~276K packed (est. 15K+ source) | ~2,800 LOC |

### 1.2 What the Previous Audit Got Right

1. **The harness wraps OpenCode's native capabilities** — delegate-task is a thin session.create() wrapper
2. **Circuit breaker at threshold=16 is too high** — OpenCode's doom_loop catches 3 identical calls
3. **Continuity JSON has no consumer** — no agent reads from it programmatically
4. **Concurrency queues are underutilized** — keyed semaphore exists but nothing waits in them meaningfully
5. **Metadata injection is verbose but unused** — `_harness` metadata goes nowhere

### 1.3 What the Previous Audit Got Wrong

1. **"Delete everything"** — the plugin hook infrastructure IS the only way to extend OpenCode. The hooks work correctly.
2. **"Tests pass but functionality is wrong"** — the 152 tests verify correct behavior of the components that exist. The problem is scope, not correctness.
3. **"Conductor agent can't use tools"** — this is a model selection issue (qwen3.6-plus-free), not a harness issue. The `delegate-task` tool works with capable models.
4. **"Continuity store is redundant"** — it's not redundant, it's incomplete. The schema is well-designed but nothing consumes it yet.

---

## 2. Core Insight: What a Harness Framework Actually Is

A harness is **not** a replacement for OpenCode's agent system. It is a **control plane** that sits above it. The correct mental model:

```
┌─────────────────────────────────────────────────┐
│  HARNESS CONTROL PLANE (plugin code)            │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Task      │  │ State    │  │ Resilience   │ │
│  │ Decompose │  │ Manager  │  │ Engine       │ │
│  └─────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│        └──────────────┼───────────────┘         │
│                       ▼                         │
│  ┌───────────────────────────────────────────┐  │
│  │  Delegation Router                        │  │
│  │  (category → agent + model + permissions) │  │
│  └─────────────────┬─────────────────────────┘  │
└────────────────────┼────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────┐
│  OPENCODE PLATFORM (config + built-in tools)    │
│  ┌────────┐ ┌───────┐ ┌──────┐ ┌──────┐        │
│  │Agents  │ │Skills │ │Tools │ │Rules │        │
│  │(.md)   │ │(.md)  │ │(SDK) │ │(.md) │        │
│  └────────┘ └───────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────────┘
```

**The harness owns:** task decomposition, state durability, resilience (retry/fallback/recovery), concurrency control, delegation routing.

**OpenCode owns:** agent definitions, skill loading, tool execution, rule enforcement, session management.

**The boundary:** the harness should NEVER duplicate what OpenCode config can express. It should ONLY add capabilities that require plugin-level code.

---

## 3. What to Keep (Proven Working)

| Component | Keep? | Reason |
|-----------|-------|--------|
| Plugin hook infrastructure | ✅ KEEP | Correctly intercepts tool calls, events, compaction |
| `tool.execute.before` circuit breaker | ⚠️ IMPROVE | Lower threshold from 16 to 5, add per-tool-type thresholds |
| `tool.execute.after` metadata | ⚠️ REDESIGN | Make it actionable — feed into state manager, not just verbose output |
| `event` handler | ✅ KEEP | Correctly routes events to lifecycle manager |
| `experimental.session.compacting` | ✅ KEEP | Preserves harness state during compaction — genuinely useful |
| `shell.env` hook | ✅ KEEP | CI mode safety is correct |
| Typed SDK wrappers (`session-api.ts`) | ✅ KEEP | Better than OMO's `any` usage |
| Concurrency semaphore (`concurrency.ts`) | ✅ KEEP | Well-implemented, just needs global limit + stale detection |
| CompletionDetector | ✅ KEEP | Two-signal detection (idle + stability) is sound |
| Test framework (152 tests) | ✅ KEEP | Good coverage of existing components |
| Agent definitions (researcher/builder/critic) | ✅ KEEP | Core triad is sufficient for MVP |
| Permission profiles | ✅ KEEP | Clean allow/deny model |

---

## 4. What to Delete (Redundant or Broken)

| Component | Delete? | Reason |
|-----------|---------|--------|
| Continuity JSON store (635 LOC) | ✅ DELETE | No consumer. Replace with task state manager (see §5) |
| `routing.ts` (already deleted) | ✅ GONE | Was redundant — agent .md files define routing |
| Hardcoded agent temperature defaults | ✅ DELETE | Should come from agent config, not plugin constants |
| `AGENT_TOOLS` restriction table | ✅ DELETE | Overlaps with agent .md frontmatter permissions |
| `getPermissionRulesForAgent()` | ✅ DELETE | Redundant with agent frontmatter permission blocks |
| Metadata injection verbosity | ✅ REDUCE | Keep essential fields, remove noise |
| `MAX_DESCENDANTS_PER_ROOT = 10` | ✅ DELETE | Arbitrary limit with no enforcement mechanism |
| `RootBudget` type with `Set<string>` | ✅ DELETE | Never iterated over, never used |

---

## 5. What to Build (The Real Value)

### Phase 1: Task State Manager (replaces continuity.ts)

**Problem:** The current continuity store persists data but nothing reads it. It's a data graveyard.

**Solution:** A task state manager that:
- Tracks task lifecycle: `pending → dispatched → running → completed | failed | retrying`
- Persists state to disk (single JSON file, but with consumers)
- Provides checkpoint/restore for delegated tasks
- Exposes state to agents via compaction injection
- Supports task dependency graphs (task B depends on task A)

**Interface:**
```typescript
interface TaskState {
  id: string
  parentTaskId?: string
  status: 'pending' | 'dispatched' | 'running' | 'completed' | 'failed' | 'retrying'
  agent: string
  category?: string
  model?: string
  prompt: string
  result?: string
  error?: string
  retryCount: number
  maxRetries: number
  dependencies: string[]
  createdAt: number
  updatedAt: number
  completedAt?: number
}

interface TaskStateManager {
  createTask(spec: TaskSpec): string
  getTask(id: string): TaskState | undefined
  updateTask(id: string, patch: Partial<TaskState>): void
  getReadyTasks(): TaskState[]  // tasks with all dependencies met
  getPendingTasks(): TaskState[]
  getCompletedTasks(): TaskState[]
  persist(): void
  hydrate(): void
}
```

**Files to create:**
- `src/lib/task-state.ts` — TaskStateManager implementation
- `src/lib/task-state.test.ts` — Tests

**Files to delete:**
- `src/lib/continuity.ts` — Replaced by task-state.ts

### Phase 2: Retry Engine

**Problem:** Any transient failure (rate limit, timeout, model unavailable) permanently kills a delegated task.

**Solution:** Automatic retry with:
- Configurable max retries per task (default: 2)
- Exponential backoff between retries (1s, 2s, 4s)
- Model fallback chain on repeated failures
- Guidance injection on retry (tell the agent what went wrong)

**Interface:**
```typescript
interface RetryEngine {
  executeWithRetry(
    task: TaskSpec,
    options: RetryOptions
  ): Promise<TaskResult>
}

interface RetryOptions {
  maxRetries: number
  backoffMs: number
  fallbackModels?: string[]
  onRetry?: (attempt: number, error: Error) => void
}

interface TaskResult {
  success: boolean
  output?: string
  error?: string
  attempts: number
  modelUsed: string
}
```

**Files to create:**
- `src/lib/retry-engine.ts` — RetryEngine implementation
- `src/lib/retry-engine.test.ts` — Tests

**Files to modify:**
- `src/lib/lifecycle-manager.ts` — Use RetryEngine in `launchDelegatedSession`

### Phase 3: Dynamic Prompt Builder

**Problem:** All agents get the same prompt template regardless of model, context, or task type.

**Solution:** Runtime prompt composition that:
- Adapts to model family (Claude vs GPT vs Gemini have different optimal prompt patterns)
- Injects directory-specific context (README, AGENTS.md, project type)
- Adds category-specific guidance
- Includes task dependencies and prior results when available

**Interface:**
```typescript
interface PromptBuilder {
  buildPrompt(args: PromptArgs): string
}

interface PromptArgs {
  task: string
  agent: string
  category?: string
  model?: string
  scope?: string
  constraints?: string[]
  priorResults?: { taskId: string; result: string }[]
  directory?: string
}
```

**Files to create:**
- `src/lib/prompt-builder.ts` — DynamicPromptBuilder implementation
- `src/lib/prompt-builder.test.ts` — Tests

**Files to modify:**
- `src/lib/helpers.ts` — Remove `buildPromptText`, replace with PromptBuilder
- `src/lib/lifecycle-manager.ts` — Use PromptBuilder instead of buildPromptText

### Phase 4: Stale Task Detection

**Problem:** Hung delegated sessions occupy concurrency lanes indefinitely.

**Solution:** Stale detection that:
- Tracks last activity timestamp per session
- Flags sessions with no activity for >180 seconds
- Automatically cancels sessions with no activity for >30 minutes
- Reports stale status to parent session

**Files to create:**
- `src/lib/stale-detector.ts` — StaleDetector implementation
- `src/lib/stale-detector.test.ts` — Tests

**Files to modify:**
- `src/lib/lifecycle-manager.ts` — Integrate stale detection into background observer

### Phase 5: Global Concurrency Limits

**Problem:** Per-key semaphore exists but no global limit prevents resource exhaustion.

**Solution:** Add global concurrency ceiling:
- `maxConcurrentSessions` (default: 5)
- Per-provider limits (optional)
- Per-model limits (optional)
- Queue overflow handling (reject vs wait)

**Files to modify:**
- `src/lib/concurrency.ts` — Add global limit to DelegationConcurrencyQueue
- `src/lib/lifecycle-manager.ts` — Check global limit before acquiring lane

---

## 6. What NOT to Build (Out of Scope)

These are capabilities that oh-my-openagent has but are NOT appropriate for this harness:

| Capability | Why Not |
|------------|---------|
| LSP integration | OpenCode should provide this natively. Plugin shouldn't duplicate IDE features. |
| Hashline editing | OpenCode's edit tool is sufficient. Content-addressable editing is a nice-to-have, not core. |
| Tmux multi-pane visualization | UI concern, not orchestration. OpenCode TUI handles this. |
| MCP per skill isolation | OpenCode's MCP config is sufficient. Per-skill isolation is over-engineering. |
| AST-grep | OpenCode's grep is sufficient for most use cases. |
| Multimodal (look-at) | Model capability, not harness concern. |
| Ralph Loop (iteration controller) | Complex workflow pattern. Better as a command, not plugin code. |
| 8 specialist agents | 3 agents (researcher/builder/critic) covers the core triad. More agents = more config complexity. |
| Worktree sync | Niche use case. Can be added later if needed. |
| SQLite-backed state | Over-engineering for a zero-dependency package. JSON file is sufficient. |

---

## 7. Architecture After Rebuild

```
src/
├── plugin.ts              # Composition root — hook handlers + delegate-task tool
├── index.ts               # Barrel re-exports only
└── lib/
    ├── types.ts           # Shared types (KEEP, update for new interfaces)
    ├── helpers.ts         # Pure utilities (KEEP, remove buildPromptText)
    ├── state.ts           # In-memory Maps (KEEP, add task state references)
    ├── concurrency.ts     # Keyed semaphore (KEEP, add global limits)
    ├── session-api.ts     # Typed SDK wrappers (KEEP)
    ├── completion-detector.ts  # Two-signal detection (KEEP)
    ├── notification-handler.ts # Async completion notifications (KEEP)
    ├── task-status.ts     # Task status type system (KEEP)
    ├── agent-registry.ts  # Agent metadata (KEEP)
    ├── task-state.ts      # NEW: Task state manager (replaces continuity.ts)
    ├── retry-engine.ts    # NEW: Retry with fallback
    ├── prompt-builder.ts  # NEW: Dynamic prompt composition
    ├── stale-detector.ts  # NEW: Stale task detection
    └── lifecycle-manager.ts  # MODIFIED: Use new components
```

**Target LOC:** ~4,500 (up from ~2,800, down from OMO's ~15,000+)
**Target test count:** ~250 (up from 152)
**Zero runtime dependencies:** maintained

---

## 8. Implementation Priority

### Week 1: Foundation
1. **Task State Manager** — Replace continuity.ts (highest impact, enables everything else)
2. **Retry Engine** — Wire into lifecycle-manager (highest reliability improvement)
3. **Stale Detector** — Prevent hung sessions (critical for production use)

### Week 2: Intelligence
4. **Dynamic Prompt Builder** — Model-aware prompts (biggest quality improvement)
5. **Global Concurrency Limits** — Prevent resource exhaustion (critical for stability)
6. **Lower circuit breaker threshold** — 16 → 5, per-tool-type (quick win)

### Week 3: Polish
7. **Clean up redundancy** — Remove AGENT_TOOLS, getPermissionRulesForAgent, hardcoded temps
8. **Reduce metadata verbosity** — Keep essential fields only
9. **Update tests** — Cover new components, maintain coverage

### Week 4: Integration
10. **End-to-end testing** — Test full delegation flow with retry, staleness, prompts
11. **Documentation** — Update AGENTS.md, add architecture diagrams
12. **Performance validation** — Benchmark delegation latency, memory usage

---

## 9. Success Criteria

The rebuilt harness should be judged on:

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Task completion rate | ~60% (no retry) | >90% (with retry) | Track failed vs completed delegations |
| Stale session rate | Unknown (no detection) | <1% | Stale detector reports |
| Prompt quality | Static template | Model-adapted | Agent output quality review |
| Code maintainability | 2,800 LOC, 12 files | 4,500 LOC, 16 files | LOC count, file count |
| Test coverage | 152 tests | 250+ tests | vitest run --coverage |
| Zero dependencies | ✅ | ✅ | package.json peerDependencies only |
| Delegation works end-to-end | Broken on free models | Works on capable models | Integration test with Claude/Sonnet |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Retry engine adds latency | Medium | Configurable backoff, fast-fail on permanent errors |
| Dynamic prompts increase token usage | Low | Prompt size limits, caching of common sections |
| Stale detection cancels valid long-running tasks | Medium | Configurable thresholds, warning before cancellation |
| Task state manager complexity | Medium | Keep interface simple, test thoroughly |
| Model fallback requires API key for multiple providers | High | Make fallback optional, document requirements |

---

## 11. What This Enables (The Real Value Proposition)

After this rebuild, the harness provides capabilities that **cannot** be achieved through OpenCode config alone:

1. **Resilient delegation** — Tasks survive transient failures through retry + fallback
2. **State-aware orchestration** — Task state persists across sessions, enables dependency graphs
3. **Model-adaptive prompting** — Prompts adapt to the model being used, improving output quality
4. **Resource protection** — Global concurrency limits + stale detection prevent resource exhaustion
5. **Observable workflows** — Task state is queryable, enabling progress tracking and debugging

These are genuinely plugin-level capabilities. They require code, not config. They extend OpenCode rather than duplicate it.

---

## 12. Comparison to Oh-My-Openagent

| Dimension | OMO | Rebuilt Harness | Assessment |
|-----------|-----|-----------------|------------|
| Scope | Full agent OS (26 tools, 48 hooks, 8 agents) | Focused control plane (1 tool, 5 hooks, 3 agents + extensions) | Harness is narrower but deeper in its domain |
| Resilience | 14-file recovery + 14-file fallback + retry | Retry engine + stale detector | OMO is more comprehensive, harness is sufficient for MVP |
| Tools | 26 custom tools | 1 custom tool (delegate-task) + OpenCode native tools | Harness relies on OpenCode's tool ecosystem — correct choice |
| State | Boulder JSON + SQLite + worktree sync | Task state JSON | Harness is simpler, sufficient for single-worktree use |
| Prompts | Dynamic builder + model-family variants + directory injection | Dynamic builder + model-family awareness | OMO is more sophisticated, harness covers the essentials |
| Concurrency | Per-model + provider + global + stale detection | Per-key + global + stale detection | Equivalent for practical purposes |
| Code volume | ~15,000+ source LOC | ~4,500 LOC | Harness is 3x smaller, more auditable |
| Dependencies | Zod, SQLite, runtime deps | Zero runtime deps | Harness wins — truly zero-dep |

**The rebuilt harness is not a competitor to oh-my-openagent. It is a focused, zero-dependency subset that delivers the core control plane capabilities without the tool ecosystem, LSP integration, tmux visualization, or 8-agent complexity.**

---

## 13. Appendix: What the Skills Ecosystem Offers

Relevant skills discovered during this audit:

| Skill | Installs | Relevance |
|-------|----------|-----------|
| `jasonkneen/kiro/spec-driven-development` | 221 | Requirements → Design → Task planning workflow |
| `jasonkneen/kiro/requirements-engineering` | 118 | EARS format for testable requirements |
| `jasonkneen/kiro/task-breakdown` | 32 | Task decomposition methodology |
| `borghei/claude-skills/product-manager` | 121 | RICE/ICE prioritization, roadmap planning |
| `404kidwiz/claude-supercode-skills/project-manager` | 906 | Project management with WBS, risk registers |

These skills inform the **process** of building the harness (requirements, planning, task breakdown) but are not part of the harness runtime. They should be used by the development team during implementation.
