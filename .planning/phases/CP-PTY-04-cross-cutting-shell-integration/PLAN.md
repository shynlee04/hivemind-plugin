---
phase: CP-PTY-04-cross-cutting-shell-integration
status: not_planned
created: 2026-05-08
evidence_level_required: L2-L3 minimum, L1 preferred
depends_on:
  - CP-PTY-03-agent-subagent-background-task-coordination
  - MCM-03-config-plane-integration
allowed_surfaces_when_authorized:
  - src/tools/run-background-command.ts
  - src/tools/delegate-task.ts
  - src/tools/delegation-status.ts
  - src/tools/session-patch/**
  - src/lib/delegation-manager.ts
  - src/lib/session-api.ts
  - src/lib/runtime.ts
  - src/lib/runtime-policy.ts
  - src/hooks/**
  - src/plugin.ts
  - tests/**
---

# CP-PTY-04 Cross-Cutting Shell Integration

## Goal

Wire background shell/PTY/session delegation capabilities into the full Hivemind control plane — integrating with session management, task management, agent workflow routing, permission propagation, hook composition, and the plugin lifecycle. This is the "everything connects" phase.

## Rationale

CP-PTY-01 through CP-PTY-03 build the primitives and coordination layers. This phase handles the cross-cutting integration: how background commands surface in session context, how delegation records participate in trajectory/journal, how permissions propagate through the agent hierarchy to command execution, how hooks observe and guard background operations, and how the plugin lifecycle manages cleanup.

## High-Level Acceptance Criteria

- Background command output integrated into session context (bounded, non-flooding).
- Delegation records appear in session journal and trajectory ledger.
- Permission propagation: agent hierarchy → tool permissions → command execution policy.
- Hook composition: `PreToolUse`/`PostToolUse` guards apply to background command tools.
- Runtime policy: `runtime-policy.ts` resolves background command permissions per agent depth.
- Session patch: background command results patchable into session state via `session-patch` tool.
- Plugin lifecycle: cleanup on plugin unload, session end, and runtime restart.
- Integration with config plane: `delegation_systems` config field wired to delegation behavior.
- Tests for context integration, journal recording, permission propagation, hook guards, lifecycle cleanup.

## Research Sources

- Existing `run-background-command` tool and hook wiring
- Existing `runtime.ts` (event→status mapping)
- Existing `runtime-policy.ts` (trusted runtime policy)
- Plugin lifecycle in `plugin.ts`
- Config schema: `delegation_systems` field
- Session journal and trajectory ledger

## Dependencies

- CP-PTY-03: coordination layer must exist before cross-cutting integration.
- MCM-03: config plane integration ensures `delegation_systems` has a consumer.

## Out Of Scope

- Sidecar/tmux projection (SC-PTY-01) — separate read-model phase.
- New tool creation — this phase wires existing tools, not new ones.
