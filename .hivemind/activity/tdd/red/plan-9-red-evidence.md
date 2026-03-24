# Plan #9 — RED Phase Evidence

**Date:** 2026-03-24
**Phase:** RED (write failing tests)
**Agent:** hitea
**Status:** COMPLETE — all 30 tests fail as expected

## Test Files Created

| File | Tests | Status |
|------|-------|--------|
| `tests/hooks/transform-handler.test.ts` | 7 | 7 FAIL |
| `tests/hooks/text-complete-handler.test.ts` | 15 | 15 FAIL |
| `tests/hooks/compaction-handler.test.ts` | 8 | 8 FAIL |
| **Total** | **30** | **30 FAIL** |

## Failure Modes

All tests fail for the correct RED reasons:

1. **Source inspection tests** → `ENOENT: no such file or directory` when reading handler source `.ts` file (file doesn't exist yet)
2. **Import/behavioral tests** → `ERR_MODULE_NOT_FOUND` when dynamically importing handler `.js` module (module not compiled yet)

## Test Coverage by Handler

### transform-handler (7 tests)
- Source inspection: imports `setInjectionPayload` from `injection-store`
- Source inspection: exports `createTransformHandler` factory
- Factory returns async function returning `Promise<void>`
- Handler captures injection payload with `sessionId` and system context
- Handler skips when `sessionId` is missing
- Handler resolves to void (not object)
- Source uses `.catch(() => undefined)` resilience pattern

### text-complete-handler (15 tests)
- Source inspection: imports `appendSessionEvent` from `events-writer`
- Source inspection: imports `initOrUpdateSessionMetadata` from `session-writer`
- Source inspection: does NOT import from `parser` or `core` (thin handler)
- Source inspection: imports `getAndClearInjectionPayload` from `injection-store`
- Source inspection: exports `createTextCompleteHandler` factory
- Factory returns async function returning `Promise<void>`
- Handler skips when `sessionId` is missing
- Handler skips when output text is empty
- Handler writes `assistant_output` event to `events.md`
- Handler writes `session.json` with session metadata
- Handler writes diagnostic log with `turn_complete` line
- Source uses `isPurposeClass` type guard (NOT `as any` cast)
- `isPurposeClass` references `PURPOSE_CLASS_VALUES` sentinel
- Source uses `.catch(() => undefined)` resilience pattern
- Source does NOT import from `sdk-supervisor/diagnostic-log`

### compaction-handler (8 tests)
- Source inspection: imports `appendSessionEvent` from `events-writer`
- Source inspection: exports `createCompactionJournalHandler` factory
- Factory returns async function returning `Promise<void>`
- Handler writes `compaction` event to `events.md`
- Handler skips when `sessionId` is missing
- Handler resolves to void (not object)
- Source uses `.catch(() => undefined)` resilience pattern
- Source does NOT import from `parser`, `core`, or `compaction-adapter`

## Test Execution Commands

```bash
npx tsx --test tests/hooks/transform-handler.test.ts       # 7 FAIL
npx tsx --test tests/hooks/text-complete-handler.test.ts    # 15 FAIL
npx tsx --test tests/hooks/compaction-handler.test.ts       # 8 FAIL
```

## Verification

- All 30 tests fail with expected error types (ENOENT / ERR_MODULE_NOT_FOUND)
- No tautological tests — every test can fail once implementation lands
- Test framework: `node:test` + `node:assert/strict`, ESM `.js` suffixes
- Pattern matches existing test infrastructure (events-writer.test.ts, diagnostics-writer.test.ts)

## GREEN Gate

Tests will pass when:
1. `src/hooks/transform-handler.ts` exports `createTransformHandler(deps)` → `(input, output) => Promise<void>`
2. `src/hooks/text-complete-handler.ts` exports `createTextCompleteHandler(deps)` → `(input, output) => Promise<void>`
3. `src/hooks/compaction-handler.ts` exports `createCompactionJournalHandler(deps)` → `(input, output) => Promise<void>`
4. All handlers follow factory pattern, use `.catch(() => undefined)`, and delegate to existing writers/classifiers
5. `text-complete-handler` uses `isPurposeClass` type guard with `PURPOSE_CLASS_VALUES` (no `as any`)
