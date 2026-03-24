# CQRS Boundary Fix — Evidence Report

**Date:** 2026-03-24
**Task:** Move `mkdir()` calls from hook handlers to writer modules (CQRS: hooks must be read-only)
**Status:** ✅ COMPLETE

---

## Problem

`src/hooks/text-complete-handler.ts` and `src/hooks/compaction-handler.ts` called `mkdir()` directly, violating the CQRS boundary where hooks must be read-only and delegate all writes to writer modules.

## Changes Made

### 1. `src/features/event-tracker/writers/base-writer.ts`
- Added `mkdir(dirname(filePath), { recursive: true })` before `appendFile` in `appendExactUtf8Content`
- This ensures parent directory exists before ANY append operation across all writers
- Updated JSDoc to note CQRS ownership

### 2. `src/features/event-tracker/writers/session-writer.ts`
- Added `import { dirname } from 'node:path'` and `mkdir` from `node:fs/promises`
- Added `mkdir(dirname(metadataPath), { recursive: true })` before `readExistingSessionMetadata` in `initOrUpdateSessionMetadata`
- This ensures session directory exists before `writeFile` (the non-append write path)

### 3. `src/hooks/text-complete-handler.ts`
- Removed `import { mkdir } from 'node:fs/promises'`
- Removed `import { getEventTrackerSessionDir }` (no longer needed — was only used for mkdir)
- Removed `await mkdir(...)` call and its comment
- Handler now purely delegates to writers without any filesystem writes

### 4. `src/hooks/compaction-handler.ts`
- Removed `import { mkdir } from 'node:fs/promises'`
- Removed `import { getEventTrackerSessionDir }` (no longer needed)
- Removed `await mkdir(...)` call and its comment
- Removed `getEventTrackerSessionDir` from paths import
- Handler now purely delegates to writers without any filesystem writes

## Verification Results

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit` | Zero errors | ✅ |
| `npx tsx --test tests/hooks/text-complete-handler.test.ts` | 15/15 pass | ✅ |
| `npx tsx --test tests/hooks/compaction-handler.test.ts` | 8/8 pass | ✅ |
| `npx tsx --test tests/hooks/transform-handler.test.ts` | 7/7 pass | ✅ |
| hooks-readonly grep (`mkdir`, `writeFile`, `appendFile`) | 0 matches in `src/hooks/` | ✅ |

**Total:** 30/30 tests passing, zero type errors, zero CQRS violations in hooks.

## Hooks-Readonly Compliance

Post-fix grep confirms: no `mkdir`, `writeFile`, or `appendFile` calls exist in any file under `src/hooks/**/*.ts`.

## Deviations

None. All changes match the delegated scope exactly.

## Files Modified

| File | Change |
|------|--------|
| `src/features/event-tracker/writers/base-writer.ts` | Added mkdir before appendFile |
| `src/features/event-tracker/writers/session-writer.ts` | Added mkdir before writeFile |
| `src/hooks/text-complete-handler.ts` | Removed mkdir + unused imports |
| `src/hooks/compaction-handler.ts` | Removed mkdir + unused imports |
