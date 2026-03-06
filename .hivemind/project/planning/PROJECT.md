# Project Vision

## Purpose

HIVEMIND is an OpenCode-native context governance and orchestration framework. The current long-haul goal is to stabilize the framework around deterministic runtime state, explicit lineage boundaries, and a readable planning source-of-truth that another agent can resume without re-deriving the wrong architecture.

## Scope

- In scope:
  - `.hivemind` runtime composition and lifecycle design
  - planning-root normalization under `.hivemind/project/planning`
  - lineage-safe workflow orchestration for `hivefiver` and `hiveminder`
  - validated handoff and external-synthesis loops
- Out of scope:
  - sidecar-specific architecture as the primary design center
  - greenfield replacement of the March 6 runtime/state model
  - adding new state stores to solve documentation or continuity gaps

## Key Decisions

- The March 6 baseline is the current floor, not open backlog:
  - `task_id` continuity is landed
  - `hivemind_inspect.traverse` v1 is landed
  - prompt-surface ownership coverage is landed
  - `tool-gate` advisory demotion is landed
  - child-session minimization is landed
- JSON remains the deterministic runtime-state format for:
  - session metadata and continuity
  - graph state
  - hierarchy state
  - governance counters and manifests
- Markdown remains the readable source-of-truth format for:
  - project planning
  - decisions and pivots
  - milestones and verification summaries
  - manual external question packets
- `.hivemind/project/planning` is the canonical readable planning root.
- Legacy `.planning/` references are compatibility-only and must not become the active source-of-truth again.
- The active strategic pivot is to understand how reset/init and later automatic mechanisms form `.hivemind` over time before reopening deeper runtime refactors.
