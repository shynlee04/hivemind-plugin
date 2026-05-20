# Spawner Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/spawner/` owns child session construction for delegated task execution. It builds spawn requests (`spawn-request-builder.ts`), resolves permission profiles from agent primitive policy (`agent-primitive-policy.ts`), creates sessions via `spawnDelegatedSession()` (`session-creator.ts`), derives parent working directories (`parent-directory.ts`), and manages auto-loop/ralph-loop lifecycle (`auto-loop.ts`, `ralph-loop.ts`). Concurrency key construction belongs to `src/coordination/concurrency/queue.ts`; spawner consumes already-resolved dispatch inputs through DelegationManager. The `spawner-types.ts` module defines the canonical `SpawnRequest` and `DelegationPermissionProfile` contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:153-158`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- Spawner may build permission profiles from agent primitive metadata, falling back to read-only defaults for unknown agents. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- May spawn sessions with bounded prompt-time tools and disabled recursive delegation (`delegate-task: false`). Concurrency keys are derived by the coordination/concurrency queue helper before dispatch acquisition.
- May manage auto-loop and ralph-loop lifecycle for iterative child session chaining.

## 3. Forbidden mutations / explicit no-go boundaries

- Spawner SHALL NOT dispatch sessions — DelegationManager calls the spawner to create sessions but owns dispatch orchestration.
- Spawner SHALL NOT persist state; record persistence belongs to `src/task-management/continuity/`.
- Spawner SHALL NOT register tools or observe lifecycle events directly.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/manager.ts` | Builds spawn requests and creates child sessions | DelegationManager owns dispatch; spawner builds sessions |
| `src/routing/behavioral-profile/` | Provides agent behavioral overrides for permission resolution | Behavioral profile owns policy; spawner consumes it |
| `src/config/subscriber.ts` | Supplies cached config for agent primitive enrichment | Config subscriber caches; spawner enriches |
| Tests | Validate spawn request construction and permission profiles | Must test both known and unknown agent fallback paths |

## 5. Naming and placement conventions

- `spawner-types.ts` — canonical `SpawnRequest`, `DelegationPermissionProfile`, `DelegationExecutionMode` contracts.
- `spawn-request-builder.ts` — `buildSdkSpawnRequest()`, `resolveDelegationPermissionProfile()`. `session-creator.ts` — `spawnDelegatedSession()`.
- Tests mirror under `tests/lib/coordination/spawner/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/spawner/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Permission profile changes must verify that unknown agents fall back to read-only defaults (not broad write-capable).
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
