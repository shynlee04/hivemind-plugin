# Continuity Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/continuity/` owns session continuity persistence — the dual-layer state model (in-memory Maps + `.hivemind/state/session-continuity.json` durable file). `index.ts` (~465 LOC) provides the ContinuityStoreFile (`readFile`, `writeFile`, `deepCloneOnRead`), session record CRUD (`getSessionContinuity`, `listSessionContinuity`, `patchSessionContinuity`, `recordSessionContinuity`), and hydration (`hydrateFromContinuity`). `delegation-persistence.ts` (~197 LOC) persists delegation records to `.hivemind/state/delegations.json` with `persistDelegations()` and `readPersistedDelegations()`, including corrupt file quarantine. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/ARCHITECTURE.md:76`, `.planning/codebase/ARCHITECTURE.md:181`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- ContinuityStoreFile may write session continuity records to `.hivemind/state/` with versioned schema (`CONTINUITY_VERSION = 1`). Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- `persistDelegations()` may overwrite the full delegation record array, including pruning oldest completed/error records when exceeding `MAX_DELEGATIONS_BEFORE_PRUNE`. Evidence: `.planning/codebase/ARCHITECTURE.md:159`.
- `deep-clone-on-read` contract enforced via `cloneSessionContinuity()` — prevents mutation aliasing. Evidence: `.planning/codebase/ARCHITECTURE.md:181`.

## 3. Forbidden mutations / explicit no-go boundaries

- Continuity SHALL NOT dispatch or spawn sessions; that is `src/coordination/`'s role. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Continuity SHALL NOT observe lifecycle events directly; hooks route facts via injected dependency paths.
- Continuity SHALL NOT store state in `.opencode/`; `.hivemind/` is canonical (Q6). Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.
- Continuity SHALL NOT register tools or hooks; `src/plugin.ts` owns registration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/` | Persists delegation records via `persistDelegations()` | Coordination dispatches; continuity persists |
| `src/task-management/lifecycle/` | Reads/patches session continuity for lifecycle transitions | Lifecycle owns state machine; continuity owns storage |
| `src/tools/` | Reads continuity state for tool response enrichment | Tools own behavior; continuity owns state |
| `src/plugin.ts` | Wires continuity store and hydration at composition time | Composition root only |

## 5. Naming and placement conventions

- `index.ts` — core `ContinuityStoreFile` operations, canonical path resolution, Q6 `.hivemind/state/` first, legacy `.opencode/state/hivemind/` compatibility bridge. Evidence: `.planning/codebase/STRUCTURE.md:93-94`.
- `delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()`, `quarantineCorruptDelegationsFile()`, pruning with `MAX_DELEGATIONS_BEFORE_PRUNE` (50).
- Tests mirror under `tests/lib/task-management/continuity/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/continuity/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Continuity format changes require migration evidence and backward-compatibility testing across lifecycle and delegation.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
