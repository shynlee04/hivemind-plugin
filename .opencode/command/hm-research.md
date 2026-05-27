---
description: Perform multi-source research on APIs, dependencies, libraries, and design patterns.
argument-hint: "<topic-or-phase> [--depth 0|1|2|3] [--force]"
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
Conduct deep multi-source technical research on stack libraries, codebase patterns, and API contracts.
</objective>

<execution_context>
@.opencode/workflows/hm-research.md
</execution_context>

<context>
Topic: $ARGUMENTS
Namespace: hm
Routed Agents: hm-project-researcher, hm-synthesizer
</context>

<process>
Execute end-to-end via hm-research workflow. Produces RESEARCH.md files.
</process>
