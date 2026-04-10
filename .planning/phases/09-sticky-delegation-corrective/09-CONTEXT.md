# Phase 09: Sticky Delegation Corrective - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning (RE-PLAN — original Phase 09 FAILED)

<domain>
## Phase Boundary

Redesign the tasking/delegation system with three goals:
1. **Fix 5 critical runtime bugs** that cause false-completion in 12-21ms (documented in root cause analysis)
2. **Restructure `src/` architecture** into clean feature modules with CQRS separation, <300 LOC per file
3. **Implement user-specified completion detection logic** (start gate → polling → true completion → failure handling → parent coordination)
4. **Make internal features configurable via JSON** — harness as portal, config as guardrails

This is NOT a bugfix phase. It is an architecture redesign that fixes bugs as a byproduct of correct structure.

**Out of scope:** Full config wiring for governance, hooks injection, routing, permissions (future phases). UI/UX for configuration (near future, not this phase). Clean Architecture decomposition of non-tasking modules.

</domain>

<decisions>
## Implementation Decisions

### Module Boundaries & Structure

- **D-01:** Feature module pattern — create `src/lib/tasking/` as the coordination-tasking domain. Contains lifecycle-manager (reduced), runners/, completion/, concurrency, notification. Other domains (governance, injection, persistence) stay in `src/lib/`.
- **D-02:** 3-way split of `lifecycle-manager.ts` (734 LOC) into:
  - `tasking-coordinator.ts` — dispatch + event routing (~250 LOC)
  - `tasking-observer.ts` — background observation + notification (~200 LOC)
  - `tasking-dispatcher.ts` — prompt delivery + runner selection (~200 LOC)
  Each under 300 LOC with clear single responsibility.
- **D-03:** Shared runner interface in `src/lib/tasking/runners/` with `types.ts` (common `PatchLifecycleArgs` + `TaskRunner` interface), `process-runner.ts`, `tmux-runner.ts`, `subsession-runner.ts` (extracted from process-runner). Each runner implements the same `TaskRunner` contract.
- **D-04:** Config mindset: **absence of config = freedom, presence of config = constraint**. Config is guardrails, not cage. This applies to skills, tools, delegation, permissions, hooks injection, routing.

### Configurability Surface

- **D-05:** Hybrid config — single `harness.json` (or `.jsonc`) at project root as entry point, with optional references to concern-specific files. Like oh-my-openagent's single config with sections.
- **D-06:** Phase 09 implements config **SCHEMA** (Zod types) + **tasking wiring** only. Governance, hooks injection, routing, permissions config deferred to future phases.
- **D-07:** Configurable aspects for tasking: agent→skill injection per category, category→model routing, concurrency limits per key, completion detection parameters (poll intervals, timeouts, stability thresholds).
- **D-08:** All internal features using hooks/plugins (non-SDK functions, subscriptions) must be user-configurable through JSON. Harness is a portal — making stacking and combining achievable.

### Completion Detection

- **D-09:** Completion detection as sub-module: `src/lib/tasking/completion/` with `start-gate.ts`, `poll-strategy.ts`, `completion-verifier.ts`, `failure-handler.ts`. Each <300 LOC.
- **D-10:** **START GATE**: A delegation is only "started" when: (a) ≥1 assistant thinking block produced, (b) ≥2 tool calls registered, (c) both verified via SDK session messages API. Until start gate passes, session state is `starting` (not `running`). Parent may continue other work but cannot consider delegation successful.
- **D-11:** **POLLING**: 15s initial interval, +5s incremental backoff per cycle, 60s cap. Each poll checks: new assistant messages, tool call activity, session status (idle/active/error).
- **D-12:** **TRUE COMPLETION**: Only when: (a) LAST message is assistant output (not user/tool-result), (b) session status is idle, (c) both conditions hold for 2 consecutive polls (stability), (d) minimum evidence from start gate is met.
- **D-13:** **FAILURE HANDLING**: 180s idle timeout with no evidence → failure → retry. Up to 2 retries. **Resume-first**: use SAME session ID (`ses_xxxxxx`) from SDK. Only create new session if old one is deleted/errored beyond recovery.
- **D-14:** **PARENT COORDINATION**: Main session can serve user while delegations pass start gate. Main session closes ONLY when: (a) ALL background delegations completed with returned results, AND (b) ALL main session tasks complete. Partial completion → main session waits.

### Bug Fixes (from root cause analysis)

