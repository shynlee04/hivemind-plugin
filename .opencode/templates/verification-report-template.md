# {{phase}} — Verification Report

**Date:** {{date}}  
**Verifier:** HiveQ  
**Target:** {{target_description}}  
**Overall Verdict:** {{overall_verdict}}  

---

## Acceptance Criteria

| # | Criterion | Evidence | Verdict | Notes |
|---|-----------|----------|:-------:|-------|
{{criteria_rows}}

---

## Evidence Details

### Criterion {{criterion_1_id}}: {{criterion_1_description}}

**Command:** `{{criterion_1_command}}`

**Output:**
```
{{criterion_1_output}}
```

**Verdict:** {{criterion_1_verdict}}

### Criterion {{criterion_2_id}}: {{criterion_2_description}}

**Command:** `{{criterion_2_command}}`

**Output:**
```
{{criterion_2_output}}
```

**Verdict:** {{criterion_2_verdict}}

---

## Coverage Gaps

| # | Criterion | Gap Description | Impact |
|---|-----------|----------------|--------|
{{gap_rows}}

---

## Summary

- **Total criteria:** {{total_criteria}}
- **PASS:** {{pass_count}}
- **FAIL:** {{fail_count}}
- **INCONCLUSIVE:** {{inconclusive_count}}

**Overall Verdict:** {{overall_verdict}}

**Blocking Issues:**
{{blocking_issues}}

**Recommendations:**
{{recommendations}}
