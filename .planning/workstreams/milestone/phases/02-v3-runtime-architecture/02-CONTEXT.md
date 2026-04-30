# Phase 02: V3 Runtime Architecture - Context

**Gathered:** 2026-04-08
**Status:** Ready for re-research and replanning

<domain>
## Phase Boundary

Phase 02 remains the runtime architecture phase for the harness. Its job is to deliver the runtime core and the config-ready seams that later user-facing setup flows will rely on.

This phase does **not** become the guided setup phase itself. It should produce the runtime behavior, state model, durability model, and config/validation touchpoints needed so that a later phase can build the guided in-chat setup and generated config UX on top of it.

This phase must now be treated as a **hybrid recovery phase**: original Phase 02 plans are no longer the executable plan of record because implementation already diverged, but the still-valid Phase 02 decisions remain important and must guide new recovery plans.

</domain>

<decisions>
## Implementation Decisions

### Phase 02 planning posture
- **D-01:** Phase 02 is re-baselined as a **hybrid recovery phase**. The original eight Phase 02 plans are reference material, not executable truth.
- **D-02:** Downstream agents must research and plan from **current code reality plus still-valid Phase 02 decisions**, not from the old plan files alone.
- **D-03:** Validation against the original Phase 02 plan artifacts is premature. The correct order is: update context -> research -> create recovery plans -> execute -> then validate.

### Runtime versus product boundary
- **D-04:** Phase 02 stays scoped to **runtime core architecture**, not the full user-facing setup experience.
- **D-05:** Phase 02 must include **config-ready seams** for later guided setup: runtime config schema targets, sane defaults, validation hooks, and activation wiring points.
- **D-06:** Guided in-chat setup, config generation UX, and explanation-first onboarding belong to a later product-facing phase, not this one.

### Durability and execution record model
- **D-07:** The continuity/state store remains the **canonical runtime source of truth** for delegation and recovery.
- **D-08:** Rich delegation packet and manifest style artifacts should still exist, but as **exports derived from canonical continuity state**, not as the only source of truth.
- **D-09:** Packet/manifest exports are **optional and policy-controlled**, intended for auditability, debugging, and future user-facing history rather than mandatory on every runtime path.

### Existing runtime policy decisions that remain locked
- **D-10:** Phase 02 should use a **soft policy runtime**: governance should prefer warning/escalation behavior over hard blocking in most cases.
- **D-11:** Session recovery should restore task continuity and relevant runtime state, but policy enforcement stays lighter-weight than a strict hard-stop governance system.
- **D-12:** Specialist routing should be advisory/configurable, with broad fallback to a generalist when no strong specialist match exists.
- **D-13:** Circuit-breaker and tool-budget thresholds must be configurable per session/runtime context rather than fixed global constants only.
- **D-14:** Default limits can remain close to current code behavior, but overrides must be possible without source edits.
- **D-15:** Budget/reset behavior should continue to reset on compact/restart, with warning state preserved in continuity records when useful for recovery and observability.
- **D-16:** Session recovery should include staleness check and user-visible risk framing, even if the exact UX is implemented later.

### the agent's Discretion
- Exact internal TypeScript shapes for continuity-backed runtime records, as long as canonical continuity remains primary and optional exports remain derivable.
- Exact runtime config section names and field nesting, as long as Phase 02 clearly exposes schema targets, sane defaults, validation hooks, and activation seams.
- Exact implementation mechanics for exportable packet/manifest generation, as long as they are policy-controlled and do not replace canonical continuity.
- Exact internal structure for recovery plans, as long as they treat old Phase 02 plans as reference-only and preserve the locked decisions above.

</decisions>

<specifics>
## Specific Ideas

