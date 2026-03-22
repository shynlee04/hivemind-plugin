# Stage Contracts

## 1. Triage and contamination assessment
- Objective: classify the request into the smallest concern and branch-family entry.
- Inputs: user request, active plan docs, pack map.
- Outputs: investigation report, selected concern, initial family set.
- Linked skills: router only, `spec-distillation` when the request is still noisy.
- Linked assets/tools: `references/emergence-path.md`, `references/branch-families.md`.
- Execution mode: manual.
- Report template: `templates/investigation-report.md`.
- Follow-up template: `templates/partition-plan.md`.
- Entry criteria: request is refactor, recovery, or detox oriented.
- Exit criteria: concern and family set are explicit.
- Success metrics: no ambiguous family ownership remains.
- Failure indicators: request still spans unrelated families.
- Escalation rules: if concern spans 3+ families, escalate to Stage 4 decomposition immediately.

## 2. Context isolation
- Objective: define authority boundaries, scope, and dispatch rules before deeper work.
- Inputs: selected concern, authority surfaces, drift signals.
- Outputs: partition plan with scope, constraints, and execution mode.
- Linked skills: `context-intelligence-entry`, `context-entry-verify`, `use-hivemind-delegation`.
- Linked assets/tools: `references/deterministic-delegation.md`, `references/linked-knowledge.md`.
- Execution mode: manual or sequential subagents.
- Report template: `templates/partition-plan.md`.
- Follow-up template: `templates/detox-assessment-report.md`.
- Entry criteria: concern and authority surfaces are known.
- Exit criteria: no hidden authority assumptions remain.
- Success metrics: scope, out-of-scope, and mutation boundaries are explicit.
- Failure indicators: shared-state or authority confusion remains.
- Escalation rules: if slices still collide, forbid parallel delegation and continue sequentially.

## 3. History and memory retrieval
- Objective: decide whether git continuity is trustworthy enough to guide recovery.
- Inputs: current branch state, commit history quality, continuity needs.
- Outputs: continuity manifest, knowledge synthesis, recovery anchors, branch/worktree context.
- Linked skills: `git-continuity-memory`.
- Linked assets/tools: `references/retrieval-network.md`, `templates/continuity-manifest.md`.
- Execution mode: sequential subagents or deterministic manual retrieval backed by explicit evidence.
- Report template: `templates/continuity-manifest.md`.
- Follow-up template: `templates/knowledge-synthesis-report.md`.
- Entry criteria: continuity may affect recovery.
- Exit criteria: history quality is classified as usable, partial, or unsafe.
- Success metrics: continuity assumptions, session linkage, branch/worktree posture, and gaps are explicit.
- Failure indicators: history is being trusted without evidence.
- Escalation rules: if history is unsafe, mark git-memory as advisory only and continue without recovery assumptions.

## 4. Architectural decomposition
- Objective: split the problem into bounded structural slices.
- Inputs: continuity posture, branch-family map, authority boundaries.
- Outputs: detox assessment report, scan plan, slice map, seam inventory.
- Linked skills: `hivemind-codemap`.
- Linked assets/tools: `references/branch-families.md`, `references/refactor-techniques.md`, `hivemind-codemap/references/scan-levels.md`, `hivemind-codemap/references/batching-loop.md`, `hivemind-codemap/references/repomix-mode.md`.
- Execution mode: sequential subagents, optionally parallel read-only scans after partitioning.
- Report template: `templates/detox-assessment-report.md`.
- Follow-up template: `hivemind-codemap/templates/codemap-synthesis-report.md`.
- Entry criteria: continuity posture is known.
- Exit criteria: slices map cleanly to families or seams.
- Success metrics: ownership and overlap are explicit.
- Failure indicators: unresolved cross-slice overlap remains.
- Escalation rules: if seams cannot be isolated, return to Stage 2 or stay in Stage 4.

## 5. Risk containment
- Objective: define rollback, quarantine, and safe sequencing.
- Inputs: slice map, known blockers, blast-radius analysis.
- Outputs: updated partition plan and containment notes.
- Linked skills: `hivemind-system-debug`, `use-hivemind-delegation`.
- Linked assets/tools: `references/deterministic-delegation.md`, `templates/partition-plan.md`.
- Execution mode: manual or sequential.
- Report template: `templates/partition-plan.md`.
- Follow-up template: `templates/debug-stage-report.md`.
- Entry criteria: structural slices exist.
- Exit criteria: rollback and quarantine posture are explicit.
- Success metrics: blast radius is bounded.
- Failure indicators: unsafe edits would still cross unresolved seams.
- Escalation rules: if blast radius is unclear, stop edits and return to Stage 4.

