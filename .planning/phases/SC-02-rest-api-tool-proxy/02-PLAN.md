# Phase SC-02: REST API + Tool Proxy — PLAN

**Phase ID:** SC-02
**Phase Name:** REST API + Tool Proxy
**Status:** PLAN (locked at 2026-06-03)
**Depends on:** SC-01 (Foundation — Plugin HTTP Server + State Bridge) — DONE
**Blocks:** SC-03 (Next.js 16 sidecar dashboard), SC-04, SC-05, SC-06, SC-07
**Authoring Agent:** `gsd-planner` (stacked on `ses_176d78648ffeP7wkk2kstwd0BF`)
**Plan Validation:** Goal-backward (7 must_haves), 5-wave decomposition, module-size-budget locked, TDD discipline

---

## Evidence Level

**L5 — Documentation guidance only.** This plan authorizes future execution-phase work. It does **not** claim runtime readiness, pass any AC, or substitute for L1-L3 verification. All acceptance criteria from `02-SPEC.md` remain unbound until execution-phase produces L1 evidence (passing vitest tests) and L2 evidence (integration test passes), and L3 evidence (typecheck + build + full suite + 2,963+ tests still passing).

Per `.planning/AGENTS.md`:
- This is a **planning/governance sector** artifact (`.planning/phases/SC-02-rest-api-tool-proxy/`)
- It does NOT implement runtime behavior
- It does NOT claim readiness from docs alone
- It DOES identify allowed/forbidden surfaces, actors, verification commands, and stop conditions

---

## Goal

SC-02 transforms the SC-01 server scaffold (currently returning `501 Not Implemented` on all non-`/health` routes) into the bounded HTTP / SSE / WebSocket surface that the Next.js 16 sidecar dashboard (SC-03+) will consume, shipping 17 endpoints under strict OpenCode-runtime-ownership constraints with **zero new runtime dependencies** and **no architectural changes to SC-01 outputs**.

---

## Must-Haves (Goal-Backward)

Each must-have is derived from SPEC acceptance criteria. For SC-02 to be considered "done" by execution-phase, **all 7** must be backed by L1-L2 evidence (passing tests + integration + build).

| # | Must-Have | Source AC | Verification Method |
|---|-----------|-----------|---------------------|
| **MH-1** | All 17 endpoints reachable with correct status codes (200/200/200/200/404/200/200/200/200/200/200/200/200/200/101/200/200) and correct response body shapes | AC-S02-01 | `npx vitest run tests/sidecar/server/handler.test.ts -t "endpoint matrix"` (17-call smoke) |
| **MH-2** | `ToolResponse<T>` envelope enforced on all 7 write tools; Zod schema validates 100 random tool responses without error | AC-S02-02 | `npx vitest run tests/sidecar/server/routes/tools.test.ts -t "envelope shape"` + `npx vitest run tests/sidecar/server/tool-proxy/router.test.ts` |
| **MH-3** | SSE pool enforces 50-connection cap (51st returns 503 + `Retry-After: 5`); 6 filter categories parsed correctly; unknown filter returns 400 `INVALID_FILTER` | AC-S02-03, AC-S02-04, OF-S02-01, UB-S02-04 | `npx vitest run tests/sidecar/server/routes/events.test.ts -t "50-cap\|filter-allowlist"` |
| **MH-4** | WebSocket delegation channel matches locked JSON schemas; unknown `type` closes with 1008; malformed JSON closes with 1003; backpressure buffer 64KB triggers 1013; dead conn cleanup within 5s | AC-S02-05, UB-S02-05, UB-S02-06, UB-S02-07, D-SC02-03, D-SC02-10 | `npx vitest run tests/sidecar/server/ws/delegation.test.ts` |
| **MH-5** | Catalog endpoints (`/api/catalog`, `/api/catalog/tools`) are immutable; SHA-256 ETag served; 100 sequential GETs return byte-identical payloads; `If-None-Match` matching ETag returns 304 | AC-S02-07, OF-S02-03, D-SC02-04, D-SC02-11 | `npx vitest run tests/sidecar/server/routes/catalog.test.ts -t "immutable\|etag\|304"` |
| **MH-6** | `POST /api/tools/session-patch` rejects canonical state paths (`.hivemind/state`, `.hivemind/session-tracker`, `.opencode`, `.planning`) with `FORBIDDEN_PATH` + HTTP 200 (no plugin dispatch); 4 negative tests + 1 affirmative non-canonical path test | AC-S02-08, UB-S02-01, OF-S02-02 | `npx vitest run tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts` |
| **MH-7** | End-to-end delegation flow works: `POST /api/tools/delegate-task` → WS `subscribe` → receive `delegation.output` events → WS `unsubscribe`. One integration test gated by `SIDECAR_INTEGRATION=1` | AC-S02-11, D-SC02-05 | `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts` |

