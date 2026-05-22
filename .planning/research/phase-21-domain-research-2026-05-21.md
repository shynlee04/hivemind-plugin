# Phase 21 Domain Research: Sync I/O Async Conversion + Promise Hygiene

**Date:** 2026-05-21
**Phase:** 21 — Sync I/O Async Conversion + Promise Hygiene
**Scope:** Convert ~159 sync filesystem calls to async in runtime paths; fix fire-and-forget promises lacking `.catch()` handlers
**Target:** Reduce to ~30 remaining sync calls (kept in CLI cold-start paths: `bin/`, `bootstrap-init.ts`, `bootstrap-recover.ts`)

---

## Executive Summary

Phase 21 addresses two systemic technical debt items in the Hivemind npm package:

1. **Sync filesystem calls in hot paths** — 159 sync `*Sync` calls across 12 source files in `src/`, blocking the event loop during delegation dispatch, session recovery, journaling, and continuity persistence. These occur in code paths that execute on every tool call, every session lifecycle event, and every delegation state transition.

2. **Fire-and-forget promises** — 10+ unhandled promise rejections across `plugin.ts`, `state-machine.ts`, `coordinator.ts`, and `notification-router.ts`. These are intentional (must not block plugin init) but lack `.catch()` handlers, meaning failures are silently swallowed and never logged or surfaced to operators.

The conversion is high-impact because it touches the **durable state layer** — continuity store, delegation persistence, journal, trajectory ledger — which are the foundation of session recovery and cross-session continuity. Incorrect conversion can introduce race conditions during startup, corrupt atomic writes, or break bootstrap ordering.

---

## Affected Features & User Workflows

