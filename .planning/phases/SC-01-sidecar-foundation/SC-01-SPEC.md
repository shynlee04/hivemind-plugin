# Phase SC-01: Sidecar Foundation — Specification

**Created:** 2026-06-02
**Ambiguity score:** 0.14 (gate: ≤ 0.20)
**Requirements:** 7 locked

## Goal

Establish the foundational infrastructure for all Hivemind Sidecar panels: a lightweight embedded HTTP/WS server in the plugin process, extended canonical state prefixes for session-tracker and opencode access, lazy dependency binding so the server can start before all modules are constructed, SSE connection primitives, and required package dependency bumps.

## Background

**Current state:** The Hivemind plugin has no embedded HTTP server. The only sidecar surface is `src/sidecar/readonly-state.ts`, which provides `CANONICAL_PREFIXES = [".hivemind/state", ".planning"]`, `isCanonicalStatePath()`, and `readCanonicalState()` / `readCanonicalStateAsync()`. There is no server, no dependency registry, no SSE pool, no directory listing function, and no way for a Next.js sidecar app to discover the plugin or read state remotely. The `@json-render/*` packages sit at `^0.18.0` and `ws` is not installed.

**The gap:** The architecture plan (`.hivemind/planning/sidecar-vision/ARCHITECTURE.md`) defines a two-server model — plugin HTTP server (embedded, localhost-only, random port) + Next.js standalone app (port 3099). SC-01 builds the plugin-side foundation so SC-02 (REST API + Tool Proxy) and SC-03 (Next.js app) can layer on top. Without SC-01, no sidecar panel can communicate with the plugin runtime.

**Primary deliverable:** A plugin HTTP server that starts at plugin init step 5.5, persists its random port to `.hivemind/state/sidecar-port.json`, accepts lazy dependency bindings from modules constructed later in the startup sequence, and manages SSE client connections with heartbeat.

## Requirements

1. **Extended canonical state prefixes**: Add `.hivemind/session-tracker` and `.opencode` to `CANONICAL_PREFIXES` in `readonly-state.ts`.
   - **Current:** `CANONICAL_PREFIXES` has 2 entries: `[".hivemind/state", ".planning"]`
   - **Target:** `CANONICAL_PREFIXES` has 4 entries: `[".hivemind/state", ".hivemind/session-tracker", ".opencode", ".planning"]`
   - **Acceptance:** `isCanonicalStatePath()` returns `true` for paths under all 4 prefixes; existing readonly-state tests pass with extended prefixes

2. **Directory listing function**: Create `listCanonicalDirectory()` that returns file/directory listings for canonical paths.
   - **Current:** No directory listing function exists — only `readCanonicalState()` / `readCanonicalStateAsync()` for file reads
   - **Target:** `listCanonicalDirectory(absoluteDirPath, opts)` returns `DirectoryEntry[] = [{ name, type, size, mtime }]` using `readdirSync` with `withFileTypes: true`, filtered through `isCanonicalStatePath()`
   - **Acceptance:** Function returns correct entries for a known canonical directory, rejects non-canonical paths by returning empty array

3. **Sidecar-specific TypeScript types**: Create `src/sidecar/types.ts` with sidecar event types.
   - **Current:** No `src/sidecar/types.ts` exists
   - **Target:** Types file exports `SidecarEventType` union (11 event types), `SidecarEvent` interface with `{ type, payload, timestamp }`
   - **Acceptance:** TypeScript compiles without errors when importing these types in test and server code

4. **SidecarDependencyRegistry**: Create lazy dependency binding container for plugin modules.
   - **Current:** No registry exists — no mechanism for modules to register post-construction
   - **Target:** `SidecarDependencyRegistry` class at `src/sidecar/server/registry.ts` with 6 setter methods (`setDelegationManager`, `setSessionTracker`, `setClient`, `setTrajectory`, `setPressure`, `setConfigSubscriber`), getter methods that throw `[Harness]` error if accessed before binding, and `isReady()` returning `true` when core 3 deps are bound
   - **Acceptance:** `isReady()` returns `false` before bindings, `true` after `setDelegationManager + setSessionTracker + setClient`; accessing an unbound getter throws `[Harness]` error

5. **Plugin HTTP server factory**: Create `createSidecarServer()` that starts a lightweight HTTP server on localhost.
   - **Current:** No HTTP server in the plugin process
   - **Target:** `createSidecarServer(deps)` at `src/sidecar/server/factory.ts` creates `http.createServer()` (zero framework dependencies), binds to `127.0.0.1:0` (random port), returns `{ port: number, close: () => Promise<void> }`, registers `SIGTERM`/`SIGINT` cleanup handlers
   - **Acceptance:** Server starts on a port > 0; `close()` shuts down cleanly; port is accessible via `server.port` after start

6. **SseConnectionPool**: Create SSE client connection pool with heartbeat and max connections.
   - **Current:** No SSE infrastructure exists
   - **Target:** `SseConnectionPool` class at `src/sidecar/server/sse/pool.ts` with `addClient`, `removeClient`, `broadcast`, `clientCount` methods; 30s heartbeat interval (configurable); max 50 concurrent connections (configurable)
   - **Acceptance:** Pool handles add/remove/broadcast correctly; heartbeat is sent at configured interval; dead clients are cleaned up on broadcast

