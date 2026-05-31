---
title: "Fork opencode-tmux and Audit Codebase"
date: 2026-05-31
priority: high
status: pending
source: hm-explore session
context: First concrete step for Tmux integration
---

## Task

Fork `opencode-tmux` repository and audit its codebase to understand:
1. How it listens for OpenCode session events
2. How it creates Tmux panes with `opencode attach`
3. What configuration it requires (port, server URL)
4. Code quality and test coverage
5. What needs to change for Hivemind integration

## Acceptance Criteria

- [ ] Fork created under Hivemind organization/account
- [ ] Codebase read and understood (architecture diagram if complex)
- [ ] List of Hivemind-specific modifications documented
- [ ] Integration points with session-tracker identified
- [ ] Fallback strategy defined (no-Tmux environment)

## Dependencies

- OpenCode server mode with `--port` must work
- Hivemind session-tracker must be stable

## Output

- Forked repository
- Audit document: `.planning/notes/tmux-fork-audit-{date}.md`
- Modification plan: list of changes needed
