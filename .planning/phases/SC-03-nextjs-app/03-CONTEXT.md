# Phase SC-03: Next.js 16 Standalone App — Context

**Gathered:** 2026-06-03
**Mode:** Researched (single-agent hm-phase-researcher; decisions for discuss-phase)
**Status:** Ready for discuss-phase
**Ambiguity Score:** TBD (post discuss-phase)

<domain>
## Phase Boundary

SC-03 transforms the bare `sidecar/` skeleton — which currently has a stub `next.config.ts` with Next.js 15, a bare `layout.tsx`/`page.tsx`, and an outdated `@json-render/react@^0.1.0` — into the full Next.js 16 standalone application that serves as the sidecar GUI shell. SC-03 ships the dashboard shell, plugin HTTP client, unified json-render catalog, StateStore with SSE-driven refresh, loading skeleton, error boundary, and 4 panel stubs for SC-04/05/06/07.

This is the **UI hosting layer** — SC-04 (Session Explorer), SC-05 (Delegation Dashboard), SC-06 (MEMS Browser), and SC-07 (Control Panel) will each implement their panel's full functionality in subsequent phases. SC-03 provides the runtime infrastructure those panels depend on.

Key boundary: All SC-03 work lives in `sidecar/` directory. No changes to `src/sidecar/` (plugin-side server) — communication is exclusively via HTTP to the SC-02 plugin server.
</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**22 requirements across 5 categories.** See `03-SPEC.md` for full requirements, boundaries, acceptance criteria, and schema pinning.

**In scope (from SPEC.md):**
- Next.js 16 config with `output: "standalone"` and port 3099
- Package upgrades: next 16, json-render 0.19.0, @json-render/shadcn, Tailwind v4
- Dashboard root layout + loading skeleton + error boundary
- 4-panel grid layout with tab navigation (URL-persisted)
- `plugin-client.ts` — typed HTTP client for all 17 SC-02 endpoints
- `catalog.ts` — unified json-render catalog (44 components: 36 shadcn + 8 custom)
- `state-store.ts` — StateStore with snapshot fetch + SSE-driven invalidation
- `use-sse.ts` — SSE client hook with exponential backoff reconnection
- 4 panel stubs with pre-built json-render specs
- Dashboard shell component with connected status indicator
- Error boundary component
- Vitest smoke tests + typecheck

**Out of scope (from SPEC.md):**
- Panel implementation (SC-04/05/06/07)
- Real SSE event dispatch to panels
- WebSocket delegation streaming
- Tool proxy invocation from UI
- Plugin-side code changes
- Catalog generation toolchain
- E2E tests with real plugin server
</spec_lock>

<decisions>
## Implementation Decisions (Proposed — for discuss-phase resolution)

### D-SC03-01: Next.js version — upgrade to Next.js 16.2.2
- Current: `next ^15.0.0` in `sidecar/package.json`
- Target: `next ^16.2.2` (latest stable confirmed via Context7 at v16.2.2)
- `output: "standalone"` config option required per architecture constraint
- No breaking changes from 15 → 16 for App Router (proven by Next.js 16 migration docs)
- **Risk:** LOW — standard upgrade path

### D-SC03-02: json-render packages — upgrade to ^0.19.0 across the board
- Current: `@json-render/react ^0.1.0` (extremely old, likely pre-0.6.0 API)
- Target: `@json-render/react ^0.19.0`, `@json-render/core ^0.19.0`, `@json-render/shadcn ^0.19.0`
- Add `@json-render/shadcn` for 36 pre-built component definitions
- Add `@json-render/directives ^0.19.0` as optional dep for computed values
- Verified: v0.18.x → 0.19.0 has NO breaking changes (per RESEARCH-json-render.md)
- **Risk:** LOW — additive upgrade; sidecar/ currently has zero catalog code

### D-SC03-03: Plugin HTTP client — single typed module, not per-route handlers
- Single `plugin-client.ts` exposes all 17 endpoint methods with typed return values
- Reads port from `.hivemind/state/sidecar-port.json` at init
- Caches the base URL; does NOT re-read the file on each request
- Returns typed objects matching SC-02 schema definitions (StateSnapshot, ToolResponse, etc.)
- **Rationale:** Simpler than per-route Next.js API handlers for a sidecar that always proxies to plugin. One typed client = one source of truth.
- **Risk:** MEDIUM — if the port file changes at runtime (plugin restart), client breaks. Mitigation: on connection error, client re-reads port file.

