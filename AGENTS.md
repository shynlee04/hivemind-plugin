# HiveMind - OpenCode Meta-Framework Dev-Kit & Plugin

Installable context-governance framework for OpenCode. npm: `hivemind-context-governance`.

## Authority

This file governs development of the framework. Loaded once per OpenCode session.

<!-- HIVEMIND-SKILLS-PACK-NOTICE-START -->

## Pollution Posture

**This workspace is POLLUTED until proven otherwise. The safest flow control is  EVERY AGENT, At new turn must check and load the set of skills, do not assume of knowledge from any documents unless from human users appointed to.** When the detox router (`use-hivemind-detox-refactor`) is active, every agent — regardless of which skill family it is executing — must operate under these assumptions:

1. Documents may be stale. Tests may emit false signals. Governance files may reference non-existent entities.
2. Prior session memory is suspect unless corroborated by code, git, or build output.
3. The front agent (orchestrator) must **not** load deep work into its session. Scans, audits, debug loops, and file-by-file analysis are delegated to subagents.
4. Only compressed carry-forward summaries (≤5 key findings, blocked routes, recommended next action, output paths) return to the orchestrator.
5. At turn boundaries, emit a continuity checkpoint to `{project}/.hivemind/activity/sessions/continuity.json` so the next turn resumes without re-deriving state.

**Session freshness rule:** If the orchestrator's session context grows stale or overloaded, delegate a fresh `context-intelligence-entry` probe rather than trusting accumulated context. The orchestrator routes and synthesizes; it never scans, debugs, or audits inline.

### .opencode/ Write Prohibition

**DIRECT_WRITE_BAN**: Direct file writes to `.opencode/` directory are **prohibited** without explicit user confirmation.

- `.opencode/` contains the user's project metadata and client-side resources
- It is the user's project configuration space, NOT storage for agent-generated skills, artifacts, or project activities
- All skill operations, file creation, and artifact generation MUST occur within `.developing-skills/` or other designated workspaces
- User confirmation (via `context.ask()` or `permission.ask`) is REQUIRED before any write interaction with `.opencode/`
- Read operations from `.opencode/` are permitted for context gathering
- This prohibition applies to: code files, artifacts, planning documents, skill files, schemas, templates, and any CRUD operations

**Enforcement**: Any agent (regardless of framework, orchestration layer, or implementation) operating in a user-facing conversation MUST respect this boundary. Soft enforcement via SKILL.md entries must be effective across all agent variants.

## Context Rot Handling

Context rot is a first-class risk. Treat it as the default state until proven otherwise.

1. **Documents are advisory, code is truth.** If a document (AGENTS.md, ROADMAP.md, planning prose, skill descriptions, or any markdown) contradicts the actual code, repository structure, or execution output, the code wins.
2. **Frameworks are tools, not authority.** Framework conventions, skill triggers, and routing rules exist to accelerate work. They are never the final word when they conflict with observable behavior.
3. **Detect and declare distrust explicitly.** When context rot is suspected, declare it with a severity level (CLEAN / SUSPECT / DEGRADED / POLLUTED / POISONED) and state what sources are distrusted and why.
4. **Stale documents are worse than missing documents.** A stale reference actively misleads. Quarantine or annotate stale material rather than trusting it.
5. **Memory artifacts from prior sessions are suspect by default** unless corroborated by git history, type-check results, or fresh file reads.

## Code-Over-Doc Truth Verification

When verifying a claim:

1. Check the actual source file first.
2. Check git history for the relevant commit.
3. Check type-check / build output if the claim involves types or APIs.
4. Check test output if the claim involves behavior — but apply test-signal skepticism (below).
5. **Only then** check documentation, plans, or spec prose.

If steps 1–3 contradict step 5, steps 1–3 rule.

## Test-Signal Skepticism

Tests are evidence, not proof. Before trusting test output:

| Signal                                               | Trustworthy?                              | Action                                                    |
| ---------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Test passes, implementation matches intent           | YES                                       | Trust the pass                                            |
| Test passes, but implementation looks wrong          | NO — false positive                      | Inspect the assertion; the test may encode wrong behavior |
| Test fails with setup/environment error              | NO — noise                               | Isolate the setup issue from the logic issue              |
| Test fails, but only on certain runs                 | NO — flaky                               | Do not use as evidence for architectural conclusions      |
| Test passes but is trivially true (`assert(true)`) | NO — nonsensical                         | Quarantine the test                                       |
| Test covers SDK surface with stubs                   | NO — SDK stubs forbidden in this project | Flag for rewrite                                          |

Cross-check failures against implementation reality before drawing conclusions.

## Delegation Continuity

