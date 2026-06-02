# Phase SC-02: REST API + Tool Proxy — SPEC

**Phase ID:** SC-02
**Phase Name:** REST API + Tool Proxy
**Status:** SPEC (locked, ready for discuss-phase)
**Locked:** 2026-06-02
**Depends on:** SC-01 (Foundation — Plugin HTTP Server + State Bridge)
**Blocks:** SC-03, SC-04, SC-05, SC-06
**Ambiguity Score:** 0.075 (composite, post-Round 2)

---

## Goal

SC-02 transforms the SC-01 server scaffold — which currently returns `501 Not Implemented` on all non-`/health` routes — into the bounded HTTP / SSE / WebSocket surface that the Next.js 16 sidecar dashboard (SC-03) will consume. SC-02 ships:

1. **Read-side state endpoints** (4 routes) — aggregated snapshot + per-session reads for sessions/children/context/delegations/docs
2. **Write-side tool proxy** (7 routes) — `POST /api/tools/{toolName}` wrapping the 7 write-capable plugin tools behind a single `ToolResponse<T>` envelope
3. **SSE event bus** — `GET /api/events?filter=...` pushing 11 event types from `SseConnectionPool` (30s heartbeat, 50-connection cap, per-process)
4. **WebSocket delegation channel** — `WS /ws/delegation` for subscribe / unsubscribe / abort control + delegation.output/status/notification push
5. **Catalog endpoints** — `GET /api/catalog` (pre-generated json-render spec, immutable) + `GET /api/catalog/tools` (12-tool metadata list, immutable)

SC-02 stays strictly within OpenCode's client-server architecture by deferring **all** cross-cutting concerns (auth, rate limit, session management, middleware) to the native OpenCode runtime — it adds none of its own.

---

## Architectural Constraint (TOP-LEVEL, non-negotiable)

SC-02 is a **bounded sidecar**. It strictly aligns to OpenCode's client-server architecture by:

- **Reusing the OpenCode SDK + server API** for all cross-cutting concerns (auth, rate limit, session validation, request signing).
- **NOT implementing** its own authentication, authorization, rate limiting, request validation middleware, or session storage. These concerns are owned by the native OpenCode runtime.
- **Binding exclusively to `127.0.0.1`** (loopback only) on a random port at server startup. The consuming process (Next.js 16 app in SC-03, local CLI, OpenCode client) is assumed to be trusted.
- **Mirroring the OpenCode SDK response shape** for all tool proxy results via a single `ToolResponse<T>` envelope.
- **Reusing the existing `SidecarDependencyRegistry`** (from SC-01) for all module dependencies — no new singletons, no new global state.

Rationale: the native OpenCode runtime already provides the full client-server contract. Duplicating auth/rate-limit/middleware in the sidecar would create drift, double the surface area, and contradict OpenCode's own architecture. The sidecar is a **bounded, faithful projection** of OpenCode's existing contract — nothing more.

---

## Non-Goals (TOP-LEVEL, explicit deferrals)

SC-02 will **NOT** implement the following — these are explicitly out of scope and deferred:

- ❌ **Authentication, authorization, session validation** — deferred to native OpenCode runtime
- ❌ **Rate limiting, throttling, request quotas** — deferred to native OpenCode runtime
- ❌ **Per-client connection quotas** beyond the global 50-connection SSE cap
- ❌ **Persistence layer for tool proxy results** — delegation state owned by `DelegationManager`, not sidecar
- ❌ **Multi-process / multi-instance coordination** — sidecar is single-process per OpenCode session
- ❌ **Long-term storage of SSE/WS subscriber state** — server lifetime only, no replay
- ❌ **json-render catalog generation toolchain** — SC-02 only ships the pre-generated catalog; generation is out of scope
- ❌ **Next.js 16 app, panel components, dashboard UI** — all deferred to SC-03+
- ❌ **Reconnection logic on the server side** — clients are responsible for reconnect; server only emits events
- ❌ **Backpressure for slow SSE/WS consumers** — pool closes connections that fall behind (inherited from SC-01 `SseConnectionPool`)

---

## Scope

### In Scope (SC-02 ships)

