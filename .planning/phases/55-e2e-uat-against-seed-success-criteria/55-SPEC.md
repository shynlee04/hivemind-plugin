# Phase 55: E2E UAT Against Seed's 4 Success Criteria — Specification

**Created:** 2026-06-02
**Ambiguity score:** 0.08 (gate: ≤ 0.20)
**Requirements:** 4 locked (one per seed success criterion)
**Seed:** `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` (advances from `planted` → `germinated` on gate pass)

## Goal

Author **4 BATS scenarios** — one per seed success criterion — that exercise the end-to-end tmux visual orchestration layer. Each criterion becomes its own BATS test, run in isolation, producing L1 runtime proof (real OS process survival — no mocks). A separate manual L2 evidence pass (screenshots of the tmux grid + journal entries) is captured in `55-E2E-UAT-2026-06-02.md`. The seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` advances from `planted` to `germinated` on gate pass.

The 4 seed success criteria (locked from `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md` §4 and `.planning/ROADMAP.md:2018`):

| # | Seed Success Criterion | L-Phase delivering runtime evidence |
| - | ---------------------- | ------------------------------------ |
| 1 | **Live pane monitoring** — harness shows live content of all agent tmux panes | P53 (`pane-monitor` hook → journal) |
| 2 | **Orchestrator intervention** — orchestrator can `send-keys` to any pane | P52 (`tmux-copilot` tool) |
| 3 | **Session persistence** — harness restart preserves `paused`/`detached` sessions | P54 (`persistence.ts` + `restoreAll`) |
| 4 | **Visual dependency graph** — delegation tree renders as a pane grid (DFS via P51 `grid-planner.ts`) | P51 (`PaneGridPlanner.computeSplitSequence`) |

P55 is a **verification-only phase** — no new modules, no new tool registrations, no new `package.json` deps. It is the L1+ L2 UAT wrapper that proves the P51–P54 deliverables together satisfy the seed's 4 success criteria.

**GATE**: All 4 BATS must run. **3/4 PASS** advances ROADMAP to P56+. **2/4 or fewer** triggers P56 retry-phase planning (per close-pivot §7 partial-pass strategy). 1/4 is a hard fail (no grace period).

## Background

P51–P54 closed the in-tree synthesis of the tmux visual orchestration layer. The seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` was `planted` 2026-05-31 and remains `planted` at the P55 boundary because P49 left the 4 seed criteria at L5 (planning-only — see close-pivot §4 inventory). P55 collects L1+ L2 runtime evidence for all 4 criteria so the seed can advance to `germinated`.

What exists today (P51–P54 deliverables that P55 verifies):

