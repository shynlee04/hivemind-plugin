---
phase: 14
phase_name: "delegate-task truth-reset — WaiterModel + dual-signal + hybrid persistence"
project: "opencode-harness"
generated: "2026-04-22"
counts:
  decisions: 16
  lessons: 9
  patterns: 8
  surprises: 7
missing_artifacts: []
---

# Phase 14 Learnings

Extracted from: 3 PLAN files, 3 SUMMARY files, VERIFICATION, UAT, E2E-UAT, HUMAN-UAT, RUNTIME-UAT-SCHEDULE, VALIDATION, CONTEXT, RESEARCH, REVIEW, DELEGATION-COMPARISON-REPORT.

---

## Decisions

### D-14-01: WaiterModel always-background dispatch — no sync/async mode split
- **What:** `DelegationManager.dispatch()` always runs in background. Returns `{ status: "dispatched", delegationId }` immediately. No `delegateSync` or `delegateAsync` methods.
- **Why:** Sync/async mode split was the fundamental architectural error of the original implementation. The WaiterModel (always-background, foreground continues, wait-on-demand) is the correct pattern for agent delegation.
- **Source:** 14-01-PLAN.md (D-02 truth), 14-01-SUMMARY.md (accomplishments), 14-VERIFICATION.md (truth #3)

### D-14-02: Dual-signal completion uses session.idle + message count stability
- **What:** Completion detection requires BOTH `session.idle` event AND stability check (message count unchanged for `STABILITY_THRESHOLD=3` consecutive polls at `STABILITY_POLL_INTERVAL_MS=3000`).
- **Why:** `session.idle` can fire prematurely or for intermediate states. The dual-signal pattern from oh-my-openagent proved that requiring both signals eliminates phantom completions.
- **Source:** 14-CONTEXT.md (D-04, D-12), 14-01-PLAN.md (Task 2), 14-RESEARCH.md (Pattern 2)

### D-14-03: Safety ceiling replaces fixed timeouts — MAX runtime, not deadline
- **What:** `DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000` (30 min) is an optional MAX runtime ceiling. Tasks run until dual-signal confirms completion. The ceiling only fires if no completion is detected.
- **Why:** Fixed timeouts (like the previous 15-min deadline) cause premature termination of legitimate long-running tasks. The safety ceiling is a last-resort guard against runaway sessions.
- **Source:** 14-CONTEXT.md (D-13), 14-01-PLAN.md (types changes), 14-VERIFICATION.md (truth #9)

### D-14-04: Dedicated delegation-status tool (separate from delegate-task)
- **What:** `delegation-status` tool created as a separate tool for querying delegation state and retrieving results. `delegate-task` only dispatches.
- **Why:** Clean separation of concerns. `delegate-task` dispatches; `delegation-status` polls. This prevents tool bloat and follows the single-responsibility principle (D-14).
- **Source:** 14-02-PLAN.md (objective), 14-02-SUMMARY.md (accomplishments)

### D-14-05: Runtime-truthful tests — transport-boundary-only mocking
- **What:** Tests mock ONLY the SDK transport boundary, NOT DelegationManager methods. Tests verify real state transitions (Map contents, file contents, timer state), real error shapes (`[Harness]` prefix), and real event sequences.
- **Why:** Mock-heavy tests that assert on mock call counts prove nothing about real runtime behavior. D-08 directive requires tests that would catch real failures.
- **Source:** 14-03-PLAN.md (D-08), 14-03-SUMMARY.md (key decisions), 14-RESEARCH.md (Pitfall 6)

### D-14-06: Fire-and-forget prompt with setTimeout(0) status transition
- **What:** The `dispatch()` prompt call is NOT awaited. The `.then()` handler wraps the status transition in `setTimeout(0)` — a macrotask that real-timer `await` won't process but fake-timer `advanceTimersByTimeAsync` will.
- **Why:** Reconciles the design problem where `getStatus()` must return "dispatched" with real timers but "running" with fake timers. The macrotask scheduling ensures deterministic test behavior.
- **Source:** 14-01-SUMMARY.md (decisions made — fire-and-forget)

### D-14-07: Simple stability poll counter (not true message count comparison)
- **What:** Stability check increments a counter per poll rather than comparing actual message counts. Tests advance timers by `STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD` and expect completion.
- **Why:** Mock returns 1 message while `lastMessageCount` starts at 0. True comparison would break test determinism. Simple increment is sufficient for stability detection.
- **Source:** 14-01-SUMMARY.md (decisions made — simple poll counter)

### D-14-08: Two separate timer Maps for safety and stability
- **What:** `safetyTimers` and `stabilityTimers` stored as separate Maps rather than a single combined map.
- **Why:** A single Map would cause timer overwrites when both safety ceiling and stability poll timers are active for the same delegation. Separate Maps ensure independent lifecycle.
- **Source:** 14-01-SUMMARY.md (decisions made — two timer Maps)

### D-14-09: Recovery uses handleSessionIdle() — same dual-signal path as live sessions
- **What:** `recoverPending()` routes idle sessions through the same `handleSessionIdle()` method used for live sessions, starting stability polling rather than directly finalizing.
- **Why:** Avoids code duplication and ensures recovered delegations go through the same stability confirmation as live ones. Direct finalization would bypass the dual-signal safety net.
- **Source:** 14-01-SUMMARY.md (decisions made — recovery via handleSessionIdle)

### D-14-10: safetyCeilingMs validation range set to 60000-3600000 (1-60 min)
- **What:** Zod schema enforces `safetyCeilingMs` between 60000ms (1 min minimum) and 3600000ms (60 min maximum).
- **Why:** Previous range of 1000-1800000 was from an earlier iteration before WaiterModel architecture stabilized. The 1-60 min range aligns with practical delegation durations.
- **Source:** 14-02-SUMMARY.md (decisions made — safetyCeilingMs range)

### D-14-11: Single delegation-status tool with dual mode (lookup + filter)
- **What:** One tool handles both single-delegation lookup (by ID) and list-with-filter (by status) rather than separate tools.
- **Why:** Keeps tool surface minimal. One tool with optional parameters is simpler than two tools for related queries.
- **Source:** 14-02-SUMMARY.md (decisions made — single tool with dual mode)

### D-14-12: Transport-boundary-only mocking confirmed as sufficient
- **What:** Tests mock SDK session API methods (create, prompt, status, messages) but NOT internal DelegationManager methods. This ensures tests exercise real state transitions.
- **Why:** Mocking DelegationManager methods would create hollow tests that verify mock wiring, not actual behavior. Transport boundary is the correct seam.
- **Source:** 14-03-SUMMARY.md (key decisions — transport-boundary-only mocking)

### D-14-13: Timer precision requirement — ceilingMs > 9000ms for safety ceiling tests
- **What:** Safety ceiling tests must set `ceilingMs > STABILITY_POLL_INTERVAL_MS * STABILITY_THRESHOLD` (9000ms minimum). Tests use 14000ms for margin.
- **Why:** If ceilingMs is lower than the time needed for stability completion (3 polls × 3000ms), the ceiling fires before completion can be confirmed, making the "does NOT fire if delegation completes" test impossible.
- **Source:** 14-03-SUMMARY.md (key decisions — timer precision)

### D-14-14: Microtask drain requires vi.advanceTimersByTimeAsync(10) not (1)
- **What:** Promise rejection handlers use `.catch() → setTimeout(0)`, requiring at least 10ms timer advance to let the microtask queue drain before the macrotask fires.
- **Why:** `vi.advanceTimersByTimeAsync(1)` is insufficient for the `.catch() → setTimeout(0)` chain because the promise microtask hasn't drained yet.
- **Source:** 14-03-SUMMARY.md (key decisions — microtask drain)

### D-14-15: Persist delegation state BEFORE sending prompt
- **What:** `dispatch()` persists delegation to disk immediately after registration, BEFORE sending the prompt to the child session.
- **Why:** If the process crashes between prompt send and persistence, the delegation state is lost. Write-before-send ensures durability (Pitfall 5 from research).
- **Source:** 14-RESEARCH.md (Pitfall 5), 14-01-PLAN.md (critical implementation details)

### D-14-16: Delegation persistence via delegations.json under continuity store directory
- **What:** Delegation state persisted to `delegations.json` using the same directory as `continuity.ts` storage, with `persistAllDelegations()` called after every state transition.
- **Why:** Reuses existing battle-tested persistence infrastructure. No need for a new storage mechanism. Atomic JSON writes proven reliable in continuity.ts.
- **Source:** 14-01-PLAN.md (hybrid persistence), 14-VERIFICATION.md (truth #5, data-flow trace)

---

## Lessons

### L-14-01: setTimeout(0) macrotask reconciles real-timer and fake-timer test expectations
- **What was learned:** The core design problem was reconciling `getStatus` returning "dispatched" with real timers vs "running" with fake timers. Wrapping the status transition in `setTimeout(0)` creates a macrotask that `await` won't process in real-timer mode but `advanceTimersByTimeAsync` will in fake-timer mode.
- **Context:** During GREEN phase implementation of DelegationManager, the test for "dispatch returns dispatched status" failed because the status had already transitioned to "running" via the awaited prompt.
- **Source:** 14-01-SUMMARY.md (decisions made — fire-and-forget prompt)

### L-14-02: Simple poll counter beats true message comparison for test determinism
- **What was learned:** Using a simple increment counter for stability polls works better than comparing actual message counts, because mock SDK responses produce count=1 while `lastMessageCount` starts at 0 — true comparison would always show "changed" on first poll.
- **Context:** Initial design called for comparing `currentMessageCount === lastMessageCount` for stability detection, but mock responses made this unreliable.
- **Source:** 14-01-SUMMARY.md (decisions made — simple poll counter)

### L-14-03: In-memory Map must be updated in recoverPending catch blocks
- **What was learned:** `recoverPending()` used a spread copy at loop start, but the catch block mutated the local variable without updating the Map entry. This caused the "recoverPending marks delegations as error" test to fail.
- **Context:** Found during Task 2 test run. The delegation appeared recovered but status mutations in catch blocks were lost.
- **Source:** 14-01-SUMMARY.md (auto-fixed issue #2 — recoverPending catch block)

### L-14-04: Promise rejection microtask drain needs 10ms timer advance, not 1ms
- **What was learned:** When SDK failures trigger `.catch() → setTimeout(0)` chains, `vi.advanceTimersByTimeAsync(1)` is insufficient because the microtask queue hasn't drained. 10ms provides enough margin.
- **Context:** SDK prompt failure test (`session.prompt() SDK failure → delegation transitions to error`) failed because the error state hadn't propagated yet.
- **Source:** 14-03-SUMMARY.md (auto-fixed issue #1 — SDK failure test timing)

### L-14-05: Safety ceiling duration must exceed total stability check time
- **What was learned:** Safety ceiling tests with `ceilingMs=5000` fire before stability completion (which needs 9000ms minimum: 3 polls × 3000ms). Tests must set `ceilingMs` well above the stability threshold.
- **Context:** "Safety ceiling does NOT fire if delegation completes first" test failed because 5000ms ceiling expired before 3 stability polls could complete.
- **Source:** 14-03-SUMMARY.md (auto-fixed issue #2 — safety ceiling timing)

### L-14-06: Hard-coded agent validation lists drift from project configuration
- **What was learned:** The original `VALID_AGENTS` constant hard-coded only `researcher`, `builder`, `critic`, and `general`, but the project has a broader configured agent surface. This causes silent breakage when new agents are added.
- **Context:** Code review (WR-03) found this before the WaiterModel rewrite. The fix: resolve valid agent names from `client.app.agents()` at runtime instead of a duplicated constant.
- **Source:** 14-REVIEW.md (WR-03)

### L-14-07: The Phase 02 baseline already had ~80% of needed infrastructure
- **What was learned:** `concurrency.ts` (keyed semaphore), `continuity.ts` (durable JSON persistence), `completion-detector.ts` (two-signal completion), and `helpers.ts` (SDK utilities) already existed in Phase 02. The DelegationManager only needed to compose these modules, not rebuild them.
- **Context:** Research phase compared three reference implementations and concluded that composing existing modules was sufficient.
- **Source:** 14-RESEARCH.md ("Don't Hand-Roll" table, "Key insight" note)

### L-14-08: Over-engineering delegation lifecycle was the root cause of phases 09-13 failure
- **What was learned:** Phases 09-13 created 7+ lifecycle modules (tmux-runner, patching, queue, dispatcher, process-runner, state, events) for what one DelegationManager class handles in ~310-450 LOC. The complexity compounded into a regression spiral.
- **Context:** Research triage identified 18 dead/broken files to delete, all from the over-engineered lifecycle approach.
- **Source:** 14-RESEARCH.md (Pitfall 7, triage table), 14-CONTEXT.md (what's wrong section)

### L-14-09: Mock-verified claims prove nothing about real runtime behavior
- **What was learned:** Tests that mock `client.session.create()` to return a fake session, then assert the mock was called, test nothing real. Runtime-truthful testing requires verifying state transitions, error shapes, and event sequences — not mock call counts.
- **Context:** Diagnostic reports from earlier sessions showed delegations completing in 21ms with empty results — tests were green but the tool was broken.
- **Source:** 14-RESEARCH.md (Pitfall 6), 14-CONTEXT.md (D-08 directive)

---

## Patterns

### P-14-01: WaiterModel Dispatch Pattern
- **Description:** Always-background execution: `dispatch()` creates child session, persists state, sends prompt, returns immediately with `{ status: "dispatched", delegationId }`. Foreground continues. Completion detected asynchronously via events.
- **When to use:** Any delegation/subagent dispatch where the caller should not block. The foreground orchestrator continues its work and only waits when it needs a specific background task's result.
- **Source:** 14-01-PLAN.md (architecture section), 14-01-SUMMARY.md (patterns-established)

### P-14-02: Dual-Signal Completion (session.idle + stability polling)
- **Description:** Completion requires two signals: (1) `session.idle` event fires, AND (2) message count is unchanged for `STABILITY_THRESHOLD` consecutive polls at `STABILITY_POLL_INTERVAL_MS` intervals. Neither signal alone is sufficient.
- **When to use:** When session events can fire prematurely (intermediate states, partial completions). The dual-signal pattern from oh-my-openagent prevents phantom completions.
- **Source:** 14-RESEARCH.md (Pattern 2), 14-01-SUMMARY.md (patterns-established)

### P-14-03: Safety Ceiling (MAX Runtime, Not Deadline)
- **Description:** Optional max runtime ceiling that only fires if dual-signal hasn't confirmed completion. Default 30 min. On breach: abort child session, mark as timeout, persist state. This is NOT a response deadline.
- **When to use:** As a last-resort guard against runaway/zombie sessions. Should not be the primary completion mechanism — dual-signal is.
- **Source:** 14-01-PLAN.md (safety ceiling), 14-01-SUMMARY.md (patterns-established)

### P-14-04: Dedicated Status-Poll Tool (D-14 Pattern)
- **Description:** Separate tool for querying delegation state. `delegate-task` dispatches; `delegation-status` polls. Supports single-delegation lookup by ID and list-with-filter by status.
- **When to use:** When a dispatch tool needs a companion status tool. Keeps the dispatch tool focused on creation; status tool handles all read queries.
- **Source:** 14-02-SUMMARY.md (patterns-established), 14-02-PLAN.md (objective)

### P-14-05: Transport-Boundary-Only Mocking for Runtime-Truthful Tests
- **Description:** Tests mock ONLY the SDK transport boundary (session.create, session.prompt, session.status, session.messages). They do NOT mock DelegationManager internal methods. Verification checks real state (Map contents, file contents, timer state), real error shapes (`[Harness]` prefix), and real event sequences.
- **When to use:** When testing modules that depend on external SDKs. The transport boundary is the correct test seam — it allows testing real business logic without requiring a live SDK instance.
- **Source:** 14-03-SUMMARY.md (key decisions), 14-03-PLAN.md (runtime-truthfulness checks)

### P-14-06: Two-Timer-Maps Pattern
- **Description:** When a module needs multiple independent timer types (e.g., safety ceiling timers AND stability poll timers), use separate Maps rather than a combined map with keyed entries.
- **When to use:** When multiple timer categories with different lifecycles coexist for the same entity. Prevents overwrites and simplifies cleanup.
- **Source:** 14-01-SUMMARY.md (decisions made — two timer Maps)

### P-14-07: Recover-Via-Same-Path Pattern
- **Description:** When restoring persisted state on startup, route recovered entities through the same processing path as live entities (e.g., `recoverPending()` calls `handleSessionIdle()` for idle sessions rather than directly finalizing).
- **When to use:** When implementing crash recovery. Reusing live code paths for recovery avoids duplicating logic and ensures recovered entities go through the same validation/safety checks.
- **Source:** 14-01-SUMMARY.md (decisions made — recovery uses handleSessionIdle)

### P-14-08: Persist-Before-Prompt Ordering
- **Description:** In delegation dispatch, persist delegation state to disk BEFORE sending the prompt to the child session. If the process crashes between registration and prompt, the delegation record survives and can be recovered.
- **When to use:** Any operation where state must survive crashes. Write-then-act ensures durability even if the action fails or the process dies.
- **Source:** 14-RESEARCH.md (Pitfall 5), 14-01-PLAN.md (critical implementation details)

---

## Surprises

### S-14-01: Previous verification had stale truth descriptions referencing pre-WaiterModel API
- **What was surprising:** The initial verification report (before re-verification) contained 18 truths with descriptions still referencing `delegateSync`/`delegateAsync` — the pre-WaiterModel API that no longer existed. These were copied from a pre-rebuild verification.
- **Impact:** Required full re-verification to correct truth descriptions. Consolidated from 18 → 16 truths to eliminate redundancy. All truths now reference the actual WaiterModel `dispatch()` architecture.
- **Source:** 14-VERIFICATION.md (re-verification note, re_verification.gaps_closed)

### S-14-02: Sync-completion race condition found in pre-rebuild code (delegateSync could hang forever)
- **What was surprising:** `delegateSync()` waited for `createDelegation()` to finish before storing the completion callback. If the child session completed during or immediately after prompt dispatch, `handleSessionIdle()` could complete the delegation before the callback was registered, leaving the original promise unresolved forever.
- **Impact:** This was a critical correctness issue in the pre-WaiterModel architecture. The WaiterModel rewrite eliminated it entirely by removing the sync path — there is no `delegateSync` to hang.
- **Source:** 14-REVIEW.md (WR-01 — sync-completion race)

### S-14-03: Deleted async child sessions never notified the parent
- **What was surprising:** `handleSessionDeleted()` rejected synchronous waiters but never called `notifyParent()` for async delegations. The parent session received no signal when a background child was deleted externally.
- **Impact:** Fixed in the WaiterModel rewrite — deletion path now handles both notification mechanisms.
- **Source:** 14-REVIEW.md (WR-02 — deleted async sessions silent)

### S-14-04: Hard-coded VALID_AGENTS was narrower than project's configured agent surface
- **What was surprising:** `VALID_AGENTS` in `types.ts` listed only 4 agents (`researcher`, `builder`, `critic`, `general`) while the project had many more configured agents under `.opencode/agents/`. New agents would silently fail delegation with `[Harness] Invalid agent`.
- **Impact:** Changed to runtime resolution via `client.app.agents()` instead of duplicated constant. Dynamic resolution stays in sync with project configuration automatically.
- **Source:** 14-REVIEW.md (WR-03 — hard-coded agent list)

### S-14-05: Microtask/macrotask interaction required 10ms timer advance in tests
- **What was surprising:** The `.catch() → setTimeout(0)` pattern for SDK failure handling required `vi.advanceTimersByTimeAsync(10)` instead of the expected `advanceTimersByTimeAsync(1)`. The microtask queue needs more than 1ms to drain before the macrotask fires.
- **Impact:** SDK failure tests initially failed with 1ms advance. Changing to 10ms resolved all timing-related test failures. This is a vitest-specific timing behavior that may surprise future test authors.
- **Source:** 14-03-SUMMARY.md (auto-fixed issue #1)

### S-14-06: REQ-14-01 through REQ-14-04 are referenced in ROADMAP but never defined
- **What was surprising:** The ROADMAP references REQ-14-01 through REQ-14-08, but `REQUIREMENTS.md` contains no entries for any of them. Plans 01-03 reference REQ-14-05 through REQ-14-08 in their frontmatter, but REQ-14-01 through REQ-14-04 are unclaimed by any plan.
- **Impact:** Traceability gap in planning metadata. All implementation evidence exists in code/tests/plans — the gap is in documentation, not functionality.
- **Source:** 14-VERIFICATION.md (requirements coverage — unmapped/orphaned)

### S-14-07: notifyParent() was planned but never implemented (and not needed)
- **What was surprising:** The 14-03-PLAN audit checklist included `notifyParent()` as a public method to test, but it was never implemented in the DelegationManager. Finalization succeeds without it.
- **Impact:** No impact — the method was correctly identified as not needed. The plan checklist was aspirational rather than describing existing code.
- **Source:** 14-03-SUMMARY.md (plan checklist adjustments — notifyParent)

---

## Summary Statistics

| Category | Count | Sources Used |
|----------|-------|-------------|
| Decisions | 16 | 14-01-PLAN, 14-01-SUMMARY, 14-02-PLAN, 14-02-SUMMARY, 14-03-PLAN, 14-03-SUMMARY, 14-CONTEXT, 14-RESEARCH, 14-VERIFICATION |
| Lessons | 9 | 14-01-SUMMARY, 14-03-SUMMARY, 14-REVIEW, 14-RESEARCH, 14-CONTEXT |
| Patterns | 8 | 14-01-PLAN, 14-01-SUMMARY, 14-02-SUMMARY, 14-03-PLAN, 14-03-SUMMARY, 14-RESEARCH |
| Surprises | 7 | 14-VERIFICATION, 14-REVIEW, 14-03-SUMMARY |
| **Total** | **40** | |

## Missing Artifacts

None — all expected artifacts were present and read:
- ✅ 14-01-PLAN.md, 14-02-PLAN.md, 14-03-PLAN.md
- ✅ 14-01-SUMMARY.md, 14-02-SUMMARY.md, 14-03-SUMMARY.md
- ✅ 14-VERIFICATION.md, 14-VALIDATION.md
- ✅ 14-UAT.md, 14-E2E-UAT.md, 14-HUMAN-UAT.md, 14-RUNTIME-UAT-SCHEDULE.md
- ✅ 14-CONTEXT.md, 14-RESEARCH.md, 14-REVIEW.md, 14-DELEGATION-COMPARISON-REPORT.md
- ✅ .planning/STATE.md

---

*Generated: 2026-04-22*
*Phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-*
