# Phase 1 Governance and Control-Plane Unification Audit

**Date**: 2026-03-08  
**Last Verified**: 2026-03-10  
**Status**: `reference`  
**Category**: `audit`  
**Authority**: Root `PLAN.md` remains the only human-readable SOT.  

---

## 1. Executive Summary

This dated audit artifact records the Phase 1 investigation frame referenced by `PLAN.md` and re-verifies it against the live repository as of 2026-03-10.

Methodology:
- 4 sectors: meta concepts, `.opencode`, `src`, `.hivemind`
- 4 domains: user intent detection, delegation decisions, lineage awareness, governance enforcement
- continuity preserved with the historical “22 findings” investigation label from the prior audit wave

Current verified conclusions:
- The old `.opencode/plugins/hiveops-governance` control plane is gone.
- Residual control-plane debt now lives primarily in `.opencode/tool/*`.
- `P1-B` is implemented at the canonical brain-state layer but not yet closed because bootstrap/profile authority is still split.
- `.hivemind` still mixes legacy flat state and canonical nested runtime expectations.
- Phase 1 should now move through aggressive isolation, refactor, migration, and deletion-biased cleanup.

## 2. Sector Analysis Summaries

### Sector 1: Meta Concepts

Primary surfaces:
- `src/lib/session-intent-classifier.ts`
- `src/hooks/event-handler.ts`
- `.opencode/skills/entry-resolution/SKILL.md`

Verified state:
- Canonical lineage classification now exists in `src/lib/session-intent-classifier.ts`.
- `event-handler.ts` applies canonical lineage classification during session bootstrap.
- Meta guidance and runtime logic still overlap conceptually: the skill layer describes lineage/entry behavior while `src` now implements the live authority path.

Phase 1 implication:
- Duplicate concepts remain useful as design references, but runtime authority belongs in `src`.

### Sector 2: `.opencode`

Primary surfaces:
- `.opencode/tool/hiveops_gate.ts`
- `.opencode/tool/hiveops_sot.ts`
- `.opencode/tool/hiveops_todo.ts`
- `.opencode/tool/hiveops_export.ts`

Verified state:
- `.opencode/plugins/hiveops-governance/` is deleted.
- `hiveops_gate.ts`, `hiveops_sot.ts`, and `hiveops_todo.ts` directly write into `.hivemind/state`.
- `hiveops_export.ts` reads state and writes handoff/checkpoint artifacts instead of acting as a direct state writer.

Phase 1 implication:
- The remaining `.opencode/tool/*` layer is the main residual non-`src` authority surface.
- Phase policy is full deletion bias: migrate business logic into `src`, delete `.opencode` tool surfaces wherever runtime permits, and tolerate only temporary thin wrappers if strictly required by OpenCode.

### Sector 3: `src`

Primary surfaces:
- `src/hooks/event-handler.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/lib/gatekeeper.ts`
- `src/lib/sot-governance.ts`
- `src/schemas/brain-state.ts`

Verified state:
- `src` is now the canonical owner for live lineage classification and runtime governance intent.
- `session-lifecycle.ts` and `messages-transform.ts` remain the principal prompt/injection surfaces.
- `gatekeeper.ts` and `sot-governance.ts` are the natural `src` targets for absorbed governance logic.

Phase 1 implication:
- `src` is ready to absorb the remaining policy and persistence logic that should no longer live in `.opencode/tool/*`.

### Sector 4: `.hivemind`

Primary surfaces:
- `.hivemind/state/brain.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/sessions/active/*/profile.json`
- `.hivemind/graph/*`

Verified state:
- Active runtime stores still include legacy flat fields such as `lineage`.
- Session profiles still seed with unresolved agent/bootstrap metadata.
- No lineage-separated active state paths exist yet.
- Active state and compatibility evidence are still mixed together in the same runtime area.

Phase 1 implication:
- `P1-D` must freeze one write-authority model before path migration and cleanup.

## 3. Domain Ownership Matrix

| Domain | Current Canonical Owner | Residual Conflict |
|---|---|---|
| User Intent Detection | `src/lib/session-intent-classifier.ts` + `src/hooks/event-handler.ts` | Skill/docs layer still describes overlapping lineage-routing concepts |
| Delegation Decisions | Transitional; no single frozen router yet | `P1-C` still needs one topology/scope/blocking authority path |
| Lineage Awareness | `src/schemas/brain-state.ts` + `event-handler.ts` for canonical state | `.hivemind` live stores still carry legacy lineage/session shapes |
| Governance Enforcement | Transitional; `src` should own it | `.opencode/tool/*` still preserves residual governance/state authority |

## 4. Conflict Detection Report

### C1: Duplicate Intent and Entry Concepts

Runtime lineage ownership now lives in `src`, but concept-level entry and lineage logic still exists in skill surfaces and older audit/report language.

### C2: Dual Prompt/Injection Surfaces

`src/hooks/session-lifecycle.ts` and `src/hooks/messages-transform.ts` remain separate high-risk governance injection surfaces and must continue to be treated as tightly controlled ownership boundaries.

### C3: Missing Lineage-Separated State Paths

Active runtime state is still shared under `.hivemind/state/` instead of using lineage-separated active paths.

### C4: Duplicate or Ambiguous State Ownership

Canonical runtime state and session-profile bootstrap data still overlap semantically, especially around session identity, role/agent bootstrap, and lineage-adjacent metadata.

### C5: Mixed State Shape and Vocabulary