- **D-15:** Fix Bug 1: Add `status === "started"` branch in notification summary text (`notification-handler.ts:104-113`)
- **D-16:** Fix Bug 2: Return `{ type: "unknown" }` instead of defaulting to `"busy"` in `checkSessionExists()` (`lifecycle-background-observer.ts:73-92`)
- **D-17:** Fix Bug 3: Only count ASSISTANT messages as evidence, not user prompt (`lifecycle-background-observer.ts:54-58`)
- **D-18:** Fix Bug 4: Don't cache external `session.idle` events; only cache results from internal stability timer (`completion-detector.ts`)
- **D-19:** Fix Bug 5: Architectural — fire-and-forget pattern stays, but observer must work correctly (fixes 1-4 make it work)

### Test Strategy & TDD Rules

- **D-20:** In-memory adapters for SDK boundary — Clean Architecture testing pattern. Create in-memory implementations of the `TaskRunner` interface and SDK session client.
- **D-21:** Mock only: (1) SDK transport (`client.session.create/promptAsync` — needs live OpenCode), (2) time (`vi.useFakeTimers` for poll intervals). **NEVER mock**: internal business logic, runner interface implementations, state machines, concurrency queues.
- **D-22:** LOC > 300 not tolerable. Dead code, overlapping functionality, and conflicts are not allowed.
- **D-23:** Every test must surface rationales — explain in plain language WHY this test exists, WHAT it connects to, whether the unit is small enough, and how it increments toward the larger suite.
- **D-24:** Rewrite all mock-heavy test files: `lifecycle-background-observer.test.ts`, `delegate-task.test.ts`, `delegate-task-overflow.test.ts`, `lifecycle-process-runner.test.ts`. Keep real tests: `completion-detector.test.ts`, `lifecycle-manager.test.ts`, `create-core-hooks.test.ts`.

### Reference Architecture (oh-my-openagent patterns)

- **D-25:** Study and adapt oh-my-openagent patterns: `BackgroundManager` centralized coordinator, per-model FIFO concurrency, spawn depth limits, circuit breaker/loop detection, batched notification delivery, manager factory with DI.
- **D-26:** Study and adapt oh-my-openagent's `TmuxSessionManager`: separate from `BackgroundManager`, bridged via callback, `DecisionEngine` for pane capacity.
- **D-27:** oh-my-openagent's notification delivery uses direct message injection (NOT hook-based). Evaluate for our notification system.

### Code Quality Rules

- **D-28:** Extract duplicated `PatchLifecycleArgs` type from 3 runner files into shared `runners/types.ts`.
- **D-29:** Fix near-cycle: `types.ts` → `pending-notifications.ts` → `continuity.ts` → `types.ts`. Move `PendingNotification` type definition into `types.ts` directly.
- **D-30:** `continuity-normalizers.ts` (706 LOC) split into domain-specific normalizer files.

### the agent's Discretion

- Exact file naming within the tasking module
- Import ordering and code style within files
- Which oh-my-openagent patterns to adapt vs. skip
- Test file organization within the tasking module
- Zod schema structure for config types

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Root Cause & Forensics
- `.planning/debug/delegation-completion-root-cause-2026-04-10.md` — Full 5-bug analysis, test reality assessment, user-specified completion detection spec, 10-plan re-plan scope
- `.planning/debug/09-UAT-quarantined-2026-04-10.md` — Original fabricated UAT (for reference only)
- `.planning/debug/09-VALIDATION-quarantined-2026-04-10.md` — Original fabricated validation (for reference only)

### Architecture & Design
- `docs/draft/architecture-proposal-hivemind-v3.md` — Original V3 architecture proposal with target LOC breakdown
- `docs/superpowers/specs/2026-04-06-harness-clean-design.md` — Design spec for harness cleanup
- `.opencode/skills/oh-my-openagent-reference/` — Packed oh-my-openagent source code for reference

