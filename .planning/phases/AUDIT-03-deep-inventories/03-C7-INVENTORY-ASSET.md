# C7 Cluster Inventory: Sidecar — UX/UI Control Plane [AUDIT-03 - Deep Inventory]

**Cluster:** C7 — Sidecar (embedded HTTP/WS server, tool proxy, catalog, Next.js GUI app)
**Analysis Date:** 2026-06-06
**Inventory Base:** `src/sidecar/` (27 files, 2,450 LOC), `sidecar/` (Next.js app, 40+ files), `.planning/phases/SC-*` (3 phases)

---

## 1. Cluster Overview

C7 is the UX/UI control plane — an embedded HTTP/WS server inside the plugin process that exposes REST + SSE + WS surfaces for a separate Next.js 16 standalone dashboard app. It's the Hivemind sidecar, built by "another team" with a 3-phase roadmap:

| Phase | Title | Status | Delivery |
|-------|-------|--------|----------|
| **SC-01** | Sidecar Foundation | ✅ DELIVERED (2026-06-02) | Plugin HTTP server, SSE pool, dependency registry, canonical state extensions |
| **SC-02** | REST API + Tool Proxy | ❌ NEVER DELIVERED | SPEC written but no SUMMARY — plans exist (5 sub-plans) but never executed |
| **SC-03** | Next.js 16 Standalone App | ❌ VERIFICATION FAILED | 6/13 ACs met, 36/41 tests fail, `next build` never executed |

### Architecture Model (Two-Server)

```
Plugin Process (Node)                        Next.js Process (port 3099)
┌──────────────────────────────┐           ┌──────────────────────────────┐
│  src/sidecar/server/         │  HTTP      │  sidecar/src/                │
│  - factory.ts (port :0)      │◄──────────►│  - plugin-client.ts          │
│  - routes/ (4 GET + 7 POST)  │  REST/SSE  │  - state-store.ts            │
│  - tool-proxy/ (7 handlers)  │   WS       │  - use-sse.ts                │
│  - sse/pool.ts               │───────────►│  - panels/*/ (4 stubs)      │
│  - ws/pool.ts                │  events    │  - catalog.ts                │
│  registry → C2, C3 modules   │           │  dashboard-shell.tsx         │
└──────────────────────────────┘           └──────────────────────────────┘
         │                                            │
         ▼                                            ▼
   state file bridge                          .hivemind/state/ sidecar-port.json
```

---

## 2. Phase Delivery Assessment

### 2.1 SC-01: Foundation — ✅ DELIVERED (59 tests all pass)

SC-01 produced 6 new files and modified 3 existing files:

| Deliverable | Files | Status |
|-------------|-------|--------|
| `SidecarEventType` (11 event types) | `src/sidecar/types.ts` | ✅ 6 tests pass |
| `listCanonicalDirectory()` + 4-prefix CANONICAL_PREFIXES | `readonly-state.ts`, `readonly-state-extensions.ts` | ✅ 19 tests pass |
| `SidecarDependencyRegistry` (6 getter/setter pairs) | `server/registry.ts` | ✅ 18 tests pass |
| `SseConnectionPool` (30s heartbeat, max 50 clients) | `server/sse/pool.ts` | ✅ 9 tests pass |
| `createSidecarServer()` HTTP factory | `server/factory.ts` | ✅ 7 tests pass |
| Plugin step 5.5 wiring + package bumps | `plugin.ts`, `package.json` | ✅ Typecheck clean |

**Deviations found during SC-01:** Import path fixes for pressure types, trajectory type re-export, SSE pool import path — all handled at commit time.

**Test count:** 5 files, 59 tests, ALL PASS. Typecheck: clean.

### 2.2 SC-02: REST API + Tool Proxy — ❌ NEVER DELIVERED

SC-02 has a comprehensive SPEC (341 lines, ambiguity score 0.075) with 5 sub-plans (`plan-0.md` through `plan-4.md`) but **no SUMMARY file**. The SPEC was "locked, ready for discuss-phase" but discuss-phase never transitioned to execution.

