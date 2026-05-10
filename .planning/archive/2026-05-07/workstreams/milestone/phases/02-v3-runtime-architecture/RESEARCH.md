# Phase 02: V3 Runtime Architecture — Research

**Researched:** 2026-04-06
**Domain:** OpenCode plugin runtime composition — background agents, delegation chains, concurrency, session recovery, governance, injection, specialist routing, circuit breakers
**Confidence:** MEDIUM (OpenCode SDK and plugin surfaces verified; tmux not available on target machine; OMO reference pack structure verified but not deeply parsed)

## Summary

Phase 02 builds eight sub-features that together form the V3 runtime composition engine. The codebase already has substantial foundation: `continuity.ts` (638 LOC durable JSON), `lifecycle-manager.ts` (705 LOC — exceeds 500 LOC limit), `concurrency.ts` (98 LOC keyed semaphore), `completion-detector.ts` (two-signal), `session-api.ts` (parent-chain traversal), and `plugin.ts` (composition root with `delegate-task` tool). The research reveals that the eight sub-phases have a tight dependency graph — 2c (concurrency) and 2h (circuit breaker) can start immediately since they build on existing code; 2a (background agents) must resolve the tmux-absence issue (target macOS machine has no tmux installed); 2b (delegation chain) can extend existing `continuity.ts`; 2d–2g depend on earlier layers.

**Primary recommendation:** Execute sub-phases in dependency order 2c→2h→2a→2b→2d→2e→2f→2g, not the roadmap order 2a→2b→2c→2d→2e→2f→2g→2h. This front-loads work that builds on existing code and unblocks downstream phases.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Background agents use visible worker sessions when pane/session support is available; fallback to headless when not.
- **D-02:** If pane/session support unavailable, runtime must fall back to headless background execution rather than failing.
- **D-03:** Delegation must preserve strict parent/child lineage and resume metadata so background and headless workers share one durable execution model.
- **D-04:** Phase 2 uses a soft policy runtime — governance prefers warning/escalation over hard blocking.
- **D-05:** Session recovery restores task continuity and relevant runtime state; policy enforcement stays lighter-weight than strict hard-stop governance.
- **D-06:** Runtime injection is conditional, scoped to smaller controlled ruleset rather than fully expansive policy engine.
- **D-07:** Specialist routing is advisory/configurable, with broad fallback to generalist when no strong specialist match exists.
- **D-08:** Keep existing warning-then-hard-stop budget structure; do not replace with new model.
- **D-09:** Circuit-breaker and tool-budget thresholds must be configurable per session/runtime context.
- **D-10:** Default limits can remain close to current code behavior; overrides possible without changing source constants.
- **D-11:** Budget/reset behavior resets on compact/restart; warning state preserved in continuity records.
- **D-12:** Hybrid background execution — tmux mode for parallel-independent high-performance work, built-in mode for iterative/linear tasks. Auto-detect based on task characteristics. User confirms via configuration agent menu.
- **D-13:** Built-in mode auto-detects between OpenCode sub-session (interactive tasks) and subprocess stdio (research-based tasks, OMO-style orchestrator).
- **D-14:** Delegation packets stored as separate JSON files in `.hivemind/delegation/` with full hierarchy; `manifest.json` indexes active packets.
- **D-15:** Concurrency configuration is hybrid — internal interfaces use JSON config; external OpenCode SDK interactions use YAML/JSON; runtime-dynamic changes use programmatic API.
- **D-16:** Tool budgets, loop detection, and retry resolution use built-in OpenCode mechanisms where available; custom concurrency only supplements what OpenCode doesn't provide.
- **D-17:** Session recovery restores task continuity as primary mechanism. Full context restoration available via auto time-machine parser/writer — recovered agents use inspect tools for on-demand loading.
- **D-18:** Recovery triggers automatically on session restart with staleness check (configurable threshold). Agent state presented to users with staleness risk assessment for confirmation.

### the agent's Discretion
- Exact JSON field names and internal TypeScript shape for delegation/recovery records (preserve lineage, resume context, validation signals, result status)
- Exact pane/session adapter mechanism (tmux wrapper vs adapter abstraction), as long as pane-capable environments get visible workers and unsupported environments get clean headless fallback
- Exact matching heuristics for specialist routing (configurable, fallback to generalist)
- Exact warning/escalation thresholds and logging format (configurable per-session budgets consistent with D-08 through D-11)
- Configuration agent menu design and UX flow
- Staleness threshold default value and risk assessment presentation format

