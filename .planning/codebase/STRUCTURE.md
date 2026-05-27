# Codebase Structure

**Analysis Date:** 2026-05-28

## Overview

Hivemind is organized as a TypeScript npm package following a plugin architecture pattern. The codebase is split into:

- **`src/`** — Runtime implementation (npm package deliverables)
- **`.opencode/`** — OpenCode primitives (skills, agents, commands) — configuration only, no business logic
- **`.hivemind/`** — Internal state (journals, lineage, runtime state) — deep module persistence
- **`.planning/`** — Governance artifacts (requirements, roadmaps, architecture maps)
- **`dist/`** — Compiled TypeScript output (build artifact)
- **`bin/`** — CLI substrate (entry points for command-line usage)
- **`sidecar/`** — Next.js sidecar dashboard (read-only)

## Directory Layout

```
/Users/apple/hivemind-plugin-private/
├── .git/                              # Git repository metadata
├── .opencode/                         # OpenCode primitives (soft meta-concepts ONLY)
│   ├── agents/                        # Agent definitions (75 agents total)
│   ├── command/                       # Slash commands (19 commands)
│   ├── hooks/                         # Hook definitions
│   ├── skills/                        # Skills packages (34 skills total)
│   ├── rules/                         # Permission rules
│   └── state/                         # State configuration (NOT runtime state)
├── .hivemind/                         # Internal deep module state
│   ├── state/                         # Runtime state (session-continuity.json, delegations.json)
│   ├── journal/                       # Session journals (append-only event timeline)
│   ├── lineage/                       # Execution lineage tracking
│   ├── artifacts/                     # Phase artifacts and outputs
│   ├── planning/                      # Planning documentation
│   ├── session-tracker/               # Real-time session event tracking
│   ├── audit/                         # Audit artifacts
│   ├── governance/                    # Governance config
│   └── scripts/                       # Hivemind scripts
├── .planning/                         # Governance sector (NOT runtime)
│   ├── codebase/                      # Codebase analysis docs (ARCHITECTURE.md, STRUCTURE.md, etc.)
│   ├── architecture/                  # Architecture documentation
│   ├── research/                      # Research artifacts
│   ├── requirements/                  # Requirements documents
│   ├── phases/                        # Phase planning artifacts
│   └── debug/                         # Debug artifacts
├── src/                               # Runtime implementation (npm package)
│   ├── cli/                           # CLI implementation
│   ├── config/                        # Config subscriber and workflow
│   ├── coordination/                  # Delegation orchestration
│   ├── features/                      # Standalone runtime capabilities
│   ├── hooks/                         # Lifecycle hooks
│   ├── schema-kernel/                 # Zod schemas for validation
│   ├── shared/                        # Shared utilities and contracts
│   ├── task-management/               # Session continuity and state
│   ├── tools/                         # Tool entry points
│   ├── routing/                       # Session entry and behavioral profile
│   ├── sidecar/                       # Sidecar state
│   ├── plugin.ts                      # Plugin composition root
│   └── index.ts                       # Public API re-exports
├── sidecar/                           # Next.js sidecar dashboard
│   ├── src/                           # Sidecar source code
│   ├── package.json                   # Sidecar package manifest
│   ├── tsconfig.json                  # Sidecar TypeScript config
│   └── next.config.ts                 # Next.js config
├── bin/                               # CLI substrate
│   └── hivemind.cjs                   # CLI entry point
├── dist/                              # Compiled TypeScript output
│   ├── index.js                       # Main plugin entry
│   ├── plugin.js                      # Plugin composition root
│   └── cli/                           # CLI module
├── tests/                             # Test suite (Vitest)
│   ├── lib/                           # Unit tests for runtime modules
│   └── tools/                         # Unit tests for tools
├── assets/                            # Source-of-truth asset files
├── scripts/                           # Build and sync scripts
├── state/                             # Legacy state (migration target: .hivemind/state/)
├── docs/                              # Documentation
├── package.json                       # Npm package manifest
├── tsconfig.json                      # TypeScript configuration
├── vitest.config.ts                   # Vitest testing configuration
├── opencode.json                      # OpenCode plugin configuration
└── README.md                          # Project documentation
```

## Directory Purposes

