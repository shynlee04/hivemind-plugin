# Phase 16: Background Delegation Revamp + PTY Integration - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild background delegation to overcome all current Phase 14 limitations (read-only restriction, 15-min timeout ceiling, no undo/branching parity, no write-capable background) by synthesizing architecture from oh-my-openagent's background-agent/spawner/concurrency stack, opencode-background-agents' lifecycle plugin, and opencode-pty's interactive PTY. Produce a superior delegate-task that rivals or surpasses OpenCode's built-in task tool while adding PTY interactive background processes as default.

**In scope:**
1. Write-capable background delegation (overcome read-only restriction)
2. PTY interactive background processes as a first-class execution surface, with truthful mode selection per execution path
3. Full spawner architecture extraction (dedicated `src/lib/spawner/` directory)
4. Targeted codebase cleanup: dual-lifecycle resolution, duplicate helper consolidation, DelegationManager decomposition
5. Research and synthesize architecture from: oh-my-openagent (background-agent, spawner, background-task tools, background-notification hooks, tmux), opencode-background-agents (lifecycle plugin, disk persistence), opencode-pty (PTY interactive)
6. Integration with existing delegate-task and delegation-status tools

**Out of scope:**
- tmux/OpenClaw integration (deferred to later phase)
- Continuity.ts module split (Phase 11)
- State.ts singleton cleanup (Phase 11)
- Phase 11 (clean architecture restructuring)
- Phase 03 (schema definition)
- Replacing OpenCode's builtin `task` tool (coexistence, not replacement)
- Config system / governance / injection engine (already deleted)

**Depends on:** Phase 14 (delegate-task rebuild baseline), Phase 15 (security/quality remediation)

</domain>

<decisions>
## Implementation Decisions

### Write-Capable Background Sessions
- **D-01:** Background delegations MUST support write-capable agents (edit, write, bash allowed), not just read-only. The current read-only restriction makes delegate-task nearly useless for real work.
- **D-02:** The specific approach to achieving undo/branching parity is at the planner/researcher's discretion — options include session-tree child sessions (oh-my-openagent's approach), git-tracked write sessions, or a hybrid. The researcher MUST analyze oh-my-openagent's spawner and opencode-background-agents' limitations to recommend the best approach.
- **D-03:** Any write-capable solution MUST preserve the WaiterModel execution pattern (always-background, foreground continues, wait on demand) — this is locked from Phase 14.

### PTY Interactive Integration
- **D-04:** PTY interactive processes are the DEFAULT execution mode for ALL delegations. Every delegated task runs in a PTY unless PTY is unavailable (then falls back to headless).
- **D-04A (Verification-backed amendment):** Gap-closure work for Plans 05-06 supersedes the "for ALL delegations" wording in D-04. Agent delegations MUST use the truthful SDK child-session path when that is the actual execution path; PTY remains the default interactive runtime for command/process execution surfaces (explicit command delegations and the standalone PTY tool) using the same shared PTY subsystem and queue/safety policy. This amendment exists because verification proved the earlier PTY-for-all wording produced disconnected metadata rather than truthful execution.
- **D-05:** The PTY integration MUST come from studying opencode-pty's architecture (`https://github.com/shekohex/opencode-pty`). The researcher must analyze how opencode-pty enables interactive input to background processes and design an integration that fits the harness plugin architecture.

### Spawner Architecture
- **D-06:** Full spawner extraction — create a dedicated `src/lib/spawner/` directory with separate modules following oh-my-openagent's proven pattern:
  - Session creator (spawns OpenCode sessions for background tasks)
  - Concurrency-key resolver (derives concurrency limits per model/provider)
  - Parent-directory resolver (resolves working directory for child sessions)
  - PTY session setup (configures PTY for interactive delegation)
- **D-07:** DelegationManager remains as the orchestration layer but delegates spawning concerns to the spawner modules. Target: DelegationManager drops below 350 LOC.

### Tmux Scope
- **D-08:** tmux/OpenClaw integration is explicitly OUT OF SCOPE for Phase 16. Deferred to a future phase. The researcher should note oh-my-openagent's tmux architecture for future reference but NOT design or implement it now.

