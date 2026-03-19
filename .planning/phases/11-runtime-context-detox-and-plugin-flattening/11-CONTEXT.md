# Phase 11: Runtime Context Detox and Plugin Flattening - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** User-supplied `ARCHITECTURE-REFACTORED.md`

<domain>
## Phase Boundary

Perform the surgical refactor described in `ARCHITECTURE-REFACTORED.md` to remove poisoned multi-injection runtime context, collapse per-turn state loading to one cached snapshot, gut dead plugin orchestration that is not consumed at runtime, and flatten the plugin/domain structure without breaking the authoritative SDK tools and feature-owned behavior that must remain.
</domain>

<decisions>
## Implementation Decisions

### Runtime Context Emission
- Delete the `chat.message` context injection path as a runtime context emitter.
- Delete `experimental.chat.system.transform` as a duplicate context emitter.
- Keep a single authoritative runtime context injection path plus `experimental.session.compacting` for compaction survival.
- Cache `loadRuntimeBindingsSnapshot(directory)` once per turn instead of reloading runtime state multiple times.
- Replace the competing XML packets with one unified `<hivemind context_version="v1">` block that carries the authoritative runtime fields: `session_id`, `lineage`, `trajectory`, `workflow`, `task_ids`, `entry_state`, `purpose`, `risk`, `route_command`, `governance_mode`, and `language`.

### Plugin Orchestration Simplification
- Remove `createPluginRuntimePlan()` orchestration and replace it with direct calls to the actually consumed runtime entry pieces.
- Treat unused outputs, surface registries, context-injection plans, and runtime bridge scaffolding as dead weight unless implementation proves a live consumer.
- Favor direct plugin-owned render/injection helpers over wrapper chains that only forward arguments.

### Removal Targets
- Delete `src/plugin/runtime-plan.ts`.
- Delete `src/plugin/surface-registry.ts`.
- Delete `src/plugin/create-core-hooks.ts`.
- Delete `src/plugin/plugin-types.ts` unless a minimal `PluginRuntimeInput` survivor is still required by live code.
- Delete `src/shared/turn-output.ts`, `src/shared/runtime-invocation.ts`, and `src/shared/lifecycle-spine.ts` if repo evidence confirms they are only consumed by dead paths.
- Delete `src/hooks/runtime-bridge/`, `src/hooks/context-injection/`, and `src/hooks/prompt-transformation/` if no live consumer remains after the simplification.
- Delete the `src/hooks/start-work/*` re-export shims called out in the architecture doc and import directly from `src/features/session-entry/*`.

### Boundaries to Preserve
- Keep the six SDK tools as stable authority surfaces: `hivemind_doc`, `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`, and `hivemind_handoff`.
- Keep `src/core/` state-management domains that remain authoritative.
- Keep `src/features/session-entry/` and `src/features/runtime-entry/` as the real behavior owners unless the refactor only thins adapters around them.
- Keep `src/commands/slash-command/`, `src/control-plane/`, `skills/`, and the throttled governance toast behavior unless a change is necessary to preserve the new simplified runtime path.
- Treat `src/intelligence/` and `src/plugin-handlers/` as evaluation targets, not automatic deletions.

### Verification Discipline
- Do not preserve false-positive, placeholder, or content-presence-only baselines just to keep tests green.
- Any claim that a hook, file, or directory is unused must be proven by current repo evidence before deletion.
- The phase must reduce false runtime emissions and wrong baselines, not merely rename layers around them.
</decisions>

<canonical_refs>
## Canonical References

**Downstream MUST read these before planning or implementing.**

### Phase Authority
- `ARCHITECTURE-REFACTORED.md` — source diagnosis, target architecture, deletion candidates, and expected plugin shape.
- `.planning/ROADMAP.md` — current roadmap authority for Phase 11.
- `.planning/REQUIREMENTS.md` — milestone constraints and adjacent runtime goals that this corrective phase must not violate.

### Project Governance
- `AGENTS.md` — repo governance, architecture authority, SDK-first rules, and anti-pattern bans.
- `/Users/apple/.claude/CLAUDE.md` — session-level planning, research, and MCP discipline.
</canonical_refs>

<specifics>
## Specific Ideas

- The intended plugin target is a much smaller `opencode-plugin.ts` centered on `getSnapshot()`, unified context rendering, route hints, and existing official hooks that still matter.
- The refactor should verify whether `event-handler`, `sdk-context`, and `soft-governance` belong directly under `src/plugin/` after hook-layer flattening.
- The phase should explicitly audit for duplicate packet rendering, dead wrapper chains, and dead types before code deletion.
- Planning should include evidence-producing tasks for proving deletions are safe and for replacing false baseline tests with behavior checks tied to the real runtime path.
</specifics>

<deferred>
## Deferred Ideas

- Richer TUI/operator UX work — remains out of scope for this phase.
- New feature expansion, policy packs, or skill-pack work — out of scope.
- Any speculative restoration work not directly required to detox runtime context emission or flatten the plugin path — deferred.
</deferred>

---

*Phase: 11-runtime-context-detox-and-plugin-flattening*
*Context gathered: 2026-03-19*
