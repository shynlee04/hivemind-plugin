---
name: hivemind-compact
description: "[DEPRECATED - Use /hivemind-session-combo instead] Archive session with full validation"
owner_agent: hiveminder
kind: utility
alias_resolved_to: hivemind-session-combo
required_skills:
  - delegation-intelligence
  - context-integrity
  - evidence-discipline
required_templates: []
chain_group: hiveminder
group: hiveminder
entry_gate: session_declared
deprecated: true
redirect_to: hivemind-session-combo
---
# ⚠️ DEPRECATED: Use /hivemind-session-combo Instead

This command is deprecated. Use the new combo command:

```bash
/hivemind-session-combo
```

The combo includes:
1. Pre-flight scan and drift check
2. Strict gate validation (no pending changes)
3. Session close with context preservation
4. Auto-export for handoff

See `/hivemind-session-combo` for full documentation.
