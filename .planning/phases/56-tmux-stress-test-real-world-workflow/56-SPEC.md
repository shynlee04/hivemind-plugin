# Phase 56: Stress Test for Real-Life Tmux Use — Specification

**Created:** 2026-06-03
**Ambiguity score:** 0.08 (gate: ≤ 0.20)
**Requirements:** 6 locked (one per stress-test sub-flow)

## Goal

Author a **single BATS stress test scenario** (`tests/scripts/tmux/61-stress-test-real-world-workflow.bats` — slot 61 follows the P55 `5X-tmux-...` naming convention and is reserved for the next-phase comprehensive scenario) that exercises the **complete P50–P55 tmux visual orchestration layer** in a realistic multi-agent workflow. The stress test must demonstrate, in one `@test` block:

1. Orchestrator spawns 3+ sub-agents (3 real tmux sessions, each running a real OS process)
2. Each sub-agent runs in its own real tmux pane, laid out via the P51 `PaneGridPlanner` DFS split sequence
3. The orchestrator sends `send-keys` to each pane (P52 tool)
4. Pane-captured events are journaled by the P53 `pane-monitor` hook
5. Sessions persist across a harness process restart (P54)
6. The P52 `tmux-state-query` tool returns live session state
7. All **27 tool keys** remain registered (P49 invariant — `tests/integration/hook-registration.test.ts:103` `.toBe(27)` still passes)

**L1 evidence** (machine-verifiable): the single BATS scenario passes — `bats --jobs 1 tests/scripts/tmux/61-stress-test-real-world-workflow.bats` exits 0 within 60 seconds wall clock, all 6 sub-flows PASS, and `tsc --noEmit` + `npx vitest run tests/integration/hook-registration.test.ts` continue to exit 0.

**L2 evidence** (human-readable): a captured listing of `tmux list-sessions` showing 3 live sessions + a captured `ls -R .hivemind/journal/` tree showing 3+ journal files + a captured `tmux-state-query get-session` JSON dump for one of the 3 sessions. Documented in `.planning/phases/56-tmux-stress-test-real-world-workflow/56-STRESS-EVIDENCE-2026-06-03.md`.

**GATE**: 1/1 BATS scenario passes = stress test PASS. The 6 sub-flows are **inseparable** — partial failure (e.g., journal writes succeed but state-query fails) means the scenario fails, and a follow-up gap remediation phase is required.

## Background

P50–P55 closed the in-tree synthesis of the tmux visual orchestration layer in 5 sequential phases:

- **P51** (`src/features/tmux/session-manager.ts` 332 LOC + `tmux-multiplexer.ts` + `grid-planner.ts` 148 LOC + `integration.ts` 220 LOC) — `SessionManager` 7-param constructor (6 P51 + 1 P54 `persistence?`), `TrackedSession` 8-field interface, `SessionManagerAdapter` 6-method interface, `PaneGridPlanner.computeSplitSequence` DFS preorder, `TmuxMultiplexer` real-OS-process transport
- **P52** (`src/tools/tmux-copilot.ts` 235 LOC + `src/tools/tmux-state-query.ts` 177 LOC + `src/features/tmux/observers.ts`) — 4-action `tmux-copilot` tool (`send-keys`, `list-panes`, `compute-grid`, `respawn`) + 3-action `tmux-state-query` tool (`list-sessions`, `get-session`, `get-summary`) + `createTmuxEventObserver` factory with `onPaneCaptured` registration
- **P53** (`src/hooks/pane-monitor.ts` 490 LOC) — `createPaneMonitorHook` factory subscribing to P52 `onPaneCaptured`; writes `.hivemind/journal/<sid>/<ISO-timestamp>-pane.json` with 7 fields (`schemaVersion: "1.0"`, `eventType`, `sessionId`, `paneId`, `capturedAt`, `contentLength`, `contentPreview`); exponential backoff 5s/10s/30s max 3 retries; 100/session/hour rate cap; D-04 silent-fallback mirror
- **P54** (`src/features/tmux/persistence.ts` 400 LOC) — `createSessionPersistence({projectDirectory, logWarn?})` factory; `SessionPersistence` interface: 4 public methods (`persist`, `remove`, `restoreAll`, `generateId`) + 1 read-only test seam `__stateRoot`; `PersistedSession` 9-field shape; `SessionState` 5-literal union (`active | ready | paused | detached | failed`); `restoreAll()` filters to `paused ∪ detached`; UUIDv7 inline via `node:crypto.getRandomValues()`; atomic write with `flag: "wx"` + `flag: "w"` fallback on EEXIST
- **P55** (4 BATS scenarios, 1 UAT report) — `tests/scripts/tmux/{57,58,59,60}-*.bats` exercising each of the 4 seed success criteria in isolation; 4/4 BATS scenarios PASS (P55 L1 evidence captured 2026-06-03 in `55-E2E-UAT-2026-06-02.md`); seed `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md` advanced from `planted` → `germinated`

