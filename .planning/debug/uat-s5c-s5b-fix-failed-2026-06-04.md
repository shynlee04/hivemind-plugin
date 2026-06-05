# UAT S5c — S5b fix did NOT work in real runtime (regression)

**Date:** 2026-06-04
**Tested by:** user live UAT in tmux opencode (rebuild + restart after S5b fix)
**Verdict:** **FAIL** — S5b fix was insufficient

---

## Reproduction (post-S5b-fix rebuild)

1. User rebuilt harness after S5b fix landed (commits `de417386`, `e2b8e4d9`):
   - `src/plugin.ts:606` — threads `tmuxIntegration` into `setupDelegationModules`
   - `src/coordination/delegation/coordinator.ts` — `spawnTmuxPanelForChild` method
   - 34/34 unit tests passing, typecheck exit 0
   - BATS slot 77 designed (could not run in env; hangs in this env per verifier)
2. User restarted opencode to load new dist
3. User ran the 9-track architectural audit (8-track scope, dispatched as 2 parallel `delegate-task` calls to `gsd-codebase-mapper`)
4. Front-facing hm-l0-orchestrator called `delegate-task` twice in parallel
5. **Expected:** 2 new tmux panels would spawn hosting the sub-sessions `ses_16a92f1ecfferqdNltVfGAfaJW` and `ses_16a92b6b3ffeZ99KxmT9EaEIij`
6. **Observed:** NO tmux panel spawned. Both delegations ran their sub-agents (Agent A: 5 tools called, Agent B: 8 tools called) **invisibly**
7. User cancelled at ~1m 35s; both delegations `terminalKind: cancelled`

## Evidence

| Metric | Agent A (T1+T2+T5) | Agent B (T4) |
|---|---|---|
| Delegation ID | dt-1780623407483-v20gvb | dt-1780623421293-3jz9g0 |
| Child session | ses_16a92f1ecfferqdNltVfGAfaJW | ses_16a92b6b3ffeZ99KxmT9EaEIij |
| Tools called | 5 | 8 |
| Progress | (cancelled mid-run) | (cancelled mid-run) |
| Tmux panel spawned | **NO** | **NO** |
| Disk-written audit | NO | NO |

**Verbatim user report:** "cancel them the test is failed no panel of tmux spawned"

## Why S5b fix failed (NEW root-cause space)

The S5b fix was: wire `tmuxIntegration` into `setupDelegationModules` at `src/plugin.ts:606`, then add `spawnTmuxPanelForChild` in `coordinator.ts` that calls `tmuxIntegration.getAdapter().onSessionCreated(enrichedEvent)`. The fix targets the **WIRING** of the tmux-multiplexer.

The fix did NOT address: **whether the actual `onSessionCreated` → `spawnPane` chain works in production runtime.** The unit tests at `coordinator.test.ts` mock `tmuxIntegration`, so the mock returns success — but the real `tmuxIntegration.getAdapter().onSessionCreated` may itself be dead-lettered.

### Hypotheses (NEW, in priority order)

