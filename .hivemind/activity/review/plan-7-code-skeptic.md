# Code Skepticism Report — Plan 7 (Formatter)

**Scope:** Plan↔Code cross-reference of Plan 7 Formatter implementation
**Files Examined:**
- `.hivemind/activity/planning/plan-7.md` (plan spec, 238 lines)
- `src/features/event-tracker/writers/formatter.ts` (implementation, 98 LOC)
- `src/features/event-tracker/writers/formatter.test.ts` (tests, 201 LOC)
- `src/features/event-tracker/writers/events-writer.ts` (integration reference)
- `src/features/event-tracker/parser/types.ts` (input type reference)

**Overall Risk:** **HIGH** — Multiple contract deviations from plan spec; one function contract violation.

---

## Critical Issues (Must Fix Before Merge)

### 1. Truncation Off-by-One — Plan Spec Violation

**Plan spec (line 65):** *"Truncate to `maxChars - 1` chars + `'…'` when exceeding limit."*
**Implementation (line 31, 49):** `text.slice(0, maxChars) + '…'`

The implementation truncates to `maxChars` chars + ellipsis (total `maxChars + 1`), but the spec explicitly requires `maxChars - 1` + ellipsis (total `maxChars`).

**Evidence:**

| Scenario | Plan Expected | Implementation Produces |
|----------|---------------|------------------------|
| `truncateForDisplay('hello', 3)` | `'he…'` (3 chars) | `'hel…'` (4 chars) |
| `truncateForDisplay('a'.repeat(600))` | 500 chars (499 + `…`) | 501 chars (500 + `…`) |

**Location:** `formatter.ts:31` and `formatter.ts:49`

**Impact:** Any downstream consumer that relies on the output being ≤`maxChars` chars will get 1 char overflow. The test assertions use `<= 501` / `<= 201` which masks this discrepancy.

---

### 2. `formatTurnSection` Signature Mismatch — Plan Contract Violation

**Plan spec (lines 69-86):**
```typescript
interface TurnSectionInput {
  turn: ParsedTurn
  timestamp?: string
}
export function formatTurnSection(input: TurnSectionInput): string
```

**Implementation (line 66):**
```typescript
export function formatTurnSection(turn: ParsedTurn): string
```

The plan requires a wrapper interface with an optional `timestamp` override. The implementation takes `ParsedTurn` directly. This breaks future callers that need to supply a custom timestamp.

**Location:** `formatter.ts:66`

---

### 3. `formatCompactionEvent` Signature Mismatch — Plan Contract Violation

**Plan spec (lines 119-131):**
```typescript
interface CompactionEventInput {
  turn: ParsedTurn
  timestamp?: string
  beforeSummary?: string
  afterSummary?: string
}
export function formatCompactionEvent(input: CompactionEventInput): string
```

**Implementation (line 92):**
```typescript
export function formatCompactionEvent(turn: ParsedTurn): string
```

The plan requires 4 fields: `turn`, `timestamp`, `beforeSummary`, `afterSummary`. The implementation takes only `ParsedTurn`, losing 3 of 4 planned features entirely.

**Location:** `formatter.ts:92`

---

## High-Risk Issues (Should Fix Before Merge)

### 4. Missing Delegation Targets Feature

**Plan spec (lines 111-113):**
> - Delegation targets listed under `### Delegations` if `turn.delegationTargets.length > 0`.
> - Each delegation rendered as `- {delegatedTo}: {description}`.

**Implementation:** No delegation rendering exists anywhere in `formatTurnSection`.

**Evidence:**
```bash
$ grep -n 'delegation\|Delegation' formatter.ts
# (empty — no matches)
```

The `ParsedTurn` type has `delegationTargets: ParsedDelegation[]` (parser/types.ts:24), and the plan explicitly requires rendering them. The implementation ignores this field entirely.

**Location:** `formatter.ts:66-80`

---