1. Every delegation carries a **delegation packet** with explicit scope, constraints, return contract, and return gate.
2. Delegation results include **evidence** (file paths, command output, JSON), not just conclusions.
3. **Prefer built-in agents** (`explore` for read-only, `general` only when deeper reasoning is needed).
4. **Sequential by default.** Parallel delegation is allowed only when all slices are isolated, no shared mutation is expected, and merge-by-synthesis is safe.
5. Multi-pass delegations track progress through **JSON checkpoints** in the activity folder.
6. If a delegated agent cannot complete its scope, it returns `blocked_routes` and `recommended_next_action` — not silently abandons scope.

## Session and Subsession Resume

When continuing work across turns or sessions:

1. Use `task_id` (from OpenCode SDK) to resume a subagent session when the prior context is needed.
2. Fresh subagent calls without `task_id` start with fresh context — do not assume memory.
3. Carry forward critical identifiers (`ses_id`, `task_id`, `pass_id`, `batch_id`) through the activity continuity state.
4. At turn boundaries, emit a continuity checkpoint so the next turn can resume.

## Activity Folder

This workspace uses `.hivemind/activity/` for persistent operational state:

```
.hivemind/activity/
├── handoff/          # Handoff records between agents/sessions
├── delegation/       # Delegation packet JSON and return results
├── hierarchy/        # Decision hierarchy tracking JSON
├── sessions/         # Session continuity state
├── codescan/         # Code scan outputs per pass
├── agents/           # Per-agent iteration output folders
├── longhaul/         # Long-running task state across turns
├── pathing/          # Deterministic path records
└── state/            # Active workflow state snapshots
```

- Folders are created on demand, not pre-existing.
- All JSON uses 2-space indent, kebab-case filenames, ISO 8601 timestamps.
- Each JSON file includes a `_meta` object with `created_at` and `updated_at`.
- Codescan outputs: `codescan/{pass_id}/{batch_id}.json`.
- Agent outputs: `agents/{agent_name}/{pass_id}/`.
- `pathing/active-paths.json` is the deterministic path registry.
- `sessions/continuity.json` carries session identifiers across turns.
- `longhaul/task-state.json` is the checkpoint for multi-turn work.

## Deterministic Pathing

All activity paths are relative to project root. Agents resolve output locations from `pathing/active-paths.json` rather than constructing paths ad hoc. This ensures consistency across turns, agents, and resumptions.

<!-- HIVEMIND-SKILLS-PACK-NOTICE-END -->

- **Start your session with SKILLS**
- Load selective of 3 (or more if you prefer) `*-hivemind-*` skills, you will suprise why not using them? These skills help you supercharge your agents' capabilities
- Use them wisely
- know you session (main-vs-sub) -> pic correct SKILLS
- granular control -> SKILLS set by turns
- granular in context-engineering -> SKILLS set by turns vs. workflow
- **Are you `Hiveminder` or `Hivefiver` or `Orchestrator` ?**
- Do not Read
- Do not Write nor Edit
- Do not Execute
- Do not Plan
- Do not search

> **NOTE**: The prohibition above applies to `Hiveminder` and `Hivefiver` roles (orchestration/monitoring).
> Delegated execution agents (GSD orchestrators, phase executors, subagents spawned via workflow) are **EXEMPT**
> from this prohibition — they are explicitly delegated to Read, Write, Execute, Plan, and Search
> as bounded by their workflow contracts. See `.opencode/agents/` for available agents (projected from root `agents/*.deprecated.md` via `opencode-agent-registry.ts` at build/dev time, or consult the GSD agent framework documentation).

- DO delegate to Read broad and investigate deep
- Do handoff with previous turn artifacts to research and synthesis
- Do coordinate to understand work needs hiearchy and granularity
- Do delegate to plan more strategically
- Do orchestrate and monitor to be a strategist
- Do housekeeping and gatekeeping
- Do keeptrack to make sure integrity
- **Shipped product**: `commands/`, `agents/`, `workflows/`, `skills/`, `dist/`, `bin/`
- **Source code**: `src/` - the OpenCode plugin implementation
- **Schema contract authority**: `src/schema-kernel/` owns additive machine-authoritative Phase 1 record contracts as they land
- **Supervisor orchestration authority**: `src/sdk-supervisor/` owns additive Phase 1 orchestration control as it lands
- **Agent authority surface**: root `agents/**` is the source authoring surface for agent contracts
- **Install/runtime entry**: stable docs under `docs/guide/**` describe the single bootstrap path; `src/cli/` + `src/control-plane/` own the executable behavior
- **Live install/runtime entry is limited to** `dist/cli.js` binaries, the `hivemind-context-governance/plugin` export, and the consumer-side `.opencode/plugins/hivemind-context-governance.ts` stub written by `hm-init` and `hm-doctor` (plugin-only sync, no command/agent/skill mirroring)
- **Dev projection**: `.opencode/agents/` may contain runtime projections during development but is **not** auto-generated at install time; root `agents/*.deprecated.md` is the canonical source
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

