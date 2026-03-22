# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```text
hivemind-plugin/
├── src/                  # TypeScript source for plugin, CLI, control plane, tools, hooks, and runtime features
├── commands/             # Canonical slash-command markdown assets projected into `.opencode/commands/`
├── agents/               # Canonical deprecated-agent markdown sources projected into `.opencode/agents/`
├── skills/               # Canonical skill packages projected into `.opencode/skills/`
├── workflows/            # YAML workflow definitions for higher-level orchestration
├── tests/                # Node/tsx test suites for runtime, plugin, sync, and contract behavior
├── scripts/              # Boundary and policy enforcement scripts used by `npm test`
├── docs/                 # Architecture, audit, guide, and reference documentation
├── bin/                  # Shipped utility entrypoint wrappers
├── dist/                 # Build output consumed by npm/package exports
├── modules/              # Supporting module packages and registry metadata
├── apps/                 # Ancillary application surfaces such as `apps/opentui/`
└── .planning/codebase/   # Generated codebase mapping documents for GSD workflows
```

## Directory Purposes

**`src/`:**
- Purpose: Primary authoring surface for executable TypeScript.
- Contains: plugin assembly, CLI routing, control-plane primitives, hooks, tools, state management, runtime entry handlers, supervisor/status code.
- Key files: `src/index.ts`, `src/plugin/opencode-plugin.ts`, `src/cli.ts`, `src/control-plane/control-plane-registry.ts`

**`src/plugin/`:**
- Purpose: OpenCode plugin assembly and prompt/context rendering.
- Contains: plugin export, context packet rendering, route hints, runtime snapshot helpers.
- Key files: `src/plugin/opencode-plugin.ts`, `src/plugin/context-renderer.ts`, `src/plugin/runtime-snapshot.ts`

**`src/hooks/`:**
- Purpose: Read-side runtime interception and routing logic.
- Contains: event handling, start-work routing, runtime loader hooks, workflow integration hooks.
- Key files: `src/hooks/event-handler.ts`, `src/hooks/start-work/start-work-router.ts`, `src/hooks/index.ts`

**`src/tools/`:**
- Purpose: Agent-callable tool implementations.
- Contains: runtime, task, trajectory, handoff, and doc tool families.
- Key files: `src/tools/index.ts`, `src/tools/runtime/`, `src/tools/task/`, `src/tools/trajectory/`

**`src/features/`:**
- Purpose: Higher-level feature slices that sit above raw hooks/tools.
- Contains: runtime entry, session entry, runtime observability, agent-work contracts, handoff/doc/workflow helpers.
- Key files: `src/features/runtime-entry/command.ts`, `src/features/runtime-entry/init.handler.ts`, `src/features/runtime-observability/sync.ts`, `src/features/session-entry/purpose-classifier.ts`

**`src/core/`:**
- Purpose: File-backed workflow and trajectory state authority.
- Contains: trajectory ledger operations and workflow-management state/continuity helpers.
- Key files: `src/core/trajectory/trajectory-store.ts`, `src/core/workflow-management/workflow-authority.ts`, `src/core/workflow-management/task-lifecycle.ts`

**`src/control-plane/`:**
- Purpose: Primitive definitions and runtime gating for bootstrap/repair/readiness/settings.
- Contains: primitive registry, types, intake logic, handler dispatch, managed runtime helper.
- Key files: `src/control-plane/control-plane-registry.ts`, `src/control-plane/control-plane-handler.ts`, `src/control-plane/sdk-runtime.ts`

**`src/shared/`:**
- Purpose: Cross-cutting utilities and contracts used by multiple layers.
- Contains: path helpers, pressure contracts, runtime attachment bridge, logging, error/result helpers, registry projection helpers.
- Key files: `src/shared/paths.ts`, `src/shared/pressure-contract.ts`, `src/shared/opencode-agent-registry.ts`, `src/shared/opencode-skill-registry.ts`

**`src/schema-kernel/` and `src/sdk-supervisor/`:**
- Purpose: Stable internal contract surface and supervisor/runtime status reporting.
- Contains: canonical schema re-exports and status snapshot builders.
- Key files: `src/schema-kernel/index.ts`, `src/sdk-supervisor/runtime-status.ts`, `src/sdk-supervisor/health.ts`

**`commands/`:**
- Purpose: Canonical slash command markdown source files.
- Contains: `hm-*`, `hive*`, and `hiverd-*` command definitions.
- Key files: `commands/hm-init.md`, `commands/hm-plan.md`, `commands/hm-verify.md`, `commands/hivemind-status.md`

**`agents/`:**
- Purpose: Canonical agent markdown sources that are projected into runtime-facing OpenCode agent files.
- Contains: `.deprecated.md` agent definitions.
- Key files: `agents/hivefiver.deprecated.md`, `agents/hiveminder.deprecated.md`, `agents/hiveq.deprecated.md`

**`skills/`:**
- Purpose: Canonical skill packages mirrored into `.opencode/skills/`.
- Contains: skill directories with `SKILL.md` plus optional `references/`, `templates/`, and `tests/` markdown files.
- Key files: `skills/use-hivemind/SKILL.md`, `skills/context-intelligence-entry/SKILL.md`, `skills/spec-distillation/SKILL.md`

**`tests/`:**
- Purpose: Verification for plugin runtime, command parsing, sync behavior, and contract integrity.
- Contains: top-level `.test.ts` files and focused unit tests under `tests/unit/`.
- Key files: `tests/plugin-runtime.test.ts`, `tests/runtime-surface-sync.test.ts`, `tests/runtime-tools.test.ts`, `tests/unit/context-renderer/workflow-style.test.ts`

**`scripts/`:**
- Purpose: Boundary enforcement and repository policy checks.
- Contains: shell and TypeScript checks executed by `npm run lint:boundary`.
- Key files: `scripts/check-plugin-assembly.sh`, `scripts/check-tool-schema.sh`, `scripts/check-agent-registry-parity.sh`, `scripts/validate-framework.sh`

## Key File Locations

**Entry Points:**
- `src/index.ts`: package barrel for code consumers
- `src/plugin/opencode-plugin.ts`: OpenCode plugin entry
- `src/cli.ts`: CLI/binary entry for `init`, `doctor`, `settings`, and `harness`

**Configuration:**
- `package.json`: package metadata, exports, scripts, dependencies, binaries
- `tsconfig.json`: TypeScript compilation settings
- `opencode.json`: OpenCode project configuration

**Core Logic:**
- `src/control-plane/control-plane-registry.ts`: bootstrap/repair/readiness primitive authority
- `src/commands/slash-command/command-bundles.ts`: slash command catalog
- `src/features/runtime-entry/command.ts`: command execution and finalization pipeline
- `src/core/workflow-management/workflow-authority.ts`: `.hivemind/` workflow authority inspection/bootstrap
- `src/core/trajectory/trajectory-store.ts`: trajectory ledger access

**Testing:**
- `tests/*.test.ts`: runtime and integration-style coverage
- `tests/unit/context-renderer/`: focused unit tests for prompt/context rendering behavior

## Naming Conventions

**Files:**
- TypeScript source uses lowercase kebab-case with domain suffixes: `src/control-plane/control-plane-registry.ts`, `src/features/runtime-entry/init-project.ts`, `src/core/workflow-management/task-lifecycle.ts`
- Markdown command files use command ids as filenames: `commands/hm-init.md`, `commands/hiveq-verify.md`
- Agent source files use agent id plus `.deprecated.md`: `agents/hivefiver.deprecated.md`
- Skill entry files use fixed `SKILL.md` inside a kebab-case directory: `skills/use-hivemind/SKILL.md`

**Directories:**
- Feature directories are noun-based and layered by responsibility: `src/features/runtime-entry/`, `src/features/session-entry/`, `src/features/runtime-observability/`
- Core state directories are domain-specific: `src/core/trajectory/`, `src/core/workflow-management/`
- Runtime projection directories mirror consumer surfaces: `.opencode/commands/`, `.opencode/agents/`, `.opencode/skills/`

## Where to Add New Code

**New Feature:**
- Primary code: add a focused slice under `src/features/<feature-name>/` when the behavior spans multiple layers, or under `src/tools/<tool-name>/` if it is directly agent-callable.
- Tests: add runtime/integration coverage in `tests/` and focused unit coverage beside existing unit suites such as `tests/unit/context-renderer/`.

**New Component/Module:**
- Plugin or prompt behavior: `src/plugin/` or `src/hooks/`
- Control-plane primitive or gating rule: `src/control-plane/`
- Workflow/trajectory state logic: `src/core/workflow-management/` or `src/core/trajectory/`
- OpenCode runtime projection support: `src/features/runtime-observability/` and `src/shared/opencode-*.ts`

**Utilities:**
- Shared helpers: `src/shared/`
- Public barrel updates: `src/index.ts` or the local `index.ts` for the owning directory

## Special Directories

**`.hivemind/`:**
- Purpose: Runtime-generated workflow, task, checkpoint, and session state
- Generated: Yes
- Committed: No

**`.opencode/`:**
- Purpose: Runtime projection of commands, agents, skills, and plugin stub for OpenCode consumers
- Generated: Yes
- Committed: No

**`dist/`:**
- Purpose: Compiled distribution output referenced by `package.json` exports and binaries
- Generated: Yes
- Committed: Yes

**`src/archive/`:**
- Purpose: Holds implementation details still re-exported through canonical public surfaces such as `src/schema-kernel/index.ts`
- Generated: No
- Committed: Yes

**`src/dashboard-v2/`:**
- Purpose: Separate dashboard package with its own lockfile and source tree
- Generated: No
- Committed: Yes

**`modules/`:**
- Purpose: Supplemental module packages and profile registries outside the main `src/` runtime path
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-21*
