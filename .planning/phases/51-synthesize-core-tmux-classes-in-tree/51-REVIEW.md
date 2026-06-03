---
phase: 51-synthesize-core-tmux-classes-in-tree
reviewed: 2026-06-03T12:46:13Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/features/tmux/types.ts
  - src/features/tmux/grid-planner.ts
  - src/features/tmux/tmux-multiplexer.ts
  - src/features/tmux/session-manager.ts
  - src/features/tmux/integration.ts
consumers_cross_referenced:
  - src/plugin.ts
  - src/tools/tmux-copilot.ts
  - src/tools/tmux-state-query.ts
  - src/features/tmux/observers.ts
  - src/features/tmux/persistence.ts
  - tests/lib/tmux/integration.test.ts
  - tests/lib/tmux/session-manager.test.ts
  - tests/lib/tmux/tmux-multiplexer.test.ts
  - tests/lib/tmux/grid-planner.test.ts
  - tests/lib/tmux/tmux-copilot.test.ts
  - .planning/phases/51-synthesize-core-tmux-classes-in-tree/51-VERIFICATION.md
findings:
  critical: 5
  high: 6
  warning: 8
  info: 4
  total: 23
status: issues_found
---

# Phase 51: Code Review Report

**Reviewed:** 2026-06-03T12:46:13Z
**Depth:** standard (per-file read + cross-file consumer check + 100-test baseline verified passing)
**Files Reviewed:** 5 in-scope + 6 cross-referenced consumers
**Status:** **issues_found** — 5 critical, 6 high, 8 warning, 4 info

## Multi-Session Verdict

**Strict answer: NO.** The code creates **N panes within ONE tmux window**, not **N independent tmux sessions**.

Evidence:
- `src/features/tmux/tmux-multiplexer.ts:306-315` — `spawnPane` calls `tmux split-window -t <mainPaneId>` (always splits inside the current window; never `tmux new-session -d -s <name>`).
- `src/features/tmux/tmux-multiplexer.ts:152, 159` — `targetPane = process.env["TMUX_PANE"]` is captured once at construction; every `tmux list-panes`, `select-layout`, and `set-window-option` call is anchored to this single target via `targetArgs()` (line 216-218).
- `grep -rn "new-session\|new-window" src/features/tmux/` returns **zero** matches — the code never spawns a new tmux session or window.
- `src/features/tmux/integration.ts:345-426` — `createTmuxIntegrationIfSupported` constructs **exactly one** `TmuxMultiplexer` and **one** `SessionManager` per process; there is no API to instantiate a second integration.
- `src/features/tmux/types.ts:182-202` — `currentAdapter` is a single module-level slot; the bridge pattern is fundamentally **single-tenant**. A second `setSessionManagerAdapter` call OVERWRITES the first (line 192).

