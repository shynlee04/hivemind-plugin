# Phase 02: V3 Runtime Architecture - Context

**Gathered:** 2026-04-06 (updated)
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the V3 runtime architecture for the harness: background agent execution, delegation chain persistence, concurrency integration, session recovery, context governance, runtime injection, specialist routing, and configurable circuit-breaker budgets. This phase defines and implements runtime behavior inside the harness itself; schema-definition work and later migration/integration validation remain separate phases.

</domain>

<decisions>
## Implementation Decisions

### Background agent execution model
- **D-01:** Background agents should use visible worker sessions when the environment supports pane/session spawning.
- **D-02:** If pane/session support is unavailable, the runtime must fall back to headless background execution rather than failing the delegation flow.
- **D-03:** Delegation must preserve strict parent/child lineage and resume metadata so background and headless workers share one durable execution model.
- **D-12:** Hybrid background execution — tmux mode for parallel-independent high-performance work, built-in mode for iterative/linear tasks. Auto-detect based on task characteristics (parallel+independent → tmux, sequential+dependent → built-in). User confirms via a configuration agent menu; settings applied after restart.
- **D-13:** Built-in mode auto-detects between OpenCode sub-session (user-interactive tasks) and subprocess stdio (research-based tasks with background search/crawling, OMO-style orchestrator).

### Recovery, governance, injection, and routing policy
- **D-04:** Phase 2 should use a **soft policy runtime**: governance should prefer warning/escalation behavior over hard blocking in most cases.
- **D-05:** Session recovery should restore task continuity and relevant runtime state, but policy enforcement should stay lighter-weight than a strict hard-stop governance system.
- **D-06:** Runtime injection should be conditional, but scoped to a smaller and more controlled ruleset rather than a fully expansive policy engine in this phase.
- **D-07:** Specialist routing should be advisory/configurable, with broad fallback to a generalist when no strong specialist match exists.

### Session recovery
- **D-17:** Session recovery restores task continuity (active delegations, trajectory state, pending tasks, governance rules) as primary mechanism. Full context restoration is available via the auto time-machine parser/writer already in the refactored codebase — recovered agents use specially-built inspect tools to examine high-level and hierarchical context, then decide which detailed context to load on demand.
- **D-18:** Recovery triggers automatically on session restart with staleness check (configurable threshold). Agent state is presented to users with a staleness risk assessment — they confirm whether to proceed with recovered state or start fresh.

### Concurrency and configuration
- **D-15:** Concurrency configuration is hybrid:
  - Internal interfaces (tool→agent→runtime mapping within Hivemind) → JSON config file
  - External OpenCode SDK interactions (create session, append message) → OpenCode-style YAML/JSON
  - Runtime-dynamic changes (instantaneous adjustments, SDK/library dependencies) → Programmatic API
- **D-16:** Tool budgets, loop detection, and retry resolution use built-in OpenCode mechanisms where available — custom concurrency only supplements what OpenCode doesn't provide natively.

### Delegation packet format
- **D-14:** Delegation packets stored as separate JSON files in `.hivemind/delegation/` with full hierarchy: plan reference, task details, purpose, agents/tools, handoff artifacts, code changes, git commits, results. A `manifest.json` indexes active packets for fast lookup without directory scanning.

### Circuit breaker and tool budget behavior
- **D-08:** Keep the existing warning-then-hard-stop budget structure rather than replacing it with a new model.
- **D-09:** Circuit-breaker and tool-budget thresholds must be configurable per session/runtime context rather than fixed global constants only.
- **D-10:** Default limits can remain close to current code behavior, but overrides should be possible without changing source constants for every scenario.
- **D-11:** Budget/reset behavior should continue to reset on compact/restart, with warning state preserved in continuity records when useful for recovery and observability.

### Claude's Discretion
- Exact JSON field names and internal TypeScript shape for delegation/recovery records, as long as they preserve lineage, resume context, validation signals, and result status.
- Exact pane/session adapter mechanism (tmux-specific wrapper vs adapter abstraction), as long as pane-capable environments get visible workers and unsupported environments get clean headless fallback.
- Exact matching heuristics for specialist routing, as long as routing remains configurable and falls back safely to a generalist.
- Exact warning/escalation thresholds and logging format, as long as they implement configurable per-session budgets consistent with D-08 through D-11.
- Configuration agent menu design and UX flow (the mechanism for users to confirm settings before restart).
- Staleness threshold default value and risk assessment presentation format.

</decisions>

<specifics>
## Specific Ideas

