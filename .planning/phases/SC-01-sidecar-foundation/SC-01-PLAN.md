---
phase: SC-01-sidecar-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/sidecar/readonly-state.ts
  - src/sidecar/server/factory.ts
  - src/sidecar/server/registry.ts
  - src/sidecar/server/sse/pool.ts
  - src/sidecar/types.ts
  - src/sidecar/readonly-state-extensions.ts
  - src/plugin.ts
  - package.json
  - tests/sidecar/server/types.test.ts
  - tests/sidecar/server/registry.test.ts
  - tests/sidecar/server/factory.test.ts
  - tests/sidecar/server/sse/pool.test.ts
  - tests/sidecar/readonly-state-extensions.test.ts
autonomous: false
requirements: [SIDECAR-01]
must_haves:
  truths:
    - "Plugin HTTP server starts on random localhost port during plugin init"
    - "Port is persisted to .hivemind/state/sidecar-port.json for Next.js discovery"
    - "CANONICAL_PREFIXES includes .hivemind/session-tracker and .opencode"
    - "Directory listing function exists for canonical state surfaces"
    - "SidecarDependencyRegistry accepts lazy-bound modules after server start"
    - "SseConnectionPool manages SSE client connections with heartbeat"
    - "json-render packages bumped to 0.19.0, ws added to optionalDependencies"
    - "All existing readonly-state.ts tests pass with new prefixes"
    - "Server start failure does NOT block plugin init — logs warning, continues"
    - "Port.json write failure does NOT block plugin init — logs warning, continues"
  artifacts:
    - path: "src/sidecar/server/factory.ts"
      provides: "createSidecarServer factory function with /health endpoint + 501 fallback"
      min_lines: 50
      exports: ["createSidecarServer", "SidecarServerDeps", "SidecarServer"]
    - path: "src/sidecar/server/registry.ts"
      provides: "Lazy dependency binding container"
      min_lines: 80
      exports: ["SidecarDependencyRegistry"]
    - path: "src/sidecar/server/sse/pool.ts"
      provides: "SSE connection pool with broadcast + heartbeat"
      min_lines: 60
      exports: ["SseConnectionPool"]
    - path: "src/sidecar/readonly-state-extensions.ts"
      provides: "Extended prefixes and listCanonicalDirectory"
      min_lines: 40
      exports: ["listCanonicalDirectory", "DirectoryEntry", "extendedPrefixes"]
    - path: "src/sidecar/types.ts"
      provides: "Sidecar-specific types (SidecarEventType union, SidecarEvent interface)"
      min_lines: 30
    - path: "src/plugin.ts"
      provides: "Server startup at step 5.5 + dependency binding calls, try-catch wrapped"
  key_links:
    - from: "src/plugin.ts"
      to: "src/sidecar/server/factory.ts"
      via: "createSidecarServer() call at step 5.5, wrapped in try-catch"
    - from: "src/sidecar/server/registry.ts"
      to: "src/coordination/delegation/manager.ts"
      via: "setDelegationManager() — lazy bound at step 7"
    - from: "src/sidecar/server/registry.ts"
      to: "src/features/session-tracker/index.ts"
      via: "setSessionTracker() — lazy bound at step 6"
    - from: "src/sidecar/server/factory.ts"
      to: "GET /health"
      via: "request handler returns 200 + JSON for /health, 501 for all other routes"
---

<objective>
**Phase SC-01: Sidecar Foundation — Plugin HTTP Server + State Bridge**

**Purpose:** Establish the foundational infrastructure for all sidecar panels: a lightweight HTTP/WS server embedded in the Hivemind plugin, extended canonical state prefixes for session-tracker access, lazy dependency binding so the server can start before all modules are constructed, and SSE connection primitives. Server includes a GET /health endpoint and 501 fallback for all other routes.

**Output:** Plugin HTTP server starts at plugin init step 5.5. Six new files created in `src/sidecar/`. Wave 0 test files created for all new modules. Package bumps applied. Existing readonly-state tests pass with extended prefixes.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/SIDECAR-OVERVIEW.md
@.planning/phases/SIDECAR-DEPENDENCY-GRAPH.md
@.hivemind/planning/sidecar-vision/ARCHITECTURE.md
@.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md
@.hivemind/planning/sidecar-vision/RESEARCH-json-render.md
@.planning/phases/SC-01-sidecar-foundation/SC-01-RESEARCH.md

# Existing codebase surfaces this phase touches
@src/sidecar/readonly-state.ts
@src/plugin.ts

