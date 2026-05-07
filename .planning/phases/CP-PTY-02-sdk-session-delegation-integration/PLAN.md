---
phase: CP-PTY-02-sdk-session-delegation-integration
status: not_planned
created: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred
depends_on:
  - CP-PTY-01-background-shell-control-plane-mvp
  - BOOT-08-agent-skill-integration
allowed_surfaces_when_authorized:
  - src/lib/delegation-manager.ts
  - src/lib/session-api.ts
  - src/lib/delegation-persistence.ts
  - src/tools/delegate-task.ts
  - src/tools/delegation-status.ts
  - src/hooks/**
  - tests/**
---

# CP-PTY-02 SDK Session Delegation Integration

## Goal

Wire OpenCode SDK child-session delegation APIs into the Hivemind delegation manager, enabling async/sync dispatch of child sessions with context injection, response harvesting, and delegation status tracking — separate from command-process delegation.

## Rationale

CP-PTY-01 covers command-process delegation (PTY/headless). This phase addresses the SDK child-session lane: using OpenCode's session/message APIs to dispatch work to child sessions, inject context, retrieve responses, and track delegation lifecycle. This is the primary lane for agent-to-agent delegation and must integrate with the existing `DelegationManager`, `WaiterModel`, and dual-signal completion.

## High-Level Acceptance Criteria

- SDK child-session dispatch via `session.create` / `session.message` / `session.prompt` APIs wired into `DelegationManager`.
- Async dispatch returns delegation ID immediately; sync dispatch blocks for completion signal.
- Context injection into child sessions (system prompt, file references, task boundary).
- Response harvesting: child session output captured and surfaced via delegation-status tool.
- Dual-signal completion: notification-first + status polling as fallback.
- Delegation persistence: child-session delegation records survive continuity save/restore.
- Permission gates: child-session dispatch respects agent hierarchy and tool permissions.
- Tests for async dispatch, sync dispatch, context injection, completion detection, persistence.

## Research Sources

- OpenCode SDK session APIs (`session.create`, `session.message`, `session.prompt`, `session.list`)
- OpenCode plugin docs: tool registration, hook composition
- `oh-my-openagent` background child-session manager patterns
- Existing `DelegationManager` + `WaiterModel` in `src/lib/delegation-manager.ts`
- Existing `session-api.ts` wrappers

## Dependencies

- CP-PTY-01: command-process delegation must be stable before SDK session delegation.
- BOOT-08: agent/skill integration constitution defines hierarchy and permission contracts.

## Out Of Scope

- Sidecar/tmux projection (SC-PTY-01).
- Cross-cutting integration with task/session management (CP-PTY-04).
- Agent/subagent coordination loops (CP-PTY-03).
