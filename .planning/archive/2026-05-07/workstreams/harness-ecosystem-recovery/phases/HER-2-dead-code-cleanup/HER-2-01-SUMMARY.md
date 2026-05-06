---
phase: HER-2
plan: 01
subsystem: dead-code-cleanup
tags: [dead-code, cleanup, source-removal, test-removal]
depends_on: [HER-1]
requires: [HER-2-A, HER-2-B]
provides: "4 dead module groups removed, ~1,511 LOC source + ~955 LOC tests deleted"
affects: [src/lib/, tests/lib/]
tech-stack:
  added: []
  patterns: [self-contained-module, barrel-exports]
key-files:
  created: [HER-2-01-SUMMARY.md]
  modified: [src/lib/runtime-detection/stack-synthesizer.ts, src/lib/runtime-detection/index.ts, src/lib/recovery/create-checkpoint.ts]
  removed:
    - src/lib/work-contract/ (5 files, 613 LOC)
    - src/lib/supervisor/ (5 files, 419 LOC)
    - src/lib/recovery-engine.ts (72 LOC)
    - src/lib/runtime-detection/codemap.ts (~120 LOC)
    - src/lib/runtime-detection/codescan.ts (~180 LOC)
    - src/lib/runtime-detection/file-watcher.ts (~107 LOC)
    - tests/lib/work-contract/ (4 test files)
    - tests/lib/supervisor/ (4 test files)
    - tests/lib/recovery-engine.test.ts
    - tests/lib/runtime-detection/codemap.test.ts
    - tests/lib/runtime-detection/codescan.test.ts
    - tests/lib/runtime-detection/file-watcher.test.ts
decisions:
  - "Kept stack-synthesizer.ts as self-contained utility with minimal fs scanning"
  - "Used camelCase (fileCount, byExtension) for SimpleCodemap to match existing test expectations"
  - "Deleted 12 test files for removed modules rather than updating them"
metrics:
  duration: "~1.5 hours"
  completed_date: "2026-05-05"
---

# Phase HER-2 Plan 01: Dead Code Removal Summary

**One-liner:** Removed 4 confirmed dead module groups (work-contract/, supervisor/, recovery-engine.ts, runtime-detection dead files) totaling ~1,511 source LOC + ~955 test LOC.

## Plan Execution

| Task | Description | Commit | LOC Impact |
|------|-------------|--------|------------|
| 1 | Remove work-contract/ directory | `4ea6e796` | -613 LOC (5 files) |
| 2 | Remove supervisor/ directory | `c8ce6314` | -419 LOC (5 files) |
| 3 | Remove recovery-engine.ts facade | `ff80329b` | -72 LOC (1 file) |
| 4 | Remove runtime-detection/ dead files + update barrel | `01a8aa9d` | -407 LOC (3 files), +64 LOC (rewrite) |
| Fix | Remove dead test files + fix stack-synthesizer | `575a6a23` | -955 LOC (12 test files), +67 LOC (fixes) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] stack-synthesizer.ts had internal imports from deleted files**
- **Found during:** Task 4
- **Issue:** `stack-synthesizer.ts` imported `buildCodemap` from `./codemap.js` and `scanCodebase` from `./codescan.js` — both deleted. Type errors blocked typecheck.
- **Fix:** Rewrote stack-synthesizer.ts to be self-contained with minimal `readdirSync`-based file scanning and inlined `SimpleCodemap`/`SimpleCodeScan` types. Preserved `synthesizeTechStack()` function signature and `SynthesizedStack` export type.
- **Files modified:** `src/lib/runtime-detection/stack-synthesizer.ts`
- **Commit:** `01a8aa9d`, `575a6a23`

**2. [Rule 2 - Missing Critical Functionality] 12 test files for deleted modules left broken**
- **Found during:** Full verification
- **Issue:** Tests importing from deleted source files caused 12 suite failures (cannot find module).
- **Fix:** Deleted all test files for removed modules:
  - `tests/lib/work-contract/` (4 files)
  - `tests/lib/supervisor/` (4 files)
  - `tests/lib/recovery-engine.test.ts`
  - `tests/lib/runtime-detection/codemap.test.ts`
  - `tests/lib/runtime-detection/codescan.test.ts`
  - `tests/lib/runtime-detection/file-watcher.test.ts`
- **Files modified:** 12 files deleted
- **Commit:** `575a6a23`

**3. [Rule 1 - Bug] Stale JSDoc reference to deleted recovery-engine.ts**
- **Found during:** Dead code audit
- **Issue:** `src/lib/recovery/create-checkpoint.ts:6` had `{@link ../recovery-engine.ts | recovery-engine.repair}` JSDoc reference.
- **Fix:** Updated to `{@link ... | via the recovery subsystem modules}`
- **Files modified:** `src/lib/recovery/create-checkpoint.ts`
- **Commit:** `575a6a23`

## Verification Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run build` | ✅ succeeds |
| `npm test` | ✅ 1610/1612 pass (2 pre-existing session-journal failures) |
| Dead code audit | ✅ No references to removed modules |
| `src/lib/work-contract/` exists | ✅ REMOVED |
| `src/lib/supervisor/` exists | ✅ REMOVED |
| `src/lib/recovery-engine.ts` exists | ✅ REMOVED |
| `src/lib/runtime-detection/codemap.ts` exists | ✅ REMOVED |
| `src/lib/runtime-detection/codescan.ts` exists | ✅ REMOVED |
| `src/lib/runtime-detection/file-watcher.ts` exists | ✅ REMOVED |

## Known Stubs

None. All removed modules are fully gone; kept `stack-synthesizer.ts` is a working self-contained module with actual filesystem scanning.

## Threat Flags

None. This plan only removed dead code with zero runtime consumers — no new attack surface introduced.

## Self-Check

- [x] `HER-2-01-SUMMARY.md` created
- [x] All 5 commits exist and are verified
- [x] Typecheck passes (0 errors)
- [x] Build succeeds
- [x] Tests pass (1610/1612, 2 pre-existing failures only)
- [x] Dead code audit clean
