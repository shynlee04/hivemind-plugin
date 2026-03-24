# Plan #8: Index + Synthesizer Writer (Unit 7)

## Objective
Build two new modules under `src/features/event-tracker/writers/`: an **index writer** that maintains a grep/search-friendly master session index (`index.md`) and provides read-side query functions, and a **synthesizer** that produces per-session `synthesis.md` artifacts summarizing turn structure, delegation chains, and key findings. These modules complete the searchable-artifact surface for the session journal system.

## Scope Boundaries
### In Scope
- Create `src/features/event-tracker/writers/index-writer.ts` — master index maintenance and read-side queries.
- Create `src/features/event-tracker/writers/synthesizer.ts` — per-session synthesis generation.
- Create `src/features/event-tracker/writers/index-writer.test.ts` — unit tests for index operations.
- Create `src/features/event-tracker/writers/synthesizer.test.ts` — unit tests for synthesis generation.
- New input types for index entries and synthesis inputs (added to `types.ts` or local to modules).
- Reuse existing path builders: `getEventTrackerIndexPath`, `getSessionSynthesisPath` from `paths.ts`.
- Reuse existing formatter: `truncateForIndex`, `truncateForDisplay` from `formatter.ts`.

### Out of Scope
- Changes to parser (`parser/`), classifier (`classifier/`), or session-writer (`session-writer.ts`).
- Hook handler wiring or plugin integration (Unit 8/9 scope).
- Any persistence backend beyond local markdown/JSON files.
- Changes to existing path builders in `paths.ts`.
- Changes to existing formatter in `formatter.ts`.

## File Artifacts
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/features/event-tracker/types.ts` | Add `IndexEntry`, `SynthesisInput` types | +40-60 |
| `src/features/event-tracker/writers/index-writer.ts` | `updateMasterIndex`, `getActiveSessions`, `getSubSessions`, `getSessionTree`, index rendering | 200-280 |
| `src/features/event-tracker/writers/synthesizer.ts` | `generateSessionSynthesis`, synthesis rendering | 180-250 |
| `src/features/event-tracker/writers/index-writer.test.ts` | Tests for index CRUD, query functions, tree building | 200-280 |
| `src/features/event-tracker/writers/synthesizer.test.ts` | Tests for synthesis generation, edge cases | 180-250 |

## Dependencies
- `src/features/event-tracker/types.ts` — `SessionMeta`, `DelegationRecord`, `SessionRelationships`, `Lineage`, `PurposeClass`.
- `src/features/event-tracker/paths.ts` — `getEventTrackerIndexPath(projectRoot)`, `getSessionSynthesisPath(projectRoot, sessionId)`.
- `src/features/event-tracker/writers/formatter.ts` — `truncateForIndex`, `truncateForDisplay`, `asDisplayValue` pattern.
- `src/features/event-tracker/writers/base-writer.ts` — `appendExactUtf8Content` (if append-mode used for index).
- `src/features/event-tracker/parser/types.ts` — `ParsedTurn`, `ParsedDelegation` for synthesis input.
- `node:test` + `node:assert/strict` — test framework.
- ESM `.js` import suffixes required.

## Architecture Decisions

### Index Format (A): One-line-per-session markdown
The index file is a flat markdown document at `.hivemind/sessions/index.md`. Each session occupies exactly one grep-friendly line:

```
| ses_abc123 | hiveminder | planning | active   | 2026-03-24T10:00:00Z | 42 | 3 |
| ses_def456 | hivefiver  | research | completed| 2026-03-23T08:30:00Z | 15 | 0 |
```

Columns: `sessionId | lineage | purposeClass | status | created | turns | delegations`. Markdown table format enables `grep ses_` lookups and pipe-delimited parsing.

### Index Write Strategy (B): Full rewrite, not append
Unlike events.md (append-only), the index is a derived aggregate — it must reflect current state of ALL sessions. On `updateMasterIndex`, the function reads existing session metadata from all `session.json` files, regenerates the full index, and writes it atomically. This avoids stale-entry accumulation.

### Synthesis Format (C): Structured markdown per session
Each `synthesis.md` at `.hivemind/sessions/{sessionId}/synthesis.md` contains:
1. Header block (session ID, lineage, purpose, agent, status, time range).
2. Turn summary table (turn #, agent, model, duration, delegation count).
3. Delegation chain (tree or flat list depending on depth).
4. Key findings section (extracted from high-importance events).
5. Compaction events if any.

### Query Functions (D): Pure functions over in-memory data
`getActiveSessions`, `getSubSessions`, `getSessionTree` operate on an in-memory `IndexEntry[]` array (loaded from index.md or built from session.json scan). They are pure functions — no I/O in query logic. I/O is isolated to `updateMasterIndex` and `generateSessionSynthesis`.

## Implementation Steps

### Step 1: Define Index + Synthesis types in types.ts
Add to `src/features/event-tracker/types.ts`:

```typescript
/** One entry in the master session index. */
export interface IndexEntry {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  status: SessionMeta['status']
  created: string
  updated: string
  turnCount: number
  delegationCount: number
  parentSessionId: string | null
}

