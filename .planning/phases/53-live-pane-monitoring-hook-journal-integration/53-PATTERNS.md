# Phase 53: Live Pane Monitoring Hook + Journal Integration — Pattern Map

**Mapped:** 2026-06-02
**Phase:** 53 (P52 consumer hook + retroactive L1 paperwork on P42/P43)
**Files mapped:** 1 new source file (`src/hooks/pane-monitor.ts`) + 1 plugin.ts call site + 1 BATS scenario + 2 vitest files + 2 paperwork rewrites
**Analogs found:** 9/9 patterns sourced from in-tree code truth (no out-of-scope references)
**Composite risk:** 0.05 (GREEN-LIT, unchanged from locked `D-53-*` set in 53-CONTEXT.md)

---

## 1. Hook module shape — closest analog: `src/hooks/observers/event-observers.ts`

**Decision:** The new `src/hooks/pane-monitor.ts` follows the **factory + deps + return handle** pattern from `src/hooks/observers/event-observers.ts:18-38` and `src/hooks/observers/delegation-consumer.ts:26-41`, adapted for an **observer subscription** (P52 surface) rather than a Hivemind `eventObservers` array entry. The factory signature is `createPaneMonitorHook(opts: { sessionId: string; observer: TmuxEventObserver; journalRoot?: string; logWarn?: (msg, err) => void }): { dispose: () => void; counters: { written: number; retried: number; dropped: number } }` — same shape as `createDelegationEventObserver(): (input: { event?: unknown }) => Promise<DelegationEventFact>` but returns a teardown handle instead of an event fn.

### Code (canonical analog)
```typescript
// src/hooks/observers/event-observers.ts:18-38
export function createDelegationEventObserver(): (input: { event?: unknown }) => Promise<DelegationEventFact> {
  return async ({ event }) => {
    // ... event-type discrimination + side effects
  }
}
```

```typescript
// src/hooks/observers/delegation-consumer.ts:26-41
export function createDelegationConsumer(
  deps: DelegationConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    const fact = await deps.observer({ event })
    if (fact.kind === "delegation-session-idle") { deps.handleSessionIdle(fact.sessionId) }
    // ... discriminated union handling
  }
}
```

### Reuse for P53
- **P53 does NOT export a Hivemind event observer** (the hook is a CONSUMER of the P52-expanded `TmuxEventObserver`, not a producer of events for the `eventObservers` array). Therefore the factory returns `{ dispose, counters }` rather than `(input) => Promise<void>`.
- The `dispose` handle mirrors the `release()` pattern from `src/coordination/delegation/slot-manager.ts:75-81` (closure-captured cleanup callback), but for the pane-monitor case `dispose` removes the listener array entry that was pushed inside `observer.onPaneCaptured(...)` (D-53-12: pane-monitor only subscribes to `pane-captured`, not `session-state-changed`).
- JSDoc depth follows `delegation-consumer.ts:18-25` (full JSDoc on the factory + brief one-liner on private helpers per `AGENTS.md`).

---

## 2. Observer integration pattern — `createTmuxEventObserver()` + `.onPaneCaptured(cb)`

**Decision:** The P53 hook consumes events via the P52-expanded `src/features/tmux/observers.ts:123-205` `TmuxEventObserver` interface. Subscription is synchronous inside the factory constructor (NOT inside the `dispose` callback) — exactly matching the existing listener-registration pattern.

### Code (canonical)
```typescript
// src/features/tmux/observers.ts:89-103 — TmuxEventObserver interface
export interface TmuxEventObserver {
  (input: { event?: unknown }): Promise<void>;
  onSessionStateChanged: (cb: (event: SessionStateChangedEvent) => void) => void;
  onPaneCaptured: (cb: (event: PaneCapturedEvent) => void) => void;
}
```

```typescript
// src/features/tmux/observers.ts:201-203 — onPaneCaptured registration
observer.onPaneCaptured = (cb: (event: PaneCapturedEvent) => void): void => {
  paneCaptureListeners.push(cb);
};
```

```typescript
// src/features/tmux/observers.ts:151-162 — pane-captured dispatch (per-listener try/catch)
if (eventType === "pane-captured") {
  const payload = evt as unknown as PaneCapturedEvent;
  for (const listener of paneCaptureListeners) {
    try { listener(payload); } catch { /* swallow */ }
  }
  return;
}
```

