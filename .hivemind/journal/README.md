# .hivemind/journal/

## Purpose

Append-only session event timeline. Independent of `continuity.ts` (Q3 decision).

## What Goes Here

- Session lifecycle events (start, idle, error, deleted)
- Delegation lifecycle events (dispatch, complete, failed)
- Phase transition markers
- Auto-loop and compaction events

## Architecture

Per Q3 (Validation Decisions 2026-04-25), the Session Journal is:
- **Append-only** — events are never modified or deleted
- **Independent of continuity.ts** — separate persistence path, separate read/query API
- **Time-Machine foundation** — enables reconstructing past state from event replay

## Related

- `src/lib/session-journal.ts` — Journal writer module
- `.hivemind/state/session-continuity.json` — Separate continuity store (not journal)
- `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md` — Q3 decision

## Status

Directories may be empty until the journal module is fully implemented (pending JOURNAL-01 through JOURNAL-03 requirements).