P55's BATS files prove each criterion **in isolation**. The gap: there is no single end-to-end scenario proving that all 4 criteria + the 27-tool-key invariant + real multi-agent workflow work **together** as a coherent system. A flake in P52's `onPaneCaptured` callback would not be caught by P55 BATS slot 57 (which uses a synthetic event) and would not be caught by P55 BATS slot 59 (which uses persistence round-trip with a single session). The stress test closes this gap by orchestrating all subsystems in a single scenario.

## Requirements

### 1. Multi-agent spawn (REQ-56-01, ubiquitous)

While the BATS scenario runs in `BATS_TEST_TMPDIR`, the harness shall spawn **3+ real tmux sessions** via `tmux new-session -d -s e2e-test-{i} -c <project> 'sleep 600'` (i = 0, 1, 2) where each session is a separate OS process running `sleep 600` as a deterministic agent placeholder (no mock — per P54 D-54-12 precedent and P55 D-55-05).

- **Current:** P55 BATS files spawn 1 tmux session per `@test` block. No test exercises 3+ concurrent sessions in a single scenario.
- **Target:** Single `@test` block in `61-stress-test-real-world-workflow.bats` calls `tmux new-session -d` 3 times in a loop, each creating a session named `e2e-test-{pid}-{i}` (BATS PID + index for uniqueness). The placeholder command is `sleep 600` (10-min sleep — long enough that the session survives the 60-second stress test budget). Each session is a real OS process; the BATS scenario uses `tmux has-session -t <name>` (returns 0) to confirm each is alive. The `tmux list-sessions` command enumerates all 3 (and only those 3 from this scenario — using the `e2e-test-{pid}-` prefix filter).
- **Acceptance:** After the 3 `tmux new-session -d` calls complete, `tmux list-sessions -F '#{session_name}' | grep -c '^e2e-test-{pid}-'` returns `3` (all 3 alive); `tmux has-session -t e2e-test-{pid}-0`, `…-1`, `…-2` each return 0; the `pid` of the `tmux new-session` process is captured (via `$!` after each call) and asserted to differ across the 3 spawns (3 distinct OS processes, not 3 PIDs reused by a single process).

### 2. DFS grid layout (REQ-56-02, ubiquitous)

While a delegation tree `root → [a → [a1, a2], b]` is supplied to `PaneGridPlanner.computeSplitSequence(root)` and the resulting `SplitCommand[]` is applied via `tmux split-window`, the harness shall produce 3+ non-overlapping panes matching the DFS preorder layout (depth-1 = horizontal, depth-2 = vertical).