- The repo should stop pretending the old eight Phase 02 plans are still executable as written.
- The repo should also stop pretending the current partially implemented V3 runtime is automatically correct just because code exists.
- The right posture is: **recover Phase 02 from current code reality** while preserving still-valid runtime decisions.
- The later product direction is a **guided in-chat setup** that writes a full config file, but Phase 02 only needs to make that possible, not implement it fully.
- The runtime should be durable by default through continuity, while packet/manifest-style records exist as optional audit/debug outputs and as a future bridge to user-facing history.
- Config-readiness in Phase 02 means: schema targets, defaults, validation hooks, and activation seams are present and intentional.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and status
- `.planning/ROADMAP.md` — official Phase 02 roadmap boundary and old sub-phase ordering that is now reference-only
- `.planning/REQUIREMENTS.md` — RUN-3a through RUN-3h acceptance criteria that still define the runtime capability space
- `.planning/STATE.md` — project state is stale relative to current V3 work; read it as historical context, not current execution truth

### Current runtime baseline and gap analysis
- `docs/superpowers/specs/2026-04-08-v3-implementation-spec.md` — current implemented V3 runtime baseline and what was actually built
- `.planning/reports/2026-04-08-architecture-audit.md` — audited flaws, architecture risks, and domain-organization concerns in the current runtime
- `.planning/phases/02-v3-runtime-architecture/PLAN-VERIFICATION.md` — why the original eight Phase 02 plans were not sound as originally written

### Product-facing follow-on direction
- `docs/superpowers/specs/2026-04-08-user-facing-runtime-config-design.md` — later product direction that Phase 02 must prepare for without absorbing the whole setup UX
- `docs/superpowers/specs/2026-04-08-runtime-config-schema-draft.md` — concrete config target that informs what Phase 02 config-ready seams need to support

### Project governance and constraints
- `AGENTS.md` — plugin/runtime architecture rules, module-size targets, testing gates, and harness terminology

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/plugin.ts` — thin composition root already exists; preserve assembly-only direction
- `src/lib/continuity.ts` — canonical durable continuity model already exists and should remain primary
- `src/lib/lifecycle-manager.ts` — central runtime coordinator and hydration point for continuity-backed state
- `src/lib/categories.ts` — current routing/category defaults are a strong base for future config-driven behavior
- `src/lib/compaction-checkpoint.ts` — recovery/checkpoint seam already exists and should remain part of the runtime core
- `src/lib/background-manager.ts` and `src/tools/background/index.ts` — current background runtime exists, but needs safety hardening before public-facing control surfaces depend on it
- `src/hooks/create-tool-guard-hooks.ts` — current budget/circuit-breaker implementation exists, but is still hardcoded and needs config-ready seams
- `src/hooks/create-session-hooks.ts` — current auto-loop and compaction runtime behavior exists, but includes hook-side side effects that planners should treat as active debt

### Established Patterns
- Keep the plugin thin and push durable/runtime logic into library and tool modules
- Preserve the tools-write / hooks-read split as the intended architecture, even where the current implementation violates it
- Treat continuity plus in-memory state as the dual-layer runtime model
- Extend the existing schema-kernel pattern rather than inventing a second validation approach for runtime config

### Integration Points
- `src/plugin.ts` is the activation seam where validated runtime config will eventually be consumed
- `src/schema-kernel/` is the right place for runtime config contracts and validation entry points
- `tests/hooks/` and `tests/tools/` already provide natural places for config-driven runtime behavior tests
- `src/lib/continuity.ts` and `src/lib/lifecycle-manager.ts` are the main durability and recovery seams for optional packet/manifest export generation

</code_context>

<deferred>
## Deferred Ideas

- Full guided in-chat setup UX and config-writing flow — later product-facing phase
- Product-level profiles such as `safe`, `balanced`, and `autonomous` as user-facing setup presets — later phase, though Phase 02 should leave the schema and default seams ready
- Rich packet/manifest browsing UX for users — later phase
- Any attempt to validate Phase 02 as if the old eight plan artifacts were faithfully executed — deferred until new recovery plans exist and are executed

</deferred>

---

*Phase: 02-v3-runtime-architecture*
*Context gathered: 2026-04-08*
