---
phase: SC-01-sidecar-foundation
plan: 03
type: execute
wave: 3
depends_on:
  - SC-01-01
  - SC-01-02
files_modified:
  - src/sidecar/server/factory.ts
  - src/plugin.ts
  - package.json
  - tests/sidecar/server/factory.test.ts
autonomous: true
requirements:
  - REQ-05
  - REQ-07
must_haves:
  truths:
    - "createSidecarServer() returns { port: number; close: () => Promise<void> }"
    - "Server binds to 127.0.0.1:0 with actual port > 0 after start"
    - "close() shuts down the HTTP server cleanly"
    - "GET /health returns 200 with JSON { status: 'ok', uptime: <ms> }"
    - "Non-/health requests return 501 Not Implemented"
    - "Server start failure does NOT block plugin init (fire-and-forget with log warning)"
    - "Server port is written to .hivemind/state/sidecar-port.json"
    - "Sidecar registry gets binding calls at plugin init steps 6-15"
    - "@json-render/* bumped to ^0.19.0 in package.json optionalDependencies"
    - "ws added to package.json optionalDependencies"
  artifacts:
    - path: src/sidecar/server/factory.ts
      provides: "Sidecar HTTP server factory with /health endpoint"
      exports: ["createSidecarServer", "SidecarServerOptions", "SidecarServerHandle"]
      min_lines: 80
    - path: src/plugin.ts
      provides: "Sidecar startup wiring at step 5.5"
      diff: "+~25 lines (imports + step 5.5 block + binding calls)"
    - path: package.json
      provides: "Updated dependency versions"
      diff: "json-render@0.18→0.19, +ws in optionalDependencies"
    - path: tests/sidecar/server/factory.test.ts
      provides: "Server lifecycle and healthcheck tests"
      min_lines: 80
  key_links:
    - from: src/sidecar/server/factory.ts
      to: src/sidecar/server/registry.ts
      via: "SidecarDependencyRegistry import"
      pattern: "import.*registry"
    - from: src/sidecar/server/factory.ts
      to: src/sidecar/server/sse/pool.ts
      via: "SseConnectionPool import"
      pattern: "import.*sse/pool"
    - from: src/plugin.ts
      to: src/sidecar/server/factory.ts
      via: "createSidecarServer call at step 5.5"
      pattern: "createSidecarServer"
    - from: src/sidecar/server/factory.ts
      to: src/sidecar/types.ts
      via: "SidecarEvent import"
      pattern: "import.*types"
---

<objective>
Create the plugin HTTP server factory, wire it into the plugin startup sequence, and apply package dependency bumps.

Purpose: The `createSidecarServer()` factory builds the raw Node HTTP server that powers all sidecar communication. Wiring it at plugin init step 5.5 (after tmux, before session-tracker) ensures the random port is available before modules that need to register with the dependency registry start constructing. The `/health` endpoint (per D-SC01-05) allows SC-03's Next.js app to verify connectivity before rendering panels. Package bumps are required by json-render v0.19's updated API surface.

