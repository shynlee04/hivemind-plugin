# Phase SC-03: Next.js 16 Standalone App — Research

**Researched:** 2026-06-03
**Domain:** Next.js 16 standalone mode, @json-render/react v0.19.0, sidecar GUI shell
**Confidence:** HIGH
**Depends on:** SC-01 (Foundation), SC-02 (REST API + Tool Proxy) — COMPLETE

## Summary

SC-02 is complete and fully implemented — 17 endpoints (6 state reads, 7 tool POST, 1 SSE, 1 WS, 2 catalog) are live in `src/sidecar/server/`. SC-03 consumes these endpoints from a separate Next.js 16 standalone application. The `sidecar/` directory exists with a bare skeleton (Next.js 15, `@json-render/react@^0.1.0`, no panels). Key findings:

1. **SC-02 API surface is confirmed** — all 17 endpoints verified by reading source files
2. **Dependency upgrade required** — `sidecar/package.json` needs next 15→16, json-render ^0.1.0→^0.19.0, add shadcn, tailwind v4
3. **json-render v0.18→0.19.0 is additive** — no breaking changes [VERIFIED: RESEARCH-json-render.md + Context7]
4. **Standalone mode confirmed** — `output: "standalone"` in Next.js 16 via Context7 `/vercel/next.js/v16.2.2` [VERIFIED: Context7]
5. **SSE ReadableStream pattern confirmed** — Next.js 16 Route Handlers support `ReadableStream` natively [VERIFIED: Context7]
6. **`defineCatalog()` API confirmed** — `import { defineCatalog } from '@json-render/core'; import { schema } from '@json-render/react/schema'` [VERIFIED: Context7]

**Primary recommendation:** Upgrade `sidecar/package.json` to Next.js 16.2.2, json-render 0.19.0, add `@json-render/shadcn`, define catalog with `defineCatalog()`, import `Renderer` via `next/dynamic({ ssr: false })`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP routing | SidecarRouter (SC-02, `handler.ts`) | Next.js Route Handlers | SC-03 uses typed client, not route handlers |
| State reads | SC-02 `/api/state/*` | N/A | SC-03 plugin-client.ts fetches from SC-02 |
| Tool writes | SC-02 `POST /api/tools/*` | N/A | SC-03 plugin-client.ts sends POST via fetch |
| SSE events | SC-02 `GET /api/events` | SC-03 `use-sse.ts` hook | Server pushes; SC-03 consumes in hook |
| Catalog | SC-03 `catalog.ts` (pre-bundled) | SC-02 `/api/catalog` | Pre-bundled > fetched for reliability |
| State store | SC-03 `state-store.ts` | json-render StateProvider | json-render's createStateStore API |
| Panel rendering | SC-03 `Renderer` (dynamic) | Custom React components | json-render for spec-driven, React for custom |
| Port discovery | SC-02 `sidecar-port.json` | SC-03 `plugin-client.ts` | Single sentinel file |

---

## SC-02 API Surface Consumption Matrix

