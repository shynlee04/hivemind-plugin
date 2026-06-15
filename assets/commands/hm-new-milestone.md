---
namespace: hm
agent: hm-roadmapper
subtask: false
description: "Start a new milestone cycle — update PROJECT.md and route to requirements"
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
requires: ["hm-new-project", "hm-phase", "hm-plan-phase"]
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-milestone.md"]
coordination-model: "waiter-model"
completion-signals: ["milestone-created"]
tools:
  read: true
  write: true
  bash: true
  agent: true
  question: true
---

<objective>
Start a new milestone: questioning → research (optional) → requirements → roadmap.

Brownfield equivalent of new-project. Project exists, PROJECT.md has history. Gathers "what's next", updates PROJECT.md, then runs requirements → roadmap cycle.

**Creates/Updates:**
- `.planning/PROJECT.md` — updated with new milestone goals
- `.planning/research/` — domain research (optional, NEW features only)
- `.planning/REQUIREMENTS.md` — scoped requirements for this milestone
- `.planning/ROADMAP.md` — phase structure (continues numbering)
- `.planning/STATE.md` — reset for new milestone

**After:** `/hm-plan-phase [N]` to start execution.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-new-milestone.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-questioning.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-ui-brand.md
@/Users/apple/hivemind-plugin-private/.opencode/templates/hm-project.md
@/Users/apple/hivemind-plugin-private/.opencode/templates/hm-requirements.md
</execution_context>

<context>
Milestone name: $ARGUMENTS (optional - will prompt if not provided)

Project and milestone context files are resolved inside the workflow (`init new-milestone`) and delegated via `<files_to_read>` blocks where subagents are used.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (validation, questioning, research, requirements, roadmap approval, commits).
</process>
