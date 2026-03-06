# Project State

## Current Position

The March 6 runtime hardening tranche is complete. The active work is now a strategic resynchronization of the framework around three questions:

1. How reset/init and later automatic mechanisms form `.hivemind`.
2. How readable planning and governance SOT should be organized under `.hivemind/project/planning`.
3. How local repo truth and manual external synthesis should combine without contaminating the next long-haul plan.

Within that resync, the `hivefiver` operating model has now been turned into a canonical lane-family phase-planning packet set inside the planning-root phase folder.
The cross-cutting routing and continuity lane in `01-12-PLAN.md` is complete and its outputs were promoted through `01-14-PLAN.md`.
The Diagnose lane in `01-07-PLAN.md` is now complete at the planning-output level.
The lane-order question in `01-15-PLAN.md` has now been resolved in favor of a bounded Repair/Refactor planning exception.
The approval gate in `01-16-PLAN.md` is complete.
Cycle 1 ownership normalization in `01-17-PLAN.md` is now complete at the planning and control-document level.
The Cycle 2 approval gate in `01-18-PLAN.md` is complete.
Cycle 2 asset projection hardening in `01-19-PLAN.md` is now complete at the planning and contract level.
Cycle 3 runtime adapter separation is now complete at the planning and overlap-mapping level.
Cycle 4 hot-hook consolidation planning is complete through `01-23-PLAN.md`, and it is now subordinate history under the ecosystem control plane.
The ecosystem execution constitution is now active.
`01-27-PLAN.md`, `01-28-PLAN.md`, and `01-29-PLAN.md` are completed umbrella history.
`01-30-PLAN.md` and `01-31-PLAN.md` are completed Workstream B harness history.
`01-32-PLAN.md` and `01-33-PLAN.md` are completed post-harness consolidation history.
The next top-level gate is `01-34-PLAN.md`.
The broader whole-system architecture has also been deep-scanned so the project can now be described in source layer, execution layer, and result layer terms instead of treating `.hivemind` as the origin.
The new overlap map also makes the main contamination mechanism more explicit: `src/**` already owns most of the real engine, while `.opencode/plugins/hiveops-governance/**` still behaves like a second runtime control lane.
The first bounded Cycle 4 code slice is complete: shared plugin fallback turn resolution has been moved into `src/lib/injection-orchestrator.ts`, with the plugin context hook consuming that shared helper under targeted TDD.
The second bounded Cycle 4 code slice is also complete: semantic fallback context assembly now lives in `src/lib/plugin-fallback-context.ts`, and the plugin hook is reduced further toward transport-only behavior.
The ecosystem control plane is now the top-level master layer. Runtime context cleanup remains active, but only as Workstream B inside that umbrella.

## Active Blockers

- Some framework-aware consumers still assume legacy `.planning/` inputs.
- The readable planning root exists but still has thin population and weak operational contracts.
- Existing external research packet files are mixed prompt-plus-reply evidence and must not be reused as fresh outbound packets.
- Long-haul checkpoint and handoff artifacts still carry sidecar-era framing and need to be treated as transitional continuity rather than clean active planning authority.
- `hivefiver` agent-profile delegation and runtime governance topology do not yet present one cleanly aligned story.
- The Diagnose lane has produced its outputs, but the next lane selection now needs an explicit decision on whether to keep nominal order or take an alignment-focused exception.
- The repo still has too many descriptive surfaces that can be mistaken for authority if the refactor does not anchor on code, schemas, and execution flow first.
- The next architectural risk is not lack of scan coverage; it is taking too large a consolidation bite before authored-source vs mirror ownership is made explicit.
- The immediate working constraint is to normalize ownership language and control-plane assumptions without letting Cycle 1 drift into hot-hook implementation planning.
- The next working constraint is to keep Cycle 2 focused on asset projection hardening and not let it expand into hot-hook consolidation prematurely.
- The next architectural risk after Cycle 2 is allowing runtime adapter separation to reopen source-vs-mirror ambiguity; that must stay a later gate.
- The next working constraint is to keep Cycle 3 focused on adapter/runtime separation only, without backsliding into ownership or projection ambiguity.
- The next architectural risk is no longer lack of detail; it is letting the first implementation-facing hot-hook tranche widen beyond the context cluster before TDD and harness boundaries are explicit.
- The next top-level risk is allowing Workstream B to continue acting like the project-wide master path instead of keeping it subordinate to the ecosystem control plane.
- The next execution risk is allowing another context-only extraction to proceed before the consolidation review gate decides whether Workstream B should continue.

## Recent Decisions

- Keep the March 6 authority split hard-locked:
  - injection authority = `cognitive-packer`
  - navigation authority = `hierarchy-tree` + `hierarchy.json`
  - session metadata authority = `brain-state` + `brain.json`