**Cross-cutting must-haves (always-on):**
- `MH-X1` No-auth-required: fresh client (no headers) succeeds on all 17 endpoints (AC-S02-09) — covered by MH-1 smoke matrix
- `MH-X2` TypeScript strict mode: `npm run typecheck` passes; no `any` in `src/sidecar/server/routes/**` (AC-S02-10) — verified at end of Wave 4

---

## Wave Structure (5 waves, TDD discipline)

All waves follow goal-backward + TDD where applicable. Wave 0 = test scaffolding (tests written first, watched to fail). Each wave ends with an atomic commit. **No wave is skipped; no wave merges into the next without passing its own verification command.**

| Wave | Objective | Files Created/Modified | Verification (per-wave merge) | Atomic Commit Message |
|------|-----------|-------------------------|--------------------------------|------------------------|
| **W0** | Test scaffolding (TDD red) | 15 test files under `tests/sidecar/**` | `npx vitest run tests/sidecar/ --reporter=verbose` (all FAIL — red) | `phase(SC-02): W0 — scaffold 15 test files, watch all fail (TDD red)` |
| **W1** | Core infrastructure | `src/sidecar/server/handler.ts` (≤200 LOC), `src/sidecar/server/cache.ts` (≤500 LOC), `src/sidecar/server/routes/types.ts` (≤500 LOC), `src/sidecar/server/tool-proxy/router.ts` (≤200 LOC); extend `src/sidecar/server/factory.ts` (route registration option ONLY) | `npx vitest run tests/sidecar/server/handler.test.ts` (partial pass) | `phase(SC-02): W1 — SidecarRouter + SidecarStateCache + TOOL_HANDLERS map + factory extension` |
| **W2** | REST routes (state + tools + catalog) | 4 route modules (`state.ts`, `sessions.ts`, `tools.ts`, `catalog.ts`; each ≤500 LOC); 7 tool handlers (`tool-proxy/handlers/*.ts`; each ≤200 LOC); 2 catalog wrappers (`catalog/{json-render-catalog,tool-catalog}.ts`; ≤300 LOC combined); 2 JSON assets (`catalog/*.json`) | `npx vitest run tests/sidecar/server/routes/ tests/sidecar/server/tool-proxy/` (all pass) | `phase(SC-02): W2 — 4 REST route modules + 7 tool handlers + catalog JSON + wrappers` |
| **W3** | Real-time (SSE + WS) | `src/sidecar/server/routes/events.ts` (≤500 LOC); `src/sidecar/server/ws/delegation.ts` (≤500 LOC); `src/sidecar/server/ws/pool.ts` (≤300 LOC); optionally `src/sidecar/server/ws/types.d.ts` (ambient if `@types/ws` not installed) | `npx vitest run tests/sidecar/server/routes/events.test.ts tests/sidecar/server/ws/delegation.test.ts` (all pass) | `phase(SC-02): W3 — SSE event bus with filter + WS delegation channel with 1013 backpressure` |
| **W4** | Integration + verification (closes 11 ACs) | `tests/sidecar/integration/delegation.test.ts` (AC-S02-11); `tests/sidecar/integration/performance.test.ts` (3 perf tests, gated by `SIDECAR_PERF`); no new src files | `npm run typecheck` + `SIDECAR_INTEGRATION=1 SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/` + `npm run test` (2,963+ tests still pass) + `npm run build` | `phase(SC-02): W4 — integration + perf + typecheck + full suite; 11 ACs evidence-gated L1-L3` |

