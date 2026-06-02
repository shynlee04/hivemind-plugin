# Phase 54: Session Persistence + Restart-Recovery — Pattern Map

**Mapped:** 2026-06-02
**Phase:** 54 (Session Persistence + Restart-Recovery)
**Files mapped:** 1 new source file (`src/features/tmux/persistence.ts`) + ≤30 LOC additive mutations to `src/features/tmux/session-manager.ts` + 1 wire site in `src/features/tmux/integration.ts` + 1 BATS scenario + 5 vitest files
**Analogs found:** 8/8 patterns sourced from in-tree code truth (no out-of-scope references)
**Composite risk:** 0.05 (GREEN-LIT, unchanged from locked `D-54-*` set in 54-CONTEXT.md)

---

## 1. Module shape — closest analog: `src/features/session-tracker/persistence/atomic-write.ts`

**Decision:** The new `src/features/tmux/persistence.ts` follows the **`@module` JSDoc header + `import` block + `Public API` constants/types/factory + `Internal helpers` split** shape from `src/features/session-tracker/persistence/atomic-write.ts:1-56`, adapted for a per-record persist/restore lifecycle (P54) rather than a single `atomicWriteJson` helper (session-tracker). The factory is `createSessionPersistence({projectDirectory, logWarn?})` — same shape as `createPaneMonitorHook({sessionId, observer, journalRoot?, logWarn?})` from `src/hooks/pane-monitor.ts:46-62, 202-208`. The 7-field `PersistedSession` shape is structurally identical to the P53 `JournalEntry` (`src/hooks/pane-monitor.ts:107-115`) — 7 baseline fields plus the 2 P54 additions (`state`, `lastTransitionAt`) give the SPEC's 9-field requirement.

### Code (canonical analog — module shape)
```typescript
// src/features/session-tracker/persistence/atomic-write.ts:1-15
/**
 * Crash-safe atomic write helpers for the session tracker persistence layer.
 *
 * All writes use write-to-temp + fs.rename() to ensure files are either
 * complete or nonexistent — never truncated (D-03).
 *
 * @module session-tracker/persistence/atomic-write
 */

import { mkdir, rename, writeFile, readFile, unlink, stat } from "node:fs/promises"
import { dirname, resolve, sep } from "node:path"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
```

```typescript
// src/hooks/pane-monitor.ts:202-208 — factory with `logWarn?` fallback
export function createPaneMonitorHook(opts: PaneMonitorOptions): PaneMonitorHandle {
  const sessionId = opts.sessionId
  const journalRoot = opts.journalRoot ?? ".hivemind/journal"
  const logWarn = opts.logWarn ?? ((msg: string): void => {
    console.warn(`[Harness] pane-monitor: ${msg}`)
  })
  // ... closure-captured state + returned handle
}
```

