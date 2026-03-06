# OpenCode Src Overlap Map

Date: 2026-03-07
Status: active-audit
Type: codebase-overlap-map

## Purpose

Map the responsibilities currently split between `src/**` and `.opencode/**` so the refactor can consolidate ownership without collapsing the delivery layer.

## Core Conclusion

- `src/**` is already the canonical engine for bootstrap, pathing, planning-root formation, state persistence, tool registration, and most governance logic.
- `.opencode/**` is currently a mixed surface:
  - some of it is correctly acting as a delivery/client-side pack
  - some of it duplicates runtime governance and per-turn control that already exists in `src/**`
- The architectural problem is not that `.opencode` exists.
- The architectural problem is that `.opencode/plugins/hiveops-governance/**` still behaves like a second runtime control plane.

## Source Of Evidence

- `src/index.ts`
- `src/cli/init.ts`
- `src/cli/sync-assets.ts`
- `src/hooks/index.ts`
- `src/lib/hivefiver-integration.ts`
- `src/lib/paths.ts`
- `src/lib/fs/planning-ops.ts`
- `src/lib/persistence.ts`
- `src/schemas/brain-state.ts`
- `src/schemas/planning.ts`
- `.opencode/plugins/hiveops-governance/index.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `AGENTS.md`
- `CONTAMINATION-GUARDRAILS.md`
- `docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`

## Layer Ownership Summary

### Canonically owned by `src/**`

- bootstrap and init orchestration
- `.hivemind` path structure and effective path resolution
- planning-root formation under `.hivemind/project/planning`
- runtime state persistence and migration
- schema contracts for runtime and planning
- canonical HiveMind tool registry
- canonical core hook registry
- HiveFiver asset audit and onboarding seeding
- asset sync policy for projecting root framework assets into `.opencode`

### Should remain in `.opencode/**`

- project-local delivery copies of commands, agents, skills, workflows, templates, prompts, and references
- thin plugin entrypoints that register OpenCode hooks
- message-shape and event-shape adaptation at the OpenCode boundary
- optional fallback-only behavior when canonical `src` runtime surfaces are unavailable

### Currently duplicated or contaminated

- per-turn context injection
- delegation and scope governance
- tool-execution health/audit logic
- event-driven session and handoff governance
- asset authority assumptions between root surfaces and `.opencode`

## Overlap Clusters

### Cluster 1: Asset Source vs Asset Mirror

`src/cli/sync-assets.ts` already treats root `commands/`, `skills/`, `agents/`, `workflows/`, `templates/`, `prompts/`, and `references/` as the authored sources and `.opencode/<group>` as the sync target.

Current implication:

- the root framework asset folders are the authored source
- `.opencode` is already a mirror or delivery pack in practice
- but `src/lib/hivefiver-integration.ts` still audits both root and `.opencode` as required parallel surfaces, which keeps ownership blurry

### Cluster 2: Runtime Composition Root vs Plugin Shadow Runtime

`src/index.ts` is already the core runtime composition root:

- SDK context init
- manifest regeneration
- file watching
- event wiring
- tool registration
- hook registration

But `.opencode/plugins/hiveops-governance/index.ts` also registers:

- `tool.execute.before`
- `tool.execute.after`
- `event`
- `experimental.session.compacting`
- `experimental.chat.messages.transform`

Current implication:

- two automatic control planes are active or expected to be active
- the repo remains fragile because runtime control is split between `src/**` and `.opencode/**`

### Cluster 3: Context Injection

`src/hooks/messages-transform.ts` and `src/hooks/session-lifecycle.ts` already own canonical per-turn context shaping in the core runtime.

`.opencode/plugins/hiveops-governance/hooks/context-injection.ts` also:

- reads `src/lib/state-snapshot.ts`
- builds a detailed system context from runtime state
- injects a system message into every turn

Current implication:

- `.opencode` is not merely adapting transport
- it is reassembling authoritative context from runtime state
- this is the main contamination fault line

### Cluster 4: Governance Enforcement

`src/hooks/tool-gate.ts` and `src/hooks/soft-governance.ts` form the core runtime governance path.

`.opencode/plugins/hiveops-governance/hooks/delegation.ts` also:

- blocks delegation by topology
- blocks file writes by scope/path
- blocks dangerous bash patterns
- tracks turn count
- triggers health and purge logic

Current implication:

- policy is not fully canonical in one place
- the runtime story differs depending on whether the reader starts from `src/**` or from `.opencode/**`

### Cluster 5: Event-Lifecycle Governance

`src/hooks/event-handler.ts` already participates in session bootstrap and runtime event handling.

`.opencode/plugins/hiveops-governance/hooks/events.ts` also:

- resets enforcement state at session start
- runs first-turn refresh
- runs handoff purification on session end
- syncs TODO events
- triggers schema validation on `.hivemind/state/*.json`

Current implication:

- session and handoff governance are partly owned by a plugin-side shadow path
- this increases restart ambiguity and makes lifecycle reasoning harder

### Cluster 6: Planning Truth vs Runtime Truth

`src/schemas/planning.ts` and `.hivemind/project/planning/**` define readable planning continuity.

`src/schemas/brain-state.ts`, `src/lib/persistence.ts`, and `src/lib/paths.ts` define runtime truth.

Current implication:

- this split is intentional and should be preserved
- the refactor must not try to “simplify” by mixing planning markdown into runtime JSON authority

## Codebase Inventory Signals

The repo inventory confirms the mirror pattern:

- `commands -> .opencode/commands`: overlap `35/35`
- `agents -> .opencode/agents`: overlap `10/10`
- `workflows -> .opencode/workflows`: overlap `20/21`
- `references -> .opencode/references`: overlap `5/5`
- `templates -> .opencode/templates`: overlap `9/9`

The inventory also confirms `.opencode` contains extra client-side or legacy-compat content beyond the root mirror, especially under:

- `.opencode/plugins/**`
- `.opencode/skills/**`
- `.opencode/templates/**`
- `.opencode/prompts/**`

## Strategic Fault Lines

### Fault Line A: Runtime Duality

The system still has a canonical `src` runtime and a shadow `.opencode` runtime.

### Fault Line B: Lineage Drift

`AGENTS.md` now allows `hivefiver` to operate across the whole surgical refactor surface, while older lineage docs and `agents/hivefiver.md` still describe stricter framework-only boundaries.

### Fault Line C: Planning Root Drift

The planning root is `.hivemind/project/planning`, but older descriptive surfaces still talk as if `.planning/` were canonical.

### Fault Line D: Guardrail Drift

Some older agent/docs still instruct startup inspection of state surfaces that current contamination guardrails treat as unsafe for routing.

## Non-Negotiables For Refactor Phase 1

- Keep `src/**` as the canonical owner of runtime logic.
- Keep `.opencode/**` as delivery, adapter, and fallback-only territory.
- Preserve JSON runtime state and markdown planning SOT.
- Preserve `.hivemind/project/planning` as canonical readable planning root.
- Preserve the March 6 authority split.
- Do not introduce a fourth state store.
- Do not merge `hivefiver` and `hiveminder` lineage authority casually.
- Do not perform a big-bang merge of the hot hook layer in the first cycle.

## Recommended Ownership Target

### `src/**` becomes sole canonical owner of:

- bootstrap and init
- runtime state formation
- schema and path contracts
- planning-root formation
- context assembly logic
- governance and delegation policy logic
- lifecycle governance and handoff policy
- asset sync policy and asset validation

### `.opencode/**` becomes owner only of:

- project-local mirrored assets for OpenCode consumption
- thin hook/event/tool adapters
- transport-level shaping of OpenCode payloads
- fallback-only wrappers when `src` canonical runtime is unavailable

## Recommended Safe First Slice

Phase 1 should start with the asset-authority and projection boundary:

- make root framework asset folders the explicit authored source
- make `.opencode/{commands,skills,agents,workflows,templates,prompts,references}` explicit derived mirrors
- remove dual-authority language from asset audits and planning docs
- leave the hottest per-turn runtime hooks for a later bounded cycle after ownership is explicit

This is safer than touching the injection/runtime overlap first, because the asset layer already behaves as source-to-mirror in code and can be normalized without reopening the highest-risk runtime surfaces immediately.