| Hypothesis | Evidence for | Evidence against | Test |
|---|---|---|---|
| **H6: `tmuxIntegration.getAdapter()` returns null in production** | The "unwired" branch (silent no-op) is exactly what the S5b test covers. If the production code path is taking this branch, no spawn happens. | Unit test at `coordinator.test.ts:551` only covers the unwired branch; we have NO test for the wired branch producing a real spawn. | Add a smoke test that calls `tmuxIntegration.getAdapter()` in production harness boot and asserts non-null. |
| **H7: `tmux-multiplexer.spawnPane` exists but is itself broken** | The investigation noted SB-1: `session-manager.ts:328-356` `startPolling` never emits `pane-captured`. If `spawnPane` succeeded but `startPolling` was never invoked, the pane exists but is empty/never updated. User reports "no panel" — but "no panel" could mean "panel exists but empty" or "panel never created". | SB-1 was supposed to be addressed in P58.9 R1 (commit `9ba18293`). Verification was via BATS 75, which the verifier said "hangs in this env". So the R1 fix is **unverified in real runtime**. | Run BATS 75 in real runtime, NOT in the env. If it hangs or fails, the R1 fix is also broken. |
| **H8: tmux binary/server not running in user's environment** | The user runs opencode in tmux, so tmux IS available. But the harness's `tmux-multiplexer` may spawn a NEW tmux server, not use the user's existing session. | P58 features claim "in-tree tmux" — no external commands. But "in-tree" might mean "uses external tmux binary". | Run `which tmux` in user's shell. Check if harness's tmux-multiplexer spawns its own server. |
| **H9: `bun-pty` is optional but tmux integration secretly depends on it** | Phase 16.2.1 noted `bun-pty` is optional, falls back to headless. But tmux may need PTY for pane creation. If bun-pty missing, fallback is no-op. | P58 work said it added PULL-side peek that works headless. But the SPAWN side may not. | Check `src/features/tmux/tmux-multiplexer.ts` for PTY usage in `spawnPane`. |
| **H10: The dispatcher takes a different code path in production** | Maybe `delegate-task` doesn't call `DelegationCoordinator.dispatch` in production. Maybe it calls some lower-level SDK wrapper that bypasses the coordinator entirely. | The S5b fix was unit-tested at the coordinator level. If production bypasses the coordinator, the fix never runs. | Add a log/breakpoint in `DelegationCoordinator.dispatch` to see if it's ever called in production UAT. |
| **H11: Pane IS created but in a different tmux server** | User's `tmux opencode` is one session. Harness's `tmux-multiplexer.spawnPane` may create panes in a different tmux server, invisible to the user. | "in-tree tmux" should mean it uses the same tmux server. | Check if harness connects to user's tmux server or spawns its own. |

## Critical realization

**S5b fix passed 34/34 unit tests, typecheck clean, BATS 77 designed — but ZERO of these prove real runtime correctness.** All unit tests use mocks. BATS 77 hangs in the env (per verifier). The actual tmux panel-spawn chain has NEVER been verified end-to-end in a real running tmux opencode session.

This is exactly the kind of "premature done" that `gate-evidence-truth` is supposed to catch. The S5b fix had **L4 evidence** (unit tests + typecheck) but **L0 evidence** (no live runtime proof).

## Relationship to symptoms

| Symptom | Status post-S5b-fix |
|---|---|
| S1 (panel cut-off PULL peek) | Still PULL-side concern, S5b didn't address |
| S2 (no user-actor affordance) | USER_SESSION tier, S5b didn't address |
| S3 (orchestrator stream terminates early) | fire-and-forget, S5b didn't address |
| S4 (no live JIT context) | child-event-stream, S5b didn't address |
| S5 (delegate-task panel-spawn) | **STILL OPEN** — S5b fix insufficient |
| S5b (all delegation methods panel-spawn) | **STILL OPEN** — S5b fix insufficient |
| S5c (this doc) | NEW — S5b fix regression, multiple root-cause hypotheses |

## Severity

**CRITICAL — same as S5.** The S5b fix provided false confidence. Live UAT is the only ground truth, and the fix failed UAT.

## Recommended next step

Stop trying to fix this from afar. The investigation must include **runtime tracing** — what's actually happening when `delegate-task` is called. Specifically:

1. **Boot harness with verbose logging** at the seam points:
   - `src/coordination/delegation/coordinator.ts` `dispatch()` entry
   - `spawnTmuxPanelForChild` entry
   - `tmuxIntegration.getAdapter()` return
   - `tmux-multiplexer.spawnPane` entry
   - `session-manager.startPolling` entry
2. **Run delegate-task in live opencode** with logs tailed
3. **Find the first silent no-op** — that IS the root cause

This is a debug cycle that requires live UAT instrumentation, not code analysis. Recommend: open DEF-S5c-deep-trace as a dedicated phase.

## Out of scope

- All Wave 2/3/4 audit work — blocked until panel-spawn works
- DEF-S5c-native-task (native task tool path) — separate, even after S5c is fixed
- 8-track architectural audit re-dispatch — blocked, same reason
