---
phase: 18
slug: context-and-research-phase-cr-for-skills-refactor-playbook-v
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-23
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Research/audit-only phase — no code changes. Validation focuses on deliverable completeness and evidence grounding.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | N/A (research/audit phase — no code tests) |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` (verify no regressions from Phase 17) |
| **Full suite command** | `npm test` (351 tests — verify no regressions) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + all 8 deliverables committed
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | CR-01 | — | CR-CONTEXT.md committed with ecosystem snapshot | manual-only | `test -f .planning/phases/18-*/CR-CONTEXT.md` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | CR-02 | — | CR-RESEARCH.md committed with grounded research | manual-only | `test -f .planning/phases/18-*/CR-RESEARCH.md` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 2 | CR-03 | — | CR-AUDIT-ECOSYSTEM.md committed with 6-NON grid | manual-only | `test -f .planning/phases/18-*/CR-AUDIT-ECOSYSTEM.md` | ❌ W0 | ⬜ pending |
| 18-02-02 | 02 | 2 | CR-04 | — | CR-GAP-MAP.md committed with cluster gaps | manual-only | `test -f .planning/phases/18-*/CR-GAP-MAP.md` | ❌ W0 | ⬜ pending |
| 18-03-01 | 03 | 3 | CR-05 | — | CR-THIRD-PARTY-HARVEST.md committed | manual-only | `test -f .planning/phases/18-*/CR-THIRD-PARTY-HARVEST.md` | ❌ W0 | ⬜ pending |
| 18-03-02 | 03 | 3 | CR-06 | — | CR-RUNTIME-READINESS.md committed | manual-only | `test -f .planning/phases/18-*/CR-RUNTIME-READINESS.md` | ❌ W0 | ⬜ pending |
| 18-04-01 | 04 | 4 | CR-07 | — | CR-DECISIONS.md committed with decision table | manual-only | `test -f .planning/phases/18-*/CR-DECISIONS.md` | ❌ W0 | ⬜ pending |
| 18-04-02 | 04 | 4 | CR-08 | — | CR-VERIFICATION.md committed | manual-only | `test -f .planning/phases/18-*/CR-VERIFICATION.md` | ❌ W0 | ⬜ pending |
| EXIT | — | 4 | EXIT | — | Stacked-workflow eval run | integration | Manual: load coordinating-loop + planning-with-files + phase-loop | ❌ W0 | ⬜ pending |
| EXIT | — | 4 | EXIT | — | check-overlaps.sh run and results attached | integration | `bash .opencode/skills/skill-synthesis/scripts/check-overlaps.sh` | ❌ W0 | ⬜ pending |
| EXIT | — | 4 | EXIT | — | User signs off in CR-DISCUSSION-LOG.md | manual-only | — | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- [ ] All 8 CR deliverable file paths defined (this document)
- [ ] `check-overlaps.sh` available at `.opencode/skills/skill-synthesis/scripts/check-overlaps.sh`
- [ ] `npm run typecheck` green (verify Phase 17 baseline)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ecosystem count matches I.1.2 table | CR-01 | Requires counting active skills vs playbook spec | `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ \| wc -l` → must match I.1.2 count |
| Every finding maps to 6-NON + cluster | CR-03, CR-04 | Requires semantic review of each finding | Spot-check 10% of audit grid rows |
| No verbatim third-party copy | CR-05 | Requires human judgment on abstraction quality | Grep for unique phrases from GSD/superpowers sources |
| Decision table < 20% "no change" rows | CR-07 | Requires counting decision categories | `grep -c "no change" CR-DECISIONS.md` must be < 5 rows |
| Stacked-workflow eval runs | EXIT | Requires loading 3 skills simultaneously | Load coordinating-loop + planning-with-files + phase-loop; verify all 3 activate |
| User sign-off | EXIT | Requires human approval | CR-DISCUSSION-LOG.md contains user "approved" message |
