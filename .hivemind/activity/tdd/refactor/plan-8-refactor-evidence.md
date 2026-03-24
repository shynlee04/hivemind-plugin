# Plan #8 Refactor Evidence — H1 + H2 Fixes

**Date:** 2026-03-24
**Scope:** 2 HIGH code-skeptic findings from `plan-8-code-skeptic.md`
**Status:** COMPLETE

---

## H1: `userMessagePreview` Field — Added Column to Renderer

**File:** `src/features/event-tracker/writers/synthesizer.ts`

**Decision:** Add `Preview` column to `renderTurnSummaryTable` instead of removing the field.
- The field is documented in the JSDoc ("Adds delegationCount and userMessagePreview") — removing it would contradict the type contract.
- Removing would require touching `types.ts` + `synthesizer.test.ts` (fixture + type check test) — more blast radius.
- Adding a column is a minimal, self-contained change to one function.

**Change:**
- Header: `'| # | Agent | Model | Duration | Delegations |'` → `'| # | Agent | Model | Duration | Delegations | Preview |'`
- Separator: added `|---------|`
- Row rendering: added `| ${preview} |` where `preview = t.userMessagePreview || '—'`

---

## H2: `getSessionTree` O(n²) → O(n) — Added `childrenMap` Index

**File:** `src/features/event-tracker/writers/index-writer.ts`

**Decision:** Build a `parent→children[]` Map alongside `entryMap` in a single O(n) pass.

**Change:**
- Added `childrenMap = new Map<string, IndexEntry[]>()` in the same loop that builds `entryMap`.
- Each entry's `parentSessionId` key maps to an array of its children.
- `buildNode` now does `childrenMap.get(sessionId)` → O(1) child lookup instead of iterating full `entries[]`.

**Complexity:** O(n) index build + O(n) total tree traversal (each node visited once) = O(n) overall.

---

## Verification Results

| Command | Result | Status |
|---------|--------|--------|
| `npx tsx --test index-writer.test.ts` | 25/25 passed | ✅ |
| `npx tsx --test synthesizer.test.ts` | 17/17 passed | ✅ |
| `npx tsc --noEmit` | Zero type errors | ✅ |

---

## Files Modified

1. `src/features/event-tracker/writers/synthesizer.ts` — Added Preview column to `renderTurnSummaryTable`
2. `src/features/event-tracker/writers/index-writer.ts` — Added `childrenMap` index in `getSessionTree`

---

## Deviations

None. Both fixes follow the delegation packet exactly.
