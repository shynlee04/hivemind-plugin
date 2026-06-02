# plan-4.md — Wave 4: Integration + Verification (Closes 11 ACs)

**Phase:** SC-02 — REST API + Tool Proxy
**Wave:** 4 of 5
**Type:** Integration + verification (no new src files)
**Depends on:** W1 + W2 + W3 (full HTTP/SSE/WS surface works)
**Blocks:** nothing (final wave)

---

## Objective

Close the **end-to-end delegation integration test** (AC-S02-11) and the **3 performance baseline tests** (D-SC02-01 SLAs). Run all phase gate verification commands (typecheck, full suite, build, coverage). After W4, **all 11 acceptance criteria are backed by L1-L3 evidence** and SC-02 is ready for `/gsd-verify-work SC-02` dispatch by L0.

---

## Allowed Surfaces (W4 only — test files + verification)

- ✅ CREATE: `tests/sidecar/integration/delegation.test.ts` (≤400 LOC) — AC-S02-11 end-to-end
- ✅ CREATE: `tests/sidecar/integration/performance.test.ts` (≤300 LOC) — D-SC02-01 SLAs
- ✅ RUN: `npm run typecheck` (verification, no file changes)
- ✅ RUN: `npm run test` (full suite, no file changes)
- ✅ RUN: `npm run test:coverage` (coverage check, no file changes)
- ✅ RUN: `npm run build` (build verification, no file changes)
- ✅ RUN: `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts`
- ✅ RUN: `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts`

---

## Forbidden Surfaces (W4)

- ❌ NO new src files (W4 is verification only; all SC-02 source already exists from W1-W3)
- ❌ NO modification to any `src/sidecar/**` file (W1-W3 outputs frozen for verification)
- ❌ NO modification to SC-01 outputs
- ❌ NO modification to `package.json` (no new deps)
- ❌ NO modification to `tsconfig.json`, `vitest.config.ts`, `.gitignore`

---

## Tasks (3 tasks)

### Task 1: Integration test (AC-S02-11 end-to-end delegation)

**Files:** `tests/sidecar/integration/delegation.test.ts`

**Action:**

1. Create `tests/sidecar/integration/delegation.test.ts`:
   - **Gating:** `describe.skipIf(!process.env.SIDECAR_INTEGRATION)("SC-02 integration: delegation flow", () => { ... })`
   - **Setup:** Real `DelegationManager` (with mock `OpenCodeClient`), real `SseConnectionPool`, real `WsConnectionPool`, real `SidecarDependencyRegistry`, real `SidecarRouter` constructed from all 17 routes
   - **Server:** Start a real HTTP server on `127.0.0.1:0` using the SC-01 factory + W3 WS upgrade wiring
   - **Steps:**
     1. **HTTP POST** to `/api/tools/delegate-task` with `{agent: "test-agent", prompt: "echo hello"}` → expect 200 + `ToolResponse<{delegationId: string}>.ok === true` + `meta.duration > 0`
     2. **WS CONNECT** to `ws://127.0.0.1:<port>/ws/delegation` → expect upgrade success (101)
     3. **WS SEND** `{"type":"subscribe","delegationId":"<from-step-1>"}` → expect no immediate response
     4. **TRIGGER** a delegation event via `DelegationManager.dispatch()` (returns a real delegation)
     5. **WS RECEIVE** a `delegation.output` or `delegation.status` message within 5s → expect payload matches delegation
     6. **WS SEND** `{"type":"unsubscribe","delegationId":"<from-step-1>"}` → expect no more events for that delegationId
     7. **CLEANUP:** close WS, close HTTP server, stop pools
   - **Assertions:** all 7 steps pass; WS messages match Zod schema from `routes/types.ts`
   - JSDoc on describe block explaining AC-S02-11 closure

2. Verify: Without `SIDECAR_INTEGRATION=1` env var, test is SKIPPED (no failure). With env var set, test PASSES.

