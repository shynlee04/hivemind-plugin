# Agent-Work Contract Runtime Integration PR Materials (2026-03-21)

## PR Title

feat: wire agent-work contracts into runtime command continuity

## PR Body

## Summary

- Make Agent-Work Contracts part of the live runtime path so planning and implementation work can keep their linked contract state instead of stopping at preview-only projections.
- Preserve workflow continuity across `hm-plan`, `hm-implement`, and delegation handoffs so sessions can resume with the same planning path, contract identity, and runtime evidence.
- Expose contract/continuity state through existing runtime status surfaces so agents and operators can inspect the active workflow without digging into files manually.

## User-Facing Value

- `hm-plan` and `hm-implement` now leave behind resumable workflow state rather than isolated turn artifacts.
- Reinstall, resume, or follow-on sessions can recover the same linked contract chain instead of losing planning context on session changes.
- Runtime status shows the latest linked contract and continuity evidence, making the active workflow easier to inspect and trust.

## Implementation Clusters

- Runtime promotion: register the Agent-Work create/export tools in the runtime plugin, align managed-tool governance, and surface latest-session contract summaries through runtime status.
- Command linkage: connect real `hm-plan` and `hm-implement` execution to contract persistence so command runs create or update the same session/workflow-linked contract and store real planning artifact paths.
- Continuity spine: add a bounded workflow continuity transaction so contract linkage survives session changes while keeping the payload additive and lightweight.
- Delegation bridge: wire open handoffs into the same continuity chain and activate the highest-value contract chain behavior, `onDelegation: 'handoff-packet'`, so delegation is no longer inert metadata.

## Verification

- `npx tsx --test src/features/agent-work-contract/tools/create-contract-tool.test.ts src/features/agent-work-contract/tools/export-contract-tool.test.ts`
- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/runtime-tools.test.ts tests/plugin-runtime.test.ts`
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test src/features/agent-work-contract/engine/chain-executor.test.ts`
- `npx tsc --noEmit`

## Smoke Test Plan

1. Reinstall the plugin/package into a clean local OpenCode workspace and confirm the runtime loads without changing any parallel worktree state.
2. Run `hm-plan` for a small prompt, then verify runtime status reports a latest session contract with a real `planningPath`.
3. Run `hm-implement` for the same workflow and verify the same contract/continuity chain now reports implementation phase while preserving the original planning path.
4. Create a delegation handoff for that workflow, then verify runtime status or export surfaces the same linked contract plus delegation continuity evidence.
5. Restart or reopen the session, then confirm the workflow still resolves to the same linked contract/continuity chain without manual file inspection.
