# Phase SC-04: Session Explorer Panel — SPEC

**Phase ID:** SC-04
**Phase Name:** Session Explorer Panel (Sidecar GUI)
**Status:** SPEC (researched, ready for discuss-phase)
**Locked:** 2026-06-06
**Depends on:** SC-01 (Foundation — Plugin HTTP Server + State Bridge) ✅ COMPLETE, SC-02 (REST API + Tool Proxy) ⚠️ PARTIAL (5 stub handlers, 1 fixed: GAP-01), SC-03 (Next.js 16 Standalone App) ⚠️ FRAMEWORK (4 stub panels, framework wired)
**Blocks:** SC-04.1 (Session Detail Drill-in — future), SC-05/06/07 (consumers of session tree component)
**Ambiguity Score:** 0.15 (target ≤ 0.20 per universal-rules.md §4 Checkpoint 4)
**Author:** hm-planner (Wave 2 of `sidecar-honest-rebaseline-2026-06-06`)

---

## Goal

SC-04 replaces the hardcoded stub at `sidecar/src/panels/session-explorer/index.tsx:1-50` (per `SC-03-FRAMEWORK-STATUS.md` line 38-40) with a real implementation that displays the live list/tree of active sessions from the plugin server, supports parent→child hierarchy visualization, and updates in real-time via SSE.

**Critical context (per `.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md`):**
- `GET /api/state/sessions` returns **real** data (calls `sessionTracker.list()` per `src/sidecar/server/routes/sessions.ts:27-37` and `state.ts:34-44`)
- `GET /api/state/sessions/:id/children` is a **STUB** returning `{ children: [] }` (per `state.ts:47-52`)
- `GET /api/state/sessions/:id/context` is a **STUB** returning `{ context: {} }` (per `state.ts:54-59`)
- `POST /api/tools/hivemind-session-view` is **FIXED** (returns real session data per `sidecar-completeness-2026-06-06` Wave 1, `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:32-80`)
- SSE events: `session.created`, `session.updated`, `session.idle`, `session.deleted`, `session.error` (per `src/sidecar/types.ts:17-29`)

**Observable truth when SC-04 is complete:** When the plugin server has active sessions, the user sees them rendered in the Session Explorer panel within 2 seconds of opening the dashboard, with parent→child hierarchy visible and live updates appearing within 500ms of session state changes.

---

## Architectural Constraints (non-negotiable, from ARCHITECTURE.md + SC-03 CONTEXT)

- **Two-server model** — Sidecar Next.js (`127.0.0.1:3099`) consumes plugin HTTP API via `pluginClient` singleton (no direct `fetch` to plugin URLs, no imports from `src/sidecar/`)
- **No `src/sidecar/` imports** — All data flows through HTTP via `pluginClient.getSessions()` / `pluginClient.postSessionView()` / SSE events
- **Read-only by default** — Panel never mutates `stateStore` directly; reads via `useStateStore()` hook or equivalent getter
- **Client Component** (`"use client"`) — required because the panel uses `useState`, `useEffect`, `useSse` hooks
- **No new dependencies** — Must reuse `pluginClient`, `stateStore`, `useSse`, `types` already shipped in SC-03
- **TypeScript strict mode** — No `any` types (per project rule, sidecar/tsconfig.json strict:true)
- **Tailwind v4 + inline styles** — Match existing dashboard shell aesthetic (no Tailwind classes in panel components per SC-03 decision D-SC03-05)
- **No auth** — localhost-only binding per ARCHITECTURE §8.1

---

## Scope

### In Scope (SC-04 ships)