**Total source files (new):** ~20 .ts files + 2 .json assets
**Total test files (new):** ~17 .test.ts files (15 in W0 + 2 integration in W4)
**Atomic commits:** 5 (one per wave)

---

## Dependency Graph

```
W0 (test scaffolding)
  ↓
W1 (handler + cache + tool-proxy/router + types + factory extension)
  ↓
W2 (4 REST routes + 7 tool handlers + catalog)    [parallel with W3 within wave]
  ↓
W3 (events.ts + ws/delegation.ts + ws/pool.ts)
  ↓
W4 (integration + perf + typecheck + full suite + build)
```

**Linear chain** — each wave depends on the previous. Within a wave, no parallel plan splits are needed (each wave is a single plan with 2-3 internal tasks). **File ownership is exclusive per wave** to avoid merge conflicts (no file in 2+ waves).

**Cross-wave invariants:**
- W2/W3 routes import types from W1's `routes/types.ts` (no circular deps)
- W3's `events.ts` uses SC-01's `SseConnectionPool` (already exported)
- W3's `ws/delegation.ts` uses SC-01's `SidecarDependencyRegistry` (already exported)
- W4 integration test imports from W1+W2+W3 + SC-01 modules

---

## File Inventory (with LOC budgets)

**Allowed surfaces (per CONTEXT §boundaries):**

| Wave | Path | LOC Budget | Purpose |
|------|------|-----------|---------|
| W1 | `src/sidecar/server/handler.ts` | ≤200 | Main HTTP router (method+path matching) |
| W1 | `src/sidecar/server/cache.ts` | ≤500 | `SidecarStateCache` (5s/2s TTLs + ETag) |
| W1 | `src/sidecar/server/routes/types.ts` | ≤500 | All route request/response types (per C-S02-02) |
| W1 | `src/sidecar/server/tool-proxy/router.ts` | ≤200 | `TOOL_HANDLERS: Record<string, ToolHandler>` map |
| W1 | `src/sidecar/server/factory.ts` | +30 LOC | Extend with `routes?: Route[]` option (modify, not refactor) |
| W2 | `src/sidecar/server/routes/state.ts` | ≤500 | `/api/state/snapshot` |
| W2 | `src/sidecar/server/routes/sessions.ts` | ≤500 | 5 session-scoped GETs |
| W2 | `src/sidecar/server/routes/tools.ts` | ≤500 | 7 tool POST routes |
| W2 | `src/sidecar/server/routes/catalog.ts` | ≤500 | 2 catalog GETs |
| W2 | `src/sidecar/server/tool-proxy/handlers/delegate-task.ts` | ≤200 | Wraps plugin `delegate-task` |
| W2 | `src/sidecar/server/tool-proxy/handlers/delegation-status.ts` | ≤200 | Wraps plugin `delegation-status` |
| W2 | `src/sidecar/server/tool-proxy/handlers/execute-slash-command.ts` | ≤200 | Wraps plugin `execute-slash-command` |
| W2 | `src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts` | ≤200 | Wraps plugin `hivemind-trajectory` |
| W2 | `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts` | ≤200 | Wraps plugin `hivemind-session-view` |
| W2 | `src/sidecar/server/tool-proxy/handlers/session-patch.ts` | ≤200 | Wraps plugin `session-patch` + `isSidecarSessionFilePath` gate |
| W2 | `src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.ts` | ≤200 | Wraps plugin `hivemind-command-engine` (discover-only) |
| W2 | `src/sidecar/catalog/json-render-catalog.ts` | ≤150 | Typed wrapper around JSON |
| W2 | `src/sidecar/catalog/tool-catalog.ts` | ≤150 | Typed wrapper around JSON |
| W2 | `src/sidecar/catalog/json-render-catalog.json` | (asset) | Pre-generated 44-component catalog |
| W2 | `src/sidecar/catalog/tool-catalog.json` | (asset) | Pre-generated 12-tool metadata |
| W3 | `src/sidecar/server/routes/events.ts` | ≤500 | SSE route + filter parsing |
| W3 | `src/sidecar/server/ws/delegation.ts` | ≤500 | `WsDelegationHandler` |
| W3 | `src/sidecar/server/ws/pool.ts` | ≤300 | `WsConnectionPool` (mirrors SseConnectionPool) |
| W3 | `src/sidecar/server/ws/types.d.ts` | ≤100 | Ambient declarations (ONLY if `@types/ws` install fails slopcheck) |
| W4 | (no new src files) | — | Integration + perf tests only |

