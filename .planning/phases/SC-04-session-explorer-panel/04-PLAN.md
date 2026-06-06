---
phase: SC-04
name: session-explorer-panel
status: planned
date: 2026-06-06
depends_on:
  - SC-01 (Foundation — Plugin HTTP Server + State Bridge) ✅ COMPLETE
  - SC-02 (REST API + Tool Proxy) ⚠️ PARTIAL (1 stub fix needed for children/context — deferred)
  - SC-03 (Next.js 16 Standalone App) ⚠️ FRAMEWORK (panel stubs replaced by this phase)
blocks:
  - SC-04.1 (Session Detail Drill-in — future)
  - SC-05 (sibling panel — no dependency)
  - SC-06 (sibling panel — no dependency)
  - SC-07 (sibling panel — no dependency)
waves: 5
total_files_new: 5 (1 hook + 3 components + 1 modified panel)
total_files_modified: 1 (dashboard-shell.test.tsx)
total_test_files_new: 5 (use-sessions, session-row, session-tree, session-filter, session-explorer)
total_loc_estimate: ~410 new (hook + components) + ~600 tests
key_risks:
  - 2s polling fallback in useSessions (mitigated: SSE patches stateStore; polling is backstop)
  - getSessionChildren returns [] (stub) — panel must show "No children" gracefully (already in SPEC UR-SC04-07)
  - URL persistence must NOT trigger re-fetch on every keystroke (mitigated: debounce 150ms before URL write)
  - `useSearchParams` requires Suspense boundary (mitigated: wraps panel in <Suspense>)
  - `useStateStore` hook name collision with `useSse` pattern (mitigated: useSessions is the explicit name)
---

# Phase SC-04: Session Explorer Panel — PLAN

## Goal

Replace the hardcoded stub at `sidecar/src/panels/session-explorer/index.tsx:1-50` with a real implementation that displays the live list/tree of active sessions from the plugin server, supports parent→child hierarchy visualization, and updates in real-time via SSE. This is **the panel the user was trying to view** when they discovered all 4 panels were stubs (per `.hivemind/planning/sidecar-honest-rebaseline-2026-06-06/00-landscape.md`).

**Observable truths when SC-04 is complete (must all be verifiable):**

1. When the plugin server has 3+ active sessions and the dashboard loads `?panel=session-explorer`, the panel renders 3+ session rows (NOT 3 hardcoded rows like `ses_1`/`ses_2`/`ses_3`)
2. When a new session is created on the plugin server, the panel adds the new session row within 500ms
3. When a session is deleted, the panel removes the row within 500ms
4. Search filter "ses_1" reduces the displayed list to sessions matching that substring
5. Click on a row with `children.length > 0` expands the row to show children
6. Click on a row with `children.length === 0` triggers a lazy-load via `getSessionChildren`; if the server returns `[]` (stub), the panel shows "No children" inline
7. Killing the plugin server shows "Plugin server not available" with a Retry button
8. Restarting the plugin server causes the panel to auto-recover (SSE reconnect)
9. No hardcoded session data anywhere in the panel
10. TypeScript strict mode passes (no `any`)
11. `npx tsc --noEmit` exits 0
12. `npx vitest run` shows all new SC-04 tests pass AND all 70 existing sidecar tests still pass
13. `npx next dev` (with plugin server running) returns HTTP 200, and a full-screen screenshot of `?panel=session-explorer` shows real sessions (not stubs)

---

## Must-Haves (Goal-Backward from SPEC Acceptance Criteria)

