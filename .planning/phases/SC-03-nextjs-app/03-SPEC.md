# Phase SC-03: Next.js 16 Standalone App — SPEC

**Phase ID:** SC-03
**Phase Name:** Next.js 16 Standalone App (Sidecar GUI)
**Status:** SPEC (researched, ready for discuss-phase)
**Locked:** 2026-06-03
**Depends on:** SC-01 (Foundation — Plugin HTTP Server + State Bridge), SC-02 (REST API + Tool Proxy)
**Blocks:** SC-04 (Session Explorer Panel), SC-05 (Delegation Dashboard), SC-06 (MEMS Browser), SC-07 (Control Panel)
**Ambiguity Score:** TBD (post discuss-phase)

---

## Goal

SC-03 transforms the bare `sidecar/` directory skeleton — which currently has only a stub `next.config.ts`, one `layout.tsx`, and one `page.tsx` — into the full Next.js 16 standalone application that serves as the sidecar GUI shell. SC-03 ships:

1. **Next.js 16 app with `output: "standalone"`** — production-ready server that can run independently via `node .next/standalone/server.js`
2. **Plugin HTTP client (`plugin-client.ts`)** — typed wrapper that discovers the plugin server port from `.hivemind/state/sidecar-port.json` and proxies all SC-02 API calls
3. **Dashboard shell with 4-panel layout** — tabbed/navigated layout with slots for SC-04/05/06/07 panel content
4. **Unified json-render catalog** — `catalog.ts` defining 44 components (36 shadcn + 8 custom) using `defineCatalog()` from `@json-render/core`
5. **StateStore + snapshot refresh** — `state-store.ts` binding json-render `StateProvider` to the `/api/state/snapshot` endpoint with SSE-driven invalidation
6. **SSE client hook** — `use-sse.ts` hook that connects to `GET /api/events`, dispatches events to StateStore
7. **Loading skeleton + error boundary** — `loading.tsx` and `error.tsx` for robustness
8. **Dependency upgrade** — sidecar/package.json upgraded to Next.js 16, json-render v0.19.0, shadcn catalog, Tailwind v4

---

## Architectural Constraints (from ARCHITECTURE.md, non-negotiable)

- **Two-server model** — Next.js app on port 3099 is separate from the plugin HTTP server (random localhost port). They communicate via localhost HTTP. The Next.js app must NOT import any `src/sidecar/` modules directly — it is a separate process.
- **Port discovery** — `.hivemind/state/sidecar-port.json` is the canonical port discovery mechanism. No env vars, no CLI flags.
- **Read-only by default** — The Next.js app is a read-only consumer of canonical state. Only tool proxy endpoints (7 POST routes) allow writes, and they go through the SC-02 tool proxy — NOT direct filesystem access.
- **CQRS boundary** — State reads use REST GET to plugin server; writes use POST tool proxy; SSE events for live updates.
- **`output: "standalone"`** — Required for production deployment without Vercel. The app runs as `node .next/standalone/server.js`.
- **No auth** — localhost-only binding (port 3099) is the security boundary.
- **json-render `Renderer` must use `ssr: false`** — json-render `Renderer` depends on browser APIs for streaming UI; SSR would cause hydration mismatches.

---

## Scope

### In Scope (SC-03 ships)

| # | Capability | File(s) | Source / Foundation |
|---|-----------|---------|---------------------|
| 1 | Next.js 16 config with `output: "standalone"` | `sidecar/next.config.ts` | ARCHITECTURE §3 |
| 2 | Dependency upgrades (next 16, json-render 0.19, shadcn, tailwind v4) | `sidecar/package.json` | RESEARCH-nextjs.md, RESEARCH-json-render.md |
| 3 | Dashboard root layout with metadata + CSS | `sidecar/src/app/layout.tsx` | Renders shell, fonts, globals |
| 4 | Dashboard main page with json-render shell | `sidecar/src/app/page.tsx` | 4-panel grid layout |
| 5 | Loading skeleton | `sidecar/src/app/loading.tsx` | Per-panel loading states |
| 6 | Error boundary | `sidecar/src/app/error.tsx` | Catches panel render errors |
| 7 | Plugin HTTP client (typed wrapper) | `sidecar/src/lib/plugin-client.ts` | SC-02 17-endpoint surface |
| 8 | Unified json-render catalog | `sidecar/src/lib/catalog.ts` | ARCHITECTURE §7.2 (44 components) |
| 9 | StateStore + snapshot refresh | `sidecar/src/lib/state-store.ts` | SC-02 `/api/state/snapshot` + SSE |
| 10 | Type definitions for SC-03 | `sidecar/src/lib/types.ts` | Mirrors SC-02 response shapes |
| 11 | Constants (panel definitions, port config) | `sidecar/src/lib/constants.ts` | ARCHITECTURE §9 |
| 12 | SSE client hook | `sidecar/src/lib/use-sse.ts` | SC-02 `/api/events` |
| 13 | Dashboard shell (tab navigation) | `sidecar/src/components/dashboard-shell.tsx` | 4-panel tabbed layout |
| 14 | Error boundary component | `sidecar/src/components/error-boundary.tsx` | React error boundary |
| 15 | 4 panel skeletons (placeholders for SC-04/05/06/07) | `sidecar/src/panels/*/index.tsx` | Stub panels with specs |
| 16 | Pre-built json-render specs per panel | `sidecar/src/panels/*/specs.ts` | ARCHITECTURE §7.3 hybrid spec |
| 17 | Custom React components (container, badge, etc.) | `sidecar/src/components/` | Non-json-render components |
| 18 | Tailwind v4 config with `@source` for shadcn | `sidecar/` CSS config | `@json-render/shadcn` peer dep |
| 19 | Vitest config + smoke tests | `sidecar/tests/` | Phase validation |
| 20 | tsconfig.json update | `sidecar/tsconfig.json` | Path aliases, strict mode |

