# Anti-Pattern Catalog

Complete catalog of anti-patterns detected during lifecycle integration
evaluation. Each anti-pattern has a severity, detection method, and evidence
requirement.

## Severity Levels

- **BLOCK**: Gate cannot pass. Fix required before proceeding.
- **WARN**: Gate passes but remediation recommended. Document in gate report.

---

## BLOCK-Level Anti-Patterns

### AP-01: WRITE FROM READ-SIDE

**Severity:** BLOCK
**Summary:** Hook handler calling `patchSessionContinuity()` outside documented exceptions.

**Detection:**
```
grep -n "patchSessionContinuity" src/hooks/
```
Any hit in hook files is a violation unless the hook is `tool.execute.after`
performing audit trail writes (documented exception).

**Evidence Required:**
- File path and line number of the call
- Hook name where the violation occurs
- Whether a documented exception applies

**Correct Pattern:** State writes belong in tools (write-side). Hooks observe
and react but do not mutate continuity state. The sole exception is
`tool.execute.after` writing audit events to the event tracker.

---

### AP-02: DIRECT SDK CALL FROM HOOK

**Severity:** BLOCK
**Summary:** Hook handler calling `client.session.create()`, `client.session.prompt()`,
or `client.session.abort()` directly.

**Detection:**
```
grep -n "client\.session\.\(create\|prompt\|abort\)" src/hooks/
```