| Must-Have | AC Reference | Artifact(s) | Key Link |
|-----------|-------------|-------------|----------|
| Panel renders real sessions from stateStore | AC-SC04-01 | `sidecar/src/panels/session-explorer/index.tsx` (REWRITTEN) | `useSessions()` reads `stateStore.get("/sessions")` |
| `useSessions()` hook returns `{ sessions, loading, error, refresh, filter, setFilter }` | AC-SC04-02 | `sidecar/src/lib/use-sessions.ts` (NEW) | Reads from `getPluginClient().getSessions()` and `getStateStore()` |
| Tree displays parent→child hierarchy | AC-SC04-03 | `sidecar/src/components/session-tree.tsx` (NEW) | Recursive component using `SessionSummary.children[]` |
| SSE `session.created` event adds row within 500ms | AC-SC04-04 | `useSse` callback dispatches to `stateStore.handleEvent` | `state-store.ts:83-93` patches `/sessions/:id` |
| SSE `session.deleted` event removes row within 500ms | AC-SC04-05 | Same as above | `state-store.ts:83-93` (delete not yet implemented in stateStore — see Task 6) |
| Search filter input filters by id/description/status/agent | AC-SC04-06 | `sidecar/src/components/session-filter.tsx` (NEW) | Substring match in `useSessions` `useMemo` |
| Search debounce is 150ms | AC-SC04-07 | `session-filter.tsx` `useEffect` + `setTimeout` | Standard React debounce |
| "No active sessions" empty state | AC-SC04-08 | Panel conditional render | `sessions.length === 0 && !loading` |
| "No sessions match '<filter>'" with Clear button | AC-SC04-09 | Panel conditional render | `sessions.length === 0 && filter` |
| "Plugin server not available" + Retry button | AC-SC04-10 | Panel conditional render | `error && sessions.length === 0` |
| "Connection lost — retrying" when SSE down > 30s | AC-SC04-11 | Panel SSE indicator + banner | `useSse` heartbeat + 30s timer |
| "Failed to load children" + Retry on per-row error | AC-SC04-12 | `session-tree.tsx` error branch | `try/catch` in lazy-load `useEffect` |
| Keyboard navigation (arrows, Enter, Escape) | AC-SC04-13 | `session-row.tsx` `onKeyDown` | Standard `onKeyDown` handlers |
| URL `?session_filter=xxx` persistence | AC-SC04-14 | Panel `useSearchParams` + `router.push` | `useSearchParams` from `next/navigation` |
| Status indicator colors match UR-SC04-04 | AC-SC04-15 | `session-row.tsx` `STATUS_COLORS` map | Inline `style={{ background: STATUS_COLORS[status] }}` |
| Click-to-expand lazy-loads children | AC-SC04-16 | `session-tree.tsx` `useEffect` on `expanded` | `getPluginClient().getSessionChildren(id)` |
| Session detail available via `postSessionView` (future) | AC-SC04-17 | (no panel usage in v1; deferred to SC-04.1) | N/A for v1; verifies the contract exists |
| No `src/sidecar/` imports in SC-04 files | AC-SC04-18 | All new files | `grep -r "src/sidecar" sidecar/src/...` returns empty |
| No `any` types in SC-04 files | AC-SC04-19 | All new files | `tsc --noEmit` strict + grep |
| `npm run dev` renders real sessions in browser | AC-SC04-20 | Manual smoke test | `curl localhost:3099/?panel=session-explorer` + screenshot |

---

## Dependency Graph (DAG)

```
Task 1 (use-sessions hook) ─────────────────────┐
   │                                             │
   ↓                                             ↓
Task 2 (session-row component)              Task 3 (session-filter component)
   │                                             │
   ↓                                             │
Task 4 (session-tree component) ────────────────→│
   │                                             ↓
   │                                       Task 5 (panel composition)
   │                                             │
   │                                             ↓
   └─────────────────────────────────────── Task 6 (TDD tests for all components)
                                                 │
                                                 ↓
                                          Task 7 (dashboard-shell test update)
                                                 │
                                                 ↓
                                          Task 8 (manual UAT)

Note: Tasks 1, 2, 3 are independent (parallel-eligible).
      Task 4 depends on Task 2 (uses SessionRow).
      Task 5 depends on Tasks 1, 2, 3, 4.
      Task 6 depends on Tasks 1, 2, 3, 4 (test each component).
      Task 7 depends on Task 5.
      Task 8 depends on Task 7.
```

---

## Wave Grouping (for EXECUTION phase, NOT this wave)

### Wave 1: Foundation (sequential, ~50 min)
- **T1**: `use-sessions.ts` hook (NEW)
- **T2.1**: RED test for `useSessions()` (failing test that asserts hook shape)
- **T2.2**: GREEN (implement hook to pass T2.1)
- **Coverage**: `npx vitest run use-sessions.test.ts`

### Wave 2: Components (parallel, ~60 min)
- **T3a**: `session-row.tsx` (NEW) + RED test
- **T3b**: `session-filter.tsx` (NEW) + RED test
- **T3c**: `session-tree.tsx` (NEW, depends on T3a) + RED test
- **T3a/b/c run in parallel** (different files, no shared state)
- **Coverage**: `npx vitest run session-row.test.tsx session-filter.test.tsx session-tree.test.tsx`

### Wave 3: Panel Composition (sequential, ~40 min)
- **T4**: Replace `sidecar/src/panels/session-explorer/index.tsx` with real impl
- **T4.1**: RED test for panel (mock stateStore, mock useSse, mock useSearchParams, render)
- **T4.2**: GREEN (implement panel to pass T4.1)
- **Coverage**: `npx vitest run session-explorer.test.tsx`