/** Input for generating a session synthesis artifact. */
export interface SynthesisInput {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  status: SessionMeta['status']
  created: string
  updated: string
  turns: SynthesisTurnSummary[]
  delegations: SynthesisDelegationEntry[]
  highImportanceEvents: SynthesisEventEntry[]
  compactionCount: number
}

export interface SynthesisTurnSummary {
  turnNumber: number
  agent: string
  model: string
  duration: number | null
  delegationCount: number
  userMessagePreview: string
}

export interface SynthesisDelegationEntry {
  packetId: string
  delegatedTo: string
  subagentType: string
  status: DelegationStatus
  description: string
}

export interface SynthesisEventEntry {
  turnNumber: number
  type: EventType
  summary: string
}
```

### Step 2: Create index-writer.ts — rendering functions
Create `src/features/event-tracker/writers/index-writer.ts` with pure rendering functions first:

- `renderIndexHeader(): string` — returns the markdown table header row.
- `renderIndexEntry(entry: IndexEntry): string` — formats one session as a pipe-delimited table row.
- `renderIndexTable(entries: IndexEntry[]): string` — renders full index markdown (header + all rows, sorted by `created` descending).

Index markdown format:
```markdown
# Session Index

| Session ID | Lineage | Purpose | Status | Created | Turns | Delegations | Parent |
|------------|---------|---------|--------|---------|-------|-------------|--------|
| ses_abc123 | hiveminder | planning | active | 2026-03-24T10:00:00Z | 42 | 3 | — |
```

### Step 3: Create index-writer.ts — query functions
Add pure query functions to `index-writer.ts`:

- `getActiveSessions(entries: IndexEntry[]): IndexEntry[]` — filter where `status === 'active'`.
- `getSubSessions(entries: IndexEntry[], parentSessionId: string): IndexEntry[]` — filter where `parentSessionId` matches.
- `getSessionTree(entries: IndexEntry[], rootSessionId: string): SessionTreeNode` — build recursive tree structure.

```typescript
export interface SessionTreeNode {
  entry: IndexEntry
  children: SessionTreeNode[]
}
```

`getSessionTree` builds the tree by iterating entries, matching `parentSessionId` to `sessionId`, and recursing. Returns a single root node with nested children.

### Step 4: Create index-writer.ts — I/O functions
Add I/O functions following the `render*`/`append*` pattern:

- `updateMasterIndex(projectRoot: string, entries: IndexEntry[]): Promise<void>` — renders full index markdown via `renderIndexTable`, writes to `getEventTrackerIndexPath(projectRoot)` using `writeFile` (full rewrite, not append). Creates parent directory if missing.

This is the ONLY function in index-writer that performs I/O. All others are pure.

### Step 5: Create synthesizer.ts — rendering functions
Create `src/features/event-tracker/writers/synthesizer.ts`:

- `renderSynthesisHeader(input: SynthesisInput): string` — session identity block.
- `renderTurnSummaryTable(turns: SynthesisTurnSummary[]): string` — turn overview table.
- `renderDelegationChain(delegations: SynthesisDelegationEntry[]): string` — delegation list.
- `renderKeyFindings(events: SynthesisEventEntry[]): string` — high-importance event summaries.
- `renderSynthesis(input: SynthesisInput): string` — composes all sections into full synthesis markdown.

Synthesis markdown format:
```markdown
# Session Synthesis: ses_abc123

