# Phase 43: Tmux Co-Pilot Model Orchestrator Intervention — Assumptions

**Created:** 2026-05-31
**Calibration tier:** standard (5 assumption areas, 2-3 alternatives per item)
**Phase scope:** REQ-01 `TmuxMultiplexer.sendKeys`, REQ-02 `listPanes`, REQ-03 `PaneGridPlanner.computeSplitSequence` (500ms debounced), REQ-04 `tmux-copilot` tool (4 actions, Zod discriminated union), REQ-05 wire `onSessionCreated` placeholder → fork `SessionManager`, REQ-06 closed-pane graceful error + respawn.

> Structured assumptions surfaced by codebase analysis. Each assumption cites file-path evidence
> and includes a risk level (HIGH/MEDIUM/LOW), [ASSUMED] tag, 2-3 alternatives, and a verification
> method. Confidence levels reflect what the codebase actually reveals — not what the spec hopes
> to be true. This is a docs-only (L5) artifact; it does NOT prove runtime readiness.

---

## Risk Heat Map

| Area | Top Risk | Verdict |
|---|---|---|
| 1. Auto-init server, send-keys semantics | HIGH (auto-init) / MEDIUM (send-keys) | Must NOT auto-init; query-only tool |
| 2. Inter-plugin boundary Hivemind ↔ fork | HIGH | Choose `onSessionCreated` path, not `spawnPaneWithMeta` |
| 3. PaneGridPlanner 500ms debounce | HIGH | Coalesce + dedup; treat as advisory not deterministic |
| 4. Closed-pane respawn race | MEDIUM | `respawnIfKnown` lacks `hivemindMeta`; enrich at wire-up |
| 5. tmux surface constraints | LOW | Title cap + version compat — verify before merge |

---

## Assumptions

### 1. Technical Approach — Server Lifecycle & Send-Keys Semantics

- **Assumption [ASSUMED, HIGH]:** The `tmux-copilot` tool (REQ-04) is a **read-side status / query / dispatch** tool, NOT a server lifecycle tool. It must NOT call `getTmuxVersion()`, `isServerRunning()`, spawn the OpenCode server, or restart tmux. All spawn / kill actions delegate to the existing fork `SessionManager` already wired in Phase 42.
  - **Why this way:** Phase 42's Assumption #4 (`.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/42-ASSUMPTIONS.md:71-79`) concluded that auto-init of OpenCode server mode is **HIGH risk and explicitly deferred** — there is no in-plugin server-start path because the plugin runs inside an already-started OpenCode process. The fork's `isServerRunning()` (`opencode-tmux/src/session-manager.ts:277-294`) polls `/health` with a 3s × 2 = 6s total timeout and silently skips spawn if the server is down. The Phase 43 tool must surface this state (read-only) but never trigger server restart from a user-invoked tool call.
  - **If wrong:** If REQ-04 includes an "auto-start" or "ensure-running" action, the tool would need server-start infrastructure that does not exist. This would expand scope to introduce a pre-start shell script (the P42 Alternative 2 fallback) — not deliverable in Phase 43's scope. The P42 team explicitly punted on this to keep Phase 42 shippable.
  - **Risk:** HIGH — scope creep into server lifecycle would require coordinating with the OpenCode CLI's `--port` flag and a bootstrap script in `bin/` (per P42 Alternative 2). The harness currently has no such script.
  - **Alternative 1:** Tool returns structured `tmux:status` payload with `serverReachable`, `binaryVersion`, `isInsideSession`, `activePaneCount`, `closedPanesCount` — all read-only. _Recommended:_ Matches the 4 actions specified in REQ-04 (status, layout plan, send-keys to pane, list panes).
  - **Alternative 2:** Tool includes a `tmux:restart` action that shells out to `bin/opencode-restart.sh` (TBD). _Rationale to reject:_ Not in scope. The script doesn't exist. Would require defining the bin/ substrate (architecture rule: scripts are pure helpers, no governance — see `.planning/AGENTS.md` rule 4 and the existing `scripts/sync-assets.js` reference).
  - **Alternative 3:** Tool includes a `tmux:startServer` action calling `opencode --port <port>` as a child process. _Rationale to reject:_ Duplicates the chicken-and-egg problem from P42 Assumption #4: tmux panes that the tool wants to inspect are already attached to a running OpenCode. A new server process on a different port would not be wired to those panes.
  - **Verify by:** Review REQ-04 spec for the 4 actions; confirm none of them are "start", "restart", "ensure", or "kill-server". Cross-check `src/tools/tmux-copilot.ts` (to be created) imports — should import `readPersistedPort`, `resolveBinary`, `getTmuxVersion` from `src/features/tmux/integration.ts` (read-only), and `SessionManager` state inspection methods from the fork. If any action imports `child_process.spawn` or `execFile`, flag scope violation.
  - **Mitigation:** Document the no-auto-init constraint in `src/tools/tmux-copilot.ts` JSDoc header. Add a code-review checklist item for Phase 43 plan that searches the tool for `spawn|exec|execFile` imports and fails the gate if any are present.

