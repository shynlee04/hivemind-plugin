---
phase: SC-02
plan: 02
subsystem: sidecar
tags:
  - sidecar
  - rest-api
  - tool-proxy
  - sse
  - websocket
  - catalog
  - stub-debt
  - retroactive
dependency_graph:
  requires:
    - SC-01 (Foundation — Plugin HTTP Server + State Bridge)
  provides:
    - 4 read-side GET state endpoints (snapshot, sessions, children, context, delegations, docs)
    - 7 write-side POST tool proxy endpoints (delegate-task, delegation-status, execute-slash-command, hivemind-trajectory, hivemind-session-view, session-patch, hivemind-command-engine)
    - SSE event bus on GET /api/events?filter=...
    - WebSocket delegation channel on WS /ws/delegation
    - json-render catalog endpoints (/api/catalog, /api/catalog/tools)
  blocks:
    - SC-04 (Session Explorer — depends on hivemind-session-view)
    - SC-05 (Delegation Dashboard — depends on delegation-status)
    - SC-06 (Control Panel — depends on execute-slash-command + command-engine)
tech-stack:
  added: []
  patterns:
    - "ToolResponse<T> envelope for all tool proxy results (ok | error.code+message)"
    - "Bounded sidecar: 127.0.0.1:0 (loopback, no auth, no rate-limit, defer to OpenCode runtime)"
    - "SidecarDependencyRegistry lazy binding (typed getter/setter, [Harness] guards)"
    - "Ad-hoc code co-located with SC-03: no formal DISCUSS → PLAN → EXECUTE cycle ever completed"
key-files:
  created:
    - src/sidecar/server/routes/catalog.ts
    - src/sidecar/server/routes/events.ts
    - src/sidecar/server/routes/sessions.ts
    - src/sidecar/server/routes/state.ts
    - src/sidecar/server/routes/tools.ts
    - src/sidecar/server/routes/types.ts
    - src/sidecar/server/tool-proxy/router.ts
    - src/sidecar/server/tool-proxy/handlers/delegate-task.ts
    - src/sidecar/server/tool-proxy/handlers/delegation-status.ts
    - src/sidecar/server/tool-proxy/handlers/execute-slash-command.ts
    - src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts
    - src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts
    - src/sidecar/server/tool-proxy/handlers/session-patch.ts
    - src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.ts
    - src/sidecar/server/ws/pool.ts
    - src/sidecar/server/ws/delegation.ts
    - src/sidecar/server/ws/types.d.ts
    - src/sidecar/catalog/tool-catalog.ts
    - src/sidecar/catalog/json-render-catalog.ts
    - tests/sidecar/server/tool-proxy/router.test.ts
    - tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts
    - tests/sidecar/server/tool-proxy/handlers/delegate-task.test.ts
    - tests/sidecar/server/tool-proxy/handlers/hivemind-trajectory.test.ts
    - tests/sidecar/server/tool-proxy/handlers/hivemind-session-view.test.ts
    - tests/sidecar/server/tool-proxy/handlers/execute-slash-command.test.ts
    - tests/sidecar/server/tool-proxy/handlers/delegation-status.test.ts
    - tests/sidecar/server/tool-proxy/handlers/hivemind-command-engine.test.ts
    - tests/sidecar/server/routes/sessions.test.ts
    - tests/sidecar/server/routes/state.test.ts
    - tests/sidecar/server/routes/events.test.ts
    - tests/sidecar/server/routes/catalog.test.ts
    - tests/sidecar/server/routes/tools.test.ts
    - tests/sidecar/server/ws/delegation.test.ts
  modified: []