## Identity

- **Lineage**: hiveminder
- **Purpose**: planning
- **Agent**: hivemaker
- **Status**: active
- **Created**: 2026-03-24T10:00:00Z
- **Updated**: 2026-03-24T12:30:00Z

## Turn Summary

| # | Agent | Model | Duration | Delegations |
|---|-------|-------|----------|-------------|
| 1 | hivemaker | gpt-4 | 1200ms | 2 |
| 2 | hiveq | gpt-4 | 800ms | 0 |

## Delegation Chain

- **explore** — investigate codebase structure (subagent: explore) [completed]
- **hivmaker** — implement parser module (subagent: general) [completed]

## Key Findings

- Turn 3: delegation_created — dispatched to explore for codebase mapping
- Turn 5: delegation_returned — explore returned findings, 12 files analyzed

## Compaction Events

- 1 compaction(s) recorded
```

### Step 6: Create synthesizer.ts — I/O function
Add the single I/O function:

- `generateSessionSynthesis(projectRoot: string, input: SynthesisInput): Promise<void>` — renders full synthesis via `renderSynthesis`, writes to `getSessionSynthesisPath(projectRoot, input.sessionId)` using `writeFile`. Creates session directory if missing.

### Step 7: Write RED tests for index-writer
Create `src/features/event-tracker/writers/index-writer.test.ts`:

**renderIndexEntry tests:**
1. Single entry renders correct pipe-delimited row with all fields.
2. Null parent renders `—` (em dash) in Parent column.
3. Entry with zero turns/delegations renders `0` values.

**renderIndexTable tests:**
4. Multiple entries produce header + rows, sorted by created descending.
5. Empty entries array produces header only (no data rows).
6. Output is deterministic for same input.

**getActiveSessions tests:**
7. Filters only `status: 'active'` entries.
8. Returns empty when all entries are completed.
9. Returns empty for empty input.

**getSubSessions tests:**
10. Filters entries matching parentSessionId.
11. Returns empty when no children exist.
12. Null parent entries excluded from sub-session results.

**getSessionTree tests:**
13. Single root with no children returns flat node.
14. Root with 2 children returns tree of depth 2.
15. Multi-level tree (root → child → grandchild) returns correct nesting.
16. Orphan entries (parent not in set) are excluded from tree.

**updateMasterIndex tests:**
17. Writes index.md to correct path with rendered content.
18. Overwrites existing index.md (full rewrite).
19. Creates parent directory if missing.

### Step 8: Write RED tests for synthesizer
Create `src/features/event-tracker/writers/synthesizer.test.ts`:

**renderSynthesisHeader tests:**
1. Header includes all identity fields (lineage, purpose, agent, status, created, updated).
2. Renders session ID in title.

**renderTurnSummaryTable tests:**
3. Table includes all turns with agent, model, duration, delegation count.
4. Null duration renders `N/A`.
5. Empty turns array renders "No turns recorded.".

**renderDelegationChain tests:**
6. Each delegation shows delegatedTo, subagentType, status, description.
7. Empty delegations array renders "No delegations.".

**renderKeyFindings tests:**
8. Each event shows turn number, type, summary.
9. Empty events array renders "No high-importance events.".

**renderSynthesis tests:**
10. Full input produces complete synthesis with all sections.
11. Zero compactions omits compaction section or shows "0 compaction(s)".
12. Output is deterministic for same input.

**generateSessionSynthesis tests:**
13. Writes synthesis.md to correct session path.
14. Overwrites existing synthesis.md.
15. Creates session directory if missing.

### Step 9: Implement index-writer.ts to pass tests
Implement `index-writer.ts` following the signatures defined above. Follow established patterns:
- Pure render functions return strings.
- `N/A` fallback via `asDisplayValue` pattern from formatter.
- `updateMasterIndex` uses `writeFile` (full rewrite) not `appendExactUtf8Content`.
- Query functions are pure — accept `IndexEntry[]`, return filtered/structured results.
- Total module ≤ 300 LOC.

### Step 10: Implement synthesizer.ts to pass tests
Implement `synthesizer.ts` following the signatures defined above. Follow established patterns:
- Compose `renderSynthesis` from section renderers.
- Use `truncateForIndex` for user message previews in turn summaries.
- `generateSessionSynthesis` uses `writeFile` for full artifact generation.
- Total module ≤ 300 LOC.

### Step 11: Add types to types.ts
Add `IndexEntry`, `SynthesisInput`, `SynthesisTurnSummary`, `SynthesisDelegationEntry`, `SynthesisEventEntry`, `SessionTreeNode` to `types.ts`. Keep additions under 60 LOC. Use intersection types if decomposition is needed (follow existing `SessionMeta` pattern).

### Step 12: Run full verification
```bash
npx tsc --noEmit
npx tsx --test src/features/event-tracker/writers/index-writer.test.ts
npx tsx --test src/features/event-tracker/writers/synthesizer.test.ts
```
All must pass green. Then verify existing tests still pass:
```bash
npx tsx --test src/features/event-tracker/writers/
npx tsx --test src/features/event-tracker/
```

### Step 13: Commit
```bash
git add src/features/event-tracker/types.ts \
        src/features/event-tracker/writers/index-writer.ts \
        src/features/event-tracker/writers/synthesizer.ts \
        src/features/event-tracker/writers/index-writer.test.ts \
        src/features/event-tracker/writers/synthesizer.test.ts
