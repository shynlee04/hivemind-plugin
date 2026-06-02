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
autonomous: false
requirements: [SIDECAR-FOUNDATION-01]
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
  artifacts:
    - path: "src/sidecar/server/factory.ts"
      provides: "createSidecarServer factory function"
      min_lines: 40
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
      provides: "Sidecar-specific types"
      min_lines: 30
    - path: "src/plugin.ts"
      provides: "Server startup at step 5.5 + dependency binding calls"
  key_links:
    - from: "src/plugin.ts"
      to: "src/sidecar/server/factory.ts"
      via: "createSidecarServer() call at step 5.5"
    - from: "src/sidecar/server/registry.ts"
      to: "src/coordination/delegation/manager.ts"
      via: "setDelegationManager() — lazy bound at step 7"
    - from: "src/sidecar/server/registry.ts"
      to: "src/features/session-tracker/index.ts"
      via: "setSessionTracker() — lazy bound at step 6"
---

<objective>
**Phase SC-01: Sidecar Foundation — Plugin HTTP Server + State Bridge**

**Purpose:** Establish the foundational infrastructure for all sidecar panels: a lightweight HTTP/WS server embedded in the Hivemind plugin, extended canonical state prefixes for session-tracker access, lazy dependency binding so the server can start before all modules are constructed, and SSE connection primitives.

**Output:** Plugin HTTP server starts at plugin init step 5.5. Six new files created in `src/sidecar/`. Package bumps applied. Existing readonly-state tests pass with extended prefixes.
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

# Existing codebase surfaces this phase touches
@src/sidecar/readonly-state.ts
@src/plugin.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend CANONICAL_PREFIXES + Add Directory Listing</name>
  <files>
    src/sidecar/readonly-state.ts
    src/sidecar/readonly-state-extensions.ts  (NEW)
  </files>
  <action>
    Extend `CANONICAL_PREFIXES` in `readonly-state.ts` by adding `.hivemind/session-tracker` and `.opencode` to the existing array of `[".hivemind/state", ".planning"]`. Do NOT remove existing prefixes. Verify the path containment logic in `isCanonicalStatePath()` handles all 4 prefixes correctly (the algorithm already normalizes paths and checks `startsWith` — it works as-is once the array literal is updated).

    Create `readonly-state-extensions.ts` (NEW file) that exports:
    - `DirectoryEntry` interface: `{ name: string; type: "file" | "directory"; size: number; mtime: number }`
    - `listCanonicalDirectory(absoluteDirPath, opts)` function using `readdirSync` with `withFileTypes: true`, filtered through `isCanonicalStatePath()`. Return `DirectoryEntry[]`. This is used by SC-02 state directory listing endpoints.
    - Export `EMPTY_CANONICAL_PREFIXES_ERROR` constant for error messages.

    Write a Nyquist gate: `grep -v '^#' .planning/phases/SC-01-sidecar-foundation/SC-01-PLAN.md | grep -c 'session-tracker'` must be >0. Verify via `node -e "require('./tests/sidecar/readonly-state.test.ts')"` passes (run the test suite if it exists; if not, ensure the extension is tested via `import { isCanonicalStatePath } from '../readonly-state'` on 4 paths).
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/readonly-state.test.ts -x</automated>
  </verify>
  <done>CANONICAL_PREFIXES has 4 entries, directory listing function exists, existing tests pass</done>
</task>

<task type="auto">
  <name>Task 2: Create SidecarDependencyRegistry + SidecarServer Factory</name>
  <files>
    src/sidecar/server/registry.ts  (NEW)
    src/sidecar/server/factory.ts   (NEW)
    src/sidecar/types.ts            (NEW)
  </files>
  <action>
    Create `src/sidecar/types.ts` — export Sidecar-specific types:
    - `SidecarEventType` union: `"session.created" | "session.updated" | "session.idle" | "session.deleted" | "session.error" | "delegation.dispatched" | "delegation.completed" | "delegation.failed" | "delegation.timeout" | "invalidate.cache" | "heartbeat"`
    - `SidecarEvent` interface: `{ type: SidecarEventType; payload: Record<string, unknown>; timestamp: number }`

    Create `src/sidecar/server/registry.ts` — SidecarDependencyRegistry class:
    - Private nullable fields: `_delegationManager?`, `_sessionTracker?`, `_client?`, `_trajectory?`, `_pressure?`, `_configSubscriber?` (all typed via `import type` to avoid runtime deps)
    - Setter methods: `setDelegationManager(m)`, `setSessionTracker(s)`, `setClient(c)`, `setTrajectory(t)`, `setPressure(p)`, `setConfigSubscriber(cs)`
    - Getter methods with `[Harness]` error if accessed before bound (e.g., `get delegationManager()` throws `"Sidecar: DelegationManager not bound yet"`)
    - `isReady(): boolean` — returns true when `_delegationManager && _sessionTracker && _client` are all non-null
    - Export type `SidecarBoundDeps` reflecting the union of bound modules

    Create `src/sidecar/server/factory.ts` — createSidecarServer factory:
    - `SidecarServerDeps` interface: `{ projectDirectory: string; port: number }`
    - `SidecarServer` interface: `{ port: number; close: () => Promise<void> }`
    - `createSidecarServer(deps)` — creates Node `http.createServer` (NOT Express — zero dependency), binds to localhost:port, returns `SidecarServer`
    - Server stores reference to `SidecarDependencyRegistry` (singleton, module-level)
    - Register cleanup via `process.on('SIGTERM')` and `process.on('SIGINT')` to close server
    - Export singleton `getRegistry(): SidecarDependencyRegistry` accessor

    Per architecture: server is a minimal `http.createServer` — no Express/Fastify. It only needs to accept connections; request routing is added in SC-02.
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/sidecar/server/factory.test.ts tests/sidecar/server/registry.test.ts -x 2>/dev/null || echo "WARNING: Tests may not exist yet — Wave 0 must create them"</automated>
  </verify>
  <done>Server factory creates http server, registry accepts lazy bindings, typecheck passes</done>