### Codebase Cleanup (Targeted)
- **D-09:** Resolve the dual-lifecycle confusion: either remove the stub `HarnessLifecycleManager` and route everything through `DelegationManager`, or make `HarnessLifecycleManager` a thin facade that delegates to `DelegationManager`. Current state (both instantiated, one stub, one functional) is transitional and confusing.
- **D-10:** Consolidate duplicate `extractAssistantText` implementations (in `delegation-manager.ts` and `create-session-hooks.ts`) into a single shared function in `src/lib/helpers.ts`.
- **D-11:** DelegationManager decomposition: with spawner extraction + targeted cleanup, DelegationManager should drop below 350 LOC. Persistence logic may also be extractable.

### Carried Forward from Phase 14 (LOCKED)
- **D-12:** WaiterModel execution — always-background dispatch, foreground continues, wait when result needed
- **D-13:** Dual-signal completion detection — session.idle + message count stability, NO fixed timeouts
- **D-14:** Hybrid persistence — oh-my-openagent dual-signal + disk persistence model
- **D-15:** Dedicated poll/status tool (separate from delegate-task)
- **D-16:** Runtime-truthful tests only — no mock-heavy tests that don't reflect real behavior
- **D-17:** No fixed timeouts — delegations run until completion confirmed by dual-signal

### Agent's Discretion
- Write-capable implementation approach (session-tree children vs git-tracked vs hybrid)
- SDK `parentID` semantics and how delegate-task relates to builtin `task` tool
- Safety limits (max runtime ceiling), zombie session handling, abort mechanisms
- Exact spawner module names, interfaces, and internal structure
- PTY integration API shape (how agents specify interactive needs)
- Test file organization and naming conventions
- Exact lifecycle resolution strategy (remove stub vs thin facade)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 Baseline (TRUSTED — Locked Decisions)
- `.planning/phases/14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-/14-CONTEXT.md` — WaiterModel, dual-signal, hybrid persistence, status tool decisions (LOCKED)
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — Phase 02 verified baseline decisions
- `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — 18/18 verified truths

### Current Codebase State
- `.planning/codebase/ARCHITECTURE.md` — Plugin layers, dependency graph, core module descriptions
- `.planning/codebase/STRUCTURE.md` — Directory layout, file sizes, LOC counts
- `.planning/codebase/CONCERNS.md` — Known issues: DelegationManager size, dual-lifecycle confusion, duplicate helpers, module singletons

### Source Repos to Research (External — use MCP tools)
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/` — BackgroundManager, spawner, concurrency, task-poller, result-handler (30 files, ~10k LOC)
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner/` — 6-file spawner architecture (session creator, concurrency key, parent dir, tmux callback)
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/tools/background-task/` — Tool interface for background delegation
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/hooks/background-notification/` — Completion notification hooks
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/shared/tmux/` — tmux utilities (NOTE: for future reference only, NOT implementing in Phase 16)
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/openclaw/` — OpenClaw edition (NOTE: deferred)
- `https://github.com/kdcokenny/opencode-background-agents` — Baseline plugin with 3-tool API, lifecycle, disk persistence, and the limitations we're overcoming
- `https://github.com/shekohex/opencode-pty` — PTY interactive background processes (MUST integrate)

### Key Existing Source Files
- `src/lib/delegation-manager.ts` — Current delegation orchestrator (450 LOC, needs decomposition)
- `src/tools/delegate-task.ts` — Current dispatch tool wrapper
- `src/tools/delegation-status.ts` — Current status polling tool
- `src/lib/completion-detector.ts` — Two-signal completion detection (reuse)
- `src/lib/lifecycle-manager.ts` — Stub lifecycle manager (must resolve)
- `src/lib/continuity.ts` — Durable JSON persistence (401 LOC)
- `src/lib/session-api.ts` — SDK wrappers (parentID semantics here)
- `src/plugin.ts` — Composition root (wires both lifecycle managers)

### User Research Preparation
- `docs/draft/prompt-2026-04-21.md` — User's research preparation document with repo links, architecture notes, and specific areas to investigate
- `docs/draft/hivemind-current-state.md` — Current harness state documentation
- `docs/draft/CURRENT-SITUATIONS-2026-04-10.md` — Current situations analysis

