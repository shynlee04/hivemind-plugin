# Plan #4: Turn Parser

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Parse raw session markdown files into structured turn objects with extracted metadata, counters, compaction detection, and delegation extraction.

**Architecture:** The turn parser is a pure-function module that ingests raw session markdown (a single string) and produces a `ParsedSession` object containing header metadata, an array of `ParsedTurn` objects, independent counters, and extracted delegation records. No I/O — all file reading is the caller's responsibility. Regex-driven splitting at `## User` / `## Assistant (...)` boundaries. Each concern (splitting, meta extraction, delegation extraction, counting) is isolated into its own focused function ≤300 LOC.

**Tech Stack:** TypeScript (ESM, `.js` extensions), `node:test` + `node:assert/strict`, no external dependencies.

---

## Scope Boundaries

### In Scope
- Splitting raw session markdown into turn objects at `## User` / `## Assistant (...)` boundaries
- Parsing agent name, model, duration from `## Assistant (Name · Model · Duration)` headers
- Detecting compaction turns (`## Assistant (Compaction · ...)`)
- Parsing `---` YAML-ish block for Session ID, Created, Updated
- Parsing `# [Title] - [Timestamp]` session header
- Independent turn counters: user message count, agent output count, delegation count
- Extracting delegation patterns from `task` tool JSON blocks within turns
- Defining local parser-specific types (not importing from existing event-tracker types)