### Reuse for P54
- P54's `persistence.ts` is a NEW sibling of `session-manager.ts`/`observers.ts`/`tmux-multiplexer.ts`/`grid-planner.ts`/`types.ts`/`integration.ts` (verified via `ls src/features/tmux/`) — the 7th file in the in-tree tmux-feature directory. Folder is registered with `.gitkeep` per AGENTS.md (no new subdir created — file lives next to its peers).
- **Module header follows `atomic-write.ts:1-9` shape** (`@module` JSDoc + brief purpose statement). Imports from `node:fs/promises` (mkdir/writeFile/readFile/readdir/unlink) and `node:path` (join). NO new dependencies on `node:crypto` is `import { getRandomValues } from "node:crypto"` (built-in, not a dep).
- **Public API section** declares the 4 methods + 1 read-only seam: `persist`, `remove`, `restoreAll`, `generateId`, `__stateRoot`. The P53 D-53-13 precedent (`schemaVersion: 1` numeric literal at `pane-monitor.ts:108`) is reused for the P54 `schemaVersion: 1` numeric literal on `PersistedSession`.
- **Internal helpers section** holds the 3 private functions: `writeRecord` (the `wx` → `w` fallback), `readRecord` (parses + validates 9 fields), `generateUuidV7` (the 20-line inline generator). The implementer may keep `generateUuidV7` inline inside the closure (D-54 agent's Discretion §a) or extract to a module-private function — both satisfy the SPEC.
- **JSDoc depth follows `pane-monitor.ts:167-201`** (full JSDoc on the public factory + brief one-liner on private helpers per AGENTS.md §JSDoc mandated). The P54 `createSessionPersistence` factory needs a `@param`, `@returns`, and `@example` block — mirror P53's style.

---

## 2. Wiring to SessionManager — 7th optional constructor param (P51 ctor signature + `SESSION_MANAGER_DEFAULTS`)

**Decision:** The P54 mutation to `src/features/tmux/session-manager.ts` is purely additive: (a) `TrackedSession` interface (lines 81-89) gains an 8th field `state: SessionState` (initial value `"active"` — set inline at the construction site at line 189-197), (b) the constructor (lines 118-125) gains a 7th optional `persistence?: SessionPersistence` parameter as the LAST param, and (c) 2 call sites (one in `onSessionCreated` after line 199 `sessions.set`, one in `handleSessionClose` before line 298 `sessions.delete`) use `void this.persistence?.persist(this.toPersistedSession(tracked))`. The `toPersistedSession` private helper drops `ageTimer` and adds `state` + `lastTransitionAt`. No existing line is removed.

### Code (canonical — current P51 ctor + 6 params)
```typescript
// src/features/tmux/session-manager.ts:63-69 — defaults block
export const SESSION_MANAGER_DEFAULTS = {
  layout: "main-vertical" as TmuxLayout,
  mainPaneSize: 60,
  autoClose: true,
  maxSessionAgeMs: 30 * 60 * 1000,
} as const
```

```typescript
// src/features/tmux/session-manager.ts:118-125 — current 6-param ctor (P51)
constructor(
  private readonly multiplexer: TmuxMultiplexer,
  private readonly serverUrl: string,
  private readonly directory: string,
  private readonly log?: Logger,
  private readonly layout: TmuxLayout = SESSION_MANAGER_DEFAULTS.layout,
  private readonly mainPaneSize: number = SESSION_MANAGER_DEFAULTS.mainPaneSize,
) {}
```

```typescript
// src/features/tmux/session-manager.ts:81-89 — TrackedSession interface (P51 — 7 fields)
interface TrackedSession {
  sessionId: string
  agent: string
  delegationId: string
  directory: string
  paneId: string
  spawnTime: number
  ageTimer: ReturnType<typeof setTimeout> | null
}
```

```typescript
// src/features/tmux/session-manager.ts:189-197 — TrackedSession construction site
const tracked: TrackedSession = {
  sessionId,
  agent,
  delegationId,
  directory,
  paneId: result.paneId,
  spawnTime: Date.now(),
  ageTimer: null,
}
```

### Reuse for P54
- **Constructor adds `persistence?: SessionPersistence` as the 7th (LAST) param** — preserves all existing call sites (additive only). The wire point at `src/features/tmux/integration.ts:221-226` (`new SessionManager(multiplexer, serverUrl, directory, options.log)`) gains a 5th argument `persistence` (the createSessionPersistence handle constructed earlier in the same `try` block) — net ≤ 5 LOC added to `integration.ts`.
- **TrackedSession gains `state: SessionState` (8th field)** — set inline at the construction site (line 189-197) to `"active"` (initial value per D-54-04). The `TrackedSession` interface declaration (line 81-89) is mutated by inserting one line; the existing 7 fields are preserved verbatim.
- **The 2 call sites** mirror the existing `this.sessions.set`/`this.sessions.delete` patterns at lines 199 + 298. New code (additive):
  - At line 199 (after `this.sessions.set(...)`): `tracked.state = "ready"; void this.persistence?.persist(this.toPersistedSession(tracked))`.
  - At line 298 (before `this.sessions.delete(...)`): `tracked.state = "failed"; void this.persistence?.persist(this.toPersistedSession(tracked))`.
- **Optional-chaining `?.` short-circuits when persistence is undefined** (P51 byte-identical behavior preserved when the integration factory at `integration.ts:194-261` does not wire persistence — e.g., tmux unavailable, persistence factory throws, etc.). The `void` operator discards the promise — D-04 silent-fallback ensures no rejection crosses the boundary.
- **The `toPersistedSession` private helper** is a method on the class (D-54 agent's Discretion §g — both method and arrow-field shapes satisfy the SPEC). Maps `TrackedSession` (7 fields + `state` = 8) → `PersistedSession` (9 fields): drops `ageTimer`, copies 6 fields (`sessionId`, `agent`, `delegationId`, `directory`, `paneId`, `spawnTime`), adds 2 (`state` from `tracked.state`, `lastTransitionAt = Date.now()`), sets `schemaVersion: 1` as a literal.

---

## 3. State machine — 5-state union `active | ready | paused | detached | failed`

**Decision:** P54 introduces the FIRST in-tree `SessionState` type as a **union of exactly 5 string literals** at `src/features/tmux/persistence.ts`. No existing in-tree enum or state-machine union exists in `src/features/tmux/` — the closest existing precedent is the `SessionStateChangedEvent` payload at `src/features/tmux/observers.ts:59-65` which uses free-form `string` for `previousState` / `currentState` (P52 did not lock the state vocabulary). P54 LOCKS the vocabulary. The `5xx-tmux-...` BATS slot convention and the `TrackedSession.state` field are the only callers of the union.

### Code (closest analog — existing free-form state strings)
```typescript
// src/features/tmux/observers.ts:59-65 — P52 SessionStateChangedEvent (free-form strings)
export interface SessionStateChangedEvent {
  type: "session-state-changed";
  sessionId: string;
  previousState: string;
  currentState: string;
  timestamp: number;
}
```

```typescript
// src/features/tmux/session-manager.ts:81-89 — TrackedSession (P51 — NO state field)
interface TrackedSession {
  sessionId: string
  agent: string
  delegationId: string
  directory: string
  paneId: string
  spawnTime: number
  ageTimer: ReturnType<typeof setTimeout> | null
}
```

### Reuse for P54
- **No existing state machine to mirror in-tree.** The 5-state union is P54's invention. The `kind: "..."` discriminator pattern from `TmuxEventType` (`observers.ts:52`: `export type TmuxEventType = "session.created" | "session-state-changed" | "pane-captured";`) is the closest precedent for the union-of-string-literals style — P54's `SessionState` is a peer of `TmuxEventType` in style.
- **State machine semantics (D-54-04)**: `active` is the initial value of `TrackedSession.state` at construction (line 189-197). `ready` is set after `onSessionCreated` completes `sessions.set` (line 199). `failed` is set in `handleSessionClose` before `sessions.delete` (line 298). The `paused` and `detached` states are forward-compatible slots — no current code sets them; P55+ will introduce orchestration that emits these transitions.
- **Validation in `persist()`**: throws `TypeError` for any state not in the 5-literal union (caller bug, not runtime hazard — the TS type system prevents invalid states at compile time; the runtime check is a defensive belt-and-suspenders). Mirrors `HierarchyManifestChildSchema.safeParse(...)` at `src/tools/delegation/readers/session-tracker-reader.ts:32-33` (Zod validates-and-skips on parse failure) but uses a simpler manual union check.
- **Filter in `restoreAll()`**: the `state ∈ {"paused", "detached"}` filter is a direct array literal — no need for a runtime type guard (TS narrows after the `.includes()` check). The P54 `restoreAll` body looks like:
  ```typescript
  const ALIVE_STATES: ReadonlySet<SessionState> = new Set(["paused", "detached"])
  // ... after parsing + field validation:
  if (!ALIVE_STATES.has(record.state)) continue
  ```
  This pattern (Set membership for filter) is faster than `array.includes` for 5+ members and matches the in-memory `Set<sessionId>` style at `src/features/tmux/session-manager.ts:108` (`spawningSessions`).
- **No throw across module boundary on invalid state at restore time** (D-04 mirror per D-54-09): if `JSON.parse` returns a record with a malformed `state` field, `logWarn` + skip, never throw. The vitest malformed-record test verifies this.

---

## 4. Atomic write with `wx` flag + `EEXIST` fallback — closest analog: `pane-monitor.ts:writeOnce` + `atomic-write.ts:atomicWriteJson`

**Decision:** P54's `writeRecord` helper uses **`fs.writeFile(path, JSON.stringify(record, null, 2), { encoding: "utf-8", flag: "wx" })`** for the first attempt; on `EEXIST` (Node error code `EEXIST`, errno `-17` on POSIX, `-13` on Windows), the helper retries with `flag: "w"` (truncate-or-create) to overwrite with the latest state. The `wx` flag is "exclusive create" — fails if the file already exists. This is the same `wx` flag P53 uses at `src/hooks/pane-monitor.ts:271-277` (`writeOnce`), adapted with the `EEXIST` → `w` fallback per D-54-10 (P53 drops on `EEXIST` because each event gets a unique ISO-timestamped filename; P54 must overwrite because one record per session).

### Code (canonical — `wx` exclusive create)
```typescript
// src/hooks/pane-monitor.ts:271-277 — P53 writeOnce with `flag: "wx"`
async function writeOnce(filePath: string, entry: JournalEntry): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const content = JSON.stringify(entry, null, 2)
  // `wx` flag: exclusive create — fails if the file already exists
  // (REQ-53-02 acceptance). Mitigates T-53-02 (filename clobber).
  await writeFile(filePath, content, { encoding: "utf-8", flag: "wx" })
}
```

```typescript
// src/features/session-tracker/persistence/atomic-write.ts:33-56 — alternative atomic write (write-to-tmp + rename)
export async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`
  const content = JSON.stringify(data, null, 2)
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, content, "utf-8")
  // ... cross-volume rename detection ...
  await rename(tmpPath, filePath)
  // ... post-rename cleanup ...
}
```

### Reuse for P54
- **P54 uses the `wx` → `w` fallback pattern, NOT `atomicWriteJson`'s write-to-tmp + rename.** The write-to-tmp pattern is overkill for P54 because (a) the JSON payload is small (~250 bytes for 9 fields), (b) the record is one-per-session (NOT a stream of events), and (c) the `wx` flag already provides the "never silently truncate" guarantee that matters for the kill-parent-restart-recovery contract.
- **The `mkdir` recursive pattern is reused from `pane-monitor.ts:272`** (`await mkdir(dirname(filePath), { recursive: true })`). P54 calls `mkdir` once at factory time on `stateRoot` (the `.hivemind/state/tmux-sessions/` directory), NOT on every persist call — the per-record path's dirname IS `stateRoot` itself, so the directory is guaranteed to exist. The implementer may either (a) inline `mkdir(stateRoot, { recursive: true })` at the top of `createSessionPersistence` (D-54-01 acceptance: "creates the dir on first call"), or (b) call it lazily on first `persist` (defensive double-mkdir is idempotent).
- **The `JSON.stringify(record, null, 2)` content** matches `pane-monitor.ts:273` and `atomic-write.ts:38` — 2-space indent for cross-tool `jq` readability. The BATS acceptance test (`jq -r 'keys | length' <file>` returns `9`) assumes this format.
- **The `EEXIST` retry loop** is the only NEW pattern. Pseudocode for P54 `writeRecord`:
  ```typescript
  async function writeRecord(filePath: string, record: PersistedSession): Promise<void> {
    const content = JSON.stringify(record, null, 2)
    try {
      await writeFile(filePath, content, { encoding: "utf-8", flag: "wx" })
    } catch (err) {
      if (isEEXIST(err)) {
        // EEXIST path: file already exists from a prior persist (D-54-10)
        await writeFile(filePath, content, { encoding: "utf-8", flag: "w" })
        return
      }
      throw err // re-throw non-EEXIST to caller for D-04 catch
    }
  }
  function isEEXIST(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "EEXIST"
  }
  ```
- **Cross-platform EEXIST detection**: Node's `fs.writeFile` error has a `code` property on all platforms (POSIX errno string `"EEXIST"`, Windows errno string `"EEXIST"`). The string comparison is portable — no platform-specific branch needed. The P53 module does NOT detect EEXIST (P53 drops on any error); P54 is the first in-tree module to discriminate by error code.

---

## 5. UUIDv7 inline generator — no analog in-tree (existing code uses `randomUUID` v4)

**Decision:** P54 generates **UUIDv7 inline** using `node:crypto.getRandomValues(new Uint8Array(10))` for the 80 random bits and `Date.now()` for the 48-bit big-endian timestamp. No `uuid` package is in `package.json:49-57` (verified — only `@ai-sdk/openai-compatible`, `@clack/prompts`, `@modelcontextprotocol/sdk`, `@opencode-ai/sdk`, `gray-matter`, `yaml`, `zod`); the P20 invariant forbids new deps. The 20-line function sets the version bits (high nibble of byte 6 = `0b0111` → 3rd group starts with `7`) and the variant bits (high 2 bits of byte 8 = `0b10` → 4th group starts with `8`/`9`/`a`/`b`), then formats as `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`. **No in-tree precedent for UUIDv7** — the closest existing pattern is `randomUUID()` (v4) used at multiple sites.

### Code (closest analog — existing v4 randomUUID usage)
```typescript
// src/tools/session/execute-slash-command.ts:16, 105
import { randomUUID } from "node:crypto"
// ...
id: randomUUID(),
```

```typescript
// src/coordination/delegation/manager-runtime.ts:210
const delegation: Delegation = {
  id: crypto.randomUUID(),  // globalThis.crypto.randomUUID() — also v4
  // ...
}
```

```typescript
// src/features/background-command/pty/pty-manager.ts:51
const sessionId = `pty-${crypto.randomUUID()}`
```

```typescript
// src/features/agent-work-contracts/operations.ts:25
const id = input.id ?? `awc_${randomUUID()}`
```

### Reuse for P54
- **P54 does NOT use `randomUUID()`** — v4 is non-sortable (random bits throughout), so a sorted list of v4 IDs does not match creation order. P54's `restoreAll` needs `spawnTime` ascending order (REQ-54-03 acceptance), and the on-disk filename `<sid>.json` is the sortable primary key (UUIDv7 prefix matches lexicographic filename order). v4 would force a separate `Date.now()` sort key.
- **The 20-line `generateUuidV7` function** (D-54-07 + REQ-54-04 acceptance: vitest regex `^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`) is the inline implementation:
  ```typescript
  function generateUuidV7(): string {
    // 48-bit big-endian ms timestamp (12 hex chars)
    const ts = Date.now().toString(16).padStart(12, "0")
    // 80 random bits (20 hex chars) — Uint8Array(10) for the random bits
    const rand = new Uint8Array(10)
    crypto.getRandomValues(rand)
    // Set version (high nibble of byte 6 = 0b0111) and variant (high 2 bits of byte 8 = 0b10)
    rand[6] = (rand[6]! & 0x0f) | 0x70 // version 7
    rand[8] = (rand[8]! & 0x3f) | 0x80 // RFC 4122 variant
    const hex = Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("")
    // Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
    return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-${hex.slice(0, 4)}7${hex.slice(4, 7)}-${((rand[8]! & 0xc0) | 0x80).toString(16)}${hex.slice(9, 12)}-${hex.slice(12, 20)}`
  }
  ```
  (Exact format expression to be refined by planner; the byte-layout and version/variant bit math is locked.)
- **The 10 random bytes (80 bits) are the security source** — `getRandomValues` is Node 20+'s CSPRNG (uses `BCryptGenRandom` on Windows, `/dev/urandom` on POSIX). The 74 effective bits (after subtracting the 6 fixed version/variant bits) give a birthday bound of `1000² / 2^74 ≈ 5.4e-17` for the vitest 0-collision assertion (REQ-54-04).
- **The `Date.now()` 48-bit timestamp** overflows in the year 10889 AD (2^48 ms ≈ 281 trillion years from epoch) — not a practical concern. The vitest 1000-call test asserts lexicographic sort matches numeric `Date.now()` sort (temporal monotonicity).
- **Implementation location (D-54 agent's Discretion §f)**: may be inlined inside the `createSessionPersistence` closure (the `generateId` method is the public surface) or extracted as a module-private `generateUuidV7()` function. The planner should keep it as a module-private function (testable + reusable across the `restoreAll` and the call sites in `session-manager.ts`).

---

## 6. D-04 silent-fallback on write errors — closest analog: `pane-monitor.ts:writeWithBackoff` + `logWarn`

**Decision:** P54's `persist` method wraps the entire write path in a `try/catch` — on ANY error (excluding `EEXIST` which is the documented retry path per D-54-10), the helper invokes `logWarn(msg, err)` and **returns normally without throwing** (D-04 silent-fallback mirror). This is identical to P53's `writeWithBackoff` error handling at `src/hooks/pane-monitor.ts:288-330` (try/catch on every retry; on the 4th failure, `counters.dropped++` + `logWarn` + return `false`). The P54 difference: P53 has a retry chain (5s → 10s → 30s, max 3 retries); P54 has NO retry (D-54-11) — every state transition is persisted once, and on failure the in-memory `Map<sessionId, TrackedSession>` remains the source of truth for the running process. The `logWarn` line is the only operator-visible signal that persistence is failing.

### Code (canonical — D-04 mirror in P53)
```typescript
// src/hooks/pane-monitor.ts:206-208 — logWarn fallback to console.warn
const logWarn = opts.logWarn ?? ((msg: string): void => {
  console.warn(`[Harness] pane-monitor: ${msg}`)
})
```

```typescript
// src/hooks/pane-monitor.ts:301-310 — P53 4th-failure drop + logWarn
} catch (err) {
  if (attemptNumber >= MAX_RETRIES) {
    // 4th failure drops event (D-53-05, D-04 silent-fallback)
    counters.dropped++
    logWarn(
      `journal write exhausted ${MAX_RETRIES} retries, dropped event sessionId=${event.sessionId} paneId=${event.paneId}`,
      err,
    )
    return false
  }
```

```typescript
// src/features/tmux/integration.ts:198, 258-260 — D-04 silent-null on factory failure
try {
  // ... tmux checks + SessionManager construction ...
  return { ... }
} catch {
  return null  // D-04 contract: silent null, not throw
}
```

### Reuse for P54
- **P54's `createSessionPersistence` factory uses the same `logWarn` fallback pattern** as P53 (`opts.logWarn ?? ((msg) => console.warn('[Harness] persistence: ${msg}'))`). The plugin composition root at `src/plugin.ts` will inject a `client.app.log({ level: "warn" })` callback (matching the `pane-monitor` log injection pattern in P53 — the existing `consumeSessionTrackerFact` injection at `src/plugin.ts:581-593` is the reference).
- **P54's `persist` method wraps `writeRecord` in a single `try/catch` with NO retry** (D-54-11 — "no cap on persistence writes" is the inverse of P53's cap, and "no retry" is the inverse of P53's backoff):
  ```typescript
  async function persist(record: PersistedSession): Promise<void> {
    try {
      record.lastTransitionAt = record.lastTransitionAt ?? Date.now()
      record.schemaVersion = 1
      validateState(record.state)
      await mkdir(stateRoot, { recursive: true })
      await writeRecord(path.join(stateRoot, `${record.sessionId}.json`), record)
    } catch (err) {
      logWarn(`persist failed for sessionId=${record.sessionId} state=${record.state}`, err)
    }
  }
  ```
- **`restoreAll` uses per-file try/catch with `logWarn` + skip** (mirrors `session-tracker-reader.ts:41-43` for the `hierarchy-manifest.json` scan):
  ```typescript
  for (const file of files) {
    if (!file.endsWith(".json")) continue
    try {
      const raw = await readFile(join(stateRoot, file), "utf-8")
      const parsed = JSON.parse(raw) as PersistedSession
      if (!isValidPersistedSession(parsed)) {
        logWarn(`restoreAll: skipping malformed record (missing fields): ${file}`)
        continue
      }
      if (ALIVE_STATES.has(parsed.state)) records.push(parsed)
    } catch (err) {
      logWarn(`restoreAll: skipping unreadable/malformed JSON: ${file}`, err)
    }
  }
  ```
- **Empty-stateRoot edge case** (REQ-54-03 acceptance: nonexistent `stateRoot` returns `[]`): `readdir` throws on missing dir → caught by the outer try/catch → `logWarn` (debug-level, not warn-level — this is a fresh-project case, not a failure) → return `[]`. The vitest empty-stateRoot test verifies this.
- **The `logWarn` callback signature**: `(msg: string, err?: unknown) => void` — matches the P53 PaneMonitorOptions.logWarn at `src/hooks/pane-monitor.ts:61`. The 2-arg form lets operators pipe the underlying error to the structured log envelope.

---

## 7. BATS kill-parent-restart test pattern — closest analog: `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` + `helpers.bash`

**Decision:** P54's BATS scenario `tests/scripts/tmux/56-session-persistence-kill-restart.bats` follows the **`load "helpers"` + `tmux_bats_require_dist` + `tmux_node_eval` + `tmux_bats_make_project`** shape from `tests/scripts/tmux/55-pane-monitor-journal-capture.bats:9-13` and `tests/scripts/tmux/helpers.bash:7-43`, but adds a **real OS process lifecycle** layer: spawn a real tmux session via `tmux new-session -d -s <name>`, run a real harness binary as a child OS process, capture its PID via `$!`, `kill -9 <pid>`, restart a new harness process, then verify (a) `.hivemind/state/tmux-sessions/<sid>.json` exists with `state = "ready"` and (b) `tmux has-session -t <name>` returns 0 (the tmux session is still alive on its own OS process). This is the FIRST BATS in the P5x cycle that exercises a real OS process kill — P52/P53 BATS exercise Node modules in-process via `tmux_node_eval`.

### Code (canonical — BATS file + helpers)
```bash
# tests/scripts/tmux/helpers.bash:7-21 — root/dist resolution + require_dist guard
export TMUX_BATS_ROOT="${TMUX_BATS_ROOT:-$(cd "$(dirname "$BATS_TEST_FILENAME")/../../.." && pwd)}"
export TMUX_BATS_DIST="${TMUX_BATS_DIST:-${TMUX_BATS_ROOT}/dist/features/tmux}"

tmux_bats_require_dist() {
  if [[ ! -f "${TMUX_BATS_DIST}/integration.js" ]]; then
    skip "dist/features/tmux/integration.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/types.js" ]]; then
    skip "dist/features/tmux/types.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js" ]]; then
    skip "dist/hooks/pane-monitor.js missing — run 'npx tsc' first"
  fi
}
```

```bash
# tests/scripts/tmux/55-pane-monitor-journal-capture.bats:17-51 — typical P53 scenario
@test "pane-monitor writes 7-field JSON journal entry on pane-captured event" {
  local journal_root="${BATS_TEST_TMPDIR}/project/.hivemind/journal"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'test-session', observer, journalRoot: '${journal_root}' });
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 2048, timestamp: 1780434056789 } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]
  # ... glob + jq assertions ...
}
```

### Reuse for P54
- **BATS slot 56 follows the P52/P53 `5X-tmux-...` convention** (P52: `52-tmux-copilot-factory-swap.bats`, `53-tmux-state-query-tool.bats`, `54-tmux-observer-expansion.bats`; P53: `55-pane-monitor-journal-capture.bats`; P54: `56-session-persistence-kill-restart.bats`). The slot number does NOT need to be sequential to the phase number (CONTEXT confirms 56 is the next available slot).
- **`tmux_bats_require_dist` needs an additional check for `dist/features/tmux/persistence.js`** — the planner should extend the existing helper at `tests/scripts/tmux/helpers.bash:11-21` with a 4th `[[ ! -f "${TMUX_BATS_DIST}/persistence.js" ]]` check (or add a new `tmux_bats_require_persistence_dist` helper). The simplest path: extend the existing helper (preserves the single-call setup pattern).
- **The kill-restart BATS structure is a multi-step scenario** (NOT a single `tmux_node_eval` like P53):
  ```bash
  @test "harness restart preserves tmux session + persistence file" {
    tmux_bats_require_dist
    local project="$(tmux_bats_make_project)"
    local tmux_session="p54-kill-restart-$$"
    local harness_pid
    # Step 1: spawn a real tmux session
    tmux new-session -d -s "$tmux_session" -c "$project"
    # Step 2: launch harness as a child process (via tmux_node_eval or detached)
    # ... harness writes persistence record via createSessionPersistence ...
    # Step 3: capture harness PID, kill -9
    harness_pid=$(...)
    kill -9 "$harness_pid"
    # Step 4: assert .hivemind/state/tmux-sessions/<sid>.json exists + state = "ready"
    run jq -r .state "${project}/.hivemind/state/tmux-sessions/<sid>.json"
    [ "$status" -eq 0 ]
    [ "$output" = "ready" ]
    # Step 5: assert tmux session is still alive
    run tmux has-session -t "$tmux_session"
    [ "$status" -eq 0 ]
    # Cleanup
    tmux kill-session -t "$tmux_session"
  }
  ```
- **BATS file `setup()` and `teardown()`** must handle tmux session cleanup — use `trap tmux kill-session -t "$tmux_session" EXIT` (BATS teardown convention) so failed tests do not leave orphan tmux sessions on the CI runner.
- **Real `tmux` binary dependency** — the BATS scenario will `skip` if `tmux` is not on PATH (similar to `tmux_bats_require_dist`). The P51/P52/P53 BATS files in `tests/scripts/tmux/01-06-*` (e.g., `01-mcp-server-pty.bats`) already exercise real tmux binaries; the P54 BATS inherits the same skip-on-no-tmux convention.
- **The `harness` binary to launch is the real `dist/plugin.js` or `bin/hivemind.cjs`** — the BATS does NOT mock the harness lifecycle. The test is intentionally a full end-to-end OS process survival test (D-54-12: "REAL OS process survival test (NOT a mock)"). A vitest-only proof of the persistence logic would not satisfy the kill-parent-restart-recovery L1 evidence contract.
- **No existing BATS exercises `kill -9` on the harness** — P54 introduces the pattern. The closest precedent is the `tmux kill-session` cleanup at the end of every tmux-using BATS test (P51-P53 BATS all use `tmux kill-session -t <name>` in `teardown()`).

---

## 8. Restore on startup pattern — scan-and-restore closest analog: `session-tracker-reader.ts:listFiles` + `pane-monitor.ts:readdir`

**Decision:** P54's `restoreAll()` method uses the **scan-dir → filter `*.json` → `readFile` per file → `JSON.parse` → validate → filter state → sort by `spawnTime` ascending** pattern, mirroring the **scan-then-parse** shape at `src/tools/delegation/readers/session-tracker-reader.ts:16-49` (the `readChildren` method scans `.hivemind/session-tracker/<entry>/` for `hierarchy-manifest.json` files) and the **`readdir` defensive try/catch** at `src/hooks/pane-monitor.ts:477-480` (returns 0 on `readdir` error). P54's pattern is a SIMPLER version (one directory, one filename pattern, no recursion).

### Code (canonical — scan-and-restore)
```typescript
// src/tools/delegation/readers/session-tracker-reader.ts:16-49 — scan manifest directory
async readChildren(parentSessionId: string, projectRoot: string): Promise<Delegation[]> {
  try {
    const manifestPath = `${projectRoot}/.hivemind/session-tracker`
    const entries = await this.listFiles(manifestPath)  // listFiles: private wrapper around readdir
    if (!entries) return []
    for (const entry of entries) {
      const manifestFile = `${manifestPath}/${entry}/hierarchy-manifest.json`
      try {
        const raw = await readFile(manifestFile, "utf-8")
        const manifest = JSON.parse(raw)
        // ... filter children ...
      } catch {
        // manifest file doesn't exist or is invalid — try next
      }
    }
    return []
  } catch {
    return []
  }
}

private async listFiles(dirPath: string): Promise<string[] | null> {
  try {
    const { readdir } = await import("node:fs/promises")
    return await readdir(dirPath)
  } catch {
    return null  // missing dir → empty result, no throw (D-04 mirror)
  }
}
```

```typescript
// src/hooks/pane-monitor.ts:470-489 — defensive readdir with try/catch + filter by extension
countHourFiles: async (
  journalRoot: string,
  sessionId: string,
  hourPrefix: string,
): Promise<number> => {
  const dir = join(journalRoot, sessionId)
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return 0  // missing dir → 0 files
  }
  let count = 0
  for (const name of entries) {
    if (name.endsWith("-pane.json") && name.startsWith(hourPrefix)) {
      count++
    }
  }
  return count
}
```

### Reuse for P54
- **P54's `restoreAll()` body** mirrors the `listFiles` + per-file `readFile` + `JSON.parse` + per-file try/catch shape from `session-tracker-reader.ts:18-43`. P54 simplifies by NOT recursing into subdirectories (the `.hivemind/state/tmux-sessions/` dir is flat — each record is one file, no subdirs).
- **The `readdir` defensive wrapper** at `session-tracker-reader.ts:80-87` (returns `null` on missing dir) is the closest analog. P54's `restoreAll` uses a single `try/catch` around the `readdir(stateRoot)` call — missing dir returns `[]` and emits a debug-level `logWarn` (NOT warn-level — fresh-project case is not a failure).
- **The `.endsWith(".json")` filter** matches `pane-monitor.ts:484` (`name.endsWith("-pane.json")`). P54's filter is `file.endsWith(".json")` (all JSON files in the dir are candidate records — no filename schema beyond the `.json` extension; the on-disk filename is `<sessionId>.json` per D-54-02).
- **Sort by `spawnTime` ascending** at the end of `restoreAll`:
  ```typescript
  records.sort((a, b) => a.spawnTime - b.spawnTime)
  ```
  This is the simplest numeric sort; the UUIDv7 sortable prefix means lexicographic filename sort would produce the same order, but the planner should use `spawnTime` (the explicit field) for clarity + robustness against filename collisions.
- **Validation after `JSON.parse`**: P54 uses a manual check `isValidPersistedSession(parsed): parsed is PersistedSession` that asserts all 9 fields are present and of the right type. This is a peer of `HierarchyManifestChildSchema.safeParse(...)` at `src/tools/delegation/readers/session-tracker-reader.ts:32-33` (Zod-validated) but uses TypeScript type predicates instead of Zod (avoids a new dep per P20 invariant; the 9-field shape is simple enough for a manual check).
- **Restore-time `tmux has-session` liveness check is DEFERRED** (D-54 `deferred` §6: "`restoreAll()` returns records purely from disk state; it does not verify that the tmux session is still alive"). The P55+ orchestrator will call `tmux has-session -t <name>` on each restored record to filter dead panes before re-attaching. P54 keeps the persistence layer independent of the multiplexer (one-way dependency: SessionManager → Persistence, NOT Persistence → Multiplexer).

---

## Constraints for planner

The planner MUST respect the following locked invariants when producing `54-01-PLAN.md` (and any subsequent plans):

1. **Q6 canonical state root + R-P50-03 spirit** (CONTEXT.md:124) — `.hivemind/state/tmux-sessions/<sid>.json` is the on-disk path. The `.gitignore` already covers `.hivemind/state/` (verified at line `.hivemind/state/`), so the new subdir inherits the gitignore automatically — no `.gitignore` edit needed. EXECUTE must use `git add -u` on the source files + commit ONLY the source/bats/vitest changes; runtime state files are local-only.

2. **27-tool-key invariant (D-54-08 + REQ-54-05 step 6)** — `src/features/tmux/types.ts:151-162` (`SessionManagerAdapter` interface) MUST remain byte-identical to its P51 form. Persistence is an implementation detail of `SessionManager` and the `createSessionPersistence` factory, NOT exposed on the adapter surface. The BATS acceptance `git grep "persistence" src/features/tmux/types.ts` returns 0 matches.

3. **D-04 silent-fallback (D-54-09)** — every error path in `persistence.ts` returns silently with `logWarn(msg, err)`; NO throw crosses the `persist` / `restoreAll` / `remove` / `generateId` boundary. The vitest malformed-record test verifies this (skipped record + logWarn, no throw). The `validateState(record.state)` check throws `TypeError` for invalid state literals — this is a caller bug (TS type system prevents it at compile time; the runtime check is a defensive belt-and-suspenders) and the `persist` method's outer try/catch catches it, so the throw DOES NOT cross the module boundary.

4. **P20 invariant — no new `package.json` deps** (CONTEXT.md:128, verified at `package.json:49-57`) — UUIDv7 is generated inline using `node:crypto.getRandomValues()` (Node 20+ built-in per `engines.node: ">=20.0.0"` at `package.json:106`). The BATS scenario must `skip` if `node --version` reports < 20 (or document the version requirement in the BATS header).

5. **Module LOC cap (SPEC.md:110)** — `src/features/tmux/persistence.ts` ≤ 500 LOC (AGENTS.md hard cap; target ~150 LOC). The additive changes to `session-manager.ts` are ≤ 30 LOC net (D-54-08). The wire-point addition in `integration.ts` is ≤ 5 LOC (one new line in the `new SessionManager(...)` call at line 221-226, plus the `createSessionPersistence` factory call inside the `try` block).

6. **`schemaVersion: 1` numeric literal (D-54-03)** — mirrors P53 `JournalEntry.schemaVersion: 1` at `src/hooks/pane-monitor.ts:108` (the D-53-13 SPEC/CONTEXT drift fix). The BATS acceptance `jq -r .schemaVersion <file>` returns the number `1`, NOT the string `"1.0"`. The vitest schemaVersion field assertion is `toBe(1)`, not `toBe("1")`.

7. **BATS real-OS-process survival test (D-54-12)** — `tests/scripts/tmux/56-session-persistence-kill-restart.bats` is the L1 evidence. A vitest-only proof of the persistence module would NOT satisfy the kill-parent-restart-recovery contract; the BATS MUST exercise a real `tmux new-session -d` + real harness binary launch + real `kill -9` + real `tmux has-session` assertion. Slot 56 follows the P52/P53 `5X-tmux-...` convention.

8. **Atomic commit (CONTEXT.md:114 + AGENTS.md)** — EXECUTE commit must be atomic (one logical change = one commit per the project-wide commit-discipline rule). EXECUTE must use `git add -u` (NOT `git add -A`) per the P53 D-53-11 precedent to ensure runtime state files produced at `BATS_TEST_TMPDIR` are NOT staged. The atomic commit is the source code + 1 BATS + 5 vitest files ONLY (no `.hivemind/state/*` files).

9. **No `remove()` call site in EXECUTE** (D-54 `deferred` §2) — the `SessionPersistence.remove(sessionId)` method IS part of the public interface (REQ-54-01 acceptance) but is NOT called by any P54 code. The `failed` JSON files are orphaned on disk after `handleSessionClose` writes them; cleanup is deferred to a future phase. The orphaned `failed` files are harmless and excluded by the `restoreAll` filter (D-54-06).

10. **Restore-time `tmux has-session` liveness check is DEFERRED** (D-54 `deferred` §6) — `restoreAll()` returns records purely from disk state. The P55+ orchestrator (not P54) will call `tmux has-session -t <name>` on each restored record to filter dead panes. The P54 persistence layer stays independent of the multiplexer (one-way dependency: SessionManager → Persistence).

11. **Test seams needed for vitest** — the `restoreAll` test (REQ-54-03 acceptance) needs the persistence module to be hermetic across test runs. The simplest pattern: each vitest creates a temp dir via `os.tmpdir()` + `crypto.randomUUID()` (or `generateId()`), passes it as `projectDirectory` to `createSessionPersistence`, and runs `rm -rf` in `afterEach`. The BATS test uses `BATS_TEST_TMPDIR` (per `helpers.bash:33-35` `tmux_bats_project_dir()`). The `__stateRoot` read-only test seam lets the BATS / vitest assert the on-disk path without `path.resolve()` re-derivation.

12. **Order of BATS file numbering** — slot 56 follows the P52/P53 `5X-tmux-...` convention (existing BATS in `tests/scripts/tmux/`: 01-06 for older slots, 52-55 for the P52/P53 cycle). The BATS file number does NOT need to be sequential to the P54 phase number.

13. **Vitest file organization (D-54 agent's Discretion §h)** — separate files per concern (`tests/lib/tmux/persistence.test.ts` for transitions/EEXIST/restore-filter/malformed-record, `tests/lib/tmux/persistence-uuid.test.ts` for UUIDv7, etc.) vs. a single file with `describe` blocks. Both satisfy the SPEC's 5 vitest files floor. The planner should organize by concern (UUIDv7 is a separate `describe` block in the main file, OR a separate file — implementer's choice).

---

*Phase: 54-session-persistence-restart-recovery*
*Checkpoint 7 (PATTERNS) complete — 8 patterns mapped, ready for Checkpoint 8 (PLANNING)*
