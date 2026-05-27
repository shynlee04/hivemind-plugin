# Codebase Concerns

**Analysis Date:** 2026-05-28

This document catalogs every actionable concern discovered during deep scan of the `hivemind-plugin-private` codebase. Issues are organized by severity (P0–P2) with exact file:line references to enable direct navigation. Each concern includes impact assessment and recommended remediation.

---

## 1. Critical Issues (P0)

### 1.1 Duplicate Union Member in PermissionAction Type

- **File:** `src/shared/types.ts:42`
- **Code:** `export type PermissionAction = "allow" | "ask" | "ask"`
- **Impact:** The `"ask"` value is duplicated in the union, making it appear to have three valid states when there are only two. This is a silent TypeScript defect — no compiler error is raised, but downstream switch/if statements may have dead branches or incorrect narrowing. Any permission evaluation logic that checks `action === "ask"` works by coincidence but the intent is unclear (was a third action like `"deny"` intended?).
- **Fix:** Remove the duplicate: `export type PermissionAction = "allow" | "ask"`. Audit all `switch(action)` blocks in `src/tools/delegation/delegate-task.ts`, `src/coordination/spawner/agent-primitive-policy.ts`, and `src/config/compiler.ts` to verify they handle only the expected values.

### 1.2 Silent Error Swallowing via `.catch(() => {})`

- **Files:**
  - `src/features/session-tracker/capture/event-capture.ts:325` — `backfillChildTurnsFromSdk` errors silently discarded
  - `src/features/session-tracker/capture/event-capture.ts:373` — `appendAssistantTurn` errors silently discarded
  - `src/features/session-tracker/capture/event-capture.ts:443` — `backfillChildTurnsFromSdk` errors silently discarded
  - `src/features/session-tracker/capture/event-capture.ts:500` — `backfillChildTurnsFromSdk` errors silently discarded
  - `src/features/session-tracker/persistence/child-writer.ts:223` — Write queue errors silently discarded via `next.catch(() => {})`
  - `src/features/session-tracker/initialization.ts:151` — Recovery/orphan cleanup errors silently discarded
- **Impact:** These are fire-and-forget patterns where failures are completely invisible. In production, if `backfillChildTurnsFromSdk` or `appendAssistantTurn` consistently fail, the session-tracker will silently produce incomplete data with no observability signal. The child-writer queue at line 223 is particularly dangerous because it means failed writes vanish without entering the retry queue.
- **Fix:** Replace `.catch(() => {})` with `.catch((err) => { void client.app?.log?.({ body: { service: "session-tracker", level: "warn", message: `[Harness] <operation> failed`, extra: { error: err instanceof Error ? err.message : String(err) } } }) })` — at minimum log the error. For the child-writer queue at line 223, the catch is intentional (the error is already re-thrown at line 221 and captured by the retry queue), but the `catch(() => {})` on the queued promise should still log at debug level.

### 1.3 `ClientLike = any` Type Erasure in Session Tracker

- **File:** `src/features/session-tracker/initialization.ts:36-37`
- **Code:**
  ```typescript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ClientLike = any
  ```
- **Impact:** The entire session-tracker initialization module operates on a fully untyped client reference. This means any call to `this.client.app?.log?.(...)`, `this.client.session.*`, or any SDK surface method is unchecked at compile time. A typo in a method name or incorrect argument shape will only fail at runtime.
- **Fix:** Define a minimal `ClientLike` interface matching the actual SDK surface used by session-tracker (approximately: `{ app?: { log?: (entry: LogEntry) => void }; session?: { get: (...args: any[]) => Promise<unknown>; messages: (...args: any[]) => Promise<unknown> } }`). Remove the `eslint-disable` and `any` annotation.

---

## 2. Technical Debt (P1)

### 2.1 Type Safety Gaps — 12 `as any` Casts

**File group A: `src/tools/delegation/delegation-status.ts`**

