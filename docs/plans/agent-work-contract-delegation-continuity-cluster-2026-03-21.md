# Agent-Work Contract Delegation Continuity Cluster (2026-03-21)

## cluster_name
`agent-work-contract-delegation-continuity`

## goal
Make delegation durable enough for the Agent-Work contract engine to survive resume, rebuild, and reinstall flows by wiring open handoffs into workflow continuity and supporting the single highest-value chain action: `onDelegation: handoff-packet`.

## why_this_first
- The core objective is not "more commands execute"; it is "the agent-work contract remains intact across session boundaries," and the largest remaining break is delegation continuity.
- `hm-plan` and `hm-implement` already have a real handler path plus continuity linkage, so the next leverage point is the still-isolated delegation surface in `src/delegation/` and `src/features/handoff/`.
- `ChainExecutor` exists but is only unit-tested and never attached to runtime behavior, which means the default contract policy `onDelegation: 'handoff-packet'` is effectively dead metadata today.
- Promoting the remaining preview-only commands would improve breadth, but it would not make resume-safe delegation or workflow progression durable; that work is better deferred until the continuity spine covers handoffs.

## scope_in
- Extend the continuity record in `src/features/runtime-entry/workflow-continuity.ts` so a workflow can persist the latest delegation linkage needed for recovery: delegation id, handoff record ref, target session id, resume target, and linked contract id.
- Wire `src/features/handoff/handoff.ts` and/or `src/delegation/delegation-store.ts` to upsert that continuity linkage when a handoff is created, updated, validated, or closed.
- Add a bounded runtime dispatch seam for exactly one chain action, `onDelegation: 'handoff-packet'`, reusing `src/features/agent-work-contract/engine/chain-executor.ts` or a thin helper rather than inventing a new workflow engine.
- Update linked contract projection so delegated task ids can be reflected on the existing contract without replacing canonical workflow authority; task state should become more informative, not more autonomous.
- Extend resume/status lookup so a later session can recover the same linked contract through workflow-plus-delegation continuity instead of falling back to session-only lookup.
- Cover the slice with additive tests in `tests/runtime-entry-contract.test.ts`, `tests/plugin-runtime.test.ts`, and targeted handoff/chain executor tests.

## scope_out
- No generic runtime support for `onTaskComplete`, `onWorkflowEnd`, or `onCompaction80`; only the delegation trigger is in scope.
- No promotion of `hm-research`, `hm-verify`, `hm-tdd`, or `hm-course-correct` out of preview-only mode in this cluster.
- No automatic child-session creation, no live OpenCode transport orchestration, and no supervisor rewrite.
- No replacement of `core/workflow-management` as task authority.
- No attempt to make markdown command assets executable workflow state machines.

## acceptance_criteria
- Creating a delegation handoff for a workflow with an existing linked contract writes continuity state that preserves the original contract id and records delegation-specific recovery fields.
- A resumed or follow-on session can resolve the same linked Agent-Work contract through continuity even when the active session id differs from the source session id.
- The runtime path executes the contract's `onDelegation: 'handoff-packet'` behavior and emits auditable artifact/state evidence instead of leaving the chain action inert.
- Delegated task refs become visible on the linked contract in a bounded way that does not clobber canonical non-delegated task status.
- Existing `hm-plan` -> `hm-implement` continuity behavior remains green after the delegation linkage is added.

## verification_commands
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test tests/plugin-runtime.test.ts`
- `npx tsx --test tests/runtime-tools.test.ts`
- `npx tsx --test src/features/agent-work-contract/engine/chain-executor.test.ts`
- `npx tsc --noEmit`

## follow_on_after_this
- Promote the remaining preview-only command handlers once delegation continuity can safely carry workflow state across command boundaries.
- Add the next chain-action slices: `next-task`, `archive`, and compaction-trigger behavior.
- Decide whether delegation receipts should move into schema-kernel/supervisor ownership for stronger live-runtime verification.

## implementation_risks
- Continuity identity can fragment if workflow-, session-, and delegation-based lookup rules disagree about which record is authoritative.
- Handoff storage and runtime continuity can become competing sources of truth unless one file remains canonical and the other is strictly a projection.
- Marking delegated tasks on the contract can accidentally overwrite canonical task state if the merge rules are not additive.
- Wiring chain dispatch too broadly will sprawl this cluster into a generic workflow executor instead of a bounded delegation bridge.
