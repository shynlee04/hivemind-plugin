---
phase: SC-03
name: nextjs-16-standalone-app
status: planned
date: 2026-06-03
depends_on:
  - SC-01 (Foundation — Plugin HTTP Server + State Bridge) ✅ COMPLETE
  - SC-02 (REST API + Tool Proxy) ✅ COMPLETE
blocks:
  - SC-04 (Session Explorer Panel)
  - SC-05 (Delegation Dashboard)
  - SC-06 (MEMS Browser)
  - SC-07 (Control Panel)
waves: 5
total_files: 28
total_loc_estimate: 2430
key_risks:
  - json-render v0.1.0->v0.19.0 API discontinuity (mitigated: zero existing catalog code in sidecar/)
  - Standalone mode process.cwd() resolution for port file (mitigated: HIVEMIND_DIR env var)
  - Tailwind v4 @source directive path resolution for shadcn
  - SSE EventSource listener accumulation on reconnect
  - Port file not found during independent development (mitigated: fallback port 3199)
---

# Phase SC-03: Next.js 16 Standalone App — PLAN

## Goal

Transform the bare `sidecar/` skeleton (Next.js 15 stub, `@json-render/react@^0.1.0`, no panels) into the full Next.js 16 standalone application serving as the sidecar GUI shell. SC-03 ships the dashboard shell, plugin HTTP client, unified json-render catalog, StateStore with SSE-driven refresh, loading skeleton, error boundary, and 4 panel stubs for SC-04/05/06/07.

**Observable truths when SC-03 is complete:**
1. `next build` succeeds with `output: "standalone"` — `.next/standalone/server.js` exists and is runnable
2. `plugin-client.ts` discovers plugin port from `.hivemind/state/sidecar-port.json` and exposes 17 typed endpoint methods
3. StateStore initializes from `GET /api/state/snapshot` and refreshes via SSE events
4. Dashboard shell renders 4-panel grid (2×2) with tab navigation persisted in URL search params
5. json-render catalog defines exactly 44 components (36 shadcn + 8 custom)
6. SSE client connects with exponential backoff reconnection (1s → 2s → 4s → 8s → 16s → 30s max)
7. Error boundary catches render failures without crashing other panels
8. Loading skeleton shows during dynamic imports of panel chunks
9. No imports from `src/sidecar/` exist in any `sidecar/src/` file
10. `Renderer` loaded via `next/dynamic({ ssr: false })` preventing hydration mismatches

---

## Must-Haves (Goal-Backward from SPEC Acceptance Criteria)

| Must-Have | AC Reference | Artifact(s) | Key Link |
|-----------|-------------|-------------|----------|
| App builds with standalone output | AC-SC03-01 | `sidecar/next.config.ts`, `sidecar/package.json` | `output: "standalone"` in next.config.ts |
| Plugin client discovers port and exposes 17 typed methods | AC-SC03-02, AC-SC03-03 | `sidecar/src/lib/plugin-client.ts` | Reads `.hivemind/state/sidecar-port.json` |
| StateStore initializes from snapshot endpoint | AC-SC03-04 | `sidecar/src/lib/state-store.ts` | `plugin-client.snapshot()` → `createStateStore` |
| SSE client connects and dispatches events | AC-SC03-05 | `sidecar/src/lib/use-sse.ts` | EventSource → store.set(path, value) |
| Dashboard shell renders 4-panel grid | AC-SC03-06 | `sidecar/src/components/dashboard-shell.tsx` | 2×2 grid with tab navigation |
| json-render catalog defines 44 components | AC-SC03-07 | `sidecar/src/lib/catalog.ts` | `defineCatalog()` with 44 entries |
| Tab switch updates URL and visible panel | AC-SC03-08 | `sidecar/src/components/dashboard-shell.tsx` | `useSearchParams` / `useRouter` |
| Error boundary catches render errors | AC-SC03-09 | `sidecar/src/components/error-boundary.tsx` | `componentDidCatch` with fallback UI |
| Loading skeleton shown during dynamic import | AC-SC03-10 | `sidecar/src/app/loading.tsx` | `next/dynamic` with loading component |
| No plugin-side imports in sidecar code | AC-SC03-11 | All sidecar/src/ files | grep returns empty |
| SSE reconnection with exponential backoff | AC-SC03-12 | `sidecar/src/lib/use-sse.ts` | Cleanup + reconnect timer |
| Renderer loaded via `next/dynamic({ ssr: false })` | AC-SC03-13 | `sidecar/src/app/page.tsx` | `dynamic(() => import(...), { ssr: false })` |

---

## Dependency Graph

