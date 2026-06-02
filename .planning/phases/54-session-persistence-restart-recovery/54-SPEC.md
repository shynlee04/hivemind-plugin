# Phase 54: Session Persistence + Restart-Recovery — Specification

**Created:** 2026-06-02
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Add persistent session metadata at `.hivemind/state/tmux-sessions/<sessionId>.json`, serialized on every state transition (`active → ready → paused → detached → failed`) through a new `src/features/tmux/persistence.ts` module (~150 LOC) wired into the P51 `SessionManager`. On harness startup, restore `paused` and `detached` sessions from disk by re-attaching to their live tmux panes; `failed` sessions are NOT auto-restored. Use restart-safe session IDs (UUIDv7 — sortable, no birthday collision) generated inline via `node:crypto`. The most important contract is **kill-parent-restart-recovery**: killing the harness parent while a tmux session is alive must leave `.hivemind/state/tmux-sessions/<sid>.json` on disk and the tmux session must survive the restart so the harness can re-attach.

## Background

P51 closed the in-tree `SessionManager` + `TmuxMultiplexer` chain and the `SessionManagerAdapter` surface, with the `TrackedSession` interface carrying `{sessionId, agent, delegationId, directory, paneId, spawnTime, ageTimer}` (7 fields, no state). P52 expanded the observer module to emit `session-state-changed` and `pane-captured` events. P53 added `src/hooks/pane-monitor.ts` (490 LOC) consuming `pane-captured` and writing per-session journal files under `.hivemind/journal/<sid>/<ISO>-pane.json` with exponential backoff and a 100/session/hour rate cap — establishing the file-write contract pattern (P53 `writeOnce` uses `flag: "wx"` for exclusive create, D-04 silent-fallback, `logWarn` for errors).

What exists today:
- `src/features/tmux/session-manager.ts` (303 LOC) — `SessionManager` class with `private readonly sessions = new Map<string, TrackedSession>()`; constructor takes `(multiplexer, serverUrl, directory, log?, layout, mainPaneSize)`; `onSessionCreated` adds to `sessions` after spawn success; `handleSessionClose` clears the entry and closes the tmux pane. No `state` field on `TrackedSession`. (P51)
- `src/features/tmux/types.ts` — `SessionManagerAdapter` interface with 6 methods: `onSessionCreated`, `respawnIfKnown`, `getMainPaneId`, `sendKeys`, `listPanes`, `createPaneGridPlanner`. The 27-tool-key invariant locks this surface — P54 must NOT add a 7th method.
- `src/features/tmux/integration.ts:194-261` — `createTmuxIntegrationIfSupported` factory; the D-04 silent-fallback contract is enforced via `try { … } catch { return null }` (line 258-260). P54 must preserve D-04 — persistence must never throw.
- `src/hooks/pane-monitor.ts` (490 LOC) — reference for the `createPaneMonitorHook(opts: { journalRoot?, logWarn? })` factory pattern: closure-captured state, `dispose()` teardown, no-throw error handling, `logWarn` fallback to `console.warn`. P54 follows the same factory pattern (P53 D-04 mirror).
- `node:crypto` built-in — Node 20+ ships `crypto.getRandomValues()` and `crypto.timingSafeEqual()`; no `uuid` package is in `package.json:49-57` and the P20 invariant forbids new deps. UUIDv7 must be generated inline.
- `.hivemind/state/` — canonical per-Q6 internal state root; never committed (R-P50-03 spirit). Currently contains only `agent-work-contracts.json`, `config-workflows.json`, `trajectory-ledger.json`, `version.json` (no `tmux-sessions/` subdir yet). P54 introduces `.hivemind/state/tmux-sessions/` as a new subdir.

The gap: the in-tree `SessionManager` keeps state in memory only — a harness restart loses all knowledge of live tmux sessions. The seed success criterion 3 (P55) is "harness restart preserves `paused`/`detached` sessions" — this is exactly the L1 evidence the P54 EXECUTE will produce (kill harness parent during a live session, restart, verify file + tmux session both survive).

## Requirements

