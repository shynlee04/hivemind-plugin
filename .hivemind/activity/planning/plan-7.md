# Plan #7: Formatter (Unit 4 Remainder)

## Objective
Build the remaining Unit 4 formatter functions as a standalone pure-function module (`formatter.ts`) under `src/features/event-tracker/writers/`. The module provides `formatTurnSection`, `formatCompactionEvent`, and truncation utilities (`truncateForDisplay`, `truncateForIndex`) that session-writer and future consumers can import for deterministic, grep-friendly markdown output.

## Scope Boundaries
### In Scope
- Create `src/features/event-tracker/writers/formatter.ts` as a pure-function module (no I/O).
- Implement `truncateForDisplay(text, maxChars=500)` and `truncateForIndex(text, maxChars=200)` with ellipsis truncation, unicode-safe handling, and empty/short-string passthrough.
- Implement `formatTurnSection(turn: ParsedTurn)` producing a grep-friendly markdown block for `delegation.md` or `session.json` turn records.
- Implement `formatCompactionEvent(turn: ParsedTurn)` producing a formatted compaction event entry with timestamp, before/after markers.
- Create `src/features/event-tracker/writers/formatter.test.ts` with `node:test` + `node:assert/strict` coverage.
- Ensure `renderEventMarkdownBlock` (events-writer) and `renderDiagnosticLogLine` (diagnostics-writer) continue working unchanged — formatter is additive.

### Out of Scope
- Changing `renderEventMarkdownBlock` or `renderDiagnosticLogLine` — already built, out of Unit 4 scope.
- Integrating formatter into session-writer call sites — that is a separate wiring step.
- Parser changes — formatter consumes existing `ParsedTurn` shape as-is.
- Schema expansion — no new types beyond local input interfaces for formatter functions.
- File I/O — formatter is pure functions only.

## File Artifacts
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/features/event-tracker/writers/formatter.ts` | Truncation utilities, `formatTurnSection`, `formatCompactionEvent` — all pure functions | 150-200 |
| `src/features/event-tracker/writers/formatter.test.ts` | Unit tests for truncation, turn formatting, and compaction formatting | 180-250 |

## Dependencies
- `src/features/event-tracker/parser/types.ts` — `ParsedTurn` input shape the formatter must accept.
- `src/features/event-tracker/types.ts` — `TurnEntry`, `TurnMeta` for reference (formatter maps from ParsedTurn, not TurnEntry).
- `src/features/event-tracker/writers/events-writer.ts` — reference pattern for markdown block rendering (`renderEventMarkdownBlock`).
- `src/features/event-tracker/writers/diagnostics-writer.ts` — reference pattern for log-line rendering (`renderDiagnosticLogLine`).
- `src/features/event-tracker/writers/session-writer.ts` — future consumer of `formatTurnSection` and `formatCompactionEvent`.
- `node:test` and `node:assert/strict` — only allowed test framework.

## Architecture Decision
**(A) Standalone `formatter.ts` module.** Both existing writers absorbed Unit 4 functions inline, but the remaining functions serve multiple consumers (session-writer, index-writer, future synthesizer). A shared formatter module avoids duplication and follows the Authority Principle: one formatter, one owner. Writers import from `./formatter.js` — no circular dependency risk since formatter has zero imports from writers.

## Implementation Steps

### Step 1: Define truncation utilities
Create `src/features/event-tracker/writers/formatter.ts` with two exported pure functions:

```typescript
/**
 * Truncates text for display output (e.g., assistant summaries).
 * @param text Source text to truncate.
 * @param maxChars Maximum characters before ellipsis (default 500).
 * @returns Original text if within limit, or truncated text with '…' suffix.
 */
export function truncateForDisplay(text: string, maxChars = 500): string

/**
 * Truncates text for index/compact output (e.g., user messages in turn headers).
 * @param text Source text to truncate.
 * @param maxChars Maximum characters before ellipsis (default 200).
 * @returns Original text if within limit, or truncated text with '…' suffix.
 */
export function truncateForIndex(text: string, maxChars = 200): string
```

Both functions must:
- Return `''` for empty/whitespace-only input (no ellipsis on empty).
- Return original text unchanged if `text.length <= maxChars`.
- Truncate to `maxChars - 1` chars + `'…'` (single unicode ellipsis) when exceeding limit.
- Handle multi-byte unicode correctly by operating on string length (JS string indexing is already UTF-16 code units; acceptable for this use case).

### Step 2: Define formatTurnSection
Add to `formatter.ts`:

```typescript
import type { ParsedTurn } from '../parser/types.js'

interface TurnSectionInput {
  turn: ParsedTurn
  timestamp?: string
}

/**
 * Renders a grep-friendly markdown section for a parsed turn.
 * Suitable for delegation.md or session.json turn records.
 * @param input Turn data plus optional timestamp override.
 * @returns Deterministic markdown block.
 */
export function formatTurnSection(input: TurnSectionInput): string
```

Output format (deterministic, grep-friendly):
```markdown
## Turn {turnNumber}

- **Agent**: {agentName}
- **Model**: {model}
- **Duration**: {duration}ms | N/A

### User Message

{truncateForIndex(userMessage, 200)}

### Assistant

{truncateForDisplay(assistantContent, 500)}

