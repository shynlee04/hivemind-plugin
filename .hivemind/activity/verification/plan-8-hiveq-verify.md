# Verification Report — Plan #8 (Index + Synthesizer)

**Verifier:** hiveq
**Date:** 2026-03-24
**Goal:** Verify Plan #8 (Index Writer + Synthesizer) against existing codebase before implementation.
**Status:** `gaps_found`
**Score:** 8/10 must-haves verified

---

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Plan scope is bounded to index-writer + synthesizer only | VERIFIED | Plan lines 7–21: "In Scope" lists 5 files; "Out of Scope" explicitly excludes parser, classifier, session-writer, hook wiring. |
| 2 | New types (`IndexEntry`, `SynthesisInput`, etc.) don't duplicate existing types.ts | PARTIAL | See Finding #1 below. Some overlap with `SessionMeta` and `TurnMeta` exists but is by-design as read-models. |
| 3 | Plan reuses `getEventTrackerIndexPath` and `getSessionSynthesisPath` from paths.ts | VERIFIED | `paths.ts:74` exports `getEventTrackerIndexPath`; `paths.ts:84` exports `getSessionSynthesisPath`. Plan line 13 and Step 4/6 reference both. |
| 4 | Plan reuses formatter truncation functions | VERIFIED | `formatter.ts:29` exports `truncateForDisplay`; `formatter.ts:49` exports `truncateForIndex`. Plan line 14 and Step 10 reference both. |
| 5 | Query functions are pure (no side effects) | VERIFIED | Plan lines 64–65 explicitly design queries as pure: "operate on an in-memory `IndexEntry[]` array... no I/O in query logic." Step 3 confirms. |
| 6 | Write functions use correct I/O strategy | VERIFIED | Plan line 54: "Index is a derived aggregate — full rewrite, not append." Step 4/6 use `writeFile`. This is correct for full-rewrite aggregates (append is for append-only surfaces like events.md). |
| 7 | Test framework: node:test + node:assert/strict | VERIFIED | Plan line 38. Matches existing pattern in `formatter.test.ts:10–11`. |
| 8 | ESM `.js` imports | VERIFIED | Plan line 39. Matches existing pattern: all writer imports use `.js` suffixes (e.g., `formatter.ts:10`, `session-writer.ts:7`). |
| 9 | LOC ≤ 300 per file | VERIFIED | Plan estimates: index-writer 200–280 (line 27), synthesizer 180–250 (line 28). Within 300 limit. |
| 10 | Plan addresses cycle protection for `getSessionTree` | PARTIAL | Plan line 356 mentions risk mitigation: "`getSessionTree` must guard against cycles (visited-set check)." However, no implementation step or test explicitly implements or validates cycle detection. |

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `writers/index-writer.ts` | Not yet created | N/A (pre-implementation) | Plan defines: render functions, query functions, I/O function. ~250 LOC. |
| `writers/synthesizer.ts` | Not yet created | N/A (pre-implementation) | Plan defines: section renderers, I/O function. ~200 LOC. |
| `writers/index-writer.test.ts` | Not yet created | N/A (pre-implementation) | Plan defines 19 test cases across 6 function groups. |
| `writers/synthesizer.test.ts` | Not yet created | N/A (pre-implementation) | Plan defines 15 test cases across 6 function groups. |
| `types.ts` additions | Not yet added | N/A (pre-implementation) | Plan defines 5 new interfaces + 1 composite type. ~50 LOC. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `index-writer.ts` | `paths.ts` | `getEventTrackerIndexPath` | WIRED | Plan Step 4: `updateMasterIndex` calls this path builder. Export exists at `paths.ts:74`. |
| `synthesizer.ts` | `paths.ts` | `getSessionSynthesisPath` | WIRED | Plan Step 6: `generateSessionSynthesis` calls this path builder. Export exists at `paths.ts:84`. |
| `synthesizer.ts` | `formatter.ts` | `truncateForIndex` | WIRED | Plan Step 10: "Use `truncateForIndex` for user message previews." Export exists at `formatter.ts:49`. |
| `index-writer.ts` | `types.ts` | `IndexEntry`, `SessionTreeNode` | WIRED | Plan Step 1–3: imports new types from types.ts. |
| `synthesizer.ts` | `types.ts` | `SynthesisInput` and sub-types | WIRED | Plan Step 5–6: imports from types.ts. |
| `index-writer.ts` | `base-writer.ts` | NOT USED | N/A | Plan explicitly chooses `writeFile` (full rewrite) over `appendExactUtf8Content`. Correct for aggregate surfaces. |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `plan-8.md` | 150–154 | `SessionTreeNode` defined outside types.ts | LOW | Plan shows `SessionTreeNode` interface inline in Step 3, but Step 11 says "Add... `SessionTreeNode` to `types.ts`". Minor inconsistency — clarify which location is authoritative. |
| `plan-8.md` | 242 | Cycle protection test mentions "Orphan entries excluded" but no "Cycle detected" test | MEDIUM | Plan risk table (line 356) calls for visited-set cycle guard in `getSessionTree`, but no test case verifies cycle-breaking behavior. Test #16 only covers orphans, not circular references. |