### src/ (Runtime Implementation)

**Purpose:** Core npm package deliverables that ship to users

**Contains:**
- Plugin composition root (`src/plugin.ts`)
- Tool implementations (delegation, config, session, hivemind)
- Hook factories (lifecycle, guards, observers, transforms)
- Task management (continuity, journal, trajectory, lifecycle)
- Coordination (delegation, completion, concurrency, spawner)
- Features (session-tracker, auto-loop, background-command, doc-intelligence, runtime-pressure, sdk-supervisor)
- Shared utilities and type contracts
- Schema kernel (Zod validation schemas)
- Routing (session entry, behavioral profile, command engine)
- Configuration (subscriber, compiler, workflow)
- CLI (commands, router, renderer)

**Key Files:**
- `src/plugin.ts` — Composition root (~554 LOC, largest module)
- `src/index.ts` — Public API re-exports
- `src/shared/session-api.ts` — OpenCode SDK client wrapper
- `src/coordination/delegation/manager.ts` — WaiterModel delegation manager
- `src/task-management/continuity/index.ts` — Session persistence I/O
- `src/features/session-tracker/index.ts` — SessionTracker class

### .opencode/ (OpenCode Primitives)

**Purpose:** Soft meta-concepts that configure runtime behavior from outside the npm package

**Contains:**
- **`agents/`** — Agent definitions (75 agents: 33 gsd-* specialist agents, 31 hm-* harness agents, 11 hf-* meta-builder agents)
- **`command/`** — Slash commands (19 commands: 7 core, 7 extended, 1 sync, 4 test)
- **`skills/`** — Skill packages (34 skills: 13 hf-l2-*, 3 gate-l3-*, 6 stack-l3-*, 1 hivemind-*, 11 unprefixed)
- **`rules/`** — Permission rules (universal-rules.md, etc.)
- **`hooks/`** — Hook definitions (NOT runtime hooks, these are configuration templates)

**IMPORTANT:** No business logic lives here. No runtime state is stored here. No build artifacts belong here.

### .hivemind/ (Internal State)

**Purpose:** Deep module persistence for Hivemind runtime state

**Contains:**
- **`state/`** — Runtime state files:
  - `session-continuity.json` — Session persistence and recovery
  - `delegations.json` — Delegation records
  - `task-status.json` — Task state tracking
- **`journal/`** — Append-only event timeline (session journals)
- **`lineage/`** — Execution lineage tracking
- **`artifacts/`** — Phase artifacts and outputs
- **`session-tracker/`** — Real-time session event tracking
- **`audit/`** — Audit artifacts
- **`governance/`** — Governance config

**IMPORTANT:** This is internal state, NOT user configuration. Do NOT commit secrets or credentials here.

### .planning/ (Governance Sector)

**Purpose:** Planning and governance artifacts (NOT runtime code)

**Contains:**
- **`codebase/`** — Codebase analysis documents:
  - `ARCHITECTURE.md` — Architecture pattern and layers
  - `STRUCTURE.md` — Directory layout and conventions
  - `STACK.md` — Technology stack
  - `INTEGRATIONS.md` — External integrations
  - `CONVENTIONS.md` — Coding conventions
  - `TESTING.md` — Testing patterns
  - `CONCERNS.md` — Technical debt and issues
- **`architecture/`** — Architecture documentation:
  - `hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model
  - `hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract
- **`research/`** — Research artifacts (30+ research files)
- **`requirements/`** — Requirements documents
- **`phases/`** — Phase planning artifacts
- **`debug/`** — Debug artifacts

**IMPORTANT:** This is governance sector, NOT runtime code. Planning decisions, not implementation.

### tests/ (Test Suite)

**Purpose:** Unit and integration tests for runtime modules

**Contains:**
- **`lib/`** — Unit tests for runtime modules (mirrors `src/` structure)
- **`tools/`** — Unit tests for tools (mirrors `src/tools/` structure)

**Test Framework:** Vitest (v4.1.7)

**Run Commands:**
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### bin/ (CLI Substrate)

**Purpose:** CLI entry points for command-line usage

**Contains:**
- `bin/hivemind.cjs` — CLI entry point

**Usage:**
```bash
npx hivemind <command>
```

### dist/ (Compiled Output)

