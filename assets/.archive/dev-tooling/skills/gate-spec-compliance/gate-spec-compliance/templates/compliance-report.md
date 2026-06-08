# Spec Compliance Report

**Phase:** [Phase number and name]
**Date:** [ISO 8601 date]
**Evaluator:** [Agent or human name]
**Gate Context:** [code-review | phase-audit | milestone-verification | integration-check | deployment-readiness]
**Active Lenses:** [Primary: X, Secondary: Y | All three for deployment-readiness]

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Requirements | [n] |
| Requirements Passed | [n] |
| Requirements Failed | [n] |
| Requirements Blocked | [n] |
| HIGH Severity Gaps | [n] |
| Anti-Patterns Detected | [n] |
| **Verdict** | **[PASS | FAIL | BLOCKED]** |

---

## Decision Tree Results

| Node | Check | Result | Evidence |
|------|-------|--------|----------|
| 1 | SPEC has falsifiable requirements | [PASS/FAIL] | [REQ count, EARS compliance count] |
| 2 | Each requirement maps to PLAN task | [PASS/FAIL] | [Mapped count / Total count] |
| 3 | Each plan task maps to code artifact | [PASS/FAIL] | [Mapped count / Total count] |
| 4 | Each requirement maps to test case | [PASS/FAIL] | [Mapped count / Total count] |
| 5 | All tests pass | [PASS/FAIL] | [Test runner output summary] |
| 6 | No orphan code | [PASS/WARN] | [Orphan file list or "None"] |
| 7 | Acceptance criteria met | [PASS/FAIL] | [AC count passed / Total AC count] |

---

## Traceability Matrix Summary

| REQ-ID | Description | Code File | Test File | Status | Evidence |
|--------|-------------|-----------|-----------|--------|----------|
| REQ-[domain]-01 | [Description] | `src/[path]` | `tests/[path]` | PASS | [Evidence reference] |
| REQ-[domain]-02 | [Description] | `src/[path]` | `tests/[path]` | PASS | [Evidence reference] |

Full traceability matrix: [Link to RTM or inline matrix from traceability-matrix-template.md]

---

## Gap Analysis

| Gap Type | Severity | REQ-ID / File | Description | Resolution |
|----------|----------|---------------|-------------|------------|
| SPEC-WITHOUT-CODE | HIGH | [REQ-ID] | [What is missing] | [Resolution plan or blocker] |
| CODE-WITHOUT-SPEC | MEDIUM | [File path] | [Orphan code description] | [Review recommendation] |
| SPEC-WITHOUT-TEST | HIGH | [REQ-ID] | [What is missing] | [Resolution plan or blocker] |
| TEST-WITHOUT-SPEC | LOW | [Test file] | [Orphan test description] | [Document only] |

### Gap Count Summary

| Gap Type | Count | Blocking |
|----------|-------|----------|
| SPEC-WITHOUT-CODE | [n] | Yes |
| CODE-WITHOUT-SPEC | [n] | No |
| SPEC-WITHOUT-TEST | [n] | Yes |
| TEST-WITHOUT-SPEC | [n] | No |

---

## Acceptance Criteria Verification

| AC-ID | REQ-ID | EARS Type | GIVEN | WHEN | THEN | MEASURE | Result |
|-------|--------|-----------|-------|------|------|---------|--------|
| AC-[domain]-01 | REQ-[domain]-01 | [Type] | [State] | [Action] | [Outcome] | [Method] | PASS/FAIL/BLOCKED |
| AC-[domain]-02 | REQ-[domain]-02 | [Type] | [State] | [Action] | [Outcome] | [Method] | PASS/FAIL/BLOCKED |

### Vague AC Rejections

| AC-ID | Reason | Recommendation |
|-------|--------|----------------|
| [AC-ID] | [Why AC is vague] | [Route to hm-spec-driven-authoring or specific fix] |

---

## Perspective Findings

### [Primary Lens] Findings

| Finding | Criterion | Score | Evidence |
|---------|-----------|-------|----------|
| [Finding description] | [Criterion name] | [1-5] | [Evidence reference] |

### [Secondary Lens] Findings

| Finding | Criterion | Score | Evidence |
|---------|-----------|-------|----------|
| [Finding description] | [Criterion name] | [1-5] | [Evidence reference] |

*(For deployment readiness, include PM Findings, Architect Findings, and Dev Findings sections)*

---

## Anti-Pattern Scan

| Anti-Pattern | ID | Detected | Severity | Details |
|-------------|-----|----------|----------|---------|
| Coverage Theater | AP-01 | [Yes/No] | HIGH | [Details or "Not detected"] |
| Stale Matrix | AP-02 | [Yes/No] | HIGH | [Details or "Not detected"] |
| Single-Source Verification | AP-03 | [Yes/No] | MEDIUM | [Details or "Not detected"] |
| Trust Without Evidence | AP-04 | [Yes/No] | CRITICAL | [Details or "Not detected"] |
| Measuring Without Acting | AP-05 | [Yes/No] | MEDIUM | [Details or "Not detected"] |
| Orphan Artifact Drift | AP-06 | [Yes/No] | HIGH | [Details or "Not detected"] |
| Self-Certification | AP-07 | [Yes/No] | CRITICAL | [Details or "Not detected"] |

---

## Routing Decision

| Route | Target | Reason |
|-------|--------|--------|
| [PASS → gate-evidence-truth | FAIL → STOP | BLOCKED → return to caller] | [Reason] |

---

## Appendix: Verification Commands

```bash
# Tests
npm test

# Type check
npm run typecheck

# Coverage
npm run test:coverage

# Custom verification
[Additional commands used during evaluation]
```
