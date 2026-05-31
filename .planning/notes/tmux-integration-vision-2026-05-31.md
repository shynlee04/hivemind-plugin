---
title: "Tmux Integration Vision — Co-Pilot Orchestration Model"
date: 2026-05-31
context: Exploration session on Tmux integration into Hivemind/OpenCode
source: hm-explore session
---

## Vision

Tmux as a **human-in-the-loop orchestration layer** for Hivemind delegation. Three capabilities:

1. **Persistence** — subagent sessions survive parent process death (OS-level)
2. **Visual monitoring** — Tmux panes showing live subagent output in real-time
3. **Interactive control** — human prompts orchestrator to steer sessions via Tmux

## The Co-Pilot Model

```
Human → sees Tmux panes → prompts Orchestrator → Orchestrator uses Tmux → Subagent receives intervention
```

Not direct Tmux manipulation. Orchestrated visibility + orchestrated control.

## What This Overcomes

Current limitations of `task` and `delegate-task`:
- **Opacity** — human can't see what's happening inside delegated sessions
- **No intervention** — once delegated, human is a passenger
- **No visual feedback** — completion is binary, not progressive

## Research-Backed Capabilities

| Capability | Tmux Feature | Reference |
|------------|--------------|-----------|
| Output inspection | `capture-pane -p` | OMO, Hermes |
| Keystroke injection | `send-keys` | OMO OpenClaw, Hermes |
| Continuous streaming | `pipe-pane` to log files | Tmux core |
| Session survival | OS-level detach/reattach | Tmux core |
| Agent identification | `@batty_role` user variables | Community pattern |
| Pane grid planning | Auto-calculation of split layout | OMO |

## Reference Implementations

- **OMO** — Query-Decide-Execute-Update loop with Tmux as source of truth
- **Hermes** — Interactive PTY spawning with `--resume`/`--continue`
- **opencode-pty** — Ring buffer pattern with `notifyOnExit` (no polling)

## Open Questions

- How to wire Tmux into OpenCode's delegation system without breaking CQRS boundaries?
- Should Tmux be optional (graceful fallback when Tmux unavailable)?
- What's the minimal viable integration? (Just monitoring? Or full control plane?)