| Feature | Source Files | Sync Calls | User Workflows Affected | Stakes |
|---------|-------------|------------|------------------------|--------|
| **Continuity Store** | `src/task-management/continuity/index.ts` | 6 (`existsSync`, `readFileSync`, `mkdirSync`, `writeFileSync`, `renameSync` ×2) | Session recovery, cross-session state persistence, lifecycle hydration, pending notification drain | **Critical** — every session depends on this |
| **Delegation Persistence** | `src/task-management/continuity/delegation-persistence.ts` | 7 (`existsSync`, `readFileSync`, `mkdirSync` ×2, `writeFileSync`, `renameSync` ×2) | Delegation dispatch recovery, WaiterModel completion tracking, cross-session delegation records | **Critical** — broken delegation = orphaned child sessions |
| **Session Journal** | `src/task-management/journal/index.ts` | 4 (`existsSync`, `readFileSync`, `mkdirSync`, `appendFileSync`) | Audit trail, event replay, lifecycle event logging, compliance evidence | **High** — gaps break audit trail |
| **Journal Query** | `src/task-management/journal/query.ts` | 2 (`existsSync`, `readFileSync`) | Journal tool read-side, session-journal-export tool, replay analysis | **Medium** — read-only, non-blocking |
| **Trajectory Ledger** | `src/task-management/trajectory/ledger.ts` | 5 (`existsSync`, `readFileSync`, `mkdirSync`, `writeFileSync`, `renameSync`) | Execution lineage tracking, parent-child session trees, evidence references | **High** — lineage gaps break trajectory tool |
| **Plugin Init (Migration)** | `src/plugin.ts` | 5 (`existsSync` ×3, `mkdirSync`, `writeFileSync`) | One-shot legacy directory migration (CP-ST-03), plugin startup diagnostics | **Low** — runs once, fire-and-forget |
| **Session-Patch Tool** | `src/tools/session/session-patch/tools.ts` | 5 (`existsSync`, `mkdirSync`, `readFileSync`, `writeFileSync` ×2) | Agent-driven session file patching with backup creation | **Medium** — tool-execution path, user-facing |
| **Configure-Primitive Tool** | `src/tools/config/configure-primitive.ts` | 3 (`existsSync`, `mkdirSync`, mixed with `fs.promises`) | Agent/command/skill compilation, primitive file I/O | **Medium** — config-time, not hot-path |
| **Bootstrap-Init Tool** | `src/tools/config/bootstrap-init.ts` | ~30 (`existsSync` ×12, `mkdirSync` ×5, `writeFileSync` ×3, `readFileSync` ×3, `readdirSync` ×2, `unlinkSync` ×2, `cpSync`, `symlinkSync`, `lstatSync`, `readlinkSync`, `accessSync`) | Project initialization, `.hivemind/` directory layout, symlink creation, version tracking | **Low** — cold-start CLI path, keep sync |
| **Bootstrap-Recover Tool** | `src/tools/config/bootstrap-recover.ts` | ~12 (`mkdirSync`, `existsSync` ×3, `readdirSync`, `unlinkSync`, `symlinkSync`, `readlinkSync`, `lstatSync`, `accessSync`) | Symlink repair, primitive recovery, broken link detection | **Low** — cold-start CLI path, keep sync |
| **Primitive Loader** | `src/features/bootstrap/primitive-loader.ts` | ~6 (`existsSync` ×5, mixed with `fs.promises`) | Primitive scanning at config-time, agent/command/skill discovery | **Low** — already uses `fs.promises` for reads, `existsSync` only for directory checks |
| **Sidecar Read-Only State** | `src/sidecar/readonly-state.ts` | 1 (`readFileSync`) | Sidecar dashboard rendering of `.hivemind/state/` and `.planning/` | **Low** — read-only, infrequent |
| **Workspace Runtime Policy** | `src/shared/workspace-runtime-policy.ts` | 2 (`existsSync`, `readFileSync`) | Policy loading at plugin startup, concurrency/budget limits | **Medium** — runs once at init |
| **Path Scope Security** | `src/shared/security/path-scope.ts` | 3 (`existsSync` ×2, `realpathSync`) | Path containment checks for all tools, symlink escape prevention | **High** — security boundary, every tool call |
| **Hivemind Configs Schema** | `src/schema-kernel/hivemind-configs.schema.ts` | 4 (`existsSync`, `readFileSync`, `mkdirSync`, `writeFileSync`) | Config file read/write, defaults fallback, validation | **Medium** — config-time, not hot-path |
| **Prompt-Skim Tool** | `src/tools/prompt/prompt-skim/tools.ts` | 1 (`existsSync`) | File path verification in prompt analysis | **Low** — read-only check |

### Summary by Risk Tier

| Tier | Files | Sync Count | Recommendation |
|------|-------|-----------|----------------|
| **Convert to async** | continuity/index.ts, delegation-persistence.ts, journal/index.ts, journal/query.ts, trajectory/ledger.ts, session-patch/tools.ts, workspace-runtime-policy.ts, sidecar/readonly-state.ts, hivemind-configs.schema.ts | ~40 | These are runtime hot paths or read-side surfaces that benefit from non-blocking I/O |
| **Keep sync** | bootstrap-init.ts, bootstrap-recover.ts, primitive-loader.ts (existsSync only) | ~48 | Cold-start CLI paths, one-shot migrations, directory existence checks |
| **Evaluate case-by-case** | plugin.ts (migration block), path-scope.ts (realpathSync), configure-primitive.ts | ~11 | plugin.ts migration is intentionally fire-and-forget; path-scope realpathSync is security-critical; configure-primitive already uses mixed fs/promises |

---

## Risk Analysis (Ranked)

### 1. Atomic Write Race Conditions — **CRITICAL**

**Affected:** `continuity/index.ts` (lines 316-324), `delegation-persistence.ts` (lines 67-78), `trajectory/ledger.ts` (lines 69-77)

**Current pattern:** Write to temp file → `renameSync(tmp, target)`. This is atomic on POSIX because `rename()` is atomic when source and target are on the same filesystem.

**Risk:** Converting to `fs.writeFile()` + `fs.rename()` introduces a timing window. If two concurrent writes overlap (e.g., `persistStore()` called from `recordSessionContinuity()` and `patchSessionContinuity()` simultaneously), the second write may rename over the first write's target before the first rename completes.

