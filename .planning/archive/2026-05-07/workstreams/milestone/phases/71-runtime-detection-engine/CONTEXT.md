---
phase: 71-runtime-detection-engine
priority: P1
status: pending
created: 2026-04-30
depends_on:
  - 38-q6-state-root-migration
blocks:
  - 60-session-entry-intake
gsd_agents:
  - gsd-executor
  - gsd-researcher
  - gsd-verifier
requirements:
  - RUNTIME-DET-01
  - RUNTIME-DET-02
  - RUNTIME-DET-03
---

# Phase 71: Runtime Detection Engine

## Goal

Implement the runtime detection engine with deep codemap/codescan for project type, language, framework detection, file watcher for dependency graph updates, and MCP tool synthesis.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| RUNTIME-DET-01 | Deep codemap/codescan for project type, language, framework, complexity | Q1 validation decision |
| RUNTIME-DET-02 | File watcher for package.json changes → dependency graph update | Q1 validation decision |
| RUNTIME-DET-03 | MCP tools + stack skills synthesize tech stack at runtime | Q1 validation decision |

## Scope

- Enhance `src/lib/framework-detector.ts`
- New `src/lib/runtime-detection/` directory
- Tests in `tests/lib/runtime-detection/`

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| RUNTIME-DET-01 | gsd-executor | hm-l2-test-driven-execution |
| RUNTIME-DET-02 | gsd-researcher | hm-l2-test-driven-execution |
| RUNTIME-DET-03 | gsd-verifier | hm-l2-test-driven-execution |

## Key Files

- `src/lib/runtime-detection/index.ts`
- `src/lib/runtime-detection/codemap.ts`
- `src/lib/runtime-detection/codescan.ts`
- `src/lib/runtime-detection/file-watcher.ts`
- `src/lib/runtime-detection/stack-synthesizer.ts`
- `src/lib/framework-detector.ts` (enhance)

## Tech Compliance

- TypeScript strict mode, ES2022, NodeNext
- Max 500 LOC per module
- No circular dependencies
- All state writes to `.hivemind/` (Q6)
- CQRS: tools are write-side, hooks are read-side

## Dependencies

- Phase 38: Q6 state root migration (`.hivemind/` state root for detection results)

## Constraints

- RED-first TDD for all source changes
- Atomic scoped commits
- Full test suite must pass after each change
- No direct code copy from product-detox — concept extraction only
- Source: Q1 validation decision (Hybrid + Spec-Driven Automated Runtime Detection)