**Purpose:** Compiled TypeScript output (build artifact)

**Contains:**
- `dist/index.js` — Main plugin entry point
- `dist/plugin.js` — Plugin composition root
- `dist/cli/index.js` — CLI module
- `dist/**/*.d.ts` — TypeScript declaration files
- `dist/**/*.js.map` — Source maps

**Build Command:** `npm run build`

### sidecar/ (Sidecar Dashboard)

**Purpose:** Read-only Next.js sidecar dashboard for runtime visualization

**Contains:**
- `sidecar/src/` — Sidecar source code
- `sidecar/package.json` — Sidecar package manifest
- `sidecar/tsconfig.json` — Sidecar TypeScript config
- `sidecar/next.config.ts` — Next.js config

**Dependencies:** Next.js 15, React 19, @json-render/react

## Key File Locations

### Entry Points

**Plugin Composition Root:**
- `src/plugin.ts` — Main plugin initialization and registration (~554 LOC)

**Public API:**
- `src/index.ts` — Re-exports for public consumption

**CLI Entry Point:**
- `bin/hivemind.cjs` — Command-line interface

### Configuration Files

**Package Manifest:**
- `package.json` — Npm package configuration, dependencies, scripts

**TypeScript Config:**
- `tsconfig.json` — TypeScript compiler options (strict mode, ES2022 target)

**Test Config:**
- `vitest.config.ts` — Vitest testing framework configuration

**OpenCode Config:**
- `opencode.json` — OpenCode plugin configuration

### Core Logic

**Shared Utilities:**
- `src/shared/session-api.ts` — OpenCode SDK client wrapper
- `src/shared/helpers.ts` — Utility functions (asString, getNestedValue)
- `src/shared/state.ts` — In-memory state management
- `src/shared/types.ts` — Shared TypeScript types
- `src/shared/security/path-scope.ts` — Path scope validation
- `src/shared/security/redaction.ts` — Data redaction

**Delegation Manager:**
- `src/coordination/delegation/manager.ts` — WaiterModel dispatch and completion detection

**Task Management:**
- `src/task-management/continuity/index.ts` — Session persistence I/O
- `src/task-management/journal/index.ts` — Event append operations
- `src/task-management/lifecycle/index.ts` — Lifecycle manager

**Features:**
- `src/features/session-tracker/index.ts` — SessionTracker class
- `src/features/runtime-pressure/index.ts` — Runtime pressure detection
- `src/features/sdk-supervisor/index.ts` — SDK supervisor

### Testing

**Test Files:**
- `tests/lib/**/*.test.ts` — Unit tests for runtime modules
- `tests/tools/**/*.test.ts` — Unit tests for tools

**Coverage Config:**
- `vitest.config.ts` — Coverage configuration (excludes `src/index.ts`)

## Naming Conventions

### Files

**Source Files:**
- TypeScript files: `.ts` extension (e.g., `src/plugin.ts`, `src/coordination/delegation/manager.ts`)
- CLI scripts: `.cjs` extension (e.g., `bin/hivemind.cjs`)
- Test files: `.test.ts` extension (e.g., `tests/lib/helpers.test.ts`)
- Config files: `.json`, `.jsonc`, `.ts` as appropriate

**Directory Names:**
- Lowercase with hyphens (e.g., `task-management`, `coordination/delegation`)
- No underscores (except in file names like `session-continuity.json`)

### Directories

**Pattern:**
- `src/` — Runtime implementation
- `.opencode/` — OpenCode primitives (configuration only)
- `.hivemind/` — Internal state (deep module persistence)
- `.planning/` — Governance artifacts
- `dist/` — Compiled output
- `tests/` — Test suite
- `bin/` — CLI substrate
- `scripts/` — Build and sync scripts
- `assets/` — Source-of-truth asset files
- `sidecar/` — Sidecar dashboard

### Variable Naming

**TypeScript Conventions:**
- Variables: camelCase (e.g., `sessionId`, `delegationId`)
- Constants: UPPER_SNAKE_CASE (e.g., `WATCH_TIMEOUT_MS`)
- Types: PascalCase (e.g., `Delegation`, `RuntimePolicy`)
- Functions: camelCase (e.g., `createHarnessLifecycleManager`)
- Classes: PascalCase (e.g., `DelegationManager`, `CompletionDetector`)