### Out of Scope (SC-03 does NOT ship)

- ❌ **Panel implementation** (Session Explorer, Delegation Dashboard, MEMS Browser, Control Panel) — deferred to SC-04/05/06/07 respectively. SC-03 ships only stubs with json-render specs.
- ❌ **Real SSE event dispatch to panels** — SC-03 wires the SSE hook and StateStore but panel-specific event handling is per-panel phase.
- ❌ **WebSocket delegation streaming client** — WS client belongs in SC-05 (Delegation Dashboard).
- ❌ **Tool proxy invocation from UI** — SC-03 ships `plugin-client.ts` but tool triggers (buttons, command input) belong to SC-07 (Control Panel).
- ❌ **Plugin-side code changes** — All SC-03 work stays inside `sidecar/` directory.
- ❌ **Catalog generation toolchain** — SC-03 ships the pre-authored catalog; toolchain is out of scope.
- ❌ **E2E tests with real plugin server** — Requires SC-02 server running; SC-03 tests mock the HTTP layer.
- ❌ **Auth/rate limiting/middleware** — OpenCode runtime owns these per architecture constraint.

---

## Requirements (EARS-format, 5 families)

### Ubiquitous Requirements (always-on)

- **UR-SC03-01** — The sidecar Next.js app shall configure `output: "standalone"` in `next.config.ts` and shall produce a runnable `server.js` at `.next/standalone/server.js` after `next build`.
  - *Locked from ARCHITECTURE §3, RESEARCH-nextjs.md §1.*

- **UR-SC03-02** — The `plugin-client.ts` module shall read the plugin port from `.hivemind/state/sidecar-port.json` at initialization time, and shall construct a base URL (`http://127.0.0.1:{port}`) for all API calls.
  - *Locked from ARCHITECTURE §2.2 (startup sequence), SC-02 D-SC02-12.*

- **UR-SC03-03** — The `plugin-client.ts` module shall expose typed methods for all 6 read-side state endpoints, 7 tool POST endpoints, 1 SSE endpoint, and 2 catalog endpoints from SC-02. Each method shall return strongly-typed responses matching the SC-02 response schemas.
  - *Maps to SC-02 `02-SPEC.md` scope table + `02-CONTEXT.md` §code_context.*

- **UR-SC03-04** — The dashboard shell shall render a 4-panel grid layout (2×2) with tabs for switching between panels, and shall persist the active tab in URL search params (`?panel=sessions|delegation|mems|control`).
  - *Locked from ARCHITECTURE §7.5, RESEARCH-nextjs.md §6.*

- **UR-SC03-05** — The json-render `Renderer` component shall be loaded via `next/dynamic({ ssr: false })` to prevent hydration mismatches.
  - *Locked from RESEARCH-nextjs.md §5.*

- **UR-SC03-06** — The Next.js app shall bind to `127.0.0.1:3099` by default, configurable via `PORT` env var. This port is distinct from the plugin server's random port.
  - *Locked from ARCHITECTURE §1 (Two-Server Model).*

### Event-Driven Requirements

- **ER-SC03-01** — When the dashboard mounts, `state-store.ts` shall fetch `GET /api/state/snapshot` and initialize the StateStore with the returned snapshot data, then open an SSE connection to `GET /api/events` for live updates.