1. **Persistence module + factory** (REQ-54-01, ubiquitous) — A new `src/features/tmux/persistence.ts` module shall exist, export a `createSessionPersistence({projectDirectory, logWarn?})` factory, and define a `SessionPersistence` type.
   - **Current:** No persistence layer for tmux session metadata exists; state lives only in `SessionManager.sessions` (in-memory `Map`).
   - **Target:** New `src/features/tmux/persistence.ts` (≤ 500 LOC; target ~150 LOC) exports:
     - `createSessionPersistence(opts: { projectDirectory: string; logWarn?: (msg: string, err?: unknown) => void }): SessionPersistence` — factory that resolves `stateRoot = join(projectDirectory, ".hivemind", "state", "tmux-sessions")`, creates the dir on first call via `fs.mkdir(stateRoot, { recursive: true })`, and returns a `SessionPersistence` handle.
     - `SessionPersistence` interface: `persist(record: PersistedSession): Promise<void>`, `remove(sessionId: string): Promise<void>`, `restoreAll(): Promise<PersistedSession[]>`, `generateId(): string` (UUIDv7), and a test seam `__stateRoot: string` (read-only).
     - `PersistedSession` interface: `{ sessionId: string; agent: string; delegationId: string; directory: string; paneId: string; spawnTime: number; state: SessionState; lastTransitionAt: number; schemaVersion: 1 }` — exactly 9 fields, all required, no optional fields. `SessionState = "active" | "ready" | "paused" | "detached" | "failed"` — exactly 5 string-literal members.
     - `writeFile` uses `flag: "wx"` (exclusive create — never clobber an existing record). On `EEXIST` error, fall through to a `flag: "w"` overwrite (the new state supersedes the old).
     - `restoreAll` returns the array sorted by `spawnTime` ascending (UUIDv7 sort matches temporal order).
   - **Acceptance:** `git grep createSessionPersistence src/features/tmux/` returns exactly 1 definition; `git grep SessionPersistence src/features/tmux/` returns the type definition + 1 export; the module is ≤ 500 LOC; `tsc --noEmit` passes.

2. **Persist on every state transition** (REQ-54-02, state-driven) — While the persistence module receives a `persist(record)` call and the new `record.state` is one of `active | ready | paused | detached | failed`, the module shall serialize the record as JSON to `<stateRoot>/<record.sessionId>.json` with `flag: "wx"` (or fall back to `flag: "w"` on `EEXIST`) and update `lastTransitionAt = Date.now()` if the caller did not supply it.
   - **Current:** No state-transition persistence exists; `SessionManager` only mutates in-memory `TrackedSession` records.
   - **Target:** On every `persist(record)` call, the module:
     1. Validates `record.state` is one of the 5 `SessionState` literals (throws `TypeError` for invalid states — caller bug, not a runtime hazard, since the type system prevents it at compile time).
     2. Sets `record.lastTransitionAt = record.lastTransitionAt ?? Date.now()` and `record.schemaVersion = 1` (defensive — ensures on-disk contract).
     3. Writes to `<stateRoot>/<record.sessionId>.json` via `fs.writeFile(path, JSON.stringify(record, null, 2), { encoding: "utf-8", flag: "wx" })`.
     4. On `EEXIST` (file already exists from a prior persist), retries with `flag: "w"` to overwrite — preserves latest state.
     5. On any other write error: calls `logWarn` and **does not throw** (D-04 silent-fallback mirror from P53 `pane-monitor.ts:206-208`).
   - **Acceptance:** vitest transition test invokes `persist` 5 times in sequence with states `active, ready, paused, detached, failed` on a fresh session; assert after the 5th call: file exists, `jq -r .state <file>` returns `"failed"`, `jq -r 'keys | length' <file>` returns `9`, `jq -r .schemaVersion <file>` returns `1` (number, not string), and `lastTransitionAt` is monotonically non-decreasing across the 5 transitions. A second vitest injects an `EEXIST` error on first write and asserts the second write (with `flag: "w"`) succeeds and the file contains the latest state.