```
Wave 0 (Test Scaffolds)
  ├── vitest.config.ts
  └── All test files (*.test.ts)
       ↓ (no deps — test definitions drive implementation)

Wave 1 (Foundation)
  ├── sidecar/package.json               # Dep upgrades
  ├── sidecar/next.config.ts             # Standalone output
  ├── sidecar/tsconfig.json              # Path aliases
  ├── sidecar/src/lib/types.ts           # SC-03 type definitions
  ├── sidecar/src/lib/constants.ts       # Panel definitions, port config
  ├── sidecar/src/lib/plugin-client.ts   # Typed HTTP client (needs types.ts, constants.ts)
  ├── sidecar/src/lib/catalog.ts         # 44-component catalog (needs types.ts)
  ├── sidecar/src/lib/state-store.ts     # StateStore (needs plugin-client.ts, constants.ts)
  ├── sidecar/src/lib/use-sse.ts         # SSE hook (needs state-store.ts)
  └── sidecar/src/app/globals.css        # Tailwind v4 @source
       ↓

Wave 2 (Dashboard Shell)
  ├── sidecar/src/components/error-boundary.tsx
  ├── sidecar/src/components/dashboard-shell.tsx  (needs constants.ts, use-sse.ts)
  ├── sidecar/src/app/layout.tsx                   (needs state-store.ts)
  ├── sidecar/src/app/page.tsx                     (needs dashboard-shell.tsx)
  ├── sidecar/src/app/loading.tsx
  └── sidecar/src/app/error.tsx
       ↓

Wave 3 (Panel Stubs)
  ├── sidecar/src/panels/session-explorer/index.tsx + specs.ts
  ├── sidecar/src/panels/delegation-dashboard/index.tsx + specs.ts
  ├── sidecar/src/panels/mems-browser/index.tsx + specs.ts
  └── sidecar/src/panels/control-panel/index.tsx + specs.ts
       ↓

Wave 4 (Integration)
  ├── Run typecheck
  ├── Run unit tests
  ├── Run next build (verify standalone)
  ├── Run root regression tests
  └── Performance baselines + phase gate
```

---

## Wave 0: TDD Red — Test Scaffolds

### Objective

Create all test files and vitest configuration BEFORE any implementation. These tests define the expected behavior and serve as the TDD red phase. Tests establish falsifiable pass/fail for every acceptance criterion.

### Allowed Surfaces
- `sidecar/vitest.config.ts` — NEW
- `sidecar/tests/` — NEW directory with test files
- `sidecar/package.json` — Add vitest, @testing-library/react devDeps (test scaffold only)

### Forbidden Surfaces
- ❌ Do NOT implement any source modules (src/lib/, src/components/, src/panels/, src/app/)
- ❌ Do NOT modify `sidecar/next.config.ts` beyond vitest config setup
- ❌ Do NOT touch `src/sidecar/`, `src/plugin.ts`, or any non-sidecar paths

### Task List

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| T0.1 | Create vitest config for sidecar | `sidecar/vitest.config.ts` | Write vitest config targeting `tests/` with jsdom environment, React testing library setup, and path alias resolution for `@/` → `src/` | `vitest run --config sidecar/vitest.config.ts` shows 0 tests (expected) | Config file exists and vitest discovers test files |
| T0.2 | Write plugin-client test scaffold | `sidecar/tests/plugin-client.test.ts` | Write test: port discovery from sentinel file, all 17 endpoint methods return typed responses with mock fetch, error handling on connection failure | Tests assert correct shape of mock responses | All tests are RED (not yet passing) |
| T0.3 | Write state-store test scaffold | `sidecar/tests/state-store.test.ts` | Write test: snapshot init, SSE event dispatch patches store path, cache invalidation triggers re-fetch, "not available" state fallback | Tests assert store shape matches SidecarState | All tests are RED |
| T0.4 | Write use-sse test scaffold | `sidecar/tests/use-sse.test.ts` | Write test: EventSource connection, event dispatch to store, cleanup on unmount, exponential backoff reconnection (1s/2s/4s/8s/16s/30s), heartbeat timeout after 90s | Tests assert reconnect timers and cleanup | All tests are RED |
| T0.5 | Write catalog test scaffold | `sidecar/tests/catalog.test.ts` | Write test: catalog has 44 components, each component has required fields (type, schema, component), shadcn components importable | Test asserts `Object.keys(catalog.components).length === 44` | All tests are RED |
| T0.6 | Write dashboard-shell test scaffold | `sidecar/tests/dashboard-shell.test.tsx` | Write test: renders 4 grid cells, tab click updates URL, URL param activates correct panel, non-selected panels hidden but mounted, SSE indicator shows connection state | Render test with mock panels | All tests are RED |
| T0.7 | Write error-boundary test scaffold | `sidecar/tests/error-boundary.test.tsx` | Write test: throws in child → fallback UI shown, other panels unaffected | Test with throw component | All tests are RED |
| T0.8 | Write loading test scaffold | `sidecar/tests/loading.test.tsx` | Write test: skeleton renders matching panel dimensions | Render test | All tests are RED |

### Verification Gate

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Primary | `cd sidecar && npx vitest run` | Tests are discovered and run (expected: some RED, some PASS) |
| Secondary | `npx vitest run --config sidecar/vitest.config.ts --reporter verbose` | All test files loaded, no import errors |
| Tertiary | Inspect each test file | Every AC from SPEC has at least one corresponding test |

### Atomic Commit Message

```
SC-03 Wave 0: Add TDD test scaffolds and vitest config for sidecar

- Create vitest.config.ts with jsdom + React testing library
- Write plugin-client test: port discovery, 17 endpoint methods, error handling
- Write state-store test: snapshot init, SSE patching, cache invalidation
- Write use-sse test: EventSource, event dispatch, exponential backoff, cleanup
- Write catalog test: 44 components, shadcn imports
- Write dashboard-shell test: 4-panel grid, tab navigation, URL sync
- Write error-boundary test: crash isolation, fallback UI
- Write loading test: skeleton rendering

Red-phase tests define expected behavior before implementation.
```

