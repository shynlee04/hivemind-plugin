# Evaluation Checklist

Per-dimension audit criteria for each classification type. Consult
`anti-patterns.md` for the full anti-pattern catalog to check during each
evaluation pass.

## TOOL Evaluation (implements tool() in plugin)

### Dimension 1: Lifecycle Initiation

- [ ] Tool function registered in `plugin.ts` return object under `tool.{name}`
- [ ] Tool created via factory function (e.g., `createDelegateTaskTool()`)
- [ ] Factory accepts injected dependencies, not global singletons
- [ ] Tool has matching Zod schema in `schema-kernel/` if accepting structured input
- [ ] Tool returns structured response via `shared/tool-response.ts` envelope

### Dimension 2: CQRS Correctness (Write-Side)

- [ ] Tool calls SDK mutations through `session-api.ts` wrappers only
- [ ] Tool may call `patchSessionContinuity()` for state writes
- [ ] Tool NEVER reads event stream directly
- [ ] Tool NEVER observes hook events
- [ ] State mutations are serializable (no Map/Set in persisted data)

### Dimension 3: OpenCode Surface

- [ ] Tool name matches the key in `plugin.ts` tool map
- [ ] Tool function signature: `(args) => Promise<string>` or structured return
- [ ] Error handling wraps with `[Harness]` prefix
- [ ] Output is human-readable (truncated if verbose)

### Dimension 4: Classification Fit

- [ ] Tool implementation lives in `src/tools/`
- [ ] Shared utilities in `src/shared/`
- [ ] No state storage in tool directory
- [ ] No OpenCode primitives (skills/agents) referenced from tool code

### Dimension 5: Size and Structure

- [ ] Tool file < 200 LOC
- [ ] No inline business logic — delegated to `src/lib/` modules
- [ ] Test file exists in `tests/tools/` mirroring tool structure

---

## HOOK Evaluation (implements hook handler)

### Dimension 1: Lifecycle Initiation

- [ ] Hook registered in `plugin.ts` return object (event observers, tool.execute.after, etc.)
- [ ] Hook created via factory function in `src/hooks/`
- [ ] Factory accepts injected dependencies
- [ ] Event observer receives `{ event }` parameter and extracts type + sessionID

### Dimension 2: CQRS Correctness (Read-Side)

- [ ] Hook observes events — does NOT produce state mutations
- [ ] Hook NEVER calls `patchSessionContinuity()` (except: `tool.execute.after` for audit trail)
- [ ] Hook NEVER calls `delegationManager.dispatch()`
- [ ] Hook NEVER calls `client.session.create()`, `client.session.prompt()`, `client.session.abort()`
- [ ] Events flow from write-side to read-side only

### Dimension 3: Error Boundary

- [ ] Hook body wrapped in try/catch
- [ ] Hook failures are silent (never block canonical OpenCode event handling)
- [ ] No unhandled promise rejections from async hook handlers

### Dimension 4: Classification Fit

- [ ] Hook factory lives in `src/hooks/`
- [ ] No state storage in hook directory
- [ ] Hook does not import from `.opencode/` or `.hivemind/`

### Dimension 5: Session Context

- [ ] sessionID extracted via `getEventSessionID()` from `session-api.ts`
- [ ] No hardcoded session ID assumptions
- [ ] Handles missing sessionID gracefully (early return)

---

## LIBRARY Evaluation (src/lib/ module)

### Dimension 1: Dependency Graph

- [ ] `types.ts` is leaf — imports nothing
- [ ] Module dependency chain ≤ 2 levels deep
- [ ] No circular dependencies
- [ ] `helpers.ts` depends only on `types.ts`
- [ ] `delegation-persistence.ts` depends on `types.ts` + `continuity.ts` only

### Dimension 2: Code Quality

- [ ] Module < 500 LOC (split threshold)
- [ ] No `any` types on new code (`client: any` is known tech debt)
- [ ] All thrown errors prefixed with `[Harness]`
- [ ] Deep-clone-on-read in continuity store access
- [ ] No `Set` or `Map` types in serialized/persisted data structures

