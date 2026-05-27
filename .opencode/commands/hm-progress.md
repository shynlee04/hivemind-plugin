---
namespace: hm
agent: hm-orchestrator
subtask: false
description: "Check progress, advance workflow, or dispatch freeform intent — the unified Hivemind situational command"
argument-hint: "[--forensic | --next | --do \\"task description\\"]"
requires: ["hm-phase"]
validation-gates: ["lifecycle-gate"]
output-templates: []
coordination-model: "waiter-model"
completion-signals: ["progress-checked"]
tools:
  read: true
  bash: true
  grep: true
  glob: true
  skill: true
  question: true
---

<objective>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action.

Three modes:
- **default**: Show progress report + intelligently route to the next action (execute or plan). Provides situational awareness before continuing work.
- **--next**: Automatically advance to the next logical step without manual route selection. Reads STATE.md, ROADMAP.md, and phase directories. Supports `--force` to bypass safety gates.
- **--do "task description"**: Analyze freeform natural language and dispatch to the most appropriate Hivemind command. Never does the work itself — matches intent, confirms, hands off.
- **--forensic**: Append a 6-check integrity audit after the standard progress report.
</objective>

<flags>
- **--next**: Detect current project state and automatically invoke the next logical Hivemind workflow step. Scans all prior phases for incomplete work before routing. `--next --force` bypasses safety gates.
- **--next --auto**: Like `--next`, but after the determined step completes, automatically re-invokes `/hm-progress --next --auto` to continue chaining steps until completion or a blocking decision. Enables hands-free plan→execute→verify→complete progression.
- **--do "..."**: Smart dispatcher — match freeform intent to the best Hivemind command using routing rules, confirm the match, then hand off.
- **--forensic**: Run 6-check integrity audit after the standard progress report.
- **(no flag)**: Standard progress check + intelligent routing (Routes A through F).
</flags>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/progress.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/next.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/do.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/references/ui-brand.md
</execution_context>

<process>
Arguments provided: "$ARGUMENTS"
Parse the first token from the provided arguments:
- If it is `--next`: strip the flag, execute the next workflow (passing remaining args e.g. --force, --auto).
- If it is `--do`: strip the flag, pass remainder as freeform intent to the do workflow.
- Otherwise: execute the progress workflow end-to-end (pass --forensic through if present).

Preserve all routing logic from the target workflow.
</process>