---

## Wave 1: Foundation — Dep Upgrades + Next.js Config + Core Libraries

### Objective

Upgrade all dependencies to target versions, configure Next.js 16 for standalone output, and implement all core library modules (`plugin-client.ts`, `catalog.ts`, `state-store.ts`, `use-sse.ts`, `types.ts`, `constants.ts`). This wave establishes the runtime infrastructure that all panels and shell components depend on.

### Allowed Surfaces
- `sidecar/package.json` — Upgrade deps (next 16, json-render 0.19, shadcn, tailwind v4)
- `sidecar/next.config.ts` — Standalone mode, headers, port config
- `sidecar/tsconfig.json` — Add path aliases (`@/`, `@lib/`, `@components/`, `@panels/`)
- `sidecar/src/lib/types.ts` — NEW: SC-03 type definitions
- `sidecar/src/lib/constants.ts` — NEW: panel definitions, port config
- `sidecar/src/lib/plugin-client.ts` — NEW: typed HTTP client
- `sidecar/src/lib/catalog.ts` — NEW: 44-component json-render catalog
- `sidecar/src/lib/state-store.ts` — NEW: StateStore + snapshot refresh
- `sidecar/src/lib/use-sse.ts` — NEW: SSE client hook
- `sidecar/src/app/globals.css` — NEW: Tailwind v4 with `@source` directive
- `sidecar/README.md` — Update with architecture and usage

### Forbidden Surfaces
- ❌ Do NOT implement dashboard shell or panel components
- ❌ Do NOT modify app/layout.tsx or app/page.tsx beyond globals.css import
- ❌ Do NOT touch `src/sidecar/`, `src/plugin.ts`, or any non-sidecar paths
- ❌ Do NOT import `@hivemind` or `hivemind` packages
- ❌ Do NOT use `fs.readFileSync` from Next.js code

### Task List

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| T1.1 | Upgrade sidecar dependencies | `sidecar/package.json` | Set next → `^16.2.2`, @json-render/react → `^0.19.0`; ADD @json-render/core, @json-render/shadcn, tailwindcss, @tailwindcss/postcss, zod; ADD vitest, @testing-library/react as devDeps; ADD typecheck + test scripts. Then run `npm install`. | `cat package.json | grep next` shows ^16.2.2; `npm ls next` resolves to 16.x | All deps installed without peer warnings |
| T1.2 | Configure Next.js 16 standalone | `sidecar/next.config.ts` | Add `output: "standalone"`, server port config (3099 default), CORS headers for localhost plugin communication | `npx next build` succeeds; `.next/standalone/server.js` exists | Build produces standalone output |
| T1.3 | Configure TypeScript path aliases | `sidecar/tsconfig.json` | Add `@lib/*` → `./src/lib/*`, `@components/*` → `./src/components/*`, `@panels/*` → `./src/panels/*` | `npx tsc --noEmit` passes | Path aliases resolve |
| T1.4 | Create SC-03 type definitions | `sidecar/src/lib/types.ts` | Define types matching SC-02 schemas: `StateSnapshot`, `SessionSummary`, `DelegationSummary`, `TrajectoryEvent`, `SidecarState`, `SidecarEvent`, `SidecarEventType`, `ToolResponse`, `CatalogResponse`, `ToolCatalogEntry`, `DocChunk`, `ChildSession`, `SessionContext` | Types compile; match SC-02 response shapes | Full type coverage for all 17 endpoints |
| T1.5 | Create constants module | `sidecar/src/lib/constants.ts` | Define: `PANELS` array with id/label/icon/description, `DEFAULT_PORT` (3099), `FALLBACK_PORT` (3199), `SSE_RECONNECT_BASE_MS` (1000), `SSE_MAX_BACKOFF_MS` (30000), `HEARTBEAT_TIMEOUT_MS` (90000), `PLUGIN_CHECK_INTERVAL_MS` (5000), `PORT_FILE_PATH` relative reference | Constants file exports all values; type-safe | All constants exported |
| T1.6 | Implement plugin HTTP client | `sidecar/src/lib/plugin-client.ts` | Implement: port discovery from `.hivemind/state/sidecar-port.json`, base URL caching, re-read on error, typed methods for all 17 endpoints (6 GET state, 7 POST tool, 1 SSE, 1 catalog GET, 1 catalog tools GET, 1 WS), error wrapper returning typed errors, fallback port 3199 | All 17 methods have typed signatures; unit tests pass | Full SC-02 surface coverage |
| T1.7 | Create json-render catalog | `sidecar/src/lib/catalog.ts` | Use `defineCatalog()` from `@json-render/core`; define 44 components: 36 from `@json-render/shadcn` re-exported, 8 custom (SidecarContainer, PanelHeader, StatusBadge, MetricCard, SessionTree, DelegationList, TimelineView, ConnectionIndicator); each custom component with type-safe schema, component binding, and default props | `Object.keys(catalog.components).length === 44`; catalog compiles | Full catalog |
| T1.8 | Implement StateStore | `sidecar/src/lib/state-store.ts` | Use `createStateStore` from `@json-render/react`; wrap in `StateProvider`; implement: `initialize()` that calls `plugin-client.snapshot()`, `refreshSnapshot()` for bulk refresh, SSE event handlers for each event type, cache invalidation for `invalidate.cache` events, session patching for `session.*` events, delegation patching for `delegation.*` events | StateStore init test passes; SSE patch test passes | StateStore wired |
| T1.9 | Implement SSE client hook | `sidecar/src/lib/use-sse.ts` | `'use client'` hook wrapping browser `EventSource`; connect to `GET /api/events` via plugin-client; dispatch events to StateStore by type; exponential backoff (1s→2s→4s→8s→16s→30s); cleanup on unmount (close EventSource); heartbeat timeout detection (90s); return `{ connected, lastEvent }` | SSE reconnect test passes; cleanup test passes | SSE hook ready |
| T1.10 | Create Tailwind v4 CSS entry | `sidecar/src/app/globals.css` | Add `@import "tailwindcss"`, add `@source "../../node_modules/@json-render/shadcn/dist"`, add base layer with CSS variables for panel colors | Build succeeds; shadcn classes present in output | Tailwind v4 working |
| T1.11 | Update sidecar README | `sidecar/README.md` | Document: two-server architecture, port discovery, dependency requirements, `HIVEMIND_DIR` env var for production, how to run dev (`next dev`), how to build (`next build`), how to run standalone (`node .next/standalone/server.js`) | README contains all sections | Documentation complete |