- **`src/features/tmux/grid-planner.ts`** (P51, 148 LOC) — `PaneGridPlanner` class with `computeSplitSequence(root: PaneTreeNode): SplitCommand[]` and `requestLayout(root, onComputed)` (500ms trailing-edge debounce). The `computeSplitSequence` method performs DFS preorder walk with depth-based direction rule (`depth === 1 → "h"`, else `"v"`). Empty tree returns `[]`. Exposed via `SessionManagerAdapter.createPaneGridPlanner()` to the `tmux-copilot` tool's `compute-grid` action.
- **`src/tools/tmux-copilot.ts`** (P43 + P49 widening, 235 LOC) — 4-action tool: `send-keys`, `list-panes`, `compute-grid`, `respawn`. Permission-gated to orchestrator-tier agents (T-43-05). `send-keys` calls `adapter.sendKeys(paneId, text, literal)`. Zod discriminated union on `action`. Returns graceful `{available: false, reason: ...}` on tmux-not-wired / not-installed / timeout / error (no throw across tool boundary).
- **`src/features/tmux/session-manager.ts`** (P51 + P54 additive, 332 LOC) — `SessionManager` class with 7-param constructor (6 P51 + 1 P54 `persistence?`). `respawnIfKnown(sessionId)` is the post-restart recovery method. `TrackedSession` now carries 8 fields (7 P51 + 1 P54 `state: SessionState`). Two `persist()` call sites: `onSessionCreated` (active→ready) and `handleSessionClose` (*→failed).
- **`src/features/tmux/persistence.ts`** (P54, 400 LOC) — `createSessionPersistence({projectDirectory, logWarn?})` factory. `SessionPersistence` interface: 4 public methods (`persist`, `remove`, `restoreAll`, `generateId`) + 1 read-only test seam `__stateRoot`. `PersistedSession` 9-field shape, `SessionState` 5-literal union (`active | ready | paused | detached | failed`), `restoreAll()` filters to `paused ∪ detached`, sorted by `spawnTime` ascending. UUIDv7 inline via `node:crypto.getRandomValues()`. D-04 silent-fallback: no throw crosses the module boundary.
- **`src/hooks/pane-monitor.ts`** (P53, 490 LOC) — `createPaneMonitorHook(opts: { sessionId, observer, journalRoot?, logWarn? })` factory. Subscribes to P52 `onPaneCaptured(cb)` registration. Writes `.hivemind/journal/<sid>/<ISO-timestamp>-pane.json` with 7 fields (`schemaVersion: "1.0"`, `eventType`, `sessionId`, `paneId`, `capturedAt`, `contentLength`, `contentPreview`). Exponential backoff (5s/10s/30s, max 3 retries) and 100/session/hour rate cap. D-04 silent-fallback mirror.
- **`src/features/tmux/observers.ts`** (P52) — `createTmuxEventObserver` factory with `onSessionCreated`, `onSessionStateChanged`, `onPaneCaptured` registration methods. Emits `pane-captured` events with `{ sessionId, paneId, contentLength, timestamp }` shape.
- **`src/features/tmux/types.ts`** (P51, byte-identical through P54) — `SessionManagerAdapter` interface with 6 methods (`onSessionCreated`, `respawnIfKnown`, `getMainPaneId`, `sendKeys`, `listPanes`, `createPaneGridPlanner`). 27-tool-key invariant locked through P54 — P55 must not add a 7th method.
- **`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`** (P53, slot 55) — 3 BATS scenarios proving the `pane-monitor` hook writes 7-field JSON on `pane-captured` events. The P55 BATS for criterion 1 (slot 57) is a stricter E2E test that exercises the FULL hook → observer → event-delivery chain with a real tmux session (not a synthetic event).
- **`tests/scripts/tmux/56-session-persistence-kill-restart.bats`** (P54, slot 56) — 1 BATS scenario proving `persistence.ts` survives a harness process boundary (each `tmux_node_eval` call is a fresh OS process; the on-disk record IS the cross-process state channel). The P55 BATS for criterion 3 (slot 59) is a stricter E2E test that combines persistence with the orchestration chain (spawn session via `tmux-copilot` integration → persist → kill harness process → restart → assert session alive).
- **`tests/scripts/tmux/helpers.bash`** (P51–P54) — BATS test infrastructure: `tmux_bats_require_dist` (skip if `dist/` missing), `tmux_node_eval <js>` (run Node ESM script with the compiled module), `tmux_bats_make_project` (fresh project under `BATS_TEST_TMPDIR`). The `tmux_bats_require_dist` helper currently checks `dist/features/tmux/{integration,types,persistence}.js` and `dist/hooks/pane-monitor.js` — P55 must extend the helper to also require `dist/features/tmux/grid-planner.js` and `dist/tools/tmux-copilot.js` (P55 is the first phase to invoke these from BATS).

The gap: P51–P54 each closed their own deliverable in isolation. The seed's 4 success criteria are an *integration* contract — they require that the in-tree modules work together as a coherent tmux visual orchestration layer, not that any single module passes its unit tests. P55 collects the integration evidence.

## Requirements

### 1. Live Pane Monitoring E2E BATS (REQ-55-01, ubiquitous)

While a real tmux session is spawned (a real OS process) and the harness is running with the P53 `pane-monitor` hook registered, the harness shall emit `pane-captured` events for the session's pane, and the hook shall write a journal entry to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json` containing exactly 7 fields with `schemaVersion: "1.0"` and `eventType: "pane-captured"`.

