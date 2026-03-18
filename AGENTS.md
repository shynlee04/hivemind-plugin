# HiveMind - OpenCode Meta-Framework Dev-Kit & Plugin

Installable context-governance framework for OpenCode. npm: `hivemind-context-governance`.

## Authority

This file governs development of the framework. Loaded once per OpenCode session.

- **Shipped product**: `commands/`, `agents/`, `workflows/`, `skills/`, `dist/`, `bin/`
- **Source code**: `src/` - the OpenCode plugin implementation
- **Schema contract authority**: `src/schema-kernel/` owns additive machine-authoritative Phase 1 record contracts as they land
- **Supervisor orchestration authority**: `src/sdk-supervisor/` owns additive Phase 1 orchestration control as it lands
- **Agent authority surface**: root `agents/**` is the source authoring surface for agent contracts
- **Install/runtime entry**: stable docs under `docs/guide/**` describe the single bootstrap path; `src/cli/` + `src/control-plane/` own the executable behavior
- **Live install/runtime entry is limited to** `dist/cli.js` binaries, the `hivemind-context-governance/plugin` export, and the consumer-side `.opencode/plugins/hivemind-context-governance.ts` stub written by runtime sync
- **Dev projection**: `.opencode/agents/**` is a user-local runtime projection of root `agents/**`, never an independent authority and never a repo-time prerequisite
- **Runtime-generated**: `.hivemind/` is runtime output after `hm-init`, not an authoring surface
- **Sector governance**: each `src/*/AGENTS.md` owns its domain boundary
- **A root `commands/*.md` file is a live runtime command surface only when registered** in `src/commands/slash-command/command-bundles.ts` or mapped from a control-plane primitive
- **Unregistered command markdown is documentation or legacy material** and must not imply shipped executable behavior
- **Proposal and history surfaces are advisory only**: `conductor/**`, `docs/plans/archive/**`, and dated evidence docs under `docs/**` inform decisions but never override root governance, sector charters, or active phase artifacts
- **Runtime behavior claims require official-interface evidence**: determinism, harness coverage, SDK behavior, plugin behavior, and runtime assertions must be backed by live OpenCode server/client/plugin verification or current official OpenCode documentation
- **SOT and governance paths must stay stable and non-date-stamped**; dated filenames are for evidence/history only, never the authority path
- **Compatibility entry files should prefer symlinks back to the stable authority surface** instead of carrying parallel governance text

# **Non Negotiable CONSTITUTIONS**

**THE DEVELOPMENT PHILOSOPHIES**

- Architecture and Coding As Corporate-Level standards - Code LOC less than 300 ; No God Components, No God functions, No dead codes nor zombies allowed

**Following CLEAN CODE practices**

- Modular Code development

- JSDoc standards

- Ultra reusability and maintainability

- Apply patterns designs 
- analyze the tasks very carefully

**TDD IS CRITICAL AND ENFORCE**

- Tests **MUST** be conducted formally by running SKILLS sets of spec-driven tests 

- Tests must be built on the understanding of the whole project - running through **SCHEMA** validation; cross-dependencies **CONTRACTS** to ENSURE API interfaces and types are correctly implemented AND **NO TOLORENCE** FOR ANY OF THIS IS SKPPED

- NO nonsensical TESTS allowed, meaning, test units must gradually built into a test suite.
**NEVER ALLOW** to run any new development if **TESTS ARE NOT PASSED** - **MUST ALWAYS FOLLOW** npx skills add https://github.com/obra/superpowers --skill test-driven-development 

- IN THIS PROJECT ALL TESTS MUST SURFACE API OF THE SKD USED in package.json - NO TEST WITH SDK CAN USE STUB

**Every Tasks must go through both VERIFICATION and VALIDATION, and incremental GATEKEEPING and valid INTEGRATION Tests, IF NOT AGENTS CAN'T CLAIM COMPLETION**

## Governing Principles

These principles govern all design and implementation decisions. They are the root - not the anti-patterns or conventions that follow.

