---
description: Rapidly sketch UI/design ideas using throwaway HTML mockups with multi-variant exploration
argument-hint: "<design idea to explore> [--quick]"
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
Explore design directions through throwaway HTML mockups before committing to implementation.
Each sketch produces 2-3 variants for comparison. Sketches live in `.planning/sketches/` and
integrate with GSD commit patterns, state tracking, and handoff workflows.

Does not require `/gsd-new-project` — auto-creates `.planning/sketches/` if needed.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/sketch.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/ui-brand.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/sketch-theme-system.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/sketch-interactivity.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/sketch-tooling.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/references/sketch-variant-patterns.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `question`.
</runtime_note>

<context>
Design idea: $ARGUMENTS

**Available flags:**
- `--quick` — Skip mood/direction intake, jump straight to decomposition and building. Use when the design direction is already clear.
</context>

<process>
Execute the sketch workflow from @/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/sketch.md end-to-end.
Preserve all workflow gates (intake, decomposition, variant evaluation, MANIFEST updates, commit patterns).
</process>
