---
artifact_group: research
phase: CP-PTY-00-shell-pty-control-plane-spike
created: 2026-05-08
evidence_level: L5
---

# Shell / PTY Control-Plane Research Synthesis

This artifact mirrors the phase-local research and makes it discoverable from `.planning/research/`.

## Recommendation

Use a spike-first path. Adapt patterns from `opencode-pty`, `oh-my-openagent`, OpenCode platform docs, and `just-bash`, but do not implement runtime behavior inside BOOT-02.

## Sources

- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/server/
- https://github.com/shekohex/opencode-pty
- https://github.com/code-yeongyu/oh-my-openagent
- https://github.com/vercel-labs/just-bash

## Result

The architecture runway is ready for CP-PTY-00. Runtime implementation remains blocked until CP-PTY-01 is authorized.
