# Codebase Concerns

**Analysis Date:** 2026-05-15

## Tech Debt

### Session Tracker Module Size Violation (Critical)

**Issue:** `src/features/session-tracker/index.ts` is 1,035 lines — more than double the 500 LOC cap enforced by project convention. `src/features/session-tracker/capture/event-capture.ts` is 512 lines — also exceeds the cap.

**Files:** `src/features/session-tracker/index.ts` (1,035 LOC), `src/features/session-tracker/capture/event-capture.ts` (512 LOC)

**Impact:** Violates the project's own architectural constraint (`.planning/codebase/CONVENTIONS.md`). Makes the module harder to review, test, and maintain. New contributors cannot grasp the module in a single context window.

**Fix approach:** Extract bootstrap logic (lines 140-210), child-session polling (lines 540-700), and orphan cleanup (lines 800-960) into separate modules: `bootstrap.ts`, `child-session-poller.ts`, `orphan-cleanup.ts`. Each should be <300 LOC.

### Delegation Manager at Cap Boundary

**Issue:** `src/coordination/delegation/manager.ts` is 504 LOC — at the exact boundary of the 500 LOC cap. Any addition will violate the convention.

**Files:** `src/coordination/delegation/manager.ts` (504 LOC)

**Impact:** The reference module for the project's size constraint is itself in violation. Sets a poor precedent.

**Fix approach:** Extract `resolveAcquireArgs()` and related policy resolution helpers into `policy-resolver.ts`. Extract category gate evaluation into a separate module.

### Extensive Backward-Compatibility Code

**Issue:** 84 references to legacy/deprecated/removed/backward-compat patterns across the codebase. The continuity store (`src/task-management/continuity/index.ts`) still checks legacy `.opencode/state/hivemind/` paths alongside canonical `.hivemind/state/`. The behavioral profile module has deprecated no-op functions (`invalidateBehavioralProfile`, `clearAllBehavioralProfiles`). Agent frontmatter schema retains deprecated `tools` and `maxSteps` fields.

**Files:** `src/task-management/continuity/index.ts:251-255`, `src/routing/behavioral-profile/resolve-behavioral-profile.ts:89-101`, `src/schema-kernel/agent-frontmatter.schema.ts:100-131`, `src/shared/types.ts:195-197`

**Impact:** Every legacy path adds cognitive load and runtime cost. The Q6 migration (`.hivemind/` as canonical state root) is incomplete if legacy paths are still checked.

**Fix approach:** Create a migration gate: after a grace period, remove legacy path fallbacks. Remove deprecated no-op functions. Remove deprecated schema fields with a breaking version bump.

### Sync Filesystem I/O on Hot Paths

**Issue:** 165+ synchronous `fs` calls (`readFileSync`, `writeFileSync`, `mkdirSync`, `existsSync`, `readdirSync`) across the codebase. These block the Node.js event loop. While acceptable for CLI commands and startup, some are on tool execution paths that run during agent sessions.

**Files:** `src/tools/config/bootstrap-init.ts` (30+ sync calls), `src/tools/config/bootstrap-recover.ts` (15+ sync calls), `src/tools/config/configure-primitive.ts` (10+ sync calls), `src/task-management/continuity/index.ts`, `src/task-management/continuity/delegation-persistence.ts`

**Impact:** During active agent sessions, sync I/O can cause perceptible latency spikes, especially when processing multiple files (e.g., bootstrap-recover scanning entire `.opencode/` tree).

**Fix approach:** Audit which sync calls are on hot paths (tool execution, hook callbacks) vs cold paths (CLI, startup). Migrate hot-path calls to `fs/promises` async equivalents. Keep sync calls only in CLI substrate and initialization.

## Known Bugs

### Race Condition in Session Bootstrap

**Issue:** `src/features/session-tracker/index.ts` uses a retry loop with `setTimeout(r, 100)` to work around SDK not reporting `parentID` immediately after child session creation. This is a band-aid for an SDK timing issue. If the SDK takes >100ms, the bootstrap falls through to the hierarchy index and pending registry gates — which may also not be populated yet.

**Files:** `src/features/session-tracker/index.ts:156-169`

**Symptoms:** Orphan session directories created for child sessions that should have been skipped.

**Trigger:** Fast delegation dispatch where `session.created` event fires before SDK records `parentID`.

**Workaround:** Three-gate fallback (SDK → hierarchyIndex → pendingRegistry) reduces but does not eliminate the race.

**Fix approach:** Subscribe to SDK session lifecycle events rather than polling. Or use a longer retry window with exponential backoff.

