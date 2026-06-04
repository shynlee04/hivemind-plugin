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
