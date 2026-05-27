---
namespace: hm
agent: hm-verifier
subtask: true
description: Verify that implemented features meet the roadmap and phase objectives using goal-backward verification of truths, artifacts, and key links.
argument-hint: "<phase-number> [--quick] [--interactive]"
requires: ["hm-execute"]
validation-gates: ["goal-backward-verification", "artifact-integrity-check"]
output-templates: ["hm-verification.md"]
coordination-model: "waiter-model"
completion-signals: ["verification-passed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  question: true
---
<objective>
Perform goal-backward validation of truths, artifacts, and key links for the target phase to ensure zero regressions.
</objective>

<execution_context>
@.opencode/workflows/hm-verify.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-verifier
</context>

<process>
Execute end-to-end via hm-verify workflow. Generates VERIFICATION.md.
</process>
