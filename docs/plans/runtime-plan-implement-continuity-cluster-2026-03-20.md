# HM Plan/Implement Continuity Cluster (2026-03-20)

## cluster_name
`workflow-continuity-transaction-spine`

## goal
Add one real runtime continuity transaction for `hm-plan` and `hm-implement` so those commands stop behaving as preview-only projections and instead persist a resumable workflow-linked execution record that can survive session changes while reusing the existing agent-work contract and turn-output artifacts.

## why_this_first
- The current command path already creates turn-output files and a session-scoped agent-work contract, but `hm-plan` and `hm-implement` still have no non-preview execution authority of their own.
- A small transaction spine converts the commands into real runtime operations without redesigning the workflow engine: one continuity record can become the stable join point for command phase, artifact refs, workflow identity, and later task/handoff synchronization.
- This is the narrowest slice that directly addresses blocker (1) and creates the prerequisite seam for blocker (2); blocker (3) can then attach to the same record instead of inventing another state carrier.

## scope_in
- Add a small runtime continuity transaction record writer in `src/features/runtime-entry/` or `src/sdk-supervisor/` that runs only for `hm-plan` and `hm-implement` after turn-output projection exists.
- Key the continuity record by durable workflow identity first (`workflowId`, with `trajectoryId` fallback, then `sessionId` only as last resort) so the same chain can be resumed after delegation, rebuild, or parent/session changes.
- Store only the minimum continuity payload: command id, phase, continuity key, session ids involved, latest turn-output refs, linked contract id/file, and timestamps.
- Update `src/features/agent-work-contract/engine/command-session-contract.ts` to resolve existing continuity via that durable key before falling back to latest-by-session, preserving `planningPath` across `hm-plan` -> `hm-implement` even if the session changes.
- Surface the continuity transaction summary through existing runtime status/report payloads as lightweight evidence, not a new public tool.
- Add targeted tests in `tests/runtime-entry-contract.test.ts` and `tests/plugin-runtime.test.ts` proving one continuity chain survives a changed session id when `workflowId` stays constant.

## scope_out
- No workflow-engine redesign, no new planner/executor orchestration engine, and no attempt to execute arbitrary work inside slash-command markdown.
- No full task graph import into contracts; only preserve current artifact/phase continuity in this slice.
- No hierarchy-tree redesign or ancestor-resolution framework.
- No delegation protocol rewrite; do not redesign handoff packets, export cycles, or resume routing.
- No new standalone persistence domain for all runtime state; this slice adds only one bounded continuity transaction surface.

## acceptance_criteria
- Executing `hm-plan` writes a continuity transaction record tied to the active workflow identity and links it to the created/updated agent-work contract.
- Executing `hm-implement` for the same workflow updates that same continuity transaction record even when `sessionId` differs from the prior `hm-plan` run.
- The linked agent-work contract preserves the original `workflow.planningPath` across the session change and records `workflow.phase = 'implementation'` after `hm-implement`.
- Result payloads for `hm-plan` and `hm-implement` include continuity evidence refs (transaction file path and/or continuity id) in addition to existing turn-output projections.
- Runtime status can read and report the latest continuity-bearing chain for the workflow without requiring direct contract-tool or handoff-tool calls.
- Unrelated commands keep current behavior and do not create continuity transactions.

## verification_commands
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test tests/plugin-runtime.test.ts`
- `npx tsc --noEmit`

## follow_on_after_this
- Minimal task-state sync: project active/pending canonical workflow tasks into the existing continuity record and contract summary.
- Minimal handoff sync: attach latest open handoff ids/receipts for the same workflow to the continuity record without redesigning delegation.
- Only after those land, decide whether a broader cross-session workflow registry is still needed.

## implementation_risks
- Overreach risk: pulling task graphs, delegation packets, and hierarchy recovery into the first transaction slice would turn a bounded continuity fix into a workflow-system rewrite.
- Authority drift risk: if the new transaction record starts owning task truth or handoff truth, it will compete with `core/workflow-management` and `delegation/` instead of joining them.
- Key-selection risk: choosing `sessionId` as the primary lookup again would fail the cross-session goal; choosing an unstable synthetic key would create duplicate chains.
- Reporting risk: runtime status should summarize the transaction, not become its write path.
