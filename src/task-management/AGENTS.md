# Task Management Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/` is the Hard Harness durable state and lifecycle sector. It owns session continuity (dual-layer: in-memory + `.hivemind/state/` JSON), delegation record persistence, append-only event journals, the session lifecycle state machine (created→queued→dispatching→running→completed/failed), execution trajectory, and session recovery. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/ARCHITECTURE.md:108`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- ContinuityStoreFile may persist session state, delegation records, and lineage to `.hivemind/state/` durable JSON files. Evidence: `.planning/codebase/ARCHITECTURE.md:76`, `.planning/codebase/ARCHITECTURE.md:181`.
- HarnessLifecycleManager may transition session lifecycle phases with validated state machine transitions. Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- Journal may append events to append-only timelines. EventTracker removed in CP-ST-03; session-tracker is canonical.
- Trajectory may record execution lineage (session parent/child trees). Evidence: `.planning/codebase/ARCHITECTURE.md:288`.
- Recovery modules may reconstruct session state from durable continuity files at startup.

## 3. Forbidden mutations / explicit no-go boundaries

- Task management SHALL NOT dispatch or spawn sessions; that is `src/coordination/`'s role. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Task management SHALL NOT observe OpenCode lifecycle events directly; hooks route facts to lifecycle manager via dependency injection. Evidence: `.planning/codebase/ARCHITECTURE.md:258`.
- Task management SHALL NOT register tools or hooks; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Task management SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/` | Persists delegation records via delegation-persistence | Coordination dispatches; task-management persists |
| `src/hooks/` | Routes lifecycle events to HarnessLifecycleManager | Hooks observe; task-management transitions state |
| `src/tools/` | Reads continuity state for tool responses | Tools own behavior; task-management owns state |
| `src/plugin.ts` | Wires lifecycle manager and continuity store | Composition root only, no business logic |
| Tests | Validate persistence, lifecycle transitions, journal append | Must not treat unit mocks as integration proof |

## 5. Naming and placement conventions

- Subdirectories: `continuity/`, `journal/`, `lifecycle/`, `recovery/`, `trajectory/`. Evidence: `.planning/codebase/STRUCTURE.md:93-94`.
- Continuity files use `ContinuityStoreFile` pattern; lifecycle uses `HarnessLifecycleManager`. Evidence: `.planning/codebase/ARCHITECTURE.md:54`.
- State files write to `.hivemind/state/` (canonical per Q6 decision). Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tests mirror this sector under `tests/lib/` matching source module paths. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Keep files below the 500 LOC cap. Evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/...` for affected modules. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Continuity format changes require migration evidence and broader regression testing across delegation and lifecycle.
- Runtime readiness cannot be claimed from unit tests alone; integration evidence requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