- **Assumption [ASSUMED, MEDIUM]:** `TmuxMultiplexer.sendKeys(paneId, text)` (REQ-01) uses tmux's `send-keys -l` (literal) flag to send raw text without interpreting tmux key names (e.g., `C-c`, `Enter`, `Up`).
  - **Why this way:** The fork's existing `closePane` method (`opencode-tmux/src/tmux.ts:179-181`) calls `send-keys -t <paneId> C-c` with a key name (NOT `-l`). The current usage sends a control sequence. REQ-01 needs a method to send user-typed text — this must be `send-keys -l` to avoid having the user's text interpreted as tmux key names. The fork's `quoteShellArg` helper (`opencode-tmux/src/util.ts`) already exists for safe shell-quoting of arguments, but `send-keys -l` does its own internal character escaping (handles spaces, quotes, backslashes, control chars differently than shell).
  - **If wrong:** If `sendKeys()` is implemented without `-l`, characters like `C-c`, `Escape`, `Up`, `Enter` in the input string would be interpreted as tmux key names. A prompt like "press Up to retry" sent via the tool would close the agent's input buffer instead of typing the literal text. This would be a security/correctness hazard.
  - **Risk:** MEDIUM — `-l` flag is the documented tmux pattern for literal text, but tmux 1.8+ is required (released 2013, almost universally available). Edge case: `send-keys -l` still interprets backslash-escaped sequences in some tmux versions; tmux 3.0+ is the safe baseline.
  - **Alternative 1:** Use `send-keys -l` with a tmux version check (`getTmuxVersion()`) and refuse the call if version < 3.0. _Recommended:_ Matches the `-l` flag's documented behavior and provides a clear failure mode.
  - **Alternative 2:** Pipe text via `load-buffer` + `paste-buffer -p` to bypass `send-keys` key-name parsing entirely. _Rationale to reject:_ Heavier operation (creates a tmux buffer object), and `paste-buffer -p` is itself a separate code path requiring additional testing.
  - **Alternative 3:** Use `send-keys` without `-l` but pre-escape any character in the user text that tmux treats as a key name (e.g., `Escape`, `C-x`, `Up`, `Down`, `Left`, `Right`, `Enter`, `Space`, `Tab`, `BSpace`, `DC`, `IC`, `Home`, `End`, `NPage`, `PPage`). _Rationale to reject:_ Fragile — requires maintaining a denylist of key names, breaks on tmux version updates, and complicates the unit test matrix.
  - **Verify by:** Inspect `opencode-tmux/src/tmux.ts` for the new `sendKeys` method; confirm the argv includes `-l`. Run unit test with input string `C-c Up Enter` and verify the pane receives the literal text (test could use `tmux capture-pane` to read back the pane content).
  - **Mitigation:** Add a unit test in `opencode-tmux/__tests__/tmux.test.ts` (existing test dir per `opencode-tmux/src/session-manager.ts` adjacent) that asserts `-l` is present in the argv via mock capture of `execFileAsync` calls.