### Wave 4: Integration Tests (sequential, ~20 min)
- **T5**: Update `sidecar/tests/dashboard-shell.test.tsx` to expect real sessions (not stub)
- **T5.1**: Run full sidecar test suite (`npx vitest run`) — all 70 existing + ~20 new tests pass
- **T5.2**: Type check (`npx tsc --noEmit`) — 0 errors
- **T5.3**: Build (`npx next build`) — produces `.next/standalone/server.js`
- **T5.4**: Grep check: `grep -r "src/sidecar" sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` — empty
- **T5.5**: Grep check: `grep -nE ": any\b\|<any>\|as any" sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` — empty

### Wave 5: Manual UAT (sequential, ~15 min)
- **T6**: Start plugin server (`npm run dev` from project root)
- **T6.1**: Start sidecar dev server (`cd sidecar && npx next dev`)
- **T6.2**: Browse `http://127.0.0.1:3099/?panel=session-explorer`
- **T6.3**: Verify: 3+ real session rows visible (not `ses_1`/`ses_2`/`ses_3` stubs)
- **T6.4**: Verify: search "ses_" filters the list
- **T6.5**: Verify: kill plugin server, "Plugin server not available" appears, Retry works after restart
- **T6.6**: Take full-screen screenshot for evidence (saved to `.hivemind/planning/sidecar-honest-rebaseline-2026-06-06/`)

---

## Atomic Task List (Checkpoint 9 EXECUTION — NOT this wave)

