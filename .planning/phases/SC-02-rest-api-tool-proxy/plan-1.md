# plan-1.md — Wave 1: Core Infrastructure

**Phase:** SC-02 — REST API + Tool Proxy
**Wave:** 1 of 5
**Type:** Implementation (core infrastructure)
**Depends on:** W0 (test scaffolds exist, currently red)
**Blocks:** W2, W3, W4

---

## Objective

Build the **core infrastructure** that all 17 endpoints and the WS channel depend on: `SidecarRouter` (main HTTP router with method+path matching), `SidecarStateCache` (5s/2s TTLs + ETag), `TOOL_HANDLERS` dispatch map, the `routes/types.ts` contract file, and a minimal extension to `factory.ts` to accept routes. After W1, the 17-endpoint matrix test in `tests/sidecar/server/handler.test.ts` should partially pass (handler exists; 404 fallback works; routes are still 501 until W2/W3 wire them).

---

## Allowed Surfaces (W1 only)

- ✅ CREATE: `src/sidecar/server/handler.ts` (≤200 LOC) — `SidecarRouter` class
- ✅ CREATE: `src/sidecar/server/cache.ts` (≤500 LOC) — `SidecarStateCache` class
- ✅ CREATE: `src/sidecar/server/routes/types.ts` (≤500 LOC) — All route request/response types
- ✅ CREATE: `src/sidecar/server/tool-proxy/router.ts` (≤200 LOC) — `TOOL_HANDLERS` map
- ✅ MODIFY: `src/sidecar/server/factory.ts` — ADD `routes?: Route[]` option to `SidecarServerOptions` (≤30 LOC addition; do NOT refactor existing logic)

---

## Forbidden Surfaces (W1)

- ❌ NO route implementations (W2 territory: `routes/{state,sessions,tools,events,catalog}.ts`)
- ❌ NO WS handler (W3 territory: `ws/delegation.ts`, `ws/pool.ts`)
- ❌ NO modification to `src/sidecar/server/registry.ts` (6 setters sufficient)
- ❌ NO modification to `src/sidecar/server/sse/pool.ts` (SC-01 inherited)
- ❌ NO modification to `src/sidecar/types.ts` (11 event types sufficient)
- ❌ NO modification to `src/plugin.ts` (SC-01 step 5.5 already wires factory)
- ❌ NO new npm dependencies (C-S02-05)
- ❌ NO auth, rate limit, session middleware (UR-S02-02)
- ❌ NO catalog JSON files (W2 territory)

---

## Tasks (3 tasks)

### Task 1: SidecarRouter (handler.ts) + factory extension

**Files:** `src/sidecar/server/handler.ts`, `src/sidecar/server/factory.ts` (modify)

**Action:**
1. Create `src/sidecar/server/handler.ts`:
   - `export interface Route { method: string; pattern: RegExp; handler: (req: IncomingMessage, res: ServerResponse, match: RegExpMatchArray, registry: SidecarDependencyRegistry) => Promise<void> | void; }`
   - `export class SidecarRouter` with constructor `constructor(routes: Route[], registry: SidecarDependencyRegistry)`
   - `async handle(req: IncomingMessage, res: ServerResponse): Promise<void>` method: matches method + path against routes, calls handler with match groups; fallback to 404 JSON `{error: {code: "NOT_FOUND", message: "..."}}`
   - Helper: `sendJson(res, status, body, headers?)` for consistent JSON responses
   - Helper: `sendError(res, status, code, message)` for transport errors
   - Body size check: read `Content-Length` header; if >256KB → 413 `PAYLOAD_TOO_LARGE` (per D-SC02-07); for `POST /api/tools/*` only
   - All error throws prefixed `[Harness]`

2. Modify `src/sidecar/server/factory.ts`:
   - Add `routes?: Route[]` to `SidecarServerOptions` interface
   - After `server = http.createServer(...)` in `createSidecarServer`, replace the inline handler with:
     ```ts
     const router = new SidecarRouter(routes ?? [], options.registry)
     const server = http.createServer((req, res) => { void router.handle(req, res) })
     ```
   - KEEP existing `/health` route registration (move into routes array OR special-case before router.handle)
   - DO NOT remove `ssePool.startHeartbeat()`, port file write, SIGTERM/SIGINT cleanup
   - Verify: existing `tests/sidecar/server/factory.test.ts` (if any) still passes; if no test exists, factory is covered by integration in W4

3. JSDoc on all new exports (per AGENTS.md): `@param`, `@returns`, `@throws`, `@example`

**Verify:** `npx vitest run tests/sidecar/server/handler.test.ts -t "404 fallback"` — at least the 404 test passes (handler exists, returns 404 for unknown routes); other 16 endpoint tests still 404 (because routes are stubs not real implementations). `npm run typecheck` must pass.

