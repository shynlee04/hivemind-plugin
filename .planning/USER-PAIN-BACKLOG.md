# User-Pain Backlog

> **Purpose.** A persistent, single-source-of-truth list of every
> user-visible symptom that has been reported, deferred, or resolved.
> This file exists because P42–P58 repeatedly excluded user-pain
> symptoms from SPEC scopes via "out-of-scope" clauses that were
> invisible to spec authors, verifiers, and the user. The
> `## User-Pain Coverage` section in every SPEC.md (added by
> P58-META-01) MUST cross-reference this file.
>
> **Status semantics.**
> - `OPEN` — symptom reported, no fix planned.
> - `OWNED-P{N}` — fix scheduled in phase P{N}, cross-link to its SPEC.
> - `RESOLVED` — fix shipped and verified (BATS + REAL UAT).
> - `WONTFIX` — explicitly deferred past product horizon; 1-line reason required.
>
> **Update discipline.** This file is updated atomically with each
> phase's close. A phase cannot mark `[x]` in ROADMAP.md without a
> corresponding entry update here. The
> `## Symptom Coverage Matrix` in ROADMAP.md (added by P58-META-03)
> mirrors this file at a higher level for at-a-glance phase health.

---

## Active Symptoms

### S1 — Live tmux pane content cut off after first prompt (P58 gap-fix)

- **First reported:** 2026-06-04
- **Status:** RESOLVED
- **Symptom (verbatim from source):**
  > "After delegate-task, the tmux pane shows only the first prompt,
  > then ALL subsequent activities are CUT OFF regardless of what the
  > child does."
- **Source:**
  - `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:24-30`
  - `.planning/debug/tmux-delegate-streaming-gaps.md:60-75`
  - `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-META-ANALYSIS.md:73-79`
- **Owned by:** P58-PLAN-08 (gap-fix) — REQ-58-07
- **Resolution evidence:**
  - BATS slot 71 GREEN: `tests/scripts/tmux/71-panel-live-update.bats`
  - `src/features/tmux/tmux-multiplexer.ts:capturePaneContent` method
  - `src/features/tmux/session-manager.ts:startPolling` 5s polling loop
    with 15s backoff on stable content
  - `src/tools/delegation/delegation-status.ts` `peek` action
  - AC-58-07-01..05 verified in
    `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-VERIFICATION.md`

### S2 — User-actor has no direct interaction with running child session (P58 gap-fix)

- **First reported:** 2026-06-04
- **Status:** RESOLVED
- **Symptom (verbatim from source):**
  > "The user has no direct interaction with a running child session.
  > They cannot send a prompt, send a key (pause/abort/resume), or
  > invoke forward-prompt/peek/progress from the user's TUI."
- **Source:**
  - `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:33-41`
  - `.planning/debug/tmux-delegate-streaming-gaps.md:77-103`
- **Owned by:** P58-PLAN-08 (gap-fix) — REQ-58-08
- **Resolution evidence:**
  - BATS slot 72 GREEN: `tests/scripts/tmux/72-user-inject.bats`
  - `src/tools/tmux-copilot.ts` `USER_SESSION` tier
    (D-58-22 LOCKED, take-over / release / peek only)
  - `src/tools/tmux-copilot.ts` `peek` action
  - AC-58-08-01..05 verified (AC-58-08-04 regression-guard: AC#10
    `appendTuiPrompt` and AC#11 `forward-prompt` manualOverride
    checks still pass — BATS 64 + 65 GREEN)
  - USER_SESSION_ALLOWED_ACTIONS documented with REGRESSION GUARD
    comment to prevent widening

### S3 — Orchestrator main stream terminates early when delegations in-flight (P58 gap-fix)

- **First reported:** 2026-06-04
- **Status:** RESOLVED
- **Symptom (verbatim from source):**
  > "After `delegate-task`, the orchestrator's main stream terminates
  > early. The orchestrator loses the ability to accept new user
  > instructions mid-flight. The advertised 'always-background
  > WaiterModel' comment contradicts the code."
- **Source:**
  - `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:43-52`
  - `.planning/debug/tmux-delegate-streaming-gaps.md:105-174`
  - `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-META-ANALYSIS.md:77`
- **Owned by:** P58-PLAN-08 (gap-fix) — REQ-58-09
- **Resolution evidence:**
  - BATS slot 73 GREEN: `tests/scripts/tmux/73-stream-stays-open.bats`
  - `src/coordination/delegation/manager-runtime.ts`:
    - I9 pre-send validation at line 230 (preserves synchronous
      error handling for spawn failures)
    - I10 `void sendPromptAsync(...).catch(...)` at line 302
      (true fire-and-forget WaiterModel)
  - `src/tools/delegation/delegate-task.ts:32` comment fix —
    "true-fire-and-forget WaiterModel (P58.3)"
  - AC-58-09-01..05 verified

### S4 — Orchestrator has no live JIT context for mid-flight progress (P58 gap-fix)

