---
namespace: hm
agent: hm-nyquist-auditor
subtask: true
description: Run L3 quality gate triad (lifecycle, spec compliance, and evidence truth) to authorize stage or phase graduation.
argument-hint: "<phase-number> [--triad-only]"
requires: ["hm-verify"]
validation-gates: ["lifecycle-gate", "spec-compliance-gate", "evidence-truth-gate"]
output-templates: ["gate-report.md"]
coordination-model: "waiter-model"
completion-signals: ["gate-passed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Evaluate if the phase satisfies the L3 quality gate triad (lifecycle integration, spec compliance, and evidence truth).
</objective>

<execution_context>
@.opencode/workflows/hm-gate.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-nyquist-auditor
</context>

<process>
Execute end-to-end via hm-gate workflow. Generates GATE-REPORT.md.
</process>
