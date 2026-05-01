---
phase: 42-sidecar-foundation
priority: P3
status: foundation-complete
foundation_completed: 2026-05-01
created: 2026-04-30
depends_on: [38-q6-state-root-migration, 41-session-journal-time-machine]
blocks: []
gsd_agents: [gsd-executor, gsd-ui-researcher]
requirements: [SIDECAR-01, SIDECAR-02, SIDECAR-03]
---

# Phase 42: Sidecar Foundation

## Goal

Establish the artifact-focused sidecar dashboard (Q2 decision: Next.js + @json-render/react) that reads `.hivemind/` and `.planning/` for rendering dashboard tabs, calls OpenCode SDK server API, and enforces read-only access to canonical state.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| SIDECAR-01 | Reads `.hivemind/` and `.planning/`, renders dashboard tabs | Q2 decision |
| SIDECAR-02 | Calls OpenCode SDK server API for runtime data | Q2 decision |
| SIDECAR-03 | CANNOT write to canonical state — enforcement test required | Q2 decision |

## Scope

- New sidecar directory (Next.js application)
- Dashboard tab rendering
- OpenCode SDK server integration
- Read-only enforcement layer
- Tests for all

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| SIDECAR-01 | gsd-executor | hm-test-driven-execution |
| SIDECAR-02 | gsd-ui-researcher | stack-l3-nextjs |
| SIDECAR-03 | gsd-executor | hm-test-driven-execution |

## Key Files

- New sidecar directory (Q2: Next.js + @json-render/react)
- Sidecar configuration and routing
- Read-only state access layer
- Dashboard tab components

## Tech Compliance

- Next.js (version per Q2 decision)
- @json-render/react for generative UI
- TypeScript strict mode
- Max 500 LOC per module
- No circular dependencies
- READ-ONLY access to canonical state per Q2

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
- Sidecar is READ-ONLY for canonical state — enforcement test required
- Depends on Q6 migration (phase 38) for `.hivemind/` canonical paths
