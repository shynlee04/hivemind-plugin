# Deprecated Tools — Command Category

## Status: DEPRECATED (CP-CMD-01, 2026-05-13)

This directory contains command-related tools that have been superseded by
properly architected replacements in the Hivemind harness source tree (`src/`).

### Inventory

| File | Original Purpose | Replacement | Reason |
|------|-----------------|-------------|--------|
| `execute-command.ts` | Slash command execution via prompt-path | `src/tools/session/execute-slash-command.ts` | Wrong SDK endpoint (`prompt` vs `command`), forced queue semantics |
| `nl-route.ts` | NL → command keyword routing | `src/tools/hivemind/hivemind-command-engine.ts` | Hardcoded 3-command keyword matching; replaced by schema-aware discovery |

### Migration Guide

#### Slash Command Execution
```
// OLD (deprecated — uses prompt path, adds queue overhead)
execute-command { command: "/gsd-stats", mode: "sync" }

// NEW (deterministic — uses SDK command endpoint directly)
execute-slash-command { command: "gsd-stats", arguments: "" }
```

#### Command Discovery
```
// OLD (deprecated — hardcoded keyword matching)
nl-route { query: "list files" }

// NEW (schema-aware discovery with contract analysis)
hivemind-command-engine { action: "discover", args: {} }
hivemind-command-engine { action: "list_commands", args: {} }
```

#### Shell/Background Commands
```
// Background process execution (never was in execute-command.ts properly)
run-background-command { command: "npm test", description: "Run tests" }
```

### Why These Tools Were Deprecated

1. **SDK Misalignment**: `execute-command.ts` used `client.session.prompt()` which routes
   through the LLM inference path. Slash commands should use `client.session.command()`
   which is a deterministic dispatch endpoint that resolves the command, applies agent/model
   overrides, and runs the prompt loop without additional queue overhead.

2. **Concern Conflation**: The original tool mixed slash command semantics (TUI-bound,
   agent-context-aware) with shell execution semantics (OS-level, PTY/headless). These
   are fundamentally different SDK endpoints (`/command` vs `/shell`).

3. **Scalability**: `nl-route.ts` hardcoded 3 test commands. The command-engine's
   `discover` action dynamically loads all YAML-defined commands from `.opencode/commands/`.
