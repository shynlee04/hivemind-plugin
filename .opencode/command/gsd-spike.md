---
description: Rapidly spike an idea with throwaway experiments to validate feasibility before planning
argument-hint: "<idea to validate> [--quick]"
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
  question: true
---
<objective>
Rapid feasibility validation through focused, throwaway experiments. Each spike answers one
specific question with observable evidence. Spikes live in `.planning/spikes/` and integrate
with GSD commit patterns, state tracking, and handoff workflows.

Does not require `/gsd-new-project` — auto-creates `.planning/spikes/` if needed.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/spike.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`.
</runtime_note>

<context>
Idea: $ARGUMENTS

**Available flags:**
- `--quick` — Skip decomposition/alignment, jump straight to building. Use when you already know what to spike.
</context>

<process>
Execute the spike workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/spike.md end-to-end.
Preserve all workflow gates (decomposition, risk ordering, verification, MANIFEST updates, commit patterns).
</process>