| Line | Code | Reason |
|------|------|--------|
| 148 | `(childRecord.status as any)` | Status string cast to `any` for terminal kind mapping |
| 169 | `JSON.parse(raw) as any` | Manifest JSON parsed without schema validation |
| 174 | `child as any` | Manifest child entry untyped |
| 250 | `JSON.parse(raw) as any` | Second manifest parse without schema |
| 266 | `child as any` | Second manifest child untyped |
| 279 | `child as any` | Third manifest child untyped |
| 292 | `child as any` | Fourth manifest child untyped |

**File group B: `src/coordination/delegation/coordinator.ts`**

| Line | Code | Reason |
|------|------|--------|
| 92 | `(msg as any)?.info ?? msg` | SDK message shape not typed |
| 212 | `(m as any)?.info?.role ?? (m as any)?.role` | Dual fallback for role extraction |
| 216 | `(lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error` | Error shape not typed |
| 219 | `(errorField as any).message \|\| JSON.stringify(errorField)` | Error field type unknown |

**File group C: `src/shared/session-api.ts`**

| Line | Code | Reason |
|------|------|--------|
| 235 | `} as any))` | SDK showToast body shape mismatch |

- **Impact:** The hierarchy-manifest.json parsing in `delegation-status.ts` is the highest risk — a malformed manifest file will produce silently incorrect delegation status results because all field access goes through `any`. The coordinator `as any` casts on SDK message objects mean that if the SDK changes its message shape, the error only surfaces at runtime.
- **Fix:** Create a `HierarchyManifest` interface and a `ChildEntry` interface in `src/features/session-tracker/types.ts` and use them for all manifest parsing. For SDK message objects, create a `SdkMessageLike` type. Eliminate all 12 casts within one phase.

### 2.2 ESLint Suppressions

- `src/shared/session-api.ts:234` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
- `src/features/session-tracker/initialization.ts:36` — `eslint-disable-next-line @typescript-eslint/no-explicit-any`
- **Impact:** Two explicit eslint-disable comments reduce lint enforcement. The tsconfig has `noUnusedLocals` and `noUnusedParameters` set to `true` (strict mode), but `as any` bypasses all type safety that those rules provide.
- **Fix:** Resolve the underlying type mismatches (see 2.1 above) and remove both suppressions.

### 2.3 Module Size Violations (Max 500 LOC Rule)

| File | LOC | Limit | Over By |
|------|-----|-------|---------|
| `src/features/session-tracker/capture/event-capture.ts` | 1062 | 500 | +562 (112%) |
| `src/tools/session/execute-slash-command.ts` | 629 | 500 | +129 |
| `src/features/session-tracker/index.ts` | 622 | 500 | +122 |
| `src/features/session-tracker/persistence/child-writer.ts` | 603 | 500 | +103 |
| `src/tools/delegation/delegation-status.ts` | 590 | 500 | +90 |
| `src/plugin.ts` | 554 | 500 | +54 |
| `src/features/session-tracker/tool-delegation.ts` | 502 | 500 | +2 |
| `src/features/session-tracker/capture/tool-capture.ts` | 502 | 500 | +2 |
| `src/coordination/delegation/manager-runtime.ts` | 491 | 500 | — (within) |
| `src/tools/config/configure-primitive.ts` | 490 | 500 | — (within) |
| `src/coordination/delegation/coordinator.ts` | 481 | 500 | — (within) |
| `src/task-management/continuity/index.ts` | 467 | 500 | — (within) |

- **Impact:** `event-capture.ts` at 1062 LOC is the most severe — it handles `session.idle`, `session.error`, `session.deleted`, `session.next.text.ended`, `session.status`, SDK fallback logic, child session routing, backfill, and pending registry management all in one class. This makes it extremely difficult to test in isolation and nearly impossible to refactor safely.
- **Fix:** Extract event handlers into dedicated handler classes: `SessionIdleHandler`, `SessionErrorHandler`, `SessionDeletedHandler`. Extract SDK fallback logic into `SdkFallbackResolver`. Extract backfill logic into `BackfillService`. Target: `event-capture.ts` → 4 handler files averaging ~200 LOC each.

