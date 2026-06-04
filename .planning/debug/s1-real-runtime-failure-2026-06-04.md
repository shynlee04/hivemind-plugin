# S1 Real-Runtime Failure: PULL-based Peek Does Not Fix PUSH-based Live Update

**Bug ID:** S1-P58.8-REAL
**Date:** 2026-06-04
**Phase:** 58.8 (P58 gap-fix, REQ-58-07)
**Status:** investigating
**Trigger:** User reports live update in tmux panel is still broken in real OpenCode runtime, despite the 4-commit gap-fix that passed BATS slot 71.
**Investigator:** hm-debugger (READ-ONLY — no code/test/.opencode changes)
**Evidence level:** L5 (documentation guidance only — runtime readiness claims require L1-L3 proof)

---

## 1. Symptom (Verbatim from User)

> "live update tại panel tmux vẫn chưa hoạt động"
>
> Translation: "live update in the tmux panel is still not working"

**Prior diagnosis baseline** (from `.planning/debug/tmux-delegate-streaming-gaps.md:60-75` and `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:25-31`):

> "tmux panel shows only first prompt, then cuts off unconditionally. Native `task` tool path works correctly (live stream of tool calls, progress, intermediate thoughts continues to update). The flaw is specific to the tmux-spawned child panel. The cut-off is unconditional — regardless of what the child does after the first prompt, no further updates appear in the tmux panel."

**Expected behavior (PUSH-based):** The child session's events should appear in the tmux pane in real time, without the user or orchestrator having to query for them.

**Actual behavior:** The pane shows the initial session state (first prompt), then freezes. The user expects PUSH; the harness provides PULL.

---

## 2. BATS Result (Slot 71 — GREEN)

**Test:** `tests/scripts/tmux/71-panel-live-update.bats`

**Test outline (lines 35-105):**
1. Create a tmux session: `tmux new-session -d -s "$tmux_session" -c "$project" "cat"`
   — Note: pane runs `cat`, NOT `opencode attach`.
2. Send a probe string: `tmux send-keys -t "$live_pane_id" -l "$probe"`
3. Wait 7 seconds.
4. Call `delegation-status {action: "peek", paneId}` via a `tmux_node_eval` shim.
5. Assert that the returned `content` field contains the probe verbatim.

**Result:** GREEN (per user report "BATS slot 71 passed").

---

## 3. Real-Runtime Result (FAIL)

**User's report (2026-06-04, live in real OpenCode runtime):** "live update tại panel tmux vẫn chưa hoạt động" — the tmux child pane does not live-update as the delegated child session runs.

**Behavior observed in production:**
- Child session is created via `delegate-task`.
- Tmux pane IS spawned (the `split-window` succeeds; pane title is set with Hivemind metadata).
- The `opencode attach` process starts in the pane and renders the initial session state (first prompt).
- After the first prompt, the pane content does not update.
- If the user (or orchestrator) calls `delegation-status {action: "peek", paneId}`, the returned `content` is the static first-prompt state — the same string every poll cycle.

**Why BATS is GREEN and runtime is RED** is the central question of this report.

---

## 4. Gap Analysis: BATS Environment vs Real OpenCode Runtime

### 4.1 BATS test exercises a fundamentally different code path

| Step | BATS slot 71 | Real OpenCode runtime |
|------|--------------|------------------------|
| Pane contents | `cat` echoes stdin | `opencode attach <url> --session <childId> --dir <dir>` (per `tmux-multiplexer.ts:289-297`) |
| Source of pane content updates | The user (test) writes via `tmux send-keys -l "$probe"` (line 49) | The child session's SDK event stream delivered to the `opencode attach` TUI process |
| `getPaneContent` impl | Inline mock that calls `tmux capture-pane -p -t $paneId` directly (line 75) | `SessionManager.getLatestCapture(paneId)` reads from `latestCapture` map populated by `startPolling` tick |
| Polling tick | NOT EXERCISED — the BATS test never starts the polling loop, never imports `SessionManager`, never calls `capturePaneContent` on the multiplexing path | `SessionManager.startPolling()` iterates `this.sessions`, calls `multiplexer.capturePaneContent(paneId, 5000)` (`session-manager.ts:333-348`) |
| `delegation-status` factory invocation | Direct ESM import inside `tmux_node_eval`, with hand-built `ManagerLike` and `StatusDeps` mocks (lines 67-79) | Tool factory invoked through the SDK tool-registration pipeline with a real `DelegationManager` instance and real `TmuxMultiplexer` instance |

