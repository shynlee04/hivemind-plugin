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
| GX-Pack fallback coverage | direct runtime coverage now exists for the real plugin hook boundary | completed |

## Active Bigger-Frame Tensions

These are the tensions the new packet set is trying to address:

- reset and init are the composition root of `.hivemind`
- runtime automation and readable planning artifacts are not yet governed as one coherent hierarchy
- sessions and delegated agents still need cleaner orientation and continuity
- planning artifacts need stronger hierarchy, governance, and validation flow
- prompt artifacts are useful transfer wrappers but should not become architectural authority
- the repo still needs one coherent ownership answer for `src/**` vs `.opencode/**`

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
16. `docs/plans/hivefiver-routing-precedence-model-2026-03-06.md`
17. `docs/plans/hivefiver-continuity-precedence-model-2026-03-06.md`
18. `docs/plans/hivefiver-runtime-vs-planning-matrix-2026-03-06.md`
19. `docs/plans/hivefiver-shared-validation-constitution-2026-03-06.md`
20. `docs/plans/hivefiver-cross-cutting-mismatch-register-2026-03-06.md`
21. `docs/plans/hivefiver-lane-activation-readiness-2026-03-06.md`
22. `docs/plans/hivefiver-phase-plan-diagnose-2026-03-06.md`
23. `docs/plans/hivefiver-diagnose-verified-situation-summary-2026-03-07.md`
24. `docs/plans/hivefiver-diagnose-contradiction-register-2026-03-07.md`
25. `docs/plans/hivefiver-diagnose-ranked-remediation-routes-2026-03-07.md`
26. `docs/plans/hivefiver-diagnose-stop-or-promote-decision-2026-03-07.md`
27. `docs/plans/hivefiver-phase-plan-repair-refactor-2026-03-06.md`
28. `docs/plans/hivefiver-phase-plan-tailored-build-2026-03-06.md`
29. `docs/plans/hivefiver-phase-plan-guidance-2026-03-06.md`
30. `docs/plans/hivefiver-phase-plan-composition-2026-03-06.md`

## Local Lineage Planning Anchors

These are local planning documents for the active second-lineage module model. They are not manual outbound packets, but they now belong to the strategic resync set:

- `docs/plans/hivefiver-module-architecture-master-plan-2026-03-06.md`
- `docs/plans/hivefiver-use-case-routing-matrix-2026-03-06.md`
- `docs/plans/hivefiver-devin-reconciliation-2026-03-06.md`
- `docs/plans/hivefiver-phase-planning-bridge-2026-03-06.md`
- `docs/plans/hivefiver-lane-family-phase-planning-master-2026-03-06.md`
- `docs/plans/hivefiver-cross-cutting-routing-continuity-plan-2026-03-06.md`
- `docs/plans/hivefiver-routing-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-continuity-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-runtime-vs-planning-matrix-2026-03-06.md`
- `docs/plans/hivefiver-shared-validation-constitution-2026-03-06.md`
- `docs/plans/hivefiver-cross-cutting-mismatch-register-2026-03-06.md`
- `docs/plans/hivefiver-lane-activation-readiness-2026-03-06.md`
- `docs/plans/hivefiver-phase-plan-diagnose-2026-03-06.md`
- `docs/plans/hivefiver-diagnose-verified-situation-summary-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-contradiction-register-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-ranked-remediation-routes-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-stop-or-promote-decision-2026-03-07.md`
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
- `.hivemind/project/planning/phases/01-hivefiver-module/01-07-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-08-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-09-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-10-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-11-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-12-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-13-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-14-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-15-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-16-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-17-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-18-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-19-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-20-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-21-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-22-PLAN.md`
- `docs/plans/src-canonical-phase-1-refactor-master-plan-2026-03-07.md`
- `docs/plans/src-canonical-cycle-1-ownership-normalization-2026-03-07.md`
- `docs/plans/src-canonical-ownership-constitution-2026-03-07.md`
- `docs/plans/src-canonical-asset-projection-contract-2026-03-07.md`
- `docs/plans/src-canonical-cycle-2-asset-projection-hardening-2026-03-07.md`
- `docs/plans/src-canonical-runtime-adapter-separation-contract-2026-03-07.md`
- `docs/plans/src-canonical-cycle-3-runtime-adapter-separation-2026-03-07.md`
- `docs/plans/src-canonical-cycle-4-hot-hook-consolidation-2026-03-07.md`
- `docs/plans/ecosystem-control-master-plan-2026-03-07.md`
- `docs/plans/ecosystem-compilation-map-2026-03-07.md`
- `docs/plans/ecosystem-workstream-control-matrix-2026-03-07.md`
- `docs/plans/ecosystem-subagent-tdd-execution-constitution-2026-03-07.md`
- `.hivemind/project/planning/codebase/opencode-src-overlap-map-2026-03-07.md`
- `.hivemind/project/planning/codebase/runtime-adapter-overlap-map-2026-03-07.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-23-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-24-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-27-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-28-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-29-PLAN.md`
- `.hivemind/project/planning/phases/01-hivefiver-module/01-30-PLAN.md`

