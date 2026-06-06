# Phase SC-04: Session Explorer Panel — Context

**Gathered:** 2026-06-06
**Mode:** Wave 2 of `sidecar-honest-rebaseline-2026-06-06` — L0 coordinated, planner-driven
**Status:** Ready for research-phase → patterns-phase → plan-phase
**Ambiguity Score:** 0.15 (per `04-SPEC.md` §Ambiguity Score)
**Author:** hm-planner (this file) + would have co-authored with `hm-intent-loop` for gray-area resolution

---

<domain>

## Phase Boundary

SC-04 replaces the hardcoded stub at `sidecar/src/panels/session-explorer/index.tsx:1-50` with a real implementation that:
- Displays the live list/tree of active sessions from `GET /api/state/sessions` (real data via `sessionTracker.list()`)
- Supports parent→child hierarchy visualization via the `children: string[]` field on `SessionSummary`
- Updates in real-time via SSE (`session.*` events)
- Provides search/filter with 150ms debounce
- Handles errors gracefully (plugin unavailable, SSE drop, lazy-load failures)
- Supports keyboard navigation and URL-persisted filter state

**This is the panel the user was trying to view when they discovered all 4 panels were stubs** (per `.hivemind/planning/sidecar-honest-rebaseline-2026-06-06/00-landscape.md` lines 23-24).

**Key boundary:** All SC-04 work lives in `sidecar/src/`. No changes to `src/sidecar/` (plugin-side) — the server-side already returns real data via `sessionTracker.list()`. The 5 stub SC-02 tool handlers (per C7 audit §7.1) are separate work streams (`sidecar-completeness-2026-06-06` Wave 2). The 2 stub session endpoints (`/api/state/sessions/:id/children` and `/context`) return `{ children: [] }` and `{ context: {} }` respectively — SC-04 uses these gracefully (no crash, no fake data).

**Inherits from:**
- SC-01: SseConnectionPool, SidecarDependencyRegistry, plugin HTTP server foundation
- SC-02 (partial): `GET /api/state/sessions` (real), `POST /api/tools/hivemind-session-view` (fixed), SSE event types
- SC-03 (framework): dashboard shell, `pluginClient` singleton, `stateStore`, `useSse` hook, TypeScript path aliases, Tailwind v4 + inline styles

**Does NOT inherit from:**
- SC-02's 5 stub tool handlers (`delegation-status`, `execute-slash-command`, `hivemind-trajectory`, `hivemind-command-engine`, `hivemind-session-view` BEFORE Wave 1 fix) — these are NOT in SC-04's consumption path
- SC-05/06/07 — these are sibling panels; SC-04 does not consume from them

</domain>

<spec_lock>

## Requirements (locked via SPEC.md)

**26 requirements across 5 categories** (see `04-SPEC.md` for full text):

**In scope (12 UR + 5 ER + 5 SR + 5 OF + 6 UB):**
- 12 ubiquitous (display, hierarchy, SSE subscription, status colors, search, metadata, expand, empty state, error banner, real data, keyboard nav, URL persistence)
- 5 event-driven (SSE add/remove, search debounce, refresh button, SSE reconnect indicator)
- 5 state-driven (plugin unavailable, 5xx error, children fetch fail, no match, SSE drop > 30s)
- 5 optional (messageCount badge, toolCallCount badge, last-updated timestamp, virtualization, Ctrl+K — last 2 deferred)
- 6 unwanted (no direct fetch, no stateStore mutation, no `any`, no `src/sidecar/` import, no blocking, no polling)

**20 falsifiable acceptance criteria** (AC-SC04-01 through AC-SC04-20) — see SPEC.md §Acceptance Criteria.

**Out of scope (deferred to SC-04.1 or future):**
- Session detail drill-in view (modal/page on row click)
- Full session message content rendering
- Session history/audit log
- Export session list as JSON/CSV
- Real-time cursor position / token counter
- Filter presets ("Active only", "My agents", "Failed in last 1h")
- Multi-select for batch operations
- Virtualization for 500+ sessions
- Ctrl/Cmd+K shortcut to focus search

</spec_lock>

<decisions>

## Implementation Decisions (Resolved — 10 gray areas)

### GA-1: Tree vs flat list display
**Decision:** **Tree (indented)** — render with 2rem indentation per depth level
**Rationale:** Matches the "session tree" terminology in the original sidecar vision (`.hivemind/planning/sidecar-vision/ARCHITECTURE.md` §7.5). Also matches the user mental model: "I delegated X, which spawned Y, which spawned Z." The `SessionSummary.children[]` field is already a tree structure; rendering it as a flat list would lose the hierarchy.