### 5. Missing Before/After Summary Feature in `formatCompactionEvent`

**Plan spec (lines 134-150):**
```markdown
## Compaction
- **Turn**: {turnNumber}
- **Agent**: {agentName}
- **Timestamp**: {timestamp | N/A}
### Before
{truncateForDisplay(beforeSummary, 500) | N/A}
### After
{truncateForDisplay(afterSummary, 500) | N/A}
```

**Implementation output (lines 95-97):**
```markdown
## Compaction
**Agent:** {agentName} · {model}
**Duration:** {duration}ms
```

The plan requires: Turn number, Timestamp, Before/After sections with 500-char truncation.
The implementation provides: Agent, Duration. Missing 4 of 6 planned output fields.

**Location:** `formatter.ts:92-97`

---

### 6. Output Format Divergence from Plan

**Plan `formatTurnSection` output:**
```markdown
## Turn {N}
- **Agent**: {agentName}
- **Model**: {model}
- **Duration**: {duration}ms | N/A
### User Message
{truncated}
### Assistant
{truncated}
```

**Implementation output:**
```markdown
## Turn {N}
**Agent:** {agentName} · {model}
**Duration:** {duration}ms
**User:**
{truncated}
**Assistant:**
{truncated}
```

Key differences:
- Agent and Model merged into one line (plan has separate `- **Model**: {model}`)
- Bullet prefix `- ` removed (plan has it)
- `### User Message` → `**User:**` (heading → bold label)
- `### Assistant` → `**Assistant:**` (heading → bold label)

This means grep patterns like `### User Message` from the plan won't match actual output. The "grep-friendly" claim is undermined by format divergence.

**Location:** `formatter.ts:71-79`

---

### 7. JSDoc Truncation Example Is Incorrect

**`formatter.ts` line 24:**
```typescript
* @example
* truncateForDisplay('a'.repeat(600)) // => 'aaa...a' (500 chars + '…')
```

Issues:
1. `'aaa...a'` uses ASCII `...` — the actual truncation uses unicode `…` (single char)
2. The parenthetical says `(500 chars + '…')` — this is 501 chars, contradicting the plan spec of `maxChars - 1 + '…'` = 500 chars
3. The `#600` repeat is shown as `'aaa...a'` which is misleading

**Location:** `formatter.ts:24-25`

---

### 8. Stale RED-Phase Comment in Test File

**`formatter.test.ts` lines 6-8:**
```typescript
* Tests for the Plan 7 formatter module...
* These tests import from `../formatter.js` which DOES NOT EXIST YET.
* They will FAIL with ERR_MODULE_NOT_FOUND until the GREEN phase.
```

The formatter module exists (98 LOC) and all 19 tests pass. This comment is stale and misleading.

**Location:** `formatter.test.ts:6-8`

---

## Medium-Risk Issues (Should Address Soon)

### 9. `formatCompactionEvent` Missing `isCompaction === true` Assertion

**Plan spec (line 153):**
> Assert `input.turn.isCompaction === true` (callers must filter; formatter documents this contract).

**Implementation:** No assertion. The function will render compaction output for any `ParsedTurn` regardless of `isCompaction` value.

**Location:** `formatter.ts:92`

---

### 10. Missing Test Coverage — Unicode Handling

**Plan Step 4 test case #6 (line 166):**
> `truncateForDisplay` handles unicode (emoji, CJK) by string length.

**Plan Test Requirements (line 220):**
> Unicode emoji string exceeding max → Truncates by string length, not bytes

**Implementation:** No unicode test case exists in `formatter.test.ts`. All truncation tests use ASCII-only characters (`'x'`, `'a'`, `'b'`, `'c'`, `'d'`, `'u'`, `'z'`).

---

### 11. Missing Test Coverage — Delegation Targets

**Plan Step 5 test cases #5-6 (lines 179-180):**
> 5. Delegation targets listed when present.
> 6. No delegation section when `delegationTargets` is empty.