```

Rules:
- Turn header is `## Turn {N}` — grep-friendly with turn number inline.
- Duration shows `{N}ms` if present, `N/A` if null.
- User message truncated to 200 chars via `truncateForIndex`.
- Assistant content truncated to 500 chars via `truncateForDisplay`.
- Delegation targets listed under `### Delegations` if `turn.delegationTargets.length > 0`.
- Each delegation rendered as `- {delegatedTo}: {description}`.
- Output ends with blank line for separation.

### Step 3: Define formatCompactionEvent
Add to `formatter.ts`:

```typescript
interface CompactionEventInput {
  turn: ParsedTurn
  timestamp?: string
  beforeSummary?: string
  afterSummary?: string
}

/**
 * Renders a formatted compaction event entry.
 * @param input Compaction turn data with optional before/after summaries.
 * @returns Deterministic grep-friendly markdown block.
 */
export function formatCompactionEvent(input: CompactionEventInput): string
```

Output format:
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

Rules:
- Assert `input.turn.isCompaction === true` (callers must filter; formatter documents this contract).
- `beforeSummary` and `afterSummary` are optional — render `N/A` if absent.
- Both summaries truncated to 500 chars.
- Output ends with blank line for separation.

### Step 4: Write RED tests for truncation utilities
Create `src/features/event-tracker/writers/formatter.test.ts` with these test cases:

1. `truncateForDisplay` returns empty string for empty input.
2. `truncateForDisplay` returns original for text shorter than max.
3. `truncateForDisplay` returns original for text exactly at max.
4. `truncateForDisplay` truncates with ellipsis for text exceeding max.
5. `truncateForDisplay` respects custom maxChars parameter.
6. `truncateForDisplay` handles unicode (emoji, CJK) by string length.
7. `truncateForIndex` returns empty string for empty input.
8. `truncateForIndex` returns original for text shorter than 200.
9. `truncateForIndex` truncates with ellipsis for text exceeding 200.
10. `truncateForIndex` respects custom maxChars parameter.

### Step 5: Write RED tests for formatTurnSection
Add to `formatter.test.ts`:

1. Basic turn produces expected header, agent, model, duration lines.
2. Null duration renders `N/A`.
3. User message truncated at 200 chars in output.
4. Assistant content truncated at 500 chars in output.
5. Delegation targets listed when present.
6. No delegation section when `delegationTargets` is empty.
7. Output is deterministic for same input (snapshot-style assertion).

### Step 6: Write RED tests for formatCompactionEvent
Add to `formatter.test.ts`:

1. Compaction event includes turn number, agent, timestamp.
2. Missing timestamp renders `N/A`.
3. Before/after summaries present and truncated at 500 chars.
4. Missing before/after summaries render `N/A`.
5. Output is deterministic for same input.

### Step 7: Implement formatter.ts to pass tests
Implement `formatter.ts` following the function signatures defined above. Keep all functions pure — no I/O, no side effects. Use `asDisplayValue` pattern from events-writer for `N/A` fallbacks. Total module should stay under 200 LOC.

### Step 8: Run full verification
```bash
npx tsx --test src/features/event-tracker/writers/formatter.test.ts
npx tsc --noEmit
```
Both must pass green. Then verify existing tests still pass:
```bash
npx tsx --test src/features/event-tracker/writers/
```

### Step 9: Commit
```bash
git add src/features/event-tracker/writers/formatter.ts src/features/event-tracker/writers/formatter.test.ts
git commit -m "feat(formatter): add formatTurnSection, formatCompactionEvent, and truncation utilities"
```

## Test Requirements
| Test Scenario | Expected Behavior |
|---------------|-------------------|
| `truncateForDisplay('')` | Returns `''` (no ellipsis) |
| `truncateForDisplay('short')` with default 500 | Returns `'short'` unchanged |
| `truncateForDisplay('a'.repeat(600))` | Returns first 499 chars + `'…'` |
| `truncateForDisplay('hello', 3)` | Returns `'he…'` |
| `truncateForIndex('')` | Returns `''` |
| `truncateForIndex` with 250-char string | Truncates to 199 + `'…'` |
| Unicode emoji string exceeding max | Truncates by string length, not bytes |
| `formatTurnSection` with full ParsedTurn | Contains `## Turn N`, agent, model, user msg, assistant content |
| `formatTurnSection` with null duration | Shows `Duration: N/A` |
| `formatTurnSection` with delegation targets | Includes `### Delegations` section |
| `formatTurnSection` with empty delegations | No `### Delegations` section |
| User message > 200 chars | Truncated via `truncateForIndex` in output |
| Assistant content > 500 chars | Truncated via `truncateForDisplay` in output |
| `formatCompactionEvent` with full data | Contains `## Compaction`, turn, agent, timestamp, before/after |
| `formatCompactionEvent` with missing optionals | Before/after show `N/A`, timestamp shows `N/A` |
| Same input twice → same output | Deterministic formatting |

## Verification Criteria
- `npx tsx --test src/features/event-tracker/writers/formatter.test.ts` passes with all scenarios green.
- `npx tsc --noEmit` passes after adding formatter module and tests.
- `src/features/event-tracker/writers/formatter.ts` ≤ 200 LOC.
- `src/features/event-tracker/writers/formatter.test.ts` ≤ 250 LOC.
- All imports use ESM `.js` suffixes.
- No imports from writer modules (formatter is dependency-leaf).
- Existing tests for events-writer, diagnostics-writer, and session-writer remain green.
