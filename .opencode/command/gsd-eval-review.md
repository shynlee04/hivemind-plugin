---
description: Audit an executed AI phase's evaluation coverage and produce an EVAL-REVIEW.md remediation plan.
argument-hint: "[phase number]"
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  task: true
  question: true
---
<objective>
Conduct a retroactive evaluation coverage audit of a completed AI phase.
Checks whether the evaluation strategy from AI-SPEC.md was implemented.
Produces EVAL-REVIEW.md with score, verdict, gaps, and remediation plan.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/eval-review.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/references/ai-evals.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute @/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/eval-review.md end-to-end.
Preserve all workflow gates.
</process>
