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
- Next likely slice: align shipped truth surfaces and then expose only the same fixed first-wave doc-intel behavior through a narrow public tool surface, without reintroducing write paths or heavier inspect/xref/context actions.