- **Current:** P53 BATS slot 55 exercises the hook against a SYNTHETIC `PaneCapturedEvent` (the test fixture constructs the event object directly). This proves the hook's persistence logic but does NOT prove the end-to-end chain (real tmux server → observer → hook → journal).
- **Target:** New BATS file `tests/scripts/tmux/57-live-pane-monitoring.bats` (slot 57 follows the P52/P53/P54 `5X-tmux-...` naming convention; BATS slots used so far: 01-06 + 52-56). The scenario:
  1. Spawns a real tmux session via `tmux new-session -d -s <name> -c <project> 'sleep 600'`.
  2. Asserts the session is alive (`tmux has-session -t <name>` returns 0).
  3. Constructs a P52 `createTmuxEventObserver` and registers a P53 `createPaneMonitorHook` subscriber (the same wiring as the P53 BATS, but now in an integration test).
  4. Invokes the observer with a real `pane-captured` event payload (NOT a synthetic stub — uses the live paneId returned by `tmux list-panes`).
  5. Awaits the hook's `__waitForPendingRetries?.()` to drain any in-flight backoff timers.
  6. Asserts: a single file matching glob `.hivemind/journal/<sid>/<ISO-timestamp>-pane.json` exists; `jq -r .eventType <file>` = `"pane-captured"`; `jq -r .schemaVersion <file>` = `"1.0"`; `jq -r 'keys | length' <file>` = `7`; the file's `paneId` matches the live tmux pane id (`tmux list-panes -t <name> -F '#{pane_id}' | head -1`).
  7. Teardown: `tmux kill-session -t <name>` + `await hook.dispose()` to clear in-flight retry timers.
- **Acceptance:** BATS slot 57 passes: 1 of 1 scenario, exit 0, `count_written=1`, `count_files=1`, `paneId=tmux_live_value`, `eventType=pane-captured`, `schemaVersion=1.0`, `keys=7`. The test is runnable in isolation: `bats --jobs 1 tests/scripts/tmux/57-live-pane-monitoring.bats` exits 0 within 10 seconds (no BATS `--jobs 1` parallelism, no shared state, no shared dist/ dependency). The `dist/features/tmux/observers.js` and `dist/hooks/pane-monitor.js` are required (extend `tmux_bats_require_dist` in `helpers.bash` to assert both exist; the P55 EXECUTE updates the helper).

### 2. Orchestrator Intervention E2E BATS (REQ-55-02, ubiquitous)

While a real tmux session is alive and the harness is running with the P51 `SessionManager` (and its `SessionManagerAdapter`) wired, the `tmux-copilot` tool's `send-keys` action shall deliver the supplied text to the named tmux pane, and the tmux session's `capture-pane` buffer shall reflect the sent text (i.e., the keys actually arrive on the receiving OS process).

- **Current:** The `tmux-copilot` tool's 4 actions (P43 + P49 widening) are validated in isolation by `tests/lib/tmux/tmux-copilot.test.ts` (12/12 vitest cases at P49 close — see P49 SUMMARY). These vitest tests exercise the Zod discriminated union, permission gate, and adapter dispatch logic against mock adapters. They do NOT prove that the `sendKeys` call delivers real keystrokes to a real tmux pane.
- **Target:** New BATS file `tests/scripts/tmux/58-orchestrator-intervention.bats` (slot 58). The scenario:
  1. Spawns a real tmux session via `tmux new-session -d -s <name> -c <project> 'cat'` (the `cat` process keeps the pane alive and reads from stdin; any text we send via `send-keys` will be processed by `cat` and its output reflected in the capture-pane buffer).
  2. Asserts the session is alive (`tmux has-session -t <name>` returns 0).
  3. Discovers the live paneId via `tmux list-panes -t <name> -F '#{pane_id}' | head -1` (e.g., `%5`).
  4. Loads the P51 `SessionManagerAdapter` factory via `tmux_node_eval`, calling `createTmuxIntegrationIfSupported({projectDirectory: '<project>', enableTmux: true})` to wire the real `TmuxMultiplexer` + `SessionManager`. (Falls back to `getSessionManagerAdapter()` if the factory is internal — both are exported from `dist/features/tmux/types.js` per P51.)
  5. Invokes `adapter.sendKeys(paneId, 'E2E-INTERVENTION-PROBE-1780434056', false)` — the 31-character probe string is intentionally unique to avoid false-positive matches in the buffer.
  6. Asserts the dispatch returns `void` (no throw); waits 200ms for tmux to flush the keys to the receiving process; captures the pane buffer via `tmux capture-pane -t <paneId> -p | grep -c 'E2E-INTERVENTION-PROBE-1780434056'`.
  7. Asserts the grep count is `≥ 1` (the probe string appears in the capture-pane output, proving the keystrokes were delivered to the live OS process and rendered on the pane).
  8. Teardown: `tmux kill-session -t <name>`.
