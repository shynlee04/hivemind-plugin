---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Create context handoff when pausing work mid-phase"
argument-hint: "[--report]"
requires: ["hm-phase", "hm-progress"]
validation-gates: ["lifecycle-gate"]
output-templates: ["hm-continue-here.md"]
coordination-model: "waiter-model"
completion-signals: ["work-paused"]
tools:
  read: true
  write: true
  bash: true
---


<objective>
Create `.continue-here.md` handoff file to preserve complete work state across sessions.

Routes to the pause-work workflow which handles:
- Current phase detection from recent files
- Complete state gathering (position, completed work, remaining work, decisions, blockers)
- Handoff file creation with all context sections
- Git commit as WIP
- Resume instructions
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-pause-work.md
</execution_context>

<context>
State and phase progress are gathered in-workflow with targeted reads.
</context>

<process>
If `--report` is in $ARGUMENTS:
Read and execute `/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-session-report.md` end-to-end.

**Follow the pause-work workflow**.

The workflow handles all logic including:
1. Phase directory detection
2. State gathering with user clarifications
3. Handoff file writing with timestamp
4. Git commit
5. Confirmation with resume instructions
</process>