### Fire-and-Forgot Recovery at Startup

**Issue:** `void delegationManager.recoverPending()` and `void sessionTracker.initialize()` in `src/plugin.ts` fire recovery and initialization asynchronously without any error handling. If recovery fails, the harness starts in a potentially inconsistent state with no visible indication.

**Files:** `src/plugin.ts:75`, `src/plugin.ts:101`

**Symptoms:** Pending delegations lost after restart. Session tracker not initialized.

**Trigger:** Any error during recovery (corrupted state file, permission issue, SDK unavailable).

**Fix approach:** Add error logging to the void promises. Consider a startup health check that reports recovery status.

## Security Considerations

### Path Traversal via Environment Variables

**Issue:** `process.env.HOME` is used as a fallback for config directory paths. If `HOME` is unset or manipulated, paths resolve to `/tmp/.config/opencode` which is world-readable.

**Files:** `src/tools/config/configure-primitive-paths.ts:23`, `src/tools/config/bootstrap-init.ts:197`, `src/tools/config/bootstrap-recover.ts:134`

**Risk:** Config files written to `/tmp` may be read by other users on shared systems.

**Current mitigation:** None — `/tmp` is used as a silent fallback.

**Recommendations:** Fail explicitly when `HOME` is unavailable rather than falling back to `/tmp`. Log a warning when the fallback is used.

### No Input Sanitization on Session IDs in Recovery

**Issue:** `src/task-management/recovery/create-checkpoint.ts` validates session IDs against path separators and `..`, but other recovery modules (`repair-state.ts`, `assess-state.ts`) do not perform the same validation before using session IDs in file paths.

**Files:** `src/task-management/recovery/create-checkpoint.ts:102` (validated), `src/task-management/recovery/repair-state.ts:63-98` (not validated), `src/task-management/recovery/assess-state.ts` (not validated)

**Risk:** Malformed session IDs could cause path traversal in recovery operations.

**Recommendations:** Apply the same `assertSafeSessionId()` validation to all recovery modules that construct file paths from session IDs.

### Secrets in Filesystem (Env Files Present)

**Issue:** `.env` files are present in the repository (noted in `.gitignore`). While contents are not read during analysis, the presence of env files indicates secrets management relies on filesystem-level protection.

**Files:** `.env*` (existence only)

**Risk:** If `.gitignore` rules are misconfigured or env files are accidentally committed, secrets leak to version control.

**Recommendations:** Use a secrets manager or encrypted env solution for production deployments. Add pre-commit hooks to prevent `.env` commits.

## Performance Bottlenecks

### Polling-Based Child Session Detection

**Issue:** `src/features/session-tracker/index.ts` implements a polling loop (`pollForChildSessions`) with `setTimeout` at `POLL_INTERVAL_MS` intervals. This runs for up to 30 minutes (`WATCH_TIMEOUT_MS`) per session.

**Files:** `src/features/session-tracker/index.ts:558-680`, `src/plugin.ts:60`

**Cause:** No event-driven mechanism available from the SDK to detect child session creation. Polling is the only option.

**Impact:** Each root session spawns a long-running timer. With many concurrent sessions, this creates significant timer overhead and memory pressure.

**Improvement path:** If the SDK adds session lifecycle events, replace polling with event subscription. Until then, consider a shared pollinger rather than per-session timers.

### Synchronous JSON Parse on Large State Files

**Issue:** `src/task-management/continuity/index.ts` reads and parses the entire continuity store file synchronously on every access. As the store grows (many sessions, delegations, notifications), this becomes increasingly expensive.

**Files:** `src/task-management/continuity/index.ts:259-262`

**Cause:** No streaming or incremental parsing. Entire file loaded into memory and parsed at once.

**Improvement path:** Implement lazy loading or chunked parsing for large continuity stores. Consider a lightweight database (SQLite) for session-level records.

### No Promise.all for Parallel I/O

**Issue:** File operations that could run in parallel are executed sequentially. For example, `bootstrap-recover.ts` iterates over primitives one-by-one with sync calls.

**Files:** `src/tools/config/bootstrap-recover.ts:166-175`, `src/tools/config/bootstrap-init.ts:267-275`

**Cause:** Sequential `for...of` loops with sync I/O instead of `Promise.all` with async I/O.

**Improvement path:** Batch independent I/O operations with `Promise.all`. This is especially impactful for bootstrap-recover which scans multiple directories.

## Fragile Areas

### Session Tracker Bootstrap Logic (1,035 LOC Monolith)

**Files:** `src/features/session-tracker/index.ts`

