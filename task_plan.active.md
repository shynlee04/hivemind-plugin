# Task Plan Active

## Goal
Land Phase 1 of the stress-cert architecture pack in additive, test-driven slices so a fresh session can trust the repo without re-scanning and the system can grow toward the stress matrix in `docs/testing/STRESS-TEST.md`.

## Phase 1 Posture
- Chosen posture: `SDK supervisor control + plugin enforcement kernel + tool-only durable mutation`.
- Current truth: entry/runtime/turn lifecycle seams already exist in `src/shared/`, but the supervisor layer, schema kernel authority, zero-trust delegation receipts, freshness registry, and deadlock/watchdog model are not yet implemented as first-class sectors.
- Delivery rule: rewrite rolling docs first, then add Phase 1 slices under TDD so the docs stay behind or equal to reality, never ahead of it.

## Workstream Order
1. `Schema kernel foundation`
   - Create `src/schema-kernel/` as the contract authority for Phase 1 records.
   - Start with additive schema definitions plus validation/helpers for:
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
2. `SDK supervisor skeleton`
   - Create `src/sdk-supervisor/` with:
     - instance manager boundary
     - session/workflow registry boundary
     - health model
     - event mirror contract
   - Keep this slice additive and non-authoritative until status/reporting uses it.
3. `Plugin enforcement kernel tightening`
   - Move hook guidance from “observation only” to the explicit Phase 1 enforcement charter:
     - `permission.ask`
     - `tool.execute.before`
     - `tool.execute.after`
     - `command.execute.before`
     - `chat.message`
     - `experimental.chat.system.transform`
     - `experimental.chat.messages.transform`
     - `event`
   - Strip any durable writes from hooks that still exist.
4. `Runtime mutation pack hardening`
   - Extend runtime/task/trajectory/handoff outputs with deterministic verification metadata.
   - Thread `context.abort` through all async tool paths.
5. `Concurrency, freshness, and recovery`
   - Add workflow graph/waves, session leases, stale-artifact checks, deadlock checkpoints, and replay envelopes.
6. `Status, harness, and certification`
   - Extend `hivemind_runtime_status` and harness reporting to show supervisor + kernel health.
   - Add stress-critical test coverage.
7. `Final doc reconciliation`
   - Update rolling docs only after code/tests for the slice are green.

## Current Slice
- [complete] Replace the stale lifecycle-spine-only root narrative with a truthful Phase 1 stress-cert baseline.
- [complete] Add the first additive schema-kernel slice under TDD.
- [complete] Scaffold the SDK supervisor sector with instance registry and health seams.
- [in_progress] Wire supervisor and schema-kernel seams into status/reporting and runtime enforcement paths.
  - [complete] Step 1 runtime integration: `hivemind_runtime_status` now emits schema-kernel-backed entry/runtime invocation/session/freshness records plus supervisor registry/health evidence through `src/sdk-supervisor/runtime-status.ts` under TDD.
  - [pending] Step 2 zero-trust delegation receipt verification in plugin/runtime enforcement.
  - [pending] Step 3 supervisor session/workflow/event registry expansion and control-plane wiring.
- [pending] Tighten plugin enforcement and zero-trust delegation verification.
- [pending] Add concurrency/freshness/deadlock/replay evidence models.
- [pending] Run full repo verification and update rolling artifacts with fresh evidence.

## File Ownership
- Root planning artifacts:
  - `MASTER.active.md`
  - `task_plan.active.md`
  - `progress.active.md`
- Stable authority doc:
  - `docs/architecture/stress-cert-sdk-control-architecture.md`
- Governance updates for this phase:
  - `AGENTS.md`
  - `src/AGENTS.md`
  - `src/plugin/AGENTS.md`
  - `src/hooks/AGENTS.md`
  - `src/control-plane/AGENTS.md`
  - `src/tools/AGENTS.md`
- Phase 1 implementation sectors:
  - `src/schema-kernel/**`
  - `src/sdk-supervisor/**`
  - `src/plugin/**`
  - `src/hooks/**`
  - `src/tools/runtime/**`
  - `src/control-plane/**`
  - `tests/**`

## Red-Green Discipline
1. Write a failing test for the next Phase 1 seam.
2. Run the smallest possible targeted test command and confirm the failure is the intended one.
3. Implement the minimum additive code to pass.
4. Re-run the targeted test.
5. Only then widen verification.

## Verification Commands
- Slice-first:
  - `npx tsx --test tests/schema-kernel-contracts.test.ts`
  - `npx tsx --test tests/sdk-supervisor-instance.test.ts`
  - `npx tsx --test tests/plugin-runtime.test.ts tests/runtime-turn-output.test.ts tests/control-plane-runtime-tools.test.ts`
- Repo gates:
  - `bash scripts/check-agent-registry-parity.sh`
  - `npx tsc --noEmit`
  - `npm test`
  - `npm run build`

## Hard Out Of Scope
- No package split in Phase 1.
- No AST/code-intel expansion.
- No new end-user feature family beyond stress-cert requirements.
- No hook-owned durable state writes.
- No large file or type monoliths.
- No public package export reshuffle.

## Atomic Commit Order
1. `docs: reset phase-1 architecture artifacts`
2. `test: add schema-kernel phase-1 contract coverage`
3. `feat: scaffold schema-kernel contracts`
4. `feat: scaffold sdk-supervisor boundaries`
5. `feat: harden kernel enforcement and abort-aware runtime paths`
6. `feat: add freshness deadlock and replay evidence`
7. `test: add stress-cert supervisor kernel coverage`

## Exit Criteria For Phase 1
- All P0 stress blockers addressed by code + tests.
- Runtime status reports supervisor + kernel health together.
- Restart recovery and concurrent session isolation are proven by tests.
- Rolling docs and sector charters match implemented behavior.

## Fresh Evidence
- `tests/schema-kernel-contracts.test.ts` is green.
- `tests/sdk-supervisor-instance.test.ts` is green.
- `tests/runtime-tools.test.ts` is green with kernel/supervisor runtime-status assertions.
- `tests/control-plane-runtime-tools.test.ts` is green with degraded bootstrap/runtime-status assertions.
- Step 1 exit gate is satisfied: runtime status now reports supervisor + kernel evidence together.
- `npx tsc --noEmit` is green.
- `npm test` is green with `144` passing tests.
- `npx tsx --test` still includes unrelated pre-existing failures outside the npm test scope (`tests/code-intel/hivemind-codemap.test.ts` and HF-HARDEN red suites).
