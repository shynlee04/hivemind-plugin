# Phase SC-01: Sidecar Foundation — Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the foundational infrastructure for all Hivemind Sidecar panels: a lightweight embedded HTTP/WS server in the plugin process, extended canonical state prefixes for session-tracker and opencode access, lazy dependency binding so the server can start before all modules are constructed, and SSE connection primitives. This is the plugin-side foundation — SC-02 (REST API + Tool Proxy) and SC-03 (Next.js app) layer on top.
</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `SC-01-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `SC-01-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- New files in `src/sidecar/` — `types.ts`, `readonly-state-extensions.ts`, `server/factory.ts`, `server/registry.ts`, `server/sse/pool.ts`
- Extension of `src/sidecar/readonly-state.ts` — CANONICAL_PREFIXES array enlargement
- Wiring in `src/plugin.ts` — server start at step 5.5, binding calls at steps 6-15
- Package bumps in `package.json` — json-render 0.18→0.19, ws added to optionalDeps
- Wave 0 test files for new modules (`tests/sidecar/server/`)

**Out of scope (from SPEC.md):**
- REST API routes (state, sessions, events, catalog) — SC-02
- Tool proxy (12 REST handlers wrapping plugin tools) — SC-02
- WebSocket delegation stream — SC-02
- SSE event observer wiring (createSidecarEventObserver) — SC-02
- Next.js 16 app scaffold — SC-03
- Sidecar panels (Session Explorer, Delegation Dashboard, MEMS Browser, Control Panel) — SC-04, SC-05, SC-06
- Plugin composition splitting (plugin.ts decomposition into registry/startup/composer) — P33
- Any authentication or authorization beyond localhost-only binding
- Request routing or handler layer (server is raw `http.createServer` with accept-only)

</spec_lock>

<decisions>
## Implementation Decisions

### Server Factory API Shape
- **D-SC01-01:** `createSidecarServer()` returns `{ port: number; close: () => Promise<void> }` with an internal async `start()` method. The factory itself is synchronous — it creates the server without binding. The caller invokes an internal `.start()` to bind to the random port. This keeps the factory testable without network dependency and matches the PLAN's `await sidecarServer.start()` pattern.
- **D-SC01-02:** Server binding to `127.0.0.1:0` (random port). The `start()` method resolves with the actual port after the `listening` event fires. Implementation: `server.listen(0, '127.0.0.1', () => resolve(server.address().port))`.

### Error Handling Strategy
- **D-SC01-03:** Server start failure must NOT block plugin init. If `createSidecarServer().start()` fails, log a `[Harness]` warning and continue plugin initialization without the sidecar. Use a try-catch wrapper in `plugin.ts` step 5.5.
- **D-SC01-04:** Sidecar-port.json write failure is non-fatal — log warning and continue. Next.js will detect missing port file and show a "Sidecar not available" state.

### Server Healthcheck
- **D-SC01-05:** Include a minimal healthcheck endpoint `GET /health` → `200 OK` with JSON `{ status: "ok", uptime: <ms> }` in SC-01. This enables:
  - Next.js sidecar to verify connectivity before rendering panels
  - Quick smoketest verification before SC-02 routing arrives
  - The check is trivially implemented as 2 lines atop the raw HTTP server
- **D-SC01-06:** ALL other request routing is deferred to SC-02. The server's request handler has a single pattern match: if path === `/health`, return 200; otherwise return `501 Not Implemented`.

### SSE Heartbeat Format
- **D-SC01-07:** Standard SSE format: `event: heartbeat\ndata: {}\n\n`. 30s interval (configurable via `SseConnectionPool` constructor option). Dead connections detected during `broadcast()` — if `controller.enqueue()` throws, call `removeClient()`.
- **D-SC01-08:** Max clients: 50 (configurable). No reconnection logic in SC-01 — client-side reconnection is a browser concern for SC-03.

### Registry Type Safety
- **D-SC01-09:** Use `import type` for class references in `SidecarDependencyRegistry` — e.g., `import type { SessionTracker } from '../../features/session-tracker'`. The getters return typed interfaces, not concrete class instances. This avoids circular dependencies and allows the server to start before modules are constructed.
- **D-SC01-10:** Setter methods accept broad interfaces (`unknown` with runtime type guard) or specific imported types. Prefer imported types via `import type` for compile-time safety.

### P39 Dependency Resolution
- **D-SC01-11:** Proceed with SC-01 independently of P39. While ROADMAP lists "Depends On: P39", the sidecar foundation code is isolated — it adds new files to `src/sidecar/` and minimal wiring in `plugin.ts`. No P39 outcomes are required for SC-01 to function. P39 mainly concerns integration hardening of unrelated features (performance optimization, error handling, architectural refactoring). If P39 has introduced plugin.ts changes that conflict with step 5.5 wiring, the planner will detect and resolve the merge during plan execution.
- **D-SC01-12:** Planner MUST verify `src/plugin.ts` startup sequence before inserting step 5.5 — the exact step numbering may have shifted due to P39 or other in-flight changes.

