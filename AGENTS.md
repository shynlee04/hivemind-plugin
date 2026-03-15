# HiveMind — OpenCode Meta-Framework Dev-Kit & Plugin

Installable context-governance framework for OpenCode. npm: `hivemind-context-governance`.

## Authority

This file governs development of the framework. Loaded once per OpenCode session.

- **Shipped product**: `commands/`, `agents/`, `workflows/`, `skills/`, `dist/`, `bin/`
- **Source code**: `src/` — the OpenCode plugin implementation
- **Runtime-generated**: `.hivemind/` (after `hm-init`), `dist/` (after build)
- **Dev mirror**: `.opencode/` — local testing only, re-exports from root
- **Sector governance**: each `src/*/AGENTS.md` owns its domain boundary

## Governing Principles

These principles govern all design and implementation decisions. They are the root — not the anti-patterns or conventions that follow.

1. **SDK-First**: Before writing ANY custom abstraction, check if the SDK provides it. `tool.schema`, `client.app.log()`, `client.tui.showToast()`, `permission.ask` — these exist. Use them.
2. **CQRS Hard Boundary**: Tools write. Hooks read. Plugin assembles. No exceptions. No "hooks that also write." No "plugin entry with business logic."
3. **Interface Decomposition**: No type exceeds 10 fields at the core level. Extensions compose via intersection (`TrajectoryCore & TrajectoryBindings`). Never a 20-field monolith.
4. **Consumer-First**: Every shipped asset (`commands/`, `agents/`, `workflows/`) must work for npm consumers who install the package. Not just for internal dev.
5. **Authority Principle**: Each concern has ONE owner. `hooks/start-work/` owns session lifecycle. `core/trajectory/` owns trajectory state. `shared/paths.ts` owns path resolution. No second implementations.

## OpenCode SDK Contract

This project builds ON the OpenCode SDK. The SDK is the authority — not custom reimplementations.

### Plugin Hooks (17 Available)

| Hook | Status | What It Gives You |
|------|--------|-------------------|
| `event` | ✅ Used | All OpenCode lifecycle events — replaces custom EventBus |
| `chat.message` | ⬜ Available | Track messages per-session — use instead of custom session tracking |
| `chat.params` | ⬜ Available | Control temperature/topP/topK per-agent |
| `chat.headers` | ⬜ Available | Custom auth headers per request |
| `permission.ask` | ⬜ Available | Gate file/state mutations with user consent |
| `command.execute.before` | ✅ Used | Pre-command context injection |
| `tool.execute.before` | ⬜ Available | Pre-validate or transform tool args before execution |
| `tool.execute.after` | ✅ Used | Post-tool observation and state capture |
| `tool.definition` | ⬜ Available | Dynamically modify tool descriptions and parameters |
| `shell.env` | ✅ Used | Inject environment variables |
| `system.transform` | ✅ Used | Modify system prompt per-session |
| `messages.transform` | ✅ Used | Transform message history |
| `session.compacting` | ✅ Used | Customize compaction prompt and context |
| `config` | ⬜ Available | React to config changes at runtime |
| `auth` | ⬜ Available | OAuth and API key auth flows |
| `text.complete` | ⬜ Available | Streaming text injection |

### Client API (`client.*`)

`client.session`, `client.command`, `client.tui`, `client.vcs`, `client.mcp`, `client.pty`, `client.file`, `client.find`, `client.tool`, `client.config`, `client.app`, `client.provider`, `client.lsp`, `client.formatter`, `client.auth`, `client.event`, `client.global`, `client.path`

Key capabilities currently underutilized:
- `client.app.log()` — structured server logging (instead of custom `shared/logging.ts`)
- `client.tui.showToast()` — native notifications (instead of empty `soft-governance.ts`)
- `client.session.*` — session management (instead of dead `core/session/kernel.ts`)

### Tool Definition — `tool.schema` IS Zod

```typescript
import { tool } from '@opencode-ai/plugin'
const s = tool.schema  // re-exported z from 'zod'

tool({
  description: 'Manage workflow tasks',
  args: {
    action: s.enum(['create', 'list', 'complete']).describe('Action to perform'),
    taskId: s.string().optional().describe('Task identifier'),
  },
  async execute(args, context) {
    // context.sessionID — current session
    // context.agent     — calling agent name
    // context.directory — project root
    // context.worktree  — worktree root
    // context.abort     — AbortSignal
    // context.metadata() — set tool metadata
    // context.ask()      — request user permission
    return JSON.stringify({ status: 'success', data: result })
  }
})
```

## ❌ Anti-Patterns — Never Do These