1. **SDK-First**: Before writing ANY custom abstraction, check if the SDK provides it. `tool.schema`, `client.app.log()`, `client.tui.showToast()`, `permission.ask` - these exist. Use them.
2. **CQRS Hard Boundary**: Tools write. Hooks read. Plugin assembles. No exceptions. No "hooks that also write." No "plugin entry with business logic."
3. **Interface Decomposition**: No type exceeds 10 fields at the core level. Extensions compose via intersection (`TrajectoryCore & TrajectoryBindings`). Never a 20-field monolith.
4. **Consumer-First**: Every shipped asset (`commands/`, `agents/`, `workflows/`) must work for npm consumers who install the package. Not just for internal dev.
5. **Authority Principle**: Each concern has ONE owner. `hooks/start-work/` owns session lifecycle. `core/trajectory/` owns trajectory state. `shared/paths.ts` owns path resolution. No second implementations.
6. **Projection-Not-Authority**: Root markdown command files are thin public projections. Install/runtime behavior must live in TypeScript control-plane and feature modules, never only in loose root `.md` files.
7. **Official-Interface Verification**: Local mocks, stubs, health checks, and bundle execution are supporting evidence only. Claims about runtime behavior must be proven against the official OpenCode server/client/plugin boundary or explicitly labeled as non-live evidence.
8. **Internal-Only Interfaces Are Allowed**: Additive internal schemas, settings, view-models, and read models are allowed when they stay repo-owned, have one authority owner, and do not create a competing execution, session, workflow, tool, or event contract beside OpenCode.

## OpenCode SDK Contract

This project builds ON the OpenCode SDK. The SDK is the authority - not custom reimplementations.

### Live Verification Authority

- Real behavioral proof comes from a live OpenCode instance exercised through official server/client/plugin interfaces.
- Mocked `PluginInput`, stub HTTP servers, local command-bundle execution, and synthesized runtime JSON are useful diagnostics, but they do not prove live OpenCode behavior on their own.
- When current official OpenCode docs are the only available source of truth, document that evidence explicitly and avoid overstating runtime certainty.

### Internal Interface Boundary

- Allowed internal surfaces: user profile schemas, settings fields, planning metadata, dashboard state, display filters, delegation read models, and local policy/config records that remain internal to HiveMind.
- Required rule: internal contracts must translate outward through existing OpenCode SDK/API/plugin/tool boundaries at the edge instead of inventing a second public runtime protocol.
- Not allowed: shadow session models, parallel workflow engines, custom event buses, bypass command protocols, or state stores that compete with OpenCode/runtime truth.

### Plugin Hooks (17 Available)

| Hook | Status | What It Gives You |
|------|--------|-------------------|
| `event` | Yes Used | All OpenCode lifecycle events - replaces custom EventBus |
| `chat.message` | Available | Track messages per-session - use instead of custom session tracking |
| `chat.params` | Available | Control temperature/topP/topK per-agent |
| `chat.headers` | Available | Custom auth headers per request |
| `permission.ask` | Yes Used | Gate file/state mutations with user consent |
| `command.execute.before` | Yes Used | Pre-command context injection |
| `tool.execute.before` | Yes Used | Pre-validate or transform tool args before execution |
| `tool.execute.after` | Yes Used | Post-tool observation and state capture |
| `tool.definition` | Available | Dynamically modify tool descriptions and parameters |
| `shell.env` | Yes Used | Inject environment variables |
| `system.transform` | Yes Used | Modify system prompt per-session |
| `messages.transform` | Yes Used | Transform message history |
| `session.compacting` | Yes Used | Customize compaction prompt and context |
| `config` | Available | React to config changes at runtime |
| `auth` | Available | OAuth and API key auth flows |
| `text.complete` | Available | Streaming text injection |

### Client API (`client.*`)

`client.session`, `client.command`, `client.tui`, `client.vcs`, `client.mcp`, `client.pty`, `client.file`, `client.find`, `client.tool`, `client.config`, `client.app`, `client.provider`, `client.lsp`, `client.formatter`, `client.auth`, `client.event`, `client.global`, `client.path`

Key capabilities currently underutilized:
- `client.session.*` - session management (instead of dead `core/session/kernel.ts`)
- `client.app.agents()` - runtime agent validation for shipped framework surfaces
- `client.tool.ids()` - runtime tool validation for shipped framework surfaces

