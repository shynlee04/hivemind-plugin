---
artifact_group: spec
phase: CP-PTY-00-shell-pty-control-plane-spike
created: 2026-05-08
evidence_level: L5
---

# Shell / PTY Control-Plane Spec Index

Canonical phase spec: `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/SPEC-2026-05-08.md`.

## Contract Summary

- SDK delegation and command-process delegation are separate lanes.
- PTY and tmux are optional capability adapters.
- Output reads must be bounded.
- Permission gates must run before spawn.
- Restart semantics must be honest: command processes are non-resumable after parent runtime restart.
- Sidecar/tmux projection is read-only until a future phase explicitly changes that boundary.
