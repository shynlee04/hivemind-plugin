# Phase 12 Reconciliation Note — 2026-04-14

## Purpose

This note is the authoritative reconciliation record for the Phase 09 / 09.1 / 09.2 planning corridor after the false-start repair shipped in Phase 12 Plan 01.

Use this file when deciding whether an older artifact is still trustworthy, partially trustworthy, or quarantined historical evidence only.

## Corrected runtime truth

- Before Phase 12 Plan 01, async builtin-subsession launches could report `running` / `started` from dispatch-level acknowledgements before the child passed the real D-10 start gate.
- Phase 09.1 and 09.2 improved completion checks, retry logic, parent coordination, and test coverage, but those efforts did **not** by themselves make start semantics truthful.
- Phase 12 Plan 01 is the first authoritative point where builtin-subsession children stay non-started until observer-confirmed evidence exists.

## Authoritative evidence after reconciliation

| Artifact | Authority | Why |
|---|---|---|
| `.planning/phases/12-correct-background-session-start-semantics-reconcile-phase-0/12-01-SUMMARY.md` | Authoritative | Records the repair that removed false-start promotion and the regression coverage that locked it in. |
| `.planning/debug/session-ses-2742-false-start-investigation-2026-04-14.md` | Authoritative forensic evidence | Captures the concrete false-start evidence chain that motivated the repair and quarantine. |
| `.planning/debug/phase-09-forensic-false-signals-2026-04-14.md` | Authoritative forensic evidence | Explains why Phase 09-family status claims needed a truth reset. |
| `.planning/phases/08-repair-durable-parent-observability-for-delegated-sessions/08-03-SUMMARY.md` | Authoritative sequencing pattern | Establishes the corrective-sequencing rule used to update roadmap/state/project artifacts after fresh verification evidence exists. |

## Quarantined or superseded artifacts

| Artifact | Status | Contaminated claim | Superseded by |
|---|---|---|---|
| `.planning/phases/09.2-completion-detection-architecture/09.2-02-SUMMARY.md` | QUARANTINED | Treated D-13/D-14 implementation/test status as if it also proved truthful runtime start semantics. | This note + `12-01-SUMMARY.md` |
| `.planning/phases/09.2-completion-detection-architecture/09.2-03-SUMMARY.md` | QUARANTINED | Claimed completion/start wiring was fully correct even though async launch still reported false starts. | This note + `12-01-SUMMARY.md` |
| `.planning/phases/09-sticky-delegation-corrective/09-01-SUMMARY.md` | Historical evidence only | Remains useful for module/work tracking, but not as proof that the end-to-end runtime was already truthful. | This note + later runtime verification artifacts |
| `.planning/phases/09.1-critical-bug-fixes-test-rewrites/09.1-VERIFICATION.md` | Historical evidence only | Confirms mock-heavy test progress, not live runtime truth. | This note + later runtime verification artifacts |

## Still-usable Phase 09-family content

- `09-CONTEXT.md` remains useful for the decision inventory (D-01 through D-30), but downstream planners must read it alongside this reconciliation note.
- `09.1-03-SUMMARY.md` remains useful for understanding the in-memory test harness pattern and why builtin-process coverage was constrained to the real seam.
- The 09.2 summaries remain useful as a map of code/modules/tests that existed, but not as authoritative closure documents.

## Planning rule after Phase 12

Downstream planning must inherit this corrected chain:

`Phase 02 baseline → Phase 08 corrective closure → Phase 09-family partial implementation + forensic reset → Phase 12 truthful start-semantics repair + reconciliation → next runtime verification / planning work`

Do **not** treat Phase 11 as the dependency placeholder for this corridor. The immediate planning baseline is the corrected runtime truth established by Phase 08 + Phase 12, plus the quarantined-but-still-auditable 09-family evidence.