7. **Plugin startup wiring and package bumps**: Wire the sidecar server into `plugin.ts` startup sequence and apply dependency bumps.
   - **Current:** Plugin startup has steps 1-17 with no sidecar step; `@json-render/*` at `^0.18.0`; `ws` not in dependencies
   - **Target:** Server starts at step 5.5 (after tmux, before session-tracker); port is written to `.hivemind/state/sidecar-port.json`; binding calls inserted at steps 6-15; `@json-render/*` bumped to `^0.19.0`; `ws` added to `optionalDependencies`
   - **Acceptance:** `npm ls @json-render/core` shows `0.19.0`; `npm ls ws` shows `ws` installed; typecheck passes with new imports; port file is written during startup

## Boundaries

**In scope:**
- New files in `src/sidecar/` — `types.ts`, `readonly-state-extensions.ts`, `server/factory.ts`, `server/registry.ts`, `server/sse/pool.ts`
- Extension of `src/sidecar/readonly-state.ts` — CANONICAL_PREFIXES array enlargement
- Wiring in `src/plugin.ts` — server start at step 5.5, binding calls at steps 6-15
- Package bumps in `package.json` — json-render 0.18→0.19, ws added to optionalDeps
- Wave 0 test files for new modules (`tests/sidecar/server/`)

**Out of scope:**
- REST API routes (state, sessions, events, catalog) — SC-02
- Tool proxy (12 REST handlers wrapping plugin tools) — SC-02
- WebSocket delegation stream — SC-02
- SSE event observer wiring (createSidecarEventObserver) — SC-02
- Next.js 16 app scaffold — SC-03
- Sidecar panels (Session Explorer, Delegation Dashboard, MEMS Browser, Control Panel) — SC-04, SC-05, SC-06
- Plugin composition splitting (plugin.ts decomposition into registry/startup/composer) — P33
- Any authentication or authorization beyond localhost-only binding
- Request routing or handler layer (server is raw `http.createServer` with accept-only)

## Constraints

- Server must use Node `http.createServer` — NO Express, Fastify, or any framework dependency
- Server must bind to `127.0.0.1` only (localhost) — no external network access
- Server must start on a random port (`0`) — fixed ports only in tests
- Plugin startup sequence: server starts at step 5.5 (after tmux at step 5, before session-tracker at step 6)
- Server start must be fire-and-forget — must NOT block plugin init completion
- Dependency registry getters must throw `[Harness]` prefixed errors when accessed before binding
- `ws` must be added to `optionalDependencies` (not `dependencies`) so plugin doesn't fail if WS is unavailable
- Server cleanup must register `SIGTERM` and `SIGINT` handlers to close gracefully

## Acceptance Criteria

- [ ] `CANONICAL_PREFIXES` has 4 entries (state, session-tracker, opencode, planning)
- [ ] `listCanonicalDirectory()` returns `DirectoryEntry[]` for canonical paths, empty for non-canonical paths
- [ ] `SidecarEventType` union has all 11 event types defined in the architecture
- [ ] `SidecarDependencyRegistry.isReady()` returns false before core bindings, true after
- [ ] Accessing an unbound registry getter throws `[Harness]` error
- [ ] `createSidecarServer()` returns a server with `port > 0` and `close()` that cleans up
- [ ] `SseConnectionPool` supports add/remove/broadcast with configurable heartbeat (default 30s)
- [ ] `SseConnectionPool` enforces max 50 concurrent connections
- [ ] `npm ls @json-render/core` shows `0.19.0`
- [ ] `npm ls ws` shows `ws` installed
- [ ] `npm run typecheck` passes with no errors
- [ ] Existing `tests/sidecar/readonly-state.test.ts` passes with extended prefixes
- [ ] New `tests/sidecar/server/factory.test.ts` and `tests/sidecar/server/registry.test.ts` exist and pass
- [ ] New `tests/sidecar/server/sse/pool.test.ts` exists and passes

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Clear from architecture + PLAN.md  |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Well-separated from SC-02 per overview |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Startup ordering, no-Express, localhost |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 14 pass/fail criteria from PLAN.md |
| **Ambiguity**      | 0.14  | ≤0.20| ✓      | Gate passed — auto-generated from existing docs |

Status: ✓ = met minimum

## Interview Log

| Round | Perspective     | Question summary                                  | Decision locked                    |
|-------|-----------------|---------------------------------------------------|------------------------------------|
| 0     | --auto          | Loaded context from SIDECAR-OVERVIEW, ARCHITECTURE, DEPENDENCY-GRAPH, PLAN.md | Ambiguity 0.14 — gate passed, no interview needed |

*Note: --auto mode skipped interactive interview. All requirements derived from existing architecture and planning documents.*

---

*Phase: SC-01-sidecar-foundation*
*Spec created: 2026-06-02*
*Next step: /gsd-discuss-phase SC-01 — implementation decisions (server factory shape, registry binding order, test plan)*