### Phase Context
- `.planning/phases/09-sticky-delegation-corrective/09-CONTEXT.md` — THIS FILE (supersedes all prior Phase 09 decisions D-01 through D-17 from the FAILED execution)
- `.planning/phases/09-sticky-delegation-corrective/09-UAT.md` — Truthful replacement UAT (status: FAILED)
- `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — 18 verified truths (16 SAFE, 2 AT_RISK)
- `.planning/phases/08-repair-durable-parent-observability-for-delegated-sessions/` — Phase 08 context

### Project Files
- `.planning/PROJECT.md` — Project vision and principles
- `.planning/REQUIREMENTS.md` — Requirements (note: PH09-01/02/04/05 missing, need addition)
- `.planning/ROADMAP.md` — Phase 09 marked ❌ FAILED, re-plan required
- `.planning/STATE.md` — Current project state

### Source Code (files with bugs to fix)
- `src/lib/notification-handler.ts` — Bug 1: no "started" branch (L104-113)
- `src/lib/lifecycle-background-observer.ts` — Bug 2: default "busy" (L73-92), Bug 3: prompt as evidence (L54-58)
- `src/lib/completion-detector.ts` — Bug 4: cached idle bypass
- `src/lib/lifecycle-manager.ts` — Bug 5: fire-and-forget (L380), god-module to decompose
- `src/tools/delegate-task.ts` — Delegation entry point
- `src/lib/lifecycle-process-runner.ts` — Process/subsession runner (456 LOC)
- `src/lib/lifecycle-tmux-runner.ts` — Tmux runner (264 LOC, NO test file)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `completion-detector.ts` (124 LOC): Pure state machine with feed/watch/cancel. Zero internal deps. KEEP AS-IS. Extend with start-gate and failure logic.
- `concurrency.ts` (298 LOC): Keyed semaphore with priority FIFO. Well-tested. KEEP. May need per-model variant.
- `session-api.ts` (154 LOC): Typed SDK wrappers. KEEP. Needs async fire-and-forget prompt addition.
- `continuity.ts` (310 LOC): Durable JSON persistence. KEEP. The canonical store.
- `background-manager.ts` (352 LOC): Child-process spawning. KEEP. Needs restructuring into runner interface.

### Established Patterns
- Dual-layer state: durable JSON (`continuity.ts`) + in-memory Maps (`state.ts`) — well-separated
- Composition root: `plugin.ts` at 57 LOC wires everything — very clean
- Tool factory pattern: `src/tools/` uses schema-first approach with Zod — consistent
- Error prefixing: `[Harness]` on all thrown errors — consistent

### Integration Points
- `plugin.ts` wires hooks, tools, and managers — all restructuring must update this
- `create-core-hooks.ts` consumes continuity, governance, injection — tasking changes must not break hooks
- `delegate-task.ts` is the entry point — its interface to lifecycle-manager must remain stable during transition

### Architecture Hot Spots
- `lifecycle-manager.ts` (734 LOC, 18 imports) — god-module, MUST decompose
- `continuity-normalizers.ts` (706 LOC) — split by domain
- Near-cycle: `types.ts` ↔ `pending-notifications.ts` ↔ `continuity.ts`
- Duplicated `PatchLifecycleArgs` in 3 runner files
- Hardcoded constants everywhere (CATEGORY_DEFAULTS, AGENT_TOOLS, VALID_AGENTS)

</code_context>

<specifics>
## Specific Ideas

- **Config as guardrails mindset**: "If not configured, agents are free to choose. If configured, that aspect is locked/sticky." This applies to skills, tools, delegation, permissions, hooks injection, routing. This is a WAY, a mindset — not the only configurable thing.
- **oh-my-openagent BackgroundManager pattern**: Single centralized coordinator with per-model FIFO queue, spawn depth limits, circuit breaker. Adapt for our tasking-coordinator.
- **oh-my-openagent notification injection**: Direct message injection into parent session output (NOT hook-based). Simpler than our current approach.
- **oh-my-openagent manager factory with DI**: All managers instantiatable with test dependencies. Adapt for our restructuring.
- **Feature module structure** from oh-my-openagent: `features/background-agent/`, `features/tmux-subagent/` — self-contained directories. We adapt this as `src/lib/tasking/`.
- **LOC discipline**: 300 LOC hard limit. Current `lifecycle-manager.ts` at 734 LOC is not tolerable.
- **Test rationales**: Every test must explain WHY it exists and WHAT it connects to in plain language.

</specifics>

<deferred>
## Deferred Ideas

### Config Extensions (future phases)
- Governance rules configurable via JSON
- Hooks injection configurable via JSON
- Routing configurable via JSON (agent→category mapping)
- Permissions configurable via JSON
- UI/UX for configuration (near future but not Phase 09)

### Clean Architecture Extensions
- Full domain decomposition of non-tasking modules (governance, injection, persistence into separate domains)
- CQRS separation across all modules
- Plugin assembly pattern from oh-my-openagent

### Reviewed Todos (not folded)
- Plan Phase 11: Clean Architecture Restructuring — overlaps with Phase 09 restructuring but Phase 11 is broader (covers all modules, not just tasking)
- Plan Phase 03: Schema Definition & Runtime Configurability — Phase 09's config schema partially addresses this
- Full Phase 3 planning for runtime configurability — deferred until config schema is proven in Phase 09

</deferred>

---

*Phase: 09-sticky-delegation-corrective*
*Context gathered: 2026-04-10*