**Done:** `SidecarRouter` + factory extension exist; 404 fallback works; 16 endpoint tests still 404 (expected — routes not wired in W1).

---

### Task 2: SidecarStateCache (cache.ts) + routes/types.ts

**Files:** `src/sidecar/server/cache.ts`, `src/sidecar/server/routes/types.ts`

**Action:**
1. Create `src/sidecar/server/cache.ts`:
   - `export interface CacheEntry<T> { data: T; etag: string; expiresAt: number; }`
   - `export type CacheCategory = "snapshot" | "session" | "delegations" | "docs"`
   - `export class SidecarStateCache`
     - `private readonly #entries = new Map<string, CacheEntry<unknown>>()`
     - `private readonly #defaultTtls: Record<CacheCategory, number>` (snapshot: 5000ms, session: 2000ms, delegations: 2000ms, docs: 2000ms — per ER-S02-06, ER-S02-07)
     - `get<T>(key: string, category: CacheCategory): T | undefined` — returns cached data if `Date.now() < entry.expiresAt`, else undefined + evict
     - `set<T>(key: string, data: T, category: CacheCategory): string` — stores entry, computes SHA-256 ETag, returns etag; throws `[Harness]` on write failure
     - `invalidate(category: CacheCategory | "all"): void` — evicts matching keys (per D-SC02-02)
     - `private computeEtag(data: unknown): string` — `sha256(JSON.stringify(data)).hex()` (strong ETag with quotes per HTTP spec)
   - JSDoc + `@example` on all public methods
   - Use Node `crypto` module (`createHash('sha256')`)

2. Create `src/sidecar/server/routes/types.ts` (per C-S02-02):
   - `ToolResponse<T>` interface (matches UR-S02-03): `{ok: boolean, data?: T, error?: {code: string, message: string}, meta: {duration: number, tool: string}}`
   - Request types: `DelegateTaskRequest`, `DelegationStatusRequest`, `ExecuteSlashCommandRequest`, `HivemindTrajectoryRequest`, `HivemindSessionViewRequest`, `SessionPatchRequest`, `HivemindCommandEngineRequest`
   - Response types: `SnapshotResponse`, `SessionSummary[]`, `ChildSession[]`, `SessionContext`, `DelegationRecord[]`, `DocChunk[]`
   - WS message types: `WsClientMessage` union (subscribe/unsubscribe/abort), `WsServerMessage` union (delegation.output/status/notification)
   - Filter types: `SseFilterCategory = "session" | "delegation" | "trajectory" | "pressure" | "invalidate" | "heartbeat"`
   - Catalog types: `CatalogResponse` (re-export of json-render Catalog), `ToolCatalogEntry`, `ToolCatalogResponse`
   - Transport error codes (locked): `BAD_REQUEST`, `BAD_FILTER`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `PAYLOAD_TOO_LARGE`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `SESSION_NOT_FOUND`, `UNKNOWN_TOOL`, `INVALID_FILTER`
   - Zod schemas for each request type (use `z.object`)

**Verify:** `npx vitest run tests/sidecar/server/ -t "cache"` (if cache test exists in W0 scaffolds; otherwise manual unit test inline). `npm run typecheck` passes. JSDoc lint clean.

**Done:** `SidecarStateCache` + `routes/types.ts` exist; types compile; Zod schemas defined.

---

### Task 3: TOOL_HANDLERS dispatch map (tool-proxy/router.ts)

**Files:** `src/sidecar/server/tool-proxy/router.ts`

**Action:**
1. Create `src/sidecar/server/tool-proxy/router.ts`:
   - `export type ToolHandler<TArgs = unknown, TResult = unknown> = (args: TArgs, registry: SidecarDependencyRegistry) => Promise<{ok: true, data: TResult} | {ok: false, error: {code: string, message: string}}>`
   - `export const TOOL_HANDLERS: Record<string, ToolHandler>` — 7 entries (NOT yet implemented; placeholders that throw `[Harness] Tool not yet wired: <name>` — will be replaced in W2):
     - `delegate-task` → handler stub
     - `delegation-status` → handler stub
     - `execute-slash-command` → handler stub
     - `hivemind-trajectory` → handler stub
     - `hivemind-session-view` → handler stub
     - `session-patch` → handler stub
     - `hivemind-command-engine` → handler stub
   - `export const REGISTERED_WRITE_TOOLS = Object.keys(TOOL_HANDLERS) as Array<keyof typeof TOOL_HANDLERS>` — exported for handler.test.ts whitelist invariant check
   - `export function lookupToolHandler(name: string): ToolHandler | undefined` — returns handler or undefined
   - JSDoc on all exports
   - **Whitelist invariant test** (in `tests/sidecar/server/tool-proxy/router.test.ts` from W0): assert `REGISTERED_WRITE_TOOLS.every(t => t in Hooks.tool map at src/plugin.ts:727-749)` — this prevents accidental exposure of un-listed plugin tools (e.g., `bootstrap-init` mutates filesystem)