- **Acceptance:** BATS slot 58 passes: 1 of 1 scenario, exit 0, `pane_alive=true`, `adapter_resolved=true`, `send_keys_returned_no_throw=true`, `probe_count=≥1`. The test is runnable in isolation: `bats --jobs 1 tests/scripts/tmux/58-orchestrator-intervention.bats` exits 0 within 10 seconds. `dist/tools/tmux-copilot.js` and `dist/features/tmux/integration.js` are required (extend `tmux_bats_require_dist`).

### 3. Session Persistence E2E BATS (REQ-55-03, ubiquitous)

While a real tmux session is alive, a persistence record has been written by the P54 `SessionManager` (via the P54 `persistence.persist()` call from `onSessionCreated`), the harness process is then terminated (simulating a crash), and a fresh harness process is started, the new process shall discover the persisted record (via `persistence.restoreAll()`) and assert the underlying tmux session is still alive on a separate OS process (the tmux server — a system service — survives the harness parent crash).

- **Current:** P54 BATS slot 56 exercises the `persistence.persist()` + `persistence.restoreAll()` round-trip across fresh node processes (each `tmux_node_eval` is a fresh OS process; the on-disk file IS the cross-process state channel). This proves the persistence module's behavior in isolation. It does NOT prove that the SessionManager actually fires `persist()` on every state transition (only the P54 vitest tests do that) AND it does NOT prove the tmux session is alive after the harness process is killed.
- **Target:** New BATS file `tests/scripts/tmux/59-session-persistence-restart.bats` (slot 59). The scenario:
  1. Spawns a real tmux session via `tmux new-session -d -s <name> -c <project> 'sleep 1800'` (30-min sleep keeps the session alive for the entire test).
  2. Constructs the P54 `createSessionPersistence({projectDirectory})` factory and writes a record with `state: "ready"` (simulating the SessionManager's `onSessionCreated` → `persist` call site).
  3. Asserts the file exists: `.hivemind/state/tmux-sessions/<sid>.json`.
  4. Asserts the file content: `jq -r .state <file>` = `"ready"`; `jq -r 'keys | length' <file>` = `9`; `jq -r .schemaVersion <file>` = `1` (numeric).
  5. Asserts the tmux session is alive: `tmux has-session -t <name>` returns 0 (the OS-level survival of the tmux process after the harness "dies" is the seed criterion 3 contract).
  6. **Simulates a harness crash** by running `kill -9 <harness-node-pid>` (the PID of the `tmux_node_eval` process that just wrote the record). Capture the PID BEFORE the kill.
  7. Asserts the kill landed: `kill -0 <pid>` returns non-zero (process is gone).
  8. **Simulates a harness restart** by running a fresh `tmux_node_eval` in a new process that calls `persistence.restoreAll()` and filters to `state ∈ {"paused", "detached"}`. The current record has `state: "ready"` (not in the alive filter — matches the P54 D-54-06 contract that only `paused` + `detached` mean "still alive after parent death"; `ready` is excluded because it represents a session that may have been killed mid-flight).
  9. **Variant 2 of the same scenario** (within the same BATS file as a second `@test`): writes a record with `state: "detached"`, simulates the kill, and asserts `restoreAll()` returns the record AND `tmux has-session -t <name>` returns 0. This is the "session survives parent restart in a restorable state" contract.
  10. Teardown: `tmux kill-session -t <name>`.
- **Acceptance:** BATS slot 59 passes: 2 of 2 scenarios, exit 0, `ready_file_written=true`, `tmux_alive_after_kill=true`, `detached_file_written=true`, `restoreAll_returns_detached=true`, `detached_tmux_alive=true`. The test is runnable in isolation: `bats --jobs 1 tests/scripts/tmux/59-session-persistence-restart.bats` exits 0 within 15 seconds (longer than the other 3 because of the `kill -9` cycle and the fresh-process restart). `dist/features/tmux/persistence.js` is required (already in `tmux_bats_require_dist` since P54).

### 4. Visual Dependency Graph E2E BATS (REQ-55-04, ubiquitous)

While a delegation tree is supplied to the P51 `PaneGridPlanner.computeSplitSequence(root)` method, the planner shall produce a sequence of `SplitCommand` records that, when applied to a fresh tmux session via `tmux split-window` commands, produce a valid DFS preorder pane layout with depth-based direction rules (`depth === 1 → "h"`, else `"v"`).

- **Current:** The P51 `grid-planner.ts` is unit-tested by `tests/lib/tmux/grid-planner.test.ts` (P51 vitest coverage) — but this is pure logic testing. There is no BATS scenario proving that the SplitCommand sequence, when actually applied via `tmux split-window`, produces a coherent pane layout in a real tmux session.
- **Target:** New BATS file `tests/scripts/tmux/60-visual-dependency-graph.bats` (slot 60). The scenario:
  1. Constructs a delegation tree: `root → [a → [a1, a2], b]`. The tree is the canonical P51 example (5 nodes: root, a, a1, a2, b). Encoded as `{ id: "root", children: [{ id: "a", children: [{ id: "a1" }, { id: "a2" }] }, { id: "b" }] }`.
  2. Calls `new PaneGridPlanner(0).computeSplitSequence(tree)` (debounce=0 to bypass the 500ms debounce — we want the immediate return).
  3. Asserts the result: `result.length === 4` (4 non-root nodes, each emitting one SplitCommand); `result[0]` = `{ parentPaneId: "root", direction: "h" }` (depth-1 = a, horizontal); `result[1]` = `{ parentPaneId: "a", direction: "v" }` (depth-2 = a1, vertical); `result[2]` = `{ parentPaneId: "a", direction: "v" }` (depth-2 = a2, vertical); `result[3]` = `{ parentPaneId: "root", direction: "h" }` (depth-1 = b, horizontal). This is the DFS preorder order: a, a1, a2, b.
  4. **End-to-end tmux integration**: spawns a real tmux session (`tmux new-session -d -s <name> -c <project>`) and applies each SplitCommand via `tmux split-window -t <parentPaneId> -d -<direction>`. After all 4 splits, asserts the tmux session has 5 panes: `tmux list-panes -t <name> | wc -l` = 5.
  5. Asserts each pane's parent-child relationship via `tmux list-panes -t <name> -F '#{pane_id}:#{pane_parent}'` and compares the actual parent mapping to the expected DFS layout (a1 parent = a; a2 parent = a; b parent = root).
  6. Teardown: `tmux kill-session -t <name>`.
- **Acceptance:** BATS slot 60 passes: 1 of 1 scenario, exit 0, `split_command_count=4`, `pane_count=5`, `parent_mapping_matches=true`. The test is runnable in isolation: `bats --jobs 1 tests/scripts/tmux/60-visual-dependency-graph.bats` exits 0 within 10 seconds. `dist/features/tmux/grid-planner.js` is required (extend `tmux_bats_require_dist`).

### Acceptance Criteria (overall)

- [ ] `tests/scripts/tmux/helpers.bash` is extended to require `dist/features/tmux/grid-planner.js` and `dist/tools/tmux-copilot.js` (P55 EXECUTE adds 2 assertions to `tmux_bats_require_dist`)
- [ ] BATS `57-live-pane-monitoring.bats` exists and passes (REQ-55-01 — seed criterion 1)
- [ ] BATS `58-orchestrator-intervention.bats` exists and passes (REQ-55-02 — seed criterion 2)
- [ ] BATS `59-session-persistence-restart.bats` exists and passes (REQ-55-03 — seed criterion 3)
- [ ] BATS `60-visual-dependency-graph.bats` exists and passes (REQ-55-04 — seed criterion 4)
- [ ] Each BATS runs in isolation: `bats --jobs 1 tests/scripts/tmux/5X-<name>.bats` exits 0
- [ ] Each BATS uses `BATS_TEST_TMPDIR` for project isolation; teardown kills tmux session
- [ ] All 4 BATS files are added to a single atomic commit (one logical change = one commit, AGENTS.md §Atomicity)
- [ ] Manual L2 evidence captured in `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md` — one section per seed criterion with: (a) the BATS L1 pass output, (b) a text-described screenshot of the tmux grid for criterion 4, (c) the journal entry filename + content excerpt for criterion 1, (d) a verdict line per criterion (`PASS` or `FAIL`)
- [ ] GATE evaluation: `PASS_COUNT = count(PASS verdicts)`; `if PASS_COUNT >= 3 → seed advances to germinated, ROADMAP proceeds to P56+; if PASS_COUNT <= 2 → P56 retry-phase planning triggered; 1/4 is a hard fail (no grace period)`
- [ ] ROADMAP.md is updated atomically: P55 line marked `[x]`, P56+ phases added if gate passes
- [ ] STATE.md is updated atomically: P55 status set to `✅ COMPLETE` (or `⚠️ PARTIAL — P56 retry pending` if 2/4)
- [ ] No modifications to `.hivemind/session-tracker/*` (R-P50-03 strict prohibition)
- [ ] No new `package.json` dependencies (P20 invariant — P55 is verification-only)
- [ ] No new tool registrations (27-tool-key invariant — P55 is verification-only)
- [ ] No new `src/**` files (P55 is verification-only — P51–P54 are already shipped)
- [ ] `tsc --noEmit` exits 0 (BATS files do not need to be type-checked — they are shell scripts; this is a regression check on the modules they import)

## Boundaries

**In scope:**
- 4 new BATS files at `tests/scripts/tmux/{57,58,59,60}-*.bats` (slot reservation per P50/P51/P52/P53/P54 pattern)
- Extension of `tests/scripts/tmux/helpers.bash` `tmux_bats_require_dist` to require 2 additional `dist/` files (`grid-planner.js`, `tools/tmux-copilot.js`)
- 1 new manual L2 evidence document: `55-E2E-UAT-2026-06-02.md` (text-described screenshots + journal entry excerpts)
- 3 atomic commits (per close-pivot §4 + AGENTS.md commit discipline):
  1. **Commit 1 (BATS + helper extension)**: 4 BATS files + `helpers.bash` update. ~250 LOC of new test code.
  2. **Commit 2 (UAT report + L2 evidence)**: `55-E2E-UAT-2026-06-02.md` + L2 evidence capture.
  3. **Commit 3 (ROADMAP/STATE advance)**: ROADMAP.md P55 marked `[x]`; STATE.md status update; if gate pass, P56+ phases added.
- Real OS process survival in all 4 BATS (no mocks — per P54 D-54-12 precedent)
- BATS slot reservation `5X-tmux-...` per the P52/P53/P54 `5X-tmux-...` naming convention
- `BATS_TEST_TMPDIR` per-test isolation (no shared state between BATS runs)
- Teardown with `tmux kill-session` in every BATS file (defensive cleanup)

**Out of scope:**
- Modifications to any `src/**` file (P55 is verification-only — P51–P54 already shipped)
- New tools / new tool keys (27-tool-key invariant — P55 is verification-only)
- New `package.json` dependencies (P20 invariant — P55 is verification-only)
- New vitest files (P51–P54 already covered module-internal unit logic; P55 is integration)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03 strict prohibition)
- Auto-pause / auto-detach orchestration (the logic that decides when to transition `ready → paused` or `ready → detached` is a downstream concern — the P54 persistence layer just records state transitions)
- `session-state-changed` hook subscription (deferred per P53 D-53-12 + P54 deferred-ideas)
- CP-PTY-00 docs/spec-only phase (unrelated to P55)
- Cross-process file locking (deferred per P54 deferred-ideas; P55 single-harness-process only)
- Schema migration for `schemaVersion: 1 → 2` (deferred per P54 deferred-ideas)
- Sidecar dashboard rendering of session state (separate downstream scope)
- Telemetry / metrics on persistence writes (deferred per P54 deferred-ideas)

