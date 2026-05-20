---
phase: 17-sync-boundary-definition-src-audit-and-cleanup
plan: 02
subsystem: src-audit
tags: schema-kernel, tools, hooks, toggle-gates, dead-code, test-coverage

requires:
  - phase: 17-01
    provides: shared/, config/, routing/ audit findings + FINDINGS.md baseline

provides:
  - Full audit of src/schema-kernel/ (20 files, 2,529 LOC) — 2 dead schemas, 14 active
  - Full audit of src/tools/ (30 files, 3,961 LOC) — all 22 tools wired, prompt tools tested
  - Full audit of src/hooks/ (16 files, 1,529 LOC) — toggle-gates.ts confirmed dead
  - 3 corrections to RESEARCH.md claims

affects:
  - Phase 18 cleanup execution (will use these findings for dead code removal)
  - RESEARCH.md accuracy (3 claims need updating)

tech-stack:
  added: []
  patterns:
    - "Manual file-by-file audit with grep verification for import tracing and dead code detection"
    - "Barrel re-export patterns verified against actual consumer imports"

key-files:
  created: []
  modified:
    - .planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md

key-decisions:
  - "3 dead code files identified for Phase 18 deletion: permission.schema.ts, tool-definition.schema.ts, toggle-gates.ts"
  - "No CQRS violations found — all hooks comply with read-side constraint"
  - "toggle-gates.ts is dead despite TOG-01 being marked DELIVERED in REQUIREMENTS.md"

patterns-established: []

requirements-completed: []

duration: 2min
completed: 2026-05-20
---

# Phase 17 Plan 02: schema-kernel/, tools/, hooks/ Audit Summary

**Discovery-only audit of validation contracts, tool entrypoints, and CQRS read-side hooks — 3 dead code files found, 3 RESEARCH.md corrections identified**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-20T11:16:29Z
- **Completed:** 2026-05-20T11:19:28Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments

- **schema-kernel/** (20 files, 2,529 LOC): 13 active schemas with confirmed consumers, **2 dead schemas** (permission.schema.ts, tool-definition.schema.ts) with 0 external importers. No module size violations. Corrected RESEARCH.md: generate-config-json-schema.ts IS runtime code.
- **tools/** (30 files, 3,961 LOC): All 22 tool factories registered in plugin.ts. **Corrected RESEARCH.md:** prompt sub-tools (prompt-analyze, prompt-skim, session-patch) DO have dedicated tests. configure-primitive.ts at 490 LOC near cap but within limits. No unified tool registry confirmed (f-03c PARTIAL).
- **hooks/** (16 files, 1,529 LOC): **toggle-gates.ts CONFIRMED DEAD** — zero external importers from src/, not wired in plugin.ts. All other 12 hook factories actively wired. Excellent test coverage (19 test files across all 5 submodules). No CQRS violations found.

## Task Commits

1. **Tasks 1-3: schema-kernel, tools, hooks findings** — `ca06aadc` (feat)

## Files Created/Modified

- `.planning/phases/17-sync-boundary-definition-src-audit-and-cleanup/17-FINDINGS.md` — Plan 02 section appended (274 lines added, total 454 lines)

## Decisions Made

- 3 dead code files classified for Phase 18 deletion: permission.schema.ts (bug: "ask" duplicated in enum), tool-definition.schema.ts (OpenCode SDK provides equivalent), toggle-gates.ts (helper functions never called)
- toggle-gates.ts: despite REQUIREMENTS.md marking TOG-01 as DELIVERED, the dedicated hook-based toggle-gates module has 0 consumers in src/. The config system handles toggles directly — toggle-gates.ts is a vestigial wrapper
- No CQRS violations found across hooks — cqrs-boundary.ts enforcement is effective
- RESEARCH.md needs 3 corrections: (1) generate-config-json-schema is runtime code, not build-time; (2) prompt sub-tools HAVE tests; (3) tool count is 22 not 23

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks completed as discovery-only audit with no blockers.

## Next Phase Readiness

- Findings report complete with clear "DELETE" recommendations for 3 dead files
- Phase 18 can execute on findings: delete permission.schema.ts, tool-definition.schema.ts, toggle-gates.ts
- Phase 18 should also correct 3 RESEARCH.md inaccuracies identified above
- No remaining audit work for schema-kernel/, tools/, hooks/

---

*Phase: 17-sync-boundary-definition-src-audit-and-cleanup*
*Completed: 2026-05-20*
