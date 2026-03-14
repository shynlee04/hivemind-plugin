# Src Canonical Phase 1 Refactor Master Plan

Date: 2026-03-07
Status: active-workstream
Type: subordinate-master-plan

## Goal

Run the subordinate runtime-owner workstream inside the ecosystem control master so `src/**` becomes the canonical runtime and governance owner while `.opencode/**` is reduced to delivery and adapter roles.

## Position In The Ecosystem

This document is no longer the top-level master plan.

It now serves as the detailed runtime-owner workstream plan beneath:

- `docs/plans/ecosystem-control-master-plan-2026-03-07.md`
- `docs/plans/ecosystem-workstream-control-matrix-2026-03-07.md`

## Decision Frame

Three strategic options exist:

1. Big-bang consolidation
2. Dual-runtime coexistence with better documentation
3. Staged source-canonical consolidation

## Options

### Option 1: Big-bang consolidation

Merge the `.opencode/plugins/hiveops-governance/**` runtime path into `src/**` immediately and deprecate the shadow runtime in one tranche.

Why not now:

- it touches the hottest per-turn surfaces first
- it combines ownership clarification and runtime mutation in one move
- it raises regression risk in context injection, delegation, and event handling at the same time

### Option 2: Dual-runtime coexistence with better documentation

Keep both `src/**` and `.opencode/**` runtime lanes, but clarify which is preferred and patch the docs.

Why not now:

- it preserves the core contamination source
- it keeps policy authority split across two execution lanes
- it helps understanding but does not materially simplify the architecture

### Option 3: Staged source-canonical consolidation

Make `src/**` the explicit canonical owner in layers, starting with the safest ownership boundary and deferring the hottest runtime hook collapse until after the architecture is cleaner.

Recommended:

- this matches what the code already implies
- it removes ambiguity in the order of least risk
- it keeps each cycle reviewable and reversible

## Why Option 3 Is Best

The code already says `src` is the real engine. `src/index.ts` is the runtime composition root, `src/cli/init.ts` forms `.hivemind`, `src/lib/paths.ts` defines the persistent structure, `src/lib/persistence.ts` owns runtime state, and `src/cli/sync-assets.ts` already treats root framework folders as authored sources. That means the architecture does not need a theoretical rewrite first. It needs its actual ownership model made explicit and then enforced in stages.

The other two options both keep the repo fragile for different reasons. Big-bang consolidation reaches into the hottest per-turn hook surfaces before ownership boundaries are stabilized, so a failure there would be hard to isolate. Documentation-only coexistence is safer in the moment, but it leaves the duplicated control plane intact and guarantees more drift later. The staged path is the only one that aligns with the existing code, the current planning-root strategy, and the contamination guardrails at the same time.

## Phase 1 Outcome

At the end of Phase 1:

- `src/**` is the explicit canonical owner for runtime and governance logic
- `.opencode/**` is explicitly treated as a delivery, adapter, and fallback-only layer
- asset authority is no longer dual-tracked
- the planning root and strategy docs reflect one coherent ownership story
- the hot runtime hook collapse is prepared from a cleaner base, not forced prematurely

## Scope

### In Scope

- source-vs-mirror ownership for framework assets
- canonical ownership language in planning and governance docs
- `src`-owned asset audit and sync contracts
- narrowing `.opencode` governance plugin to adapter/fallback intent at the planning level
- mapping later runtime consolidation cycles without implementing them yet

### Out Of Scope

- big-bang merge of `.opencode/plugins/hiveops-governance/**` into `src/**`
- rewriting `messages-transform.ts`, `session-lifecycle.ts`, or plugin hook logic in this planning cycle
- changing runtime state authority design
- merging lineages
- changing external product-facing behavior in the same tranche

## Phase 1 Cycle Structure

### Cycle 1: Ownership Normalization

Objective:

- declare root framework asset folders as authored source
- declare `.opencode` asset folders as derived mirrors
- align planning-root and governance docs to that model

Outputs:

- ownership matrix
- normalized planning-root references
- updated asset-authority language
- explicit fallback-only target for `.opencode` plugin governance layer

Authorization:

- required before moving to Cycle 2

### Cycle 2: Asset Projection Hardening

Objective:

- tighten the sync/audit/init path so `src/**` is the only authoritative source for asset projection into `.opencode`

Outputs:

- bounded refactor plan for `src/cli/sync-assets.ts`, `src/cli/init.ts`, and `src/lib/hivefiver-integration.ts`
- verification gates for projection parity and authored-source integrity