---

## Detailed Findings

### Finding #1: Type Overlap Analysis (PARTIAL — Low Risk)

**Concern:** New types overlap with existing type contracts.

| New Type | Existing Overlap | Differentiation |
|----------|-----------------|-----------------|
| `IndexEntry` | `SessionMeta` (12 fields) | `IndexEntry` flattens to 10 fields; uses `turnCount`/`delegationCount` (numbers) instead of `SessionMetrics` object; adds `parentSessionId` inline. Designed as a read-model, not a persistence model. |
| `SynthesisTurnSummary` | `TurnMeta` (8 fields) | `SynthesisTurnSummary` adds `delegationCount` and `userMessagePreview`; drops `turnType`, `turnDepth`, `siblingCount`. Projection, not duplicate. |
| `SynthesisDelegationEntry` | `DelegationRecord` (12 fields) | `SynthesisDelegationEntry` is 5 fields — display-only projection of `DelegationRecord`. |
| `SynthesisEventEntry` | `EventEntry` (7 fields) | `SynthesisEventEntry` is 3 fields — summary projection of `EventEntry`. |

**Verdict:** These are intentional read-model projections, not duplicates. The project's `CONCERNSV1.md` pattern of intersection-type decomposition (`TrajectoryCore & TrajectoryBindings`) supports this approach. However, the plan should document explicitly that these are read-model contracts to prevent future confusion.

### Finding #2: Cycle Protection Incomplete (MEDIUM)

**Risk:** Plan identifies "Tree building has circular parent references" as HIGH impact (line 356) with mitigation: "`getSessionTree` must guard against cycles (visited-set check)."

**Gap:** No implementation step implements this guard. Step 3 describes tree building as "iterating entries, matching `parentSessionId` to `sessionId`, and recursing" — pure recursion with no cycle detection. No test case (#13–16) validates circular reference handling.

**Required addition to Step 3:**
```typescript
// Cycle protection: track visited session IDs
const visited = new Set<string>()
function buildTree(rootId: string): SessionTreeNode | null {
  if (visited.has(rootId)) return null // cycle detected
  visited.add(rootId)
  // ... recurse into children
}
```

**Required addition to test cases:**
- Test #17 (or renumber): "Circular parent reference (A→B→A) returns tree with cycle broken at second visit"

### Finding #3: `asDisplayValue` Pattern Reference

Plan line 281 references "`N/A` fallback via `asDisplayValue` pattern from formatter." The existing `formatter.ts` does NOT export an `asDisplayValue` function. The pattern exists as private helper `trimOrFallback` in `session-writer.ts:17`. The synthesizer should either:
- Import `trimOrFallback` from `session-writer.ts` (breaks scope isolation), or
- Define its own local `asDisplayValue` helper (recommended).

**Impact:** Low — minor implementation detail, not a blocking issue.

---

## Verification Commands

| Command | Expected | Status |
|---------|----------|--------|
| `npx tsc --noEmit` | Clean (current state) | PASS — project compiles clean as of verification time |
| `npx tsx --test src/features/event-tracker/writers/formatter.test.ts` | All green (existing) | NOT RUN — pre-implementation; existing tests should remain green after Plan #8 |

---

## Gaps Summary

| Gap # | Severity | Description | Action Required |
|-------|----------|-------------|-----------------|
| 1 | MEDIUM | `getSessionTree` cycle protection has risk callout but no implementation step and no test case | Add visited-set guard to Step 3 implementation; add cycle-detection test case |
| 2 | LOW | `asDisplayValue` referenced in plan doesn't exist as exported function | Clarify: use local helper or import `trimOrFallback` from session-writer |
| 3 | LOW | `SessionTreeNode` shown inline in Step 3 but also listed for types.ts in Step 11 | Clarify authoritative location — types.ts is correct per Step 11 |
| 4 | LOW | New types should be documented as "read-model projections" to distinguish from persistence contracts | Add JSDoc comment marking types as read-model projections |

---

## Verdict

**`gaps_found`** — Plan is well-structured, correctly reuses existing path builders and formatter utilities, maintains proper scope boundaries, and follows established patterns (test framework, ESM imports, pure query functions, full-rewrite I/O strategy).

**Blocking issue:** Cycle protection for `getSessionTree` is identified as HIGH-impact risk but has no implementation step or test coverage. This must be addressed before implementation begins.

**Non-blocking issues:** `asDisplayValue` naming clarification and type documentation are minor and can be resolved during implementation.

**Recommendation:** Add Step 3.1 (cycle guard implementation) and Test #17 (cycle detection) to the plan, then proceed to implementation.