### Test Approach
- **D-SC01-13:** TDD approach — write Wave 0 test files BEFORE implementation. Tests for: registry (binding lifecycle, error on unbound getter, isReady()), factory (server creation, port > 0, close cleanup), SSE pool (add/remove/broadcast, heartbeat timing), readonly-state extensions (4 prefixes, directory listing, reject non-canonical paths).
- **D-SC01-14:** Server tests use port 0 (random) to avoid port conflicts. Close server in `afterEach`/`afterAll`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Design
- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` — Complete sidecar architecture (1113 LOC): two-server model, plugin startup integration (§3), API endpoint design (§4), state bridge design (§5), lazy binding registry (§3.3), SSE event model (§3.4)
- `.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` — ~85 integration surface audit across all plugin modules
- `.hivemind/planning/sidecar-vision/landscape.md` — Sidecar landscape overview
- `.planning/phases/SC-01-sidecar-foundation/SC-01-SPEC.md` — Locked requirements (MUST read before planning)
- `.planning/phases/SC-01-sidecar-foundation/SC-01-PLAN.md` — Existing plan (will be revised based on this context)

### Research
- `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` — Ecosystem research
- `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` — json-render framework research
- `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` — Next.js 16 research

### Codebase References
- `src/sidecar/readonly-state.ts` — Existing read-only state enforcement module (139 LOC)
- `src/sidecar/readonly-state-extensions.ts` — Will be created by this phase
- `src/sidecar/types.ts` — Will be created by this phase
- `src/plugin.ts` — Plugin composition root (step 5.5 insertion point)
- `sidecar/package.json` — Next.js app package config

### Prior Decisions
- `.planning/REQUIREMENTS.md` §Q2 — Artifact-Focused Sidecar decision (Next.js + @json-render/react, READ-ONLY)
- `.planning/PROJECT.md` — Project context and key decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/sidecar/readonly-state.ts` — `isCanonicalStatePath()`, `readCanonicalState()`, `readCanonicalStateAsync()`, `refuseCanonicalWrite()` — all reusable for SC-01 state bridge. The `CANONICAL_PREFIXES` array is the main extension point.
- `tests/sidecar/readonly-state.test.ts` — Existing test coverage for read-only state enforcement. Must pass after prefix extension.

### Established Patterns
- **Zero-dependency approach:** Plugin modules avoid framework dependencies (no Express, Fastify). The server uses Node `http.createServer` — matches the existing philosophy of minimizing external deps.
- **Lazy initialization:** Pattern established by PTY manager (optional lazy-load). Sidecar follows same pattern — optional dependency, graceful fallback.
- **CQRS:** Tools write, hooks observe. The sidecar state bridge is a read-only observer — matches the CQRS boundary.
- **Module structure:** Feature modules in `src/features/`, tools in `src/tools/`, shared in `src/shared/`. Sidecar gets its own `src/sidecar/` namespace.
- **Error prefix:** `[Harness]` on all thrown errors — must be followed in registry getter errors.

### Integration Points
- `src/plugin.ts` step 5.5 — Server start inserted after tmux integration (step 5), before session-tracker (step 6)
- `src/sidecar/server/registry.ts` — Receives lazy bindings from SessionTracker (step 6), DelegationManager (step 7), client (step 1)
- `src/sidecar/readonly-state.ts` `CANONICAL_PREFIXES` — Extended to include `.hivemind/session-tracker` and `.opencode`
- `.hivemind/state/sidecar-port.json` — Port file written for Next.js discovery

### Architectural Constraints
- Two-server model: plugin HTTP (localhost random port) + Next.js (port 3099)
- Plugin server binds to 127.0.0.1 only — no external network access
- Random port (0) — fixed ports only in tests
- Server must NOT block plugin init completion (fire-and-forget)
- `ws` in optionalDependencies — plugin works without WS available

</code_context>

<specifics>
## Specific Ideas

No specific user requirements beyond the SPEC and architecture docs. All implementation decisions follow standard Node.js HTTP server patterns and the existing sidecar architecture design. The 7 locked SPEC requirements provide sufficient guidance.

</specifics>

<deferred>
## Deferred Ideas

- **Request routing infrastructure** — Deleting all routing (14+ endpoint matchers, response formatting, content negotiation) to SC-02. SC-01 only includes `/health`.
- **WebSocket delegation streaming** — Explicitly deferred to SC-02.
- **SSE event observer wiring** — `createSidecarEventObserver()` function that wires plugin events → SSE broadcasts deferred to SC-02.
- **Plugin.ts decomposition** — Extracting server/startup/composer from plugin.ts deferred to P33.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: SC-01-Sidecar-Foundation*
*Context gathered: 2026-06-02*