1. **Never** import from `shared/event-bus.ts` — use `event` hook + `client.tui.publish()`
2. **Never** import from `core/session/kernel.ts` — dead code, will be removed
3. **Never** define tool args as raw TypeScript interfaces — use `tool.schema` (Zod)
4. **Never** define tools inline in `opencode-plugin.ts` — extract to `src/tools/`
5. **Never** duplicate helpers across tool files — use `shared/tool-helpers.ts`
6. **Never** hand-write `.hivemind/` files — use `hivemind_runtime_command`
7. **Never** run commands expecting interactive prompts — shell has no TTY
8. **Never** glob `**/*.md` — use targeted file reads

## ✅ Required Patterns

1. **Must** use `tool.schema` (Zod) for all tool arg definitions
2. **Must** use `context.sessionID`/`context.agent`/`context.directory` from `ToolContext`
3. **Must** run `npx tsc --noEmit` after any code changes
4. **Must** preserve JSDoc: `@param`, `@returns`, `@example`
5. **Must** use CQRS: tools own writes, hooks are read-only context injection
6. **Must** load role-specific skills before acting (`npx skills add` / `npx skills update`)
7. **Shall** use `client.app.log()` for structured logging alongside console
8. **Shall** use `permission.ask` hook or `context.ask()` for state mutations
9. **Shall** resolve paths via `getEffectivePaths()` — never hardcode `.hivemind/`

## Operations

```bash
npm run build             # Compile to dist/
npx tsc --noEmit          # Type check (gate before commit)
npm test                  # Full test suite
npx tsx --test tests/<file>.test.ts  # Single test
```

## Custom Tools (5)

| Tool | Location | Pattern |
|------|----------|---------|
| `hivemind_runtime_status` | `src/plugin/` (⚠️ inline) | Should → `src/tools/runtime/` |
| `hivemind_runtime_command` | `src/plugin/` (⚠️ inline) | Should → `src/tools/runtime/` |
| `hivemind_task` | `src/tools/task/` | ✅ Correct pattern |
| `hivemind_trajectory` | `src/tools/trajectory/` | ✅ Correct pattern |
| `hivemind_handoff` | `src/tools/handoff/` | ✅ Correct pattern |

## Agent Roster

| Agent | Mode | Domain |
|-------|------|--------|
| hiveminder | primary | Orchestration — delegates, never implements |
| hivefiver | all | Meta-builder — framework assets, not product code |
| hivemaker | subagent | Implementation — `src/`, `tests/` |
| hivehealer | subagent | Recovery and debugging |
| hivexplorer | subagent | Codebase research (read-only) |
| hiverd | subagent | External research (no code access) |
| hiveq | subagent | Quality gates and verification |
| hiveplanner | subagent | Phase planning and synthesis |
| hitea | subagent | Testing infrastructure |

## Layer Architecture

| Layer | Location | Rule |
|-------|----------|------|
| Tools | `src/tools/` | Write-side (CQRS). LLM-facing. Zod schemas required. ~300 LOC limit. |
| Hooks | `src/hooks/` | Read-side. Context injection via synthetic Parts. 7 sub-modules. |
| Plugin | `src/plugin/` | Assembly only. No inline tools. No business logic. |
| Core | `src/core/` | State management. ⚠️ `core/session/` is deprecated — do not extend. |
| Shared | `src/shared/` | Utilities. Path resolution, logging, profile, pressure contracts. |

## Known Debt (Audit 2026-03-15)

- [x] `core/session/` — **REMOVED** (L1 cutover, zero consumers confirmed)
- [x] `shared/event-bus.ts` — **REMOVED** (L1 cutover, only consumer was deleted `core/session/kernel.ts`)
- [ ] `shared/logging.ts` — should augment with `client.app.log()`
- [ ] `hooks/soft-governance.ts` — empty placeholder, wire to `client.tui.showToast()`
- [ ] 2 inline tools in `opencode-plugin.ts` — extract to `src/tools/runtime/`
- [ ] Zero Zod in tool defs — migrate 5 tools to `tool.schema` arg definitions
- [ ] `intelligence/doc/` — router-only stub, full restoration planned for future version
- [ ] Type monoliths (6 types with 17-25 fields) — decompose per Interface Decomposition principle

## Reference

| Item | Location |
|------|----------|
| Package | `hivemind-context-governance` on npm |
| Plugin entry | `dist/plugin/opencode-plugin.js` |
| Config | `opencode.json` |
| Dev mirror | `.opencode/` (agents, commands, plugins — not shipped) |
| Runtime state | `.hivemind/` (generated after `hm-init`) |