**Verify:** `SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts` — 1 test passes (the end-to-end delegation). Without env var, test is skipped (not failed).

**Done:** AC-S02-11 has L2 evidence (real `DelegationManager` + real server + real WS, end-to-end flow works).

---

### Task 2: Performance baselines (D-SC02-01 SLAs)

**Files:** `tests/sidecar/integration/performance.test.ts`

**Action:**

1. Create `tests/sidecar/integration/performance.test.ts`:
   - **Gating:** `describe.skipIf(!process.env.SIDECAR_PERF)("SC-02 performance: D-SC02-01 SLAs", () => { ... })`
   - **Setup:** Real server on `127.0.0.1:0`, mock registry, real cache + routes
   - **3 perf test cases:**
     1. **Read endpoints, no load, p95 < 50ms:** 100 sequential `GET /api/state/snapshot` requests; assert p95 < 50ms
     2. **Read endpoints, 10 concurrent clients, p95 < 100ms:** 100 requests distributed across 10 concurrent clients; assert p95 < 100ms
     3. **Read endpoints, 50 SSE clients broadcasting 10 events/s, p95 < 250ms:** 50 SSE subscribers + 50 concurrent `GET /api/state/snapshot`; broadcast 500 events/s from a `DelegationManager` mock; assert snapshot p95 < 250ms
   - Each test reports `{p50, p95, p99, max}` in test output for baseline capture
   - JSDoc explaining SLA rationale and CI vs release-branch behavior

2. Verify: Without `SIDECAR_PERF=1`, tests are SKIPPED. With env var, tests pass on local dev (release-branch only).

**Verify:** `SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts` — 3 tests pass; perf metrics reported.

**Done:** D-SC02-01 SLAs validated with L2 evidence (real timing measurements); 3 perf baselines captured for future regression detection.

---

### Task 3: Phase gate (typecheck + full suite + build + coverage)

**Files:** no files created; only verification commands run

**Action:**

Run all phase gate verification commands in sequence:

1. **Type check** (AC-S02-10):
   ```bash
   npm run typecheck
   ```
   - Expect: 0 errors
   - Verify: `grep -r "any" src/sidecar/server/routes/**.ts` (should be empty, except for explicit `unknown` types in zod inference)

2. **Full test suite** (preserves SC-01 baseline + adds SC-02 tests):
   ```bash
   npm run test
   ```
   - Expect: 2,963+ tests pass (SC-01 baseline 2,963 + new SC-02 tests ~80+ = 3,043+ target)
   - Verify: 0 failures, 0 errors

3. **Integration test gated** (AC-S02-11):
   ```bash
   SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts
   ```
   - Expect: 1 test passes

4. **Performance test gated** (D-SC02-01):
   ```bash
   SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts
   ```
   - Expect: 3 tests pass

5. **Build** (verification):
   ```bash
   npm run build
   ```
   - Expect: 0 errors; new dist files exist:
     - `dist/sidecar/server/routes/state.js`
     - `dist/sidecar/server/routes/sessions.js`
     - `dist/sidecar/server/routes/tools.js`
     - `dist/sidecar/server/routes/events.js`
     - `dist/sidecar/server/routes/catalog.js`
     - `dist/sidecar/server/ws/delegation.js`
     - `dist/sidecar/server/ws/pool.js`
     - `dist/sidecar/server/handler.js`
     - `dist/sidecar/server/cache.js`
     - `dist/sidecar/server/tool-proxy/router.js`
     - `dist/sidecar/server/tool-proxy/handlers/*.js` (7 files)
     - `dist/sidecar/catalog/{json-render-catalog,tool-catalog}.js`

6. **Coverage** (per TESTING.md thresholds):
   ```bash
   npm run test:coverage
   ```
   - Expect: statements ≥75%, branches ≥62%, functions ≥80%, lines ≥77%
   - SC-02 modules expected to exceed: ≥85% statements, ≥75% branches, ≥90% functions, ≥85% lines