- The user explicitly chose a **visible worker** model over a purely hidden async runtime.
- The user explicitly chose a **soft policy** runtime over strict hard-block governance for this phase.
- The user explicitly chose **configurable thresholds** over fixed one-size-fits-all circuit-breaker settings.
- **Hybrid background execution**: tmux for high-performance parallel-independent work, built-in for iterative/linear breakdown. Auto-detect with user confirmation via config agent menu.
- **Built-in mode auto-detect**: OpenCode sub-session for interactive tasks, subprocess stdio for research-based background work (OMO-style orchestrator).
- **Delegation packets are rich hierarchical records**: plan reference, task details, purpose, agents/tools, handoff artifacts, code changes, git commits, results — traceable back to what happened.
- **Concurrency is about configuration mapping**: tools→agents→runtime types, agents→workflows→retry resolution, using OpenCode built-in mechanisms where available.
- **Session recovery**: task continuity primary + full context via time-machine parser/writer with inspect tools for on-demand loading.
- **Recovery staleness**: auto-check with configurable threshold, agent state shown to user with risk assessment for confirmation.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and acceptance criteria
- `.planning/ROADMAP.md` — Phase 2 scope, sub-phase ordering (2a-2h), and current roadmap boundary
- `.planning/REQUIREMENTS.md` — RUN-3a through RUN-3h descriptions and acceptance criteria (§Phase 2: Runtime Architecture)
- `.planning/STATE.md` — current project position, locked cleanup decisions, and continuity constraints

### Runtime architecture intent
- `AGENTS.md` — project governance, harness vs meta-concepts split, module boundaries, testing gates
- `docs/draft/architecture-proposal-hivemind-v3.md` — target V3 runtime capabilities and architectural direction

### Existing code assets
- `src/lib/concurrency.ts` — keyed semaphore/FIFO (98 LOC, needs integration)
- `src/lib/continuity.ts` — durable JSON persistence (638 LOC)
- `src/lib/lifecycle-manager.ts` — session lifecycle transitions (705 LOC, needs reduction to <500)
- `src/lib/session-api.ts` — parent-chain traversal, session creation helpers
- `src/lib/state.ts` — in-memory fast-path state maps
- `src/lib/completion-detector.ts` — two-signal async completion detection
- `src/lib/notification-handler.ts` — async completion notification
- `src/lib/runtime.ts` — event→status mapping
- `src/lib/agent-registry.ts` — agent definitions
- `src/lib/task-status.ts` — task status transitions + guards
- `src/plugin.ts` — composition root (thin assembly, zero business logic)

### Delegation and recovery
- `AGENTS.md` §Delegation Continuity Rules — 8 required fields per delegation packet
- `AGENTS.md` §Session/Subsession Resume Behavior — ses_id, subses_id, continuity tracking

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/concurrency.ts`: keyed semaphore/FIFO (98 LOC) — integrate for RUN-3c, don't replace
- `src/lib/continuity.ts`: durable JSON persistence (638 LOC) — foundation for delegation records, recovery state, warning/budget continuity
- `src/lib/state.ts`: in-memory fast-path state maps for session/root/delegation tracking
- `src/lib/lifecycle-manager.ts`: session lifecycle transitions and hydration logic (705 LOC — exceeds 500 LOC limit, needs reduction)
- `src/lib/session-api.ts`: parent-chain traversal and session creation helpers for delegation lineage
- `src/lib/completion-detector.ts`: two-signal completion detection for background agent lifecycle
- `src/lib/notification-handler.ts`: async completion notification for background agents
- `src/plugin.ts`: delegate-task entry point, circuit-breaker thresholds, composition-root wiring

### Established Patterns
- Keep `src/plugin.ts` as thin composition root; new runtime behavior lives under `src/lib/` or extracted tool modules
- Preserve dual-layer state: in-memory operational state + durable JSON continuity
- TypeScript strictness, ESM imports with `.js` extensions, `[Harness]`-prefixed thrown errors
- Extend existing queue/continuity/lifecycle flows over introducing parallel shadow implementations
- Max module size: 500 LOC (lifecycle-manager at 705 LOC needs attention)

### Integration Points
- Delegate-task flow in `src/plugin.ts` — natural integration point for background mode, lineage metadata, specialist selection, per-session budget config
- Continuity hydration in `src/lib/lifecycle-manager.ts` and `src/lib/continuity.ts` — session recovery, persisted warnings/budgets
- Existing concurrency lane acquisition — visible-vs-headless worker execution decisions, resource protection
- Auto time-machine parser/writer (from refactored codebase) — full context restoration on recovery

</code_context>

<deferred>
## Deferred Ideas

- **Configuration agent UI/UX**: Menu design, flow, and presentation for user confirmation of background agent settings (deferred to implementation phase — decision captured that it exists and when settings apply)
- **Staleness threshold default value**: Exact numeric threshold for recovery staleness (deferred to implementation — decision captured that it's configurable with user risk assessment)
- **Schema Definition (Phase 3)**: YAML schemas for Agent/Command/Skill frontmatter — mentioned during concurrency discussion as related to agent-tool mapping but belongs in Phase 3

</deferred>

---

*Phase: 02-v3-runtime-architecture*
*Context gathered: 2026-04-06 (updated)*