**File Paths:**
- Use backticks for code references: `src/plugin.ts`, `src/coordination/delegation/manager.ts`
- Relative paths: `./src/shared/session-api.ts`

### Function Naming

**Pattern:**
- Verbs for functions (e.g., `createHarnessLifecycleManager`, `runAutoLoop`)
- Nouns for classes (e.g., `DelegationManager`, `SessionTracker`)
- Prefixes for factory functions (e.g., `createDelegateTaskTool`, `createSessionHooks`)

**Examples:**
- `createHarnessLifecycleManager()` — Factory function
- `DelegationManager` — Class
- `runAutoLoop()` — Function
- `getSessionContinuity()` — Function

## File Organization Patterns

### Layer-Based Organization

**Core → Tools → Hooks → Features → Shared**

```
src/
├── plugin.ts                  # Composition root (core)
├── tools/                     # Tool entry points
├── hooks/                     # Hook factories
├── features/                  # Runtime capabilities
├── shared/                    # Utilities and contracts
├── routing/                   # Session entry and behavioral profile
├── config/                    # Config subscriber and workflow
├── schema-kernel/             # Validation schemas
├── coordination/              # Delegation orchestration
├── task-management/           # Session continuity and state
├── cli/                       # CLI implementation
└── sidecar/                   # Sidecar state
```

### Feature-Based Organization

**Features layer groups related capabilities:**

```
src/features/
├── session-tracker/           # Session event tracking
├── auto-loop/                 # Automatic task loop
├── ralph-loop/                # Ralph loop with escalation
├── background-command/        # Background PTY execution
├── doc-intelligence/          # Document querying
├── governance-engine/         # Governance sessions
├── prompt-packet/             # Prompt handling
├── runtime-pressure/          # Runtime pressure monitoring
├── sdk-supervisor/            # SDK wrapper supervision
├── agent-work-contracts/      # Agent work contracts
└── bootstrap/                 # Primitive registry and control plane
```

### Coordination Sub-Layers

**Delegation coordination split by concern:**

```
src/coordination/
├── delegation/                # DelegationManager and lifecycle
├── completion/                # Dual-signal completion detection
├── concurrency/               # Task queue management
├── command-delegation/        # Slash command delegation
├── sdk-delegation/            # SDK child session spawning
└── spawner/                   # Session spawning
```

### Task Management Sub-Layers

**State management split by data type:**

```
src/task-management/
├── continuity/                # Session persistence (JSON)
├── journal/                   # Event timeline (append-only)
├── trajectory/                # Lineage tracking
└── lifecycle/                 # State machine (task status)
```

### Tool Organization by Domain

**Tools grouped by functionality:**

```
src/tools/
├── delegation/                # Agent delegation tools
├── config/                    # Configuration tools
├── session/                   # Session management tools
├── hivemind/                  # Hivemind-specific tools
├── prompt/                    # Prompt analysis tools
└── hivemind-run-background-command/  # Background task tools
```

## Where to Add New Code

### New Tool

**Location:** `src/tools/<domain>/index.ts`

**Steps:**
1. Create tool module in `src/tools/<domain>/`
2. Use `tool()` function from OpenCode SDK
3. Define Zod schema for input validation
4. Export from `src/tools/<domain>/index.ts`
5. Register in `src/plugin.ts`

**Example:**
```typescript
// src/tools/my-tool/index.ts
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

export const createMyTool = tool({
  name: 'my-tool',
  description: 'Does something cool',
  schema: z.object({
    input: z.string()
  }),
  async execute(context) {
    // Implementation
  }
})
```

### New Hook

**Location:** `src/hooks/<category>/<name>.ts`

**Steps:**
1. Create hook factory in `src/hooks/<category>/`
2. Use `hook()` function from OpenCode SDK
3. Define lifecycle event type
4. Export from `src/hooks/<category>/index.ts`
5. Register in `src/plugin.ts`

**Example:**
```typescript
// src/hooks/my-hook/index.ts
import { hook } from '@opencode-ai/plugin'

export const createMyHook = hook('lifecycle', 'before-tool', async (context) => {
  // Pre-tool logic
})
```