| # | Capability | File(s) | Foundation |
|---|-----------|---------|------------|
| 1 | Replace stub at `sidecar/src/panels/session-explorer/index.tsx` with real implementation | MODIFY | SC-03 stub, SC-01 SSE, SC-02 `/api/state/sessions` |
| 2 | `useSessions()` hook that reads from `stateStore` and exposes `{ sessions, loading, error, refresh }` | CREATE `sidecar/src/lib/use-sessions.ts` | SC-03 `stateStore` + `SidecarState` type |
| 3 | `SessionTree.tsx` recursive tree component | CREATE `sidecar/src/components/session-tree.tsx` | `SessionSummary.children[]` field |
| 4 | `SessionRow.tsx` single session display | CREATE `sidecar/src/components/session-row.tsx` | `SessionSummary` type |
| 5 | `SessionFilter.tsx` debounced search input | CREATE `sidecar/src/components/session-filter.tsx` | `useDeferredValue` / `useEffect` with 150ms debounce |
| 6 | Lazy-load children on expand via `pluginClient.getSessionChildren(id)` | NEW | `/api/state/sessions/:id/children` (stub returns `[]`, gracefully handle empty) |
| 7 | Session detail fetch via `pluginClient.postSessionView({ sessionId })` | NEW | `/api/tools/hivemind-session-view` (FIXED, returns real data) |
| 8 | SSE subscription to `session.*` events that dispatch into `stateStore` | NEW | `useSse` hook already in SC-03 |
| 9 | "No sessions" empty state when zero active sessions | NEW | UI |
| 10 | "Plugin server not available" error banner when `pluginClient.snapshot()` fails | NEW | UI |
| 11 | Connection error banner when SSE connection drops for > 30 seconds | NEW | UI |
| 12 | Keyboard navigation: arrow keys, Enter, Escape | NEW | `onKeyDown` handlers |
| 13 | URL `?session_filter=xxx` persistence | NEW | `useSearchParams` |
| 14 | TDD test suite for SC-04 components | CREATE `sidecar/tests/session-explorer.test.tsx`, `use-sessions.test.ts` | vitest + @testing-library/react |
| 15 | Update `sidecar/tests/dashboard-shell.test.tsx` to expect real panel (not stub) | MODIFY | — |

### Out of Scope (SC-04 does NOT ship)

- ❌ **Session detail drill-in view** — Deferred to **SC-04.1** (separate phase). SC-04 = list/tree only.
- ❌ **Re-implementing 5 SC-02 stub tool handlers** (GAP-02..05 per C7 audit §7.1) — separate work stream (`sidecar-completeness-2026-06-06` Wave 2)
- ❌ **Full session message content rendering** — Deferred to SC-04.1
- ❌ **Fixing `:id/children` and `:id/context` stubs** — SC-04 uses lazy-load + graceful empty fallback; full fix is for `sidecar-completeness` Wave 2
- ❌ **WebSocket delegation streaming** — SC-05 scope
- ❌ **Backend changes to `src/sidecar/server/routes/sessions.ts`** — Already returns real data via `st.list()`; no plugin-side change needed for v1
- ❌ **Replacing `stateStore` with json-render's reactive system** — SC-03 chose a simple Map-based store; SC-04 reads via custom hook
- ❌ **Adding new dependencies** — No `react-arborist`, `react-window`, etc. for v1 (see CONTEXT §R-SC04-04)
- ❌ **Catalog/tool-catalog integration** — Not needed for sessions

---

## Requirements (EARS-format, 5 families, 26 requirements)

### Ubiquitous Requirements (always-on)

- **UR-SC04-01** — The panel SHALL display all active sessions returned by `GET /api/state/sessions` (via `pluginClient.getSessions()`) as a list or indented tree within 2 seconds of dashboard mount when the plugin server is reachable.
  - *Source: `src/sidecar/server/routes/sessions.ts:24-37` returns `{ sessions: SessionSummary[] }` from `sessionTracker.list()`*

- **UR-SC04-02** — The panel SHALL display the parent→child hierarchy of sessions using indentation (2rem per depth level), driven by the `children: string[]` field on each `SessionSummary`.
  - *Source: `sidecar/src/lib/types.ts:14-25` (SessionSummary.children: string[])*

- **UR-SC04-03** — The panel SHALL subscribe to SSE events `session.created`, `session.updated`, `session.idle`, `session.deleted`, `session.error` (per `src/sidecar/types.ts:17-29`) and update the displayed list within 500ms of receiving such an event.
  - *Source: `sidecar/src/lib/use-sse.ts:113-124` dispatches parsed events; `stateStore.handleEvent()` patches `/sessions/:id`*

