# Codebase Structure

**Analysis Date:** 2026-05-28

## Directory Layout

```
hivemind-plugin-private/
├── src/                          # Source code (TypeScript)
│   ├── plugin.ts                 # Composition root (554 LOC)
│   ├── index.ts                  # Public API re-exports (30 LOC)
│   ├── shared/                   # Leaf utilities, types, SDK wrappers
│   ├── coordination/             # Delegation, completion, concurrency
│   ├── task-management/          # Continuity, journal, lifecycle, trajectory
│   ├── features/                 # Standalone runtime features
│   ├── hooks/                    # Lifecycle, guards, observers, transforms
│   ├── tools/                    # Tool implementations (23 tools)
│   ├── config/                   # Config subscriber/compiler/workflow
│   ├── routing/                  # Session entry, behavioral profile, command engine
│   ├── schema-kernel/            # Zod schemas and config schema support
│   ├── cli/                      # CLI substrate (bin scripts)
│   └── sidecar/                  # Sidecar dashboard (Next.js)
├── tests/                        # Test files
│   ├── lib/                      # Unit tests for src/ modules
│   └── tools/                    # Tool-focused tests
├── .opencode/                    # OpenCode primitives (agents, skills, commands)
│   ├── agents/                   # Agent definitions
│   ├── skills/                   # Skill packages
│   ├── commands/                 # Command files
│   └── plugins/                  # Plugin loader wrappers
├── .hivemind/                    # Internal runtime state
│   └── state/                    # Continuity store, session data
├── .planning/                    # Planning documents and governance
│   ├── codebase/                 # Codebase analysis (this document)
│   ├── architecture/             # Architecture decision records
│   └── research/                 # Research artifacts
├── .hivefiver-meta-builder/      # Source-of-truth for primitives
│   ├── agents-lab/               # Agent definitions (source)
│   ├── skills-lab/               # Skill definitions (source)
│   └── commands-lab/             # Command definitions (source)
├── dist/                         # Compiled output (TypeScript declarations + JS)
├── bin/                          # CLI scripts
├── scripts/                      # Build and sync scripts
├── docs/                         # Documentation
├── assets/                       # Static assets
├── package.json                  # npm package manifest
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
├── opencode.json                 # OpenCode configuration
└── AGENTS.md                     # Agent instructions
```

## Directory Purposes

**`src/shared/`:**
- Purpose: Leaf utilities, types, SDK wrappers, runtime policy
- Contains: Type definitions, state manager, helpers, session API
- Key files: `types.ts`, `state.ts`, `helpers.ts`, `session-api.ts`, `runtime-policy.ts`

**`src/coordination/`:**
- Purpose: Delegation dispatch, completion detection, concurrency control
- Contains: Delegation modules, completion detector, concurrency queue
- Key files: `delegation/manager.ts`, `completion/detector.ts`, `concurrency/queue.ts`

**`src/task-management/`:**
- Purpose: Session lifecycle, continuity persistence, journaling, trajectory
- Contains: Lifecycle manager, continuity store, journal, trajectory
- Key files: `continuity/index.ts`, `lifecycle/index.ts`, `journal/index.ts`

**`src/features/`:**
- Purpose: Standalone runtime features
- Contains: Session tracker, PTY manager, governance engine, doc intelligence
- Key files: `session-tracker/index.ts`, `background-command/pty/pty-runtime.ts`

**`src/hooks/`:**
- Purpose: Lifecycle hooks for tool execution, session events, guards
- Contains: Core hooks, session hooks, tool guards, event observers
- Key files: `lifecycle/core-hooks.ts`, `guards/tool-guard-hooks.ts`

**`src/tools/`:**
- Purpose: Tool implementations (23 tools)
- Contains: Delegation tools, session tools, config tools, hivemind tools
- Key files: `delegation/delegate-task.ts`, `session/execute-slash-command.ts`

**`src/config/`:**
- Purpose: Config subscriber/compiler/workflow
- Contains: Config loading, caching, invalidation
- Key files: `subscriber.ts`, `workflow/`

**`src/routing/`:**
- Purpose: Session entry, behavioral profile, command engine
- Contains: Session entry gate, behavioral profile resolver, command engine
- Key files: `session-entry/intake-gate.ts`, `behavioral-profile/resolve-behavioral-profile.ts`

**`src/schema-kernel/`:**
- Purpose: Zod schemas for configuration and runtime types
- Contains: Schema definitions, validation logic
- Key files: `hivemind-configs.schema.ts`, `index.ts`

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: Plugin composition root (loaded by OpenCode)
- `src/index.ts`: Public API re-exports for npm package

