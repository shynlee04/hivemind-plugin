# Phase 54: Session Persistence + Restart-Recovery - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-locked, implementation decisions only)

<domain>
## Phase Boundary

Add `src/features/tmux/persistence.ts` (≤ 500 LOC; target ~150 LOC) as a new sibling module to the P51 `SessionManager`. The module exports a `createSessionPersistence({projectDirectory, logWarn?})` factory that writes per-session JSON records to `.hivemind/state/tmux-sessions/<sessionId>.json` on every state transition (`active → ready → paused → detached → failed`). Each record is a 9-field `PersistedSession` shape with `schemaVersion: 1`. Restore is filtered to `paused` + `detached` (skip `active`, `ready`, `failed`). UUIDv7 is generated inline via `node:crypto.getRandomValues()` (no new `package.json` deps — P20 invariant). `SessionManager` gains a 7th optional constructor param `persistence?: SessionPersistence` and calls `persistence.persist(record)` on every state transition (2 call sites: `onSessionCreated` after `sessions.set`, `handleSessionClose` before `sessions.delete`). `SessionManagerAdapter` interface in `types.ts` remains byte-identical to P51 (6 methods — 27-tool-key invariant). Deliverables: 1 new file (`persistence.ts`), ≤ 30 LOC additive mutations to `session-manager.ts`, 1 BATS scenario (`tests/scripts/tmux/56-session-persistence-kill-restart.bats` — slot 56 follows the P52/P53 `5X-tmux-...` naming convention), 5 vitest files. L1 evidence: BATS 1/1 (real OS process survival — kill harness parent, restart, verify `.hivemind/state/tmux-sessions/<sid>.json` + tmux session both intact), vitest 5/5, tsc exit 0.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `54-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `54-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- `src/features/tmux/persistence.ts` creation (≤ 500 LOC; target ~150 LOC; new file)
- `createSessionPersistence({projectDirectory, logWarn?})` factory + `SessionPersistence` interface (4 public methods + 1 read-only test seam) + `PersistedSession` interface (9 required fields) + `SessionState` union (5 string literals)
- UUIDv7 generator inline via `node:crypto.getRandomValues()` (no new deps — P20 invariant)
- Atomic file write with `flag: "wx"` (EEXIST → fall back to `flag: "w"`)
- `restoreAll()` filter: keep only `paused` + `detached`; sort by `spawnTime` ascending
- Minimal additive mutation to `src/features/tmux/session-manager.ts` (add `state: SessionState` field to `TrackedSession`, add `persistence?` 7th constructor param, add 2 `persist()` call sites, add 1 private `toPersistedSession` helper — net ≤ 30 LOC added, 0 lines removed)
- Wire `persistence` at composition root (`integration.ts:194-261`) by passing as 7th `new SessionManager(...)` argument
- 1 BATS scenario (`tests/scripts/tmux/56-session-persistence-kill-restart.bats`) + 5 vitest files (transitions, EEXIST, restore filter, malformed-record resilience, empty-stateRoot, UUIDv7)
- D-04 silent-fallback mirror: all persistence errors caught + logged via `logWarn`; no throw crosses the module boundary

