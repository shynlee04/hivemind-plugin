# SDK Delegation Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/sdk-delegation/` owns the SdkDelegationHandler (`handler.ts`, ~324 LOC) — the SDK-based child session delegation execution path. It runs adaptive polling loops with message count stability tracking, integrates with CompletionDetector for dual-signal completion (Phase 36.1 re-wiring), handles pre-spawn polling for sessions launched before the agent was ready, and manages safety ceiling enforcement. Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:153-158`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- SdkDelegationHandler may poll child session message counts, detect stability through `STABLE_POLLS_REQUIRED`, `MIN_STABILITY_TIME_MS`, and adaptive interval tiers. Evidence: `.planning/codebase/ARCHITECTURE.md:164-168`.
- May feed message counts into CompletionDetector and consume cached terminal signals (error/deleted) from the lifecycle event handler.
- May schedule safety ceiling termination and trigger `onTerminal` callbacks for completed/error/timeout transitions.

## 3. Forbidden mutations / explicit no-go boundaries

- SDK delegation SHALL NOT persist delegation state; that belongs to `delegation-persistence.ts`.
- SDK delegation SHALL NOT spawn sessions; spawn requests are built by `spawner/` and dispatched by DelegationManager.
- SDK delegation SHALL NOT register tools or observe lifecycle events directly.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/manager.ts` | Dispatches SDK-mode delegations through SdkDelegationHandler | DelegationManager owns dispatch routing |
| `src/coordination/completion/detector.ts` | Provides dual-signal completion integration | CompletionDetector owns signal detection |
| `src/coordination/spawner/` | Executes session creation for SDK-mode dispatches | Spawner builds request; SDK handler polls result |
| Tests | Validate polling loop, stability detection, message count tracking | Must test adaptive interval tier behavior |

## 5. Naming and placement conventions

- `handler.ts` — SdkDelegationHandler class with polling loop, stability detection, and recovery retry logic.
- Callback interface `SdkDelegationCallbacks` defines integration surface with DelegationManager.
- Tests mirror under `tests/lib/coordination/sdk-delegation/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/sdk-delegation/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Polling changes must verify stability detection across all interval tiers (active, base, idle, deep idle).
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
