---
phase: C4-Performance-Optimization
plan: 03
subsystem: governance-engine, tools/config
tags: [performance, execFile, async-fs, bootstrap-init]
requires: [C4-02]
provides: [execFileAsync, async-FS-in-bootstrapInit]
affects:
  - src/features/governance-engine/create-governance-session.ts
  - src/tools/config/bootstrap-init.ts
tech-stack:
  added: []
  patterns: [manual-Promise-wrapper-over-execFile, fs/promises-for-tool-path]
key-files:
  created: []
  modified:
    - src/features/governance-engine/create-governance-session.ts
    - src/tools/config/bootstrap-init.ts
    - tests/features/governance-engine/create-governance-session.test.ts
decisions:
  - "Manual Promise wrapper around execFile used instead of util.promisify to remain mock-friendly in tests"
  - "mkdirSync and readFileSync preserved in import for CLI-only sync helpers (readInstalledPackageVersion, readTrackedVersion, resolveBootstrapScope, copyPrimitive)"
  - "existsSync kept in both paths (no async equivalent in fs.promises)"
metrics:
  duration: ~10 minutes
  completed: 2026-05-28
  tasks-completed: 2/2
  files-created: 0
  files-modified: 3
---

# Phase C4 Plan 03: execFile Async + Async FS Conversion Summary

Fixed two event-loop blocking concerns: `execSync` in `create-governance-session.ts` (REQ-04) and synchronous FS in `bootstrap-init.ts` tool path (REQ-02).

## One-liner

Replaced `execSync` with manual async `execFile` wrapper for git operations in governance session creation, and converted `bootstrapInit` tool path from sync FS (`mkdirSync`/`writeFileSync`/`readFileSync`) to `fs/promises` equivalents.

## Execution

| Task | Name | Status | Commit | Files |
|------|------|--------|--------|-------|
| 1 | Replace execSync with execFile async in create-governance-session.ts | ✅ Done | f91b992b | `src/features/governance-engine/create-governance-session.ts`, `tests/features/governance-engine/create-governance-session.test.ts` |
| 2 | Convert sync FS to async in bootstrap-init tool path | ✅ Done | af701e27 | `src/tools/config/bootstrap-init.ts` |

### Task 1 Detail
**Action:** Modified `create-governance-session.ts`:
- Replaced `import { execSync }` with `import { execFile }` + type-only `ExecFileOptions` import
- Added manual `execFileAsync` Promise wrapper (avoiding `util.promisify` for test mock compatibility)
- Split `execSync("git add -A && git commit -m ...")` into separate `execFileAsync("git", ["add", "-A"])` and `execFileAsync("git", ["commit", "-m", ..., "--no-verify"])` calls
- Preserved best-effort semantics with empty catch block
- Updated test mock to use callback pattern for `execFile`

### Task 2 Detail
**Action:** Modified `bootstrap-init.ts`:
- Added `import { mkdir, readFile, writeFile } from "node:fs/promises"`
- Converted `bootstrapInit` function: `mkdirSync` → `await mkdir`, `writeFileSync` → `await writeFile`
- Converted `shouldRefreshSchemaArtifact` to async (`readFileSync` → `await readFile`)
- Converted `writeVersionFile` to async (`mkdirSync` → `await mkdir`, `writeFileSync` → `await writeFile`)
- Preserved sync-only helpers: `readInstalledPackageVersion`, `readTrackedVersion`, `resolveBootstrapScope`, `backupPrimitiveTarget`, `listPrimitiveSources`, `copyPrimitive`, `resolvePrimitiveTargetPath`, `renderConfigJson`

## Verification
- ✅ 16/16 governance session tests pass
- ✅ 7/7 bootstrap-init tests pass
- ✅ Full suite: 2620 passed, 2 skipped (no regressions)
- ✅ Typecheck: clean

## Deviations from Plan
None — plan executed exactly as written.

## Self-Check: PASSED
- [x] `execFile` (async) replaces `execSync` for all git operations
- [x] Git commands split into separate `git add -A` and `git commit` execFile calls
- [x] Empty catch block handles rejected promises gracefully
- [x] `bootstrapInit` function uses `mkdir`, `writeFile`, `readFile` from `node:fs/promises`
- [x] Sync helper functions (`readInstalledPackageVersion`, `readTrackedVersion`) remain unchanged
- [x] `shouldRefreshSchemaArtifact` and `writeVersionFile` updated to async
- [x] All existing tests pass, typecheck clean