| SC-02 Endpoint | SC-03 Consumer | Method | Return Type | First Used By |
|----------------|----------------|--------|-------------|---------------|
| `GET /api/state/snapshot` | `state-store.ts` | `snapshot()` | `StateSnapshot` | SC-03 bootstrap |
| `GET /api/state/sessions` | `plugin-client.ts` | `listSessions()` | `SessionSummary[]` | SC-04 |
| `GET /api/state/sessions/{id}/children` | `plugin-client.ts` | `getSessionChildren(id)` | `ChildSession[]` | SC-04 |
| `GET /api/state/sessions/{id}/context` | `plugin-client.ts` | `getSessionContext(id)` | `SessionContext` | SC-04 |
| `GET /api/state/sessions/{id}/delegations` | `plugin-client.ts` | `getSessionDelegations(id)` | `DelegationRecord[]` | SC-05 |
| `GET /api/state/sessions/{id}/docs` | `plugin-client.ts` | `getSessionDocs(id)` | `DocChunk[]` | SC-06 |
| `GET /api/events` (SSE) | `use-sse.ts` | EventSource connection | SSE stream | SC-03 bootstrap |
| `WS /ws/delegation` | SC-05 panel | WebSocket connection | WS frames | SC-05 |
| `GET /api/catalog` | (Pre-bundled) | `catalog.ts` | `JsonRenderCatalog` | SC-03 |
| `GET /api/catalog/tools` | `plugin-client.ts` | `listTools()` | `ToolCatalogEntry[]` | SC-07 |
| `POST /api/tools/delegate-task` | `plugin-client.ts` | `delegateTask(args)` | `ToolResponse` | SC-07 |
| `POST /api/tools/delegation-status` | `plugin-client.ts` | `delegationStatus(args)` | `ToolResponse` | SC-05 |
| `POST /api/tools/execute-slash-command` | `plugin-client.ts` | `executeCommand(args)` | `ToolResponse` | SC-07 |
| `POST /api/tools/hivemind-trajectory` | `plugin-client.ts` | `queryTrajectory(args)` | `ToolResponse` | SC-06 |
| `POST /api/tools/hivemind-session-view` | `plugin-client.ts` | `getSessionView(id)` | `ToolResponse` | SC-04 |
| `POST /api/tools/session-patch` | `plugin-client.ts` | `patchSession(args)` | `ToolResponse` | SC-07 |
| `POST /api/tools/hivemind-command-engine` | `plugin-client.ts` | `discoverCommands(args)` | `ToolResponse` | SC-07 |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | ^16.2.2 | App framework | Standalone mode, RSC, Route Handlers, streaming |
| `react` | ^19.0.0 | UI runtime | Peer dep for next + json-render |
| `react-dom` | ^19.0.0 | DOM renderer | Peer dep for next |
| `@json-render/react` | ^0.19.0 | json-render integration | Renderer, StateProvider, providers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@json-render/core` | ^0.19.0 | Catalog definition (defineCatalog) | SC-03 catalog.ts |
| `@json-render/shadcn` | ^0.19.0 | 36 pre-built shadcn components | SC-03 catalog.ts (component definitions) |
| `@json-render/directives` | ^0.19.0 | Computed value directives ($format, $math) | Optional — for dashboard computed metrics |
| `tailwindcss` | ^4.0.0 | CSS framework | shadcn peer dep; UI styling |
| `zod` | ^4.0.0 | Schema validation | json-render catalog peer dep |
| `vitest` | ^4.0.0 | Test runner | Match root project |
| `@tailwindcss/postcss` | ^4.0.0 | PostCSS plugin | Tailwind v4 PostCSS integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next ^16.2.2` | `next ^15.x` | Next.js 15 works identically but we miss 16's stability improvements. 15→16 is minor-patch-compatible for App Router. 16 is confirmed via Context7. |
| `@json-render/react ^0.19.0` | `@json-render/react ^0.18.x` | 0.18→0.19.0 has NO breaking changes (additive only — `defineDirective`, `@json-render/directives`). Both fine. |
| `@json-render/shadcn` | Build 36 shadcn components from scratch | ~200+ LOC per component. shadcn package provides them pre-built with Zod schemas. **Don't hand-roll.** |
| Fetch catalog from `/api/catalog` | Bundle catalog in SC-03 | Fetched catalog = network dependency for render. Bundled = always available, type-checked, tree-shaken. **Prefer bundled.** |

---

## Package Legitimacy Audit

### Current `sidecar/package.json` State

| Package | Current Version | Target Version | Registry Status | Notes |
|---------|----------------|----------------|-----------------|-------|
| `next` | ^15.0.0 | ^16.2.2 | [VERIFIED: npm registry + Context7] | Upgrade required |
| `react` | ^19.0.0 | ^19.0.0 | [VERIFIED: npm registry] | Already correct |
| `react-dom` | ^19.0.0 | ^19.0.0 | [VERIFIED: npm registry] | Already correct |
| `@json-render/react` | ^0.1.0 | ^0.19.0 | [VERIFIED: npm registry + Context7] | **Major upgrade** — 0.1→0.19, but sidecar has zero existing catalog code so no migration risk |
| `@json-render/core` | NOT INSTALLED | ^0.19.0 | [VERIFIED: Context7 `/vercel-labs/json-render`] | Add |
| `@json-render/shadcn` | NOT INSTALLED | ^0.19.0 | [VERIFIED: RESEARCH-json-render.md + npm registry] | Add |
| `@json-render/directives` | NOT INSTALLED | ^0.19.0 | [VERIFIED: RESEARCH-json-render.md + npm registry] | Optional — add |
| `tailwindcss` | NOT INSTALLED | ^4.0.0 | [ASSUMED] | Add (peer dep for shadcn) |
| `@tailwindcss/postcss` | NOT INSTALLED | ^4.0.0 | [ASSUMED] | Add (Tailwind v4 PostCSS) |
| `zod` | NOT INSTALLED (in root) | ^4.4.3 | [VERIFIED: root package.json] | Install in sidecar/ or reference root |