- **UR-SC04-04** — The panel SHALL display a colored status indicator for each session based on its `status` field: `active` (green `#22c55e`), `running` (blue `#3b82f6`), `pending` (amber `#f59e0b`), `completed` (gray `#94a3b8`), `failed`/`error` (red `#ef4444`).
  - *Source: matches the stub at `sidecar/src/panels/session-explorer/index.tsx:36-42`*

- **UR-SC04-05** — The panel SHALL provide a search/filter input that filters displayed sessions by `id`, `description`, `status`, or `agent` substring match. Filter response SHALL be < 200ms for up to 1000 sessions.
  - *Source: standard search input performance baseline*

- **UR-SC04-06** — The panel SHALL display each session's metadata: `id`, `description`, `status`, `agent` (if present), `createdAt` (formatted as relative time), `updatedAt` (formatted as relative time), `messageCount` (if present), `toolCallCount` (if present), `depth` (used for indentation).
  - *Source: `sidecar/src/lib/types.ts:14-25` (SessionSummary fields)*

- **UR-SC04-07** — The panel SHALL support click-to-expand on a session row to show its children. If the `children[]` array on the `SessionSummary` is non-empty, children are rendered from the snapshot. If empty, the panel SHALL call `pluginClient.getSessionChildren(sessionId)` to lazy-load; if that returns `{ children: [] }` (current stub behavior per `state.ts:47-52`), the panel SHALL render "No children" inline.
  - *Source: `sidecar/src/lib/plugin-client.ts:124-127` (getSessionChildren method) + `src/sidecar/server/routes/state.ts:47-52` (stub)*

- **UR-SC04-08** — The panel SHALL show a "No active sessions" empty state (with hint "Start a delegation to see sessions here") when the `sessions` array from `stateStore` is empty AND the loading state is `false`.
  - *Source: UI/UX requirement; educational copy*

- **UR-SC04-09** — The panel SHALL show a "Plugin server not available" message with a "Retry" button when the `stateStore` reports an error AND no data has been received. The button SHALL call `stateStore.refreshSnapshot()`.
  - *Source: matches `dashboard-shell.tsx:93-100` plugin-unavailable pattern*

- **UR-SC04-10** — The panel SHALL show a "Connection lost — reconnecting…" inline banner when SSE `connected` is `false` for more than 30 seconds.
  - *Source: matches SSE drop detection in `use-sse.ts:79-85` heartbeat interval*

- **UR-SC04-11** — The panel SHALL use real session data from the plugin server, NOT hardcoded stub values. This is the **critical fix** vs SC-03's stub at `index.tsx:36-42` (per `SC-03-FRAMEWORK-STATUS.md`).
  - *Source: C7 audit §7.11, SC-03 FRAMEWORK-STATUS §What SC-03 Did NOT Deliver*

- **UR-SC04-12** — The panel SHALL support keyboard navigation: `ArrowDown`/`ArrowUp` to move focus between session rows, `Enter` or `Space` to expand/collapse, `Escape` to clear the search filter.
  - *Source: standard keyboard accessibility for tree components*

- **UR-SC04-13** — The panel SHALL persist the search filter in the URL as `?session_filter=xxx` so refresh and share-link preserve filter state. Matches dashboard-shell's `?panel=` pattern (per D-SC03-04).
  - *Source: `sidecar/src/components/dashboard-shell.tsx:36-90` (URL state pattern)*

### Event-Driven Requirements

- **ER-SC04-01** — When the SSE client receives a `session.created` event, the panel SHALL add the new session to the displayed list within 500ms.
  - *Source: `src/sidecar/types.ts:18` event type; `use-sse.ts:117` event dispatch*

- **ER-SC04-02** — When the SSE client receives a `session.deleted` event, the panel SHALL remove the session from the displayed list within 500ms.
  - *Source: `src/sidecar/types.ts:21` event type*