### 2.4 Deprecated Callback Pattern in `ChildWriter.enqueueWrite`

- **File:** `src/features/session-tracker/persistence/child-writer.ts:200-224`
- **Code:** The `enqueueWrite` method uses `.then().catch().then()` promise chaining and manually manages a `writeQueues` Map. Line 223: `this.writeQueues.set(queueKey, next.catch(() => {}))` — the queue entry is set to a promise that swallows errors.
- **Impact:** The queue chaining pattern is fragile: if the initial `current` promise is `undefined` (Map miss), it defaults to `Promise.resolve()`, but the subsequent `.catch()` on line 223 replaces the entry with a new chain that discards errors. This means if a write fails and is re-enqueued, the original error is lost from the queue tracking.
- **Fix:** Replace with a dedicated `SerialWriteQueue` class that exposes `enqueue(fn, retryData)` with proper error propagation and retry queue integration. The `SessionIndexWriter` has a similar pattern at `src/features/session-tracker/persistence/session-index-writer.ts:112-128`.

---

## 3. Security Concerns (P1)

### 3.1 Console Logging in Production Code

- **Files and Lines:**
  - `src/tools/session/execute-slash-command.ts:486` — `console.error(\`[Harness] session.command dispatch failed: ${message}\`)`
  - `src/tools/session/dispatch-command.ts:112` — `console.error(\`[Harness] Slash command dispatch failed: ${message}\`)`
  - `src/tools/session/resolve-command.ts:23` — `console.log(...)` (in JSDoc but actual code)
  - `src/features/session-tracker/persistence/retry-queue.ts:326` — `console.error(...)` with session ID and error details
  - `src/features/session-tracker/persistence/session-index-writer.ts:120` — `console.error(...)` with session ID
  - `src/features/session-tracker/persistence/session-index-writer.ts:225` — `console.warn(...)` with session ID
- **Impact:** Production `console.error`/`console.warn` output may include session IDs, file paths, delegation IDs, and error stack traces that could be captured by log aggregation systems or exposed in terminal output. The `dispatch-command.ts:112` case includes the full error message which may contain file paths from `node:fs` errors.
- **Fix:** Replace all `console.error`/`console.warn` in non-test code with the structured logger pattern: `void client.app?.log?.({ body: { service: "<module-name>", level: "warn", message: "[Harness] ..." } })`. For files that don't have access to the `client` reference, thread it through dependencies or use the existing `getConfig()` pattern for service-level logging.

### 3.2 Unsanitized Session ID in File Paths

- **Files:**
  - `src/features/session-tracker/index.ts:132` — `resolve(sessionTrackerRoot(this.projectRoot), sessionID, \`${sessionID}.md\`)`
  - `src/features/session-tracker/persistence/orphan-quarantine.ts:47` — `join(this.trackerRoot, sessionID)`
  - `src/features/session-tracker/persistence/orphan-quarantine.ts:60` — `join(this.quarantineDir, sessionID)`
  - `src/tools/delegation/delegation-status.ts:168` — `safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")`
- **Impact:** If a `sessionID` value containing `../` or absolute path segments is injected into the system (via a malicious or malformed delegation record), it could read or write files outside the expected directory tree. While session IDs are typically SDK-generated UUIDs, the codebase does not validate this assumption at the file I/O boundary.
- **Fix:** Add a `validateSessionId(id: string): boolean` utility that checks for `^[a-zA-Z0-9_-]+$` (no slashes, dots, or special characters) and call it before any file path construction that includes a session ID. Place the utility in `src/shared/helpers.ts`.

### 3.3 Synchronous `readFileSync` in Sidecar Module

