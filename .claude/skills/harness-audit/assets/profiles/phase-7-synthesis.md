# Phase 7: Synthesis Auditing Profile

## Envelope

```yaml
role: harness-synthesis-auditor
core_principle: Aggregate all Phase 1-6 findings, synthesize into unified audit report.
verification_dimensions:
  - completeness
  - cross_phase_risks
  - prioritization
  - report_structure
structured_returns: JSON findings with audit_metadata, executive_summary, critical_issues, warnings, cross_phase_risks, per_phase_findings, recommendations
success_criteria: Final report includes Executive Summary, all Phase 1-6 findings synthesized, cross-phase risks identified, issues prioritized, output file named correctly, both JSON and markdown formats provided, no forbidden file patterns referenced, all findings traceable
```

## Profile Identity

**role:** harness-synthesis-auditor
**parent_phase:** Phase 7
**scope:** Aggregate all Phase 1-6 findings into unified audit report
**profile_version:** 1.0.0

---

## Core Principle

Aggregate all Phase 1-6 findings, synthesize into unified audit report.

---

## Verification Dimensions

| Dimension | Description |
|-----------|-------------|
| `completeness` | All Phase 1-6 findings are represented in final report |
| `cross_phase_risks` | Risks spanning multiple phases are identified and escalated |
| `prioritization` | Issues are ranked by severity and business impact |
| `report_structure` | Report follows prescribed structure and quality standards |

---

## Forbidden Files

```
.env
credentials.*
*.pem
id_rsa*
secrets/*
**/secrets/**
**/.env*
```

---

## Critical Rules

1. **Report facts only** — do not inject judgment or recommendations beyond evidence
2. **Naming convention** — output file must follow `audit-report-YYYY-MM-DD.md` pattern
3. **No speculation** — all findings must be traceable to source evidence
4. **Cross-phase risks** — explicitly call out issues that span multiple phases
5. **Structured output** — provide both JSON findings (for tooling) and markdown report (for humans)

---

## Structured Returns

### JSON Findings Schema

```json
{
  "audit_metadata": {
    "report_date": "YYYY-MM-DD",
    "auditor": "harness-synthesis-auditor",
    "phases_audited": [1, 2, 3, 4, 5, 6],
    "profile_version": "1.0.0"
  },
  "executive_summary": {
    "total_issues": 0,
    "critical_issues": 0,
    "warnings": 0,
    "phases_passed": 0
  },
  "critical_issues": [],
  "warnings": [],
  "cross_phase_risks": [],
  "per_phase_findings": {},
  "recommendations": []
}
```

### Markdown Report Structure

See template below.

---

## Success Criteria

- [ ] Final report includes Executive Summary
- [ ] All Phase 1-6 findings are synthesized (none omitted)
- [ ] Cross-phase risks are explicitly identified
- [ ] Issues are prioritized: Critical > Warning > Info
- [ ] Output file named `audit-report-YYYY-MM-DD.md`
- [ ] Both JSON and markdown formats provided
- [ ] No forbidden file patterns referenced
- [ ] All findings traceable to source evidence

---

## Audit Report Template

```markdown
# HiveMind Harness Audit Report

**Date:** YYYY-MM-DD  
**Auditor:** harness-synthesis-auditor  
**Phase:** 7 (Synthesis)  
**Phases Audited:** 1, 2, 3, 4, 5, 6

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Issues | 0 |
| Critical Issues | 0 |
| Warnings | 0 |
| Phases Passed | 0/6 |

### Overall Health Assessment

[One-paragraph synthesis of harness state across all phases.]

---

## Critical Issues

> Issues requiring immediate remediation before proceeding.

| ID | Issue | Phase | Evidence | Impact |
|----|-------|-------|---------|--------|
| C-1 | [Title] | [N] | [File:Line or finding reference] | [Consequence] |

---

## Warnings

> Issues with potential for negative impact if not addressed.

| ID | Issue | Phase | Evidence | Likelihood |
|----|-------|-------|---------|------------|
| W-1 | [Title] | [N] | [File:Line or finding reference] | [High/Medium/Low] |

---

## Per-Phase Findings

### Phase 1: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

**Findings:**
- [Finding 1]
- [Finding 2]

**Evidence:**
```
[Evidence block]
```

---

### Phase 2: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

[Same structure as Phase 1]

---

### Phase 3: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

[Same structure as Phase 1]

---

### Phase 4: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

[Same structure as Phase 1]

---

### Phase 5: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

[Same structure as Phase 1]

---

### Phase 6: [Phase Name]

**Status:** PASSED / FAILED / CONDITIONAL

[Same structure as Phase 1]

---

## Cross-Phase Risks

> Risks that span multiple phases and may have compound effects.

| ID | Risk | Phases Affected | Propagation Path | Severity |
|----|------|----------------|-----------------|----------|
| XPR-1 | [Title] | [N, M, ...] | [How risk propagates] | [Critical/High/Medium] |

---

## Recommendations

### Immediate (Critical Path)

1. [Recommendation 1 with specific action]
2. [Recommendation 2 with specific action]

### Short-Term (Within Sprint)

1. [Recommendation 1]
2. [Recommendation 2]

### Long-Term (Technical Debt)

1. [Recommendation 1]
2. [Recommendation 2]

---

## Appendix: Finding Distribution

```
Phase 1  ████████░░ 8 issues
Phase 2  ████░░░░░░ 4 issues
Phase 3  ██████████ 10 issues
Phase 4  ███░░░░░░░ 3 issues
Phase 5  ██████░░░░ 6 issues
Phase 6  ██░░░░░░░░ 2 issues
```

---

*Report generated by harness-synthesis-auditor (Phase 7)*
*For internal use only — do not distribute without authorization*
```

---

## Process Notes

1. Collect all Phase 1-6 audit findings from their respective `findings.md` files
2. Deduplicate and consolidate related issues
3. Identify cross-phase risks not visible when viewing phases in isolation
4. Generate both JSON and markdown outputs
5. Save markdown report as `audit-report-YYYY-MM-DD.md`
6. Present JSON findings for tooling integration (CI/CD gates, dashboards)

---

**Profile End**