| # | Capability | Endpoint(s) | Method | Source / Foundation |
|---|------------|-------------|--------|---------------------|
| 1 | State snapshot | `/api/state/snapshot` | `GET` | SC-01 `listCanonicalDirectory()` + cache |
| 2 | Session list | `/api/state/sessions` | `GET` | session-tracker (read-only) |
| 3 | Session children | `/api/state/sessions/{sessionId}/children` | `GET` | session-hierarchy |
| 4 | Session context | `/api/state/sessions/{sessionId}/context` | `GET` | session-context |
| 5 | Session delegations | `/api/state/sessions/{sessionId}/delegations` | `GET` | session-delegation-query |
| 6 | Session docs | `/api/state/sessions/{sessionId}/docs` | `GET` | hivemind-doc (read-only) |
| 7 | Tool: delegate-task | `/api/tools/delegate-task` | `POST` | plugin `delegate-task` |
| 8 | Tool: delegation-status | `/api/tools/delegation-status` | `POST` | plugin `delegation-status` |
| 9 | Tool: execute-slash-command | `/api/tools/execute-slash-command` | `POST` | plugin `execute-slash-command` |
| 10 | Tool: hivemind-trajectory | `/api/tools/hivemind-trajectory` | `POST` | plugin `hivemind-trajectory` |
| 11 | Tool: hivemind-session-view | `/api/tools/hivemind-session-view` | `POST` | plugin `hivemind-session-view` |
| 12 | Tool: session-patch (restricted) | `/api/tools/session-patch` | `POST` | plugin `session-patch` (path-gated) |
| 13 | Tool: hivemind-command-engine (discover) | `/api/tools/hivemind-command-engine` | `POST` | plugin `hivemind-command-engine` (action: discover only) |
| 14 | SSE event stream | `/api/events?filter=...` | `GET` | SC-01 `SseConnectionPool` |
| 15 | WebSocket delegation | `/ws/delegation` | `WS` (upgrade) | new `WsDelegationHandler` |
| 16 | json-render catalog | `/api/catalog` | `GET` | in-memory constant (loaded at startup) |
| 17 | Tool catalog | `/api/catalog/tools` | `GET` | in-memory constant (loaded at startup) |

**Total: 17 endpoints** (4 snapshot/state + 5 session-scoped read + 7 tool-write + 1 SSE + 1 WS + 2 catalog = 20 if you count nested variants, but the 17 above are the route handlers).

### Out of Scope (SC-02 does NOT ship)

- All Non-Goals listed above
- Phase 3+ (Next.js 16 app, panels, dashboard)
- Phase 4+ (panel-specific read tools beyond the 5 listed)
- Phase 5+ (panel-specific write tools beyond the 7 listed)
- Phase 6+ (cross-panel coordination, persistence, export)

---

## Tool Proxy Surface (locked from ARCHITECTURE §6.4)

### Write Tools (7) — `POST /api/tools/{toolName}`

| Tool Name | Source Plugin Tool | Request Body Schema | Notes |
|-----------|-------------------|---------------------|-------|
| `delegate-task` | `delegate-task` | `{agent, prompt, context?, stackOnSessionId?}` | Async dispatch; returns delegationId |
| `delegation-status` | `delegation-status` | `{delegationId?, action?}` | `action` ∈ `find-stackable`, `status`, `list` |
| `execute-slash-command` | `execute-slash-command` | `{command, arguments?, agent?, subtask?}` | Sync/async depending on `subtask` |
| `hivemind-trajectory` | `hivemind-trajectory` | `{action, trajectoryId?, ...}` | `action` ∈ `inspect`, `traverse`, `attach`, `event` |
| `hivemind-session-view` | `hivemind-session-view` | `{action: "get", sessionId}` | Aggregated 3-root session view |
| `session-patch` | `session-patch` | `{sessionFilePath, section, newContent}` | **Path-restricted** (see UB-S02-01) |
| `hivemind-command-engine` | `hivemind-command-engine` | `{action: "discover" \| "list_commands", commandName?}` | Discover-only via sidecar |

### Read Tools (5) — `GET /api/state/sessions/...`

