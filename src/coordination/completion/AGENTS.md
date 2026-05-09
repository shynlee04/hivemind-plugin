# Completion Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/completion/` owns completion detection for delegated child sessions. `detector.ts` provides the CompletionDetector class — it watches session lifecycle events (idle, error, deleted), implements dual-signal completion (message count stability + idle signal), caches terminal results for late watchers, and enforces safety ceiling timeouts. `notification-handler.ts` replays pending parent-session notifications. Source evidence: `.planning/codebase/ARCHITECTURE.md:164-168`, `.planning/codebase/ARCHITECTURE.md:198`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- CompletionDetector may feed events (`session.idle`, `session.error`, `session.deleted`) and resolve watcher promises with `CompletionResult` (signal + sessionID + optional error). Evidence: `.planning/codebase/ARCHITECTURE.md:164-168`.
- CompletionDetector may cache terminal error/deleted results for late watchers. Idle signals are not cached (only delivered to active watchers).
- NotificationHandler may replay undelivered `pendingNotifications` for parent sessions upon `session.created` or `session.updated` events.

## 3. Forbidden mutations / explicit no-go boundaries

- Completion SHALL NOT persist delegation state; that belongs to `src/task-management/continuity/delegation-persistence.ts`.
- Completion SHALL NOT dispatch sessions or manage concurrency; those are DelegationManager responsibilities.
- Completion SHALL NOT register tools or observe lifecycle events directly; hooks route events through injected dependency paths.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/` | Awaits completion signals for dispatched sessions | DelegationManager dispatches; CompletionDetector signals finish |
| `src/task-management/lifecycle/` | Injects CompletionDetector for lifecycle-driven detection | Lifecycle manager owns event routing |
| `src/hooks/` | Routes `session.idle/error/deleted` events via lifecycle manager | Hooks observe; detector receives through dependency chain |
| `src/plugin.ts` | Wires CompletionDetector at composition time | Composition root only |

## 5. Naming and placement conventions

- `detector.ts` — CompletionDetector class with `feed()`, `watch()`, `dealias()`, `cleanup()` methods.
- `notification-handler.ts` — pending notification replay logic.
- Tests mirror under `tests/lib/coordination/completion/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/completion/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Completion detection changes must verify dual-signal logic: message stability + idle signal.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