The canonical packet now lives in the planning-root phase folder.
The `docs/plans` lane-family packet files remain supporting mirrors and synthesis references, not the primary continuation surface.
`01-12-PLAN.md` is complete at the planning-output level.
`01-14-PLAN.md` is completed promotion history.
`01-07-PLAN.md` is completed Diagnose history.
`01-15-PLAN.md` is completed lane-order history.
`01-16-PLAN.md` is completed Phase 1 approval history.
`01-17-PLAN.md` is completed Cycle 1 history.
`01-18-PLAN.md` is completed Cycle 2 approval history.
`01-19-PLAN.md` is completed Cycle 2 planning history.
`01-20-PLAN.md` is completed Cycle 3 approval history.
`01-21-PLAN.md` is completed Cycle 3 planning history.
`01-22-PLAN.md` is completed Cycle 4 gate history.
`01-23-PLAN.md` is completed Cycle 4 hot-hook consolidation planning history.
`01-24-PLAN.md` is completed review history for the first bounded context-cluster slice.
`01-25-PLAN.md` is completed Context Pack 2 history.
`01-26-PLAN.md` is completed Workstream B local gate history.
`01-27-PLAN.md` is completed ecosystem control activation history.
`01-28-PLAN.md` is completed ecosystem precedence history.
`01-29-PLAN.md` is completed umbrella execution-activation history.
`01-30-PLAN.md` is completed Workstream B implementation-gate history.
`01-31-PLAN.md` is completed direct fallback harness-packet history.
`01-32-PLAN.md` is completed post-harness decision history.
`01-33-PLAN.md` is completed post-harness consolidation-packet history.
`01-34-PLAN.md` is the next Workstream B consolidation review gate.
The first bounded Cycle 4 code slice has now landed under TDD by centralizing plugin fallback turn resolution in `src/lib/injection-orchestrator.ts` and narrowing `.opencode/plugins/**` accordingly.
The second bounded Cycle 4 code slice has now landed under TDD by moving semantic fallback context assembly into `src/lib/plugin-fallback-context.ts`.
The ecosystem control plane now governs the whole refactor, the src-canonical runtime work remains active only as a subordinate workstream, the new execution constitution governs later subagent/TDD implementation, direct fallback hook coverage is now part of the active Workstream B evidence base, and the current runtime tranche is under consolidation rather than open-ended continuation.

## Hivefiver Carry Order

For the `hivefiver` module specifically, the recommended order is:

1. read `.hivemind/project/planning/phases/01-hivefiver-module/01-06-PLAN.md`
2. read `.hivemind/project/planning/phases/01-hivefiver-module/01-12-PLAN.md`
3. read `.hivemind/project/planning/phases/01-hivefiver-module/01-14-PLAN.md`
4. read `.hivemind/project/planning/phases/01-hivefiver-module/01-07-PLAN.md`
5. read `.hivemind/project/planning/phases/01-hivefiver-module/01-15-PLAN.md`
6. read `.hivemind/project/planning/phases/01-hivefiver-module/01-16-PLAN.md`
7. read `.hivemind/project/planning/phases/01-hivefiver-module/01-17-PLAN.md`
8. read `.hivemind/project/planning/phases/01-hivefiver-module/01-18-PLAN.md`
9. read `.hivemind/project/planning/phases/01-hivefiver-module/01-19-PLAN.md`
10. read `.hivemind/project/planning/phases/01-hivefiver-module/01-20-PLAN.md`
11. read `.hivemind/project/planning/phases/01-hivefiver-module/01-21-PLAN.md`
12. read `.hivemind/project/planning/phases/01-hivefiver-module/01-22-PLAN.md`
13. read `.hivemind/project/planning/phases/01-hivefiver-module/01-23-PLAN.md`
14. read `.hivemind/project/planning/phases/01-hivefiver-module/01-24-PLAN.md`
15. read `.hivemind/project/planning/phases/01-hivefiver-module/01-08-PLAN.md`
16. read `.hivemind/project/planning/phases/01-hivefiver-module/01-09-PLAN.md`
17. read `.hivemind/project/planning/phases/01-hivefiver-module/01-10-PLAN.md`
18. read `.hivemind/project/planning/phases/01-hivefiver-module/01-11-PLAN.md`
19. treat `01-12-PLAN.md` as completed cross-cutting output history
20. treat `01-13-PLAN.md` as completed activation review history
21. treat `01-14-PLAN.md` as completed promotion history
22. treat `01-07-PLAN.md` as completed Diagnose history
23. treat `01-15-PLAN.md` through `01-22-PLAN.md` as completed gate and cycle history

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
- the first lane-family cycle has completed its shared constitutions
- the constitutions are promoted, Diagnose is complete, and the next move is selecting the next lane from an explicit gate