| Tool Name | Source | Path | Response Type |
|-----------|--------|------|---------------|
| `session-tracker` | `session-tracker` (read-only) | `GET /api/state/sessions` | `SessionSummary[]` |
| `session-hierarchy` | `session-hierarchy` | `GET /api/state/sessions/{sessionId}/children` | `ChildSession[]` |
| `session-context` | `session-context` | `GET /api/state/sessions/{sessionId}/context` | `SessionContext` |
| `session-delegation-query` | `session-delegation-query` | `GET /api/state/sessions/{sessionId}/delegations` | `DelegationRecord[]` |
| `hivemind-doc` | `hivemind-doc` (read-only) | `GET /api/state/sessions/{sessionId}/docs` | `DocChunk[]` |

**Rationale for the 12-tool selection** (per ARCHITECTURE §6.4): expose only tools that are either read-only or write-safe (delegation dispatch, session patch with path guard, command discover). Excluded: `configure-primitive`, `bootstrap-init`, `bootstrap-recover` (filesystem mutation to `.opencode/`, SIDECAR-03 violation); `prompt-skim`, `prompt-analyze`, `validate-restart` (agent-only); `run-background-command`, `tmux-copilot`, `tmux-state-query` (PTY/terminal context); `create-governance-session` (agent-initiated).

---

## Requirements (EARS-format, 5 families)

### Ubiquitous Requirements (always-on)

- **UR-S02-01** — The sidecar shall bind to `127.0.0.1` on a random port (assigned by OS) at startup, and shall write the chosen port to `.hivemind/state/sidecar-port.json` within 100ms of accepting the first connection.
  - *Inherited from SC-01, retained verbatim.*

- **UR-S02-02** — The sidecar shall NOT implement authentication, authorization, rate limiting, or any cross-cutting request middleware. The native OpenCode runtime owns these concerns.
  - *Top-level architectural constraint (this SPEC, locked in Round 1 Q3).*

- **UR-S02-03** — The sidecar shall return a `ToolResponse<T>` envelope on all `POST /api/tools/*` endpoints with the exact shape: `{ok: boolean, data?: T, error?: {code: string, message: string}, meta: {duration: number, tool: string}}`.
  - *Locked from ARCHITECTURE §4.2 + Round 2 Q1.*

- **UR-S02-04** — The sidecar shall use `import type` for all type-only imports and shall produce no `any` types in endpoint request/response definitions.
  - *Project-wide TypeScript discipline (AGENTS.md).*

### Event-Driven Requirements

- **ER-S02-01** — When a client sends `POST /api/tools/{toolName}` with a registered tool name, the sidecar shall dispatch to the corresponding plugin tool through `SidecarDependencyRegistry` and shall return a `ToolResponse<T>` envelope with `meta.duration` measured in milliseconds from request receipt to response generation.

- **ER-S02-02** — When a client sends `GET /api/events` (with optional `?filter=...`), the sidecar shall register the client in `SseConnectionPool` and shall push events matching the filter. The sidecar shall emit a heartbeat event every 30 seconds on idle connections.

- **ER-S02-03** — When a client sends a WS message of type `subscribe` with `{delegationId}`, the sidecar shall register the client's interest in that delegationId and shall forward subsequent `delegation.output`, `delegation.status`, and `delegation.notification` events to the client.

- **ER-S02-04** — When a client sends a WS message of type `unsubscribe` with `{delegationId}`, the sidecar shall remove the listener and shall stop forwarding events for that delegationId.

- **ER-S02-05** — When a client sends a WS message of type `abort` with `{delegationId}`, the sidecar shall call `DelegationManager.abort(delegationId)` and shall emit a `delegation.status` event with `status: "aborted"`.

- **ER-S02-06** — When a client sends `GET /api/state/snapshot`, the sidecar shall aggregate state from all 4 canonical prefixes (`.hivemind/state`, `.hivemind/session-tracker`, `.opencode`, `.planning`) and shall return with 5-second TTL cache + ETag-based revalidation.

- **ER-S02-07** — When a client sends `GET /api/state/sessions/{sessionId}/...`, the sidecar shall look up the session in session-tracker and shall return the scoped payload with 2-second TTL cache + ETag.