- **ER-SC04-03** — When the user types in the search input, the panel SHALL filter the displayed sessions in real-time, debounced at 150ms.
  - *Source: standard search input performance baseline (SC-03 D-SC03-N/A; informed by §R-SC04-05 below)*

- **ER-SC04-04** — When the user clicks the "Refresh" button (visible on empty/error states), the panel SHALL call `stateStore.refreshSnapshot()` which re-fetches `/api/state/snapshot` and `/api/state/sessions`.
  - *Source: `sidecar/src/lib/state-store.ts:75-78` (refreshSnapshot implementation)*

- **ER-SC04-05** — When the SSE connection drops (EventSource `onerror`), the panel SHALL display a yellow "Reconnecting…" indicator in the panel header. When SSE reconnects (`onopen`), the indicator SHALL turn green.
  - *Source: `use-sse.ts:102-111` onopen handler; `use-sse.ts:126-139` onerror handler*

### State-Driven Requirements

- **SR-SC04-01** — IF the plugin server is unreachable (port file missing AND env var unset), THEN the panel SHALL show a "Plugin server not available" message with a "Retry" button. Clicking Retry SHALL call `stateStore.refreshSnapshot()` after a 1-second delay.
  - *Source: `sidecar/src/lib/plugin-client.ts:42-70` (port discovery with fallback)*

- **SR-SC04-02** — IF `GET /api/state/sessions` returns HTTP 5xx, THEN the panel SHALL show an inline error with the HTTP status code and a "Retry" button. Other panels (delegation-dashboard, mems-browser, control-panel) SHALL continue to function.
  - *Source: matches `dashboard-shell.tsx:174-242` per-panel error isolation*

- **SR-SC04-03** — IF a session's lazy-loaded children fetch fails (network error or 5xx), THEN the panel SHALL show "Failed to load children" inline on that row with a "Retry" button. The panel SHALL NOT unmount the rest of the tree.
  - *Source: standard error boundary per row*

- **SR-SC04-04** — IF the search filter is non-empty AND no sessions match, THEN the panel SHALL show "No sessions match '<filter>'" with a "Clear filter" button.
  - *Source: UI/UX requirement*

- **SR-SC04-05** — IF SSE connection is dropped for > 30 seconds, THEN the panel SHALL escalate from "Reconnecting…" to "Connection lost — retrying in 30s" with the last successful connection timestamp.
  - *Source: `use-sse.ts` SSE_MAX_BACKOFF_MS = 30000*

### Optional Features

- **OF-SC04-01** — Where a session's `messageCount` is present, the panel MAY display a small badge (e.g., "12 msgs") next to the status indicator.
  - *Source: `sidecar/src/lib/types.ts:23` (SessionSummary.messageCount?)*

- **OF-SC04-02** — Where a session's `toolCallCount` is present, the panel MAY display a small badge (e.g., "5 tools") next to the status indicator.
  - *Source: `sidecar/src/lib/types.ts:22` (SessionSummary.toolCallCount?)*

- **OF-SC04-03** — The panel MAY show a "Last updated at HH:MM:SS" timestamp in the panel header, updated whenever `stateStore.handleEvent` is called.
  - *Source: matches `dashboard-shell.tsx` connected indicator aesthetic*

- **OF-SC04-04** — The panel MAY virtualize the session list (using `react-window` or similar) if total session count exceeds 500. **Deferred to future work** — out of scope for v1.

- **OF-SC04-05** — The panel MAY support `Ctrl+K` / `Cmd+K` keyboard shortcut to focus the search input. **Deferred to v2** — out of scope for v1.

### Unwanted Behaviors

- **UB-SC04-01** — The panel SHALL NOT make direct `fetch()` calls to the plugin server. All HTTP calls SHALL go through the `pluginClient` singleton (`sidecar/src/lib/plugin-client.ts:209-218`).
  - *Source: `sidecar/src/lib/plugin-client.ts` UB-SC03-03 inheritance; ARCHITECTURE §3 (CQRS)*