### Verification Gate

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Primary | `cd sidecar && npx tsc --noEmit` | 0 type errors |
| Secondary | `cd sidecar && npx vitest run` | All Wave 0 RED tests now GREEN (implementation matches spec) |
| Tertiary | `cd sidecar && npx next build` | Build succeeds with standalone output |
| Quaternary | Verify `grep -r "src/sidecar" sidecar/src/` | Empty output (AC-SC03-11) |

### Atomic Commit Message

```
SC-03 Wave 1: Upgrade deps to Next.js 16 + json-render 0.19, implement core libs

- Upgrade sidecar/package.json: next ^16.2.2, @json-render/* ^0.19.0, tailwindcss v4
- Configure Next.js 16 output: "standalone" on port 3099
- Add tsconfig path aliases (@lib/, @components/, @panels/)
- Implement plugin-client.ts: typed client for all 17 SC-02 endpoints
- Implement catalog.ts: 44-component json-render catalog (36 shadcn + 8 custom)
- Implement state-store.ts: reactive store with snapshot fetch + SSE patching
- Implement use-sse.ts: SSE hook with exponential backoff reconnection
- Add types.ts, constants.ts with full type coverage
- Configure Tailwind v4 with @source directive for shadcn
- All TDD RED tests now GREEN
```

---

## Wave 2: Dashboard Shell + App Pages

### Objective

Implement the dashboard shell component with 4-panel tab navigation and all app-level pages (layout, page, loading, error). Wire the layout with StateProvider and metadata. The dashboard shell is a `'use client'` component that reads URL `?panel=` param and renders the correct panel grid cells.

### Allowed Surfaces
- `sidecar/src/app/layout.tsx` — REWRITE with StateProvider, metadata, fonts, globals.css import
- `sidecar/src/app/page.tsx` — REWRITE with dashboard shell dynamic import
- `sidecar/src/app/loading.tsx` — NEW: loading skeleton
- `sidecar/src/app/error.tsx` — NEW: error boundary page
- `sidecar/src/components/dashboard-shell.tsx` — NEW: tab navigation + grid layout
- `sidecar/src/components/error-boundary.tsx` — NEW: React error boundary

### Forbidden Surfaces
- ❌ Do NOT implement panel-specific content (SC-04/05/06/07 scope)
- ❌ Do NOT import from `src/sidecar/`
- ❌ Do NOT modify core lib files from Wave 1
- ❌ Do NOT implement WebSocket client

### Task List

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| T2.1 | Create error boundary component | `sidecar/src/components/error-boundary.tsx` | `'use client'` React error boundary with `componentDidCatch`; renders fallback with error message and retry button; accepts `fallback` prop and `onError` callback | Error boundary test passes | Error boundary ready |
| T2.2 | Create dashboard shell | `sidecar/src/components/dashboard-shell.tsx` | `'use client'` component with: tab navigation bar (4 tabs), 2×2 grid layout, URL search param sync via `useSearchParams`/`useRouter`, `?panel=sessions|delegation|mems|control` persistence, non-selected panels hidden via CSS `display: none` (stay mounted), SSE `connected` status indicator in header, "Sidecar not available" state when plugin unreachable | Tab switch test passes; URL sync test passes; SSE indicator renders | Dashboard shell complete |
| T2.3 | Rewrite root layout | `sidecar/src/app/layout.tsx` | Wrap with `StateProvider` from state-store; add metadata (title: "Hivemind Sidecar", description, viewport); add font imports (Inter from next/font); add class-based dark mode support; import globals.css; set HTML lang | Layout renders without hydration errors | Root layout ready |
| T2.4 | Rewrite root page | `sidecar/src/app/page.tsx` | Dynamic import of `dashboard-shell` via `next/dynamic(() => import(...), { ssr: false })` for the `Renderer` wrapper; fallback loading skeleton; mount dashboard shell as main content | Page loads with 4-panel grid | Root page complete |
| T2.5 | Create loading skeleton | `sidecar/src/app/loading.tsx` | Export default loading component with animated skeleton matching 4-panel grid layout; use Tailwind animate-pulse for shimmer effect; each skeleton cell matches panel dimension | Loading skeleton renders during dynamic import | Loading state complete |
| T2.6 | Create error boundary page | `sidecar/src/app/error.tsx` | `'use client'` error page; receives `error` and `reset` props; renders "Something went wrong" with error details and "Try again" button; wraps all panels individually | Error boundary test passes; one panel crash ≠ all panels down | Error page complete |