### GA-2: Auto-refresh interval
**Decision:** **SSE-driven only (no polling)**
**Rationale:** SSE events trigger store updates via `stateStore.handleEvent()`. The session list is fully derivable from the snapshot + SSE patches. Polling `GET /api/state/sessions` every N seconds is wasteful and conflicts with the server's SseConnectionPool (50 max per SC-01). Eventual consistency: snapshot is the source of truth, SSE events are deltas.
**Edge case handled by SR-SC04-05:** SSE drop > 30s shows "Connection lost" but does NOT fall back to polling (avoids server-side connection exhaustion).

### GA-3: Search debounce time
**Decision:** **150ms**
**Rationale:** Standard for search inputs (e.g., Algolia, GitHub). Balances responsiveness with performance. 100ms is faster but feels "twitchy"; 200ms feels laggy. 150ms is the documented Google Material Design search debounce.

### GA-4: Lazy-load children vs eager-load
**Decision:** **Lazy-load on expand** — use `pluginClient.getSessionChildren(id)` only when a row is expanded AND its `children[]` array is empty
**Rationale:** Sessions can have many children. Loading all children upfront is wasteful. Snapshot already includes top-level session list (real via `st.list()`). For deep hierarchies, lazy-load is essential.
**Caveat (current state):** `/api/state/sessions/:id/children` is a STUB returning `{ children: [] }` (per `state.ts:47-52`). SC-04 will display "No children" gracefully when the lazy-load returns empty. The real implementation is a separate work stream (`sidecar-completeness-2026-06-06` Wave 2 / GAP-02).

### GA-5: Sort order
**Decision:** **Most recent first (by `updatedAt` desc)**
**Rationale:** Matches user expectation of "what's happening now." Top of the list = most recently active. Stable secondary sort by `createdAt` desc for ties.
**Note:** `stateStore` does not sort — SC-04 sorts in the `useSessions` hook or in the `SessionTree` component.

### GA-6: Empty state copy
**Decision:** **"No active sessions"** with hint **"Start a delegation to see sessions here"**
**Rationale:** Educational, not just blank. Teaches the user how to populate the panel. Matches the SC-03 stub's tone (`index.tsx:46` — "Full implementation in SC-04. Live updates via SSE.").

### GA-7: Error retry strategy
**Decision:** **Exponential backoff (1s → 30s)** matching `use-sse.ts` constants (`SSE_RECONNECT_BASE_MS` = 1000, `SSE_MAX_BACKOFF_MS` = 30000 per `constants.ts:20-23`)
**Rationale:** Consistency with SSE backoff in `use-sse.ts`. Manual refresh button (ER-SC04-04) bypasses backoff for explicit user action.

### GA-8: Session detail view (drill-into)
**Decision:** **OUT OF SCOPE — deferred to SC-04.1**
**Rationale:** SC-04 = list/tree only. The `hivemind-session-view` tool is available (fixed in sidecar-completeness Wave 1) and can be invoked via `pluginClient.postSessionView({ sessionId })` (per `plugin-client.ts:192-195`), but the detail view UI is a separate phase.
**Documented open question (OQ-2):** SC-04.1 will own the drill-in modal/page.

### GA-9: Visual style: minimal vs rich
**Decision:** **Minimal (text + status colors)** — matches existing dashboard shell aesthetic
**Rationale:** Consistency over richness for v1. The dashboard shell uses inline styles with `var(--panel-border)`, `var(--status-connected)`, etc. (per `dashboard-shell.tsx:111-128`). SC-04 panel uses the same CSS variable system.
**No Tailwind classes** in panel components (per SC-03 D-SC03-05).

### GA-10: Filter persistence (URL param)
**Decision:** **Yes, `?session_filter=xxx`** — mirrors dashboard-shell's `?panel=` pattern
**Rationale:** Shareable links, browser back/forward works, refresh preserves state. Implemented via `useSearchParams` from `next/navigation` (same hook dashboard-shell.tsx:34 uses).

---

## Key Design Decisions (D-SC04-*)

### D-SC04-01: Component decomposition (3 new components + 1 hook)

- **`sidecar/src/lib/use-sessions.ts`** (NEW) — custom hook that reads from `stateStore` and exposes:
  ```typescript
  interface UseSessionsReturn {
    sessions: SessionSummary[]      // sorted by updatedAt desc
    loading: boolean                  // true on initial fetch
    error: Error | null               // last error from refreshSnapshot
    refresh: () => Promise<void>      // manual refresh trigger
  }
  ```

