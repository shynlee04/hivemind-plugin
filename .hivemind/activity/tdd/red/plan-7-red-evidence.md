# Plan 7 Formatter — RED Phase Evidence

**Date:** 2026-03-24
**Phase:** RED (failing tests before implementation)
**Target Module:** `src/features/event-tracker/writers/formatter.ts`

## Evidence

```
npx tsx --test src/features/event-tracker/writers/formatter.test.ts
```

### Output

```
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/formatter.js' imported from /Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/formatter.test.ts
    at finalizeResolution (node:internal/esm/resolve:271:11)
    ...
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/writers/formatter.js'
}

✖ src/features/event-tracker/writers/formatter.test.ts (355.624328ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## Test File

**Created:** `src/features/event-tracker/writers/formatter.test.ts`

### Test Cases (18 total)

| Function | Case | Expected | Status |
|----------|------|----------|--------|
| truncateForDisplay | empty string | "" | RED — module not found |
| truncateForDisplay | short string | unchanged | RED — module not found |
| truncateForDisplay | at limit (500) | unchanged | RED — module not found |
| truncateForDisplay | over limit (600) | truncated + "…" | RED — module not found |
| truncateForDisplay | custom max (100) | truncated at 100 + "…" | RED — module not found |
| truncateForDisplay | very long (10000) | truncated to 500 + "…" | RED — module not found |
| truncateForIndex | empty string | "" | RED — module not found |
| truncateForIndex | over 200 | truncated + "…" | RED — module not found |
| truncateForIndex | at limit (200) | unchanged | RED — module not found |
| truncateForIndex | custom max (50) | truncated at 50 + "…" | RED — module not found |
| formatTurnSection | complete turn | has "## Turn", "**Agent:**", "**User:**", "**Assistant:**" | RED — module not found |
| formatTurnSection | null duration | "**Duration:** N/A" | RED — module not found |
| formatTurnSection | long user message | truncated to 200 chars | RED — module not found |
| formatTurnSection | long assistant content | truncated to 500 chars | RED — module not found |
| formatTurnSection | grep-friendly output | starts with "## Turn N" | RED — module not found |
| formatCompactionEvent | compaction turn | has "## Compaction", "**Agent:**" | RED — module not found |
| formatCompactionEvent | null duration | "**Duration:** N/A" | RED — module not found |
| formatCompactionEvent | grep-friendly output | starts with "## Compaction" | RED — module not found |

## Confirmation

- [x] Test file imports from `./formatter.js` (correct path within `writers/`)
- [x] Module does not exist — `ERR_MODULE_NOT_FOUND` confirmed
- [x] LSP error: `Cannot find module './formatter.js'`
- [x] 18 test cases covering all 4 functions
- [x] Edge cases: empty strings, boundary values, null duration, long text truncation
- [x] Test file ≤300 LOC

## Next Phase

GREEN: Create `src/features/event-tracker/writers/formatter.ts` implementing:
- `truncateForDisplay(text, maxChars=500): string`
- `truncateForIndex(text, maxChars=200): string`
- `formatTurnSection(turn: ParsedTurn): string`
- `formatCompactionEvent(turn: ParsedTurn): string`