### Verification Gate

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Primary | `cd sidecar && npx tsc --noEmit` | 0 type errors |
| Secondary | `cd sidecar && npx vitest run` | Dashboard shell, error boundary, loading tests pass |
| Tertiary | `cd sidecar && npx next dev` (manual) | Browse to localhost:3099 — dashboard loads with 4-panel grid, tabs work, URL updates |
| Quaternary | Verify `grep -r "src/sidecar" sidecar/src/` | Empty output |

### Atomic Commit Message

```
SC-03 Wave 2: Implement dashboard shell with 4-panel tab navigation and app pages

- Create dashboard-shell.tsx: tab navigation, 2×2 grid, URL-persisted panel state
- Create error-boundary.tsx: React error boundary with fallback and retry
- Rewrite layout.tsx: StateProvider, fonts, metadata, dark mode class
- Rewrite page.tsx: dynamic Renderer import with ssr:false
- Add loading.tsx: animated skeleton with pulse animation
- Add error.tsx: per-panel error boundary with "Try again"
```

---

## Wave 3: Panel Stubs with Pre-built json-render Specs

### Objective

Create the 4 panel stubs that serve as landing slots for SC-04/05/06/07. Each panel stub includes a placeholder `index.tsx` component and a pre-built json-render spec file (`specs.ts`). The stubs render using the json-render `Renderer` component with their static specs.

### Allowed Surfaces
- `sidecar/src/panels/session-explorer/index.tsx` — NEW: stub panel
- `sidecar/src/panels/session-explorer/specs.ts` — NEW: pre-built json-render spec
- `sidecar/src/panels/delegation-dashboard/index.tsx` — NEW: stub panel
- `sidecar/src/panels/delegation-dashboard/specs.ts` — NEW: pre-built json-render spec
- `sidecar/src/panels/mems-browser/index.tsx` — NEW: stub panel
- `sidecar/src/panels/mems-browser/specs.ts` — NEW: pre-built json-render spec
- `sidecar/src/panels/control-panel/index.tsx` — NEW: stub panel
- `sidecar/src/panels/control-panel/specs.ts` — NEW: pre-built json-render spec

### Forbidden Surfaces
- ❌ Do NOT implement panel-specific business logic (SC-04/05/06/07 scope)
- ❌ Do NOT implement real data fetching logic (stubs use mock/static data only)
- ❌ Do NOT implement WebSocket client (SC-05 scope)
- ❌ Do NOT implement tool proxy buttons (SC-07 scope)
- ❌ Do NOT modify core lib files or dashboard shell

### Task List

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| T3.1 | Session Explorer panel stub | `sidecar/src/panels/session-explorer/index.tsx`, `sidecar/src/panels/session-explorer/specs.ts` | Create stub panel: `'use client'` with dynamic Renderer; spec.ts defines json-render spec for session tree view (session list, children, context) using shadcn Card + Badge + custom SessionTree component | Panel renders placeholder; spec has valid json-render format | Session Explorer stub ready |
| T3.2 | Delegation Dashboard panel stub | `sidecar/src/panels/delegation-dashboard/index.tsx`, `sidecar/src/panels/delegation-dashboard/specs.ts` | Create stub panel: `'use client'` with dynamic Renderer; spec.ts defines json-render spec for delegation list (status badges, timing, agent names) using shadcn Table + Badge + custom DelegationList component | Panel renders placeholder; spec has valid json-render format | Delegation Dashboard stub ready |
| T3.3 | MEMS Browser panel stub | `sidecar/src/panels/mems-browser/index.tsx`, `sidecar/src/panels/mems-browser/specs.ts` | Create stub panel: `'use client'` with dynamic Renderer; spec.ts defines json-render spec for memory/document browser (graph view, trajectory timeline, pressure gauge) using shadcn Card + ScrollArea + custom TimelineView + MetricCard components | Panel renders placeholder; spec has valid json-render format | MEMS Browser stub ready |
| T3.4 | Control Panel panel stub | `sidecar/src/panels/control-panel/index.tsx`, `sidecar/src/panels/control-panel/specs.ts` | Create stub panel: `'use client'` with dynamic Renderer; spec.ts defines json-render spec for command console (tool buttons, command input placeholder) using shadcn Button + Input + custom StatusBadge + ConnectionIndicator components | Panel renders placeholder; spec has valid json-render format | Control Panel stub ready |

### Verification Gate

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Primary | `cd sidecar && npx tsc --noEmit` | 0 type errors |
| Secondary | `cd sidecar && npx vitest run` | Panel-related tests pass (dashboard shell detects 4 panels) |
| Tertiary | Manual review: `ls sidecar/src/panels/*/index.tsx` | All 4 panel dirs exist with index.tsx + specs.ts |
| Quaternary | Verify `grep -r "src/sidecar" sidecar/src/panels/` | Empty output |

