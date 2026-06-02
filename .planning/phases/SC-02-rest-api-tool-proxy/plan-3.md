# plan-3.md — Wave 3: Real-Time (SSE + WS)

**Phase:** SC-02 — REST API + Tool Proxy
**Wave:** 3 of 5
**Type:** Implementation (real-time channels)
**Depends on:** W1 (SidecarRouter, types, cache) + W2 (catalog, state, sessions, tools, handlers)
**Blocks:** W4

---

## Objective

Implement the **SSE event bus** (`/api/events?filter=...`) and the **WebSocket delegation channel** (`/ws/delegation`) with proper filter parsing, heartbeat, backpressure, and connection pool management. After W3, **all 17 endpoints** work end-to-end (the handler test matrix should fully pass, ~17 endpoints + WS upgrade).

---

## Allowed Surfaces (W3 only)

- ✅ CREATE: `src/sidecar/server/routes/events.ts` (≤500 LOC) — SSE route with filter parsing
- ✅ CREATE: `src/sidecar/server/ws/delegation.ts` (≤500 LOC) — `WsDelegationHandler`
- ✅ CREATE: `src/sidecar/server/ws/pool.ts` (≤300 LOC) — `WsConnectionPool` (mirrors SseConnectionPool)
- ✅ CREATE: `src/sidecar/server/ws/types.d.ts` (≤100 LOC) — Ambient declarations (ONLY if `@types/ws` install fails slopcheck; otherwise delete this file and use installed types)

---

## Forbidden Surfaces (W3)

- ❌ NO modification to `src/sidecar/server/handler.ts`, `cache.ts`, `routes/{state,sessions,tools,catalog,types}.ts`, `tool-proxy/**`, `factory.ts` (W1/W2 outputs frozen for W3)
- ❌ NO modification to `src/sidecar/server/sse/pool.ts` (SC-01 inherited; W3 USES it via `SseConnectionPool.broadcast`)
- ❌ NO modification to `src/sidecar/types.ts` (11 event types sufficient; do NOT add `ws.dialed`/`ws.closed` unless observability requires)
- ❌ NO modification to `src/sidecar/server/registry.ts` (6 setters sufficient)
- ❌ NO new npm dependencies (`@types/ws` install is the only candidate, gated by slopcheck)
- ❌ NO server-side reconnection logic
- ❌ NO auth, rate limit, session middleware

---

## Tasks (3 tasks)

### Task 1: @types/ws decision (slopcheck + install OR ambient .d.ts)

**Files:** `package.json` (modify) OR `src/sidecar/server/ws/types.d.ts` (create)

**Action:**

1. **Slopcheck audit** of `@types/ws` package:
   - Visit `npmjs.com/package/@types/ws` and verify:
     - Package is published by `@types` org (DefinitelyTyped)
     - Weekly downloads >5M (high-traffic)
     - Last published within 12 months (active maintenance)
     - No security advisories on `npm audit`
     - Repository: `DefinitelyTyped/DefinitelyTyped` (canonical DT source)
   - If PASS → proceed to step 2a (install)
   - If FAIL → proceed to step 2b (ambient .d.ts)

2a. **Install path** (if slopcheck PASS):
   ```bash
   npm install --save-dev @types/ws
   ```
   - Verify: `ls node_modules/@types/ws/index.d.ts` exists
   - Verify: `npm run typecheck` passes (no new errors)
   - Verify: `git diff package.json package-lock.json` shows only `@types/ws` addition (no other deps)

2b. **Ambient .d.ts path** (if slopcheck FAIL):
   - Create `src/sidecar/server/ws/types.d.ts` with minimal types:
     - `WebSocket` class (constructor, send, close, on, readyState, OPEN/CLOSED constants)
     - `WebSocketServer` class (constructor, handleUpgrade, close)
     - `RawData` type
     - Header values: `Connection: "Upgrade"`, `Upgrade: "websocket"`, `Sec-WebSocket-Version`, `Sec-WebSocket-Key`
   - Mark file: `/// <reference types="node" />` (Node has `http.IncomingMessage` already)
   - Verify: `npm run typecheck` passes (W3 task 2/3 imports work)

3. Record decision in commit message: `(@types/ws installed: <version>)` OR `(@types/ws install FAILED slopcheck; using ambient src/sidecar/server/ws/types.d.ts)`

**Verify:** `npm run typecheck` passes. `ws` 8.21.0 types are now resolvable from W3 task 2/3 imports.

