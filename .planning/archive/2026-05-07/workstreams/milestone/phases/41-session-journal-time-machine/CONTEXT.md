---
phase: 41-session-journal-time-machine
priority: P2
status: complete
created: 2026-04-30
completed: 2026-05-01
completion_note: "Implemented in single PR. JOURNAL-01 verified (no continuity.ts import in session-journal.ts; appendFileSync only). JOURNAL-02 implemented in src/lib/journal-query.ts (readJournalEntries, queryBySession, queryByEventType, queryByTimeRange, queryJournal). JOURNAL-03 implemented in src/lib/journal-replay.ts (replayChronological, reconstructStateAt, reduceJournalEntries). All TDD; 22 new tests passing."
depends_on: [25-session-journal-execution-lineage-bridge]
blocks: []
gsd_agents: [gsd-executor, gsd-researcher]
requirements: [JOURNAL-01, JOURNAL-02, JOURNAL-03]
---

# Phase 41: Session Journal Time Machine

## Goal

Implement query API for the session journal (by-session, by-event-type, by-time-range) and time-machine capabilities (event replay, past-state reconstruction).

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| JOURNAL-01 | Session Journal is append-only event timeline, independent of continuity.ts | Q3 architecture decision |
| JOURNAL-02 | Query API: by-session, by-event-type, by-time-range | Q3 decision |
| JOURNAL-03 | Time-machine: event replay and past-state reconstruction | Q3 decision |

## Scope

- Verify append-only semantics and independence from continuity.ts (JOURNAL-01)
- `src/lib/session-journal.ts` — extend journal with query support
- New `src/lib/journal-query.ts` — query API module
- New `src/lib/journal-replay.ts` — time-machine replay module
- Tests for all

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| JOURNAL-02 | gsd-executor | hm-test-driven-execution |
| JOURNAL-03 | gsd-researcher | hm-test-driven-execution |

## Key Files

- `src/lib/session-journal.ts` — append-only event timeline
- New `src/lib/journal-query.ts` — query API
- New `src/lib/journal-replay.ts` — event replay and state reconstruction

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- `[Harness]` prefix on all thrown errors
- Append-only journal (no mutation of past entries)

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
- Journal is append-only — never mutate past events
