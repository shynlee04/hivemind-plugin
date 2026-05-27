---
description: Configure Hivemind workflow toggles and model profile
requires: [quick]
tools:
  read: true
  write: true
  bash: true
  question: true
---

<objective>
Interactive configuration of Hivemind workflow agents and model profile via multi-question prompt.

Routes to the settings workflow which handles:
- Config existence ensuring
- Current settings reading and parsing
- Interactive 5-question prompt (model, research, plan_check, verifier, branching)
- Config merging and writing
- Confirmation display with quick command references
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/workflows/hm-settings.md
</execution_context>

<process>
Execute end-to-end.
</process>
