---
phase: 17-sync-boundary-definition-src-audit-and-cleanup
plan: 04
subsystem: src-audit
tags: features, session-tracker, bootstrap, steering-engine, cli, sidecar, harness, kernel, dead-code, noise, size-violation, executive-summary

# Dependency graph
requires:
  - phase: 17-03
    provides: coordination/ and task-management/ audit findings in FINDINGS.md

provides:
  - "Complete audit of src/features/ (11 submodules, 71 files, 13,473 LOC)"
  - "Complete audit of src/cli/ (9 files, 1,378 LOC)"
  - "Complete audit of src/sidecar/ (1 file, 120 LOC)"
  - "Duplicate stub confirmation: src/harness/ = src/kernel/ (both .gitkeep only)"
  - "Final compiled 17-FINDINGS.md with Executive Summary, 60 sequentially numbered findings, and Phase 18 readiness assessment"

affects:
  - "Phase 18 — root cleanup and sync boundary implementation (will execute on these findings)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual file-by-file audit per D-10"
    - "60 findings sequentially numbered F-01 through F-60"
    - "Findings categorized: dead, noise, context-rot, test-gap, size-violation"

key-files:
  created:
    - ".planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-04-SUMMARY.md"
  modified:
    - ".planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md"

key-decisions:
  - "session-tracker/index.ts is 561 LOC, NOT 1035 (RESEARCH.md correction) — still over 500 cap"
  - "runtime-detection/ (195 LOC) CONFIRMED DEAD — 0 importers across src/"
  - "steering-engine/ (3 files, 609 LOC) CONFIRMED DEAD — 0 importers across src/"
  - "auto-loop/ and ralph-loop/ NOT stubs and HAVE tests (correction to RESEARCH.md)"
  - "cli/ (9 files, 1,378 LOC) — well-tested, clean, no issues"
  - "sidecar/readonly-state.ts — 0 consumers (forward-looking Q2 infrastructure, not technically dead)"
  - "harness/ and kernel/ — empty duplicate stubs; keep kernel/, delete harness/"
  - "plugin.ts verified at 493 LOC (correct, under 500 cap)"
  - "session-tracker/index.ts verified at 561 LOC (still over 500 cap per ARCHITECTURE.md)"

requirements-completed: []

# Metrics
duration: 7 min
completed: 2026-05-20
---

# Phase 17 Plan 04: features/, cli/, sidecar/, harness/kernel/ Audit + Executive Summary

**Discovery-only audit of the largest remaining modules (features/ at 71 files, 13,473 LOC) plus lowest-risk passes (cli/, sidecar/, harness/kernel/), followed by compilation of the complete 60-finding structured report with Executive Summary**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-20T11:30:00Z
- **Completed:** 2026-05-20T11:37:00Z
- **Tasks:** 3
- **Files modified:** 1 (FINDINGS.md — +326 lines)

## Accomplishments

- **features/session-tracker (27 files, 7,745 LOC):** All files active with excellent test coverage (45 test files). index.ts at 561 LOC — over the 500 ARCHITECTURE cap but NOT the 1035 LOC the RESEARCH.md claimed. Correction documented. No event-tracker remnants found.
- **features/bootstrap (12 files, 2,454 LOC):** `runtime-detection/` (2 files, 195 LOC) CONFIRMED DEAD — zero importers across src/. `control-plane/` submodule IS wired through public API (src/index.ts). No dead re-exports (no barrel index.ts exists).
- **features/steering-engine (3 files, 609 LOC):** CONFIRMED DEAD — zero importers from anywhere in src/. Not wired in plugin.ts, not exported from src/index.ts. No tests. Recommend deletion in Phase 18.
- **features/ (remaining 8 submodules, 29 files, 2,665 LOC):** All active with confirmed importers and test coverage. Corrected RESEARCH.md: auto-loop and ralph-loop DO have dedicated tests (2 each), they ARE real logic (not stubs), and they ARE wired through coordination/spawner/.
- **cli/ (9 files, 1,378 LOC):** Well-tested (8 dedicated test files), clean. No issues.
- **sidecar/ (1 file, 120 LOC):** 0 consumers from src/ but is forward-looking Q2 infrastructure. Keep.
- **harness/ vs kernel/:** Both contain only `.gitkeep`. Zero importers. Identical. Recommendation: keep `src/kernel/`, delete `src/harness/`.
- **plugin.ts:** Verified at 493 LOC (under the 500 ARCHITECTURE cap — confirmed correct).
- **Final compilation:** Pre-pended Executive Summary with category/severity counts, Top 5 Critical Findings, and Phase 18 Readiness assessment (12 recommended actions). All 60 findings sequentially numbered F-01 through F-60.