- **First reported:** 2026-06-04
- **Status:** RESOLVED
- **Symptom (verbatim from source):**
  > "The orchestrator has no live JIT (just-in-time) context. It
  > cannot answer 'progress?' mid-flight because it has no visibility
  > into the child's in-flight work (tool invocations, intermediate
  > artifacts, reasoning)."
- **Source:**
  - `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:54-64`
  - `.planning/debug/tmux-delegate-streaming-gaps.md:175-211`
- **Owned by:** P58-PLAN-08 (gap-fix) — REQ-58-10
- **Resolution evidence:**
  - BATS slot 74 GREEN: `tests/scripts/tmux/74-progress-mid-flight.bats`
  - `src/features/session-tracker/streaming/child-event-stream.ts`:
    in-memory `Map<sessionId, Event[]>` ring buffer (capped at 100
    events per session), singleton export `childEventStream`
  - `src/tools/delegation/delegation-status.ts` `progress` action
  - `src/coordination/delegation/manager-runtime.ts:dispatch` wires
    `childEventStream.subscribe(childSessionId, sdkClient)` after
    spawn, wrapped in try/catch (R2 mitigation)
  - `src/coordination/delegation/coordinator.ts:handleCompletion`
    wires `childEventStream.unsubscribe(childSessionId)` on terminal
  - AC-58-10-01..05 verified

---

## Sticky Bugs (P51+ sticky-bug-busting, Phase 58.9)

> P58.9 is the sticky-bug-busting follow-up to P58.8. A P51+ regression hunt
> at `.planning/debug/p51-plus-sticky-bugs-2026-06-04.md` found 12 sticky
> bugs that survived the P58.8 gap-fix. P58.9 addresses the 3 critical +
> adds 4 regression guards. Source: `58.9-SPEC.md:31-49`.

### SB-1 — P53 journal hook broken (silent data-loss)
- **Severity:** Critical
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:39-50`
- **Symptom:** `SessionManager.startPolling` at `src/features/tmux/session-manager.ts:328-356`
  captures content but NEVER emits `pane-captured` events. The P53
  pane-monitor hook at `src/hooks/pane-monitor.ts` receives zero events;
  `.hivemind/journal/<sid>/` stays empty.
- **Disposition:** RESOLVED (P58.9)
- **Resolution:** P58.9 REQ-58.9-01 added the missing emit:
  - Extended `PaneCapturedEvent` with optional `content` field
  - Added `setObserver(observer: PaneObserver)` to `SessionManager`
  - Wired `sessionManager.setObserver(adapter)` in `src/plugin.ts`
  - `startPolling` tick now calls `observer.onPaneCaptured()` on hash change
  - P53 hook writes BOTH `<ts>-pane.json` (7 fields) AND sibling `<ts>-pane-content.txt` (full content)
- **Resolution evidence:**
  - BATS slot 75 GREEN: `tests/scripts/tmux/75-pane-captured-journal.bats`
  - `src/features/tmux/observers.ts` `PaneCapturedEvent.content?: string`
  - `src/features/tmux/session-manager.ts:startPolling` emit call
  - `src/hooks/pane-monitor.ts` `writeContentSiblings` + `buildContentFilename`
  - AC-58.9-01-01..05 verified

### SB-2 — 5 new vitest regressions introduced by P58.8
- **Severity:** Critical
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:18-30`
- **Symptom:** P58.8 widened vitest full-suite failure count from 2 to 7.
  5 NEW timeouts in `eval/coherence.test.ts:37,106`,
  `tests/plugin/bootstrap-tools-registration.test.ts:59`,
  `tests/tools/delegate-task.test.ts:197,239`. All pass in isolation
  (timer pollution from `SessionManager.startPolling`).
- **Disposition:** RESOLVED (P58.9)
- **Resolution:** P58.9 REQ-58.9-02 added `afterEach(() => vi.useRealTimers())`
  to drain fake-timer chains from `SessionManager.startPolling`
  setTimeout refs. Result: ZERO P58.9-introduced regressions in
  vitest full-suite.
- **Resolution evidence:**
  - `eval/coherence.test.ts` `afterEach(vi.useRealTimers())` (1 commit)
  - `tests/plugin/bootstrap-tools-registration.test.ts` beforeEach + afterEach
    (1 commit)
  - `tests/tools/delegate-task.test.ts` beforeEach + afterEach (1 commit)
  - All 5 affected tests pass in full-suite (verified via `npx vitest run`)
  - AC-58.9-02-01..05 verified

