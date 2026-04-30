---
description: Package spike findings into a persistent project skill for future build conversations
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
Curate spike experiment findings and package them into a persistent project skill that the agent
auto-loads in future build conversations. Also writes a summary to `.planning/spikes/` for
project history. Output skill goes to `./.opencode/skills/spike-findings-[project]/` (project-local).
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/spike-wrap-up.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/ui-brand.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`.
</runtime_note>

<process>
Execute the spike-wrap-up workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/spike-wrap-up.md end-to-end.
Preserve all workflow gates (auto-include, feature-area grouping, skill synthesis, AGENTS.md routing line, intelligent next-step routing).
</process>
