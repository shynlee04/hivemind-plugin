# Hivefiver Devin Reconciliation

Date: 2026-03-06
Status: active-reconciled-baseline
Type: external-synthesis-reconciliation

## Purpose

This document validates the returned external synthesis against current repo truth.

It exists to prevent three failures:

- treating external recommendations as if they are already implemented
- preserving an outdated local six-track model after better repo-specific pressure-testing
- carrying contradicted claims forward into phase planning

This is a reconciliation artifact, not an implementation specification.
It defines what is verified now, what is accepted as the next planning model, and what remains only a future option.

## Verified Repo Truth

These points are materially supported by the current repository:

- `hivefiver` already has real framework-facing surfaces for doctor, audit, tutor, bridge, persona routing, and workflow adaptation.
- the tri-persona model is real and already represented by separate workflow YAMLs.
- the current runtime persona router is not the same thing as the planning-lane taxonomy.
- the current runtime persona selection is still heuristic and lighter-weight than the richer scoring model described in the persona skill.
- workflow-level gates already exist and differ by persona and risk level.
- current schemas already support dependency-aware and related-entity-aware continuity.
- current governance already exposes relevant health signals such as `drift_score`, `pending_failure_ack`, and acceptance-note handling.
- current state authority remains split intentionally across `brain.json`, `hierarchy.json`, and `graph/*.json`.
- the effective runtime delegation topology enforced by the governance plugin is stricter than some `hivefiver` agent-profile documentation.

## Accepted Planning Adjustments

The returned synthesis surfaced one local design change that should now be accepted for planning:

1. Replace the local six-track `hivefiver` model with a five-lane model.

The accepted lane set is:

- Diagnose
- Repair/Refactor
- Tailored Build
- Guidance
- Composition

The reason for the merge is local and practical:

- the repo already shares much of the same brownfield, repair, and compatibility pressure between repair and refactor work
- keeping them separate too early creates an intake ambiguity before enough evidence exists
- the better distinction at planning time is not separate lanes, but orientation within one lane:
  - `stabilize`
  - `extend`

2. Keep adaptive routing primarily at the workflow layer, while acknowledging that command- and library-level intent classification still exists today.

3. Accept topology-aware routing as a planning requirement, but not as current implemented truth.

4. Accept diagnosis-first routing as the preferred planning model for unstable or polluted framework states, but do not claim the full hard-block matrix is already encoded programmatically.

## Partially Verified And Still Planning-Only

These ideas are useful and should shape phase planning, but they are not yet current repo truth:

- explicit topology fielding for `singular | paired | stacked | chained`
- lane-specific hard-block triggers encoded directly in `gatekeeper.ts`
- chained package continuity rules enforced at every package boundary
- diagnosis counters or anti-paralysis escalation in brain state
- guidance-lane diagnostic preamble behavior as a formalized workflow rule

These belong in later planning and implementation cycles if approved.

## Contradicted Or Overstated Claims

These parts of the returned synthesis must not be carried forward as current truth:

1. The delegation picture is split between documentation and runtime enforcement.

Current repo truth:

- `agents/hivefiver.md` currently lists `hivemaker` and `hivehealer` as allowed targets
- the governance plugin delegation topology currently restricts `hivefiver` to a narrower runtime set
- phase planning must treat this as a real mismatch to resolve later, not as settled clean behavior

2. Some cited brownfield scan surfaces are not present under the exact file names claimed by the returned synthesis.

Current repo truth:

- the reasoning direction may still be useful
- the exact file-path claims are not reliable enough to treat as verified evidence

3. `export_cycle` is not the literal currently allowed primary tool surface for `hivefiver`.

Current repo truth:

- `hivemind_cycle` is allowed
- `export_cycle` remains conceptually important in some docs, but the actual agent permission surface differs

4. Broad whole-project `hivefiver` scope language is not the same as current enforced runtime boundaries.

Current repo truth:

- some high-level docs describe a broader pivoted scope
- actual agent-profile and governance boundaries still forbid `src/**` and `tests/**` for `hivefiver`
- phase planning should treat broader whole-project scope as aspiration or future policy work, not as current implemented authority

## Reconciled Planning Model

Use this as the stable local planning model going into phase planning:

### Lane Set

- Diagnose
- Repair/Refactor
- Tailored Build
- Guidance
- Composition

### Adaptive Dimensions

- project stage
- user technology awareness
- package topology
- risk surface
- lineage boundary

### Boundary Rule

`hivefiver` remains the framework-facing lineage.
Phase planning must keep lineage boundaries explicit and avoid flattening `hivefiver` into a generic product executor.
It must also distinguish:

- documented/profile delegation allowance
- effective runtime delegation enforcement
- broad strategic scope language
- actual enforced write and delegation boundaries

### State Rule

- no fourth state store
- `brain.json` remains hot session metadata authority
- `hierarchy.json` remains tree-first navigation authority
- `graph/*.json` remains structured continuity and relationship context

## What Is Now Ready

The packet set is now ready to phase into approval-gated planning for:

- lane-specific phase plans
- topology-aware routing plans
- diagnosis-first gate design
- lineage-boundary hardening where current repo contracts are still looser than the desired long-haul shape
- planning-root integration that classifies current continuity artifacts as active, transitional, or historical

## What Is Not Ready

The packet set is not yet authorizing:

- command or workflow implementation changes
- agent permission changes
- new state stores
- direct claims that the stricter bridge-only lineage model already exists

## Next Approved Planning Move

The next cycle should convert this reconciled five-lane model into a phase-planning packet set.

That packet set should stay high level and approval-gated.
It should define:

- the phase order
- the approval point between phases
- the validation expectations for each phase
- which items are planning-only versus later implementation candidates
