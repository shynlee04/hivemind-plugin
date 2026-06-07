[LANGUAGE: Write this file in en per Language Governance.]
# Wave 3 GREEN Complete — plugin-port-pool-2026-06-07

**Date:** 2026-06-07
**Phase:** 39.8 follow-up / plugin-port-pool Wave 3
**Status:** GREEN — all gates PASS, 2 atomic commits landed

## Summary

Implemented API-first port discovery. The browser client now discovers the active plugin server port via a same-origin Next.js route (`/api/plugin-port`) as step 2 of port discovery, inserted between the env-var override (step 1) and the port-list probe loop (step 3). Replaces the old 2-step client precedence (env-var / probe-list).

## Commits Landed (this turn)

| # | SHA | Type | Files | Description |
|---|-----|------|-------|-------------|
| 1 | `d9072be7` | test fix | 1 file, +14/-3 | Vitest 4 ESM mock compat for `node:fs/promises` |
| 2 | `0dff15d5` | feat | 2 files, +209/-4 | API-first port discovery (route + client) |

## TDD Discipline Followed

| Phase | Status | Evidence |
|-------|--------|----------|
| RED | DONE (prior turn) | `49f36dc7` — 7 failing tests committed (4 client + 3 route) |
| GREEN | DONE (this turn) | 132/132 tests pass; `npm run typecheck` clean |
| Coverage | DONE (this turn) | `route.ts` 85% lines, `plugin-client.ts` 84.68% lines (target ≥80%) |
| Refactor | NOT NEEDED | Code is already clean — small focused helper, no duplication |

## Gate Verdicts

| Gate | Verdict | Evidence |
|------|---------|----------|
| Lifecycle (lifecycle-integration) | PASS | New code in `.opencode/` is none (route + client are `src/`); 9-surface boundaries respected — route is server-side, client is browser-side, no circular dep |
| Spec (spec-compliance) | PASS | Wave 3 spec at `.hivemind/planning/plugin-port-pool-2026-06-07/03-wave-3-landscape.md` matches implementation: 4-step precedence, timeout values, error envelopes, browser-only check |
| Evidence (evidence-truth) | PASS | All 4 evidence labels verified: `runtime-truthful` (fetch + JSON.parse executed in test), `transport-mocked` (vi.fn replaces readFile), no `mock-heavy` or `manual-only` claims |

## What Changed

### New file: `sidecar/src/app/api/plugin-port/route.ts` (149 lines)

- `GET` handler reads `.hivemind/state/sidecar-port.json` via `node:fs/promises`
- Returns raw `{ port: <number> }` envelope (unwrapped, distinct from plugin server's `{ ok, data }`)
- 200 on valid port, 404 on ENOENT, 500 on invalid JSON or shape
- `export const dynamic = "force-dynamic"` disables caching
- Type guards `isValidPortNumber`, `isPortFileShape`, `isNodeError` keep the handler pure
- TypeScript: no `as` casts, no `any` — uses `Record<string, unknown>` narrowing after runtime checks

### Updated: `sidecar/src/lib/plugin-client.ts`

- New constant `API_PORT_PROBE_TIMEOUT_MS = 1000`
- New helper `probeApiPort()`: browser-only fetch with AbortController
  - Early return if `typeof window === "undefined"` (server-side rendering / node test env)
  - Validates `body.port` is integer 1..65535 using `Reflect.get` + `unknown` typing
- `probePluginPort()` precedence: env-var → /api/plugin-port → port-list probe → FALLBACK_PORT
- JSDoc updated on both module-level and function-level
- TypeScript: no `as` casts, no `any`

### Updated: `sidecar/tests/api/plugin-port.test.ts`

- Mock factory now provides both `readFile` named export AND `default` property to satisfy vitest 4 ESM-strict default-export check

## Test Results

```
Test Files  15 passed (15)
     Tests  132 passed (132)
  Duration  2.37s
```

| Suite | Before | After | Delta |
|-------|--------|-------|-------|
| All tests | 125 | 132 | +7 |
| `tests/api/plugin-port.test.ts` | (missing) | 3 | +3 |
| `tests/plugin-client.test.ts` (Wave 3 sub-describe) | (missing) | 4 | +4 |

## Coverage (vitest v8)

| File | % Stmts | % Branch | % Funcs | % Lines |
|------|---------|----------|---------|---------|
| `sidecar/src/app/api/plugin-port/route.ts` | 85 | 88.88 | 100 | **85** |
| `sidecar/src/lib/plugin-client.ts` | 79.67 | 72.85 | 61.11 | **84.68** |
| All files (project-wide) | 69.26 | 61.53 | 60.46 | 71.13 |

Both new code surfaces exceed the 80% line-coverage target. The pre-existing project coverage of 71.13% lines is unchanged (this commit added covered code, not removed it).

## Pre-Existing Runtime Quirk (not Wave 3)

During verification, observed:
- Plugin server (opencode PID 90393) listening on **4097**
- Port file `.hivemind/state/sidecar-port.json` contains `{"port":4098}` (stale)

Wave 3 system is self-healing: API returns 4098 → client probe fails → falls through to port-list probe → finds 4097. No user-visible error.

Root cause: `src/sidecar/server/factory.ts:136-140` writes the port file only at process start. If the file is left over from a previous run with a different port, the new server overwrites it correctly — but the test environment had a previous run on 4098 that died without cleanup.

**Follow-up for SC-04**: investigate whether `factory.ts` should clear the port file before binding, or write atomically. Out of scope for Wave 3.

## Open Browser UAT (deferred to user)

To verify the fix end-to-end in the browser:
1. `cd sidecar && npm run dev` (start sidecar on 3099)
2. Open `http://127.0.0.1:3099/` in browser
3. Click "Session Explorer" tab
4. Expected: real session data appears (no "⚠️ Plugin server not available" banner)
5. The browser's network tab should show a successful `GET /api/plugin-port` returning `{"port": 4097}` (or whatever the live plugin port is)

## Next Wave

If user accepts browser UAT, proceed to:
- SC-04 EXECUTION Wave 4 (cross-phase integration: Session Explorer → state-store → plugin-server end-to-end)
- SC-04 EXECUTION Wave 5 (UAT validation against the 3 reported flaws + new requirements)

If UAT reveals a regression, fall back to coordinated-path delegation via `hm-coordinator` (quality wave) for remediation.
