---
description: Retroactive 6-pillar visual audit of implemented frontend code
argument-hint: "[phase]"
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
Conduct a retroactive 6-pillar visual audit. Produces UI-REVIEW.md with
graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/ui-review.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute @/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/ui-review.md end-to-end.
Preserve all workflow gates.
</process>