## Constraints

- **Q6 (canonical state root):** `.hivemind/` is the internal state root per Q6 from `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`; `.opencode/` is OpenCode-primitives-only. P55 BATS files write to `.hivemind/journal/<sid>/` (criterion 1) and `.hivemind/state/tmux-sessions/<sid>.json` (criterion 3) — same as P53/P54.
- **R-P50-03 (spirit):** `.hivemind/journal/*` and `.hivemind/state/tmux-sessions/*` are local runtime state, NEVER committed. P55 BATS uses `BATS_TEST_TMPDIR` for all `.hivemind/` writes (no project-tree writes, no committed state).
- **D-04 (silent-fallback, P50/P51):** P55 BATS does NOT test the silent-fallback contract directly (P51–P54 unit tests do that). P55 BATS exercises the happy path only — a real OS tmux server, a real harness binary, a real `node` process. Failure modes are still silently handled by P53/P54 modules, but P55 BATS does not assert that contract.
- **P20 invariant:** No new `package.json` dependencies. P55 is verification-only — no new code, no new deps.
- **27-tool-key invariant:** No new tool registrations. The `tmux-copilot` tool (P43 + P49 widening) is exercised by BATS slot 58, but no new tool is added.
- **Max module LOC cap:** P55 adds 4 BATS files (avg ~80 LOC each = 320 LOC total) and ~10 LOC to `helpers.bash` (`tmux_bats_require_dist` extension). No `src/**` files mutated. AGENTS.md 500-LOC cap is preserved (BATS files are not source modules; they are shell scripts).
- **AGENTS.md §7 (CP-PTY runway):** P55 BATS files are NOT counted as `src/**` mutations — they are `tests/**` additions. The CP-PTY-00 docs/spec-only phase can land later without conflict.
- **Atomicity:** 3 atomic commits per close-pivot §4 + AGENTS.md commit discipline:
  1. BATS + helper extension
  2. UAT report + L2 evidence
  3. ROADMAP/STATE advance