3. **Restore on harness startup for `paused` and `detached`** (REQ-54-03, state-driven) — While the harness boots and `restoreAll()` is invoked, the persistence module shall scan `<stateRoot>/*.json`, parse each file, filter to records with `state ∈ {"paused", "detached"}`, and return the filtered array sorted by `spawnTime` ascending.
   - **Current:** No restore path exists; the in-tree `SessionManager.sessions` Map is empty after every restart.
   - **Target:** `restoreAll()`:
     1. `readdir(stateRoot)` — returns `string[]` of filenames; filter to `*.json`.
     2. For each file: `readFile` → `JSON.parse` → wrap in try/catch (malformed files: `logWarn` and skip; never throw — D-04).
     3. Validate the parsed record has all 9 required fields and `state` is one of the 5 literals; invalid records are skipped with a `logWarn`.
     4. Filter: keep only records where `state === "paused"` OR `state === "detached"`. Records with `state ∈ {"active", "ready", "failed"}` are NOT returned.
     5. Sort the filtered array by `spawnTime` ascending (UUIDv7 prefix sorts the same way).
   - **Acceptance:** vitest restore test seeds 5 JSON files: one `paused`, one `detached`, one `active`, one `ready`, one `failed` (each with distinct `spawnTime`). Asserts `restoreAll()` returns exactly 2 records (the `paused` and `detached`), in `spawnTime` order. A second vitest seeds a malformed file (invalid JSON) and a missing-field file; asserts both are skipped with `logWarn` and not in the returned array. A third vitest asserts the case `stateRoot` does not exist (fresh project) returns an empty array without throwing.