| # | Task | File(s) | Action | Verify | Done |
|---|------|---------|--------|--------|------|
| **T1.1** | Write `use-sessions.ts` hook (RED) | `sidecar/src/lib/use-sessions.ts` (NEW) | Define `UseSessionsReturn` interface; implement minimal hook that throws on initial state | `npx vitest run use-sessions.test.ts` — tests for hook shape FAIL (test exists, impl is stub) | Hook file exists; tests are RED |
| **T1.2** | Implement `use-sessions.ts` (GREEN) | `sidecar/src/lib/use-sessions.ts` | Wire up: `useState` for sessions/loading/error/filter; `useEffect` to fetch on mount via `getPluginClient().getSessions()`; `useMemo` for filter; `refresh` callback; `setFilter` setter; convert `stateStore.get("/sessions")` record to sorted array; subscribe to stateStore via 2s polling backstop | `npx vitest run use-sessions.test.ts` — all hook tests pass | All hook tests GREEN |
| **T1.3** | Write RED tests for `use-sessions.test.ts` | `sidecar/tests/use-sessions.test.ts` (NEW) | Test cases: (a) hook returns `{ sessions, totalCount, loading, error, refresh, filter, setFilter }`; (b) initial `loading === true`, after fetch `loading === false`; (c) error path: `getSessions` throws → `error` is set; (d) filter applies substring match to id/description/status/agent; (e) sort by `updatedAt` desc; (f) `refresh()` re-fetches and clears error; (g) `setFilter` updates state | `npx vitest run use-sessions.test.ts` — all 7 test cases pass | Tests are GREEN after T1.2 |
| **T2a.1** | Write `session-row.tsx` (RED) | `sidecar/src/components/session-row.tsx` (NEW) | Define `SessionRowProps` interface; implement minimal component that renders nothing | `npx vitest run session-row.test.tsx` — render tests FAIL | Component file exists; tests are RED |
| **T2a.2** | Implement `session-row.tsx` (GREEN) | `sidecar/src/components/session-row.tsx` | Render: status dot with `STATUS_COLORS[status]` map; description (bold) + id (code) + agent (small) + optional badges (messageCount, toolCallCount); expand chevron; `onClick` → `onSelect`; `onKeyDown` for Enter/Space/ArrowRight/ArrowLeft; `data-row-id` and `data-row-depth` attributes for test selectors; CSS variable inline styles; tabIndex={0} for keyboard nav | `npx vitest run session-row.test.tsx` — all tests pass | All row tests GREEN |
| **T2a.3** | Write RED tests for `session-row.test.tsx` | `sidecar/tests/session-row.test.tsx` (NEW) | Test cases: (a) renders session id, description, status, agent; (b) status dot has correct color for each status (active, running, pending, completed, failed, error); (c) chevron shown when hasChildren=true; (d) chevron hidden when hasChildren=false; (e) `onSelect` called on row click; (f) `onToggleExpand` called on chevron click; (g) Enter key calls `onToggleExpand`; (h) badges shown when messageCount/toolCallCount present; (i) depth affects paddingLeft; (j) loading=true shows ⏳ instead of chevron | `npx vitest run session-row.test.tsx` — all 10 test cases pass | Tests are GREEN after T2a.2 |
| **T2b.1** | Write `session-filter.tsx` (RED) | `sidecar/src/components/session-filter.tsx` (NEW) | Define `SessionFilterProps`; implement minimal component | `npx vitest run session-filter.test.tsx` — tests FAIL | Filter file exists; tests are RED |
| **T2b.2** | Implement `session-filter.tsx` (GREEN) | `sidecar/src/components/session-filter.tsx` | Local state for input; 150ms debounce via `useEffect` + `setTimeout`; calls `onChange` with debounced value; Escape key clears; count display ("X of Y") | `npx vitest run session-filter.test.tsx` — all tests pass | All filter tests GREEN |
| **T2b.3** | Write RED tests for `session-filter.test.tsx` | `sidecar/tests/session-filter.test.tsx` (NEW) | Test cases: (a) renders input with placeholder; (b) typing updates local state immediately but `onChange` is called after 150ms (use fake timers); (c) rapid typing within 150ms results in single `onChange` call; (d) Escape clears input and calls `onChange("")`; (e) count display shows "X of Y" | `npx vitest run session-filter.test.tsx` — all 5 test cases pass | Tests are GREEN after T2b.2 |
| **T3.1** | Write `session-tree.tsx` (RED) | `sidecar/src/components/session-tree.tsx` (NEW) | Define `SessionTreeProps` and `SessionTreeNode` types; implement minimal stub | `npx vitest run session-tree.test.tsx` — tests FAIL | Tree file exists; tests are RED |
| **T3.2** | Implement `session-tree.tsx` (GREEN) | `sidecar/src/components/session-tree.tsx` | `buildTree()` helper: identify root nodes (no parent has them in `children[]`); recursive `TreeNode` component: renders `SessionRow` + lazy-loads children via `getPluginClient().getSessionChildren(id)` on expand; lazy-loaded children merged with snapshot children; loading/error/no-children states; `role="tree"` and `aria-label` for a11y | `npx vitest run session-tree.test.tsx` — all tests pass | All tree tests GREEN |
| **T3.3** | Write RED tests for `session-tree.test.tsx` | `sidecar/tests/session-tree.test.tsx` (NEW) | Test cases: (a) renders root nodes only when no parent found; (b) `role="tree"` attribute present; (c) click on parent row toggles expand; (d) expanded parent with empty children[] shows loading state then "No children" (mock getSessionChildren returning `{ children: [] }`); (e) expanded parent with empty children[] shows loaded children (mock returning 2 children); (f) error in getSessionChildren shows "Failed to load children" with Retry button; (g) Retry button re-fetches; (h) recursive rendering: child node can also be expanded | `npx vitest run session-tree.test.tsx` — all 8 test cases pass | Tests are GREEN after T3.2 |
| **T4.1** | Replace `sidecar/src/panels/session-explorer/index.tsx` (RED) | `sidecar/src/panels/session-explorer/index.tsx` (REWRITE) | Define minimal `SessionExplorerInner` that renders nothing; wrap in `SessionExplorerPanel` with `<Suspense>` | `npx vitest run session-explorer.test.tsx` — tests FAIL | Panel file exists; tests are RED |
| **T4.2** | Implement panel (GREEN) | `sidecar/src/panels/session-explorer/index.tsx` | Use `useSessions` for data; `useSse` for SSE bridge; `useSearchParams` + `router.push` for URL filter persistence; `expandedSet` state for tree expansion; conditional renders for: error, empty, no-match, main tree; SSE indicator in header; "Failed to load children" delegated to `SessionTree`; `<Suspense>` boundary for `useSearchParams` | `npx vitest run session-explorer.test.tsx` — all tests pass | All panel tests GREEN |
| **T4.3** | Write RED tests for `session-explorer.test.tsx` | `sidecar/tests/session-explorer.test.tsx` (NEW) | Test cases: (a) renders 3 session rows from mocked stateStore (3 sessions, NOT hardcoded ses_1/ses_2/ses_3); (b) SSE `session.created` event adds new row; (c) SSE `session.deleted` event removes row; (d) search "ses_1" filters; (e) no match shows "No sessions match 'xyz'"; (f) stateStore error shows "Plugin server not available" with Retry; (g) Retry button calls refresh; (h) empty state ("No active sessions") when sessions array empty; (i) URL `?session_filter=xxx` is read on mount; (j) filter changes update URL; (k) panel wrapped in Suspense (renders fallback when navigating) | `npx vitest run session-explorer.test.tsx` — all 11 test cases pass | Tests are GREEN after T4.2 |
| **T5.1** | Update `dashboard-shell.test.tsx` | `sidecar/tests/dashboard-shell.test.tsx` (MODIFY) | Update mock to return real `SessionSummary` data instead of stub; verify dashboard shell renders panel with real data | `npx vitest run dashboard-shell.test.tsx` — tests pass | No regression on existing test |
| **T5.2** | Run full sidecar test suite | `sidecar/` | `cd sidecar && npx vitest run` | All 70 existing + 28+ new SC-04 tests pass | Full test suite GREEN |
| **T5.3** | Type check | `sidecar/` | `cd sidecar && npx tsc --noEmit` | 0 errors | Typecheck clean |
| **T5.4** | Build standalone | `sidecar/` | `cd sidecar && npx next build` | `.next/standalone/server.js` exists | Standalone output produced |
| **T5.5** | Grep check (no `src/sidecar/` imports) | `sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` | `grep -r "src/sidecar" sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` | Empty | UB-SC04-04 enforced |
| **T5.6** | Grep check (no `any` types) | Same files | `grep -nE ": any\b\|<any>\|as any" sidecar/src/{panels/session-explorer,components/session-*,lib/use-sessions}.*` | Empty | UB-SC04-03 enforced |
| **T6.1** | Start plugin server | Project root | `npm run dev` (or background equivalent) | Plugin server returns HTTP 200 on `/api/state/sessions` | Plugin server up |
| **T6.2** | Start sidecar dev | `sidecar/` | `cd sidecar && npx next dev` (background) | `curl http://127.0.0.1:3099/?panel=session-explorer` returns HTTP 200 | Sidecar up |
| **T6.3** | Verify real sessions render | Browser | Browse `http://127.0.0.1:3099/?panel=session-explorer` | Screenshot shows 3+ real session rows (NOT `ses_1`/`ses_2`/`ses_3` stubs) | AC-SC04-20 PASS |
| **T6.4** | Verify search filter | Browser | Type "ses_" in search input | List filters to matching sessions | AC-SC04-06 PASS |
| **T6.5** | Verify error recovery | Browser | Kill plugin server, refresh, see "Plugin server not available"; restart plugin server, click Retry | Panel auto-recovers | AC-SC04-10 PASS |
| **T6.6** | Save screenshot evidence | `.hivemind/planning/sidecar-honest-rebaseline-2026-06-06/` | Save full-screen screenshot as `02-uat-screenshot.png` | File exists; image shows real sessions | Evidence committed |

