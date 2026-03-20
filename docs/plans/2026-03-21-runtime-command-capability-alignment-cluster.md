# Runtime Command Capability Alignment Cluster (2026-03-21)

## cluster_name
`runtime-command-capability-alignment`

## goal
Promote the remaining non-control-plane workflow bundles (`hm-research`, `hm-verify`, `hm-tdd`, and `hm-course-correct`) from preview-only fallbacks into real runtime handler execution, then replace flat runtime/status capability reporting with an explicit truth model that shows which commands and chain actions are actually executable.

## why_this_first
- It closes the most visible usability gap left after `hm-plan`/`hm-implement`: session routing and runtime tools still advertise lanes that fall back to `executionMode: 'preview'`.
- The existing runtime-entry seam already supports thin handler promotion, so this cluster can reuse the same bounded pattern instead of inventing a general workflow engine.
- Capability/status truth can be fixed in the same pass by teaching runtime status to expose executable-vs-declared state for command lanes and chain actions, which directly addresses the current overstatement problem.
- Keeping this cluster at the handler-and-status layer avoids reopening delegation continuity, supervisor redesign, or markdown-as-runtime-authority drift.

## scope_in
- Add thin runtime handlers for `hm-research`, `hm-verify`, `hm-tdd`, and `hm-course-correct` under `src/features/runtime-entry/` and register them through the existing runtime command dispatch path so these bundles return `executionMode: 'handler'` instead of falling through to preview.
- Keep each promoted handler inspection-first and command-specific: read the already-available runtime/workflow/continuity state, emit bounded next-step metadata, and reuse existing entity binding plus pressure-contract behavior instead of executing markdown instructions or spawning live subagents.
- Extend runtime capability reporting so `hivemind_runtime_status` no longer exposes only `availableCommands`; add a structured capability view that reports, per command, whether the bundle is `handler`, `control-plane`, or `preview` backed.
- In the same capability view, report chain-action truth separately from declaration: surface that `onDelegation: handoff-packet` is the only live runtime-supported chain action today, while the other contract-declared actions remain non-executable metadata.
- Update targeted tests in `tests/runtime-entry-contract.test.ts`, `tests/plugin-runtime.test.ts`, and `tests/runtime-tools.test.ts` to lock the promoted command behavior and the new truthful status surface.

## scope_out
- No generic workflow-command framework beyond the four named bundles.
- No live research transport, no real verifier engine, no red/green test runner orchestration, and no recovery supervisor rewrite; handlers remain bounded runtime execution surfaces, not full workflow engines.
- No markdown command parsing as execution authority.
- No chain-action implementation beyond truthful exposure; `next-task`, `archive`, `export-*`, and compaction-trigger actions stay non-executable this cycle.
- No schema or contract-model redesign unless a tiny additive status type is required for the new capability payload.

## acceptance_criteria
- `executeSlashCommandBundle(findSlashCommandBundle('hm-research'), ...)`, `hm-verify`, `hm-tdd`, and `hm-course-correct` each return `executionMode = 'handler'` with command-specific runtime reports instead of preview fallbacks.
- `hivemind_runtime_status` exposes a capability payload that distinguishes executable command bundles from preview-only bundles rather than listing every registered bundle as uniformly available.
- The capability payload also distinguishes declared chain actions from actually executable chain actions and marks only delegation `handoff-packet` as live runtime-supported.
- Start-work recommendations for `research`, `gatekeeping`, `tdd`, and `course-correction` now point only to command ids that have real handler support in the runtime.
- Existing promoted commands (`hm-plan`, `hm-implement`, control-plane bundles) keep their current execution behavior and remain truthfully represented in the same capability surface.

## verification_commands
- `npx tsx --test tests/runtime-entry-contract.test.ts`
- `npx tsx --test tests/plugin-runtime.test.ts`
- `npx tsx --test tests/runtime-tools.test.ts`
- `npx tsc --noEmit`

## follow_on_after_this
- Decide whether any of the newly promoted handler lanes need deeper execution ownership in supervisor/schema-kernel rather than bounded status handlers.
- Either implement or explicitly deprecate the remaining non-executable chain actions so contract defaults stop implying future behavior without evidence.
- Revisit command/result payload consistency so runtime status, start-work routing, and docs all consume the same capability authority.

## implementation_risks
- If the four new handlers start interpreting markdown content or orchestrating real work, the cluster will sprawl into a workflow-engine rewrite.
- If capability truth is assembled in multiple places, runtime status and routing can drift again even after handler promotion.
- If tests only assert command ids and not execution modes, preview regressions can silently return.
- If chain-action truth is exposed unclearly, consumers may still misread declared defaults as supported automation.