decisions:
  - id: D-SC02-01
    decision: "Bounded sidecar: 127.0.0.1:0 (loopback only), no auth, no rate-limit, defer to OpenCode runtime"
    rationale: "Duplicating auth/rate-limit/middleware in sidecar would create drift and contradict OpenCode's architecture"
  - id: D-SC02-02
    decision: "No request logging/middleware in sidecar"
    rationale: "OpenCode runtime owns all cross-cutting concerns"
  - id: D-SC02-03
    decision: "ToolResponse<T> envelope mirrors OpenCode SDK response shape"
    rationale: "Faithful projection of OpenCode's existing contract"
  - id: D-SC02-04
    decision: "Reuse SidecarDependencyRegistry from SC-01 — no new singletons"
    rationale: "Avoid drift, preserve lazy binding contract"
  - id: D-SC02-05
    decision: "json-render catalog is pre-generated and immutable"
    rationale: "Generation toolchain is out of scope for SC-02"
  - id: D-SC02-06
    decision: "SSE pool: 30s heartbeat, 50-connection cap (inherited from SC-01)"
    rationale: "Inherited from SC-01 SseConnectionPool"
  - id: D-SC02-07
    decision: "WS handler exists but is untested (legacy from SC-01 + ad-hoc)"
    rationale: "State machine transitions for WS delegation channel were never implemented"
  - id: D-SC02-08
    decision: "Tool proxy routes use `(registry as any).X` casts in 3 files (Wave 3 to fix)"
    rationale: "Bypasses SidecarDependencyRegistry type safety; tracked as GAP-07"
  - id: D-SC02-09
    decision: "Code was written ad-hoc alongside SC-03, no formal DISCUSS → PLAN → EXECUTE cycle"
    rationale: "Phase never transitioned from SPEC to execution; this retroactive SUMMARY is the closest formal closure"
  - id: D-SC02-10
    decision: "5 of 7 tool handlers are stubs (GAP-02..05, GAP-01 fixed in Wave 1)"
    rationale: "Return fake/empty data; cross-cluster connectivity to C2/C3/C5 is broken; blocked for SC-04/05/06"
metrics:
  status: PARTIAL
  duration: unknown (ad-hoc alongside SC-03)
  completed: "2026-06-06 (retroactive)"
  completion_date: "2026-06-06"
  planning_files:
    - "02-SPEC.md (locked, 341 lines, ambiguity score 0.075)"
    - "02-PLAN.md (formal plan, never executed)"
    - "02-CONTEXT.md (context document)"
    - "02-RESEARCH.md (research notes, 73KB)"
    - "plan-0.md through plan-4.md (5 sub-plans, never executed)"
---

# Phase SC-02: REST API + Tool Proxy — Retroactive Summary

> **Status: PARTIAL** — 5 of 7 tool handlers return fake/empty data. 1 of 7 (hivemind-session-view) was fixed in Wave 1 of `sidecar-completeness-2026-06-06`. The remaining 4 stub handlers are P1 debt tracked in Wave 2.

> **Source:** Retroactive completion documentation authored 2026-06-06 during the C7 deep inventory (`.planning/phases/AUDIT-03-deep-inventories/03-C7-INVENTORY-ASSET.md` §2.2 + §7.7). The code in `src/sidecar/server/{routes,tool-proxy,sse,ws,catalog}/` was written ad-hoc alongside SC-03 — never via a formal DISCUSS → PLAN → EXECUTE cycle.

---

## Why this SUMMARY is retroactive

SC-02's SPEC was locked on 2026-06-02 (ambiguity score 0.075 — high-quality spec). The accompanying 5 sub-plans (`plan-0.md` through `plan-4.md`) were written but **never executed**. The code that exists in `src/sidecar/server/` was written ad-hoc while building SC-03, without formal phase governance or any testing.

The C7 inventory audit (2026-06-06) catalogued the actual state of the code (12 gaps, 5 conflicts, 9 tech-debt items) and identified that no SC-02-SUMMARY existed. This document is the retroactive closure — it documents what was actually built alongside SC-03, what was promised in the SPEC, and what remains as P1 debt to be addressed in subsequent waves of `sidecar-completeness-2026-06-06`.

---

## What was promised in 02-SPEC.md

The SC-02 SPEC (341 lines, ambiguity 0.075) committed to delivering:

| # | Capability | Endpoint(s) | SPEC Status |
|---|-----------|-------------|-------------|
| 1 | Read-side state endpoints (4) | 4 GET routes (snapshot, sessions, docs, catalog) | ⚠️ PARTIAL — routes exist, some handlers use `(registry as any)` |
| 2 | Write-side tool proxy (7) | 7 POST `/api/tools/{name}` endpoints | ❌ 5 of 7 handlers are stubs (see §1 below) |
| 3 | SSE event bus | `GET /api/events?filter=...` | ✅ Route exists, SSE pool wired |
| 4 | WebSocket delegation channel | `WS /ws/delegation` | ⚠️ `ws/pool.ts` + `delegation.ts` exist but untested |
| 5 | Catalog endpoints | `GET /api/catalog` + `GET /api/catalog/tools` | ✅ Route exists, catalog files exist |