### Reuse for P53
- `createPaneMonitorHook({ observer })` calls `observer.onPaneCaptured(handler)` synchronously inside the factory body. The handler captures the event payload in a closure for backoff (D-53-08: in-memory backoff state).
- `dispose()` is implemented by capturing the index of the pushed listener in `paneCaptureListeners` and splicing it out. Because the P52 observer's `paneCaptureListeners` is a private `Array<...>` (no `removeListener` API), the dispose implementation must either (a) hold a reference to the array indirectly via a teardown callback P53 wraps around the handler, OR (b) extend `TmuxEventObserver` with a `disposePaneListener` method (P53 explicitly does NOT mutate `observers.ts` per Out-of-Scope). The P53 planner should choose (a) — the handler itself sets a `disposed: boolean` flag, and the wrapper short-circuits when set; this avoids the need for a remove API on the observer. Verified in BATS: fire event after `dispose()`, assert journal file count unchanged (REQ-53-01 acceptance).
- The per-listener try/catch wrapping at `observers.ts:155-159` means the pane-monitor handler's own `setTimeout` retry chain cannot break the listener chain even if it throws — the catch swallows the throw and the next listener runs.

---

## 3. Hook registration in `src/plugin.ts` — composition root wiring

**Decision:** P53 wires the pane-monitor hook in `src/plugin.ts` at the **same call site** where `createTmuxEventObserver` is invoked (`src/plugin.ts:606-608`). The P53 factory receives the same `observer` instance and calls `.onPaneCaptured(...)` immediately. No new dependency injection bundle is needed — the existing `tmuxIntegration` and `client` objects in scope at line 417 and 391 are sufficient.

### Code (canonical — current P52 wiring)
```typescript
// src/plugin.ts:606-608 — current P52 observer wiring
...(tmuxIntegration
  ? [createTmuxEventObserver(tmuxIntegration.adapter)]
  : [createTmuxEventObserver(buildInTreeSessionManager())]),
```

The returned observer is **captured in a local variable** BEFORE being spread into the `eventObservers` array (see line 601: `eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, ...]`), so the P53 call site uses a `let` to bind the observer, then passes it to both the array spread and to `createPaneMonitorHook`:

```typescript
// P53 pattern (replaces src/plugin.ts:606-608)
const tmuxObserver = tmuxIntegration
  ? createTmuxEventObserver(tmuxIntegration.adapter)
  : createTmuxEventObserver(buildInTreeSessionManager())
// ... register pane-monitor hook with tmuxObserver
const paneMonitor = createPaneMonitorHook({ sessionId: /* injected */, observer: tmuxObserver, logWarn: ... })
// ... later in the array spread, include tmuxObserver as an event observer
```

### Reuse for P53
- The P53 hook factory call goes into the same `if/else` block that creates the tmux observer. P53's planner can either (a) add the `paneMonitor` creation immediately after the observer creation, or (b) inline both calls in a single IIFE. Either is valid; the existing plugin.ts style prefers the explicit `let` binding approach.
- REQ-53-01 acceptance requires **exactly 1 call site** in `src/plugin.ts` (or appropriate composition site). The grep test: `git grep createPaneMonitorHook src/` returns exactly 1 definition; `git grep -c createPaneMonitorHook src/plugin.ts` returns 1 call site.
- The pane-monitor factory needs a `logWarn` callback that wraps `client.app?.log?.({ body: { service: "pane-monitor", level: "warn", message, extra: { error: ... } } })` — exactly matching the `consumeSessionTrackerFact` injection at `src/plugin.ts:581-593`.

---

## 4. Journal write pattern — closest analog: `SessionWriter` + `atomicWriteJson`

**Decision:** The P53 hook writes `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json` using **`fs.writeFile(..., { flag: "wx" })`** (per REQ-53-02 acceptance — exclusive create, no clobber). The existing **canonical** in-tree write pattern is `atomicWriteJson` in `src/features/session-tracker/persistence/atomic-write.ts:33-56` (write-to-tmp + rename) used by `SessionWriter` in `src/features/session-tracker/persistence/session-writer.ts:48-52, 104-107`.