### D-SC03-04: Dashboard shell — client component with tab-navigation state
- Dashboard shell is a `'use client'` component wrapping the 4 panels
- Tab state stored in URL search params (`?panel=sessions|delegation|mems|control`)
- Uses `useSearchParams` / `useRouter` for URL-state sync
- Non-selected panels stay mounted (CSS `display: none`) to preserve state
- SSE connected indicator shown in the shell header
- **Rationale:** URL-persistent tabs are shareable, bookmarkable, and survive page refresh. Keeping non-selected panels mounted avoids re-fetch on tab switch.
- **Risk:** LOW — standard Next.js pattern

### D-SC03-05: json-render catalog — statically defined in TypeScript, NOT fetched from /api/catalog
- Catalog defined in `sidecar/src/lib/catalog.ts` using `defineCatalog()` from `@json-render/core`
- Uses `import type` for Zod schemas, no runtime dependency on plugin server for catalog
- 44 components defined: 36 from `@json-render/shadcn`, 8 custom sidecar components
- Catalog is bundled at build time (tree-shaken by Turbopack)
- **Rationale:** The catalog is the contract between AI generation and UI rendering. Bundling it at build time ensures it's always available, avoids network dependency for render, and enables TypeScript type checking of component definitions.
- **Deviation from ARCHITECTURE §4.5:** ARCHITECTURE suggests fetching catalog from `/api/catalog`. The pre-bundled approach is simpler and more reliable for the Next.js app. The plugin server catalog endpoint remains available for external consumers.
- **Risk:** LOW — catalog changes require a rebuild, but it changes infrequently

### D-SC03-06: StateStore — managed through @json-render/react's `createStateStore`
- Use `createStateStore` from `@json-render/react` (v0.19.0 API, confirmed stable)
- Wrapped in `StateProvider` at the layout level
- Initial state populated from `plugin-client.snapshot()` on mount
- SSE events patch state paths via `store.set(path, value)`
- Higher-order `refreshSnapshot()` function for bulk refresh
- **Rationale:** json-render's built-in state store is designed for this use case — reactive components bind to store paths and re-render on change.
- **Risk:** LOW — pattern confirmed from RESEARCH-json-render.md and actual source

### D-SC03-07: SSE client — custom hook, not json-render's built-in
- Custom `use-sse.ts` hook wrapping browser `EventSource` API
- Exponential backoff reconnection: 1s → 2s → 4s → 8s → 16s → 30s max
- Dispatches events to StateStore by matching event type to store path
- `'use client'` module — only used in client components
- **Rationale:** json-render doesn't ship an SSE client. Separate hook keeps concerns separated.
- **Risk:** LOW — standard EventSource pattern

### D-SC03-08: Panel stubs — dynamic import for code splitting
- Each panel loaded via `next/dynamic(() => import('@/panels/sessions'), { ssr: false })`
- Loading skeleton rendered while panel JS chunk loads
- Error boundary wraps each panel independently (one panel crash ≠ all panels down)
- **Rationale:** Code splitting by panel ensures ~50-70 KB per panel chunk (per RESEARCH-nextjs.md §7). Independent error boundaries prevent cascading failures.
- **Risk:** LOW — proven pattern from RESEARCH-nextjs.md

### D-SC03-09: Plugin port discovery — sentinel file, no env var
- `plugin-client.ts` reads `.hivemind/state/sidecar-port.json` from project root
- Project root resolved relative to `sidecar/`: `path.resolve(process.cwd(), '..')`
- Default: `{ "port": 3199 }` if file not found (development fallback)
- On HTTP error: re-read the port file and retry (handles plugin restart)
- **Rationale:** Matches SC-02 D-SC02-12 (port file is the single discovery point). Fallback port enables independent development of SC-03 without plugin running.
- **Risk:** MEDIUM — fallback port must match CI/dev expectations; document in README

### D-SC03-10: Package manager alignment — Next.js app uses npm (inherits from root)
- `sidecar/package.json` uses npm (consistent with root project)
- No `pnpm`-specific config needed
- Install command: `cd sidecar && npm install` (or root-level workspace install)
- **Rationale:** Project root uses npm. Adding a different package manager for a subdirectory adds CI complexity.
- **Risk:** LOW — standard setup

