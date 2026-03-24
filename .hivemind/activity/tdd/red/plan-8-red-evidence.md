# Plan #8 — RED Phase Evidence

**Date:** 2026-03-24
**Phase:** RED (write failing tests)
**Agent:** hitea — Terminal Testing Specialist

## Summary

Created 2 test files with **42 failing tests** (25 index-writer + 17 synthesizer) for Plan #8 (Index Writer + Synthesizer). Both test suites fail at module resolution (`ERR_MODULE_NOT_FOUND`) because `index-writer.ts` and `synthesizer.ts` do not exist. TypeScript compilation also fails because the new types (`IndexEntry`, `SessionTreeNode`, `SynthesisInput`, `SynthesisTurnSummary`, `SynthesisDelegationEntry`, `SynthesisEventEntry`) are not yet added to `types.ts`.

## Artifacts

| File | Tests | Status |
|------|-------|--------|
| `src/features/event-tracker/writers/index-writer.test.ts` | 25 | ALL FAIL |
| `src/features/event-tracker/writers/synthesizer.test.ts` | 17 | ALL FAIL |

## Test Execution Results

### index-writer.test.ts

```
✖ src/features/event-tracker/writers/index-writer.test.ts (461ms)
ℹ tests 1 | pass 0 | fail 1
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...index-writer.js'
```

**Root causes of failure:**
1. `index-writer.js` does not exist (module not implemented)
2. `IndexEntry` type not exported from `types.ts`
3. `SessionTreeNode` type not exported from `types.ts`

### synthesizer.test.ts

```
✖ src/features/event-tracker/writers/synthesizer.test.ts (461ms)
ℹ tests 1 | pass 0 | fail 1
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...synthesizer.js'
```

**Root causes of failure:**
1. `synthesizer.js` does not exist (module not implemented)
2. `SynthesisInput` type not exported from `types.ts`
3. `SynthesisTurnSummary` type not exported from `types.ts`
4. `SynthesisDelegationEntry` type not exported from `types.ts`
5. `SynthesisEventEntry` type not exported from `types.ts`

## Test Coverage Map

### Index Writer (25 tests)

| # | Function | Test | Edge Case |
|---|----------|------|-----------|
| 1 | renderIndexHeader | returns markdown table header with all column labels | — |
| 2 | renderIndexHeader | includes markdown separator row | — |
| 3 | renderIndexEntry | single entry renders correct pipe-delimited row | all fields |
| 4 | renderIndexEntry | null parent renders em dash | null edge |
| 5 | renderIndexEntry | zero turns/delegations renders 0 values | boundary |
| 6 | renderIndexEntry | with parent session ID renders parent not em dash | — |
| 7 | renderIndexTable | multiple entries sorted by created descending | ordering |
| 8 | renderIndexTable | empty entries produces header only | empty edge |
| 9 | renderIndexTable | deterministic output for same input | idempotency |
| 10 | getActiveSessions | filters only status active | filter |
| 11 | getActiveSessions | returns empty when all completed | no-match |
| 12 | getActiveSessions | returns empty for empty input | empty edge |
| 13 | getSubSessions | filters entries matching parentSessionId | filter |
| 14 | getSubSessions | returns empty when no children | no-match |
| 15 | getSubSessions | null parent entries excluded | null edge |
| 16 | getSessionTree | single root no children returns flat node | base case |
| 17 | getSessionTree | root with 2 children depth-2 tree | tree structure |
| 18 | getSessionTree | multi-level root→child→grandchild | nesting |
| 19 | getSessionTree | orphan entries excluded from tree | orphan edge |
| 20 | getSessionTree | circular A→B→A cycle broken no infinite recursion | **cycle guard** |
| 21 | getSessionTree | returns null for non-existent root | not-found |
| 22 | getSessionTree | deep cycle A→B→C→A breaks at third visit | **cycle guard** |
| 23 | updateMasterIndex | writes index.md to correct path | I/O |
| 24 | updateMasterIndex | overwrites existing index.md (full rewrite) | I/O |
| 25 | updateMasterIndex | creates parent directory if missing | I/O |

### Synthesizer (17 tests)

| # | Function | Test | Edge Case |
|---|----------|------|-----------|
| 1 | renderSynthesisHeader | includes all identity fields | — |
| 2 | renderSynthesisHeader | renders session ID in title | — |
| 3 | renderTurnSummaryTable | includes all turns with agent/model/duration | — |
| 4 | renderTurnSummaryTable | null duration renders N/A | null edge |
| 5 | renderTurnSummaryTable | empty turns renders no turns message | empty edge |
| 6 | renderDelegationChain | shows delegatedTo/subagentType/status/description | — |
| 7 | renderDelegationChain | empty delegations renders no delegations message | empty edge |
| 8 | renderKeyFindings | each event shows turn number/type/summary | — |
| 9 | renderKeyFindings | empty events renders no high-importance events | empty edge |
| 10 | renderSynthesis | full input produces complete synthesis | composition |
| 11 | renderSynthesis | zero compactions shows 0 count | boundary |
| 12 | renderSynthesis | deterministic output for same input | idempotency |
| 13 | renderSynthesis | multiple compactions shows count | — |
| 14 | generateSessionSynthesis | writes synthesis.md to correct path | I/O |
| 15 | generateSessionSynthesis | overwrites existing synthesis.md | I/O |
| 16 | generateSessionSynthesis | creates session directory if missing | I/O |
| 17 | SynthesisInput type | accepts valid shape with all fields | type gate |

## LSP Compilation Errors

### index-writer.test.ts
```
ERROR Module '"../types.js"' has no exported member 'IndexEntry'
ERROR Module '"../types.js"' has no exported member 'SessionTreeNode'
ERROR Cannot find module './index-writer.js'
```

### synthesizer.test.ts
```
ERROR Module '"../types.js"' has no exported member 'SynthesisInput'
ERROR Module '"../types.js"' has no exported member 'SynthesisTurnSummary'
ERROR Module '"../types.js"' has no exported member 'SynthesisDelegationEntry'
ERROR Module '"../types.js"' has no exported member 'SynthesisEventEntry'
ERROR Cannot find module './synthesizer.js'
```

## Dependencies Confirmed

- Existing imports from `../types.js` (Lineage, PurposeClass, SessionMeta, DelegationStatus, EventType)
- Existing imports from `../paths.js` (getEventTrackerIndexPath, getSessionSynthesisPath)
- All ESM `.js` suffix convention followed
- node:test + node:assert/strict framework
- Inline fixtures (makeEntry, makeTurnSummary, makeDelegation, makeEvent, makeSynthesisInput)

## GREEN Gate

Tests will pass when:
1. `IndexEntry`, `SessionTreeNode`, `SynthesisInput`, `SynthesisTurnSummary`, `SynthesisDelegationEntry`, `SynthesisEventEntry` added to `types.ts`
2. `index-writer.ts` exports: `renderIndexHeader`, `renderIndexEntry`, `renderIndexTable`, `getActiveSessions`, `getSubSessions`, `getSessionTree`, `updateMasterIndex`
3. `synthesizer.ts` exports: `renderSynthesisHeader`, `renderTurnSummaryTable`, `renderDelegationChain`, `renderKeyFindings`, `renderSynthesis`, `generateSessionSynthesis`