**Note:** The `@json-render/react ^0.1.0` entry is a significant version gap (0.1.x → 0.19.x). The 0.1.x API (`createCatalog`, `actionHandlers`) is completely different from the 0.19.x API (`defineCatalog(schema, config)`, `handlers`). Since SC-03 starts with zero catalog code, this does NOT require a migration — it's a clean install of the latest API.

No `slopcheck` issues detected — all packages are well-established with long registry histories.

---

## Common Pitfalls

### Pitfall 1: json-render `Renderer` with SSR enabled
**What goes wrong:** `Renderer` uses browser APIs for streaming UI rendering. Enabling SSR causes hydration mismatches — `ReferenceError: ReadableStream is not defined` or mismatched DOM trees.
**How to avoid:** Always import `Renderer` via `next/dynamic(() => import('...'), { ssr: false })`.

### Pitfall 2: Missing `@source` directive for shadcn in Tailwind v4
**What goes wrong:** `@json-render/shadcn` components use Tailwind classes (e.g., `bg-card`, `text-muted-foreground`). Without a `@source` directive pointing to the shadcn package, those classes are purged from the CSS bundle.
**How to avoid:** Add `@source "../../node_modules/@json-render/shadcn/dist"` to the CSS entry point (e.g., `globals.css`).

### Pitfall 3: Direct import from `src/sidecar/` (plugin-side)
**What goes wrong:** The Next.js app is a SEPARATE process from the plugin. Importing `src/sidecar/readonly-state.ts` (which uses Node `fs` modules) would work during development but fail in standalone mode or cause bundling issues.
**How to avoid:** Strictly enforce UB-SC03-01 — only communicate via HTTP through `plugin-client.ts`.

### Pitfall 4: SSE EventSource accumulating listeners on reconnect
**What goes wrong:** Each `useEffect` run without cleanup creates a new `EventSource` listener. After 10 reconnections, 10 listeners fire for each event.
**How to avoid:** Return cleanup function from `useEffect` that calls `eventSource.close()`.

### Pitfall 5: Port file not found in standalone production mode
**What goes wrong:** In production (`.next/standalone/server.js`), `process.cwd()` points to the standalone directory, not the project root. The relative path `'../.hivemind/state/sidecar-port.json'` resolves incorrectly.
**How to avoid:** Accept `HIVEMIND_DIR` as an env var with a `process.cwd()`-relative fallback. Document this env var requirement for production deployment.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| json-render component definitions | 44 manual component definitions | `@json-render/shadcn` (36 pre-built) + 8 custom | Saves ~200+ LOC per component; Zod schemas already written |
| State management | Custom state container | json-render `createStateStore` | Built for this use case; reactive store path binding |
| Tabbed panel navigation | Custom router | Next.js `useSearchParams` + `useRouter` | URL-persistent, bookmarkable, standard Next.js |
| Error isolation per panel | Single error boundary | Multiple `ErrorBoundary` components (one per panel) | One panel crash ≠ all panels down |

---

## State of the Art

