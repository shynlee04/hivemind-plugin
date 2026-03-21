# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
[project-root]/
├── src/                # Core implementation of the HiveMind plugin
│   ├── cli/            # CLI command implementations (init, doctor)
│   ├── commands/       # Slash command integrations
│   ├── core/           # Low-level state, workflow, and trajectory management
│   ├── features/       # High-level domain capabilities (agent-contract, etc.)
│   ├── hooks/          # Handlers for OpenCode plugin events
│   ├── plugin/         # OpenCode SDK boundary and plugin assembly
│   ├── shared/         # Universal utilities and path resolution
│   └── tools/          # AI tool schemas and execution implementations
├── scripts/            # Build, linting, and healthcheck shell scripts
├── skills/             # External agent-facing skills and harnesses
├── tests/              # Unit and integration tests (.test.ts)
└── .hivemind/          # (Runtime Generated) State output directory
```

## Directory Purposes

**`src/plugin/`:**
- Purpose: The assembly-only boundary connecting to OpenCode.
- Contains: Hook mappers, SDK context initialization, renderer definitions.
- Key files: `src/plugin/opencode-plugin.ts`, `src/plugin/context-renderer.ts`, `src/plugin/runtime-snapshot.ts`

**`src/features/`:**
- Purpose: Domain-specific workflows and high-level logic encapsulation.
- Contains: Feature implementation logic for contracts, handoffs, and UI sessions.
- Key files: `src/features/agent-work-contract/engine/contract-store.ts`, `src/features/runtime-entry/nl-first-dispatch.ts`

**`src/core/`:**
- Purpose: The absolute domain primitives governing state definitions.
- Contains: Schema tracking files for trajectory ledgers and workflow continuous routing.
- Key files: `src/core/trajectory/trajectory-store.ts`, `src/core/workflow-management/workflow-router.ts`

**`src/hooks/`:**
- Purpose: Non-durable interception of OpenCode actions and prompts.
- Contains: Governance toasts, runtime loaders, prompt transformations.
- Key files: `src/hooks/soft-governance.ts`, `src/hooks/start-work/start-work-router.ts`

**`src/shared/`:**
- Purpose: Reusable abstractions preventing cross-domain dependency pollution.
- Contains: Centralized path definitions, logging, type contracts.
- Key files: `src/shared/paths.ts`, `src/shared/logging.ts`

## Key File Locations

**Entry Points:**
- `src/plugin/opencode-plugin.ts`: Primary OpenCode Plugin entry mapping all events.
- `src/cli.ts`: Entry point for external CLI binaries like `hm-init`.
- `src/index.ts`: Core barrel export exposing main capabilities.

**Configuration:**
- `package.json`: Contains workspace, binary alias mappings (`hm-*`), and strict dependencies.
- `tsconfig.json`: TypeScript build configuration (references `src/` and `tests/`).

**Core Logic:**
- `src/shared/paths.ts`: Sole authority defining all `.hivemind/` persistent path resolution logic via `getEffectivePaths()`.

**Testing:**
- `tests/`: Project-wide tests running via `tsx --test tests/*.test.ts`.

## Naming Conventions

**Files:**
- kebab-case: Standard usage for implementation files and module definitions (e.g., `opencode-plugin.ts`, `trajectory-store.ts`).
- `.test.ts`: Suffix for all unit testing files mapped closely alongside implementation or in `tests/`.

**Directories:**
- kebab-case: Directories adhere strictly to kebab-case structuring (`agent-work-contract`, `runtime-entry`).
- Feature Grouping: Modules group domains and provide an `index.ts` (barrel pattern) for clean API surface exposure.

## Where to Add New Code

**New Feature:**
- Primary code: `src/features/[feature-name]/`
- Tests: `src/features/[feature-name]/[module].test.ts` (or in `tests/` depending on scope)

**New Component/Module:**
- OpenCode Tool Definition: `src/tools/[tool-name]/`
- OpenCode Hook logic: `src/hooks/[hook-category]/`

**Utilities:**
- Shared helpers: `src/shared/` (Only if strictly domain-agnostic, otherwise encapsulate in feature directory).

## Special Directories

**`.hivemind/`:**
- Purpose: Local active operational state of the environment (trajectories, memory, ledgers).
- Generated: Yes (Created on runtime invocation or `hm-init`).
- Committed: No (Ignored via `.gitignore`, highly ephemeral).

**`skills/`:**
- Purpose: Externally loaded markdown instructions and JSON representations for AI capabilities.
- Generated: No (Authored artifacts).
- Committed: Yes.

---

*Structure analysis: 2026-03-21*
