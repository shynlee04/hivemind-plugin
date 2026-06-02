---
phase: SC-01
plan: 01
subsystem: sidecar
tags:
  - sidecar
  - http-server
  - sse
  - dependency-registry
  - canonical-prefixes
  - readonly-state
dependency_graph:
  requires: []
  provides:
    - SidecarEvent types for SC-02 through SC-06
    - Extended CANONICAL_PREFIXES for session-tracker/opencode access
    - SidecarDependencyRegistry for lazy module binding
    - SseConnectionPool for real-time event pushing
    - createSidecarServer() factory for SC-03 Next.js app
    - Step 5.5 plugin init hook for server auto-start
tech-stack:
  added:
    - ws@^8.18.0 (optionalDependency, TCP WebSocket for SC-02)
  patterns:
    - Lazy dependency binding pattern (registry.ts)
    - Fire-and-forget server start with try-catch (plugin.ts)
    - Dead connection cleanup during broadcast (sse/pool.ts)
    - Port file discovery for cross-process communication
key-files:
  created:
    - src/sidecar/types.ts
    - src/sidecar/readonly-state-extensions.ts
    - src/sidecar/server/registry.ts
    - src/sidecar/server/sse/pool.ts
    - src/sidecar/server/factory.ts
    - tests/sidecar/types.test.ts
    - tests/sidecar/server/registry.test.ts
    - tests/sidecar/server/sse/pool.test.ts
    - tests/sidecar/server/factory.test.ts
  modified:
    - src/sidecar/readonly-state.ts (4 prefixes)
    - tests/sidecar/readonly-state.test.ts (19 tests)
    - src/plugin.ts (step 5.5 + binding calls)
    - package.json (json-render@0.19, ws@8.18)
decisions:
  - "Server binds to 127.0.0.1:0 (random port) — localhost-only, no auth"
  - "All module references use `import type` — avoids circular imports"
  - "Server start failure is fire-and-forget — plugin continues without sidecar"
  - "ws added to optionalDependencies — not hard dependency"
  - "Port file written to .hivemind/state/sidecar-port.json for discovery"
  - "Only 3 core deps bound in SC-01 (client, sessionTracker, delegationManager)"
metrics:
  duration: 2h
  completed: "2026-06-02"
---

# Phase SC-01: Sidecar Foundation — Summary

Plugin HTTP server with lazy dependency registry, SSE connection pool, extended canonical state prefixes, and directory listing function. Server starts at plugin init step 5.5 with fire-and-forget error handling.

## Tasks Completed

### Wave 1 — Types + Extensions

| Task | Commit | Files |
|------|--------|-------|
| Sidecar type definitions (SidecarEventType, SidecarEvent, DirectoryEntry) | `86ca11ce` | `src/sidecar/types.ts`, `tests/sidecar/types.test.ts` |
| Extended CANONICAL_PREFIXES (4 entries) + listCanonicalDirectory() | `e612559e` | `src/sidecar/readonly-state.ts`, `src/sidecar/readonly-state-extensions.ts`, `tests/sidecar/readonly-state.test.ts` |

### Wave 2 — Registry + SSE Pool

| Task | Commit | Files |
|------|--------|-------|
| SidecarDependencyRegistry (6 getter/setter pairs, isReady, [Harness] guards) | `4daca4f1` | `src/sidecar/server/registry.ts`, `tests/sidecar/server/registry.test.ts` |
| SseConnectionPool (add/remove/broadcast, 30s heartbeat, max 50 clients) | `4daca4f1` | `src/sidecar/server/sse/pool.ts`, `tests/sidecar/server/sse/pool.test.ts` |

### Wave 3 — Server Factory + Plugin Wiring + Package Bumps

| Task | Commit | Files |
|------|--------|-------|
| createSidecarServer() HTTP factory with /health + 501 | `a76828d6` | `src/sidecar/server/factory.ts`, `tests/sidecar/server/factory.test.ts` |
| Step 5.5 plugin wiring + dependency binding | `2f183051` | `src/plugin.ts` |
| Package bumps (json-render@0.19, ws@8.18) | `2f183051`, `dd9f9466` | `package.json`, `package-lock.json` |

