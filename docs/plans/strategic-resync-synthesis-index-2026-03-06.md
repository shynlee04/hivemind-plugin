# Strategic Resync Synthesis Index

Date: 2026-03-06
Status: active-index
Type: synthesis-index

## Purpose

This document ties the strategic resync packet together.

It exists to:

- preserve the locked March 6 baseline
- identify the active bigger-frame tensions
- define which new documents are active for the next manual synthesis wave
- prevent older mixed evidence packets from being reused as clean outbound packets

## Locked Baseline Matrix

| Area | Locked Fact | Status |
|---|---|---|
| Continuity | `task_id` continuity is implemented | completed |
| Inspect | `hivemind_inspect.traverse` v1 exists and remains tree-first | completed |
| Prompt ownership | coverage and first de-dup slice are part of the baseline | completed |
| Governance writes | `tool-gate` is advisory-only for persisted writes | completed |
| Child sessions | runtime minimization is active | completed |
| Session metadata | `brain.json` remains the hot session metadata store | locked |
| Structured context | `graph/*.json` remains the packed structured context source | locked |
| Navigation | `hierarchy.json` remains the tree-first navigation authority | locked |
| Child linkage | remains runtime-only | locked |
| State model | no fourth state store | locked |
| GX-Pack fallback coverage | direct runtime coverage still needs a stable harness | open |

## Active Bigger-Frame Tensions

These are the tensions the new packet set is trying to address:

- reset and init are the composition root of `.hivemind`
- runtime automation and readable planning artifacts are not yet governed as one coherent hierarchy
- sessions and delegated agents still need cleaner orientation and continuity
- planning artifacts need stronger hierarchy, governance, and validation flow
- prompt artifacts are useful transfer wrappers but should not become architectural authority

## Active Packet Set

Use these as the current strategic resync packet:

1. `docs/plans/long-haul-strategic-resync-master-plan-2026-03-06.md`
2. `docs/plans/devin-packet-opencode-runtime-session-semantics-2026-03-06.md`
3. `docs/plans/devin-packet-planning-root-hivemind-composition-2026-03-06.md`
4. `docs/plans/devin-packet-lineage-delegation-continuity-2026-03-06.md`
5. `docs/plans/2026-03-06-state-authority-rationalization-pass.md`
6. `docs/plans/2026-03-06-next-iteration-implementation-plan.md`
7. `docs/plans/2026-03-06-external-replies-reconciled-execution-plan.md`
8. `docs/plans/hivefiver-module-architecture-master-plan-2026-03-06.md`
9. `docs/plans/hivefiver-use-case-routing-matrix-2026-03-06.md`
10. `docs/plans/hivefiver-devin-packet-module-operations-2026-03-06.md`
11. `docs/plans/hivefiver-execution-track-map-2026-03-06.md`
12. `docs/plans/hivefiver-devin-reconciliation-2026-03-06.md`
13. `docs/plans/hivefiver-phase-planning-bridge-2026-03-06.md`
14. `docs/plans/hivefiver-lane-family-phase-planning-master-2026-03-06.md`
15. `docs/plans/hivefiver-cross-cutting-routing-continuity-plan-2026-03-06.md`
16. `docs/plans/hivefiver-phase-plan-diagnose-2026-03-06.md`
17. `docs/plans/hivefiver-phase-plan-repair-refactor-2026-03-06.md`
18. `docs/plans/hivefiver-phase-plan-tailored-build-2026-03-06.md`
19. `docs/plans/hivefiver-phase-plan-guidance-2026-03-06.md`
20. `docs/plans/hivefiver-phase-plan-composition-2026-03-06.md`

## Local Lineage Planning Anchors

These are local planning documents for the active second-lineage module model. They are not manual outbound packets, but they now belong to the strategic resync set:

