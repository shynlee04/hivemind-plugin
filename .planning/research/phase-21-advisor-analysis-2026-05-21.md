# Phase 21 Advisor Analysis: Sync I/O Async Conversion + Promise Hygiene

**Date:** 2026-05-21
**Analyst:** gsd-advisor-researcher
**Calibration tier:** standard
**Phase scope:** Convert ~159 sync fs calls to async in runtime code (src/), keep sync in CLI cold-start paths, add .catch() to fire-and-forget promises.

---

## Executive Summary

Phase 21 touches **10 source files** across 5 sectors with ~176 sync fs call sites. The conversion is non-trivial because several sync calls participate in **atomic write patterns** (write-to-temp + rename), **TOCTOU checks** (existsSync → readFileSync), and **plugin initialization** paths. The highest-risk surfaces are `bootstrap-init.ts` (30+ sync calls, tool-invoked not plugin-init), `continuity/index.ts` (atomic write + config-gated persistence), and `journal/index.ts` (appendFileSync on hot path via hooks). The `atomic-write.ts` module in session-tracker is already fully async and serves as the reference pattern.

**Key finding:** `bootstrap-init.ts` is a **tool entrypoint**, not a plugin cold-start path. Its `execute()` method is already `async`, and it calls `await bootstrapInit()`. The sync calls inside `bootstrapInit()` run during user-initiated tool invocation, not during plugin load. This means bootstrap-init.ts should be converted — it is NOT a cold-start exception.

The **real cold-start sync calls** are the fire-and-forget IIFE in `plugin.ts` (lines 290-318, legacy migration sentinel) — these are already wrapped in `void (async () => { ... })()` but use sync fs inside. These should stay sync OR be converted with proper `.catch()` since they run during plugin init and failure is non-fatal.

---

## Gray Area Decisions

| Decision | Options | Recommendation | Rationale |
|----------|---------|----------------|-----------|
| **1. Bootstrap-init.ts conversion** | A: Keep all sync (cold-start exception). B: Convert all to async (tool-invoked path). C: Convert write operations only, keep stat/checks sync. | **B — Convert all to async** | `bootstrapInit()` is called from an `async execute()` tool handler, not from plugin init. The function itself is already `async`. All 30+ sync calls (mkdirSync, writeFileSync, existsSync, symlinkSync, etc.) should convert to their async equivalents. No cold-start ordering risk exists because the tool runs after the plugin is fully initialized. |
| **2. Bootstrap-recover.ts conversion** | A: Keep sync (paired with bootstrap-init). B: Convert to async. | **B — Convert to async** | Same reasoning as bootstrap-init. `bootstrapRecover()` is a tool entrypoint, invoked asynchronously. No plugin-init ordering dependency. |
| **3. Atomic write pattern (continuity, delegation-persistence, trajectory)** | A: Keep sync writeFileSync+renameSync (atomic on POSIX). B: Convert to async writeFile+rename (same atomicity). C: Add write queue to serialize async writes. | **B — Convert to async, no queue needed** | POSIX `rename()` is atomic at the filesystem level regardless of sync/async caller. The atomicity guarantee comes from the OS, not the Node.js API. The existing unique temp file naming (`${filePath}.${process.pid}.${randomUUID()}.tmp`) prevents temp file collisions between concurrent async writes. A queue would add complexity without solving a real problem — the atomic rename already prevents corrupt reads. |
| **4. Journal appendFileSync (hot path via hooks)** | A: Keep appendFileSync (simple, blocks event loop briefly). B: Convert to async appendFile. C: Use atomic-write pattern (write-to-temp + rename). | **B — Convert to async appendFile** | `appendFileSync` blocks the event loop on every journal append, which fires on every lifecycle transition. Converting to `appendFile` unblocks the event loop. The idempotency key check (`existingIdempotencyKeys`) currently does a sync readFileSync before each append — this should also convert to async readFile. The TOCTOU gap (read keys → append) already exists in the sync version and is mitigated by idempotency keys, not by sync ordering. |
| **5. Session-patch tool sync writes** | A: Keep sync (user-triggered, rare). B: Convert to async. | **B — Convert to async** | Tool-invoked, already in async execute handler. No reason to block the event loop for file reads/writes during a tool call. |
| **6. Plugin.ts cold-start IIFE (legacy migration)** | A: Keep sync inside void IIFE. B: Convert to async with .catch(). C: Remove entirely (migration is one-shot, likely already done). | **A — Keep sync** | This is the ONLY genuine cold-start sync path. The IIFE runs during plugin init before any tool is available. Converting to async adds a fire-and-forget promise that could silently fail. The sync version is correct here: it runs once, completes before any tool invocation, and failure is logged but non-fatal. If the sentinel file exists (likely after first run), it returns immediately. |
| **7. Error handling strategy** | A: Generic Error for now, typed errors in Phase 22. B: Pre-emptively use typed errors. | **A — Generic Error for now** | Phase 22 owns typed errors. Mixing concerns would create merge conflicts and duplicate error type definitions. Use `Error` with `[Harness]` prefix convention (already established) for Phase 21. Phase 22 will retrofit typed error classes. |
| **8. Fire-and-forget promise hygiene** | A: Add .catch() to all unawaited promises. B: Use void + eslint rule. C: Convert to await where possible. | **A — Add .catch() to unawaited promises** | The plugin.ts IIFE pattern `void (async () => { ... })()` should get `.catch((err) => { void client.app?.log?.(...) })` for proper error routing. Same pattern applies to any other fire-and-forget promises discovered during conversion. |

