# Phase 8 Scope Lock

**Date:** 2026-04-10
**Status:** Cycle 1 approved
**Phase:** 08-repair-durable-parent-observability-for-delegated-sessions
**Planning mode:** High-level only

## Reclassification

Phase 8 is a corrective closure phase for defects caused by Phase 2, not a normal downstream phase after Phase 7.

Working dependency correction:

`Phase 02 implemented baseline -> Phase 08 corrective closure -> Phase 02 re-verification -> Phase 07 planning and later phases`

## Scope Boundary

Phase 8 owns only the runtime corridor defects inherited from Phase 2 that prevent trustworthy delegated-session observability and verified closure.

Included boundary:

- Durable parent observability for delegated sessions
- Parent notification durability across started, completed, and failed outcomes
- Observer/lifecycle truth reconciliation where async child outcomes can diverge from parent-visible state
- Any tightly coupled continuity/delegation metadata seam required to make the above verifiable
- Phase 02 re-verification gate after Phase 8 completes

Explicitly excluded from Phase 8:

- Broad redesign of all delegation behavior
- General live-steering platform expansion beyond what is needed to close the inherited Phase 2 defect corridor
- Runtime domain restructuring work that belongs to Phase 7
- New feature expansion outside the corrective closure lane

## Ownership Decision

Phase 8 is allowed to solve defects introduced or exposed by Phase 2 when those defects sit in the same continuity, lifecycle, delegation, and parent-observability corridor.

This means Phase 8 may bundle:

- the durable parent observability seam
- any inseparable Phase 2 producer/persistence seam needed for verified closure

This does not yet authorize implementation detail or execution planning.

## Risks

- Scope creep into "fix all delegation"
- False closure if notifications are repaired without closing the linked continuity/metadata seam
- Roadmap confusion if the dependency correction is not carried forward into later planning artifacts

## Next Checkpoint

Cycle 2 requires explicit authorization.

Cycle 2 will choose the high-level repair route:

1. Bundle both corrective seams together
2. Observability-first route
3. Policy-override-first route
