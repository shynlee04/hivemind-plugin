---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Stack multiple skills together for a specific workflow. Triggers: 'stack skills', 'combine skills', 'chain skills for...'"
argument-hint: ""
requires: []
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["task-completed"]
tools:
  read: true
  bash: true
---


<objective>
Stack 2-3 skills together for a specific workflow. Validates compatibility, sets loading order, produces stacked skill config.

Max 3 skills per stack. If you can't explain why each is needed, don't stack it.
</objective>

<execution_context>
@.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/stack.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the stack workflow from @.hivefiver-hm-meta-builder/workflows-lab/active/refactoring/stack.md end-to-end.
Preserve all workflow gates (compatibility check, loading order, validation).
</process>
