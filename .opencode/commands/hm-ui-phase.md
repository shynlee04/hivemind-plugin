---
namespace: hm
agent: hm-planner
subtask: true
description: "Generate UI design contract (UI-SPEC.md) for frontend phases"
argument-hint: "[phase]"
requires: ["hm-phase"]
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-ui-spec.md"]
coordination-model: "waiter-model"
completion-signals: ["ui-spec-defined"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  webfetch: true
  question: true
  mcp__context7__*: true
---

<objective>
Create a UI design contract (UI-SPEC.md) for a frontend phase.
Orchestrates hm-ui-researcher and hm-ui-checker.
Flow: Validate → Research UI → Verify UI-SPEC → Done
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/workflows/ui-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/hivemind/references/ui-brand.md
</execution_context>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