git commit -m "feat(index-synthesizer): add master index writer and session synthesizer"
```

## Test Requirements
| Test Scenario | Expected Behavior |
|---------------|-------------------|
| `renderIndexEntry` with full fields | Pipe-delimited row: `ses_id | lineage | purpose | status | created | turns | delegations | parent` |
| `renderIndexEntry` with null parent | Parent column shows `—` |
| `renderIndexTable` with 3 entries | Header + 3 rows, sorted created DESC |
| `renderIndexTable` with empty input | Header only, no data rows |
| `getActiveSessions` mixed statuses | Returns only active entries |
| `getSubSessions` with matching parent | Returns child entries only |
| `getSessionTree` depth-2 | Root → 2 children, correct nesting |
| `getSessionTree` orphan entries | Orphans excluded from tree |
| `updateMasterIndex` writes file | File exists at index path with expected content |
| `renderSynthesisHeader` full input | All identity fields present |
| `renderTurnSummaryTable` 3 turns | Table with 3 rows, N/A for null duration |
| `renderDelegationChain` 2 delegations | List with status and description |
| `renderKeyFindings` empty | "No high-importance events." |
| `renderSynthesis` full input | Complete markdown with all 5 sections |
| `generateSessionSynthesis` writes file | File exists at synthesis path |
| Deterministic output same input | Two renders produce identical strings |

## Verification Criteria
- `npx tsc --noEmit` passes — no type errors.
- `npx tsx --test src/features/event-tracker/writers/index-writer.test.ts` — all tests green.
- `npx tsx --test src/features/event-tracker/writers/synthesizer.test.ts` — all tests green.
- `src/features/event-tracker/writers/index-writer.ts` ≤ 300 LOC.
- `src/features/event-tracker/writers/synthesizer.ts` ≤ 300 LOC.
- All imports use ESM `.js` suffixes.
- No imports from parser or classifier modules (writers depend on types only).
- Existing tests for events-writer, diagnostics-writer, session-writer, formatter remain green.
- Index format enables `grep ses_` searches on the raw markdown.
- Synthesis format includes all 5 sections: Identity, Turn Summary, Delegation Chain, Key Findings, Compaction.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Index full-rewrite is slow with many sessions | Low | Medium | Acceptable for current scale (<100 sessions); optimize later if needed |
| Synthesis input type diverges from parser output | Medium | Low | SynthesisInput is a separate contract — adapter layer (not in this plan) bridges parser→synthesis |
| types.ts grows beyond 300 LOC with new additions | Low | Medium | New types add ~50 LOC; current file is 238 LOC. Safe margin. |
| Tree building has circular parent references | Low | High | `getSessionTree` must guard against cycles (visited-set check) |