### State-Driven Requirements

- **SR-S02-01** — While the SSE connection pool is at the 50-connection cap (per-process), the sidecar shall reject new SSE connection attempts with HTTP 503 and a `Retry-After: 5` header.

- **SR-S02-02** — While a session-scoped read tool endpoint is invoked for a `sessionId` that does not exist in session-tracker, the sidecar shall return HTTP 404 with a JSON body of `{error: {code: "SESSION_NOT_FOUND", message: "..."}}` (note: transport-level 4xx, not the `ToolResponse` envelope).

- **SR-S02-03** — While the plugin is shutting down and the sidecar receives a new request, the sidecar shall reject with HTTP 503 and a `Connection: close` header.

### Optional Features

- **OF-S02-01** — Where the client provides `?filter=session,delegation,trajectory,pressure,invalidate,heartbeat` on `GET /api/events`, the sidecar shall push only events whose type belongs to the listed categories (allowlist). A missing or empty filter value shall default to all 11 event types.

- **OF-S02-02** — Where the client invokes `POST /api/tools/session-patch`, the sidecar shall validate `sessionFilePath` via `isSidecarSessionFilePath()` **before** dispatching to the plugin tool. The validation is a precondition, not a side effect.

- **OF-S02-03** — Where the client provides `If-None-Match: <etag>` on a cached state endpoint, the sidecar shall return HTTP 304 (Not Modified) with no body if the ETag matches the current cached value.

### Unwanted Behaviors

- **UB-S02-01** — If `sessionFilePath` matches a canonical state path (`.hivemind/state`, `.hivemind/session-tracker`, `.opencode`, `.planning`), then the sidecar shall reject the request with `ToolResponse.ok = false` and `error.code = "FORBIDDEN_PATH"`, with HTTP 200 (no side-effect, no plugin dispatch).

- **UB-S02-02** — If the request body is malformed JSON, or if required fields are missing for a registered tool, then the sidecar shall return HTTP 400 with a JSON body of `{error: {code: "VALIDATION_ERROR", message: "..."}}` (transport-level).

- **UB-S02-03** — If the `toolName` path segment on `POST /api/tools/*` does not match any of the 7 registered write tools, then the sidecar shall return HTTP 404 with `{error: {code: "UNKNOWN_TOOL", ...}}` (transport-level).

- **UB-S02-04** — If the SSE client filter contains an unknown category (e.g., `?filter=foo`), then the sidecar shall return HTTP 400 with `{error: {code: "INVALID_FILTER", message: "Unknown category: foo"}}` (transport-level).

- **UB-S02-05** — If a WebSocket client sends a message with an unknown `type` field, then the sidecar shall close the WS connection with WebSocket close code `1008` (Policy Violation) and shall log the violation.

- **UB-S02-06** — If a WebSocket client sends a message that is not valid JSON, then the sidecar shall close the WS connection with WebSocket close code `1003` (Unsupported Data) and shall not process the message.

- **UB-S02-07** — If the SSE/WS client disconnects (TCP close, network error, or client-initiated close), then the sidecar shall remove the client from the pool/listener registry within 5 seconds and shall not attempt to write to the closed connection.

---

## Schema Pinning (locked)

### ToolResponse Envelope (UR-S02-03)

```typescript
interface ToolResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta: {
    duration: number  // milliseconds, integer, ≥ 0
    tool: string      // kebab-case tool name, matches URL path
  }
}
```

**Error code discriminator prefixes** (locked in Round 2 Q1):
- `VALIDATION_*` — input validation failure (also triggers HTTP 400 in some cases)
- `FORBIDDEN_PATH` — `session-patch` rejected a path
- `TOOL_ERROR_*` — plugin tool threw an error during dispatch
- `DELEGATION_*` — delegation-specific failure (child failed, timeout, aborted)
- `INTERNAL_*` — unexpected server error
- `UNKNOWN_TOOL`, `SESSION_NOT_FOUND`, `INVALID_FILTER` — transport-level (HTTP 4xx)

### SSE Event Types (11, from SC-01 `src/sidecar/types.ts`)