**Configuration:**
- `src/config/subscriber.ts`: Config loading and caching
- `src/schema-kernel/hivemind-configs.schema.ts`: Config schema definition
- `tsconfig.json`: TypeScript configuration
- `vitest.config.ts`: Test configuration

**Core Logic:**
- `src/coordination/delegation/manager.ts`: Delegation facade
- `src/coordination/delegation/coordinator.ts`: Delegation coordinator
- `src/task-management/continuity/index.ts`: Continuity store
- `src/task-management/lifecycle/index.ts`: Lifecycle manager

**Testing:**
- `tests/lib/`: Unit tests mirroring `src/` structure
- `tests/tools/`: Tool-focused tests

## Naming Conventions

**Files:**
- `kebab-case.ts` for module files (e.g., `delegation-manager.ts`)
- `index.ts` for barrel exports (e.g., `src/shared/index.ts`)
- `*.test.ts` or `*.spec.ts` for test files (e.g., `detector.test.ts`)

**Directories:**
- `kebab-case` for module directories (e.g., `task-management/`)
- `lifecycle/` for lifecycle-related code
- `continuity/` for persistence-related code

**Types:**
- `PascalCase` for interfaces and types (e.g., `DelegationStatus`, `TaskStatus`)
- `UPPER_SNAKE_CASE` for constants (e.g., `MAX_DELEGATION_DEPTH`)

**Functions:**
- `camelCase` for functions (e.g., `getSessionContinuity`, `createHarnessLifecycleManager`)
- Factory functions prefixed with `create` (e.g., `createHarnessLifecycleManager`)

**Classes:**
- `PascalCase` for classes (e.g., `DelegationManager`, `CompletionDetector`)
- Manager/Suffix pattern for class names (e.g., `SlotManager`, `NotificationRouter`)

## Where to Add New Code

**New Tool:**
- Implementation: `src/tools/{category}/{tool-name}.ts`
- Registration: `src/plugin.ts` (add to `tool:` object)
- Tests: `tests/tools/{category}/{tool-name}.test.ts`

**New Hook:**
- Implementation: `src/hooks/{type}/{hook-name}.ts`
- Registration: `src/plugin.ts` (add to hook composition)
- Tests: `tests/lib/hooks/{type}/{hook-name}.test.ts`

**New Feature:**
- Implementation: `src/features/{feature-name}/index.ts`
- Registration: `src/plugin.ts` (import and wire)
- Tests: `tests/lib/features/{feature-name}/`

**New Coordination Module:**
- Implementation: `src/coordination/{module-name}/index.ts`
- Tests: `tests/lib/coordination/{module-name}/`

**New Schema:**
- Implementation: `src/schema-kernel/{schema-name}.schema.ts`
- Registration: `src/schema-kernel/index.ts` (export)

## Special Directories

**`dist/`:**
- Purpose: Compiled TypeScript output
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`.hivemind/state/`:**
- Purpose: Runtime state persistence (continuity store, session data)
- Generated: Yes (by runtime)
- Committed: No (in `.gitignore`)

**`.opencode/`:**
- Purpose: OpenCode primitives (agents, skills, commands)
- Generated: Yes (by sync from `.hivefiver-meta-builder/`)
- Committed: Yes (configuration)

**`.planning/`:**
- Purpose: Planning documents, governance, architecture
- Generated: No (manual)
- Committed: Yes

## Module Organization Pattern

```
src/
├── {module}/
│   ├── index.ts          # Barrel exports
│   ├── types.ts          # Type definitions (if needed)
│   ├── {class-name}.ts   # Main implementation
│   └── {helper}.ts       # Helper functions (if needed)
```

## Dependency Rules

- **Leaf Layer:** `src/shared/` imports nothing from other `src/` modules
- **Schema Kernel:** Imports nothing from other `src/` modules
- **Coordination:** May import from `src/shared/` and `src/task-management/`
- **Task Management:** May import from `src/shared/` and `src/config/`
- **Features:** May import from `src/shared/` and `src/task-management/`
- **Hooks:** May import from `src/shared/`, `src/task-management/`, `src/coordination/`
- **Tools:** May import from `src/shared/`, `src/coordination/`, `src/features/`
- **Composition Root:** May import from all modules

## File Size Guidelines

- **Max module size:** 500 LOC
- **Recommended:** 100-300 LOC per module
- **Current largest:** `src/plugin.ts` (554 LOC) — borderline acceptable

---

*Structure analysis: 2026-05-28*