| Old Approach (pre-2026) | Current Approach | When Changed | Impact |
|-------------------------|------------------|--------------|--------|
| json-render `createCatalog()` | `defineCatalog(schema, config)` | v0.6.0 (already in 0.19) | Cleaner API, Zod-based |
| json-render `actionHandlers` prop | `handlers` prop | v0.6.0 (already in 0.19) | Renamed prop |
| json-render `{ $path }` expression | `{ $state }`, `{ $item }`, `{ $index }` | v0.6.0 (already in 0.19) | Unambiguous naming |
| json-render prompt `{ mode: "generate" }` | `{ mode: "standalone" }` | v0.15 (deprecated, still works) | Use new names |
| Next.js 14 Pages Router | Next.js 16 App Router | 2024 | RSC, streaming, layouts |
| Next.js `next start` | `output: "standalone"` → `node server.js` | v14+ | Minimal production server |
| Tailwind v3 content config | Tailwind v4 `@source` directive | 2025 | Different scan mechanism |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong | Source |
|---|-------|---------|---------------|--------|
| 1 | Next.js 16.2.2 is the latest stable version | Standard Stack | LOW — Context7 confirmed v16.2.2 as stable version | [VERIFIED: Context7 `/vercel/next.js/v16.2.2`] |
| 2 | json-render v0.18→0.19.0 has no breaking changes | Package Audit | MEDIUM — if wrong, catalog imports may fail | [VERIFIED: RESEARCH-json-render.md §Executive Summary + Context7 docs] |
| 3 | `defineCatalog(schema, config)` API is stable in 0.19.0 | Standard Stack | LOW — confirmed from multiple Context7 snippets | [VERIFIED: Context7 `/vercel-labs/json-render`] |
| 4 | `@json-render/shadcn` requires Tailwind v4 | Package Audit | MEDIUM — wrong Tailwind version causes build failures | [CITED: RESEARCH-json-render.md §@json-render/shadcn] |
| 5 | SSE via ReadableStream in Route Handlers is the canonical Next.js 16 pattern | Architecture | LOW — same pattern works in Next.js 14/15 | [VERIFIED: Context7 + RESEARCH-nextjs.md] |
| 6 | json-render `Renderer` requires `ssr: false` | Architecture | LOW — causes hydration mismatch if SSR enabled | [VERIFIED: RESEARCH-nextjs.md §5 + Context7] |
| 7 | `sidecar-port.json` contains `{ "port": <number> }` | Port Discovery | LOW — locked by SC-01/SC-02 decisions | [VERIFIED: SC-02 CONTEXT.md D-SC02-12] |
| 8 | `@json-render/react ^0.1.0` → `^0.19.0` is safe (no legacy code) | Package Audit | LOW — sidecar has ZERO catalog code to break | [VERIFIED: sidecar/src/ inspection — only layout.tsx + page.tsx exist] |
| 9 | `useSearchParams` from `next/navigation` works for tab state | Dashboard | LOW — standard Next.js 16 pattern | [ASSUMED] |

---

## Open Questions