- `docs/plans/hivefiver-module-architecture-master-plan-2026-03-06.md`
- `docs/plans/hivefiver-use-case-routing-matrix-2026-03-06.md`
- `docs/plans/hivefiver-devin-reconciliation-2026-03-06.md`
- `docs/plans/hivefiver-phase-planning-bridge-2026-03-06.md`
- `docs/plans/hivefiver-lane-family-phase-planning-master-2026-03-06.md`
- `docs/plans/hivefiver-cross-cutting-routing-continuity-plan-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-diagnose-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-repair-refactor-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-tailored-build-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-guidance-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-composition-2026-03-06.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-01-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-02-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-03-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-04-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-05-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-06-PLAN.md`

## Hivefiver Carry Order

For the `hivefiver` module specifically, the recommended order is:

1. read `docs/plans/hivefiver-module-architecture-master-plan-2026-03-06.md`
2. read `docs/plans/hivefiver-use-case-routing-matrix-2026-03-06.md`
3. read `docs/plans/hivefiver-devin-reconciliation-2026-03-06.md`
4. read `docs/plans/hivefiver-phase-planning-bridge-2026-03-06.md`
5. read `docs/plans/hivefiver-lane-family-phase-planning-master-2026-03-06.md`
6. read `docs/plans/hivefiver-cross-cutting-routing-continuity-plan-2026-03-06.md`
7. then choose one lane-family phase plan to activate

## Older Documents: Classification

These older March 6 documents remain useful as historical evidence or caution, but should not be reused as fresh outbound packets:

| Document | Classification | How To Use |
|---|---|---|
| `docs/plans/2026-03-06-deepwiki-unresolved-query-packet.md` | mixed prompt-plus-reply evidence | historical only |
| `docs/plans/2026-03-06-devin-repo-mapping-query-packet.md` | mixed prompt-plus-reply evidence | historical only |
| `docs/plans/2026-03-06-external-findings-truth-matrix.md` | reconciliation evidence | local cross-check only |
| `docs/plans/2026-03-06-live-architecture-themes.md` | architecture tension inventory | local reference only |

## Transitional Continuity: Classification

These remain useful, but should not override the active planning-root packet:

| Document | Classification | How To Use |
|---|---|---|
| `.hivemind/handoffs/long-haul-resync-handoff-2026-03-06.md` | transitional continuity artifact | historical resync context only |
| `.hivemind/checkpoints/long-haul-resync-checkpoint-2026-03-06.md` | transitional continuity artifact | historical baseline and risks only |

## Manual Carry Order

Suggested carry order for the next manual Devin round:

1. carry the runtime and session semantics packet
2. carry the planning-root and `.hivemind` composition packet
3. carry the lineage, delegation, and continuity packet
4. return the answers locally
5. validate each answer against repo truth and the locked March 6 baseline before accepting any recommendation

## Return-Synthesis Rules

When the replies come back, evaluate them using these rules:

- repo truth outranks external synthesis
- the March 6 locked baseline outranks external redesign suggestions
- recommendations that require a fourth state store are rejected
- recommendations that demote `brain.json` from hot metadata authority are rejected
- recommendations that collapse lineages before making overlap explicit are rejected
- recommendations that turn prompt wrappers into architecture are rejected
- recommendations that contradict current `hivefiver` delegation permissions must be marked as future options, not current truth

## Success Condition

This packet set is ready for the next manual synthesis round when:

- the user can carry the three Devin packets without extra reconstruction
- the March 6 baseline remains explicit and protected
- the older mixed evidence packets are no longer treated as clean outbound packets
- returned external answers can be validated and synthesized back into the next long-haul architecture direction

For the current `hivefiver` lane-design round specifically, success now means:

- the returned external synthesis has been reconciled into a verified local artifact
- the local model has been reset to the accepted five-lane structure
- the packet has been bridged back into the broader planning root
- the lane-family phase-planning packet set exists
- the next move is selecting the first lane-family planning cycle, not another freeform synthesis pass