## 6. Systematic debugging
- Objective: reproduce, narrow, and explain unresolved behavior before fixes.
- Inputs: containment plan, failing routes or symptoms, evidence targets.
- Outputs: debug stage report with root cause or bounded unknown.
- Linked skills: `hivemind-system-debug`, `context-entry-verify`.
- Linked assets/tools: `templates/debug-stage-report.md`.
- Execution mode: sequential subagents or manual debugging.
- Report template: `templates/debug-stage-report.md`.
- Follow-up template: `templates/refactor-stage-report.md`.
- Entry criteria: unresolved behavior remains.
- Exit criteria: root cause or bounded unknown is documented.
- Success metrics: fixes are not proposed without evidence.
- Failure indicators: guess-and-check behavior appears.
- Escalation rules: after repeated failed hypotheses, escalate back to Stage 4 architecture review.

## 7. Refactor strategy selection
- Objective: choose the right reusable technique for each slice.
- Inputs: debug evidence, slice map, family posture.
- Outputs: refactor stage report with chosen technique.
- Linked skills: router local refactor techniques, `hivemind-codemap` when structural seams still matter.
- Linked assets/tools: `references/refactor-techniques.md`.
- Execution mode: manual or sequential.
- Report template: `templates/refactor-stage-report.md`.
- Follow-up template: `templates/refactor-stage-report.md`.
- Entry criteria: evidence is stable.
- Exit criteria: one technique is chosen per slice.
- Success metrics: technique matches defect class.
- Failure indicators: refactor starts without strategy selection.
- Escalation rules: if no technique fits, return to Stage 4 or Stage 6.

## 8. Staged restoration
- Objective: land bounded restorative change only after loop closure, ownership proof, and cleanup safety review.
- Inputs: refactor strategy, containment plan, verification targets.
- Outputs: refactor stage report with implemented slice outcomes.
- Linked skills: selected local family owners, `context-entry-verify`.
- Linked assets/tools: `templates/refactor-stage-report.md`, `templates/verification-handoff.md`.
- Execution mode: sequential by default; parallel only for already-isolated slices.
- Report template: `templates/refactor-stage-report.md`.
- Follow-up template: `templates/verification-handoff.md`.
- Entry criteria: strategy is chosen per slice, `open_loop_ids` are resolved for the target surface, and `surface_class` plus `ownership_evidence` are recorded.
- Exit criteria: bounded restorative change lands with explicit evidence handoff and `cleanup_allowed` justification.
- Success metrics: no family creep, no hidden route changes, and no cleanup on unclassified or active-loop surfaces.
- Failure indicators: unverified claims, cross-slice conflicts, missing projection safety, or cleanup without explicit proof.
- Escalation rules: if slice boundaries collapse or cleanup proof is incomplete, stop and return to Stage 2, Stage 4, or Stage 6.

## 9. Verification and regression control
- Objective: verify restored slices and document regression boundaries.
- Inputs: implemented changes, verification commands, acceptance criteria.
- Outputs: verification handoff with pass/fail evidence.
- Linked skills: `context-entry-verify`.
- Linked assets/tools: `templates/verification-handoff.md`.
- Execution mode: deterministic commands and manual review.
- Report template: `templates/verification-handoff.md`.
- Follow-up template: `templates/knowledge-synthesis-report.md`.
- Entry criteria: restored slice exists.
- Exit criteria: fresh verification evidence is captured.
- Success metrics: pass/fail state is explicit and reproducible.
- Failure indicators: success claimed without fresh evidence.
- Escalation rules: failing verification routes back to Stage 6 or Stage 7 depending on defect class.

## 10. Documentation and memory reintegration
- Objective: emit synthesis and retrieval artifacts so future sessions can recover context deterministically.
- Inputs: verified outcomes, continuity posture, route changes.
- Outputs: knowledge synthesis, continuity manifest updates, recovery anchors.
- Linked skills: `git-continuity-memory`.
- Linked assets/tools: `templates/knowledge-synthesis-report.md`, `templates/continuity-manifest.md`.
- Execution mode: manual or sequential synthesis.
- Report template: `templates/knowledge-synthesis-report.md`.
- Follow-up template: `templates/follow-up-guidance.md`.
- Entry criteria: verified restoration evidence exists.
- Exit criteria: future recovery artifacts are written.
- Success metrics: next-turn recovery is materially easier.
- Failure indicators: changes land without durable continuity outputs.
- Escalation rules: if continuity is unsafe, record explicit memory gaps instead of fabricating lineage.

## 11. Follow-up stabilization
- Objective: capture remaining risks, governance updates, and next bounded actions.
- Inputs: verification evidence, synthesis outputs, governance impacts.
- Outputs: stabilization report and follow-up guidance.
- Linked skills: router local templates and `context-entry-verify`.
- Linked assets/tools: `templates/stabilization-report.md`, `templates/follow-up-guidance.md`.
- Execution mode: manual.
- Report template: `templates/stabilization-report.md`.
- Follow-up template: `templates/follow-up-guidance.md`.
- Entry criteria: docs and memory artifacts exist.
- Exit criteria: follow-up actions and monitoring gaps are explicit.
- Success metrics: next-turn recovery is deterministic.
- Failure indicators: unresolved actions stay implicit.
- Escalation rules: if governance ownership is still unclear, defer reintegration and reopen Stage 4.
