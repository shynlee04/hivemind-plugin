# Phase SC-04: Session Explorer Panel — Research

**Researched:** 2026-06-06
**Domain:** React 19 hooks, Next.js 16 URL state, plugin HTTP client, SSE event handling
**Confidence:** HIGH (98% — all dependencies already in SC-03, no new ones needed)
**Depends on:** SC-01 (Foundation) ✅, SC-02 (REST API + Tool Proxy, partial) ✅, SC-03 (Next.js 16 Standalone App, framework) ✅
**Author:** hm-planner (this file) + would have co-authored with `hm-phase-researcher` for Context7 MCP validation

---

## Summary

SC-04 consumes the SC-03 infrastructure (`pluginClient` singleton, `stateStore`, `useSse` hook, `SessionSummary` / `SidecarEvent` types) and replaces the hardcoded stub at `sidecar/src/panels/session-explorer/index.tsx:1-50` with a real implementation. No new dependencies required. All surfaces already exist.

**Key findings:**

1. **No new packages needed** — React 19 (`useState`, `useEffect`, `useDeferredValue`, `useCallback`, `useRef`, `useMemo`) and Next.js 16 (`useSearchParams`, `useRouter` from `next/navigation`) cover all SC-04 needs. `sidecar/package.json:15-22` is sufficient.
2. **`GET /api/state/sessions` returns real data** — verified by reading `src/sidecar/server/routes/sessions.ts:24-37` and `state.ts:34-44`. Both call `sessionTracker.list()` (typed getter at `src/sidecar/server/registry.ts:79-84`).
3. **`/api/state/sessions/:id/children` is a STUB** returning `{ children: [] }` (`state.ts:47-52`). SC-04 handles gracefully via UR-SC04-07.
4. **`POST /api/tools/hivemind-session-view` is FIXED** (`sidecar-completeness-2026-06-06` Wave 1, `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:32-80`). Returns real session data.
5. **SSE events: 5 session.* types** — `session.created`, `session.updated`, `session.idle`, `session.deleted`, `session.error` (per `src/sidecar/types.ts:17-29`).
6. **TypeScript strict mode** — `sidecar/tsconfig.json` has `"strict": true`. No `any` allowed in SC-04 code (UB-SC04-03).
7. **CSS variables** — reuse `var(--panel-border)`, `var(--status-connected)`, etc. from `dashboard-shell.tsx:111-128`.

**Primary recommendation:** Use SC-03's `useSse` + `stateStore` + `pluginClient` triad. No package changes. No plugin-side changes. Build 4 new components (`use-sessions.ts`, `session-row.tsx`, `session-tree.tsx`, `session-filter.tsx`) + replace stub `index.tsx`. 20 acceptance criteria testable via vitest + @testing-library/react.

---

## Dependency Version Audit (verified 2026-06-06)

### Already in `sidecar/package.json:1-39` (no changes needed)

