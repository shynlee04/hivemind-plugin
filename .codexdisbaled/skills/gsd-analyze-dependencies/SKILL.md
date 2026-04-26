---
name: "gsd-analyze-dependencies"
description: "Analyze phase dependencies and suggest Depends on entries for ROADMAP.md"
metadata:
  short-description: "Analyze phase dependencies and suggest Depends on entries for ROADMAP.md"
---

<codex_skill_adapter>
## A. Skill Invocation
- This skill is invoked by mentioning `$gsd-analyze-dependencies`.
- Treat all user text after `$gsd-analyze-dependencies` as `{{GSD_ARGS}}`.
- If no arguments are present, treat `{{GSD_ARGS}}` as empty.

## B. AskUserQuestion → request_user_input Mapping
GSD workflows use `AskUserQuestion` (Claude Code syntax). Translate to Codex `request_user_input`:

Parameter mapping:
- `header` → `header`
- `question` → `question`
- Options formatted as `"Label" — description` → `{label: "Label", description: "description"}`
- Generate `id` from header: lowercase, replace spaces with underscores

Batched calls:
- `AskUserQuestion([q1, q2])` → single `request_user_input` with multiple entries in `questions[]`

Multi-select workaround:
- Codex has no `multiSelect`. Use sequential single-selects, or present a numbered freeform list asking the user to enter comma-separated numbers.

Execute mode fallback:
- When `request_user_input` is rejected (Execute mode), present a plain-text numbered list and pick a reasonable default.

## C. Task() → spawn_agent Mapping
GSD workflows use `Task(...)` (Claude Code syntax). Translate to Codex collaboration tools:

Direct mapping:
- `Task(subagent_type="X", prompt="Y")` → `spawn_agent(agent_type="X", message="Y")`
- `Task(model="...")` → omit (Codex uses per-role config, not inline model selection)
- `fork_context: false` by default — GSD agents load their own context via `<files_to_read>` blocks

Parallel fan-out:
- Spawn multiple agents → collect agent IDs → `wait(ids)` for all to complete

Result parsing:
- Look for structured markers in agent output: `CHECKPOINT`, `PLAN COMPLETE`, `SUMMARY`, etc.
- `close_agent(id)` after collecting results from each agent
</codex_skill_adapter>

<objective>
Analyze the phase dependency graph for the current milestone. For each phase pair, determine if there is a dependency relationship based on:
- File overlap (phases that modify the same files must be ordered)
- Semantic dependencies (a phase that uses an API built by another phase)
- Data flow (a phase that consumes output from another phase)

Then suggest `Depends on` updates to ROADMAP.md.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.codex/get-shit-done/workflows/analyze-dependencies.md
</execution_context>

<context>
No arguments required. Requires an active milestone with ROADMAP.md.

Run this command BEFORE `/gsd-manager` to fill in missing `Depends on` fields and prevent merge conflicts from unordered parallel execution.
</context>

<process>
Execute the analyze-dependencies workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.codex/get-shit-done/workflows/analyze-dependencies.md end-to-end.
Present dependency suggestions clearly and apply confirmed updates to ROADMAP.md.
</process>
