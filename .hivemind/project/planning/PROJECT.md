# Project Vision

> Canonical readable planning root for HIVEMIND.

## Purpose
Stabilize HIVEMIND as a deterministic OpenCode-native orchestration framework with clean lineage routing, low-context drift, and reusable workflow contracts.

## Scope
- In scope:
  - `.hivemind` runtime composition and planning-root design
  - OpenCode-native session/workflow/delegation behavior
  - readable planning and governance source-of-truth under this directory
- Out of scope:
  - platform-specific sidecars as primary architecture
  - ad-hoc state stores outside the March 6 authority split

## Key Decisions
- JSON remains the deterministic runtime-state format for session, graph, hierarchy, and governance state.
- Markdown remains the readable source-of-truth for planning, decisions, milestones, and long-haul continuity.
- `.hivemind/project/planning` is the canonical readable planning root; legacy `.planning/` is compatibility-only.
- Dual-lineage work stays separated first and synthesized only after the overlap is explicit.
