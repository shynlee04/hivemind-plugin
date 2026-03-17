# Progress Active

## 2026-03-17

### Current Gate
- Phase 1 is not complete.
- The repo now has additive `src/schema-kernel/` and `src/sdk-supervisor/` sectors, and the first live runtime-status wiring is now green under TDD.
- The root rolling artifacts were still describing an older lifecycle-spine slice and needed to be reset before more implementation work.

### Already-Landed Strengths
- `src/shared/entry-kernel-state.ts` already models the entry gate lifecycle.
- `src/shared/runtime-invocation.ts` already models provider-bound runtime requests.
- `src/shared/turn-output.ts` already models structured turn outputs and export projections.
- `src/plugin/opencode-plugin.ts` already registers the critical OpenCode enforcement surfaces:
  - `permission.ask`
  - `tool.execute.before`
  - `tool.execute.after`
  - `command.execute.before`
  - `chat.message`
  - `experimental.chat.system.transform`
  - `experimental.chat.messages.transform`
  - `event`
- Existing tests already cover adjacent foundations:
  - lifecycle split
  - runtime tools
  - recovery checkpoints
  - workflow authority
  - delegation packets
  - plugin assembly/runtime shape

### Open P0 Blockers
- SDK supervisor scaffolding exists but is not yet expanded to session registry, workflow scheduling, leases, or event mirroring.
- No deterministic delegation receipt model or zero-trust receipt verification path.
- No freshness registry, deadlock checkpoint authority, or replay envelope contract family.
- No dedicated stress-cert tests for concurrency, restart reconstruction, or stale-artifact blocking.

### Evidence Gathered This Turn
- `task_plan.active.md`, `progress.active.md`, and `MASTER.active.md` were out of sync with the requested Phase 1 posture.
- `docs/testing/STRESS-TEST.md` remains the acceptance anchor for Categories A-F style stress behavior.
- `src/control-plane/control-plane-handler.ts` still owns too much orchestration glue and is the likely extraction seam for future supervisor work.
- `src/plugin/runtime-plan.ts` already exposes a natural seam where schema-kernel contracts can be introduced without destabilizing public CLI/package surfaces.
- `src/hooks/event-handler.ts` and plugin hook registration already provide the initial enforcement/event touchpoints needed for a later supervisor mirror.

### Active Slice
- Reset the rolling artifacts and stable architecture SOT to the Phase 1 stress-cert posture.
- Add the first additive schema-kernel slice under TDD.
- Add the first additive sdk-supervisor slice under TDD.
- Wire `hivemind_runtime_status` through schema-kernel lifecycle records and supervisor health reporting.

### Evidence Required Before Claiming Phase 1 Complete
- `src/schema-kernel/` exists with the Phase 1 contract family and tests.
- `src/sdk-supervisor/` exists with at least instance/session/workflow health scaffolding and tests.
- `hivemind_runtime_status` reports supervisor + kernel state together.
- Dedicated tests prove:
  - concurrent session isolation
  - workflow wave/dependency blocking
  - stale-reference warning/block behavior
  - timeout/deadlock checkpoint behavior
  - restart recovery replay
  - delegated result verification before parent continuation

### Verification Status
- Fresh verification for the new Phase 1 reset is now green:
  - `npx tsx --test tests/schema-kernel-contracts.test.ts tests/sdk-supervisor-instance.test.ts` -> pass
  - `npx tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts` -> pass
  - `npx tsc --noEmit` -> pass
  - `npm test` -> pass (`143` tests passed, `0` failed)

### New Evidence From This Slice
- `src/schema-kernel/` now exists as a real sector with additive Phase 1 contract schemas for:
  - entry/runtime/turn records
  - delegation receipts
  - supervisor/session/workflow records
  - freshness/deadlock/replay evidence
- `src/sdk-supervisor/` now exists as a real sector with:
  - validated instance registry creation
  - same-local-env instance upsert
  - aggregate supervisor health summary
- `hivemind_runtime_status` now consumes those additive sectors instead of reporting attachment state alone:
  - `kernelState.entry` is emitted as a validated `EntryKernelStateV1` record
  - `kernelState.runtimeInvocation` is emitted as a validated `RuntimeInvocationV1` inspection record
  - `kernelState.sessionRegistry` and `kernelState.freshnessRegistry` are emitted as validated Phase 1 orchestration/evidence records
  - `supervisorState.registry` is emitted as a validated `SupervisorInstanceRegistryV1`
  - `supervisorState.health` is emitted as the aggregate supervisor summary
- Runtime-status integration is currently additive and inspection-only:
  - it synthesizes validated records for reporting
  - it does not yet persist session/workflow/event registries
  - zero-trust delegation receipt verification remains unimplemented
- Full `npx tsx --test` is still not a clean repo-wide gate because of pre-existing unrelated failures:
  - `tests/code-intel/hivemind-codemap.test.ts` imports a missing `src/tools/hivemind-codemap.js`
  - `HF-HARDEN-08`, `HF-HARDEN-09`, and `HF-HARDEN-10` remain intentionally red outside this slice
- New AGENTS charters exist for both new sectors, and root/src charters were updated to classify their ownership.

### Reminder
- Keep the Trio-3 rolling on every bounded slice:
  - `MASTER.active.md`
  - `task_plan.active.md`
  - `progress.active.md`
- Keep AGENTS charters aligned with any new sector or shifted authority.
- Do not claim completion without fresh test evidence.

### Latest Verification
- `npx tsx --test tests/runtime-tools.test.ts tests/control-plane-runtime-tools.test.ts tests/sdk-supervisor-instance.test.ts tests/schema-kernel-contracts.test.ts` -> pass
- `npx tsc --noEmit` -> pass
- `npm test` -> pass (`143` tests passed, `0` failed)
