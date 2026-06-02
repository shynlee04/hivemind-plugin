# Phase 53: Live Pane Monitoring Hook + Journal Integration — Specification

**Created:** 2026-06-02
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Add a new hook `src/hooks/pane-monitor.ts` that subscribes to `pane-captured` events emitted by the P52-expanded `src/features/tmux/observers.ts`, writes structured journal entries to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json` with exponential backoff on capture failure (5s → 10s → 30s, max 3 retries) and a 100-entries-per-session-per-hour rate cap (UTC top-of-hour reset); retroactively close the P42 UAT L5 evidence gap and re-anchor P43 VERIFICATION.md against the new L1 hook evidence.

## Background

P52 closed with the observer expansion that exposes `onPaneCaptured(cb)` registration on `createTmuxEventObserver`, delivering the event surface downstream consumers need. P51 introduced the in-tree `SessionManager` + `TmuxMultiplexer` chain, and P50–P51 closed the opencode-tmux fork dependency. The P42 UAT (`42-tmux-visual-orchestration-layer-fork-extension/UAT.md`) was downgraded to L5 documentary PASS via the P49 pass-1 fix, leaving an explicit follow-up to capture L1 runtime evidence; P43 VERIFICATION.md notes four W-01..W-04 spec-drift items RESOLVED at commit `0a501582` but referenced L5 cross-references only.

What exists today:
- `src/features/tmux/observers.ts` (P52 deliverable) — `createTmuxEventObserver` factory that returns an `onPaneCaptured(cb: (event: PaneCapturedEvent) => void) => void` registration method. `PaneCapturedEvent = { sessionId, paneId, contentLength, timestamp }`.
- `src/hooks/observers/event-observers.ts` and `src/hooks/observers/delegation-consumer.ts` — existing hook registration patterns via the Hivemind hooks array exported from `src/plugin.ts`.
- `src/hooks/types.ts` — hook contract definitions; P53 hook follows the same factory-and-register shape.
- `.hivemind/journal/` — canonical per-Q6 internal state root for journal entries; never committed (R-P50-03 spirit — local runtime writes, not source-tree state).
- `.hivemind/session-tracker/` — append-only, NEVER modified by EXECUTE (R-P50-03 strict prohibition).
- `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` (this phase) — BATS scenario harness following the `5X-tmux-...` naming convention from P51/P52.

The gap: no runtime consumer of `pane-captured` events exists; pane state is captured by P52's observer but never persisted, so post-hoc debugging of tmux visual orchestration has no live record. P42's runtime evidence is L5-only, and P43's W-items reference stale L5 context — both can be upgraded to L1 with a single P53 hook test fixture that produces a real journal file.

## Requirements

1. **Hook factory + observer subscription** (REQ-53-01, ubiquitous) — The pane-monitor hook shall subscribe to `pane-captured` events via the P52 `onPaneCaptured` registration method.
   - **Current:** No consumer of `pane-captured` events exists; P52 emits events that are dropped.
   - **Target:** New `src/hooks/pane-monitor.ts` (≤ 500 LOC) exports `createPaneMonitorHook(opts: { sessionId: string; observer: ReturnType<typeof createTmuxEventObserver>; journalRoot?: string }): { dispose: () => void; counters: { written: number; retried: number; dropped: number } }`. Default `journalRoot` = `.hivemind/journal`. The factory subscribes synchronously inside the constructor via `observer.onPaneCaptured(handler)`, creates `<journalRoot>/<sessionId>/` via `fs.mkdir(..., { recursive: true })` on first event, and returns `dispose()` for teardown that removes the listener.
   - **Acceptance:** `git grep createPaneMonitorHook src/hooks/` returns exactly 1 definition; `src/plugin.ts` (or composition root) has 1 call site that registers the hook output into the hooks array; calling `dispose()` removes the `pane-captured` listener (verified by firing an event after dispose and asserting the journal file count does not grow).

2. **Journal entry file with 7 fields** (REQ-53-02, ubiquitous) — While a `pane-captured` event is received and the rate cap is not exceeded, the hook shall write a JSON file to `<journalRoot>/<sessionId>/<ISO-8601-timestamp>-pane.json` containing exactly 7 fields.
   - **Current:** Pane-captured events have no persistence path; P52 observer discards the payload after delivery.
   - **Target:** Each event produces exactly one file. Path: `<journalRoot>/<sessionId>/<capturedAt with colons replaced by hyphens>-pane.json` (e.g., `2026-06-02T12-34-56.789Z-pane.json` — filesystem-safe variant of the ISO timestamp). 7 fields: `schemaVersion` (string, `"1.0"`), `eventType` (string, `"pane-captured"`), `sessionId` (string), `paneId` (string), `capturedAt` (ISO 8601 string from event), `contentLength` (number), `contentPreview` (string, first 200 chars of the captured content or empty string `""` if the event does not carry a content field). The file is written via `fs.writeFile` with `utf8` encoding and `flag: "wx"` (exclusive create) to avoid clobber.
   - **Acceptance:** BATS 1/1 invokes the hook, fires 1 synthetic `PaneCapturedEvent`, asserts that `.hivemind/journal/test-session/2026-06-02T*-pane.json` exists (glob match), that `jq -r .eventType <file>` returns `"pane-captured"`, that `jq -r .schemaVersion <file>` returns `"1.0"`, and that `jq -r 'keys | length' <file>` returns `7`.

3. **Exponential backoff 5s → 10s → 30s, max 3 retries; silent drop on 4th failure** (REQ-53-03, state-driven) — While a journal write attempt fails, the hook shall retry the write with delays 5s, 10s, and 30s; if all 3 retries fail, the event shall be silently dropped with no exception propagating to the caller.
   - **Current:** No retry logic; one write failure = silent drop (worse than retry, no resilience).
   - **Target:** On `fs.writeFile` rejection, the hook schedules a retry via `setTimeout` (delay 5000 ms on attempt 2, 10000 ms on attempt 3, 30000 ms on attempt 4). The event payload is captured in the closure. Each retry increments `counters.retried` by 1. After 3 failed retries (4 total attempts), `counters.dropped` is incremented and the event is dropped silently. All errors are caught — no `throw` crosses the hook's `dispose`/handler boundary.
   - **Acceptance:** vitest backoff test injects a `fs.writeFile` mock that rejects the first 2 attempts and succeeds on the 3rd, fires 1 event, asserts the file eventually exists, `counters.retried === 2`, `counters.written === 1`, and the total elapsed time is between 15s − ε and 15s + ε (using `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync`). A second vitest case injects 4 consecutive failures, asserts `counters.dropped === 1` and no exception thrown to the caller.

4. **Rate limit 100/session/hour, UTC top-of-hour reset** (REQ-53-04, state-driven) — While the per-session hourly write counter is ≥ 100 within the current UTC hour, the hook shall silently drop incoming `pane-captured` events without attempting a journal write; the counter shall reset at the next UTC top-of-hour.
   - **Current:** No cap exists; a runaway tmux session could write unbounded journal entries.
   - **Target:** An in-memory `Map<sessionId, { hourEpoch: number; count: number }>` records hourly counts. On each event: if `currentHourEpoch !== stored.hourEpoch`, reset to `{ hourEpoch: current, count: 0 }` then proceed. If `stored.count >= 100`, increment `counters.dropped` and return without writing. Otherwise, increment `stored.count`, write the entry, return. UTC hour epoch = `Math.floor(Date.now() / 3_600_000)`.
   - **Acceptance:** vitest cap test seeds the counter to 100, fires 1 more event, asserts no new file written, `counters.dropped === 1`, `counters.written === 0`. A second test advances the fake clock past the top-of-hour boundary (≥ 3600 s), fires 1 event, asserts the file is written, `counters.written === 1`.

5. **Retroactive L1 Backing on P42 UAT.md and P43 VERIFICATION.md** (REQ-53-05, ubiquitous) — The P53 EXECUTE phase shall append an `## L1 Backing (P53)` section to both `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` and `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md` referencing P53 hook evidence; the pre-existing content of both files shall be preserved verbatim.
   - **Current:** P42 UAT.md carries an explicit "L5 only" notice with deferred P50-01/02/03 follow-ups; P43 VERIFICATION.md references W-01..W-04 RESOLVED at `0a501582` with L5 cross-references only.
   - **Target:** P42 UAT.md gains an `## L1 Backing (P53)` section citing the BATS journal-capture test path (`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`), the live journal entry file under `.hivemind/journal/test-session/2026-06-02T*-pane.json`, and an explicit upgrade of the L5-only acceptance steps to L1-backed. P43 VERIFICATION.md gains an `## L1 Backing (P53)` section re-anchoring the W-01..W-04 items against P53 hook evidence (the hook's journal entry proves the observer event surface is operational end-to-end). Neither file's pre-existing content is deleted or reordered; the new section is appended at the end (after the last existing section, before any trailing metadata).
   - **Acceptance:** `git diff 42-tmux-visual-orchestration-layer-fork-extension/UAT.md` after the P53 EXECUTE shows 0 lines removed and ≥ 5 lines added (the new section). Same for P43 VERIFICATION.md. The new section's heading exactly matches `## L1 Backing (P53)` and the first paragraph cites the P53 BATS path and the journal file glob.

## Boundaries

**In scope:**
- `src/hooks/pane-monitor.ts` creation (≤ 500 LOC; factory exports the `createPaneMonitorHook` shape)
- Subscription wiring into the P52 `onPaneCaptured` registration method (the hook is a consumer only — no changes to `observers.ts`)
- Journal writes to `.hivemind/journal/<sid>/<ISO-timestamp>-pane.json` (local runtime writes, never committed)
- Exponential backoff (5s/10s/30s, max 3 retries) and silent drop on retry exhaustion
- 100/session/hour rate limit with UTC top-of-hour reset
- Retroactive `## L1 Backing (P53)` sections on P42 UAT.md and P43 VERIFICATION.md (append-only)
- 1 BATS scenario (`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`) + 2 vitest files (`tests/lib/hooks/pane-monitor-backoff.test.ts`, `tests/lib/hooks/pane-monitor-cap.test.ts`)
- `src/plugin.ts` registration of the hook in the hooks array (1 call site)

**Out of scope:**
- P54 session persistence and restart-recovery (next phase)
- P55 E2E UAT (final seed-criterion phase)
- Sidecar dashboard rendering of journal entries (separate downstream scope)
- Changes to `src/features/tmux/observers.ts` (P52 deliverable is the contract; P53 is a consumer only)
- Changes to the `PaneCapturedEvent` shape (P52 already locked `{ sessionId, paneId, contentLength, timestamp }`)
- Modifying `.hivemind/session-tracker/*` (R-P50-03 — strict append-only, EXECUTE must not touch)
- Removing or replacing the existing "L5 only" notice in P42 UAT.md (REQ-53-05 is additive, not subtractive)

## Constraints

- **D-04 (P51 silent-fallback):** hook must never throw on tmux unavailability, missing adapter, or filesystem errors; all failure modes return silently with counter increments
- **R-P50-03 (spirit):** `.hivemind/journal/*` is local runtime state (NOT committed) — gitignored, but writes are local-disk durable; mirrors the spirit of R-P50-03 without the "do not touch" prohibition (because journal writes ARE the EXECUTE deliverable here, unlike session-tracker reads which must never be mutated)
- **Q6 (canonical state root):** `.hivemind/` is the internal state root; `.opencode/` is OpenCode-primitives-only — P53 writes to `.hivemind/journal/`, never to `.opencode/`
- **P20 invariant:** no new `package.json` dependencies; backoff uses `setTimeout` from `node:timers` (built-in)
- **Module LOC cap:** `src/hooks/pane-monitor.ts` ≤ 500 LOC
- **EARS coverage mix:** 3 ubiquitous (REQ-01, REQ-02, REQ-05) + 2 state-driven (REQ-03, REQ-04); silent-drop behaviors are encoded in the state-driven requirements' "shall silently drop" clauses (no separate unwanted-class requirement needed because all error paths are already covered by the state-driven conditions)
- **AGENTS.md §7 (CP-PTY runway):** P53 is hook-only, automatically satisfies the "no `src/**` mutation for CP-PTY runway" rule — the hook factory is a new file, not a mutation of the CP-PTY target
- **P52 contract preservation:** `observer.onPaneCaptured` registration method (delivered in P52) is the SOLE event source; P53 does not add new observer-side infrastructure

## Acceptance Criteria

- [ ] `src/hooks/pane-monitor.ts` exists and exports `createPaneMonitorHook` (1 definition)
- [ ] `src/hooks/pane-monitor.ts` is ≤ 500 LOC
- [ ] `createPaneMonitorHook` returns `{ dispose, counters: { written, retried, dropped } }`
- [ ] `src/plugin.ts` (or appropriate composition site) includes 1 call site that registers the hook output
- [ ] Calling `dispose()` removes the `pane-captured` listener (verified by BATS: fire event after dispose, assert file count unchanged)
- [ ] 1 BATS scenario passes: fires synthetic `PaneCapturedEvent`, asserts journal file at `.hivemind/journal/test-session/2026-06-02T*-pane.json` exists and is `jq`-parseable with 7 fields
- [ ] `jq -r .eventType <journalfile>` returns `"pane-captured"`
- [ ] `jq -r .schemaVersion <journalfile>` returns `"1.0"`
- [ ] `jq -r 'keys | length' <journalfile>` returns `7`
- [ ] vitest backoff test: `fs.writeFile` rejects 2 times, succeeds 3rd; elapsed time between 15s − ε and 15s + ε; `counters.retried === 2`; `counters.written === 1`
- [ ] vitest 4th-failure path: `fs.writeFile` rejects 4 times, `counters.dropped === 1`, no exception propagates to caller
- [ ] vitest cap test: counter at 100, fire 1 event, assert no file written, `counters.dropped === 1`, `counters.written === 0`
- [ ] vitest top-of-hour reset: advance clock past UTC hour boundary, fire 1 event, assert file written, `counters.written === 1`
- [ ] `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` gains `## L1 Backing (P53)` section (≥ 5 lines added, 0 lines removed)
- [ ] `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md` gains `## L1 Backing (P53)` section (≥ 5 lines added, 0 lines removed)
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run test` passes without regressions (3144+ vitest cases, 37+ BATS)
- [ ] No modifications to `.hivemind/session-tracker/*` (R-P50-03)
- [ ] No new `package.json` entries (P20 invariant)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                                    |
|--------------------|-------|------|--------|------------------------------------------------------------------------------------------|
| Goal Clarity       | 0.93  | 0.75 | ✓      | ROADMAP L1975-1986 + this brief + P52 surface lock the goal                              |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Explicit in/out; P54/P55 deferred; P42/P43 retroactive scope is narrow and append-only   |
| Constraint Clarity | 0.87  | 0.65 | ✓      | D-04, R-P50-03 spirit, Q6, P20, LOC cap, §7 all locked                                   |
| Acceptance Criteria| 0.88  | 0.70 | ✓      | 19 pass/fail checks; BATS 1 + vitest 2; L1 journal file grep-able                        |
| **Ambiguity**      | 0.10  | ≤0.20| ✓      | Composite = 1 − mean(0.93, 0.90, 0.87, 0.88) ≈ 0.105 → 0.10 (floor to 2 decimals)         |

All dimensions meet or exceed minimums. No dimensions below threshold. Composite ambiguity 0.10 ≤ 0.20 gate: **PASS**.

## Interview Log

| Round | Perspective     | Question summary            | Decision locked                                                                                |
|-------|-----------------|-----------------------------|-----------------------------------------------------------------------------------------------|
| —     | (auto mode)     | Initial ambiguity ≤ 0.20    | Skipped interview — SPEC.md derived from ROADMAP L1975-1986 + P52 SPEC format + retro-targets  |

---

*Phase: 53-live-pane-monitoring-hook-journal-integration*
*Spec created: 2026-06-02*
*Next step: /gsd-discuss-phase 53 — implementation decisions (retry helper choice, hourEpoch precision, retroactive section wording, BATS naming slot 55 vs 56)*