- **Current:** P55 BATS slot 60 (`60-visual-dependency-graph.bats`) proves `computeSplitSequence` + `tmux split-window` integration for a single delegation tree of 5 nodes. P56 stress test reuses the same approach but within a single @test block alongside REQ-56-01 (the 3 spawned sessions are 3 leaves of a separate 3-node tree, not the 5-node tree from P55).
- **Target:** Inside the same `@test` block, construct a 3-node delegation tree `{ id: "stress-root", children: [{ id: "stress-a" }, { id: "stress-b" }, { id: "stress-c" }] }`. Call `new PaneGridPlanner(0).computeSplitSequence(tree)` (debounce=0) to get `SplitCommand[]`. Assert `result.length === 3` (3 non-root nodes). Apply each SplitCommand to a fresh `e2e-test-{pid}-grid` session via `tmux split-window -t <parentPaneId> -d -<direction>`. Assert the resulting pane count: `tmux list-panes -t e2e-test-{pid}-grid | wc -l` = 4 (1 root + 3 children). Assert each child's parent mapping matches the DFS layout (a, b, c parents = stress-root).
- **Acceptance:** `result.length === 3`; `result[0]` = `{ parentPaneId: "stress-root", direction: "h" }`; `result[1]` = `{ parentPaneId: "stress-root", direction: "h" }`; `result[2]` = `{ parentPaneId: "stress-root", direction: "h" }` (3 children of root, all at depth-1 = horizontal); `pane_count == 4`; `parent_mapping_matches == true` (a, b, c all parented to stress-root). The `e2e-test-{pid}-grid` session is killed in teardown alongside the 3 `e2e-test-{pid}-{i}` sessions.

### 3. Orchestrator intervention via send-keys (REQ-56-03, ubiquitous)

While 3 real tmux sessions are alive (REQ-56-01), the harness shall deliver a unique probe string to each session's main pane via `TmuxMultiplexer.sendKeys(paneId, text, literal=false)` and the session's `tmux capture-pane` buffer shall reflect each probe (proving the keystrokes arrived on the receiving OS process).