- **UB-SC04-02** — The panel SHALL NOT mutate `stateStore` directly. All reads via `useSessions()` hook which exposes a read-only `{ sessions, loading, error, refresh }` interface. All writes are dispatched by `useSse` event handlers or `stateStore.refreshSnapshot()` (no caller-side mutation).
  - *Source: CQRS boundary; SC-03 D-SC03-06*

- **UB-SC04-03** — The panel SHALL NOT use any TypeScript `any` type. The `SessionSummary` and `SidecarState` types from `sidecar/src/lib/types.ts` SHALL be imported and used for all data shapes.
  - *Source: `sidecar/tsconfig.json` strict:true; project rule (AGENTS.md root)*

- **UB-SC04-04** — The panel SHALL NOT import from `src/sidecar/`. All plugin-side communication SHALL be via `pluginClient` (HTTP) and `useSse` (SSE).
  - *Source: SC-03 UB-SC03-01; ARCHITECTURE §3*

- **UB-SC04-05** — The panel SHALL NOT block the rest of the dashboard if its own data fetch fails. The dashboard shell's per-panel `ErrorBoundary` (`sidecar/src/components/dashboard-shell.tsx:194-238`) SHALL isolate panel failures.
  - *Source: SC-03 D-SC03-08 (panel code splitting); AC-SC03-09*

- **UB-SC04-06** — The panel SHALL NOT auto-poll `GET /api/state/sessions` on a timer. All updates SHALL be SSE-driven; polling is wasteful and conflicts with the server's SSE pool.
  - *Source: SC-01 SseConnectionPool design; SC-03 ER-SC03-05 SSE drop pattern*

---

## Schema Pinning (from `sidecar/src/lib/types.ts` and `src/sidecar/types.ts`)

### SessionSummary (consumed by panel)

```typescript
export interface SessionSummary {
  id: string                    // e.g. "ses_abc123"
  status: string                // "active" | "running" | "pending" | "completed" | "failed" | "error"
  description: string           // Human-readable label
  agent?: string                // e.g. "hm-researcher"
  children: string[]            // Child session IDs
  createdAt: number             // Unix ms
  updatedAt: number             // Unix ms
  depth: number                 // 0 = root
  toolCallCount?: number        // Optional badge
  messageCount?: number         // Optional badge
}
```

### SidecarEvent (SSE payload from `use-sse`)

```typescript
export type SidecarEventType =
  | "session.created" | "session.updated" | "session.idle"
  | "session.deleted" | "session.error"
  | "delegation.dispatched" | "delegation.completed"
  | "delegation.failed" | "delegation.timeout"
  | "invalidate.cache" | "heartbeat"

export interface SidecarEvent {
  type: SidecarEventType
  payload: Record<string, unknown>  // For session.*: payload.session = Partial<SessionSummary>
  timestamp: number
}
```

### stateStore.handleEvent patch path

Per `state-store.ts:84-93`: When `type` starts with `session.`, store patches `/sessions/:id` with `payload.session`.

---

## Acceptance Criteria (falsifiable, test-bound)