**What SC-02 was supposed to deliver (from SPEC):**

| # | Capability | Route(s) | Status |
|---|-----------|----------|--------|
| 1 | Read-side state endpoints | 4 GET routes (snapshot, sessions, docs, catalog) | ⚠️ PARTIAL — routes exist but handlers use `(registry as any)` |
| 2 | Write-side tool proxy | 7 POST `/api/tools/{name}` endpoints | ❌ 5 of 7 handlers are stubs (see §5) |
| 3 | SSE event bus | `GET /api/events?filter=...` | ✅ Route exists, SSE pool wired |
| 4 | WebSocket delegation channel | `WS /ws/delegation` | ⚠️ `ws/pool.ts` + `delegation.ts` exist but untested |
| 5 | Catalog endpoints | `GET /api/catalog` + `GET /api/catalog/tools` | ✅ Route exists, catalog files exist |

**What ACTUALLY exists (code that was written despite SC-02 never formally shipping):**
- `src/sidecar/server/routes/` — 5 route files (catalog, events, sessions, state, tools, types)
- `src/sidecar/server/tool-proxy/` — 7 handlers + router
- `src/sidecar/server/ws/` — pool.ts + delegation.ts
- `src/sidecar/catalog/` — tool-catalog.ts + json-render-catalog.ts + tool-catalog.json

**Root cause of non-delivery:** SC-02's SPEC was finalized but a full DISCUSS → PLAN → EXECUTE cycle never completed. The code that exists was likely created ad-hoc alongside SC-03 without formal phase governance.

### 2.3 SC-03: Next.js 16 App — ❌ VERIFICATION FAILED (6/13 ACs)

**Verification score:** 6/13 ACs met, 36/41 tests fail.

**Passing ACs:**
- AC-SC03-03: 17 endpoint methods in plugin-client.ts ✅
- AC-SC03-07: 44-component catalog ✅
- AC-SC03-11: No forbidden src/sidecar imports ✅
- AC-SC03-13: `ssr: false` dynamic import ✅

**Failing ACs (7 total):**
| AC | Failure Reason | Test Failures |
|----|---------------|---------------|
| AC-SC03-01 | `next build` not executed — `.next/standalone/server.js` does not exist | — |
| AC-SC03-02 | Tests reference `createPluginClient` but implementation exports `PluginClient`/`getPluginClient` | 19 tests |
| AC-SC03-04 | Tests reference `createStateStore` but implementation exports `createSidecarStateStore` | 5 tests |
| AC-SC03-05 | Tests use `NOT_IMPLEMENTED` scaffold wrapper — real `useSse` never exercised | 8 tests |
| AC-SC03-06 | JSX parse error in vitest: tsconfig `"jsx": "preserve"` incompatible with vite transform | 4 tests |
| AC-SC03-08 | Blocked by same JSX parse error | 4 tests |
| AC-SC03-09 | Blocked by same JSX parse error | 4 tests |
| AC-SC03-10 | Blocked by same JSX parse error | 4 tests |
| AC-SC03-12 | Same `NOT_IMPLEMENTED` scaffold blocking SSE tests | 8 tests |

**Two root causes for ALL 36 failures:**
1. **JSX transform mismatch** (4 tests): `tsconfig.json` sets `jsx: "preserve"`, incompatible with vitest's esbuild/oxc transform.
2. **`NOT_IMPLEMENTED` scaffold tests** (32 tests): Tests were written with placeholder names (`createPluginClient`, `createStateStore`) that don't match actual exports (`PluginClient`/`getPluginClient`, `createSidecarStateStore`).

---

## 3. Code Surface Topology

### 3.1 Plugin-Side Server Files (`src/sidecar/` — 27 files, 2,450 LOC)

