# Phase 08: repair-durable-parent-observability-for-delegated-sessions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 08-repair-durable-parent-observability-for-delegated-sessions
**Areas discussed:** Repair route, Parent-visible truth model, Verification breadth, Roadmap realignment

---

## Repair route

| Option | Description | Selected |
|--------|-------------|----------|
| Bundle both corrective seams together | Repair parent observability and the linked `runtimePolicyOverride` producer/persistence seam in one corrective closure lane. | ✓ |
| Observability-first | Repair parent-visible truth first and leave the metadata seam for later closure. | |
| Policy-override-first | Close the session-override seam first and defer parent observability durability. | |

**User's choice:** Bundle both corrective seams together
**Notes:** Approved as the strongest route because the Phase 8 scope lock already warns against false closure if notifications are repaired without the linked continuity/metadata seam.

---

## Parent-visible truth model

| Option | Description | Selected |
|--------|-------------|----------|
| Continuity-backed lifecycle truth | Parent-visible truth derives from canonical continuity plus lifecycle reconciliation across async boundaries. | ✓ |
| Event-stream-first | Parent truth primarily follows observer events, with continuity as secondary record. | |
| Mixed ad hoc | Different execution paths may surface parent-visible truth differently depending on submode. | |

**User's choice:** Continuity-backed lifecycle truth
**Notes:** Approved to preserve the repo’s continuity-first architecture and avoid introducing a second competing truth model for async delegation state.

---

## Verification breadth

| Option | Description | Selected |
|--------|-------------|----------|
| Corrective corridor only | Verify parent-visible `started/completed/failed`, async lifecycle reconciliation, override seam write -> persist -> reload -> enforcement, then re-run Phase 02 verification. | ✓ |
| Include nested supervision depth | Extend Phase 8 verification to deeper supervision semantics now. | |
| Broader delegation hardening | Pull in wider background/delegation hardening beyond the original defect corridor. | |

**User's choice:** Corrective corridor only
**Notes:** Approved to keep Phase 8 bounded and corrective rather than letting it expand into a generalized delegation hardening phase.

---

## Roadmap realignment

| Option | Description | Selected |
|--------|-------------|----------|
| Make the dependency correction explicit now | Record that Phase 8 sits between Phase 02 implementation and Phase 02 re-verification, not after Phase 7. | ✓ |
| Keep it implied in Phase 8 docs only | Leave the broader roadmap wording untouched for now. | |
| Defer roadmap correction | Discuss the repair route now and update ownership/ordering later. | |

**User's choice:** Make the dependency correction explicit now
**Notes:** Approved because the current roadmap and Phase 8 scope-lock still contradict each other, which would otherwise keep downstream planning confused.

---

## the agent's Discretion

- Exact planning structure and naming of sub-lanes within the bundled corrective closure.
- Exact bounded/full verification command mix used to prove the corrective corridor and trigger Phase 02 re-verification.
- Exact artifact wording used to reconcile roadmap ownership and dependency direction.

## Deferred Ideas

- Broad redesign of all delegation behavior.
- General live-steering platform expansion beyond the inherited defect corridor.
- Runtime-domain restructuring work that belongs to Phase 07 and later phases.
- Broader delegation hardening beyond the specific Phase 02 closure lane.
