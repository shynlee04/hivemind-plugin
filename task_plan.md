# HiveMind Stabilization and Feature Re-emergence Plan

## Goal
Refactor the current `ecosystem-revamp` codebase into a stable, source-aligned HiveMind product that satisfies the master model in `docs/architecture/2026-03-16-hivemind-master-model.md` and can safely support reintroduction of archived capabilities such as code intelligence and document intelligence.

## Current Phase
- [complete] Phase 1 - Discover current architecture, authority surfaces, and archived feature constraints
- [in_progress] Phase 2 - Compare current repo state against master-model release gates
- [pending] Phase 3 - Define stabilization workstreams and dependency order
- [pending] Phase 4 - Validate the roadmap with specialist review before execution

## Success Criteria
- A clear gap map exists from current repo state to the master model's production-readiness gates.
- Archived feature surfaces are classified by prerequisite stability dependencies.
- A staged roadmap exists that sequences foundation work before feature restoration.
- The roadmap identifies authoritative source paths, stale surfaces, and verification gates.

## Risks
- Docs and shipped surfaces may still overclaim relative to current `src/` runtime behavior.
- Archived features may depend on legacy pathing/session assumptions that no longer fit the CQRS/plugin-native direction.
- Multiple planning and audit artifacts may conflict, causing stale guidance contamination.

## Notes
- Do not begin broad implementation until the stabilization roadmap is reviewed.
- Prefer current source plus the master model over older narrative docs when they disagree.
- Recovery note: completed background exploration was recovered from agent session transcripts after disconnect.
- Current bounded stabilization work has moved from discovery into targeted source cleanup slices.
- Latest completed slice: make `src/plugin/opencode-plugin.ts` more honestly assembly-only by extracting helper and tool-governance logic into hook modules.
- Latest completed restoration-enabling slice: standalone markdown-first read-only doc intelligence (`skim`, section `read`, chunked `read`, `search`) sourced from the archived doc-intel library modules.
- Latest completed truth-surface slice: removed README runtime drift, fixed `src/intelligence/doc/AGENTS.md` to acknowledge live `hivemind_doc`, corrected stale `src/AGENTS.md` tool inventory, and cleaned stale skill-registry/reference pointers.
- Latest completed tool-contract slice: added `.describe()` coverage to `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`, then re-verified typecheck, tests, build, and boundary checks.
- Latest completed CLI-truth slice: corrected `README.md` so its documented public CLI/runtime path now matches the revamp branch's shipped control-plane commands and current runtime guidance instead of the removed `scan`, `sync-assets`, `status`, `dashboard`, and `purge` surfaces.
- Latest completed command-asset truth slice: rewrote `commands/hivemind-dashboard.md` so it no longer presents a non-existent `dashboard` executable and instead routes users to the live runtime inspection path.
- Latest completed command-asset truth follow-up: rewrote `commands/hivemind-scan.md` and `commands/hivemind-status.md` so they explicitly read as in-OpenCode workflows instead of implying shipped public `scan` or `status` CLIs.
- Latest completed command-contract slice: normalized `commands/*.md` frontmatter so every shipped command file now has parseable `description`, `agent`, and `subtask` fields that match `commands/AGENTS.md`.
- Current decision point: choose the next bounded stabilization slice after the verified command-frontmatter normalization; removed-public-CLI grep is clean across `commands/`, and command metadata is now structurally compliant.
- Brownfield initialization for `.planning/` should treat the repo as an existing OpenCode plugin/CLI product and plan the next milestone around deterministic runtime migration, live OpenCode verification, and OpenTUI completion.

## 2026-03-18 Autonomous Milestone Run

### Goal
- Execute the remaining milestone workflow from `.planning/ROADMAP.md` in numeric order using the autonomous discuss -> plan -> execute loop, then finish audit -> complete -> cleanup.

### Current Phase
- [complete] Workflow bootstrap and phase discovery
- [in_progress] Phase 2.1 autonomous execution
- [pending] Remaining phase loop (2.2 -> 8)
- [pending] Milestone lifecycle (audit -> complete -> cleanup)

### Key Questions
1. Which incomplete phase is first by numeric order after applying roadmap state? -> `2.1`
2. Are there blocking state issues that prevent entering the phase loop? -> Not yet; `STATE.md` has concerns but no explicit stop condition.

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use `gsd-tools.cjs` milestone and roadmap commands as the authority for phase discovery | The autonomous workflow explicitly resolves phase state through init/analyze commands |
| Treat `.planning/STATE.md` concerns as non-blocking unless a phase run or verification result says otherwise | The workflow only stops on actual blockers or user decisions |
