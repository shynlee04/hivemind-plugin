# Code Skepticism Report — Plan #8 (Index Writer + Synthesizer)

**Scope:** Index Writer, Synthesizer, and associated types for event-tracker read-model projections
**Files examined:**
- `src/features/event-tracker/writers/index-writer.ts` (135 lines)
- `src/features/event-tracker/writers/synthesizer.ts` (144 lines)
- `src/features/event-tracker/writers/index-writer.test.ts` (407 lines, 25 tests)
- `src/features/event-tracker/writers/synthesizer.test.ts` (373 lines, 17 tests)
- `src/features/event-tracker/types.ts` (321 lines, new types at L248–321)
- `src/features/event-tracker/writers/formatter.ts` (145 lines, integration boundary)
- `src/features/event-tracker/paths.ts` (86 lines, path contract)

**Overall Risk:** MEDIUM

---

## Evidence Collected

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | ✅ Clean — zero type errors |
| `npx tsx --test index-writer.test.ts` | ✅ 25/25 passed |
| `npx tsx --test synthesizer.test.ts` | ✅ 17/17 passed |
| `grep -r "any"` in new files | ✅ Zero `any` in Plan #8 code |
| `grep -r "import.*index-writer\|import.*synthesizer"` | ℹ️ No consumers yet (new modules) |

---

## Critical Issues (Must Fix Before Merge)

*None found.*

---

## High-Risk Issues (Should Fix Before Merge)

### H1: `userMessagePreview` is a Dead Field — Either Bug or Debt

**Location:** `types.ts:271`, `synthesizer.ts:48–60`

`SynthesisTurnSummary.userMessagePreview` is declared at `types.ts:271` and populated in every test fixture, but `renderTurnSummaryTable()` at `synthesizer.ts:48` renders only `# | Agent | Model | Duration | Delegations`. The `userMessagePreview` column is **completely absent** from the output.

This means either:
1. **It's dead code** — declared but never used. Should be removed from the type to avoid confusion.
2. **It's a missing feature** — the table should include it but doesn't.

**Evidence:** Compare `types.ts:265-272` (field declared) with `synthesizer.ts:53-54` (column absent from header and row rendering).

**Risk:** Callers constructing `SynthesisInput` will populate this field believing it renders. Silent data loss.

**Required action:** Either remove `userMessagePreview` from `SynthesisTurnSummary`, or add the column to `renderTurnSummaryTable`.

### H2: `getSessionTree` Iterates Full Array Per Node — O(n²) Worst Case

**Location:** `index-writer.ts:106`

The function builds `entryMap` (O(n) construction, line 88-91), uses it for root lookup (line 93) and node lookup (line 102), but then iterates the **entire `entries` array** at line 106 to find children:

```typescript
// Line 106: Full array scan per recursive call
for (const candidate of entries) {
  if (candidate.parentSessionId === sessionId) {
```

Instead of building a `parentId → children[]` index once and doing O(1) lookups.

**Risk:** With 1000+ sessions and deep trees, this becomes O(n × depth). Not a correctness bug, but violates the principle of "don't build a map you don't fully use." The `entryMap` exists but the child discovery bypasses it.

**Required action:** Build a `Map<string, IndexEntry[]>` for parent→children mapping alongside `entryMap`, or at minimum document why full-scan is acceptable for expected scale.

---

## Medium-Risk Issues (Should Address Soon)

### M1: No Pipe-Sanitization in `renderIndexEntry` — Markdown Injection Risk

**Location:** `index-writer.ts:36-39`

`renderIndexEntry` interpolates raw field values into a pipe-delimited table. If `sessionId`, `purposeClass`, or `agent` contains a literal `|` character, the table columns become misaligned and the rendered markdown breaks.

```typescript
return `| ${entry.sessionId} | ${entry.lineage} | ${entry.purposeClass} | ...`
```

No escaping is applied anywhere.

**Risk:** Low for controlled session IDs (generated prefixes like `ses_`). Higher if `agent` or `purposeClass` values are ever user-supplied or free-form.

**Evidence:** Grep confirms no `replaceAll('|', ...)` or sanitization in `index-writer.ts`.

### M2: Full-Rewrite I/O Without Atomic Write — Crash-Consistency Risk

**Location:** `index-writer.ts:129-134`, `synthesizer.ts:135-143`

Both `updateMasterIndex` and `generateSessionSynthesis` use `writeFile` (direct overwrite). If the process crashes mid-write, the file will be truncated or partially written.

```typescript
await writeFile(indexPath, content, 'utf8')  // Not atomic
```

**Risk:** For `index.md` (the master session index), a corrupted write means all session lookups fail. For synthesis files, corruption is scoped to one session.