- **L1 + L2 evidence:** BATS pass output = L1; manual text-described screenshots + journal excerpts = L2. L1 is automated and machine-verifiable; L2 is human-readable and reviewable. Both are required for the seed to advance to `germinated`.
- **GATE logic:** 3/4 PASS = seed advance (per close-pivot §7 partial-pass strategy); 2/4 = P56 retry phase planning; 1/4 = hard fail. The 7-day grace period mentioned in the task brief applies to "2/4 with at least 1 of criteria 1+2" — but P55 SPEC locks the gate as "3/4 = advance, 2/4 = retry, 1/4 = hard fail" (no grace period). The grace period is a CONTEXT-layer decision, not a SPEC-layer one.
- **Real OS process survival:** all 4 BATS use real `tmux` binary and real `node` process — no mocks. Per P54 D-54-12 precedent (the kill-restart test uses real OS process survival, not stubbed `fs.writeFile` / `fs.readdir`).
- **BATS timing tolerance:** ±100ms for backoff/scheduling tests (criterion 1 — `__waitForPendingRetries` drain); ±200ms for capture-pane probe visibility (criterion 2 — tmux keystroke flush + capture-pane race); no tolerance for persistence tests (criterion 3 — file must exist exactly when written; criterion 4 — SplitCommand sequence is deterministic, no timing).
- **SC-isolation:** no SC-* work referenced. The P55 BATS files are scoped to the in-tree tmux features only — no `sidecar/` references, no `.hivemind/session-tracker/*` reads or writes, no `compositions/` cross-references.