Authorization:

- required before any code edits

### Cycle 3: Runtime Adapter Separation

Objective:

- define the split between canonical governance logic in `src/**` and thin transport adapters in `.opencode/plugins/**`

Outputs:

- runtime ownership map
- migration boundary for context injection, delegation, and events
- risk ledger for hot hook migration

Authorization:

- required before any hook-level code consolidation

### Cycle 4: Hot Hook Consolidation Planning

Objective:

- prepare the later bounded refactor of duplicated per-turn logic

Outputs:

- dedicated runtime tranche plan for context injection overlap
- dedicated runtime tranche plan for delegation/governance overlap
- dedicated runtime tranche plan for lifecycle/event overlap

Authorization:

- required before implementation

### Cycle 4 Progress Update

Current status:

- Slice 1 completed: shared plugin fallback turn resolution moved into `src/lib/injection-orchestrator.ts`
- Context Pack 2 completed: semantic fallback context assembly moved into `src/lib/plugin-fallback-context.ts`
- plugin context hook is thinner and now delegates both turn resolution and context-block assembly to `src/**`
- direct fallback harness completed: the real plugin hook now has direct child-session and core-hook-presence coverage in `tests/child-session-injection-policy.test.ts`

Next focus:

- use the post-harness consolidation packet and truth-compilation register before allowing any further context extraction

Execution order:

1. execution constitution freeze
2. direct fallback harness planning
3. direct fallback harness implementation
4. post-harness review
5. consolidation and truth compilation
6. only then decide whether one further bounded context extraction is justified

## Phase 1 Workstreams

### Workstream A: Asset Authority

Focus:

- root `commands/`, `skills/`, `agents/`, `workflows/`, `templates/`, `prompts/`, `references/`
- `.opencode/<group>` as mirrors

Primary evidence:

- `src/cli/sync-assets.ts`
- `src/cli/init.ts`
- `src/lib/hivefiver-integration.ts`

### Workstream B: Runtime Authority

Focus:

- runtime composition root
- hook ownership
- tool registration
- governance path

Primary evidence:

- `src/index.ts`
- `src/hooks/index.ts`
- `.opencode/plugins/hiveops-governance/index.ts`

### Workstream C: State and Planning Boundaries

Focus:

- runtime JSON vs planning markdown
- init/bootstrap formation
- no fourth store

Primary evidence:

- `src/lib/paths.ts`
- `src/lib/fs/planning-ops.ts`
- `src/lib/persistence.ts`
- `src/schemas/brain-state.ts`
- `src/schemas/planning.ts`

### Workstream D: Lineage and Governance Story

Focus:

- align AGENTS, guardrails, lineage journey, and agent-profile scope

Primary evidence:

- `AGENTS.md`
- `CONTAMINATION-GUARDRAILS.md`
- `docs/journeys/DUAL-LINEAGE-USER-JOURNEY-STORIES-2026-03-04.md`
- `agents/hivefiver.md`
- `agents/hiveminder.md`

## Acceptance Criteria

- the codebase has one explicit answer to “what is authored source vs what is derived mirror”
- the planning root has one explicit answer to “what is runtime owner vs transport adapter”
- `src/**` is named as canonical runtime owner everywhere active
- `.opencode/**` is described as mirror/adapter/fallback territory everywhere active
- no Phase 1 cycle introduces a new state store
- no Phase 1 cycle merges runtime JSON authority with planning markdown authority
- no Phase 1 cycle bypasses authorization gates for hot-hook refactors

## Risks

- older agent/docs still encode stale lineage boundaries
- `.opencode` plugin logic currently contains real policy and runtime behavior, so “just calling it client-side” is not yet true in implementation
- overly aggressive cleanup could break current OpenCode integration if adapters are removed before canonical `src` replacements are fully defined
- planning could drift again if active continuation artifacts are not updated to point to this plan

## Verification Model

For the planning cycle:

- `git diff --check`

For later code cycles:

- `npx tsc --noEmit`
- targeted ownership and child-session suites
- the execution constitution verification ring
- targeted runtime hook and integration suites tied to the touched overlap cluster

## Current Recommendation

Treat this plan as the detailed guide for Workstream B and the broader src-canonical runtime-owner track.

Top-level precedence now belongs to the ecosystem control master, while local runtime decisions continue through `01-26-PLAN.md` and later workstream-local gates.