**Out of scope (from SPEC.md):**
- P55 E2E UAT (4 seed-criterion BATS scenarios, including session-persistence seed criterion 3)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03 — strict append-only, EXECUTE must not touch)
- Adding new tools to the OpenCode SDK (27-tool-key invariant — `SessionManagerAdapter` is byte-identical to P51)
- `remove()` calls on the `SessionPersistence` API after `failed` records (orphaned `failed` JSON files are harmless and excluded by the `restoreAll` filter; cleanup is a future phase)
- Auto-pause / auto-detach orchestration (P54 persistence layer just records state transitions; the logic that decides when to transition `ready → paused` is a downstream concern — likely P55 or later)
- New `package.json` dependencies (P20 invariant — UUIDv7 is inline)
- Sidecar dashboard rendering of session state
- Modifying `ForkSessionManager` interface in `observers.ts` (P54 is a persistence consumer, not an observer)
- Changing `TrackedSession.ageTimer` field semantics (P51's 30-min auto-close remains)
- CP-PTY-00 (docs/spec-only spike) — P54 must leave the runway clear but does not block on it

</spec_lock>

<decisions>
## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| **D-54-01** | Module path is `src/features/tmux/persistence.ts` (sibling of `session-manager.ts`, `observers.ts`, `tmux-multiplexer.ts`) | REQ-54-01 acceptance requires `git grep createSessionPersistence src/features/tmux/` to return exactly 1 definition. Sibling placement matches the P51 in-tree tmux-feature layout: `src/features/tmux/{session-manager,observers,tmux-multiplexer,grid-planner,types,integration}.ts` — the new module joins this sibling set as a peer concern. Per `.planning/codebase/STRUCTURE.md` file-placement conventions, feature modules live under `src/features/<feature>/<role>.ts`; "persistence" is a role distinct from session-manager (lifecycle) and observers (event subscription). |
| **D-54-02** | Persistence root is `.hivemind/state/tmux-sessions/<sessionId>.json` (Q6 canonical internal state root) | Q6 locked decision (`.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — canonical state root + `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`): `.hivemind/` is the internal state root; `.opencode/` is OpenCode-primitives-only. The path mirrors P53 `.hivemind/journal/<sessionId>/` (D-53-02) and the pre-existing `.hivemind/state/{agent-work-contracts,config-workflows,trajectory-ledger,version}.json` — subdirs of `.hivemind/state/` are the established convention for feature-scoped durable state. The `tmux-sessions/` subdir is new (verified: `ls .hivemind/state/` shows only the 4 pre-existing files); P54 introduces it. R-P50-03 spirit: never committed; runtime state stays on local disk only. |
| **D-54-03** | `PersistedSession` interface has exactly 9 required fields: `sessionId`, `agent`, `delegationId`, `directory`, `paneId`, `spawnTime`, `state`, `lastTransitionAt`, `schemaVersion: 1` (numeric literal) | REQ-54-01 acceptance: `jq -r 'keys | length' <file>` returns `9`. The 9 fields are a minimal forward-compatible shape: `sessionId`/`agent`/`delegationId`/`directory`/`paneId`/`spawnTime` (6 of 9) are carried over from P51 `TrackedSession` minus `ageTimer` (which is in-memory only — a `setTimeout` ref has no business on disk); `state` (7th) is the P54 state-machine field; `lastTransitionAt` (8th) is the audit timestamp for restore ordering + state-change replay; `schemaVersion: 1` (9th) is a numeric literal (NOT string `"1.0"` — mirrors P53 `JournalEntry.schemaVersion: 1` at `pane-monitor.ts:108` after the D-53-13 SPEC/CONTEXT drift fix; this is the locked project convention). All 9 fields are required (no optional) — `restoreAll()` validation rejects records with missing fields. |
| **D-54-04** | State machine: `active → ready → paused → detached → failed` — exactly 5 string literals, no other members | REQ-54-01 acceptance: `SessionState` is a union of exactly 5 string literals. The 5 states cover the full lifecycle: `active` (spawn initiated, pane creation in flight — initial `TrackedSession.state` value); `ready` (spawn succeeded, pane is live and tracked); `paused` (downstream orchestration paused the session — future P55+ will set this); `detached` (tmux pane survives harness restart but is no longer hooked to a live in-memory record — the target state for restart-recovery); `failed` (terminal — `handleSessionClose` or `ageTimer` expiry). `restoreAll()` filters to `paused ∪ detached` because these are the only states where a tmux session can still be alive on a separate OS process after the harness parent died. |
| **D-54-05** | `persist(record)` is called on EVERY state transition (not just on shutdown) — writes to disk synchronously inside the call | REQ-54-02 acceptance: vitest transition test fires 5 sequential `persist()` calls with states `active, ready, paused, detached, failed`; after the 5th call the file must contain the 5th state. The "every transition" policy is the **kill-parent-restart-recovery contract**: if the harness parent is killed between transitions, the last persisted state is on disk. A "shutdown-only" policy would lose all state if the parent dies before graceful shutdown (the common case for `kill -9`). The write is wrapped in a `try/catch` (D-04 silent-fallback — see D-54-09) but the intent is "best effort on every transition, durable on graceful shutdown." The in-memory `Map<sessionId, TrackedSession>` is the source of truth during the process lifetime; disk is the source of truth across process lifetimes. |
| **D-54-06** | Restore on startup: `restoreAll()` scans `.hivemind/state/tmux-sessions/`, parses each `*.json`, filters to `state ∈ {"paused", "detached"}`, returns sorted by `spawnTime` ascending; `failed` records are NOT auto-restored | REQ-54-03 acceptance: vitest restore test seeds 5 files (`paused`, `detached`, `active`, `ready`, `failed`); `restoreAll()` returns exactly 2 (the `paused` and `detached`), sorted by `spawnTime` ascending. The `failed` exclusion is critical: a `failed` record is a terminal state (the tmux pane was already closed in `handleSessionClose`); trying to re-attach would attempt a `tmux has-session` on a dead pane and fail. The `paused` + `detached` filter mirrors the SPEC's P55 seed criterion 3 (harness restart preserves `paused`/`detached` sessions). UUIDv7 sortable prefix means `spawnTime` ascending and lexicographic filename ascending produce the same order — defensive double-sort is cheap. |
| **D-54-07** | UUIDv7 generator is inline: `Date.now()` (48-bit big-endian ms) + `crypto.getRandomValues(new Uint8Array(10))` (80 random bits), set version bits 48-51 = `0b0111` (the `7xxx` group prefix) + variant bits 64-65 = `0b10` (the `8/9/a/b` group prefix); format as `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx` lowercase hex | REQ-54-04 acceptance: vitest ID test calls `generateId()` 1000 times; asserts all match `^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`; asserts lexicographic sort matches numeric `Date.now()` sort (UUIDv7 temporal monotonicity); asserts 0 collisions (birthday bound `1000^2 / 2^74 ≈ 5.4e-17`). Per P20 invariant (AGENTS.md hard cap): no new `package.json` dependencies. `package.json:49-57` confirms no `uuid` package; the only relevant built-in is `node:crypto` (Node 20+ ships `crypto.getRandomValues()` per `engines.node: ">=20.0.0"`). RFC-9562 UUIDv7 format puts timestamp in the high 48 bits so lexicographic order matches creation order — the same ordering used by `restoreAll()`'s `spawnTime` sort. |
| **D-54-08** | `SessionManager` constructor adds `persistence?: SessionPersistence` as the 7th (LAST) optional parameter; `TrackedSession` gains a 8th field `state: SessionState` (initial value `"active"`); `persist()` is called from 2 call sites (`onSessionCreated` after `sessions.set`; `handleSessionClose` before `sessions.delete`) | REQ-54-05 acceptance: `git grep "persistence?.persist" src/features/tmux/session-manager.ts` returns exactly 2 call sites; `git diff` of `session-manager.ts` between P53 HEAD and P54 EXECUTE shows ≤ 30 lines added and 0 lines removed. The 7th-param placement is required because the existing 6-param signature `(multiplexer, serverUrl, directory, log?, layout, mainPaneSize)` is the public contract consumed at `integration.ts:194-261`; adding the new param at the END preserves all existing call sites (additive only). The `state: "active"` initial value matches REQ-54-05 step 1; transitions are `active → ready` (spawn success) and `* → failed` (close). The 2 call sites use `void this.persistence?.persist(this.toPersistedSession(tracked))` — `void` discards the promise; `?.` short-circuits when persistence is undefined (preserves P51 byte-identical behavior when persistence is absent). The private `toPersistedSession` helper drops `ageTimer` and maps `TrackedSession` → `PersistedSession` (adds `state`, sets `lastTransitionAt = Date.now()`). |
| **D-54-09** | D-04 silent-fallback: if `mkdir` or `writeFile` fails (excluding `EEXIST` which falls through to `flag: "w"`), `logWarn` is invoked and the function returns normally — no throw crosses the module boundary | D-04 silent-fallback contract (P50/P51, preserved through P52/P53): the persistence module is on the hot path of state transitions; throwing would break the `TrackedSession` mutation chain. Mirrors P53 `pane-monitor.ts:206-208, 303-308` (try/catch + `logWarn` + return on 4th failure, increment `counters.dropped`). The in-memory `Map<sessionId, TrackedSession>` remains the source of truth for the running process; disk is best-effort. Per REQ-54-01 acceptance and the in-scope D-04 mirror in the SPEC. |
| **D-54-10** | Atomic write: use `fs.writeFile(path, JSON.stringify(record, null, 2), { encoding: "utf-8", flag: "wx" })` for the FIRST attempt; on `EEXIST` (file already exists from a prior persist), retry with `flag: "w"` to overwrite — preserves the latest state | REQ-54-02 acceptance: vitest EEXIST test injects an `EEXIST` error on first write and asserts the second write (with `flag: "w"`) succeeds and the file contains the latest record. The `wx` flag is "exclusive create" — it fails with `EEXIST` if the file already exists. The `w` flag is "truncate-or-create" — it always succeeds, overwriting prior content. The two-flag pattern is a write-then-fallback race-safe atomicity strategy: the first attempt is a fast path for the common case (no prior record), the fallback handles the "second persist on the same record" case (every state transition is a second-or-later persist for that record). The JSON payload is small (~250 bytes for 9 fields), so the cost of the second write is negligible. |
| **D-54-11** | No cap on persistence writes (unlike P53's 100/session/hour journal cap) — every state transition MUST be persisted; failures are logged via `logWarn` and the in-memory state remains the source of truth, but the failure is NOT silently dropped (the log line is the operator-visible signal) | Differs from P53 D-53-06 (100 entries/session/hour cap on journal writes) by design. P53 journal entries are best-effort observational data (content snapshots for the observability layer); a cap protects against runaway pane-capture storms. P54 persistence entries are state-machine transition records — the data that lets `restoreAll()` re-attach `paused`/`detached` tmux sessions after a harness restart. Capping or dropping these would lose the very state that the kill-parent-restart-recovery contract is designed to preserve. The D-04 silent-fallback (D-54-09) still applies (no throw), but the log line is mandatory — a missing log line is the only signal an operator gets that persistence is silently failing. |
| **D-54-12** | BATS scenario `tests/scripts/tmux/56-session-persistence-kill-restart.bats` is a REAL OS process survival test (NOT a mock): spawns a tmux session in BATS, captures the harness PID, runs `kill -9 <harness-pid>`, restarts the harness, asserts (1) `.hivemind/state/tmux-sessions/<sid>.json` exists with `state = "ready"` and (2) `tmux has-session -t <name>` returns 0 (the tmux session is still alive on its own OS process) | REQ-54 acceptance + the SPEC's "kill-parent-restart-recovery" headline contract. A mocked test (stubbing `fs.writeFile` + `fs.readdir`) would prove the persistence module's logic in isolation but would NOT prove the end-to-end contract: a tmux pane is a child OS process whose parent is the harness; if the harness dies, the tmux process MUST continue independently (tmux server is the grandparent). The BATS scenario uses a real harness binary (`node dist/plugin.js` or `bin/hivemind.cjs`) and the system `tmux` binary; it follows the established P52 `52-tmux-copilot-factory-swap.bats` and P53 `55-pane-monitor-journal-capture.bats` BATS patterns in `tests/scripts/tmux/`. Slot 56 follows the P52/P53 `5X-tmux-...` naming convention (existing BATS in `tests/scripts/tmux/`: `01-06-...` for older slots, `52-55-...` for the P52/P53 cycle). L1 evidence: this is the L1 runtime proof; the vitest files prove the module's internal logic, the BATS scenario proves the end-to-end contract. |

## Open Questions

None. All 12 gray areas (UUIDv7 random source, file-write concurrency on rapid transitions, restore order vs spawn order, malformed-record skip threshold, write-failure fallback, restore filter membership, BATS test scope, etc.) are resolved by the SPEC and the decisions above. The `restoreAll()` filter, the `wx`/`w` write pattern, the inline UUIDv7 generator, the D-04 silent-fallback contract, the no-cap policy, and the real-OS BATS scope are all locked.

## the agent's Discretion

The implementer has flexibility for the following implementation details (no SPEC constraint, no user preference captured):

- Exact JSDoc depth on private helper functions (public API requires full JSDoc per `AGENTS.md`; private helpers may be one-line)
- Specific `Map` accessor naming (`get` / `set` / `has` vs `ensure` / `increment`) — must follow kebab-case per `.planning/codebase/CONVENTIONS.md`
- Test fixture data shape for BATS — the synthetic `PersistedSession` payload values (any valid 9-field record satisfies the SPEC)
- Exact wording of `logWarn` error messages — must include "persistence" + the underlying error message, but exact phrasing is flexible
- Order of `mkdir` + `writeFile` calls inside `persist()` — the SPEC mandates `mkdir({recursive: true})` first, then `writeFile`; the implementer may inline this or extract a `writeRecord` helper
- Whether to extract UUIDv7 generation as a separate exported function `generateUuidV7()` or keep it inline inside the `SessionPersistence.generateId()` closure
- Whether `toPersistedSession` (the private SessionManager helper) is implemented as a method or an arrow function field — both satisfy the SPEC
- Vitest test organization: separate files per concern vs. a single `persistence.test.ts` with `describe` blocks — both satisfy the SPEC's 5 vitest files floor (transition, EEXIST, restore-filter, malformed-record, empty-stateRoot, UUIDv7 can be 5 or 6 files)
- BATS test organization: single scenario vs. `@test` block — the SPEC mandates 1 scenario; the implementer chooses the inner `run` / `assert_success` style consistent with P52/P53 BATS files
- Whether the `__stateRoot` test seam is a getter property or a plain field — both satisfy the SPEC's "read-only" contract as long as the value is not mutable from outside the module

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/54-session-persistence-restart-recovery/54-SPEC.md` — Locked spec: 5 EARS requirements (REQ-54-01..05), ambiguity gate PASSED at 0.09 ≤ 0.20, 21 acceptance criteria, 27-tool-key invariant locked
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-CONTEXT.md` — Prior-phase decisions: D-53-04 (7-field journal entry shape with `schemaVersion: 1` numeric literal — directly relevant to D-54-03), D-53-07 (in-memory backoff state), D-53-12 (defer `session-state-changed` to P54)
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-SPEC.md` — P53 contract: `createPaneMonitorHook` factory pattern + `writeOnce` with `flag: "wx"` (D-54-10 mirror)
- `.planning/phases/52-wire-tmux-copilot-state-query/52-CONTEXT.md` — Prior-phase decisions: D-01 single-tool discriminated union, D-04 tool placement convention
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-CONTEXT.md` — Prior-phase decisions: D-04 graceful-fallback (preserved through P52/P53/P54), D-03 `[Harness]Tmux*` error prefix
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-SPEC.md` — P51 contract: `SessionManager` 6-param constructor + `TrackedSession` 7-field interface (P54 adds an 8th field `state: SessionState`)

### Roadmap and Requirements
- `.planning/ROADMAP.md` L2003-2012 — P54 phase entry with the kill-parent-restart-recovery contract
- `.planning/ROADMAP.md` L2012 — Seed criterion 3 (P55): "harness restart preserves `paused`/`detached` sessions"
- `.planning/REQUIREMENTS.md` — Requirement registry (REQ-54-01..05 trace)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; `src/features/tmux/` is the feature layer (where `persistence.ts` lives)
- `.planning/codebase/STRUCTURE.md` — File placement: `src/features/<feature>/<role>.ts` for feature modules
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read, no `any`

### Source Code (read-only references for P54 implementer)
- `src/features/tmux/session-manager.ts` (303 LOC) — **TO BE MUTATED ADDITIVELY** (≤ 30 LOC added, 0 removed). Constructor at L118-125 (6 params); `TrackedSession` interface at L81-89 (7 fields); `onSessionCreated` at L153-224 (persist call site at L199, after `sessions.set`); `handleSessionClose` at L289-302 (persist call site at L298, before `sessions.delete`).
- `src/features/tmux/types.ts` (203 LOC) — **MUST remain byte-identical** (REQ-54-05 step 6). `SessionManagerAdapter` interface at L151-162 (6 methods: `onSessionCreated`, `respawnIfKnown`, `getMainPaneId`, `sendKeys`, `listPanes`, `createPaneGridPlanner`). 27-tool-key invariant.
- `src/features/tmux/integration.ts:194-261` — **Composition root wire point** — `createTmuxIntegrationIfSupported` factory; the new `persistence` handle is passed as the 7th argument to `new SessionManager(...)` (additive change, ≤ 5 LOC).
- `src/hooks/pane-monitor.ts` (490 LOC) — Reference for the `createPaneMonitorHook` factory pattern: closure-captured state, `dispose()` teardown, no-throw error handling, `logWarn` fallback to `console.warn`. P54 follows the same factory pattern (P53 D-04 mirror).
- `src/features/tmux/observers.ts` — P52-expanded `createTmuxEventObserver`; P54 does NOT mutate this file (P54 is a persistence consumer, not an observer).
- `src/plugin.ts` — Composition root; the P54 `createSessionPersistence` factory is called here (1 call site) and the result is passed to the SessionManager constructor at `integration.ts`.

### Test Targets
- `tests/scripts/tmux/56-session-persistence-kill-restart.bats` — **NEW FILE** (1 BATS scenario; slot 56 follows P52/P53 `5X-tmux-...` convention; BATS scenarios currently in `tests/scripts/tmux/`: 01-06 + 52-55)
- `tests/lib/tmux-persistence.test.ts` — **NEW FILE** (5 vitest files: transitions, EEXIST, restore-filter, malformed-record, UUIDv7; can be 5 or 6 files at implementer's discretion)
- `tests/lib/tmux-persistence-empty.test.ts` — **OPTIONAL** (empty-stateRoot edge case; may be folded into the main persistence test file)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC, no `any`
- `.planning/AGENTS.md` §7 — CP-PTY runway note: P54 creates one new file (`persistence.ts`) and adds ≤ 30 LOC to `session-manager.ts` — automatically satisfies the "no `src/**` mutation" rule for CP-PTY-00 landing later
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51, preserved through P52/P53) — Graceful-fallback contract: no throw on missing prerequisites or filesystem errors
- R-P50-03 (spirit) — `.hivemind/state/tmux-sessions/*` is local runtime state, never committed
- P20 invariant — No new `package.json` dependencies; UUIDv7 is inline using `node:crypto.getRandomValues()` (Node 20+ built-in)
- 27-tool-key invariant — No new tool registrations; `SessionManagerAdapter` interface is byte-identical to its P51 form

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/hooks/pane-monitor.ts:createPaneMonitorHook`** (490 LOC) — Reference pattern for P54's `createSessionPersistence` factory: closure-captured state, `dispose()` teardown, no-throw error handling, `logWarn` fallback to `console.warn`, `writeOnce` with `flag: "wx"`. The P54 `persist` and `restoreAll` methods follow the same shape.
- **`src/features/tmux/session-manager.ts:SessionManager`** (303 LOC) — The data source for P54's `toPersistedSession` helper. `TrackedSession` shape (7 fields) maps 1:1 to `PersistedSession` (9 fields) with 2 additions (`state`, `lastTransitionAt`) and 1 removal (`ageTimer`).
- **`src/features/tmux/integration.ts:createTmuxIntegrationIfSupported`** (lines 194-261) — The D-04 silent-fallback contract is enforced via `try { … } catch { return null }` (line 258-260). P54 must preserve D-04 — persistence must never throw. The new `persistence` handle is constructed inside this factory and passed as the 7th argument to `new SessionManager(...)`.
- **`src/features/tmux/types.ts:SessionManagerAdapter`** (interface at L151-162) — 6 methods, byte-identical to P51. P54 does NOT add a 7th method (27-tool-key invariant).

### Established Patterns
- **Factory with `logWarn?` fallback** (`src/hooks/pane-monitor.ts:202-208`) — `const logWarn = opts.logWarn ?? ((msg, err) => console.warn(\`[Harness] ...: ${msg}\`))`. P54's `createSessionPersistence` follows the same shape: `logWarn` defaults to `console.warn` with the `[Harness] persistence:` prefix.
- **`writeFile` with `flag: "wx"`** (`src/hooks/pane-monitor.ts:271-277`) — Exclusive create for the first attempt; on `EEXIST` (only relevant for the journal in P53), the entry is dropped. P54's `persist` adapts this: on `EEXIST`, fall through to `flag: "w"` (overwrite with the latest state).
- **Optional constructor parameter** (`src/features/tmux/session-manager.ts:118-125`) — The P51 `SessionManager` takes 6 params with `log?, layout, mainPaneSize` all optional. P54 adds a 7th optional `persistence?` param. When `persistence` is undefined, `void this.persistence?.persist(...)` short-circuits via optional chaining — P51 behavior is preserved byte-identically.
- **`__test` seams** (`src/hooks/pane-monitor.ts:__waitForPendingRetries`, `__testing`) — Read-only inspection surfaces for vitest. P54 adds `__stateRoot: string` (read-only) to the `SessionPersistence` interface for similar test inspection.

### Integration Points
- **`src/plugin.ts`** — Composition root; `createSessionPersistence({projectDirectory, logWarn})` is called here (1 call site) and the result is passed to the SessionManager constructor via the integration factory.
- **`src/features/tmux/integration.ts:194-261`** — `createTmuxIntegrationIfSupported` factory; the `persistence` handle is constructed inside the `try` block (alongside the existing `multiplexer`, `serverUrl`, `directory`, etc. setup) and passed as the 7th argument to `new SessionManager(...)`. The D-04 silent-fallback `try/catch` wraps the entire factory.
- **`src/features/tmux/session-manager.ts:onSessionCreated`** (line 199, after `this.sessions.set(sessionId, tracked)`) — P54's first `persist()` call site: `tracked.state = "ready"; void this.persistence?.persist(this.toPersistedSession(tracked))`.
- **`src/features/tmux/session-manager.ts:handleSessionClose`** (line 298, before `this.sessions.delete(sessionId)`) — P54's second `persist()` call site: `tracked.state = "failed"; void this.persistence?.persist(this.toPersistedSession(tracked))`.
- **`.hivemind/state/tmux-sessions/`** — New subdir (verified: `ls .hivemind/state/` shows only `agent-work-contracts.json`, `config-workflows.json`, `trajectory-ledger.json`, `version.json` — no `tmux-sessions/`). P54 introduces it via `fs.mkdir(stateRoot, { recursive: true })` in the `createSessionPersistence` factory.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC — open to standard approaches. The 12 decisions above resolve all gray areas surfaced during discuss-phase. The implementer follows well-established patterns from `src/hooks/pane-monitor.ts` (factory + logWarn + writeOnce with `wx`) and `src/features/tmux/session-manager.ts` (optional 7th constructor param + TrackedSession field addition).

</specifics>

<deferred>
## Deferred Ideas

- **Auto-pause / auto-detach orchestration** — The P54 persistence layer just records state transitions; the logic that decides when to transition `ready → paused` or `ready → detached` is a downstream concern (likely P55+). Without an orchestrator that sets these states, every session will only ever see `active → ready → failed` (the P51 lifecycle) until a future phase adds the orchestration. P54's `restoreAll` filter to `paused ∪ detached` is forward-compatible — once a future phase sets these states, the persistence layer already records them.
- **`remove()` calls after `failed` records** — The `failed` JSON file is left on disk after `handleSessionClose` writes it. Cleanup is deferred to a future phase; orphaned `failed` files are harmless and excluded by the `restoreAll` filter (D-54-06). The `SessionPersistence.remove(sessionId)` method is part of the SPEC's interface (REQ-54-01) but the call site is out of scope for P54.
- **`session-state-changed` hook subscription** — Deferred to a future P54-adjacent phase. P53 D-53-12 deferred this; P54 introduces persistence but does NOT add a hook subscriber to the `session-state-changed` event. The `createTmuxEventObserver.onSessionStateChanged` registration method is exposed by the P52 observer and is available for a future hook to consume.
- **JSON Schema migration strategy** — When `schemaVersion` increments from `1` to `2`, no migration path is defined. The 9-field shape is a v1 contract; future schema changes will require a separate `migrate(record, fromVersion)` function (out of scope for P54).
- **Cross-process file locking** — Multiple harness processes writing to the same `.hivemind/state/tmux-sessions/` directory simultaneously would race. The current design assumes a single harness process per `projectDirectory` (which is the common case). A future phase could add a `flock(2)`-based file lock if multi-process support is needed.
- **BATS socket teardown assertion (D-06 from P51)** — Not applicable here. The P54 BATS scenario uses a real tmux server (it spawns a real session), but the harness process under test is the one that gets killed — the tmux server itself is a system service that survives the harness crash by design. The assertion is "the tmux session is still alive after the harness parent dies" (`tmux has-session -t <name>` returns 0), which is a positive survival test, not a teardown test.
- **Telemetry / metrics on persistence writes** — No counter for `persist_success` / `persist_failure` is exposed. P53's `PaneMonitorCounters` provides this for journal writes; P54's `SessionPersistence` does not. Operators detect failures via the `logWarn` output. A future observability phase could add a `counters` field to the `SessionPersistence` interface.
- **Restore-time `tmux has-session` liveness check** — `restoreAll()` returns records purely from disk state; it does not verify that the tmux session is still alive (the SPEC defers the re-attach step to a downstream caller — likely a future "restore on startup" orchestrator that uses `tmux has-session -t <name>` to filter dead records). Adding a liveness check inside `restoreAll()` would couple the persistence layer to the multiplexer; the current design keeps the persistence layer independent of tmux.

---

*Phase: 54-session-persistence-restart-recovery*
*Context gathered: 2026-06-02*
*Checkpoint 5 (CONTEXT & ASSUMPTIONS) complete — 12 decisions locked, ready for Checkpoint 6 (RESEARCH) or Checkpoint 7 (PATTERNS)*
*Next checkpoint: CP7 (PATTERNS) — generate `54-PATTERNS.md` for the persistence module's reuse design, classes, interfaces, and architecture structure before planning.*