1. **Standalone production mode path resolution** — In `node .next/standalone/server.js`, does `process.cwd()` resolve to the project root or the `.next/standalone/` directory? If the latter, the relative path `'../.hivemind/...'` from `plugin-client.ts` would break. Need to test.
2. **Tailwind v4 version lock** — Should SC-03 pin `tailwindcss ^4.0.0` to a specific minor version (e.g., `^4.1.0`) to match what `@json-render/shadcn` expects? The RESEARCH-json-render.md says `^4.0.0` but the actual version may vary.
3. **Zod version conflict** — Root project uses `zod ^4.4.3`. The `sidecar/` app needs zod for json-render catalog definitions. Should `sidecar/package.json` install its own zod or reference root's? (Likely its own, to avoid peer dep resolution issues.)
4. **Port fallback for independent development** — When developing SC-03 without a running plugin, what port should `plugin-client.ts` fall back to? Propose 3199 (one above 3099) as documented in constants.
5. **Package manager for sidecar/** — Should install use `npm install` (matching root) or should it be a workspace member? (Likely standalone `npm install` for simplicity.)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 | ✅ | >= 20.0.0 (root requires this) | N/A |
| npm | Package install | ✅ | (root standard) | N/A |
| Plugin server (SC-02) | Runtime | ✅ (if running) | N/A | Fallback port 3199 |
| `.hivemind/state/sidecar-port.json` | Port discovery | ✅ (if running) | N/A | Show "not available" state |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest |
| Config file | `sidecar/vitest.config.ts` (NEW) |
| Quick run | `cd sidecar && npx vitest run` (under 15s) |
| Full suite | `cd sidecar && npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AC-SC03-01 | Build produces standalone output | Build | `next build` → check `server.js` | No (will create) |
| AC-SC03-02 | Port discovery from sentinel | Unit | `plugin-client.test.ts` | No |
| AC-SC03-03 | All 17 endpoint methods typed | Type guard | `tsc --noEmit` | No |
| AC-SC03-04 | StateStore initializes | Unit | `state-store.test.ts` | No |
| AC-SC03-05 | SSE client dispatches events | Unit | `use-sse.test.ts` | No |
| AC-SC03-06 | Dashboard renders 4-panel grid | Render | `dashboard-shell.test.tsx` | No |
| AC-SC03-07 | Catalog has 44 components | Unit | `catalog.test.ts` | No |
| AC-SC03-08 | Tab switch + URL sync | Integration | `dashboard-shell.test.tsx` | No |
| AC-SC03-09 | Error boundary isolation | Render | `error-boundary.test.tsx` | No |
| AC-SC03-10 | Loading skeleton shown | Render | `loading.test.tsx` | No |
| AC-SC03-11 | No plugin-side imports | Build | grep check | Manual |
| AC-SC03-12 | SSE reconnection backoff | Unit | `use-sse.test.ts` | No |
| AC-SC03-13 | Renderer SSR disabled | Code review | Manual check | No |

### Wave 0 Gaps
- No test files exist for SC-03 (all are NEW)
- No `vitest.config.ts` in `sidecar/`
- No CI integration for sidecar tests (must be added)

---

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | localhost-only, no auth (per ARCHITECTURE §8.1) |
| V5 Input Validation | Partial | Tool proxy input validated by SC-02; SC-03 plugin-client.ts sends what SC-02 expects |
| V8 Data Protection | Partial | All traffic is localhost-only; no encryption needed |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Port file read by unauthorized process | Information Disclosure | File is inside `.hivemind/state/` canonical surface; contains only `{ port }` — no secrets |
| Plugin server unavailable | Denial of Service | SC-03 shows "not available" state with retry |
| SSE event flood | Denial of Service | 50-connection cap on plugin server (SC-01 `SseConnectionPool`); SC-03 client limits reconnection |

---

## Sources

1. **ARCHITECTURE.md** (`/Users/apple/hivemind-plugin-private/.hivemind/planning/sidecar-vision/ARCHITECTURE.md` — 1113 LOC)
2. **RESEARCH-nextjs.md** (`/Users/apple/hivemind-plugin-private/.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` — 615 LOC)
3. **RESEARCH-json-render.md** (`/Users/apple/hivemind-plugin-private/.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` — 337 LOC)
4. **RESEARCH-ecosystem.md** (`/Users/apple/hivemind-plugin-private/.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` — 453 LOC)
5. **AUDIT-codebase-surfaces.md** (`/Users/apple/hivemind-plugin-private/.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` — 416 LOC)
6. **SC-02 SPEC.md** (`/Users/apple/hivemind-plugin-private/.planning/phases/SC-02-rest-api-tool-proxy/02-SPEC.md` — 341 LOC)
7. **SC-02 CONTEXT.md** (`/Users/apple/hivemind-plugin-private/.planning/phases/SC-02-rest-api-tool-proxy/02-CONTEXT.md` — 306 LOC)
8. **SC-02 Source code** — Full inspection of `src/sidecar/server/routes/{state,sessions,tools,events,catalog}.ts`, `tool-proxy/router.ts`, `handler.ts`, `types.ts`, `sse/pool.ts`, `registry.ts`
9. **sidecar/ directory** — `package.json`, `next.config.ts`, `src/app/{layout,page}.tsx`
10. **Context7:** `/vercel/next.js/v16.2.2` — standalone output, ReadableStream SSE, self-hosting
11. **Context7:** `/vercel-labs/json-render` — `defineCatalog()`, `defineRegistry()`, catalog composition
12. **Root package.json** — `optionalDependencies` contains json-render packages at ^0.19.0

---

*Research conducted: 2026-06-03 — Source: sidecar vision docs, SC-02 source code inspection, Context7 API docs, package.json audit.*
