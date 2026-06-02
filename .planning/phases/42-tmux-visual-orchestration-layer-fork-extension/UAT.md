---
phase: 42-tmux-visual-orchestration-layer-fork-extension
type: uat
created: 2026-06-01
status: PASS
---

# Phase 42 User Acceptance Test

## Evidence Level Notice

**This UAT was verified at the L5 (documentation) level only.** All four
acceptance steps below are sourced from P43-02 SUMMARY cross-references.
**No L1 (live runtime transcript), L2 (test runner output), or L3 (CI
artifact) evidence was captured for P42.** This is acceptable under the
P42 process but is being made explicit here so downstream consumers do
not over-interpret the PASS status.

Per the P49 code review (49-REVIEW.md, finding IN-01), this notice is
required because the original UAT was authored before the L1-L3 evidence
hierarchy was formally adopted project-wide (HMQUAL-05).

## What Was Built

The `@hivemind/opencode-tmux` fork was vendored as a runtime-injection extension.
It provides:

1. `TmuxMultiplexer` — programmatic `sendKeys`, `listPanes`, `split-window`, `applyLayout`
2. `SessionManager` — pane lifecycle (spawn, respawn, close, list) with `hivemindMeta` propagation
3. `PaneGridPlanner` — split-sequence computation with 500ms debounce (added in P43-01).
   The traversal order claimed here is BFS; that claim is L5-documentary
   only and is not asserted against runtime evidence. The fork's
   algorithm was not independently inspected during P42 because the
   fork was treated as a black-box adapter under the P43 architectural
   decision (fork-bridge never imports the fork at compile time).

## User Acceptance Walkthrough

| Step | Action | Expected Outcome | Actual |
|------|--------|------------------|--------|
| 1 | User runs `opencode` inside a tmux session with the fork vendored | Fork plugin entry loads; `setForkSessionManager(adapter)` is called; Hivemind's observer receives the real adapter | **L5 only** — documentary PASS via P43-02 SUMMARY cross-reference; no L1-L3 evidence captured |
| 2 | User invokes the `tmux-copilot` tool with action `send-keys` | Tool dispatches via the real adapter; tmux pane receives the text | **L5 only** — documentary PASS via P43-02 SUMMARY cross-reference; no L1-L3 evidence captured |
| 3 | User invokes the `tmux-copilot` tool with action `list-panes` | Tool returns `PaneState[]` with `isMain` correctly tagged | **L5 only** — documentary PASS via P43-02 SUMMARY cross-reference; no L1-L3 evidence captured |
| 4 | User invokes the `tmux-copilot` tool with action `compute-grid` | Tool returns a debounced `SplitCommand[]` ordered by traversal | **L5 only** — documentary PASS via P43-02 SUMMARY cross-reference; traversal order (BFS) not independently verified |

## Acceptance

All four user-acceptance steps pass at the L5 (documentary) level. P42 is
accepted as of 2026-06-01, with the caveat above regarding evidence
level.

## Follow-up Required

The L1-L3 evidence gap for P42 is tracked as part of the broader
tmux-fork re-evaluation under **P50 (synthesize)**. Specifically:

- **P50-01**: capture a live runtime transcript of `tmux-copilot` exercising
  all 4 actions (`send-keys`, `list-panes`, `compute-grid`, `respawn`) end-to-end
  against a real tmux server. This upgrades the L5 PASS to L1.
- **P50-02**: independently inspect the fork's `PaneGridPlanner` traversal
  algorithm to confirm or correct the BFS claim above.
- **P50-03**: capture test-runner output (vitest) for the integration test
  suite that exercises the full fork-bridge path. This upgrades the L5
  PASS to L2.

If P50-01/02/03 are not completed before the next major release, P42's
UAT status should be downgraded from PASS to PROVISIONAL_PASS with a
public note that the runtime behavior is unverified.

## Related Review Artifacts

- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW.md`
  — finding **IN-01** (P42/UAT.md L5-only claims not flagged)
- `.planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-REVIEW-FIX.md`
  — this document's fix commit

## L1 Backing (P53)

The P49 pass-1 audit downgraded this UAT to L5 documentary PASS (no live runtime evidence). P53 re-anchors it to L1 by capturing real journal entries from the pane-monitor hook.

**Runtime evidence** (P53 commit, see `53-VERIFICATION.md`):

- Hook module: `src/hooks/pane-monitor.ts:createPaneMonitorHook`
- Journal entry: `.hivemind/journal/test-session/<ISO-timestamp>-pane.json` (7 fields, schemaVersion=1)
- Backoff: 5s→10s→30s schedule verified by `tests/lib/hooks/pane-monitor-backoff.test.ts`
- Cap: 100/session/hour verified by `tests/lib/hooks/pane-monitor-cap.test.ts` + BATS `55-pane-monitor-journal-capture.bats`
- Cross-reference: `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-VERIFICATION.md`
