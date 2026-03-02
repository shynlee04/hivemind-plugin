---
id: "VALIDATION-${TYPE}${ID}"
type: validation
scope: "${SCOPE}"
target: "${TYPE}${ID}"
phase: planning
status: pending
created: "${DATE}"
last_updated: "${DATE}"
checks_passed: 0
checks_total: 0
---

# Validation: ${TARGET_TITLE}

> **Target**: [`${TYPE}${ID}-PLAN.md`](./${TYPE}${ID}-PLAN.md) | **Phase**: `planning`
> **Status**: `pending` — ${CHECKS_PASSED}/${CHECKS_TOTAL} checks passed

---

## Structural Checks

| # | Check | Status | Evidence | Date |
|---|-------|--------|----------|------|
| 1 | YAML frontmatter valid and parsable | ⬜ | <!-- command output --> | |
| 2 | All children listed in parent's branch table | ⬜ | <!-- grep evidence --> | |
| 3 | Naming convention matches `[TYPE][ID]-*-PLAN.md` | ⬜ | <!-- ls/find output --> | |
| 4 | Symlinks resolve to valid paths | ⬜ | <!-- path check --> | |
| 5 | No orphan files (every file linked from parent) | ⬜ | <!-- cross-ref --> | |

## Content Checks

| # | Check | Status | Evidence | Date |
|---|-------|--------|----------|------|
| 6 | Context section filled (not placeholder) | ⬜ | <!-- content check --> | |
| 7 | Completion criteria defined | ⬜ | <!-- exists check --> | |
| 8 | Dependencies declared and resolvable | ⬜ | <!-- dep check --> | |
| 9 | No contradictions with parent plan | ⬜ | <!-- cross-read --> | |
| 10 | Risks identified (if root/sub level) | ⬜ | <!-- exists check --> | |

## Gap Analysis

<!-- Delegated sub-agent findings go here -->
<!-- Format: [DATE] [AGENT] [SEVERITY] finding -->

| Severity | Gap | Location | Recommendation |
|----------|-----|----------|---------------|
| <!-- H/M/L --> | <!-- description --> | <!-- file:line --> | <!-- action --> |

---

## Decision Rationale Audit

<!-- Are all decisions in <decisions> sections backed by rationale? -->

| Plan File | Decisions Found | With Rationale | Missing Rationale |
|-----------|----------------|----------------|-------------------|
| <!-- file --> | <!-- count --> | <!-- count --> | <!-- list --> |

---

<footer>

## Validator Notes

<!-- Who validated, when, any caveats -->

</footer>