**Critical observation (BATS, line 67-79):** The test imports `createDelegationStatusTool` and constructs a tool instance with a custom `StatusDeps.getPaneContent` that does NOT route through `SessionManager.getLatestCapture`. It calls `tmux capture-pane` on demand. The test NEVER starts the polling loop, NEVER populates `this.latestCapture`, NEVER calls `startPolling`. The test passes because `cat` echoes the probe into the pane, and the test's inline `getPaneContent` reads that echo back.

**The gap is structural:** BATS verifies "if you can call capture-pane on a pane with content, peek returns that content." Real runtime requires "the polling loop runs, captures pane content, and the pane content actually changes as the child works." BATS tests the first; real OpenCode exercises the second, and the second depends on `opencode attach` delivering child session events to the pane.

### 4.2 Polling loop activation: real OpenCode

For the polling loop to run in real OpenCode, the following conditions must all be true (per `src/features/tmux/integration.ts:345-438` and `src/plugin.ts:500-502`):

1. `tmux` binary on PATH (`integration.ts:363-364`)
2. `process.env.TMUX` is set — i.e. user is inside a tmux session (`integration.ts:367-369`)
3. `opencode` binary on PATH (`integration.ts:372-373`)

If all three are true, `createTmuxIntegrationIfSupported` returns a real `TmuxIntegration` (with a real `SessionManager` instance). If any is false, it returns `null` and:

- `options.tmuxIntegration?.sessionManager_` is `undefined` at `plugin.ts:452`
- The `sessionManager` field passed to `DelegationManager` is `undefined` (`plugin.ts:452-458`)
- `this.sessionManager?.startPolling()` at `manager-runtime.ts:268, 325` becomes a no-op (`?.` short-circuits)
- The polling loop NEVER starts in that runtime

**Even when tmux IS available** and `startPolling` is called from `dispatch()` (`manager-runtime.ts:268, 325`) AND `coordinator.dispatch()` (`coordinator.ts:226`), the loop only captures content for sessions in `this.sessions` map (`session-manager.ts:333`). The map is populated by `onSessionCreated` (called via the `tmuxObserver` from `plugin.ts:764-765`).

### 4.3 `capturePaneContent` works only against real tmux

`tmux-multiplexer.ts:541-563`:
```typescript
async capturePaneContent(paneId, maxBytes = 5000): Promise<{ content, capturedAt, byteLength }> {
  const tmux = await this.getBinary();
  if (!tmux) return { content: "", capturedAt: Date.now(), byteLength: 0 };
  try {
    const { stdout } = await execFileAsync(tmux, ["capture-pane", "-t", paneId, "-p"], { timeout: 2000 });
    const full = typeof stdout === "string" ? stdout : (stdout?.toString("utf8") ?? "");
    const content = full.length > maxBytes ? full.slice(-maxBytes) : full;
    return { content, capturedAt: Date.now(), byteLength: Buffer.byteLength(content, "utf8") };
  } catch (err) {
    this.log?.debug("capturePaneContent: ERROR", { paneId, err });
    return { content: "", capturedAt: Date.now(), byteLength: 0 };
  }
}
```

This requires:
- A real tmux server (the `tmux` binary must be the actual server, not a mock).
- A real `paneId` (e.g. `%0`) that exists in the tmux server's pane table.
- The pane's `stdout` to actually contain updated content.

