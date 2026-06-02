# Phase SC-02: REST API + Tool Proxy — Context

**Gathered:** 2026-06-02
**Mode:** Auto (single-pass; user instruction "automate the loop, prefer your recommendations")
**Status:** Ready for planning

<domain>
## Phase Boundary

SC-02 transforms the SC-01 server scaffold — which currently returns `501 Not Implemented` on all non-`/health` routes — into the bounded HTTP / SSE / WebSocket surface that the Next.js 16 sidecar dashboard (SC-03) will consume. SC-02 ships 17 endpoints: 4 read-side state routes, 7 write-side tool proxy routes, 1 SSE event bus, 1 WebSocket delegation channel, and 2 catalog endpoints. Stays strictly within OpenCode's client-server architecture — defers all cross-cutting concerns (auth, rate limit, session, middleware) to the native OpenCode runtime.

This is the **plugin-side HTTP surface** — SC-03 (Next.js 16 app), SC-04 (Session Explorer), SC-05 (Delegation Dashboard), SC-06 (MEMS Browser), and SC-07 (Control Panel) all depend on the contract locked here.
</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**17 endpoint requirements are locked across 5 categories.** See `02-SPEC.md` for full requirements, boundaries, acceptance criteria, and the 6 Open Items resolved in this CONTEXT. Downstream agents MUST read `02-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- 4 read-side state endpoints: `/api/state/snapshot`, `/api/state/sessions`, `/api/state/sessions/{id}/children`, `/api/state/sessions/{id}/context`, `/api/state/sessions/{id}/delegations`, `/api/state/sessions/{id}/docs`
- 7 write-side tool proxy endpoints: `POST /api/tools/{delegate-task,delegation-status,execute-slash-command,hivemind-trajectory,hivemind-session-view,session-patch,hivemind-command-engine}`
- 1 SSE endpoint: `GET /api/events?filter=...` (30s heartbeat, 50-connection cap, 6 filter categories, 11 event types)
- 1 WebSocket endpoint: `WS /ws/delegation` (subscribe/unsubscribe/abort + delegation.output/status/notification)
- 2 catalog endpoints: `GET /api/catalog` (json-render spec, immutable) + `GET /api/catalog/tools` (12-tool metadata)
- New files: `src/sidecar/server/handler.ts` (HTTP router), `src/sidecar/server/routes/{state,sessions,tools,events,delegation-ws,catalog}.ts`, `src/sidecar/server/ws/delegation.ts`, `src/sidecar/server/cache.ts`, `src/sidecar/server/tool-proxy/router.ts`, `src/sidecar/server/tool-proxy/handlers/*.ts` (7 handlers), `src/sidecar/catalog/{json-render-catalog,tool-catalog}.ts`
- Test files: `tests/sidecar/server/handler.test.ts`, `tests/sidecar/server/routes/*.test.ts`, `tests/sidecar/server/ws/delegation.test.ts`, `tests/sidecar/server/tool-proxy/*.test.ts`, `tests/sidecar/integration/delegation.test.ts`

**Out of scope (from SPEC.md):**
- Authentication, authorization, rate limiting, request validation middleware — deferred to native OpenCode runtime
- json-render catalog generation toolchain — SC-02 only ships the pre-generated catalog
- Next.js 16 app, panel components, dashboard UI — SC-03+
- Server-side reconnection logic — clients reconnect
- Backpressure for slow SSE/WS consumers — pool closes connections that fall behind
- Multi-process / multi-instance coordination — single-process per OpenCode session
- Persistence layer for tool proxy results — delegation state owned by `DelegationManager`
</spec_lock>

<decisions>
## Implementation Decisions

12 decisions locked (6 from SPEC Open Items + 6 emergent). Auto-mode applied; user instruction was "minimize ping-pong, prefer your recommendations unless question is high-stakes" — no decisions flagged as high-stakes.

### SPEC Open Items (resolved)

#### D-SC02-01: Latency budget SLA
- Read endpoints: **50ms p95** under no load (matches AC-S02-01)
- Read endpoints: **100ms p95** under 10 concurrent clients (no SSE broadcast storm)
- Read endpoints: **250ms p95** under 50 SSE clients broadcasting at 10 events/s
- Tool POST endpoints: **500ms p95** for ack-only response (delegation dispatch is async-after-ack; the ack is fast, follow-up via SSE)
- Implementation: 3 performance test cases in `tests/sidecar/integration/performance.test.ts` gated by `SIDECAR_PERF` env var (skipped in CI by default; runs on release branches)

#### D-SC02-02: Cache invalidation signaling — defense-in-depth
- On `invalidate.cache` SSE event, the sidecar's in-process `SidecarStateCache` evicts matching category
- Categories: `"sessions" | "delegations" | "all"` (matches `Cache.invalidate()` interface from ARCHITECTURE §5.3)
- Client (Next.js) ALSO re-validates with `If-None-Match` ETag on next request
- Rationale: server-side eviction ensures fresh data; client revalidation closes the gap between event receipt and next request
- This is dual-layer by design, not a redundancy bug

#### D-SC02-03: WS backpressure — buffer then close with code 1013
- Per-connection buffer: **64 KB** (~4K messages * 16 bytes avg, or one large delegation.output frame)
- When buffer exceeds 64 KB: close WebSocket with **code 1013 ("Try Again Later")**
- Server does NOT drop individual messages silently — drop causes stale state, close is loud and recoverable
- Inherited cleanup pattern: on `send()` failure, close with code 1011 (server error)
- Client must reconnect after 1013; server does not replay buffered messages

#### D-SC02-04: Catalog versioning — SHA-256 ETag, no version field
- Compute SHA-256 of catalog JSON at startup (one-time cost)
- Serve `ETag: "<sha256-hex>"` header on `GET /api/catalog` and `GET /api/catalog/tools`
- Return `304 Not Modified` on revalidation with matching `If-None-Match`
- No `version` field in JSON body — response shape stays stable
- Rationale: standard HTTP, native browser/CDN caching works, no schema drift
- Hash is recomputed only at process start (catalog is immutable)

#### D-SC02-05: Test fixture strategy — mocks for unit, real for one integration
- Unit tests (per route/handler): vitest mocks for `SidecarDependencyRegistry` and downstream managers (`DelegationManager`, `SessionTracker`, etc.)
- Mocks live at `tests/sidecar/__mocks__/` using vitest's `vi.mock()` pattern
- **One** integration test (AC-S02-11 end-to-end delegation): real `DelegationManager` + real `SseConnectionPool` + real server bound to port 0
- Integration test isolated to `tests/sidecar/integration/delegation.test.ts` and gated by `describe.skip` if `process.env.SIDECAR_INTEGRATION` is unset (default: skipped in fast CI, enabled in nightly/release)
- Rationale: fast unit feedback (sub-second per test) + one real end-to-end test for the critical delegation AC

#### D-SC02-06: Error response shape — dual-channel (intentional, confirmed)
- Transport errors (HTTP 400/404/405/500/503): raw `{ error: { code, message } }` JSON
- App errors (tool returned failure): `HTTP 200` + `ToolResponse.error = { code, message, data? }`
- Rationale: client distinguishes "I screwed up the request" (transport) vs "the tool failed at the app layer" (app)
- This is the locked R2 Q1 decision; not a bug to unify
- Transport code vocabulary (locked): `BAD_REQUEST` (400), `BAD_FILTER` (400), `NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405), `PAYLOAD_TOO_LARGE` (413), `INTERNAL_ERROR` (500), `SERVICE_UNAVAILABLE` (503 for registry not ready)
- App code vocabulary: mirrors existing plugin tool error codes (e.g., `DELEGATION_FAILED`, `INVALID_AGENT`, `SESSION_NOT_FOUND`, `FORBIDDEN_PATH`)

### Emergent Decisions (SC-02 surface design)

#### D-SC02-07: HTTP request body size limit
- Read endpoints: 0 bytes (no body; reject if body present)
- Tool POST endpoints: **256 KB** hard cap (enforced via `Content-Length` check before `body` parse; return 413 `PAYLOAD_TOO_LARGE` on exceed)
- SSE GET: 0 (no body)
- Rationale: 256KB covers worst-case `prompt` (32KB) + `context` (64KB) + metadata (16KB) + safety margin; larger payloads should use a real file upload pattern (out of scope)
- Implementation: size check in `src/sidecar/server/handler.ts` BEFORE handing to route modules

#### D-SC02-08: SSE filter parsing & normalization
- `?filter=session,delegation,trajectory,pressure,invalidate,heartbeat` — comma-separated, exact match against the 6 filter categories
- Missing/empty `filter` query param: subscribe to all categories (default)
- Unknown filter value: **400 BAD_FILTER** with message listing valid values
- Whitespace trimmed; case-sensitive; duplicates deduplicated
- Filter parsed in `src/sidecar/server/routes/events.ts` BEFORE `pool.addClient()` (fail fast, no half-subscribed state)
- Mapping filter category → event types lives in a const map: `session` → 5 types, `delegation` → 4 types, `trajectory` → 0 (reserved SC-04+), `pressure` → 0 (reserved SC-04+), `invalidate` → 1, `heartbeat` → 1

#### D-SC02-09: Tool handler registration — explicit map, no reflection
- Tool handler map: `TOOL_HANDLERS: Record<string, ToolHandler>` at `src/sidecar/server/tool-proxy/router.ts`
- All 7 write tools explicitly registered (no dynamic discovery of the 27 plugin tools)
- Adding an 8th tool = add a new entry to the map + a new POST route stub
- Rationale: explicit > implicit, easy to audit at code review, prevents accidental exposure of un-listed plugin tools (e.g., `bootstrap-init` mutates filesystem — would violate SIDECAR-03)
- The 12-tool "exposed vs not exposed" table from ARCHITECTURE §6.4 is the whitelist; 5 of those 12 are read tools served by `/api/state/sessions/*` not `/api/tools/*`, so only 7 appear in the handler map

#### D-SC02-10: WS connection limit + heartbeat
- Per-process **50-connection cap** (mirror SSE)
- Server-initiated `delegation.status` heartbeat at **30s** interval if no other traffic (analogous to SSE heartbeat)
- Client heartbeat: NOT required (server heartbeats are sufficient to detect dead connections)
- Dead connection cleanup: on `send()` failure (EPIPE/ECONNRESET), close with **code 1011** (server error)
- Implementation: `WsConnectionPool` mirrors `SseConnectionPool` structure (same cap, same heartbeat cadence, same cleanup-on-failure pattern)

#### D-SC02-11: Catalog memory model — single shared reference, lazy load
- Both `/api/catalog` and `/api/catalog/tools` return the SAME in-memory constant object — no re-parse on each request
- Object is parsed from JSON at first request (lazy) and frozen via `Object.freeze()` (deep) to prevent mutation
- JSON source files: `src/sidecar/catalog/json-render-catalog.json` + `src/sidecar/catalog/tool-catalog.json`
- Loaded at server startup (step 5.5 sidecar init); if files missing → `INTERNAL_ERROR` 500 at first request (not a fatal init error — Next.js can still render panels that don't need catalog)
- Rationale: zero per-request cost, prevents accidental mutation, single source of truth, simple invalidation story (restart = new hash)

#### D-SC02-12: Sidecar port discovery — same port file, no env var
- Discovery mechanism: `.hivemind/state/sidecar-port.json` (written by SC-01 factory at step 5.5)
- No env var override (port is intentionally ephemeral, single-process per OpenCode session)
- No CLI flag (plugin process is the only owner of the port)
- If port file missing or unreadable: SC-03 shows "Sidecar not available" state (inherits SC-01 D-SC01-04 behavior)
- Rationale: ephemeral by design (random port 0), single discovery point, no env pollution, no new contract surface

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Design
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` — Complete sidecar architecture (1113 LOC): API endpoint design (§4, 322 LOC), state bridge design (§5, 100 LOC), tool proxy design (§6, 70 LOC), security model (§8), file structure (§9)
- `.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` — ~85 integration surface audit across all plugin modules (informs which tools can be safely exposed)
- `.hivemind/planning/sidecar-vision/landscape.md` — Sidecar landscape overview

### Phase Documents
- `.planning/phases/SC-02-rest-api-tool-proxy/02-SPEC.md` — Locked requirements (MUST read before planning; 17 endpoints, 6 Open Items now resolved by D-SC02-01..06)
- `.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md` — SC-01 SPEC (foundation constraints: server, registry, SSE pool, type system)
- `.planning/phases/SC-01-sidecar-foundation/SC-01-CONTEXT.md` — SC-01 decisions (14 decisions; D-SC01-01..14; SC-02 inherits server factory, registry, SSE pool patterns)
- `.planning/phases/SC-01-sidecar-foundation/SC-01-PLAN.md` — Existing SC-01 plan (reference for TDD + atomic commit patterns)
- `.planning/phases/SC-01-sidecar-foundation/SC-01-SECURITY.md` — SC-01 security threat verification (7 threats closed, 1 accepted)

### Codebase References
- `src/sidecar/types.ts` — `SidecarEventType` (11 members), `SidecarEvent`, `DirectoryEntry` (NEW in SC-01)
- `src/sidecar/server/factory.ts` — `createSidecarServer()`, `SidecarServerHandle`, `SidecarServerOptions` (SC-01 pattern)
- `src/sidecar/server/registry.ts` — `SidecarDependencyRegistry` (lazy binding; SC-02 will use existing setters/getters)
- `src/sidecar/server/sse/pool.ts` — `SseConnectionPool` (50 cap, 30s heartbeat, dead conn cleanup)
- `src/sidecar/readonly-state.ts` — `isCanonicalStatePath()`, `readCanonicalStateAsync()`, `refuseCanonicalWrite()` (SIDECAR-03 enforcement, 4 CANONICAL_PREFIXES)
- `src/plugin.ts` — Step 5.5 sidecar init (already wired in SC-01; SC-02 doesn't touch plugin.ts)
- `src/coordination/delegation/manager.ts` — `DelegationManager` (target of `delegate-task`, `delegation-status`, `delegate-cancel` tool wrappers)

### Prior Decisions (inherited)
- `.planning/REQUIREMENTS.md` §Q2 — Artifact-Focused Sidecar (Next.js + @json-render/react, READ-ONLY)
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/architecture/VALIDATION-DECISIONS-2026-04-25.md` — Q1-Q6 architectural locks (Q1: hybrid + spec-driven; Q2: artifact-focused sidecar; Q5: full RICH gate; Q6: `.hivemind/` canonical)
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership (OpenCode primitives vs internal state vs source-of-truth)
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Lineage contract (hm/hf/gate/stack/gsd), L0-L3 hierarchy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (from SC-01)
- `src/sidecar/types.ts` (53 LOC) — `SidecarEventType` (11 members), `SidecarEvent`, `DirectoryEntry` — SC-02 will import these and add 2 new event types: `ws.dialed` (WS connection opened), `ws.closed` (WS connection closed) IF observability is needed; otherwise reuse existing 11.
- `src/sidecar/server/factory.ts` (114 LOC) — `createSidecarServer()` already returns `{ port, close }`; SC-02 will EXTEND this factory to register routes (route registration becomes a `routes: Route[]` option, not a refactor of the factory itself)
- `src/sidecar/server/registry.ts` (SC-01 output) — `SidecarDependencyRegistry` with 6 setters and `isReady()`; SC-02 will call getters from route handlers via dependency injection (registry passed to route modules at startup)
- `src/sidecar/server/sse/pool.ts` (146 LOC) — `SseConnectionPool` (50 cap, 30s heartbeat); SC-02's SSE route uses this pool via the registry
- `src/sidecar/readonly-state.ts` (139 LOC) — 4 `CANONICAL_PREFIXES` (`[".hivemind/state", ".hivemind/session-tracker", ".opencode", ".planning"]`), `isCanonicalStatePath()`, `readCanonicalStateAsync()`, `refuseCanonicalWrite()` — SC-02 state routes call these to read session/snapshot data
- `tests/sidecar/readonly-state.test.ts` (SC-01 output) — Existing 59 tests must continue passing

### Established Patterns
- **Zero-dependency HTTP server:** Node `http.createServer` + zero framework deps (no Express/Fastify). SC-02 must keep this; all 17 endpoints route through a single `(req, res)` handler in `handler.ts` with manual path matching.
- **CQRS boundary:** Tools write, hooks observe. State routes are READ-only consumers of canonical state (use `readCanonicalStateAsync`, never `refuseCanonicalWrite`). Tool routes are WRITE (delegate through `DelegationManager`).
- **Lazy initialization:** Server starts before all modules are constructed. Route modules receive `registry` and resolve dependencies at request time (not module load time).
- **Error prefix:** `[Harness]` on all thrown errors; transport errors return `{ error: { code, message } }` JSON with `Content-Type: application/json`.
- **Module structure:** Feature modules in `src/features/`, tools in `src/tools/`, shared in `src/shared/`, sidecar in `src/sidecar/`. SC-02 lives entirely under `src/sidecar/server/routes/`, `src/sidecar/server/ws/`, `src/sidecar/server/tool-proxy/`, `src/sidecar/catalog/`.

### Integration Points
- `src/sidecar/server/handler.ts` — NEW main HTTP router; receives `(req, res)` from `factory.ts` and dispatches to one of 6 route modules (state, sessions, tools, events, catalog, default 404). This is the SINGLE point of method+path matching.
- `src/sidecar/server/routes/events.ts` — NEW SSE route; subscribes client to `SseConnectionPool` with parsed filter set; calls `pool.addClient(controller)` and stashes the conn ID for cleanup on `req.on('close')`.
- `src/sidecar/server/routes/delegation-ws.ts` — NEW WS upgrade handler; performs `sec-websocket-protocol` check, then hands to `WsDelegationHandler` at `src/sidecar/server/ws/delegation.ts`.
- `src/sidecar/server/ws/delegation.ts` — NEW WS handler; subscribes to `DelegationManager` events for the requested `delegationId` and forwards as `delegation.output/status/notification` frames.
- `src/sidecar/server/tool-proxy/router.ts` — NEW tool handler map; 7 entries, each delegating to plugin `delegate-task`/`delegation-status`/etc. via registry.
- `src/sidecar/server/cache.ts` — NEW `SidecarStateCache` (implements ARCHITECTURE §5.3 interface); used by state routes to satisfy 304 revalidation and 5s/2s TTLs.
- `src/sidecar/catalog/{json-render-catalog,tool-catalog}.ts` — NEW typed wrappers around the JSON catalog files; both exports a `readonly` constant.
- `src/plugin.ts` — NO CHANGES in SC-02; factory extended in-place, registry already has 6 setters that SC-02 will USE (not extend).

### Architectural Constraints (inherited from SC-01 + ARCHITECTURE)
- Two-server model: plugin HTTP (localhost random port) + Next.js (port 3099)
- Plugin server binds to `127.0.0.1` only — no external network access
- Random port (0) — fixed ports only in tests (port 0 → OS-assigned)
- Server must NOT block plugin init completion (fire-and-forget)
- `ws` in optionalDependencies — plugin works without WS available; routes must degrade gracefully (return 503 `SERVICE_UNAVAILABLE` if WS unavailable)
- No new dependencies allowed in SC-02 — use existing `zod` (for request validation), `ws` (optionalDep), `@opencode-ai/plugin` (peer)
- SIDECAR-03: sidecar MUST NOT write to canonical state (`refuseCanonicalWrite` is the last-line guard; SC-02 enforces this in session-patch path gate)

</code_context>

<specifics>
## Specific Ideas

No specific user requirements beyond the SPEC, architecture docs, and the 6 Open Items from `02-SPEC.md` (all resolved as D-SC02-01..06). All 12 decisions follow standard HTTP/SSE/WS patterns and inherit established conventions from SC-01 (SseConnectionPool, SidecarDependencyRegistry, port file discovery).

**Architectural follow-ups for later phases (not SC-02 scope):**
- WS backpressure: 64KB buffer + code 1013 may need adjustment based on real delegation.output frame sizes observed in production. Tracked as future-tuning, not a SC-02 redesign.
- Catalog hash: SHA-256 of full JSON is fine for catalogs <1MB; if catalog grows beyond 5MB, consider Merkle tree or versioned sub-catalogs. Not a SC-02 concern.
- 50-connection SSE+WS cap: per-process; multi-process coordination deferred (out of scope per SPEC non-goals).

</specifics>

<deferred>
## Deferred Ideas

- **Request routing infrastructure beyond 17 endpoints** — 17 endpoints is the SC-02 contract; any new endpoint (e.g., `/api/state/sessions/{id}/metrics`, `/api/state/agents`) is a new phase.
- **WS server-initiated messages beyond delegation events** — e.g., `server.shutdown` (graceful shutdown signal), `server.config.changed` (runtime config push) — not in SC-02 scope; SC-01 SSE heartbeat + per-request health is sufficient.
- **Compression for SSE/WS frames** — `gzip`/`deflate` on `Content-Encoding` for SSE; `permessage-deflate` for WS — not in SC-02 scope; frame sizes are small (event payloads are <16KB typical), browser DevTools shows uncompressed for debugging convenience.
- **Auth/identity propagation** — even though localhost-only, no propagation of `delegationId` ownership or session ownership beyond the 7-tool whitelist. The OpenCode runtime owns identity (per SPEC top-level constraint).
- **Catalog generation toolchain** — generating the json-render catalog from component definitions; SC-02 ships the pre-generated JSON only. Toolchain deferred to a separate authoring phase.
- **SSE/WS OpenAPI / AsyncAPI spec export** — could emit machine-readable spec for SC-03 to consume, but the SC-02 hand-written `SidecarClient` (in SC-03's `plugin-client.ts`) is simpler and self-documenting.

None — discussion stayed within phase scope (no need to escalate to user).

</deferred>

<boundaries>
## Execution Boundaries (planner-facing)

### Allowed Surfaces
- **Files to create:** all under `src/sidecar/server/`, `src/sidecar/catalog/`, `tests/sidecar/`
- **Files to modify:** `src/sidecar/server/factory.ts` (extend with route registration option ONLY); nothing else
- **Tests to add:** under `tests/sidecar/server/`, `tests/sidecar/routes/`, `tests/sidecar/server/ws/`, `tests/sidecar/server/tool-proxy/`, `tests/sidecar/integration/`
- **New files in `src/sidecar/server/handler.ts`:** the single HTTP router (one file ≤500 LOC)
- **New files in `src/sidecar/server/routes/`:**
  - `state.ts` (snapshot) ≤500 LOC
  - `sessions.ts` (5 session-scoped reads) ≤500 LOC
  - `tools.ts` (7 tool POST routes) ≤500 LOC
  - `events.ts` (SSE route) ≤500 LOC
  - `catalog.ts` (2 catalog GETs) ≤500 LOC
- **New files in `src/sidecar/server/ws/`:**
  - `delegation.ts` (WS handler) ≤500 LOC
- **New files in `src/sidecar/server/tool-proxy/`:**
  - `router.ts` (TOOL_HANDLERS map) ≤500 LOC
  - `handlers/{delegate-task,delegation-status,execute-slash-command,hivemind-trajectory,hivemind-session-view,session-patch,hivemind-command-engine}.ts` (7 handlers, each ≤500 LOC)
- **New files in `src/sidecar/server/cache.ts`:** `SidecarStateCache` (≤500 LOC)
- **New files in `src/sidecar/catalog/`:** `json-render-catalog.ts` + `tool-catalog.ts` (typed wrappers, ≤500 LOC combined)
- **JSON assets to author:** `src/sidecar/catalog/json-render-catalog.json` + `src/sidecar/catalog/tool-catalog.json`
- **JSDoc on every new export** per AGENTS.md requirement

### Forbidden Surfaces
- ❌ DO NOT touch `src/plugin.ts` (step 5.5 already wires SC-01 factory; SC-02 only EXTENDS the factory options)
- ❌ DO NOT touch `src/sidecar/server/registry.ts` (existing 6 setters are sufficient)
- ❌ DO NOT touch `src/sidecar/server/sse/pool.ts` (50 cap + 30s heartbeat inherited; SC-02 USES not MODIFIES)
- ❌ DO NOT touch `src/sidecar/types.ts` unless 2 new event types are needed (avoid scope creep)
- ❌ DO NOT touch other phases' source (SC-01, SC-03, SC-04-06, P-XX) — strictly SC-02 surface
- ❌ DO NOT add new npm dependencies — use existing `zod`, `ws` (optionalDep), `@opencode-ai/plugin` (peer)
- ❌ DO NOT add auth, rate limit, validation middleware, session management — OpenCode runtime owns these
- ❌ DO NOT bind to fixed ports — use `127.0.0.1:0` per SC-01 pattern
- ❌ DO NOT implement SSE/WS reconnection, catalog generation toolchain, Next.js components
- ❌ DO NOT mutate `CANONICAL_PREFIXES` paths (`.hivemind/state`, `.hivemind/session-tracker`, `.opencode`, `.planning`) — `refuseCanonicalWrite` is the last-line guard
- ❌ DO NOT skip the integration test (AC-S02-11) — it is the only real end-to-end coverage

### Actors / Consumers
- **SC-03 (Next.js 16 sidecar app, port 3099)** — primary consumer of all 17 endpoints; uses `@hivemind/sidecar-client` (typed wrapper, generated in SC-03)
- **SC-04 (Session Explorer panel)** — reads `/api/state/sessions/*` + SSE `session.*` events
- **SC-05 (Delegation Dashboard panel)** — reads `/api/state/sessions/{id}/delegations` + WS `delegation.output/status/notification`
- **SC-06 (MEMS Browser panel)** — reads `/api/catalog` (json-render spec) + `/api/catalog/tools`
- **SC-07+ (Control Panel, future)** — reads `/api/state/snapshot` + SSE `invalidate.cache` events
- **Plugin code (internal, not external consumer):** 7 write tools exposed via `POST /api/tools/*` are thin wrappers around plugin tools (`delegate-task`, etc.) — same code paths, different transport

### Verification Commands
- **Unit tests (default CI):** `pnpm vitest run tests/sidecar/` — must include `readonly-state` (SC-01 regression) + new SC-02 tests
- **Integration test (gated):** `SIDECAR_INTEGRATION=1 pnpm vitest run tests/sidecar/integration/` — runs delegation end-to-end with real `DelegationManager` + real `SseConnectionPool`
- **Performance baselines (gated):** `SIDECAR_PERF=1 pnpm vitest run tests/sidecar/integration/performance.test.ts` — validates D-SC02-01 p95 SLAs
- **Type check:** `pnpm typecheck` (must pass with no errors)
- **Full test suite:** `pnpm test` — must remain 2,963+ tests passing (SC-01 baseline) + new SC-02 tests
- **Build:** `pnpm build` — must complete without errors; new `dist/sidecar/server/routes/*.js` and `dist/sidecar/server/ws/delegation.js` must exist
- **Manual smoke:** start plugin, hit `http://127.0.0.1:<port>/api/state/snapshot` (from port file), verify SSE via `curl -N`, verify WS via `wscat`

### Stop Conditions
- ✅ All 12 decisions documented in `02-CONTEXT.md`
- ✅ CONTEXT.md committed to `feature/harness-implementation` with `phase: SC-02 CONTEXT — 12 decisions locked` (or similar)
- ✅ Commit hash captured
- ✅ Final return to L0 includes: file path, commit hash, 12 decision IDs + 1-line summaries, `READY_FOR_RESEARCH_PHASE: true`, open risks list
- ⏹️ STOP — do NOT auto-start research-phase (L0 will dispatch `/gsd-research-phase SC-02` next)
- ⏹️ STOP — do NOT touch other phases' source or planning artifacts

</boundaries>

---

*Phase: SC-02-REST-API-Tool-Proxy*
*Context gathered: 2026-06-02*
*Auto-mode applied: 12 decisions, 0 questions, 0 escalations*
*Next step: /gsd-research-phase SC-02 — validate library versions, current package.json, performance baselines before PLAN*