**Casual answer: PARTIAL.** Each sub-agent delegation produces its own visible tmux pane (a new horizontal split off the user's pane). The user *sees* multiple tmux windows in their terminal, but technically all panes share the same tmux session, the same window, and the same targetPane anchor.

**Production readiness:** The "open terminal → tmux → opencode → see panes" flow will work for the basic case (one sub-agent = one pane). The flow will **NOT** scale to N>3 sub-agents without visible degradation because every new pane is split off `pane_index=0`, and the layout is forced to `main-vertical` (60% main / 40% everything-else), which collapses for N>2 children. See CR-04 and WR-02 for details.

---

## Critical Issues

### CR-01: Module-level `currentAdapter` is fundamentally single-tenant

**File:** `src/features/tmux/types.ts:182-202`
**Issue:** The bridge stores exactly one `SessionManagerAdapter` in module-scope `let currentAdapter`. If a user runs two opencode processes (e.g., two projects), the second `setSessionManagerAdapter(adapter)` call OVERWRITES the first. After that, the first project's `tmux-copilot` tool calls resolve to the second project's multiplexer + session manager. The "publishes OVERWRITES a previously-stored adapter (replace-only semantics)" comment (line 178) acknowledges this but treats it as a feature, not a bug.
**Fix:** Either (a) document this as a hard constraint with a runtime guard that throws when the second call would displace a non-null adapter, or (b) key the bridge by some scope identifier (project directory, session id) and look up by scope at consumer time. Given the prompt's multi-session requirement, option (b) is the correct architecture.

### CR-02: Malformed persisted port file produces `http://localhost:0` URL

**File:** `src/features/tmux/integration.ts:379-395`
**Issue:** When the persisted port file exists but is malformed, `resolveOpencodeServerUrl` returns `null`. The factory then evaluates `serverUrl ?? \`http://localhost:${readOrMigratePort(projectDirectory) ?? 0}\`` (line 392). The second call to `readOrMigratePort` on a malformed file returns `null` again, producing the literal string `http://localhost:0`. Port 0 is reserved; `opencode attach http://localhost:0` will fail silently inside the spawned pane (the opencode CLI will reject the URL but the `split-window` already succeeded, leaving an orphaned empty pane that the harness cannot recover from).
**Fix:** When `resolveOpencodeServerUrl` returns null, the factory should treat this as a hard-fail and return `null` (D-04 silent fallback) — the same path it takes for missing binaries. Or, validate the fallback string and return null if port is `0` or out of range.

```ts
// Line 379-395 — proposed fix
const serverUrl = await resolveOpencodeServerUrl(projectDirectory);
if (serverUrl === null) {
  return skip("could not determine opencode server URL (malformed port file or no live server)");
}
```

### CR-03: Race condition in `handleSessionClose` — `sessions.delete` happens before `closePane`

**File:** `src/features/tmux/session-manager.ts:299-316`
**Issue:** Line 312 `this.sessions.delete(sessionId)` executes BEFORE line 314 `await this.multiplexer.closePane(paneId)`. Between the delete and the await resolution:
- A second `onSessionCreated` for the same sessionId passes the `if (this.sessions.has(sessionId))` check (line 168).
- The `spawningSessions` set is also empty (cleared in the `finally` block at line 232).
- The handler calls `multiplexer.spawnPane` which creates a NEW pane in tmux.
- Meanwhile, the in-flight `closePane` finishes (or times out) and runs `applyLayout` on a window that no longer has the tracked pane.
- Result: zombie pane in tmux + duplicate tracking, and the close's `applyLayout` may reorder the wrong window.

**Fix:** Move the `closePane` call BEFORE `sessions.delete`, and only remove from `sessions` after the close succeeds (or after a grace timeout). Or hold a "closing" sentinel in `sessions` so concurrent `onSessionCreated` events see the in-flight close.

```ts
// Line 299-316 — proposed fix
private async handleSessionClose(tracked: TrackedSession): Promise<void> {
  const { sessionId, paneId } = tracked;
  // Mark closing BEFORE delete so duplicate events are detected
  tracked.state = "failed";
  if (tracked.ageTimer !== null) {
    clearTimeout(tracked.ageTimer);
    tracked.ageTimer = null;
  }
  void this.persistence?.persist(this.toPersistedSession(tracked));
  // Delete from sessions FIRST to prevent duplicate close calls,
  // but track the in-flight close with the spawningSessions set.
  this.sessions.delete(sessionId);
  this.spawningSessions.add(sessionId); // reuse as "closing" marker
  try {
    await this.multiplexer.closePane(paneId);
  } finally {
    this.spawningSessions.delete(sessionId);
  }
}
```

### CR-04: `spawnPane` hardcodes `-h` (horizontal split) and always targets the same main pane

**File:** `src/features/tmux/tmux-multiplexer.ts:299-315`
**Issue:** Two related problems:
1. `split-window` is invoked with hardcoded `-h` (line 309). The `PaneGridPlanner` distinguishes `h` (depth 1) from `v` (depth 2+) (grid-planner.ts:75), but `spawnPane` IGNORES that direction. A multi-level tree plan from `computeSplitSequence` cannot actually be executed through `spawnPane`.
2. `splitTarget = await this.getMainPaneId()` (line 299) is called on every spawn. `getMainPaneId` returns the pane with `pane_index == 0` in the current window. If the user has manually split the window or if a previous `spawnPane` ran `applyLayout` and reordered the panes, index 0 may no longer be the user's terminal pane — it could be a child pane. Splitting off a child pane produces a child-of-child layout that diverges from the user's mental model.

The `getMainPaneId` call also runs `tmux list-panes` (a full execFile fork) on EVERY spawn — wasteful when many spawns happen back-to-back.

**Fix:**
1. Accept `direction: SplitDirection` as a parameter on `spawnPane` and forward it to `-h` / `-v`.
2. Cache the main pane ID at construction time OR allow the caller to pass an explicit target pane ID, overriding the index-0 lookup.
3. Skip `getMainPaneId` when `paneId` is already known (e.g., during a grid-plan replay).

### CR-05: `closePane` failure leaks tracked session in tmux

**File:** `src/features/tmux/session-manager.ts:314` + `src/features/tmux/tmux-multiplexer.ts:376-402`
**Issue:** `closePane` returns `false` on failure (e.g., pane already dead, tmux server gone). `handleSessionClose` ignores the return value (just logs at debug). The tracked record is removed from `sessions` regardless. The actual tmux pane may still exist on a remote tmux server, with the opencode `attach` process still running, consuming resources. No retry, no follow-up cleanup.
**Fix:** Implement exponential backoff for `closePane` (3 retries at 100/500/2000ms), and if all retries fail, log at `warn` level (not `debug`) so operators can see the leak. The harness should also expose a `closeAllTracked()` method for shutdown.

---

## High-Severity Issues

### HI-01: `applyLayout` after `closePane` always uses `targetArgs()` — affects wrong window

**File:** `src/features/tmux/tmux-multiplexer.ts:391-395` (closePane) and `src/features/tmux/tmux-multiplexer.ts:532-561` (applyLayout)
**Issue:** `closePane` calls `applyLayout(this.layout, this.mainPaneSize)` after the kill, but `applyLayout` uses `targetArgs()` (line 539) which is `-t <TMUX_PANE>` — anchored to the harness's pane. If the closed pane is in a DIFFERENT window (which it isn't today, but will be the moment CR-04 is fixed and multi-window support is added), the layout will be applied to the wrong window. The error is swallowed (line 393-395) so it never surfaces.
**Fix:** `applyLayout` should accept a `targetPane?: string` parameter and only fall back to `targetArgs()` when no explicit target is supplied.

