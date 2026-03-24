# Plan #4 RED Phase Evidence — 2026-03-24

## Files Written

| # | File | Test Cases | Purpose |
|---|------|------------|---------|
| 1 | `src/features/event-tracker/parser/types.test.ts` | 10 | Type shapes for ParsedHeader, ParsedTurn, ParsedDelegation, TurnCounters, ParsedSession + runtime sentinel `createEmptyHeader()` |
| 2 | `src/features/event-tracker/parser/header-parser.test.ts` | 5 | Header extraction: full fields, missing sessionId, missing created/updated, special chars title, empty markdown |
| 3 | `src/features/event-tracker/parser/splitter.test.ts` | 6 | Turn splitting: single turn, multiple turns, compaction-only, empty string, no `## User`, verbatim preservation |
| 4 | `src/features/event-tracker/parser/meta-parser.test.ts` | 9 | Agent/model/duration extraction: real headers, missing duration, malformed header, compaction detection, duration parsing (s/ms/null) |
| 5 | `src/features/event-tracker/parser/delegation-extractor.test.ts` | 6 | Delegation extraction: valid task block, no tools, non-task tools, malformed JSON, multiple delegations, missing optional fields |
| 6 | `src/features/event-tracker/parser/counter.test.ts` | 5 | Counters: empty array, user+agent counts, delegation sum, empty userMessage exclusion, compaction exclusion |
| 7 | `src/features/event-tracker/parser/turn-parser.test.ts` | 7 | Integration: header extraction, turn count, delegation population, empty markdown, thinking blocks, sequential numbering, non-task tool filtering |

**Total: 48 test cases across 7 files**

## Test Run Results

| # | File | Result | Error |
|---|------|--------|-------|
| 1 | `types.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/types.js` |
| 2 | `header-parser.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/header-parser.js` |
| 3 | `splitter.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/splitter.js` |
| 4 | `meta-parser.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/meta-parser.js` |
| 5 | `delegation-extractor.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/delegation-extractor.js` |
| 6 | `counter.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/counter.js` |
| 7 | `turn-parser.test.ts` | FAIL | `ERR_MODULE_NOT_FOUND: Cannot find module .../parser/turn-parser.js` |

## RED Confirmation

**All 7 tests FAIL.** Every failure is a clean `ERR_MODULE_NOT_FOUND` — the implementation files (`types.js`, `header-parser.js`, `splitter.js`, `meta-parser.js`, `delegation-extractor.js`, `counter.js`, `turn-parser.js`) do not exist.

No tests pass. No tautological tests. Every test imports from a non-existent module, proving the RED gate is solid.

**Note:** Initial run of `types.test.ts` passed 9/9 because it used only `import type` (erased at runtime). Fixed by adding a runtime import of `createEmptyHeader()` sentinel — now fails consistently with all others.

## Evidence Paths

| File | Absolute Path |
|------|--------------|
| types.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/types.test.ts` |
| header-parser.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/header-parser.test.ts` |
| splitter.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/splitter.test.ts` |
| meta-parser.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/meta-parser.test.ts` |
| delegation-extractor.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/delegation-extractor.test.ts` |
| counter.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/counter.test.ts` |
| turn-parser.test.ts | `/Users/apple/hivemind-plugin/.worktrees/product-detox/src/features/event-tracker/parser/turn-parser.test.ts` |
| This evidence file | `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/tdd/red/plan-4-red-evidence.md` |

## Required Implementation Files (for GREEN phase)

| File | Exports Required By Tests |
|------|--------------------------|
| `types.ts` | `ParsedHeader`, `ParsedTurn`, `ParsedDelegation`, `TurnCounters`, `ParsedSession` (types), `createEmptyHeader()` (runtime) |
| `header-parser.ts` | `parseSessionHeader(markdown: string): ParsedHeader` |
| `splitter.ts` | `splitTurns(markdown: string): string[]` |
| `meta-parser.ts` | `parseAssistantMeta(line): {agentName, model, duration}`, `isCompactionTurn(line): boolean`, `parseDuration(str): number \| null` |
| `delegation-extractor.ts` | `extractDelegations(turnText: string): ParsedDelegation[]` |
| `counter.ts` | `countTurns(turns: ParsedTurn[]): TurnCounters` |
| `turn-parser.ts` | `parseSession(markdown: string): ParsedSession` |