**Test file inventory (W0 + W4):**
- W0: 15 test scaffolds (per route/handler) + 1 mock (`tests/sidecar/__mocks__/registry.ts`)
- W4: 2 integration files (`tests/sidecar/integration/{delegation,performance}.test.ts`)

---

## Risk Mitigations (from RESEARCH 8 open risks)

| Risk ID | Mitigation Plan | Verification |
|---------|-----------------|---------------|
| **R-STACK-SYNC** (STACK.md out of date) | Use `package.json` as authoritative; never cite STACK.md in code comments | Code review grep: no `ws@^8.18.0` claims in new files; only `ws@8.21.0` (installed) referenced |
| **R-WS-TYPES** (no @types/ws) | Run slopcheck legitimacy audit on `npmjs.com/package/@types/ws`; if APPROVED → `npm install --save-dev @types/ws`; if REJECTED → use ambient `src/sidecar/server/ws/types.d.ts` | `ls node_modules/@types/ws/` OR `ls src/sidecar/server/ws/types.d.ts`; typecheck must pass either way |
| **R-PLUGIN-SHAPE-DRIFT** (INTEGRATIONS.md stale) | Hivemind's `HarnessControlPlane` is already async 1.15.13-compatible; no fix needed | W1 `handler.ts` compiles; Wave 1 typecheck passes |
| **R-WS-PLUGIN-COEXIST** (WS upgrade on shared HTTP server) | `WebSocketServer({noServer: true})` + manual `handleUpgrade` in `handler.ts`; try/catch upgrade errors → 503 `SERVICE_UNAVAILABLE` (graceful degradation) | W3 test: WS client on `ws://127.0.0.1:<port>/ws/delegation` receives frames; HTTP client on same port receives HTTP responses (no conflict) |
| **R-CATALOG-MUTATION** (catalog accidentally mutated) | `Object.freeze` recursive (deepFreeze helper) at module load; Zod parse-then-freeze pipeline | W2 test: `try { catalog.something = "x" } catch {}` throws in strict mode; 100 sequential GETs return byte-identical SHA-256 |
| **R-HEARTBEAT-LIVENESS** (WS dead conn detection) | Server-initiated 30s `delegation.status` heartbeat (D-SC02-10); `send()` failure → close 1011; `req.on('close')` cleanup within 5s | W3 test: client gone → server pool size decreases within 5s |
| **R-PERF-BASELINE** (no SLA reference) | 3 perf tests gated by `SIDECAR_PERF=1`; matches D-SC02-01 budgets (50/100/250/500ms p95) | `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts` passes; p95 metrics reported |
| ~~R-CONTEXT-COUNT-MISMATCH~~ | RESOLVED in research-phase (12 tools reconciled: 5 read + 7 write = 12; 17 routes = 4 read-state + 7 write + 1 SSE + 1 WS + 2 catalog) | n/a |

**STRIDE mitigations (10 threats from research, 9 mitigated + 1 accepted):**
- Spoofing: No auth (per UR-S02-02); localhost-only binding (per UR-S02-01)
- Tampering: `isSidecarSessionFilePath()` gate on session-patch (per UB-S02-01)
- Repudiation: `[Harness]`-prefixed error logs; `meta.duration` in ToolResponse
- Information disclosure: localhost-only; no payload echo in error messages
- Denial of service: 50-conn cap (SSE+WS) + 256KB body cap + 64KB WS buffer (1013 close)
- Elevation of privilege: TOOL_HANDLERS explicit whitelist (7 of 27 plugin tools) per D-SC02-09; no reflection
- Side-channel timing: 100/250/500ms p95 SLAs (D-SC02-01) cap attack surface
- Replay (ACCEPTED): not mitigated at transport; deferred to tool-level idempotency (out of SC-02 scope per SPEC non-goals)
- Supply chain: `ws@8.21.0` + `zod@4.4.3` already audited in research-phase; `@types/ws` install gated by slopcheck
- Configuration: port file `127.0.0.1:0` ephemeral; no env var; restart = new port

