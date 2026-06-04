# P51+ Sticky Bug Hunt — 2026-06-04

**Investigator:** gsd-debugger (READ-ONLY, L5 documentation only)
**Trigger:** User: "bugs have been dragging from phase 51 to this point"
**Scope:** P51 → P58.8 (gap-fix, 30 commits executed 2026-06-04)
**Prior context:** S1 report at `.planning/debug/s1-real-runtime-failure-2026-06-04.md` (BATS-vs-runtime gap for panel live update)

## Summary

- **Critical: 3** (P53 journal hook broken; BATS-vs-runtime gap is structural; USER_SESSION widening to take-over/peek changes trust boundary)
- **High: 4** (3 new vitest regressions introduced by P58.8; BATS 2 stale; BATS 47 broken; module size cap 4× breached)
- **Medium: 3** (S4 wiring deviates from plan; pre-existing full-suite-only fails persist; AC#10/AC#11 comments don't reflect the new S2 invariant at the call site)
- **Low: 2** (resolveBinary regression test docs mismatch; pre-existing tests rely on __setTmuxMultiplexerForTesting test seam)
- **Bypasses found: 7** (BATS 62, 63, 64, 65, 71, 72, 73, 74 — all bypass or partially bypass the real production path; only BATS 66 exercises real session-tracker)

## Cat 1: BATS-vitest-tsc baseline

**vitest** (`npx vitest run`, 153.91s): 7 failed / 3303 passed / 7 skipped (3317 total). 5 test files failed:

| # | File:line | Test | Status |
|---|-----------|------|--------|
| 1 | `eval/coherence.test.ts:37` | "no conflicting permissions" | NEW P58.8 regression (timed out) |
| 2 | `eval/coherence.test.ts:106` | "reports coherence score summary" | NEW P58.8 regression (timed out) |
| 3 | `tests/integration/tool-registration.test.ts:185` | "each tool execute returns without throwing" | KNOWN full-suite-only fail (passes 17/17 in isolation) |
| 4 | `tests/plugin/bootstrap-tools-registration.test.ts:59` | "registers bootstrap-init and bootstrap-recover" | NEW P58.8 regression (timed out 15s) |
| 5 | `tests/plugins/plugin-lifecycle.test.ts:175` | "launchDelegatedSession as a usable facade" | KNOWN full-suite-only fail (passes 11/11 in isolation) |
| 6 | `tests/tools/delegate-task.test.ts:197` | "surfaces truthful sdk execution metadata" | NEW P58.8 regression (timed out) |
| 7 | `tests/tools/delegate-task.test.ts:239` | "surfaces queueKey through the public delegate-task tool" | NEW P58.8 regression (timed out) |

**Net change vs P58 baseline (2 fails):** P58.8 added 5 new failures (eval/coherence×2, bootstrap-tools, delegate-task×2). P58.8 INCREASED test failure count.

**tsc** (`npx tsc --noEmit`): clean. No type errors.

**BATS** (`bats tests/scripts/tmux/`, 57 tests): 55 passed / 2 failed.

- `tests/scripts/tmux/01-mcp-server-pty.bats:43` — `resolveBinary('tmux') returns null when tmux binary is not on PATH` — FAILS. The test's inline comment (line 31-33) says "tmux is not installed anywhere on this host" but `/usr/local/bin/tmux` IS installed (verified `tmux -V` → 3.6b). Test narrows PATH to `/usr/local/bin:/usr/bin:/bin` which still contains tmux. Stale test; must be either fixed (set PATH to something excluding `/usr/local/bin`) or removed.
- `tests/scripts/tmux/61-stress-test-real-world-workflow.bats:21` — `tmux_bats_require_stress_facilities: command not found`. The stress test setup references a helper that doesn't exist in `helpers.bash`. Test is structurally broken; never runs.

## Cat 2: P53 journal breakage

**STATUS: BROKEN.** The P53 pane-monitor hook subscribes to `pane-captured` events via `tmuxObserver.onPaneCaptured` (`src/plugin.ts:772-786`), and persists 7-field JSON entries to `.hivemind/journal/<sid>/<ts>-pane.json`. The 7-field `JournalEntry` shape is locked at `src/hooks/pane-monitor.ts:107-115` (schemaVersion, eventType, sessionId, paneId, contentLength, capturedAt, retryCount).

**P58.8 S1 introduced a NEW polling tick** at `src/features/tmux/session-manager.ts:328-356` that:
1. Captures pane content into `this.latestCapture` (line 338)
2. Updates `this.lastCaptureHash` (lines 339-344)
3. **Does NOT call any `observer.emitPaineCaptured(...)`, `tmuxObserver.onPaneCaptured(...)`, or any event-bus dispatch.**

The JSDoc comment at `session-manager.ts:316-317` LIES — it claims the tick "emits a `pane-captured` event with the FULL content (P53 hook currently emits metadata-only)" but the code does not emit. The P53 journal hook therefore receives ZERO `pane-captured` events from the new polling loop, and `.hivemind/journal/<sid>/` remains empty (verified: only `.gitkeep` exists in `.hivemind/journal/`).

**Verification:** `grep "emit|setObserver|onPaneCaptured" src/features/tmux/session-manager.ts` → no matches. The `TmuxMultiplexer` captures, the `SessionManager` stores in `latestCapture` (used by `peek` at `tmux-copilot.ts:442`), but no journal entry is written. This is a "BATS passes because peek returns content; the journal never gets written" split: S1 added the read-side but never wired the write-side.

## Cat 3: P54 session persistence breakage

**STATUS: INTACT but with one wiring deviation noted in Cat 4.**

- `src/coordination/delegation/coordinator.ts:200` — line ~200 is in the `dispatch()` pre-spawn block (inherited-model resolution). S4 wiring for the new child-event-bus is at `coordinator.ts:351` (`unsubscribeChildEventBus`) and `coordinator.ts:485-494` (private method). Not at line 200.
- `src/coordination/delegation/manager-runtime.ts:302` — S3 fire-and-forget `void sendPromptAsync(...)` is present. The change replaces the prior `await sendPromptAsync` that would have blocked dispatch return.
- `src/coordination/delegation/manager.ts:297, 568` — `recordDelegationTerminal` is still wired in `toolDelegation` and called from `abortDelegation` and `terminalFallback` paths. Restart-recovery contract is preserved.
- `.hivemind/session-tracker/ses_1723d915effe0g1RAXPAJ7yH4v/session-continuity.json` — schema valid: `version: 2.0`, `sessionID`, `lastUpdated`, `hierarchy: { root, children: { ... } }`. No corruption observed.
- **DEVIATION (noted by coverage audit, not a break):** S4 SUBSCRIBE was wired at `manager-runtime.ts:527` (in `subscribeChildEventBus`, called from `manager-runtime.ts:275` after `spawnDelegatedSession`) instead of the plan's `coordinator.ts:200`. This is a documented deviation per the just-completed coverage audit, not a functional break.

## Cat 4: P52 tmux-copilot action count

**Before P58.8: 7** actions. **After P58.8: 8** actions (peek added at commit `25869ea2`).

Verified Zod schemas at `src/tools/tmux-copilot.ts:131-178`:
- L132 `send-keys`, L139 `list-panes`, L144 `compute-grid`, L149 `respawn`, L155 `forward-prompt`, L163 `take-over`, L170 `release`, L176 `peek` = **8 actions, Zod union valid** ✓

`USER_SESSION_ALLOWED_ACTIONS` at `tmux-copilot.ts:114-118` = `{ "take-over", "release", "peek" }`. `forward-prompt` is correctly **excluded** with a D-58-22 LOCKED defer comment (lines 356-369).

AC#10 (`appendTuiPrompt` in `replayPendingDelegationNotifications`): **PRESERVED.** `src/plugin.ts:940-943` — `getManualOverrideState(sessionId)` check is the FIRST statement inside the `for (const notification of pending)` loop body.

AC#11 (`forward-prompt` in `tmux-copilot.ts`): **PRESERVED.** `src/tools/tmux-copilot.ts:371-380` — `getManualOverrideState(sessionId)` check is the FIRST statement inside the `case "forward-prompt":` block, BEFORE sentinel prepending or `sendKeys` invocation.

USER_SESSION tier widening at `tmux-copilot.ts:254` (`isUserSession = callerAgent === "user" || callerAgent === USER_SESSION`) and the per-action restriction guard at `tmux-copilot.ts:287-291` are CORRECT — USER_SESSION is NOT granted `forward-prompt` or `send-keys`, only take-over/peek/release. The guard is FIRST, before the input validation step.

**HIGH-CONFIDENCE OK for AC#10/AC#11 invariants.** But note: there are no BATS slots that exercise AC#10 (replayPendingDelegationNotifications) end-to-end. Only `manualOverride` is tested in BATS 65 for `forward-prompt` (line 65-77 of `65-takeover-release.bats`). The `replayPendingDelegationNotifications` path is structurally untested.

## Cat 5: P51 in-tree tmux contamination

**STATUS: CLEAN.** No fork-pattern contamination found.

- `opencode-tmux` references in `src/` are LIMITED to `ORIGIN:` comments in `src/features/tmux/grid-planner.ts:20,21,46,68,96,125,142` and `src/features/tmux/types.ts:17,25,39` — these are P51 attribution markers (1:1 ports from `opencode-tmux/src/...` during the in-tree migration), not runtime imports. No `import` or `require` of `@opencode-tmux/...` or `opencode-tmux-...` exists.
- `process.env.TMUX` references are legitimate runtime gates: `src/plugin.ts:541` (debug log), `src/features/tmux/integration.ts:330,367-368` (graceful-degradation check), `src/features/tmux/tmux-multiplexer.ts:181` (TMUX env for `enabled` gate). None suggest fork-pattern detection.
- `src/features/tmux/session-manager.ts` and `src/features/tmux/tmux-multiplexer.ts` remain the single source of truth. `getSessionManagerAdapter` at `src/features/tmux/types.ts:160-161` is the canonical bridge consumed by `tmux-copilot.ts:294`.
- "fork" mentions in `src/features/session-tracker/{index,bootstrap}.ts` are about git session-fork (parent-child session inheritance), unrelated to code fork patterns.

## Cat 6: BATS bypass audit

| Slot | Bypass type | Real module missing? | Severity |
|------|-------------|----------------------|----------|
| **62 pool-status** | Uses `Manager.createForTest()` factory, then injects 3 fake delegations via `__getDelegationsForTesting` test seam (line 36-39). Asserts 8 invariants of the in-memory map serialization. Does NOT exercise the real abort/dispatch flow. | YES — does not go through `spawnDelegatedSession`/`abortDelegation` paths | Medium |
| **63 abort-resume** | BATS fixture COMMENT EXPLICITLY ADMITS (line 52-54): "We simulate the manager's persist call by writing state=paused directly to the persistence file... full manager wiring is tested in unit tests." | YES — `abortDelegation` codepath is bypassed; `fs.writeFile` simulates the persist | High (this is a structural bypass, not just a mock) |
| **64 forward-prompt** | Mocks multiplexer `sendKeys` to capture calls AND forward to real `tmux send-keys` via `execFile`. Real tmux pane IS used. The `SessionManager.sendKeys` → `TmuxMultiplexer.sendKeys` chain is BYPASSED — only the adapter's `sendKeys` method is invoked. | PARTIAL — tmux pane real; multiplexer.sendKeys real; SessionManager adapter mocked | Low |
| **65 takeover-release** | Uses real tmux + `cat`. Mocks multiplexer with `{ sendKeys: async () => Promise.resolve() }`. Verifies `manualOverride` state mutation (real) and `forward-prompt` suppression (real). Take-over/release don't call `sendKeys` so mock is fine. | PARTIAL — manualOverride state is real; multiplexer is mock | Low |
| **66 session-tracker-delegation-events** | Imports real `tmux_node_eval` and asserts session-tracker writes 3 delegation events with monotonic `emittedAt`. Closest to a real-execution test. | NO — most comprehensive test in the suite | (Reference) |
| **71 panel-live-update** | **CONFIRMED S1 BYPASS.** Uses `cat` + inline `getPaneContent` mock that calls `tmux capture-pane` directly. Never imports `SessionManager`, never starts the polling loop, never calls `capturePaneContent` on the multiplexing path. | YES — `SessionManager.startPolling` is never exercised | **Critical (per S1)** |
| **72 user-inject** | Uses `cat` + minimal mock `{ sendKeys: async () => Promise.resolve() }`. Tests `take-over` and `release` against USER_SESSION (correctly allowed). For `peek`, the code at `tmux-copilot.ts:442` does `adapter.getLatestCapture?.(input.paneId) ?? null` — the mock has no `getLatestCapture` so peek returns zero-byte envelope. Test only checks "accessibility" not correctness. | YES — real polling loop never runs; peek returns empty | **Critical (S1 same pattern)** |
| **73 stream-stays-open** | Pure `grep` test. No tmux, no Node code execution. Asserts `void sendPromptAsync` is present and `await sendPromptAsync` is absent in `manager-runtime.ts:235-330`. | YES — no runtime behavior tested | **High (zero runtime coverage)** |
| **74 progress-mid-flight** | Grep + mock manager with hand-built stub delegation. Asserts Zod union has 'progress' and the action returns counters. No real child session, no real SDK subscription. | YES — `childEventStream` integration untested | **High (zero runtime coverage)** |

**Total: 7 bypass / partial-bypass slots (62, 63, 64, 65, 71, 72, 73, 74).** Only slot 66 is a real-runtime test. This is a structural weakness: BATS is GREEN for the 7 bypassed slots, but they don't exercise the code paths that fail in real OpenCode runtime.

## Cat 7: manualOverride first-check regression

- **AC#10 (`src/plugin.ts:940-943`, in `replayPendingDelegationNotifications`):** Manualoverride check IS the FIRST statement inside the `for (const notification of pending)` loop body. The pattern is: `if (overrideState?.manualOverride === true) continue;` BEFORE any other work. **STATUS: CORRECT.**
- **AC#11 (`src/tools/tmux-copilot.ts:371-380`, in `case "forward-prompt":`):** Manualoverride check IS the FIRST statement inside the case block. The pattern is: `if (overrideState?.manualOverride === true) return renderToolResult({ suppressed: true, ... })` BEFORE sentinel prepending or `sendKeys`. **STATUS: CORRECT.**
- **USER_SESSION tier widening (S2, `tmux-copilot.ts:254-291`):** `isUserSession` does NOT bypass the manualOverride check — the manualOverride check at line 371-380 runs AFTER the per-action restriction guard at line 287-291, so USER_SESSION cannot even reach `forward-prompt` (it is not in `USER_SESSION_ALLOWED_ACTIONS`). `take-over` and `release` are not subject to the manualOverride check (they set/clear it). `peek` is a read-side action with no manualOverride interaction. **STATUS: CORRECT.**

**Gap:** Neither AC#10 nor AC#11 has a BATS test that exercises the suppression path against USER_SESSION. AC#11's suppression is tested at `65-takeover-release.bats:60-77` (orchestrator-tier). AC#10 has NO BATS coverage at all (`grep "replayPendingDelegationNotifications" tests/` returns no matches).

## Cat 8: 27-tool-key invariant

**Count: 27.** Verified by `grep "^\s*\"" src/plugin.ts`:
- Hook keys: 3 (`tool.execute.before` L807, `chat.message` L832, `tool.execute.after` L880) — excluded from tool count
- Tool keys: 27 — L137, 138, 144 (3) + L157-163 (7) + L177-185 (9) + L198-203 (6) + L872, 876 (2) = **27 ✓**

`USER_SESSION` widening (D-58-22) and `peek` action (REQ-58-08) did NOT add new tools. P58.8 S2 was a TIER widening + new ACTION inside an existing tool. **STATUS: PRESERVED.**

## Cat 9: P20 no-new-deps

**`git diff package.json` lines: 0 (empty).** No new dependencies since P58.8. **STATUS: PRESERVED.**

## Cat 10: Pre-existing test failures

| Test | Full-suite | Isolation | Conclusion |
|------|-----------|-----------|------------|
| `tests/integration/tool-registration.test.ts:185` | FAIL (timeout 5s) | PASS (17/17 in 13.19s) | KNOWN full-suite-only. Order-dependent state pollution. |
| `tests/plugins/plugin-lifecycle.test.ts:175` | FAIL (timeout 5s) | PASS (11/11 in 13.90s) | KNOWN full-suite-only. Same pattern as above. |

**STATUS: PERSISTED.** Both tests have a pre-existing full-suite-only failure pattern that P58.8 did not address.

---

## Critical bugs to fix (priority order)

1. **P53 journal hook broken** — `src/features/tmux/session-manager.ts:328-356` (S1 polling tick) does NOT emit `pane-captured` events despite the JSDoc at L316-317 claiming it does. The P53 pane-monitor hook at `src/hooks/pane-monitor.ts:333-` never receives events from the new polling loop, so `.hivemind/journal/<sid>/<ts>-pane.json` is never written. **Proposed fix:** In the polling tick, after `this.latestCapture.set(tracked.paneId, capture)`, call `this.observer?.onPaneCaptured?.({ type: "pane-captured", sessionId: tracked.sessionId, paneId: tracked.paneId, contentLength: capture.byteLength, timestamp: Date.now() })`. Requires wiring `observer` into `SessionManager` constructor (currently not a constructor param).

2. **BATS-vs-runtime gap is structural** — 7 of 8 tmux-related BATS slots (62, 63, 71, 72, 73, 74) bypass the real production path. BATS is GREEN, real OpenCode is RED (per S1 report at `.planning/debug/s1-real-runtime-failure-2026-06-04.md`). **Proposed fix:** Add slot 75 that uses a real SessionManager, real TmuxMultiplexer, real `opencode attach`-like pane process, and asserts `peek` returns content that updates between polls. Do NOT use `cat` as the pane process.

3. **USER_SESSION widening to take-over/peek changes trust boundary** — D-58-22 LOCKED grants the human operator ability to SET `manualOverride = true` and to read pane content. The widening is intentional and documented, but no BATS test verifies that a malicious or buggy USER_SESSION caller CANNOT escalate to `forward-prompt` or `send-keys`. **Proposed fix:** Add BATS slot 76 (Wave 2E): USER_SESSION caller invokes `forward-prompt` and `send-keys`, assert both return `permission-denied`. The regression-guard comment at `tmux-copilot.ts:278-286` is a paper guard; the test is the real guard.

## Top 3 urgent bugs

1. **P53 journal hook broken** (`session-manager.ts:328-356`) — the new polling tick claims to emit `pane-captured` events but doesn't, so the P53 journal write path is silent. This is a silent data-loss bug that BATS cannot catch (no BATS test exercises the new polling → journal write path).

2. **5 new vitest regressions introduced by P58.8** — `eval/coherence.test.ts:37,106` and `tests/tools/delegate-task.test.ts:197,239` and `tests/plugin/bootstrap-tools-registration.test.ts:59` all time out in full-suite. P58.8 widened test failure count from 2 → 7 without addressing the pre-existing 2.

3. **BATS structural bypass for tmux runtime** — 7 of 8 tmux slots (71, 72, 73, 74, 62, 63, 64) bypass or partially bypass real production paths. The user's complaint about "live update tại panel tmux vẫn chưa hoạt động" cannot be reproduced in BATS because BATS doesn't test the real polling → real pane → real opencode-attach path.

## Recommended next action

**File a follow-up P58.9 phase to (a) wire the missing `pane-captured` emit in `SessionManager.startPolling`, and (b) rewrite BATS slot 75 to use a real SessionManager + real `opencode attach` TUI in the pane so the user's "live update not working" complaint can be reproduced and fixed.**
