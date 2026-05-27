---
description: Generate an AI-SPEC.md design contract for phases that involve building AI systems.
argument-hint: "[phase number]"
requires: [phase]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
  webfetch: true
  websearch: true
  question: true
  mcp__context7__*: true
---
<objective>
Create an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrates hm-framework-selector → hm-ai-researcher → hm-domain-researcher → hm-eval-planner.
Flow: Select Framework → Research Docs → Research Domain → Design Eval Strategy → Done
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/ai-integration-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-frameworks.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/ai-evals.md
</execution_context>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates.
</process>