2. Inline comment at top of file: `// Per D-SC02-09: TOOL_HANDLERS is an explicit whitelist. Adding an 8th tool = add a new entry to this map + a new POST route stub in routes/tools.ts.`

**Verify:** `npx vitest run tests/sidecar/server/tool-proxy/router.test.ts -t "whitelist"` — the invariant test passes (TOOL_HANDLERS keys ⊆ Hooks.tool map keys); the handler stub tests fail (handlers throw not implemented, expected). `npm run typecheck` passes.

**Done:** `TOOL_HANDLERS` map with 7 entries (stubs); whitelist invariant test passes; types compile.

---

## Verification (per-wave merge gate for W1)

```bash
# Primary: handler test partially passes (404 fallback works)
npx vitest run tests/sidecar/server/handler.test.ts -t "404 fallback"
# Expected: 1+ tests pass (the 404 fallback test); other 16 endpoint tests still 404

# Secondary: typecheck passes
npm run typecheck
# Expected: 0 errors

# Tertiary: TOOL_HANDLERS whitelist invariant test passes
npx vitest run tests/sidecar/server/tool-proxy/router.test.ts -t "whitelist"
# Expected: 1+ tests pass

# Quaternary: SC-01 baseline still passes (no regression)
npx vitest run tests/sidecar/readonly-state.test.ts
# Expected: 59 tests pass (SC-01 regression check)
```

---

## Atomic Commit (W1)

**Commit message:**
```
phase(SC-02): W1 — SidecarRouter + SidecarStateCache + TOOL_HANDLERS map + factory extension

- src/sidecar/server/handler.ts (NEW, ≤200 LOC): SidecarRouter with method+path matching, 404 fallback, body size check (D-SC02-07)
- src/sidecar/server/cache.ts (NEW, ≤500 LOC): SidecarStateCache with 5s/2s TTLs + SHA-256 ETag (D-SC02-02, ER-S02-06, ER-S02-07)
- src/sidecar/server/routes/types.ts (NEW, ≤500 LOC): all request/response types, ToolResponse envelope (UR-S02-03), WS schemas, Zod validators (C-S02-02)
- src/sidecar/server/tool-proxy/router.ts (NEW, ≤200 LOC): TOOL_HANDLERS map (7 stubs) + whitelist invariant (D-SC02-09)
- src/sidecar/server/factory.ts (MODIFY, +30 LOC): accept routes?: Route[] option; preserve SC-01 behavior (port file, SIGTERM/SIGINT, /health)
- Wave 1 of 5; depends on W0 (red tests); blocks W2, W3
- Per CONTEXT §boundaries: factory is EXTENDED not REFACTORED; no other source touched
- 404 fallback test passes; whitelist invariant test passes; 16 endpoint tests still 404 (expected — W2/W3 territory)
```

---

## Stop Conditions (W1)

- ✅ `SidecarRouter` exists with 404 fallback working
- ✅ `SidecarStateCache` exists with 5s/2s TTLs + ETag computation
- ✅ `routes/types.ts` exists with all request/response types + Zod schemas
- ✅ `TOOL_HANDLERS` map has 7 stub entries + whitelist invariant test passes
- ✅ Factory extended (not refactored) with `routes?` option
- ✅ Typecheck passes; SC-01 baseline (59 tests) still passes
- ✅ Atomic commit captured
- ⏹️ STOP — W2 (REST routes) cannot start without this foundation

---

## Actors / Consumers (W1)

- **W2 implementer** (REST routes): imports `ToolResponse`, request types, `SidecarDependencyRegistry` from W1 outputs
- **W3 implementer** (real-time): imports WS message types from W1 `routes/types.ts`
- **W4 implementer** (integration): uses `SidecarRouter` to spin up real server

---

## Risk Mitigations Specific to W1

- **R-W1-FACTORY-REGRESSION** (factory extension breaks SC-01): mitigated by KEEPING existing logic (port file, SIGTERM, /health); only ADD `routes?` parameter; W4 integration test verifies full flow
- **R-W1-CACHE-RACE** (concurrent reads/writes): mitigated by `Map` atomic operations (Node single-threaded); per-key TTL check; JSDoc notes thread-safety assumption
- **R-W1-ETAG-COLLISION** (different data with same ETag): mitigated by SHA-256 of full JSON (collision probability ~0 for catalog <1MB); JSDoc notes hash is strong not weak

---

*plan-1.md authored 2026-06-03 — Wave 1 of 5 (core infrastructure)*
