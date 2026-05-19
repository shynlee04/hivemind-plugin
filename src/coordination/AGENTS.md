# Coordination Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/` is the Hard Harness orchestration sector. It owns delegation dispatch (WaiterModel pattern), completion detection (dual-signal idle + message threshold), per-key concurrency gating, SDK/command delegation, and session spawning. This sector coordinates child session lifecycles without owning durable persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:105-109`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- DelegationManager may dispatch child sessions, acquire concurrency slots, and recover pending delegations at startup. Evidence: `.planning/codebase/ARCHITECTURE.md:187-190`, `.planning/codebase/ARCHITECTURE.md:153-158`.
- CompletionDetector may detect delegated session lifecycle transitions (idle, error, deleted events) and signal dual-signal completion. Evidence: `.planning/codebase/ARCHITECTURE.md:198`, `.planning/codebase/ARCHITECTURE.md:164-168`.
- DelegationConcurrencyQueue may acquire and release per-key concurrency gates. Evidence: `.planning/codebase/ARCHITECTURE.md:57`.
- Spawner may build spawn requests and create child sessions via `spawnDelegatedSession()`. Evidence: `.planning/codebase/ARCHITECTURE.md:157-158`.

## 3. Forbidden mutations / explicit no-go boundaries

- Coordination SHALL NOT perform durable state writes directly; delegation record persistence belongs to `src/task-management/continuity/delegation-persistence.ts`. Evidence: `.planning/codebase/ARCHITECTURE.md:159`.
- Coordination SHALL NOT register tools or hooks; `src/plugin.ts` owns tool registration and hook composition. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Coordination SHALL NOT observe OpenCode lifecycle events directly; that is the hooks sector's role. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`.
- Coordination SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/delegation/` | Dispatches delegations via DelegationManager | Tools own input validation and response shaping |
| `src/task-management/` | Receives delegation records for persistence | Owns durable state, not dispatch logic |
| `src/hooks/` | Routes session events to CompletionDetector | Hooks observe; coordination acts |
| `src/plugin.ts` | Wires DelegationManager, CompletionDetector, ConcurrencyQueue | Composition root only, no business logic |
| Tests | Validate dispatch, completion, concurrency behavior | Must not treat unit mocks as integration proof |

## 5. Naming and placement conventions

- Manager classes use `PascalCase` in `src/coordination/{domain}/manager.ts` or `detector.ts`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Subdirectories: `delegation/`, `completion/`, `concurrency/`, `sdk-delegation/`, `command-delegation/`, `spawner/`. Evidence: `.planning/codebase/STRUCTURE.md:95-97`.
- Tests mirror this sector under `tests/lib/` matching source module paths. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Keep files below the 500 LOC cap; DelegationManager is the reference at ~500 lines. Evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/...` for affected coordination modules. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Delegation dispatch changes require regression evidence across completion detection and concurrency gating.
- Runtime readiness cannot be claimed from unit tests alone; integration evidence requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
