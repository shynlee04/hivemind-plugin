# Phase SC-02: REST API + Tool Proxy — Research

**Researched:** 2026-06-03
**Domain:** Plugin HTTP / SSE / WebSocket surface + json-render catalog + OpenCode SDK tool dispatch
**Confidence:** HIGH (code-verified) / MEDIUM (Context7-verified) / LOW (WebSearch-verified, none required)
**Status:** READY_FOR_PLAN_PHASE
**Evidence Level:** L5 documentation (planning sector). Runtime readiness claims require L1-L3 proof from authorized verification workflows (see `.planning/AGENTS.md` §3).

<user_constraints>
## User Constraints (from `02-CONTEXT.md`, locked 2026-06-02)

### Locked Decisions (D-SC02-01..12 — verbatim from CONTEXT.md)

**D-SC02-01: Latency budget SLA**
- Read endpoints: **50ms p95** under no load (matches AC-S02-01)
- Read endpoints: **100ms p95** under 10 concurrent clients
- Read endpoints: **250ms p95** under 50 SSE clients broadcasting at 10 events/s
- Tool POST endpoints: **500ms p95** for ack-only response (delegation dispatch is async-after-ack)
- Implementation: 3 perf tests in `tests/sidecar/integration/performance.test.ts` gated by `SIDECAR_PERF` env var

**D-SC02-02: Cache invalidation — dual-layer (defense-in-depth)**
- On `invalidate.cache` SSE event, sidecar's in-process `SidecarStateCache` evicts matching category
- Categories: `"sessions" | "delegations" | "all"` (matches `Cache.invalidate()` from ARCHITECTURE §5.3)
- Client (Next.js) ALSO re-validates with `If-None-Match` ETag on next request
- Dual-layer is by design, not redundancy

**D-SC02-03: WS backpressure — buffer then close 1013**
- Per-conn buffer: **64 KB** (~4K messages * 16 bytes avg, or one large `delegation.output` frame)
- Buffer exceeds 64 KB → close WS with **code 1013 ("Try Again Later")**
- Server does NOT drop individual messages silently
- On `send()` failure, close with code 1011 (server error)
- Client reconnects after 1013; server does not replay buffered messages

**D-SC02-04: Catalog versioning — SHA-256 ETag, no version field**
- Compute SHA-256 of catalog JSON at startup (one-time)
- Serve `ETag: "<sha256-hex>"` on `GET /api/catalog` and `GET /api/catalog/tools`
- Return `304 Not Modified` on revalidation with matching `If-None-Match`
- No `version` field in JSON body — response shape stays stable
- Hash recomputed only at process start (catalog is immutable)

**D-SC02-05: Test fixture strategy — mocks for unit, real for one integration**
- Unit tests: vitest mocks for `SidecarDependencyRegistry` and downstream managers
- Mocks live at `tests/sidecar/__mocks__/` using `vi.mock()` pattern
- **One** integration test (AC-S02-11 end-to-end delegation): real `DelegationManager` + real `SseConnectionPool` + real server on port 0
- Integration test isolated to `tests/sidecar/integration/delegation.test.ts` and gated by `describe.skip` if `process.env.SIDECAR_INTEGRATION` is unset (default skipped in fast CI, enabled in nightly/release)