4. **UUIDv7 for all new session IDs** (REQ-54-04, ubiquitous) — The `generateId()` method on `SessionPersistence` shall return a fresh RFC-9562 UUIDv7 string on every call, generated inline using `node:crypto.getRandomValues()`.
   - **Current:** No UUIDv7 generator exists; session IDs come from upstream `event.properties.info.id` (the OpenCode SDK generates these — version unknown, not necessarily sortable).
   - **Target:** A 20-line `generateUuidV7()` function:
     - Reads `Date.now()` (48-bit big-endian unsigned integer = Unix ms).
     - Calls `crypto.getRandomValues(new Uint8Array(10))` for 80 random bits.
     - Sets the version bits: bits 48-51 of the 16-byte UUID = `0b0111` (version 7) — i.e., the high nibble of byte 6 is `7`, so the 3rd group starts with `7xxx`.
     - Sets the variant bits: bits 64-65 of the UUID = `0b10` (RFC 4122 variant) — i.e., the high 2 bits of byte 8 are `10`, so the 4th group starts with `8`, `9`, `a`, or `b`.
     - Formats as `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx` (lowercase hex, hyphens at positions 8/13/18/23).
     - Returns the formatted string.
   - **Acceptance:** vitest ID test calls `generateId()` 1000 times; asserts every result matches the regex `^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; asserts lexicographic sort of 100 generated IDs matches numeric sort of their `Date.now()` extracted from the first 12 hex chars (UUIDv7 temporal monotonicity); asserts no two IDs in 1000 generations are identical (no collision — birthday bound `1000^2 / 2^74 ≈ 5.4e-17`).

5. **Wire to `SessionManager` — call `persistence.persist()` on every state transition** (REQ-54-05, ubiquitous) — The `SessionManager` class shall be modified to accept an optional `persistence?: SessionPersistence` constructor parameter and shall call `persistence.persist(record)` on every tracked-session state transition (`active → ready` on spawn success, `* → failed` on `handleSessionClose`).
   - **Current:** `SessionManager` has no persistence hook; `TrackedSession` has no `state` field; the class signature is `(multiplexer, serverUrl, directory, log?, layout, mainPaneSize)`.
   - **Target:** Minimal mutation to `src/features/tmux/session-manager.ts`:
     1. Add `state: SessionState` field to the `TrackedSession` interface (initial value: `"active"`).
     2. Add `persistence?: SessionPersistence` as the LAST constructor parameter (defaults to `undefined`). The parameter is OPTIONAL — when absent, behavior is identical to P51 (no persistence layer). The class does NOT throw if `persistence` is undefined.
     3. In `onSessionCreated` after `this.sessions.set(sessionId, tracked)` (around line 199): set `tracked.state = "ready"`, call `void this.persistence?.persist(this.toPersistedSession(tracked))` (fire-and-forget; persistence errors are swallowed by REQ-54-02 D-04).
     4. In `handleSessionClose` (around line 289) BEFORE `this.sessions.delete(sessionId)`: set `tracked.state = "failed"`, call `void this.persistence?.persist(this.toPersistedSession(tracked))`. The `failed` record persists briefly to disk, then the in-memory entry is removed. (Future `remove()` calls are out of scope for P54; the `failed` record is overwritten by the next `restoreAll()` filter that excludes it.)
     5. Add a private `toPersistedSession(tracked: TrackedSession): PersistedSession` helper that maps `TrackedSession` → `PersistedSession` (drops the `ageTimer` field, adds `state` from `tracked.state`, sets `lastTransitionAt = Date.now()`).
     6. Update the `SessionManagerAdapter` interface in `src/features/tmux/types.ts:151-162` — DO NOT add a new method. The adapter's `onSessionCreated` and `respawnIfKnown` signatures are unchanged; persistence is an implementation detail of `SessionManager`, not part of the public adapter surface (preserves 27-tool-key invariant).
   - **Acceptance:** `git grep "persistence?.persist" src/features/tmux/session-manager.ts` returns exactly 2 call sites (one in `onSessionCreated` after `sessions.set`, one in `handleSessionClose` before `sessions.delete`); `git grep "state: SessionState" src/features/tmux/session-manager.ts` returns the new field on the `TrackedSession` interface; the `SessionManagerAdapter` interface in `types.ts` is byte-identical to its P51 form (6 methods, no additions); the `git diff` of `src/features/tmux/session-manager.ts` shows ≤ 30 lines added, 0 lines removed (additive only).

## Boundaries

**In scope:**
- `src/features/tmux/persistence.ts` creation (≤ 500 LOC; target ~150 LOC; new file)
- Minimal additive mutation to `src/features/tmux/session-manager.ts` (add `state` field to `TrackedSession`, add `persistence?` constructor param, add 2 `persist()` call sites, add 1 private `toPersistedSession` helper — net ≤ 30 LOC added, 0 lines removed)
- No mutation to `src/features/tmux/types.ts` (`SessionManagerAdapter` interface stays byte-identical — preserves 27 tool keys)
- File writes to `.hivemind/state/tmux-sessions/<sid>.json` (local runtime writes, never committed — R-P50-03 spirit)
- `restoreAll()` filtering to `paused` + `detached` (excludes `active`, `ready`, `failed`)
- UUIDv7 generation via `node:crypto.getRandomValues()` (no new `package.json` deps — P20 invariant)
- D-04 silent-fallback mirror: all persistence errors are caught and logged via `logWarn`; no throw crosses the module boundary
- Tests: 1 BATS scenario (`tests/scripts/tmux/56-session-persistence-kill-restart.bats` — the kill-parent-restart-recovery contract) + 4 vitest files (transitions, restore filter, UUIDv7 generation, malformed-record resilience) — BATS slot 56 follows the P52/P53 `5X-tmux-...` naming convention
- Atomic commit per the project-wide P20 + AGENTS.md commit-discipline rule; L1 verification requires a manual `kill -9 <harness-pid>` followed by harness restart with the file + tmux session both intact

**Out of scope:**
- P55 E2E UAT (4 seed-criterion BATS scenarios, including the session-persistence seed criterion 3)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03 — strict append-only, EXECUTE must not touch)
- Adding new tools to the OpenCode SDK (27-tool-key invariant — `SessionManagerAdapter` is unchanged)
- `remove()` calls on the `SessionPersistence` API after `failed` records (orphaned `failed` JSON files are harmless and excluded by the `restoreAll` filter; cleanup is a future phase)
- Auto-pause / auto-detach orchestration (the P54 persistence layer just records state transitions; the logic that decides when to transition `ready → paused` or `ready → detached` is a downstream concern — likely P55 or later)
- New `package.json` dependencies (P20 invariant — UUIDv7 is inline)
- Sidecar dashboard rendering of session state (separate downstream scope, not P54)
- Modifying the `ForkSessionManager` interface in `observers.ts` (P54 is a persistence consumer, not an observer)
- Changing the `TrackedSession.ageTimer` field semantics (P51's 30-min auto-close remains the same)
- CP-PTY-00 (docs/spec-only spike) — P54 must leave the runway clear but does not block on it

## Constraints

- **Q6 (canonical state root):** `.hivemind/` is the internal state root per Q6 from `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`; `.opencode/` is OpenCode-primitives-only. P54 writes to `.hivemind/state/tmux-sessions/`, never to `.opencode/`.
- **D-04 (P51 silent-fallback):** persistence must never throw on filesystem errors, missing directory, malformed JSON, or invalid state — all failure modes return silently with `logWarn` (mirrors P53 `pane-monitor.ts:206-208`).
- **R-P50-03 (spirit):** `.hivemind/state/tmux-sessions/*` is local runtime state (NOT committed); gitignored in spirit, mirroring R-P50-03 for `.hivemind/session-tracker/*`. EXECUTE writes are local-disk durable but never tracked in git.
- **P20 invariant:** no new `package.json` dependencies; UUIDv7 is implemented inline using `node:crypto.getRandomValues()` (Node 20+ built-in).
- **Module LOC cap:** `src/features/tmux/persistence.ts` ≤ 500 LOC (AGENTS.md hard cap; target ~150 LOC); the additive changes to `session-manager.ts` are ≤ 30 LOC net.
- **27-tool-key invariant:** no new tool registrations; the `SessionManagerAdapter` interface is byte-identical to its P51 form (6 methods: `onSessionCreated`, `respawnIfKnown`, `getMainPaneId`, `sendKeys`, `listPanes`, `createPaneGridPlanner`).
- **AGENTS.md §7 (CP-PTY runway):** P54 EXECUTE may create a new file (`persistence.ts`) and add ≤ 30 LOC of additive changes to `session-manager.ts` (no removals, no reshuffles of existing code); the minimal mutation preserves the CP-PTY-00 docs/spec-only phase's ability to land later without conflict.
- **Schema versioning:** `schemaVersion: 1` is a numeric literal in the `PersistedSession` type (number, not string — mirrors P53 `JournalEntry.schemaVersion: 1` at `pane-monitor.ts:108` after the D-53-13 SPEC/CONTEXT drift fix).
- **Atomicity:** EXECUTE commit must be atomic (one logical change = one commit per the project-wide commit-discipline rule).
- **Wire-in approach:** persistence is an OPTIONAL constructor param on `SessionManager`; when `persistence` is undefined, the class behaves byte-identically to P51 (no behavior change, no errors). The persistence is wired at the composition root (`integration.ts:194-261`) by passing the `SessionPersistence` handle into the `new SessionManager(...)` call as the 7th argument.

## Acceptance Criteria

- [ ] `src/features/tmux/persistence.ts` exists and exports `createSessionPersistence` (1 definition)
- [ ] `src/features/tmind/persistence.ts` is ≤ 500 LOC (target ~150 LOC)
- [ ] `SessionPersistence` interface has exactly 4 public methods: `persist`, `remove`, `restoreAll`, `generateId` (+ 1 read-only test seam `__stateRoot`)
- [ ] `PersistedSession` interface has exactly 9 required fields: `sessionId`, `agent`, `delegationId`, `directory`, `paneId`, `spawnTime`, `state`, `lastTransitionAt`, `schemaVersion`
- [ ] `SessionState` is a union of exactly 5 string literals: `"active" | "ready" | "paused" | "detached" | "failed"`
- [ ] `src/features/tmux/session-manager.ts` accepts a 7th optional constructor param `persistence?: SessionPersistence` (additive only)
- [ ] `git grep "persistence?.persist" src/features/tmux/session-manager.ts` returns exactly 2 call sites (one in `onSessionCreated` after `sessions.set`, one in `handleSessionClose` before `sessions.delete`)
- [ ] `git diff` of `src/features/tmux/session-manager.ts` between P53 HEAD and P54 EXECUTE shows ≤ 30 lines added and 0 lines removed
- [ ] `src/features/tmux/types.ts` is byte-identical to its P51 form (6 `SessionManagerAdapter` methods, no additions)
- [ ] 1 BATS scenario passes (`tests/scripts/tmux/56-session-persistence-kill-restart.bats`): spawns a session, captures harness PID, `kill -9` the harness, restarts harness, asserts `.hivemind/state/tmux-sessions/<sid>.json` exists with `state = "ready"` and the tmux session is still alive (`tmux has-session -t <name>` returns 0)
- [ ] vitest transition test: 5 sequential `persist()` calls with states `active, ready, paused, detached, failed`; file contains the 5th state; `jq 'keys | length' = 9`; `jq .schemaVersion = 1` (number)
- [ ] vitest EEXIST test: 1st `writeFile` with `flag: "wx"` fails with `EEXIST`; 2nd call with `flag: "w"` overwrites; final file state matches the latest record
- [ ] vitest restore filter test: seed 5 files (`paused`, `detached`, `active`, `ready`, `failed`); `restoreAll()` returns exactly 2 (the `paused` and `detached`), sorted by `spawnTime` ascending
- [ ] vitest malformed-record test: 1 invalid-JSON file + 1 missing-field file; both skipped with `logWarn`; neither appears in `restoreAll()` output
- [ ] vitest empty-stateRoot test: nonexistent `stateRoot`; `restoreAll()` returns `[]` and does not throw
- [ ] vitest UUIDv7 test: 1000 `generateId()` calls; all match regex `^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; 0 collisions; lexicographic sort matches `Date.now()` numeric sort
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run test` passes without regressions (3149+ vitest cases, 40+ BATS)
- [ ] No modifications to `.hivemind/session-tracker/*` (R-P50-03)
- [ ] No new `package.json` entries (P20 invariant)
- [ ] No new tools registered (27-tool-key invariant)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                                    |
|--------------------|-------|------|--------|------------------------------------------------------------------------------------------|
| Goal Clarity       | 0.94  | 0.75 | ✓      | ROADMAP L2003-2012 + P53 SPEC pattern + P51 SessionManager shape + L1 kill-restart evidence contract |
| Boundary Clarity   | 0.91  | 0.70 | ✓      | Explicit in/out; P55 deferred; SessionManagerAdapter byte-identical constraint; CP-PTY-00 preservation |
| Constraint Clarity | 0.88  | 0.65 | ✓      | Q6, D-04, R-P50-03 spirit, P20, LOC cap, §7, 27-tool-key, atomic commit all locked        |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 21 pass/fail checks; BATS 1 + vitest 5; L1 runtime proof via kill-restart; UUIDv7 regex deterministic |
| **Ambiguity**      | 0.09  | ≤0.20| ✓      | Composite = 1 − mean(0.94, 0.91, 0.88, 0.90) ≈ 0.0925 → 0.09 (floor to 2 decimals)        |

All dimensions meet or exceed minimums. No dimensions below threshold. Composite ambiguity 0.09 ≤ 0.20 gate: **PASS**.

## Interview Log

| Round | Perspective     | Question summary            | Decision locked                                                                                |
|-------|-----------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| —     | (auto mode)     | Initial ambiguity ≤ 0.20    | Skipped interview — SPEC.md derived from ROADMAP L2003-2012 + P53 SPEC format + P51 SessionManager + Q6/D-04/P20/R-P50-03 |

---

*Phase: 54-session-persistence-restart-recovery*
*Spec created: 2026-06-02*
*Next step: /gsd-discuss-phase 54 — implementation decisions (UUIDv7 random source, file write concurrency on rapid transitions, restore order vs spawn order, malformed-record skip threshold)*
