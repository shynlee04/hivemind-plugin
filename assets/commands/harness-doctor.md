---
description: "Run harness diagnostics. Checks configuration, agents, plugin control path, and harness health."
agent: hm-l0-orchestrator
subtask: false
---

Run a comprehensive health check on this harness installation:

1. **Config Check**: Read opencode.json and verify it has valid structure
2. **Agent Check**: List all agent files in .opencode/agents/ and verify they parse correctly
3. **Plugin Tool Check**: Verify root `opencode.json` points at the thin wrapper plugin path and that the loaded harness plugin provides the `delegate-task` control path for specialist execution
4. **Standalone Tool Check**: Verify standalone tools still match the current architecture, specifically `context-checkpoint_save` and `context-checkpoint_restore`, and confirm their repo-local persistence path remains valid without expecting removed or imaginary control tools as separate files
5. **Skills Check**: List skills in .opencode/skills/
6. **Commands Check**: List commands in .opencode/commands/
7. **Rules Check**: Verify .opencode/rules/harness-rules.md exists
8. **Permission Check**: Summarize the permission configuration and confirm conductor workflows are aligned with the plugin-based delegation path

Report any issues found and suggest fixes.