**D-SC02-06: Error response shape — dual-channel (intentional)**
- Transport errors (HTTP 400/404/405/500/503): raw `{ error: { code, message } }` JSON
- App errors (tool returned failure): `HTTP 200` + `ToolResponse.error = { code, message, data? }`
- Client distinguishes "I screwed up the request" (transport) vs "the tool failed at the app layer" (app)
- Transport code vocabulary: `BAD_REQUEST` (400), `BAD_FILTER` (400), `NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405), `PAYLOAD_TOO_LARGE` (413), `INTERNAL_ERROR` (500), `SERVICE_UNAVAILABLE` (503)

**D-SC02-07: HTTP request body size limit**
- Read endpoints: 0 bytes (no body; reject if body present)
- Tool POST endpoints: **256 KB** hard cap (enforced via `Content-Length` check before `body` parse; 413 `PAYLOAD_TOO_LARGE` on exceed)
- SSE GET: 0 (no body)
- Implementation: size check in `src/sidecar/server/handler.ts` BEFORE handing to route modules

**D-SC02-08: SSE filter parsing & normalization**
- `?filter=session,delegation,trajectory,pressure,invalidate,heartbeat` — comma-separated, exact match
- Missing/empty `filter` query param: subscribe to all categories (default)
- Unknown filter value: **400 BAD_FILTER** with message listing valid values
- Whitespace trimmed; case-sensitive; duplicates deduplicated
- Filter parsed in `src/sidecar/server/routes/events.ts` BEFORE `pool.addClient()` (fail fast, no half-subscribed state)
- Mapping filter category → event types in const map: `session` → 5 types, `delegation` → 4 types, `trajectory` → 0, `pressure` → 0, `invalidate` → 1, `heartbeat` → 1

**D-SC02-09: Tool handler registration — explicit map, no reflection**
- Tool handler map: `TOOL_HANDLERS: Record<string, ToolHandler>` at `src/sidecar/server/tool-proxy/router.ts`
- All 7 write tools explicitly registered (no dynamic discovery of the 26 plugin tools)
- Adding an 8th tool = add new entry to map + new POST route stub
- The 12-tool "exposed vs not exposed" table from ARCHITECTURE §6.4 is the whitelist; 5 of those 12 are read tools served by `/api/state/sessions/*` not `/api/tools/*`, so only 7 appear in the handler map

**D-SC02-10: WS connection limit + heartbeat**
- Per-process **50-connection cap** (mirror SSE)
- Server-initiated `delegation.status` heartbeat at **30s** interval if no other traffic
- Client heartbeat: NOT required (server heartbeats are sufficient)
- Dead connection cleanup: on `send()` failure (EPIPE/ECONNRESET), close with **code 1011**
- Implementation: `WsConnectionPool` mirrors `SseConnectionPool` structure (same cap, same heartbeat cadence, same cleanup-on-failure pattern)

**D-SC02-11: Catalog memory model — single shared reference, lazy load, deep freeze**
- Both `/api/catalog` and `/api/catalog/tools` return the SAME in-memory constant object
- Object parsed from JSON at first request (lazy) and frozen via `Object.freeze()` (deep)
- JSON source files: `src/sidecar/catalog/json-render-catalog.json` + `src/sidecar/catalog/tool-catalog.json`
- Loaded at server startup (step 5.5 sidecar init); if files missing → `INTERNAL_ERROR` 500 at first request
- Zero per-request cost, prevents accidental mutation, single source of truth

**D-SC02-12: Sidecar port discovery — same port file, no env var**
- Discovery mechanism: `.hivemind/state/sidecar-port.json` (written by SC-01 factory at step 5.5)
- No env var override; no CLI flag
- If port file missing or unreadable: SC-03 shows "Sidecar not available" state (inherits SC-01 D-SC01-04)

### Agent Discretion (within locked boundaries)
- Module split within `≤500 LOC` cap per CONCERNS §1 — see "Module Structure" section
- Specific `ToolHandler` signature shape — D-SC02-09 specifies `Record<string, ToolHandler>` but exact `ToolHandler` signature is the plan-phase design
- Whether to install `@types/ws` or write local `.d.ts` ambient module — see Open Risk R-WS-TYPES

### Deferred Ideas (OUT OF SCOPE)
- Request routing beyond 17 endpoints
- WS server-initiated messages beyond delegation events (`server.shutdown`, `server.config.changed`)
- Compression for SSE/WS frames (`gzip`/`deflate`/`permessage-deflate`)
- Auth/identity propagation beyond 7-tool whitelist
- Catalog generation toolchain (SC-02 ships pre-generated JSON only)
- OpenAPI / AsyncAPI spec export
</user_constraints>

## Summary

SC-02 transforms the SC-01 server scaffold (which currently returns `501 Not Implemented` on all non-`/health` routes) into the bounded HTTP / SSE / WebSocket surface that the Next.js 16 sidecar dashboard (SC-03) will consume. All 17 endpoints are spec-locked (4 read-state, 7 write tool proxy, 1 SSE, 1 WS, 2 catalog — corrected from the 12/4/1/1/2 split in the original prompt to match `02-SPEC.md` line 21-25). The architecture aligns strictly with OpenCode's client-server model: reuses the SDK + server's auth/rate-limit/middleware, adds none of its own. No new dependencies required.

**Primary recommendation:** Extend `createSidecarServer()` (SC-01 factory) with a `routes: Route[]` option and a `wsUpgrader?: (req, socket, head) => boolean` callback. Each route module (state, sessions, tools, events, catalog, delegation-ws) is ≤500 LOC and receives a `SidecarDependencyRegistry` getter at request time. The 7 write tools are an **explicit `TOOL_HANDLERS: Record<string, ToolHandler>` map** (D-SC02-09) — they do NOT register new plugin tools in `src/plugin.ts` (the 7 they proxy are already in the 26-tool plugin registry at `src/plugin.ts:727-749`). The WebSocket server uses `WebSocketServer({ noServer: true })` to share the SC-01 HTTP server via its `upgrade` event, with `maxPayload: 64*1024` (D-SC02-03) and a 30s `ping()` heartbeat (D-SC02-10). The catalog endpoint uses D-SC02-04 (SHA-256 ETag) and D-SC02-11 (single shared reference + deep freeze). Three open risks require plan-phase attention: STACK.md sync gap, `@types/ws` gap, and Plugin shape drift in 1.15.13.

**Confidence: HIGH for stack + patterns (code-verified); MEDIUM for json-render consumption pattern in Next.js 16 (type-defs only, no live runtime test); all 12 CONTEXT decisions validated against code/docs.**

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| HTTP routing (read state, tool POST, catalog, SSE) | Plugin server (this phase) | — | SC-01 server is the single HTTP surface; SC-02 extends it with route registration |
| WebSocket upgrade | Plugin server (this phase) | — | Shares SC-01 HTTP server via `upgrade` event (R2 verified pattern) |
| Read-only state serving | Plugin server (read-side) | `.hivemind/state/*` (filesystem) | `readCanonicalStateAsync` (CQRS read; no writes); 4 `CANONICAL_PREFIXES` per `src/sidecar/readonly-state.ts:139` |
| Write tool proxy | Plugin server (write-side) | Plugin `Hooks.tool` map (26 tools already registered) | `TOOL_HANDLERS` map (D-SC02-09) routes to existing 7 plugin tools via `DelegationManager` |
| Delegation dispatch | `src/coordination/delegation/manager.ts` | `src/coordination/delegation/sdk-child-session-starter.ts` | WaiterModel async dispatch (re-entrancy safe per `opencode-session-dispatch-architecture-2026-05-27.md`) |
| Session tracking (read tools: session-tracker, etc.) | `src/task-management/session-tracker/` | Plugin tool (5 read tools) | Read tools already exposed; SC-03 will call them via HTTP |
| Catalog generation (json-render schema) | `src/sidecar/catalog/json-render-catalog.json` (pre-generated) | `@json-render/core@0.19.0` (`defineCatalog` / `defineSchema`) | SC-02 ships pre-generated JSON only; toolchain deferred |
| Catalog consumption (Next.js 16) | SC-03 (deferred) | `@json-render/react@0.19.0` (`Renderer` + `defineRegistry` + `useUIStream`) | Out of SC-02 scope; type surface verified for SC-03 hand-off |
| Auth / rate limit / middleware | OpenCode runtime (NOT this phase) | — | Per SPEC top-level constraint; SC-02 adds NONE of these |
| Persistence (tool proxy results) | `DelegationManager` (in-process state) | SSE event bus | No new persistence layer (D-SC02-XX implicit) |

## Stack Validation

### Package Versions (from `package.json` vs installed)

| Package | Declared | Installed | Match | Source | Confidence |
|---|---|---|---|---|---|
| `ws` | `^8.18.0` | 8.21.0 | OK | `package.json:42-44` (optionalDependencies) | [VERIFIED] |
| `@json-render/core` | `^0.19.0` | 0.19.0 | OK | `package.json:45-47` (optionalDependencies) | [VERIFIED] |
| `@json-render/react` | `^0.19.0` | 0.19.0 | OK | `package.json:45-47` (optionalDependencies) | [VERIFIED] |
| `@json-render/next` | (transitive) | (latest) | OK | `@json-render/next@0.19.0` sibling (not in package.json; SC-03 will install) | [VERIFIED: filesystem] |
| `@opencode-ai/plugin` | `^1.15.13` | 1.15.13 | OK | `package.json:32-35` (peerDependencies + devDependencies) | [VERIFIED] |
| `@opencode-ai/sdk` | `^1.15.13` | 1.15.13 | OK | `package.json:36-39` (dependencies) | [VERIFIED] |
| `zod` | `^4.4.3` | 4.x | OK | `package.json:40-41` (dependencies) | [VERIFIED] |

### R-STACK-SYNC — STACK.md OUT OF DATE (Open Risk)

| Field | STACK.md says | Actual (`package.json` + `node_modules`) | Impact |
|---|---|---|---|
| `@json-render/*` | 0.18.0 | 0.19.0 | `defineCatalog` / `defineRegistry` / `useUIStream` API may differ |
| `@opencode-ai/sdk` | 1.15.10 | 1.15.13 | Type defs may have new fields (e.g., `experimental_workspace`, `serverUrl: URL`) |
| `@opencode-ai/plugin` | 1.15.10 | 1.15.13 | **CRITICAL** — `Plugin` shape changed (see R-PLUGIN-SHAPE-DRIFT) |
| `.opencode/skills/oh-my-openagent-reference` | 0.18.0 | 0.19.0 | Reference skill content may be stale for 0.19.0 builder API |

**Action:** Plan-phase must use `package.json` + `node_modules/*.d.ts` as authoritative source, not `.planning/codebase/STACK.md`. STACK.md should be regenerated in a follow-up phase.

### R-WS-TYPES — `@types/ws` NOT INSTALLED (Open Risk)

`ws@8.21.0` ships no `.d.ts` (`node_modules/ws/wrapper.mjs` + `index.js` are pure JS; only `package.json` + `README.md` + `lib/*.js` present, no `.d.ts`). `@types/ws` is not in `package.json` devDependencies. TypeScript imports of `WebSocket` / `WebSocketServer` will fail `tsc` without a type source.

**Two options for plan-phase:**
1. **Install `@types/ws`** — package legitimacy audit required (see "Package Legitimacy Audit" section)
2. **Write local `src/sidecar/server/ws/types.d.ts`** — declares `WebSocket` and `WebSocketServer` with minimal structural types covering the SC-02 surface (`new WebSocketServer({noServer, maxPayload, ...})`, `server.on('connection', ws => ws.send(...))`, `server.handleUpgrade(req, socket, head, cb)`)

**Recommendation:** Option 1 (install `@types/ws`) — `ws@8.x` types are widely maintained (DefinitelyTyped) and the SC-02 surface is small enough that no local `.d.ts` covers all edge cases. Final decision deferred to plan-phase.

### R-PLUGIN-SHAPE-DRIFT — 1.15.13 Plugin Shape Changed (Open Risk, CRITICAL)

**Verified from `node_modules/@opencode-ai/plugin@1.15.13/dist/index.d.ts:51`:**
```typescript
export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>;
```

**INTEGRATIONS.md / STACK.md describe a different (stale) shape:**
- STALE: `PluginReturn { tool: { [name: string]: ToolDefinition }, config, ... }` (top-level `.tool` map, sync function)
- ACTUAL (1.15.13): `Plugin (input) => Promise<Hooks>` where `Hooks.tool?: { [key: string]: ToolDefinition }` (async, returns `Hooks` with nested `.tool` map)

**Impact on Hivemind's existing code:**
- `HarnessControlPlane: Plugin = async ({ client, directory }) => { ... }` at `src/plugin.ts` — **already `async`**, compatible with 1.15.13 (returns `Promise<Hooks>` implicitly)
- All 26 tools are spread into the `tool: { ... }` map at `src/plugin.ts:727-749` — **compatible** (matches 1.15.13 `Hooks.tool` shape)
- No runtime code change required for existing 26 tools

**Impact on SC-02 design:**
- SC-02 does NOT add 7 new tools to the plugin `tool` map — it proxies the 7 already-registered plugin tools via HTTP. So no Plugin shape adaptation is needed.
- D-SC02-09's `TOOL_HANDLERS: Record<string, ToolHandler>` is a runtime HTTP-level dispatch map (inside `src/sidecar/server/tool-proxy/router.ts`), **separate from** the Plugin registration `Hooks.tool` map. They must be kept in sync via the 7-tool whitelist (D-SC02-09 + ARCHITECTURE §6.4).

**Action:** Plan-phase should NOT re-debate Plugin shape. INTEGRATIONS.md should be regenerated in a follow-up phase to reflect 1.15.13 actual shape.

## Architecture Patterns

### Pattern 1: Zero-Dependency HTTP Routing (R5)

**Inherited from SC-01** (`src/sidecar/server/factory.ts:52-63`):
```typescript
const server = http.createServer((req, res) => {
  // current: returns 501 for everything except /health
});
```

**SC-02 extension pattern:** Replace the inline handler with a `SidecarRouter` class that holds a typed route table:
```typescript
type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => void | Promise<void>;
type Route = { method: 'GET' | 'POST' | 'DELETE'; pattern: RegExp; handler: RouteHandler; bodyLimit?: number };

class SidecarRouter {
  private routes: Route[] = [];
  register(route: Route): void { this.routes.push(route); }
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Match method+pattern → dispatch; body size check before route handler (D-SC02-07)
    // Return 404 NOT_FOUND or 405 METHOD_NOT_ALLOWED if no match (D-SC02-06 transport codes)
  }
}
```

**Module split (per CONCERNS §1 ≤500 LOC cap):**
- `src/sidecar/server/handler.ts` (≤200 LOC) — `SidecarRouter` class + body size enforcement
- `src/sidecar/server/routes/{state,sessions,tools,events,catalog}.ts` (each ≤500 LOC) — route modules registered at startup

**No Express / Fastify / Koa** — per ARCHITECTURE §2 budget (zero framework deps, manual method+path matching).

### Pattern 2: SidecarDependencyRegistry Lazy Binding

**Verified at `src/sidecar/server/registry.ts`:**
- 6 setters: `setDelegationManager`, `setSessionTracker`, `setClient`, `setTrajectory`, `setPressure`, `setConfigSubscriber`
- 6 getters (one per setter)
- `isReady()` — boolean gating for server readiness

**SC-02 usage pattern:** Route modules receive the registry at registration time, resolve dependencies at request time (not module load time). This is the **lazy initialization** pattern inherited from SC-01.

**Example (D-SC02-09 TOOL_HANDLERS map + D-SC02-XX tool proxy):**
```typescript
// src/sidecar/server/tool-proxy/router.ts (≤500 LOC)
import type { SidecarDependencyRegistry } from '../registry';
import { handleDelegateTask } from './handlers/delegate-task';

export type ToolHandler = (args: unknown) => Promise<ToolResponse>;

export function buildToolHandlers(registry: SidecarDependencyRegistry): Record<string, ToolHandler> {
  const dm = registry.getDelegationManager(); // throws if not ready
  return {
    'delegate-task': (args) => handleDelegateTask(dm, args),
    'delegation-status': (args) => handleDelegationStatus(dm, args),
    'execute-slash-command': (args) => handleExecuteSlashCommand(registry, args),
    'hivemind-trajectory': (args) => handleHivemindTrajectory(registry.getTrajectory(), args),
    'hivemind-session-view': (args) => handleHivemindSessionView(registry, args),
    'session-patch': (args) => handleSessionPatch(registry, args),
    'hivemind-command-engine': (args) => handleHivemindCommandEngine(registry, args),
  };
}
```

### Pattern 3: SseConnectionPool → WsConnectionPool Mirror (R2)

**SC-01 SSE pattern** (`src/sidecar/server/sse/pool.ts:146`): 50 cap, 30s heartbeat, `[Harness]` overflow warning, dead conn cleanup on `send()` failure.

**SC-02 WS pattern (Context7 verified, `/websockets/ws` Medium reputation, score 84.3):**
- **No-Server mode + manual upgrade:** SC-02 does NOT bind a separate HTTP server. Instead, it shares the SC-01 HTTP server via the `upgrade` event:
  ```typescript
  // src/sidecar/server/factory.ts (extended)
  const httpServer = http.createServer(/* SidecarRouter.handle */);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, clientTracking: true, autoPong: true });
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws/delegation')) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });
  ```
- **Heartbeat (D-SC02-10):** `ws.isAlive = true` on connection + listen for `pong` events + periodic `ping()` on 30s interval + `terminate()` non-responders (mirrors SC-01 SSE heartbeat cadence)
- **Backpressure (D-SC02-03):** per-conn 64KB buffer cap; on `send()` failure (EPIPE/ECONNRESET), close with 1011; if buffered amount exceeds 64KB, close with 1013
- **Connection cap (D-SC02-10):** mirror `SseConnectionPool.maxClients=50`; reject upgrades beyond 50 with HTTP 503 + `[Harness]` warning

**Module split:**
- `src/sidecar/server/ws/delegation.ts` (≤500 LOC) — `WsConnectionPool` class + heartbeat + upgrade handler

### Pattern 4: Port File Discovery (D-SC02-12)

**Inherited from SC-01** (`src/sidecar/server/factory.ts` step 5.5): writes port to `.hivemind/state/sidecar-port.json` at startup. SC-03 reads the same file. No env var, no CLI flag.

### Pattern 5: TOOL_HANDLERS Explicit Map (D-SC02-09)

Already specified in D-SC02-09. See "Pattern 2" above for code example.

## OpenCode SDK Integration (R1)

### Verified Type Surface (`node_modules/@opencode-ai/{plugin,sdk}@1.15.13/dist/*.d.ts`)

| Export | Signature | Source | Confidence |
|---|---|---|---|
| `Plugin` | `(input: PluginInput, options?: PluginOptions) => Promise<Hooks>` | `plugin/dist/index.d.ts:51` | [VERIFIED] |
| `PluginInput` | `{ client: OpencodeClient, project: Project, directory, worktree, experimental_workspace: {register(type, adapter)}, serverUrl: URL, $: BunShell }` | `plugin/dist/index.d.ts:36-46` | [VERIFIED] |
| `Hooks` | `{ event?, tool?: { [key: string]: ToolDefinition }, "tool.execute.before"?, "tool.execute.after"?, "chat.message"?, "header.part"?, "shell.env"?, "auth.provider"?, "provider.context"?, "experimental_workspace.register"?, config? }` | `plugin/dist/index.d.ts:107+` (partial read) | [VERIFIED: partial] |
| `tool()` | `({ description, args: z.ZodRawShape, execute: (args, context) => Promise<ToolResult> }) => ToolDefinition` | `plugin/dist/tool.d.ts` | [VERIFIED] |
| `ToolContext` | `{ sessionID, messageID, agent, directory, worktree, abort: AbortSignal, metadata({title?, metadata?}), ask({permission, patterns, always, metadata}) }` | `plugin/dist/tool.d.ts` | [VERIFIED] |
| `ToolResult` | `string \| { title?, output, metadata?, attachments?: ToolAttachment[] }` | `plugin/dist/tool.d.ts` | [VERIFIED] |
| `ToolAttachment` | `{ type: 'file', mime, url, filename? }` | `plugin/dist/tool.d.ts` | [VERIFIED] |
| `createOpencodeClient` | `(config: OpencodeClientConfig & {directory?}) => OpencodeClient` | `sdk/dist/client.d.ts` | [VERIFIED] |
| `createOpencode` | `(options?) => { client: OpencodeClient, server: { url: string, close(): void } }` | `sdk/dist/index.d.ts` | [VERIFIED] |
| `OpencodeClient` | typed client (session, project, event, provider, config) | `sdk/dist/client.d.ts` (re-exported from index) | [VERIFIED] |

### Tool Registration Pattern (1.15.13 `Hooks.tool` Map)

**Verified at `src/plugin.ts:727-749`:**
```typescript
const tools = {
  ...registerDelegationTools(registry),    // 3 tools: delegate-task, delegation-status, delegate-cancel
  ...registerSessionTools(registry),       // 7 tools: execute-slash-command, session-patch, etc.
  ...registerHivemindTools(registry),      // 8 tools: hivemind-trajectory, hivemind-session-view, etc.
  ...registerConfigTools(registry),        // 6 tools: config-related
  tmuxCopilotTool,                          // 1 tool
  runAutoLoop,                              // 1 tool (or runRalphLoop)
};
// ...
tool: tools,  // ← this becomes Hooks.tool in 1.15.13
```

**SC-02 implication:** The 7 write tools SC-02 proxies (`delegate-task`, `delegation-status`, `execute-slash-command`, `hivemind-trajectory`, `hivemind-session-view`, `session-patch`, `hivemind-command-engine`) are **already in the 26-tool plugin `tool` map** above. SC-02 does NOT need to register new tools — it provides an HTTP transport for these existing tools.

### DelegationManager Facade (Target of 7 Write Tools)

**Verified at `src/coordination/delegation/manager.ts`:** `DelegationManager` is the public facade with:
- `coordinator` — chain, dispatch, attachChildSession, cancelDelegation, failDispatch, handleSessionDeleted, handleSessionError, handleSessionIdle, recordChildMessageSignal, recordChildToolSignal
- `lifecycle` — getChildSessionId, getStatus, list, markAborted, markCancelled, register
- `monitor.start` — observability hook
- `notificationRouter.register` — subscription registration
- `ptyManager` — optional PTY (Bun-only; falls back to headless)
- `runtimePolicy` — slot/queue/depth enforcement
- `stateMachine` — task state transitions

**SC-02 WS delegation channel** subscribes to DelegationManager events for the requested `delegationId` and forwards as `delegation.output/status/notification` frames (D-SC02-XX implicit; SC-01 CONTEXT line 192-194). Per `opencode-session-dispatch-architecture-2026-05-27.md` re-entrancy analysis: use `DelegationManager.dispatch()` (async, WaiterModel) — NEVER `client.session.prompt()` (causes re-entrancy on parent session).

## WebSocket Server Pattern (R2)

### Verified via Context7 (`/websockets/ws`, Medium, score 84.3)

**Multiple WebSocket Servers on Single HTTP Server pattern (CRITICAL for SC-02):**
> "When you want to share an existing HTTP server (e.g., express, connect, or plain http.Server) across multiple WebSocket applications, you can use WebSocketServer with `noServer: true` and handle the `upgrade` event manually. The `handleUpgrade` method allows you to upgrade the connection on the shared server."

**SC-02 application:** Share SC-01's HTTP server (which already binds to `127.0.0.1:0` and writes port file). One `WebSocketServer({ noServer: true })` instance handles `/ws/delegation` only; other paths (`/api/events` for SSE) remain on the HTTP server.

### WebSocketServer Options (verified Context7 + `ws@8.21.0/lib/websocket-server.js`)

| Option | Default | SC-02 Value | Rationale |
|---|---|---|---|
| `noServer` | false | **true** | Share SC-01 HTTP server via `upgrade` event |
| `maxPayload` | 104857600 (100MB) | **65536 (64KB)** | D-SC02-03 buffer cap |
| `clientTracking` | true | **true** | D-SC02-10 connection cap (uses `wss.clients.size`) |
| `autoPong` | true | **true** | Heartbeat auto-pong |
| `closeTimeout` | 30000 | **30000** | Match SSE cadence |
| `path` | (none) | (not used) | Routing via pathname in `upgrade` handler instead |

### Heartbeat Pattern (verified Context7 + D-SC02-10)

```typescript
// Per-connection heartbeat
ws.isAlive = true;
ws.on('pong', () => { ws.isAlive = true; });

// Server-initiated heartbeat every 30s
const heartbeatInterval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch { ws.terminate(); }
  }
}, 30_000);
wss.on('close', () => clearInterval(heartbeatInterval));
```

### Connection Cap (D-SC02-10)

```typescript
wss.on('connection', (ws, req) => {
  if (wss.clients.size > 50) {  // D-SC02-10
    ws.close(1013, 'Too many connections');  // close code 1013 (Try Again Later)
    return;
  }
  // ... handle subscription
});
```

## json-render Catalog Pattern (R3)

### Verified Type Surface (`node_modules/@json-render/{core,react}@0.19.0/dist/*.d.ts`)

| Export | Signature | Source | Confidence |
|---|---|---|---|
| `defineCatalog` | `(schema, { components, actions? }) => Catalog` | `core/dist/index.d.ts` | [VERIFIED] |
| `defineSchema` | `(s: SchemaBuilder) => Schema` | `core/dist/index.d.ts` | [VERIFIED] |
| `Catalog.prompt` | `(opts?: { mode: 'inline' }) => string` | `core/dist/index.d.ts` (via Context7) | [CITED: Context7] |
| `Catalog.jsonSchema` | `(opts?: { strict: boolean }) => object` | `core/dist/index.d.ts` (via Context7) | [CITED: Context7] |
| `Catalog.validate` | `(spec: unknown) => { valid: boolean, errors?: ... }` | `core/dist/index.d.ts` (via Context7) | [CITED: Context7] |
| `Catalog.zodSchema` | `() => z.ZodType<Spec>` | `core/dist/index.d.ts` (via Context7) | [CITED: Context7] |
| `s.string()` | `() => StringDefinition` | `core/dist/builder.d.ts` | [VERIFIED] |
| `s.number()` / `s.boolean()` / `s.date()` / `s.enum()` / `s.array()` / `s.tuple()` / `s.union()` / `s.object()` / `s.record()` | (various) | `core/dist/builder.d.ts` | [VERIFIED] |
| `s.ref()` | `(name: string) => RefDefinition` | `core/dist/builder.d.ts` | [VERIFIED] |
| `s.propsOf()` | `(ref: RefDefinition) => PropsDefinition` | `core/dist/builder.d.ts` | [VERIFIED] |
| `s.optional()` | `(def: Definition) => Definition` | `core/dist/builder.d.ts` | [VERIFIED] |
| `s.slot()` / `s.zod()` | (various) | `core/dist/builder.d.ts` | [VERIFIED] |
| `defineRegistry` | `(catalog, { components, actions? }) => { registry, handlers, executeAction }` | `react/dist/index.d.ts` | [VERIFIED] |
| `createRenderer` | `(catalog, components) => React.FC<{ spec, loading?, fallback? }>` | `react/dist/index.d.ts` | [VERIFIED] |
| `Renderer` | `({ spec, registry, loading?, fallback? }) => JSX.Element` | `react/dist/index.d.ts` | [VERIFIED] |
| `useUIStream` | `({ api, onComplete, onError }) => { spec, isStreaming, error, reset }` | `react/dist/index.d.ts` | [VERIFIED] |
| `JSONUIProvider` | `({ children, ...providers }) => JSX.Element` (combined) | `react/dist/index.d.ts` | [VERIFIED] |
| `StateProvider` / `DataProvider` / `ActionProvider` / `VisibilityProvider` | individual context providers | `react/dist/index.d.ts` | [VERIFIED] |
| React peer | `^19.2.3` | `react/package.json` | [VERIFIED: filesystem] |

### Catalog Generation & ETag (D-SC02-04 + D-SC02-11)

**Recommended pattern (build at startup, deep freeze, SHA-256 hash once):**
```typescript
// src/sidecar/catalog/json-render-catalog.ts (≤500 LOC)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

let cached: { json: string; etag: string; spec: unknown } | null = null;

export function getJsonRenderCatalog(): { json: string; etag: string; spec: unknown } {
  if (cached) return cached;
  const raw = readFileSync(join(__dirname, 'json-render-catalog.json'), 'utf8');
  const etag = '"' + createHash('sha256').update(raw).digest('hex') + '"';
  const spec = JSON.parse(raw);
  deepFreeze(spec);
  cached = { json: raw, etag, spec };
  return cached;
}
function deepFreeze<T>(obj: T): T { /* Object.freeze recursively */ }
```

**Why this matches D-SC02-04:** SHA-256 of the raw JSON bytes is computed once at first request (lazy load per D-SC02-11); subsequent requests serve the cached `json` + `etag` without re-hashing. The ETag is stable across process lifetime (catalog is immutable per D-SC02-11). On `If-None-Match` match, return `304 Not Modified` (D-SC02-06 transport code `NOT_MODIFIED` not in vocabulary, so use HTTP 304 status + empty body).

**Why this matches D-SC02-11:** Single shared reference (the `cached` object) returned to all requests. `deepFreeze()` prevents accidental mutation. If the JSON file is missing at first request, return `INTERNAL_ERROR` 500 (not a fatal init error — Next.js can still render panels that don't need catalog).

### Catalog Consumption (SC-03 deferred, type surface verified)

For SC-03 (Next.js 16) consumers:
```typescript
// SC-03 panel code (illustrative — NOT in SC-02 scope)
import { Renderer, defineRegistry, useUIStream, JSONUIProvider } from '@json-render/react';
import { catalog } from '@/lib/json-render-catalog';