7. **Module size compliance** (CONCERNS §1):
   ```bash
   npx cloc src/sidecar/server/ src/sidecar/catalog/ --include-lang=TypeScript --quiet
   ```
   - Expect: every file ≤500 LOC

8. **JSDoc coverage** (AGENTS.md):
   ```bash
   grep -rL "@param\|@returns" src/sidecar/server/handler.ts src/sidecar/server/cache.ts src/sidecar/server/routes/*.ts src/sidecar/server/ws/*.ts src/sidecar/server/tool-proxy/router.ts src/sidecar/server/tool-proxy/handlers/*.ts
   ```
   - Expect: empty output (all public exports have JSDoc)

**Done:** All phase gate commands pass; L1-L3 evidence captured for all 11 ACs.

---

## Verification (per-wave merge gate for W4 — the FINAL gate)

```bash
# Primary: typecheck
npm run typecheck
# Expected: 0 errors

# Secondary: full test suite (SC-01 baseline + SC-02 tests)
npm run test 2>&1 | tail -10
# Expected: "Test Files  X passed (X)" + "Tests  3043+ passed (3043+)"

# Tertiary: integration test
SIDECAR_INTEGRATION=1 npx vitest run tests/sidecar/integration/delegation.test.ts 2>&1 | tail -10
# Expected: 1 test passed

# Quaternary: performance test
SIDECAR_PERF=1 npx vitest run tests/sidecar/integration/performance.test.ts 2>&1 | tail -10
# Expected: 3 tests passed

# Quinary: build
npm run build 2>&1 | tail -10
# Expected: 0 errors; dist files exist

# Senary: coverage
npm run test:coverage 2>&1 | tail -20
# Expected: 75/62/80/77 thresholds met (SC-02 modules exceed)

# Septenary: module size
npx cloc src/sidecar/server/ src/sidecar/catalog/ --include-lang=TypeScript --quiet
# Expected: every file ≤500 LOC

# Octonary: JSDoc
grep -rL "@param\|@returns" src/sidecar/server/handler.ts src/sidecar/server/cache.ts src/sidecar/server/routes/*.ts src/sidecar/server/ws/*.ts src/sidecar/server/tool-proxy/router.ts src/sidecar/server/tool-proxy/handlers/*.ts
# Expected: empty output
```

---

## Atomic Commit (W4)

**Commit message:**
```
phase(SC-02): W4 — integration + perf + typecheck + full suite; 11 ACs evidence-gated L1-L3

- tests/sidecar/integration/delegation.test.ts (NEW, ≤400 LOC): AC-S02-11 end-to-end delegation via real DelegationManager + real server + real WS; gated by SIDECAR_INTEGRATION=1
- tests/sidecar/integration/performance.test.ts (NEW, ≤300 LOC): 3 perf tests validating D-SC02-01 SLAs (50/100/250/500ms p95); gated by SIDECAR_PERF=1
- Verification: typecheck passes; full suite 3043+ tests pass; integration + perf pass; build succeeds; coverage thresholds met; module size ≤500 LOC; JSDoc complete
- Wave 4 of 5 (final); depends on W1+W2+W3
- L1 evidence: 80+ unit tests pass (handler matrix + per-route + WS + tool-proxy)
- L2 evidence: 1 integration test passes (real DelegationManager end-to-end); 3 perf tests pass (real timing)
- L3 evidence: typecheck + build + full suite + coverage thresholds
- Per CONTEXT §boundaries: no new src files; only test files + verification commands
- Ready for /gsd-verify-work SC-02 dispatch by L0
```

---

## Stop Conditions (W4 — FINAL)