**Required action:** Either document this as an acceptable tradeoff (single-writer assumption) or implement write-temp-then-rename for atomicity.

### M3: No Integration Between index-writer.ts and formatter.ts

**Location:** `index-writer.ts` — zero imports from `formatter.ts`

The two modules in the same `writers/` directory share no code. `formatter.ts` has `truncateForIndex` and `truncateForDisplay` which could be relevant if index entries ever contain long text fields. Currently `IndexEntry` fields are all short (IDs, statuses, timestamps) so this isn't a bug — but the lack of integration suggests the modules were designed in isolation without a shared rendering contract.

**Risk:** Future additions to `IndexEntry` with longer text will need truncation, and developers may not discover `formatter.ts` utilities exist.

### M4: `renderCompactionSection` Not Exported — Untestable in Isolation

**Location:** `synthesizer.ts:102-104`

`renderCompactionSection` is a private function only reachable through `renderSynthesis`. The tests at `synthesizer.test.ts:253-278` verify compaction behavior by testing the full `renderSynthesis` output, which is correct, but means:
- No isolated test for the section renderer
- If compaction rendering changes, the test diff will be noisy

**Risk:** Low. This is a style preference, not a correctness issue.

---

## Observations (Consider Addressing)

### O1: Test Coverage Is Excellent for Happy Paths, Missing Edge Cases

**42 tests total** across both files. Strong coverage of:
- ✅ Cycle guards (2-node and 3-node cycles)
- ✅ Empty inputs
- ✅ Null parent handling
- ✅ Orphan exclusion
- ✅ Deterministic output
- ✅ Full-rewrite semantics
- ✅ Directory creation

**Missing edge cases:**
- ❌ `renderIndexEntry` with pipe characters in field values (table breakage)
- ❌ `getSessionTree` with self-referencing entry (`parentSessionId === sessionId`)
- ❌ `getSessionTree` with 1000+ entries (performance — not needed now but should exist)
- ❌ `renderTurnSummaryTable` with extreme duration values (negative, NaN, Infinity)
- ❌ `renderSynthesisHeader` with special markdown characters in fields

### O2: `entryMap` Is Built But Underutilized

**Location:** `index-writer.ts:88-91, 102, 106`

The map is used for entry lookup at line 102 but child discovery at line 106 iterates the raw array. The map is not wrong, but it's half-used. This is a code smell — future maintainers will wonder why both patterns coexist.

### O3: Pre-Existing `as any` Debt in formatter.test.ts

**Location:** `formatter.test.ts:264, 281, 292, 305`

Four `as any` casts exist in formatter tests. These are NOT Plan #8 debt (pre-existing), but they should be tracked. They bypass type safety for fields not yet in the `ParsedTurn` type (`timestamp`, `beforeSummary`, `afterSummary`).

---

## Assumptions Challenged

| # | Assumption | Location | Risk if Wrong |
|---|-----------|----------|---------------|
| 1 | Session IDs never contain `|` | `index-writer.ts:36` | Markdown table corruption |
| 2 | Single writer to index.md (no concurrent writes) | `index-writer.ts:129` | Data loss on concurrent write |
| 3 | `userMessagePreview` is intentionally unused in rendering | `synthesizer.ts:48` | Silent data loss / confused callers |
| 4 | entries.length stays manageable (<10K) | `index-writer.ts:106` | O(n²) tree building |
| 5 | projectRoot is always valid / writable | Both I/O functions | Unhandled ENOENT/EACCES |

---

## Verdict

**This code is safe to merge** with two required changes:

1. **[H1] Resolve `userMessagePreview`** — Remove from type or add to renderer. Dead fields in read-model types mislead consumers.

2. **[H2] Optimize child discovery in `getSessionTree`** — Build a parent→children index. The current O(n)-per-node scan is functionally correct but architecturally inconsistent with the `entryMap` already constructed.

All other findings are medium/low risk and can be addressed in follow-up work without blocking the merge.

**Type safety:** Excellent. Zero `any` casts in new code. All types are properly composed from union literals and intersection types. No unsafe casts.

**Test quality:** Strong. 42 tests, all passing, with good coverage of core paths, cycles, empty states, and deterministic output. Missing some edge cases (pipe chars, self-ref) but these are low priority.

**Clean code:** Within constitutional limits. index-writer.ts is 135 lines, synthesizer.ts is 144 lines. No god functions. JSDoc present on all exports. Pure query functions separated from I/O.

---

**Status:** ACCEPTED WITH CONDITIONS
**Evidence path:** `.hivemind/activity/review/plan-8-code-skeptic.md`
**Required changes:** H1 + H2 before merge