### Deferred Ideas (OUT OF SCOPE)
- Configuration agent UI/UX menu design and flow
- Staleness threshold default numeric value
- Schema Definition (Phase 3) — YAML schemas for Agent/Command/Skill frontmatter

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/plugin` | ≥1.1.17 [VERIFIED: npm registry] | Plugin framework for OpenCode — `tool()` factory, `Plugin` type, hook signatures | The only way to extend OpenCode; peer dependency of harness |
| `@opencode-ai/sdk` | ≥1.3.17 [VERIFIED: npm registry] | Type-safe client for OpenCode server — `client.session.*`, `client.event.subscribe()` | SDK surfaces used for session management, message history, event streams |
| `zod` | ≥3.22 (via `tool.schema`) [VERIFIED: @opencode-ai/plugin 1.3.17] | Schema validation for tool args | `tool.schema` re-exports Zod — required pattern for all tool definitions |
| `vitest` | 4.1.2 [VERIFIED: npm registry] | Test framework | Already in devDependencies; all existing tests use it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `js-yaml` | ^4.1.0 [ASSUMED] | YAML parsing for config files (D-15) | When reading external YAML/JSON concurrency config |
| `chokidar` | ^4.0.1 [ASSUMED] | File watching for delegation manifest/index | When watching `.hivemind/delegation/manifest.json` for changes |
| Node `child_process` | built-in | Subprocess stdio execution (D-13) | For research-based tasks in built-in mode |
| Node `fs/promises` | built-in | Durable JSON persistence, delegation packets | For reading/writing `.hivemind/delegation/` and `.hivemind/state/` |
| Node `events` | built-in | Event-based patterns for completion detection | For background agent lifecycle events |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node `child_process` for subprocess | `execa` (v8) | execa provides better promise API, error handling, streaming; but adds dependency — defer to implementation |
| Node `fs` for file watching | `chokidar` | chokidar handles edge cases (rename detection, batch events); but `fs.watch` is sufficient for single manifest file |
| JSON-only config | `js-yaml` + JSON | D-15 requires external YAML/JSON support; js-yaml is standard for YAML parsing in Node |

**Installation:**
```bash
npm install js-yaml  # if external YAML config needed (D-15)
```

**Version verification:**
```
vitest@4.1.2 [VERIFIED: npm registry 2026-04-06]
typescript@6.0.2 (npm) / ^5.3.0 (package.json) — upgrade recommended
@opencode-ai/plugin@1.3.17 [VERIFIED: npm registry 2026-04-06]
@opencode-ai/sdk@1.3.17 [VERIFIED: npm registry 2026-04-06]
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | ≥20 (verified) | — |
| npm | Package management | ✓ | — | — |
| tmux | D-12: Background agents (tmux mode) | ✗ | — | Fall back to built-in mode (OpenCode sub-session + subprocess stdio) per D-02 |
| OpenCode server (port 4096) | SDK client, session management | ✗ (not running during research) | — | Tests use mock/stub; live integration tests require running instance |
| `@opencode-ai/sdk` | Session API, events, prompt | ✓ (installed) | 1.3.17 | — |
| `@opencode-ai/plugin` | Plugin framework, tool factory | ✓ (installed) | ≥1.1.0 (peer dep), 1.3.17 available | — |
| vitest | Testing | ✓ (installed) | 4.1.2 | — |

**Missing dependencies with no fallback:**
- **tmux** — not available on macOS target machine. D-12's tmux mode cannot be executed. Per D-02, runtime must fall back to headless background execution. The "built-in mode" (OpenCode sub-session + subprocess stdio, D-13) becomes the primary execution path. If the user later installs tmux, the tmux adapter can be added as an optional extension.

**Missing dependencies with fallback:**
- OpenCode server not running during research/build — live behavioral tests require it, but unit tests can use mocked SDK client.

## Architecture Patterns

### Recommended Implementation Order (differs from ROADMAP)

The dependency graph dictates this order, not the alphabetical 2a–2h sequence:

```
2c. Concurrency Control (builds on existing concurrency.ts)
2h. Circuit Breaker (builds on existing plugin.ts thresholds)
2a. Background Agents (depends on 2c for queue integration; tmux absent → built-in only)
2b. Delegation Chain (depends on 2a for parent-child sessions)
2d. Session Recovery (depends on 2b for delegation context, 2c for concurrency state)
2e. Context Governance (depends on 2d for recovery state, 2h for budget awareness)
2f. Injection Engine (depends on 2e for governance rules, 2g for agent routing)
2g. Specialist Classification (depends on 2a for agent spawning, 2b for delegation packets)
```

**Why this order:**
1. 2c and 2h touch existing code and are independent of each other — fastest wins
2. 2a needs 2c's queue to decide sync vs async execution
3. 2b needs 2a's session creation to persist delegation packets
4. 2d needs both 2b (delegation state) and 2c (concurrency state) to restore
5. 2e needs 2d's recovered state to evaluate rules
6. 2f needs 2e's governance rules and 2g's agent definitions
7. 2g can actually start parallel with 2d/2e since it only needs agent definitions (2a) and packet format (2b)

### Sub-Phase 2a: Background Agents

**OpenCode SDK surfaces needed:**
- `client.session.create({ body, query })` — [VERIFIED: SDK docs] creates child session with parentID
- `client.session.prompt({ path: { id }, body: { noReply: true, parts } })` — [VERIFIED: SDK docs] inject context without triggering AI response
- `client.session.prompt({ path: { id }, body: { parts } })` — [VERIFIED: SDK docs] send prompt, blocks until assistant completes
- `client.event.subscribe()` — [VERIFIED: SDK docs] SSE stream for `session.idle`, `session.error`, `session.deleted` events
- `client.session.abort({ path: { id } })` — [VERIFIED: SDK docs] abort running session

**Existing code assessment:**
- `lifecycle-manager.ts` (705 LOC) already handles sync/async `sendPrompt` dispatch with `CompletionDetector` watching — this is the foundation
- `completion-detector.ts` provides two-signal completion detection (idle via message stability, terminal events)
- `notification-handler.ts` sends completion notifications back to parent via `noReply: true` prompt
- **Gap:** No tmux integration exists (tmux not available per environment audit). Current code uses OpenCode sub-session for both sync and async modes.

