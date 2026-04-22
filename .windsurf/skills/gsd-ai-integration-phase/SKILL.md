---
name: gsd-ai-integration-phase
description: "Generate AI design contract (AI-SPEC.md) for phases that involve building AI systems — framework selection, implementation guidance from official docs, and evaluation strategy"
---

<windsurf_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `gsd-ai-integration-phase` or describes a task matching this skill.
- Treat all user text after the skill mention as `{{GSD_ARGS}}`.
- If no arguments are present, treat `{{GSD_ARGS}}` as empty.

## B. User Prompting
When the workflow needs user input, prompt the user conversationally:
- Present options as a numbered list in your response text
- Ask the user to reply with their choice
- For multi-select, ask for comma-separated numbers

## C. Tool Usage
Use these Windsurf tools when executing GSD workflows:
- `Shell` for running commands (terminal operations)
- `StrReplace` for editing existing files
- `Read`, `Write`, `Glob`, `Grep`, `Task`, `WebSearch`, `WebFetch`, `TodoWrite` as needed

## D. Subagent Spawning
When the workflow needs to spawn a subagent:
- Use `Task(subagent_type="generalPurpose", ...)`
- The `model` parameter maps to Windsurf's model options (e.g., "fast")
</windsurf_skill_adapter>

<objective>
Create an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrates gsd-framework-selector → gsd-ai-researcher → gsd-domain-researcher → gsd-eval-planner.
Flow: Select Framework → Research Docs → Research Domain → Design Eval Strategy → Done
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.windsurf/get-shit-done/workflows/ai-integration-phase.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.windsurf/get-shit-done/references/ai-frameworks.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.windsurf/get-shit-done/references/ai-evals.md
</execution_context>

<context>
Phase number: {{GSD_ARGS}} — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.windsurf/get-shit-done/workflows/ai-integration-phase.md end-to-end.
Preserve all workflow gates.
</process>