### D-SC03-11: Tailwind v4 — @source directive for shadcn path
- Tailwind v4 requires `@source` directives to scan for class names in external packages
- Add `@source "../../node_modules/@json-render/shadcn/dist"` to `sidecar/src/app/globals.css`
- Keep Tailwind's `content` config for local files (Tailwind v4 auto-detects `content` from `@import`)
- **Rationale:** `@json-render/shadcn` components are built with Tailwind classes. Without `@source`, those classes won't be included in the CSS bundle.
- **Risk:** LOW — documented pattern from RESEARCH-json-render.md §Known Failure Modes

### D-SC03-12: TypeScript path aliases
- `@/` maps to `sidecar/src/` (standard Next.js convention)
- `@lib/`, `@components/`, `@panels/` sub-aliases for cleaner imports
- Configured in `sidecar/tsconfig.json` under `compilerOptions.paths`
- **Rationale:** Standard Next.js 16 practice; avoids deep relative imports
- **Risk:** LOW — well-established pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Research
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` — §1-3 (two-server model, communication flow, startup), §7 (json-render catalog, StateStore, panel mapping), §9.2 (Next.js file structure)
- `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` — Standalone mode, SSE ReadableStream, client boundary, bundle optimization
- `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` — All json-render v0.19.0 APIs, `defineCatalog`, `defineRegistry`, shadcn catalog
- `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` — Reference GUI patterns
- `.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` §11-12 — Sidecar gaps, integration architecture

### Phase Documents
- `.planning/phases/SC-03-nextjs-app/03-SPEC.md` — Locked requirements, schemas, ACs
- `.planning/phases/SC-02-rest-api-tool-proxy/02-SPEC.md` — All SC-02 endpoint definitions consumed by SC-03
- `.planning/phases/SC-02-rest-api-tool-proxy/02-CONTEXT.md` — SC-02 decisions (12 locked) inherited by SC-03
- `.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md` — Server foundation, SSE pool, registry

### Codebase References (SC-02 surfaces consumed by SC-03)
- `src/sidecar/server/routes/state.ts` — **6 state endpoints**: snapshot, sessions, sessions/{id}/children, sessions/{id}/context, sessions/{id}/delegations, sessions/{id}/docs
- `src/sidecar/server/routes/events.ts` — **SSE endpoint** with 6 filter categories, 11 event types
- `src/sidecar/server/routes/catalog.ts` — **2 catalog endpoints**: `/api/catalog`, `/api/catalog/tools`
- `src/sidecar/server/routes/tools.ts` — **7 tool POST endpoints** (delegate-task, delegation-status, execute-slash-command, hivemind-trajectory, hivemind-session-view, session-patch, hivemind-command-engine)
- `src/sidecar/server/tool-proxy/router.ts` — TOOL_HANDLERS map (7 entries)
- `src/sidecar/types.ts` — `SidecarEventType` (11 members), `SidecarEvent`, `DirectoryEntry`
- `src/sidecar/server/handler.ts` — SidecarRouter class, Route type, sendJson/sendError helpers
- `sidecar/package.json` — Current deps (upgrade target)
- `sidecar/next.config.ts` — Stub config (upgrade target)
- `sidecar/src/app/layout.tsx` — Stub layout (rewrite target)
- `sidecar/src/app/page.tsx` — Stub page (rewrite target)

### Prior Decisions (inherited)
- `.planning/REQUIREMENTS.md` §Q2 — Artifact-Focused Sidecar (Next.js + @json-render/react)
- `.planning/architecture/VALIDATION-DECISIONS-2026-04-25.md` — Q1-Q6 architectural locks
- `.hivemind/planning/sidecar-vision/landscape.md` — Sidecare landscape overview

</canonical_refs>

<code_context>
## Existing Code Insights

### SC-02 Endpoints Consumed by SC-03 (verified by code inspection)

| Endpoint | Method | SC-03 Consumer | Response Shape |
|----------|--------|----------------|----------------|
| `/api/state/snapshot` | GET | state-store.ts initial fetch | `{ sessions, delegations, trajectory, pressure, config, server }` |
| `/api/state/sessions` | GET | Session Explorer (SC-04) | `{ sessions: SessionSummary[] }` |
| `/api/state/sessions/{id}/children` | GET | Session Explorer (SC-04) | `{ children: ChildSession[] }` |
| `/api/state/sessions/{id}/context` | GET | Session Explorer (SC-04) | `{ context: SessionContext }` |
| `/api/state/sessions/{id}/delegations` | GET | Delegation Dashboard (SC-05) | `{ delegations: DelegationRecord[] }` |
| `/api/state/sessions/{id}/docs` | GET | MEMS Browser (SC-06) | `{ docs: DocChunk[] }` |
| `/api/events` (SSE) | GET | use-sse.ts → state-store.ts | 11 SidecarEvent types |
| `/ws/delegation` (WS) | WS | Delegation Dashboard (SC-05) | WS message types |
| `/api/catalog` | GET | (deferred — SC-03 pre-bundles) | JSON-render catalog |
| `/api/catalog/tools` | GET | Control Panel (SC-07) | ToolCatalogEntry[] |
| `/api/tools/delegate-task` | POST | Control Panel (SC-07) | ToolResponse |
| `/api/tools/delegation-status` | POST | Delegation Dashboard (SC-05) | ToolResponse |
| `/api/tools/execute-slash-command` | POST | Control Panel (SC-07) | ToolResponse |
| `/api/tools/hivemind-trajectory` | POST | MEMS Browser (SC-06) | ToolResponse |
| `/api/tools/hivemind-session-view` | POST | Session Explorer (SC-04) | ToolResponse |
| `/api/tools/session-patch` | POST | Control Panel (SC-07) | ToolResponse |
| `/api/tools/hivemind-command-engine` | POST | Control Panel (SC-07) | ToolResponse |

### Existing sidecar/ Directory State
```
sidecar/
├── .gitignore                    # Standard Next.js gitignore
├── next.config.ts                # Next.js 15 stub — UPGRADE to 16
├── package.json                  # next ^15.0.0, @json-render/react ^0.1.0 — UPGRADE all
├── README.md                     # Phase 42 foundation stub
├── tsconfig.json                 # Standard Next.js config
└── src/
    ├── app/
    │   ├── layout.tsx            # Bare shell — REWRITE with StateProvider + dashboard shell
    │   └── page.tsx              # Stub "Sidecar Dashboard" — REWRITE with 4-panel grid
    └── lib/
        └── .gitkeep              # EMPTY — will hold: catalog.ts, plugin-client.ts, state-store.ts, types.ts, use-sse.ts, constants.ts