### Tool Definition - `tool.schema` IS Zod

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
    // context.sessionID - current session
    // context.agent     - calling agent name
    // context.directory - project root
    // context  - worktree root
    // context.abort     - AbortSignal
    // context.metadata() - set tool metadata
    // context.ask()      - request user permission
    return JSON.stringify({ status: 'success', data: result })
  }
})
```

## Anti-Patterns - Never Do These

1. **Never** import from `shared/event-bus.ts` - use `event` hook + `client.tui.publish()`
2. **Never** import from `core/session/kernel.ts` - dead code, will be removed
3. **Never** define tool args as raw TypeScript interfaces - use `tool.schema` (Zod)
4. **Never** define tools inline in `opencode-plugin.ts` - extract to `src/tools/`
5. **Never** duplicate helpers across tool files - use `shared/tool-helpers.ts`
6. **Never** hand-write `.hivemind/` files - use `hivemind_runtime_command`
7. **Never** run commands expecting interactive prompts - shell has no TTY
8. **Never** glob `**/*.md` - use targeted file reads

## Required Patterns

1. **Must** use `tool.schema` (Zod) for all tool arg definitions
2. **Must** use `context.sessionID`/`context.agent`/`context.directory` from `ToolContext`
3. **Must** run `npx tsc --noEmit` after any code changes
4. **Must** preserve JSDoc: `@param`, `@returns`, `@example`
5. **Must** use CQRS: tools own writes, hooks are read-only context injection
6. **Must** load role-specific skills before acting (`npx skills add` / `npx skills update`)
7. **Shall** use `client.app.log()` for structured logging alongside console
8. **Shall** use `permission.ask` hook or `context.ask()` for state mutations
9. **Shall** resolve paths via `getEffectivePaths()` - never hardcode `.hivemind/`
10. **Shall** label readiness diagnostics, mock coverage, and live OpenCode contract probes separately in docs, plans, and completion claims
11. **Shall** classify new interfaces as either `internal-only` or `official-boundary-facing` before implementation, and document the owner of each contract

## Operations

```bash
npm run build             # Compile to dist/
npx tsc --noEmit          # Type check (gate before commit)
npm test                  # Full test suite
npx tsx --test tests/<file>.test.ts  # Single test
```

## Custom Tools (6)

| Tool | Location | Pattern |
|------|----------|---------|
| `hivemind_runtime_status` | `src/tools/runtime/` | Correct pattern |
| `hivemind_runtime_command` | `src/tools/runtime/` | Correct pattern |
| `hivemind_doc` | `src/tools/doc/` | Correct pattern |
| `hivemind_task` | `src/tools/task/` | Correct pattern |
| `hivemind_trajectory` | `src/tools/trajectory/` | Correct pattern |
| `hivemind_handoff` | `src/tools/handoff/` | Correct pattern |

## GSD Agent Framework

This project uses the GSD (Get Sh*t Done) agent framework for workflow execution. See `.opencode/agents/gsd-*.md` for available agents.

## Layer Architecture

| Layer | Location | Rule |
|-------|----------|------|
| Tools | `src/tools/` | Write-side (CQRS). LLM-facing. Zod schemas required. ~300 LOC limit. |
| Hooks | `src/hooks/` | Read-side and in-band interception. No durable writes. |
| Plugin | `src/plugin/` | Assembly and enforcement wiring only. No inline tools. No business logic. |
| Supervisor | `src/sdk-supervisor/` | Additive Phase 1 orchestration control: instances, sessions, workflows, health. |
| Schema Kernel | `src/schema-kernel/` | Additive Phase 1 contract authority for persisted and cross-session records. |
| Core | `src/core/` | State management. `core/session/` is deprecated - do not extend. |
| Shared | `src/shared/` | Transitional utilities and current lifecycle primitives; migrate durable contract authority toward schema kernel. |

## Known Debt (Audit 2026-03-15)

- [x] `core/session/` - **REMOVED** (L1 cutover, zero consumers confirmed)
- [x] `shared/event-bus.ts` - **REMOVED** (L1 cutover, only consumer was deleted `core/session/kernel.ts`)
- [x] `shared/logging.ts` - now augments with `client.app.log()`
- [x] `hooks/soft-governance.ts` - now uses `client.tui.showToast()` with cooldown tracking
- [x] 2 inline tools in `opencode-plugin.ts` - extracted to `src/tools/runtime/`
- [x] Zero Zod in tool defs - current tool args use `tool.schema`
- [ ] `intelligence/doc/` - first-wave markdown read foundation is live; public read-only expansion is in progress and broader restoration remains future work
- [ ] Type monoliths (6 types with 17-25 fields) - decompose per Interface Decomposition principle

## Reference

| Item | Location |
|------|----------|
| Package | `hivemind-context-governance` on npm |
| Plugin entry | `dist/plugin/opencode-plugin.js` |
| Config | `opencode.json` |
| Dev mirror | `.opencode/` (agents, commands, plugins - not shipped) |
| Runtime state | `.hivemind/` (generated runtime output, not agent-authoring input) |