# Interface context — contracts the tasks implement
# D-SC01-01: createSidecarServer() returns { port, close } with internal async start()
# D-SC01-02: Server binds to 127.0.0.1:0 (random port)
# D-SC01-03: Server start failure wrapped in try-catch — log warning, continue
# D-SC01-04: Port.json write failure wrapped in try-catch — log warning, continue
# D-SC01-05: GET /health → 200 OK with { status: "ok", uptime }
# D-SC01-06: All other routes → 501 Not Implemented
# D-SC01-13: Wave 0 test files BEFORE implementation (TDD)
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend CANONICAL_PREFIXES + Add Directory Listing + Test</name>
  <files>
    src/sidecar/readonly-state.ts
    src/sidecar/readonly-state-extensions.ts  (NEW)
    tests/sidecar/readonly-state-extensions.test.ts  (NEW)
  </files>
  <behavior>
    - Test 1: CANONICAL_PREFIXES has exactly 4 entries after extension
    - Test 2: isCanonicalStatePath() returns true for paths under all 4 prefixes
    - Test 3: isCanonicalStatePath() returns false for paths outside canonical prefixes
    - Test 4: listCanonicalDirectory() returns DirectoryEntry[] for a known canonical dir
    - Test 5: listCanonicalDirectory() returns empty array for a non-canonical path
  </behavior>
  <action>
    FIRST — create test file `tests/sidecar/readonly-state-extensions.test.ts` per TDD:
    Import `isCanonicalStatePath` from `src/sidecar/readonly-state`. Import `listCanonicalDirectory`, `DirectoryEntry` from `src/sidecar/readonly-state-extensions`. Write tests for the 5 behaviors above. Run tests — they MUST fail (RED).

    THEN — implement:
    Extend `CANONICAL_PREFIXES` in `readonly-state.ts` by adding `.hivemind/session-tracker` and `.opencode` to the existing array of `[".hivemind/state", ".planning"]`. Do NOT remove existing prefixes. Verify the path containment logic in `isCanonicalStatePath()` handles all 4 prefixes correctly (the algorithm already normalizes paths and checks `startsWith` — it works as-is once the array literal is updated).

    Create `readonly-state-extensions.ts` (NEW file) that exports:
    - `DirectoryEntry` interface: `{ name: string; type: "file" | "directory"; size: number; mtime: number }`
    - `listCanonicalDirectory(absoluteDirPath, opts)` function using `readdirSync` with `withFileTypes: true`, filtered through `isCanonicalStatePath()`. Return `DirectoryEntry[]`. This is used by SC-02 state directory listing endpoints.
    - Export `EMPTY_CANONICAL_PREFIXES_ERROR` constant for error messages.

    Run tests again — they MUST pass (GREEN). Nyquist gate: `grep -v '^#' .planning/phases/SC-01-sidecar-foundation/SC-01-PLAN.md | grep -c 'session-tracker'` must be >0.
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/readonly-state.test.ts tests/sidecar/readonly-state-extensions.test.ts -x</automated>
  </verify>
  <done>CANONICAL_PREFIXES has 4 entries, directory listing function exists, all tests pass</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create Types + SidecarDependencyRegistry + SidecarServer Factory + Tests</name>
  <files>
    src/sidecar/types.ts            (NEW)
    src/sidecar/server/registry.ts  (NEW)
    src/sidecar/server/factory.ts   (NEW)
    tests/sidecar/server/types.test.ts      (NEW)
    tests/sidecar/server/registry.test.ts   (NEW)
    tests/sidecar/server/factory.test.ts    (NEW)
  </files>
  <behavior>
    - Test 1: SidecarEventType union has exactly 11 members (per D-SC01-03 SPEC AC)
    - Test 2: SidecarEvent has correct shape (type, payload, timestamp)
    - Test 3: Registry isReady() returns false before any bindings
    - Test 4: Registry isReady() returns true after core 3 deps bound (DelegationManager, SessionTracker, Client)
    - Test 5: Accessing unbound getter throws [Harness] error
    - Test 6: createSidecarServer() returns port > 0 after start
    - Test 7: GET /health returns 200 with JSON { status: "ok", uptime }
    - Test 8: Other routes return 501 Not Implemented
    - Test 9: close() shuts down server cleanly
  </behavior>
  <action>
    FIRST — create test files per TDD (RED phase):

    `tests/sidecar/server/types.test.ts`:
    Import `SidecarEventType`, `SidecarEvent` from `src/sidecar/types`. Verify `SidecarEventType` is exactly the 11-member union (compile-time check). Verify `SidecarEvent` shape: `{ type: SidecarEventType; payload: Record<string, unknown>; timestamp: number }`.

    `tests/sidecar/server/registry.test.ts`:
    Import `SidecarDependencyRegistry` from `src/sidecar/server/registry`. Test: `isReady()` returns `false` before bindings, `true` after `setDelegationManager + setSessionTracker + setClient`. Test: accessing an unbound getter (e.g., `registry.delegationManager`) throws `[Harness]` error. Test: accessing a bound getter returns the set value.

    `tests/sidecar/server/factory.test.ts`:
    Import `createSidecarServer` from `src/sidecar/server/factory`. Test: server starts on `port > 0`. Test: `GET /health` returns 200 with `{ status: "ok" }`. Test: `GET /` (or any other path) returns 501. Test: `close()` shuts down cleanly (second close resolves). Servers use port 0 (random), closed in `afterEach`.

    Run all 3 test files — they MUST fail (RED).

    THEN — create implementation files:

    Create `src/sidecar/types.ts` — export Sidecar-specific types:
    - `SidecarEventType` union: `"session.created" | "session.updated" | "session.idle" | "session.deleted" | "session.error" | "delegation.dispatched" | "delegation.completed" | "delegation.failed" | "delegation.timeout" | "invalidate.cache" | "heartbeat"` (exactly 11 members per SPEC.md acceptance criteria)
    - `SidecarEvent` interface: `{ type: SidecarEventType; payload: Record<string, unknown>; timestamp: number }`

    Create `src/sidecar/server/registry.ts` — SidecarDependencyRegistry class:
    - Private nullable fields: `_delegationManager?`, `_sessionTracker?`, `_client?`, `_trajectory?`, `_pressure?`, `_configSubscriber?` (all typed via `import type` to avoid runtime deps)
    - Setter methods: `setDelegationManager(m)`, `setSessionTracker(s)`, `setClient(c)`, `setTrajectory(t)`, `setPressure(p)`, `setConfigSubscriber(cs)`
    - Getter methods with `[Harness]` error if accessed before bound (e.g., `get delegationManager()` throws `"[Harness] Sidecar: DelegationManager not bound yet"`) — per D-SC01-03 and SPEC AC
    - `isReady(): boolean` — returns true when `_delegationManager && _sessionTracker && _client` are all non-null
    - Export type `SidecarBoundDeps` reflecting the union of bound modules

    Create `src/sidecar/server/factory.ts` — createSidecarServer factory:
    - `SidecarServerDeps` interface: `{ projectDirectory: string; port?: number }` (port defaults to 0)
    - `SidecarServer` interface: `{ port: number; close: () => Promise<void> }`
    - `createSidecarServer(deps)` — creates Node `http.createServer` (NOT Express — zero dependency)
    - Request handler (per D-SC01-05, D-SC01-06):
      - If `req.url === '/health' && req.method === 'GET'`: respond `200` with JSON `{ status: "ok", uptime: <process.uptime() * 1000> }`
      - For ALL other requests: respond `501 Not Implemented`
    - Internal `start()` method: `server.listen(0, '127.0.0.1', () => resolve(server.address().port))` — returns `Promise<number>` with the actual port. `server.listen(deps.port ?? 0, '127.0.0.1')`.
    - Returns `SidecarServer` object with `port` (0 until start resolves) and `close()`
    - Register cleanup via `process.on('SIGTERM')` and `process.on('SIGINT')` to close server
    - Export singleton `getRegistry(): SidecarDependencyRegistry` accessor

    Run tests — they MUST pass (GREEN).
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/sidecar/server/types.test.ts tests/sidecar/server/registry.test.ts tests/sidecar/server/factory.test.ts -x</automated>
  </verify>
  <done>Types defined, server factory creates http server with /health+501, registry accepts lazy bindings, unbound getters throw, all tests pass, typecheck passes</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create SseConnectionPool + Wire Server into Plugin Init + Test</name>
  <files>
    src/sidecar/server/sse/pool.ts     (NEW)
    tests/sidecar/server/sse/pool.test.ts  (NEW)
    src/plugin.ts
    package.json
    sidecar/package.json
  </files>
  <behavior>
    - Test 1: Pool accepts clients via addClient()
    - Test 2: Pool removes clients via removeClient()
    - Test 3: broadcast() sends events to all connected clients
    - Test 4: clientCount() returns correct number
    - Test 5: Dead clients are cleaned up during broadcast
    - Test 6: Max connections enforced (default 50, configurable)
    - Test 7: Heartbeat is sent at configurable interval (default 30s)
  </behavior>
  <action>
    FIRST — create test file `tests/sidecar/server/sse/pool.test.ts` per TDD:
    Import `SseConnectionPool` from `src/sidecar/server/sse/pool`. Mock `ReadableStreamDefaultController` with `enqueue()` and optional throw to simulate dead client. Test behaviors above. Run tests — MUST fail (RED).

    THEN — implement SseConnectionPool:

    Create `src/sidecar/server/sse/pool.ts` — SseConnectionPool class:
    - `addClient(id, controller)` — register SSE client (takes `ReadableStreamDefaultController` or compatible interface). Rejects new connections if `clientCount() >= maxClients`.
    - `removeClient(id)` — deregister
    - `broadcast(event)` — iterate clients, `controller.enqueue(encoder.encode(message))`, catch thrown errors and call `removeClient(id)` for dead connections
    - `clientCount()` — returns number of active connections
    - Heartbeat interval (30s, configurable via constructor `heartbeatIntervalMs` option)
    - Max concurrent connections (50, configurable via constructor `maxClients` option)
    - Export `SidecarEvent` type for events

    Run tests — MUST pass (GREEN).

    THEN — wire into plugin.ts (per D-SC01-12, verify step numbering FIRST):

    BEFORE editing plugin.ts, verify the insertion point:
    ```bash
    grep -n "createTmuxIntegrationIfSupported\|SessionTracker\|createSidecarServer\|projectDirectory" src/plugin.ts | head -20
    ```
    Confirm the line where `createTmuxIntegrationIfSupported` returns (the tmux integration block end) and the line where `new SessionTracker` is constructed. The sidecar server start MUST be inserted between these two.

    In `src/plugin.ts`, locate the startup sequence between tmux integration and session-tracker creation. INSERT the sidecar server start after the tmux integration block, before SessionTracker construction. Use try-catch per D-SC01-03 and D-SC01-04:

    ```typescript
    // STEP 5.5: Start sidecar HTTP/WS server (fire-and-forget)
    try {
      const sidecarServer = createSidecarServer({ projectDirectory })
      const sidecarPort = await sidecarServer.start()
      try {
        writeFileSync(
          join(projectDirectory, ".hivemind", "state", "sidecar-port.json"),
          JSON.stringify({ port: sidecarPort })
        )
      } catch (portErr) {
        void client.app?.log?.({
          body: { service: "sidecar", level: "warn", message: `[Harness] Failed to write sidecar-port.json: ${portErr instanceof Error ? portErr.message : String(portErr)}` }
        })
      }
    } catch (serverErr) {
      void client.app?.log?.({
        body: { service: "sidecar", level: "warn", message: `[Harness] Failed to start sidecar server: ${serverErr instanceof Error ? serverErr.message : String(serverErr)}` }
      })
    }
    ```

    Then at subsequent steps, add binding calls after each module construction:
    ```typescript
    getRegistry().setSessionTracker(sessionTracker)
    getRegistry().setDelegationManager(delegationModules.delegationManager)
    getRegistry().setClient(client)
    ```

    IMPORTANT: Do NOT import delegation or session modules at the top of plugin.ts — use `import type` only. The SidecarServer references types, not runtime instances. Runtime modules register themselves via the registry after construction.

    In `package.json` (root), add `"ws": "^8.18.0"` to `optionalDependencies`. Bump json-render packages from `^0.18.0` to `^0.19.0` in optionalDependencies:
    - `@json-render/core`: `^0.18.0` → `^0.19.0`
    - `@json-render/react`: `^0.18.0` → `^0.19.0`
    - `@json-render/next`: `^0.18.0` → `^0.19.0`
    - `@json-render/ink`: `^0.18.0` → `^0.19.0`
    - `@json-render/react-pdf`: `^0.18.0` → `^0.19.0`

    In `sidecar/package.json`, bump `@json-render/react` from `^0.1.0` to `^0.19.0` (the 0.1.0 was a placeholder).

    Run `npm install` at root level to apply the new `ws` package and json-render bumps.
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/sidecar/server/sse/pool.test.ts -x && npm ls @json-render/core 2>/dev/null | grep -q "0.19" && npm ls ws 2>/dev/null | grep -q "^ws@"</automated>
  </verify>
  <done>Package bumps applied, ws installed, plugin.ts has try-catch-wrapped sidecar start + binding calls, SSE pool manages connections with heartbeat and max 50 limit, typecheck passes, all tests pass</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plugin HTTP server ↔ host process | Localhost-only HTTP server accessible to any process on the machine |
