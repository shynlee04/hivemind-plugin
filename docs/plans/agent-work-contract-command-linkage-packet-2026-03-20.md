# Agent-Work Contract Command Linkage Packet (2026-03-20)

## Packet
- Name: `plan-implement-session-contract-linkage`
- Goal: Activate the existing agent-work contract engine from real `hm-plan` and `hm-implement` command usage so a session contract is created/updated and retains planning artifact references without redesigning workflow execution.
- Why now: Runtime status now exposes contract surfaces, but the planning and implementation command path still stops at preview-style command results. That leaves `.hivemind/agent-work-contract` dormant during the two commands users most need for continuity.

## Dependencies Mapped
1. `src/tools/runtime/tools.ts` -> `src/features/runtime-observability/status.ts` is the live entry used by agents to execute `hm-*` commands.
2. `src/features/runtime-observability/status.ts` -> `src/commands/slash-command/command-runner.ts` -> `src/features/runtime-entry/command.ts` is the command execution chain that can attach contract persistence without touching plugin hooks.
3. `src/features/runtime-entry/instruction-loader.ts` derives command runtime contract metadata from `commands/hm-plan.md` and `commands/hm-implement.md`; missing frontmatter on `hm-implement` currently weakens artifact linkage.
4. `src/features/agent-work-contract/engine/contract-store.ts` already owns `.hivemind/agent-work-contract/*.json` persistence and is reused by runtime status via `buildLatestSessionContractSummary()`.
5. `src/features/runtime-entry/turn-output.ts` already exports real per-command artifact files; these paths are the safest bounded artifact references to wire into contract state in this slice.

## Scope In
- Add one runtime-entry helper that upserts a session-scoped agent-work contract for `hm-plan` and `hm-implement` after command result finalization.
- Reuse existing `ContractStore` and schema fields only; prefer `workflow.planningPath`, `workflow.phase`, `workflow.outlineRef`, and anchors over new contract schema design.
- Normalize `commands/hm-implement.md` frontmatter so runtime contract extraction mirrors `hm-plan` enough to support artifact/state linkage.
- Add targeted tests proving command execution creates/updates one session contract and that runtime status can read the linked result.

## Scope Out
- No redesign of the workflow/task engine.
- No new planner/executor command handlers that generate full implementation artifacts.
- No plugin-hook auto-creation of contracts on arbitrary chat turns.
- No new public tool or schema contract beyond the existing command/runtime/contract surfaces.

## Sequential Implementation Workflow
1. Command metadata alignment
   - Update `commands/hm-implement.md` frontmatter to declare the same runtime-facing fields that `hm-plan` already exposes where needed for state and artifact projection.
   - Success handoff: `loadCommandAsset('hm-implement')` returns non-empty contract metadata for produces/verification/artifact projection fields used by this slice.
2. Runtime-entry contract linkage helper
   - Add a small helper under `src/features/runtime-entry/` or `src/features/agent-work-contract/` that accepts bundle id, execution input, finalized command result, and turn-output projection paths.
   - Helper behavior:
     - Only runs for `hm-plan` and `hm-implement`.
     - Reuses the latest session contract if present; otherwise creates one.
     - Uses `input.userMessage` or command fallback text as `rawIntent` for initial classification.
     - Writes `workflow.phase` from command id (`planning` or `implementation`).
     - Writes `workflow.planningPath` from the best real planning artifact path available, preferring the finalized markdown/yaml projection path over symbolic `projection:*` tokens.
     - Writes `workflow.outlineRef` to the companion projection path when available.
     - Appends one anchor describing the command transition and linked artifact path.
   - Success handoff: running a command leaves a readable `.hivemind/agent-work-contract/*.json` file for the active session.
3. Finalize command result integration
   - Call the helper from `finalizeCommandResult()` after turn-output projections exist, then append the persisted contract file reference or contract id into `artifactRefs`/report as lightweight evidence.
   - Preserve current behavior for all other commands.
   - Success handoff: `executeRuntimeEntryCommandBundle()` returns the same turn-output data plus contract evidence for `hm-plan`/`hm-implement`.
4. Verification coverage
   - Extend runtime-entry tests for direct bundle execution.
   - Extend runtime-status/runtime-tool coverage so the latest session contract summary reflects the newly linked planning path and phase after command execution.
   - Success handoff: tests fail before the slice and pass after, without altering unrelated command behavior.

## Acceptance Criteria
- `hm-plan` execution creates a session contract when none exists.
- The created contract persists under `.hivemind/agent-work-contract/` and uses the active session id.
- The contract records `workflow.phase='planning'` and stores a real artifact file path in `workflow.planningPath`.
- `hm-implement` execution updates the same session contract (or deterministically creates one if missing) and changes `workflow.phase='implementation'` while preserving the planning path.
- At least one anchor is recorded for each linked command transition.
- `hivemind_runtime_status` can surface the latest session contract summary after command execution without extra manual contract-tool calls.

## Verification Commands
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test tests/plugin-runtime.test.ts`
- `npx tsc --noEmit`

## Runtime Proof Expectations
- Local proof: a direct runtime-command/bundle test shows `hm-plan` or `hm-implement` execution emits turn-output projections and creates or updates `.hivemind/agent-work-contract/<id>.json`.
- Read-path proof: `hivemind_runtime_status` returns `latestSessionContract` populated from that file, including `contractId`, `planningPath`, and current `workflowPhase`.
- Boundary note: this slice proves command-path activation and status visibility in repo tests; it does not yet prove a fully live external OpenCode session beyond the current runtime tool boundary.

## Implementation Risks
- CQRS boundary drift: runtime-entry is not a plugin hook, so the slice must reuse store-level persistence directly and avoid smuggling plugin-only tool execution into control-plane code.
- Artifact quality risk: command results currently include symbolic `projection:*` refs; the helper must prefer real exported projection paths to avoid storing placeholders as `planningPath`.
- Session-collision risk: reusing “latest contract for session” must stay deterministic and avoid creating duplicate contracts on repeated `hm-plan` runs.
- Overreach risk: task-graph population is intentionally deferred; trying to auto-synthesize workflow tasks in this packet would turn a bounded linkage slice into workflow-engine redesign.