**Why fragile:** The bootstrap logic has three gates (SDK parentID → hierarchyIndex → pendingRegistry), each with its own failure mode. The fallback chain is complex and hard to test exhaustively. Any change to one gate can break the entire session classification.

**Safe modification:** Add new gates at the end of the chain, not in the middle. Write integration tests for each gate's failure mode.

**Test coverage:** Good unit coverage exists (`tests/features/session-tracker/`), but integration tests for race conditions are limited.

### Delegation Manager (504 LOC, 21 Imports)

**Files:** `src/coordination/delegation/manager.ts`

**Why fragile:** Imports from 8 different modules (`command-delegation`, `concurrency`, `completion`, `sdk-delegation`, `spawner`, `category-gates`, `session-api`, `runtime-policy`). Any change to one dependency can break the manager.

**Safe modification:** Use dependency injection for all external dependencies. The constructor pattern is already correct — maintain it.

**Test coverage:** `tests/lib/delegation-manager.test.ts` exists but may not cover all SDK vs command delegation paths.

### Plugin Composition Root

**Files:** `src/plugin.ts` (267 LOC)

**Why fragile:** Single point of failure for the entire harness. All tools, hooks, and features are wired here. A single error during initialization crashes the plugin.

**Safe modification:** Add try/catch around each tool registration and hook composition. Use feature flags to disable individual features at runtime.

**Test coverage:** `tests/plugins/plugin-lifecycle.test.ts` exists but limited scope.

### CLI Substrate

**Files:** `src/cli/` (5 commands: `doctor`, `init`, `recover`, `version`, `help`)

**Why fragile:** CLI commands perform filesystem mutations (symlink creation, directory creation, file writes) without transactional rollback on failure. Partial state can be left behind.

**Safe modification:** Implement a rollback mechanism for CLI commands that mutate the filesystem. Or use a dry-run mode to preview changes.

**Test coverage:** `tests/cli/` has tests for all commands but they use mocked filesystem operations.

## Scaling Limits

### In-Memory State Maps

**Issue:** `src/shared/state.ts` uses in-memory Maps for session state, delegation metadata, and subagent tracking. These maps grow unbounded for the lifetime of the plugin process.

**Files:** `src/shared/state.ts`

**Current capacity:** Limited only by available memory.

**Limit:** With thousands of sessions over a long-running plugin process, memory usage will grow linearly.

**Scaling path:** Implement periodic cleanup of completed/expired session entries. Add a configurable max-size with LRU eviction.

### Concurrency Queue

**Issue:** `src/coordination/concurrency/queue.ts` uses a single global queue for all delegation concurrency gating. No per-tenant or per-workspace isolation.

**Files:** `src/coordination/concurrency/queue.ts`

**Current capacity:** Configurable via `concurrencyLimit` env var (default: 3).

**Limit:** All sessions share the same queue. A burst of delegations from one session can starve others.

**Scaling path:** Implement per-session or per-workspace concurrency queues with fair scheduling.

## Dependencies at Risk

### bun-pty Optional Dependency

**Issue:** `bun-pty` is listed as a regular dependency but is only functional on Bun runtime. On Node.js, it will fail to load. The fallback to `node:child_process` is graceful but untested in CI.

**Files:** `package.json:50` (`"bun-pty": "^0.4.8"`), `src/features/background-command/pty/pty-runtime.ts`

**Risk:** If `bun-pty` introduces a breaking change or fails to install on Node, the background command feature degrades silently.

**Migration plan:** Move `bun-pty` to `optionalDependencies`. Add a CI matrix that tests on Node.js to verify the fallback path.

### @ast-grep/napi Native Module

**Issue:** `@ast-grep/napi` and `@ast-grep/cli` are native modules that require compilation. They may fail to install on platforms without build tools.

**Files:** `package.json:40-41`

**Risk:** Installation failures on Windows or systems without native build toolchains.

**Migration plan:** Verify that the project works correctly when `@ast-grep` fails to install. Add it to `optionalDependencies` if it's not critical.

### React as Runtime Dependency

**Issue:** React 19 is a runtime dependency (not devDependency) due to `@json-render/react` and `ink` usage. This pulls in the entire React runtime for a backend plugin.

**Files:** `package.json:61` (`"react": "^19.2.6"`)

**Risk:** Bundle size inflation. React is not needed for core harness functionality — only for the sidecar/CLI rendering.

**Migration plan:** Move React-dependent packages to optional dependencies. Lazy-load the rendering pipeline only when the CLI is invoked.

## Missing Critical Features

### No Structured Error Types

