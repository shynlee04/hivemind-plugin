---
description: Execute all plans in a phase with wave-based parallelization, atomic commits, deviation handling, and checkpoint recovery. Routes through hm-executor and hm-verifier agents.
argument-hint: "<phase-number> [--wave N] [--gaps-only] [--interactive] [--tdd]"
tools:
  read: true
  write: true
  edit: true
  glob: true
  grep: true
  bash: true
  agent: true
  todowrite: true
  question: true
---
<objective>
Execute all plans in a phase using wave-based parallel execution with atomic commits, deviation handling, and goal-backward verification.
</objective>

<execution_context>
@.opencode/workflows/hm-execute-phase.md
</execution_context>

<context>
Phase: $ARGUMENTS
Executed by hm-execute-phase workflow.
All wave detection, agent dispatch, checkpoint handling, and verification logic lives in the workflow file.
</context>

<process>
Execute end-to-end via hm-execute-phase workflow. Preserve all workflow gates (wave execution, checkpoint handling, verification).
</process>