In real OpenCode runtime with tmux, all three are present. The method works. The polling loop captures whatever `opencode attach` is rendering.

### 4.4 What the parent pane shows vs what the child pane shows

- **Parent pane** = the user's existing tmux window where they ran `opencode`. The harness attaches to it via `process.env.TMUX_PANE` (`tmux-multiplexer.ts:159`). The parent pane shows OpenCode's native TUI.
- **Child pane** = a NEW pane created by `spawnPane` via `tmux split-window -h -d -P -F #{pane_id} 'opencode attach ...'` (`tmux-multiplexer.ts:306-315`). The child pane runs `opencode attach` to display a child session.

The user's complaint refers to the **child pane** (the one displaying the delegated sub-agent's work). The parent pane is not affected by the bug.

---

## 5. Root Cause (One Sentence)

The PULL-based peek action surfaces what is *currently visible* in the tmux child pane, but the child pane is *frozen after the first prompt* because `opencode attach` does not receive the child session's subsequent event stream (an OpenCode SDK / server-side broadcast gap per `tmux-delegate-streaming-gaps.md:60-75`) — so polling captures the same static content forever, and peek returns that same static content, satisfying BATS but not the user's PUSH-based expectation.

---

## 6. Three Fix Options Ranked

### Option A — SDK event subscription + forward to pane (PUSH via SDK)

**Idea:** Subscribe to the child session's event stream via `client.session.subscribe()` (or via the in-tree `childEventStream` already imported at `manager-runtime.ts:29`). For each event, project a representation of the event into the child pane's `opencode attach` process — or replace the `opencode attach` invocation with a custom TUI that consumes the event stream directly.

**Files involved:**
- `src/coordination/delegation/manager-runtime.ts:269-275` — `subscribeChildEventBus` already attempted (S4). Verify it actually works for `opencode attach`-visible events.
- `src/features/tmux/tmux-multiplexer.ts:276-362` — `spawnPane` constructs the `opencode attach` command; replace with a custom viewer invocation.
- New module: `src/features/tmux/integration/pane-event-projection.ts` — converts SDK events to ANSI/terminal sequences.

**Pros:** Addresses root cause. Real-time. Event-driven (low latency, no polling overhead).
**Cons:** Requires SDK `client.session.subscribe()` to actually work in production. The prior diagnosis (`tmux-delegate-streaming-gaps.md:269-281`) noted that the SDK server "only sends events to the session's creator, not to arbitrary attached clients" — so `opencode attach` may not receive the stream regardless of subscription. Custom viewer bypasses that, but is significantly more code.
**27-tool-key invariant:** Preserved — no new tool added; pane event projection is internal.
**Effort:** Large (new viewer, SDK API surface verification, possibly need a fallback path).

### Option B — Replace `opencode attach` with custom harness viewer (PUSH via custom TUI)

**Idea:** Stop spawning `opencode attach` in the child pane. Spawn a lightweight Hivemind-owned TUI process that connects to the OpenCode server as an authenticated client, subscribes to the child session's events via the SDK, and renders them using `ink` or a custom ANSI renderer. The harness controls the rendering path end-to-end.

**Files involved:**
- `src/features/tmux/tmux-multiplexer.ts:276-362` — change the `opencode attach` command to `hivemind pane-viewer --session <id> --server <url>`.
- New package or bin: `bin/hivemind-pane-viewer.ts` (or under `src/features/tmux/viewer/`).
- New module: `src/features/tmux/viewer/event-renderer.ts` — Zod-parses SDK events → terminal output.

**Pros:** Decouples the pane from `opencode attach`'s quirks. The harness owns the rendering. Eliminates the SDK broadcast gap.
**Cons:** Custom TUI is a non-trivial undertaking. New bin entry point, new render path, new state management. The 27-tool-key invariant is preserved at the orchestration layer but the `pane-viewer` is a new subprocess kind — could be considered a "new tool" for audit purposes.
**27-tool-key invariant:** Borderline — the viewer is a subprocess, not a registered tool, but it introduces a new entry in the `bin/` surface.
**Effort:** Large (full custom TUI; multi-week project).

