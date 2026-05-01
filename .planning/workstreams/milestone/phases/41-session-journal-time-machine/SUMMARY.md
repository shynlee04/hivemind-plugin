---
phase: 41-session-journal-time-machine
status: complete
completed: 2026-05-01
requirements: [JOURNAL-01, JOURNAL-02, JOURNAL-03]
---

# Phase 41 — Session Journal Time Machine (SUMMARY)

## Outcome

All three requirements landed in a single TDD-driven implementation. Tests
were written first (RED), modules created (GREEN), full suite re-run.

## Verification

### JOURNAL-01 — Append-only event timeline, independent of continuity.ts

Verified, no code change needed:

- `src/lib/session-journal.ts` does **not** import `continuity.ts`
  (verified via `grep -E "from .*continuity|require.*continuity" src/lib/session-journal.ts`).
- The journal writer uses `appendFileSync(filePath, line, ...)` exclusively;
  no entries are ever mutated or rewritten in place.
- Idempotency is enforced *before* append via `existingIdempotencyKeys()`,
  not by editing past lines, preserving append-only semantics under retry.

### JOURNAL-02 — Query API: by-session, by-event-type, by-time-range

New module `src/lib/journal-query.ts` (~165 LOC, well under the 500 LOC ceiling)
exposes:

| Export | Purpose |
|--------|---------|
| `readJournalEntries(filePath)` | Load entries from a JSONL file in file order. Returns `[]` for missing files. Skips corrupt lines (same recovery policy as `existingIdempotencyKeys`). |
| `queryBySession(entries, sessionId)` | Exact-match filter on `sessionId`. |
| `queryByEventType(entries, eventType \| eventType[])` | Any-of filter on `eventType`; accepts a single string or array. |
| `queryByTimeRange(entries, { fromMs?, toMs? })` | Inclusive `[fromMs, toMs]` window. Either bound may be omitted. Throws `[Harness]` error on inverted ranges. |
| `queryJournal(filePath, criteria)` | Composes all of the above plus an optional `stateRole` filter; intersection semantics. |

All filters are pure (no I/O after the initial read) and never mutate the
input array.

### JOURNAL-03 — Time-machine: event replay + past-state reconstruction

New module `src/lib/journal-replay.ts` (~135 LOC) exposes:

| Export | Purpose |
|--------|---------|
| `replayChronological(entries)` | Returns entries sorted by `timestamp` ascending with deterministic `id` tie-breaking. Does not mutate the input. |
| `reconstructStateAt(entries, { atMs, sessionId?, stateRoles? })` | Returns canonical-runtime entries up to `atMs` (inclusive), optionally filtered to one `sessionId` and to a custom set of `stateRole` values (defaults to `["canonical runtime state"]`). Output is chronologically sorted. |
| `reduceJournalEntries(entries, initial, reducer)` | Generic chronological fold so deep modules (delegation, lifecycle, runtime-policy, …) can build their own state projections without re-implementing the sort. |

The module is intentionally **fold-based, not schema-aware** — different
deep modules attach different state projections to the journal and each
owns its own reducer; this module only guarantees correct chronological
ordering and provides primitives.

## Test Coverage

- `tests/lib/journal-query.test.ts` (12 tests):
  - `readJournalEntries`: missing file, file order, corrupt-line recovery
  - `queryBySession`: match, no-match
  - `queryByEventType`: single string, array (any-of)
  - `queryByTimeRange`: both bounds, open-ended fromMs, open-ended toMs, inverted-range error
  - `queryJournal`: composition (session + event-type + time-range), `stateRole` filter
- `tests/lib/journal-replay.test.ts` (10 tests):
  - `replayChronological`: ascending sort, deterministic tie-break on `id`, input non-mutation
  - `reconstructStateAt`: canonical-runtime default, optional `sessionId` filter, custom `stateRoles` set, empty when nothing precedes `atMs`
  - `reduceJournalEntries`: chronological reduction, no-op on empty input

Full suite: **1187 / 1187 passing** (was 1165 + 22 new).

## Gates

- `npm run typecheck` — clean
- `npm test` — 1187/1187 passing
- `npm run build` — clean

## Public API

Both modules are re-exported from `src/index.ts` so external consumers can
import them via the `opencode-harness` package.

## Out of scope (explicit non-goals)

- No new "current state" object or schema. Different deep modules own
  their own reducers; this phase delivers primitives, not an opinionated
  snapshot type.
- No mutation, compaction, or pruning of past journal entries — JOURNAL-01
  remains in force.
- No new tool surface. The query/replay API is library-level only;
  surfacing it through tools or CLI is left to a future phase if needed.