### SB-3 — BATS structural bypass for tmux runtime
- **Severity:** Critical
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:88-103`
- **Symptom:** 7 of 8 tmux-related BATS slots (62, 63, 64, 71, 72, 73, 74)
  use `cat` or inline mocks. BATS never exercises the real `opencode attach`
  TUI path. User's S1 PUSH complaint cannot be reproduced in BATS.
- **Disposition:** RESOLVED (P58.9)
- **Resolution:** P58.9 REQ-58.9-03 added BATS slot 76 that uses a real
  `opencode` binary in a real tmux pane. Also added BATS slot 75 that uses
  a real tmux session with `cat` for the polling-driven journal path.
  Both slots include skip patterns (`tmux_bats_require_opencode`,
  `tmux_bats_require_tmux_server`) for environments without dependencies.
- **Resolution evidence:**
  - BATS slot 75 GREEN: `tests/scripts/tmux/75-pane-captured-journal.bats`
  - BATS slot 76 GREEN: `tests/scripts/tmux/76-pane-real-runtime.bats`
  - Real `opencode --version` output captured (verified end-to-end)
  - AC-58.9-03-01..06 verified

### SB-4 — USER_SESSION widening trust boundary (defers-to-P59)
- **Severity:** High (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:141`
- **Symptom:** D-58-22 LOCKED grants USER_SESSION ability to set
  `manualOverride = true` and read pane content. The widening is
  intentional but no BATS test verifies that a malicious USER_SESSION
  caller CANNOT escalate to `forward-prompt` or `send-keys`.
- **Disposition:** defers-to-P59
- **Mitigation in P58.9:** REQ-58.9-04-02 (regression guard for AC#11
  manualOverride FIRST in `forward-prompt`) protects against future
  regression. Dedicated BATS test for "USER_SESSION cannot invoke
  `forward-prompt`" is deferred to P59.

### SB-5 — BATS 2 stale (defers-to-P59)
- **Severity:** High (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:35-37`
- **Symptom:** `tests/scripts/tmux/01-mcp-server-pty.bats:43` and
  `tests/scripts/tmux/61-stress-test-real-world-workflow.bats:21` are
  stale.
- **Disposition:** defers-to-P59 (pre-existing P52/P55/P56 debt)

### SB-6 — Pre-existing full-suite-only vitest fails (not in P58.9 scope)
- **Severity:** Medium (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:124-131`
- **Symptom:** `tests/integration/tool-registration.test.ts:185` and
  `tests/plugins/plugin-lifecycle.test.ts:175` fail in full-suite only.
- **Disposition:** not-relevant (preserved as pre-existing per AC-58.9-02-06)

### SB-7 — S4 wiring deviation (not in P58.9 scope)
- **Severity:** Medium (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:60`
- **Symptom:** S4 SUBSCRIBE wired at `manager-runtime.ts:527` instead of
  plan's `coordinator.ts:200`. Documented deviation, not a functional
  break.
- **Disposition:** not-relevant

### SB-8 — AC#10/AC#11 comments don't reflect S2 invariant (defers-to-P59)
- **Severity:** Medium (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:12`
- **Disposition:** defers-to-P59 (documentation cleanup)

### SB-9 — resolveBinary regression test docs mismatch (not in P58.9 scope)
- **Severity:** Low (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:13`
- **Disposition:** not-relevant

### SB-10 — `__setTmuxMultiplexerForTesting` test seam usage (not in P58.9 scope)
- **Severity:** Low (not in P58.9 scope)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:13`
- **Disposition:** not-relevant (test seam is intentional per P58.7)

### SB-11 — Module size cap 4× breached (not in P58.9 scope)
- **Severity:** High (informational only; soft target)
- **Source:** `p51-plus-sticky-bugs-2026-06-04.md:11`
- **Disposition:** not-relevant (P58.9 soft-warning for pane-monitor.ts +71 LOC; full refactor deferred)

### SB-12 — Pre-existing test rot: delegation-manager custom-title
- **Severity:** Pre-existing (NOT P58.9)
- **Source:** Uncovered during V3 verification
- **Symptom:** `tests/lib/delegation-manager.test.ts:878` "uses custom title
  when provided" fails because the code transforms `title: "My Custom Title"`
  to `title: "hm/delegate/child/agent/my-custom-title@1"`. Fails in
  isolation, not introduced by P58.9.
- **Disposition:** out-of-P58.9-scope (separate pre-existing test rot,
  not a P58.9 regression)

---

## Resolved Symptoms (historical record)

_None yet — this backlog was created by P58-META-01. Future symptom
additions append here with `Status: RESOLVED` once verified._

---

## Process Notes

- **Initial population source:** `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:14-17`
  (verbatim) and `.planning/debug/tmux-delegate-streaming-gaps.md:13-36`
  (supporting detail).
- **Cross-link required by:** AC-58-META-01 (USER-PAIN-BACKLOG.md
  exists with initial entries S1, S2, S3, S4).
- **Authoring rule:** Each new symptom entry MUST include the verbatim
  text from the user-facing report and a source citation to the
  debug report. Diagnoses without verbatim user quotes are
  downgraded to "investigation notes" in `.planning/debug/`.
- **Closure rule:** A symptom is `RESOLVED` only when (a) BATS
  regression passes, AND (b) the REAL UAT section in
  `VERIFICATION.md` is signed by a human tester
  (per AC-58-META-04).
