# Test Persistence Leak: Delegation State Pollution

**Researched:** 2026-05-31
**Domain:** Test infrastructure / delegation persistence isolation
**Confidence:** HIGH

## Summary

Integration tests in `delegation-v2-integration.test.ts` write mock delegation records into the **real project workspace** `.hivemind/state/delegations.json` because the `DelegationStateMachine` always resolves its persistence path via `process.cwd()` with **no project root override** and **no test isolation mechanism**. Despite tests passing `persistDelegations: () => undefined` in the setup options interface, this parameter is **never consumed** by `setupDelegationModules()` — the state machine directly imports and calls the real `persistDelegations()` from `delegation-persistence.ts`.

When the plugin subsequently reloads, `recoverPending()` reads the stale mock delegations, finds records with `status: "running"`, attempts to recover them via `recoverSdkDelegation()`, and eventually produces spurious "delegation: builder failed" toast notifications after the 30-minute safety ceiling fires.

**A separate but related class: the test also writes through `recordSessionContinuity()` (used by the "replays pending notifications" test at line 249) directly into the real `.hivemind/state/session-continuity.json`.**

### Root Cause (one sentence)

`DelegationStateMachine.persistAll()` calls the real `persistDelegations()` with no project root argument, which resolves to `<process.cwd()>/.hivemind/state/` — the real project workspace — and no test fixture provides `OPENCODE_HARNESS_STATE_DIR`, `beforeAll`/`afterAll` cleanup, or a mock for the persistence function.

---

## File-by-File Trace

### 1. `src/task-management/continuity/delegation-persistence.ts`

**Lines 38-40:**
```typescript
function getDelegationStoreDirectory(): string {
  return dirname(getContinuityStoragePath())  // ← NO projectRoot argument
}
```

**Lines 54-56:**
```typescript
export function getDelegationsFilePath(): string {
  return join(getDelegationStoreDirectory(), "delegations.json")
}
```

**Lines 58-134 — `persistDelegations()`:**
- Writes to `getDelegationsFilePath()` — no project root → resolves to `<cwd>/.hivemind/state/`
- Always the REAL workspace (no env var check, no arg injection)

### 2. `src/task-management/continuity/index.ts`

**Lines 39-51 — `resolveContinuityFilePath()`:**
```typescript
function resolveContinuityFilePath(projectRoot?: string): string {
  const explicitFile = getEnvPath("OPENCODE_HARNESS_CONTINUITY_FILE")
  if (explicitFile) { return resolve(explicitFile) }

  const explicitStateDir = getEnvPath("OPENCODE_HARNESS_STATE_DIR")
  if (explicitStateDir) {
    return resolve(resolve(explicitStateDir), "session-continuity.json")
  }

  // Q6: canonical path is always .hivemind/state/ for writes
  return assertPathWithinRoot(getCanonicalStateDir(projectRoot), "session-continuity.json", "continuity state")
}
```

**Lines 23-26 — `getCanonicalStateDir()`:**
```typescript
export function getCanonicalStateDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd()
  return resolve(root, ".hivemind", "state")
}
```

**Key insight:** `OPENCODE_HARNESS_STATE_DIR` **only overrides the directory for session-continuity.json**, not for delegations.json directly. However, because `getDelegationStoreDirectory()` calls `dirname(getContinuityStoragePath())` to get the **parent directory**, and `getContinuityStoragePath()` checks `OPENCODE_HARNESS_STATE_DIR`, setting this env var WOULD redirect both files. But no test sets this.

### 3. `tests/integration/delegation-v2-integration.test.ts` (262 lines)

**Key observations:**

| Line(s) | Issue |
|---------|-------|
| 42, 55, 70, 80, 88, 98, 115, 150, 161, 172, 185, 203, 217 | Every `setupDelegationModules()` call passes `persistDelegations: () => undefined` — **this parameter is NEVER consumed by the function** |
| 42, 55, 70, 80, 88, 98, 115, 150, 161 | Each passes `projectDirectory: "/tmp/project"` — **this is NEVER used for persistence path resolution** |
| (none) | **No `beforeAll`/`afterAll`** block anywhere in the file |
| (none) | **No `process.env` override** for `OPENCODE_HARNESS_STATE_DIR` |
| (none) | **No `afterAll` cleanup** to delete `.hivemind/state/delegations.json` |
| 260 | `patchSessionContinuity(testSessionId, { pendingNotifications: [] })` — the **only** cleanup in the file, only for the specific test session |

