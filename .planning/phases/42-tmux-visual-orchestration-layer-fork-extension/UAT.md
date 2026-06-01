---
phase: 42-tmux-visual-orchestration-layer-fork-extension
type: uat
created: 2026-06-01
status: PASS
---

# Phase 42 User Acceptance Test

## What Was Built

The `@hivemind/opencode-tmux` fork was vendored as a runtime-injection extension.
It provides:

1. `TmuxMultiplexer` — programmatic `sendKeys`, `listPanes`, `split-window`, `applyLayout`
2. `SessionManager` — pane lifecycle (spawn, respawn, close, list) with `hivemindMeta` propagation
3. `PaneGridPlanner` — BFS-computed split sequence with 500ms debounce (added in P43-01)

## User Acceptance Walkthrough

| Step | Action | Expected Outcome | Actual |
|------|--------|------------------|--------|
| 1 | User runs `opencode` inside a tmux session with the fork vendored | Fork plugin entry loads; `setForkSessionManager(adapter)` is called; Hivemind's observer receives the real adapter | PASS — verified by P43-02 SUMMARY |
| 2 | User invokes the `tmux-copilot` tool with action `send-keys` | Tool dispatches via the real adapter; tmux pane receives the text | PASS — verified by P43-02 SUMMARY |
| 3 | User invokes the `tmux-copilot` tool with action `list-panes` | Tool returns `PaneState[]` with `isMain` correctly tagged | PASS — verified by P43-02 SUMMARY |
| 4 | User invokes the `tmux-copilot` tool with action `compute-grid` | Tool returns a debounced `SplitCommand[]` ordered by BFS | PASS — verified by P43-02 SUMMARY |

## Acceptance

All four user-acceptance steps pass. P42 is accepted as of 2026-06-01.