- **Current:** P55 BATS slot 58 (`58-orchestrator-intervention.bats`) proves `sendKeys` to a single `cat`-buffered session. P56 stress test extends this to 3 sessions, each with a unique probe string, all in one `@test` block.
- **Target:** After REQ-56-01 spawns 3 `sleep 600` sessions, the BATS scenario discovers each `paneId` via `tmux list-panes -t e2e-test-{pid}-{i} -F '#{pane_id}' | head -1`. For each of the 3 sessions, call `TmuxMultiplexer.sendKeys(paneId, 'STRESS-PROBE-{pid}-{i}-1780434056', false)` via `tmux_node_eval`. Wait 200ms for tmux to flush the keys (D-55-08 timing tolerance). Capture each pane's buffer via `tmux capture-pane -t <paneId> -p | grep -c 'STRESS-PROBE-{pid}-{i}-1780434056'`; assert each grep count is `≥ 1`.
- **Acceptance:** 3 distinct probes are delivered (one per session), each appears in the corresponding session's capture-pane buffer (`probe_count_i >= 1` for i=0,1,2). The 3 sessions survive the `sendKeys` call — `tmux has-session -t e2e-test-{pid}-{i}` returns 0 for all 3 after the send. The `cat`-buffered session pattern from P55 is not used here — `sleep 600` is the placeholder, and the probe string is buffered by the tmux server's pane-buffer (visible in `capture-pane` output even if the receiving process doesn't read it).

### 4. Pane-captured journaling (REQ-56-04, ubiquitous)

While 3 real tmux sessions are alive (REQ-56-01) and the P53 `pane-monitor` hook is registered against the P52 `createTmuxEventObserver`, the harness shall emit `pane-captured` events for each session's pane, and the hook shall write a 7-field JSON journal entry to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json` for each.

- **Current:** P55 BATS slot 57 (`57-live-pane-monitoring.bats`) proves the hook writes 1 journal entry for 1 synthetic event. P56 stress test extends this to 3 live events from 3 real sessions in a single `@test` block.
- **Target:** Inside the same `@test` block, construct a P52 `createTmuxEventObserver` and register a P53 `createPaneMonitorHook` subscriber via `tmux_node_eval`. For each of the 3 session IDs (REQ-56-01's `e2e-test-{pid}-{i}` session IDs — internally mapped to UUIDv7 via `persistence.generateId()`), invoke the observer with a real `PaneCapturedEvent` payload: `{ sessionId, paneId: <live paneId from REQ-56-03>, contentLength: <length of capture-pane buffer>, timestamp: Date.now() }`. Await the hook's `__waitForPendingRetries?.()` to drain in-flight backoff timers. Assert: 3 files match glob `.hivemind/journal/<sid-0>/<ISO>-pane.json`, `.hivemind/journal/<sid-1>/<ISO>-pane.json`, `.hivemind/journal/<sid-2>/<ISO>-pane.json`; each `jq -r .eventType <file>` = `"pane-captured"`; each `jq -r .schemaVersion <file>` = `"1.0"`; each `jq -r 'keys | length' <file>` = `7`; each `paneId` matches the live tmux pane id for that session.
- **Acceptance:** `journal_count == 3` (one per session); `keys_count == 7` for each; `eventType == "pane-captured"` for each; `schemaVersion == "1.0"` for each; `paneId == tmux_live_paneId_i` for each i=0,1,2. The hook's `dispose()` is called in teardown to clear in-flight retry timers.

### 5. State-query + persistence integration (REQ-56-05, ubiquitous)

While 3+ persistence records are written (one per session from REQ-56-01) and the P52 `tmux-state-query` tool is invoked via the in-tree adapter, the harness shall (a) round-trip the 3 records through `persistence.persist` + `persistence.restoreAll` across a fresh harness process, and (b) return live session state for at least 1 of the 3 sessions via `tmux-state-query get-session`.

- **Current:** P55 BATS slot 59 (`59-session-persistence-restart.bats`) proves persistence round-trip for 1-2 records across a kill-restart cycle. P55 BATS slot 53 (`53-tmux-state-query-tool.bats`) proves `tmux-state-query` schema validation in isolation. P56 stress test extends this to 3 records + a `tmux-state-query get-session` call inside the same `@test` block.
- **Target:** Inside the same `@test` block, construct a P54 `createSessionPersistence({projectDirectory: <BATS_TEST_TMPDIR project>})`. For each of the 3 session IDs, call `persistence.persist({ sessionId, agent: 'stress-agent-{i}', delegationId: 'stress-deleg-{i}', directory: <project>, paneId: <live paneId>, spawnTime: Date.now(), state: 'ready', lastTransitionAt: Date.now(), schemaVersion: 1 })`. Assert 3 files exist: `.hivemind/state/tmux-sessions/<sid-i>.json`. Assert each has 9 fields (via `jq -r 'keys | length'`) and `state: "ready"`. Simulate a harness restart by running a fresh `tmux_node_eval` in a new process that calls `persistence.restoreAll()` — the current records have `state: "ready"` which is excluded by the alive filter (per D-54-06), so the round-trip proves the FILTER behavior, not the alive-restore behavior (the latter requires `paused` or `detached`, which is out of scope for the stress test — REQ-56-05 is about the persist+restore MECHANISM with 3 records, not the state-machine transitions). Then invoke `tmux-state-query get-session` via the in-tree adapter for at least 1 of the 3 sessions and assert the response includes `sessionId`, `agent`, `paneId`, `directory`, `spawnTime` (the 5 fields exposed by `SessionSummary` per P52 tmux-state-query.ts:46-53).
- **Acceptance:** 3 persistence files exist with `state: "ready"`; `restoreAll()` returns an empty array (or a filtered array — the stress test does NOT seed `paused` or `detached` records, so the alive filter is expected to return `[]`); `tmux-state-query get-session` for session 0 returns a non-empty object with the 5 expected `SessionSummary` fields. The persistence + state-query integration proves the P52 + P54 surface is wired correctly when 3 sessions are alive.

### 6. 27-tool-key invariant preserved (REQ-56-06, ubiquitous)

While the stress test scenario runs to completion (REQ-56-01..05 all PASS) and `npx vitest run tests/integration/hook-registration.test.ts` is re-executed in the teardown, the `HarnessControlPlane` plugin shall continue to register exactly **27 tool keys** (P49 invariant — `tests/integration/hook-registration.test.ts:103` `.toBe(27)`).

- **Current:** P49 locked the 27-tool-key invariant; P51–P55 each preserved it (P55 added 0 new tool registrations). P56 stress test is verification-only — no new tools, no new registrations. The invariant must continue to hold after P56.
- **Target:** Inside the same `@test` block (after REQ-56-05 assertions), run `npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|toBe\(27\)|Tests\s+[0-9]+ passed)'` and assert the output contains the 27-tool-key assertion line. The vitest test does NOT mutate any state — it's a read-only assertion that the plugin's tool registration map has exactly 27 keys. (The 27 keys are: `delegate-task`, `delegation-status`, `session-hierarchy`, `session-tracker`, `session-delegation-query`, `hivemind`, `prompt-enhance`, `nl-route`, `nl-extract`, `nl-batch`, `tmux-copilot`, `tmux-state-query`, `mcp-server-pty`, `healthcheck`, `config-workflow`, `session-recovery`, `tmux-pane-pip`, `session-journal-export`, `boot-02-init`, `boot-02-bootstrap-recover`, `tmux-mcp-server`, `create-governance-session`, `tmux-copilot-list-panes`, `validate-restart`, `tmux-copilot-send-keys`, `tmux-copilot-compute-grid`, `tmux-copilot-respawn` — P56 does NOT add to this list.)
- **Acceptance:** The vitest test passes; the assertion `expect(toolKeys.length).toBe(27)` (line 103) exits 0; no new tool keys are added by the stress test. If this REQ fails, the stress test is FAIL regardless of REQ-56-01..05 status — a regression in the tool surface is a critical contract violation that blocks P56+ phases.

### Acceptance Criteria (overall)

- [ ] `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` exists and passes when run in isolation (`bats --jobs 1`)
- [ ] Single `@test` block exercises all 6 sub-flows (REQ-56-01..06) sequentially
- [ ] Scenario uses `BATS_TEST_TMPDIR` for project isolation — no project-tree writes to `.planning/` or `.hivemind/` outside the BATS tmpdir
- [ ] Scenario uses real OS processes (real `tmux` binary + real `node` process via `tmux_node_eval`) — no mocks (D-55-05, D-54-12)
- [ ] Scenario is runnable in ≤ 60 seconds wall clock (per P49 audit precedent)
- [ ] Teardown kills all 4 tmux sessions (3 from REQ-56-01 + 1 grid from REQ-56-02) and disposes the pane-monitor hook
- [ ] L1 evidence: BATS pass output captured in `.planning/phases/56-tmux-stress-test-real-world-workflow/56-STRESS-EVIDENCE-2026-06-03.md`
- [ ] L2 evidence: `tmux list-sessions` output (text-described) + `.hivemind/journal/` tree listing (text-described) + `tmux-state-query get-session` JSON dump for session 0 captured in the same evidence doc
- [ ] 27-tool-key invariant: `npx vitest run tests/integration/hook-registration.test.ts` exits 0 with `.toBe(27)` passing
- [ ] `tsc --noEmit` exits 0 (regression check on the modules the BATS imports)
- [ ] No modifications to `.hivemind/session-tracker/*` (R-P50-03 strict prohibition)
- [ ] No new `package.json` dependencies (P20 invariant)
- [ ] No new tool registrations (27-tool-key invariant)
- [ ] No new `src/**` files (P56 is verification-only — P51–P55 are already shipped)
- [ ] Single atomic commit for the BATS file (no intermediate commits; AGENTS.md §Atomicity)
- [ ] ROADMAP.md P56 line marked `[x]` in a separate commit after BATS pass + UAT evidence
- [ ] STATE.md P56 status set to `✅ COMPLETE` (gate pass) or `⚠️ PARTIAL — P57 retry pending` (gate fail)

## Boundaries

**In scope:**
- 1 new BATS file at `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` (slot 61 — first P56 BATS, reserved per P55 D-55-01 `5X-tmux-...` convention)
- 1 new evidence document: `.planning/phases/56-tmux-stress-test-real-world-workflow/56-STRESS-EVIDENCE-2026-06-03.md`
- Extension of `tests/scripts/tmux/helpers.bash` if needed (e.g., to add a `tmux_bats_require_stress_facilities` helper checking tmux + node + git binaries on PATH) — additive only, no removal of P53/P54/P55 helpers
- 2 atomic commits per AGENTS.md §Atomicity:
  1. **Commit 1 (BATS + helper extension)**: 1 BATS file + optional `helpers.bash` extension. ~120 LOC of new test code.
  2. **Commit 2 (L1 + L2 evidence + ROADMAP/STATE advance)**: `56-STRESS-EVIDENCE-2026-06-03.md` + L1 + L2 evidence capture + ROADMAP.md P56 marked `[x]` + STATE.md status update.
- Real OS process survival in the BATS (no mocks — per P54 D-54-12 precedent and P55 D-55-05)
- BATS slot reservation `61-tmux-...` per the P55 `5X-tmux-...` naming convention
- `BATS_TEST_TMPDIR` per-test isolation (no shared state between BATS runs)
- Teardown with `tmux kill-session` in the BATS file (defensive cleanup of 4 sessions)
- Vitest regression run (`npx vitest run tests/integration/hook-registration.test.ts`) inside the BATS teardown to assert the 27-tool-key invariant holds

**Out of scope:**
- Modifications to any `src/**` file (P56 is verification-only — P51–P55 already shipped)
- New tools / new tool keys (27-tool-key invariant — P56 is verification-only)
- New `package.json` dependencies (P20 invariant — P56 is verification-only)
- New vitest files (P56 is BATS-only — vitest regression is a sanity check, not a new test)
- Mutation to `.hivemind/session-tracker/*` (R-P50-03 strict prohibition)
- Auto-pause / auto-detach orchestration (REQ-56-05 explicitly tests the `ready` state, which is excluded from `restoreAll` — the alive-restore behavior with `paused`/`detached` is P55 BATS slot 59's contract, not P56's)
- New tmux-copilot actions (P56 exercises the existing 4 actions + 3 state-query actions — no new ones)
- Sidecar dashboard rendering of stress-test output (separate downstream scope)
- Telemetry / metrics on stress-test runtime (deferred)
- Multi-machine distributed stress test (single-host only — `tmux` server is local)
- Persistent stress test daemon (P56 is a one-shot BATS scenario, not a long-running service)
- CP-PTY-00 docs/spec-only phase (unrelated to P56)

## Constraints

- **Q6 (canonical state root):** `.hivemind/` is the internal state root per Q6 from `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`. The BATS scenario writes to `${BATS_TEST_TMPDIR}/project/.hivemind/{journal,state/tmux-sessions}/` — all under `BATS_TEST_TMPDIR`, never the project tree (R-P50-03 spirit).
- **D-04 (silent-fallback, P50/P51, preserved through P56):** P56 BATS does NOT test the silent-fallback contract directly (P51–P55 unit tests cover that). P56 BATS exercises the happy path only — a real OS tmux server, a real harness binary, a real `node` process. Failure modes are still silently handled by P53/P54 modules, but P56 BATS does not assert that contract.
- **P20 invariant:** No new `package.json` dependencies. P56 is verification-only — no new code, no new deps. The current `dependencies` list (`@ai-sdk/openai-compatible`, `@clack/prompts`, `@modelcontextprotocol/sdk`, `@opencode-ai/sdk`, `gray-matter`, `yaml`, `zod`) and `devDependencies` list (`@opencode-ai/plugin`, `@types/bun`, `@types/node`, `@vitest/coverage-v8`, `bats`, `bun-types`, `typescript`, `vitest`) are unchanged by P56.
- **27-tool-key invariant:** No new tool registrations. The BATS scenario exercises `tmux-copilot` (4 actions) and `tmux-state-query` (3 actions) via the in-tree adapter, but does NOT add new tools. The 27-key count is locked at P49; the stress test asserts the count remains 27 in teardown (REQ-56-06).
- **Max module LOC cap:** P56 adds 1 BATS file (~120 LOC target) and ~10 LOC to `helpers.bash` (optional extension). No `src/**` files mutated. AGENTS.md 500-LOC cap is preserved (BATS files are shell scripts, not source modules).
- **AGENTS.md §7 (CP-PTY runway):** P56 BATS file is NOT counted as a `src/**` mutation — it is a `tests/**` addition. The CP-PTY-00 docs/spec-only phase can land later without conflict.
- **Atomicity:** 2 atomic commits per AGENTS.md §Atomicity + close-pivot §4: (1) BATS + helper extension, (2) L1+L2 evidence + ROADMAP/STATE advance.
- **L1 + L2 evidence:** BATS pass output = L1; `tmux list-sessions` listing + `.hivemind/journal/` tree + `tmux-state-query get-session` JSON dump = L2. L1 is automated and machine-verifiable; L2 is human-readable and reviewable.
- **GATE logic:** 1/1 BATS scenario passes (all 6 sub-flows PASS) = stress test PASS. Partial failures (e.g., REQ-56-01..05 PASS but REQ-56-06 27-tool-key assertion FAILS) = stress test FAIL — the scenario is atomic and the 6 sub-flows are inseparable. A failure triggers a follow-up P57 gap-remediation phase.
- **Real OS process survival:** all 6 sub-flows use real `tmux` binary + real `node` process — no mocks. Per P54 D-54-12 precedent (the kill-restart test uses real OS process survival, not stubbed `fs.writeFile` / `fs.readdir`) and P55 D-55-05 (real OS process survival in all 4 P55 BATS).
- **BATS timing tolerance:** ±200ms for capture-pane probe visibility (REQ-56-03 — tmux keystroke flush + capture-pane race, mirrors P55 D-55-08); ±100ms for backoff/scheduling (REQ-56-04 — `__waitForPendingRetries` drain, mirrors P55 D-55-08); no tolerance for persistence writes (REQ-56-05 — `fs.writeFile` is synchronous from caller's perspective) and grid layout (REQ-56-02 — `PaneGridPlanner.computeSplitSequence` is a pure function).
- **SC-isolation:** no SC-* work referenced. The P56 BATS file is scoped to the in-tree tmux features only — no `sidecar/` references, no `.hivemind/session-tracker/*` reads or writes, no `compositions/` cross-references, no `rootSessionId` references. The 6 sub-flows import only from `dist/features/tmux/`, `dist/hooks/`, and `dist/tools/` (the P51–P54 deliverables + the 2 tools from P52).
- **Stress test runtime budget:** ≤ 60 seconds wall clock. The 6 sub-flows are bounded: REQ-56-01 spawn (3 × `tmux new-session` ≈ 100ms each = 300ms) + REQ-56-02 grid (1 × `PaneGridPlanner` + 3 × `tmux split-window` ≈ 200ms) + REQ-56-03 sendKeys (3 × `TmuxMultiplexer.sendKeys` + 200ms wait = 500ms) + REQ-56-04 journaling (3 × hook write + drain = 500ms) + REQ-56-05 persistence + state-query (3 × `persistence.persist` + 1 × fresh-process `restoreAll` + 1 × `tmux-state-query` = 1500ms) + REQ-56-06 vitest regression (`hook-registration.test.ts` ≈ 5 seconds) = ~8 seconds total runtime. The 60-second budget includes CI-environment slack (vitest startup, BATS warmup, tmux server handshake).
- **Session ID source:** The 3 `e2e-test-{pid}-{i}` session names are tmux session names (the `-s` flag of `tmux new-session`), NOT the UUIDv7 session IDs used in `.hivemind/state/tmux-sessions/<sessionId>.json`. The BATS scenario generates 3 distinct UUIDv7 IDs via `persistence.generateId()` for the 3 records in REQ-56-05. The `paneId` (e.g., `%5`, `%6`, `%7`) is discovered at runtime via `tmux list-panes`.

## Acceptance Criteria

- [ ] `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` exists and passes when run in isolation (`bats --jobs 1`)
- [ ] The single `@test` block exercises all 6 sub-flows (REQ-56-01..06) sequentially with clear step comments
- [ ] All 6 REQs in the `@test` block pass with explicit assertion lines
- [ ] BATS file uses `load "helpers"` + `tmux_bats_require_dist` + `tmux_bats_make_project` for setup
- [ ] Teardown kills all 4 tmux sessions (3 from REQ-56-01 + 1 grid from REQ-56-02) with `tmux kill-session -t <name> 2>/dev/null || true`
- [ ] Teardown calls `hook.dispose()` to clear in-flight retry timers from REQ-56-04
- [ ] Teardown runs `npx vitest run tests/integration/hook-registration.test.ts` to assert the 27-tool-key invariant
- [ ] BATS uses `BATS_TEST_TMPDIR` for all `.hivemind/{journal,state/tmux-sessions}/` writes
- [ ] BATS uses real OS processes (real `tmux` binary, real `node` process via `tmux_node_eval`) — no mocks
- [ ] BATS runs in ≤ 60 seconds wall clock
- [ ] L1 evidence: BATS pass output captured in `56-STRESS-EVIDENCE-2026-06-03.md` (1 section per REQ with the BATS assertion output verbatim)
- [ ] L2 evidence: `tmux list-sessions` listing showing 3 live `e2e-test-` sessions + `ls -R .hivemind/journal/` tree showing 3+ journal files + `tmux-state-query get-session` JSON dump for session 0 captured in the same evidence doc
- [ ] Verdict line in the evidence doc: `stress test: PASS|FAIL` (single binary verdict for the atomic scenario)
- [ ] GATE evaluation block in the evidence doc with the `1/1 = PASS | 0/1 = FAIL` decision
- [ ] 2 atomic commits: (1) BATS + helpers.bash (if extended), (2) L1+L2 evidence + ROADMAP/STATE advance
- [ ] `tsc --noEmit` exits 0 (regression check on the modules the BATS imports)
- [ ] No mutations to `.hivemind/session-tracker/*` (R-P50-03)
- [ ] No new `package.json` entries (P20 invariant)
- [ ] No new tool registrations (27-tool-key invariant — REQ-56-06 asserts this in teardown)
- [ ] No new `src/**` files (P56 is verification-only)
- [ ] ROADMAP.md P56 line marked `[x]` in the evidence commit (after gate pass)
- [ ] STATE.md P56 status set to `✅ COMPLETE` (gate pass) or `⚠️ PARTIAL — P57 retry pending` (gate fail)

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.94 | 0.75 | ✓ | ROADMAP L2029-2031 specifies all 7 sub-flows; P55 BATS slots 57-60 are the per-criterion precedent; the 6 REQs map 1:1 to the 6 stress-test sub-flows |
| Boundary Clarity | 0.91 | 0.70 | ✓ | In-scope = 1 BATS file + 1 evidence doc; out-of-scope = no new src/tests, no new tool keys, no new deps, no src/** mutations, no sidecar/dashboard |
| Constraint Clarity | 0.89 | 0.65 | ✓ | Q6, R-P50-03, D-04, P20, 27-tool-key, atomic commits, real OS process survival, SC-isolation, runtime budget, timing tolerance all locked |
| Acceptance Criteria | 0.93 | 0.70 | ✓ | 21 pass/fail checks; 1 BATS + 1 evidence doc + 1 vitest regression + 2 atomic commits; L1 + L2 evidence per REQ |
| **Ambiguity** | 0.08 | ≤0.20 | ✓ | Composite = 1 − mean(0.94, 0.91, 0.89, 0.93) ≈ 0.0825 → 0.08 (floor to 2 decimals) |

All dimensions meet or exceed minimums. No dimensions below threshold. Composite ambiguity 0.08 ≤ 0.20 gate: **PASS**.

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|-----------------|
| — | (auto mode) | Initial ambiguity ≤ 0.20 | Skipped interview — SPEC.md derived from ROADMAP L2029-2031 + P55 SPEC/CONTEXT/VERIFICATION format + P53/P54 BATS precedents + the 7 sub-flows in the task brief |

---

*Phase: 56-tmux-stress-test-real-world-workflow*
*Spec created: 2026-06-03*
*Next step: /gsd-discuss-phase 56 — implementation decisions (BATS slot reservation rationale, runtime budget strictness, evidence format, atomic commit structure, helpers.bash extension scope, etc.)*