**Mitigation:** Use a write queue or serialization mutex per file path. The continuity store already has an in-memory cache (`store-cache.ts`) that acts as a single-writer buffer — leverage this to serialize writes. For delegation persistence, the `persistDelegations()` function is called from a single coordination path, so overlap risk is lower but not zero.

### 2. Startup Race Conditions — **HIGH**

**Affected:** `plugin.ts` (lines 244, 262, 276, 290), `workspace-runtime-policy.ts` (line 28)

**Current pattern:** Plugin init fires multiple async operations without awaiting: `recoverPending()`, `replayPendingDelegationNotifications()`, `sessionTracker.initialize()`, legacy migration IIFE.

**Risk:** If `recoverPending()` reads `delegations.json` while the migration IIFE is still running (unlikely but possible), or if `sessionTracker.initialize()` reads continuity state before it's fully loaded, race conditions can produce stale or missing data.

**Mitigation:** Establish a startup dependency graph. `loadRuntimePolicy()` → `getSessionContinuity()` hydration → `recoverPending()` → `replayPendingNotifications()`. Each step must complete before the next begins, but the entire chain should not block plugin init (it can run as a single fire-and-forget promise chain).

### 3. Bootstrap Ordering — **MEDIUM**

**Affected:** `bootstrap-init.ts` (~30 sync calls), `bootstrap-recover.ts` (~12 sync calls)

**Current pattern:** These tools create directory structures, write `.gitkeep` files, create symlinks, and copy template files — all synchronously.

**Risk:** Converting these to async is low-risk because they are CLI tools invoked explicitly by users, not runtime hot paths. However, if any runtime code depends on bootstrap having completed (e.g., `primitive-loader.ts` scanning `.opencode/` dirs), async bootstrap could race with runtime reads.

**Mitigation:** Keep bootstrap-init and bootstrap-recover sync. They are cold-start paths where blocking the event loop for 10-50ms is acceptable and simpler than async complexity.

### 4. Path Scope Security Boundary — **MEDIUM**

**Affected:** `path-scope.ts` (lines 74, 97 — `existsSync`, `realpathSync`)

**Current pattern:** `realpathSync()` resolves symlinks to verify path containment. This is a security boundary check that runs on every tool call.

**Risk:** Converting `realpathSync` to async would require every tool to await path validation, adding latency to every tool execution. The security check must be synchronous to fail fast.

**Mitigation:** Keep `path-scope.ts` sync. The `realpathSync` calls are fast (filesystem metadata, not data I/O) and the security boundary requires synchronous enforcement. The `existsSync` calls in this file are also acceptable to keep — they check for root existence, not data reads.

### 5. Journal Append Ordering — **LOW**

**Affected:** `journal/index.ts` (lines 110, 117 — `mkdirSync`, `appendFileSync`)

**Current pattern:** `appendFileSync()` writes one JSONL line per event. The file is opened, written, and closed on each call.

**Risk:** Converting to `fs.appendFile()` is safe because JSONL append operations are inherently sequential — each line is independent. The only risk is if two concurrent appends interleave, but `appendFile()` on the same file path is serialized by the OS.

**Mitigation:** Use `fs.appendFile()` with no additional synchronization. The idempotency key check (`existingIdempotencyKeys()`) reads the full file before each append, so it should also be converted to async.

---

## Fire-and-Fire Promise Audit

### plugin.ts — 8 fire-and-forget promises