- **ER-SC03-02** — When the SSE client receives an `invalidate.cache` event, the StateStore shall evict the corresponding cache category and shall trigger a re-fetch of the affected state endpoints on next read.

- **ER-SC03-03** — When the SSE client receives a `session.*` event (`session.created`, `session.updated`, `session.idle`, `session.deleted`, `session.error`), the StateStore shall patch the `/sessions` state path with the received data.

- **ER-SC03-04** — When the SSE client receives a `delegation.*` event, the StateStore shall patch the `/delegations` state path. (Full WS-based delegation streaming is deferred to SC-05.)

- **ER-SC03-05** — When the SSE connection drops (EventSource `onerror`), the client shall attempt reconnection with exponential backoff (1s → 2s → 4s → 8s → max 30s). A `connected` status indicator in the dashboard shell shall reflect the current connection state.

- **ER-SC03-06** — When the user navigates between panels (tab click or URL change), the dashboard shell shall show the selected panel's content and shall hide non-selected panels without unmounting them (to preserve panel state).

### State-Driven Requirements

- **SR-SC03-01** — While the plugin server is not yet available (`.hivemind/state/sidecar-port.json` not found or plugin not started), the dashboard shall show a "Sidecar not available — waiting for plugin..." message with a 5-second retry polling interval.

- **SR-SC03-02** — While the snapshot endpoint returns HTTP 503 (registry not ready), the dashboard shall show the last known good state (if any) or a partial loading state with retry.

- **SR-SC03-03** — While a panel's json-render spec is loading (lazy dynamic import), the corresponding grid cell shall show a skeleton placeholder matching the panel's expected dimensions.

### Optional Features

- **OF-SC03-01** — Where the user provides a `?panel=` URL parameter on initial load, the dashboard shell shall activate that panel directly instead of the default (`sessions`).

- **OF-SC03-02** — Where the SSE heartbeat is not received for 90 seconds (3 missed heartbeats), the SSE client shall consider the connection dead and shall initiate reconnection.

- **OF-SC03-03** — Where the browser supports the `beforeunload` event, the dashboard may attempt a final state snapshot fetch for display on reconnect (non-blocking, best-effort).

### Unwanted Behaviors

- **UB-SC03-01** — The Next.js app shall NOT import any module from `src/sidecar/` (the plugin-side server). It is a separate process and must only communicate via HTTP to the plugin server.

- **UB-SC03-02** — The json-render catalog shall NOT attempt to import `@json-render/shadcn` components if the package is not installed; it shall fall back gracefully with a console warning and skip those catalog entries.

- **UB-SC03-03** — Tool proxy POST calls from SC-03 shall never bypass the plugin server. Direct `fetch` calls to plugin tools from browser JavaScript are forbidden; all tool calls must go through Next.js route handlers (when SC-07 implements them) or the `plugin-client.ts` typed client.

- **UB-SC03-04** — The SSE client shall not accumulate event listeners on reconnection. Each new connection must clean up the previous `EventSource` instance.

---

## Schema Pinning (for API consumption)

### State Snapshot Response (from SC-02 `/api/state/snapshot`)

```typescript
interface StateSnapshot {
  sessions: SessionSummary[]
  delegations: DelegationSummary[]
  trajectory: TrajectoryEvent[]
  pressure: {
    score: number
    tier: number
    timestamp: number
  }
  config: Partial<HivemindConfig>
  server: {
    uptime: number
    port: number
    version: string
    startedAt: number
  }
}

interface SessionSummary {
  id: string
  status: string
  description: string
  agent?: string
  children: string[]
  createdAt: number
  updatedAt: number
  depth: number
  toolCallCount?: number
  messageCount?: number
}

interface DelegationSummary {
  id: string
  agent: string
  status: string
  parentSessionId: string
  depth: number
  createdAt: number
  updatedAt: number
  duration?: number
  error?: string
}

interface TrajectoryEvent {
  phase: string
  checkpoint?: string
  summary: string
  timestamp: number
}
```

### StateStore Shape

```typescript
interface SidecarState {
  sessions: Record<string, SessionSummary>
  delegations: Record<string, DelegationSummary>
  trajectory: TrajectoryEvent[]
  pressure: { score: number; tier: number; timestamp: number }
  config: Partial<HivemindConfig>
  server: { uptime: number; port: number; version: string; startedAt: number }
  ui: {
    activePanel: "sessions" | "delegation" | "mems" | "control"
    selectedSessionId: string | null
    selectedDelegationId: string | null
    sseConnected: boolean
    lastUpdated: number
  }
}
```

### Catalog Type (from SC-02 `/api/catalog`)