---

### 2. Inter-Plugin Boundary — Hivemind ↔ Fork SessionManager Wire-Up (REQ-05)

- **Assumption [ASSUMED, HIGH]:** REQ-05 replaces the placeholder in `src/plugin.ts:569-582` by wiring the existing `createTmuxEventObserver` (`src/features/tmux/observers.ts:55-92`) to a REAL `SessionManager` instance — not to a no-op `onSessionCreated: async (_enriched) => { void _enriched }` callback.
  - **Why this way:** The Phase 42 placeholder (`src/plugin.ts:569-582`) explicitly marks `_enriched` as "intentional: enriched event for future use" and is a stub for Phase 43 integration. The fork already exposes a `SessionManager` class (`opencode-tmux/src/session-manager.ts:1-295`) with a public `onSessionCreated(event)` method that matches the `ForkSessionManager` interface in `src/features/tmux/observers.ts:37-39` (signature: `(event: EnrichedSessionEvent) => Promise<void>`). The wire-up is a constructor call: `createTmuxEventObserver(forkSessionManager)` where `forkSessionManager` is a real `SessionManager` instance.
  - **If wrong:** If REQ-05 tries to import `SessionManager` directly into `src/plugin.ts` (Hivemind core), this creates a cross-package dependency from Hivemind's main Node.js process to the fork's `opencode-tmux` package. The fork is designed to be loaded as a separate OpenCode plugin, not as a library imported by Hivemind. P42 Assumption #1 (`42-ASSUMPTIONS.md:14-30`) explicitly chose "the fork remains Bun-native and Hivemind integrates it via standard Node.js hooks" — meaning the fork should NOT be imported by Hivemind.
  - **Risk:** HIGH — A cross-package import from Hivemind's main process would: (a) force Hivemind's runtime to load Bun-compiled ESM, (b) couple Hivemind's plugin lifecycle to the fork's lifecycle, (c) break the P42-architectural-decision that the fork is a "separate OpenCode plugin, not a library."
  - **Alternative 1:** Hivemind calls `forkSessionManager.onSessionCreated(enrichedEvent)` via a **runtime injection boundary** — the `tmuxIntegration` object exposes a `sessionManager` getter that the event observer can use. The fork registers itself into the boundary at plugin-load time, NOT via static import. _Recommended:_ Preserves the P42 architectural decision; fork remains a sibling plugin.
  - **Alternative 2:** Convert the fork into a Hivemind feature module by moving `opencode-tmux/src/` into `src/features/tmux/fork/`. _Rationale to reject:_ Violates P42 SPEC.md:73 "the fork stays in its own repo". Massive scope expansion.
  - **Alternative 3:** Use the existing `spawnPaneWithMeta` method (`opencode-tmux/src/session-manager.ts:255-275`) instead of `onSessionCreated`. _Rationale to consider (rejected — see Assumption #3):_ The slimmed-down path. The trade-off analysis is below in Assumption #3.
  - **Verify by:** Inspect `src/plugin.ts` line 569-582 after Phase 43 implementation. The `_enriched` underscore-prefixed parameter should be GONE. The observer must call a method on a real `SessionManager`-like object, not a no-op async function.
  - **Mitigation:** Add a Phase 43 plan task to create a `src/features/tmux/fork-bridge.ts` that exposes a `setForkSessionManager(sm: ForkSessionManager): void` setter, called by the fork at its plugin-init time. The Hivemind event observer reads from the bridge.

- **Assumption [ASSUMED, HIGH]:** The `fork-bridge` boundary is set BEFORE the first `session.created` event fires, otherwise early sessions will be silently dropped.
  - **Why this way:** The Hivemind plugin's `eventObservers` array (`src/plugin.ts:550-582`) is constructed synchronously in the plugin's `config()` or `tool.execute.before` hook. The fork plugin loads in the same `config()` chain (per OpenCode plugin load order). If the fork's `setForkSessionManager()` is called AFTER Hivemind constructs the observer array, the bridge is empty and the first delegation's pane-spawn is silently skipped.
  - **If wrong:** First few delegations in a fresh Hivemind session would have no tmux pane. The user would see the agent run in the main pane only, with no fork-pane visualization. This is a graceful failure (no error thrown), but it defeats the purpose of the integration.
  - **Risk:** HIGH — race condition between Hivemind's observer registration and the fork's bridge-set call. The order is not guaranteed by OpenCode's plugin load order (plugins are loaded alphabetically by default in OpenCode).
  - **Alternative 1:** Make `createTmuxEventObserver` accept a getter (`() => ForkSessionManager | null`) and lazily resolve the bridge on each event. _Recommended:_ Decouples observer construction from bridge-set timing.
  - **Alternative 2:** Buffer events in the bridge until the fork sets the SessionManager. The bridge is a `Map<sessionId, EnrichedSessionEvent>` and replays them when set. _Rationale to consider:_ Adds replay complexity. Risk of double-spawn if event fires twice.
  - **Alternative 3:** Move the bridge-set to Hivemind's bootstrap hook (runs first, per `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md` and the existing `src/features/bootstrap/`). The fork registers itself by writing to a file at `.hivemind/state/fork-bridge.json` which Hivemind reads. _Rationale to reject:_ Adds file I/O on the hot path. State coupling.
  - **Verify by:** Write a unit test in `tests/lib/tmux/observers.test.ts` (existing test file, 207 LOC) that calls the observer BEFORE the bridge is set, then sets the bridge, then fires another event. The first call should be a no-op; the second should reach the SessionManager. The existing test pattern in `observers.test.ts:55-92` is the template.
  - **Mitigation:** The observer getter pattern in Alternative 1 adds one indirection (an extra function call per event) but is the smallest change that eliminates the race.

---

### 3. PaneGridPlanner 500ms Debounce — Burst Handling (REQ-03)

- **Assumption [ASSUMED, HIGH]:** `PaneGridPlanner.computeSplitSequence(actions)` (REQ-03) uses a 500ms debounce window to coalesce rapid-fire `session.created` events. Within the window, only the LATEST `actions` array is processed. Earlier events are dropped (not queued).
  - **Why this way:** Debouncing (vs throttling) is the spec's explicit choice. A 500ms window is long enough to coalesce a "delegation burst" — the common pattern is: parent delegates to 3-5 children in rapid succession (e.g., parallel research, parallel verification). 500ms is the human-perceptual threshold (lag is barely noticeable) while still being short enough that the user doesn't wait.
  - **If wrong:** If debounce drops events, the planner only computes the layout for the LAST action — earlier children get the layout computed against the FINAL state of the grid, not the intermediate. This means the user's mental model ("panes should match the order I delegated them in") may not match the rendered layout.
  - **Risk:** HIGH — the planner is the user's primary feedback for "what is the model orchestrator doing?" If the layout doesn't match the user's intent, they may manually re-arrange panes, which then drift on the next burst.
  - **Alternative 1:** Use a **leading-edge debounce** (compute on first event, then ignore for 500ms). _Rationale to consider:_ Better for sub-500ms responsiveness. Risk: thrashing on rapid bursts.
  - **Alternative 2:** Use a **trailing-edge debounce** (compute on last event in window) — the spec's choice. _Recommended:_ Matches spec. Drop earlier events.
  - **Alternative 3:** Use **throttling** (compute at most every 500ms, never drop). _Rationale to consider:_ Preserves all events. Risk: 2x compute per burst.
  - **Alternative 4:** Use a **ring buffer** of size 16 (recent actions) and recompute on the latest action. _Rationale to consider:_ Bounded memory. Risk: same as trailing-edge debounce, just with more bookkeeping.
  - **Verify by:** Unit test in `src/features/tmux/pane-grid-planner.test.ts` (to be created) — fire 5 events at 50ms intervals, assert `computeSplitSequence` is called exactly once with the 5th event's `actions` array. Use vitest's `vi.useFakeTimers()` to control the 500ms window.
  - **Mitigation:** The planner's output is a SUGGESTED layout (REQ-03), not a forced layout. The fork's `applyLayout()` (`opencode-tmux/src/tmux.ts:202-231`) accepts a `layout` parameter. If the user wants a different layout, they invoke `tmux-copilot` tool with a different plan. The debounce is the default; the tool allows manual override.

- **Assumption [ASSUMED, MEDIUM]:** The planner's output is a SEQUENCE of tmux `split-window` commands with `-h` (horizontal) or `-v` (vertical) flag. It does NOT issue `swap-pane`, `join-pane`, or `move-pane` — those are out of scope for the planner.
  - **Why this way:** tmux has ~15 layout operations. The most common for grid-building are `split-window -h` and `split-window -v`. The current fork only uses `split-window -h` (`opencode-tmux/src/tmux.ts:117-126`) for the default `main-vertical` layout. The planner should not introduce new operations without first verifying they are needed.
  - **If wrong:** If the planner needs to RE-arrange existing panes (e.g., move child-2's pane to the top-right after a third delegation), it would need `swap-pane` or `move-pane`. The fork has no tests for these; introducing them expands scope.
  - **Risk:** MEDIUM — for a typical 3-5 pane grid, `split-window` is sufficient. For 10+ panes (rare but possible in deep delegation trees), the planner may produce a sub-optimal layout.
  - **Alternative 1:** Planner outputs only `split-window` commands. _Recommended:_ Matches the fork's existing capability. Simpler to test.
  - **Alternative 2:** Planner outputs a `select-layout` call with a tmux preset (`tiled`, `even-horizontal`, `even-vertical`). _Rationale to consider:_ Simpler. Risk: presets don't give fine control.
  - **Alternative 3:** Planner outputs a combination of `split-window` and `select-layout` calls. _Rationale to consider:_ More expressive. Risk: harder to test (mixed command types).
  - **Verify by:** Inspect planner output format in test fixtures. Assert each command in `computeSplitSequence().commands` has shape `{ op: "split-window", direction: "h" | "v", target: string }`.
  - **Mitigation:** Document the planner's command vocabulary in JSDoc. If a future phase needs `swap-pane` / `move-pane`, the planner's output schema can be extended.

---

### 4. Closed-Pane Respawn Race — `respawnIfKnown` Lacks `hivemindMeta` (REQ-06)

- **Assumption [ASSUMED, MEDIUM]:** REQ-06's "closed-pane graceful error + respawn" integrates with the fork's EXISTING `closedSessions` Set + `respawnIfKnown` method (`opencode-tmux/src/session-manager.ts:223-248`), not a separate respawn path.
  - **Why this way:** The fork already has the respawn infrastructure. `onSessionStatus({ type: "busy" })` checks `closedSessions.has(sessionId)` and calls `respawnIfKnown` (line 161-163). `respawnIfKnown` re-creates a minimal `EventSessionCreated` and calls `onSessionCreated` (line 234-247) to re-spawn. The plumbing is correct.
  - **If wrong:** If REQ-06 introduces a SEPARATE respawn path, two parallel mechanisms exist. They could race: idle event closes pane, busy event triggers respawn via the OLD path AND the new path. The pane could be spawned twice.
  - **Risk:** MEDIUM — duplicate-spawn is detectable but ugly (two panes for the same session ID). The existing `spawnedSessions` Set (line 130) is a dedup guard, but it only checks before `onSessionCreated` re-runs; if both paths fire concurrently, both pass the check and both spawn.
  - **Alternative 1:** Use the existing `respawnIfKnown` + add `hivemindMeta` propagation. _Recommended:_ Single path. Modify `respawnIfKnown` to retrieve `hivemindMeta` from the original session's stored metadata and pass it into the re-spawned `onSessionCreated` call.
  - **Alternative 2:** Add a new `respawnPane` method to the fork that takes `EnrichedSessionEvent` directly. _Rationale to consider:_ Cleaner API. Risk: divergent code paths, harder to test.
  - **Alternative 3:** Wrap the fork in a Hivemind-side respawn coordinator that calls `spawnPaneWithMeta` for respawns. _Rationale to reject:_ Bypasses the dedup guard, bypasses the `closedSessions` Set invariant.
  - **Verify by:** Inspect `opencode-tmux/src/session-manager.ts` line 234-247 after Phase 43 — the reconstructed `EventSessionCreated` MUST include `hivemindMeta` (re-looked-up from the original session's stored metadata, NOT undefined). A unit test in `opencode-tmux/__tests__/session-manager.test.ts` should: (1) spawn a session, (2) close it via idle, (3) trigger a busy event, (4) verify the respawned session's pane has the Hivemind-formatted title (e.g., `[gsd-phase-researcher] ses_abc12...`).
  - **Mitigation:** The fix to `respawnIfKnown` is a 3-line change: store `hivemindMeta` in `KnownSession` (line 33-36 already has `parentId, title, directory`), retrieve it in `respawnIfKnown`, pass it to the reconstructed event.

- **Assumption [ASSUMED, MEDIUM]:** The SPAWN→IDLE race condition (`session-manager.ts:134-138`, where an idle event arriving during a 500ms+ spawn is deferred via `pendingClose` Set) is preserved, not modified, by Phase 43.
  - **Why this way:** The P42 implementation handled this race by deferring close via `pendingClose` Set, then closing the just-spawned pane immediately. The P42 unit test (not in this repo snapshot, but documented in P42-RESEARCH.md) verifies this path. Modifying it risks regression.
  - **If wrong:** If REQ-06's respawn path tries to handle the SPAWN→IDLE case differently (e.g., skip the close, or use a different dedup strategy), the race could resurface.
  - **Risk:** MEDIUM — the existing test coverage is thin. The fork's test directory `opencode-tmux/__tests__/` exists per the file structure listing; existing test count is unknown from this snapshot.
  - **Alternative 1:** Leave `pendingClose` logic untouched; REQ-06 only adds respawn on `busy` event. _Recommended:_ Preserves the proven P42 path.
  - **Alternative 2:** Add a new `replayCloseAfterSpawn` event type to disambiguate the race. _Rationale to reject:_ Adds new event types to the fork; out of Phase 43 scope.
  - **Verify by:** Re-run the P42 unit tests after Phase 43 modifications. If any fail, flag regression. The fork's `bun test` runner is the test entry point.
  - **Mitigation:** Phase 43 plan should include a "regression test" task that runs the full fork test suite (`bun test` in `opencode-tmux/`) before merge.

---

### 5. tmux Surface Constraints — Version, Title Length, Layout Options (REQ-01/02/03)

- **Assumption [ASSUMED, LOW]:** tmux 3.0+ is the minimum supported version. The fork's `getTmuxVersion()` (`src/features/tmux/integration.ts:42-49`) returns the version string; Phase 43 should add a runtime version check in `sendKeys` (per Assumption #1 above).
  - **Why this way:** tmux 3.0 was released in 2017. The `-l` flag for `send-keys` exists since tmux 1.8 (2013). The `#{pane_id}` format string used in `split-window -P -F` (line 124) is also stable. The combination of features Phase 43 needs is well-supported in tmux 3.0+. macOS system tmux is often 3.3+ (Homebrew) or older 2.x (system /usr/bin/tmux). The 3.0 floor is the safe baseline.
  - **If wrong:** If users have tmux 2.x (e.g., default macOS install before Homebrew), `send-keys -l` may not exist. The tool would silently fall back to non-literal mode, causing the "press Up" hazard from Assumption #1.
  - **Risk:** LOW — Homebrew is the dominant install method on macOS; Linux distros ship tmux 3.x. The 2.x case is rare and the failure mode is detectable (the unit test from Assumption #1 catches it).
  - **Alternative 1:** Require tmux 3.0+ in the integration factory; return null from `createTmuxIntegrationIfSupported()` if version < 3.0. _Recommended:_ Cleanest failure mode.
  - **Alternative 2:** Use `tmux send-keys -X` (the 3.0+ extension command) for richer semantics. _Rationale to consider:_ More expressive. Out of scope for Phase 43.
  - **Alternative 3:** Feature-detect at runtime: try `send-keys -l --help` and parse. _Rationale to reject:_ Adds startup latency; not needed.
  - **Verify by:** CI matrix: run unit tests with `TMUX_VERSION=3.3a` (Homebrew default) and `TMUX_VERSION=2.6` (legacy). The 2.6 case should refuse `sendKeys` with a typed error.
  - **Mitigation:** Add `getMajorVersion()` helper to `src/features/tmux/integration.ts:42-49`. Use it in `sendKeys()` to early-return a typed error.

- **Assumption [ASSUMED, LOW]:** The 40-character pane title cap (`opencode-tmux/src/tmux.ts:145`) is hard-coded by tmux's `select-pane -T`. Phase 43's title format `[${agent}] ${delegationId.slice(0, 8)} — ${description}` is at risk of truncation for long agent names or descriptions.
  - **Why this way:** tmux's `select-pane -T` silently truncates titles longer than the terminal's pane-title display width (typically 40-80 chars depending on terminal settings). The fork's existing slice (`title.slice(0, 40)`) is a defensive cap.
  - **If wrong:** Long agent names (e.g., `gsd-phase-researcher-deep-tree-walker` = 39 chars) leave only 1 char for the description. Users see `[gsd-phase-researcher-deep-tree-wal…]` with no useful info.
  - **Risk:** LOW — agent names are typically short (kebab-case, 2-4 words, <30 chars). Description is appended with a slice to 40.
  - **Alternative 1:** Truncate `agent` to 20 chars and `description` to 15 chars: `[${agent.slice(0, 20)}] ${delegationId.slice(0, 8)}…${description.slice(0, 15)}`. _Recommended:_ Better balance.
  - **Alternative 2:** Use tmux's `@pane_title_format` user option for custom formatting. _Rationale to consider:_ Cleaner. Requires user opt-in.
  - **Alternative 3:** Drop the `description` entirely from the title; show it on hover or in a status line. _Rationale to reject:_ Reduces at-a-glance info.
  - **Verify by:** Unit test with agent `gsd-phase-researcher-deep-tree-walker` and description `Very long description that exceeds 40 chars easily`; assert truncated title is `<= 40 chars` and contains agent prefix.
  - **Mitigation:** Document the title format in `src/features/tmux/integration.ts` JSDoc. Add a unit test in `opencode-tmux/__tests__/tmux.test.ts`.

- **Assumption [ASSUMED, LOW]:** `listPanes` (REQ-02) uses tmux's `list-panes -a -F` with a custom format string. The format includes `pane_id`, `pane_current_command`, `pane_width`, `pane_height`, `pane_active`, and the custom `@pane_meta` (if set).
  - **Why this way:** tmux's `list-panes` is the canonical way to enumerate panes. The `-a` flag includes all panes in all windows. The `-F` format string lets us extract structured data. The fork's `getMainPaneId()` (`opencode-tmux/src/tmux.ts`, methods referenced in the `split-window` call at line 110-114) uses similar formatting.
  - **If wrong:** If `list-panes` output is too verbose or the format string breaks on a specific tmux version, the tool's output may be unparseable.
  - **Risk:** LOW — `list-panes` is a stable tmux command. Format string syntax is stable since 2.2.
  - **Alternative 1:** Use `tmux list-panes -a -F '#{pane_id} #{pane_current_command}'` and post-parse. _Recommended:_ Simple, fast, stable.
  - **Alternative 2:** Use `tmux list-panes -a -F -J` (JSON output) available in 3.2+. _Rationale to consider:_ Cleaner parsing. Requires version check.
  - **Verify by:** Unit test in `opencode-tmux/__tests__/tmux.test.ts` (existing dir) — mock `execFileAsync`, assert the argv includes `-a -F` and the format string contains `pane_id`.
  - **Mitigation:** None needed — this is a stable, well-trodden tmux path.

---

## Needs External Research

The following topics are NOT fully answerable from the codebase alone and require either (a) an external research artifact under `.planning/research/`, (b) a direct tmux/OpenCode CLI test, or (c) review of the upstream `shynlee04/opencode-tmux` GitHub repo for prior art.

1. **tmux version compatibility matrix** for `send-keys -l`, `list-panes -J`, `split-window -F` format string. _Action:_ Run `tmux -V` on Homebrew default (3.3a), Linux apt (3.2a), legacy macOS (2.6). Confirm the format string syntax in `list-panes` is identical.
2. **OpenCode SDK event ordering** — does `session.created` always fire BEFORE `session.status: idle`? The SPAWN→IDLE race handling depends on this. _Action:_ Add an integration test in `opencode-tmux/__tests__/session-manager.test.ts` that fires 5 events in quick succession and asserts the spawn-then-idle sequence.
3. **Existing fork test count and coverage** — the fork has `opencode-tmux/__tests__/` but the test files are not visible in this snapshot. _Action:_ `ls opencode-tmux/__tests__/` and `bun test --coverage` to baseline. P43 should not regress below the P42 baseline.
4. **OpenCode plugin load order** — Hivemind's `eventObservers` array is built in `src/plugin.ts:550-582` during the plugin's `config()` hook. Is the fork's plugin loaded BEFORE or AFTER Hivemind's? _Action:_ Read OpenCode SDK source for plugin load order. If fork loads after, the bridge setter race from Assumption #2.2 is real and Alternative #1 (getter) is mandatory.

---

## Cross-References

- **Phase 43 SPEC**: `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/43-SPEC.md` (6 REQs, ambiguity 0.11)
- **Phase 43 RESEARCH**: `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/43-RESEARCH.md` (4 [ASSUMED] items, HIGH confidence)
- **Phase 42 ASSUMPTIONS**: `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/42-ASSUMPTIONS.md` (predecessor; auto-init decision carried forward)
- **Phase 42 SPEC**: `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/42-SPEC.md` (lines 73, 76: fork stays separate)
- **Fork SessionManager**: `opencode-tmux/src/session-manager.ts:255-275` (existing `spawnPaneWithMeta` method, partially complete)
- **Hivemind placeholder**: `src/plugin.ts:569-582` (current `_enriched` no-op stub, REQ-05 target)
- **Hivemind observer factory**: `src/features/tmux/observers.ts:55-92` (`createTmuxEventObserver`)
- **Hivemind integration factory**: `src/features/tmux/integration.ts:127-160` (`createTmuxIntegrationIfSupported`)
- **Existing tmux tests**: `tests/lib/tmux/integration.test.ts`, `tests/lib/tmux/observers.test.ts` (test patterns to mirror)

---

## Open Decisions for Planning Phase

The following items are NOT assumptions — they are decisions the plan needs to make explicit. They are flagged here so the plan author can choose and the verifier can audit.

1. **Should `sendKeys` return immediately (fire-and-forget) or await tmux's response?** — `send-keys -l` returns stdout immediately (it does not wait for the receiving process to consume the text). Awaits are cheap but add latency. Plan should choose.
2. **Should `tmux-copilot` tool be permission-gated?** — P42-04 surfaced this. Tool writes to tmux server, which is a state mutation. Default per Hivemind's tool permission model: `bash` is permission-gated; tmux commands should match.
3. **Should `listPanes` include metadata about which pane is the "main" pane vs. child panes?** — Could be derived from `getMainPaneId()`. Plan should decide output shape.
4. **Should `PaneGridPlanner` cache its last output?** — If the user calls the tool twice in quick succession with the same actions, the second call could short-circuit. Plan should decide.

---

**Status:** Assumptions documented. Ready for Phase 43 plan authoring. This is a docs-only (L5) artifact; runtime readiness is blocked until a Phase 43 implementation produces L1-L3 verification evidence.
