# Phase 08: repair-durable-parent-observability-for-delegated-sessions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 08-repair-durable-parent-observability-for-delegated-sessions
**Areas discussed:** Repair route, Parent-visible truth model, Verification breadth, Roadmap realignment, Baseline authority, Phase 08 disposition, Archive strategy, Follow-on phase for sticky delegation bugs

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

## Baseline authority

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Phase 02 locked | Treat Phase 02 as the verified baseline and use new root-cause findings for follow-on corrective work only. | ✓ |
| Reopen Phase 02 for audit | Re-audit the verified Phase 02 baseline before trusting later work. | |
| Invalidate Phase 02 baseline | Treat the new findings as enough to replace the verified baseline with a Phase 2B-style restart. | |

**User's choice:** Keep Phase 02 locked
**Notes:** The user chose to preserve the `18/18` verified Phase 02 baseline and not let the newer delegation root-cause note retroactively rewrite that architecture record.

---

## Phase 08 disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Bounded closure | Keep Phase 08 as the corrective closure lane and finish its docs/state cleanly. | ✓ |
| Reopen Phase 08 | Extend Phase 08 to absorb the broader sticky delegation bug family. | |
| Convert to restart lane | Use Phase 08 as the handoff into a broader reset/restart path. | |

**User's choice:** Bounded closure
**Notes:** The user kept Phase 08 aligned with the project and roadmap framing: a narrow corrective corridor, not a new umbrella redesign phase.

---

## Archive strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Archive Phase 08 only after closure | Finalize Phase 08 summaries/state first, then audit/archive Phase 08 while leaving Phase 02 untouched. | ✓ |
| Audit both Phase 02 and Phase 08 now | Perform a joint audit before deciding whether either phase should be archived. | |
| Archive neither yet | Keep both phases open until a new corrective plan exists. | |

**User's choice:** Archive Phase 08 only after closure
**Notes:** The user explicitly rejected a both-phase archive/reset move and instead chose to finish Phase 08 bookkeeping before any archival step.

---

## Follow-on phase for sticky delegation bugs

| Option | Description | Selected |
|--------|-------------|----------|
| Create new corrective phase | Treat the root-cause findings as evidence for a separate corrective phase. | ✓ |
| Fold into later planning | Carry the findings forward without creating a dedicated corrective phase. | |
| Use as Phase 2B restart | Turn the findings into a restart path that replaces the current verified/corrective sequence. | |

**User's choice:** Create new corrective phase
**Notes:** The user wants the broader sticky delegation-model gaps handled explicitly, but as new corrective work rather than as a rewrite of Phase 02 or Phase 08 history.

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
- Any attempt to invalidate Phase 02 from the new root-cause note alone.
- Any joint Phase 02 + Phase 08 archive/restart move before Phase 08 closure reconciliation is complete.