| AC | Description | Test Type | Pass Condition |
|----|-------------|-----------|----------------|
| **AC-SC04-01** | Panel renders real sessions from `stateStore.snapshot().sessions` | Render | `npx vitest run session-explorer.test.tsx` — mock stateStore with 3 sessions, panel renders 3 rows (NOT 3 hardcoded rows) |
| **AC-SC04-02** | `useSessions()` hook returns `{ sessions, loading, error, refresh }` from stateStore | Unit | `npx vitest run use-sessions.test.ts` — hook returns expected shape |
| **AC-SC04-03** | Tree displays parent→child hierarchy via `children[]` field | Render | Mock 1 parent + 2 children, panel renders 3 rows with 2-indent on children |
| **AC-SC04-04** | SSE `session.created` event adds new session within 500ms | Integration | Mock SSE source, dispatch `session.created` with new session, assert row appears |
| **AC-SC04-05** | SSE `session.deleted` event removes session within 500ms | Integration | Mock SSE, dispatch `session.deleted`, assert row removed |
| **AC-SC04-06** | Search filter input filters by id/description/status/agent substring | Render | Type "ses_1", panel shows only matching sessions |
| **AC-SC04-07** | Search debounce is 150ms | Unit | Mock rapid typing, assert single re-filter after 150ms |
| **AC-SC04-08** | "No active sessions" empty state when sessions array is empty AND not loading | Render | Mock empty state, assert message visible |
| **AC-SC04-09** | "No sessions match '<filter>'" when search has no results | Render | Type "xyz123", assert message visible |
| **AC-SC04-10** | "Plugin server not available" + Retry button on stateStore error | Render | Mock stateStore with error, assert banner + button |
| **AC-SC04-11** | "Connection lost — retrying" when SSE disconnected for > 30s | Integration | Mock useSse returning connected:false for 30s+, assert banner |
| **AC-SC04-12** | "Failed to load children" + Retry button on per-row children fetch failure | Render | Mock getSessionChildren throwing, assert inline error + button |
| **AC-SC04-13** | Keyboard navigation: Arrow keys move focus, Enter expands, Escape clears | Integration | Simulate keydown, assert focus moves |
| **AC-SC04-14** | URL `?session_filter=xxx` persistence | Integration | Type "ses_1", assert URL updates; navigate away and back, assert filter preserved |
| **AC-SC04-15** | Status indicator colors match UR-SC04-04 spec | Render | Mock sessions with each status, assert color CSS |
| **AC-SC04-16** | Click-to-expand lazy-loads children via `getSessionChildren` | Integration | Click parent row, assert `getSessionChildren` called, children rendered |
| **AC-SC04-17** | Session detail available via `postSessionView` for future drill-in | Integration | Call `postSessionView({ sessionId })`, assert returns `ToolResponse<{ session }>` with real data |
| **AC-SC04-18** | No `src/sidecar/` imports | Build | `grep -r "src/sidecar" sidecar/src/panels/session-explorer/ sidecar/src/components/session-*.tsx sidecar/src/lib/use-sessions.ts` returns empty |
| **AC-SC04-19** | No `any` types in panel + components + hook | Type guard | `npx tsc --noEmit` passes; `grep -nE ": any\b\|<any>\|as any" sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` returns empty |
| **AC-SC04-20** | `npm run dev` (with plugin server running) renders real sessions in browser | Manual | `curl http://127.0.0.1:3099/` returns 200; full-screen screenshot shows Session Explorer panel with real data (NOT "ses_1/ses_2/ses_3" stubs) |

---

## Out-of-Scope Reference (for v2 / SC-04.1)

- Session detail drill-in view (clicking a row opens a modal/page with full session data, messages, trajectory)
- Full session message content rendering
- Session history/audit log
- Export session list as JSON/CSV
- Real-time cursor position / token counter
- Session filter presets (e.g., "Active only", "My agents", "Failed in last 1h")
- Multi-select for batch operations

These are documented in `04-CONTEXT.md` §Open Questions for the user's consideration post-v1.

---

## References

### Architecture & Research
- `.planning/codebase/ARCHITECTURE.md` §3 (Two-Server Model) — boundary between plugin and Next.js
- `.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md` §7 (12 gaps/flaws) — context for SC-02 stubs
- `.planning/phases/SC-03-nextjs-app/03-SPEC.md` — UI hosting layer spec (SC-04 inherits UR-SC03-04 grid layout, OF-SC03-01 ?panel= pattern)
- `.planning/phases/SC-03-nextjs-app/03-CONTEXT.md` — SC-03 decisions (D-SC03-04 tab nav, D-SC03-08 dynamic import, D-SC03-11 Tailwind v4)
- `.planning/phases/SC-03-nextjs-app/SC-03-FRAMEWORK-STATUS.md` — honest status of SC-03, what was actually built
- `.planning/phases/SC-03-nextjs-app/03-PLAN-CHECK.md` — plan-checker verdict (PASS, 0.92 confidence) — reference for SC-04's plan-check