---

## Risk Mitigations

### TOCTOU (Time-of-Check-Time-of-Use) Gaps

Several files use the pattern `existsSync(path) → readFileSync(path)` or `existsSync(path) → writeFileSync(path)`. Converting to async does not worsen these gaps — they exist in the sync version too. Mitigation strategies:

1. **Atomic write pattern** (continuity, delegation-persistence, trajectory): Already uses write-to-temp + rename. No TOCTOU risk on writes.
2. **Read-then-write** (journal idempotency check): The idempotency key check reads existing keys, then appends. Duplicate keys are prevented by the key check, not by sync ordering. Converting to async does not change this.
3. **Symlink creation** (bootstrap-init, bootstrap-recover): `existsSync(target) → lstatSync(target) → symlinkSync(target)`. The async equivalent has the same TOCTOU window. Acceptable because symlinks are idempotent — if a concurrent process creates the same symlink, the result is identical.

### Event Loop Blocking During Tool Execution

Current sync calls in tool handlers block the event loop for the duration of the fs operation. For `bootstrap-init.ts` which copies directories (`cpSync`) and creates many symlinks, this can block for hundreds of milliseconds. Async conversion eliminates this blocking entirely.

### Test Mock Compatibility

Existing tests mock `fs` module methods. Converting from sync to async requires updating mocks:
- `vi.mocked(fs.existsSync)` → `vi.mocked(fs.promises.access)` or `vi.mocked(fs.promises.stat)`
- `vi.mocked(fs.readFileSync)` → `vi.mocked(fs.promises.readFile)`
- `vi.mocked(fs.writeFileSync)` → `vi.mocked(fs.promises.writeFile)`

Tests that use `fs` (sync) mocks will need to switch to `fs/promises` mocks or use `vi.mocked(fs, { deep: true })` with both sync and async method stubs.

---

## Test Strategy Recommendations

### Files Requiring Test Updates

| Source File | Test File | Mock Changes Needed |
|-------------|-----------|---------------------|
| `src/tools/config/bootstrap-init.ts` | None (no dedicated test) | New test file needed — `tests/tools/bootstrap-init.test.ts` |
| `src/tools/config/bootstrap-recover.ts` | None (no dedicated test) | New test file needed — `tests/tools/bootstrap-recover.test.ts` |
| `src/task-management/continuity/index.ts` | `tests/lib/continuity.test.ts` | Update fs mocks from sync to async |
| `src/task-management/continuity/delegation-persistence.ts` | `tests/lib/delegation-persistence.test.ts` | Update fs mocks from sync to async |
| `src/task-management/trajectory/ledger.ts` | `tests/lib/trajectory/ledger.test.ts` | Update fs mocks from sync to async |
| `src/task-management/journal/index.ts` | `tests/lib/session-journal.test.ts` | Update fs mocks from sync to async |
| `src/tools/session/session-patch/tools.ts` | `tests/tools/session-patch.test.ts` | Update fs mocks from sync to async |

### Test Pattern for Async fs Mocks

```typescript
// Before (sync mock)
vi.mocked(existsSync).mockReturnValue(true)
vi.mocked(readFileSync).mockReturnValue('{}')

// After (async mock)
vi.mocked(fs.promises.access).mockResolvedValue(undefined)
vi.mocked(fs.promises.readFile).mockResolvedValue('{}')
```

### New Tests Required

1. **bootstrap-init.test.ts**: Test that `bootstrapInit()` correctly creates directories, writes configs, and establishes symlinks using async fs operations. Verify atomic write pattern for schema refresh.
2. **bootstrap-recover.test.ts**: Test that `bootstrapRecover()` correctly repairs broken symlinks using async fs operations.
3. **Journal async idempotency test**: Verify that concurrent async journal appends with the same idempotency key do not produce duplicate entries.

---

## Go/No-Go Assessment for Phase 21

### GO — with conditions

**Conditions:**
1. **bootstrap-init.ts and bootstrap-recover.ts MUST convert to async** — they are tool entrypoints, not cold-start paths. Keeping them sync would be a missed optimization with no safety benefit.
2. **plugin.ts cold-start IIFE MUST stay sync** — this is the only genuine cold-start path. Converting it introduces unnecessary async complexity during plugin init.
3. **Atomic write pattern MUST preserve write-to-temp + rename** — do not replace with direct async writeFile. The atomicity guarantee is critical for crash safety.
4. **New tests for bootstrap-init and bootstrap-recover MUST be created** — these files currently have zero test coverage. Phase 21 is the right time to add it.
5. **All existing tests MUST pass after mock updates** — no test should be skipped or deleted to accommodate the async conversion.

**Risk level:** MEDIUM
- Primary risk: Test mock updates across 7 test files. Each requires careful verification that the async mock behavior matches the original sync behavior.
- Secondary risk: TOCTOU gaps in journal idempotency check. These exist in the sync version and are not worsened by async conversion, but should be documented.
- Tertiary risk: `cpSync` in bootstrap-init backup has no direct async equivalent in `fs/promises` before Node.js 22. For Node.js 20 compatibility, use `fs.promises.cp` (available in Node.js 22+) or a recursive copy helper.

**Estimated effort:** 10 source files, 7 test files, 2 new test files. Sequential conversion recommended: start with lowest-risk files (session-patch, journal), progress to highest-risk (continuity, delegation-persistence, bootstrap-init).