| CANONICAL_PREFIXES extension | Adding `.opencode/` exposes agent/command definitions via state API |
| HTTP request path → filesystem | Raw path from request URL passed to state reading functions |
| Server start failure | Uncaught start failure can block entire plugin init |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SC01-01 | Tampering | sidecar-port.json write | mitigate | Write via `writeFileSync` inside plugin init — only the plugin process writes this file; try-catch per D-SC01-04 |
| T-SC01-02 | Info Disclosure | CANONICAL_PREFIXES extended to `.opencode/` | accept | `.opencode/` contains agent/command definitions, not secrets. Localhost-only access. |
| T-SC01-03 | Elevation of Privilege | Lazy dependency registry bindings | mitigate | Getter methods throw `[Harness]` error if accessed before binding — no silent undefined |
| T-SC01-04 | Tampering | Path traversal via state API | mitigate | `isCanonicalStatePath()` restricts to 4 prefixes; non-canonical paths return empty |
| T-SC01-05 | DoS | Server start failure exposes half-init state | mitigate | Try-catch at step 5.5; log warning; continue without sidecar — per D-SC01-03 |
| T-SC01-06 | DoS | SSE dead connection accumulation | mitigate | Cleanup on broadcast error (catch enqueue → removeClient); max 50 clients |
| T-SC01-SC | Tampering | npm package installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED] packages (ws, json-render bumps) |
</threat_model>