- **`sidecar/src/components/session-row.tsx`** (NEW) — single session display
  - Props: `session: SessionSummary`, `depth: number`, `expanded: boolean`, `onToggleExpand: () => void`, `onSelect: () => void`
  - Renders: status dot, description, id, agent, badges (messageCount, toolCallCount), expand chevron
  - Keyboard handlers: `Enter`/`Space` toggle expand, `ArrowRight` expand, `ArrowLeft` collapse

- **`sidecar/src/components/session-tree.tsx`** (NEW) — recursive tree container
  - Props: `sessions: SessionSummary[]`, `depth: number`, `expandedSet: Set<string>`, `onToggleExpand: (id: string) => void`
  - For each session, renders a `SessionRow` and recursively renders children if expanded
  - Lazy-load trigger: when `expanded && children.length === 0`, calls `getSessionChildren(id)` and merges result into local state

- **`sidecar/src/components/session-filter.tsx`** (NEW) — debounced search input
  - Props: `value: string`, `onChange: (v: string) => void`, `placeholder: string`
  - 150ms debounce via `useEffect` + `setTimeout` cleanup
  - URL-persisted via parent (panel reads/writes `?session_filter=`)

### D-SC04-02: State management

- **Read path:** `useSessions()` reads from `stateStore` via `store.get("/sessions")` (record → array conversion, sorted by `updatedAt desc`)
- **Write path:** SSE events handled by `useSse` → `stateStore.handleEvent()` patches `/sessions/:id`
- **No mutation from panel** (UB-SC04-02): all writes go through `stateStore.handleEvent` (SSE) or `stateStore.refreshSnapshot()` (manual refresh)

### D-SC04-03: SSE subscription

- Panel subscribes to SSE via `useSse({ onEvent })` — already provided by SC-03
- Filters for `session.*` events (5 types: `created`, `updated`, `idle`, `deleted`, `error`) and dispatches to `stateStore.handleEvent`
- Per-session `payload.session` is the partial `SessionSummary` (may lack some fields; merge with existing record)
- 30-second connection drop triggers `SR-SC04-05` banner (timer managed by `useSse` heartbeat at 90s, but SC-04 escalates earlier per UX decision)

### D-SC04-04: No new dependencies

- All consumed libraries already in `sidecar/package.json:1-39`:
  - `react@^19.0.0` — `useState`, `useEffect`, `useDeferredValue`, `useCallback`, `useRef`, `useMemo`
  - `next@^16.2.2` — `useSearchParams`, `useRouter` (from `next/navigation`)
  - No new package additions required

### D-SC04-05: Tree rendering

- **Native React recursion** — `SessionTree` calls itself for each child
- **No virtualization library** for v1 (matches `OF-SC04-04` deferral; estimated < 500 sessions typical)
- **No external tree library** (e.g., `react-arborist`) — keep LOC low, match existing aesthetic

### D-SC04-06: CSS variable system

- Reuses the existing CSS variables from `dashboard-shell.tsx`:
  - `--panel-border` (default `#e2e8f0`)
  - `--panel-bg` (default `#ffffff`)
  - `--status-connected` (default `#22c55e`)
  - `--status-running` (default `#3b82f6`)
  - `--status-pending` (default `#f59e0b`)
  - `--status-completed` (default `#94a3b8`)
  - `--status-failed` (default `#ef4444`)
  - `--skeleton-bg` (default `#e2e8f0`)
- All panel components use `var(--name, fallback)` pattern
- Inline `style={{ ... }}` objects (no Tailwind classes per SC-03 decision)

### D-SC04-07: Test file structure

- `sidecar/tests/use-sessions.test.ts` (NEW) — hook unit tests
- `sidecar/tests/session-row.test.tsx` (NEW) — component render tests
- `sidecar/tests/session-tree.test.tsx` (NEW) — tree recursion + lazy-load tests
- `sidecar/tests/session-filter.test.tsx` (NEW) — debounce + URL persistence tests
- `sidecar/tests/session-explorer.test.tsx` (NEW) — integration tests (the panel itself, with mocks)
- `sidecar/tests/dashboard-shell.test.tsx` (MODIFY) — update mock to return real sessions (not stub)

</decisions>

<canonical_refs>

## Canonical References

**Downstream implementers MUST read these before coding.**

