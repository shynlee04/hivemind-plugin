---
namespace: hm
agent: hm-phase-researcher
subtask: true
description: Conduct multi-source stack research and code mapping to produce standard RESEARCH.md context documentation.
argument-hint: "<phase-number> [--force] [--view]"
requires: []
validation-gates: ["stack-compatibility-audit"]
output-templates: ["hm-research.md"]
coordination-model: "waiter-model"
completion-signals: ["research-complete"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  webfetch: true
  mcp__context7__*: true
---
<objective>
Analyze required technical stack, mapping conventions, stack dependencies, and target implementation files.
</objective>

<execution_context>
@.opencode/workflows/hm-research.md
</execution_context>

<context>
Phase: $ARGUMENTS
Namespace: hm
Routed Agent: hm-phase-researcher
</context>

<process>
Execute end-to-end via hm-research workflow. Produces technical stack summary and generates RESEARCH.md.
</process>
