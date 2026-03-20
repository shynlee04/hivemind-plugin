# Runtime Command State Bridge Cluster (2026-03-21)

## cluster_name
`runtime-command-state-bridge`

## goal
Break the `hm-plan`/`hm-implement` preview-only seam by giving those two commands a minimal real runtime handler path, then synchronize canonical workflow task state into the already-linked Agent-Work contract so continuity, compaction, and runtime status carry active workflow truth instead of empty contract tasks.

## why_this_first
- It closes blocker (1) and the most actionable slice of blocker (2) in one bounded pass.
- The continuity transaction, turn-output export, and session-contract linkage already exist, so this cluster can reuse that seam instead of inventing a new planner/executor architecture.
- Syncing canonical task state into the linked contract makes the existing continuity chain materially useful across session changes, which is the smallest meaningful bridge back into Agent-Work continuity.
- Deferring delegation recovery and chain enforcement keeps the work inside one implementation cycle instead of turning it into a workflow-system rewrite.

## scope_in
- Add dedicated runtime handlers for `hm-plan` and `hm-implement` that return `executionMode: 'handler'` with bounded runtime metadata, entity bindings, and state transitions; do not attempt to execute markdown instructions or build a generic command executor.
- Keep handler ownership local to the runtime-entry/control-plane seam so other commands retain current behavior unless explicitly opted in.
- Add a small canonical-to-contract task projection step inside command-session linkage: read canonical workflow tasks from `core/workflow-management`, map lifecycle statuses into Agent-Work contract statuses, and persist that snapshot into `workflow.tasks` whenever `hm-plan` or `hm-implement` finalizes.
- Preserve the current continuity-first contract reuse path so `hm-implement` still updates the original linked contract across changed `sessionId` values.
- Prove through runtime status and compaction-facing summaries that active and pending task ids now come from canonical workflow state rather than empty contract defaults.
- Touch only the minimum files likely needed for this bridge: `src/control-plane/control-plane-handler.ts`, `src/features/runtime-entry/command.ts`, `src/features/agent-work-contract/engine/command-session-contract.ts`, optional additive helper(s) under `src/features/agent-work-contract/engine/` or `src/features/runtime-entry/`, plus targeted tests.

## scope_out
- No planner/executor redesign, no generic workflow command framework, and no attempt to make slash-command markdown itself executable state authority.
- No new workflow registry or replacement for the current continuity transaction.
- No delegation/handoff recovery stitching beyond preserving existing ids already passed into command execution.
- No runtime enforcement of chain actions in this cluster.
- No automatic task mutation derived from command text; canonical task state remains owned by `core/workflow-management` tools and lifecycle code.

## acceptance_criteria
- `executeSlashCommandBundle(findSlashCommandBundle('hm-plan'), ...)` and `hm-implement` return `executionMode = 'handler'` rather than `preview`.
- Running `hm-plan` or `hm-implement` updates the linked Agent-Work contract with `workflow.tasks` projected from canonical workflow task state using a stable status-mapping rule.
- When `hm-implement` runs under a new session for the same workflow, it reuses the existing linked contract and continuity record instead of creating a second session contract.
- `hivemind_runtime_status` reports `latestSessionContract.activeTaskIds` and `latestSessionContract.pendingTaskIds` that match the canonical task ledger after the command run.
- Existing planning-path continuity still holds: `workflow.planningPath` survives the `hm-plan` -> `hm-implement` transition across changed sessions.
- Commands outside `hm-plan` and `hm-implement` keep their current execution behavior.

## verification_commands
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test tests/plugin-runtime.test.ts`
- `npx tsx --test src/features/agent-work-contract/hooks/compaction-preservation.test.ts`
- `npx tsc --noEmit`

## follow_on_after_this
- Stitch latest open delegation/handoff records into continuity lookup and runtime bindings for resume-safe recovery.
- Enforce selected chain actions at runtime now that canonical task state is present in the linked contract.
- Decide later whether `hm-verify`/`hm-tdd` need the same real-handler promotion or a different runtime path.

## implementation_risks
- The canonical task ledger uses statuses such as `in_progress` while the contract schema expects `active`; a bad mapper will make compaction and runtime status lie.
- If the handler path starts interpreting markdown instructions or mutating tasks directly, this bounded bridge will sprawl into a planner/executor redesign.
- If contract lookup falls back to session-first behavior in the wrong place, cross-session continuity will split into duplicate contracts.
- Updating contract tasks too aggressively could overwrite future delegation-specific task metadata; the projection must stay additive and canonical-first.