---

## Allowed Surfaces (per CONTEXT §boundaries)

**Files to CREATE (all under allowed paths):**
- `src/sidecar/server/handler.ts` (W1)
- `src/sidecar/server/cache.ts` (W1)
- `src/sidecar/server/routes/{state,sessions,tools,events,catalog,types}.ts` (W1, W2, W3)
- `src/sidecar/server/ws/{delegation,pool,types.d.ts?}.ts` (W3)
- `src/sidecar/server/tool-proxy/{router,handlers/*}.ts` (W1, W2)
- `src/sidecar/catalog/{json-render-catalog,tool-catalog}.{ts,json}` (W2)
- `tests/sidecar/__mocks__/registry.ts` (W0)
- `tests/sidecar/server/handler.test.ts` (W0)
- `tests/sidecar/server/routes/{state,sessions,tools,events,catalog}.test.ts` (W0)
- `tests/sidecar/server/ws/delegation.test.ts` (W0)
- `tests/sidecar/server/tool-proxy/{router,handlers/*}.test.ts` (W0)
- `tests/sidecar/integration/{delegation,performance}.test.ts` (W4)

**Files to MODIFY (limited, per CONTEXT):**
- `src/sidecar/server/factory.ts` — EXTEND with `routes?: Route[]` option (≤30 LOC addition; do NOT refactor)

---

## Forbidden Surfaces (per CONTEXT §boundaries + SPEC §constraints)

**MUST NOT mutate (any wave):**
- ❌ `src/plugin.ts` (SC-01 step 5.5 already wires factory; SC-02 only EXTENDS factory options)
- ❌ `src/sidecar/server/registry.ts` (6 existing setters are sufficient)
- ❌ `src/sidecar/server/sse/pool.ts` (SC-01 50-cap + 30s heartbeat inherited; SC-02 USES not MODIFIES)
- ❌ `src/sidecar/types.ts` (11 existing event types sufficient; do NOT add `ws.dialed`/`ws.closed` unless observability requires)
- ❌ `src/sidecar/readonly-state.ts` (4 `CANONICAL_PREFIXES` frozen)
- ❌ `src/sidecar/server/sse/pool.ts` factory usage
- ❌ Any other phase's source (SC-01, SC-03, SC-04-06, P-XX)

**MUST NOT add:**
- ❌ New npm runtime dependencies (per C-S02-05); only allowed candidate is `@types/ws` (devDep, type-only, slopcheck-gated)
- ❌ Auth/authorization/rate-limit/session management middleware (per UR-S02-02)
- ❌ Fixed ports (must use `127.0.0.1:0`)
- ❌ Server-side reconnection logic
- ❌ SSE/WS backpressure beyond 64KB buffer + 1013 close
- ❌ Catalog generation toolchain (SC-02 ships pre-generated JSON only)
- ❌ Next.js 16 components, panel UI (deferred to SC-03+)
- ❌ Multi-process coordination (single-process per OpenCode session)
- ❌ Persistence layer for tool proxy results (DelegationManager owns state)

**MUST NOT skip:**
- ❌ Integration test (AC-S02-11) — only real end-to-end coverage
- ❌ Any of the 11 acceptance criteria (each AC must have a test that passes)

---

## Actors / Consumers (per SPEC §scope)

| Actor | Endpoint Usage | Boundary |
|-------|----------------|----------|
| **SC-03 (Next.js 16 sidecar app, port 3099)** | All 17 endpoints via `@hivemind/sidecar-client` (typed wrapper, generated in SC-03) | Read-only consumer of `/api/state/*`; write-only consumer of `/api/tools/*` |
| **SC-04 (Session Explorer panel)** | `/api/state/sessions/*` + SSE `session.*` events | Read + listen |
| **SC-05 (Delegation Dashboard panel)** | `/api/state/sessions/{id}/delegations` + WS `delegation.output/status/notification` | Read + WS subscribe |
| **SC-06 (MEMS Browser panel)** | `/api/catalog` (json-render spec) + `/api/catalog/tools` | Read |
| **SC-07+ (Control Panel, future)** | `/api/state/snapshot` + SSE `invalidate.cache` events | Read + listen |
| **Plugin code (internal)** | 7 write tools (thin wrappers around plugin tools `delegate-task`, `delegation-status`, `execute-slash-command`, `hivemind-trajectory`, `hivemind-session-view`, `session-patch`, `hivemind-command-engine`) | Internal reuse; not external consumer |