- **File:** `src/sidecar/readonly-state.ts:93`
- **Code:** `return readFileSync(absolutePath, "utf8")`
- **Impact:** The sidecar module enforces read-only access, but uses blocking synchronous file I/O. If this is called from an async context (e.g., a Next.js route handler), it blocks the event loop. The `isCanonicalStatePath` guard at line 55 is also synchronous and relies on `path.relative()` which is safe from traversal, but the `readFileSync` at line 93 means a large file read blocks the entire thread.
- **Fix:** Add an async version `readCanonicalStateAsync` using `fs.promises.readFile` and prefer it in all async call sites. Keep the sync version as fallback for initialization contexts only.

### 3.4 Full `process.env` Spread in Governance Session Git Commit

- **File:** `src/features/governance-engine/create-governance-session.ts:114-117`
- **Code:**
  ```typescript
  execSync(
    `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
    { cwd, env: { ...process.env } },
  )
  ```
- **Impact:** The full `process.env` is passed to `execSync` for a git commit. While git itself doesn't read sensitive env vars, the `execSync` call could be intercepted or the environment could be logged. The `--no-verify` flag also bypasses git hooks, which may be intentional but removes an additional safety layer.
- **Fix:** Use a minimal env: `env: { ...process.env, GIT_AUTHOR_NAME: "HiveMind", GIT_AUTHOR_EMAIL: "hivemind@local" }` or better yet, extract git operations to a dedicated utility that doesn't inherit the full parent environment.

---

## 4. Performance Issues (P2)

### 4.1 Repeated JSON.parse Without Memoization

- **File:** `src/tools/delegation/delegation-status.ts:169,250`
- **Code:** `const manifest = JSON.parse(raw) as any` — called multiple times for the same `rootSessionId` when resolving children from both session-tracker and legacy persistence.
- **Impact:** When checking delegation status for a parent with many children, the same `hierarchy-manifest.json` file is read from disk and parsed multiple times. Each parse allocates new objects and triggers GC pressure.
- **Fix:** Add a per-invocation LRU cache keyed by `(projectRoot, rootSessionId)` that returns the parsed manifest. Clear after each tool execution. Alternatively, consolidate the two `getSessionTrackerChildren` and `getLegacyChildren` methods into a single method that parses the manifest once.

### 4.2 Synchronous File I/O in Bootstrap Init/Recover

- **Files:**
  - `src/tools/config/bootstrap-init.ts:1` — Uses `readFileSync`, `writeFileSync`, `mkdirSync`, `cpSync`, `rmSync`
  - `src/tools/config/bootstrap-recover.ts:1` — Uses `accessSync`, `cpSync`, `mkdirSync`, `renameSync`, `rmSync`
  - `src/tools/config/bootstrap-init.ts:113-136` — `mkdirSync` + `writeFileSync` in loops
- **Impact:** Bootstrap/init operations use entirely synchronous file system APIs. While these run once per session startup, they block the event loop during a critical initialization window. The `cpSync` at `bootstrap-init.ts:1` and `bootstrap-recover.ts:1` may copy entire directory trees synchronously.
- **Fix:** This is acceptable for CLI commands (`init`, `recover`, `doctor`) since they run synchronously by design. However, `bootstrap-init` is also registered as a plugin tool (line 56 of `plugin.ts`: `createBootstrapInitTool`). When invoked as a tool, it should use async APIs. Split the tool-exposed path to use `fs.promises`.

### 4.3 Unbounded Timer Accumulation in CompletionDetector

- **File:** `src/coordination/completion/detector.ts:35`
- **Code:** `private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()`
- **Impact:** Each `recordEvent` call (line 76) creates a new `setTimeout` for stability detection. If many delegations are active simultaneously, the `stabilityTimers` map grows without bound. The timer is only cleared in the `cancel` method (line 165) and the timeout handler (line 185). If a delegation's session events stop arriving (e.g., SDK connection drops), the timer for that delegation remains in memory until the 120s timeout fires.
- **Fix:** Add a `pruneStaleTimers(maxAgeMs: number)` method that removes timers older than `maxAgeMs` and call it periodically from the monitor loop.

### 4.4 `execSync` Blocking in Governance Session Creation

- **File:** `src/features/governance-engine/create-governance-session.ts:114`
- **Code:** `execSync(\`git add -A && git commit ...\`)`
- **Impact:** The governance session creation uses `execSync` for a git commit, which blocks the entire event loop during the git add + commit operation. In large repositories, this could take several seconds, blocking all other operations in the OpenCode runtime.
- **Fix:** Replace with `execFile` (async) from `node:child_process` and wrap in a try/catch that returns the error to the caller. Or use `simple-git` library for a non-blocking API.

---

## 5. Code Quality Issues (P2)

### 5.1 Empty Catch Blocks Hiding Real Errors

14 locations where `catch { }` or `catch { /* comment */ }` discards errors without logging:

| File | Line | Context |
|------|------|---------|
| `src/features/session-tracker/persistence/child-writer.ts` | 223 | Queue promise chain |
| `src/features/session-tracker/capture/event-capture.ts` | 325 | backfillChildTurnsFromSdk |
| `src/features/session-tracker/capture/event-capture.ts` | 373 | appendAssistantTurn |
| `src/features/session-tracker/capture/event-capture.ts` | 422 | session fetch failed |
| `src/features/session-tracker/capture/event-capture.ts` | 443 | backfillChildTurnsFromSdk |
| `src/features/session-tracker/capture/event-capture.ts` | 500 | backfillChildTurnsFromSdk |
| `src/features/session-tracker/initialization.ts` | 151 | Recovery/orphan cleanup |
| `src/tools/session/session-tracker.ts` | 105 | Unreadable child file |
| `src/tools/session/session-tracker.ts` | 107 | No hierarchy manifest |
| `src/tools/session/session-tracker.ts` | 311 | Skip unreadable |
| `src/tools/session/session-hierarchy.ts` | 280 | Fallback failed |
| `src/tools/session/session-context.ts` | 225 | Frontmatter optional |
| `src/coordination/delegation/state-machine.ts` | 441 | Abort session failure |
| `src/config/compiler.ts` | 359 | Rollback errors |

- **Impact:** These empty catches are categorized into two groups: (a) "acceptable" where the fallback is a read-only operation that failing is expected (e.g., `session-tracker.ts:105` — file doesn't exist yet), and (b) "concerning" where a write or critical operation fails silently (e.g., `event-capture.ts:373` — assistant turn append fails, `child-writer.ts:223` — queue error disappears). The concerning group means production data loss is possible without any signal.
- **Fix:** For the "acceptable" group, add a comment explaining why the error is intentionally discarded. For the "concerning" group, add `console.warn` or structured logging. Minimum target: zero silent catches on write operations.

### 5.2 Inconsistent Error Shape Handling

- **File:** `src/coordination/delegation/coordinator.ts:212-219`
- **Code:**
  ```typescript
  const role = (m as any)?.info?.role ?? (m as any)?.role
  // ...
  const errorField = (lastAssistantMessage as any)?.info?.error ?? (lastAssistantMessage as any)?.error
  if (errorField) {
    const errorMsg = typeof errorField === "object" && errorField !== null
      ? ((errorField as any).message || JSON.stringify(errorField))
      : String(errorField)
  ```
- **Impact:** This triple-fallback pattern (`info.role ?? role`, `info.error ?? error`, `error.message || JSON.stringify(error)`) indicates the SDK message shape has changed at least once, and the code has been patched with new fallbacks rather than updating the old code. The `JSON.stringify(errorField)` fallback at line 219 means that if the error is a complex object, the stringified version is used as the error message — potentially producing very long, unhelpful error strings.
- **Fix:** Create a `SdkMessageShape` type union that covers all known SDK message formats. Use `zod` to validate at the boundary (the project already has `zod` as a dependency). Replace the chain with a single typed extraction.

### 5.3 Command Delegation Env Propagation (Partially Fixed)

- **File:** `src/coordination/command-delegation/handler.ts:375-381`
- **Code:** The `buildMinimalEnv` method now uses an allowlist: `const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]`
- **Status:** PARTIALLY FIXED. The allowlist is correct and safe for the `buildMinimalEnv` path. However, the `doctor.ts:244` still passes `{ ...process.env, CI: "true" }` to `spawnSync` — acceptable for a diagnostic tool but not for production delegation paths.
- **Remaining risk:** The `create-governance-session.ts:116` still passes `{ ...process.env }` to `execSync` (see concern 3.4 above).

---

## 6. Architectural Fragility (P2)

### 6.1 Session Tracker as a God Module

- **Files:** `src/features/session-tracker/` (entire directory, 6+ files exceeding 500 LOC)
- **Why fragile:** The session-tracker handles event capture, child session routing, backfill from SDK, hierarchy indexing, persistence (write queues, retry queues, orphan quarantine), and recovery — all tightly coupled. A change to event capture (`event-capture.ts:1062 LOC`) risks breaking persistence (`child-writer.ts:603 LOC`) because they share the same `pendingRegistry`, `sessionIndexWriter`, and `childWriter` references.
- **What could break:** Adding a new event type (e.g., `session.message.updated`) requires modifying `event-capture.ts` which is already over capacity. The event handler methods (`handleSessionIdle`, `handleSessionError`, `handleSessionDeleted`) each have 100+ LOC with 5-10 `await` calls and multiple catch blocks.
- **How to improve:** Apply the Single Responsibility Principle — extract each event handler into its own class, inject the shared writers via dependency injection, and reduce `event-capture.ts` to an event router that delegates to handler classes.

### 6.2 Delegation Status Tool Depends on Two Persistence Formats

- **File:** `src/tools/delegation/delegation-status.ts` (590 LOC)
- **Why fragile:** The tool reads delegation status from both the new session-tracker format (`hierarchy-manifest.json`) and the legacy persistence format (`delegations.json`). Each format has different JSON shapes, parsed via `as any`. The tool also has a third code path for direct delegation records.
- **What could break:** If either persistence format changes shape, the `as any` casts silently produce incorrect delegation status. There is no integration test that validates the end-to-end flow from delegation creation → persistence → status read.
- **How to improve:** Create a `DelegationStatusReader` interface with two implementations: `SessionTrackerStatusReader` and `LegacyPersistenceStatusReader`. Add Zod schemas for each format and validate at the boundary.

### 6.3 Plugin.ts as Monolithic Composition Root

- **File:** `src/plugin.ts` (554 LOC)
- **Why fragile:** This file imports 60+ modules and wires them together. Adding a new tool requires modifying this file, which increases merge conflict risk and cognitive load. The `deps` object at line 377 is a single mega-object with 12+ properties.
- **What could break:** The order of initialization matters (e.g., `delegationManager.setCompletionDetector` at line 328 must happen after lifecycle manager creation at line 306). Reordering any initialization step can break the runtime.
- **How to improve:** Group tool registrations by domain (delegation, session, config, hivemind) into separate `registerXxxTools()` functions. Group hook factories similarly. Reduce the `deps` object to domain-specific sub-objects.

---

## 7. Test Coverage Gaps (P2)

### 7.1 Untested Core Modules

| Module | Source Files | Tests | Risk |
|--------|-------------|-------|------|
| `src/hooks/guards/governance-block.ts` | 1 file | None | **High** — governance blocking logic is untested |
| `src/hooks/lifecycle/core-hooks.ts` | 1 file | None | **High** — core lifecycle hooks untested |
| `src/hooks/lifecycle/session-hooks.ts` | 1 file | None | **High** — session event handling untested |
| `src/hooks/observers/event-observers.ts` | 1 file | None | **Medium** — observer factories untested |
| `src/hooks/observers/session-entry-consumer.ts` | 1 file | None | **Medium** — session entry consumer untested |
| `src/hooks/observers/session-main-consumer.ts` | 1 file | None | **Medium** — session main consumer untested |
| `src/hooks/observers/delegation-consumer.ts` | 1 file | None | **Medium** — delegation consumer untested |
| `src/hooks/observers/session-tracker-consumer.ts` | 1 file | None | **Medium** — session tracker consumer untested |
| `src/hooks/transforms/tool-after-workflow.ts` | 1 file | None | **Medium** — workflow transform untested |
| `src/hooks/composition/cqrs-boundary.ts` | 1 file | None | **Low** — boundary guard untested |
| `src/config/compiler.ts` | 1 file | `tests/lib/config-compiler.test.ts` | **Low** — has tests |

### 7.2 Total Coverage Gap Analysis

- **Source files:** 228 TypeScript files in `src/`
- **Test files:** ~203 test files in `tests/`
- **Estimated source files without direct test coverage:** ~80-100 files
- **Highest risk untested paths:**
  1. All hooks modules (`src/hooks/`) — 0 test files for 10+ source files
  2. `src/coordination/spawner/` — only 3 of 7+ files have tests
  3. `src/features/governance-engine/` — only 2 test files for 4+ source files
  4. `src/task-management/journal/` — only `journal-query.test.ts` and `journal-replay.test.ts` cover 4 source files

### 7.3 Missing Integration Tests for Session Tracker Race Conditions

- **Context:** The existing CONCERNS.md documents BUG-3 and BUG-5 fixes in the session-tracker (race conditions in child session registration and SDK message fallback).
- **File:** `src/features/session-tracker/tool-delegation.ts:276,332,348` — race condition fixes
- **File:** `src/features/session-tracker/persistence/session-index-writer.ts:222` — BUG-5 fix
- **Risk:** These fixes are verified by unit tests but lack integration tests that exercise the full delegation → event capture → persistence → status read flow with timing-dependent operations.
- **Fix:** Create `tests/integration/session-tracker-race-conditions.test.ts` that uses `vi.useFakeTimers()` to simulate concurrent `session.idle` and `recordChildTaskDelegation` events.

---

## 8. Dependency Concerns (P2)

### 8.1 `bun-pty` in dependencies (not optionalDependencies)

- **Package:** `bun-pty@^0.4.8` listed under `dependencies` in `package.json:44`
- **Risk:** `bun-pty` is a Bun-specific PTY library. The project targets `node >= 20.0.0` (package.json:94). While the runtime gracefully falls back to headless `node:child_process` (per AGENTS.md Phase 16.2.1), `bun-pty` in `dependencies` means `npm install` on Node will attempt to install it and may fail or produce warnings. The type declarations at `src/features/background-command/pty/bun-pty.d.ts` exist to handle this, but it's a fragile arrangement.
- **Fix:** Move `bun-pty` from `dependencies` to `optionalDependencies` in `package.json`. This is already the intent per the AGENTS.md documentation but was not reflected in the actual manifest.

### 8.2 `bun-types` in dependencies

- **Package:** `bun-types@^1.3.14` listed under `dependencies` in `package.json:45`
- **Risk:** `bun-types` provides TypeScript types for Bun-specific APIs. It should be a devDependency (used only at compile time for type-checking), not a runtime dependency. Shipping it in the published npm package increases install size unnecessarily.
- **Fix:** Move `bun-types` from `dependencies` to `devDependencies`.

### 8.3 Zod v4 Upgrade

- **Package:** `zod@^4.4.3` in `package.json:48`
- **Risk:** The project uses Zod v4 which is a major version upgrade from v3. While the codebase has been updated, some patterns like `z.prettifyError(parsed.error)` at `src/tools/delegation/delegate-task.ts:35` are Zod v4-specific. If the Zod team introduces breaking changes in v4.x minor releases, multiple schema files would need updates.
- **Fix:** Pin to a specific minor version (e.g., `zod@~4.4.3`) instead of using caret range. The `stack-l3-zod` skill documents the full v4 API for reference.

### 8.4 Peer Dependency Alignment

- **Package:** `@opencode-ai/plugin@^1.15.10` as both peer and dev dependency, `@opencode-ai/sdk@^1.15.10` as a dependency
- **Risk:** The peer dependency version must match the host OpenCode version. If a user installs Hivemind with an older OpenCode version that has a different SDK surface, the `as any` casts in `coordinator.ts` (see 2.1) will mask the incompatibility at compile time but fail at runtime.
- **Fix:** Add a runtime version check in `plugin.ts` that validates the SDK version matches expectations at initialization time.

---

## 9. Priority Summary

| # | Issue | Severity | Effort | Files Affected |
|---|-------|----------|--------|----------------|
| 1.1 | Duplicate PermissionAction union member | P0 | XS | `src/shared/types.ts` |
| 1.2 | Silent error swallowing `.catch(() => {})` | P0 | S | `src/features/session-tracker/capture/event-capture.ts`, `child-writer.ts`, `initialization.ts` |
| 1.3 | `ClientLike = any` type erasure | P0 | M | `src/features/session-tracker/initialization.ts` |
| 2.1 | 12 `as any` casts (type safety gaps) | P1 | L | `delegation-status.ts`, `coordinator.ts`, `session-api.ts` |
| 2.2 | ESLint suppressions | P1 | S | `session-api.ts`, `initialization.ts` |
| 2.3 | Module size violations (8 files >500 LOC) | P1 | L | `event-capture.ts`, `execute-slash-command.ts`, `index.ts`, `child-writer.ts`, etc. |
| 2.4 | Fragile promise chain in ChildWriter | P1 | M | `src/features/session-tracker/persistence/child-writer.ts` |
| 3.1 | Console logging in production code | P1 | S | `execute-slash-command.ts`, `dispatch-command.ts`, `retry-queue.ts`, `session-index-writer.ts` |
| 3.2 | Unsanitized session ID in file paths | P1 | S | `session-tracker/index.ts`, `orphan-quarantine.ts`, `delegation-status.ts` |
| 3.3 | Synchronous readFileSync in sidecar | P1 | S | `src/sidecar/readonly-state.ts` |
| 3.4 | Full process.env spread in governance git commit | P1 | S | `src/features/governance-engine/create-governance-session.ts` |
| 4.1 | Repeated JSON.parse without memoization | P2 | S | `delegation-status.ts` |
| 4.2 | Synchronous FS in bootstrap-init tool | P2 | M | `bootstrap-init.ts` |
| 4.3 | Unbounded timer accumulation | P2 | S | `src/coordination/completion/detector.ts` |
| 4.4 | execSync blocking in governance session creation | P2 | S | `src/features/governance-engine/create-governance-session.ts` |
| 5.1 | 14 empty catch blocks | P2 | S | `event-capture.ts`, `child-writer.ts`, `session-tracker.ts`, etc. |
| 5.2 | Inconsistent error shape handling | P2 | M | `src/coordination/delegation/coordinator.ts` |
| 6.1 | Session tracker god module | P2 | XL | `src/features/session-tracker/` |
| 6.2 | Dual persistence format dependency | P2 | L | `src/tools/delegation/delegation-status.ts` |
| 6.3 | Plugin.ts monolithic composition | P2 | L | `src/plugin.ts` |
| 7.1 | Untested hooks modules (0 coverage) | P2 | L | `src/hooks/` (10+ files) |
| 7.2 | ~80-100 source files without tests | P2 | XL | Various |
| 7.3 | Missing integration tests for race conditions | P2 | M | `src/features/session-tracker/` |
| 8.1 | bun-pty in dependencies (not optional) | P2 | XS | `package.json` |
| 8.2 | bun-types in dependencies (should be dev) | P2 | XS | `package.json` |
| 8.3 | Zod v4 pinned with caret range | P2 | S | `package.json` |
| 8.4 | No runtime SDK version validation | P2 | S | `src/plugin.ts` |

**Legend:** XS = <1 hour, S = 1-4 hours, M = 4-8 hours, L = 1-3 days, XL = 3+ days

---

*Concerns audit: 2026-05-28*