### Project Context
- `.planning/STATE.md` — Current project state, Phase 14 complete, Phase 15 complete
- `.planning/PROJECT.md` — Project vision and constraints
- `AGENTS.md` — Code style rules (500 LOC max, no `any`, `[Harness]` prefix, TypeScript strict)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/completion-detector.ts` (126 LOC) — Two-signal completion detection. Already proven in Phase 14. MUST reuse for delegation completion.
- `src/lib/concurrency.ts` (298 LOC) — Keyed semaphore with FIFO queue and SpawnReservation. Already supports concurrency limiting. Extend for per-model/provider keys.
- `src/lib/notification-handler.ts` (169 LOC) — Async completion notification to parent sessions. Already works. Extend for write-capable sessions.
- `src/lib/helpers.ts` (175 LOC) — Pure utilities. Add consolidated `extractAssistantText` here.
- `src/shared/tool-response.ts` (71 LOC) — Standard response envelope. Keep for tool output formatting.
- `src/lib/state.ts` (251 LOC) — In-memory task state management (TaskStateManager). Already tracks delegation states.

### Established Patterns
- CQRS: tools are write-side (dispatch, patch), hooks are read-side (observe, transform)
- Dual-layer state: durable JSON (`continuity.ts`) + in-memory Maps (`state.ts`)
- Leaf-first dependency graph: `types.ts` imports nothing
- `[Harness]` prefix on all thrown errors
- WaiterModel: dispatch → continue → wait on demand
- Deep-clone-on-read in continuity store

### Integration Points
- `src/plugin.ts` — Composition root where DelegationManager, HarnessLifecycleManager, hooks, and tools are wired together. Phase 16 MUST update this to resolve dual-lifecycle confusion.
- `src/hooks/create-core-hooks.ts` — Event routing (session.idle, session.deleted events feed into delegation completion)
- `src/hooks/create-session-hooks.ts` — Auto-loop, compaction hooks (has duplicate extractAssistantText)
- `src/hooks/create-tool-guard-hooks.ts` — Circuit breaker, budget enforcement (consumes delegation state)

### What's Wrong With Current Code (from CONCERNS.md)
1. DelegationManager at 450 LOC — dense, manages dispatch + completion + persistence + timers + text extraction
2. Dual lifecycle confusion — HarnessLifecycleManager (stub) and DelegationManager both instantiated in plugin.ts
3. Duplicate extractAssistantText — different implementations in delegation-manager.ts and create-session-hooks.ts
4. Module-level singletons in continuity.ts and state.ts — testing isolation issues (NOT fixing in Phase 16)

</code_context>

<specifics>
## Specific Ideas

- **oh-my-openagent spawner pattern** — 6-file dedicated spawner/ directory is proven at scale (30 files, ~10k LOC in background-agent feature alone). Adopt this pattern for the harness.
- **opencode-background-agents limitations are the requirements** — the 3 explicit limitations (read-only, 15-min timeout, no undo parity) become the success criteria for Phase 16. If all 3 are overcome, Phase 16 succeeds.
- **PTY as first-class interactive runtime** — PTY remains the default for command/process execution surfaces and is shared across delegation-adjacent tooling, while SDK-backed agent delegations stay truthful about their actual child-session execution path.
- **The user explicitly wants to "produce a superior delegate-task that rivals or surpasses OpenCode's built-in task tool"** — this is the quality bar.
- Phase 09/12/13 produced "trash code" — Phase 16 must NOT repeat that pattern. Clean, well-structured, well-tested code only.
- The user's prompt-2026-04-21.md contains detailed repo links, AGENTS.md excerpts from oh-my-openagent, and specific areas to investigate. The researcher MUST use this as primary input.

</specifics>

<deferred>
## Deferred Ideas

- **tmux/OpenClaw integration** — oh-my-openagent has full tmux support (tmux-utils, OpenClaw edition, tmux-subagent). This is explicitly out of scope for Phase 16 but should be researched for reference and noted for a future phase.
- **Continuity.ts module split** — Extract clone helpers, normalizers, and CRUD into separate files. Belongs in Phase 11 (clean architecture restructuring).
- **State.ts singleton cleanup** — Remove wrapper functions, fix testing isolation. Belongs in Phase 11.
- **Session-API double cast fix** — Replace unsafe type assertions with Zod validation. Belongs in Phase 11 or a targeted fix phase.

</deferred>

---

*Phase: 16-background-delegation-revamp-pty-integration-rebuild-backgro*
*Context gathered: 2026-04-21*