**Implementation:** No delegation-related tests exist. The `makeTurn` fixture sets `delegationTargets: []` but no test exercises non-empty delegation targets.

---

### 12. Missing Test Coverage — Before/After Summaries

**Plan Step 6 test cases #3-4 (lines 188-189):**
> 3. Before/after summaries present and truncated at 500 chars.
> 4. Missing before/after summaries render `N/A`.

**Implementation:** No before/after tests exist because the feature isn't implemented.

---

### 13. Missing Test Coverage — Deterministic Output

**Plan Step 5 test case #7 (line 181):**
> 7. Output is deterministic for same input (snapshot-style assertion).

**Plan Step 6 test case #5 (line 190):**
> 5. Output is deterministic for same input.

**Implementation:** No determinism tests. The plan calls for "snapshot-style assertion" — calling the same function twice with the same input and asserting equality.

---

### 14. No Existing Tests for `events-writer` or `diagnostics-writer`

**Plan spec (line 13):**
> Ensure `renderEventMarkdownBlock` (events-writer) and `renderDiagnosticLogLine` (diagnostics-writer) continue working unchanged.

**Evidence:**
```bash
$ ls src/features/event-tracker/writers/*.test.ts
formatter.test.ts   # only test file
```

There are no test files for events-writer or diagnostics-writer. The plan's verification criterion "existing tests for events-writer, diagnostics-writer... remain green" cannot be confirmed because those tests don't exist.

---

### 15. `asDisplayValue` Pattern Not Used

**Plan spec (line 193):**
> Use `asDisplayValue` pattern from events-writer for `N/A` fallbacks.

**Implementation:** The formatter inlines the `N/A` check (`turn.duration !== null ? ... : 'N/A'`) but does not import or reuse the `asDisplayValue` helper from `events-writer.ts:15`. This creates code duplication.

**Location:** `formatter.ts:67, 93`

---

## Observations (Consider Addressing)

### 16. LOC Compliance — PASS

- `formatter.ts`: 98 LOC ≤ 300 ✅ (plan expected 150-200, actual is below that — smaller is fine)
- `formatter.test.ts`: 201 LOC ≤ 300 ✅ (plan expected 180-250, actual is within range)

### 17. Anti-Pattern Scan — CLEAN

| Check | Result |
|-------|--------|
| `any` types | None found ✅ |
| `console.log` | None found ✅ |
| `TODO/FIXME/HACK` | None found ✅ |
| SDK stubs | None found ✅ |
| `fs` / `paths.ts` imports | None found ✅ |
| Writer module imports | None found ✅ |

### 18. ESM Suffix Compliance — PASS

All imports use `.js` suffixes (`../parser/types.js`, `./formatter.js`). ✅

### 19. JSDoc Present on All Exports — PASS

All 4 exported functions have `@param`, `@returns`, and `@example` JSDoc blocks. ✅

### 20. Tests Use Correct Framework — PASS

`node:test` + `node:assert/strict` as required by plan. ✅

### 21. Tests Pass — PASS

```bash
$ npx tsx --test src/features/event-tracker/writers/formatter.test.ts
✔ tests 19, pass 19, fail 0
```

### 22. Type Check Passes — PASS

```bash
$ npx tsc --noEmit
# (no output — clean pass)
```

### 23. Integration Compatibility

The implementation's output format (bold labels `**Agent:**`, `**Duration:**`) is structurally similar to `events-writer.ts`'s `renderEventMarkdownBlock` which uses `- **Actor**:`, `- **Title**:`, etc. The formats are not identical but are consistent in style. Future consumers can adapt to either format.

No direct duplication with `renderEventMarkdownBlock` — they operate on different input shapes (`SessionEventWriteInput` vs `ParsedTurn`).

---

## Assumptions Challenged