### Architecture & Phase Documents
- `.planning/codebase/ARCHITECTURE.md` — §3 (two-server model, communication flow)
- `.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md` — §7.7 (GAP-01 fix in `hivemind-session-view.ts`)
- `.planning/phases/SC-03-nextjs-app/03-SPEC.md` — UR-SC03-04 (grid layout), OF-SC03-01 (URL panel)
- `.planning/phases/SC-03-nextjs-app/03-CONTEXT.md` — D-SC03-04 (URL ?panel=), D-SC03-08 (dynamic import)
- `.planning/phases/SC-03-nextjs-app/SC-03-FRAMEWORK-STATUS.md` — what SC-03 actually built (framework) vs didn't (panels)
- `.planning/phases/SC-03-nextjs-app/03-PLAN-CHECK.md` — SC-03 plan-check verdict (PASS, 0.92 confidence) — template
- `.planning/phases/SC-03-nextjs-app/03-RESEARCH.md` — SC-03 dependency versions (next 16.2.2, json-render 0.19.0, tailwind v4)
- `.planning/STATE.md` — D-SIDECAR-STATUS-TRUTH-01 (2026-06-06 honest re-baseline)
- `.planning/ROADMAP.md` — Sidecar section (SC-04 status: NEEDS-GSD, 2026-06-06 update)

### Upstream Phase Decisions (inherited)
- **D-SC01-01:** SseConnectionPool (50 max, 30s heartbeat) — SC-04's SSE consumer is bounded
- **D-SC01-02:** SidecarDependencyRegistry typed getters — SC-04 reads via plugin-server
- **D-SC02-12:** Port file sentinel — SC-04's `pluginClient` reads this
- **D-SC03-04:** URL `?panel=` persistence — SC-04 extends to `?session_filter=`
- **D-SC03-05:** Pre-bundled catalog (N/A for SC-04)
- **D-SC03-06:** StateStore via `createStateStore` — SC-04 reads via `useSessions()` hook
- **D-SC03-07:** Custom SSE hook — SC-04 uses `useSse` as-is
- **D-SC03-08:** Dynamic import per panel — SC-04 panel stays dynamically imported
- **D-SIDECAR-STATUS-TRUTH-01:** Honest re-baseline — SC-04 must use REAL data

### Codebase References (SC-04's consumption path)

#### Plugin-side (read by SC-04)
- `src/sidecar/server/routes/sessions.ts:24-37` — `GET /api/state/sessions` (REAL data via `sessionTracker.list()`)
- `src/sidecar/server/routes/state.ts:34-44` — duplicate `GET /api/state/sessions` (real, redundant)
- `src/sidecar/server/routes/state.ts:47-52` — `GET /api/state/sessions/:id/children` (STUB returns `[]`)
- `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:32-80` — `POST /api/tools/hivemind-session-view` (FIXED, returns real session)
- `src/sidecar/types.ts:17-29` — SIDECAR_EVENT_TYPES (5 session.* events)
- `src/sidecar/server/registry.ts:79-84` — `registry.sessionTracker` typed getter

#### Sidecar-side (consumed by SC-04)
- `sidecar/src/lib/types.ts:14-25` — SessionSummary
- `sidecar/src/lib/types.ts:104-121` — SidecarEventType + SidecarEvent
- `sidecar/src/lib/types.ts:150-164` — SidecarState (stateStore shape)
- `sidecar/src/lib/plugin-client.ts:120-122` — getSessions() (typed)
- `sidecar/src/lib/plugin-client.ts:124-127` — getSessionChildren(id) (typed, returns stub data)
- `sidecar/src/lib/plugin-client.ts:192-195` — postSessionView(params) (typed, returns real data)
- `sidecar/src/lib/state-store.ts:19-127` — createSidecarStateStore (initialize, refreshSnapshot, handleEvent)
- `sidecar/src/lib/use-sse.ts:47-178` — useSse hook (exponential backoff, heartbeat)
- `sidecar/src/lib/constants.ts:53-78` — PANELS array
- `sidecar/src/lib/constants.ts:81` — DEFAULT_PANEL = "session-explorer" (this panel)
- `sidecar/src/components/dashboard-shell.tsx:33-264` — parent dashboard shell (renders this panel)

#### Sidecar-side (REPLACED by SC-04)
- `sidecar/src/panels/session-explorer/index.tsx:1-50` — current hardcoded stub (replaced with real impl)

