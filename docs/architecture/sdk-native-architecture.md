# SDK-Native Architecture — 2.9.5

## Principle

HiveMind 2.9.5 treats the OpenCode SDK as the **only** runtime surface. Every hook, tool, and state mutation flows through SDK-provided APIs — no custom event buses, no session middleware, no compatibility shims.

## Architecture Layers

```
┌──────────────────────────────────────────────┐
│              SDK Host (OpenCode)              │
│  chat.message · permission.ask · tool.call    │
│  tool.execute.before · shell.env              │
├──────────────────────────────────────────────┤
│          Plugin Assembly Layer                │
│  src/plugin/opencode-plugin.ts (entry)        │
│  src/plugin/surface-registry.ts (catalog)     │
├──────────────────────────────────────────────┤
│            Hook Bridge Layer                  │
│  context-injection · prompt-transformation    │
│  runtime-loader · workflow-integration        │
├──────────────────────────────────────────────┤
│           Tool Module Layer                   │
│  task · trajectory · handoff · runtime(×2)    │
├──────────────────────────────────────────────┤
│           Core State Layer                    │
│  workflow-authority · trajectory-store         │
│  delegation-store · recovery-engine           │
├──────────────────────────────────────────────┤
│          Shared Infrastructure                │
│  paths · config · tool-helpers · sdk-context  │
│  pressure-contract · types                    │
└──────────────────────────────────────────────┘
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| No custom event bus | SDK hooks replace all pub/sub patterns |
| Assembly-only plugin entry | Prevents logic accumulation in entry point |
| Zod-validated tool schemas | Runtime type safety for all tool inputs |
| Hooks are read-only | State mutations flow through store modules |
| AGENTS.md as authority | Every sector has a charter defining boundaries |
| Type decomposition | Large types split into focused intersection types |

## Hook Registration

| SDK Hook | Purpose | Module |
|----------|---------|--------|
| `chat.message` | Inject knowledge + context Parts | `opencode-plugin.ts` |
| `permission.ask` | Auto-allow HiveMind tools, toast on mutations | `opencode-plugin.ts` |
| `tool.execute.before` | Trajectory pre-flight checks | `opencode-plugin.ts` |
| `experimental.chat.messages.transform` | Prompt packet injection | `runtime-bridge/` |
| `shell.env` | Runtime state loading | `runtime-bridge/` |

## Tool Surface

| Tool ID | Module | Purpose |
|---------|--------|---------|
| `hivemind_task` | `src/tools/task/` | Task CRUD, lifecycle management |
| `hivemind_trajectory` | `src/tools/trajectory/` | Session trajectory tracking |
| `hivemind_handoff` | `src/tools/handoff/` | Delegation handoff management |
| `hivemind_runtime_status` | `src/tools/runtime/` | Runtime state inspection |
| `hivemind_runtime_command` | `src/tools/runtime/` | Runtime command execution |

## Governance Invariants

11 automated boundary guards enforce architecture invariants via `npm run lint:boundary`:

| Guard | Invariant |
|-------|-----------|
| `check-sdk-boundary` | `src/lib/` never imports `@opencode-ai` |
| `check-agent-registry-parity` | `agents/` ↔ `.opencode/agents/` mirror |
| `check-state-write-boundary` | No direct `.hivemind/state/` writes |
| `check-docs-ownership-boundary` | Agent scope roles enforced |
| `check-no-event-bus` | Event bus stays deleted |
| `check-no-core-session` | Core session stays deleted |
| `check-tool-schema` | All tools use Zod schemas |
| `check-hooks-readonly` | Hooks don't write state |
| `check-plugin-assembly` | Plugin entry is assembly-only |
| `check-agents-presence` | All sectors have AGENTS.md |
| `check-asset-refs` | No references to removed modules |