## Task Commits

Each task was committed atomically:

1. **Task 1+2: Audit features/, cli/, sidecar/, harness/kernel/** — `eec3cedd` (audit: Plan 04 findings)
2. **Task 3: Compile Executive Summary + renumber** — `a184d847` (docs: compile final FINDINGS.md)

**Plan metadata:** `pending` (see below)

_Note: Task 1 and Task 2 write to same file section, so both are in a single commit._

## Files Modified

- `.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md` — Final compiled report: Executive Summary + Plans 01-04 sections + 60 findings, 1,091 LOC

## Decisions Made

- **session-tracker/index.ts LOC correction:** RESEARCH.md claimed 1035 LOC; actual is 561 LOC. Size-violation still exists (over 500 cap) but is ~half of what was claimed.
- **auto-loop/ralph-loop RESEARCH.md correction:** Both have 2 dedicated test files each — RESEARCH.md's "NO tests" claim is incorrect. Both contain real logic (not stubs).
- **harness/ kernel/ recommendation:** Keep `src/kernel/` (more descriptive), delete `src/harness/` in Phase 18. If both remain empty after Phase 18, delete both.
- **sidecar/ status:** Not technically dead — it's forward-looking Q2 dashboard infrastructure. Keep for future use.
- **steering-engine/:** Likely replaced by current session-tracker architecture during CP-ST rewrites. Entire 3-file submodule should be deleted in Phase 18.
- **runtime-detection/:** Never was wired. Delete in Phase 18.

## Deviations from Plan

None — plan executed exactly as written. All three tasks completed per specification.

## Major RESEARCH.md Correations Found

| Finding | RESEARCH.md Claim | Actual |
|---------|-------------------|--------|
| session-tracker/index.ts LOC | 1035 | 561 |
| steering-engine/ LOC | 609 | 609 (confirmed) |
| auto-loop tests | "NO tests" | 2 test files exist |
| ralph-loop tests | "NO tests" | 2 test files exist |
| auto-loop stubs | Implied stub | Real AutoLoopEngine class (42 LOC logic) |
| ralph-loop stubs | Implied stub | Real RalphLoopEngine class (38 LOC logic) |

## User Setup Required

None — discovery-only audit, no external service configuration required.

## Next Phase Readiness

**Phase 17 COMPLETE.** The complete findings report (1,091 LOC, 60 findings across 15 modules) is ready for Phase 18 consumption.

**Phase 18 should execute on these 12 recommended actions (in priority order):**

1. Delete `src/task-management/recovery/` (5 files, 763 LOC) + test files
2. Delete `src/features/steering-engine/` (3 files, 609 LOC)
3. Delete `src/harness/` (empty duplicate of `src/kernel/`)
4. Delete `src/features/bootstrap/runtime-detection/` (2 files, 195 LOC)
5. Delete `src/hooks/transforms/toggle-gates.ts` (83 LOC) + test file
6. Delete `src/schema-kernel/permission.schema.ts` (168 LOC, bug: "ask" duplicated)
7. Delete `src/schema-kernel/tool-definition.schema.ts` (74 LOC)
8. Split `src/features/session-tracker/index.ts` (561 LOC → target under 500)
9. Convert continuity/index.ts `storeCache` singleton to class-based instance
10. Correct 12 RESEARCH.md inaccuracies identified during this audit
11. Update tool count in RESEARCH.md from 23 to 22
12. Consider adding a unified tool registry (f-03c PARTIAL gap)

---

*Phase: 17-sync-boundary-definition-src-audit-and-cleanup*
*Completed: 2026-05-20*