### Option C — Capture-pane re-render loop (PUSH via tmux)

**Idea:** Instead of reading pane content (current polling) or replacing the pane process (Options A/B), periodically re-render the latest content into the pane via `tmux send-keys` or `tmux paste-buffer`. The harness captures pane content (as it already does), then uses tmux to project that content back into the pane. This creates a feedback loop that forces the pane to update visually even if `opencode attach` is not producing new content.

**Files involved:**
- `src/features/tmux/session-manager.ts:328-356` — `startPolling` already runs. Add a "re-render" step that, after capture, calls `tmux paste-buffer` or `tmux send-keys` to redraw the captured content.
- `src/features/tmux/tmux-multiplexer.ts` — add `pasteBuffer(paneId, content)` and/or `redrawPane(paneId)` methods.

**Pros:** Cheapest to implement. Builds on existing polling infrastructure. No SDK API change required. No custom TUI.
**Cons:** Cosmetic — re-rendering the same frozen content does not change what is actually visible. The user's complaint is that the pane doesn't reflect what the child is doing. If `opencode attach` is frozen, re-rendering its frozen output keeps the pane frozen. Does NOT solve the underlying problem.
**27-tool-key invariant:** Preserved.
**Effort:** Small (1-2 file changes).

---

## 7. Recommended Fix + Implementation Sketch

**Recommended: Option A (SDK event subscription + custom projection).** Option C does not address the root cause — the pane content is frozen because `opencode attach` does not see child events, not because tmux is not redrawing. Option B is the most architecturally clean but largest. Option A is the only one that actually delivers the PUSH semantics the user expects.

**Implementation sketch (deferred to a follow-up phase — this report is L5 documentation only):**

1. **Verify SDK `client.session.subscribe()` actually delivers child events in production.** Per `manager-runtime.ts:269-275`, `subscribeChildEventBus` is already called post-spawn. The hard part is determining whether subscribing to a *child* session as the *parent* delivers the full stream. If yes, Option A becomes much smaller.
2. **Add an event-to-ANSI projector** in `src/features/tmux/viewer/event-projector.ts` (new):
   - Input: SDK `chat.message`, `tool.call`, `tool.result`, `session.idle` events
   - Output: ANSI sequences that match the visual style `opencode attach` uses (or a simpler custom style)
3. **Spawn a Hivemind-controlled viewer process** in the child pane instead of `opencode attach`:
   - `src/features/tmux/tmux-multiplexer.ts:289-297` — change `opencodeCmd` to use a Hivemind-provided viewer
   - The viewer process: `hivemind pane-viewer --session <childId> --server <url> --token <auth>`
   - Viewer subscribes to SDK events and renders them in-place
4. **Wire the `childEventStream`** (already imported at `manager-runtime.ts:29`) into the viewer via a Unix socket or named pipe, so the harness's in-memory event bus feeds the viewer's renderer.
5. **Add BATS test slot 75 (or extend slot 73):** spawn a tmux session with the viewer (or a mock viewer), feed a synthetic event, assert the pane content updates within 1s. This time, DO NOT use `cat` — use a real or mocked viewer.

**Why this is Option A and not B:** The viewer is a minimal in-pane renderer; the harness retains the source-of-truth for events in `childEventStream`. The viewer is a thin consumer. Option B's "fully custom TUI" implies a much larger rendering surface; Option A's viewer is event-driven, not TUI-state-driven.

**Why not C:** Re-rendering the same frozen output is a placebo. The user complaint is that the pane does not reflect child activity. If the content is frozen, the pane stays frozen regardless of how often tmux re-renders the same bytes.

---

## 8. Verification Plan

### BATS verification (slot 75 — new or slot 73 extended)