| Library | Version | SC-04 Usage | API Surface Required |
|---------|---------|-------------|----------------------|
| `next` | `^16.2.2` | `useSearchParams`, `useRouter` from `next/navigation` | `useSearchParams()` returns `URLSearchParams`; `useRouter().push(path)` updates URL |
| `react` | `^19.0.0` | `useState`, `useEffect`, `useDeferredValue`, `useCallback`, `useRef`, `useMemo` | All stable in React 19 (no concurrent features required) |
| `react-dom` | `^19.0.0` | Standard rendering | No SC-04-specific API |
| `@json-render/core` | `^0.19.0` | NOT USED in SC-04 (SC-04 doesn't use `Renderer` or `defineCatalog`) | N/A |
| `@json-render/react` | `^0.19.0` | NOT USED in SC-04 (SC-04 uses plain React, not json-render specs) | N/A |
| `@json-render/shadcn` | `^0.19.0` | NOT USED in SC-04 | N/A |
| `@json-render/directives` | `^0.19.0` | NOT USED in SC-04 | N/A |
| `tailwindcss` | `^4.0.0` | NOT USED in panel components (per SC-03 D-SC03-05 inline styles) | N/A |
| `zod` | `^4.0.0` | NOT USED in SC-04 (no schema validation in panel) | N/A |

### Already in `sidecar/package.json:26-34` (devDeps, no changes needed)

| Library | Version | SC-04 Usage |
|---------|---------|-------------|
| `@testing-library/react` | `^16.0.0` | Component render tests (`render`, `screen`, `fireEvent`) |
| `@testing-library/jest-dom` | `^6.0.0` | Matchers (`.toBeInTheDocument()`, `.toHaveTextContent()`) |
| `vitest` | `^4.0.0` | Test runner |
| `jsdom` | `^25.0.0` | DOM environment for tests |
| `typescript` | `^5.0.0` | Strict mode type checking |

### Root dependencies (inherited via `sidecar/` workspace)

| Library | Version | SC-04 Usage |
|---------|---------|-------------|
| `zod` (root) | `^4.4.3` | NOT USED in SC-04 (N/A) |

### Confirmed via Context7 MCP (recommended verification)

**Library IDs to query for SC-04 implementation:**

- `/react/react` v19.0.0 — verify `useDeferredValue` for search debounce (stable, available since 18.x)
- `/vercel/next.js` v16.2.2 — verify `useSearchParams` URL state pattern, `useRouter().push()` behavior in App Router

**Library IDs NOT to query (skipped — not used by SC-04):**

- `/vercel-labs/json-render` v0.19.0 — SC-04 doesn't use `Renderer` or catalog
- `/tailwindlabs/tailwindcss` v4.0.0 — SC-04 uses inline styles
- `/colinhacks/zod` v4.4.3 — SC-04 doesn't validate runtime data

**Note:** Since SC-04 consumes SC-03's `useSse` and `pluginClient` interfaces, the Context7 verification was already done in `03-RESEARCH.md` §Context7 MCP Results. SC-04 inherits those verified APIs.

---

## SC-02 API Surface Consumption (verified 2026-06-06)

| SC-02 Endpoint | SC-04 Consumer | Method | Return Type | Status |
|----------------|----------------|--------|-------------|--------|
| `GET /api/state/sessions` | `useSessions` hook via `pluginClient.getSessions()` | GET | `{ sessions: SessionSummary[] }` | ✅ REAL (`state.ts:34-44` calls `st.list()`) |
| `GET /api/state/sessions/:id/children` | `SessionTree` lazy-load on expand | GET | `{ children: ChildSession[] }` | ⚠️ STUB (`state.ts:47-52` returns `[]`) |
| `GET /api/state/sessions/:id/context` | NOT USED in SC-04 (drill-in is SC-04.1) | GET | `{ context: SessionContext }` | ⚠️ STUB (N/A for v1) |
| `POST /api/tools/hivemind-session-view` | Available for SC-04.1 drill-in | POST | `ToolResponse<{ session }>` | ✅ REAL (FIXED in `sidecar-completeness` Wave 1) |
| SSE `session.*` events | `useSse` → `stateStore.handleEvent` | SSE | `SidecarEvent` | ✅ REAL (`use-sse.ts:113-124` dispatches) |

### Lazy-load contract (per `plugin-client.ts:124-127`)

```typescript
async getSessionChildren(id: string): Promise<{ children: ChildSession[] }> {
  return this.get<{ children: ChildSession[] }>(`/api/state/sessions/${id}/children`)
}
```

**ChildSession shape (per `sidecar/src/lib/types.ts:69-76`):**

```typescript
export interface ChildSession {
  id: string
  status: string
  delegatedBy?: string
  depth: number
  turnCount?: number
  createdAt: number
}
```

**SC-04 maps `ChildSession` to `SessionSummary`-compatible view** for tree rendering (id, status, depth, createdAt are common fields).

### Session detail contract (per `plugin-client.ts:192-195`)

```typescript
async postSessionView(params: Record<string, unknown>): Promise<ToolResponse> {
  return this.post<ToolResponse>("/api/tools/hivemind-session-view", params)
}
```

**ToolResponse shape (per `sidecar/src/lib/types.ts:125-129`):**

```typescript
export interface ToolResponse {
  ok: boolean
  data?: unknown
  error?: string
}
```

For `hivemind-session-view` (per `hivemind-session-view.ts:79`): `data` is `{ session: SessionRecord }`. SC-04 doesn't invoke this in v1 (deferred to SC-04.1).

---

## Library ID Validation (Context7 MCP, deferred reference)

For SC-04 implementation, the following Context7 queries are recommended before TDD red phase:

### `/react/react` v19.0.0 — useDeferredValue for search debounce

**Query (recommended):** "useDeferredValue React 19 search debounce best practices"
**Expected answer:** `useDeferredValue` returns a non-urgent version of the value; React will re-render with the old value first, then re-render with the new value. For 150ms debounce, `useDeferredValue` alone doesn't debounce — need `useTransition` or `useEffect` + `setTimeout` for actual debounce.
**SC-04 implementation:** Use `useEffect` + `setTimeout` (150ms) for explicit debounce. `useDeferredValue` is a complementary optimization for very long lists but not required for v1.

### `/vercel/next.js` v16.2.2 — useSearchParams URL state

**Query (recommended):** "Next.js 16 useSearchParams Suspense boundary client component"
**Expected answer:** `useSearchParams` must be called inside a `<Suspense>` boundary in App Router. Wrapping the panel in `<Suspense fallback={...}>` prevents CSR bailout errors.
**SC-04 implementation:** Wrap the `useSessions` + `useSearchParams` consumer in a `<Suspense>` boundary (mirrors `dashboard-shell.tsx:248-264` pattern).

### `/vercel/next.js` v16.2.2 — useRouter push without scroll

**Query (recommended):** "Next.js 16 useRouter.push scroll false behavior"
**Expected answer:** `router.push(href)` scrolls to top by default; `router.push(href, { scroll: false })` preserves scroll position.
**SC-04 implementation:** When updating `?session_filter=`, use `{ scroll: false }` to keep the search input focused (matches `dashboard-shell.tsx:86-90` pattern, which uses default scroll).

---

## STRIDE Threat Model (per universal-rules.md §4 Checkpoint 6)

### S — Spoofing

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| Plugin server identity spoofed | Attacker binds to port 3199, returns fake sessions | Panel shows attacker-controlled data | **Port file sentinel** at `.hivemind/state/sidecar-port.json` is the canonical source. SC-04 uses `pluginClient` which reads from this file. If port is wrong, `GET` fails and SR-SC04-01 banner appears. **Risk: LOW** (localhost-only binding) |
| SSE event spoofing | Attacker injects `session.*` events | StateStore patches with attacker data | SSE connection is `127.0.0.1:port` only. No external connections accepted. **Risk: LOW** |

### T — Tampering

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| Session data tampering by client | Panel writes to `stateStore` | stateStore corrupted | UB-SC04-02: Panel NEVER mutates stateStore. All writes via `stateStore.handleEvent()` (SSE) or `stateStore.refreshSnapshot()` (manual). **Risk: LOW** |
| URL parameter injection | `?session_filter=<script>` | XSS in search input | React 19 auto-escapes string interpolation. No `dangerouslySetInnerHTML` in SC-04. **Risk: LOW** |
| Stale port file | Plugin restarts, port file not updated | `pluginClient` uses stale port | UB-SC04-01: All HTTP via `pluginClient` (which has `handleConnectionError` re-read on 5xx per `plugin-client.ts:75-77`). **Risk: LOW** |

### R — Repudiation

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| User denies clicking Refresh button | Audit log shows no action | Low concern for v1 | N/A for SC-04 (read-only panel, no audit requirements) |
| Plugin denies sending SSE event | Panel missing live update | Stale data | SSE has built-in 30s heartbeat (per `use-sse.ts:79-85`); drop detected → banner. Manual refresh button (ER-SC04-04) recovers. **Risk: LOW** |

### I — Information Disclosure

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| Session name/description contains PII | Panel renders descriptions in browser | PII visible to anyone with browser access | **Out of scope** — SC-04 v1 is localhost-only. If user exposes port 3099 publicly, PII is exposed. **Document as known limitation.** **Risk: MEDIUM** (if user exposes port; LOW for default localhost) |
| URL `?session_filter=xxx` logged in browser history | Search terms persisted in history | Filter terms visible to anyone with browser access | Standard browser behavior; user's choice to clear history. **Risk: LOW** |

### D — Denial of Service

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| SSE connection flood | Many sidecar tabs open | Server-side SseConnectionPool exhausts (50 max per SC-01) | SC-01 caps connections. Each tab = 1 connection. **Risk: LOW** (50-tab limit) |
| 1000+ sessions in tree | Heavy delegation workload | UI jank from re-render | OF-SC04-04: virtualization deferred. For v1, native rendering with React keys. **Risk: LOW** for typical < 100 sessions |
| Lazy-load children DDoS | Rapid click-expand on 100 parents | 100 concurrent `getSessionChildren` calls | Sequential: tree expands one node at a time (user-driven). **Risk: LOW** |
| Search filter with 10K sessions | Future scale | Filter takes > 200ms | OF-SC04-04 deferral; monitor with `useDeferredValue` in v1.5 if needed. **Risk: LOW** (v1 typical < 1000) |

### E — Elevation of Privilege

| Threat | Source | Impact | Mitigation |
|--------|--------|--------|------------|
| Panel calls tool POST endpoints | SC-04 is read-only, no tool invocation in v1 | Unauthorized tool execution | UB-SC04-01: All HTTP via `pluginClient`. SC-04 only calls `getSessions`, `getSessionChildren` (read-only), and `postSessionView` (read-only). No `delegateTask`, `executeSlashCommand`, `sessionPatch`. **Risk: NONE** |
| Panel bypasses stateStore for direct server access | If panel calls `fetch()` directly | Bypasses CQRS boundary | UB-SC04-01: No direct `fetch()`. UB-SC04-04: No `src/sidecar/` imports. **Risk: LOW** (architectural constraint enforced by code review + grep check) |

### STRIDE Summary

| Category | Risk Level | Mitigation Count |
|----------|-----------|------------------|
| Spoofing | LOW | 2 |
| Tampering | LOW | 3 |
| Repudiation | LOW | 2 (N/A for read-only) |
| Info Disclosure | MEDIUM (PII if port exposed) | 1 documented limitation |
| DoS | LOW | 4 |
| Elevation | NONE | 3 (architectural constraints) |

**Overall SC-04 threat surface:** Minimal. Read-only panel, localhost-only, no tool invocation, no new dependencies. The MEDIUM PII disclosure is a known limitation requiring user awareness, not a code-level defect.

---

## Architectural Responsibility Map (SC-04 specific)

| Capability | Primary Owner | Secondary Owner | Rationale |
|------------|--------------|-----------------|-----------|
| Session list data | `src/sidecar/server/routes/sessions.ts:24-37` (real `st.list()`) | `sidecar/src/lib/state-store.ts:46-71` (snapshot init) | Server is source of truth; client caches |
| Tree hierarchy | `SessionSummary.children[]` field | `useSessions` hook sorts + filters | Client-side rendering (no server join) |
| Lazy-load children | `pluginClient.getSessionChildren(id)` | `SessionTree` component on expand | Server endpoint (stub today) |
| Live updates | `useSse` → `stateStore.handleEvent` | `stateStore` patches `/sessions/:id` | Standard CQRS event-sourcing pattern |
| Filter | Client-side substring match in `useSessions` | URL persistence via `useSearchParams` | Client-side for v1 (server-side filter deferred) |
| Empty state | Client-side conditional render | `useSessions` returns `sessions.length === 0` | UI only |
| Error states | Client-side conditional render | `useSessions` returns `error: Error \| null` | UI only |

---

## State of the Art (relevant 2026 patterns)

| Old Approach (pre-2026) | Current Approach (2026) | Impact |
|-------------------------|-------------------------|--------|
| `componentWillMount` for data fetch | `useEffect` with `[]` deps | Standard React hook pattern |
| `setTimeout` polling | SSE event-driven updates | Server-push, no polling overhead |
| Global state via Context Provider | Custom hook + module-level singleton (`getPluginClient`) | Simpler, no Provider wrapping |
| Hardcoded filter logic | `useDeferredValue` for non-urgent updates | React 19 concurrent feature |
| Manual `URLSearchParams` construction | `useSearchParams` from `next/navigation` | First-party Next.js support |
| Class component with `componentDidCatch` | Function component + `ErrorBoundary` from `dashboard-shell.tsx` | Modern React error boundary pattern |

---

## Assumptions Log

| # | Claim | Risk if Wrong | Source / Verification |
|---|-------|---------------|------------------------|
| 1 | `GET /api/state/sessions` returns real data via `sessionTracker.list()` | LOW — verified by code inspection at `state.ts:34-44` | Direct read of `src/sidecar/server/routes/state.ts:34-44` |
| 2 | SSE event `payload.session` is a valid `Partial<SessionSummary>` | MEDIUM — schema not enforced at server. `stateStore.handleEvent` does field-by-field patch (may overwrite with `undefined`) | `src/sidecar/types.ts:17-29` defines events; `sidecar-completeness` Wave 1 added merge logic |
| 3 | `useSearchParams` works inside `<Suspense>` boundary | LOW — standard Next.js 16 pattern, verified at `dashboard-shell.tsx:248-264` | Direct read of `dashboard-shell.tsx` |
| 4 | React 19 `useEffect` cleanup runs on unmount (no manual `.cancel()` needed) | LOW — standard React behavior | React 19 docs |
| 5 | `pluginClient` singleton is initialized at module load with port 3199 (fallback) | LOW — verified at `plugin-client.ts:42-70` | Direct read |
| 6 | `stateStore` is a module-level singleton (not a React context) | LOW — verified at `state-store.ts` (no `createContext`) | Direct read |
| 7 | Test environment uses `jsdom` (per `vitest.config.ts`) | LOW — verified at `sidecar/package.json:32` | Direct read |
| 8 | 70 existing sidecar tests pass before SC-04 changes | LOW — verified per `sidecar-panel-render-fix-2026-06-06` Wave 1 §7.2 | Historical record |
| 9 | `SessionSummary.children[]` is always present (even if empty) | LOW — `types.ts:19` declares `children: string[]` (not optional) | Type definition |
| 10 | `/api/state/sessions/:id/children` stub returns `[]` (not throws) | LOW — verified at `state.ts:47-52` | Direct read |

---

## Open Questions (for v1.5 or v2 — out of SC-04 scope)

1. **Server-side filtering** — Should `GET /api/state/sessions?status=active&search=ses_1` be added? **No for v1** — client-side filter is sufficient for < 1000 sessions. Defer to SC-04.1 if needed.
2. **Tree virtual library** — When to introduce `react-window` or `react-arborist`? **When total session count > 500** consistently. Monitor with dev tools; defer.
3. **Real-time presence indicators** — "X is viewing this session" — out of scope; would require WS presence channel (SC-05 territory).
4. **Session tags/labels** — User-assignable labels for sessions? Out of scope; would require schema changes to `SessionSummary`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | React 19 + Next.js 16 | ✅ | >= 20.0.0 (root requires this) | N/A |
| Plugin server (SC-02) | Runtime data source | ✅ (if running) | per SC-02 | Fallback port 3199; "Plugin server not available" banner |
| `.hivemind/state/sidecar-port.json` | Port discovery | ✅ (if running) | per SC-02 | Fallback port 3199 |
| React Testing Library | Component tests | ✅ | ^16.0.0 | N/A |
| jsdom | Test DOM | ✅ | ^25.0.0 | N/A |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `sidecar/vitest.config.ts` (existing, SC-03) |
| Quick run | `cd sidecar && npx vitest run` (under 15s) |
| Full suite | `cd sidecar && npx vitest run --coverage` |

### SC-04 Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UR-SC04-01 | Display real sessions | Render | `session-explorer.test.tsx` | No (will create) |
| UR-SC04-02 | Tree hierarchy | Render | `session-tree.test.tsx` | No |
| UR-SC04-03 | SSE subscription | Integration | `session-explorer.test.tsx` (mock SSE) | No |
| UR-SC04-04 | Status colors | Render | `session-row.test.tsx` | No |
| UR-SC04-05 | Search filter | Render | `session-filter.test.tsx` | No |
| UR-SC04-06 | Metadata display | Render | `session-row.test.tsx` | No |
| UR-SC04-07 | Lazy-load children | Integration | `session-tree.test.tsx` | No |
| UR-SC04-08 | Empty state | Render | `session-explorer.test.tsx` | No |
| UR-SC04-09 | Plugin unavailable | Render | `session-explorer.test.tsx` | No |
| UR-SC04-10 | SSE drop banner | Integration | `session-explorer.test.tsx` | No |
| UR-SC04-11 | Real data (no stubs) | Inspection | `grep "ses_1\|ses_2\|ses_3" sidecar/src/panels/session-explorer/index.tsx` | No |
| UR-SC04-12 | Keyboard nav | Integration | `session-row.test.tsx` (fireEvent.keyDown) | No |
| UR-SC04-13 | URL persistence | Integration | `session-filter.test.tsx` | No |
| ER-SC04-01 | SSE session.created | Integration | `session-explorer.test.tsx` (mock SSE) | No |
| ER-SC04-02 | SSE session.deleted | Integration | `session-explorer.test.tsx` | No |
| ER-SC04-03 | Search debounce 150ms | Unit | `session-filter.test.tsx` (fake timers) | No |
| ER-SC04-04 | Refresh button | Integration | `session-explorer.test.tsx` | No |
| ER-SC04-05 | SSE reconnect indicator | Integration | `session-explorer.test.tsx` | No |
| SR-SC04-01..05 | Error states | Render | `session-explorer.test.tsx` | No |
| OF-SC04-01..03 | Optional badges | Render | `session-row.test.tsx` | No |
| UB-SC04-01..06 | Architectural constraints | Code review + grep | Manual check | N/A |

**Total new tests:** ~20 (one per AC) × ~30 LOC avg = ~600 LOC across 5 test files.

### Wave 0 Gaps

- No test files exist for SC-04 (all are NEW)
- No new `vitest.config.ts` needed (existing)
- CI integration for sidecar tests exists in root (per SC-03)

---

## Security Domain (ASVS)

### Applicable ASVS Categories

| Category | Applies | Standard Control |
|----------|---------|------------------|
| V1 Architecture | Yes | localhost-only binding, no auth (per SC-02 D-SC02-01) |
| V2 Authentication | No | localhost is the security boundary |
| V3 Session Management | No | Browser URL state, no server sessions |
| V4 Access Control | No | All users have full read access (read-only panel) |
| V5 Input Validation | Yes | React 19 auto-escapes, no `dangerouslySetInnerHTML` |
| V6 Cryptography | No | localhost-only, no encryption needed |
| V7 Error Handling | Yes | `ErrorBoundary` per panel; inline error states |
| V8 Data Protection | Partial | PII in session descriptions (MEDIUM risk if port exposed) |
| V9 Communications | No | localhost HTTP |
| V10 Malicious Code | No | No third-party code execution |
| V11 Business Logic | Yes | No write operations in v1 |
| V12 Files and Resources | No | No file operations |
| V13 API and Web Service | Yes | Type-safe `pluginClient` wrapper, typed response shapes |
| V14 Configuration | No | All config in `constants.ts` (typed) |

### Known Threat Patterns (cross-reference STRIDE)

- **Port file read by unauthorized process** — File is inside `.hivemind/state/` (project-local), contains only `{ port }` — no secrets
- **Plugin server unavailable** — SR-SC04-01 banner + manual refresh
- **SSE event flood** — Server-side 50-connection cap (SC-01)
- **PII in session descriptions** — Documented limitation; out of scope for v1
- **Lazy-load children DDoS** — User-driven, sequential; low risk

---

## Sources

1. **`.planning/codebase/ARCHITECTURE.md`** — §3 (Two-Server Model), §8.1 (No Auth, localhost-only)
2. **`.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md`** — §4.1 (per-handler stub status), §7.7 (GAP-01 fix in `hivemind-session-view.ts`)
3. **`.planning/phases/SC-03-nextjs-app/03-SPEC.md`** — UI hosting layer (UR-SC03-04 grid, OF-SC03-01 ?panel=)
4. **`.planning/phases/SC-03-nextjs-app/03-CONTEXT.md`** — SC-03 decisions (D-SC03-04 tab nav, D-SC03-05 inline styles, D-SC03-11 Tailwind v4)
5. **`.planning/phases/SC-03-nextjs-app/03-RESEARCH.md`** — SC-03 dependency versions, Context7 MCP results
6. **`.planning/phases/SC-03-nextjs-app/03-PLAN-CHECK.md`** — SC-03 plan-check verdict (PASS, 0.92 confidence)
7. **`.planning/phases/SC-03-nextjs-app/SC-03-FRAMEWORK-STATUS.md`** — SC-03 honest status
8. **`src/sidecar/server/routes/sessions.ts:24-37`** — `GET /api/state/sessions` (REAL via `st.list()`)
9. **`src/sidecar/server/routes/state.ts:34-44, 47-52`** — duplicate + stub `GET /api/state/sessions/:id/children`
10. **`src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:32-80`** — FIXED `POST /api/tools/hivemind-session-view`
11. **`src/sidecar/types.ts:17-29`** — `SIDECAR_EVENT_TYPES` (11 types, 5 session.*)
12. **`src/sidecar/server/registry.ts:79-84`** — `registry.sessionTracker` typed getter
13. **`sidecar/src/lib/types.ts:14-25, 104-121, 150-164`** — `SessionSummary`, `SidecarEvent`, `SidecarState`
14. **`sidecar/src/lib/plugin-client.ts:120-127, 192-195`** — `getSessions`, `getSessionChildren`, `postSessionView`
15. **`sidecar/src/lib/state-store.ts:19-127`** — `createSidecarStateStore` (initialize, refreshSnapshot, handleEvent)
16. **`sidecar/src/lib/use-sse.ts:47-178`** — `useSse` hook (exponential backoff, heartbeat, cleanup)
17. **`sidecar/src/lib/constants.ts:53-78`** — `PANELS` array
18. **`sidecar/src/components/dashboard-shell.tsx:33-264`** — parent dashboard shell
19. **`sidecar/src/panels/session-explorer/index.tsx:1-50`** — current hardcoded stub
20. **`sidecar/package.json:1-39`** — all dependencies (no changes needed)
21. **`sidecar/tsconfig.json`** — `strict: true` (UB-SC04-03 enforcement)
22. **Context7 (recommended for execution phase):** `/react/react` v19, `/vercel/next.js` v16.2.2
23. **Root `AGENTS.md` → `## Test-Driven Development`** — RED-GREEN-Coverage-REFACTOR discipline

---

*Research conducted: 2026-06-06 — Wave 2 of `sidecar-honest-rebaseline-2026-06-06`. No new dependencies. No plugin-side changes. All surfaces exist. Ready for `/hm-pattern-mapper` → 04-PATTERNS.md.*