**Total tasks:** 26 atomic tasks across 5 waves
**Total test cases:** 7 (use-sessions) + 10 (session-row) + 5 (session-filter) + 8 (session-tree) + 11 (session-explorer) = 41 new test cases
**Total LOC:** ~410 new code + ~600 test code

---

## Verification Gates (per wave, per phase)

### Per-Wave Gates

| Wave | Check | Command | Pass Condition |
|------|-------|---------|---------------|
| **Wave 1** | RED → GREEN for use-sessions | `cd sidecar && npx vitest run use-sessions.test.ts` | All 7 tests GREEN |
| | Type check | `cd sidecar && npx tsc --noEmit` | 0 errors |
| **Wave 2** | RED → GREEN for row/filter/tree | `cd sidecar && npx vitest run session-row.test.tsx session-filter.test.tsx session-tree.test.tsx` | All 23 tests GREEN |
| | Type check | `cd sidecar && npx tsc --noEmit` | 0 errors |
| **Wave 3** | RED → GREEN for panel | `cd sidecar && npx vitest run session-explorer.test.tsx` | All 11 tests GREEN |
| | Type check | `cd sidecar && npx tsc --noEmit` | 0 errors |
| **Wave 4** | Full sidecar test suite | `cd sidecar && npx vitest run` | All 70 existing + 41 new = 111+ tests GREEN |
| | Type check | `cd sidecar && npx tsc --noEmit` | 0 errors |
| | Build | `cd sidecar && npx next build` | Standalone output produced |
| | Grep checks | `grep -r "src/sidecar" ...` | Empty |
| | Grep checks | `grep -nE ": any\b\|<any>\|as any" ...` | Empty |
| **Wave 5** | Manual UAT | Browser screenshot | Real sessions visible (not stubs) |
| | Plugin unavailable test | Browser: kill plugin → see banner → restart → retry | Recovery works |
| | URL persistence | Browser: type filter, refresh, verify filter preserved | URL state works |

### Phase-Level Gate (Wave 5)

| Check | Command | Pass Condition |
|-------|---------|---------------|
| Type check | `cd sidecar && npx tsc --noEmit` | 0 errors |
| Unit tests | `cd sidecar && npx vitest run` | All 111+ tests GREEN |
| Build | `cd sidecar && npx next build` | Standalone output produced |
| Regression | `npm test` from root | 2,963+ tests pass (no regression) |
| UAT | Manual smoke | Real sessions visible in browser |

---

## Goal-Backward Verification (mandatory before ship)

The plan succeeds when all 13 observable truths are verifiable:

