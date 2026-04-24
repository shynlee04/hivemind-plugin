---
description: "Configure OpenCode primitives (agents, commands, skills) programmatically. Supports --from-file, --scope, --dry-run flags. Triggers: 'configure agent', 'batch configure', 'agent setup', 'configure command'."
agent: hivefiver-orchestrator
subtask: true
---

<objective>
Entry point for programmatic configuration of OpenCode primitives. Routes to hivefiver-orchestrator which loads the hivefiver-agent-config skill workflow.

Supports flags:
- --from-file <path> — Load configuration from a JSON/YAML file instead of interactive mode
- --scope <agent|command|skill> — Pre-select the primitive type to skip investigation turn
- --dry-run — Compile and validate without writing files
</objective>

<context>
$ARGUMENTS
</context>

<process>
1. Parse $ARGUMENTS for flags: --from-file, --scope, --dry-run
2. If --from-file: read the file, pass contents to hivefiver-agent-config skill as pre-loaded spec (skip Turns 1-2)
3. If --scope: set primitive type immediately (skip Turn 1 type detection)
4. If --dry-run: set flag to prevent file writes in Turn 5
5. Delegate to hivefiver-orchestrator which loads hivefiver-agent-config skill
6. Follow the 7-turn workflow from the skill
</process>
