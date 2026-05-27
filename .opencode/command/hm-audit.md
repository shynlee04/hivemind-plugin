---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: Audit project directories, configuration files, active sessions, and lineage continuity for compliance.
argument-hint: "[--lineage] [--orphans] [--pressure]"
requires: []
validation-gates: ["lineage-continuity-audit", "workspace-health-check"]
output-templates: ["audit-report.md"]
coordination-model: "waiter-model"
completion-signals: ["audit-complete"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Scan project workspace for primitive drift, namespace integrity violations, and lifecycle configuration mismatches.
</objective>

<execution_context>
@.opencode/workflows/hm-audit.md
</execution_context>

<context>
Scope: $ARGUMENTS
Namespace: hm
Routed Agent: hm-nyquist-auditor
</context>

<process>
Execute end-to-end via hm-audit workflow. Generates AUDIT-REPORT.md summarizing issues and remediation steps.
</process>