**Done:** TypeScript can resolve `WebSocket`, `WebSocketServer` from either `@types/ws` or ambient `.d.ts`; no `any` in W3 imports.

---

### Task 2: WsConnectionPool + WsDelegationHandler

**Files:** `src/sidecar/server/ws/pool.ts`, `src/sidecar/server/ws/delegation.ts`

**Action:**

1. Create `src/sidecar/server/ws/pool.ts`:
   - `export interface WsConnection { id: string; socket: WebSocket; subscribedDelegations: Set<string>; }`
   - `export interface WsConnectionPoolOptions { heartbeatIntervalMs?: number; maxClients?: number; bufferLimitBytes?: number; }`
   - `export class WsConnectionPool`
     - `private readonly #connections = new Map<string, WsConnection>()`
     - `private readonly #opts: Required<WsConnectionPoolOptions>` (defaults: 30000ms, 50, 65536 bytes)
     - `addClient(socket: WebSocket): string` — throws `[Harness] max WS connections reached (50)` if at cap
     - `removeClient(id: string): void`
     - `get clientCount(): number`
     - `subscribe(id: string, delegationId: string): void` — add to subscribedDelegations set
     - `unsubscribe(id: string, delegationId: string): void`
     - `send(id: string, message: WsServerMessage): boolean` — try `socket.send(JSON.stringify(message))`; if buffer > 64KB OR send fails → close with code 1013 (D-SC02-03)
     - `broadcast(event: SidecarEvent): void` — forward to all connections (currently only delegation.* events, per AC-S02-06 scope guard)
     - `startHeartbeat(): void` — every 30s, send `{type: "delegation.status", delegationId: "*", status: "running", timestamp: Date.now()}` to all connections (D-SC02-10)
     - `stop(): void` — close all sockets, clear heartbeat
     - `private #isAlive(id: string): boolean` — tracks per-connection liveness
   - JSDoc + `@example`

2. Create `src/sidecar/server/ws/delegation.ts`:
   - `export interface WsDelegationHandlerDeps { registry: SidecarDependencyRegistry; pool: WsConnectionPool; }`
   - `export class WsDelegationHandler`
     - `constructor(deps: WsDelegationHandlerDeps)`
     - `async handleUpgrade(req: IncomingMessage, socket: net.Socket, head: Buffer): Promise<void>` — performs WS handshake, then `socket = new WebSocket(stream)` (or uses `WebSocketServer.handleUpgrade` from `ws` 8.21.0)
     - `private onConnection(ws: WebSocket): void` — registers in pool, sets up message handler
     - `private onMessage(wsId: string, data: RawData): void`:
       - Parse JSON; if invalid → close 1003 (UB-S02-06)
       - Validate `type` field; if unknown → close 1008 (UB-S02-05)
       - Handle `subscribe {delegationId}` → pool.subscribe(wsId, delegationId)
       - Handle `unsubscribe {delegationId}` → pool.unsubscribe(wsId, delegationId)
       - Handle `abort {delegationId}` → `registry.delegationManager.abort(delegationId)` → send `{type: "delegation.status", delegationId, status: "aborted"}` to that subscriber
     - `private onDelegationEvent(event: SidecarEvent): void` — filter to `delegation.*` events (AC-S02-06); for each subscribed connection, send as `WsServerMessage`:
       - `delegation.dispatched` → `{type: "delegation.status", delegationId, status: "running"}`
       - `delegation.completed` → `{type: "delegation.status", delegationId, status: "completed"}`
       - `delegation.failed` → `{type: "delegation.status", delegationId, status: "failed"}`
       - `delegation.timeout` → `{type: "delegation.status", delegationId, status: "timeout"}`
     - `private onSocketClose(wsId: string): void` — pool.removeClient + cleanup
   - JSDoc + `@example` + `@throws` for 1008/1003/1013 close codes

3. Wire `WsDelegationHandler` to `DelegationManager` events:
   - On construction, call `registry.delegationManager.coordinator.<eventEmitter>.on("delegation.*", (event) => this.onDelegationEvent(event))` (or equivalent API)
   - If `DelegationManager` doesn't expose event emitter, poll `coordinator.list()` at 1s interval (degraded but functional)

**Verify:** `npx vitest run tests/sidecar/server/ws/delegation.test.ts` — 8+ tests pass (subscribe/unsubscribe/abort, unknown type 1008, malformed JSON 1003, backpressure 1013, dead conn cleanup 5s, scope guard for non-delegation events, heartbeat 30s, 50-cap). `npm run typecheck` passes.

