---
name: gsd-ui-review
description: Retroactive 6-pillar visual audit of implemented frontend code
---

<objective>
Conduct a retroactive 6-pillar visual audit. Produces UI-REVIEW.md with
graded assessment (1-4 per pillar). Works on any project.
Output: {phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.trae/get-shit-done/workflows/ui-review.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.trae/get-shit-done/references/ui-brand.md
</execution_context>

<context>
Phase: {{GSD_ARGS}} — optional, defaults to last completed phase.
</context>

<process>
Execute @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.trae/get-shit-done/workflows/ui-review.md end-to-end.
Preserve all workflow gates.
</process>