#### Test infrastructure (existing in SC-03)
- `sidecar/vitest.config.ts` (NEW in SC-03)
- `sidecar/tests/dashboard-shell.test.tsx` (existing — modify to expect real data)
- `sidecar/tests/state-store.test.ts` (existing — SC-04 can reuse mocks)
- `sidecar/tests/use-sse.test.ts` (existing — SC-04 can reuse mock SSE)
- `sidecar/tests/plugin-client.test.ts` (existing — SC-04 can reuse typed mocks)

</canonical_refs>

<code_context>

## Existing Code Insights

### Real vs Stub APIs (verified 2026-06-06)

| API | Status | Source | SC-04 usage |
|-----|--------|--------|-------------|
| `GET /api/state/sessions` | ✅ REAL | `state.ts:34-44` calls `sessionTracker.list()` | Primary data source for tree |
| `GET /api/state/sessions/:id/children` | ❌ STUB | `state.ts:47-52` returns `{ children: [] }` | Lazy-load fallback (renders "No children") |
| `GET /api/state/sessions/:id/context` | ❌ STUB | `state.ts:54-59` returns `{ context: {} }` | NOT USED in SC-04 (drill-in is SC-04.1) |
| `POST /api/tools/hivemind-session-view` | ✅ REAL (FIXED) | `hivemind-session-view.ts:32-80` | Available for SC-04.1 drill-in |
| SSE `session.*` events | ✅ REAL | `use-sse.ts:113-124` dispatches to stateStore | Live updates |

### StateStore behavior (per `state-store.ts`)

- `initialize()` populates `/sessions` (record), `/delegations`, `/trajectory`, etc. from `pluginClient.snapshot()`
- `refreshSnapshot()` re-runs `initialize()` (full re-fetch)
- `handleEvent(event)` patches `/sessions/:id` for `session.*` events, calls `initialize()` for `invalidate.cache` events with `category === "sessions"`

### useSse behavior (per `use-sse.ts`)

- Returns `{ connected, lastEvent, reconnect }`
- 1s→2s→4s→8s→16s→30s exponential backoff
- Heartbeat: 90s timeout → `setConnected(false)`
- Cleanup on unmount: `eventSource.close()`, clear timers

### Existing CSS variables (per `dashboard-shell.tsx:111-128`)

- `--panel-border`, `--panel-bg`, `--panel-header-bg`, `--panel-active-tab`, `--panel-inactive-tab`, `--status-connected`, `--status-disconnected`, `--skeleton-bg`

### 70 existing unit tests pass (per `sidecar-panel-render-fix-2026-06-06` Wave 1)

- SC-04 must not regress these
- New tests target 20 ACs in `04-SPEC.md`

### Risk Areas Identified

- **R1: Stub `getSessionChildren` returns `[]`** — Panel must show "No children" gracefully (NOT crash, NOT show fake children). Already documented in UR-SC04-07.
- **R2: SSE `payload.session` may be partial** — `stateStore.handleEvent` patches with full `payload.session`; if a field is missing in the event, the existing record's field is overwritten with `undefined`. **Mitigation:** merge strategy in `stateStore.handleEvent` to preserve existing fields (future improvement, not SC-04 scope).
- **R3: `pluginClient.discoverPort()` may read stale port** — If plugin restarts, port changes; `pluginClient` doesn't re-read sentinel on every call. SC-04 surfaces via SR-SC04-01 ("Plugin server not available" + Retry).
- **R4: `stateStore` is a singleton, not a React context** — If multiple panels mount simultaneously, they share the same store. SC-04 doesn't need to worry (panel is the only consumer of `/sessions`).
- **R5: 1000+ sessions in tree** — Per OF-SC04-04, virtualization deferred. For v1, native rendering with React keys; monitor performance with `useDeferredValue` if needed.

</code_context>

<boundaries>

## Execution Boundaries (planner-facing)

### Allowed Surfaces (SC-04 implementation)

**Read-only consumption (no writes):**
- `src/sidecar/server/routes/sessions.ts` — read source for understanding API
- `src/sidecar/server/routes/state.ts` — read source for understanding API
- `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts` — read source
- `src/sidecar/types.ts` — read SidecarEventType definition
- `src/sidecar/server/registry.ts` — read registry

