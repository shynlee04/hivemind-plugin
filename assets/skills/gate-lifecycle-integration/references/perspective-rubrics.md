# Perspective Rubrics

Contextual scoring rubrics for the three evaluation perspectives. Each
evaluation activates a primary and secondary lens based on the current
workflow context. See SKILL.md for the context-to-lens mapping table.

## Dev Lens (Primary for Code Review, Secondary for Integration Check)

Scores code-level correctness on a 1-5 scale.

### D1: Interface Correctness (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | All function signatures match OpenCode SDK contracts. Return types are explicit. Error paths return [Harness]-prefixed messages. No `any` types. |
| 4 | Signatures correct, one minor type looseness (e.g., `Record<string, unknown>` where specific shape exists). |
| 3 | Most signatures correct, but 1-2 use implicit any or missing return type. |
| 2 | Signature mismatch with SDK expectations. Tool returns unstructured data. |
| 1 | Function does not match OpenCode tool/hook interface at all. |

### D2: Error Handling (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | All error paths produce [Harness]-prefixed messages. Try/catch on every async boundary. Hooks silently absorb errors. |
| 4 | Error handling present but one path missing [Harness] prefix. |
| 3 | Most errors handled, but hook error boundary missing. |
| 2 | Errors thrown without prefix, or catch blocks silently swallow. |
| 1 | No error handling on async operations. |

### D3: Test Coverage (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | Test file mirrors source structure. Edge cases covered. Uses vitest globals correctly. |
| 4 | Tests exist for main paths but missing edge cases. |
| 3 | Basic happy-path tests only. |
| 2 | Test file exists but tests are incomplete or flaky. |
| 1 | No test file for the module. |

### D4: Code Hygiene (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | Under LOC limit. No dead code. No `any`. Deep-clone-on-read where needed. |
| 4 | Under LOC limit, one `any` type or minor dead code. |
| 3 | Under LOC limit but multiple hygiene issues. |
| 2 | Approaching LOC limit with hygiene issues. |
| 1 | Over LOC limit or severe hygiene problems. |

**Dev Passing Threshold:** Weighted average ≥ 3.5

---

## Architect Lens (Primary for Phase Audit/Integration Check, Secondary for Code Review/Milestone)

Scores structural integrity on a 1-5 scale.

### A1: Dependency Graph (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | Dependency chain ≤ 2 levels. No circular dependencies. `types.ts` is leaf. Module boundaries respected. |
| 4 | Chain correct, one module importing from an unexpected layer. |
| 3 | Chain correct but imports cross module boundaries unnecessarily. |
| 2 | Dependency chain exceeds 2 levels or circular dependency detected. |
| 1 | No discernible module structure. |

### A2: CQRS Boundary (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | Write-side (tools) and read-side (hooks) strictly separated. No cross-boundary calls. Events flow write→read only. |
| 4 | Boundaries correct, one minor read in a tool that does not affect state. |
| 3 | Boundaries mostly correct but one hook reads continuity and makes a decision based on it (acceptable if documented). |
| 2 | Hook calls patchSessionContinuity() without documented exception. |
| 1 | Tool observes events directly or hook dispatches delegations. |

### A3: Classification Fit (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | Every artifact in correct root (src/, .opencode/, .hivemind/). No cross-contamination. |
| 4 | Correct placement, one borderline case documented. |
| 3 | Mostly correct, one file misplaced but not harmful. |
| 2 | State stored in .opencode/ or skills referencing src/ internals. |
| 1 | Severe cross-contamination (state in skills, tools in .hivemind/). |

### A4: Size and Cohesion (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | All modules < 500 LOC. Plugin < 200 LOC. Single responsibility per module. |
| 4 | All under limits, one module at 90% of limit. |
| 3 | All under limits, multiple modules approaching threshold. |
| 2 | One module exceeds limit. |
| 1 | Multiple modules exceed limit, no cohesion. |

**Architect Passing Threshold:** Weighted average ≥ 3.5

---

## PM Lens (Primary for Milestone Verification, Secondary for Phase Audit)

Scores deliverable completeness on a 1-5 scale.

### P1: Deliverable Completeness (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | All planned features implemented. No stubs. No TODO markers in production code. |
| 4 | All features implemented, one minor stub for deferred work. |
| 3 | Most features implemented, one significant feature deferred. |
| 2 | Multiple features missing or stubbed. |
| 1 | Less than half of planned deliverables present. |

### P2: Documentation Alignment (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | AGENTS.md, types.ts, and implementation all consistent. No stale references. |
| 4 | Mostly aligned, one stale reference or outdated comment. |
| 3 | Documentation exists but 2-3 inaccuracies vs implementation. |
| 2 | Significant drift between docs and code. |
| 1 | No documentation or entirely stale. |

### P3: Scope Retention (weight: 2x)

| Score | Criteria |
|-------|----------|
| 5 | Implementation matches phase scope exactly. No feature creep. No scope reduction. |
| 4 | Minor scope adjustment justified and documented. |
| 3 | Scope expanded by one small feature or reduced by one. |
| 2 | Significant scope change without documentation. |
| 1 | Implementation bears little resemblance to plan. |

### P4: Integration Readiness (weight: 1x)

| Score | Criteria |
|-------|----------|
| 5 | Module integrates cleanly. No breaking changes to existing interfaces. All tests pass. |
| 4 | Integrates with one non-breaking adjustment needed. |
| 3 | Integrates but requires coordination with another module's changes. |
| 2 | Breaking change to existing interface. |
| 1 | Cannot integrate without significant rework. |

**PM Passing Threshold:** Weighted average ≥ 3.5

---

## Deployment Readiness (All Three Lenses)

For deployment readiness evaluation, run all three lens sets. A deployment
passes only when ALL three pass their individual thresholds:

- Dev weighted average ≥ 3.5
- Architect weighted average ≥ 3.5
- PM weighted average ≥ 3.5

Any single lens failure blocks deployment.