**Issue:** All 81 error throws use `new Error('[Harness] ...')` with string messages. There are no custom error classes (e.g., `HarnessValidationError`, `HarnessNotFoundError`). Callers cannot catch specific error types — they must parse error messages.

**Files:** Throughout `src/` (81 throw sites)

**Problem:** Error handling is string-matching, which is brittle and breaks on message changes.

**Fix approach:** Define a small set of error classes: `HarnessValidationError`, `HarnessNotFoundError`, `HarnessPermissionError`, `HarnessRuntimeError`. Update throw sites to use appropriate classes.

### No Request/Operation Tracing

**Issue:** No correlation IDs or request tracing across tool calls, hook executions, and delegation dispatch. When something goes wrong, there is no way to trace a single operation across the system.

**Problem:** Debugging production issues requires correlating timestamps across multiple log entries.

**Fix approach:** Add a correlation ID to each tool invocation. Propagate it through delegation packets and hook callbacks. Include it in all log output.

### No Rate Limiting on Tool Calls

**Issue:** The circuit breaker (`CIRCUIT_BREAKER_THRESHOLD`) tracks repeated signatures but does not implement rate limiting. A misbehaving agent can call tools at maximum frequency.

**Files:** `src/plugin.ts` (circuit breaker config), `src/hooks/guards/tool-guard-hooks.ts`

**Problem:** No protection against tool call storms or rapid-fire delegation.

**Fix approach:** Implement a token bucket or sliding window rate limiter per session. Configure via runtime policy.

## Test Coverage Gaps

### Steering Engine Feature

**What's not tested:** `src/features/steering-engine/` has source files (`steering-state.ts`, `types.ts`, schema, conditions, templates) but only one test file (`tests/features/steering-engine/injection-builder.test.ts`). The `conditions/` and `templates/` directories are empty in source but have test subdirectories.

**Files:** `src/features/steering-engine/steering-state.ts` (222 LOC), `src/features/steering-engine/types.ts` (3,784 bytes)

**Risk:** The steering engine is a new feature with minimal test coverage. Changes to steering state logic or injection conditions can break silently.

**Priority:** High — incomplete feature with source code but no functional tests.

### Sidecar Module

**What's not tested:** `src/sidecar/readonly-state.ts` has one test file (`tests/sidecar/readonly-state.test.ts`) but the sidecar is a critical contract surface between the harness and the GUI.

**Files:** `src/sidecar/readonly-state.ts`

**Risk:** The sidecar's read-only contract is enforced by code, not tests. Changes to the contract can break the GUI silently.

**Priority:** Medium — sidecar is read-only but critical for the GUI sidecar dashboard.

### Hook Observer Integration

**What's not tested:** The integration between hook observers (`src/hooks/observers/`) and their consumer modules. Individual observer tests exist but the full pipeline (event → observer → consumer → action) is not tested end-to-end.

**Files:** `src/hooks/observers/event-observers.ts`, `src/hooks/observers/session-tracker-consumer.ts`, `src/hooks/observers/delegation-consumer.ts`

**Risk:** Observer-consumer wiring errors are not caught by unit tests.

**Priority:** Medium — hook wiring is validated at plugin init but not tested independently.

### Schema Kernel Completeness

**What's not tested:** Not all schemas in `src/schema-kernel/` have dedicated test files. The `trajectory.schema.ts`, `session-tracker.schema.ts`, `tool-definition.schema.ts`, `mcp-server.schema.ts`, `doc-intelligence.schema.ts`, `bootstrap.schema.ts`, `command-frontmatter.schema.ts`, `command-engine.schema.ts`, `permission.schema.ts`, `skill-metadata.schema.ts`, `sdk-supervisor.schema.ts`, `runtime-pressure.schema.ts`, `config-precedence.schema.ts`, `agent-work-contract.schema.ts` schemas lack dedicated test files.

**Files:** 14 schema files in `src/schema-kernel/` without dedicated tests

**Risk:** Schema changes are not validated by tests. Invalid data can pass through unvalidated schemas.

**Priority:** Low — schemas are validated at runtime by Zod, but dedicated tests would catch regressions faster.

### PTY Integration on Node.js

**What's not tested:** PTY tests (`tests/lib/pty/`) run in an environment where `bun-pty` is available. The Node.js fallback path (`node:child_process`) is not tested.

**Files:** `src/features/background-command/pty/pty-runtime.ts:19` (null return when bun-pty unavailable)

**Risk:** The fallback path is untested and may have subtle bugs.

**Priority:** Medium — affects users running the harness on Node.js (the peer dependency requirement).

---

*Concerns audit: 2026-05-15*
