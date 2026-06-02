# plan-0.md — Wave 0: Test Scaffolding (TDD Red)

**Phase:** SC-02 — REST API + Tool Proxy
**Wave:** 0 of 5
**Type:** Test scaffolding (TDD discipline — tests written first, watched to fail)
**Depends on:** nothing (no SC-02 source exists yet; tests fail because targets don't exist)
**Blocks:** W1, W2, W3, W4

---

## Objective

Write **15 test scaffolds** covering all 17 endpoints + tool proxy + WS delegation + cache + state cache + factory extension, with `tests/sidecar/__mocks__/registry.ts` providing a reusable `SidecarDependencyRegistry` mock. **All tests MUST FAIL** at end of Wave 0 (red phase) — this proves the test surface is real and not vacuously passing.

This is the **TDD red** phase: tests first, implementation later. No source code changes in W0.

---

## Allowed Surfaces (W0 only — test files + 1 mock)

- ✅ CREATE: `tests/sidecar/__mocks__/registry.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/handler.test.ts` (≤400 LOC)
- ✅ CREATE: `tests/sidecar/server/routes/state.test.ts` (≤300 LOC)
- ✅ CREATE: `tests/sidecar/server/routes/sessions.test.ts` (≤400 LOC)
- ✅ CREATE: `tests/sidecar/server/routes/tools.test.ts` (≤500 LOC)
- ✅ CREATE: `tests/sidecar/server/routes/events.test.ts` (≤500 LOC)
- ✅ CREATE: `tests/sidecar/server/routes/catalog.test.ts` (≤400 LOC)
- ✅ CREATE: `tests/sidecar/server/ws/delegation.test.ts` (≤500 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/router.test.ts` (≤300 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/delegate-task.test.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/delegation-status.test.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/execute-slash-command.test.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/hivemind-trajectory.test.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/hivemind-session-view.test.ts` (≤200 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts` (≤300 LOC)
- ✅ CREATE: `tests/sidecar/server/tool-proxy/handlers/hivemind-command-engine.test.ts` (≤200 LOC)

**Total: 1 mock + 15 test files**

---

## Forbidden Surfaces (W0)

- ❌ NO source code under `src/sidecar/server/**` (W0 is test-only; implementation comes in W1-W3)
- ❌ NO modification to `src/sidecar/server/factory.ts` (W1 territory)
- ❌ NO modification to any SC-01 output (`src/sidecar/{types,readonly-state,readonly-state-extensions}.ts`, `src/sidecar/server/{registry,sse/pool}.ts`)
- ❌ NO new dependencies (mock + tests use only existing `vitest`, `zod`, `node:http`, `node:assert`, `node:test`)
- ❌ NO actual integration test (deferred to W4)

---

## Tasks (2 tasks)

### Task 1: Mock + 5 REST route test scaffolds

**Files:** `tests/sidecar/__mocks__/registry.ts`, `tests/sidecar/server/handler.test.ts`, `tests/sidecar/server/routes/{state,sessions,tools,events,catalog}.test.ts`

**Action:**
1. Create `tests/sidecar/__mocks__/registry.ts`:
   - `createMockRegistry()` factory returning a `SidecarDependencyRegistry` subclass with all 6 setters stubbed to no-op + getters returning deterministic mocks
   - Mock `DelegationManager` (chain, dispatch, abort, etc.) with `vi.fn()` that returns `Promise<{delegationId: "mock-delegation-1"}>` for dispatch
   - Mock `SessionTracker` with `vi.fn()` returning empty `Map<string, SessionSummary>`
   - Mock `OpenCodeClient` (only the methods SC-02 needs: `client.session.prompt` for delegate-task, etc.)
   - Export type `MockRegistry` for type-safe test consumers

2. Create `tests/sidecar/server/handler.test.ts` (AC-S02-01):
   - `describe("17-endpoint matrix", () => {`
   - One `it()` per endpoint with `await request(server).get/post(...)` and assertion on status + body shape
   - Use `createServer({registry: mockRegistry})` to start a real server bound to `127.0.0.1:0`
   - Status codes: `/api/state/snapshot` → 200, `/api/state/sessions` → 200, `/api/state/sessions/{id}/children` → 200, `/api/state/sessions/{id}/context` → 200, `/api/state/sessions/{id}/delegations` → 200, `/api/state/sessions/{id}/docs` → 200, all 7 `/api/tools/*` → 200 (mock plugin tool), `/api/events` → 200, `/ws/delegation` → 101 (upgrade), `/api/catalog` → 200, `/api/catalog/tools` → 200
   - **All 17 tests MUST FAIL** at end of W0 (no source exists yet) — this is the TDD red phase

3. Create `tests/sidecar/server/routes/state.test.ts` (AC-S02-06, OF-S02-03):
   - Test: `GET /api/state/snapshot` returns aggregated 4-prefix snapshot
   - Test: `If-None-Match: <etag>` matching → 304
   - Test: 5-second TTL (second call within 5s returns cached)

4. Create `tests/sidecar/server/routes/sessions.test.ts` (ER-S02-07, SR-S02-02):
   - Test: 5 session-scoped GETs all return 200 with typed payloads
   - Test: nonexistent `sessionId` → 404 `{error: {code: "SESSION_NOT_FOUND"}}`
   - Test: 2-second TTL behavior

5. Create `tests/sidecar/server/routes/tools.test.ts` (AC-S02-02, UR-S02-03):
   - Test: 7 write tools all return `ToolResponse<T>` envelope
   - Test: `meta.duration` is integer ≥ 0
   - Test: `meta.tool` matches URL path (kebab-case)
   - Test: 100 random invocations pass Zod validation

6. Create `tests/sidecar/server/routes/events.test.ts` (AC-S02-03, AC-S02-04, OF-S02-01, UB-S02-04):
   - Test: 51 parallel SSE clients → 50 succeed, 1 receives 503
   - Test: `?filter=session` → client receives only session.* events
   - Test: `?filter=foo` → 400 `{error: {code: "INVALID_FILTER"}}`
   - Test: heartbeat every 30s

7. Create `tests/sidecar/server/routes/catalog.test.ts` (AC-S02-07, D-SC02-04, D-SC02-11):
   - Test: 100 sequential GETs return byte-identical SHA-256 payloads
   - Test: `If-None-Match: <etag>` matching → 304
   - Test: `Object.freeze` enforcement (mutation throws in strict mode)

**Verify:** `npx vitest run tests/sidecar/ --reporter=verbose` — output shows 17+ tests in handler.test.ts + 4+ per route test file, all FAILING with `Cannot find module '../src/sidecar/server/handler.js'` or similar ModuleNotFound errors. Expectation: **0 tests passing, ~50+ tests failing** at end of W0.

**Done:** All 6 test files committed; full suite shows 0 pass / ~50 fail (red phase locked).

---

### Task 2: WS delegation + tool-proxy handler test scaffolds

**Files:** `tests/sidecar/server/ws/delegation.test.ts`, `tests/sidecar/server/tool-proxy/router.test.ts`, `tests/sidecar/server/tool-proxy/handlers/*.test.ts` (7 files)

**Action:**
1. Create `tests/sidecar/server/ws/delegation.test.ts` (AC-S02-05, AC-S02-06, UB-S02-05, UB-S02-06, UB-S02-07, D-SC02-03, D-SC02-10):
   - Test: client sends `{"type":"subscribe","delegationId":"d1"}` → receives `delegation.output/status/notification` for that delegationId
   - Test: synthetic `session.*` event sent via internal bus → WS client does NOT receive it (only SSE does) — AC-S02-06 scope guard
   - Test: unknown `type` field → close code 1008
   - Test: malformed JSON → close code 1003
   - Test: backpressure buffer 64KB → close code 1013
   - Test: dead conn cleanup within 5s after client disconnect
   - Test: 50-conn cap; 51st → close code (or refused upgrade)
   - Test: server heartbeat every 30s
   - Use `ws` 8.21.0 `WebSocket` client + `WebSocketServer` for test

2. Create `tests/sidecar/server/tool-proxy/router.test.ts` (D-SC02-09):
   - Test: `TOOL_HANDLERS` map has exactly 7 keys (the 7 write tools)
   - Test: each key is a function `(args, registry) => Promise<ToolResponse<T>>`
   - Test: keys ⊆ existing `Hooks.tool` map keys at `src/plugin.ts:727-749` (whitelist invariant)

3. Create 7 handler test files (one per tool):
   - `delegate-task.test.ts`: mock `client.session.prompt` → returns delegationId; test `meta.duration` measured; test `meta.tool === "delegate-task"`
   - `delegation-status.test.ts`: mock `DelegationManager.{chain, list}` → returns array; test action validation (`find-stackable` / `status` / `list`)
   - `execute-slash-command.test.ts`: mock `hivemind-command-engine` action=`discover` → returns command list
   - `hivemind-trajectory.test.ts`: mock `hivemind-trajectory` action=`inspect` → returns trajectory
   - `hivemind-session-view.test.ts`: mock `hivemind-session-view` action=`get` → returns unified view
   - `session-patch.test.ts` (AC-S02-08, UB-S02-01, OF-S02-02):
     - 4 negative tests: `sessionFilePath` matching each `CANONICAL_PREFIXES` → `ToolResponse.ok = false` + `error.code = "FORBIDDEN_PATH"` + HTTP 200 (no plugin dispatch)
     - 1 affirmative test: non-canonical path (e.g., `/tmp/test.md`) → plugin dispatched
     - Test: `isSidecarSessionFilePath()` called BEFORE plugin dispatch (precondition, not side effect)
   - `hivemind-command-engine.test.ts`: action=`discover` only (per SPEC restriction); reject `action="list_commands"` or other non-discover actions

**Verify:** `npx vitest run tests/sidecar/ --reporter=verbose` — total test count now ~80+ (handler matrix + per-route + WS + tool-proxy + 7 handlers). All FAILING. **TDD red phase complete.**

**Done:** All 9 test files committed; full suite shows 0 pass / ~80+ fail (red phase locked across W0).

---

## Verification (per-wave merge gate for W0)

```bash
# Primary: all tests fail (red phase locked)
npx vitest run tests/sidecar/ --reporter=verbose 2>&1 | tail -20
# Expected: "Test Files  16 failed (16)" + "Tests  0 passed | 80+ failed"

# Secondary: no source code touched
git -C /Users/apple/hivemind-plugin-private status --short
# Expected: only `??` (untracked) test files in tests/sidecar/

# Tertiary: typecheck still passes (mock + test files must compile)
npm run typecheck
# Expected: 0 errors
```

---

## Atomic Commit (W0)

**Commit message:**
```
phase(SC-02): W0 — scaffold 16 test files, watch all fail (TDD red)

- tests/sidecar/__mocks__/registry.ts: Mock SidecarDependencyRegistry + DelegationManager + SessionTracker + OpenCodeClient
- tests/sidecar/server/handler.test.ts: 17-endpoint smoke matrix (AC-S02-01)
- tests/sidecar/server/routes/{state,sessions,tools,events,catalog}.test.ts: per-route coverage
- tests/sidecar/server/ws/delegation.test.ts: WS schema + scope + 1008/1003/1013 close codes
- tests/sidecar/server/tool-proxy/router.test.ts: TOOL_HANDLERS whitelist invariant
- tests/sidecar/server/tool-proxy/handlers/*.test.ts: 7 tool handler tests (delegate-task, delegation-status, etc.)
- All tests RED: targets don't exist yet (TDD discipline; implementation in W1-W3)
- Wave 0 of 5; depends on nothing; blocks W1-W4
- Per CONTEXT §boundaries: no source code modified; only test files + 1 mock
```

---

## Stop Conditions (W0)

- ✅ All 16 test files created (15 test files + 1 mock)
- ✅ All tests FAIL (TDD red) at end of W0 — verified by `npx vitest run` output
- ✅ Typecheck still passes (mock + tests compile clean)
- ✅ No source code modified (only `tests/sidecar/**` created)
- ✅ Atomic commit captured
- ⏹️ STOP — W1 cannot start without this red baseline

---

## Actors / Consumers (W0)

- **W1-W4 implementers** consume this test baseline; tests are the contract
- **Plan-checker (gsd-plan-checker)** validates that W0 is a real red phase, not vacuous

---

## Risk Mitigations Specific to W0

- **R-W0-VACUOUS-PASS** (tests pass without exercising code): mitigated by per-test assertions on real status codes (not just `expect(response).toBeDefined()`); W4 verifies these are real integration, not mocks-only
- **R-W0-MOCK-COUPLE** (mock too tightly coupled to impl): mock implements the `SidecarDependencyRegistry` interface, not internal SC-02 shapes; tests fail to compile if SC-02 contract changes
- **R-W0-COVERAGE-GAP** (missing tests for some AC): cross-checked against 11 ACs in this plan; each AC has ≥1 test file; full mapping in `02-PLAN.md §Coverage`

---

*plan-0.md authored 2026-06-03 — Wave 0 of 5 (TDD red phase)*
