# Scan Layers

## High-Level Pass
- map major directories and authorities
- identify likely subsystem boundaries
- identify possible overlap zones and shared ownership risks
- decide whether `quick`, `deep`, or `exhaustive` is warranted
- decide whether `native`, `repomix`, or `hybrid` mode is safest

## Pipeline Pass
- map execution paths, state transitions, and downstream consumers for the chosen slices
- identify where authority changes hands across tools, hooks, plugin assembly, or local runtime state
- record which interfaces are official-boundary-facing vs internal-only

## Journey Pass
- map happy path, degraded path, resume path, partial-failure path, and cleanup-sensitive path
- record which seams affect user-visible outcomes vs internal maintenance only
- capture QA and regression surfaces before low-level proof starts

## Low-Level Pass
- inspect only the bounded slices chosen by the prior passes
- extract concrete seams, interfaces, hotspot files, ownership conflicts, and proof for the still-open questions
- record why each slice matters to the detox route and which journeys it can break
- produce handoff-ready slices for delegation or debugging

## Layered Rule
- never start with exhaustive low-level reading unless migration or severe rot requires it
- always prefer high-level pass -> pipeline map -> journey map -> bounded slice selection -> low-level verification
- if structural ambiguity remains after the high-level pass, re-run codemap before debugging or refactor
- if pipeline or journey ambiguity remains after intermediate passes, do not declare the codemap complete

## Required Artifacts
- scan plan
- seam inventory
- hotspot list
- pipeline map
- journey and edge-case notes
- codemap synthesis linked to later debug/refactor stages
