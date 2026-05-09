# Concurrency Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/concurrency/` owns the DelegationConcurrencyQueue (`queue.ts`, ~310 LOC) — a per-key lane-based concurrency gate. Each lane tracks active count, limit, pending acquires, and queued tasks (high/normal priority). The `buildDelegationQueueKey()` helper derives concurrency keys from provider, model, agent, or category dimensions. Integrated enforcement of `MAX_DESCENDANTS_PER_ROOT`. Source evidence: `.planning/codebase/ARCHITECTURE.md:57`, `.planning/codebase/ARCHITECTURE.md:105-109`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- DelegationConcurrencyQueue may acquire concurrency slots (blocking with timeout), release slots back to lanes, and dequeue pending acquires in priority order. Evidence: `.planning/codebase/ARCHITECTURE.md:57`.
- `buildDelegationQueueKey()` may derive lane keys from provider+model or agent+category tuples. Evidence: `.planning/codebase/STRUCTURE.md:95-97`.
- Queue may enforce per-lane concurrency limits from `RuntimePolicy` and global `MAX_DESCENDANTS_PER_ROOT`.

## 3. Forbidden mutations / explicit no-go boundaries

- Concurrency SHALL NOT dispatch sessions; it only gates access — dispatch belongs to DelegationManager.
- Concurrency SHALL NOT persist queue state across harness restarts; it is in-memory only.
- Concurrency SHALL NOT observe lifecycle events or register tools/hooks.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/manager.ts` | Acquires concurrency slots before dispatching child sessions | DelegationManager dispatches; queue gates concurrency |
| `src/shared/runtime-policy.ts` | Supplies per-key concurrency limits via `resolveConcurrencyForKey()` | Policy provides limits; queue enforces them |
| Tests | Validate acquire/release, priority ordering, timeout behavior | Must test fairness and starvation scenarios |

## 5. Naming and placement conventions

- `queue.ts` — DelegationConcurrencyQueue class with `Lane`, `QueuedTask`, `PendingAcquire` internal types.
- Exported types: `QueuePriority`, `QueuedTask`. Exported helper: `buildDelegationQueueKey()`.
- Tests mirror under `tests/lib/coordination/concurrency/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/concurrency/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Concurrency changes must verify fairness (no priority inversion) and timeout behavior.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