### HI-02: `setTimeout(..., 250)` for layout re-apply is a zombie on early close

**File:** `src/features/tmux/session-manager.ts:215-219`
**Issue:** The 250ms post-spawn layout re-apply is scheduled with bare `setTimeout`. The handle is NOT stored on `tracked`. If `handleSessionClose` fires within 250ms (e.g., `maxSessionAgeMs` short-circuits, or a forced close path), the layout will re-apply for a now-closed pane. Worse, if the process exits before the timer fires, the timer is silently dropped (Node will GC it on process exit anyway, but in long-lived harnesses the timer holds the closure, preventing pane-related state from being GC'd).
**Fix:** Store the handle on `tracked` and clear it in `handleSessionClose`:

```ts
tracked.layoutTimer = setTimeout(() => { ... }, 250);
// In handleSessionClose:
if (tracked.layoutTimer !== null) {
  clearTimeout(tracked.layoutTimer);
  tracked.layoutTimer = null;
}
```

### HI-03: `respawnIfKnown` description field uses agent name, not session title

**File:** `src/features/tmux/session-manager.ts:272-278`
**Issue:** `description: tracked.agent` (line 274) passes the agent identifier (e.g., `"hm-orchestrator"`) as the pane description. In `spawnPane`, this string is used as the pane title (`tmux-multiplexer.ts:328, 343`). The result is every respawned pane has the title `hm-orchestrator` rather than a human-readable delegation title. Operators and the user cannot distinguish respawned panes.
**Fix:** Persist the original `title` on the `TrackedSession` record (it is available in the `onSessionCreated` event) and pass `description: tracked.title` in the respawn call. If no title is available, fall back to `\`[${tracked.agent}] ${tracked.delegationId.slice(0, 8)}\`` which matches the format `spawnPane` uses for `hivemindMeta`-stamped titles.

### HI-04: `loadOpencodeServerPort` validation diverges from `readOrMigratePort`

**File:** `src/features/tmux/integration.ts:113-126` vs `183-199`
**Issue:** `loadOpencodeServerPort` validates the port range (1..65535), rejects non-integers and zero. `readOrMigratePort` only checks `typeof data.port === "number"` — it accepts `port: -1`, `port: 99999`, `port: 0`, `port: 1.5`, etc. A user who manually edits `.hivemind/state/tmux-port.json` with a bad value (or a write race during a crashed process) will get the bad value returned, and subsequent `opencode attach http://localhost:<bad>` calls will fail.
**Fix:** Add the same `Number.isInteger` + range validation to `readOrMigratePort`. Return `null` (and log a warning) on invalid values.

```ts
// Line 122 — proposed fix
if (typeof data.port !== "number" || !Number.isInteger(data.port) || data.port < 1 || data.port > 65535) {
  return null;
}
```

### HI-05: Pane layout forced to `main-vertical` (60/40) — collapses for N>2 sub-agents

**File:** `src/features/tmux/integration.ts:387` and `src/features/tmux/tmux-multiplexer.ts:543-557`
**Issue:** `new TmuxMultiplexer("main-vertical", 60, ...)` (line 387) hardcodes the layout. For a `main-vertical` layout with 1 main pane + N child panes, all N children share 40% of the window width and stack vertically. For N=3 the visible area per child is ~13% of width × 33% of height — readable but cramped. For N>5 the children become unscrollable. The `applyLayout` call AFTER each spawn (line 350) re-applies this same 60/40 split, so the layout cannot be auto-improved as the count grows.
**Fix:** When N exceeds a threshold (e.g., N >= 3), switch to `tiled` or `even-vertical` via `applyLayout`. The threshold and fallback layout should be configurable in `SESSION_MANAGER_DEFAULTS` or a new `TMUX_LAYOUT` constant.

### HI-06: Duplicated `Logger` interface across two files

**File:** `src/features/tmux/tmux-multiplexer.ts:44-49` and `src/features/tmux/session-manager.ts:49-54`
**Issue:** The `Logger` interface (debug/info/warn/error) is declared verbatim in both files, with identical JSDoc comments noting the duplication. This is a clear DRY violation; any future shape change (e.g., adding a `trace` level) requires updating two files. The `integration.ts` also imports it: `import type { Logger } from "./tmux-multiplexer.js"` (line 32), creating an asymmetric import graph.
**Fix:** Move `Logger` to a shared `src/features/tmux/logger.ts` (or `src/shared/logger.ts` if it can be reused beyond tmux). Both modules import from the shared location. The inline comments already propose this future location.

---

## Warnings (Medium Severity)

### WR-01: `applyLayout` errors silently swallowed in two places

**File:** `src/features/tmux/tmux-multiplexer.ts:391-395` and `558-560`
**Issue:** Both call sites wrap `applyLayout` in `try { ... } catch { /* cosmetic */ }`. The "cosmetic" label is wrong: `applyLayout` failures can cause real user-visible bugs (pane won't resize, layout stays stuck). Logging at debug-only and never surfacing the error makes diagnosis hard. The persistence layer (`persistence.ts:294-323`) follows the same anti-pattern — see `gate-l3-evidence-truth` for why D-04 mirroring is NOT a free pass to lose observability.
**Fix:** Log at `warn` (not `debug`) when `applyLayout` fails. The "cosmetic" label in the comment is misleading and should be removed.

### WR-02: `applyLayout` called with `targetArgs()` cannot apply layout to a newly-spawned pane

**File:** `src/features/tmux/tmux-multiplexer.ts:350, 392, 538-541`
**Issue:** `spawnPane` returns the new `paneId` (line 320), but `applyLayout` is called with `targetArgs()` (anchored to `TMUX_PANE`, the user's terminal pane) — not the new pane. The layout is applied to the user's window, which is the same window the new pane is in, so this is correct in the single-window case. But the moment the code grows to support windows (the obvious next step toward true multi-session), the layout will be applied to the wrong window.
**Fix:** Same as HI-01 — accept an explicit `targetPane` parameter on `applyLayout`.

### WR-03: `closePane` 250ms `C-c` grace period is hardcoded and not configurable

**File:** `src/features/tmux/tmux-multiplexer.ts:382-383`
**Issue:** `await new Promise((r) => setTimeout(r, 250))` is hardcoded. Long-running opencode sessions (e.g., a delegation that takes 5 minutes) may not respond to `C-c` within 250ms — the kill-pane will race the inner cleanup, potentially leaving tmux in a state where the opencode process is detached but the pane slot is gone. Conversely, fast-running tests will pay the 250ms tax for every close.
**Fix:** Move the grace period to a constructor parameter with a sensible default (250ms), and document the trade-off.

### WR-04: Comments claim an EADDRINUSE retry path that does not exist

**File:** `src/features/tmux/integration.ts:97-103`
**Issue:** Comment says: "the second will silently fall back to a different port via the EADDRINUSE retry path in the tmux server bootstrap." No such retry path exists in the codebase. The integration just passes the hash-derived port to `opencode attach`. If two projects collide, both will fail to bind their opencode server on the same port. The comment is misleading documentation that will confuse future maintainers.
**Fix:** Either implement the retry path (probe a port, fall back on EADDRINUSE) or update the comment to say "no EADDRINUSE retry; the second project must configure a different `opencode.json` port".

### WR-05: `tmux-state-query.ts` actions return hardcoded placeholders

**File:** `src/tools/tmux-state-query.ts:151-170`
**Issue:** `list-sessions` returns `{sessions: []}` always; `get-session` returns `{session: null}` always; `get-summary` returns `{summary: {total: 0, active: 0, spawning: 0}}` always. The tool is registered as a real tool, the permission gate passes for orchestrator-tier agents, but the data is hardcoded. Operators will see `tmux-state-query` as a working tool but get no data.
**Fix:** Either (a) extend the `SessionManagerAdapter` contract to expose `listSessions()` / `getSession(id)` / `getSummary()` that delegate to the internal `SessionManager.sessions` map, or (b) remove the tool from registration until the implementation is complete. Today it ships a misleading UX.

### WR-06: Duplicated `readOrMigratePort` call in `integration.ts`

**File:** `src/features/tmux/integration.ts:379, 392`
**Issue:** `resolveOpencodeServerUrl` (line 379) calls `readOrMigratePort` internally; if it returns `null` the `??` chain on line 392 calls `readOrMigratePort` AGAIN. The second call is redundant on the success path and may return a different result on the failure path if the file changes between calls (TOCTOU race during a concurrent write).
**Fix:** Capture the port from `resolveOpencodeServerUrl`'s return (or expose a variant that returns the port separately), and use the captured value in the `??` chain.

### WR-07: `getMainPaneId` re-resolves on every spawnPane call

**File:** `src/features/tmux/tmux-multiplexer.ts:299`
**Issue:** Each `spawnPane` does `const splitTarget = await this.getMainPaneId();` (line 299), which runs `tmux list-panes` — a full process fork. For N back-to-back sub-agent spawns, this is N redundant execFile calls. The multiplexer already has `getBinary()` which caches the binary path; mainPaneId should be cached similarly.
**Fix:** Add `private cachedMainPaneId: string | null = null` and a `private mainPaneIdChecked: boolean = false`. Only re-resolve on the first call (or on an explicit `invalidateMainPaneId()` call when the window structure changes).

### WR-08: `loadOpencodeServerPort` has no caching — called twice in `resolveOpencodeServerUrl`

**File:** `src/features/tmux/integration.ts:183-199, 216-235`
**Issue:** The function is called on every plugin init AND on every port probe cycle. Reading the file synchronously (`readFileSync` + `JSON.parse`) is cheap but still has startup cost. If the file is large or on a slow disk, this can block the plugin init.
**Fix:** Cache the result with a short TTL (e.g., 5 seconds) at module scope. Invalidate on `persistPort` calls.

---

## Info (Low Severity)

### IN-01: Magic numbers not extracted to named constants

**File:** `src/features/tmux/tmux-multiplexer.ts:383` (250ms), `src/features/tmux/session-manager.ts:215` (250ms), `src/features/tmux/integration.ts:247` (5 probe ports), `src/features/tmux/integration.ts:258` (250ms timeout)
**Issue:** Numeric literals appear inline throughout the tmux code. Some are defined as `SESSION_MANAGER_DEFAULTS` (e.g., `maxSessionAgeMs`), but many are not. For maintainability, every "tunable" should be a named constant.
**Fix:** Move the post-spawn 250ms settle window to a `SESSION_MANAGER_DEFAULTS.postSpawnSettleMs` constant; move the `C-c` grace period to a `TmuxMultiplexer.closeGraceMs` constructor parameter with default 250; move the probe list and timeout to `PROBE_PORTS` + `PROBE_TIMEOUT_MS` exported constants.

### IN-02: `PaneGridPlanner` class implements `PaneGridPlannerInternal` but factory returns the wide type

**File:** `src/features/tmux/grid-planner.ts:48, 144-148`
**Issue:** The class declaration `export class PaneGridPlanner implements PaneGridPlannerInternal` (line 48) contradicts the comment at types.ts:102-104 which says the public contract is the narrow `PaneGridPlanner` interface (only `computeSplitSequence`). The factory `createDebouncedPaneGridPlanner` returns `PaneGridPlanner` (line 145-146), but the actual class has all the wide methods. Consumers who import the class directly (not the interface) get the wide type. This is a minor type-hygiene issue.
**Fix:** Either (a) declare the class as `implements PaneGridPlanner` (narrow) and have the factory cast on the way out, or (b) rename the class to `PaneGridPlannerImpl` and export a separate `PaneGridPlanner` type alias for the narrow contract. The current setup is confusing.

### IN-03: Test coverage gap for `tmux-state-query.ts` placeholder actions

**File:** `tests/lib/tmux/tmux-state-query.test.ts`
**Issue:** The test file exists (in `tests/lib/tmux/`) but the placeholder-returning actions (`list-sessions`, `get-session`, `get-summary`) are not tested for the placeholder behavior. The 100/100 test pass rate gives a false sense of completeness.
**Fix:** Add tests that assert the placeholder behavior is documented (or remove the tool until implementation is complete — see WR-05).

### IN-04: `splitTarget` only used in `spawnPane` — narrow scope, no caching

**File:** `src/features/tmux/tmux-multiplexer.ts:299-304`
**Issue:** `getMainPaneId` is invoked once per spawn, the result stored in `splitTarget`, then used to build `splitTargetArgs = ["-t", splitTarget]`. The same pattern could be hoisted to a `splitTargetArgs()` helper similar to `targetArgs()`. Also see WR-07 — caching would help.

---

## Production-Readiness Verdict

**Verdict: PARTIAL — usable for low-N sub-agent flows (1-3 concurrent), will visibly degrade for higher N, and does not match the strict "multiple tmux sessions" requirement.**

For the user's stated flow ("open terminal → tmux → opencode → see panes"):
- **Works:** Sub-agents spawn as panes in the current tmux window. The user sees new horizontal splits. The `tmux-copilot` tool can list panes, send keys, and respawn sessions.
- **Does not work:** Strict "multiple tmux SESSIONS" interpretation — every pane is in the same session, the same window, anchored to the same `TMUX_PANE`. There is no API or implementation path to spawn a separate `tmux new-session -d -s <name>`. If the user runs two opencode processes, the second's adapter OVERWRITES the first (CR-01).

For the single-opencode, single-project, low-N sub-agent use case, this code is production-ready modulo the bug fixes listed above (especially CR-02 and CR-03, both of which can cause user-visible failures today).

For the multi-session use case implied by the prompt, this code is **not** production-ready — the architecture would need a fundamental change (one multiplexer per session, no module-level singleton, no `targetArgs` anchoring).

## Test Baseline

- `npx tsc --noEmit`: **PASS** (0 errors)
- `npx vitest run tests/lib/tmux/`: **PASS** (10 files, 100 tests, 2.70s)
- BATS scenarios: not re-run in this review (covered by 51-VERIFICATION.md: 26/26)

All test claims in 51-VERIFICATION.md are honored at the unit-level. The bugs found above are NOT detected by the existing tests because:
1. The `http://localhost:0` edge case requires a malformed port file fixture (none exists).
2. The race condition in `handleSessionClose` requires a real-time two-event race (hard to test deterministically without a stress test).
3. The multi-session global state collision requires two `createTmuxIntegrationIfSupported` calls in the same process (the current tests reset module state in `beforeEach`).

These are L1 evidence gaps, not test misbehavior. The `51-VERIFICATION.md` is an L5 doc; it cannot prove runtime readiness for the scenarios listed above.

## Required-Fix Priority

| Priority | Finding | Why |
|----------|---------|-----|
| P0 | CR-02 (`http://localhost:0` URL) | Production failure in malformed-port-file edge case |
| P0 | CR-03 (close-then-spawn race) | Zombie pane, duplicate tracking, possible layout corruption |
| P0 | CR-04 (hardcoded `-h` + stale index 0) | Breaks multi-pane grid plans; silent layout divergence |
| P1 | CR-01 (module-level single-tenant) | Blocks the user's stated multi-session requirement |
| P1 | CR-05 (closePane leak) | Pane leaks in tmux on close failure |
| P2 | HI-01, HI-02 (layout target + zombie timer) | Required before multi-window support |
| P2 | HI-04, HI-05 (port validation + layout collapse) | User-visible degradation above N>3 |
| P3 | All WR-* and IN-* | Code hygiene, not blocking |

---

_Reviewed: 2026-06-03T12:46:13Z_
_Reviewer: the agent (gsd-code-reviewer, adversarial standard depth)_
_Depth: standard_
