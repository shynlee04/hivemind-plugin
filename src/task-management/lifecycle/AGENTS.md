# Lifecycle Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/lifecycle/` owns the HarnessLifecycleManager (`index.ts`, ~243 LOC) — the session lifecycle state machine for delegated child sessions. It enforces validated phase transitions (created→queued→dispatching→running→completed/failed), routes lifecycle events from hooks to runtime state, coordinates with CompletionDetector for dual-signal completion, integrates with DelegationManager for dispatch, and replays pending notifications on recovery. Source evidence: `.planning/codebase/ARCHITECTURE.md:192-193`, `.planning/codebase/ARCHITECTURE.md:258`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- HarnessLifecycleManager may transition session lifecycle phases through validated transitions (`isValidTransition()` guards). Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- May handle `session.idle`, `session.error`, `session.deleted` events, feeding them to CompletionDetector and transitioning phase state.
- May recover pending delegations at startup via `recoverPending()`, re-polling child sessions not yet terminal.
- May replay undelivered `pendingNotifications` via notification-handler for parent session events.

## 3. Forbidden mutations / explicit no-go boundaries

- Lifecycle SHALL NOT dispatch sessions directly; it calls DelegationManager for dispatch orchestration. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Lifecycle SHALL NOT register tools or hooks; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Lifecycle SHALL NOT store state in `.opencode/`; durability belongs to `continuity/`. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.
- Lifecycle SHALL NOT observe OpenCode events directly; hooks route events via factory injection.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Routes `session.*` events to lifecycle manager | Hooks observe; lifecycle transitions |
| `src/coordination/delegation/` | Provides DelegationManager for child session dispatch | DelegationManager owns dispatch; lifecycle orchestrates |
| `src/coordination/completion/` | Provides CompletionDetector for dual-signal integration | CompletionDetector owns signal detection |
| `src/task-management/continuity/` | Reads/patches session continuity for phase transitions | Continuity owns storage; lifecycle owns state machine |
| `src/plugin.ts` | Wires HarnessLifecycleManager at composition time | Composition root only |

## 5. Naming and placement conventions

- `index.ts` — HarnessLifecycleManager class with `handleSessionCreated()`, `handleSessionIdle()`, `handleSessionDeleted()`, `transitionPhase()`, `recoverPending()`.
- Options type `HarnessLifecycleManagerOptions` defines injected dependencies. `LaunchDelegatedSessionArgs` for session launch.
- Tests mirror under `tests/lib/task-management/lifecycle/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/lifecycle/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Phase transition changes must verify all valid paths and terminal state reachability.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
