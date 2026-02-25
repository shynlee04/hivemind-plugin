---
name: "hiveq-audit"
description: "Comprehensive audit of codebase or module against defined standards."
execution_context: "workflows/hiveq-audit-workflow.yaml"
required_skills:
  - "compliance-checking"
  - "verification-methodology"
required_templates:
  - "templates/audit-report-template.md"
chain_group: "hiveq"
entry_gate: "session_declared"
---

# HiveQ Audit

## Objective

Perform a comprehensive audit of the codebase, a specific module, or framework assets against defined quality standards.

## Process

1. **Define scope** — Identify what is being audited (full codebase, single module, asset group).
2. **Load standards** — Pull relevant quality criteria (LOC limits, CQRS compliance, naming conventions).
3. **Collect findings** — Scan files, run checks, compare against standards.
4. **Classify severity** — P0 (blocks release), P1 (must fix before milestone), P2 (tech debt).
5. **Report** — Produce structured audit report with findings and severity counts.

## Arguments

- `$ARGUMENTS` — Audit scope (e.g., "codebase", "src/lib/", "hivefiver module", "framework assets").

## Output

An audit report using `audit-report-template.md` with:
- Scope and methodology
- Standards applied
- Findings table (file, issue, severity, evidence)
- Severity summary (P0/P1/P2 counts)
- Recommendations