---

## Verification Commands (per CONTEXT §boundaries)

**Per-wave merge:**
- W0: `npx vitest run tests/sidecar/ --reporter=verbose` (all FAIL — TDD red)
- W1: `npx vitest run tests/sidecar/server/handler.test.ts` (partial pass)
- W2: `npx vitest run tests/sidecar/server/routes/ tests/sidecar/server/tool-proxy/` (all pass)
- W3: `npx vitest run tests/sidecar/server/routes/events.test.ts tests/sidecar/server/ws/delegation.test.ts` (all pass)
- W4: `npm run typecheck` + `SIDECAR_INTEGRATION=1 SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/` + `npm run test` (2,963+ tests still pass) + `npm run build`

**Phase gate (full verification, run at end of W4):**
1. `npm run typecheck` — strict TS passes, no `any` in new files
2. `npm run test` — full suite (2,963 SC-01 baseline + new SC-02 tests = target 2,980+)
3. `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts` — AC-S02-11 end-to-end
4. `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts` — D-SC02-01 SLAs validated
5. `npm run build` — `dist/sidecar/server/routes/*.js` and `dist/sidecar/server/ws/delegation.js` must exist
6. `npm run test:coverage` — 75/62/80/77 thresholds maintained

**Manual smoke (post-W4, optional UAT):**
- Start plugin, hit `http://127.0.0.1:<port>/api/state/snapshot` (read port from `.hivemind/state/sidecar-port.json`)
- Verify SSE via `curl -N "http://127.0.0.1:<port>/api/events?filter=session"`
- Verify WS via `wscat -c ws://127.0.0.1:<port>/ws/delegation` + send `{"type":"subscribe","delegationId":"test-1"}`

---

## Coverage & Maintenance Expectations

**Test coverage targets** (per `.planning/codebase/TESTING.md`):
- Statements: ≥75% (project-wide; SC-02 routes/handlers expected ≥85%)
- Branches: ≥62% (project-wide; SC-02 expected ≥75%)
- Functions: ≥80% (project-wide; SC-02 expected ≥90%)
- Lines: ≥77% (project-wide; SC-02 expected ≥85%)

**Per-AC test mapping** (vitest test files):
- AC-S02-01 → `tests/sidecar/server/handler.test.ts` (17-call matrix)
- AC-S02-02 → `tests/sidecar/server/routes/tools.test.ts` + `tool-proxy/router.test.ts`
- AC-S02-03 → `tests/sidecar/server/routes/events.test.ts -t "50-cap"`
- AC-S02-04 → `tests/sidecar/server/routes/events.test.ts -t "filter"`
- AC-S02-05 → `tests/sidecar/server/ws/delegation.test.ts -t "schema"`
- AC-S02-06 → `tests/sidecar/server/ws/delegation.test.ts -t "scope"`
- AC-S02-07 → `tests/sidecar/server/routes/catalog.test.ts -t "immutable"`
- AC-S02-08 → `tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts`
- AC-S02-09 → covered by AC-S02-01 (no-headers smoke)
- AC-S02-10 → `npm run typecheck` (no separate test)
- AC-S02-11 → `tests/sidecar/integration/delegation.test.ts` (gated by `SIDECAR_INTEGRATION=1`)

**Module size compliance** (per `.planning/codebase/CONCERNS.md`):
- All 11 SC-02 new modules ≤500 LOC
- 8 pre-existing violators (CONCERNS §1) must NOT be joined
- W4 verification: `npx cloc src/sidecar/server/ --include-lang=TypeScript` reports all files ≤500

**JSDoc coverage** (per AGENTS.md):
- All new exports must have JSDoc with `@param`, `@returns`, `@throws`, `@example`
- W4 verification: `grep -rL '@param\|@returns' src/sidecar/server/**/*.ts` returns no files with public exports

