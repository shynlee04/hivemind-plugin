# Ecosystem Runtime Hierarchy 2026-03-14

## Active Structure

- `src/core/`: session, state, hierarchy, planning, workflow-management
- `src/hooks/`: context-injection, prompt-transformation, runtime-loader, workflow-integration
- `src/context/`: reusable context strategies and prompt-packet primitives
- `src/delegation/`: delegation packet contracts and orchestration-facing helpers
- `src/governance/`: governance engines and gatekeeping logic
- `src/intelligence/`: code and doc intelligence
- `src/persistence/`: storage, cleanup, migration, retention
- `src/recovery/`: doctor, compaction, and continuity repair
- `src/shared/`: paths, logging, event bus, tool response helpers

## Naming Rules

- Use hyphenated filenames.
- Keep runtime trigger code under `src/hooks/`.
- Keep pure reusable prompt/context logic under `src/context/`.
- Keep workflow routing and handoff continuity under `src/core/workflow-management/`.
- Keep files below 300 LOC.
- Keep future runtime tool instruction files under `tools/runtime/` with matching `.txt` names.

## Current Direction

- Main-session packets remain full lineage packets.
- Sub-session packets remain bounded delegation packets.
- Hook modules decide when to inject, transform, load, and continue.
- Tool-specific prompt text should live beside each future tool as matching `.txt` instruction files.
