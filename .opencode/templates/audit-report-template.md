# {{scope}} — Audit Report

**Date:** {{date}}  
**Auditor:** HiveQ  
**Scope:** {{scope_description}}  
**Standards Applied:** {{standards_list}}  

---

## Executive Summary

- **P0 (Blocks Release):** {{p0_count}}
- **P1 (Before Milestone):** {{p1_count}}
- **P2 (Tech Debt):** {{p2_count}}
- **Total Findings:** {{total_findings}}

---

## Findings

| # | File | Issue | Severity | Evidence | Recommendation |
|---|------|-------|:--------:|----------|---------------|
{{finding_rows}}

---

## P0 Details (Blocking)

{{p0_details}}

---

## P1 Details (High Priority)

{{p1_details}}

---

## P2 Details (Tech Debt)

{{p2_details}}

---

## Standards Compliance Summary

| Standard | Checked | Pass | Fail | Coverage |
|----------|:-------:|:----:|:----:|:--------:|
{{standards_rows}}

---

## Methodology

- **Scope definition:** {{scope_method}}
- **Standards loaded:** {{standards_loaded}}
- **Tools used:** {{tools_used}}
- **Files scanned:** {{files_scanned}}

---

## Recommendations

{{recommendations}}
