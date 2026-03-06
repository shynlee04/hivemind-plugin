# Hivefiver Routing Precedence Model

Date: 2026-03-06
Status: active-model
Type: cross-cutting-routing-model

## Purpose

Define the shared routing order that later `hivefiver` lane plans must inherit.

This model is based on current repo truth first, then planning-target guidance where runtime behavior has not yet caught up.

## Repo-Truth Routing Order

1. Session and governance state are checked first.
   - Runtime evidence:
     - `src/lib/tool-activation.ts`
     - `src/hooks/tool-gate.ts`
     - `src/lib/gatekeeper.ts`
2. Framework context is checked before mutation-adjacent work.
   - Runtime evidence:
     - `src/lib/framework-context.ts`
     - `src/hooks/tool-gate.ts`
3. Known command detection outranks heuristic fallback classification.
   - Runtime evidence:
     - `src/lib/hivefiver-integration.ts`
4. Heuristic intent classification then picks action, persona, domain, skills, and workflow.
   - Runtime evidence:
     - `src/lib/hivefiver-integration.ts`
5. Delegation and scope enforcement apply at runtime before delegated or write operations proceed.
   - Runtime evidence:
     - `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
     - `.opencode/plugins/hiveops-governance/types.ts`

## Shared Routing Constitution

Later lane plans must follow this order:

1. Respect the March 6 authority split.
2. Respect session lock, drift, failure-ack, and active-task signals before lane selection.
3. Respect framework selection conflict before planning mutation-adjacent work.
4. Route to an existing runtime action family first:
   - `init`
   - `spec`
   - `architect`
   - `workflow`
   - `build`
   - `validate`
   - `deploy`
   - `research`
   - `audit`
   - `tutor`
5. Map the selected runtime action into the richer five-lane planning family only after repo-truth routing has been recorded.

## Planning-Target Mapping

The planning packet uses a richer five-lane model. Until runtime adopts it directly, later plans must map rather than pretend replacement:

| Planning Lane | Primary Runtime Actions |
|---|---|
| Diagnose | `audit`, `research`, selected `init` cases |
| Repair/Refactor | `workflow`, `build`, `validate` |
| Tailored Build | `spec`, `architect`, `workflow`, `build` |
| Guidance | `tutor` |
| Composition | `architect`, `workflow`, `validate`, `deploy` |

## Diagnosis-First Shared Rule

The shared planning rule is:

- diagnose first when repo-truth signals show uncertainty, conflict, contamination, or missing integrity

The currently evidenced runtime triggers are:

- session locked
- drift below threshold
- pending failure acknowledgement
- framework conflict without accepted metadata
- no active task tracking for write-adjacent work

The stronger planning-target triggers remain valid as planning guidance, but must not be described as landed hard enforcement unless code changes implement them.

## Non-Negotiable Constraints

- Do not create a second routing constitution per lane.
- Do not let planning-only lane taxonomy overwrite current action taxonomy in runtime descriptions.
- Do not treat advisory runtime nudges as already-hard global blockers.
- Do not flatten `hivefiver` and `hiveminder` routing roles.

## Use In Later Lanes

Every later lane-local plan should:

1. cite this routing model
2. declare where it relies on current runtime truth
3. declare where it relies on planning-target guidance
4. avoid introducing lane-local routing exceptions unless explicitly approved
