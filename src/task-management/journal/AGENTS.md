# Journal Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/journal/` owns append-only session journaling — a complement to continuity that provides an independent time-machine audit trail. `index.ts` defines the `SessionJournalEntry` contract (actor, eventType, timestamp, source, summary, stateRole, idempotencyKey), `appendJournalEntry()`, and deterministic `buildJournalId()`. `execution-lineage.ts` records parent-child session trees. `query.ts` and `replay.ts` support read-side journal access. The `event-tracker/` subdirectory was removed in CP-ST-03; session-tracker is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/ARCHITECTURE.md:288`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- Journal may append `SessionJournalEntry` records to `.hivemind/journal/YYYY-MM-DD.jsonl` files with idempotency gating. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Execution lineage may record parent-child session trees without mutating continuity or delegation authorities.

## 3. Forbidden mutations / explicit no-go boundaries

- Journal SHALL NOT mutate continuity or delegation records; it is an independent append-only complement.
- Journal SHALL NOT observe lifecycle events directly; hooks route facts through injected dependencies.
- Journal SHALL NOT store state in `.opencode/`; `.hivemind/` is canonical. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Routes lifecycle events to journal append | Hooks observe; journal records |
| `src/task-management/lifecycle/` | Emits lifecycle events consumed by execution lineage | Lifecycle owns state machine; journal owns audit trail |
| `src/tools/` | Reads journal for tool response enrichment | Tools own behavior; journal owns event history |
| `src/plugin.ts` | Wires journal dependencies at composition time | Composition root only |

## 5. Naming and placement conventions

- `index.ts` — `SessionJournalEntry`, `appendJournalEntry()`, `buildJournalId()`. `query.ts`/`replay.ts` — read-side access.
- `execution-lineage.ts` — parent-child session tree records. Tests mirror under `tests/lib/task-management/journal/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/journal/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Journal format changes require idempotency verification (no duplicate entries on replay).
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
