---
namespace: hm
agent: hm-code-reviewer
subtask: true
description: "Retroactive 6-pillar visual audit of implemented frontend code"
argument-hint: "[phase]"
requires: ["hm-phase"]
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-summary.md"]
coordination-model: "waiter-model"
completion-signals: ["review-completed"]
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
Conduct a retroactive 6-pillar visual audit. Produces UI-REVIEW.md with
graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/ui-review.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS — optional, defaults to last completed phase.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
