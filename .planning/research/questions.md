# Open Research Questions

## Tmux Implementation Details

**Date:** 2026-05-31
**Source:** hm-explore session on Tmux integration
**Priority:** High

### Questions

1. **Wiring Tmux into OpenCode's delegation system** — How to integrate Tmux session management with OpenCode's `task` and `delegate-task` tools without breaking CQRS boundaries? Should Tmux be a new tool, a hook, or an extension of existing delegation?

2. **Pane management API** — What abstraction layer is needed to manage Tmux panes from within an OpenCode agent? How to map delegation hierarchy to pane layout?

3. **Output capture streaming** — How to stream Tmux pane output to the orchestrator in real-time without polling? Can `pipe-pane` + WebSocket work, or is `notifyOnExit` pattern sufficient?

4. **Keystroke injection from orchestrator** — How to send commands to a specific Tmux pane from within an agent? What's the security model for preventing unintended interventions?

5. **Context preservation across Tmux sessions** — How to ensure Hivemind's continuity store stays in sync with Tmux session state? What happens when a Tmux session is detached and reattached?

6. **Graceful fallback** — How to degrade when Tmux is not available (e.g., Windows, containerized environments)? Should the system refuse to work or fall back to headless delegation?

7. **Minimal viable integration** — What's the smallest useful Tmux integration? Just monitoring (capture-pane + display)? Or full control plane (monitoring + intervention + persistence)?

### Related Artifacts

- `.planning/notes/tmux-integration-vision-2026-05-31.md`
- `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md`
- `.planning/research/shell-pty-control-plane-research-2026-05-08.md`
- `.planning/research/external-repo-survey-pty-background-delegation-2026-05-18.md`