- Keep child-session lineage runtime-only for now.
- Treat `.hivemind/project/planning` as the canonical readable planning root.
- Use JSON for deterministic runtime state and markdown for readable planning/governance SOT.
- Use fresh dated manual Devin packets rather than live DeepWiki loops or mixed stale packet reuse.
- Add a dedicated `hivefiver` module architecture doc, routing matrix, and planning-root phase anchor before reopening module-specific implementation work.
- Reconcile returned `hivefiver` synthesis into a five-lane planning model, while keeping runtime persona routing and runtime delegation enforcement distinct from that planning taxonomy.
- Classify planning-root, Milestone 01, and long-haul continuity artifacts by active versus transitional role before opening phase planning.
- Generate the lane-family phase-planning packet set before selecting any lane-local planning cycle.
- Keep the phase-folder packet canonical and treat `docs/plans` lane-family files as supporting mirrors only.
- Activate the cross-cutting routing and continuity cycle before any lane-local planning deepens.
- Complete the cross-cutting constitutions before selecting the next lane-family cycle.
- Promote the completed cross-cutting constitutions before activating the first lane-local planning cycle.
- Complete Diagnose outputs before choosing whether alignment work should override nominal lane order.
- Keep the whole-project refactor anchored on source surfaces and automatic execution flow, not on `.hivemind` artifacts alone.
- Move top-level control to the ecosystem master while keeping runtime context cleanup active as Workstream B.
- Install one execution constitution above the workstreams so later subagent and TDD execution shares the same packet, stop, and verification rules.
- Keep harness-first as the next Workstream B implementation direction.
- Treat direct GX-Pack fallback runtime coverage as landed for the current hook boundary; the next decision is review, not more harness deferral.
- Compile current ecosystem truth before reopening Workstream B so older historical packets stop drifting against current repo state.

## Session History

- [2026-03-06] Rebased the implementation baseline after child-session minimization and state-authority rationalization.
- [2026-03-06] Packed a long-haul resync checkpoint and handoff to separate completed runtime work from external synthesis inputs.
- [2026-03-06] Pivoted from immediate runtime continuation to a deeper architectural resync on `.hivemind` composition, planning-root hierarchy, and workflow orchestration.
- [2026-03-06] Extended the strategic packet to model `hivefiver` as an adaptive second-lineage module rather than only as a broad healer label.
- [2026-03-06] Reconciled the returned `hivefiver` synthesis and connected it back to the broader planning root so the next step can be approval-gated phase planning.
- [2026-03-06] Generated the `hivefiver` lane-family phase-planning packet set and opened a lane-activation review gate.
- [2026-03-06] Materialized the canonical lane-family packet inside `.hivemind/project/planning/phases/01-hivefiver-module/` and moved the review gate to `01-13-PLAN.md`.
- [2026-03-06] Activated `01-12-PLAN.md` as the first lane-family planning cycle.
- [2026-03-06] Completed the shared cross-cutting constitutions and opened `01-14-PLAN.md` as the promotion gate for the next lane selection.
- [2026-03-07] Promoted the shared cross-cutting constitutions and activated `01-07-PLAN.md` as the first lane-local planning cycle.
- [2026-03-07] Completed the Diagnose lane outputs and opened `01-15-PLAN.md` as the next lane-selection gate.
- [2026-03-07] Completed a whole-system deep-scan audit that frames the project as source layer → execution layer → result layer.
- [2026-03-07] Added an `.opencode` vs `src` overlap map and opened `01-16-PLAN.md` as the gate for a bounded Phase 1 refactor centered on source-canonical consolidation.
- [2026-03-07] Approved the Phase 1 gate and activated `01-17-PLAN.md` as the Cycle 1 ownership-normalization planning tranche, with `01-18-PLAN.md` prepared as the next gate.
- [2026-03-07] Completed Cycle 1 ownership normalization, added the source-canonical ownership constitution, and aligned active control artifacts to the `src/**`-canonical model.
- [2026-03-07] Approved Cycle 2 and activated `01-19-PLAN.md` as the asset projection hardening planning tranche, with `01-20-PLAN.md` prepared as the next gate.
- [2026-03-07] Completed Cycle 2 asset projection hardening planning and established the projection contract for `sync-assets`, `init`, and HiveFiver asset readiness.
- [2026-03-07] Completed Cycle 3 runtime adapter separation planning, added the runtime overlap cluster map, and prepared the first implementation-facing gate at `01-22-PLAN.md`.
- [2026-03-07] Completed the `01-22-PLAN.md` gate, opened Cycle 4 hot-hook consolidation planning in `01-23-PLAN.md`, and constrained the first implementation-facing slice to TDD-backed context injection separation only.
- [2026-03-07] Completed the first bounded Cycle 4 red-green slice by adding a plugin fallback turn-resolution contract test, implementing the shared resolver in `src/lib/injection-orchestrator.ts`, and wiring the plugin context hook to it with targeted verification still green.
- [2026-03-07] Completed Context Pack 2 by adding pure fallback-context tests, moving semantic plugin fallback context assembly into `src/lib/plugin-fallback-context.ts`, and thinning the plugin context hook again without reopening governance or lifecycle work.
- [2026-03-07] Activated the ecosystem control plane, reclassified the src-canonical plan as a subordinate runtime-owner workstream plan, and moved top-level precedence to the new ecosystem master documents.
- [2026-03-07] Installed the ecosystem execution constitution, completed the umbrella precedence gate, and opened the next subagent/TDD activation plan plus the next Workstream B implementation gate.
- [2026-03-07] Completed the direct fallback harness packet by landing real plugin-hook child-session and core-hook-presence coverage and opened the post-harness review gate.
- [2026-03-07] Resolved the post-harness gate in favor of consolidation, compiled current ecosystem truth, and opened `01-34-PLAN.md` as the next review gate.