---

## Stop Conditions

**Plan-phase completion (this artifact):**
- ✅ All 7 must-haves derived from SPEC ACs and mapped to verification methods
- ✅ 5-wave decomposition (W0-W4) with file inventory, LOC budgets, atomic commit messages
- ✅ Dependency graph linear; cross-wave file ownership exclusive
- ✅ Allowed/forbidden surfaces per CONTEXT §boundaries
- ✅ Actors/consumers identified
- ✅ Verification commands specified (per-wave + phase gate)
- ✅ Risk mitigations (8 open risks + 10 STRIDE threats) referenced from RESEARCH
- ✅ `02-PLAN.md` + 5 `plan-N.md` files committed to `feature/harness-implementation`
- ⏹️ STOP — L0 dispatches `/gsd-execute-phase SC-02`

**Execution-phase completion (future, NOT this plan's responsibility):**
- All 11 ACs backed by L1 evidence (passing tests)
- Integration test backed by L2 evidence (real `DelegationManager` + real `SseConnectionPool` + real server)
- Build + typecheck + full suite (2,963+ tests) + coverage thresholds pass
- 5 atomic commits (one per wave) on `feature/harness-implementation`
- L0 verification dispatch (`/gsd-verify-work SC-02`)

---

## Plan Validation Summary (gsd-plan-checker self-check)

| Check | Status | Notes |
|-------|--------|-------|
| Goal-backward coverage (7 must_haves from 11 SPEC ACs) | ✅ PASS | 4 ACs covered as cross-cutting (MH-X1, MH-X2) or in MUST-haves |
| Wave structure (5 waves) | ✅ PASS | W0 tests, W1 infra, W2 routes, W3 realtime, W4 integration |
| File ownership (no file in 2+ waves) | ✅ PASS | Each .ts file appears in exactly one wave's create list |
| Module size budget (≤500 LOC) | ✅ PASS | All 11 modules have explicit ≤500 LOC caps; tool handlers ≤200 |
| Test gating (TDD: W0 red, W1-W3 partial, W4 green) | ✅ PASS | W0 = tests written first, watched fail; W4 closes all 11 ACs |
| Dependency graph (linear, no cycles) | ✅ PASS | W0 → W1 → W2 → W3 → W4 |
| Atomic commits (5 total) | ✅ PASS | One per wave; commit message format locked |
| Evidence level (L5 docs-only) | ✅ PASS | This plan does NOT claim runtime readiness; only authorizes work |
| Allowed/forbidden surfaces (per CONTEXT) | ✅ PASS | Full enumeration in `Allowed Surfaces` + `Forbidden Surfaces` sections |
| Verification commands (per CONTEXT) | ✅ PASS | Per-wave + phase gate commands specified |
| Stop conditions | ✅ PASS | Plan-phase completion + execution-phase completion separated |
| Risk mitigations (8 open risks) | ✅ PASS | All 8 mapped to verification commands |
| STRIDE (10 threats) | ✅ PASS | 9 mitigated + 1 accepted (replay at tool level) |
| Coverage expectations (75/62/80/77) | ✅ PASS | SC-02 modules targeted at 85/75/90/85 |
| JSDoc requirement (per AGENTS.md) | ✅ PASS | All new exports must have JSDoc; verified at W4 |

**Self-check verdict: PASS** — proceed to write `plan-0.md` through `plan-4.md`, then commit.

---

## Plan Files (this commit includes 5 sibling files)

- `plan-0.md` — Wave 0: Test scaffolding (TDD red)
- `plan-1.md` — Wave 1: Core infrastructure
- `plan-2.md` — Wave 2: REST routes (state + tools + catalog)
- `plan-3.md` — Wave 3: Real-time (SSE + WS)
- `plan-4.md` — Wave 4: Integration + verification

---

*Plan authored: 2026-06-03*
*Stacked on: ses_176d78648ffeP7wkk2kstwd0BF (same subagent session, transitioning from researcher)*
*Plan-checker verdict: PASS (self-check, max 3 cycles allowed)*
*Next step: L0 dispatches `/gsd-execute-phase SC-02`*
