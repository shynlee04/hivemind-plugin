---
namespace: hm
agent: hm-verifier
subtask: true
description: Verify completed phase deliverables against plan must-haves, truths, and links.
argument-hint: "<phase-number>"
requires: ["hm-execute"]
validation-gates: ["goal-backward-verification"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["verification-complete"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Audit the executed phase outcomes against plan must-haves (truths, artifacts, key links) to verify completion.
</objective>

<execution_context>
@.opencode/workflows/hm-verify.md
</execution_context>

<context>
Phase ID: $ARGUMENTS
Namespace: hm
Routed Agent: hm-verifier
</context>

<process>
Execute end-to-end via hm-verify workflow. Validates must-haves, outputs VERIFICATION.md report.
</process>