| # | Assumption | Location | Risk if Wrong |
|---|-----------|----------|---------------|
| 1 | "Truncation means `maxChars` + ellipsis, not `maxChars - 1` + ellipsis" | formatter.ts:31,49 | Contract violation; downstream overflow by 1 char |
| 2 | "Format functions don't need wrapper interfaces" | formatter.ts:66,92 | Future callers can't pass timestamp/summaries |
| 3 | "Delegation targets don't need rendering" | formatter.ts:66-80 | Incomplete turn records; grep misses delegations |
| 4 | "Compaction events don't need before/after summaries" | formatter.ts:92-97 | Incomplete compaction records |
| 5 | "Test assertions with `<=` bounds are sufficient" | formatter.test.ts:70,78,101 | Masks off-by-one truncation discrepancy |

---

## Evidence Collected

```bash
# Tests pass
$ npx tsx --test src/features/event-tracker/writers/formatter.test.ts
# 19 tests, 19 pass, 0 fail

# Type check passes
$ npx tsc --noEmit
# (clean)

# LOC compliance
$ wc -l formatter.ts formatter.test.ts
# 98  201

# No anti-patterns
$ grep -c 'any' formatter.ts  # 0
$ grep -c 'console\.' formatter.ts  # 0
$ grep -c 'TODO\|FIXME' formatter.ts  # 0
$ grep -c 'TODO\|FIXME' formatter.test.ts  # 0
$ grep -c 'stub\|mock\|sinon\|jest' formatter.test.ts  # 0

# No forbidden imports
$ grep 'import.*fs\|import.*paths\|import.*writer' formatter.ts  # (empty)

# Directory test runner fails (tsx quirk, not formatter issue)
$ npx tsx --test src/features/event-tracker/writers/
# ERR_MODULE_NOT_FOUND: index.json (known tsx directory test limitation)

# Export/import alignment
$ grep 'export function' formatter.ts
# truncateForDisplay, truncateForIndex, formatTurnSection, formatCompactionEvent
$ grep 'import.*from.*formatter' formatter.test.ts
# truncateForDisplay, truncateForIndex, formatTurnSection, formatCompactionEvent
# All 4 exported functions are imported ✅
```

---

## Verdict

**NOT SAFE TO MERGE as plan-complete.**

The implementation is **clean, well-typed, and passes tests**, but it **significantly diverges from Plan 7's specification**. This is not a case of "slightly different approach" — it's missing entire features:

### What must change before claiming plan completion:

| Priority | Issue | Action |
|----------|-------|--------|
| **CRITICAL** | Truncation off-by-one | Change `slice(0, maxChars)` → `slice(0, maxChars - 1)` |
| **CRITICAL** | `formatTurnSection` signature | Accept `{ turn: ParsedTurn, timestamp?: string }` wrapper |
| **CRITICAL** | `formatCompactionEvent` signature | Accept `{ turn, timestamp?, beforeSummary?, afterSummary? }` wrapper |
| **HIGH** | Delegation targets missing | Add `### Delegations` rendering block |
| **HIGH** | Compaction before/after missing | Add `### Before` / `### After` sections |
| **HIGH** | Output format diverges | Align headings/bullets with plan spec |
| **MEDIUM** | Missing unicode tests | Add emoji/CJK truncation test cases |
| **MEDIUM** | Missing determinism tests | Add snapshot-style equality assertions |
| **LOW** | Stale RED-phase comment | Remove "DOES NOT EXIST YET" from test header |

### What is good and should be preserved:

- Clean pure-function architecture (no I/O)
- Correct ESM imports with `.js` suffixes
- Complete JSDoc on all exports
- Proper use of `tool.schema` patterns (not applicable here — this isn't a tool)
- All 19 tests pass, `tsc` is clean
- No anti-patterns detected

**Recommendation:** Either update the implementation to match the plan spec, or update the plan spec to reflect the simplified implementation (removing delegation targets, before/after summaries, and the wrapper interfaces). The current state is a mismatch that will confuse future consumers expecting the plan's API contract.