### Atomic Commit Message

```
SC-03 Wave 3: Create 4 panel stubs with pre-built json-render specs

- Add session-explorer stub + json-render spec (session tree, children, context)
- Add delegation-dashboard stub + json-render spec (delegation list, status badges)
- Add mems-browser stub + json-render spec (graph view, trajectory, pressure)
- Add control-panel stub + json-render spec (tool buttons, command placeholder)
- Each panel uses dynamic Renderer with ssr:false and typed spec
- All panels are placeholders — real implementation deferred to SC-04/05/06/07
```

---

## Wave 4: Integration — E2E Smoke Test, Build Verification, Phase Gate

### Objective

Run the full phase validation: typecheck, unit tests, build (standalone), root regression tests, and performance baseline measurement. Produce phase completion artifacts.

### Allowed Surfaces
- `sidecar/` — Read-only validation; no modifications unless issues are found
- `.planning/phases/SC-03-nextjs-app/` — Phase completion summary

### Forbidden Surfaces
- ❌ Do NOT modify any source files unless a critical defect is found
- ❌ Do NOT modify `src/sidecar/`, `src/plugin.ts`, or other phases
- ❌ Do NOT add new dependencies

### Task List

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| T4.1 | Run full typecheck | `sidecar/` | `cd sidecar && npx tsc --noEmit` with strict mode; fix any type errors found | 0 errors | Typecheck pass |
| T4.2 | Run unit tests | `sidecar/` | `cd sidecar && npx vitest run` | All tests GREEN | All ACs pass |
| T4.3 | Build standalone output | `sidecar/` | `cd sidecar && npx next build` | Build succeeds; `.next/standalone/server.js` exists | AC-SC03-01 pass |
| T4.4 | Verify no plugin imports | `sidecar/src/` | `grep -r "src/sidecar" sidecar/src/` | Empty output | AC-SC03-11 pass |
| T4.5 | Run regression: root test suite | Project root | `npm test` from root | All 2,963+ tests pass | No regression |
| T4.6 | Manual smoke test | Sidecar at localhost:3099 | Start plugin server manually; start `cd sidecar && npx next dev`; browse to localhost:3099; verify: dashboard loads, 4 panels visible, tab switching works, error boundary renders when panel throws | All manual checks pass | E2E smoke pass |
| T4.7 | Record performance baselines | `sidecar/` | Measure: `next build` time, `.next/standalone/` directory size, initial JS bundle size (gzip), number of chunks, initial HTML size | Record in phase summary | Performance baseline captured |

### Verification Gate (Full Phase)

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Primary (typecheck) | `cd sidecar && npx tsc --noEmit` | 0 errors |
| Secondary (tests) | `cd sidecar && npx vitest run` | All GREEN |
| Tertiary (build) | `cd sidecar && npx next build` | Standalone output produced |
| Quaternary (regression) | `npm test` from root | All 2,963+ tests pass |

### Atomic Commit Message

```
SC-03 Wave 4: Integration verification, build validation, and phase gate

- Run full typecheck: 0 errors
- Run unit test suite: all GREEN
- Build standalone output: .next/standalone/server.js produced
- Verify no src/sidecar imports: empty grep result
- Run root regression tests: 2,963+ tests pass
- Manual smoke test: dashboard loads, 4 panels, tab switching, error boundary
- Record performance baselines for tracking
```

---

## File Inventory with LOC Budgets

| File | Type | Action | LOC Budget | AC Coverage |
|------|------|--------|-----------|-------------|
| `sidecar/package.json` | Config | Upgrade | 30 | AC-SC03-01 |
| `sidecar/next.config.ts` | Config | Rewrite | 25 | AC-SC03-01 |
| `sidecar/tsconfig.json` | Config | Update | 5 | AC-SC03-03 |
| `sidecar/vitest.config.ts` | Config | NEW | 30 | Wave 0 |
| `sidecar/src/app/globals.css` | CSS | NEW | 25 | — |
| `sidecar/src/lib/types.ts` | Source | NEW | 80 | AC-SC03-03 |
| `sidecar/src/lib/constants.ts` | Source | NEW | 40 | AC-SC03-06 |
| `sidecar/src/lib/plugin-client.ts` | Source | NEW | 200 | AC-SC03-02, AC-SC03-03 |
| `sidecar/src/lib/catalog.ts` | Source | NEW | 400 | AC-SC03-07 |
| `sidecar/src/lib/state-store.ts` | Source | NEW | 150 | AC-SC03-04, AC-SC03-05 |
| `sidecar/src/lib/use-sse.ts` | Source | NEW | 120 | AC-SC03-05, AC-SC03-12 |
| `sidecar/src/components/error-boundary.tsx` | Source | NEW | 50 | AC-SC03-09 |
| `sidecar/src/components/dashboard-shell.tsx` | Source | NEW | 200 | AC-SC03-06, AC-SC03-08 |
| `sidecar/src/app/layout.tsx` | Source | Rewrite | 60 | AC-SC03-13 |
| `sidecar/src/app/page.tsx` | Source | Rewrite | 50 | AC-SC03-06, AC-SC03-13 |
| `sidecar/src/app/loading.tsx` | Source | NEW | 30 | AC-SC03-10 |
| `sidecar/src/app/error.tsx` | Source | NEW | 40 | AC-SC03-09 |
| Panel stubs (8 files) | Source | NEW | 50 each = 400 | AC-SC03-06 |
| Panel specs (4 files) | Source | NEW | 100 each = 400 | AC-SC03-07 |
| Test files (8 files) | Test | NEW | 50 each = 400 | All ACs |
| `sidecar/README.md` | Docs | Update | 50 | — |