Output:
- `src/sidecar/server/factory.ts` — createSidecarServer() with health endpoint
- Modified `src/plugin.ts` — step 5.5 server start + binding calls at steps 6-15
- Modified `package.json` — @json-render/* ^0.19.0, ws optionalDep
- `tests/sidecar/server/factory.test.ts` — server lifecycle + healthcheck tests
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md
@.planning/phases/SC-01-sidecar-foundation/SC-01-CONTEXT.md
@.hivemind/planning/sidecar-vision/ARCHITECTURE.md
@src/sidecar/types.ts
@src/sidecar/server/registry.ts
@src/sidecar/server/sse/pool.ts
@src/plugin.ts
@src/sidecar/readonly-state-extensions.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create createSidecarServer() factory</name>
  <files>
    src/sidecar/server/factory.ts
    tests/sidecar/server/factory.test.ts
  </files>
  <behavior>
    - Test 1: createSidecarServer() returns an object with `port: number` and `close: () => Promise<void>`
    - Test 2: After start, `server.port > 0`
    - Test 3: `close()` resolves without error, server stops accepting
    - Test 4: `GET /health` returns 200 with JSON body containing `{ status: "ok", uptime: expect.any(Number) }`
    - Test 5: Non-/health requests return 501 with plain text "Not Implemented" per D-SC01-06
    - Test 6: Server binds to 127.0.0.1 (verify via address().address)
  </behavior>
  <action>
    Create `src/sidecar/server/factory.ts`:

    **Exports:**

    1. `SidecarServerOptions` interface:
    ```typescript
    import type { SidecarDependencyRegistry } from "./registry.js"
    import type { SseConnectionPool } from "./sse/pool.js"

    export interface SidecarServerOptions {
      registry: SidecarDependencyRegistry
      ssePool: SseConnectionPool
      projectDirectory: string
    }
    ```

    2. `SidecarServerHandle` interface:
    ```typescript
    export interface SidecarServerHandle {
      port: number
      close: () => Promise<void>
    }
    ```

    3. `createSidecarServer(options: SidecarServerOptions): Promise<SidecarServerHandle>` — **async factory per D-SC01-01**:

    ```typescript
    import http from "node:http"
    import { writeFileSync, mkdirSync, existsSync } from "node:fs"
    import { join } from "node:path"
    ```

    Implementation:
    ```typescript
    export async function createSidecarServer(
      options: SidecarServerOptions,
    ): Promise<SidecarServerHandle> {
      const startTime = Date.now()
      const { registry, ssePool, projectDirectory } = options

      const server = http.createServer((req, res) => {
        // Per D-SC01-05: healthcheck endpoint
        if (req.url === "/health" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ status: "ok", uptime: Date.now() - startTime }))
          return
        }
        // Per D-SC01-06: all other routing deferred to SC-02
        res.writeHead(501, { "Content-Type": "text/plain" })
        res.end("Not Implemented")
      })

      // Per D-SC01-02: bind to 127.0.0.1:0 (random port)
      return new Promise<SidecarServerHandle>((resolve, reject) => {
        server.listen(0, "127.0.0.1", () => {
          const address = server.address()
          if (!address || typeof address === "string") {
            reject(new Error("[Harness] Sidecar: failed to get server address"))
            return
          }
          const port = address.port

          // Write port file for Next.js discovery
          try {
            const stateDir = join(projectDirectory, ".hivemind", "state")
            if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
            writeFileSync(
              join(stateDir, "sidecar-port.json"),
              JSON.stringify({ port }),
              "utf8",
            )
          } catch {
            // Per D-SC01-04: port file write failure is non-fatal
            void registry.client?.app?.log?.({
              body: { service: "sidecar", level: "warn",
                message: "[Harness] Sidecar: failed to write port file" },
            })
          }

          // Start SSE heartbeat
          ssePool.startHeartbeat()

          resolve({ port, close: () => new Promise<void>((res) => server.close(() => res())) })
        })

        // Per D-SC01-02: error before listening
        server.on("error", (err: Error) => {
          reject(err)
        })
      })
    }
    ```

    **SIGTERM/SIGINT handlers per SPEC constraint:**
    Inside `createSidecarServer`, register cleanup listeners that call `close()` and `ssePool.stop()`:
    ```typescript
    const cleanup = () => {
      ssePool.stop()
      server.close()
    }
    process.on("SIGTERM", cleanup)
    process.on("SIGINT", cleanup)
    ```

    Create `tests/sidecar/server/factory.test.ts`:
    - Uses vitest
    - Creates `beforeEach`: fresh `SidecarDependencyRegistry`, mock objects
    - Tests 6 behaviors from the `<behavior>` block
    - Per D-SC01-14: uses `port: 0` (random port for the options, but the factory always uses port 0 internally)
    - `afterEach`: calls `server.close()` to clean up
    - Healthcheck test: start server, `fetch("http://127.0.0.1:${port}/health")` via Node's built-in `http.get` or `fetch` (Node 20+), assert 200 + JSON body
    - 501 test: start server, fetch `/nonexistent`, assert 501 + text body
    - Close test: close server, verify connection refused afterward
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/server/factory.test.ts -x</automated>
  </verify>
  <done>
    - `src/sidecar/server/factory.ts` exists with createSidecarServer, SidecarServerOptions, SidecarServerHandle
    - Server starts on 127.0.0.1 with port > 0
    - GET /health returns 200 JSON
    - Non-/health returns 501
    - close() stops cleanly
    - SIGTERM/SIGINT cleanup handlers registered
    - Port file written to .hivemind/state/sidecar-port.json
    - `tests/sidecar/server/factory.test.ts` passes with 6+ tests
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire sidecar server into plugin.ts startup sequence</name>
  <files>
    src/plugin.ts
  </files>
  <action>
    Per D-SC01-12 (verify plugin.ts steps before inserting): the existing startup sequence at `HarnessControlPlane` async function (line 391) already has:
    - Step ~1: Startup diagnostic (line 394)
    - Step ~2: Load runtime policy (line 403-404)
    - Step ~3: Load Hivemind config (line 407)
    - Step ~4: Create PTY manager (line 408)
    - Step ~5: Create tmux integration (line 418)
    - Step ~6: Create SessionTracker (line 431)
    - Step ~7: Wire delegation modules (line 437)
    - ... etc

    **Insert step 5.5 AFTER line 418** (after `createTmuxIntegrationIfSupported`, before SessionTracker at line 431):

    Add imports at top of file (after existing imports around line 90):
    ```typescript
    import { createSidecarServer } from "./sidecar/server/factory.js"
    import { SidecarDependencyRegistry } from "./sidecar/server/registry.js"
    import { SseConnectionPool } from "./sidecar/server/sse/pool.js"
    ```

    Add step 5.5 block after line 418 (the `const tmuxIntegration = await createTmuxIntegrationIfSupported(projectDirectory)` line):
    ```typescript
    // ── Step 5.5: Sidecar HTTP server ────────────────────────────────
    // Per D-SC01-03: server start failure must NOT block plugin init.
    const sidecarRegistry = new SidecarDependencyRegistry()
    const ssePool = new SseConnectionPool({})
    let sidecarPort = 0
    try {
      const sidecar = await createSidecarServer({
        registry: sidecarRegistry,
        ssePool,
        projectDirectory,
      })
      sidecarPort = sidecar.port
    } catch (err) {
      void client?.app?.log?.({
        body: {
          service: "sidecar",
          level: "warn",
          message: "[Harness] Sidecar: server start failed — continuing without sidecar",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
    ```

    **Binding calls at existing construction sites:**
    - After `new SessionTracker(...)` (around line 431): `sidecarRegistry.setSessionTracker(sessionTracker)`
    - After `delegationModules` construction (around line 446): `sidecarRegistry.setDelegationManager(delegationModules.delegationManager)`
    
    Since `client` is available from the plugin function parameter, the binding for client should happen before or at the same level. However, looking at the actual code, `client` is available at line 391 (`async ({ client, directory })`). So:
    
    After the step 5.5 block, add: `sidecarRegistry.setClient(client)`
    
    The non-core bindings (trajectory, pressure, config) are deferred — they'll be bound in SC-02 when those modules are wired. For SC-01 the registry is created and the 3 core deps (client, sessionTracker, delegationManager) are bound.

    **Important:** All sidecar binding calls must be placed after the corresponding construction. Verify:
    - `client` is already available at function entry — bind immediately after step 5.5
    - `sessionTracker` is constructed at ~line 431 — bind right after
    - `delegationManager` is available at ~line 447 — bind right after

    **Do NOT move or change existing code** — only add the sidecar block and bindings.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>
    - `src/plugin.ts` has sidecar server start at step 5.5 (after tmux, before SessionTracker)
    - SidecarRegistry created and 3 core deps bound
    - Server start failure is caught and logged as warning
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto">
  <name>Task 3: Bump @json-render/* to ^0.19.0 and add ws to optionalDependencies</name>
  <files>
    package.json
  </files>
  <action>
    In `package.json`, update the `optionalDependencies` section:

    1. Change all 5 `@json-render/*` entries from `^0.18.0` to `^0.19.0`:
       - `@json-render/core`: `"^0.18.0"` → `"^0.19.0"`
       - `@json-render/ink`: `"^0.18.0"` → `"^0.19.0"`
       - `@json-render/next`: `"^0.18.0"` → `"^0.19.0"`
       - `@json-render/react`: `"^0.18.0"` → `"^0.19.0"`
       - `@json-render/react-pdf`: `"^0.18.0"` → `"^0.19.0"`

    2. Add `ws` to `optionalDependencies` (per SPEC constraint — WS must NOT be a hard dependency):
       ```json
       "ws": "^8.18.0"
       ```
       Insert it alphabetically, after `"react"` (last entry currently at line 78), adding a trailing comma to the preceding line if needed.

    **Do NOT change any other fields** — only the version bumps and the ws addition.
  </action>
  <verify>
    <automated>
      node -e "const p = require('./package.json'); const od = p.optionalDependencies || {}; const jsonRenderOk = ['@json-render/core','@json-render/ink','@json-render/next','@json-render/react','@json-render/react-pdf'].every(k => od[k] === '^0.19.0'); const wsOk = od.ws === '^8.18.0'; console.log(jsonRenderOk && wsOk ? 'PASS' : 'FAIL: ' + JSON.stringify({jsonRenderOk, wsOk})); process.exit(jsonRenderOk && wsOk ? 0 : 1)"
    </automated>
  </verify>
  <done>
    - All 5 @json-render/* packages at `^0.19.0` in optionalDependencies
    - `ws` at `^8.18.0` in optionalDependencies
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| HTTP server (127.0.0.1:random) → Plugin process | localhost-only — no external network access; only processes on same machine can connect |
| GET /health → Response | No input parsing — fixed path match, returns status+uptime only. No injection surface |
| Port file write → .hivemind/state/sidecar-port.json | File contains only `{ port: <number> }` — no secrets |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SC01-07 | Denial of Service | HTTP server — port exhaustion | accept | Random port allocated by OS; one port per plugin instance; plugin lifecycle is 1:1 with OpenCode session |
| T-SC01-08 | Elevation of Privilege | Port file — another process reads .hivemind/state/ | accept | Port file is inside existing canonical surface (already readable per SIDECAR-03); port is not a secret |
| T-SC01-09 | Spoofing | Another localhost process connects to sidecar | accept | No auth needed — localhost binding is the security boundary per ARCHITECTURE.md §8.2; sidecar data is agent session state, not user credentials |
| T-SC01-10 | Tampering | package.json — ws addition | mitigate | `ws` added to `optionalDependencies` (not `dependencies`); plugin works without WS available; WS server will have its own graceful fallback in SC-02 |
| T-SC01-SC | Tampering | npm/pip/cargo installs | mitigate | `ws` is `[ASSUMED]` — well-known established package; `@json-render/*` minor bump is `[ASSUMED]` — established within project. No `[SUS]` or `[SLOP]` packages. |
</threat_model>

<verification>
- [ ] `npm run typecheck` passes with no errors
- [ ] `npx vitest run tests/sidecar/server/factory.test.ts -x` passes
- [ ] `npx vitest run tests/sidecar/server/registry.test.ts -x` passes (regression)
- [ ] `npx vitest run tests/sidecar/server/sse/pool.test.ts -x` passes (regression)
- [ ] `node -e "..."` verifies json-render@0.19 and ws in package.json
- [ ] Server starts, serves /health, returns 501 for unknown paths
</verification>

<success_criteria>
- All 3 plans' test files pass (factory, registry, pool, readonly-state, types)
- `createSidecarServer()` returns working HTTP server with health endpoint
- Plugin startup step 5.5 starts server with fire-and-forget error handling
- Registry has 3 core deps bound during plugin init
- Package version bumps applied correctly
- TypeScript compiles cleanly across entire project
</success_criteria>

<output>
Create `.planning/phases/SC-01-sidecar-foundation/SC-01-03-SUMMARY.md` when done
</output>