| Line | Promise | Purpose | Risk | Current Handling |
|------|---------|---------|------|-----------------|
| 223 | `client?.app?.log?.()` | Startup diagnostic log | Low — logging is best-effort | `void` prefix, no `.catch()` |
| 244 | `delegationManager.recoverPending()` | Recover pending delegations at startup | **High** — if recovery fails, orphaned delegations are never resumed | `void` prefix, no `.catch()` |
| 262 | `replayPendingDelegationNotifications(client)` | Drain queued delegation notifications | Medium — missed notifications reduce UX but don't break state | `void` prefix, no `.catch()` |
| 276-287 | `sessionTracker.initialize().then(...).catch(...)` | Init session tracker + cleanup | Low — has `.catch()` handler | ✅ Properly handled |
| 290-318 | IIFE `(async () => { ... })()` | Legacy event-tracker migration | Low — one-shot migration, errors logged | Inner try/catch, outer `void` |
| 300, 309, 340, 368 | `client.app?.log?.()` | Various warning/info logs | Low — logging is best-effort | `void` prefix, no `.catch()` |
| 436 | `void fact` | Unused return from tool-after hook | None — intentional discard | ✅ Intentional |

**Verdict:** Line 244 (`recoverPending()`) is the highest-risk fire-and-forget. If delegation recovery fails silently, child sessions that were mid-execution when OpenCode restarted will never resume. Add a `.catch()` that logs the failure and persists a recovery-failure flag to continuity.

### state-machine.ts — 3 fire-and-forget promises

| Line | Promise | Purpose | Risk | Current Handling |
|------|---------|---------|------|-----------------|
| 293 | `this.client.app?.log?.()` | State transition logging | Low | `void` prefix |
| 307 | `notifyDelegationTerminal(this.client, delegation)` | Parent session notification | **Medium** — if notification fails, parent never sees delegation result | `void` prefix, no `.catch()` |
| 314 | `setTimeout(() => { void this.handleSafetyCeiling(...) }, remaining)` | Safety ceiling timer callback | Low — timer callback, errors propagate | `void` prefix |

**Verdict:** Line 307 (`notifyDelegationTerminal`) should have a `.catch()` that falls back to persisting a pending notification record.

### coordinator.ts — 1 fire-and-forget promise

| Line | Promise | Purpose | Risk | Current Handling |
|------|---------|---------|------|-----------------|
| 358 | `this.deps.retryHandler.persistWithRetry(...)` | Persist delegation records with retry | **High** — if persistence fails, delegation state is lost | `void` prefix, no `.catch()` |

**Verdict:** This is the most critical fire-and-forget in the coordination layer. `persistWithRetry` is supposed to be resilient, but if all retries exhaust, the failure is silently swallowed. Add a `.catch()` that logs and sets an error flag on the delegation record.

### notification-router.ts — 1 fire-and-forget promise

| Line | Promise | Purpose | Risk | Current Handling |
|------|---------|---------|------|-----------------|
| 62-64 | `void (deliveryResult as Promise<boolean>).then(...).catch(...)` | Async notification delivery | Low | ✅ Has `.catch()` handler |

**Verdict:** Properly handled. The `.catch()` calls `finalizeDelivery()` with `delivered: false`, which queues a pending notification.

### manager-runtime.ts — 1 fire-and-forget promise

| Line | Promise | Purpose | Risk | Current Handling |
|------|---------|---------|------|-----------------|
| 415 | `this.client.app?.log?.()` | Runtime adapter logging | Low | `void` prefix |

**Verdict:** Acceptable for logging.

---

## Phase Dependencies & Runway Impact

### Phase 21 enables:

1. **Phase 22 (Typed Error Hierarchy)** — Async I/O surfaces natural error boundaries (`ENOENT`, `EACCES`, `EEXIST`) that should be wrapped in typed error classes. Converting sync→async first establishes the error-handling surface that Phase 22 will classify.

2. **Phase 23 (Plugin Decomposition)** — A thinner `plugin.ts` with proper async init sequencing is a prerequisite for decomposing the composition root into smaller factory modules.

3. **Phase 24 (Module Split)** — Continuity and delegation persistence modules will grow when async I/O adds error handling, retry logic, and write serialization. Keeping them under 500 LOC may require splitting.

### Phase 21 depends on:

1. **Phase 20 (Dependency Cleanup)** — COMPLETE. Clean dependency tree ensures no sync calls come from removed packages.

2. **Phase 19 (Non-Destructive Audit)** — COMPLETE. Audit identified all sync call locations.

### Runway impact:

- Phase 21 is **non-blocking** for Phase 22-25 but **foundational** — skipping it means Phase 22's typed errors will wrap sync throws instead of async rejections, creating an inconsistent error model.
- Estimated effort: 2-3 days of implementation + 1 day of test updates (all persistence tests mock `fs` and will need async mock updates).

---

## Recommendations for PLAN.md

### Conversion Strategy

1. **Serialize by module, not by call** — Convert all sync calls in one module at a time (e.g., `continuity/index.ts` first, then `delegation-persistence.ts`). This ensures internal consistency within each module.

2. **Preserve atomic write pattern** — Replace `writeFileSync(tmp) + renameSync(tmp, target)` with `await fs.writeFile(tmp) + await fs.rename(tmp, target)`. Do NOT collapse into a single `fs.writeFile(target)` — the rename is critical for crash safety.

3. **Add write serialization for continuity store** — The continuity store's in-memory cache (`store-cache.ts`) already acts as a single-writer buffer. Add a simple mutex (Promise-based queue) around `persistStore()` to prevent overlapping async writes.

4. **Keep these files sync:**
   - `bootstrap-init.ts` — Cold-start CLI tool
   - `bootstrap-recover.ts` — Cold-start CLI tool
   - `path-scope.ts` — Security boundary, `realpathSync` must be sync
   - `primitive-loader.ts` `existsSync` calls — Directory existence checks are fast and safe

5. **Fix fire-and-forget promises:**
   - Add `.catch()` to `delegationManager.recoverPending()` in `plugin.ts` (line 244)
   - Add `.catch()` to `notifyDelegationTerminal()` in `state-machine.ts` (line 307)
   - Add `.catch()` to `retryHandler.persistWithRetry()` in `coordinator.ts` (line 358)
   - All `.catch()` handlers should log via `client.app?.log?.()` and persist a failure flag

### Test Strategy

1. **Update all fs mocks** — Tests in `tests/lib/continuity.test.ts`, `tests/lib/delegation-persistence.test.ts`, and `tests/lib/delegation-manager.test.ts` use `vi.mock('node:fs')` with sync function mocks. These must be updated to mock `node:fs/promises` or use `vi.mocked(fs.promises)`.

2. **Add concurrency tests** — Write tests that trigger concurrent `persistStore()` calls and verify no data corruption occurs.

3. **Add fire-and-forget error tests** — Verify that `.catch()` handlers log failures and persist error flags when underlying promises reject.

### Risk Mitigation

1. **Feature flag the async conversion** — Add a config toggle `async_io: boolean` (default `false`) so the async path can be enabled incrementally. Fall back to sync if async fails.

2. **Add startup health check** — After async init completes, verify that continuity store, delegation persistence, and journal are all readable. If any fail, log a startup warning.

3. **Preserve sync fallback in bootstrap tools** — Bootstrap-init and bootstrap-recover should remain sync permanently. They are user-invoked CLI tools where blocking for 10-50ms is acceptable.

---

## Research Sources

- Source code audit: `grep -r "readFileSync\|writeFileSync\|existsSync\|mkdirSync\|renameSync\|appendFileSync" src/` — 159 matches across 12 files
- Fire-and-forget audit: `grep -r "void \|// fire" src/` — 230 matches, filtered to 14 relevant promises
- Architecture reference: `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority
- Sector guidance: `src/task-management/AGENTS.md`, `src/coordination/AGENTS.md`, `src/tools/AGENTS.md`
- Continuity sector: `src/task-management/continuity/AGENTS.md` — dual-layer state model
- Journal sector: `src/task-management/journal/AGENTS.md` — append-only audit trail
- Trajectory sector: `src/task-management/trajectory/AGENTS.md` — execution lineage
- Delegation sector: `src/coordination/delegation/AGENTS.md` — WaiterModel dispatch
- Config tools sector: `src/tools/config/AGENTS.md` — primitive configuration
- Bootstrap feature: `src/features/bootstrap/AGENTS.md` — primitive loading
