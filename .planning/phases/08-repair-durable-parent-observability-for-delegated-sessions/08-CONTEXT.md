# Phase 08: repair-durable-parent-observability-for-delegated-sessions - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 08 is a corrective closure phase for the Phase 02 runtime corridor. It exists to restore trustworthy parent-visible truth for delegated sessions, close any inseparable continuity/delegation metadata seam required to make that truth durable, and then unblock authoritative Phase 02 re-verification.

This phase does **not** redesign all delegation behavior, build the broader live-steering platform, or absorb later runtime-domain restructuring work.

</domain>

<decisions>
## Implementation Decisions

### Repair route
- **D-01:** Phase 08 should **bundle both corrective seams together**: the durable parent observability repair and the linked `runtimePolicyOverride` producer/persistence seam.
- **D-02:** The team should treat an observability-only fix as **false closure** if the metadata seam remains hollow.

### Parent-visible truth model
- **D-03:** Parent-visible delegated-session truth should be anchored in **continuity-backed lifecycle truth**, with lifecycle reconciliation deriving the authoritative view across async boundaries.
- **D-04:** Event streams and observer notifications should be treated as **inputs to reconciliation**, not an independent second source of truth.

### Verification posture
- **D-05:** Phase 08 verification should stay inside the **corrective corridor only**: parent-visible `started/completed/failed` durability, async lifecycle reconciliation, and `runtimePolicyOverride` write -> persist -> reload -> enforcement.
- **D-06:** After those checks pass, the workflow must **re-run Phase 02 verification** rather than declaring closure from Phase 08 tests alone.

### Roadmap and ownership correction
- **D-07:** Phase 08 must be treated as a **corrective closure phase that sits between Phase 02 implementation and Phase 02 re-verification**, not as a normal downstream phase after Phase 07.
- **D-08:** Planning artifacts should make the dependency correction explicit now so downstream planning does not keep the old incorrect sequencing.

### the agent's Discretion
- Exact naming of the corrective sub-lanes inside Phase 08, as long as they preserve the bundled closure strategy above.
- Exact verification command split between bounded tests and full re-verification, as long as the corrective corridor and Phase 02 re-verification gate are both explicit.
- Exact doc wording for roadmap/state reconciliation, as long as ownership and dependency direction stay unambiguous.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 8 scope and ownership
- `.planning/phases/08-repair-durable-parent-observability-for-delegated-sessions/planning/phase-8-scope-lock-2026-04-10.md` — authoritative Phase 8 scope lock, corrective-lane boundary, risk framing, and route options.
- `.planning/ROADMAP.md` — current roadmap entry, including the dependency contradiction that Phase 8 planning must explicitly correct.

### Phase 2 closure baseline
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — locked Phase 02 runtime decisions that Phase 8 must preserve, especially continuity-first state and policy override expectations.
- `.planning/phases/02-v3-runtime-architecture/02-VERIFICATION.md` — authoritative evidence for the remaining `runtimePolicyOverride` gap and the exact closure requirements still blocking Phase 02.
- `.planning/phases/02-v3-runtime-architecture/PLAN-VERIFICATION.md` — historical plan-audit context showing why corrective closure must stay bounded and evidence-driven.

### Project state and requirements
- `.planning/PROJECT.md` — current project framing, closure rule, and documentation-only reconciliation constraints already established around the open Phase 02 gap.
- `.planning/REQUIREMENTS.md` — authoritative `RUN-3h` acceptance criteria and the broader runtime requirements Phase 8 must not accidentally redesign.
- `.planning/STATE.md` — current blocked-state record, TODO trail, and known issue summary tying Phase 02 closure to the missing end-to-end override seam.

### Delegation and live steering architecture
- `docs/papers/live-steering-protocols.md` — continuity-backed steering/control-spine principles, phase-aware steering rules, and parent/child observability guidance that justify bounded corrective closure.
- `docs/draft/architecture-proposal-hivemind-v3.md` — harness architecture framing for lifecycle, continuity, delegation, and runtime control-plane responsibilities.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/continuity.ts`: canonical persistence layer where delegated-session truth and durability already converge.
- `src/lib/continuity-normalizers.ts`: current reload seam that drops `runtimePolicyOverride` and therefore sits directly in the corrective corridor.
- `src/lib/lifecycle-state.ts`: live delegation metadata builder and current hollow producer seam for `runtimePolicyOverride`.
- `src/lib/lifecycle-manager.ts`: central lifecycle reconciliation point for async delegated-session outcomes.
- `src/lib/lifecycle-background-observer.ts`: parent-observability surface already dedicated to background lifecycle observation.
- `src/hooks/create-tool-guard-hooks.ts`: current consumer of `delegation.runtimePolicyOverride`; proves the session-override path already exists conceptually but not end-to-end.

### Established Patterns
- Continuity is the canonical source of truth; exports and parent-facing artifacts derive from it.
- The plugin/composition root stays thin while runtime decisions live in `src/lib/*` and hook/tool modules.
- Hooks consume runtime state and enforce policy; they should not invent an alternate truth model outside continuity/lifecycle reconciliation.
- Async/background execution is already classified and routed through explicit runtime surfaces rather than ad hoc process handling.

### Integration Points
- `src/lib/lifecycle-state.ts` -> `src/lib/continuity.ts` / `src/lib/continuity-normalizers.ts`: producer/persist/reload seam for delegated-session runtime metadata.
- `src/lib/lifecycle-background-observer.ts` -> `src/lib/lifecycle-manager.ts`: parent-visible async outcome reconciliation path.
- `src/hooks/create-tool-guard-hooks.ts`: end consumer that proves whether persisted session override data survives into real enforcement.
- `tests/lib/lifecycle-background-observer.test.ts`, `tests/lib/continuity.test.ts`, `tests/lib/lifecycle-state.test.ts`, and `tests/hooks/create-tool-guard-hooks.test.ts`: natural corrective-corridor test surfaces.

</code_context>

<specifics>
## Specific Ideas

- The approved route is the **bundled corrective closure** route, not an observability-only or policy-only split.
- Parent truth should remain **continuity-backed** even when observer events and async child outcomes arrive out of order.
- Phase 8 should prove the exact defect corridor, then hand off to **Phase 02 re-verification** rather than expanding into generalized delegation redesign.
- The roadmap dependency correction should be made explicit during planning so later phases stop treating Phase 8 as gated on Phase 7.

</specifics>

<deferred>
## Deferred Ideas

- Broad redesign of all delegation behavior — outside Phase 8 corrective scope.
- General live-steering platform expansion beyond the inherited defect corridor — belongs to later architecture/product work.
- Runtime-domain restructuring and other behavior-neutral path moves — belongs to Phase 07 and later phases after Phase 02 is fully re-verified.
- Broader delegation hardening beyond the corrective corridor — future phase or backlog item once Phase 02 closure is complete.

</deferred>

---

*Phase: 08-repair-durable-parent-observability-for-delegated-sessions*
*Context gathered: 2026-04-10*
