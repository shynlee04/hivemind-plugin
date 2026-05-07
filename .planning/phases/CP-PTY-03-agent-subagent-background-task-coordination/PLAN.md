---
phase: CP-PTY-03-agent-subagent-background-task-coordination
status: not_planned
created: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred
depends_on:
  - CP-PTY-02-sdk-session-delegation-integration
  - BOOT-08-agent-skill-integration
allowed_surfaces_when_authorized:
  - src/lib/delegation-manager.ts
  - src/lib/completion-detector.ts
  - src/lib/lifecycle-manager.ts
  - src/lib/notification-handler.ts
  - src/lib/concurrency.ts
  - src/hooks/**
  - tests/**
---

# CP-PTY-03 Agent/Subagent Background Task Coordination

## Goal

Implement lifecycle-aware coordination between agents, subagents, and background tasks — covering wave-based dispatch, completion-looping guardrails, queue management, and multi-session orchestration patterns that integrate with the delegation manager and concurrency model.

## Rationale

CP-PTY-01 (command-process) and CP-PTY-02 (SDK session delegation) establish the primitives. This phase builds the coordination layer: how agents dispatch subagents in waves, how background tasks participate in completion detection, how queue-key validation prevents duplicate work, and how lifecycle events propagate across parent-child delegation chains. This is the "autonomous loop" substrate.

## High-Level Acceptance Criteria

- Wave-based subagent dispatch: parent agent can dispatch N child tasks in parallel, collect results, and iterate.
- Completion-looping guardrails: delegation completion detection integrated with agent workflows (notification-first, polling fallback, explicit terminal signal).
- Queue-key validation: prevent duplicate background task dispatch for the same logical work unit.
- Lifecycle event propagation: parent abort/timeout cascades to child sessions; child completion signals parent.
- Concurrency control: keyed semaphore integration with delegation dispatch (FIFO queue per key).
- Session recovery: interrupted delegation chains detect stale state and surface honest recovery status.
- Integration with `WaiterModel` dual-signal completion.
- Tests for wave dispatch, completion detection, queue dedup, cascade cleanup, recovery detection.

## Research Sources

- Existing `completion-detector.ts` (two-signal completion)
- Existing `concurrency.ts` (keyed semaphore FIFO)
- Existing `lifecycle-manager.ts` (session lifecycle state machine)
- `oh-my-openagent` notification-first task model
- Hivemind `hm-l2-coordinating-loop` and `hm-l2-completion-looping` skills (coordination patterns)

## Dependencies

- CP-PTY-02: SDK session delegation must exist before building coordination on top.
- BOOT-08: agent hierarchy and routing contracts.

## Out Of Scope

- Cross-cutting integration with task/session management APIs (CP-PTY-04).
- Sidecar/tmux projection (SC-PTY-01).
- Command-process delegation (CP-PTY-01).