## Test Results

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/sidecar/types.test.ts` | 6 | ✅ PASS |
| `tests/sidecar/readonly-state.test.ts` | 19 | ✅ PASS |
| `tests/sidecar/server/registry.test.ts` | 18 | ✅ PASS |
| `tests/sidecar/server/sse/pool.test.ts` | 9 | ✅ PASS |
| `tests/sidecar/server/factory.test.ts` | 7 | ✅ PASS |
| **Total** | **59** | **✅ ALL PASS** |

## Verification

- [x] `npm run typecheck` — clean
- [x] `npx vitest run tests/sidecar/` — 5 files, 59 tests, all pass
- [x] `@json-render/*` at `^0.19.0` in optionalDependencies
- [x] `ws` at `^8.18.0` in optionalDependencies
- [x] `CANONICAL_PREFIXES` has exactly 4 entries
- [x] `listCanonicalDirectory()` returns entries for canonical paths, empty for others
- [x] `SidecarEventType` union has exactly 11 members
- [x] `SidecarDependencyRegistry.isReady()` transitions correctly
- [x] Unbound getters throw `[Harness]` error (T-SC01-03 mitigation)
- [x] `SseConnectionPool` enforces max 50, cleans dead connections on broadcast
- [x] `createSidecarServer()` returns port > 0, /health returns 200, others return 501
- [x] Plugin step 5.5 start is try-catch wrapped (D-SC01-03)
- [x] 3 core deps bound after construction (client, sessionTracker, delegationManager)

## Deviations from Plan

### Rule 2 — Import Type Adaptation

**Found during:** Wave 2 Task 1
**Issue:** Plan specified `PressureModel` import from `src/features/runtime-pressure/model.js` — this type does not exist (pressure module is function-based).
**Fix:** Used `Record<string, unknown>` for the pressure setter/getter type, matching the lazy binding container's needs.
**Files modified:** `src/sidecar/server/registry.ts`
**Commit:** `4daca4f1`

### Rule 2 — TrajectoryLedger Import Path

**Found during:** Typecheck
**Issue:** Plan specified `import type { TrajectoryLedger } from "...trajectory/ledger.js"` — `TrajectoryLedger` is not re-exported from `ledger.ts`; it lives in `types.ts`.
**Fix:** Changed import to `...trajectory/types.js`.
**Files modified:** `src/sidecar/server/registry.ts`
**Commit:** `4daca4f1`

### Rule 2 — SSE Pool Import Path

**Found during:** Typecheck
**Issue:** Plan specified `import type { SidecarEvent } from "../types.js"` from `server/sse/pool.ts` — path is two levels up.
**Fix:** Changed import to `../../types.js`.
**Files modified:** `src/sidecar/server/sse/pool.ts`
**Commit:** `4daca4f1`

## Success Criteria

1. ✅ Plugin HTTP server starts during plugin init on dynamic localhost port
2. ✅ Port written to `.hivemind/state/sidecar-port.json`
3. ✅ Server start failure caught by try-catch — does NOT block plugin init
4. ✅ `CANONICAL_PREFIXES` has 4 entries
5. ✅ `listCanonicalDirectory()` returns entries for canonical paths
6. ✅ `SidecarEventType` union has exactly 11 members
7. ✅ `SidecarDependencyRegistry` accepts lazy bindings and reports readiness
8. ✅ Unbound registry getters throw `[Harness]` error
9. ✅ `SseConnectionPool` manages SSE clients with 30s heartbeat, max 50
10. ✅ HTTP handler returns 200 for /health, 501 for all other routes
11. ✅ All json-render packages at 0.19.0, ws installed as opt dep
12. ✅ Existing readonly-state tests pass with extended prefixes
13. ✅ All 5 new test files exist and pass
14. ✅ TypeScript compiles cleanly

## Self-Check: PASSED
- All 5 test files exist and pass
- Typecheck clean
- Package bumps verified
- CANONICAL_PREFIXES extended to 4 entries