<verification>
- [ ] `npm run typecheck` passes with no errors
- [ ] `npx vitest run tests/sidecar/readonly-state.test.ts -x` — existing tests pass with 4 prefixes
- [ ] `npx vitest run tests/sidecar/readonly-state-extensions.test.ts -x` — listCanonicalDirectory returns correct DirectoryEntry[] for canonical paths, empty for non-canonical paths
- [ ] `npx vitest run tests/sidecar/server/types.test.ts -x` — SidecarEventType is exactly 11 members (per SPEC AC), SidecarEvent shape is correct
- [ ] `npx vitest run tests/sidecar/server/registry.test.ts -x` — isReady() transitions, unbound getter throws [Harness]
- [ ] `npx vitest run tests/sidecar/server/factory.test.ts -x` — server port > 0, /health returns 200, other routes return 501, close() cleans up
- [ ] `npx vitest run tests/sidecar/server/sse/pool.test.ts -x` — add/remove/broadcast correctly, max 50 connections enforced, heartbeat at configurable interval, dead clients cleaned up on broadcast
- [ ] `createSidecarServer()` returns with an actual port > 0
- [ ] `SidecarDependencyRegistry.isReady()` returns false before bindings, true after
- [ ] Accessing unbound getter throws `[Harness]` error
- [ ] SseConnectionPool enforces max 50 concurrent connections (configurable)
- [ ] `npm ls @json-render/core` shows 0.19.0
- [ ] `npm ls ws` shows ws is installed
</verification>