const { registry, handlers, executeAction } = defineRegistry(catalog, { components, actions });
// Streaming UI:
function MyPanel({ api }) {
  const { spec, isStreaming, error } = useUIStream({ api, onComplete, onError });
  return <JSONUIProvider registry={registry} handlers={handlers}><Renderer spec={spec} loading={isStreaming} /></JSONUIProvider>;
}
```

**Confidence: MEDIUM** — type surface verified from `.d.ts`, but no live runtime test in this phase. SC-03 will validate end-to-end.

## Node HTTP Routing Pattern (R5)

**Inherited from SC-01** (`src/sidecar/server/factory.ts:52-63`): zero-dep `http.createServer` + manual path matching. No Express/Fastify/Koa (ARCHITECTURE §2 budget).

**SC-02 routing pattern:**
```typescript
// src/sidecar/server/handler.ts (≤200 LOC)
import type { IncomingMessage, ServerResponse } from 'node:http';
import { SidecarDependencyRegistry } from './registry';

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: Buffer | null, registry: SidecarDependencyRegistry) => Promise<void>;
type Route = { method: 'GET' | 'POST' | 'DELETE'; pattern: RegExp; bodyLimit: number; handler: RouteHandler };

export class SidecarRouter {
  private routes: Route[] = [];
  constructor(private registry: SidecarDependencyRegistry) {}
  register(route: Route): void { this.routes.push(route); }
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // 1. Method+pattern match
    // 2. Content-Length pre-check (D-SC02-07) — 0 for GET/DELETE, configurable for POST
    // 3. Body collection (bounded by content-length cap; reject 413 PAYLOAD_TOO_LARGE)
    // 4. Dispatch to route handler
    // 5. If no match: 404 NOT_FOUND or 405 METHOD_NOT_ALLOWED (D-SC02-06)
  }
}
```

**Path parameter extraction:** `req.url` parsed via `URL` constructor (`new URL(req.url, 'http://localhost')`), then `pathname` matched against route patterns. Path params (e.g., `/api/state/sessions/{id}/children`) extracted via `pattern.exec(pathname)` and passed as `params` to handler.

## Cache + ETag Pattern (R4)

**D-SC02-02 dual-layer (defense-in-depth):**
1. **Server-side:** in-process `SidecarStateCache` keyed by `(resource, id?)` with category tags (`"sessions" | "delegations" | "all"`). On `invalidate.cache` SSE event, evict matching category entries.
2. **Client-side:** Next.js client ALSO sends `If-None-Match` on every read; sidecar returns `304 Not Modified` on match.

**Implementation:**
```typescript
// src/sidecar/server/cache.ts (≤500 LOC)
type CacheCategory = 'sessions' | 'delegations' | 'all';
type CacheEntry<T> = { value: T; etag: string; category: CacheCategory; expiresAt: number };