The 7 tool proxy endpoints in scope per SPEC §81-90 (item #11):
1. `delegate-task`
2. `delegation-status`
3. `execute-slash-command`
4. `hivemind-trajectory`
5. `hivemind-session-view`
6. `session-patch`
7. `hivemind-command-engine`

---

## What was actually built

### Code surface delivered (~2,450 LOC across 27 files)

**Route files (6 files, 388 LOC):**
- `src/sidecar/server/routes/catalog.ts`
- `src/sidecar/server/routes/events.ts`
- `src/sidecar/server/routes/sessions.ts`
- `src/sidecar/server/routes/state.ts`
- `src/sidecar/server/routes/tools.ts`
- `src/sidecar/server/routes/types.ts`

**Tool proxy (8 files, 380 LOC):**
- `src/sidecar/server/tool-proxy/router.ts` (dispatcher)
- `src/sidecar/server/tool-proxy/handlers/delegate-task.ts`
- `src/sidecar/server/tool-proxy/handlers/delegation-status.ts`
- `src/sidecar/server/tool-proxy/handlers/execute-slash-command.ts`
- `src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts`
- `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts`
- `src/sidecar/server/tool-proxy/handlers/session-patch.ts`
- `src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.ts`

**SSE pool (1 file, ~80 LOC):** `src/sidecar/server/sse/pool.ts`

**WebSocket (3 files, ~120 LOC):** `src/sidecar/server/ws/pool.ts`, `delegation.ts`, `types.d.ts`

**Catalog (2 files, ~40 LOC):** `src/sidecar/catalog/tool-catalog.ts`, `json-render-catalog.ts`

### Test surface delivered

Per C7 audit §7.11: "All 768 LOC of routes and tool-proxy code had **zero test coverage**" before `sidecar-flaws-fix-track`. Since then, test scaffold files exist for all 7 tool handlers + all 4 route files, but the actual coverage is largely **scaffold (test-after) coverage** — tests were written to assert existing (broken) behavior, not to drive fixes.

Notable: `tests/sidecar/server/handler.test.ts` provides a 17-endpoint smoke matrix, and `tests/sidecar/server/ws/delegation.test.ts` covers the WebSocket handler.

---

## What was NOT delivered (the P1 debt list)

### 1. Stub tool handlers (5 of 7 return fake/empty data)

| Handler | GAP | Status | Wave |
|---------|-----|--------|------|
| `hivemind-session-view.ts` | GAP-01 (CRITICAL) | ✅ **FIXED in Wave 1** | `ac33393e` |
| `delegation-status.ts` | GAP-02 (HIGH) | ❌ Returns `{ status: "running" }` always | Wave 2 |
| `execute-slash-command.ts` | GAP-03 (HIGH) | ❌ Returns `"Command X dispatched"` w/o execution | Wave 2 |
| `hivemind-trajectory.ts` | GAP-04 (HIGH) | ❌ Returns empty events on `inspect()` failure | Wave 2 |
| `hivemind-command-engine.ts` | GAP-05 (HIGH) | ❌ Always returns `{ routes: [] }` | Wave 2 |

The `delegate-task.ts` and `session-patch.ts` handlers are semi-functional — they call real dependencies (DelegationManager, canonical prefix validator) but may work only when those dependencies are bound.

### 2. `as any` type-safety bypass (GAP-07, MEDIUM)

Per C7 audit §4.2 — 5 occurrences across 4 files:
- `hivemind-session-view.ts:37` — **fixed in Wave 1** (uses typed `registry.sessionTracker` getter)
- `delegate-task.ts:43`
- `hivemind-trajectory.ts:48`
- `routes/state.ts:37`
- `routes/sessions.ts:29`

GAP-07 is **Wave 3** territory (requires registry extension + handler rewrites).

### 3. No integration test against a real plugin server

Per C7 audit §7.11 — the SC-03 Next.js tests cover the client side (plugin-client, state-store, use-sse) but never integration-test against a real plugin server. The 17-endpoint smoke matrix in `tests/sidecar/server/handler.test.ts` is a partial substitute but does not exercise the full DelegationManager / SessionTracker integration.

---

## Verification (L1 + L2 + L3 + L4 + L5)

### L1 — Smoke test (next dev)

For Wave 1, a sidecar `next dev` smoke test (HTTP 200 from root endpoint) was captured. See `.hivemind/planning/sidecar-completeness-2026-06-06/evidence/wave1-smoke-test.txt` for the curl output.

### L2 — Test output

For Wave 1's GAP-01 fix:
- Focused test: 6/6 pass (`tests/sidecar/server/tool-proxy/handlers/hivemind-session-view.test.ts`)
- Full sidecar suite: 158/158 pass (5 unrelated skips)
- See `.hivemind/planning/sidecar-completeness-2026-06-06/evidence/wave1-green-test-output.txt`

### L3 — File inspection (L3)

The GAP-01 fix is at `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts:40-50` (typed getter, capture, return) — file:line references:
- Line 40: `const sessionTracker = registry.sessionTracker` (typed getter — throws `[Harness]` if unbound)
- Line 51-54: `getMethod` extraction with localized cast
- Line 56-62: `getMethod` call + capture
- Line 63-70: NOT_FOUND envelope when session is missing
- Line 72: `return { ok: true as const, data: { session } }` (full session record)

### L4 — Typecheck

`npx tsc --noEmit` exits 0 (clean) for the GAP-01 fix.

### L5 — Documentation

This SC-02-SUMMARY.md is the retroactive L5 documentation. Combined with the existing `02-SPEC.md`, `02-CONTEXT.md`, `02-RESEARCH.md`, `02-PLAN.md`, and `plan-0.md` through `plan-4.md`, the SC-02 phase is now fully documented.

---

## Known Stubs

| Stub | File | Returned Value | Expected Value |
|------|------|----------------|----------------|
| delegation-status | `src/sidecar/server/tool-proxy/handlers/delegation-status.ts:42` | `{ status: "running" }` | Real DelegationManager.status() result |
| execute-slash-command | `src/sidecar/server/tool-proxy/handlers/execute-slash-command.ts:45` | `"Command X dispatched"` | Real command engine execution result |
| hivemind-trajectory | `src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts:60` | `{ events: [] }` on inspect failure | Real trajectory events array |
| hivemind-command-engine | `src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.ts:42` | `{ routes: [] }` | Real command list from CommandEngine |

All 4 are tracked as GAP-02..05 in `sidecar-completeness-2026-06-06/00-landscape.md`.

---

## Threat Flags

Per C7 audit §7.9: **No request logging, auth, or rate limiting** — by design per D-SC02-01..10. The sidecar is a bounded, faithful projection of OpenCode's existing contract. Security concerns are owned by the native OpenCode runtime.

If a future phase adds middleware to the sidecar, it must be a separate phase that explicitly authorizes breaking the D-SC02-01..10 boundary.

---

## Self-Check

- [x] All key-files listed in frontmatter exist
- [x] `02-SPEC.md` exists and is referenced
- [x] `02-CONTEXT.md` exists and is referenced
- [x] `02-RESEARCH.md` exists and is referenced
- [x] `02-PLAN.md` exists and is referenced
- [x] `plan-0.md` through `plan-4.md` exist
- [x] GAP-01 fix committed (commit `ac33393e` referenced)
- [x] GAP-02..05 documented as P1 debt
- [x] GAP-07 documented as Wave 3 work
- [x] All 4 stub handlers identified in Known Stubs section
- [x] Status: PARTIAL with explicit debt list

## Success Criteria

- [x] SC-02-SUMMARY.md exists at the canonical path
- [x] Documents what was actually built (per C7 audit §2.2)
- [x] Acknowledges 5 stub handlers as known P1 debt
- [x] References the gap tracking (Wave 1..5) in `sidecar-completeness-2026-06-06/`
- [x] SC-02 → SC-04/05/06 dependency is now visible (with explicit blocker on stub handlers)
- [x] SC-01 → SC-02 dependency is documented
- [x] All D-SC02-01..10 decisions captured
- [x] No runtime readiness claims — this is a docs-only L5 artifact
