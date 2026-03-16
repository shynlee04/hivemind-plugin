# Task Plan Active

## Goal
Advance the long-haul schema-first harness work by stabilizing the lifecycle spine before more advanced layering:
- `entry` must be a distinct lifecycle authority
- `runtime invocation` must be a distinct provider-request authority
- `turn output` must be a distinct completed-turn authority
- the split must stay under the file-size guard and avoid monolithic types

## Current Phase
- [complete] Audit current entry/runtime/turn lifecycle code and identify the missing seam
- [complete] Add failing tests that force lifecycle separation
- [in_progress] Implement the minimal shared lifecycle spine and thread it through existing entry/runtime/turn records
- [pending] Re-run full verification, update rolling artifacts and AGENTS, and prepare the atomic commit

## Bounded Slice
1. Red phase:
   - prove `EntryKernelStateV1` declares its own lifecycle identity
   - prove `RuntimeInvocationV1` is a request record, not an entry record
   - prove `TurnOutputEnvelopeV1` is a completed-turn record linked to runtime invocation
2. Green phase:
   - add `src/shared/lifecycle-spine.ts`
   - wire lifecycle identity into `entry-kernel-state.ts`, `runtime-invocation.ts`, and `turn-output.ts`
   - thread the stricter runtime invocation inputs through `runtime-plan.ts` and `command-runner.ts`
3. Guardrails:
   - keep every touched source file under `300` LOC
   - keep lifecycle concerns split rather than introducing a monolithic aggregate
4. Verification phase:
   - `npx tsx --test tests/lifecycle-spine.test.ts tests/plugin-runtime.test.ts tests/runtime-turn-output.test.ts tests/control-plane-runtime-tools.test.ts tests/start-work-router.test.ts`
   - `npx tsc --noEmit`
   - `npm test`
   - `npm run build`

## Risks
- If lifecycle identity remains implicit, later workflow/trajectory logic will keep conflating session start with provider requests.
- If the split is implemented inside one oversized type or file, the repo will regress into the same architectural opacity.
- Tightening runtime invocation inputs can ripple into command and plugin orchestration if not kept minimal.

## Out Of Scope For This Slice
- Full lineage/session graph implementation
- Workflow gate registry expansion
- Trajectory/SOT/artifact execution logic beyond the lifecycle identity seam
- Additional doc generation

## Success Criteria
- `EntryKernelStateV1` exposes a first-class entry lifecycle identity.
- `RuntimeInvocationV1` exposes a first-class request lifecycle identity with entry/QA/release context attached.
- `TurnOutputEnvelopeV1` exposes a first-class completed-turn lifecycle identity linked to the runtime invocation.
- All touched source files remain under `300` LOC.
- Existing runtime plan, command execution, and turn-output exports continue to pass.

## Active Red-Green Slice
1. Red:
   - `tests/lifecycle-spine.test.ts`
2. Green:
   - add shared lifecycle module
   - wire entry/runtime/turn identity through existing records
3. Verification:
   - targeted lifecycle/runtime tests
   - typecheck
   - full suite
   - build

## Next Verification Commands
- `bash scripts/check-agent-registry-parity.sh`
- `npx tsx --test tests/agent-boundary-policy.test.ts`
- `npx tsx --test tests/control-plane-runtime-tools.test.ts tests/harness-command.test.ts tests/slash-command-stack.test.ts tests/runtime-entry-attachment.test.ts`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