### Out of Scope
- File I/O / reading session files from disk (caller's job)
- Writing parsed results to events.md, diagnostics.log, or session.json
- Session lifecycle management, session status tracking
- Event importance classification
- Tool invocation extraction beyond delegation `task` blocks
- Any interaction with the writers layer or paths layer
- Session index building or cross-session aggregation

---

## File Artifacts

| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/features/event-tracker/parser/types.ts` | Parser-specific types: `ParsedTurn`, `ParsedSession`, `ParsedHeader`, `ParsedDelegation`, `TurnCounters` | ~120 |
| `src/features/event-tracker/parser/splitter.ts` | Turn splitting: split raw markdown into raw turn blocks at `## User` / `## Assistant` boundaries | ~80 |
| `src/features/event-tracker/parser/meta-parser.ts` | Extract agent name, model, duration from assistant headers; detect compaction | ~100 |
| `src/features/event-tracker/parser/delegation-extractor.ts` | Parse delegation records from `task` tool JSON blocks | ~120 |
| `src/features/event-tracker/parser/header-parser.ts` | Parse `# Title - Timestamp` and `---` block (Session ID, Created, Updated) | ~90 |
| `src/features/event-tracker/parser/counter.ts` | Independent counters: user messages, agent outputs, delegations (reset between assistant outputs) | ~60 |
| `src/features/event-tracker/parser/turn-parser.ts` | Orchestrator: compose splitter → meta → delegation → counter into `parseSession()` entry point | ~100 |
| `src/features/event-tracker/parser/types.test.ts` | Type shape tests for parser types | ~80 |
| `src/features/event-tracker/parser/splitter.test.ts` | Turn splitting tests with fixture markdown | ~120 |
| `src/features/event-tracker/parser/meta-parser.test.ts` | Meta extraction tests (agent, model, duration, compaction) | ~100 |
| `src/features/event-tracker/parser/delegation-extractor.test.ts` | Delegation extraction tests from task tool blocks | ~100 |
| `src/features/event-tracker/parser/header-parser.test.ts` | Header parsing tests | ~80 |
| `src/features/event-tracker/parser/counter.test.ts` | Counter tests with delegation resets | ~80 |
| `src/features/event-tracker/parser/turn-parser.test.ts` | Integration tests: full session markdown → ParsedSession | ~120 |

---

## Dependencies

### Must Exist (already built)
- `src/features/event-tracker/types.ts` — reference only for field naming conventions (`TurnMeta`, `SessionMeta`, `DelegationRecord`). Parser defines its own local types — does NOT import from types.ts.
- `node:test` and `node:assert/strict` — test framework

### Must NOT Import From
- `src/features/event-tracker/types.ts` — parser types are independent
- `src/features/event-tracker/paths.ts` — parser is pure, no I/O
- `src/features/event-tracker/writers/` — parser is pure, no I/O
- `start-work-types.ts`, `prompt-packet-types.ts`, or any other legacy types

### Test Fixtures
- Inline string fixtures within test files (no external fixture files)
- Representative session markdown snippets covering: normal turns, compaction, delegation blocks, empty sessions, multi-turn sessions

---

## Implementation Steps

### Step 1: Define parser types (`parser/types.ts`)

Define the following types. These are local to the parser and do NOT import from `../types.ts`:

- `ParsedHeader`: `{ title: string; timestamp: string; sessionId: string; created: string; updated: string }`
- `ParsedTurn`: `{ turnNumber: number; userMessage: string; assistantContent: string; thinking: string | null; agentName: string; model: string; duration: number | null; isCompaction: boolean; delegationTargets: ParsedDelegation[] }`
- `ParsedDelegation`: `{ delegatedTo: string; description: string; subagentType: string; packetId: string | null }`
- `TurnCounters`: `{ userMessageCount: number; agentOutputCount: number; delegationCount: number }`
- `ParsedSession`: `{ header: ParsedHeader; turns: ParsedTurn[]; counters: TurnCounters; delegations: ParsedDelegation[] }`

Each type uses JSDoc comments. All fields explicitly typed — no `any`. File ≤120 lines.

### Step 2: Write types test (`parser/types.test.ts`)

TDD RED phase. Verify each type has correct shape keys using `assertShapeKeys` pattern from existing `types.test.ts`. Test that all required fields exist and have correct types. Use `node:test` + `node:assert/strict`. Import types with `import type` for shape verification, and also import any exported constants if any exist.

### Step 3: Implement header parser (`parser/header-parser.ts`)

Pure function: `parseSessionHeader(markdown: string): ParsedHeader`

Parse two patterns:
1. `# [Title] - [ISO8601 timestamp]` — extract title and timestamp
2. `---` block containing `**Session ID:**`, `**Created:**`, `**Updated:**`

Return defaults (`'N/A'`) for missing fields. Regex-based — no external parser library. JSDoc with `@param`, `@returns`, `@example`. File ≤90 lines.

### Step 4: Write header parser test (`parser/header-parser.test.ts`)

TDD RED → GREEN. Test cases:
- Standard header with all fields present
- Missing Session ID → defaults to `'N/A'`
- Missing Created/Updated → defaults to `'N/A'`
- Title with special characters (parentheses, dots)
- Empty markdown → returns defaults

### Step 5: Implement turn splitter (`parser/splitter.ts`)

Pure function: `splitTurns(markdown: string): string[]`

Split raw session markdown at `## User` boundaries. Each element in the returned array is the raw text from one `## User` through the next `## User` (or end of file). The split must:
- Use `## User` as the delimiter (line starting with exactly `## User`)
- Include everything up to but not including the next `## User` or end of string
- Return empty array for markdown with no `## User` sections
- Preserve inner content verbatim (assistant blocks, tool blocks, thinking blocks)

JSDoc. File ≤80 lines.

### Step 6: Write splitter test (`parser/splitter.test.ts`)

TDD RED → GREEN. Test cases:
- Single user + assistant pair → 1 element
- Multiple turns → correct count
- Compaction turn (no `## User` before it) → handled correctly
- Empty string → empty array
- No `## User` sections → empty array
- Content with `## User` in code blocks → not treated as delimiter (edge case, document if not handled)

### Step 7: Implement meta parser (`parser/meta-parser.ts`)

Pure functions:
- `parseAssistantMeta(assistantLine: string): { agentName: string; model: string; duration: number | null }` — parse `## Assistant (AgentName · Model · Duration)`
- `isCompactionTurn(assistantLine: string): boolean` — detect `## Assistant (Compaction · ...)`
- `parseDuration(durationStr: string): number | null` — parse duration string (e.g., "1.2s", "500ms") to milliseconds, or null if unparseable

The `·` character is U+00B7 (middle dot). Regex must handle this character. JSDoc on all exports. File ≤100 lines.

### Step 8: Write meta parser test (`parser/meta-parser.test.ts`)

TDD RED → GREEN. Test cases:
- Standard assistant header: `## Assistant (general · opencode/mimo-v2-pro-free · 1.2s)` → correct agent, model, duration
- Compaction header: `## Assistant (Compaction · model · 500ms)` → isCompaction = true
- Missing duration → duration = null
- Duration in milliseconds: `500ms` → 500
- Duration in seconds: `1.2s` → 1200
- Malformed header → graceful defaults

### Step 9: Implement delegation extractor (`parser/delegation-extractor.ts`)

Pure function: `extractDelegations(turnText: string): ParsedDelegation[]`

Scan a turn's raw text for `**Tool: task**` blocks. Within those blocks, find `**Input:**` followed by a JSON code fence. Parse the JSON and extract:
- `delegatedTo` — from the JSON `agent` or `subagent_type` field
- `description` — from the JSON `description` or `prompt` field
- `subagentType` — from the JSON `subagent_type` field
- `packetId` — from the JSON `packet_id` or `task_id` field, or null

Return empty array if no delegation blocks found. Handle JSON parse failures gracefully (skip block, don't throw). JSDoc. File ≤120 lines.

### Step 10: Write delegation extractor test (`parser/delegation-extractor.test.ts`)

TDD RED → GREEN. Test cases:
- Turn with `**Tool: task**` and valid JSON input → extracts delegation
- Turn with no tool blocks → empty array
- Turn with non-task tool blocks → empty array
- Turn with malformed JSON in task input → skips gracefully
- Multiple delegation blocks in one turn → extracts all
- Missing optional JSON fields → defaults to empty string / null

### Step 11: Implement counter (`parser/counter.ts`)

Pure function: `countTurns(turns: ParsedTurn[]): TurnCounters`

Three independent counters:
- `userMessageCount`: count of turns where `userMessage` is non-empty
- `agentOutputCount`: count of turns where `isCompaction` is false AND `assistantContent` is non-empty
- `delegationCount`: count of delegation targets across all turns (sum of `turn.delegationTargets.length`)

Note: delegation count resets between assistant outputs per spec — but the counter function receives already-split turns, so each turn's delegation targets are naturally scoped. The "reset" behavior is inherent in the splitting.

JSDoc. File ≤60 lines.

### Step 12: Write counter test (`parser/counter.test.ts`)

TDD RED → GREEN. Test cases:
- 3 turns (2 user+agent, 1 compaction) → userCount=2, agentCount=2, delegationCount=0
- Turn with 2 delegation targets → delegationCount=2
- Empty turns array → all counts = 0
- Turn with empty userMessage → not counted as user message
- Compaction turn → not counted as agent output

### Step 13: Implement orchestrator (`parser/turn-parser.ts`)

Pure function: `parseSession(markdown: string): ParsedSession`

Compose the pipeline:
1. `parseSessionHeader(markdown)` → header
2. Strip header block (everything up to and including the `---` block) from markdown before splitting
3. `splitTurns(bodyMarkdown)` → raw turn blocks
4. For each turn block:
   - Extract `## User` content → userMessage
   - Find `## Assistant (...)` line → `parseAssistantMeta()` for agent/model/duration
   - `isCompactionTurn()` for compaction flag
   - Extract assistant content (text between assistant header and next section)
   - `extractDelegations()` for delegation targets
5. `countTurns(parsedTurns)` → counters
6. Flatten all delegation targets across turns → top-level delegations array

Return `ParsedSession`. JSDoc with `@param`, `@returns`, `@example`. File ≤100 lines.

### Step 14: Write orchestrator test (`parser/turn-parser.test.ts`)

TDD RED → GREEN. Test cases:
- Full session markdown (header + 2 turns + 1 compaction) → correct ParsedSession
- Session with delegation in one turn → delegations populated
- Empty markdown → empty turns, default header
- Session with thinking blocks → thinking extracted
- Session with tool invocations (non-task) → ignored (not in scope)
- Multi-turn session → correct turn numbering

---

## Test Requirements

| Test Scenario | Expected Behavior |
|---------------|-------------------|
| Parse standard session header | Extracts title, timestamp, sessionId, created, updated |
| Missing header fields | Defaults to `'N/A'` |
| Split single turn | Returns 1-element array with full turn content |
| Split multiple turns | Returns N elements, each starting at `## User` |
| Empty markdown | Returns empty array from splitter |
| Standard assistant header | Extracts agent name, model, duration correctly |
| Compaction assistant header | `isCompaction = true`, agent = `'Compaction'` |
| Duration `1.2s` | Parsed to `1200` ms |
| Duration `500ms` | Parsed to `500` ms |
| Duration missing | Returns `null` |
| Delegation in task tool block | Extracts `delegatedTo`, `description`, `subagentType`, `packetId` |
| No task tool blocks | Returns empty delegation array |
| Malformed JSON in task block | Skips gracefully, no throw |
| Count user messages | Counts turns with non-empty userMessage |
| Count agent outputs | Excludes compaction turns |
| Count delegations | Sums delegation targets across all turns |
| Full session parse | Returns complete `ParsedSession` with header, turns, counters, delegations |
| Thinking block extraction | `thinking` field populated, not null |
| No thinking block | `thinking` field is `null` |

---

## Verification Criteria

After implementation, run these commands in order:

1. **Type check:** `npx tsc --noEmit`
   - Expected: Zero errors across all parser files

2. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/types.test.ts`
   - Expected: All pass

3. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/header-parser.test.ts`
   - Expected: All pass

4. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/splitter.test.ts`
   - Expected: All pass

5. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/meta-parser.test.ts`
   - Expected: All pass

6. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/delegation-extractor.test.ts`
   - Expected: All pass

7. **Unit tests:** `npx tsx --test src/features/event-tracker/parser/counter.test.ts`
   - Expected: All pass

8. **Integration tests:** `npx tsx --test src/features/event-tracker/parser/turn-parser.test.ts`
   - Expected: All pass

9. **Full suite:** `npm test`
   - Expected: All existing + new tests pass, zero regressions

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Assistant header format varies across sessions | Medium | High | Test with multiple real header formats; handle missing fields gracefully with null defaults |
| `## User` appearing inside code blocks causes false splits | Low | Medium | Document known limitation; add test that verifies behavior; consider fence-aware splitting if needed |
| Delegation JSON schema varies across tool versions | Medium | Low | Extract only well-known fields; skip blocks with unparseable JSON; don't throw |
| Middle dot `·` character encoding issues | Low | Low | Use exact Unicode `\u00B7` in regex; test with real session samples |
| Duration format variations (`s`, `ms`, `m`, missing unit) | Medium | Low | Support `s` and `ms` only; return null for unrecognized formats |
| LOC approaching 300 limit in delegation-extractor | Low | Low | Extract JSON parsing helper if needed; keep functions focused |

---

## Architect Decisions Needed

| Decision | Context | Urgency |
|----------|---------|---------|
| Should parser types reuse any fields from existing `types.ts` (e.g., `TurnMeta`, `SessionMeta`)? | Plan defines independent parser types per constraints ("Do NOT import existing types"). Confirm this is the intended isolation boundary. | Before Step 1 |
| Should `## Assistant` without parenthesized metadata be supported? | Real sessions always have `(Name · Model · Duration)`. If some legacy sessions lack this, meta parser needs fallback. | Before Step 7 |
| Should delegation extraction handle non-`task` tool delegation patterns? | Spec says "task tool JSON blocks". Confirm no other delegation mechanisms exist in session markdown. | Before Step 9 |
