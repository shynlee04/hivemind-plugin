# RED Phase Evidence — Plan #10 (Plugin Wiring)

**Phase:** RED (failing tests)
**Timestamp:** 2026-03-24T00:00:00.000Z
**Test File:** `tests/plugin/event-tracker-wiring.test.ts`
**Run Command:** `npx tsx --test tests/plugin/event-tracker-wiring.test.ts`

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | 22 |
| Passing | 6 |
| Failing | 16 |

**RED validation:** ✅ 16 tests fail because the wiring does not exist yet. This proves the tests detect real missing behavior, not tautological assertions.

## Failing Tests (16)

### Suite 1: Barrel Exports (4 failing)
1. `barrel: hooks/index.ts re-exports transform-handler` — barrel file has no `transform-handler` re-export
2. `barrel: hooks/index.ts re-exports text-complete-handler` — barrel file has no `text-complete-handler` re-export
3. `barrel: hooks/index.ts re-exports compaction-handler` — barrel file has no `compaction-handler` re-export
4. `barrel: all 3 handler re-exports use ESM .js suffix` — no `.js`-suffixed re-exports for the 3 handlers

### Suite 2: Plugin Registration (10 failing)
5. `plugin: opencode-plugin.ts imports createTransformHandler` — no import of `createTransformHandler`
6. `plugin: opencode-plugin.ts registers system.transform hook` — no `'system.transform'` key in hook return
7. `plugin: system.transform hook uses createTransformHandler factory` — no `createTransformHandler({ directory })` call
8. `plugin: opencode-plugin.ts imports createTextCompleteHandler` — no import of `createTextCompleteHandler`
9. `plugin: experimental.text.complete composes journal handler after legacy` — no `createTextCompleteHandler` in text.complete block
10. `plugin: experimental.text.complete legacy call appears before journal call` — journal handler not present, ordering can't be verified
11. `plugin: experimental.text.complete journal handler call has .catch(() => undefined)` — no `createTextCompleteHandler(...)(...).catch(() => undefined)` chain
12. `plugin: opencode-plugin.ts imports createCompactionJournalHandler` — no import of `createCompactionJournalHandler`
13. `plugin: experimental.session.compacting composes journal handler` — no `createCompactionJournalHandler` in plugin source
14. `plugin: experimental.session.compacting journal handler has .catch(() => undefined)` — no `.catch(() => undefined)` in compaction section

### Suite 3: Deprecation Annotation (2 failing)
15. `deprecation: diagnostic-log.ts has @deprecated JSDoc tag` — no `@deprecated` tag in diagnostic-log.ts
16. `deprecation: opencode-plugin.ts annotates writeDiagnosticLog import as deprecated` — no `deprecated` annotation near `writeDiagnosticLog` import

## Passing Tests (6)

These verify existing behavior that must be preserved during migration:

1. `deprecation: diagnostic-log.ts writeDiagnosticLog export still exists` — export is present
2. `legacy: experimental.text.complete retains writeDiagnosticLog call` — inline handler preserved
3. `legacy: experimental.text.complete retains upsertSessionInspectionExport call` — inline handler preserved
4. `legacy: experimental.text.complete retains getAndClearInjectionPayload call` — injection retrieval preserved
5. `legacy: experimental.session.compacting retains existing compaction adapter` — `createCompactionHandler` import preserved
6. `legacy: experimental.session.compacting handler preserves context injection` — compaction handler behavior preserved

## What Each Failing Test Requires (GREEN scope)

| Test | Required Change | File |
|------|-----------------|------|
| barrel 1-4 | Add 3 `export * from './<handler>.js'` lines | `src/hooks/index.ts` |
| plugin 1-3 | Import `createTransformHandler`, register `'system.transform'` hook | `src/plugin/opencode-plugin.ts` |
| plugin 4-7 | Import `createTextCompleteHandler`, compose after legacy with `.catch()` | `src/plugin/opencode-plugin.ts` |
| plugin 8-10 | Import `createCompactionJournalHandler`, compose alongside adapter with `.catch()` | `src/plugin/opencode-plugin.ts` |
| deprecation 1 | Add `@deprecated` JSDoc to `writeDiagnosticLog` export | `src/sdk-supervisor/diagnostic-log.ts` |
| deprecation 2 | Add `@deprecated` comment near `writeDiagnosticLog` import | `src/plugin/opencode-plugin.ts` |

## Evidence Contract

- [x] Test file created at `tests/plugin/event-tracker-wiring.test.ts`
- [x] All 16 tests fail for the correct reason (missing wiring)
- [x] 6 tests pass verifying existing behavior preservation
- [x] No tautological tests — all assertions test real code existence
- [x] node:test + node:assert/strict, ESM .js source file