</task>

<task type="auto">
  <name>Task 3: Create SseConnectionPool + Wire Server into Plugin Init</name>
  <files>
    src/sidecar/server/sse/pool.ts     (NEW)
    src/plugin.ts
    package.json
    sidecar/package.json
  </files>
  <action>
    Create `src/sidecar/server/sse/pool.ts` — SseConnectionPool class:
    - `addClient(id, controller)` — register SSE client (takes `ReadableStreamDefaultController` or compatible interface)
    - `removeClient(id)` — deregister
    - `broadcast(event)` — iterate clients, `controller.enqueue(encoder.encode(message))`, remove dead clients
    - `clientCount()` — returns number of active connections
    - Heartbeat interval (30s, configurable via constructor option)
    - Max concurrent connections (50, configurable)
    - Export `SidecarEvent` type for events

    In `src/plugin.ts`, locate the startup sequence (steps 1-17). INSERT the sidecar server start at step 5.5 (after tmux integration at step 5, before session tracker at step 6):
    ```
    // STEP 5.5: Start sidecar HTTP/WS server
    const sidecarServer = createSidecarServer({ port: 0, projectDirectory })
    const sidecarPort = await sidecarServer.start()
    writeFileSync(
      join(projectDirectory, ".hivemind", "state", "sidecar-port.json"),
      JSON.stringify({ port: sidecarPort })
    )
    ```
    Then at steps 6-15, add binding calls after each module construction:
    ```
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
    <automated>npm run typecheck && npm ls @json-render/core 2>/dev/null | grep -q "0.19" && npm ls ws 2>/dev/null | grep -q "^ws@"</automated>
  </verify>
  <done>Package bumps applied, ws installed, plugin.ts has sidecar start + binding calls, typecheck passes</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Plugin HTTP server ↔ host process | Localhost-only HTTP server accessible to any process on the machine |
| CANONICAL_PREFIXES extension | Adding `.opencode/` exposes agent/command definitions via state API |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SC01-01 | Tampering | sidecar-port.json write | mitigate | Write via `writeFileSync` inside plugin init — only the plugin process writes this file |
| T-SC01-02 | Info Disclosure | CANONICAL_PREFIXES extended to `.opencode/` | accept | `.opencode/` contains agent/command definitions, not secrets. Localhost-only access. |
| T-SC01-03 | Elevation of Privilege | Lazy dependency registry bindings | mitigate | Getter methods throw `[Harness]` error if accessed before binding — no silent undefined |
| T-SC01-SC | Tampering | npm package installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED] packages (ws, json-render bumps) |
</threat_model>

<verification>
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run test -- --filter=sidecar` passes (existing readonly-state tests + new server/registry tests)
- [ ] All CANONICAL_PREFIXES (4 entries) resolve correctly via `isCanonicalStatePath()`
- [ ] `createSidecarServer()` returns with an actual port > 0
- [ ] `SidecarDependencyRegistry.isReady()` returns false before bindings, true after
- [ ] SseConnectionPool handles add/remove/broadcast correctly
- [ ] `npm ls @json-render/core` shows 0.19.0
- [ ] `npm ls ws` shows ws is installed
</verification>

<success_criteria>
1. Plugin HTTP server starts during plugin init on a dynamic localhost port
2. Port is written to `.hivemind/state/sidecar-port.json`
3. `CANONICAL_PREFIXES` now has 4 entries (state, planning, session-tracker, opencode)
4. `listCanonicalDirectory()` returns file/directory listings for canonical paths
5. `SidecarDependencyRegistry` accepts lazy bindings and reports readiness
6. `SseConnectionPool` manages SSE clients with 30s heartbeat
7. All json-render packages at 0.19.0, `ws` installed as opt dep
8. Existing readonly-state tests pass with extended prefixes
</success_criteria>

<output>
Create `.planning/phases/SC-01-sidecar-foundation/SC-01-SUMMARY.md` when done
</output>
