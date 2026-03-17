# Phase 1 Stress-Cert Architecture Charter

## Summary
- Objective: replace the fragmentary lifecycle-first slice with a whole-project Phase 1 architecture pack that a fresh session can trust without re-scanning and that can grow toward the stress matrix in `docs/testing/STRESS-TEST.md`.
- Chosen posture: `SDK-centric supervisor control with same-local-env OpenCode server/client instances`, paired with a mandatory `plugin enforcement kernel` inside the controlled runtime.
- Phase 1 scope: one additive architecture pack across contracts, orchestration boundaries, enforcement hooks, mutation tools, recovery evidence, concurrency safety, and certification coverage.
- Stable authority doc: `docs/architecture/stress-cert-sdk-control-architecture.md`.

## Why This Posture
1. `SDK supervisor control`
   - Best fit for session creation, scheduling, dependency blocking, restart recovery, SSE observation, and concurrency supervision.
2. `Plugin enforcement kernel`
   - Required because pure external orchestration cannot replace plugin-native interception points like `permission.ask`, `tool.execute.before`, `tool.execute.after`, `shell.env`, and prompt/context transforms.
3. `Tool-only durable mutation`
   - Preserves the repo’s CQRS rule and keeps durable state changes traceable.

The best path is the hybrid supervisor-plus-kernel model because the repo already has strong in-band enforcement seams but still lacks an out-of-band authority for workflow/session orchestration. A supervisor-only design would leave plugin-native governance weak, while a plugin-only design would keep lifecycle orchestration trapped inside prompt-adjacent code and large handlers.

The rejected alternatives stay rejected for concrete reasons. `Single-kernel only` is too weak for restart supervision, concurrent session leasing, deadlock handling, and event-driven workflow scheduling. `Pure external SDK orchestration` cannot own in-band governance and delegated-result enforcement, which are central to the stress-cert requirements.

## Layer Map
1. `SDK Supervisor Control Layer`
   - Target sector: `src/sdk-supervisor/`
   - Owns instance management, session registry, workflow scheduling, dependency blocking, wave planning, deadlock/watchdog supervision, freshness monitoring, restart recovery orchestration, and event mirroring.
2. `Plugin Enforcement Kernel`
   - Existing sectors: `src/plugin/`, `src/hooks/`
   - Owns in-band governance, route/phase injection, delegated-result interception, compaction anchors, and runtime command bridging.
3. `Tool Mutation Pack`
   - Existing sector: `src/tools/`
   - Owns all durable writes and user-visible state transitions.
4. `Core Domain Engines`
   - Existing sectors: `src/core/`, `src/delegation/`, `src/recovery/`, `src/governance/`
   - Own pure workflow, trajectory, delegation, recovery, and planning logic.
5. `Schema Kernel`
   - Target sector: `src/schema-kernel/`
   - Owns the contract family for Phase 1 persisted and cross-session records.
6. `CLI And Command Bridge`
   - Existing sectors: `src/cli/`, `src/commands/`, `src/control-plane/`
   - Stay thin over supervisor-issued work and runtime-command execution.

## Truthful Baseline
- Already real:
  - entry lifecycle authority in `src/shared/entry-kernel-state.ts`
  - runtime invocation authority in `src/shared/runtime-invocation.ts`
  - turn-output authority in `src/shared/turn-output.ts`
  - plugin enforcement surfaces registered in `src/plugin/opencode-plugin.ts`
  - additive schema authority in `src/schema-kernel/`
  - additive supervisor instance/health seams in `src/sdk-supervisor/`
- Not yet real:
  - workflow waves/dependency graph contracts
  - session leases
  - freshness registry
  - deadlock/watchdog model
  - replay envelope authority
  - status output for supervisor/freshness/watchdog health

## Non-Negotiable Rules
- All user entry must eventually resolve through the supervisor authority.
- All durable mutations go through runtime tools.
- Hooks stay read/inject/intercept only.
- All delegated returns must pass kernel verification before parent continuation.
- All async tool and delegation paths must honor `context.abort`.
- All artifacts and receipts must carry timestamps and deterministic verification inputs.
- Parallel work is allowed only when dependency and writable-surface analysis proves safety.
- Restart recovery must rebuild from stored contracts and checkpoints, never prompt memory alone.
- Public package exports stay stable: `"."` and `"./plugin"`.

## Phase 1 Contract Family
- `EntryKernelStateV1`
- `RuntimeInvocationV1`
- `TurnOutputEnvelopeV1`
- `SupervisorInstanceRegistryV1`
- `SessionRegistryV1`
- `WorkflowExecutionGraphV1`
- `WorkflowWaveStateV1`
- `WorkflowGuardStateV1`
- `DelegationReceiptV1`
- `ArtifactFreshnessRegistryV1`
- `DeadlockCheckpointV1`
- `RecoveryReplayEnvelopeV1`

## Implementation Sequence
1. Create `src/schema-kernel/` and make the contract family machine-authoritative.
2. Create `src/sdk-supervisor/` with instance/session/workflow/event/health scaffolding.
3. Refactor CLI/control-plane orchestration toward supervisor-owned decisions.
4. Strip durable writes out of hooks.
5. Add zero-trust delegated-result verification.
6. Add abort-aware runtime operations, dependency graphs, waves, and leases.
7. Add freshness, deadlock, and replay evidence.
8. Extend status/harness reporting.
9. Add stress-cert coverage.
10. Reconcile docs last for each slice.

## Stress-Cert Exit Gates
- All P0 stress blockers green.
- `hivemind_runtime_status` reports supervisor + kernel health.
- Restart recovery proven by tests.
- Concurrent session isolation proven by tests.
- Delegated return verification proven by tests.
- Freshness and deadlock behavior proven by tests.

## Rejected Alternatives
- `Single-kernel only`
  - Rejected because orchestration, concurrency, restart supervision, and watchdog behavior need an out-of-band authority.
- `Pure external SDK orchestration`
  - Rejected because plugin-native enforcement hooks are required for hard governance.
- `Package split in Phase 1`
  - Rejected because it would spread unresolved authority boundaries across more surfaces before the contracts are stable.

## Current Authorization Boundary
- This branch is executing Phase 1 in additive bounded slices.
- The current active slice is `status/reporting and runtime enforcement wiring`.
- Next root doc changes must stay tied to tested implementation progress, not speculative future state.