**Done:** WS pool + delegation handler work; WS upgrade succeeds; 1008/1003/1013 close codes enforced; delegation events forwarded to subscribers; scope guard prevents non-delegation events.

---

### Task 3: SSE route + WS upgrade integration in handler

**Files:** `src/sidecar/server/routes/events.ts`, `src/sidecar/server/handler.ts` (modify — add WS upgrade routing ONLY, ≤50 LOC addition)

**Action:**

1. Create `src/sidecar/server/routes/events.ts`:
   - `const FILTER_CATEGORIES: Record<SseFilterCategory, ReadonlySet<SidecarEventType>>` mapping (D-SC02-08):
     - `session` → 5 types (session.created, .updated, .idle, .deleted, .error)
     - `delegation` → 4 types (delegation.dispatched, .completed, .failed, .timeout)
     - `trajectory` → 0 (reserved)
     - `pressure` → 0 (reserved)
     - `invalidate` → 1 type (invalidate.cache)
     - `heartbeat` → 1 type (heartbeat)
   - `function parseFilter(query: string | undefined): Set<SidecarEventType> | {error: {code: "INVALID_FILTER", message: string}}`:
     - Missing/empty → return all 11 types
     - Comma-separated, trimmed, deduped
     - Unknown category → return error
   - `export async function handleSseEvents(req, res, match, registry): Promise<void>`:
     - Parse `?filter=...` from req.url
     - If parse error → 400 `{error: {code: "BAD_FILTER", message: "..."}}`
     - If registry not ready (`!registry.isReady()`) → 503 `{error: {code: "SERVICE_UNAVAILABLE"}}` with `Connection: close`
     - Create `ReadableStream` with `start(controller)` that:
       - Try `pool.addClient(controller)` → if cap reached, controller.error(503) + return
       - On `req.on("close")`, call `pool.removeClient(id)` within 5s (UB-S02-07)
     - Return `res.writeHead(200, headers).stream(readableStream)` with headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`
   - Filter the `SseConnectionPool.broadcast()` per-connection: when a client subscribes with a filter, wrap the connection's enqueue to check `event.type ∈ client.filterSet`; if not in set, skip
   - JSDoc + `@example`

2. Modify `src/sidecar/server/handler.ts` (ADD ONLY, do not refactor):
   - In the constructor, also accept `wsHandler?: WsDelegationHandler` and `ssePool: SseConnectionPool` (already passed via factory options)
   - Add method `handleUpgrade(req, socket, head): Promise<void>`:
     - If `req.url === "/ws/delegation"` AND `req.headers.upgrade === "websocket"` → call `wsHandler.handleUpgrade(req, socket, head)`
     - Else → `socket.destroy()` (no HTTP response on upgrade failure)
   - In `createSidecarServer` factory (W1 territory, but minor addition), pass `WsDelegationHandler` + `WsConnectionPool` to factory options

3. Wire `WsConnectionPool` to `DelegationManager` events in factory (or in plugin.ts step 5.5 — but W3 says do NOT touch plugin.ts; wire in factory only):
   - After `WsDelegationHandler` constructed in factory, subscribe to delegation events
   - On `server.on("upgrade", (req, socket, head) => router.handleUpgrade(req, socket, head))` — register this listener in factory

4. Update mock registry (`tests/sidecar/__mocks__/registry.ts`) to include `delegationManager.coordinator` with event emitter support (for WS scope test)

**Verify:** `npx vitest run tests/sidecar/server/routes/events.test.ts` — 6+ tests pass (50-cap, 6 filter categories, default to all, BAD_FILTER for unknown, heartbeat 30s, dead conn cleanup 5s). `npx vitest run tests/sidecar/server/ws/delegation.test.ts` — 8+ tests pass. **Combined: 14+ new tests pass.** `npx vitest run tests/sidecar/server/handler.test.ts` — all 17 endpoints pass (state + sessions + tools + catalog from W2 + events from W3 + WS upgrade).

**Done:** All 17 endpoints work. Events with filter, WS with 1008/1003/1013 close codes, 50-conn caps (SSE+WS), backpressure, heartbeat all verified.

---

## Verification (per-wave merge gate for W3)

```bash
# Primary: events + WS tests pass
npx vitest run tests/sidecar/server/routes/events.test.ts tests/sidecar/server/ws/delegation.test.ts
# Expected: 14+ tests pass

