---
title: "Tmux Visual Orchestration Layer"
planted_date: 2026-05-31
trigger_condition: "When delegation opacity becomes a blocking issue for multi-subagent workflows"
status: planted
source: hm-explore session
---

## Idea

Integrate Tmux as a visual orchestration layer into Hivemind's delegation system, enabling:

1. **Live pane monitoring** — human sees subagent output in real-time
2. **Orchestrated intervention** — human prompts orchestrator to steer sessions
3. **Session persistence** — subagent sessions survive parent death
4. **Visual dependency graph** — pane layout reflects delegation hierarchy

## Trigger Conditions

- Multi-subagent workflows become common and opacity blocks progress
- User reports frustration with "black box" delegation
- Background command feature matures enough to warrant visual layer
- OMO/Tmux patterns prove stable in production

## Dependencies

- Current delegation system (`task`, `delegate-task`) must be stable
- Background command execution must be implemented first
- PTY integration (bun-pty) must be mature

## Success Criteria

- Human can see all active subagent sessions in Tmux panes
- Human can prompt orchestrator to intervene in specific sessions
- Sessions survive parent process restart
- Orchestrator can query Tmux state for delegation decisions

## Risks

- Tmux dependency may not be available in all environments
- Visual complexity may overwhelm non-technical users
- Performance overhead of continuous pane monitoring
