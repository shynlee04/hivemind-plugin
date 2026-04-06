# Harness Cleanup

## What This Is

A cleanup and consolidation of the prompt-enhance executable pipeline (12 commits, ~279 tests) in the harness-experiment worktree before merging into the main hivemind-plugin project. The audit found 8 confirmed bugs and identified duplicate tool/test files that need consolidation.

## Core Value

Every remaining component helps an AI agent complete its workflow — no dead code, no false positives, no phantom references.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **BUG-01**: Fix double-compaction counting (budget drops to 0% after 4 compactions instead of 7)
- [ ] **BUG-02**: Fix session-patch heading corruption (regex matches inside wrong heading level)
- [ ] **BUG-03**: Fix orchestrator references to 5 non-existent agents
- [ ] **BUG-04**: Gate system-transform to prevent 804 chars injected into every session
- [ ] **BUG-05**: Fix prompt-analyze to detect cross-line contradictions
- [ ] **BUG-06**: Rebuild context-budget with real OpenCode compaction data (replace fake 15% model)
- [ ] **BUG-07**: Consolidate duplicate tools (DELETE .opencode/tools/, keep src/tools/)
- [ ] **BUG-08**: Consolidate duplicate test files (delete old, rename *-tool.test.ts → *.test.ts)
- [ ] **DEBT-01**: Delete .opencode/tools/ entirely (5 files — src/tools/ is superior)
- [ ] **DEBT-02**: Delete old test files (tests/tools/*.test.ts, tests/plugins/prompt-enhance.test.ts)
- [ ] **DEBT-03**: Rename tests/tools/*-tool.test.ts → tests/tools/*.test.ts
- [ ] **QUAL-01**: Zero dead text injected into non-prompt-enhance sessions
- [ ] **QUAL-02**: All 8 bugs fixed with explicit test coverage
- [ ] **QUAL-03**: npm run typecheck, npm test, npm run build all pass

### Out of Scope

- Removing any src/tools/ components — all kept and fixed
- Removing EnhancedPromptOutputSchema or PipelineStateSchema — kept as-is
- Adding new features — this is cleanup only
- Restructuring plugin.ts beyond bug fixes

## Context

**Worktree**: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment`
**Main project**: hivemind-plugin (harness-experiment is a worktree for experimentation)

**Audit findings**: 8 confirmed bugs found across priority levels (HIGH/MEDIUM/LOW). Feature-debt analysis completed with re-evaluated decisions on what to keep vs delete.

**Key decisions from analysis**:
- 0 components unconditionally removed
- 4 kept + fixed: system-transform (gate by delegation), context-budget (rebuild model), .opencode/tools/ (DELETE), tool-helpers (keep as convention anchor)
- 2 kept as-is: EnhancedPromptOutputSchema, PipelineStateSchema
- After deep comparison: DELETE all .opencode/tools/ — src/tools/ is superior in every dimension
- Design doc at `docs/superpowers/specs/2026-04-06-harness-clean-design.md` specifies all success criteria

**Current state**: 12 commits, ~279 tests, 8 confirmed bugs, duplicate tool/test files identified for consolidation.

## Constraints

- **Compatibility**: Must maintain plugin interface compatibility with main hivemind-plugin project
- **Testing**: All tests must pass before merge — no tolerance for skipped tests
- **Code quality**: Corporate-level standards — <300 LOC per module, no god components/functions, no dead code
- **TDD**: Tests must be conducted formally with spec-driven tests, schema validation, contract cross-dependencies

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| DELETE .opencode/tools/ entirely | src/tools/ superior in type safety, schema validation, factory pattern, response envelopes, test coverage, plugin wiring | — Pending |
| Keep all src/tools/ components | All contribute to AI agent workflows after bug fixes | — Pending |
| Fix double-compaction by removing event hook's session.compacted handling | Root cause identified in prompt-enhance plugin | — Pending |
| Gate system-transform by delegation metadata | Prevents 804-char injection into non-prompt-enhance sessions | — Pending |
| Rebuild context-budget with real OpenCode data | Fake 15% linear model is inaccurate | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-06 after initialization*
