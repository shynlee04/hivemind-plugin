# Phase 1: Runtime Authority Baseline - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish one authoritative local OpenCode runtime per project so HiveMind can start or attach without split-brain ownership. Phase 1 covers local runtime ownership, attach/reuse behavior, operator-facing authority/status messaging, and the minimum evidence bar for claiming the baseline works. It does not expand into broad deterministic workflow concurrency, replay, or the full live-proof suite.

</domain>

<decisions>
## Implementation Decisions

### Local runtime ownership posture
- Runtime is local-first on the user's machine: the relevant server/client SDK and API surfaces are local interfaces, not a second remote authority.
- Phase 1 assumes one project, one branch, one space, and no worktree or cross-branch runtime ambiguity.
- HiveMind should treat the project as having one local background OpenCode runtime per project.
- HiveMind is the primary operator-facing interface to that runtime.
- If that local runtime already exists for the same project, HiveMind should reuse or reconnect to it by default rather than create a second runtime.
- `hm-init` must ensure or reconnect to the single local runtime by default; replacing it is allowed only through an explicit reset/replacement flow.
- The same local runtime authority context for Phase 1 is project-scoped and reachable; Phase 1 does not require worktree or multibranch identity matching.

### Operator status and trust messaging
- `hivemind_runtime_status` is the primary operator-facing authority surface for runtime state.
- Local saved files and attachment snapshots are supporting evidence only; they should not be presented as a parallel authority to operators.
- Human-facing default status should be compact and actionable: authority state, reachability, current mode, and next action.
- Richer technical detail can exist for orchestrator agents or handoff/in-session routing, but that is secondary to the human operator view.
- When the local runtime is unavailable or unreachable, HiveMind should retry reconnect up to 3 times, then show an error telling the user to restart or run `hm-doctor`.

### Phase 1 evidence bar
- Phase 1 requires local integration gates plus `npx tsc --noEmit` before completion can be claimed.
- Evidence must always be labeled by lane: local tests, local diagnostics, narrow live sanity, and later full live proof are distinct.
- Phase 1 also requires a real live OpenCode sanity check in addition to local automated gates.
- That live check is intentionally narrow: it must prove single-runtime local behavior for init/attach/reuse semantics, not the broader formal proof scope reserved for Phase 7.
- If local automated gates pass but the live sanity check fails, Phase 1 is not complete.
- Downstream docs must describe the Phase 1 live check as a narrow required sanity check, not as the full formal live-proof lane.

### Execution and concurrency baseline
- Deterministic execution in this project should not be interpreted as broad concurrent runtime activity.
- Parallel delegation is acceptable only when delegated outputs are independent of each other.
- Write, edit, and delete operations must not run concurrently and must not operate aggressively across spaces.

### Claude's Discretion
- Exact naming and UX wording for the explicit runtime reset/replacement flow.
- Exact shape of the compact human-facing status payload, as long as it preserves the authority and recovery decisions above.
- Exact mechanism used to determine runtime reachability before falling back to reconnect or `hm-doctor` guidance.
- Exact agent-handoff detail level beyond the required human-facing compact view.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Governance and roadmap authority
- `.planning/PROJECT.md` — project scope, brownfield constraints, and the requirement to converge on one official OpenCode runtime truth.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements (`CTRL-01`, `CTRL-02`) and out-of-scope boundaries.
- `.planning/ROADMAP.md` — fixed Phase 1 boundary, success criteria, and relation to later phases.
- `.planning/STATE.md` — current project focus and existing blockers for later phases.
- `.planning/config.json` — workflow defaults, including parallelization enabled at the planning layer.

### Research reset and phase framing
- `.planning/research/SUMMARY.md` — overall research synthesis; especially Phase 1 as authority alignment before broader determinism work.
- `.planning/research/ARCHITECTURE.md` — dual-plane architecture, single-runtime authority guidance, and read-vs-write boundary rules.
- `.planning/research/FEATURES.md` — feature framing that rejects a shadow runtime and keeps the product as a thin control layer over OpenCode.
- `.planning/research/PITFALLS.md` — critical warnings against split-brain runtime truth, proof inflation, and fragmented authority.
- `.planning/research/STACK.md` — local Node/TypeScript/OpenCode SDK+plugin stack and explicit `createOpencode()` / `createOpencodeClient()` runtime rules.