**Test 1 (lines 40-52)** — The smoking gun:
```typescript
it("starts delegate-task through the SDK child-session starter", async () => {
    const modules = setupDelegationModules({ client: client as never,
      persistDelegations: () => undefined,   // ← dead parameter
      projectDirectory: "/tmp/project",       // ← unused for persistence
      recordCategoryGateask: () => true })
    // ... dispatches via SDK tool ...
    // Delegation gets status: "running" → persistAll() → writes to REAL delegations.json
    // NO handleCompletion() call — delegation stays "running" on disk
})
```

This test dispatches a delegation with status "running" and never transitions it to terminal. The real `persistAll()` in `DelegationStateMachine` writes it to `<project_root>/.hivemind/state/delegations.json`.

### 4. `tests/integration/user-install.test.ts` (78 lines)

**The existing correct pattern:**
```typescript
const PROJECT_ROOT = process.cwd()
const TMP_DIR = resolve(PROJECT_ROOT, "tests/integration/.tmp-user-install")

describe("E2E Integration — user install simulation", () => {
  beforeAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true })
    mkdirSync(TMP_DIR, { recursive: true })
  })

  afterAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true })
  })
```

This is the pattern the delegation test should follow but doesn't.

### 5. `src/coordination/delegation/state-machine.ts`

**Line 21:**
```typescript
import { persistDelegations } from "../../task-management/continuity/delegation-persistence.js"
```

**Lines 214-219 — `persistAll()`:**
```typescript
persistAll(): void {
    if (this.delegations.size > MAX_DELEGATIONS_BEFORE_PRUNE) {
      this.pruneCompletedDelegations()
    }
    persistDelegations(Array.from(this.delegations.values()))  // ← NO project root
}
```

Called from:
- `transition()` (line 247) — any status change
- `transitionToTerminal()` (line 289) — terminal transitions
- `registerDelegation()` indirectly (via `scheduleSafetyCeiling` → no, but via subsequent `transition()` calls)
- `pruneCompletedDelegations()` (line 394)
- `scheduleGracePeriodCleanup()` (line 331)
- `markCommandCancellationForPtySession()` (line 417)

**Every** delegation mutation writes to the real project file.

### 6. `src/coordination/delegation/manager-runtime.ts`

**Lines 317-341 — `recoverPending()`:**
```typescript
async recoverPending(): Promise<void> {
    for (const persistedDelegation of readPersistedDelegations()) {
      const delegation = { ...persistedDelegation }
      this.state.hydrateFromPersistence(delegation)
      if (delegation.status !== "running" && delegation.status !== "dispatched") continue
      // → recovers SDK/PTY delegations, or transitions to "error" for headless
```

Filters to only `running`/`dispatched` delegations. When it finds stale test records:
1. Calls `hydrateFromPersistence()` which loads into the in-memory map
2. For SDK delegations: calls `recoverSdkDelegation()` which tries `getSessionStatusMap()`
3. Since the mock child session doesn't exist, the SDK returns no status → catch block fires
4. Sets `delegation.error = "[Harness] Delegation unverified after restart; recovery will retry through safety ceiling."`
5. Schedules safety ceiling (30-minute timer)
6. After safety ceiling fires → `transitionToTerminal("timeout")` → generates "delegation: builder failed" toast

**Lines 92-119 — `recoverSdkDelegation()`** (from `handler.ts`):
```typescript
async recoverSdkDelegation(delegation: Delegation): Promise<void> {
    try {
      const statusMap = await Promise.race([
        getSessionStatusMap(this.client),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Recovery timeout")), 5000),
        ),
      ])
      const status = statusMap[delegation.childSessionId]
      if (!status?.type) {
        throw new Error("missing")           // ← mock sessions trigger this
      }
      // ... recovery success path ...
    } catch {
      delegation.error = RECOVERY_UNVERIFIED_ERROR
      this.callbacks.persistAllDelegations()
      this.callbacks.scheduleSafetyCeiling(delegation)  // ← 30-min timer armed
    }
}
```

### 7. `src/plugin.ts`

**Lines 382-397 — Plugin startup:**
```typescript
const delegationModules = setupDelegationModules({
    client,
    enableRuntimeAdapter: true,
    projectDirectory,
    ptyManager,
    runtimePolicy,
    ...
})
const delegationManager = delegationModules.delegationManager
// ...
void delegationManager.recoverPending()  // ← Line 397: fire-and-forget recovery
```

When the real plugin loads, it calls `recoverPending()` which reads the stale delegations.json.

### 8. `src/coordination/delegation/manager.ts`