## Acceptance Criteria

- [ ] `tests/scripts/tmux/helpers.bash` `tmux_bats_require_dist` asserts the existence of `dist/features/tmux/grid-planner.js` and `dist/tools/tmux-copilot.js` (P55 EXECUTE adds 2 conditional `skip` blocks)
- [ ] BATS `tests/scripts/tmux/57-live-pane-monitoring.bats` exists and passes when run in isolation (`bats --jobs 1`)
- [ ] BATS `tests/scripts/tmux/58-orchestrator-intervention.bats` exists and passes when run in isolation
- [ ] BATS `tests/scripts/tmux/59-session-persistence-restart.bats` exists and passes when run in isolation (2 scenarios: ready-state kill + detached-state restore)
- [ ] BATS `tests/scripts/tmux/60-visual-dependency-graph.bats` exists and passes when run in isolation
- [ ] All 4 BATS files use `load "helpers"` + `tmux_bats_require_dist` + `tmux_bats_make_project` for setup; teardown with `tmux kill-session`
- [ ] All 4 BATS files use `BATS_TEST_TMPDIR` for project isolation (no project-tree writes to `.planning/` or `.hivemind/` outside the BATS tmpdir)
- [ ] All 4 BATS files use real OS processes (real `tmux` binary, real `node` process via `tmux_node_eval`) — no mocks
- [ ] L1 evidence: 4 BATS pass output captured verbatim in `55-E2E-UAT-2026-06-02.md` (one section per BATS file)
- [ ] L2 evidence: manual text-described screenshots of the tmux grid for criterion 4 (P51 DFS layout) and journal entry excerpts for criterion 1 (P53 7-field JSON) captured in `55-E2E-UAT-2026-06-02.md`
- [ ] Verdict per criterion in `55-E2E-UAT-2026-06-02.md`: `criterion 1: PASS|FAIL`, `criterion 2: PASS|FAIL`, `criterion 3: PASS|FAIL`, `criterion 4: PASS|FAIL`
- [ ] GATE evaluation block in `55-E2E-UAT-2026-06-02.md` with the `PASS_COUNT` computation and the resulting decision (`advance to germinated` / `trigger P56 retry`)
- [ ] 3 atomic commits: (1) BATS + helpers.bash, (2) UAT report + L2 evidence, (3) ROADMAP/STATE advance
- [ ] `tsc --noEmit` exits 0 (regression check on the modules imported by the BATS)
- [ ] No mutations to `.hivemind/session-tracker/*` (R-P50-03)
- [ ] No new `package.json` entries (P20 invariant)
- [ ] No new tool registrations (27-tool-key invariant)
- [ ] No new `src/**` files (P55 is verification-only)
- [ ] ROADMAP.md P55 line marked `[x]` after gate evaluation (in the same commit as the UAT report acceptance)
- [ ] STATE.md P55 status set to `✅ COMPLETE` (gate pass) or `⚠️ PARTIAL — P56 retry pending` (2/4) or `❌ FAILED — hard fail` (1/4)

