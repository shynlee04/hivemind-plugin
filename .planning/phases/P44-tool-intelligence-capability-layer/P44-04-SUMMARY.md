---
phase: P44
plan: 04
subsystem: tool-intelligence
tags: [tool-intelligence, capability-gate, hooks, delegation, governance]
dependency_graph:
  requires: [P44-01, P44-03]
  provides: [ToolIntelligenceEngine, tool-intelligence-decisions]
  affects: [tool-guard-hooks, session-tracker-types]
tech_stack:
  added: [TypeScript, Vitest]
  patterns: [rule-engine, JIT-grant, contextual-guidance]
key_files:
  created:
    - src/features/tool-intelligence/types.ts
    - src/features/tool-intelligence/index.ts
    - tests/features/tool-intelligence/tool-intelligence-engine.test.ts
    - tests/hooks/guards/tool-guard-hooks.capability.test.ts
  modified:
    - src/hooks/guards/tool-guard-hooks.ts
    - src/features/session-tracker/types.ts
decisions:
  - ToolIntelligenceEngine is a standalone module under src/features/tool-intelligence/
  - JIT grants tracked in-memory per process lifetime (no persistence needed for MVP)
  - Engine evaluates AFTER budget/circuit-breaker, BEFORE governance rules
  - Tool intelligence decisions exposed in tool.execute.after metadata for observability
  - 4 narrow rules cover task delegation + delegate-task code intent (not all tools)
metrics:
  duration: 9m26s
  completed: 2026-06-01T05:11:46Z
  tasks_completed: 4
  files_created: 4
  files_modified: 2
  tests_added: 26
  tests_passing: 3077 of 3079 (2 pre-existing failures unrelated)
  typecheck: clean
---

# Phase 44 Plan 04: Tool Intelligence Engine Summary

Hivemind-owned ToolIntelligenceEngine with conditional runtime decisions for native task delegation governance and delegate-task intent blocking, wired into tool.execute.before/after hooks with full test coverage.

## What Was Built

### ToolIntelligenceEngine (`src/features/tool-intelligence/`)
A stateless rule engine that evaluates tool calls before execution using session hierarchy, agent role, delegation depth, and tool arguments. Independent of OpenCode's native `permission:` allow/ask/deny system.

**4 Narrow Rules:**
1. **Block malformed task** — missing `subagent_type` argument
2. **Block recursive task in child sessions** — requires JIT grant
3. **Allow root orchestration task** — front-facing dispatch via native `task`
4. **Block delegate-task for code intent** — redirects to native `task` with guidance

### Hook Integration (`src/hooks/guards/tool-guard-hooks.ts`)
- Engine runs AFTER budget/circuit-breaker, BEFORE governance rules
- Block/needs_jit_grant throws with full contextual guidance (Agent, Tool, Reason, Use instead, Context)
- After-hook exposes `toolIntelligence` decision in output metadata

### Journey Event Type (`src/features/session-tracker/types.ts`)
- Extended `JourneyEntry.type` union with `"tool_intelligence_decision"` for observability

## Commits

| Hash | Message |
|------|---------|
| `8efb4e75` | feat(P44-04): add ToolIntelligenceEngine types and decision model |
| `5f7a7eb7` | feat(P44-04): wire ToolIntelligenceEngine into tool guard hooks |
| `ee3fdea0` | feat(P44-04): add tool_intelligence_decision journey event type |
| `3edbf372` | test(P44-04): add ToolIntelligenceEngine unit and hook integration tests |

## Verification

- `npm run typecheck` — clean (0 errors)
- `npm test` — 3077/3079 pass (2 pre-existing failures in `state-root-migration.test.ts`, unrelated to P44-04)
- 26 new tests: 20 unit + 6 integration, all passing

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all rule implementations return actionable guidance with no placeholder fields.
