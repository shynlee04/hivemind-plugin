---
description: Run goal-backward verification on completed tasks to verify truths, artifacts, and key links.
argument-hint: "<phase-number> [--detailed]"
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---
<objective>
Run systematic checks against must-haves (truths, artifacts, key links) and output a VERIFICATION.md report.
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
---
