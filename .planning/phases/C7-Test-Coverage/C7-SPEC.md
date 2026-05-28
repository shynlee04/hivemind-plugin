# C7: Test Coverage Specification

**Phase:** C7-Test-Coverage  
**Date:** 2026-05-28  
**Status:** Spec Complete (Gate Passed)  
**Ambiguity Score:** 0.1725 (≤ 0.20)  
**Requirements:** 5

---

## Goal

Improve test coverage across the codebase by:
1. Adding tests to ALL hooks (regardless of current test count)
2. Creating integration tests for risk-prioritized untested modules
3. Enforcing stricter coverage thresholds (90/80/90/90)

---

## Requirements (Falsifiable)

| REQ | Description | Current State | Target State | Acceptance Criterion |
|-----|-------------|---------------|--------------|---------------------|
| **REQ-01** | Add tests to ALL hooks | Some hooks have < 5 tests | Every hook has ≥ 5 test cases | `npx vitest run tests/hooks/ --reporter=verbose` shows ≥ 5 tests per hook file |
| **REQ-02** | Integration tests for risk-prioritized modules | 2 integration test files exist | ≥ 10 integration test files covering high-risk modules | `ls tests/integration/*.test.ts \| wc -l` ≥ 10 |
| **REQ-03** | Enforce 90/80/90/90 thresholds | Current: 85/72/85/85 | 90/80/90/90 enforced | `.config/vitest.config.ts` has `thresholds: { statements: 90, branches: 80, functions: 90, lines: 90 }` |
| **REQ-04** | Coverage measurement | Inconsistent measurement | Per-module coverage reported | `npm run test:coverage` generates coverage report with per-module breakdown |
| **REQ-05** | Test quality gates | No quality gates | All new tests pass quality checks | `npm run typecheck` + `npm test` pass, no `as any` in new tests |

---

## In Scope

- Adding test cases to ALL 15 hooks in `src/hooks/`
- Creating integration tests for high-risk untested modules
- Updating `.config/vitest.config.ts` with 90/80/90/90 thresholds
- Updating `package.json` test scripts if needed
- Modifying existing test files to improve coverage
- Refactoring test helpers/utilities for better coverage

---

## Out of Scope

- Modifying production source code (tests only)
- Adding external test dependencies
- Changing test framework (vitest stays)
- Modifying CI/CD pipelines (coverage thresholds only)
- Creating mocks for external services

---

## Risk-Based Module Priority (REQ-02)

High-risk modules for integration testing:
1. `src/coordination/delegation/` — core delegation logic
2. `src/task-management/continuity/` — persistence layer
3. `src/features/session-tracker/` — session management
4. `src/coordination/completion/` — completion detection
5. `src/tools/delegation/` — tool interfaces

---

## Constraints

- **No external packages** — use existing `vitest@4.1.7`, `typescript`, `zod`
- **No behavioral changes** — tests only, no production code logic changes
- **TDD approach** — RED → GREEN → REFACTOR for new tests
- **Max 500 LOC** per test module
- **Atomic commits** — one concern per commit
- **Commit format** — `fix(C7): what was fixed — why it matters`

---

## Ambiguity Report

| Dimension | Score | Status | Notes |
|-----------|-------|--------|-------|
| Goal Clarity | 0.85 | ✓ | Clear: all hooks + risk-based integration + 90/80/90/90 |
| Boundary Clarity | 0.80 | ✓ | Clear: add + modify + refactor, tests only |
| Constraint Clarity | 0.85 | ✓ | Clear: no external packages, vitest, 500 LOC max |
| Acceptance Criteria | 0.80 | ✓ | Clear: specific thresholds, file counts, typecheck pass |

**Ambiguity:** 0.1725 (gate: ≤ 0.20) — **PASS**

---

## Verification Method

1. **Test execution:** `npm test` — all tests pass
2. **Type checking:** `npm run typecheck` — zero errors
3. **Coverage report:** `npm run test:coverage` — per-module breakdown
4. **Threshold enforcement:** `.config/vitest.config.ts` — 90/80/90/90 values
5. **Integration test count:** `ls tests/integration/*.test.ts | wc -l` ≥ 10

---

## Success Criteria

| Criteria | Status |
|----------|---------|
| All 15 hooks have ≥ 5 test cases | Pending |
| ≥ 10 integration test files | Pending |
| 90/80/90/90 thresholds enforced | Pending |
| Coverage report generates per-module breakdown | Pending |
| `npm run typecheck` + `npm test` pass | Pending |
