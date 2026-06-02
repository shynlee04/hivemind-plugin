---
phase: SC-01-sidecar-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - SC-01-01
files_modified:
  - src/sidecar/server/registry.ts
  - src/sidecar/server/sse/pool.ts
  - tests/sidecar/server/registry.test.ts
  - tests/sidecar/server/sse/pool.test.ts
autonomous: true
requirements:
  - REQ-04
  - REQ-06
must_haves:
  truths:
    - "SidecarDependencyRegistry has 6 setter methods (setDelegationManager, setSessionTracker, setClient, setTrajectory, setPressure, setConfigSubscriber)"
    - "isReady() returns false before core bindings (delegationManager + sessionTracker + client)"
    - "isReady() returns true after core bindings"
    - "Accessing an unbound getter throws [Harness] error"
    - "SseConnectionPool.addClient() accepts and stores a connection"
    - "SseConnectionPool.removeClient() removes and disposes a connection"
    - "SseConnectionPool.broadcast(event) sends event to all connected clients"
    - "SseConnectionPool enforces max 50 concurrent connections"
    - "SseConnectionPool sends heartbeat at configured interval (default 30s)"
  artifacts:
    - path: src/sidecar/server/registry.ts
      provides: "Lazy dependency binding container"
      exports: ["SidecarDependencyRegistry"]
      min_lines: 80
    - path: src/sidecar/server/sse/pool.ts
      provides: "SSE connection pool with heartbeat"
      exports: ["SseConnectionPool", "SseConnectionPoolOptions"]
      min_lines: 80
    - path: tests/sidecar/server/registry.test.ts
      provides: "Registry lifecycle tests"
      min_lines: 50
    - path: tests/sidecar/server/sse/pool.test.ts
      provides: "SSE pool behavior tests"
      min_lines: 80
  key_links:
    - from: src/sidecar/server/registry.ts
      to: src/coordination/delegation/manager.ts
      via: import type { DelegationManager }
      pattern: "import type.*DelegationManager"
    - from: src/sidecar/server/registry.ts
      to: src/features/session-tracker/index.js
      via: import type { SessionTracker }
      pattern: "import type.*SessionTracker"
    - from: src/sidecar/server/registry.ts
      to: src/shared/session-api.js
      via: import type { OpenCodeClient }
      pattern: "import type.*OpenCodeClient"
---

<objective>
Create the lazy dependency binding container (`SidecarDependencyRegistry`) and the SSE connection pool (`SseConnectionPool`).

Purpose: The dependency registry enables the sidecar server (created in Plan 03) to start at plugin init step 5.5 before most plugin modules exist — modules register themselves when constructed at steps 6-15. The SSE pool provides the real-time event push mechanism needed by SC-03 (Next.js app) to receive live session/delegation updates.