# Secondary: full handler matrix (17 endpoints)
npx vitest run tests/sidecar/server/handler.test.ts
# Expected: 17+ tests pass (all 17 endpoints return correct status codes)

# Tertiary: typecheck
npm run typecheck
# Expected: 0 errors; no `any` in W3 files

# Quaternary: 51st SSE client returns 503
npx vitest run tests/sidecar/server/routes/events.test.ts -t "50-cap"
# Expected: 1+ tests pass

# Quinary: WS scope guard
npx vitest run tests/sidecar/server/ws/delegation.test.ts -t "scope"
# Expected: 1+ tests pass (synthetic session.* event NOT received by WS)
```

---

## Atomic Commit (W3)

**Commit message:**
```
phase(SC-02): W3 — SSE event bus with filter + WS delegation channel with 1013 backpressure

- src/sidecar/server/routes/events.ts (NEW, ≤500 LOC): /api/events SSE route with 6 filter categories, BAD_FILTER validation, 50-cap via SseConnectionPool, per-client filter wrapping
- src/sidecar/server/ws/delegation.ts (NEW, ≤500 LOC): WsDelegationHandler with subscribe/unsubscribe/abort, JSON schema validation, 1008/1003 close codes
- src/sidecar/server/ws/pool.ts (NEW, ≤300 LOC): WsConnectionPool mirrors SseConnectionPool (50 cap, 30s heartbeat, 64KB buffer, 1013 close on overflow)
- src/sidecar/server/handler.ts (MODIFY, +50 LOC): add handleUpgrade for /ws/delegation only
- src/sidecar/server/factory.ts (MODIFY, +30 LOC): wire WsDelegationHandler + WsConnectionPool to DelegationManager events
- <@types/ws installed: <version> | ambient src/sidecar/server/ws/types.d.ts created per slopcheck result>
- Wave 3 of 5; depends on W1+W2; blocks W4
- Per CONTEXT §boundaries: no SC-01 output modified; ws/sse pools USED not MODIFIED
- All 17 endpoints + WS upgrade now work end-to-end
- 50-conn cap enforced on both SSE and WS pools
- 1008 (policy violation) / 1003 (unsupported data) / 1013 (try again later) close codes
```

---

## Stop Conditions (W3)

- ✅ SSE route with 6 filter categories + 50-cap + heartbeat
- ✅ WS delegation channel with subscribe/unsubscribe/abort
- ✅ 1008/1003/1013 close codes enforced
- ✅ WS scope guard: only delegation.* events forwarded (AC-S02-06)
- ✅ Backpressure: 64KB buffer → 1013 close (D-SC02-03)
- ✅ Dead conn cleanup within 5s (UB-S02-07)
- ✅ 30s server heartbeat (D-SC02-10)
- ✅ All 17 endpoints + WS upgrade return correct responses
- ✅ Typecheck passes; no `any` in W3 files
- ✅ SC-01 baseline (59 tests) still passes
- ✅ Atomic commit captured
- ⏹️ STOP — W4 (integration) cannot start without complete HTTP/SSE/WS surface

---

## Actors / Consumers (W3)

- **W4 implementer** (integration): uses all 17 endpoints + WS in end-to-end delegation test
- **SC-03 implementer** (future): consumes SSE event stream + WebSocket delegation channel via `@hivemind/sidecar-client`

---

## Risk Mitigations Specific to W3

- **R-W3-WS-UPGRADE-CONFLICT** (WS upgrade competes with HTTP request): mitigated by `WebSocketServer({noServer: true})` + manual `handleUpgrade` only on `/ws/delegation` path; other upgrade attempts → `socket.destroy()`; W3 test verifies HTTP routes still work
- **R-W3-EVENT-FILTER-RACE** (filter applied after first event): mitigated by parsing filter BEFORE `pool.addClient()`; half-subscribed state avoided (D-SC02-08)
- **R-W3-WS-MEMORY-LEAK** (connection not cleaned up on client crash): mitigated by `req.on("close")` cleanup + `socket.on("close")` cleanup + periodic heartbeat liveness check; W3 test verifies 5s cleanup
- **R-W3-@TYPES-WS-INSTALL** (legitimacy concern): gated by slopcheck audit (Task 1); fallback to ambient `.d.ts` if audit fails
- **R-W3-DELEGATION-EVENT-EMITTER** (DelegationManager may not expose events): mitigated by polling fallback (1s interval); W3 test verifies either event-based OR polling works

---

*plan-3.md authored 2026-06-03 — Wave 3 of 5 (real-time: SSE + WS)*