### Code (canonical — atomic write)
```typescript
// src/features/session-tracker/persistence/atomic-write.ts:33-56
export async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`
  const content = JSON.stringify(data, null, 2)
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, content, "utf-8")
  await rename(tmpPath, filePath)
  try { await unlink(tmpPath) } catch { /* best-effort */ }
}
```

```typescript
// src/features/session-tracker/persistence/atomic-write.ts:105-107
export async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}
```

### Reuse for P53
- **The REQ-53-02 SPEC mandates `fs.writeFile` with `flag: "wx"`** (exclusive create) — this is INTENTIONAL different from `atomicWriteJson`. P53 does NOT need the write-to-tmp + rename pattern because each event produces a unique filename (the ISO timestamp ensures no collisions within a single session). The `wx` flag is sufficient to guarantee no clobber of an existing entry.
- The `mkdir` recursive pattern (`fs.mkdir(dirPath, { recursive: true })`) IS reused — called once on first event to create `<journalRoot>/<sessionId>/`. Mirrors `SessionWriter.createSessionDir` at `session-writer.ts:48-52`.
- The JSON content is `JSON.stringify(entry, null, 2)` (matches `atomic-write.ts:38` for cross-tool jq readability).
- The 7-field shape per D-53-04: `{ schemaVersion, eventType, sessionId, paneId, contentLength, capturedAt, retryCount }`. **NOTE:** SPEC.md:34 says `schemaVersion` is `string "1.0"` and `contentPreview` is the 7th field; CONTEXT.md:50 (D-53-04) says `schemaVersion` is `number 1` and `retryCount` is the 7th field. **Planner must reconcile this discrepancy** — D-53-04 is the locked decision (per CONTEXT.md:55 "downstream agents MUST read 53-SPEC.md before planning" applies to SPEC, but CONTEXT.md locks the field name and type). The BATS acceptance test (`jq -r 'keys | length' <file>` returns `7` and `jq -r .eventType <file>` returns `"pane-captured"`) is type-agnostic on `schemaVersion`, so either shape passes — the planner should pick the CONTEXT-locked version (`retryCount: number 0`, `schemaVersion: number 1`) because it provides better post-hoc retry analysis (per D-53-04 rationale).
- Path-traversal protection follows `safeSessionPath` at `atomic-write.ts:141-170`: reject `sessionId` containing `/`, `\`, or `..` before path resolution. P53 must replicate this guard inline because the P53 hook is a consumer — it does NOT import `safeSessionPath` (which is session-tracker-internal).

---

## 5. File:write with backoff pattern — closest analog: `ChildWriteRetryQueue`

**Decision:** The P53 hook implements **5s → 10s → 30s exponential backoff with max 3 retries** (silent drop on 4th failure). The canonical in-tree backoff implementation is `ChildWriteRetryQueue` in `src/features/session-tracker/persistence/retry-queue.ts:97-364` with `BACKOFF_SCHEDULE_MS = [1000, 2000, 4000, 8000, 16000]` and `MAX_RETRIES = 5`.

### Code (canonical — setTimeout-based backoff)
```typescript
// src/features/session-tracker/persistence/retry-queue.ts:60-64
export const MAX_RETRIES = 5
export const BACKOFF_SCHEDULE_MS = [1000, 2000, 4000, 8000, 16000]
```

```typescript
// src/features/session-tracker/persistence/retry-queue.ts:182-202 — scheduleRetry
private scheduleRetry(sessionID: string): void {
  const record = this.records.get(sessionID)
  if (!record || record.status !== "pending") return
  const existing = this.timers.get(sessionID)
  if (existing) clearTimeout(existing)
  const backoffIndex = Math.min(record.attempt, BACKOFF_SCHEDULE_MS.length - 1)
  const delay = BACKOFF_SCHEDULE_MS[backoffIndex]
  const timer = setTimeout(() => {
    const promise = this.retryOnce(sessionID)
    this.pendingRetries.set(sessionID, promise)
    void promise.finally(() => { this.pendingRetries.delete(sessionID) })
  }, delay)
  this.timers.set(sessionID, timer)
}
```

```typescript
// src/features/session-tracker/persistence/retry-queue.ts:219-230 — max retries → mark degraded
if (record.attempt >= MAX_RETRIES) {
  record.status = "degraded"
  record.lastError = `Max retries (${MAX_RETRIES}) exhausted`
  this.timers.delete(sessionID)
  await this.persistDegradedRecord(record)
  if (this.onDegraded) { this.onDegraded(record) }
  return
}
```

### Reuse for P53
- P53 uses **`BACKOFF_SCHEDULE_MS = [5000, 10000, 30000]`** (3 entries; 5s + 10s + 30s) and **`MAX_RETRIES = 3`** (4 total attempts: 1 initial + 3 retries). P53 does NOT reuse `ChildWriteRetryQueue` because (a) that queue is a class with durable on-disk persistence, which is overkill for ephemeral per-event retry, and (b) P53 does not have access to the session-tracker module (would create an import cycle).
- The pattern is identical: closure-captured `setTimeout(() => retryOnce(event), delay)` where `delay` comes from the schedule array indexed by `attempt`. The retry handler **must not throw** (D-04 / D-53-10): catch in the `setTimeout` callback body, increment `counters.dropped` on the 4th failure, return silently.
- In-memory state per D-53-08: `Map<sessionId, { attempts: number; nextRetryAt: number }>`. The `attempts` counter indexes into the backoff schedule; the `nextRetryAt` is the wall-clock time after which the next retry is allowed (used by the rate-cap check to early-discard).
- The `waitForPendingRetries()` helper at `retry-queue.ts:348-351` is the pattern for the vitest test's `await promise` — P53's vitest should expose a `__waitForPendingRetries()` test seam (or just `dispose()` waits for in-flight timers) so the backoff test can assert counters synchronously.

---

## 6. Rate-limit / cap pattern — closest analog: `SlotManager` (simplified)

**Decision:** P53 enforces a **100-entries-per-session-per-hour cap** with UTC top-of-hour reset (D-53-06). No exact in-tree rate-limit pattern exists. The closest analog is `SlotManager` in `src/coordination/delegation/slot-manager.ts:33-107`, which uses a `Map<sessionId, Map<string, SlotHandle>>` and a per-session `maxSlotsPerSession` check. P53 simplifies this to a single `Map<sessionId, { hourEpoch: number; count: number }>` with the cap check inline.

### Code (canonical — per-session cap with Map)
```typescript
// src/coordination/delegation/slot-manager.ts:33-48
export class SlotManager {
  private readonly activeBySession = new Map<string, Map<string, SlotHandle>>()
  private nextSlotId = 0
  private readonly maxSlotsPerSession: number
  // ...
  constructor(options: SlotManagerOptions = {}) {
    this.maxSlotsPerSession = options.maxSlotsPerSession ?? 10
  }