```
session.created, session.updated, session.idle, session.deleted, session.error,
delegation.dispatched, delegation.completed, delegation.failed, delegation.timeout,
invalidate.cache, heartbeat
```

Filter categories (OF-S02-01):
- `session` → 5 session.* events
- `delegation` → 4 delegation.* events
- `trajectory` → (reserved for SC-04+, currently no events)
- `pressure` → (reserved for SC-04+, currently no events)
- `invalidate` → `invalidate.cache` only
- `heartbeat` → `heartbeat` only

### WebSocket Message Schemas (ER-S02-03 to ER-S02-05)

```typescript
// Client → Server
type WsClientMessage =
  | { type: "subscribe"; delegationId: string }
  | { type: "unsubscribe"; delegationId: string }
  | { type: "abort"; delegationId: string }

// Server → Client
type WsServerMessage =
  | { type: "delegation.output"; delegationId: string; text: string; timestamp: number }
  | { type: "delegation.status"; delegationId: string; status: "running" | "completed" | "failed" | "timeout" | "aborted"; ... }
  | { type: "delegation.notification"; delegationId: string; notification: { ... } }
```

### Catalog Endpoints

```typescript
// GET /api/catalog
type CatalogResponse = JsonRenderCatalog  // pre-generated, 44 components per §7.1

// GET /api/catalog/tools
interface ToolCatalogEntry {
  id: string                    // kebab-case
  name: string                  // display name
  kind: "read" | "write"
  description: string
  requestSchema: string         // path or URL to schema
}
type ToolCatalogResponse = ToolCatalogEntry[]  // 12 entries
```

---

## Acceptance Criteria (falsifiable, test-bound)

Each AC must be implementable as a Vitest test case. The phase is "done" only when all 11 ACs pass.

| AC | Description | Test Type | Pass Condition |
|----|-------------|-----------|----------------|
| **AC-S02-01** | All 17 endpoints return correct status codes | Smoke | 200/200/200/200/404/200/200/200/200/200/200/200/200/200/101/200/200 in a single test matrix |
| **AC-S02-02** | `ToolResponse` envelope shape is consistent | Type guard | Zod schema validates 100 random tool responses across all 7 write tools |
| **AC-S02-03** | SSE pool enforces 50-connection cap | Concurrency | 51 parallel SSE clients → 50 succeed, 1 receives HTTP 503 |
| **AC-S02-04** | SSE filter is an allowlist | Filter logic | `?filter=session` client receives only session.* events over 30s window |
| **AC-S02-05** | WS messages match locked JSON schemas | Schema validation | Zod schema validates all client→server and server→client message types |
| **AC-S02-06** | WS scope is delegation-only | Negative test | Synthetic session.* event sent via internal bus → WS client does NOT receive it (only SSE does) |
| **AC-S02-07** | Catalog endpoint is immutable | Byte-equality | 100 sequential `GET /api/catalog` return SHA-256-identical payloads |
| **AC-S02-08** | `session-patch` blocks canonical state paths | Path safety | 12 negative tests: each canonical prefix → `FORBIDDEN_PATH` with HTTP 200 |
| **AC-S02-09** | No auth required | Affirmative | Request from fresh client (no headers) succeeds on all 17 endpoints |
| **AC-S02-10** | TypeScript strict mode | Compile | `npm run typecheck` passes; no `any` in `src/sidecar/server/routes/**` |
| **AC-S02-11** | End-to-end delegation via tool proxy + WS | Integration | `POST /api/tools/delegate-task` → WS `subscribe` → receive `delegation.output` events → WS `unsubscribe` |

---

## Constraints (SC-02 specific)

- **C-S02-01** — All endpoint file paths live under `src/sidecar/server/routes/` (new subdirectory); max 500 LOC per file (project-wide rule).
- **C-S02-02** — All new types live in `src/sidecar/server/routes/types.ts` (single types file for the route surface).
- **C-S02-03** — The `WsDelegationHandler` is a new file `src/sidecar/server/ws/delegation.ts`, max 500 LOC, and uses the same `SidecarDependencyRegistry` pattern as the REST routes.
- **C-S02-04** — Catalog constants are loaded from `src/sidecar/catalog/{json-render-catalog,tool-catalog}.ts` (statically imported; no file I/O at runtime).
- **C-S02-05** — No new dependencies. SC-02 uses only: `zod` (validation), `ws` (already an optionalDep from SC-01), and existing project modules.
- **C-S02-06** — All test files live under `tests/sidecar/routes/` mirroring the route file structure.