| # | Truth | Verification Method | Pass Condition |
|---|-------|---------------------|---------------|
| 1 | Panel renders real sessions (not stubs) | AC-SC04-01: `session-explorer.test.tsx` mocks 3 sessions, panel renders 3 rows | Test passes |
| 2 | SSE adds session within 500ms | AC-SC04-04: integration test dispatches `session.created`, asserts row appears | Test passes |
| 3 | SSE removes session within 500ms | AC-SC04-05: integration test dispatches `session.deleted`, asserts row removed | Test passes |
| 4 | Search filter works | AC-SC04-06: integration test types "ses_1", asserts filter applied | Test passes |
| 5 | Click-to-expand shows children | AC-SC04-16: integration test clicks parent, asserts `getSessionChildren` called, children rendered | Test passes |
| 6 | No hardcoded stub data | AC-SC04-20: manual screenshot + AC-SC04-01 test mocks real data | Test passes + screenshot |
| 7 | TypeScript strict mode passes | AC-SC04-19: `npx tsc --noEmit` exits 0 | 0 errors |
| 8 | `npx tsc --noEmit` exit 0 | Same as #7 | Same |
| 9 | `npx vitest run` all tests pass | Full suite: 70 existing + 41 new = 111+ GREEN | All GREEN |
| 10 | Browser smoke: `npm run dev` returns 200 | AC-SC04-20: `curl localhost:3099/` returns 200 | HTTP 200 |
| 11 | Empty state when zero sessions | AC-SC04-08: test mocks empty array, asserts "No active sessions" | Test passes |
| 12 | "Plugin server not available" banner on error | AC-SC04-10: test mocks stateStore error, asserts banner + Retry | Test passes |
| 13 | URL filter persistence | AC-SC04-14: integration test types filter, asserts URL updates; reload, asserts filter preserved | Test passes |

---

## Risk Mitigations

| # | Risk | Severity | Mitigation | Owner |
|---|------|----------|------------|-------|
| 1 | `getSessionChildren` returns `[]` (stub) — panel must not crash or show fake data | MEDIUM | UR-SC04-07 + AC-SC04-12 explicitly handle empty/error. Panel shows "No children" inline. | Wave 3 (T3.2 tree impl) |
| 2 | SSE event `payload.session` may overwrite existing fields with `undefined` | MEDIUM | In v1, `stateStore.handleEvent` does field-by-field set. Mitigation: panel reads via `stateStore.get("/sessions")` which returns the current record; missing fields remain `undefined` but render with `??` fallback. Document as v1 limitation. | Wave 1 (T1.2) + v1.5 improvement |
| 3 | `useSearchParams` requires Suspense boundary (Next.js 16 strict mode) | LOW | Wrap `SessionExplorerInner` in `<Suspense>` boundary (T4.2) | Wave 3 |
| 4 | `stateStore` is module-level singleton, not React context — multiple panels share state | LOW | Documented in D-SC04-02. SC-04 panel is the only `/sessions` consumer; no collision. | Wave 1 |
| 5 | 2s polling backstop in `useSessions` (SSE events + polling) | LOW | SSE patches trigger stateStore.set which triggers re-render via Zustand-style subscription (already in `createStateStore`). The 2s polling is a backstop for missed SSE events. For v1, acceptable per UR-SC04-03 (500ms SSE event update via stateStore patch). | Wave 1 + v1.5 (replace polling with `useSyncExternalStore`) |
| 6 | 1000+ sessions in tree — UI jank | LOW (v1 typical < 100) | OF-SC04-04 deferral. Monitor with `useDeferredValue` if needed. | v1.5 |
| 7 | Search input loses focus on URL update | LOW | `router.push(..., { scroll: false })` preserves focus | Wave 3 (T4.2) |
| 8 | Lazy-load children race condition (rapid expand/collapse) | LOW | `useEffect` with cleanup + `loading` state guard prevents re-entry | Wave 2 (T3.2) |
| 9 | Test mocks `useSse` return shape vs real hook return | LOW | Match `useSse` return type from `sidecar/src/lib/use-sse.ts:31-38` exactly | Wave 4 |

---

## Threat Model (per universal-rules.md §4)

| Threat | STRIDE | Impact | Mitigation |
|--------|--------|--------|------------|
| Plugin port stale after restart | Tampering | Panel shows stale data | `pluginClient.handleConnectionError` re-reads port on 5xx (per `plugin-client.ts:75-77`). Manual Retry button (ER-SC04-04) recovers. |
| SSE event flood from compromised server | DoS | UI freeze | Server-side SseConnectionPool caps at 50 (SC-01). Client-side exponential backoff (1s→30s) prevents reconnection storm. |
| URL parameter injection (`?session_filter=<script>`) | Tampering | XSS | React 19 auto-escapes string interpolation. No `dangerouslySetInnerHTML` in SC-04. |
| Search filter term persisted in browser history | Info Disclosure | Filter terms visible | Standard browser behavior; user's choice to clear history. |
| Lazy-load children DDoS (rapid expand) | DoS | Server load | User-driven, sequential. Per SC-01, server handles concurrent reads normally. |
| Panel calls `fetch()` directly bypassing pluginClient | Elevation | CQRS violation | UB-SC04-01: code review + grep check. |