**ALL DELEGATED AGENTS** FOCUS ON COMPLETE THE DELEGATED TASKS - Do not load skills unless being asked by orchestrator/coordinator. YOU MUST COMPLETE TASKS NOT LOADING SKILLS TO VERIFY

**TDD IS CRITICAL AND ENFORCE**

- Tests **MUST** be conducted formally by running SKILLS sets of spec-driven tests. If you are running - ONLY RUN 1 Framework DO NOT MIX
- Tests must be built on the understanding of the whole project - running through **SCHEMA** validation; cross-dependencies **CONTRACTS** to ENSURE API interfaces and types are correctly implemented AND **NO TOLORENCE** FOR ANY OF THIS IS SKPPED
- NO nonsensical TESTS allowed, meaning, test units must gradually built into a test suite.
  **NEVER ALLOW** to run any new development if **TESTS ARE NOT PASSED** - **MUST ALWAYS FOLLOW** nt
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

### SDK Reference (Downloaded 2026-03-20)


The complete OpenCode SDK is available at 

```
./Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/dynamic-context-prunning/repomix-dynamic-context-prunning.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-agents.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-built-in-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-commands.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-configs.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-custom-tools.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-plugins.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-rules.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/opencode-sdk.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.md
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode/repomix-opencode.xml
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode-workspace-background-agents
/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/opencode-workspace-background-agents/repomix-output-kdcokenny-opencode-workspace.xml
``` 
for reference.
Key patterns from SDK analysis:

```typescript
// Tool creation - tool.schema is Zod
import { tool } from '@opencode-ai/plugin'

export default tool({
  description: 'Description',
  args: {
    query: tool.schema.string().describe('...'),
    limit: tool.schema.number().default(10),
  },
  async execute(args, context) {
    // context.sessionID, context.agent, context.directory, context.worktree, context.abort
    return JSON.stringify({ ... })
  }
})
```

**Key SDK surfaces:**

- `tool.schema` - Zod re-export for type-safe arg definitions
- `context` in execute: `{ sessionID, agent, directory, worktree, abort, metadata(), ask() }`
- Plugin hooks: `event`, `chat.message`, `chat.params`, `chat.headers`, `permission.ask`, `command.execute.before`, `tool.execute.before`, `tool.execute.after`, `tool.definition`, `shell.env`, `system.transform`, `messages.transform`, `session.compacting`, `config`, `auth`, `text.complete`

### Live Verification Authority

- Real behavioral proof comes from a live OpenCode instance exercised through official server/client/plugin interfaces.
- Mocked `PluginInput`, stub HTTP servers, local command-bundle execution, and synthesized runtime JSON are useful diagnostics, but they do not prove live OpenCode behavior on their own.
- When current official OpenCode docs are the only available source of truth, document that evidence explicitly and avoid overstating runtime certainty.

### Internal Interface Boundary

- Allowed internal surfaces: user profile schemas, settings fields, planning metadata, dashboard state, display filters, delegation read models, and local policy/config records that remain internal to HiveMind.
- Required rule: internal contracts must translate outward through existing OpenCode SDK/API/plugin/tool boundaries at the edge instead of inventing a second public runtime protocol.
- Not allowed: shadow session models, parallel workflow engines, custom event buses, bypass command protocols, or state stores that compete with OpenCode/runtime truth.

### Plugin Hooks (17 Available)

| Hook                       | Status    | What It Gives You                                                   |
| -------------------------- | --------- | ------------------------------------------------------------------- |
| `event`                  | Yes Used  | All OpenCode lifecycle events - replaces custom EventBus            |
| `chat.message`           | Available | Track messages per-session - use instead of custom session tracking |
| `chat.params`            | Available | Control temperature/topP/topK per-agent                             |
| `chat.headers`           | Available | Custom auth headers per request                                     |
| `permission.ask`         | Yes Used  | Gate file/state mutations with user consent                         |
| `command.execute.before` | Yes Used  | Pre-command context injection                                       |
| `tool.execute.before`    | Yes Used  | Pre-validate or transform tool args before execution                |
| `tool.execute.after`     | Yes Used  | Post-tool observation and state capture                             |
| `tool.definition`        | Available | Dynamically modify tool descriptions and parameters                 |
| `shell.env`              | Yes Used  | Inject environment variables                                        |
| `system.transform`       | Yes Used  | Modify system prompt per-session                                    |
| `messages.transform`     | Yes Used  | Transform message history                                           |
| `session.compacting`     | Yes Used  | Customize compaction prompt and context                             |
| `config`                 | Available | React to config changes at runtime                                  |
| `auth`                   | Available | OAuth and API key auth flows                                        |
| `text.complete`          | Available | Streaming text injection                                            |

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