Output:
- `src/sidecar/server/registry.ts` — SidecarDependencyRegistry class
- `src/sidecar/server/sse/pool.ts` — SseConnectionPool class
- `tests/sidecar/server/registry.test.ts` — full lifecycle tests
- `tests/sidecar/server/sse/pool.test.ts` — full behavior tests
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
@src/coordination/delegation/manager.ts
@src/features/session-tracker/index.ts
@src/shared/session-api.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create SidecarDependencyRegistry</name>
  <files>
    src/sidecar/server/registry.ts
    tests/sidecar/server/registry.test.ts
  </files>
  <behavior>
    - Test 1: New registry has `isReady()` returning `false` (no bindings)
    - Test 2: After `setDelegationManager(mock) + setSessionTracker(mock) + setClient(mock)`, `isReady()` returns `true`
    - Test 3: Accessing `registry.delegationManager` before binding throws `[Harness]` error
    - Test 4: After setting, getters return the bound value
    - Test 5: All 6 setters exist and return `void`
    - Test 6: isReady() returns `false` with only 2 of 3 core deps bound
  </behavior>
  <action>
    Create `src/sidecar/server/registry.ts`:

    Per D-SC01-09: use `import type` for all module references — no circular deps, server starts before modules exist.

    ```typescript
    import type { DelegationManager } from "../../coordination/delegation/manager.js"
    import type { SessionTracker } from "../../features/session-tracker/index.js"
    import type { OpenCodeClient } from "../../shared/session-api.js"
    import type { TrajectoryLedger } from "../../task-management/trajectory/ledger.js"
    import type { PressureModel } from "../../features/runtime-pressure/model.js"
    import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
    ```

    **SidecarDependencyRegistry class:**
    - Private fields for all 6 deps: `_delegationManager?`, `_sessionTracker?`, `_client?`, `_trajectory?`, `_pressure?`, `_configSubscriber?` — all typed with `| undefined`
    - 6 setter methods, each accepting the typed parameter and assigning to privates, returning `void`:
      - `setDelegationManager(m: DelegationManager): void`
      - `setSessionTracker(t: SessionTracker): void`
      - `setClient(c: OpenCodeClient): void`
      - `setTrajectory(t: TrajectoryLedger): void`
      - `setPressure(p: PressureModel): void`
      - `setConfigSubscriber(c: Partial<HivemindConfigs> | (() => Partial<HivemindConfigs>)): void`
    - 6 getter methods, each throwing `new Error("[Harness] Sidecar: {DepName} not bound yet")` if accessed before binding:
      - `get delegationManager(): DelegationManager`
      - `get sessionTracker(): SessionTracker`
      - `get client(): OpenCodeClient`
      - `get trajectory(): TrajectoryLedger`
      - `get pressure(): PressureModel`
      - `get configSubscriber(): Partial<HivemindConfigs> | (() => Partial<HivemindConfigs>)`
    - `isReady(): boolean` — returns `true` when all 3 core deps are bound: `!!this._delegationManager && !!this._sessionTracker && !!this._client`

    Per D-SC01-10: setters accept specific imported types for compile-time safety.

    Create `tests/sidecar/server/registry.test.ts`:
    - Uses vitest (`describe`, `it`, `expect`, `beforeEach`)
    - Creates a fresh `SidecarDependencyRegistry` in `beforeEach`
    - Uses simple mock objects that satisfy the type shape (e.g., `{} as DelegationManager`)
    - Tests all 6 behaviors from the `<behavior>` block above
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/server/registry.test.ts -x</automated>
  </verify>
  <done>
    - `src/sidecar/server/registry.ts` exists with SidecarDependencyRegistry class
    - All 6 setters and getters exist
    - Unbound getters throw `[Harness]` error
    - `isReady()` follows the 3-core-dep rule
    - `tests/sidecar/server/registry.test.ts` passes with 6+ tests
    - `npm run typecheck` passes
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Create SseConnectionPool</name>
  <files>
    src/sidecar/server/sse/pool.ts
    tests/sidecar/server/sse/pool.test.ts
  </files>
  <behavior>
    - Test 1: `addClient()` adds a connection and increments `clientCount`
    - Test 2: `removeClient()` removes a connection and decrements `clientCount`
    - Test 3: `broadcast(event)` sends data to all connected clients via `controller.enqueue()`
    - Test 4: Adding 51 clients throws or rejects (max 50 enforcement)
    - Test 5: Dead clients (controller.enqueue throws) are auto-removed on broadcast
    - Test 6: Heartbeat interval fires `event: heartbeat` messages per D-SC01-07
    - Test 7: Stop method clears the heartbeat interval
  </behavior>
  <action>
    Create `src/sidecar/server/sse/pool.ts`:

    ```typescript
    import type { SidecarEvent } from "../types.js"
    ```

    Export `SseConnectionPoolOptions` interface:
    ```typescript
    export interface SseConnectionPoolOptions {
      heartbeatIntervalMs?: number   // default: 30000
      maxClients?: number            // default: 50
    }
    ```

    Export `SseConnection` interface (the client-facing handle):
    ```typescript
    export interface SseConnection {
      id: string
      controller: ReadableStreamDefaultController
    }
    ```

    **SseConnectionPool class:**
    - Private fields: `connections: Map<string, SseConnection>`, `heartbeatTimer?: ReturnType<typeof setInterval>`, `opts: SseConnectionPoolOptions`
    - Constructor accepts `SseConnectionPoolOptions` with defaults:
      - `heartbeatIntervalMs = 30000` per D-SC01-07
      - `maxClients = 50` per D-SC01-08
    - `addClient(controller: ReadableStreamDefaultController): string`:
      - If `connections.size >= maxClients`, throw `new Error("[Harness] Sidecar: max SSE connections reached")`
      - Generate ID: `"sse-" + Math.random().toString(36).slice(2, 9)`
      - Store connection in Map
      - Return ID
    - `removeClient(id: string): void`:
      - Delete from Map
    - `get clientCount(): number` — returns `connections.size`
    - `broadcast(event: SidecarEvent): void`:
      - Format as SSE per D-SC01-07: ``event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n``
      - Iterate connections; for each, try `controller.enqueue(encoder.encode(sseMessage))`; if it throws, call `removeClient(id)` (dead connection cleanup, per D-SC01-07)
    - `startHeartbeat(): void`:
      - Clear any existing timer
      - Set interval: send `event: heartbeat\ndata: {}\n\n` to all connections via `broadcast()` with a `SidecarEvent` of type "heartbeat"
    - `stop(): void`:
      - Clear heartbeat timer
      - Remove all connections (call `controller.close()` on each, then clear Map)

    Use `TextEncoder` for encoding messages: `new TextEncoder().encode(sseMessage)`.

    Create `tests/sidecar/server/sse/pool.test.ts`:
    - Uses vitest, `vi.useFakeTimers()` for heartbeat timing tests
    - Creates mock `ReadableStreamDefaultController` objects with `enqueue`, `close`, `error` as `vi.fn()`
    - Tests 7 behaviors from the `<behavior>` block
    - For max 50 enforcement: add 50 clients, verify 51st throws
    - For dead client cleanup: make one mock controller.enqueue throw, broadcast, verify clientCount decreased
    - For heartbeat: verify `startHeartbeat()` starts interval, `stop()` clears it
    - All tests use `afterEach(() => { vi.useRealTimers() })` when fake timers are used
  </action>
  <verify>
    <automated>npx vitest run tests/sidecar/server/sse/pool.test.ts -x</automated>
  </verify>
  <done>
    - `src/sidecar/server/sse/pool.ts` exists with SseConnectionPool + SseConnectionPoolOptions
    - add/remove/broadcast work correctly
    - Max 50 enforced with [Harness] error
    - Dead clients cleaned up on broadcast
    - 30s heartbeat via startHeartbeat/stop
    - `tests/sidecar/server/sse/pool.test.ts` passes with 7+ tests
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| registry.ts → plugin modules | No trust boundary — all imports are `import type`, no runtime access to modules until setter is called |
| sse/pool.ts → HTTP response stream | SSE connections are localhost-only; controller.enqueue is the only mutation path |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SC01-03 | Denial of Service | SseConnectionPool — max clients | mitigate | Hard limit of 50 connections; `addClient()` throws `[Harness]` error when exceeded; prevents resource exhaustion |
| T-SC01-04 | Denial of Service | SseConnectionPool — dead connection leak | mitigate | `broadcast()` call wraps `controller.enqueue()` in try-catch; dead connections are auto-removed via `removeClient(id)` |
| T-SC01-05 | Elevation of Privilege | registry — unbound getter | mitigate | Unbound getters throw `[Harness]` errors; prevents silent null-pointer usage |
| T-SC01-06 | Information Disclosure | registry — bound module exposure | accept | All 6 bound modules already accessible within the plugin process; no new disclosure surface |
| T-SC01-SC | Tampering | npm/pip/cargo installs | mitigate | No new npm packages in this plan; slopcheck N/A |
</threat_model>

<verification>
- [ ] `npm run typecheck` passes with no errors
- [ ] `npx vitest run tests/sidecar/server/registry.test.ts -x` passes
- [ ] `npx vitest run tests/sidecar/server/sse/pool.test.ts -x` passes
- [ ] Registry: isReady() false → true after 3 core bindings, [Harness] on unbound get
- [ ] Pool: add/remove/broadcast, max 50, heartbeat, dead client cleanup
</verification>

<success_criteria>
- `src/sidecar/server/registry.ts` exports SidecarDependencyRegistry with 6 setter/getter pairs
- `src/sidecar/server/sse/pool.ts` exports SseConnectionPool with full connection lifecycle
- 2 new test files exist and pass (13+ tests total)
- TypeScript compiles cleanly
</success_criteria>

<output>
Create `.planning/phases/SC-01-sidecar-foundation/SC-01-02-SUMMARY.md` when done
</output>