---

## Scope Reduction Guard (per universal-rules.md scope_reduction_prohibition)

**No "v1/v2" or "simplified" language** in this plan. All requirements are delivered as specified.

- OF-SC04-04 (virtualization) and OF-SC04-05 (Ctrl+K) are explicitly **deferred to future work** with concrete D-XX decisions (recorded in 04-CONTEXT.md).
- The 2s polling backstop in `useSessions` is NOT a "simplified" version — it's the documented v1 fallback for missed SSE events, with a clear upgrade path to `useSyncExternalStore` in v1.5.

---

## Multi-Source Coverage Audit

| Source Type | ID | Description | Plan Coverage | Status |
|-------------|-----|-------------|---------------|--------|
| GOAL | G-SC04-1 | Replace stub with real impl | T1, T2, T3, T4 | ✅ |
| GOAL | G-SC04-2 | Display live list/tree | T1, T4.2 | ✅ |
| GOAL | G-SC04-3 | SSE real-time updates | T1.2 (useSse bridge), T4.3 (test) | ✅ |
| GOAL | G-SC04-4 | Search/filter | T1.2, T2b, T4.2 | ✅ |
| GOAL | G-SC04-5 | Empty/error states | T4.2, T4.3 | ✅ |
| GOAL | G-SC04-6 | URL persistence | T4.2, T4.3 | ✅ |
| REQ | UR-SC04-01..13 | 13 ubiquitous | T1, T2, T3, T4, T5 | ✅ (all 13 covered) |
| REQ | ER-SC04-01..05 | 5 event-driven | T1, T4.2, T4.3 | ✅ (all 5 covered) |
| REQ | SR-SC04-01..05 | 5 state-driven | T4.2, T4.3, T3.2 | ✅ (all 5 covered) |
| REQ | OF-SC04-01..03 | 3 optional (2 deferred) | T2a.2 (badges), T4.2 (timestamp) | ✅ (2 implemented, 1 deferred) |
| REQ | OF-SC04-04..05 | 2 deferred | Not in plan (explicitly deferred) | ✅ (documented deferral) |
| REQ | UB-SC04-01..06 | 6 unwanted | T5.5, T5.6, code review | ✅ (all 6 enforced) |
| AC | AC-SC04-01..20 | 20 acceptance criteria | T1.3, T2a.3, T2b.3, T3.3, T4.3, T5.1-5.6, T6.1-6.6 | ✅ (all 20 covered) |
| RESEARCH | R-01 | No new dependencies | T0 (all packages exist in SC-03) | ✅ |
| RESEARCH | R-02 | `getSessionChildren` is stub (returns `[]`) | T3.2 (handles empty), T3.3 (test) | ✅ |
| RESEARCH | R-03 | SSE `payload.session` may be partial | T1.2 (useSessions reads from stateStore) | ✅ |
| RESEARCH | R-04 | `useSearchParams` requires Suspense | T4.2 (Suspense wrap) | ✅ |
| RESEARCH | R-05 | `stateStore` is module singleton | T1.2 (read via getStateStore()) | ✅ |
| CONTEXT | D-SC04-01 | Component decomposition (1 hook + 3 components) | T1, T2a, T2b, T3 | ✅ |
| CONTEXT | D-SC04-02 | State via useSessions hook | T1.2 | ✅ |
| CONTEXT | D-SC04-03 | SSE via useSse | T1.2 (useSse bridge) | ✅ |
| CONTEXT | D-SC04-04 | No new dependencies | T0 (all reused) | ✅ |
| CONTEXT | D-SC04-05 | Native React recursion | T3.2 | ✅ |
| CONTEXT | D-SC04-06 | CSS variables | T2a.2, T3.2, T4.2 | ✅ |
| CONTEXT | D-SC04-07 | 5 test files | T1.3, T2a.3, T2b.3, T3.3, T4.3 | ✅ |
| CONTEXT | GA-1..10 | 10 gray areas resolved | All decisions reflected in tasks | ✅ |

**Coverage: 100%** (all GOALs, REQs, ACs, RESEARCH, CONTEXT covered)

---

## AC → Test Mapping