```

### Minimal Dependencies Needed (verified from package.json)

**To upgrade in `sidecar/package.json`:**
- `next`: ^15.0.0 → ^16.2.2
- `@json-render/react`: ^0.1.0 → ^0.19.0 (8 major versions jump — RISK: old API surface may not match)
- `react` / `react-dom`: already ^19.0.0 ✅

**To add:**
- `@json-render/core ^0.19.0` — for `defineCatalog`
- `@json-render/shadcn ^0.19.0` — for 36 pre-built component definitions
- `@json-render/directives ^0.19.0` — for computed value directives (optional)
- `tailwindcss ^4.0.0` — peer dep for shadcn
- `zod ^4.0.0` — peer dep for json-render (already in root deps)

**To add (devDependencies):**
- `@tailwindcss/postcss ^4.0.0` — PostCSS plugin for Tailwind v4
- `vitest ^4.0.0` — test runner (match root version)
- `@testing-library/react` — component render tests

**Already available (no install needed for sidecar/):**
- `zod ^4.4.3` — root has it; sidecar may share or install own copy

### Architectural Constraints (from SC-01 + SC-02)
- Two-server model: plugin HTTP (`127.0.0.1:random`) + Next.js (`127.0.0.1:3099`)
- Plugin port discovered from `.hivemind/state/sidecar-port.json`
- No auth, no rate limiting — localhost-only binding is the security boundary
- Sidecar is READ-ONLY for canonical state; writes go through tool proxy
- `plugin-client.ts` must NOT import `src/sidecar/` modules

</code_context>

<boundaries>
## Execution Boundaries (planner-facing)

### Allowed Surfaces
- **`sidecar/next.config.ts`** — Update for standalone mode, headers, port config
- **`sidecar/package.json`** — Upgrade all deps (next 16, json-render 0.19, shadcn, tailwind v4)
- **`sidecar/tsconfig.json`** — Add path aliases (`@/`, `@lib/`, etc.)
- **`sidecar/src/app/layout.tsx`** — Rewrite with StateProvider, metadata, fonts
- **`sidecar/src/app/page.tsx`** — Rewrite with 4-panel dashboard shell
- **`sidecar/src/app/loading.tsx`** — NEW: loading skeleton
- **`sidecar/src/app/error.tsx`** — NEW: error boundary
- **`sidecar/src/app/globals.css`** — NEW: Tailwind v4 base styles with @source directive
- **`sidecar/src/lib/plugin-client.ts`** — NEW: typed HTTP client
- **`sidecar/src/lib/catalog.ts`** — NEW: unified json-render catalog
- **`sidecar/src/lib/state-store.ts`** — NEW: StateStore + snapshot refresh
- **`sidecar/src/lib/types.ts`** — NEW: SC-03 type definitions
- **`sidecar/src/lib/constants.ts`** — NEW: panel definitions, port config
- **`sidecar/src/lib/use-sse.ts`** — NEW: SSE client hook
- **`sidecar/src/components/dashboard-shell.tsx`** — NEW: tab navigation + grid layout
- **`sidecar/src/components/error-boundary.tsx`** — NEW: React error boundary
- **`sidecar/src/panels/session-explorer/index.tsx`** — NEW: stub panel
- **`sidecar/src/panels/session-explorer/specs.ts`** — NEW: pre-built json-render spec
- **`sidecar/src/panels/delegation-dashboard/index.tsx`** — NEW: stub panel
- **`sidecar/src/panels/delegation-dashboard/specs.ts`** — NEW: pre-built json-render spec
- **`sidecar/src/panels/mems-browser/index.tsx`** — NEW: stub panel
- **`sidecar/src/panels/mems-browser/specs.ts`** — NEW: pre-built json-render spec
- **`sidecar/src/panels/control-panel/index.tsx`** — NEW: stub panel
- **`sidecar/src/panels/control-panel/specs.ts`** — NEW: pre-built json-render spec
- **`sidecar/README.md`** — Update with architecture and usage instructions

### Forbidden Surfaces
- ❌ DO NOT touch `src/sidecar/` (plugin-side server) — communication is HTTP-only
- ❌ DO NOT touch `src/plugin.ts` — no plugin-side changes in SC-03
- ❌ DO NOT touch `.planning/phases/SC-02-*` or any other phase's artifacts
- ❌ DO NOT add auth, rate limiting, or request middleware
- ❌ DO NOT implement panel-specific logic (SC-04/05/06/07 scope)
- ❌ DO NOT implement WebSocket client (SC-05 scope)
- ❌ DO NOT implement tool proxy invocation buttons (SC-07 scope)
- ❌ DO NOT import `@hivemind` or `hivemind` packages from sidecar code
- ❌ DO NOT use `fs.readFileSync` on `.hivemind/` from the Next.js app (use plugin-client HTTP instead)

### Actors / Consumers
- **SC-04 (Session Explorer)** — consumes catalog, StateStore, plugin-client, SSE
- **SC-05 (Delegation Dashboard)** — consumes catalog, StateStore, plugin-client, SSE, WS
- **SC-06 (MEMS Browser)** — consumes catalog, StateStore, plugin-client, trajectory/pressure
- **SC-07 (Control Panel)** — consumes catalog, plugin-client (tool proxy), SSE
- **Human operator (browser)** — primary user via port 3099

### Verification Commands
- **Type check:** `cd sidecar && npx tsc --noEmit` (must pass with strict mode)
- **Build:** `cd sidecar && npx next build` (must produce `.next/standalone/server.js`)
- **Unit tests:** `cd sidecar && npx vitest run` (must pass all SC-03 smoke tests)
- **Manual smoke:** `cd sidecar && npx next dev` then browse to `http://localhost:3099` — dashboard loads with 4-panel grid
- **Full test suite (root):** `npm test` from project root — must not break existing 2,963+ tests

### Stop Conditions
- ✅ `03-SPEC.md`, `03-CONTEXT.md`, `03-RESEARCH.md` written to `.planning/phases/SC-03-nextjs-app/`
- ✅ All 13 ACs documented with falsifiable pass conditions
- ✅ 12 proposed decisions ready for discuss-phase resolution
- ✅ Clear allowed/forbidden surfaces
- ⏹️ STOP — do NOT auto-start PLAN phase; wait for discuss-phase
- ⏹️ STOP — do NOT touch SC-02, SC-01, or other phase source

</boundaries>
