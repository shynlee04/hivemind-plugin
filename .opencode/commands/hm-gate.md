---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: Run the L3 quality gate triad (lifecycle, spec compliance, evidence truth) for the target phase.
argument-hint: "<phase-number>"
requires: ["hm-verify"]
validation-gates: ["lifecycle-gate", "spec-gate", "evidence-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["gate-cleared"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Evaluate the target phase against the Lifecycle, Spec Compliance, and Evidence Truth L3 gates.
</objective>

<execution_context>
@.opencode/workflows/hm-gate.md
</execution_context>

<context>
Phase ID: $ARGUMENTS
Namespace: hm
Routed Agent: hm-nyquist-auditor
</context>

<process>
Execute end-to-end via hm-gate workflow. Outputs compliance report and blocks merge if any gate fails.
</process>