<success_criteria>
1. Plugin HTTP server starts during plugin init on a dynamic localhost port
2. Port is written to `.hivemind/state/sidecar-port.json`
3. Server start failure is caught by try-catch — does NOT block plugin init, logs warning, continues (per D-SC01-03)
4. sidecar-port.json write failure is caught by try-catch — does NOT block plugin init, logs warning, continues (per D-SC01-04)
5. `CANONICAL_PREFIXES` now has 4 entries (state, planning, session-tracker, opencode)
6. `listCanonicalDirectory()` returns file/directory listings for canonical paths, empty for non-canonical paths
7. `SidecarEventType` union has exactly 11 members matching SPEC.md acceptance criteria
8. `SidecarDependencyRegistry` accepts lazy bindings and reports readiness
9. Accessing an unbound registry getter throws `[Harness]` error
10. `SseConnectionPool` manages SSE clients with 30s heartbeat, max 50 connections
11. HTTP request handler returns 200 + JSON for GET /health, 501 for all other routes (per D-SC01-05, D-SC01-06)
12. All json-render packages at 0.19.0, `ws` installed as opt dep
13. Existing readonly-state tests pass with extended prefixes
14. All new test files (types, registry, factory, SSE pool, readonly-state-extensions) exist and pass
</success_criteria>

<output>
Create `.planning/phases/SC-01-sidecar-foundation/SC-01-SUMMARY.md` when done
</output>