**Writes (SC-04 scope):**
- `sidecar/src/panels/session-explorer/index.tsx` — REPLACE stub with real impl
- `sidecar/src/lib/use-sessions.ts` — NEW
- `sidecar/src/components/session-row.tsx` — NEW
- `sidecar/src/components/session-tree.tsx` — NEW
- `sidecar/src/components/session-filter.tsx` — NEW
- `sidecar/tests/session-explorer.test.tsx` — NEW
- `sidecar/tests/use-sessions.test.ts` — NEW
- `sidecar/tests/session-row.test.tsx` — NEW
- `sidecar/tests/session-tree.test.tsx` — NEW
- `sidecar/tests/session-filter.test.tsx` — NEW
- `sidecar/tests/dashboard-shell.test.tsx` — MODIFY (expect real sessions, not stub)

**Optional (if needed):**
- `sidecar/src/lib/types.ts` — ADD `SessionTreeNode` type if reused widely
- `sidecar/src/lib/state-store.ts` — MINOR edit if merging strategy needed (R2)

### Forbidden Surfaces

- ❌ `src/sidecar/server/routes/sessions.ts` — no plugin-side change (already real)
- ❌ `src/sidecar/server/routes/state.ts` — no plugin-side change (children/context stubs are separate work)
- ❌ `src/sidecar/server/tool-proxy/handlers/*.ts` — 5 other stub handlers are separate work
- ❌ `src/sidecar/server/registry.ts` — typed getters already correct
- ❌ `src/plugin.ts` — no plugin-side changes
- ❌ `sidecar/src/lib/plugin-client.ts` — SC-03's `pluginClient` is sufficient (UB-SC04-01)
- ❌ `sidecar/src/lib/use-sse.ts` — SC-03's `useSse` is sufficient
- ❌ `sidecar/src/components/dashboard-shell.tsx` — parent shell unchanged (D-SC03-04)
- ❌ `sidecar/src/panels/{delegation-dashboard,mems-browser,control-panel}/` — sibling panels
- ❌ `sidecar/src/lib/catalog.ts` — no json-render catalog changes (SC-04 doesn't use Renderer)
- ❌ `.opencode/**` — soft meta-concepts
- ❌ `sidecar/package.json` — no new dependencies (D-SC04-04)
- ❌ `sidecar/next.config.ts` — no Next.js config changes
- ❌ `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md` — L0 territory
- ❌ `AGENTS.md` — root governance

### Actors / Consumers

- **Primary consumer:** human operator (browser) at `http://127.0.0.1:3099/?panel=session-explorer`
- **Downstream panels:** SC-05/06/07 do not consume from SC-04 (each panel reads from `stateStore` independently)
- **Future consumers:** SC-04.1 (session detail drill-in) will reuse `SessionRow` and `SessionTree` components

### Verification Commands (post-execution, NOT in this wave)

- **Type check:** `cd sidecar && npx tsc --noEmit` (must pass with strict mode, 0 errors)
- **Unit tests:** `cd sidecar && npx vitest run` (all 70 existing + new SC-04 tests pass)
- **Build:** `cd sidecar && npx next build` (standalone output produced)
- **Manual smoke:** `cd sidecar && npx next dev` + start plugin server, browse `http://localhost:3099/?panel=session-explorer`, verify:
  1. Panel shows real sessions (NOT "ses_1/ses_2/ses_3" stubs)
  2. New session created → appears in panel within 500ms
  3. Session deleted → removed within 500ms
  4. Search "ses_1" → filters to matching sessions
  5. Click row → expands (shows children or "No children" if stub)
  6. Kill plugin server → "Plugin server not available" with Retry button
  7. Restart plugin server → panel auto-refreshes (SSE reconnect)
- **Full regression:** `npm test` from project root (2,963+ tests pass)

### Stop Conditions

- ✅ `04-SPEC.md`, `04-CONTEXT.md`, `04-RESEARCH.md`, `04-PATTERNS.md`, `04-PLAN.md`, `04-PLAN-CHECK.md` written
- ✅ All 20 ACs in SPEC documented with falsifiable pass conditions
- ✅ 10 gray areas resolved, 7 design decisions locked
- ✅ Allowed/forbidden surfaces explicit
- ⏹️ STOP — do NOT auto-start EXECUTION phase (Checkpoint 9); wait for user authorization per `00-landscape.md` §User Authorization Points
- ⏹️ STOP — do NOT touch `src/sidecar/`, other panels, or root `.planning/`

</boundaries>

---

*Context authored: 2026-06-06 — Wave 2 of `sidecar-honest-rebaseline-2026-06-06`. This file captures 10 resolved gray areas and 7 design decisions that scope SC-04's implementation. Ready for `/hm-research` → 04-RESEARCH.md.*