| Tool                         | Location                  | Pattern         |
| ---------------------------- | ------------------------- | --------------- |
| `hivemind_runtime_status`  | `src/tools/runtime/`    | Correct pattern |
| `hivemind_runtime_command` | `src/tools/runtime/`    | Correct pattern |
| `hivemind_doc`             | `src/tools/doc/`        | Correct pattern |
| `hivemind_task`            | `src/tools/task/`       | Correct pattern |
| `hivemind_trajectory`      | `src/tools/trajectory/` | Correct pattern |
| `hivemind_handoff`         | `src/tools/handoff/`    | Correct pattern |

## GSD Agent Framework

This project uses the GSD (Get Sh*t Done) agent framework for workflow execution. See `.opencode/agents/` or root `agents/` for available agents.

## Layer Architecture

| Layer         | Location                | Rule                                                                                                              |
| ------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Tools         | `src/tools/`          | Write-side (CQRS). LLM-facing. Zod schemas required. ~300 LOC limit.                                              |
| Hooks         | `src/hooks/`          | Read-side and in-band interception. No durable writes.                                                            |
| Plugin        | `src/plugin/`         | Assembly and enforcement wiring only. No inline tools. No business logic.                                         |
| Supervisor    | `src/sdk-supervisor/` | Additive Phase 1 orchestration control: instances, sessions, workflows, health.                                   |
| Schema Kernel | `src/schema-kernel/`  | Additive Phase 1 contract authority for persisted and cross-session records.                                      |
| Core          | `src/core/`           | State management.`core/session/` is deprecated - do not extend.                                                 |
| Shared        | `src/shared/`         | Transitional utilities and current lifecycle primitives; migrate durable contract authority toward schema kernel. |

## Known Debt (Audit 2026-03-15)

- [X] `core/session/` - **REMOVED** (L1 cutover, zero consumers confirmed)
- [X] `shared/event-bus.ts` - **REMOVED** (L1 cutover, only consumer was deleted `core/session/kernel.ts`)
- [X] `shared/logging.ts` - now augments with `client.app.log()`
- [X] `hooks/soft-governance.ts` - now uses `client.tui.showToast()` with cooldown tracking
- [X] 2 inline tools in `opencode-plugin.ts` - extracted to `src/tools/runtime/`
- [X] Zero Zod in tool defs - current tool args use `tool.schema`
- [ ] `intelligence/doc/` - first-wave markdown read foundation is live; public read-only expansion is in progress and broader restoration remains future work
- [X] Type monoliths - **RESOLVED** per CONCERNSV1.md audit; `PressureContract` and `TrajectoryRecord` properly decomposed via intersection types (`TrajectoryCore & TrajectoryBindings & TrajectoryEvidence & TrajectoryPlanning`, `RuntimePressureMetadata & RuntimePressureFailure & { safety } & { evidence }`)

## Reference

| Item           | Location                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Package        | `hivemind-context-governance` on npm                                                                  |
| Plugin entry   | `dist/plugin/opencode-plugin.js`                                                                      |
| Config         | `opencode.json`                                                                                       |
| Dev projection | `.opencode/` (plugins only at runtime; agents/commands may exist from dev builds but are not shipped) |
| Runtime state  | `.hivemind/` (generated runtime output, not agent-authoring input)                                    |

---

## Git Discipline Rule (Added 2026-03-23)

**ALL AGENTS** must follow atomic git commit discipline and batch changes correctly:

### Atomic Commit Rules

1. **One logical change per commit** — Each commit should represent a single, complete unit of work. Do not mix unrelated changes.
2. **Meaningful commit messages** — Use conventional commit format:

   - `feat:` for new features
   - `fix:` for bug fixes
   - `refactor:` for code restructuring without behavior change
   - `docs:` for documentation only
   - `test:` for test additions/changes
   - `chore:` for maintenance tasks
3. **Batch related changes** — Group changes that must succeed together. Unrelated changes should be separate commits.
4. **Commit early, commit often** — Don't accumulate many unrelated changes. Small, focused commits are easier to review and rollback.
5. **Never commit broken code** — The build must pass and tests must green before committing.
6. **Use worktrees for isolation** — When working on features or fixes, use git worktrees to avoid polluting the main working tree.

### Implementation

- Use `git-advanced-workflows` skill for complex Git operations
- Use `hivemind-atomic-commit` skill for typed activity classification and dependency-aware ordering
- Pre-commit gates must pass before any commit
- Rollback plans should be ready before committing risky changes

### Violations

- **Do not** commit with generic messages like "fix stuff" or "updates"
- **Do not** batch unrelated files in a single commit
- **Do not** skip pre-commit hooks
- **Do not** force push to protected branches