### Codebase References (the surfaces SC-04 consumes)
- `src/sidecar/server/routes/sessions.ts:24-37` — `GET /api/state/sessions` (real data via `st.list()`)
- `src/sidecar/server/routes/state.ts:34-44` — `GET /api/state/sessions` (real, redundant route, also returns real)
- `src/sidecar/server/routes/state.ts:47-52` — `GET /api/state/sessions/:id/children` (STUB returns `[]`)
- `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:32-80` — `POST /api/tools/hivemind-session-view` (FIXED, returns real session data)
- `src/sidecar/types.ts:17-29` — `SIDECAR_EVENT_TYPES` (11 types, 5 session.*)
- `src/sidecar/server/registry.ts:79-84` — `registry.sessionTracker` typed getter
- `sidecar/src/lib/types.ts:14-25` — `SessionSummary` interface
- `sidecar/src/lib/types.ts:104-121` — `SidecarEventType` + `SidecarEvent` (mirrors plugin-side)
- `sidecar/src/lib/types.ts:150-164` — `SidecarState` (stateStore shape)
- `sidecar/src/lib/plugin-client.ts:120-122` — `getSessions()` method
- `sidecar/src/lib/plugin-client.ts:124-127` — `getSessionChildren(id)` method
- `sidecar/src/lib/plugin-client.ts:192-195` — `postSessionView(params)` method
- `sidecar/src/lib/state-store.ts:19-127` — `createSidecarStateStore()` with `initialize`, `refreshSnapshot`, `handleEvent`
- `sidecar/src/lib/use-sse.ts:47-178` — `useSse` hook with exponential backoff + heartbeat
- `sidecar/src/lib/constants.ts:53-78` — `PANELS` array (4 panels)
- `sidecar/src/lib/constants.ts:81` — `DEFAULT_PANEL = "session-explorer"` (this panel is the default visible panel)
- `sidecar/src/panels/session-explorer/index.tsx:1-50` — current hardcoded stub (replaced by SC-04)
- `sidecar/src/components/dashboard-shell.tsx:33-264` — parent dashboard shell that renders this panel

### Upstream Phase Decisions (inherited)
- **D-SC01-01** (SC-01): `SseConnectionPool` (50 max connections, 30s heartbeat) — SC-04 SSE consumer is bounded
- **D-SC01-02** (SC-01): `SidecarDependencyRegistry` typed getters — SC-04 reads from this via plugin-server, not directly
- **D-SC02-12** (SC-02): Port file sentinel `.hivemind/state/sidecar-port.json` — SC-04's `pluginClient` reads this
- **D-SC03-04** (SC-03): URL `?panel=` persistence — SC-04 extends to `?session_filter=`
- **D-SC03-05** (SC-03): Pre-bundled catalog (not from API) — N/A for SC-04
- **D-SC03-06** (SC-03): StateStore via `createStateStore` — SC-04 reads via `useSessions()` hook
- **D-SC03-07** (SC-03): Custom SSE hook — SC-04 uses `useSse` as-is
- **D-SC03-08** (SC-03): Dynamic import per panel — SC-04 panel stays dynamically imported
- **D-SIDECAR-STATUS-TRUTH-01** (STATE.md 2026-06-06): Honest re-baseline — SC-04 must use REAL data, not stubs

---

**SPEC Status:** RESEARCHED 2026-06-06. Ready for `/hm-discuss-phase` to resolve 10 gray areas → 04-CONTEXT.md, then `/hm-research` → 04-RESEARCH.md, `/hm-pattern-mapper` → 04-PATTERNS.md, `/hm-plan-phase` → 04-PLAN.md.

**Ambiguity self-score: 0.15** — Low ambiguity due to: (a) clear EARS criteria with measurable thresholds, (b) well-defined plugin-side contracts already in `sessions.ts` and `hivemind-session-view.ts`, (c) explicit inheritance from SC-03 patterns, (d) bounded scope (no drill-in, no message content, no new dependencies). Higher ambiguity areas (10 GAs) are documented in `04-CONTEXT.md` for resolution.