  async acquire(sessionId: string, queueKey: string, opts?: AcquireOpts): Promise<SlotHandle> {
    const sessionSlots = this.activeBySession.get(sessionId) ?? new Map<string, SlotHandle>()
    if (sessionSlots.size >= this.maxSlotsPerSession) {
      throw new Error(`[Harness] Delegation slot limit reached for session ${sessionId}: ${sessionSlots.size}/${this.maxSlotsPerSession} active.`)
    }
    // ...
  }
}
```

```typescript
// src/hooks/observers/event-observers.ts:104-134 — simpler in-memory Map<sessionId, ...>
const mainSessionCache = new Map<string, boolean>()
// ... inside observer:
mainSessionCache.set(sessionId, !parentID)
// ... inside isMainSession:
if (mainSessionCache.has(sessionId)) {
  return mainSessionCache.get(sessionId)!
}
return true // uncached → default
```

### Reuse for P53
- P53 implements the cap as: on each event, compute `currentHourEpoch = Math.floor(Date.now() / 3_600_000)`. If `stored.hourEpoch !== currentHourEpoch`, reset to `{ hourEpoch: current, count: 0 }`. If `stored.count >= 100`, increment `counters.dropped` and return. Otherwise increment `stored.count`, proceed with the write.
- **No throw** on cap exceeded (D-04 + REQ-53-04): silently drop. The cap check is BEFORE the backoff/retry path so a capped event does not consume a retry slot.
- D-53-07 mentions an alternative implementation via `fs.readdir(<sessionDir>)` filtering by hour prefix — this is a deferred optimization. P53 in-memory `Map<sessionId, ...>` is sufficient for the 100/session/hour cap and avoids filesystem I/O on the hot path. The planner should implement the in-memory version (matches `SlotManager` shape) and leave the readdir variant for a future phase if needed.
- UTC top-of-hour reset matches the SPEC: `Date.now()` is a UTC epoch in ms (no timezone), so the cap is timezone-independent across CI runners.

---

## 7. Test pattern for hooks — closest analog: `tests/lib/tmux/observers.test.ts` + `tests/lib/tmux/grid-planner.test.ts`

**Decision:** P53's vitest files (`tests/lib/hooks/pane-monitor-backoff.test.ts`, `tests/lib/hooks/pane-monitor-cap.test.ts`) follow the **observer test pattern** from `tests/lib/tmux/observers.test.ts:1-330` (creates the observer, registers a listener, fires an event, asserts) combined with the **fake-timer pattern** from `tests/lib/tmux/grid-planner.test.ts:107-186` (for the backoff test) and the **node:fs mock pattern** from `tests/lib/tmux/integration.test.ts:17-22` (for the write-failure injection).

### Code (canonical — observer test layout)
```typescript
// tests/lib/tmux/observers.test.ts:1-22 — imports + mock registration BEFORE import
import { describe, it, expect, vi, afterEach } from "vitest"
type DelegationMetaResult = { agent: string; delegationId: string; depth: number } | undefined
let getDelegationMetaResult: DelegationMetaResult = undefined
vi.mock("../../../src/shared/state.js", () => ({
  getDelegationMeta: (_sessionId: string): DelegationMetaResult => getDelegationMetaResult,
}))
const { createTmuxEventObserver } = await import("../../../src/features/tmux/observers.js")
```

```typescript
// tests/lib/tmux/observers.test.ts:297-308 — pane-captured listener registration test
it("registers onPaneCaptured listener and dispatches event to it", async () => {
  const { sessionManager } = makeForkSessionManager()
  const observer = createTmuxEventObserver(sessionManager)
  const listener = vi.fn()
  observer.onPaneCaptured(listener)
  const event = makePaneCapturedEvent({ paneId: "%7", contentLength: 2048 })
  await observer({ event })
  expect(listener).toHaveBeenCalledTimes(1)
  expect(listener).toHaveBeenCalledWith(event)
})
```

### Code (canonical — fake-timer backoff test)
```typescript
// tests/lib/tmux/grid-planner.test.ts:107-132 — useFakeTimers + advanceTimersByTime
describe("PaneGridPlanner.requestLayout (debounce)", () => {
  beforeEach(() => { vi.useFakeTimers(); })
  afterEach(() => { vi.useRealTimers(); })

  it("fires the callback after the debounce window (500ms default)", () => {
    const planner = new PaneGridPlanner();
    const cb = vi.fn();
    planner.requestLayout({ id: "root", children: [{ id: "a", children: [] }] }, cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });
})
```

### Code (canonical — node:fs mock)
```typescript
// tests/lib/tmux/integration.test.ts:12-22
const existsSyncMock = vi.fn()
const readFileSyncMock = vi.fn()
const mkdirSyncMock = vi.fn()
const writeFileSyncMock = vi.fn()
vi.mock("node:fs", () => ({
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
  readFileSync: (...args: unknown[]) => readFileSyncMock(...args),
  mkdirSync: (...args: unknown[]) => mkdirSyncMock(...args),
  writeFileSync: (...args: unknown[]) => writeFileSyncMock(...args),
}))
```

### Reuse for P53
- The P53 `tests/lib/hooks/pane-monitor-backoff.test.ts` follows `grid-planner.test.ts`'s `useFakeTimers` pattern. The test injects a `vi.mocked(fs.writeFile)` that rejects the first 2 calls, succeeds on the 3rd. Then:
  1. `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`.
  2. Fire 1 event, assert `counters.retried === 0` immediately.
  3. `vi.advanceTimersByTime(5000)` → 1st retry fires (rejected), `counters.retried === 1`.
  4. `vi.advanceTimersByTime(10000)` → 2nd retry fires (succeeds), `counters.written === 1`, `counters.retried === 2`.
  5. `vi.advanceTimersByTime(15000)` → assert total elapsed 15s ± ε.
- The 4th-failure path: inject 4 consecutive rejections, advance 5000 + 10000 + 30000 ms, assert `counters.dropped === 1`, no exception thrown.
- The P53 `tests/lib/hooks/pane-monitor-cap.test.ts` uses real timers (no fake-timer needed). Seeds `state.count = 100` directly via a test seam (`__setCount(sessionId, count)`) or by reading the file system count and forcing a 100 count. Fires 1 event, asserts no file written, `counters.dropped === 1`. Second test: `vi.useFakeTimers()` + `vi.setSystemTime(Date.now() + 3_600_000)` to advance past UTC hour boundary, fire 1 event, assert file written.
- The `tests/lib/hooks/` directory does NOT exist yet (P53 creates it). The P53 planner must create the dir with a `.gitkeep` (per AGENTS.md folder registration rule) and put both test files in it.

---

## 8. BATS for filesystem artifacts — `tests/scripts/tmux/helpers.bash` + `tmux_node_eval`

**Decision:** P53's BATS scenario `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` follows the **node:eval pattern** from `tests/scripts/tmux/helpers.bash:23-26` to instantiate the hook, fire a synthetic `PaneCapturedEvent`, and verify the journal file lands at `.hivemind/journal/test-session/2026-06-02T*-pane.json`. The BATS file is `load "helpers"` (path convention from P52's `54-tmux-observer-expansion.bats:9`).

### Code (canonical — BATS helpers)
```bash
# tests/scripts/tmux/helpers.bash:7-8 — root + dist resolution
export TMUX_BATS_ROOT="${TMUX_BATS_ROOT:-$(cd "$(dirname "$BATS_TEST_FILENAME")/../../.." && pwd)}"
export TMUX_BATS_DIST="${TMUX_BATS_DIST:-${TMUX_BATS_ROOT}/dist/features/tmux}"
```

```bash
# tests/scripts/tmux/helpers.bash:23-26 — tmux_node_eval: run Node ESM script against dist
tmux_node_eval() {
  local script="$1"
  (cd "${TMUX_BATS_ROOT}" && node --input-type=module -e "${script}")
}
```

```bash
# tests/scripts/tmux/helpers.bash:11-18 — dist requirement guard
tmux_bats_require_dist() {
  if [[ ! -f "${TMUX_BATS_DIST}/integration.js" ]]; then
    skip "dist/features/tmux/integration.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/types.js" ]]; then
    skip "dist/features/tmux/types.js missing — run 'npx tsc' first"
  fi
}
```

### Code (canonical — existing BATS that fires synthetic events)
```bash
# tests/scripts/tmux/54-tmux-observer-expansion.bats:50-60 — instantiate observer, check registration methods
@test "createTmuxEventObserver returns observer with onSessionStateChanged + onPaneCaptured methods" {
  run tmux_node_eval "
    const m = await import('${TMUX_BATS_DIST}/observers.js');
    const obs = m.createTmuxEventObserver({ onSessionCreated: async () => {} });
    const hasState = typeof obs.onSessionStateChanged === 'function';
    const hasPane = typeof obs.onPaneCaptured === 'function';
    process.stdout.write(\`state=\${hasState ? 1 : 0} pane=\${hasPane ? 1 : 0}\`);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"state=1 pane=1"* ]]
}
```

### Reuse for P53
- P53 BATS at `tests/scripts/tmux/55-pane-monitor-journal-capture.bats`:
  1. `load "helpers"` + `setup() { tmux_bats_require_dist; }` (P52 precedent at `54-tmux-observer-expansion.bats:9, 11-13`).
  2. Test 1: instantiate `createPaneMonitorHook` via `tmux_node_eval`, fire a synthetic `PaneCapturedEvent`, then **glob for the journal file** using `run bash -c "ls ${BATS_TEST_TMPDIR}/project/.hivemind/journal/test-session/"` and assert the glob matches at least 1 file starting with `2`.
  3. Test 2: extract the journal file path from the glob, run `jq -r .eventType`, `jq -r .schemaVersion`, `jq -r 'keys | length'` and assert expected values.
  4. Test 3: call `dispose()` via `tmux_node_eval`, fire another synthetic event, assert file count did NOT grow.
- **For P53, `tmux_bats_require_dist` must be extended** (or a new helper added) to require `dist/hooks/pane-monitor.js`. The simplest path: extend the existing `tmux_bats_require_dist` to also check `${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js`, OR add a new `tmux_bats_require_hooks_dist` helper. The planner should follow the existing helper's pattern.
- The BATS file uses `BATS_TEST_TMPDIR` for isolation (P52 precedent: `helpers.bash:31-32` provides `tmux_bats_project_dir()` that returns `${BATS_TEST_TMPDIR}/project`). P53's hook factory accepts a `journalRoot` option so the BATS test passes `journalRoot: ${BATS_TEST_TMPDIR}/project/.hivemind/journal` and the journal files end up under the test's tmp dir (not the repo root), keeping BATS runs hermetic.
- After the BATS test, the journal files in `BATS_TEST_TMPDIR` are auto-cleaned by bats — no `.gitignore` or commit-exclusion needed for them.

---

## 9. Paperwork rewrite pattern — append-only "## L1 Backing (P53)" section

**Decision:** P53's retroactive rewrites to `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` and `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md` add a new **`## L1 Backing (P53)`** section appended AFTER all existing content (D-53-09). **No existing in-tree precedent for this exact section name** — P53 introduces the convention. The closest analog is the **append-only section pattern** at the end of `42-tmux-visual-orchestration-layer-fork-extension/UAT.md:70-75` (`## Related Review Artifacts`) and the **evidence-level notice** at `42-tmux-visual-orchestration-layer-fork-extension/UAT.md:10-21` (which is the EXISTING L5-only notice that P53's L1 Backing section upgrades).

### Code (canonical — existing P42 UAT structure, the file P53 will append to)
```markdown
# .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md:1-21 (existing — to be PRESERVED)
---
phase: 42-tmux-visual-orchestration-layer-fork-extension
type: uat
created: 2026-06-01
status: PASS
---
# Phase 42 User Acceptance Test
## Evidence Level Notice
**This UAT was verified at the L5 (documentation) level only.** All four
acceptance steps below are sourced from P43-02 SUMMARY cross-references.
**No L1 (live runtime transcript), L2 (test runner output), or L3 (CI
artifact) evidence was captured for P42.** ... (full 11 lines, preserved)
```

```markdown
# .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md:70-75 (existing — to be PRESERVED)
## Related Review Artifacts
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW.md`
  — finding **IN-01** (P42/UAT.md L5-only claims not flagged)
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW-FIX.md`
  — this document's fix commit
```

### Reuse for P53
- P53 appends a new section AFTER the existing `## Related Review Artifacts` (line 75) of P42 UAT.md, and AFTER the existing final content of P43 VERIFICATION.md. The new section is the **last** `## ...` section in each file.
- **Exact heading: `## L1 Backing (P53)`** (D-53-09 — must match exactly for the BATS-grep-style acceptance test in SPEC REQ-53-05).
- **First paragraph (per REQ-53-05 acceptance) must cite the P53 BATS path and the journal file glob**:
  > Live runtime L1 evidence for the P42 UAT acceptance steps is now captured by the Phase 53 pane-monitor hook. The BATS scenario at `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` fires a synthetic `pane-captured` event, the hook writes a journal entry to `.hivemind/journal/test-session/2026-06-02T*-pane.json`, and `jq -r .eventType <file>` returns `pane-captured`. This upgrades the L5-only acceptance steps above to L1-backed, end-to-end-verified runtime evidence.
- **REQ-53-05 acceptance is mechanically checkable via `git diff`**: 0 lines removed, ≥ 5 lines added. The P53 EXECUTE phase must use `git add -u` (NOT `git add -A`) per D-53-11, then verify the diff stat is exactly +N lines on the two files (N ≥ 5 each).
- **For P43 VERIFICATION.md**, the new section re-anchors the W-01..W-04 spec-drift items (P43 VERIFICATION.md:31-43 references them via REQ-02 and REQ-05 spec drift notes) against the P53 hook's journal entry — the journal entry proves the observer event surface is operational end-to-end.
- **Pre-existing content MUST be preserved verbatim** (REQ-53-05 acceptance: 0 lines removed). The append point is after the last existing `## ...` section, before any trailing metadata. For P42 UAT.md this is after line 75; for P43 VERIFICATION.md this is after the last section in the file (the file is 250 lines — the planner should grep `^## ` to find the last section heading).

---

## Constraints for planner

The planner MUST respect the following locked invariants when producing `53-01-PLAN.md`:

1. **Field-set discrepancy between SPEC and CONTEXT (D-53-04)** — SPEC.md:34 lists `contentPreview` as the 7th field with `schemaVersion: "1.0"` (string); CONTEXT.md:50 (D-53-04) locks `retryCount` as the 7th field with `schemaVersion: 1` (number). CONTEXT is authoritative for the field names + types (per the CONTEXT section preamble "Downstream agents MUST read 53-SPEC.md before planning or implementing. Requirements are not duplicated here." plus the CONTEXT is the source of `## Locked Decisions`). The BATS acceptance test is type-agnostic on `schemaVersion` and verifies `keys | length === 7` regardless. Planner should use the CONTEXT-locked field set: `{ schemaVersion, eventType, sessionId, paneId, contentLength, capturedAt, retryCount }`. If planner wants to flag this, append a brief note in `53-01-PLAN.md` to the EXECUTE phase explaining the reconciliation.

2. **No `observers.ts` mutation** (SPEC.md:68, P52 contract preservation) — `observer.onPaneCaptured` is the SOLE event source. The `dispose()` implementation must NOT require a `removePaneListener` API on `TmuxEventObserver`. Use the handler-flag short-circuit pattern (set `disposed = true` in handler closure, wrapper checks before retry). The BATS dispose test (`fire event after dispose, assert file count unchanged`) validates this.

3. **R-P50-03 spirit on `.hivemind/journal/*`** (CONTEXT.md:111) — `.hivemind/journal/*` is already gitignored at `.gitignore:41` (verified). P53 EXECUTE must use `git add -u` (NOT `git add -A`) to ensure journal files produced at runtime are NOT staged. The atomic commit is the source code + 2 paperwork edits ONLY.

4. **D-04 silent-fallback + D-53-10 graceful degradation** (CONTEXT.md:56) — every error path returns silently with counter increments; `client.app.log({ level: "warn", ... })` for recoverable errors (filesystem perms, journal root creation failure). NO throw crosses the hook's `dispose`/handler boundary. The vitest 4th-failure test verifies this.

5. **D-53-12 scope: only `pane-captured`** — Do NOT add `onSessionStateChanged` subscription in P53 (deferred to P54 per CONTEXT.md:58). The P52 observer exposes both methods, but P53 only subscribes to `pane-captured`.

6. **Module LOC cap (SPEC.md:79)** — `src/hooks/pane-monitor.ts` ≤ 500 LOC. If the implementation grows beyond this, the planner should propose splitting the backoff helper into a separate `src/hooks/pane-monitor/backoff.ts` (still ≤ 500 LOC each).

7. **P20 invariant (CONTEXT.md:78, SPEC.md:104)** — no new `package.json` dependencies. Backoff uses `setTimeout` from `node:timers` (built-in). All file ops use `fs.promises.*` (built-in). BATS uses `jq` (assumed available; if not, document as a skip in BATS).

8. **Test seams needed for vitest** — the backoff test (REQ-53-03 acceptance: 2-failures-then-success) needs the hook to expose a way to wait for in-flight retries. The simplest seam: `dispose()` waits for all pending timers (similar to `ChildWriteRetryQueue.waitForPendingRetries` at `retry-queue.ts:348-351`). Planner should add this as a documented test seam, NOT a public API (mark it as `/** @internal */`).

9. **BATS file naming** — `55-pane-monitor-journal-capture.bats` (next slot after P52's `54-tmux-observer-expansion.bats`). The "55" prefix matches the P5x convention; the BATS file number does NOT need to be sequential to the P53 phase number (CONTEXT.md:27 confirms `55-` is the next available slot).

10. **BEFORE/AFTER existing content in P42/P43 paperwork** — the P53 EXECUTE phase MUST use the Edit tool to insert the new section AFTER the last existing `## ...` section, not Write the entire file. This avoids any risk of accidentally truncating the existing content (which would violate the 0-lines-removed acceptance criterion).

---

*Phase: 53-live-pane-monitoring-hook-journal-integration*
*Checkpoint 7 (PATTERNS) complete — 9 patterns mapped, ready for Checkpoint 8 (PLANNING)*
