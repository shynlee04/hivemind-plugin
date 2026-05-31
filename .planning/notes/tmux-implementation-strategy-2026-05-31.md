---
title: "Tmux Implementation Strategy — Fork and Extend"
date: 2026-05-31
context: Follow-up exploration on Tmux integration architecture
source: hm-explore session
---

## Decision: Fork and Extend opencode-tmux

Do not wrap (dependency risk) or replace (reinvent basics). Fork `opencode-tmux` and extend with Hivemind-specific features.

## Why Fork

1. `opencode-tmux` solved the hard part — `session.created` listener + `opencode attach` in Tmux pane
2. Small codebase (~200 LOC) — easy to own and modify
3. Hivemind needs custom features anyway: orchestration layer, pane planning, keystroke injection

## What opencode-tmux Provides (Take)

- Session event listener (`session.created`)
- Pane creation with `opencode attach <serverUrl> --session <id>`
- Basic session-to-pane mapping

## What Hivemind Adds (Extend)

1. **Session-tracker integration** — Map Tmux panes to Hivemind's delegation hierarchy, not just OpenCode sessions
2. **Orchestrator hooks** — Human → orchestrator → Tmux → subagent control flow
3. **Pane grid planning** — Automatic layout calculation (like OMO)
4. **Keystroke injection** — Orchestrator sends commands to specific panes via `send-keys`
5. **Graceful fallback** — Headless delegation when Tmux unavailable
6. **Context preservation** — Continuity store syncs with Tmux session state

## Architectural Constraint

OpenCode must run as a server with `--port` for `opencode attach` to work. This is a hard requirement.

## CQRS Integration Points

| Layer | Role | Tmux Integration |
|-------|------|------------------|
| Tools (write-side) | State mutation | New tool: `tmux-pane-manage` (spawn, kill, inject) |
| Hooks (read-side) | Context injection | Hook: `session.created` → open Tmux pane |
| Plugin (assembly) | Wiring | Compose Tmux hooks + tools into plugin |

## Reference

- `opencode-tmux`: https://github.com/FloSchl8/opencode-tmux
- OMO TmuxSessionManager: Query-Decide-Execute-Update loop
- Research: `.planning/research/questions.md`