**Implementation approach:**
1. Build an adapter abstraction: `BackgroundExecutionMode = "builtin-subsession" | "builtin-process" | "tmux"` (tmux optional, D-02)
2. `builtin-subsession` (current): `client.session.create()` → `client.session.prompt()` → `CompletionDetector.watch()` — already exists in `launchDelegatedSession()`
3. `builtin-process`: `child_process.spawn()` for research-based tasks (D-13), stdio communication, result capture
4. `tmux` (optional future): `child_process.exec("tmux new-session -d ...")` — only if tmux becomes available
5. Auto-detect logic in `delegate-task` tool: classify task as "interactive" (uses sub-session) vs "research" (uses subprocess)
6. Cleanup: delegate-task tool writes error context to `.hivemind/delegation/` before cleanup (RUN-3a AC#4)

**Cross-dependencies:**
- Depends on: 2c (concurrency queue for lane acquisition)
- Blocking: 2b (delegation chain needs background session creation), 2g (specialist routing needs background agent spawning)

### Sub-Phase 2b: Delegation Chain

**OpenCode SDK surfaces needed:**
- `client.session.create({ body: { parentID } })` — [VERIFIED: SDK docs] creates parent-child linkage
- `client.session.children({ path: { id } })` — [VERIFIED: SDK docs] list child sessions for lineage traversal
- `session.compacting` hook — [VERIFIED: plugin docs] inject delegation context into compaction

**Existing code assessment:**
- `continuity.ts` already stores `SessionContinuityRecord` with `parentSessionID`, `rootSessionID`, `delegation: DelegationMeta` — lineage tracking exists
- `session-api.ts` has `walkParentChain()` for parent-chain traversal — already handles cycle detection
- `state.ts` has `sessionToRoot` map, `commitDescendant()`, `inheritRootFromParent()` — in-memory lineage tracking
- **Gap:** No `.hivemind/delegation/` JSON files or `manifest.json` exist yet (D-14 requires separate files)

**Implementation approach:**
1. Extend `continuity.ts` to also write delegation packet JSON files to `.hivemind/delegation/` (alongside existing continuity.json)
2. Packet format per D-14: `{ planRef, taskDetails, purpose, agents, tools, handoffArtifacts, codeChanges, gitCommits, results }`
3. `manifest.json` index: `{ activePackets: [{ sessionID, packetPath, status, createdAt }] }` for fast lookup
4. `state.ts` hydration: on startup, scan `manifest.json` and rebuild in-memory maps from delegation packets
5. Child session resume: `lifecycle-manager.hydrateFromContinuity()` already reads continuity.json — extend to also read delegation packets

**Cross-dependencies:**
- Depends on: 2a (background agents create sessions that need lineage), 2c (concurrency key per delegation)
- Blocking: 2d (session recovery needs delegation packets to restore state)

### Sub-Phase 2c: Concurrency Control

**OpenCode SDK surfaces needed:**
- No direct SDK surfaces — this is internal harness logic
- Plugin hook `tool.execute.before` — [VERIFIED: plugin docs] where concurrency guard is applied

**Existing code assessment:**
- `concurrency.ts` (98 LOC) has `DelegationConcurrencyQueue` class with `acquire()`, `snapshot()`, keyed lanes — **complete and functional**
- `buildDelegationQueueKey()` generates keys from model/agent/category — **complete**
- `lifecycle-manager.ts` uses `this.queue.acquire()` and `this.queue.snapshot()` — **integrated**
- **Gap:** No configuration file (JSON/YAML) for per-key limits (RUN-3c AC#3)
- **Gap:** No timeout on acquire (RUN-3c AC#4) — current `acquire()` blocks indefinitely via Promise
- **Gap:** No per-key configurable limits — current uses single `defaultLimit`

**Implementation approach:**
1. Add `timeout` parameter to `acquire()`: `acquire(key, limit, timeoutMs)` — reject with error if not acquired within timeout
2. Add configuration loader: `.hivemind/state/concurrency.json` for per-key limits (D-15 internal JSON)
3. Config schema: `{ lanes: { "model:*": { limit: 3 }, "agent:researcher": { limit: 2 } } }`
4. Integration: `lifecycle-manager` constructor reads config → passes per-key limits to queue
5. Tests: concurrent acquire serializes on same key; different keys run in parallel; timeout rejects

**Cross-dependencies:**
- Depends on: None (existing code, needs enhancement)
- Blocking: 2a (needs queue for lane acquisition), 2h (circuit breaker uses concurrency for budget tracking)

### Sub-Phase 2d: Session Recovery

**OpenCode SDK surfaces needed:**
- `client.session.list()` — [VERIFIED: SDK docs] list all sessions on restart
- `session.compacting` hook — [VERIFIED: plugin docs] inject recovery context
- `client.session.messages({ path: { id } })` — [VERIFIED: SDK docs] retrieve message history for context reconstruction

**Existing code assessment:**
- `continuity.ts` provides durable JSON — state survives process restart
- `lifecycle-manager.hydrateFromContinuity()` already rebuilds in-memory state from continuity.json on startup
- `completion-detector.ts` has caching for terminal events — helps detect incomplete sessions
- **Gap:** No staleness check or configurable threshold (D-18)
- **Gap:** No risk assessment presentation format (D-18)
- **Gap:** No time-machine parser/writer integration (D-17) — mentioned in CONTEXT but no code exists

**Implementation approach:**
1. Add `stalenessCheck(sessionRecord, thresholdMs)` function — compare `updatedAt` against current time
2. Recovery flow on plugin init: load continuity.json → check staleness → if stale, present risk assessment → user confirms or starts fresh
3. Risk assessment object: `{ sessionID, lastActive, stalenessMinutes, activeDelegations, pendingTasks, governanceRules, riskLevel }`
4. Present assessment via `client.tui.showToast()` + compaction context injection
5. Time-machine integration: if D-17's parser/writer exists in refactored codebase, wire it as optional full-context restoration
6. Tests: simulate crash mid-task, restart, verify task resumes from checkpoint

**Cross-dependencies:**
- Depends on: 2b (delegation packets for continuity), 2c (concurrency state on recovery)
- Blocking: 2e (governance rules re-applied on recovery)

### Sub-Phase 2e: Context Governance

**OpenCode SDK surfaces needed:**
- `tool.execute.before` hook — [VERIFIED: plugin docs] evaluate rules before tool execution
- `tool.execute.after` hook — [VERIFIED: plugin docs] log violations after execution
- `client.tui.showToast()` — [VERIFIED: plugin docs] show violation warnings (soft policy, D-04)

**Existing code assessment:**
- `plugin.ts` already has `tool.execute.before` with circuit-breaker logic — pattern exists for rule evaluation
- `state.ts` has `addWarning()` — soft policy mechanism exists
- `types.ts` has `PermissionRule` — rule shape exists
- **Gap:** No governance rule store or evaluation engine
- **Gap:** No runtime rule addition/removal (RUN-3e AC#4)

**Implementation approach:**
1. Governance rule store: `.hivemind/state/governance.json` — `{ rules: [{ id, condition, action, scope }] }`
2. Rule evaluation in `tool.execute.before`: evaluate all rules matching current session/tool context
3. Soft policy actions (D-04): `warn` (add to warnings), `escalate` (notify parent), `block` (hard stop — rare)
4. Rule management API: `addRule()`, `removeRule()`, `listRules()` — callable via tool or programmatically
5. Violation logging: `.hivemind/state/violations.json` — append-only log with timestamp, sessionID, ruleID, action
6. Tests: rule violation triggers expected action; rule can be added/removed at runtime

**Cross-dependencies:**
- Depends on: 2d (recovery re-applies rules), 2h (budget awareness for governance)
- Blocking: 2f (injection respects governance rules)

### Sub-Phase 2f: Injection Engine

**OpenCode SDK surfaces needed:**
- `system.transform` hook — inject system prompt content per-session
- `experimental.session.compacting` hook — [VERIFIED: plugin docs] inject context into compaction
- `tool.definition` hook — [VERIFIED: plugin docs] dynamically modify tool descriptions
- `client.app.agents()` — [VERIFIED: SDK docs] list available agents for injection targeting

**Existing code assessment:**
- `plugin.ts` has `experimental.session.compacting` hook already wired — injects harness state snapshot
- `src/hooks/messages-transform.ts` — message transformation hook exists
- **Gap:** No conditional injection engine or rule evaluation for injection
- **Gap:** No injection log/audit trail (RUN-3f AC#4)

**Implementation approach:**
1. Injection rule store: `.hivemind/state/injection-rules.json` — `{ rules: [{ id, conditions, inject: { rules?, commands?, skills?, tools? } }] }`
2. Evaluation in `system.transform` hook (or session compaction): match current context against conditions → collect applicable injections
3. Injection respects governance rules (2e): blocked rules never inject
4. Injection log: `.hivemind/state/injection-log.json` — per-session audit trail
5. Scoped ruleset (D-06): limited to rules, commands, skills, tools — not a full policy engine
6. Tests: matching session receives injection; non-matching does not

**Cross-dependencies:**
- Depends on: 2e (governance rules), 2g (agent definitions for injection targeting)
- Blocking: None downstream

### Sub-Phase 2g: Specialist Classification

**OpenCode SDK surfaces needed:**
- `client.app.agents()` — [VERIFIED: SDK docs] list available agents
- `client.session.create({ body: { agent } })` — [VERIFIED: SDK docs] specify agent for session
- `client.config.providers()` — [VERIFIED: SDK docs] list available models for agent presets

**Existing code assessment:**
- `plugin.ts` has `AGENT_DEFAULTS` (temperature per agent) and `AGENT_TOOLS` (tool allow/ask per agent) — foundation exists
- `types.ts` has `SpecialistAgent = "researcher" | "builder" | "critic"` and `VALID_AGENTS` — limited to 3
- `types.ts` has `DelegationRouteResolution` — routing resolution shape exists
- `lifecycle-manager.ts` has agent-based permission profiles — `getPermissionRulesForAgent()`
- **Gap:** No configurable agent presets beyond hardcoded 3 agents
- **Gap:** No task classification/matching heuristics
- **Gap:** No fallback to generalist (D-07)

**Implementation approach:**
1. Agent preset store: `.hivemind/state/agent-presets.json` — `{ presets: [{ name, domain, triggers, tools, temperature, maxToolCalls }] }`
2. Task classification: keyword matching + category-based routing (existing `VALID_DELEGATION_CATEGORIES`)
3. Matching heuristics: task description tokens → category triggers → best-matching specialist
4. Generalist fallback (D-07): if no specialist matches, use "builder" as default (current behavior)
5. Recording: specialist assignment in delegation packet (2b)
6. Tests: task routed to correct specialist; mismatched task falls back to generalist

**Cross-dependencies:**
- Depends on: 2a (agent spawning), 2b (delegation packet recording)
- Blocking: 2f (injection engine uses agent presets for targeting)

### Sub-Phase 2h: Circuit Breaker

**OpenCode SDK surfaces needed:**
- `tool.execute.before` hook — [VERIFIED: plugin docs] where circuit breaker is applied
- `session.compacting` hook — budget reset on compact

**Existing code assessment:**
- `plugin.ts` has `CIRCUIT_BREAKER_THRESHOLD = 16` and `MAX_TOOL_CALLS_PER_SESSION = 400` — hardcoded constants
- `plugin.ts` `tool.execute.before` hook already implements: tool call counting, loop detection, circuit breaker trip
- `state.ts` has `SessionStats` with `total`, `byTool`, `loop: LoopWindow`, `warnings` — tracking exists
- **Gap:** Not configurable per session (D-09, D-10) — hardcoded constants
- **Gap:** Budget reset on compact/restart (D-11) — partially exists (in-memory Maps reset on process restart, but compact doesn't reset)
- **Gap:** Warning state not preserved in continuity records (D-11)

**Implementation approach:**
1. Configurable thresholds: `.hivemind/state/budget-config.json` — `{ circuitBreakerThreshold: 16, maxToolCallsPerSession: 400 }` with per-session overrides via delegation packet
2. Per-session override: delegation packet can specify `{ budgetConfig: { circuitBreakerThreshold: 8 } }`
3. Budget reset on compact: extend `experimental.session.compacting` hook to reset `sessionStats` for that session
4. Warning preservation: write warning state to continuity record's `metadata.lifecycle` on compact
5. Tests: session exceeds threshold → warning emitted; session exceeds max → tool calls blocked

**Cross-dependencies:**
- Depends on: 2c (concurrency for budget tracking per lane)
- Blocking: 2e (governance uses budget awareness)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background process management | Custom tmux wrapper | OpenCode `client.session.create()` + `client.session.prompt()` with `CompletionDetector` | OpenCode handles session lifecycle, event emission, abort signaling — D-13 built-in mode |
| Event bus | Custom EventEmitter | OpenCode `event` hook + `client.event.subscribe()` | Plugin already uses `event` hook — proven, no circular deps |
| Tool argument validation | Custom validators | `tool.schema` (Zod re-export) | Required by OpenCode plugin pattern — provides automatic error messages |
| Session state persistence | Custom DB | Existing `continuity.ts` (JSON file) + `@opencode-ai/sdk` session API | 638 LOC of battle-tested code — extends, don't replace |
| Concurrency semaphore | New queue library | Existing `DelegationConcurrencyQueue` (98 LOC) | Already integrated with lifecycle-manager — add timeout + config, don't replace |
| File watching | Custom polling | Node `fs.watch` (single manifest file) or `chokidar` (multiple files) | Node built-in sufficient for single-file watch |
| Agent routing logic | ML/NLP classifier | Keyword matching + category triggers + configurable presets | D-07 specifies advisory/configurable routing — overkill to build ML classifier |

**Key insight:** The harness already has 70% of the runtime foundation built. Phase 02 is about enhancing and integrating existing code, not building from scratch. The biggest gaps are: (1) tmux unavailable → built-in mode only, (2) no per-session configuration, (3) no delegation packet files, (4) governance/injection engines not started.

## Common Pitfalls

### Pitfall 1: tmux Assumption
**What goes wrong:** Research and planning assume tmux is available, but it's not installed on macOS target machine. Background agent spawning silently fails.
**Why it happens:** tmux is common on Linux dev environments but rarely pre-installed on macOS.
**How to avoid:** Build adapter abstraction (D-02) with built-in mode as primary, tmux as optional extension. Document tmux requirement clearly.
**Warning signs:** `command -v tmux` returns non-zero; tests for tmux-based execution fail.

### Pitfall 2: In-Memory State Loss on Restart
**What goes wrong:** `state.ts` Maps (`sessionStats`, `rootBudgets`, `sessionToRoot`) are lost on process restart. Continuity.json survives but in-memory budget tracking resets.
**Why it happens:** Maps are volatile; continuity.json is durable but only tracks session records, not tool call counts or loop windows.
**How to avoid:** On plugin init (`hydrateFromContinuity()`), rebuild in-memory maps from continuity records. For tool call budgets, persist counters to continuity.json and reload.
**Warning signs:** After restart, tool call counts reset to 0 but should reflect pre-restart usage.

### Pitfall 3: Circular Dependencies in Module Graph
**What goes wrong:** New modules import from each other creating circular dependencies — TypeScript compiles but runtime behavior is undefined (imports are `{}`).
**Why it happens:** Adding governance → injection → specialist modules creates dependency cycles.
**How to avoid:** Strict layering: `shared/` → `lib/` → `tools/` + `hooks/` → `plugin.ts`. No `lib/` module imports from `tools/` or `hooks/`. Use dependency injection for cross-layer communication.
**Warning signs:** `console.log` of imported module shows `{}` or `undefined`.

### Pitfall 4: Continuity File Corruption
**What goes wrong:** Concurrent writes to `session-continuity.json` from multiple async delegations corrupt the file (partial writes, JSON parse errors).
**Why it happens:** `persistStore()` in `continuity.ts` uses synchronous `writeFileSync` but multiple sessions may call it concurrently — Node's event loop interleaves writes.
**How to avoid:** Use write queue or file locking for continuity.json writes. Consider per-session continuity files instead of single monolithic file.
**Warning signs:** `JSON.parse` errors on continuity.json, `loadStoreFromDisk()` returns empty store.

### Pitfall 5: Lifecycle Manager LOC Creep
**What goes wrong:** `lifecycle-manager.ts` is already 705 LOC (exceeds 500 LOC limit). Adding background agent, recovery, governance integration will push it to 1000+ LOC.
**Why it happens:** All session lifecycle logic concentrated in one class.
**How to avoid:** Extract sub-modules: `background-agent-launcher.ts`, `recovery-manager.ts`, `governance-evaluator.ts`, `injection-engine.ts`. Lifecycle manager becomes orchestrator that delegates to specialists.
**Warning signs:** Single file exceeds 500 LOC; class has more than 10 methods.

### Pitfall 6: OpenCode SDK Version Drift
**What goes wrong:** SDK methods change between versions — `client.session.create()` response shape differs, `event.subscribe()` event types change.
**Why it happens:** OpenCode is actively developed; SDK surfaces may change.
**How to avoid:** Pin SDK version in package.json (`"@opencode-ai/sdk": "1.3.17"`). Test against current version. Document SDK version assumptions.
**Warning signs:** TypeScript errors on SDK method calls; unexpected response shapes.

## Code Examples

### Background Agent with Built-in Sub-Session Mode (existing pattern, enhanced)

```typescript
// Source: src/lib/lifecycle-manager.ts (existing) + enhancements for 2a
import { client } from "@opencode-ai/sdk"
import { CompletionDetector } from "./completion-detector.js"

async function launchBackgroundAgent(args: {
  parentSessionID: string
  taskDescription: string
  promptText: string
  agent: "researcher" | "builder" | "critic"
  runInBackground: boolean
}): Promise<string> {
  // Create child session (existing pattern)
  const childSession = await client.session.create({
    body: { parentID: args.parentSessionID, title: `${args.agent}: ${args.taskDescription}` },
  })
  const childSessionID = childSession.data.id

  if (args.runInBackground) {
    // Fire and forget — CompletionDetector watches for completion
    void client.session.prompt({
      path: { id: childSessionID },
      body: { parts: [{ type: "text", text: args.promptText }] },
    }).catch(handleBackgroundError)

    return childSessionID
  }

  // Sync mode — blocks until assistant completes
  const response = await client.session.prompt({
    path: { id: childSessionID },
    body: { parts: [{ type: "text", text: args.promptText }] },
  })
  return response.data.id
}
```

### Delegation Packet Format (D-14)

```typescript
// Source: D-14 decision + AGENTS.md §Delegation Continuity Rules
import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

type DelegationPacket = {
  planRef: string          // Reference to task plan
  taskDetails: {           // Task objective + scope
    objective: string
    scope: string
    constraints: string[]
  }
  purpose: string          // Why this task exists
  agents: {                // Agent configuration
    type: "researcher" | "builder" | "critic"
    temperature: number
    model?: string
  }
  tools: {                 // Tool access profile
    allowed: string[]
    denied: string[]
  }
  handoffArtifacts: string[]  // Paths to artifacts from parent
  codeChanges: string[]       // Git refs of changes made
  gitCommits: string[]        // Commit SHAs produced
  results: {               // Outcome (filled on completion)
    status: "completed" | "failed" | "cancelled"
    output?: string
    error?: string
    completedAt?: number
  }
}

const DELEGATION_DIR = resolve(process.cwd(), ".hivemind", "delegation")

async function writeDelegationPacket(packet: DelegationPacket, sessionID: string): Promise<string> {
  mkdirSync(DELEGATION_DIR, { recursive: true })
  const packetPath = resolve(DELEGATION_DIR, `${sessionID}.json`)
  writeFileSync(packetPath, JSON.stringify(packet, null, 2))
  
  // Update manifest
  await updateManifest(sessionID, packetPath)
  return packetPath
}
```

### Concurrency Queue with Timeout (enhancement for 2c)

```typescript
// Source: src/lib/concurrency.ts (existing) + timeout enhancement
export class DelegationConcurrencyQueue {
  async acquire(
    key: string,
    limit = this.defaultLimit,
    timeoutMs?: number
  ): Promise<() => void> {
    const lane = this.getLane(key, limit)

    if (lane.active < lane.limit) {
      lane.active += 1
      return this.makeRelease(key, lane)
    }

    return new Promise((resolve, reject) => {
      const timeoutId = timeoutMs
        ? setTimeout(() => {
            const idx = lane.pending.indexOf(resolve as any)
            if (idx !== -1) lane.pending.splice(idx, 1)
            reject(new Error(`[Harness] Concurrency acquire timeout for key "${key}" after ${timeoutMs}ms`))
          }, timeoutMs)
        : undefined

      const wrappedResolve = (release: () => void) => {
        if (timeoutId) clearTimeout(timeoutId)
        resolve(release)
      }
      lane.pending.push(wrappedResolve)
    })
  }
}
```

### Governance Rule Evaluation (soft policy, D-04)

```typescript
// Source: D-04 decision + plugin.ts tool.execute.before pattern
type GovernanceRule = {
  id: string
  condition: {
    agent?: string[]
    tool?: string[]
    category?: string[]
    sessionDepth?: { min?: number; max?: number }
  }
  action: "warn" | "escalate" | "block"
  scope: "session" | "delegation" | "global"
}

async function evaluateGovernanceRules(
  rules: GovernanceRule[],
  context: { sessionID: string; toolName: string; agent: string; category?: string; depth: number }
): Promise<{ action: "warn" | "escalate" | "block"; ruleID: string; message: string } | null> {
  for (const rule of rules) {
    if (rule.condition.agent && !rule.condition.agent.includes(context.agent)) continue
    if (rule.condition.tool && !rule.condition.tool.includes(context.toolName)) continue
    if (rule.condition.category && context.category && !rule.condition.category.includes(context.category)) continue
    if (rule.condition.sessionDepth) {
      const { min, max } = rule.condition.sessionDepth
      if (min !== undefined && context.depth < min) continue
      if (max !== undefined && context.depth > max) continue
    }
    return { action: rule.action, ruleID: rule.id, message: `Rule ${rule.id} triggered for ${context.toolName}` }
  }
  return null
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded circuit breaker constants | Per-session configurable thresholds | Phase 2 (this phase) | Different delegation chains can have different budgets |
| Single monolithic continuity.json | Delegation packets + manifest.json + continuity.json | Phase 2 (this phase) | Fast lookup without parsing entire store |
| In-memory Maps only | Dual-layer: Maps + durable JSON + delegation files | Phase 2 (this phase) | State survives process restart |
| Fixed 3 specialist agents | Configurable agent presets with domain triggers | Phase 2 (this phase) | Extensible beyond researcher/builder/critic |
| No governance rules | Soft policy runtime with warn/escalate/block | Phase 2 (this phase) | Configurable enforcement without hard-stopping |
| tmux-only background agents | Built-in OpenCode sub-session + subprocess stdio | Phase 2 (this phase) | No external dependency required |

**Deprecated/outdated:**
- `CIRCUIT_BREAKER_THRESHOLD = 16` hardcoded constant → configurable per session
- `MAX_TOOL_CALLS_PER_SESSION = 400` hardcoded constant → configurable per session
- 3-agent fixed list (`VALID_AGENTS`) → configurable agent presets
- tmux as required background execution → built-in mode as primary (tmux optional)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `js-yaml` v4.1.0 is the standard YAML parser for Node.js | Standard Stack | Low — alternative is `yaml` package, but js-yaml is more common |
| A2 | `chokidar` v4.0.1 is the standard file watcher for Node.js | Standard Stack | Low — Node `fs.watch` is sufficient fallback |
| A3 | OpenCode `event.subscribe()` returns SSE stream with `{ type, properties }` shape | 2a SDK surfaces | MEDIUM — if event shape differs, completion detection breaks. Verify with live OpenCode instance |
| A4 | `client.session.prompt({ body: { noReply: true } })` does not trigger AI response | 2a SDK surfaces | LOW — documented in SDK docs as "inject context without triggering AI response" |
| A5 | The refactored codebase's "time-machine parser/writer" (D-17) exists as a module | 2d session recovery | MEDIUM — if it doesn't exist, full context restoration must be built from scratch |
| A6 | `.hivemind/` directory structure matches AGENTS.md (delegation/, state/, sessions/, hierarchy/) | 2b delegation chain | LOW — directory structure is a convention, can be adjusted |
| A7 | OpenCode SDK `client.session.children()` returns sessions with same shape as `client.session.get()` | 2b SDK surfaces | LOW — both return Session type per SDK docs |

## Open Questions (RESOLVED)

1. **Resolved: what event shape should Phase 02 plan against?**
   - Resolution: Phase 02 should plan against the plugin `event` hook and `experimental.session.compacting`, not `client.event.subscribe()` as the primary runtime surface for plugin-side monitoring.
   - Evidence: `docs/designs/2026-04-02-session-api-rewrite.md` corrects the earlier assumption and states that plugin runtimes should use the `event` hook; it also records that lifecycle/status events carry `event.properties.sessionID` while lifecycle info events can carry `event.properties.info`.
   - Planning consequence: background execution and recovery plans should treat hook-delivered events as the authoritative path and only use degraded polling when hook-driven completion signals are insufficient.

2. **Resolved: does the "time-machine parser/writer" currently exist in this codebase?**
   - Resolution: no current `src/` or `.planning/` artifact proves that a reusable time-machine parser/writer module exists in this branch.
   - Evidence: repository search found only planning/reference mentions, not an implementation module.
   - Planning consequence: Phase 02 recovery plans must not depend on a pre-existing time-machine module. Recovery should be implemented from continuity + message inspection seams that actually exist today.

3. **Resolved: what concurrency assumption is safe without a documented OpenCode hard limit?**
   - Resolution: treat concurrent sub-session count as an operational/config concern, not a hardcoded platform fact. Use conservative defaults and make limits configurable/observable.
   - Evidence: no authoritative platform limit was found in current repo evidence; REQUIREMENTS and CONTEXT both emphasize configurable concurrency and runtime policy over fixed constants.
   - Planning consequence: Phase 02 plans should create config-driven limits and timeout/observability seams, not claim a verified maximum platform session count.

4. **Resolved: should Phase 02 depend on `session.create()` permission-shape assumptions?**
   - Resolution: no. Phase 02 should rely on agent/static permissions plus hook-enforced runtime restrictions, not on unverified `session.create()` tool-restriction semantics.
   - Evidence: `docs/requirements-2026-04-02.md` records the corrected finding that `session.create()` does not accept tool restrictions in the way earlier assumptions implied; current tests in `tests/lib/session-api.test.ts` also only verify `body` + `query` create shape, not a permission payload.
   - Planning consequence: planner/executor work should keep permission enforcement in agent configuration and plugin/tool-guard layers unless future live SDK verification proves a stronger create-time permission contract.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | OpenCode handles auth via provider API keys |
| V3 Session Management | yes | Session lineage tracking via `parentSessionID`/`rootSessionID` in continuity records |
| V4 Access Control | yes | Permission rules per agent (`PermissionRule` type) — tool allow/ask/ask |
| V5 Input Validation | yes | `tool.schema` (Zod) for all tool args; governance rule conditions validated |
| V6 Cryptography | no | No cryptographic operations in this phase |

### Known Threat Patterns for OpenCode Plugin Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Runaway tool call loop | Tampering/Elevation | Circuit breaker (16 repeated calls) + max tool call budget (400/session) |
| Deep delegation chain exhaustion | Denial of Service | Max depth 3 + max descendants per root (10) |
| Malicious delegation packet | Spoofing | Validate packet JSON schema on load; never eval/exec from packet content |
| Continuity file tampering | Tampering | Deep-clone-on-read; validate schema on load; write atomic (rename from temp) |
| Injection rule bypass | Elevation of Privilege | Governance rules evaluated before injection; blocked rules never inject |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 [VERIFIED: npm registry] |
| Config file | `vitest.config.ts` (exists, globals: true) |
| Quick run command | `npx vitest run -t "<test name>"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RUN-3a | Background agent spawn/complete/cleanup | unit | `npx vitest run tests/lib/background-agent.test.ts` | ❌ |
| RUN-3b | Delegation packet round-trip (parent→child→completion) | unit | `npx vitest run tests/lib/delegation-chain.test.ts` | ❌ |
| RUN-3c | Concurrent acquire serializes on same key; different keys parallel | unit | `npx vitest run tests/lib/concurrency.test.ts` | ✅ exists |
| RUN-3c | Timeout on acquire rejects with error | unit | `npx vitest run tests/lib/concurrency.test.ts -t "timeout"` | ❌ (not yet tested) |
| RUN-3d | Simulate crash mid-task, restart, verify resume from checkpoint | integration | `npx vitest run tests/lib/session-recovery.test.ts` | ❌ |
| RUN-3e | Governance rule violation triggers expected action | unit | `npx vitest run tests/lib/governance.test.ts` | ❌ |
| RUN-3f | Session with matching conditions receives injection; non-matching does not | unit | `npx vitest run tests/lib/injection-engine.test.ts` | ❌ |
| RUN-3g | Task routed to correct specialist; mismatched falls back to generalist | unit | `npx vitest run tests/lib/specialist-routing.test.ts` | ❌ |
| RUN-3h | Session exceeds threshold → warning; exceeds max → tool calls blocked | unit | `npx vitest run tests/lib/circuit-breaker.test.ts` | ❌ (partial — tested via plugin.ts) |

### Wave 0 Gaps
- [ ] `tests/lib/background-agent.test.ts` — covers RUN-3a
- [ ] `tests/lib/delegation-chain.test.ts` — covers RUN-3b
- [ ] `tests/lib/concurrency.test.ts` — covers RUN-3c timeout (exists, needs timeout tests)
- [ ] `tests/lib/session-recovery.test.ts` — covers RUN-3d
- [ ] `tests/lib/governance.test.ts` — covers RUN-3e
- [ ] `tests/lib/injection-engine.test.ts` — covers RUN-3f
- [ ] `tests/lib/specialist-routing.test.ts` — covers RUN-3g
- [ ] `tests/lib/circuit-breaker.test.ts` — covers RUN-3h (existing coverage via plugin tests, needs dedicated tests)
- [ ] `tests/lib/lifecycle-manager.test.ts` — reduce from current scope after extraction

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/<module>.test.ts -t "<specific test>"`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Sources

### Primary (HIGH confidence)
- [Context7: opencode-sdk] — SDK surfaces verified: session CRUD, prompt, events, app.agents(), config.providers() [VERIFIED: Context7]
- [Context7: opencode-plugins] — Plugin hooks, tool definitions, event list, compaction hooks [VERIFIED: Context7]
- [Context7: opencode-agents] — Agent configuration, permission profiles, modes, hidden agents [VERIFIED: Context7]
- [Context7: opencode-built-in-tools] — Tool list: bash, edit, write, read, grep, glob, list, lsp, patch, skill, todowrite, webfetch, websearch, question [VERIFIED: Context7]
- [Context7: opencode-commands] — Command frontmatter, templates, arguments, shell injection [VERIFIED: Context7]
- [Source code audit] — All `src/lib/*.ts`, `src/plugin.ts`, `src/tools/`, `src/hooks/` read and analyzed [VERIFIED: read_file]
- [npm registry] — Package versions verified: vitest@4.1.2, typescript@6.0.2, @opencode-ai/plugin@1.3.17, @opencode-ai/sdk@1.3.17 [VERIFIED: npm view]

### Secondary (MEDIUM confidence)
- [`.opencode/skills/opencode-platform-reference/references/`] — Platform reference skill files (20 files) read and analyzed [VERIFIED: glob + read_file]
- [`.planning/`] — ROADMAP.md, REQUIREMENTS.md, STATE.md, config.json read and analyzed [VERIFIED: read_file]
- [02-CONTEXT.md] — 18 decisions, discretion areas, deferred ideas [VERIFIED: read_file]
- [architecture-proposal-hivemind-v3.md] — V3 architecture intent and module structure [VERIFIED: read_file]

### Tertiary (LOW confidence)
- [OMO reference] — `.opencode/skills/oh-my-openagent-reference/` exists but XML pack (276k lines) not deeply parsed [ASSUMED: structure based on skill name]
- [tmux capabilities] — tmux not available on target machine; capabilities documented from training knowledge [ASSUMED: tmux API patterns]
- [js-yaml, chokidar] — Not verified via Context7; standard Node.js ecosystem knowledge [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm registry and Context7 for OpenCode surfaces
- Architecture: MEDIUM — existing code verified, but tmux absence changes background agent approach significantly
- Pitfalls: MEDIUM — based on code analysis and environment audit; some assumptions about OpenCode SDK event shapes
- Cross-dependency mapping: HIGH — derived from actual code import graph and CONTEXT.md decisions

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days — OpenCode SDK is fast-moving; verify SDK surfaces before implementation)

## Failed Research Log

| Attempt | Tool | Target | Result | Alternative Used |
|---------|------|--------|--------|-----------------|
| tmux availability check | shell (`tmux -V`) | tmux on target machine | NOT FOUND | Built-in mode (OpenCode sub-session) per D-02 |
| tmux command list | shell (`tmux list-commands`) | tmux capabilities | NOT FOUND | Omitted from research — tmux mode is optional future work |
| Context7: @opencode-ai/plugin API | Context7 MCP | Plugin type signatures | Not attempted directly — SDK docs from `.opencode/skills/` sufficient | Read opencode-plugins.md reference |
| Context7: @opencode-ai/sdk API | Context7 MCP | Full SDK type definitions | Not attempted directly — SDK docs from `.opencode/skills/` sufficient | Read opencode-sdk.md reference |
| OMO XML deep parse | read_file | oh-my-openagent-full.xml (276k lines) | Too large for single read | Read project-structure.md summary instead |
