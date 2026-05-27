---
description: "[BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back."
argument-hint: "[phase-number]"
requires: [import, phase, plan-phase]
tools:
  read: true
  bash: true
  glob: true
  grep: true
---

<objective>
Offload Hivemind's plan phase to Claude Code's ultraplan cloud infrastructure.

Ultraplan drafts the plan in a remote cloud session while your terminal stays free.
Review and comment on the plan in your browser, then import it back via /hm-import --from.

⚠ BETA: ultraplan is in research preview. Use /hm-plan-phase for stable local planning.
Requirements: Claude Code v2.1.91+, claude.ai account, GitHub repository.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-ultraplan-phase.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-ui-brand.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the ultraplan-phase workflow end-to-end.
</process>
