# UAT S5 — delegate-task → tmux panel spawn FAILS in live main session

**Date:** 2026-06-04
**Tested by:** user live UAT in tmux opencode
**Context:** post-P58.8/P58.9 rebuild with tool-intelligence soft governance + governance-engine `gov-delegate-task-*` rules set to `allow`
**Verdict:** **FAIL** — real runtime bug discovered

---

## Reproduction (multiple attempts, multiple paths)

### Attempt 1 — delegate-task
1. User rebuilt harness after tool-intelligence soft-governance patch (Rule 4: block → warn)
2. User changed `.hivemind/configs.json` `gov-delegate-task-subagent-only` and `gov-delegate-task-depth-block` actions from `block` to `allow`
3. User restarted opencode to load new dist
4. Front-facing hm-l0-orchestrator called `delegate-task` to dispatch `gsd-codebase-mapper` for the 8-track architectural audit
5. **Expected:** a new tmux panel would spawn hosting the sub-session `ses_16ca6a75affeB906LSjYxnnzip`, with live status streaming into the panel
6. **Observed:** no panel spawned. The delegation was dispatched (`executionState: confirmed`, `delegationId: dt-1780588565597-xx6ett`, `recoveryGuarantee: resumable`) and the sub-session was created, but **no tmux panel mapped to `ses_16ca6a75affeB906LSjYxnnzip` ever opened**
7. The sub-agent's `childMessageCount` climbed to 8, `toolCallCount` to 9, `progressPct` 41 — work was happening in OpenCode SDK, but invisibly to the user
8. User aborted after ~2 minutes; delegation cancelled with `terminalKind: cancelled`, `explicitCancellation: true`

### Attempt 2 — native task tool (added 2026-06-04)
9. User re-routed via `task({subagent_type: "gsd-debugger", ...})` to investigate S5 itself
10. **Observed:** SAME FAILURE — task completed (returned `state: completed`) but **no tmux panel ever spawned** for `ses_16c9eb811ffeqDyD9DbTYuTRt7`
11. Sub-agent result was truncated to one line; no investigation output produced
12. **This proves the bug is NOT in delegate-task specifically — it is in panel-spawn itself, regardless of delegation path**

### Scope expansion (2026-06-04)
The bug is **fundamental panel-spawn failure**, not a delegate-task wire issue. ALL delegation methods (delegate-task, execute-slash-command, native task) fail to spawn tmux panels for child sessions.

## Re-scoped root cause hypotheses (post-Attempt 2)

| Hypothesis | Evidence for | Evidence against |
|---|---|---|
| **H1: Panel-spawn hook never registered** — `src/plugin.ts` may not register a hook on session.created / delegation.dispatched that would call `tmux-multiplexer.createPanel` | Attempt 1 + Attempt 2 both fail; suggests no code path exists for any delegation | P58.8/58.9 added PULL-side peek + observer; maybe forgot the PUSH side entirely |
| **H2: tmux-multiplexer.createPanel exists but is never called** — P58.8/58.9 added the API surface but no caller | Same as H1 | Same as H1 |
| **H3: Hook IS registered but fails silently** — exception swallowed, no panel created | The fact that SDK child sessions still run (not abort) suggests a soft-fail path | Would need to check tmux-multiplexer error logs |
| **H4: tmux integration requires bun-pty** but bun-pty is missing in user's Node runtime, so all PTY operations fail silently | P58 features mention bun-pty is optional, falls back to headless. But tmux might depend on PTY which falls back to no-op | User mentioned "tmux phases failed" — could be bun-pty |
| **H5: opencode's own session-attached panel mechanism is what we should be using, not custom tmux-multiplexer** | Custom tmux integration may duplicate or conflict with opencode's built-in | Need to verify what `opencode attach` provides natively |

## Evidence collected

- Delegation record: `delegationId: dt-1780588565597-xx6ett`, `childSessionId: ses_16ca6a75affeB906LSjYxnnzip`, `nestingDepth: 1`
- No audit file at `.planning/debug/audit-2026-06-04/wave-1a-tool-surface-and-sessions.md` — write side of sub-session blocked by some surface failure (or panel never attached so the path to `dist/` write via tmux multiplexer never engaged)
- User observation: "no panel spawn the tmux phases failed"
- Status before cancel: `tools=9, actionCount=10, messageCount=1, progressPct=41` — sub-agent was running, just not visible

## Root cause hypothesis (NOT YET VERIFIED — needs investigation)

The delegate-task → tmux panel spawn path is the integration seam between:
- `src/coordination/delegation/sdk-delegator.ts` (or equivalent — the SDK dispatch path)
- `src/features/tmux/tmux-multiplexer.ts` (panel creation)
- `src/features/tmux/session-manager.ts:328-356` `startPolling` (already known broken per SB-1 P53 journal hook)
- `src/features/tmux/integration/tmux-integration.ts` (or equivalent glue)

P58.8 added `capturePaneContent` (PULL-side peek), P58.9 added `PaneObserver` + `pane-captured` event + sibling `content.txt` + 4 regression guards — all PULL-side or observer-side. **Nothing in P58.8/58.9 wires the PUSH-side "create tmux panel for new sub-session" path.**

This means: when delegate-task creates a child session via SDK, no code path asks tmux-multiplexer to open a panel for `ses_xxxx`. The child runs invisibly.

## Relationship to existing symptoms

| Symptom | Relationship |
|---|---|
| S1 (panel cut-off) | S1 = PULL side fails (can't read from panel). S5 = PUSH side fails (can't even open panel for new sub-session). Both sides of the same gap. |
| S2 (no user-actor affordance) | S2 was the PULL-side USER_SESSION tier; S5 is the PUSH-side missing in the first place. |
| S4 (no live JIT context) | S4 wired child-event-stream for streaming mid-flight progress — but only IF a panel exists. S5 makes S4 moot. |
| SB-1 (P53 journal hook broken) | SB-1 = `startPolling` never emits `pane-captured`. S5 = `startPolling` may never be CALLED because no panel is created in the first place. Causal chain: panel-spawn-fails → startPolling-not-called → pane-captured-never-emitted → P53 journal stays empty. |

## Severity

**CRITICAL.** Without this fix, the user CANNOT observe or steer any delegate-task work. The "advanced tmux integration" the user invested P58.8 + P58.9 into is, in the main-session UAT path, not engaged.

## Proposed next step (NOT YET STARTED)

Spawn a dedicated investigation delegation to:
1. Trace `src/coordination/delegation/sdk-delegator.ts` (or equivalent) → confirm whether it ever calls `tmux-multiplexer.createPanel(sessionId)`
2. Verify the call site (or absence thereof) in `src/features/tmux/integration/`
3. Cross-check with `src/plugin.ts` plugin composition — does plugin.ts register a hook on `session.created` that would open a panel?
4. Identify the exact missing wire (file:line) and propose a fix scope (single module, ~100-200 LOC, with BATS slot 77 covering real-runtime panel-spawn-on-delegate)

Estimate: half-day investigation + half-day fix + half-day BATS slot 77 verification.

## Out of scope (deferred to P59+)

- Multi-main-session parallel (S-edge-1) — depends on having panel-spawn working first
- Cross-session leakage controls (S-edge-2) — same
- Schema unification (status enum) — separate track
- Tool consolidation / removal — separate track
- Progressive disclosure design for delegation-status — separate track
