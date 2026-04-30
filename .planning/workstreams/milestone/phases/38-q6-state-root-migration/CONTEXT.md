---
phase: 38-q6-state-root-migration
priority: P1
status: complete
completion_note: "All state writers target .hivemind/. Compat bridge exists for legacy. One-way migration complete."
created: 2026-04-30
depends_on: [35-event-tracker-fix-dead-code-cleanup]
blocks: [42-sidecar-foundation]
gsd_agents: [gsd-executor, gsd-integration-checker]
requirements: [HIVEMIND-ROOT-01, HIVEMIND-ROOT-02, HIVEMIND-ROOT-03]
---

# Phase 38: Q6 State Root Migration

## Goal

Migrate all internal runtime state writers to target `.hivemind/` as the canonical state root, implement a compatibility bridge for legacy `.opencode/state/` reads, and enforce one-way migration (no back-writes).

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| HIVEMIND-ROOT-01 | All state writers target `.hivemind/` as canonical state root | Q6 decision |
| HIVEMIND-ROOT-02 | Compatibility bridge for legacy `.opencode/state/opencode-harness/` reads | Q6 decision |
| HIVEMIND-ROOT-03 | One-way migration — no back-writes to legacy paths | Q6 decision |

## Scope

- `src/lib/continuity.ts` — update state paths
- `src/lib/delegation-persistence.ts` — update delegation record paths
- All state-writing modules — migrate to `.hivemind/`
- Compatibility bridge — legacy read-only support

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| HIVEMIND-ROOT-01 | gsd-executor | hm-test-driven-execution |
| HIVEMIND-ROOT-02 | gsd-executor | hm-cross-cutting-change |
| HIVEMIND-ROOT-03 | gsd-integration-checker | hm-test-driven-execution |

## Key Files

- `src/lib/continuity.ts` (~401 LOC) — durable JSON persistence
- `src/lib/delegation-persistence.ts` — delegation record persistence
- `src/lib/types.ts` — path constants
- All state-writing modules

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- `[Harness]` prefix on all thrown errors
- Deep-clone-on-read in continuity store
- `.hivemind/` is internal state root per Q6
- `.opencode/` is ONLY for OpenCode primitives per Q6

## Constraints

- RED-first TDD for all changes
- Atomic scoped commits
- Full test suite must pass after each change
- No state loss during migration