1. Spawn a tmux session running the Hivemind viewer (or a mock that subscribes to a synthetic event bus).
2. Inject a synthetic SDK event (`chat.message`) into the bus.
3. Assert that within 2s, the pane content (via `tmux capture-pane -p`) reflects the injected event.
4. Inject a second event 3s later. Assert the pane content updates.
5. Critical: this test must NOT use `cat` or `printf` echo as the pane process. The pane process must be a Hivemind viewer that subscribes to events.

### Real-runtime UAT

1. Run `opencode --port 4096` inside tmux.
2. From the orchestrator, dispatch `delegate-task` to a sub-agent.
3. Watch the child pane: within 2s of any tool call by the child, the pane should reflect the tool invocation (name, args, status).
4. After the child completes a tool call, the pane should show the result within 1s.
5. Repeat across 3 distinct sub-agent kinds and at least 2 multi-tool workflows to catch rendering edge cases.

### Regression checks

- BATS 57 (live-pane-monitoring) — must continue to pass (the existing polling loop is orthogonal to the new viewer).
- BATS 64 (forward-prompt) — must continue to pass.
- BATS 66 (session-tracker-delegation-events) — must continue to pass.

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **SDK `client.session.subscribe()` does not deliver child events to non-creator clients** | High (per `tmux-delegate-streaming-gaps.md:269-281`) | Blocks Option A; forces fallback to Option B | Run a probe session in dev to confirm SDK behavior; if blocked, escalate to Option B (custom viewer with its own SDK auth) |
| **27-tool-key invariant** (current tool set must not grow) | Low | Violates Phase 26 quality contract | Option A's viewer is a subprocess, not a tool. The 27-key contract is about registered tools, not subprocesses. |
| **SDK version drift** | Medium | Subscription API may change across SDK versions | Pin SDK version in `package.json` peerDependencies; add CI guard for `client.session.subscribe` signature check |
| **Performance** (event rate × pane render rate) | Medium | High event rates could cause tmux lag or viewer CPU spike | Cap event buffer to last 200 events; rate-limit projector to 10Hz max; measure under load test |
| **Custom viewer security** (bearer token handling) | Medium | Token in tmux pane command line is visible via `tmux list-commands` | Use `--token-file` path that points to a 0600 socket, or use unix domain socket for the event bus |
| **Backwards compatibility with native `task` panel** | Low | Must not regress the working native path | Custom viewer only applies to `delegate-task` child panes, not native `task` child panes |
| **Tab-completion in pane** | Low | If the viewer swallows input, users lose ability to type into the child session | Viewer should pass through keystrokes (via `tmux send-keys` passthrough) when the user toggles input mode |

---

## 10. Evidence Trail

| Source | Lines | Finding |
|--------|-------|---------|
| `tests/scripts/tmux/71-panel-live-update.bats:35-105` | 71 | Test uses `cat` as pane process; mocks `getPaneContent` inline; never exercises `SessionManager.startPolling` |
| `src/features/tmux/tmux-multiplexer.ts:541-563` | 23 | `capturePaneContent` returns `byteLength: 0` on any failure; depends on real tmux server |
| `src/features/tmux/session-manager.ts:328-356` | 29 | `startPolling` only iterates `this.sessions`; backed by `Map<string, TrackedSession>` populated by `onSessionCreated` |
| `src/features/tmux/session-manager.ts:333-348` | 16 | Polling tick captures per-pane, skips on `byteLength === 0`, applies backoff 5s→15s on stable content |
| `src/coordination/delegation/manager-runtime.ts:265-275` | 11 | `startPolling` is called post-spawn, but only if `sessionManager` is wired (depends on tmux integration being available) |
| `src/coordination/delegation/coordinator.ts:222-226` | 5 | Coordinator also calls `startPolling` post-spawn (belt-and-suspenders) |
| `src/plugin.ts:452-458` | 7 | `sessionManager` is `undefined` when `tmuxIntegration` is null (no tmux in env); `startPolling` becomes a no-op |
| `src/features/tmux/integration.ts:345-369` | 25 | `createTmuxIntegrationIfSupported` returns `null` if any of: tmux not on PATH, `TMUX` env not set, opencode not on PATH |
| `src/tools/delegation/delegation-status.ts:820-849` | 30 | `handlePeek` calls `deps.getPaneContent(paneId)` — returns whatever is in `latestCapture` (set by polling tick) |
| `src/tools/delegation/delegation-status.ts:37-42` | 6 | Zod union extended with `action: "peek"` and `paneId`, `maxBytes` fields |
| `src/features/tmux/tmux-multiplexer.ts:289-297` | 9 | `spawnPane` constructs `opencode attach <url> --session <id> --dir <dir>` as the child pane process |
| `.planning/debug/tmux-delegate-streaming-gaps.md:60-75` | 16 | Prior diagnosis: child pane freezes after first prompt; `opencode attach` is an independent client that does not receive child session events |
| `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:25-31` | 7 | Confirms: harness does NOT subscribe parent to child session event stream; `client.session.subscribe()` is never called for the child after dispatch |
| `src/coordination/delegation/manager-runtime.ts:269-275` | 7 | S4 already attempted `subscribeChildEventBus` with graceful fallback; unknown whether it works for the child pane projection path |