| Sub-Group | Files | LOC | Description |
|-----------|-------|-----|-------------|
| Server | `factory.ts`, `handler.ts`, `registry.ts`, `cache.ts` | 390 | HTTP server factory, request router, lazy dependency registry, SSE cache |
| Routes | `routes/catalog.ts`, `events.ts`, `sessions.ts`, `state.ts`, `tools.ts`, `types.ts` | 388 | 6 route files (4 GET read + 7 POST tool proxy) |
| Tool Proxy | `tool-proxy/router.ts` + `handlers/*.ts` (7 files) | 380 | 7 tool handler modules + dispatch router |
| SSE | `sse/pool.ts` | ~80 | SSE connection pool with heartbeat |
| WS | `ws/pool.ts`, `ws/delegation.ts`, `ws/types.d.ts` | ~120 | WebSocket pool + delegation channel |
| Catalog | `catalog/tool-catalog.ts`, `catalog/json-render-catalog.ts` | ~40 | Read-only frozen catalog exports |
| State | `readonly-state.ts`, `readonly-state-extensions.ts`, `types.ts` | ~400 | Canonical state bridge, sidecar event types |
| **Total** | **27** | **~2,450** | |

### 3.2 Next.js App Files (`sidecar/` — 40+ files)

| Sub-Group | Files | Description |
|-----------|-------|-------------|
| App source | `src/app/`, `src/components/`, `src/lib/`, `src/panels/` | Dashboard shell, 4 panel stubs, plugin client, state store, SSE hook |
| Config | `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `package.json` | Next.js 16 standalone config, Tailwind v4 |
| Tests | `tests/` (9 test files) | 41 tests total (36 fail, 5 pass) |
| Build cache | `.next/dev/` (40+ files) | Next.js dev build output (not production) |

---

## 4. Tool Proxy Handler Quality

### 4.1 Per-Handler Assessment

| Handler | Status | LOC | Real Data? | Registry Access | Analysis |
|---------|--------|-----|-----------|----------------|----------|
| `delegate-task.ts` | ⚠️ SEMI-FUNCTIONAL | 61 | Partial | `registry.delegationManager` (with `as any` cast) | Calls `dm.dispatch()` but falls back to `"sess-1"` + `"mock-delegation-1"`. The handler may work if DelegationManager is bound. |
| `delegation-status.ts` | ❌ STUB | 42 | **None** | **None** | Always returns `{ status: "running" }`. Never queries real delegation state. Ignores `delegationId` argument. |
| `execute-slash-command.ts` | ❌ STUB | 45 | **None** | **None** | Always returns `"Command X dispatched"`. Never calls `hivemind-command-engine`. Doesn't even access the registry. |
| `hivemind-session-view.ts` | ❌ NON-FUNCTIONAL | 45 | **None** | `(registry as any).sessionTracker` | Calls `st.get(sessionId)` but **discards the result** (L39). Always returns `{ sessionId }` with no session data. The handler promises unified session view but delivers nothing. |
| `hivemind-trajectory.ts` | ⚠️ SEMI-FUNCTIONAL | 60 | Conditional | `(registry as any).trajectory` | Calls `t.inspect()` through `as any`. Only works if trajectory dependency is bound and `inspect` method exists. Returns empty events on failure. |
| `session-patch.ts` | ⚠️ SEMI-FUNCTIONAL | 84 | Conditional | Registry (typed) | Has canonical prefix validation. Patch logic may work if session record is accessible. |
| `hivemind-command-engine.ts` | ❌ STUB | 42 | **None** | **None** | Always returns `{ routes: [] }`. Never calls real command engine. Ignores all arguments. |

**Stub total:** 5 of 7 handlers return fake/empty data.
**Functional total:** 2 of 7 handlers may work if dependencies are bound and methods exist.
**Zero runtime-proof:** No handler has been tested end-to-end with a real plugin server.

### 4.2 `as any` Casts (5 occurrences)

| File | Line | Pattern | Risk |
|------|------|---------|------|
| `hivemind-session-view.ts:37` | `(registry as any).sessionTracker` | Accesses sessionTracker through untyped cast | Silent failure if not bound |
| `delegate-task.ts:43` | `(dm.dispatch as any)({...})` | Calls dispatch with untyped arguments | Complete type bypass |
| `hivemind-trajectory.ts:48` | `(registry as any).trajectory` | Accesses trajectory through untyped cast | Silent failure if not bound |
| `routes/state.ts:37` | `(registry as any).sessionTracker` | Route handler accesses sessionTracker | Silent failure |
| `routes/sessions.ts:29` | `(registry as any).sessionTracker` | Route handler accesses sessionTracker | Silent failure |

These `as any` casts bypass the `SidecarDependencyRegistry` type system entirely. The registry was designed with typed setter/getter pairs to prevent this exact pattern.

---

## 5. Stale & Dead Code

### 5.1 `tool-catalog.json` — Frozen Snapshot

**File:** `src/sidecar/catalog/tool-catalog.json`

**Issue:** The JSON catalog is a frozen snapshot of tool definitions. It's imported via `with { type: "json" }` and `deepFreeze()`d. The catalog reflects tools at the time of last build — it may not include recent tool additions or removals from C3/C5. There is no `scripts/generate-tool-catalog.js` or similar refresh mechanism.

### 5.2 `json-render-catalog.ts` — Single Type Re-Export

**File:** `src/sidecar/catalog/json-render-catalog.ts`

The file is likely a single re-export line. It's a type bridge to the Next.js app's catalog. If the catalog format drifts, this file silently becomes a dead reference.

### 5.3 WebSocket Types Declaration

**File:** `src/sidecar/server/ws/types.d.ts`

**Issue:** This is a `.d.ts` file (ambient declaration), not a `.ts` module. The WS implementation (`ws/pool.ts` + `ws/delegation.ts`) uses types from this file. Ambient `.d.ts` files are invisible to TypeScript unless included in `tsconfig.json`'s `include` or `files` array.

### 5.4 SC-02 Sub-Plans (Orphaned Planning Artifacts)

**Files:** `.planning/phases/SC-02-rest-api-tool-proxy/plan-0.md` through `plan-4.md`

**Issue:** 5 sub-plans exist for SC-02 but were never executed. They describe the REST API, tool proxy routes, WebSocket channels, and catalog endpoints — most of which were partially implemented ad-hoc. The planning trail stops at plan-0.md; there is no plan-5.md or SUMMARY.

---

## 6. Cross-Cluster Integration

### 6.1 Sidecar→Other Cluster Connectivity

| Cluster | Connection | Status | Details |
|---------|-----------|--------|---------|
| **C1 (Config)** | `SidecarDependencyRegistry` imports config types | ✅ WIRED | `setConfigSubscriber()` in registry |
| **C2 (Tracking)** | Routes access `sessionTracker` via `(registry as any)` | ❌ BROKEN | 3 files use `as any` to access sessionTracker |
| **C3 (Delegation)** | Tool-proxy delegates to DelegationManager | ⚠️ PARTIAL | `delegate-task.ts` calls `dm.dispatch()`; status/proxy are stubs |
| **C4 (Hooks)** | No direct connection | ❌ NONE | Sidecar does not read from C4 hooks |
| **C5 (Tools)** | Tool proxy wraps 7 tools | ❌ STUBS | 5 of 7 tool handlers return fake data |
| **C6 (Assets)** | Catalog references shipped agents/tools | ⚠️ STALE | Catalog is a frozen snapshot |

### 6.2 Plugin-Side Import Analysis

**`grep -rn "from.*src/sidecar" src/ --include="*.ts"` returns NO results outside `src/sidecar/`.** This means:
- The sidecar is **completely isolated** from the rest of the harness
- No other cluster imports sidecar types or modules
- The sidecar only communicates outward via HTTP (port file + REST endpoints)
- The `readonly-state.ts` canonical state bridge is the ONLY read surface

### 6.3 Sidecar→Next.js App Communication

The Next.js app communicates exclusively via localhost HTTP:
1. Discovers plugin port from `.hivemind/state/sidecar-port.json`
2. Calls REST endpoints via `plugin-client.ts`
3. Subscribes to SSE events via `use-sse.ts`
4. Optionally connects to WebSocket for delegation streaming

**Data flow is fully wired** per SC-03 verification: all plugin-client→state-store→use-sse→dashboard-shell connections are traced and verified as WIRED.

---

## 7. Gaps & Flaws

### 7.1 5 of 7 Tool-Proxy Handlers Are Stubs (High Impact)

**Files:** `src/sidecar/server/tool-proxy/handlers/*.ts` (7 files)

**Issue:** Only 2 of 7 tool handlers (`delegate-task.ts`, `session-patch.ts`) have real functionality. The remaining 5 return fake/empty data:
- `delegation-status.ts` — always returns `{ status: "running" }`
- `execute-slash-command.ts` — returns `"Command X dispatched"` without execution
- `hivemind-session-view.ts` — calls `st.get()` but discards the result
- `hivemind-trajectory.ts` — returns empty events if `inspect()` doesn't exist
- `hivemind-command-engine.ts` — always returns `{ routes: [] }`

**Impact:** The sidecar tool proxy cannot return real data. Any dashboard panel relying on these handlers (session explorer, delegation dashboard, control panel) will show empty or fake state.

### 7.2 `as any` Casts Bypass Registry Type Safety (Medium Impact)

**Files:** 5 occurrences across 4 files

**Issue:** The `SidecarDependencyRegistry` was designed with typed getter/setter pairs that throw `[Harness]` errors on unbound access. The `(registry as any).sessionTracker` pattern completely bypasses this safety net — accessing an unbound dependency silently returns `undefined`, and calling `undefined.get()` throws a non-descriptive `TypeError`.

**Impact:** Debugging sidecar tool failures is harder because the error message is `Cannot read properties of undefined` instead of `[Harness] Dependency sessionTracker not bound`.

### 7.3 SC-02 NEVER Delivered (High Impact)

**Issue:** SC-02 (REST API + Tool Proxy) was locked and ready but never transitioned to execution. The code that exists in `src/sidecar/server/routes/` and `src/sidecar/server/tool-proxy/` was written ad-hoc alongside SC-03 without formal phase governance. There is no SC-02-SUMMARY.md.

**Impact:** The tool proxy routes have no associated plan verification, no test coverage, and no integration testing. The handlers were never formally validated against the SPEC requirements.

### 7.4 SC-03 Failed Verification — 36/41 Tests Fail (High Impact)

**Issue:** The verification report shows 2 root causes for 36 test failures:
1. `tsconfig.json` `jsx: "preserve"` conflict with vitest (blocking ALL TSX tests)
2. `NOT_IMPLEMENTED` scaffold tests with wrong export names (32 tests)

**Impact:** The Next.js app has no automated quality assurance. The `next build` was never executed — the production standalone server does not exist. The dev build (.next/dev/) exists but is a Next.js development cache, not production output.

### 7.5 `next build` Never Executed (Medium Impact)

**File:** `sidecar/.next/standalone/server.js` does not exist

**Issue:** The SC-03 SPEC requires `output: "standalone"` with production build. The `next.config.ts` has the correct config, but `next build` was never executed. The `.next/dev/` directory contains only Next.js development build output.

**Impact:** There is no deployable sidecar GUI. The only way to see the dashboard is running `next dev` with a live plugin server.

### 7.6 Sidecar Not Imported by Any Other Cluster (Low Impact)

**Issue:** `grep -rn "from.*src/sidecar" src/ --include="*.ts"` returns zero results outside `src/sidecar/`. The sidecar is a fully isolated island — no other harness module depends on it.

**Impact:** Low, by design. The sidecar communicates through HTTP, not shared imports. But it means the sidecar is not part of the compile-time dependency graph — changes to its exports never break other modules.

### 7.7 `hivemind-session-view.ts` Discards Query Result (Critical)

**File:** `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:39`

**Issue:** `st.get(args.sessionId)` is called but the return value is discarded. The handler always returns `{ ok: true, data: { sessionId: args.sessionId } }`. The session data is never captured, serialized, or returned.

**Impact:** The session explorer panel (SC-04) depends on this handler for session data. It cannot function with the current implementation.

### 7.8 Sidecar Tool Catalog Is a Frozen Snapshot (Low Impact)

**Files:** `src/sidecar/catalog/tool-catalog.json`, `tool-catalog.ts`

**Issue:** The tool catalog is a JSON file imported with `with { type: "json" }` and deep-frozen at module load. It represents the tool ecosystem at the time of the last build. Adding, removing, or renaming tools does NOT update this catalog. There is no generation script.

**Impact:** The catalog will drift from the actual tool ecosystem over time. Dashboard panels querying the catalog for available tools may show stale entries.

### 7.9 Middleware Gap: No Request Logging, Auth, or Rate Limiting

**Issue:** The sidecar intentionally defers all cross-cutting concerns (auth, rate limit, logging) to the native OpenCode runtime. This is BY DESIGN per SC-02 SPEC (D-SC02-01 through D-SC02-10). However, the sidecar has zero observability — no request logging, no error tracking, no performance monitoring. A failing handler silently returns `{ ok: false, error: { code: "...", message: "..." } }`.

### 7.10 WS Types as Ambient `.d.ts` (Low Impact)

**File:** `src/sidecar/server/ws/types.d.ts`

**Issue:** The WebSocket types are in a `.d.ts` file rather than a `.ts` module. Ambient type declarations are invisible to TypeScript unless explicitly included. If `tsconfig.json` changes its type include strategy, these types silently disappear.

### 7.11 No Integration Tests for Tool Proxy or Routes

**Issue:** There are `tests/sidecar/` test files for SC-01 foundation (registry, SSE pool, factory, types, readonly-state) — 59 tests that all pass. But there are NO tests for:
- `src/sidecar/server/routes/*` (6 route files, 388 LOC)
- `src/sidecar/server/tool-proxy/*` (8 files, 380 LOC)
- `src/sidecar/catalog/*` (no catalog tests in tests/sidecar/)
- `src/sidecar/server/ws/*` (no WS tests)

**Impact:** 768 LOC of route and tool-proxy code has zero test coverage. The SC-03 Next.js tests cover the client side (plugin-client, state-store, use-sse) but never integration-test against a real plugin server.

### 7.12 SC-02 Sub-Plan Orphans (Low Impact)

**Files:** `.planning/phases/SC-02-rest-api-tool-proxy/plan-0.md` through `plan-4.md`

**Issue:** 5 sub-plans for SC-02 were written but never executed. They describe implementation details (route structure, handler signatures, WebSocket protocols) that may not match the ad-hoc code that was actually written.

---

## 8. Conflicts

### 8.1 SC-02 Spec → Code Mismatch

**Conflict:** The SC-02 SPEC defines rigorous requirements (EARS-format, 5 families) but the actual code was never validated against them. SPEC requirements like "all 7 tool handlers return ToolResponse<T> envelopes" are partially met — they return the correct envelope shape, but the data inside is fake. SPEC requirements like "state machine transitions for WS delegation channel" were never implemented (the WS handler exists but is untested).

### 8.2 SC-03 Scaffold Tests vs Real Implementation

**Conflict:** The SC-03 tests were written as TDD scaffolds with placeholder names (`createPluginClient`, `createStateStore`) before the real implementation. When the implementation was written, it used different names (`PluginClient`/`getPluginClient`, `createSidecarStateStore`). The tests were never updated to match. This means the tests were written as RED scaffolds but never iterated to GREEN.

### 8.3 `jsx: "preserve"` vs Vitest Transform

**Conflict:** `sidecar/tsconfig.json` sets `"jsx": "preserve"` (leaves JSX as-is for Next.js). `sidecar/vitest.config.ts` uses `esbuild.jsx: "automatic"` for transform. These two configs are incompatible — vitest tries to import TSX files but gets raw JSX syntax it cannot parse. The fix is simple (change tsconfig `jsx` to `"react-jsx"`) but was never applied.

### 8.4 Catalog: Frozen Snapshot vs Evolving Tool Ecosystem

**Conflict:** The sidecar tool catalog is deep-frozen at module load time. The C3/C5 tool ecosystem evolves through phases and new primitives. There is no mechanism to keep the catalog in sync — the catalog will always lag behind the actual tool set unless manually regenerated.

### 8.5 `(registry as any)` vs Typed Registry Design

**Conflict:** The `SidecarDependencyRegistry` was designed with explicit typed getter/setter pairs to ensure safe lazy binding. The tool-proxy handlers and route implementations bypass this with `(registry as any)` casts, accessing `sessionTracker` and `trajectory` as properties instead of through the typed getter (`registry.sessionTracker` vs `registry.getSessionTracker()`). This subverts the entire lazy-binding safety system.

---

## 9. Tech Debt Assessment

| Item | Severity | Effort to Fix | Description |
|------|----------|--------------|-------------|
| 5 stub tool handlers | HIGH | 2-3 days | Reimplement delegation-status, execute-slash-command, session-view, trajectory, command-engine |
| `as any` casts | MEDIUM | 2 hours | Replace `(registry as any).X` with `registry.getX()` |
| Discarded `st.get()` result | CRITICAL | 15 minutes | Assign and return the session data |
| SC-03 NOT_IMPLEMENTED tests | HIGH | 4 hours | Rewrite test imports to match actual exports |
| SC-03 JSX config | MEDIUM | 5 minutes | Change tsconfig `jsx: "preserve"` → `"react-jsx"` |
| Run `next build` | MEDIUM | 2 minutes | `cd sidecar && npx next build` |
| No tool-proxy tests | HIGH | 2-3 days | 7 handler test files missing |
| No route tests | HIGH | 1-2 days | 6 route files untested |
| Frozen catalog | LOW | 1 day | Add catalog generation script |
| `.d.ts` WS types | LOW | 15 minutes | Convert to `.ts` modules |

---

## 10. Key Findings

1. **5 of 7 tool-proxy handlers are stubs** that return fake or empty data. The `hivemind-session-view.ts` handler is the worst — it calls `st.get(sessionId)` but discards the result. The `delegation-status.ts`, `execute-slash-command.ts`, and `hivemind-command-engine.ts` handlers never access any real dependency at all. The sidecar tool proxy cannot serve real data to the dashboard.

2. **SC-02 was never delivered** — its 5 sub-plans exist as planning artifacts but no SUMMARY was ever written. The code in `src/sidecar/server/routes/` and `tool-proxy/` was written ad-hoc alongside SC-03 without formal phase governance or any testing. All 768 LOC of routes and handlers have **zero test coverage**.

3. **SC-03 verification failed comprehensively** — 6/13 ACs met, 36/41 tests fail, from just 2 root causes. The `jsx: "preserve"` config conflict blocks 4 TSX tests, and 32 tests use `NOT_IMPLEMENTED` scaffold wrappers with wrong export names. The `next build` was never executed — the production standalone server does not exist.

4. **The sidecar is an isolated island** — zero imports from any other harness module. It communicates entirely through HTTP (socket file + REST endpoints). While this is architecturally intentional, it means the sidecar has no compile-time integration with the rest of the harness. Changes to C2/C3/C5 that affect the tool proxy never cause compile errors in the sidecar.

5. **`(registry as any)` casts completely subvert the dependency registry's safety system.** The `SidecarDependencyRegistry` was designed with typed getters that throw `[Harness]` errors on unbound access. Five locations bypass this with `as any`, silently accessing unbound dependencies. This is the same anti-pattern that CONCERNS.md §3 flags in C2.

---

*C7 Inventory: 2026-06-06 — 27 plugin-side src files (2,450 LOC) + 40+ Next.js app files analyzed*
