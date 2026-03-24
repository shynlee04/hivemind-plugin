# Plan #8 Revision 1 — Delta

**Base:** `plan-8.md` (original)
**Date:** 2026-03-24
**Trigger:** HiveQ verification report `plan-8-hiveq-verify.md` — status `gaps_found`, score 8/10

## Changes Applied

| # | HiveQ Finding | Severity | Location Changed | Nature of Change |
|---|---------------|----------|------------------|------------------|
| 1 | `getSessionTree` cycle protection has risk callout but no implementation step or test case | BLOCKING | Step 3 (query functions), Step 8 (test requirements), Test cases #16 | Added explicit visited-set cycle guard implementation to `getSessionTree` with `Set<string>` tracking. Added cycle-detection test case (#17) to test requirements and test list. |
| 2 | Cycle-detection test not in Step 7 or Step 8 test requirements | BLOCKING | Step 7 (test requirements), Test Requirements table | Added test case #17 to `getSessionTree` tests in Step 7: "Circular parent reference (A→B→A) returns tree with cycle broken at second visit." Added row to Test Requirements table. |
| 3 | New types should be documented as read-model projections | LOW | Step 1 (types.ts) | Added JSDoc comments to `IndexEntry`, `SynthesisInput`, `SynthesisTurnSummary`, `SynthesisDelegationEntry`, `SynthesisEventEntry` marking them as read-model projections of `SessionMeta`, `TurnMeta`, `DelegationRecord`, `EventEntry` respectively. |
| 4 | `asDisplayValue` referenced but not exported from formatter.ts | LOW | Step 9 (implement index-writer), Step 10 (implement synthesizer) | Replaced reference to `asDisplayValue` with "local `asDisplayValue` helper" — the new modules define their own `asDisplayValue` locally rather than importing from formatter.ts. Added note about not importing from session-writer.ts. |
| 5 | `SessionTreeNode` shown inline in Step 3 but also listed for types.ts in Step 11 | LOW | Step 1 (types.ts) | Moved `SessionTreeNode` definition from Step 3 inline to Step 1 `types.ts` additions. Step 3 now references the type from `types.ts` instead of redefining it. Step 11 removed duplicate reference. |

## No-Op Items (verified correct, unchanged)

| Item | Why No Change |
|------|---------------|
| Scope boundaries (In/Out of Scope) | Verified correct by HiveQ |
| Path builder reuse (`getEventTrackerIndexPath`, `getSessionSynthesisPath`) | Both exports verified at `paths.ts:74,84` |
| Formatter reuse (`truncateForIndex`, `truncateForDisplay`) | Both exports verified at `formatter.ts:29,49` |
| Pure query function design | Confirmed by HiveQ — no I/O in queries |
| Full-rewrite I/O strategy for index | Correct for aggregate surfaces per HiveQ |
| Test framework (`node:test` + `node:assert/strict`) | Matches existing pattern |
| ESM `.js` import suffixes | Matches existing pattern |
| LOC estimates | Within 300 limit |

## Line-Level Diff Summary

```
Step 1 (types.ts):
  + JSDoc "read-model projection" to 5 interfaces
  + SessionTreeNode interface (moved from Step 3)

Step 3 (query functions):
  - SessionTreeNode inline definition (moved to Step 1)
  + Reference to SessionTreeNode from types.ts
  + Explicit visited-set cycle guard implementation code

Step 7 (test requirements):
  + Test #17: cycle detection test case

Step 9 (index-writer implementation):
  - "via `asDisplayValue` pattern from formatter"
  + "define a local `asDisplayValue` helper"

Step 10 (synthesizer implementation):
  + "define a local `asDisplayValue` helper for N/A fallback"

Step 11 (types.ts additions):
  - "SessionTreeNode" from list (already in Step 1)

Test Requirements table:
  + Row for getSessionTree cycle detection

Risks table:
  ~ Updated mitigation language for cycle risk
```

## Verification

The revision addresses all 4 HiveQ gaps:

| Gap | Action Taken | Verified In |
|-----|-------------|-------------|
| Gap 1 (MEDIUM): Cycle protection | Step 3 + Step 7 | Revision lines targeting Steps 3, 7 |
| Gap 2 (LOW): `asDisplayValue` | Steps 9, 10 | Local helper pattern documented |
| Gap 3 (LOW): `SessionTreeNode` location | Step 1 | Single authoritative location in types.ts |
| Gap 4 (LOW): Read-model type docs | Step 1 | JSDoc on all new interfaces |
