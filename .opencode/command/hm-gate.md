---
description: Run the L3 quality gate triad (lifecycle-integration -> spec-compliance -> evidence-truth) to certify completeness and safety.
argument-hint: "<phase-number> [--gate lifecycle|spec|evidence]"
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Execute the sequence of L3 quality gates to validate architectural compliance, requirement coverage, and evidence validity.
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
Execute end-to-end via hm-gate workflow. Produces GATE-REPORT.md.
</process>