### New Feature

**Location:** `src/features/<name>/index.ts`

**Steps:**
1. Create feature module in `src/features/<name>/`
2. Implement feature logic
3. Export from `src/features/<name>/index.ts`
4. Initialize in `src/plugin.ts`

**Example:**
```typescript
// src/features/my-feature/index.ts
export const createMyFeature = () => {
  // Feature logic
}
```

### New Agent

**Location:** `.opencode/agents/<name>.md`

**Steps:**
1. Create agent file in `.opencode/agents/`
2. Use Agent Development skill for XML markup
3. Define agent description, tools, and constraints
4. Register in `.opencode/agents/AGENTS.md`

**IMPORTANT:** Agents are configuration only. No business logic.

### New Skill

**Location:** `.opencode/skills/<name>/SKILL.md`

**Steps:**
1. Create skill directory in `.opencode/skills/<name>/`
2. Write `SKILL.md` with metadata and instructions
3. Create `references/` with supporting documentation
4. Register in `.opencode/skills/SKILLS.md`

**IMPORTANT:** Skills are configuration only. No business logic.

### New Test

**Location:** `tests/<module>.test.ts`

**Steps:**
1. Create test file in `tests/` matching source structure
2. Use Vitest test framework
3. Add tests for unit, integration, and E2E scenarios
4. Run `npm test` to verify

**Example:**
```typescript
// tests/my-module.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../../src/my-module'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

## Special Directories

### .opencode/

**Purpose:** OpenCode primitives (configuration only, NO business logic)

**Generated:** No — manually authored

**Committed:** Yes — git-tracked configuration

**Contents:**
- `agents/` — Agent definitions (75 agents)
- `skills/` — Skill packages (34 skills)
- `command/` — Slash commands (19 commands)
- `rules/` — Permission rules

**IMPORTANT:** This is "soft meta-concepts" — configuration that composes runtime behavior from outside the npm package. No `src/` code, no build artifacts, no runtime state.

### .hivemind/

**Purpose:** Internal deep module persistence

**Generated:** Partially — journals and lineage are append-only
  - `journal/` — Auto-appended session events
  - `lineage/` — Auto-tracked execution lineage

**Committed:** No — `.gitignore` excludes `.hivemind/`

**Contents:**
- `state/` — Runtime state files
- `journal/` — Session journals
- `lineage/` — Execution lineage
- `artifacts/` — Phase outputs
- `session-tracker/` — Real-time tracking
- `audit/` — Audit artifacts
- `governance/` — Governance config

**IMPORTANT:** This is internal state, NOT user configuration. Do NOT commit secrets or credentials here.

### .planning/

**Purpose:** Governance artifacts

**Generated:** Partially — codebase docs are auto-generated
  - `codebase/` — Auto-generated analysis documents

**Committed:** Yes — git-tracked governance artifacts

**Contents:**
- `codebase/` — Codebase analysis (ARCHITECTURE.md, STRUCTURE.md, etc.)
- `architecture/` — Architecture documentation
- `research/` — Research artifacts
- `requirements/` — Requirements documents
- `phases/` — Phase planning artifacts
- `debug/` — Debug artifacts

**IMPORTANT:** This is governance sector, NOT runtime code. Planning decisions, not implementation.

### dist/

**Purpose:** Compiled TypeScript output

**Generated:** Yes — build artifact from `npm run build`

**Committed:** No — `.gitignore` excludes `dist/`

**Contents:**
- `dist/**/*.js` — Compiled JavaScript
- `dist/**/*.d.ts` — TypeScript declarations
- `dist/**/*.js.map` — Source maps

**IMPORTANT:** Never edit files in `dist/` manually. Always rebuild with `npm run build`.

### sidecar/

**Purpose:** Read-only Next.js sidecar dashboard

**Generated:** No — manually authored

**Committed:** Yes — git-tracked

**Contents:**
- `src/` — Sidecar source code
- `package.json` — Sidecar package manifest
- `tsconfig.json` — Sidecar TypeScript config
- `next.config.ts` — Next.js config

**IMPORTANT:** This is a separate package that reads from `.hivemind/` and `.planning/`. It is read-only for canonical state.

---

*Structure analysis: 2026-05-28*
