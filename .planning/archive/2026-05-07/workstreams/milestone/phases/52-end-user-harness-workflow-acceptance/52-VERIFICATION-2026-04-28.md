---
phase: 52-end-user-harness-workflow-acceptance
artifact: phase-verification-frame
created: 2026-04-28
status: pending-pre-planning
evidence_posture: no_completion_claims
---

# Phase 52 Verification Frame: End-User Harness Workflow Acceptance

## Current Verdict

**PENDING — VERIFICATION HAS NOT HAPPENED YET.** This artifact is a pre-planning verification frame only. It defines what Phase 52 must prove and what evidence levels are required before anyone may claim end-user harness workflow acceptance.

## Why Verification Is Still Pending

- `52-RUNTIME-EVIDENCE-HANDOFF-2026-04-28.md` already says release/acceptance fails until fresh L1/L2 runtime proof exists.
- Phase 49 local verification explicitly says live external OpenCode/provider runtime proof remains partial.
- Phase 51 grounding explicitly says provider-backed live session completion is not claimed.
- `.planning/codebase/CONCERNS.md` documents that there is still no E2E delegation lifecycle integration test surface proving the full chain.

## Required Evidence Levels

| Workflow Claim | Minimum Evidence | Why |
|---|---:|---|
| Parent session can dispatch a specialist and observe terminal completion | L1 + L2 | Acceptance requires a real runtime session plus persisted continuity/lineage evidence |
| `delegation-status` returns honest transitions during the live run | L1 | Needs real state progression, not replayed mock data |
| `run-background-command` supports run → output → list → terminate on the same workflow | L1 | Historical UAT defects were user-visible and runtime-specific |
| Journal/lineage export reflects the same acceptance run without silent relabeling | L1 + L2 | Must prove both surfaced output and persisted evidence chain |
| Restart/recovery resumes without false completion | L1 + L2 | Recovery truth depends on persisted state, not documentation |
| Stack/research guidance is usable inside a real acceptance workflow | L1 | Loader discoverability alone is insufficient |
| Full regression safety after acceptance fixes | L3 | Package-level automated verification is still required after runtime proof |

## Verification Matrix

| Scenario | Claim to Verify | Required Evidence | Pending Output |
|---|---|---|---|
| V52-01 Delegation lifecycle | parent → child → terminal result works end-to-end | L1 session transcript + L2 continuity/delegation record | acceptance transcript + artifact paths |
| V52-02 PTY/background command lifecycle | command run/output/list/terminate is trustworthy in the same workflow | L1 runtime transcript | captured tool outputs and terminal outcome |
| V52-03 Journal/lineage truth | export reflects the same workflow and uses real filters | L1 export output + L2 journal/lineage files | filtered export evidence |
| V52-04 Primitive readiness in-user-flow | configure/read/inspect/dry-run + validate-restart do not corrupt runtime boundaries | L1 tool run + L2 persisted state inspection | before/after boundary evidence |
| V52-05 Interruption and recovery | interrupted run resumes from `.hivemind` truthfully | L1 interrupted session + L2 persisted records | recovery transcript |
| V52-06 Stack/research guidance usability | Phase 51 grounded guidance routes to a useful next action in a real flow | L1 user-facing guidance transcript | actionability note |

## Anti-False-Completion Rules

1. Do not count focused tests, typecheck, build, or static file inspection as acceptance completion.
2. Do not inherit a PASS verdict from Phases 49-51.
3. Do not use `session-ses_22ee.md` as current proof; use it only as regression input.
4. If a scenario is environment-blocked, classify it as blocked/partial rather than passed.
5. If L1 exists without matching L2 persisted evidence for recovery-sensitive flows, the acceptance claim stays partial.

## Commands / Actions Expected Before Final Verification

- Real `delegate-task` invocation from a parent session.
- Real `delegation-status` polling through terminal state.
- Real `run-background-command` lifecycle using supported action names.
- Real `session-journal-export` on the same workflow.
- Real `configure-primitive` and `validate-restart` checks around the same run.
- Real interruption/recovery sequence using persisted `.hivemind` state.
- Fresh `npm run typecheck`, `npm test`, and `npm run build` after any execution-driven code changes.

## Final Verification Gate

Phase 52 may be marked verified only when:

1. All required acceptance scenarios are executed or explicitly classified blocked with evidence.
2. The end-to-end workflow has at least one L1 live run and matching L2 persisted evidence.
3. Any code changes triggered by acceptance failures are covered by fresh L3 automated verification.
4. The final artifact honestly distinguishes pass, partial, fail, and blocked cases.