---

## References

### Prior Phase Outputs
- `/.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md` — server foundation spec
- `/.planning/phases/SC-01-sidecar-foundation/SC-01-SUMMARY.md` — files created, dependency graph, test counts
- `/.planning/phases/SC-01-sidecar-foundation/SC-01-CONTEXT.md` — scope boundary inherited (REST + tool proxy + WS + SSE explicitly deferred to SC-02)

### Architecture Source-of-Truth
- `/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §3 (System Architecture) — component topology
- `/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §4.1–4.5 — REST/SSE/WS/Catalog endpoint design
- `/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §5 (State Bridge) — `listCanonicalDirectory`, cache, snapshot
- `/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §6 (Tool Proxy) — `toolHandlers` map, `isSidecarSessionFilePath`
- `/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §6.4 — 12-tool selection table (locked source of truth for SC-02 surface)
- `/.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` — surface enumeration (~85 surfaces; SC-02 exposes 12)

### Existing Code Anchors
- `/src/sidecar/types.ts` — 11 `SidecarEvent` type definitions
- `/src/sidecar/server/registry.ts` — `SidecarDependencyRegistry` (6 setters)
- `/src/sidecar/server/factory.ts` — `createSidecarServer()` factory
- `/src/sidecar/server/sse/pool.ts` — `SseConnectionPool` (30s heartbeat, max 50)
- `/src/sidecar/readonly-state.ts` — 4 `CANONICAL_PREFIXES`
- `/src/plugin.ts` — step 5.5 server start, port file `.hivemind/state/sidecar-port.json`
- `/package.json` — `ws` 8.18 (optionalDep), `zod` (already in deps)

### External Standards (cited)
- ARCHITECTURE §3.5 — Sidecar is a "READ-ONLY for canonical state" boundary; `session-patch` is the only write that escapes, and only via `isSidecarSessionFilePath()` guard
- ARCHITECTURE §6.1 — Tool proxy is the **write-side** of the sidecar; mirrors plugin.ts's dependency-injected factory pattern
- ARCHITECTURE §7.1 — json-render catalog composition: 44 components (36 shadcn + 8 custom), single unified catalog

---

## Open Items for DISCUSS Phase

These are **not blockers** for SPEC lock, but should be resolved in `/gsd-discuss-phase` before PLAN:

1. **Latency budget detail** — AC-S02-01 says 50ms p95 "under no load". The exact SLA (e.g., 100ms under 10 concurrent clients? 500ms under 50 SSE clients?) needs a number locked for the PLAN's performance test.
2. **Cache invalidation signaling** — When the plugin emits `invalidate.cache` via SSE, should the sidecar's in-process state cache also evict? Or does the client (Next.js app) re-fetch? (Likely client-driven, but worth confirming.)
3. **WS backpressure** — What happens when a WS client reads slowly? Should the sidecar buffer, drop, or close? (UR default: drop + close per SC-01 pool behavior, but needs explicit confirmation.)
4. **Catalog versioning** — If the json-render catalog schema changes between OpenCode versions, how does the sidecar signal that? (E.g., `ETag` based on catalog hash, or a `version` field in the response?)
5. **Test fixture strategy** — For AC-S02-11 (end-to-end delegation), do we need a real `DelegationManager` fixture or a mock? (Likely mock for unit tests, real for one integration test.)
6. **Error response shape inconsistency** — SR-S02-02 and UB-S02-02/03/04 use `{error: {code, message}}` (not `ToolResponse`) for transport-level 4xx. Should there be one unified error shape, or is the dual-channel pattern (ToolResponse for app, raw for transport) intentional? (Locked from R2 Q1 as dual-channel, but worth confirming in discuss.)

---

**SPEC Status:** LOCKED 2026-06-02. Ready for `/gsd-discuss-phase` to resolve implementation decisions before PLAN.