**Files read in full or in part (this investigation):**
- `tests/scripts/tmux/71-panel-live-update.bats` (106 lines)
- `src/features/tmux/tmux-multiplexer.ts` (606 lines)
- `src/features/tmux/session-manager.ts` (446 lines)
- `src/coordination/delegation/manager-runtime.ts` (offset 1-100, 200-360)
- `src/coordination/delegation/coordinator.ts` (offset 200-260)
- `src/tools/delegation/delegation-status.ts` (offset 800-891)
- `src/features/tmux/integration.ts` (offset 300-439)
- `src/features/tmux/observers.ts` (offset 40-200)
- `src/plugin.ts` (offset 430-545)
- `.planning/debug/tmux-delegate-streaming-gaps.md` (434 lines, prior diagnosis)
- `.planning/debug/p58-symptom-diagnosis-2026-06-04.md` (offset 1-50, prior diagnosis)

**Commits cited by user (verified via `git log`):**
- `0cd8bff0` phase-58-gap-fix(S1): add capturePaneContent to TmuxMultiplexer
- `498992fc` phase-58-gap-fix(S1): add SessionManager.startPolling + getLatestCapture + backoff
- `bd8b07e1` phase-58-gap-fix(S1): add peek action to delegation-status Zod union
- `14565724` phase-58-gap-fix(S1): wire polling start into dispatch() lifecycle

---

## 11. Summary for Orchestrator

- **Bug ID:** S1-P58.8-REAL
- **Status:** Root cause identified; L5 documentation only; no fix applied.
- **Root cause:** `opencode attach` in the child tmux pane freezes after the first prompt because the OpenCode SDK server does not broadcast child session events to arbitrary attached clients. The PULL-based `peek` action captures whatever is currently visible (frozen content) and returns it on demand. This satisfies BATS (where the test pane runs `cat`, not `opencode attach`, and `getPaneContent` is a direct tmux mock) but not the user's PUSH-based expectation.
- **Recommended fix:** Option A — replace the `opencode attach` invocation with a Hivemind-controlled event subscriber that subscribes to the child session's SDK event stream and projects events to the tmux pane. Requires verifying `client.session.subscribe()` works for non-creator clients in production.
- **Effort:** Large (multi-week; new viewer, SDK API verification, BATS rewrite for slot 75).
- **Tracked at:** `.planning/debug/s1-real-runtime-failure-2026-06-04.md`

**Delegation signal:** Root cause: PULL-based peek captures frozen `opencode attach` content because the SDK does not broadcast child session events to attached clients. Suggested next: dispatch `hm-planner` for a follow-up phase to design the Hivemind viewer (Option A) and rewrite BATS slot 75 to exercise the real event-projection path.
