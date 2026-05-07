---
phase: SC-PTY-01-read-only-terminal-projection
status: deferred
created: 2026-05-08
depends_on:
  - CP-PTY-01-background-shell-control-plane-mvp
  - Q2 sidecar decision confirmation
evidence_level_required: L2-L3
---

# SC-PTY-01 Read-Only Terminal Projection Plan Skeleton

## Goal

Expose shell/PTY progress to a sidecar or tmux-style projection without giving that projection mutation authority over canonical state or delegation control.

## Boundary

This phase is read-model only. It must not write `.hivemind/` canonical state, dispatch tasks, terminate commands, or change delegation lifecycle.

## Acceptance Criteria

- Projection source is bounded and permission-safe.
- Sidecar/tmux channel is optional and capability-detected.
- Canonical state remains owned by Hivemind runtime tools/modules.
- Projection cannot become a hidden delegation controller.