export class SidecarStateCache {
  private store = new Map<string, CacheEntry<unknown>>();
  constructor(private defaultTtlMs: number = 5_000) {}
  get<T>(key: string): CacheEntry<T> | undefined { /* ... */ }
  set<T>(key: string, value: T, etag: string, category: CacheCategory, ttlMs?: number): void { /* ... */ }
  invalidate(category: CacheCategory): number { /* ... */ }
  invalidateKey(key: string): boolean { /* ... */ }
  size(): number { return this.store.size; }
}
```

**Wired into read handlers (D-SC02-02):**
```typescript
// src/sidecar/server/routes/sessions.ts (≤500 LOC) — excerpt
async function handleGetSession(req, res, params, _body, registry) {
  const cache = registry.getSidecarStateCache();
  const key = `sessions/${params.id}`;
  const entry = cache.get<SessionSnapshot>(key);
  if (entry && entry.expiresAt > Date.now()) {
    if (req.headers['if-none-match'] === entry.etag) {
      res.writeHead(304).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json', ETag: entry.etag, 'Cache-Control': `private, max-age=${Math.floor((entry.expiresAt - Date.now()) / 1000)}` });
    res.end(JSON.stringify(entry.value));
    return;
  }
  // Miss: read from .hivemind/state/* via readCanonicalStateAsync, cache, respond
}
```

**TTL defaults (D-SC02-XX implicit):** 5s for read-state, 2s for high-churn data (delegation lists). On `invalidate.cache` SSE event, `cache.invalidate(category)` evicts matching entries.

## Vitest Mocking Pattern (R6)

**D-SC02-05:** unit tests use `vi.mock()` for `SidecarDependencyRegistry` and downstream managers; one integration test is gated by `SIDECAR_INTEGRATION=1`.

**Mock pattern (vitest 4 globals, no imports needed):**
```typescript
// tests/sidecar/__mocks__/registry.ts (≤200 LOC)
import { vi } from 'vitest';

export function makeMockRegistry(overrides?: Partial<{
  getDelegationManager: () => unknown;
  getSessionTracker: () => unknown;
  getClient: () => unknown;
  getTrajectory: () => unknown;
  getPressure: () => unknown;
  getConfigSubscriber: () => unknown;
  getSidecarStateCache: () => unknown;
}>): SidecarDependencyRegistry {
  const fakeDelegationManager = {
    coordinator: { chain: vi.fn(), dispatch: vi.fn().mockResolvedValue({ delegationId: 'd-123', status: 'pending' }) },
    lifecycle: { getStatus: vi.fn().mockResolvedValue({ status: 'running' }), list: vi.fn().mockResolvedValue([]) },
    // ... other methods
  };
  return {
    getDelegationManager: vi.fn().mockReturnValue(fakeDelegationManager),
    getSessionTracker: vi.fn().mockReturnValue({ /* ... */ }),
    // ...
    isReady: vi.fn().mockReturnValue(true),
    ...overrides,
  } as unknown as SidecarDependencyRegistry;
}
```

**Test structure:**
```typescript
// tests/sidecar/server/routes/sessions.test.ts (≤200 LOC per test file)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetSession } from '@/sidecar/server/routes/sessions';
import { makeMockRegistry } from '../__mocks__/registry';

describe('GET /api/state/sessions/{id}/children', () => {
  let registry: SidecarDependencyRegistry;
  beforeEach(() => { registry = makeMockRegistry(); });
  it('returns 200 with snapshot on cache miss', async () => {
    const req = createMockReq({ method: 'GET', url: '/api/state/sessions/s-1/children', headers: {} });
    const res = createMockRes();
    await handleGetSession(req, res, { id: 's-1' }, null, registry);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({ id: 's-1', children: expect.any(Array) });
  });
  it('returns 304 on ETag match', async () => { /* ... */ });
  it('returns 404 on unknown session id', async () => { /* ... */ });
});
```

**Integration test gating (D-SC02-05):**
```typescript
// tests/sidecar/integration/delegation.test.ts
import { describe, it, expect } from 'vitest';
const itIntegration = process.env.SIDECAR_INTEGRATION ? it : it.skip;

describe.skipIf(!process.env.SIDECAR_INTEGRATION)('SC-02 end-to-end delegation', () => {
  itIntegration('POST /api/tools/delegate-task → WS delegation.output frames', async () => {
    // Real DelegationManager + real SseConnectionPool + real server on port 0
    // ~5s timeout; validates AC-S02-11
  }, 10_000);
});
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| HTTP body parsing | Custom byte-buffer chunk reader | Node `Readable` pipe + `JSON.parse` once, OR `IncomingMessage` `data` event collection with explicit size cap | Edge cases: chunked transfer encoding, deflate, charset detection |
| WebSocket frame parsing | Custom RFC 6455 parser | `ws@8.21.0` (`WebSocket` / `WebSocketServer`) | Frame masking, fragmentation, ping/pong, close codes — all in `ws` |
| SHA-256 | Custom hash function | Node `crypto.createHash('sha256')` | FIPS 140-2 compliance, hardware acceleration |
| URL parsing | Custom pathname regex | `new URL(req.url, 'http://localhost').pathname` | Edge cases: query strings, fragments, encoded chars |
| Catalog schema validation | Custom Zod-equivalent | `Catalog.zodSchema()` from `@json-render/core@0.19.0` | Type-safe; covers all builder types |
| Catalog prompt generation | Custom system prompt for LLM | `Catalog.prompt({ mode: 'inline' })` from `@json-render/core@0.19.0` | Provider-agnostic, includes action schemas |
| Session state reading | Custom file walker | `readCanonicalStateAsync` from `src/sidecar/readonly-state.ts` | Enforces SIDECAR-03 (4 CANONICAL_PREFIXES) |
| Tool dispatch (parent → child) | `client.session.prompt()` (re-entrancy) | `DelegationManager.dispatch()` (WaiterModel async) | Per `opencode-session-dispatch-architecture-2026-05-27.md`, sync prompt on parent session causes re-entrancy deadlock |
| HTTP routing framework | Express / Fastify / Koa | Hand-rolled `SidecarRouter` (zero deps) | Per ARCHITECTURE §2 budget (≤500 LOC per module, no new deps) |

**Key insight:** SC-02 is a thin HTTP transport layer over an already-rich event/tool surface. Resist the urge to add abstractions that already exist in `ws`, `@json-render/core`, `crypto`, or `node:url`.

## Common Pitfalls

### Pitfall 1: WebSocket binding a separate port
**What goes wrong:** `new WebSocketServer({ port: X })` binds a second port, breaking the SC-01 single-port invariant and confusing port file discovery.
**Why it happens:** Default `ws` examples always bind a port.
**How to avoid:** Always use `WebSocketServer({ noServer: true })` and share the SC-01 HTTP server via the `upgrade` event (Pattern 3).
**Warning signs:** Two `server.listen` calls in `factory.ts`; two port entries in port file.

### Pitfall 2: Plugin tool registration instead of proxy
**What goes wrong:** SC-02 adds 7 new tool entries to `src/plugin.ts:727` `tool` map → duplicates work, bloats the 26-tool surface, and the 7 new tools would be registered twice (once via Plugin, once via `TOOL_HANDLERS`).
**Why it happens:** Misreading D-SC02-09 as "register 7 new tools".
**How to avoid:** The 7 tools are ALREADY in the plugin `tool` map (verified `src/plugin.ts:727-749`). D-SC02-09 specifies a separate `TOOL_HANDLERS: Record<string, ToolHandler>` runtime map for HTTP→tool dispatch.
**Warning signs:** Patches to `src/plugin.ts` that add new `registerXxxTools` functions or new tool entries.

### Pitfall 3: Catalog mutation in shared reference
**What goes wrong:** A consumer mutates the catalog object (e.g., adds a custom component) → subsequent requests see mutated catalog.
**Why it happens:** JavaScript objects are mutable by default.
**How to avoid:** D-SC02-11 mandates `Object.freeze()` deep. Verify with `process.env.NODE_ENV === 'production' && !Object.isFrozen(catalog)` in tests.
**Warning signs:** TypeError in production but not tests (frozen object throws on mutation in strict mode); inconsistent catalog between requests.

### Pitfall 4: ETag weak validation
**What goes wrong:** Client sends `If-None-Match: W/"abc"` (weak) but server generates strong ETag `"abc"` (without `W/` prefix) → 200 returned instead of 304.
**Why it happens:** HTTP ETag spec distinguishes weak (`W/"..."`) from strong (`"..."`) validators.
**How to avoid:** D-SC02-04 specifies SHA-256 of raw bytes (strong validator). Use `"<hex>"` (with quotes, without `W/` prefix). On comparison, normalize both sides to strong form before matching.
**Warning signs:** High cache miss rate; clients never see 304.

### Pitfall 5: WebSocket heartbeat on wrong event
**What goes wrong:** Server sends `ping()` but never listens for `pong` → `isAlive` stays false → all connections terminated.
**Why it happens:** Forgetting `ws.on('pong', () => ws.isAlive = true)`.
**How to avoid:** Heartbeat pattern requires BOTH `ping()` (initiator) AND `pong` listener (response). See Pattern 3 code example.
**Warning signs:** All WS connections drop after 30s; clients report rapid reconnection.

### Pitfall 6: SSE pool overflow silent drop
**What goes wrong:** 51st SSE client connects; pool silently rejects (or crashes).
**Why it happens:** SC-01 `SseConnectionPool` overflows with `[Harness]` warning, but if SC-02 doesn't inherit the same pattern, the 51st client might hang.
**How to avoid:** Mirror SC-01 pool's 50 cap with explicit rejection (return 503 `SERVICE_UNAVAILABLE` per D-SC02-06 transport code).
**Warning signs:** Memory growth; clients reporting indefinite connection attempts.

### Pitfall 7: TOOL_HANDLERS map drift from plugin tools
**What goes wrong:** Plugin adds an 8th tool to `src/plugin.ts:727` `tool` map; SC-02's `TOOL_HANDLERS` map only has 7; SC-03 dashboard shows 12 tools but only 7 are proxyable.
**Why it happens:** Two separate maps (plugin registration + HTTP dispatch) not kept in sync.
**How to avoid:** Plan-phase should add a test that asserts `TOOL_HANDLERS` keys are a subset of `plugin.ts` tool map keys; CI fails on drift.
**Warning signs:** SC-03 dashboard "Tool not exposed" state for newly added tools.

## Code Examples

### Example 1: SidecarFactory extension (D-SC02-XX, R5)

```typescript
// src/sidecar/server/factory.ts (extended from 114 LOC to ~180 LOC)
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { SidecarDependencyRegistry } from './registry';
import { SidecarRouter } from './handler';
import { SseConnectionPool } from './sse/pool';
import { createWsDelegationHandler } from './ws/delegation';
// ... import route modules

export interface SidecarServerOptions {
  registry: SidecarDependencyRegistry;
  routes: Route[];                              // NEW
  ssePool?: SseConnectionPool;                  // SC-01
  wsOptions?: {                                 // NEW (SC-02)
    maxPayload?: number;                        // default 64*1024 (D-SC02-03)
    maxConnections?: number;                    // default 50 (D-SC02-10)
    heartbeatMs?: number;                       // default 30_000 (D-SC02-10)
  };
}

export function createSidecarServer(options: SidecarServerOptions): SidecarServerHandle {
  const { registry, routes, ssePool, wsOptions } = options;
  const router = new SidecarRouter(registry);
  routes.forEach((r) => router.register(r));

  const server = http.createServer((req, res) => router.handle(req, res));
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: wsOptions?.maxPayload ?? 64 * 1024,
    clientTracking: true,
    autoPong: true,
    closeTimeout: wsOptions?.heartbeatMs ?? 30_000,
  });
  const wsHandler = createWsDelegationHandler(wss, registry, wsOptions);

  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/ws/delegation')) {
      if (wss.clients.size >= (wsOptions?.maxConnections ?? 50)) {
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  // ... port file write, signal handlers (SC-01 pattern)
  return { server, port, wss, close: () => /* ... */ };
}
```

### Example 2: Tool handler map + dispatch (D-SC02-09, R1)

```typescript
// src/sidecar/server/tool-proxy/router.ts (≤200 LOC)
import type { SidecarDependencyRegistry } from '../registry';
import { handleDelegateTask } from './handlers/delegate-task';
import { handleDelegationStatus } from './handlers/delegation-status';
import { handleExecuteSlashCommand } from './handlers/execute-slash-command';
import { handleHivemindTrajectory } from './handlers/hivemind-trajectory';
import { handleHivemindSessionView } from './handlers/hivemind-session-view';
import { handleSessionPatch } from './handlers/session-patch';
import { handleHivemindCommandEngine } from './handlers/hivemind-command-engine';

export type ToolHandler = (args: unknown) => Promise<ToolResponse>;
export const TOOL_HANDLER_NAMES = [
  'delegate-task', 'delegation-status', 'execute-slash-command',
  'hivemind-trajectory', 'hivemind-session-view', 'session-patch', 'hivemind-command-engine',
] as const;

export function buildToolHandlers(registry: SidecarDependencyRegistry): Record<string, ToolHandler> {
  const dm = registry.getDelegationManager();
  const trajectory = registry.getTrajectory();
  return {
    'delegate-task': (args) => handleDelegateTask(dm, args),
    'delegation-status': (args) => handleDelegationStatus(dm, args),
    'execute-slash-command': (args) => handleExecuteSlashCommand(registry, args),
    'hivemind-trajectory': (args) => handleHivemindTrajectory(trajectory, args),
    'hivemind-session-view': (args) => handleHivemindSessionView(registry, args),
    'session-patch': (args) => handleSessionPatch(registry, args),
    'hivemind-command-engine': (args) => handleHivemindCommandEngine(registry, args),
  };
}
```

### Example 3: SSE route with filter parsing (D-SC02-08)

```typescript
// src/sidecar/server/routes/events.ts (≤200 LOC excerpt)
const VALID_FILTERS = ['session', 'delegation', 'trajectory', 'pressure', 'invalidate', 'heartbeat'] as const;
type FilterCategory = typeof VALID_FILTERS[number];

function parseFilterParam(raw: string | null): Set<FilterCategory> | { error: string } {
  if (!raw) return new Set(VALID_FILTERS); // empty = subscribe to all
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const deduped = [...new Set(parts)];
  const invalid = deduped.filter((p) => !VALID_FILTERS.includes(p as FilterCategory));
  if (invalid.length > 0) return { error: `Unknown filter: ${invalid.join(', ')}. Valid: ${VALID_FILTERS.join(', ')}` };
  return new Set(deduped as FilterCategory[]);
}

export async function handleSSE(req: IncomingMessage, res: ServerResponse, _params: Record<string,string>, _body: Buffer | null, registry: SidecarDependencyRegistry): Promise<void> {
  const url = new URL(req.url ?? '', 'http://localhost');
  const filter = parseFilterParam(url.searchParams.get('filter'));
  if ('error' in filter) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'BAD_FILTER', message: filter.error } }));
    return;
  }
  const pool = registry.getSseConnectionPool();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const controller = pool.addClient(res, filter);
  req.on('close', () => pool.removeClient(controller.id));
}
```

### Example 4: Catalog with ETag (D-SC02-04 + D-SC02-11)

```typescript
// src/sidecar/server/routes/catalog.ts (≤200 LOC)
import { getJsonRenderCatalog } from '../catalog/json-render-catalog';
import { getToolCatalog } from '../catalog/tool-catalog';

export async function handleGetJsonRenderCatalog(req: IncomingMessage, res: ServerResponse, _params: Record<string,string>, _body: Buffer | null, _registry: SidecarDependencyRegistry): Promise<void> {
  let catalog;
  try { catalog = getJsonRenderCatalog(); } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Catalog file missing or invalid' } }));
    return;
  }
  if (req.headers['if-none-match'] === catalog.etag) {
    res.writeHead(304).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json', ETag: catalog.etag, 'Cache-Control': 'public, max-age=3600, immutable' });
  res.end(catalog.json);
}

export async function handleGetToolCatalog(req: IncomingMessage, res: ServerResponse, _params: Record<string,string>, _body: Buffer | null, _registry: SidecarDependencyRegistry): Promise<void> {
  // ... analogous to handleGetJsonRenderCatalog, using getToolCatalog()
}
```

### Example 5: Body size enforcement (D-SC02-07)

```typescript
// src/sidecar/server/handler.ts (SidecarRouter.handle excerpt)
async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // ... method+pattern matching ...
  const route = matchedRoute;
  if (!route) { /* 404 or 405 */ return; }

  // Body size enforcement (D-SC02-07)
  const contentLength = Number(req.headers['content-length'] ?? 0);
  if (route.method !== 'POST' && contentLength > 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Body not allowed for this method' } }));
    return;
  }
  if (contentLength > route.bodyLimit) {
    res.writeHead(413, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'PAYLOAD_TOO_LARGE', message: `Body exceeds ${route.bodyLimit} bytes` } }));
    return;
  }
  // ... collect body, dispatch to route.handler(req, res, params, body, this.registry) ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `PluginReturn` (sync, `.tool` at top level) | `Plugin (input, options?) => Promise<Hooks>` (async, `Hooks.tool: { [k]: ToolDefinition }`) | `@opencode-ai/plugin@1.15.13` (post-1.15.10) | Existing async `HarnessControlPlane` compatible; INTEGRATIONS.md must be updated |
| Dynamic tool discovery (reflection over plugin tools) | Explicit `TOOL_HANDLERS: Record<string, ToolHandler>` map | SC-02 D-SC02-09 | Security: prevents accidental exposure of mutating plugin tools (e.g., `bootstrap-init`); audit-friendly |
| In-memory catalog re-parse on each request | Single shared reference + deep freeze + SHA-256 ETag | SC-02 D-SC02-04 + D-SC02-11 | Zero per-request cost; native HTTP caching works |
| WebSocket binds separate port | `WebSocketServer({ noServer: true })` + share HTTP server via `upgrade` event | `ws@8.x` best practice | Single port for HTTP + WS; aligns with port file discovery |
| Per-message WS drop on backpressure | 64KB buffer cap + close 1013 ("Try Again Later") | SC-02 D-SC02-03 | Loud failure (no silent drops); client reconnects with backoff |
| SSE pool 50-cap silent reject | SSE pool 50-cap explicit 503 | SC-01 inherited | Inherited pattern: `[Harness]` warning + 503 response |
| Express / Fastify / Koa | Hand-rolled `SidecarRouter` | ARCHITECTURE §2 budget | Zero deps; module size budget enforces minimal abstraction |
| No heartbeat (TCP keepalive only) | Application-layer `ping()` + `isAlive` flag + 30s interval | SC-02 D-SC02-10 | Dead connection detection within 30s (vs TCP keepalive default 2h) |

**Deprecated/outdated:**
- `PluginReturn` shape: replaced by 1.15.13 `Plugin (input) => Promise<Hooks>` (R-PLUGIN-SHAPE-DRIFT)
- `STACK.md` json-render 0.18.0 / opencode-ai 1.15.10 references: replaced by 0.19.0 / 1.15.13 (R-STACK-SYNC)

## Mini STRIDE Pass (planning-sector guarded)

> **Per `.planning/AGENTS.md` §3:** Planning docs SHALL NOT claim runtime readiness from docs-only evidence. This STRIDE pass documents the threats identified in the design and the mitigations specified in D-SC02-01..12. Runtime verification (L1-L3 evidence) is the responsibility of plan-phase + execute-phase + verify-phase.

| Threat | STRIDE | Mitigation | Evidence Level | Status |
|---|---|---|---|---|
| **WS origin spoofing** | Spoofing | `Sec-WebSocket-Protocol` header check + localhost-only binding (`127.0.0.1`) | L5 (docs only) | **PLAN: add per-connection origin check + Log warning on unexpected origin** |
| **HTTP body tampering** | Tampering | D-SC02-07 256KB cap on POST bodies + `Content-Length` pre-check + 413 `PAYLOAD_TOO_LARGE` | L5 (docs) | **PLAN: enforce pre-check in `SidecarRouter.handle()` before route dispatch** |
| **TOOL_HANDLERS exposure creep** | Tampering | D-SC02-09 explicit map (no reflection); 7-tool whitelist from ARCHITECTURE §6.4 | L5 (docs) | **PLAN: add test asserting `TOOL_HANDLERS` keys ⊆ plugin tool map keys** |
| **Request/response repudiation** | Repudiation | SC-01 `client.app?.log?.({body: {service, level, message}})` pattern (verified `src/plugin.ts:444`) | L5 (docs) | **PLAN: log every 4xx/5xx + every tool proxy invocation with request ID** |
| **Catalog info disclosure** | Info Disclosure | D-SC02-11 deep freeze + read-only response shape (no PII or session-specific data in catalog) | L5 (docs) | **PLAN: catalog is static; no disclosure vector beyond what LLM client already has** |
| **DoS via connection flooding** | DoS | D-SC02-10 WS 50-cap + SC-01 SSE 50-cap; 503 on overflow with `[Harness]` warning | L5 (docs) | **PLAN: mirror SC-01 `SseConnectionPool` overflow handling in `WsConnectionPool`** |
| **DoS via large payload** | DoS | D-SC02-03 WS 64KB maxPayload + D-SC02-07 HTTP 256KB body cap | L5 (docs) | **PLAN: both limits enforced in `WebSocketServer` options + `SidecarRouter` pre-check** |
| **Catalog mutation by consumer** | Tampering | D-SC02-11 `Object.freeze()` deep | L5 (docs) | **PLAN: assert `Object.isFrozen(catalog)` in test; freeze utility exported from catalog module** |
| **Sandbox escape via tool proxy** | Elevation | TOOL_HANDLERS map is whitelist (7 tools, not 26); tools themselves enforce their own permission via `tool.execute.before` hook | L5 (docs) | **PLAN: tools inherit existing OpenCode auth (`ask()` permission); no new elevation path** |
| **Replay attack on tool POST** | Repudiation | Each tool call has `requestId`; SC-02 logs request ID + response; tool-side idempotency is the tool's responsibility (existing 26 tools have their own idempotency logic) | L5 (docs) | **ACCEPTED: deferred to tool-level idempotency (out of SC-02 scope)** |

**STRIDE verdict:** 9 of 10 threats have D-SC02-* design mitigations documented; 1 accepted (replay at tool level). No HIGH-severity unaddressed threats. Plan-phase should add the verification steps (test names + commands) listed above.

## Package Legitimacy Audit

> **Per package_legitimacy_protocol:** No new packages required for SC-02. The only candidate is `@types/ws` (R-WS-TYPES mitigation), which is a devDependency candidate — final decision deferred to plan-phase.

### Current Dependencies (all verified, no new packages needed)

| Package | Version | Source | Confidence | Status |
|---|---|---|---|---|
| `ws` | `^8.18.0` (installed 8.21.0) | `package.json:42-44` (optionalDependencies) | [VERIFIED: package.json + filesystem] | In use by SC-01 (no, actually SC-01 doesn't use ws); SC-02 will use |
| `@json-render/core` | `^0.19.0` (installed 0.19.0) | `package.json:45-47` (optionalDependencies) | [VERIFIED] | SC-02 catalog generation (build-time only) |
| `@json-render/react` | `^0.19.0` (installed 0.19.0) | `package.json:45-47` (optionalDependencies) | [VERIFIED] | SC-03 (deferred) |
| `@opencode-ai/plugin` | `^1.15.13` (installed 1.15.13) | `package.json:32-35` (peerDependencies + devDependencies) | [VERIFIED] | Hivemind plugin |
| `@opencode-ai/sdk` | `^1.15.13` (installed 1.15.13) | `package.json:36-39` (dependencies) | [VERIFIED] | Hivemind + SC-02 (via shared/session-api) |
| `zod` | `^4.4.3` (installed 4.x) | `package.json:40-41` (dependencies) | [VERIFIED] | Request validation (D-SC02-XX) |

### `@types/ws` Audit (deferred to plan-phase, R-WS-TYPES)

| Field | Value | Confidence |
|---|---|---|
| Package | `@types/ws` | [ASSUMED: standard DefinitelyTyped name] |
| Registry | npm | [ASSUMED] |
| Age | 8+ years (DefinitelyTyped) | [ASSUMED] |
| Downloads | ~50M/week (DefinitelyTyped canonical) | [ASSUMED] |
| Source repo | `https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/ws` | [ASSUMED] |
| slopcheck | Not run (slopcheck not in environment) | — |
| Disposition | **DEFERRED** — plan-phase must run slopcheck before install | — |

*If `@types/ws` install is rejected, fallback is to write a local `src/sidecar/server/ws/types.d.ts` ambient module covering the SC-02 surface only.*

## Open Risks

| ID | Risk | Severity | Mitigation | Owner |
|---|---|---|---|---|
| **R-STACK-SYNC** | `.planning/codebase/STACK.md` lists json-render 0.18.0 / opencode-ai 1.15.10 (actual: 0.19.0 / 1.15.13) | MEDIUM | Plan-phase uses `package.json` + `node_modules/*.d.ts` as authoritative; STACK.md regeneration deferred to follow-up phase | Plan-phase |
| **R-WS-TYPES** | `ws@8.21.0` ships no `.d.ts`; `@types/ws` not installed | MEDIUM | Plan-phase decision: install `@types/ws` (legitimacy audit required) OR local ambient `.d.ts` | Plan-phase |
| **R-PLUGIN-SHAPE-DRIFT** | 1.15.13 `Plugin` shape changed (async, `Hooks.tool` map); INTEGRATIONS.md stale | LOW (Hivemind compatible) | Plan-phase skips re-debate; INTEGRATIONS.md regeneration deferred | Plan-phase |
| **R-WS-PLUGIN-COEXIST** | `ws@8.21.0` is `optionalDependencies`; if absent, WS routes must degrade to 503 `SERVICE_UNAVAILABLE` | LOW (SC-01 SSE also has graceful degradation pattern) | Plan-phase: try-catch `new WebSocketServer()`; if throws, register `WS_UPGRADE_HANDLER` returning 503 | Plan-phase |
| **R-CATALOG-MUTATION** | Catalog objects must be deep frozen; TypeScript types allow mutation; runtime check needed | LOW (D-SC02-11 specifies freeze) | Plan-phase: `deepFreeze()` utility + test asserting `Object.isFrozen(catalog)` | Plan-phase |
| **R-HEARTBEAT-LIVENESS** | 30s heartbeat + 30s timeout window → dead connection detected within 30-60s; some clients may want faster detection | LOW (D-SC02-10 specifies 30s) | Defer to production tuning; tracked in CONTEXT.md "Architectural follow-ups" | Deferred |
| **R-PERF-BASELINE** | D-SC02-01 p95 SLAs not yet measured; only `SIDECAR_PERF=1` gated tests will reveal actuals | MEDIUM (expected) | Plan-phase: include 3 perf tests in `tests/sidecar/integration/performance.test.ts` (D-SC02-01 specifies 3 cases) | Plan-phase |
| **R-CONTEXT-COUNT-MISMATCH** | Original L0 prompt said "12-tool metadata"; CONTEXT.md says "2 catalog endpoints" with "12-tool" referenced in D-SC02-09 rationale. Actual: 5 read tools (state routes) + 7 write tools (TOOL_HANDLERS) = 12 total exposed, NOT 12 write tools. Reconciled. | NONE (clarified) | Plan-phase uses CONTEXT.md as authoritative (12 = 5 read + 7 write) | Resolved |

## Environment Availability

Step 2.6: SKIPPED. SC-02 is a code-only phase with no new external dependencies. The `ws` (optionalDep) and `@json-render/*` (optionalDep) packages are already installed at verified versions. The `@types/ws` candidate is a devDep install at plan-phase, not a runtime dependency.

## Validation Architecture

### Test Framework

| Property | Value | Source |
|---|---|---|
| Framework | vitest 4.x (with globals) | `package.json` + `vitest.config.ts` |
| Config file | `vitest.config.ts` | verified at repo root |
| Setup file | `vitest.setup.ts` | verified at repo root |
| Quick run command | `npx vitest run tests/sidecar/` | per TESTING.md |
| Full suite command | `npm test` | per AGENTS.md / package.json |
| Coverage thresholds | statements 75 / branches 62 / functions 80 / lines 77 (v8 provider) | TESTING.md; excludes `src/index.ts` and `src/**/index.ts` |

### Phase Requirements → Test Map

> Per CONTEXT.md `boundaries > verification commands` + D-SC02-05. Requirements inferred from `02-SPEC.md` (read separately by plan-phase).

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| AC-S02-01 | GET /api/state/snapshot returns 200 + JSON | unit | `npx vitest run tests/sidecar/server/routes/state.test.ts` | ❌ Wave 0 |
| AC-S02-02 | GET /api/state/sessions/{id}/* returns 200 + JSON for 5 session-scoped reads | unit | `npx vitest run tests/sidecar/server/routes/sessions.test.ts` | ❌ Wave 0 |
| AC-S02-03 | POST /api/tools/{name} returns 200 + ToolResponse | unit | `npx vitest run tests/sidecar/server/tool-proxy/*.test.ts` | ❌ Wave 0 |
| AC-S02-04 | POST /api/tools/{name} with >256KB body returns 413 PAYLOAD_TOO_LARGE | unit | `npx vitest run tests/sidecar/server/handler.test.ts` | ❌ Wave 0 |
| AC-S02-05 | GET /api/events?filter=... returns text/event-stream | unit | `npx vitest run tests/sidecar/server/routes/events.test.ts` | ❌ Wave 0 |
| AC-S02-06 | GET /api/events?filter=invalid returns 400 BAD_FILTER | unit | `npx vitest run tests/sidecar/server/routes/events.test.ts` | ❌ Wave 0 |
| AC-S02-07 | WS /ws/delegation upgrade succeeds + sends frames | unit | `npx vitest run tests/sidecar/server/ws/delegation.test.ts` | ❌ Wave 0 |
| AC-S02-08 | GET /api/catalog returns 200 + ETag; If-None-Match match returns 304 | unit | `npx vitest run tests/sidecar/server/routes/catalog.test.ts` | ❌ Wave 0 |
| AC-S02-09 | GET /api/catalog/tools returns 200 + 12-tool metadata | unit | `npx vitest run tests/sidecar/server/routes/catalog.test.ts` | ❌ Wave 0 |
| AC-S02-10 | WS connection 51 → 503 SERVICE_UNAVAILABLE | unit | `npx vitest run tests/sidecar/server/ws/delegation.test.ts` | ❌ Wave 0 |
| AC-S02-11 | End-to-end delegation: POST /api/tools/delegate-task → WS frames received | integration (SIDECAR_INTEGRATION=1) | `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts` | ❌ Wave 0 |
| AC-S02-12 | p95 latency SLAs (50/100/250/500ms) | perf (SIDECAR_PERF=1) | `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/sidecar/`
- **Per wave merge:** `npm test` (full suite, must include SC-01 regression — 59 tests in `tests/sidecar/readonly-state.test.ts`)
- **Phase gate:** Full suite green + typecheck + build before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/sidecar/server/handler.test.ts` — SidecarRouter unit tests (body size, 404, 405, method mismatch)
- [ ] `tests/sidecar/server/routes/state.test.ts` — 4 read-state route tests
- [ ] `tests/sidecar/server/routes/sessions.test.ts` — 5 session-scoped read tests
- [ ] `tests/sidecar/server/routes/tools.test.ts` — 7 tool POST route tests
- [ ] `tests/sidecar/server/routes/events.test.ts` — SSE filter parsing + pool add/remove
- [ ] `tests/sidecar/server/routes/catalog.test.ts` — 2 catalog endpoint tests (ETag, freeze)
- [ ] `tests/sidecar/server/ws/delegation.test.ts` — WS upgrade + heartbeat + 50-cap
- [ ] `tests/sidecar/server/tool-proxy/router.test.ts` — TOOL_HANDLERS map shape
- [ ] `tests/sidecar/server/tool-proxy/handlers/*.test.ts` — 7 handler unit tests
- [ ] `tests/sidecar/server/cache.test.ts` — SidecarStateCache invalidation
- [ ] `tests/sidecar/integration/delegation.test.ts` — AC-S02-11 end-to-end (gated)
- [ ] `tests/sidecar/integration/performance.test.ts` — D-SC02-01 SLAs (gated)
- [ ] `tests/sidecar/__mocks__/registry.ts` — shared mock factory
- [ ] `vitest.config.ts` — no changes (existing config covers `tests/**/*.test.ts`)

*(No new test framework install — vitest 4 already in place.)*

## Security Domain

> Per `.planning/AGENTS.md` §6 + D-SC02-* design. STRIDE pass above; ASVS mapping below.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V1 Architecture | yes | ARCHITECTURE.md (CQRS, 9-surface); SC-02 adds no new architectural surface |
| V2 Authentication | **NO** | OpenCode runtime owns (SC-02 adds NO auth) — per SPEC top-level constraint |
| V3 Session Management | **NO** | OpenCode runtime owns (no session cookies; localhost-only) |
| V4 Access Control | partial | TOOL_HANDLERS whitelist (D-SC02-09) is the access control layer; 5 of 12 exposed via state routes, 7 via tool POST |
| V5 Input Validation | **YES** | `Content-Length` pre-check (D-SC02-07); SSE filter parsing with BAD_FILTER (D-SC02-08); zod schemas per tool args (D-SC02-XX implicit) |
| V6 Cryptography | partial | SHA-256 for ETag (D-SC02-04); no TLS (localhost-only per SC-01) |
| V7 Error Handling | **YES** | Dual-channel error response (D-SC02-06); transport codes vocabulary; `[Harness]` prefix on thrown errors (inherited) |
| V8 Data Protection | **YES** | Catalog deep freeze (D-SC02-11); no PII in catalog; session state read via `readCanonicalStateAsync` enforces 4 CANONICAL_PREFIXES |
| V9 Communication | **YES** | Localhost-only binding (`127.0.0.1:0`) inherited from SC-01; no external network |
| V10 Malicious Code | **NO** | No code execution from request bodies; tool args are typed (zod) |
| V11 Business Logic | partial | TOOL_HANDLERS whitelist prevents accidental exposure of mutating tools (e.g., `bootstrap-init`); `session-patch` must enforce SIDECAR-03 via `refuseCanonicalWrite` |
| V12 Files & Resources | partial | D-SC02-XX implicit: `session-patch` routes through canonical path gate; no arbitrary file write |
| V13 API & Web Service | **YES** | D-SC02-06 error response shape (transport vs app); D-SC02-08 filter parsing; 17 endpoints enumerated |
| V14 Configuration | partial | Sidecar port file (D-SC02-12) is the only config surface; no env vars |

### Known Threat Patterns for Node HTTP + WS + SSE

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| HTTP body DoS | DoS | `Content-Length` pre-check (D-SC02-07) |
| WS upgrade flood | DoS | 50-cap (D-SC02-10) + 503 on overflow |
| WS slow consumer | DoS | 64KB buffer cap + 1013 close (D-SC02-03) |
| WS dead connection | DoS | 30s heartbeat + terminate (D-SC02-10) |
| SSE filter injection | Tampering | D-SC02-08 BAD_FILTER on unknown value |
| Catalog mutation | Tampering | D-SC02-11 deep freeze |
| Tool proxy reflection | Elevation | D-SC02-09 explicit whitelist (no reflection) |

## Sources

### Primary (HIGH confidence — code/file/docs verified)

- `package.json` — version manifest (verified 2026-06-03)
- `src/plugin.ts:394-829` — `HarnessControlPlane: Plugin = async ({client, directory}) => {...}` + 26 tools + step 5.5 sidecar init (verified)
- `src/sidecar/server/factory.ts:52-63` — `createSidecarServer` http handler pattern (verified)
- `src/sidecar/server/registry.ts` — `SidecarDependencyRegistry` 6 setters/getters + `isReady()` (verified)
- `src/sidecar/server/sse/pool.ts` — `SseConnectionPool` 50 cap + 30s heartbeat pattern (verified)
- `src/sidecar/readonly-state.ts:139` — 4 `CANONICAL_PREFIXES` (verified)
- `src/coordination/delegation/manager.ts` — `DelegationManager` facade surface (verified)
- `src/coordination/delegation/sdk-child-session-starter.ts` — child session starter (verified)
- `src/shared/session-api.ts` — `OpenCodeClient` wrapper + `SYNC_PROMPT_FALLBACK_TIMEOUT_MS=30_000` (verified)
- `node_modules/@opencode-ai/plugin@1.15.13/dist/index.d.ts:36-107` — `PluginInput`, `Plugin`, `Hooks` (partial read; lines 107-317 pending)
- `node_modules/@opencode-ai/plugin@1.15.13/dist/tool.d.ts` — `tool()` helper + `ToolContext` + `ToolResult` + `ToolAttachment` (verified)
- `node_modules/@opencode-ai/sdk@1.15.13/dist/{index,client}.d.ts` — `createOpencode` + `createOpencodeClient` (verified)
- `node_modules/@json-render/core@0.19.0/dist/index.d.ts` — `defineCatalog`, `defineSchema`, `defineRenderer`, `createStateStore` + all types (verified)
- `node_modules/@json-render/core@0.19.0/dist/builder.d.ts` — `s.*` builder methods (verified)
- `node_modules/@json-render/react@0.19.0/dist/index.d.ts` — `Renderer`, `defineRegistry`, `createRenderer`, `useUIStream`, `JSONUIProvider`, context providers (verified)
- `.planning/codebase/STRUCTURE.md:73-79` — file count + ESM/Node 20+ (verified)
- `.planning/codebase/CONCERNS.md` — 500 LOC cap + 8 pre-existing violators (verified)
- `.planning/codebase/CONVENTIONS.md` — strict TS + §7/§8/§9/§13 (verified)
- `.planning/codebase/TESTING.md` — vitest v4 config + 75/62/80/77 thresholds (verified)
- `.planning/codebase/INTEGRATIONS.md` — Plugin/PluginReturn shape (verified STALE per R-PLUGIN-SHAPE-DRIFT)
- `.planning/codebase/STACK.md` — version manifest (verified STALE per R-STACK-SYNC)
- `.planning/phases/SC-02-rest-api-tool-proxy/02-CONTEXT.md:39-134` — 12 locked decisions (verified verbatim)
- `.planning/phases/SC-02-rest-api-tool-proxy/02-SPEC.md:1-120` — 17 endpoints + architectural constraint (verified)
- `.planning/research/opencode-session-dispatch-architecture-2026-05-27.md` — re-entrancy + 3 safe dispatch patterns (verified)
- `.planning/research/opencode-sdk-v1155-api-audit-2026-05-21.md` — 1.15.5 API baseline (verified)

### Secondary (MEDIUM confidence — Context7 verified)

- `/websockets/ws` (Context7, Medium reputation, score 84.3) — `WebSocketServer` options, multiple-servers-on-one-HTTP pattern, heartbeat pattern, `handleUpgrade`
- `/vercel-labs/json-render` (Context7, High reputation, score 79.9) — `defineCatalog` / `defineSchema` / `Catalog` methods

### Tertiary (LOW confidence — none required)

- No WebSearch was needed; all critical claims have code or Context7 backing

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — package.json + node_modules/*.d.ts verified directly
- Architecture (HTTP routing, WS upgrade, SSE mirror): **HIGH** — SC-01 patterns inherited + Context7 verified
- json-render catalog pattern: **MEDIUM** — type surface verified; runtime end-to-end test deferred to SC-03
- Vitest mocking pattern: **HIGH** — D-SC02-05 explicit + vitest 4 globals verified in `vitest.config.ts`
- Plugin shape drift: **HIGH** — verified at `node_modules/@opencode-ai/plugin@1.15.13/dist/index.d.ts:51` (actual: async, returns `Promise<Hooks>`); INTEGRATIONS.md verified stale

**Research date:** 2026-06-03
**Valid until:** 2026-07-03 (30 days; package versions stable, no fast-moving deps in SC-02 surface)

**Allowed surfaces (this deliverable):**
- ✅ WRITE: `.planning/phases/SC-02-rest-api-tool-proxy/02-RESEARCH.md`
- ✅ COMMIT: atomic git commit of the above

**Forbidden surfaces (per CONTEXT.md `boundaries` + AGENTS.md):**
- ❌ DO NOT mutate `src/`, `tests/`, `.opencode/`, `.hivemind/`
- ❌ DO NOT modify `02-SPEC.md` or `02-CONTEXT.md` (locked)
- ❌ DO NOT authorize runtime code work (this is L5 evidence; plan-phase + execute-phase must independently verify with L1-L3)

**Actors / consumers (downstream):**
- Plan-phase (specialist: `hm-planner`) — consumes RESEARCH.md to write `02-PLAN.md`
- Execute-phase (specialist: `hm-executor`) — consumes `02-PLAN.md` to implement
- Verify-phase (specialist: `hm-verifier`) — consumes verification commands to audit

**Verification commands (downstream):**
- Unit: `npx vitest run tests/sidecar/`
- Integration: `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/`
- Performance: `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts`
- Type check: `npm run typecheck`
- Full suite: `npm test`
- Build: `npm run build`
- Smoke: start plugin + `curl http://127.0.0.1:<port>/api/state/snapshot` (port from `.hivemind/state/sidecar-port.json`)

**Stop conditions (this phase):**
- ✅ All 12 CONTEXT decisions validated against code/docs
- ✅ Mini STRIDE pass with 9 mitigations + 1 accepted
- ✅ Stack validation table complete (6 packages verified, 0 new packages required)
- ✅ Open risks list (8 risks identified, owners assigned)
- ✅ Package legitimacy audit (no new packages; `@types/ws` deferred to plan-phase)
- ✅ Validation architecture section (12 ACs mapped to tests; Wave 0 gaps listed)
- ✅ Security domain section (ASVS V4/V5/V6/V7/V8/V9/V11/V13 mapped)
- ✅ This RESEARCH.md committed to `feature/harness-implementation` with atomic commit
- ⏹️ STOP — do NOT auto-start plan-phase (L0 will dispatch `/gsd-plan-phase SC-02` next)