**Lines 131-133 — Facade:**
```typescript
async recoverPending(): Promise<void> {
    await this.runtime?.recoverPending()
}
```

Simply delegates to `RuntimeDelegationManager.recoverPending()`.

---

## Full Call Chain (Flow Diagram)

```
[delegation-v2-integration.test.ts]
  │
  ├─ it("starts delegate-task through SDK...")
  │    └─ setupDelegationModules({ persistDelegations: () => undefined, projectDirectory: "/tmp/project" })
  │         └─ new DelegationStateMachine({ client })        ← NO projectRoot, NO mock
  │              └─ (state machine calls real persistDelegations())
  │
  ├─ tool.execute({ agent: "builder", ... })
  │    └─ DelegationManager.dispatch()
  │         └─ RuntimeDelegationManager.dispatch()
  │              └─ state.registerDelegation(delegation, true)
  │              └─ state.transition(delegation.id, "running")
  │                   └─ state.persistAll()
  │                        └─ persistDelegations(Array.from(this.delegations.values()))
  │                             ├─ getDelegationsFilePath()
  │                             │    └─ getDelegationStoreDirectory()
  │                             │         └─ dirname(getContinuityStoragePath())   ← NO ARGS
  │                             │              └─ getContinuityFile()              ← NO ARGS
  │                             │                   └─ resolveContinuityFilePath() ← NO ARGS
  │                             │                        └─ getCanonicalStateDir(undefined)
  │                             │                             └─ resolve(process.cwd(), ".hivemind", "state")
  │                             │                                  → /Users/.../hivemind-plugin-private/.hivemind/state/
  │                             └─ WRITE: delegations.json with { status: "running", childSessionId: "child-integration", ... }
  │
  │   [No handleCompletion() call → delegation stays "running" on disk]
  │
  ├─ (test suite ends — NO afterAll, NO cleanup)
  │
  ▼
[Plugin reload / next startup]
  │
  └─ HarnessControlPlane()  (line 397)
       └─ delegationManager.recoverPending()
            └─ RuntimeDelegationManager.recoverPending()
                 └─ readPersistedDelegations() → reads stale delegations.json
                      └─ { childSessionId: "child-integration", status: "running" }
                           └─ delegation.status === "running" → RECOVER
                                └─ hydrateFromPersistence()
                                └─ recoverSdkDelegation()
                                     └─ getSessionStatusMap() → empty (no real session)
                                     └─ throws "missing"
                                     └─ sets error = "Delegation unverified after restart"
                                     └─ scheduleSafetyCeiling(delegation)  ← 30 min
                                          └─ after 30 min → handleSafetyCeiling()
                                               └─ transitionToTerminal("timeout")
                                                    └─ notifyDelegationTerminal()
                                                         └─ → "delegation: builder failed"
```

## Secondary Leak: Continuity Records

The test at line 249 explicitly calls `recordSessionContinuity()` which bypasses any injection point:

```typescript
const { recordSessionContinuity, patchSessionContinuity } =
  await import("../../src/task-management/continuity/index.js")
recordSessionContinuity({ ... })
```

This writes directly to `<cwd>/.hivemind/state/session-continuity.json`. The test partially cleans up via `patchSessionContinuity(testSessionId, { pendingNotifications: [] })` at line 260, but **the continuity record itself remains** — only the `pendingNotifications` array is cleared.

## All Affected Files

| File | Role |
|------|------|
| `tests/integration/delegation-v2-integration.test.ts` | **Primary cause** — no isolation, no cleanup |
| `src/coordination/delegation/state-machine.ts` | Always calls real `persistDelegations()` with no injection point |
| `src/task-management/continuity/delegation-persistence.ts` | Always resolves path via `process.cwd()` — no env override option |
| `src/plugin.ts` (line 397) | Calls `recoverPending()` at startup on the real workspace |

## Remediation Options

### Option A: Add `beforeAll`/`afterAll` with Temp Dir + Env Var (Recommended)

**What:** Follow the pattern from `user-install.test.ts`:
- Create a temp dir in `beforeAll`
- Set `process.env.OPENCODE_HARNESS_STATE_DIR` to the temp dir
- Clean up in `afterAll`

**`setupDelegationModules` fix** (dead param): Also remove the unused `persistDelegations` parameter from `DelegationModuleSetupOptions` interface to prevent future confusion.