```typescript
interface CatalogResponse {
  catalog: JsonRenderCatalog  // 44-component definition
}
```

### SSE Event Shapes (from SC-02 `src/sidecar/types.ts`)

```typescript
type SidecarEventType =
  | "session.created" | "session.updated" | "session.idle"
  | "session.deleted" | "session.error"
  | "delegation.dispatched" | "delegation.completed"
  | "delegation.failed" | "delegation.timeout"
  | "invalidate.cache" | "heartbeat"

interface SidecarEvent {
  type: SidecarEventType
  payload: Record<string, unknown>
  timestamp: number
}
```

---

## Acceptance Criteria (falsifiable, test-bound)

| AC | Description | Test Type | Pass Condition |
|----|-------------|-----------|----------------|
| **AC-SC03-01** | App builds with `output: "standalone"` | Build | `next build` succeeds; `.next/standalone/server.js` exists |
| **AC-SC03-02** | `plugin-client.ts` discovers port from sentinel file | Unit | Reading `.hivemind/state/sidecar-port.json` → correct base URL |
| **AC-SC03-03** | `plugin-client.ts` exposes all 17 endpoint methods | Type guard | TypeScript compilation passes; all methods return typed responses |
| **AC-SC03-04** | StateStore initializes from snapshot endpoint | Unit | Fetch mock snapshot → store state matches snapshot shape |
| **AC-SC03-05** | SSE client connects and dispatches events | Unit | Mock SSE stream → store receives event → state path patched |
| **AC-SC03-06** | Dashboard shell renders 4-panel grid | Render | 4 grid cells rendered with correct panel component stubs |
| **AC-SC03-07** | json-render catalog defines 44 components | Unit | `Object.keys(catalog.components).length === 44` |
| **AC-SC03-08** | Panel tab switch updates URL and visible panel | Integration | Click tab → URL updates → correct panel visible, others hidden |
| **AC-SC03-09** | Error boundary catches render error | Render | Throw in panel → error boundary shows fallback UI, other panels unaffected |
| **AC-SC03-10** | Loading skeleton shown during dynamic import | Render | Panel with delayed import → skeleton shows until content loads |
| **AC-SC03-11** | No plugin-side imports from `src/sidecar/` | Build | `next build` does not fail; `grep -r "src/sidecar" sidecar/src/` returns empty |
| **AC-SC03-12** | SSE reconnection with exponential backoff | Unit | EventSource close → reconnect timer starts (1s, 2s, 4s...) |
| **AC-SC03-13** | `Renderer` loaded via `dynamic({ ssr: false })` | Code review | Renderer import uses `next/dynamic` with `ssr: false` |

---

## References

### Architecture & Research
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §1-3 (Two-server model, Communication Flow, Startup Sequence)
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §7 (json-render Integration Design — catalog, spec strategy, StateStore, panel mapping)
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §9.2 (Next.js app file structure — authoritative layout)
- `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` — Next.js 16 standalone mode, SSE, bundle optimization, client boundary strategy
- `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` — json-render v0.19.0 API, `defineCatalog()`, `defineRegistry()`, shadcn integration
- `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` — Reference patterns (OpenChamber, opencode-pty)
- `.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` §11-12 — sidecar gap analysis, integration architecture

### Upstream Phase Documents
- `.planning/phases/SC-02-rest-api-tool-proxy/02-SPEC.md` — All 17 endpoint definitions, tool response envelope, SSE event types, WS schemas
- `.planning/phases/SC-02-rest-api-tool-proxy/02-CONTEXT.md` — Implementation decisions (12 decisions), allowed/forbidden surfaces, verification commands
- `.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md` — Server foundation, SseConnectionPool, SidecarDependencyRegistry

### Existing Code Anchors
- `src/sidecar/server/routes/state.ts` — Snapshot + per-session state endpoints
- `src/sidecar/server/routes/events.ts` — SSE route with filter categories
- `src/sidecar/server/routes/catalog.ts` — Catalog + tool catalog endpoints
- `src/sidecar/server/routes/tools.ts` — 7 tool POST proxy endpoints
- `src/sidecar/server/tool-proxy/router.ts` — TOOL_HANDLERS map (7 entries)
- `src/sidecar/types.ts` — `SidecarEventType` (11 members), `SidecarEvent`
- `sidecar/next.config.ts` — Existing stub (upgrade to Next.js 16)
- `sidecar/package.json` — Existing deps (upgrade to next 16, json-render 0.19)

---

**SPEC Status:** RESEARCHED 2026-06-03. Ready for `/gsd-discuss-phase` to resolve implementation decisions before PLAN.