### Dimension 3: State Management

- [ ] In-memory state lives in `state.ts` (Maps only)
- [ ] Durable state persists through `continuity.ts`
- [ ] State writes target `.hivemind/state/` (canonical per Q6)
- [ ] No dual-write to legacy `.opencode/state/` paths

### Dimension 4: Testing

- [ ] Test file exists in `tests/lib/` mirroring module structure
- [ ] Tests use vitest globals (no imports for describe/it/expect)
- [ ] Edge cases covered: null/undefined inputs, empty records, concurrent access

### Dimension 5: Classification Fit

- [ ] Module lives in `src/lib/`
- [ ] No OpenCode SDK client instantiation in library modules
- [ ] SDK access only through `session-api.ts` wrappers

---

## PLUGIN.TS Evaluation (composition root)

### Dimension 1: Composition Integrity

- [ ] File < 200 LOC
- [ ] All tools registered in return `tool` map
- [ ] All hook factories called and wired
- [ ] DelegationManager instantiated once, shared via dependency injection
- [ ] LifecycleManager instantiated once, hydrated from continuity

### Dimension 2: Separation of Concerns

- [ ] No business logic inline — all logic delegated to factories and lib modules
- [ ] PTY manager lazy-loaded via dynamic `import()`
- [ ] Graceful fallback when PTY unsupported (`ptyManager = null`)
- [ ] Event observers composed from factory outputs, not hand-coded

### Dimension 3: Dependency Wiring

- [ ] `createCoreHooks()` receives eventObservers array
- [ ] `createSessionHooks()` receives client + lifecycleManager + stateManager
- [ ] `createToolGuardHooks()` receives stateManager + lifecycleManager + runtimePolicy
- [ ] Recovery runs asynchronously: `void delegationManager.recoverPending()`

### Dimension 4: Runtime Policy

- [ ] Policy loaded once at startup via `loadRuntimePolicy()`
- [ ] Workspace-level policy resolved via `resolveWorkspaceRuntimePolicy()`
- [ ] Policy passed to components that need it (lifecycle, tool guard)

---

## DELEGATION PARTICIPANT Evaluation

### Dimension 1: DelegationManager Usage

- [ ] Uses `delegationManager.dispatch()` for SDK delegation
- [ ] Does NOT construct child sessions manually via SDK
- [ ] Delegation ID captured for status polling

### Dimension 2: Category and Queue

- [ ] Category is one of `VALID_DELEGATION_CATEGORIES` (research, implementation, review, visual-engineering, deep, quick)
- [ ] Queue key built via `buildDelegationQueueKey()` (model + agent + category)
- [ ] Queue key validated before dispatch

### Dimension 3: Depth and Budget

- [ ] Nesting depth ≤ `MAX_DELEGATION_DEPTH` (3, overridable)
- [ ] Descendants per root ≤ `MAX_DESCENDANTS_PER_ROOT` (10)
- [ ] Budget tracked in `state.ts` rootBudgets map
- [ ] Depth checked before dispatch, not after

### Dimension 4: Dual-Signal Completion

- [ ] Completion detected via `CompletionDetector` (session.idle + stability timer)
- [ ] `STABLE_POLLS_REQUIRED`: 3 consecutive stable polls
- [ ] `MIN_STABILITY_TIME_MS`: 10000ms minimum before stability declared
- [ ] No fixed timeouts — safety ceiling is MAX runtime, not deadline

### Dimension 5: Recovery and Cleanup

- [ ] Recovery guarantee derived from execution mode (sdk→resumable, pty→best-effort, headless→non-resumable)
- [ ] Grace period cleanup: `TASK_CLEANUP_DELAY_MS` (10 min) for terminal delegations
- [ ] Batch pruning at `MAX_DELEGATIONS_BEFORE_PRUNE` (50) threshold
- [ ] Orphaned delegations detected and cleaned during `recoverPending()`