**Changes to `delegation-v2-integration.test.ts`:**
```typescript
import { rmSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

const PROJECT_ROOT = process.cwd()
const TMP_DIR = resolve(PROJECT_ROOT, "tests/integration/.tmp-delegation-persistence")

describe("delegation v2 plugin integration", () => {
  beforeAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true })
    mkdirSync(TMP_DIR, { recursive: true })
    process.env.OPENCODE_HARNESS_STATE_DIR = TMP_DIR
  })

  afterAll(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(TMP_DIR, { recursive: true, force: true })
  })
  // ... tests unchanged ...
})
```

**Tradeoffs:**
- ✅ Simple, follows existing pattern (`user-install.test.ts`)
- ✅ Env var `OPENCODE_HARNESS_STATE_DIR` already exists and is checked by `getContinuityStoragePath()`
- ✅ Catches BOTH the delegations.json leak AND the session-continuity.json leak
- ✅ Zero code changes to `src/` files (enforcing the "do not modify src/" constraint)
- ⚠️ Must ensure the env var is cleared in `afterAll` to prevent cross-test pollution
- ⚠️ The `persistDelegations: () => undefined` dead param remains but becomes harmless

**Additional:** Also remove the dead `persistDelegations` parameter from `DelegationModuleSetupOptions` in `src/plugin.ts` (but this is a `src/` file change, so only do it if not restricted).

### Option B: Inject Persistence into StateMachine + Test Mock

**What:** Add a `persistDelegations` callback to `DelegationStateMachineOptions`, defaulting to the real import. In tests, inject a no-op.

**Changes:**
1. `DelegationStateMachineOptions` in `state-machine.ts`: add optional `persistFn?: (delegations: Delegation[]) => void`
2. `DelegationStateMachine.persistAll()` uses `this.persistFn ?? realPersistDelegations`
3. In `setupDelegationModules()`, wire the real function
4. Tests now get isolation via the no-op injection

**Tradeoffs:**
- ✅ Proper dependency injection — no env var side effects in tests
- ✅ No cross-test pollution risk
- ❌ Requires modifying `src/` files (violates the "do not modify src/" constraint from the task prompt)
- ❌ More invasive than Option A
- ❌ Doesn't fix the `recordSessionContinuity()` leak (which is a direct import call, not through state machine)

### Option C: Check Session Existence in `recoverPending()` Before Recovery

**What:** Before attempting recovery, check if the child session actually exists by querying the SDK. If it doesn't exist, transition directly to terminal without safety ceiling.

**Tradeoffs:**
- ❌ Requires modifying `src/` files
- ❌ Doesn't prevent the file pollution — delegations.json still accumulates stale records
- ❌ Shift in responsibility (recovery should be robust but relying on it to clean up test pollution is wrong)
- ❌ 30-min safety ceiling timeout is a real production concern, not just a test issue

### Option D: Filter Out Test-Scoped Delegations by ID Pattern

**What:** Tests sometimes use delegation IDs with specific patterns. Add a filter in `recoverPending()` that skips delegations whose IDs start with a known test prefix.

**Tradeoffs:**
- ❌ Fragile — tests could use any ID format
- ❌ Requires maintaining an allowlist
- ❌ Doesn't prevent file pollution
- ❌ Requires modifying `src/` files

## Recommendation

**Option A** is the best remediation. Rationale:

1. **Zero `src/` changes** — complies with the "do not modify src/ files" constraint
2. **Follows existing pattern** — `user-install.test.ts` already demonstrates this approach
3. **Catches all leak vectors** — env var redirects both `delegations.json` and `session-continuity.json`
4. **Minimal test change** — ~10 lines added to the test file
5. **Removes the dead `persistDelegations` confusion** — Option A on its own doesn't remove the dead param, but it renders it harmless

### Additional Cleanup

After implementing Option A, also:
- Remove the unused `persistDelegations?: (delegations: Delegation[]) => void` from `DelegationModuleSetupOptions` in `src/plugin.ts` (line 248-249). This parameter exists in the interface but is never read by `setupDelegationModules()`. Every test passes `() => undefined` thinking it provides isolation, but the function body never uses it.

---

## Appendix: Verification Checklist

After applying Option A, verify:

- [ ] `npx vitest run tests/integration/delegation-v2-integration.test.ts` passes
- [ ] File `<project_root>/.hivemind/state/delegations.json` is empty `[]` after tests
- [ ] File `<project_root>/.hivemind/state/session-continuity.json` is clean (no mock records)
- [ ] No stale `.tmp-delegation-persistence` directories remain
- [ ] `npx vitest run tests/integration/user-install.test.ts` still passes (verify no cross-test pollution)
- [ ] Plugin startup produces no spurious "delegation: builder failed" toasts
