# plan-2.md — Wave 2: REST Routes (State + Tools + Catalog)

**Phase:** SC-02 — REST API + Tool Proxy
**Wave:** 2 of 5
**Type:** Implementation (REST routes + tool handlers + catalog)
**Depends on:** W1 (`SidecarRouter`, `SidecarStateCache`, `TOOL_HANDLERS`, `routes/types.ts` exist)
**Blocks:** W3, W4

---

## Objective

Implement the **4 REST route modules** (`state.ts`, `sessions.ts`, `tools.ts`, `catalog.ts`) with 14 endpoints (1 snapshot + 5 session-scoped + 7 tool POSTs + 2 catalog GETs = 15 actually, but 1 duplicate of /snapshot path pattern, so 14 unique patterns). Also implement the **7 tool handlers** in `tool-proxy/handlers/*.ts` that `TOOL_HANDLERS` map references. Author the **2 pre-generated catalog JSON assets** + their typed wrappers.

After W2, the handler test matrix in `tests/sidecar/server/handler.test.ts` should pass for: state, sessions, tools, catalog endpoints (14 of 17). Events + WS still pending W3.

---

## Allowed Surfaces (W2 only)

- ✅ CREATE: `src/sidecar/server/routes/state.ts` (≤500 LOC) — `/api/state/snapshot`
- ✅ CREATE: `src/sidecar/server/routes/sessions.ts` (≤500 LOC) — 5 session-scoped GETs
- ✅ CREATE: `src/sidecar/server/routes/tools.ts` (≤500 LOC) — 7 tool POST routes
- ✅ CREATE: `src/sidecar/server/routes/catalog.ts` (≤500 LOC) — 2 catalog GETs
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/delegate-task.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/delegation-status.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/execute-slash-command.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/hivemind-session-view.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/session-patch.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.ts` (≤200 LOC)
- ✅ CREATE: `src/sidecar/catalog/json-render-catalog.ts` (≤150 LOC)
- ✅ CREATE: `src/sidecar/catalog/tool-catalog.ts` (≤150 LOC)
- ✅ CREATE: `src/sidecar/catalog/json-render-catalog.json` (asset, ≤50KB)
- ✅ CREATE: `src/sidecar/catalog/tool-catalog.json` (asset, ≤20KB)

---

## Forbidden Surfaces (W2)

- ❌ NO `src/sidecar/server/routes/events.ts` (W3 territory)
- ❌ NO `src/sidecar/server/ws/**` (W3 territory)
- ❌ NO modification to `src/sidecar/server/handler.ts`, `cache.ts`, `routes/types.ts`, `tool-proxy/router.ts`, `factory.ts` (W1 outputs frozen for W2)
- ❌ NO modification to any SC-01 output
- ❌ NO new npm dependencies (C-S02-05)
- ❌ NO auth, rate limit, session middleware

---

## Tasks (3 tasks)

### Task 1: State + sessions + catalog route modules

**Files:** `src/sidecar/server/routes/state.ts`, `src/sidecar/server/routes/sessions.ts`, `src/sidecar/server/routes/catalog.ts`, `src/sidecar/catalog/*.ts`, `src/sidecar/catalog/*.json`

**Action:**

1. Create `src/sidecar/server/routes/state.ts`:
   - `export async function handleStateSnapshot(req, res, match, registry): Promise<void>`
   - Calls `registry.sessionTracker.listAll()` to get session summaries
   - Calls `registry.client.app.log()` for observability (or skip; minimal logging)
   - Aggregates 4 canonical prefixes: `.hivemind/state`, `.hivemind/session-tracker`, `.opencode`, `.planning` (uses `readCanonicalStateAsync` from `src/sidecar/readonly-state.ts`)
   - Wraps response in `cache.get/set` with `category="snapshot"` (5s TTL per ER-S02-06)
   - Computes ETag, sets `ETag: "<sha256>"` header
   - Handles `If-None-Match` → 304 (OF-S02-03)
   - JSDoc + `@example`

2. Create `src/sidecar/server/routes/sessions.ts`:
   - 5 functions: `handleSessionsList`, `handleSessionChildren`, `handleSessionContext`, `handleSessionDelegations`, `handleSessionDocs`
   - All use `cache.get/set` with `category="session"` (2s TTL per ER-S02-07)
   - `handleSessionChildren({sessionId})` → calls `sessionTracker.getChildren(sessionId)`
   - `handleSessionContext({sessionId})` → calls `sessionTracker.getContext(sessionId)`
   - `handleSessionDelegations({sessionId})` → calls `session-delegation-query` action
   - `handleSessionDocs({sessionId})` → calls `hivemind-doc` action (read-only)
   - 404 with `{error: {code: "SESSION_NOT_FOUND"}}` if sessionId missing in tracker (SR-S02-02)
   - ETag + 304 revalidation per route

3. Create `src/sidecar/server/routes/catalog.ts`:
   - `handleCatalog(req, res)` → returns `JSON_RENDER_CATALOG` constant
   - `handleToolCatalog(req, res)` → returns `TOOL_CATALOG` constant
   - Both use `Object.freeze` recursive (deepFreeze helper) — see D-SC02-11
   - ETag = SHA-256 of JSON string at module load (D-SC02-04)
   - 304 revalidation
   - 100 sequential GETs return byte-identical payloads (AC-S02-07)

4. Create `src/sidecar/catalog/json-render-catalog.ts`:
   - `import data from "./json-render-catalog.json"` with `assert { type: "json" }`
   - `export const JSON_RENDER_CATALOG = deepFreeze(data)` — typed `as const` for type narrowing
   - `deepFreeze<T>(obj: T): T` helper (recursive, returns same type)

5. Create `src/sidecar/catalog/tool-catalog.ts`:
   - `import data from "./tool-catalog.json"`
   - `export const TOOL_CATALOG: readonly ToolCatalogEntry[] = deepFreeze(data)`

6. Create `src/sidecar/catalog/json-render-catalog.json`:
   - Stub: minimal valid json-render catalog (44 components per ARCHITECTURE §7.1 — 36 shadcn + 8 custom)
   - Real catalog generation deferred to authoring phase; for SC-02, ship a placeholder that satisfies `Catalog` type
   - Schema reference: `@json-render/core` `Catalog` type

7. Create `src/sidecar/catalog/tool-catalog.json`:
   - 12 entries (5 read + 7 write per D-SC02-09)
   - Each: `{id, name, kind: "read"|"write", description, requestSchema}`
   - Matches `ToolCatalogEntry` from `routes/types.ts`

**Verify:** `npx vitest run tests/sidecar/server/routes/state.test.ts tests/sidecar/server/routes/sessions.test.ts tests/sidecar/server/routes/catalog.test.ts` — all pass (snapshot, 5 sessions, 2 catalog = 8 tests minimum). `npm run typecheck` passes.

**Done:** 8 endpoints (1 snapshot + 5 sessions + 2 catalog) work; 100 sequential GETs return byte-identical SHA-256; 304 revalidation works; ETag header set.

---

### Task 2: 7 tool handlers (tool-proxy/handlers/*.ts)

**Files:** `src/sidecar/server/tool-proxy/handlers/{delegate-task,delegation-status,execute-slash-command,hivemind-trajectory,hivemind-session-view,session-patch,hivemind-command-engine}.ts`

**Action:**

For each of the 7 tools, create a handler file with this structure:
1. **delegate-task.ts**:
   - Input: `{agent, prompt, context?, stackOnSessionId?}` (Zod-validated via `routes/types.ts` `DelegateTaskRequest`)
   - Calls `registry.delegationManager.dispatch({agent, prompt, context, stackOnSessionId})` → returns `{delegationId}`
   - Returns `ToolResponse<{delegationId: string}>`
   - NEVER calls `client.session.prompt` (re-entrancy risk per research)

2. **delegation-status.ts**:
   - Input: `{delegationId?, action}` (action ∈ `find-stackable`, `status`, `list`)
   - Calls `registry.delegationManager.coordinator.{chain, list}` based on action
   - Returns `ToolResponse<DelegationRecord[]>`

3. **execute-slash-command.ts**:
   - Input: `{command, arguments?, agent?, subtask?}`
   - Calls `registry.hivemindCommandEngine({action: "execute", command, arguments, agent, subtask})` — but per SPEC restriction, sidecar only allows `action: "discover"`; reject `action: "execute"` with `DELEGATION_FORBIDDEN`
   - Returns `ToolResponse<{output: string}>`

4. **hivemind-trajectory.ts**:
   - Input: `{action, trajectoryId?, ...}` (action ∈ `inspect`, `traverse`, `attach`, `event`)
   - Calls `registry.trajectory.{inspect, traverse, attach, event}` based on action
   - Returns `ToolResponse<TrajectoryData>`

5. **hivemind-session-view.ts**:
   - Input: `{action: "get", sessionId}` (only `get` action allowed)
   - Calls `registry.hivemindSessionView({action: "get", sessionId})`
   - Returns `ToolResponse<SessionViewData>`

6. **session-patch.ts** (AC-S02-08, UB-S02-01, OF-S02-02):
   - Input: `{sessionFilePath, section, newContent}` (Zod-validated)
   - **FIRST** validate `sessionFilePath` via `isSidecarSessionFilePath()` from `src/sidecar/readonly-state.ts`
   - If canonical (matches 4 `CANONICAL_PREFIXES`) → return `{ok: false, error: {code: "FORBIDDEN_PATH", message: "..."}}` with HTTP 200 (no plugin dispatch)
   - If non-canonical → call `registry.client.session.prompt` (or appropriate plugin tool) with validated args
   - Returns `ToolResponse<{patched: boolean}>`

7. **hivemind-command-engine.ts**:
   - Input: `{action: "discover" | "list_commands", commandName?}` (only `discover` and `list_commands` per SPEC)
   - Calls `registry.hivemindCommandEngine({action, commandName})`
   - Returns `ToolResponse<{commands: CommandMetadata[]}>` for `list_commands` or `ToolResponse<{command: CommandMetadata}>` for `discover`

**Pattern for all handlers:**
- Each exports `export async function handle(args, registry): Promise<ToolResponse<T>>`
- Wrap execution in `try/catch`; on error return `{ok: false, error: {code: "TOOL_ERROR_<NAME>", message: err.message}}`
- All throws prefixed `[Harness]`
- JSDoc with `@param`, `@returns`, `@example`

**Update `TOOL_HANDLERS` map in `tool-proxy/router.ts`:** Replace 7 stub entries with real handler imports (modify only the map, do not refactor structure).

**Verify:** `npx vitest run tests/sidecar/server/tool-proxy/` — all 7 handler tests + router whitelist test pass (8 tests minimum). `npm run typecheck` passes.

**Done:** 7 tool handlers implemented; 7 tool POST routes return `ToolResponse<T>` envelopes; session-patch blocks canonical paths with `FORBIDDEN_PATH`; no handler calls `client.session.prompt` for `delegate-task` (uses `DelegationManager.dispatch`).

---

### Task 3: Tool POST routes (routes/tools.ts) + handler matrix integration

**Files:** `src/sidecar/server/routes/tools.ts`

**Action:**

1. Create `src/sidecar/server/routes/tools.ts`:
   - Pattern: one exported handler per tool: `handleDelegateTask`, `handleDelegationStatus`, `handleExecuteSlashCommand`, `handleHivemindTrajectory`, `handleHivemindSessionView`, `handleSessionPatch`, `handleHivemindCommandEngine`
   - Each:
     - Parse `req.url` to extract `toolName` (last path segment)
     - Read body (already size-checked in `handler.ts` to ≤256KB per D-SC02-07)
     - Validate body via Zod schema from `routes/types.ts`
     - Look up handler in `TOOL_HANDLERS[toolName]`
     - If not found → 404 `{error: {code: "UNKNOWN_TOOL", message: "..."}}` (UB-S02-03)
     - If validation fails → 400 `{error: {code: "VALIDATION_ERROR", message: "..."}}` (UB-S02-02)
     - Else call handler; measure duration (ms, integer, ≥0)
     - Wrap result in `ToolResponse<T>` envelope with `meta.duration` and `meta.tool = toolName`
   - All transport errors return raw `{error: {code, message}}`; app errors return HTTP 200 + `ToolResponse.ok = false`
   - JSDoc on each function

2. Verify: `npx vitest run tests/sidecar/server/handler.test.ts -t "tools"` — 7 tool POST endpoints return 200 + envelope. Combined with W2 Task 1, the full 14-endpoint matrix (state + sessions + tools + catalog) should now pass in `handler.test.ts` (events.ts + ws/delegation.ts still pending W3).

**Verify:** `npx vitest run tests/sidecar/server/routes/ tests/sidecar/server/tool-proxy/ tests/sidecar/server/handler.test.ts` — all pass (~50+ tests). `npm run typecheck` passes.

**Done:** 14 of 17 endpoints (state + sessions + tools + catalog) return correct responses. Only events.ts + ws/delegation.ts remaining (W3 territory).

---

## Verification (per-wave merge gate for W2)

```bash
# Primary: routes + tool-proxy + handler test all pass
npx vitest run tests/sidecar/server/routes/ tests/sidecar/server/tool-proxy/ tests/sidecar/server/handler.test.ts
# Expected: ~50+ tests pass (all state + sessions + tools + catalog endpoints work)

# Secondary: typecheck
npm run typecheck
# Expected: 0 errors

# Tertiary: SC-01 regression still passes
npx vitest run tests/sidecar/readonly-state.test.ts
# Expected: 59 tests pass

# Quaternary: 100 sequential catalog GETs return byte-identical SHA-256
npx vitest run tests/sidecar/server/routes/catalog.test.ts -t "100-gets"
# Expected: 1+ tests pass

# Quinary: session-patch FORBIDDEN_PATH gate
npx vitest run tests/sidecar/server/tool-proxy/handlers/session-patch.test.ts
# Expected: 5+ tests pass (4 negative + 1 affirmative)
```

---

## Atomic Commit (W2)

**Commit message:**
```
phase(SC-02): W2 — 4 REST route modules + 7 tool handlers + catalog JSON + wrappers

- src/sidecar/server/routes/state.ts (NEW, ≤500 LOC): /api/state/snapshot with 5s TTL + ETag (ER-S02-06)
- src/sidecar/server/routes/sessions.ts (NEW, ≤500 LOC): 5 session-scoped GETs with 2s TTL + ETag (ER-S02-07)
- src/sidecar/server/routes/tools.ts (NEW, ≤500 LOC): 7 tool POST routes wrapping TOOL_HANDLERS with Zod validation
- src/sidecar/server/routes/catalog.ts (NEW, ≤500 LOC): 2 catalog GETs with deepFreeze + SHA-256 ETag (D-SC02-04, D-SC02-11)
- src/sidecar/server/tool-proxy/handlers/*.ts (NEW, 7 files, ≤200 LOC each): delegate-task, delegation-status, execute-slash-command, hivemind-trajectory, hivemind-session-view, session-patch (with FORBIDDEN_PATH gate), hivemind-command-engine
- src/sidecar/catalog/{json-render-catalog,tool-catalog}.ts (NEW): typed wrappers with deepFreeze helper
- src/sidecar/catalog/{json-render-catalog,tool-catalog}.json (NEW): pre-generated catalog assets
- src/sidecar/server/tool-proxy/router.ts (MODIFY): replace 7 stubs with real handler imports
- Wave 2 of 5; depends on W1; blocks W3
- Per CONTEXT §boundaries: 14 of 17 endpoints work; events + WS pending W3
- Per D-SC02-09: TOOL_HANDLERS explicit whitelist preserved (7 of 27 plugin tools)
- Per AC-S02-08: session-patch blocks 4 canonical prefixes with FORBIDDEN_PATH
```

---

## Stop Conditions (W2)

- ✅ 14 of 17 endpoints (state + sessions + tools + catalog) work end-to-end
- ✅ 7 tool handlers return `ToolResponse<T>` envelopes with `meta.duration` measured
- ✅ session-patch blocks 4 canonical paths with `FORBIDDEN_PATH` (no plugin dispatch)
- ✅ Catalog 100 sequential GETs return byte-identical SHA-256 (AC-S02-07)
- ✅ ETag + 304 revalidation works for state + sessions + catalog
- ✅ Typecheck passes; SC-01 baseline (59 tests) still passes
- ✅ Atomic commit captured
- ⏹️ STOP — W3 (real-time) cannot start without REST foundation

---

## Actors / Consumers (W2)

- **W3 implementer** (real-time): imports `routes/types.ts` for WS message types; uses `routes/{state,sessions,tools,catalog}.ts` patterns
- **W4 implementer** (integration): uses all 14 endpoints + tool handlers in end-to-end test
- **SC-03 implementer** (future): consumes all 14 endpoints via `@hivemind/sidecar-client`

---

## Risk Mitigations Specific to W2

- **R-W2-CATALOG-FREEZE-FAIL** (Object.freeze on deeply nested data): mitigated by `deepFreeze` recursive helper; JSDoc notes that nested objects must also be frozen; W2 test verifies mutation throws
- **R-W2-SESSION-PATCH-BYPASS** (path gate skipped on some paths): mitigated by `isSidecarSessionFilePath()` called BEFORE any plugin dispatch; W2 test covers 4 negative cases + 1 affirmative
- **R-W2-DELEGATION-RE-ENTRY** (delegate-task calls client.session.prompt causing re-entrancy): mitigated by using `DelegationManager.dispatch()` (async, WaiterModel) instead of `client.session.prompt`; JSDoc + inline comment
- **R-W2-CACHE-STALENESS** (5s TTL too long for active sessions): mitigated by 2s TTL for session-scoped reads; D-SC02-02 defense-in-depth via `invalidate.cache` SSE event evicts matching category
- **R-W2-CONTENT-LENGTH-LIE** (client sends no Content-Length but body > 256KB): W1 `handler.ts` checks declared `Content-Length`; for chunked transfer, falls back to streaming size check (per `node:http` default) — deferred to W4 if needed

---

*plan-2.md authored 2026-06-03 — Wave 2 of 5 (REST routes + tool handlers + catalog)*