**Total files:** 28 (excluding node_modules, .next)
**Total LOC estimate:** ~2,430

---

## Risk Mitigations

| Risk | Source | Severity | Mitigation | Owner |
|------|--------|----------|------------|-------|
| json-render v0.1.0 → v0.19.0 API discontinuity | RESEARCH §110 | MEDIUM | Zero existing catalog code in sidecar/ — clean install. All imports use 0.19.x API (`defineCatalog`, `createStateStore`). No migration. | Wave 1 |
| Standalone mode `process.cwd()` resolution | RESEARCH §136 | MEDIUM | Accept `HIVEMIND_DIR` env var. In `plugin-client.ts`, resolve `.hivemind/state/sidecar-port.json` relative to `process.env.HIVEMIND_DIR || path.resolve(process.cwd(), '..')`. Document in README. | Wave 1 (plugin-client) |
| Tailwind v4 `@source` path resolution | RESEARCH §123 | MEDIUM | Test `@source` path at build time. If path is wrong, `next build` will miss shadcn classes. Use `require.resolve` to find shadcn dist path. | Wave 1 (globals.css) |
| SSE EventSource listener accumulation | RESEARCH §131 | HIGH | Return cleanup function from `useEffect` that calls `eventSource.close()`. Test cleanup by verifying event count before/after reconnection. | Wave 1 (use-sse) |
| Port file not found in dev mode | RESEARCH §186 | LOW | Fallback port 3199 defined in constants. "Sidecar not available" state shown with 5s retry polling. Document fallback in README. | Wave 1 (plugin-client, constants) |
| Zod version conflict (root ^4.4.3 vs sidecar install) | RESEARCH §185 | LOW | Install zod in sidecar/ package.json independent of root. json-render uses zod for catalog schemas — same major version range. | Wave 1 (package.json) |
| `@json-render/shadcn` requires specific Tailwind version | RESEARCH §172 | MEDIUM | Pin `tailwindcss ^4.0.0` initially. If build fails due to shadcn requiring a newer minor, bump to `^4.1.0`. | Wave 1 (package.json) |
| Plugin server not running during dev | CONTEXT §121 | LOW | `plugin-client.ts` shows typed errors for connection failures. Dashboard shell shows "Sidecar not available — waiting for plugin..." with retry polling. Independent development possible with fallback port. | Wave 1, Wave 2 |

---

## Threat Model

| Threat | STRIDE Category | Impact | Mitigation |
|--------|-----------------|--------|------------|
| Unauthorized process reads port file | Information Disclosure | LOW — file contains only `{ port }` | File is inside `.hivemind/state/` canonical surface |
| Plugin server unavailable | Denial of Service | MEDIUM — dashboard shows stale or no data | "Not available" state with 5s retry; last known good state shown if available |
| SSE event flood (many events/sec) | Denial of Service | LOW — localhost only | Plugin server has 50-connection cap (SC-01); SSE client limits reconnection frequency |
| Cross-origin request from browser | Spoofing | LOW — localhost:3099 is user-facing | `output: "standalone"` binds to localhost; no auth needed |
| Plugin restart → port file changes at runtime | Tampering | MEDIUM — plugin-client uses cached URL | On HTTP error, plugin-client re-reads port file and retries |

---

## Coverage Expectations

### Multi-Source Coverage Audit