### Stable architecture and verification policy
- `docs/architecture/stress-cert-sdk-control-architecture.md` — stable architecture source of truth for supervisor/control/tool boundaries.
- `docs/adr/003-live-sdk-verification-authority-2026-03-17.md` — verification policy separating local evidence from live official-boundary proof.

### Existing code seams to plan against
- `src/shared/runtime-attachment.ts` — current local attachment snapshot and persisted runtime binding seam.
- `src/control-plane/control-plane-handler.ts` — current `hm-init` / `hm-doctor` runtime control entry logic.
- `src/hooks/sdk-context.ts` — current live plugin SDK context cache, including `serverUrl`.
- `src/sdk-supervisor/runtime-status.ts` — current additive runtime status projection seam.
- `src/tools/runtime/tools.ts` — current `hivemind_runtime_status` and `hivemind_runtime_command` surfaces.
- `src/plugin/runtime-plan.ts` — current route reminder and runtime planning projection.
- `src/control-plane/AGENTS.md` — control-plane boundary and warnings against growing a second supervisor.
- `src/plugin/AGENTS.md` — plugin assembly-only boundary and proof requirements.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/shared/runtime-attachment.ts` — existing persisted runtime attachment/settings seam that can be extended to represent the single local runtime authority.
- `src/control-plane/control-plane-handler.ts` — existing command entry logic for `hm-init`, `hm-doctor`, and related runtime lifecycle actions.
- `src/hooks/sdk-context.ts` — existing access to live plugin context (`client`, `$`, `serverUrl`) for reuse/attach awareness.
- `src/sdk-supervisor/runtime-status.ts` — additive runtime status builder that can become the single synthesized truth surface.
- `src/tools/runtime/tools.ts` — existing public runtime tool surfaces, especially `hivemind_runtime_status` as the main operator-facing inspection seam.
- `src/plugin/runtime-plan.ts` — existing route reminder and plugin runtime planning logic that will need to reflect the single-runtime posture.

### Established Patterns
- Control plane and CLI own external runtime orchestration through `@opencode-ai/sdk`; plugin/hooks/tools stay on `@opencode-ai/plugin`.
- Hooks are read/inject/intercept only; durable mutation does not belong in hooks.
- Tools are the write gateway and the right place to expose authoritative runtime inspection or command behavior.
- Supervisor/status reporting is additive and should aggregate one runtime story rather than let multiple layers infer their own truth from raw files.
- Human-facing runtime status should come from a synthesized surface, not direct filesystem archaeology.

### Integration Points
- `hm-init` / `hm-doctor` flows in `src/control-plane/control-plane-handler.ts` must align with the single-runtime local ownership rule.
- `hivemind_runtime_status` in `src/tools/runtime/tools.ts` is the primary place to surface the compact operator-facing verdict.
- `src/hooks/sdk-context.ts` and `src/plugin/runtime-plan.ts` are the key attach/reuse integration points for a running local runtime.
- `src/shared/runtime-attachment.ts` and `src/sdk-supervisor/runtime-status.ts` are the likely contract bridge between persisted local state and the synthesized authority view.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly reframed runtime as local-first: the OpenCode server/client SDK and API are both on the user's local machine.
- The user explicitly wants SDK/API use mainly as cleaner local interfaces for session and operator control, including local session CRUD/control surfaces such as create, list, get, update, delete, prompt, fork, abort, summarize, command, and shell.
- The user explicitly rejected Phase 1 ambiguity around worktrees, multibranch identity, and cross-space runtime ownership.
- The user explicitly wants live sanity checking to remain easy and real during development, while still keeping the broad formal live-proof program separate.

</specifics>

<deferred>
## Deferred Ideas

- Broader deterministic execution concurrency, receipt semantics, and parallel orchestration beyond the narrow independence rule belong to later roadmap phases.
- Full formal live official-boundary proof remains a broader later-phase concern even though Phase 1 includes a narrow required live sanity check.

</deferred>

---

*Phase: 01-runtime-authority-baseline*
*Context gathered: 2026-03-18*