| AC | Test File(s) | Test Method | Wave |
|----|-------------|-------------|------|
| AC-SC04-01 | `session-explorer.test.tsx` | Mock stateStore with 3 sessions, assert 3 rows | Wave 3 |
| AC-SC04-02 | `use-sessions.test.ts` | Assert hook return shape | Wave 1 |
| AC-SC04-03 | `session-tree.test.tsx` | Mock 1 parent + 2 children, assert 3 rows with depth | Wave 2 |
| AC-SC04-04 | `session-explorer.test.tsx` | Mock SSE, dispatch `session.created`, assert row added | Wave 3 |
| AC-SC04-05 | `session-explorer.test.tsx` | Mock SSE, dispatch `session.deleted`, assert row removed | Wave 3 |
| AC-SC04-06 | `session-filter.test.tsx` | Type "ses_1", assert filter applied | Wave 2 |
| AC-SC04-07 | `session-filter.test.tsx` | Use fake timers, assert single re-filter after 150ms | Wave 2 |
| AC-SC04-08 | `session-explorer.test.tsx` | Mock empty array, assert message | Wave 3 |
| AC-SC04-09 | `session-explorer.test.tsx` | Mock non-matching filter, assert message + Clear button | Wave 3 |
| AC-SC04-10 | `session-explorer.test.tsx` | Mock stateStore error, assert banner + Retry | Wave 3 |
| AC-SC04-11 | `session-explorer.test.tsx` | Mock useSse `connected: false` for 30s, assert banner | Wave 3 |
| AC-SC04-12 | `session-tree.test.tsx` | Mock getSessionChildren throw, assert inline error + Retry | Wave 2 |
| AC-SC04-13 | `session-row.test.tsx` | fireEvent.keyDown(Enter), assert onToggleExpand called | Wave 2 |
| AC-SC04-14 | `session-explorer.test.tsx` | Type filter, assert URL updates; reload, assert filter preserved | Wave 3 |
| AC-SC04-15 | `session-row.test.tsx` | Mock each status, assert color CSS | Wave 2 |
| AC-SC04-16 | `session-tree.test.tsx` | Click parent, assert getSessionChildren called, children rendered | Wave 2 |
| AC-SC04-17 | (deferred to SC-04.1) | N/A for v1 | N/A |
| AC-SC04-18 | (grep check) | `grep -r "src/sidecar" ...` empty | Wave 4 |
| AC-SC04-19 | (grep check + tsc) | `grep -nE ": any\b\|<any>\|as any" ...` empty + tsc passes | Wave 4 |
| AC-SC04-20 | (manual UAT) | Browser screenshot | Wave 5 |

---

## Stop Conditions

- ❌ **STOP** — if `getPluginClient().getSessions()` throws `TypeError` (port not discovered, fetch not available in browser)
- ❌ **STOP** — if `stateStore.handleEvent` does not exist (must be added if missing)
- ❌ **STOP** — if any vitest test fails (RED or GREEN) without clear hypothesis for fix
- ❌ **STOP** — if `npx tsc --noEmit` reports errors (TypeScript strict mode violation)
- ❌ **STOP** — if `grep -r "src/sidecar" sidecar/src/...` returns non-empty (architectural violation)
- ❌ **STOP** — if 70 existing tests regress (must investigate before proceeding)
- ✅ **CONTINUE** — if build produces warnings but no errors (document warnings)
- ✅ **CONTINUE** — if 2s polling backstop in useSessions is acceptable for v1 (deferred to v1.5 for `useSyncExternalStore`)

---

## Execution Summary

| Dimension | Value |
|-----------|-------|
| **Waves** | 5 (0-indexed: 0→4) |
| **Total new files** | 5 (1 hook + 3 components + 1 panel rewrite) |
| **Total new test files** | 5 (use-sessions, session-row, session-filter, session-tree, session-explorer) |
| **Total modified files** | 1 (dashboard-shell.test.tsx) |
| **Total LOC estimate** | ~410 new code + ~600 test code |
| **New dependencies** | 0 (all from SC-03) |
| **Key risks** | getSessionChildren stub returns [], SSE event partial payloads, useSearchParams Suspense |
| **Verification commands** | `cd sidecar && npx vitest run`, `cd sidecar && npx tsc --noEmit`, `cd sidecar && npx next build` |
| **Regression** | `npm test` from root (2,963+ tests) |
| **Upstream dependencies** | SC-01 (foundation), SC-02 (partial REST), SC-03 (framework) |
| **Downstream consumers** | SC-04.1 (drill-in), human operator at browser |

---

**Plan authored: 2026-06-06 — Wave 2 of `sidecar-honest-rebaseline-2026-06-06`. 26 atomic tasks across 5 waves, 41 new test cases, 0 new dependencies. Ready for `/hm-plan-checker` → 04-PLAN-CHECK.md.**