| Source Type | ID | Description | Plan Coverage | Status |
|-------------|-----|-------------|---------------|--------|
| GOAL | G-SC03-1 | Next.js 16 standalone output | T1.1, T1.2 | ✅ |
| GOAL | G-SC03-2 | Plugin HTTP client with 17 endpoints | T1.6 | ✅ |
| GOAL | G-SC03-3 | Dashboard shell 4-panel layout | T2.2, T2.3, T2.4 | ✅ |
| GOAL | G-SC03-4 | Unified json-render catalog (44 components) | T1.7 | ✅ |
| GOAL | G-SC03-5 | StateStore + snapshot refresh + SSE | T1.8, T1.9 | ✅ |
| GOAL | G-SC03-6 | Loading skeleton + error boundary | T2.1, T2.5, T2.6 | ✅ |
| GOAL | G-SC03-7 | Dep upgrades (next 16, json-render 0.19) | T1.1 | ✅ |
| REQ | UR-SC03-01 | Standalone output config | T1.2 | ✅ |
| REQ | UR-SC03-02 | Port discovery from sentinel file | T1.6 | ✅ |
| REQ | UR-SC03-03 | Typed methods for all 17 endpoints | T1.6 | ✅ |
| REQ | UR-SC03-04 | 4-panel grid with URL-persisted tabs | T2.2 | ✅ |
| REQ | UR-SC03-05 | Renderer via next/dynamic({ ssr: false }) | T2.4 | ✅ |
| REQ | UR-SC03-06 | Bind to 127.0.0.1:3099 | T1.2 | ✅ |
| REQ | ER-SC03-01 → ER-SC03-06 | SSE init, cache invalidation, event patching, backoff, tab persistence | T1.8, T1.9, T2.2 | ✅ |
| REQ | SR-SC03-01 → SR-SC03-03 | "Not available" state, partial loading, skeleton | T1.8, T2.2, T2.5 | ✅ |
| REQ | OF-SC03-01 → OF-SC03-03 | URL param activation, heartbeat timeout, beforeunload | T2.2, T1.9 | ✅ |
| REQ | UB-SC03-01 → UB-SC03-04 | No src/sidecar imports, shadcn fallback, no direct tools, SSE cleanup | T1.7, T4.4, T1.9 | ✅ |
| RESEARCH | R-01 | json-render API discontinuity (v0.1→0.19) — clean install | T1.1 | ✅ |
| RESEARCH | R-02 | SSE ReadableStream + standalone mode confirmed | T1.2, T1.9 | ✅ |
| RESEARCH | R-03 | Port file path in production mode | T1.6 (HIVEMIND_DIR) | ✅ |
| RESEARCH | R-04 | Tailwind v4 @source directive required | T1.10 | ✅ |
| RESEARCH | R-05 | Zod version conflict | T1.1 (install own zod) | ✅ |
| CONTEXT | D-SC03-01 | Next.js 16.2.2 upgrade | T1.1 | ✅ |
| CONTEXT | D-SC03-02 | json-render ^0.19.0 packages | T1.1 | ✅ |
| CONTEXT | D-SC03-03 | Single typed plugin-client module | T1.6 | ✅ |
| CONTEXT | D-SC03-04 | Client component with tab-navigation | T2.2 | ✅ |
| CONTEXT | D-SC03-05 | Pre-bundled catalog (not from /api/catalog) | T1.7 | ✅ |
| CONTEXT | D-SC03-06 | StateStore via createStateStore | T1.8 | ✅ |
| CONTEXT | D-SC03-07 | Custom SSE hook | T1.9 | ✅ |
| CONTEXT | D-SC03-08 | Dynamic import for code splitting | T2.4, T3.1-T3.4 | ✅ |
| CONTEXT | D-SC03-09 | Port file sentinel, fallback 3199 | T1.6 | ✅ |
| CONTEXT | D-SC03-10 | npm package manager | T1.1 | ✅ |
| CONTEXT | D-SC03-11 | Tailwind v4 @source for shadcn | T1.10 | ✅ |
| CONTEXT | D-SC03-12 | TypeScript path aliases | T1.3 | ✅ |

### AC → Test Mapping

| AC | Test File(s) | Verification Type |
|----|-------------|-------------------|
| AC-SC03-01 | (build test) | `next build` succeeds; check `server.js` exists |
| AC-SC03-02 | `tests/plugin-client.test.ts` | Unit: port discovery |
| AC-SC03-03 | `tests/plugin-client.test.ts` | Type guard: `tsc --noEmit` |
| AC-SC03-04 | `tests/state-store.test.ts` | Unit: snapshot init |
| AC-SC03-05 | `tests/use-sse.test.ts`, `tests/state-store.test.ts` | Unit: SSE dispatch |
| AC-SC03-06 | `tests/dashboard-shell.test.tsx` | Render: 4 grid cells |
| AC-SC03-07 | `tests/catalog.test.ts` | Unit: 44 components |
| AC-SC03-08 | `tests/dashboard-shell.test.tsx` | Integration: tab switch + URL |
| AC-SC03-09 | `tests/error-boundary.test.tsx` | Render: error isolation |
| AC-SC03-10 | `tests/loading.test.tsx` | Render: skeleton |
| AC-SC03-11 | (grep check) | Build: grep empty |
| AC-SC03-12 | `tests/use-sse.test.ts` | Unit: backoff timers |
| AC-SC03-13 | (code review) | Manual: dynamic import check |

---

## Stop Conditions

- ❌ **STOP** — if any verification gate fails (typecheck, tests, build, regression)
- ❌ **STOP** — if a dependency upgrade introduces unresolvable peer conflicts (escalate to orchestrator)
- ❌ **STOP** — if json-render v0.19.0 API differs from RESEARCH findings (escalate for re-research)
- ❌ **STOP** — if `next build` with `output: "standalone"` fails (escalate for debug)
- ✅ **CONTINUE** — if all tests pass but code quality needs improvement (fix within wave before advancing)
- ✅ **CONTINUE** — if build succeeds with warnings but no errors (document warnings, proceed)

---

## Execution Summary

| Dimension | Value |
|-----------|-------|
| **Waves** | 5 (0-indexed: 0→4) |
| **Total files** | 28 (8 config, 17 source, 8 test — some overlap) |
| **Total LOC estimate** | ~2,430 |
| **Key risks** | json-render 0.1→0.19 API gap, standalone path resolution, SSE cleanup, Tailwind @source |
| **Verification commands** | `cd sidecar && npx vitest run`, `cd sidecar && npx tsc --noEmit`, `cd sidecar && npx next build` |
| **Regression** | `npm test` from root (2,963+ tests) |
| **Upstream dependencies** | SC-01 (foundation), SC-02 (REST API + Tool Proxy) — both COMPLETE |
| **Downstream consumers** | SC-04, SC-05, SC-06, SC-07 |