**Evidence Required:**
- File path and line number
- Which SDK method is called
- Why the hook needs to create/modify sessions (it shouldn't)

**Correct Pattern:** Session creation goes through `delegationManager.dispatch()`
or `session-api.ts` wrappers from the write-side (tools). Hooks observe only.

---

### AP-03: MISSING DISPOSAL

**Severity:** BLOCK
**Summary:** Observer (CompletionDetector watcher, event listener) registered but
never cleaned up on session end or deletion.

**Detection:**
- Check `CompletionDetector` usage: every `watch()` call must have a matching
  `cancel()` in `handleSessionDeleted()` or equivalent cleanup path.
- Check event observer registration: observers added to the eventObservers
  array in plugin.ts must handle session deletion gracefully.

**Evidence Required:**
- Observer registration site (file:line)
- Cleanup path (or missing cleanup path)
- Affected session lifecycle phase

**Correct Pattern:** Every resource acquisition in a hook must have a
corresponding release in the session deletion handler.

---

### AP-04: SYNC BLOCK IN ASYNC HOOK

**Severity:** BLOCK
**Summary:** Synchronous I/O operations (fs.readFileSync, JSON.parse on large data,
CPU-heavy computation) in async hook handlers.

**Detection:**
```
grep -n "readFileSync\|writeFileSync\|JSON\.parse" src/hooks/
```
Review any hits for whether they run in the main hook handler path.

**Evidence Required:**
- File path and line number
- The synchronous operation and its estimated cost
- Whether it blocks the event loop

**Correct Pattern:** All I/O in hooks must be async. Use `fs.promises` or
delegate to a lib module that handles I/O asynchronously.

---

### AP-05: INVALID LIFECYCLE TRANSITION

**Severity:** BLOCK
**Summary:** Transitioning a session from a terminal state (completed, failed,
cancelled, error) to an active state.

**Detection:**
- Cross-reference transitions against `VALID_TRANSITIONS` in `src/lib/task-status.ts`
- Check `lifecycle-manager.ts` `handleEvent()` for state transitions from terminal phases

**Evidence Required:**
- The invalid transition (from_state → to_state)
- Where the transition is initiated
- Why it violates the state machine

**Correct Pattern:** Terminal states are absorbing. Once a session reaches
completed/failed/cancelled/error, it stays there. Check `isTerminal()` before
any transition attempt.

---

### AP-06: UNBOUNDED DELEGATION DEPTH

**Severity:** BLOCK
**Summary:** Delegation nesting depth exceeding `MAX_DELEGATION_DEPTH` (3 by default,
overridable via RuntimePolicy).

**Detection:**
- Check `nestingDepth` in `DelegationMeta` before dispatch
- Verify `delegation-manager.ts` enforces depth check before creating child session
- Search for any code path that bypasses `DelegationManager.dispatch()`

**Evidence Required:**
- The delegation chain showing depth > 3
- Where the depth check was bypassed
- The runtime policy in effect

**Correct Pattern:** `DelegationManager.dispatch()` checks `nestingDepth` against
`runtimePolicy.maxDelegationDepth ?? MAX_DELEGATION_DEPTH`. If exceeded, the
dispatch is rejected with a `[Harness]` error.

---

## WARN-Level Anti-Patterns

### AP-07: OBSERVER WITHOUT ERROR BOUNDARY

**Severity:** WARN
**Summary:** Event observer without try/catch wrapping.

**Detection:**
```
grep -A5 "async.*observer\|async.*=>.*event" src/hooks/ src/plugin.ts
```
Check if the function body has a try/catch.

**Evidence Required:**
- Observer function location
- Whether try/catch is present
- Potential failure modes

**Remediation:** Wrap observer body in try/catch. Hook failures must be silent.

---

### AP-08: STALE CONTINUITY CACHE

**Severity:** WARN
**Summary:** Continuity store cache (`storeCache` in `continuity.ts:26`) is a
module-level singleton that may become stale across multiple plugin loads.

**Detection:**
- Check if `loadStoreFromDisk()` is called on every read or only on first access
- Look for cache invalidation paths

**Evidence Required:**
- Where the stale read occurred
- When the cache was last refreshed
- Whether the data has changed externally

**Remediation:** Deep-clone-on-read pattern prevents mutation aliasing but
does not solve staleness. Consider cache TTL or explicit invalidation.

---

### AP-09: HARDCODED TIMEOUTS

**Severity:** WARN
**Summary:** Using hardcoded timeout values instead of adaptive polling constants
from `types.ts`.

**Detection:**
```
grep -n "setTimeout.*[0-9][0-9][0-9][0-9]" src/ --include="*.ts"
```
Exclude the constant definitions in `types.ts`.

**Evidence Required:**
- File path and line number of hardcoded timeout
- What constant should be used instead
- Why the hardcoded value is problematic

**Correct Pattern:** Use constants from `types.ts`:
`POLL_INTERVAL_ACTIVE_MS`, `POLL_INTERVAL_BASE_MS`, `POLL_INTERVAL_IDLE_MS`,
`POLL_INTERVAL_DEEP_IDLE_MS`, `DEFAULT_SAFETY_CEILING_MS`, `MIN_STABILITY_TIME_MS`.

---

### AP-10: CATEGORY MISMATCH

**Severity:** WARN
**Summary:** Delegation category not in `VALID_DELEGATION_CATEGORIES`.

**Detection:**
- Check category parameter in `delegationManager.dispatch()` calls
- Cross-reference against `VALID_DELEGATION_CATEGORIES` in `types.ts`

**Evidence Required:**
- The invalid category string
- Where it is passed
- What the valid alternatives are

**Correct Pattern:** Use one of: research, implementation, review,
visual-engineering, deep, quick. Category influences agent matching, queue key,
and notification routing.

---

### AP-11: ORPHANED DELEGATION

**Severity:** WARN
**Summary:** Delegation record with no active parent session.

**Detection:**
- Check delegations in `.hivemind/state/delegations.json` against active sessions
- Run `delegationManager.recoverPending()` and check for unresolved records
- Look for delegations with `status: "running"` but no child session in SDK

**Evidence Required:**
- Delegation ID
- Parent session status
- Child session status (or absence)
- How long the delegation has been in this state

**Remediation:** `recoverPending()` on startup handles most cases. For
persistent orphans, the grace period cleanup (`TASK_CLEANUP_DELAY_MS`: 10 min)
should resolve them.

---

### AP-12: IMPLICIT ANY FROM SDK

**Severity:** WARN
**Summary:** Using `client: any` parameter type instead of typed SDK client.

**Detection:**
```
grep -n "client.*any\|: any" src/lib/delegation-manager.ts
```

**Evidence Required:**
- File and line of the `any` type
- What the correct type should be
- Whether the SDK exports the type

**Note:** `client: any` in `delegation-manager.ts` is known tech debt from
the SDK. New code must not introduce additional `any` types.

---

### AP-13: CROSS-ROOT IMPORT

**Severity:** WARN
**Summary:** Module in `src/` importing from `.opencode/` or `.hivemind/`, or vice versa.

**Detection:**
```
grep -rn "from.*\.\./\.\./\.opencode\|from.*\.\./\.\./\.hivemind" src/
```

**Evidence Required:**
- The cross-root import path
- Source and target files
- Why the import exists

**Correct Pattern:** The three roots are isolated. `src/` is the hard harness
(TypeScript). `.opencode/` is soft meta-concepts (markdown). `.hivemind/` is
runtime state (JSON). No imports cross these boundaries.

---

### AP-14: MODULE OVER LOC LIMIT

**Severity:** WARN
**Summary:** Module exceeding 500 LOC threshold.

**Detection:**
```
find src/lib/ -name "*.ts" -exec sh -c 'lines=$(wc -l < "$1"); if [ "$lines" -gt 500 ]; then echo "$1: $lines lines"; fi' _ {} \;
```

**Evidence Required:**
- Module path and line count
- Which sections could be extracted
- Whether the module is approaching the split threshold

**Correct Pattern:** Extract responsibilities into focused sub-modules. See
`delegation-manager.ts` (494 LOC) as an example of a module that has already
extracted PTY logic, spawner logic, and persistence into separate files.
