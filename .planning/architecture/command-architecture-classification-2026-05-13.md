# Command Architecture Classification — CP-CMD-01

> Canonical reference for all command-related code in the Hivemind harness.
> Establishes the architectural tier, SDK endpoint, and CQRS role for each module.

## Date: 2026-05-13

## Architectural Tiers

Commands in the Hivemind/OpenCode ecosystem belong to three distinct tiers,
each mapping to a different SDK endpoint:

| Tier | What | SDK Endpoint | Semantics |
|------|------|-------------|-----------|
| **Slash Commands** | YAML-defined TUI primitives | `POST /session/:id/command` | Deterministic, agent-context-aware, TUI-bound |
| **Shell Commands** | OS-level process execution | `POST /session/:id/shell` | PTY/headless, background, long-running |
| **Agent Delegation** | Agent-to-agent work dispatch | `POST /session/:id/message` | WaiterModel, dual-signal completion |

## Active Code Inventory

### Write-Side (Execution)

| Module | Path | Tier | Role |
|--------|------|------|------|
| `execute-slash-command` | `src/tools/session/execute-slash-command.ts` | Slash Commands | Deterministic command dispatch via `client.session.command()` |
| `run-background-command` | `src/tools/hivemind/run-background-command.js` | Shell Commands | PTY/headless process delegation via `CommandDelegationHandler` |
| `delegate-task` | `src/tools/delegation/delegate-task.ts` | Agent Delegation | WaiterModel dispatch via `DelegationManager` |

### Read-Side (Discovery & Analysis)

| Module | Path | Tier | Role |
|--------|------|------|------|
| `hivemind-command-engine` | `src/tools/hivemind/hivemind-command-engine.ts` | Slash Commands | Discovery, contract analysis, context rendering, route preview, command listing |
| `command-engine` (core) | `src/routing/command-engine/index.ts` | Slash Commands | Library API: `discoverCommandBundles()`, `analyzeCommandContract()`, `listCommands()`, `routeCommandPreview()` |
| `command-engine` (types) | `src/routing/command-engine/types.ts` | Slash Commands | Type definitions for all command-engine I/O |
| `command-engine` (schema) | `src/schema-kernel/command-engine.schema.ts` | Slash Commands | Zod validation schemas for tool input |

### Infrastructure (Not command-specific but command-adjacent)

| Module | Path | Tier | Role |
|--------|------|------|------|
| `CommandDelegationHandler` | `src/coordination/command-delegation/handler.ts` | Shell Commands | PTY/headless process lifecycle management |
| `plugin.ts` (composition root) | `src/plugin.ts` | All | Tool registration, hook wiring |

## CQRS Pattern

The command system follows CQRS (Command Query Responsibility Segregation):

```
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  READ SIDE (Query)          │    │  WRITE SIDE (Command)        │
│                             │    │                              │
│  hivemind-command-engine    │    │  execute-slash-command        │
│  ├── discover               │    │  └── client.session.command() │
│  ├── list_commands          │    │                              │
│  ├── analyze_contract       │    │  run-background-command       │
│  ├── render_context         │    │  └── CommandDelegationHandler │
│  ├── transform_messages     │    │                              │
│  └── route_preview          │    │  delegate-task                │
│                             │    │  └── DelegationManager        │
└─────────────────────────────┘    └──────────────────────────────┘
```

**Agent workflow**: `list_commands` → select → `execute-slash-command`

## Deprecated & Removed

| File | Status | Reason | Replacement |
|------|--------|--------|-------------|
| `.opencode/tools-deprecated/execute-command.ts` | **REMOVED** (CP-CMD-01) | Wrong SDK endpoint (`prompt` vs `command`), forced queue semantics, TypeScript source in `.opencode/` violates architecture | `execute-slash-command` |
| `.opencode/tools-deprecated/nl-route.ts` | **REMOVED** (CP-CMD-01) | Hardcoded 3-command keyword matching, not scalable, TypeScript source in `.opencode/` violates architecture | `hivemind-command-engine` (discover/list_commands) |
| `.opencode/tools-deprecated/` | **REMOVED** (CP-CMD-01) | Directory violated `.opencode/` = soft meta-concepts only rule | Deprecation docs moved to `.planning/architecture/` |

> [!NOTE]
> Git history preserves the removed files. See commit for CP-CMD-01.
> Migration documentation: `.planning/architecture/command-tools-deprecation-2026-05-13.md`

## Remaining Debt (Future Phases)

| Item | Phase | Description |
|------|-------|-------------|
| `command-delegation/` naming | CP-PTY-02 | Directory name implies generic "command" but only handles shell/PTY — should be `shell-delegation/` |
| Execution mode unification | CP-PTY-03 | Consider whether `execute-slash-command` should support async/streaming modes |
| f-04 auto-routing | Future | Semantic command resolution replacing the deprecated NL-route approach |

## SDK Contract Reference

### `CommandInput` (from `packages/opencode/src/session/prompt.ts`)

```typescript
{
  command: string       // REQUIRED — command name without leading slash
  arguments: string     // REQUIRED — args string (can be empty "")
  agent?: string        // OPTIONAL — agent context override
  model?: string        // OPTIONAL — "providerID/modelID" format
  variant?: string      // OPTIONAL — model variant
  messageID?: string    // OPTIONAL — explicit message ID
  parts?: FilePart[]    // OPTIONAL — file attachments
}
```

### `ShellInput` (from `packages/opencode/src/session/prompt.ts`)

```typescript
{
  sessionID: SessionID
  messageID?: MessageID
  agent: string
  model?: ModelRef
  command: string
}
```