The canonical runtime model expects nested `BrainState.session.lineage_scope`, while active `.hivemind` stores still expose legacy flat fields such as `lineage`, and historical documents still use hivefiver/hiveminder terminology as a lineage label.

### C6: Residual `.opencode/tool/*` Authority

The OpenCode-facing tool layer is still runtime-coupled, but its business logic and state authority should no longer remain outside `src`. These surfaces must be isolated, migrated, and deleted wherever the platform boundary allows.

## 5. Execution Pathways Definition

Current live pathway:

1. **User Intent**
   Input enters the runtime through OpenCode session/tool flow.
2. **Classification**
   `src/lib/session-intent-classifier.ts` resolves lineage and intent signals.
3. **Bootstrap / Component Tracing**
   `src/hooks/event-handler.ts` creates or updates canonical runtime state and session bootstrap artifacts.
4. **Prompt / Governance Injection**
   `src/hooks/session-lifecycle.ts` and `src/hooks/messages-transform.ts` assemble and inject runtime governance context.
5. **Tool Connection**
   `src` tools and remaining `.opencode/tool/*` surfaces connect runtime operations to persistence, gates, SOT, TODO, and export behaviors.
6. **Final Decision**
   `src`-owned governance should decide policy outcomes; any remaining `.opencode` surface should be transport only.

## 6. Lineage Separation: `hivefiver` vs `hiveminder`

Operational distinction:
- `hivefiver`: framework/meta-builder/doctor work
- `hiveminder`: project/runtime/product work

Current state:
- Canonical lineage classification exists in `src`.
- Active `.hivemind` runtime stores are not yet lineage-separated.
- Session bootstrap/profile data does not yet fully reflect the canonical lineage owner.

Phase 1 target:
- one canonical runtime lineage contract in `src`
- lineage-separated active state/session paths in `.hivemind`
- no ambiguous second authority in profile/bootstrap artifacts

## 7. Migration Status

### Already Landed

- Plugin-era `.opencode/plugins/hiveops-governance` control-plane surface deleted
- Canonical lineage classifier implemented in `src`
- `PLAN.md` recovery/resync completed

### Must Be Isolated Next

- `hiveops_gate.ts`
- `hiveops_sot.ts`
- `hiveops_todo.ts`
- `hiveops_export.ts`

### `P1-C.1` Classification Snapshot (Verified 2026-03-10)

| Surface | Classification | Closest `src` owner | Current disposition |
|---|---|---|---|
| `.opencode/tool/hiveops_gate.ts` | `direct-state-writer debt` | `src/lib/gatekeeper.ts` | migrate business logic into `src`; temporary wrapper only if runtime still requires an OpenCode entry point |
| `.opencode/tool/hiveops_sot.ts` | `direct-state-writer debt` | `src/lib/sot-governance.ts` | migrate business logic into `src`; temporary wrapper only if runtime still requires an OpenCode entry point |
| `.opencode/tool/hiveops_todo.ts` | `direct-state-writer debt` | `event-handler.ts` + `state-mutation-queue.ts` + `manifest.ts` + `hivemind-plan.ts` | rebuild into canonical `src` task authority; do not preserve `.hivemind/state/todo.json` as active authority |
| `.opencode/tool/hiveops_export.ts` | `artifact-path debt` | `src/lib/session-export.ts` + `src/tools/hivemind-cycle.ts` | migrate or rebuild into `src`; temporary wrapper only if runtime still requires an OpenCode entry point |

### Migration/Deletion Policy

- Business logic migrates into `src`
- Direct `.hivemind/state` writes must leave `.opencode/tool/*`
- `.opencode/tool/*` is deletion-biased
- Thin wrappers are allowed only as temporary transport surfaces if OpenCode still strictly requires them

### Requires Structural Refactor

- bootstrap/profile authority alignment
- legacy flat state vs canonical nested `BrainState`
- lineage-separated state/session paths

## 8. Recommendations

Priority-ordered Phase 1 execution:

1. **`P1-B` closeout**
   Freeze bootstrap/profile ownership so canonical lineage state is not undermined by unresolved profile seed data.
2. **`P1-C.1` aggressive isolation**
   Completed as a decision packet: `.opencode/tool/*` debt classes are now frozen and the closest `src` ownership targets are explicit.
3. **`P1-C.2` aggressive refactor/migration**
   Move accepted gate/SOT/TODO/export logic into `src` and delete `.opencode` tool surfaces wherever possible.
4. **`P1-D.1` aggressive state reconciliation**
   Freeze one write-authority model for active runtime state.
5. **`P1-D.2` aggressive lineage migration**
   Implement lineage-separated active paths and remove active ambiguity between legacy and canonical shapes.
6. **`P1-E` / `P1-F` closeout lanes**
   Normalize command/agent contracts and run the scoped integrity gate for the claims retained at phase close.

## 9. Appendix: File Inventory

### Sector 1
- `src/lib/session-intent-classifier.ts`
- `src/hooks/event-handler.ts`
- `.opencode/skills/entry-resolution/SKILL.md`

### Sector 2
- `.opencode/tool/hiveops_gate.ts`
- `.opencode/tool/hiveops_sot.ts`
- `.opencode/tool/hiveops_todo.ts`
- `.opencode/tool/hiveops_export.ts`

### Sector 3
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `src/lib/gatekeeper.ts`
- `src/lib/sot-governance.ts`
- `src/schemas/brain-state.ts`

### Sector 4
- `.hivemind/state/brain.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/sessions/active/*/profile.json`
- `.hivemind/graph/*`

---

This document is subordinate to `PLAN.md`. If this report and `PLAN.md` diverge, `PLAN.md` wins.