## Ambiguity Report

| Dimension           | Score | Min  | Status | Notes                                                                                                  |
|---------------------|-------|------|--------|--------------------------------------------------------------------------------------------------------|
| Goal Clarity        | 0.95  | 0.75 | ✓      | ROADMAP L2016-2020 + close-pivot §4 seed criteria table + P51–P54 deliverables are all source-backed   |
| Boundary Clarity    | 0.92  | 0.70 | ✓      | In-scope = 4 BATS + 1 UAT report; out-of-scope = no new src/tests, no new tool keys, no new deps, etc. |
| Constraint Clarity  | 0.90  | 0.65 | ✓      | Q6, R-P50-03, D-04, P20, 27-tool-key, atomic commits, real OS process survival, SC-isolation all locked  |
| Acceptance Criteria | 0.92  | 0.70 | ✓      | 21 pass/fail checks; 4 BATS + 1 UAT report + gate logic + 3 atomic commits; L1 + L2 evidence per criterion |
| **Ambiguity**       | 0.08  | ≤0.20| ✓      | Composite = 1 − mean(0.95, 0.92, 0.90, 0.92) ≈ 0.0775 → 0.08 (floor to 2 decimals)                    |

All dimensions meet or exceed minimums. No dimensions below threshold. Composite ambiguity 0.08 ≤ 0.20 gate: **PASS**.

## Interview Log

| Round | Perspective     | Question summary                     | Decision locked                                                                                |
|-------|-----------------|-------------------------------------|-----------------------------------------------------------------------------------------------|
| —     | (auto mode)     | Initial ambiguity ≤ 0.20            | Skipped interview — SPEC.md derived from ROADMAP L2016-2020 + close-pivot §4 + P51/P52/P53/P54 deliverables + P54 SPEC/CONTEXT/VERIFICATION format |

---

*Phase: 55-e2e-uat-against-seed-success-criteria*
*Spec created: 2026-06-02*
*Next step: /gsd-discuss-phase 55 — implementation decisions (BATS slot reservation rationale, gate threshold strictness, L2 evidence format, atomic commit structure, helpers.bash extension scope, etc.)*