- ✅ AC-S02-11 integration test passes (L2 evidence)
- ✅ D-SC02-01 perf SLAs validated (3 perf tests pass)
- ✅ AC-S02-10 typecheck passes (L3 evidence, no `any`)
- ✅ AC-S02-09 no-auth-required covered by handler matrix (L1 evidence)
- ✅ Full suite 2,963+ tests pass (no regression)
- ✅ Build succeeds; new dist files exist
- ✅ Coverage thresholds met (75/62/80/77)
- ✅ Module size ≤500 LOC compliance
- ✅ JSDoc complete on all public exports
- ✅ Atomic commit captured
- ⏹️ STOP — phase complete; L0 dispatches `/gsd-verify-work SC-02`

---

## AC-to-Evidence Mapping (final)

| AC | Evidence Type | Evidence File | Pass Condition |
|----|---------------|---------------|----------------|
| AC-S02-01 (17 endpoints) | L1 (unit) | `tests/sidecar/server/handler.test.ts` | 17+ tests pass |
| AC-S02-02 (envelope shape) | L1 (unit) | `tests/sidecar/server/routes/tools.test.ts` + `tool-proxy/router.test.ts` | 100 random invocations pass Zod |
| AC-S02-03 (50-cap SSE) | L1 (unit) | `tests/sidecar/server/routes/events.test.ts` | 51st receives 503 |
| AC-S02-04 (filter allowlist) | L1 (unit) | `tests/sidecar/server/routes/events.test.ts` | session filter receives only session.* |
| AC-S02-05 (WS schemas) | L1 (unit) | `tests/sidecar/server/ws/delegation.test.ts` | Zod validates all client→server + server→client |
| AC-S02-06 (WS scope) | L1 (unit) | `tests/sidecar/server/ws/delegation.test.ts -t "scope"` | session.* event NOT received by WS |
| AC-S02-07 (catalog immutable) | L1 (unit) | `tests/sidecar/server/routes/catalog.test.ts` | 100 GETs byte-identical SHA-256 |
| AC-S02-08 (session-patch gate) | L1 (unit) | `tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts` | 4 negative + 1 affirmative |
| AC-S02-09 (no auth) | L1 (unit) | covered by AC-S02-01 handler matrix | all 17 endpoints succeed with no headers |
| AC-S02-10 (TS strict) | L3 (compile) | `npm run typecheck` | 0 errors; no `any` |
| AC-S02-11 (e2e delegation) | L2 (integration) | `tests/sidecar/integration/delegation.test.ts` | POST delegate-task → WS subscribe → receive output → WS unsubscribe |

**Total evidence: 11/11 ACs covered.**

---

## Actors / Consumers (W4)

- **L0 orchestrator**: receives READY_FOR_VERIFY signal; dispatches `/gsd-verify-work SC-02`
- **Verifier agent** (next phase): uses W4 evidence to produce SC-02-VERIFICATION.md
- **SC-03 implementer** (future): consumes SC-02 surface (17 endpoints) via `@hivemind/sidecar-client`

---

## Risk Mitigations Specific to W4

- **R-W4-INTEGRATION-FLAKY** (real DelegationManager + real server may have timing issues): mitigated by 5s timeout on WS message receive; 3 retry attempts; gated by `SIDECAR_INTEGRATION=1` (not run in default CI)
- **R-W4-PERF-MACHINE-DEPENDENT** (timing varies by host): mitigated by gating with `SIDECAR_PERF=1` (release branches only); p95 thresholds have 10ms tolerance; baseline captured for regression detection
- **R-W4-COVERAGE-FAILURE** (new code below project thresholds): mitigated by AC-S02-10 typecheck gate; coverage check at W4 with fail-fast; if below 75/62/80/77, add more unit tests before commit
- **R-W4-BUILD-FAILURE** (tsc emits errors): mitigated by typecheck BEFORE build; if build fails, fix and recommit; no commit with broken dist

---

*plan-4.md authored 2026-06-03 — Wave 4 of 5 (integration + verification, FINAL)*
