# Codebase Structure

**Analysis Date:** 2026-04-06

## Directory Layout

```
opencode-harness/
├── src/                          # Source code (npm package)
│   ├── plugin.ts                 # Composition root (~450 LOC)
│   ├── index.ts                  # Public API re-exports (barrel)
│   ├── lib/                      # Core library modules
│   │   ├── types.ts              # Shared types + constants (leaf — no imports)
│   │   ├── task-status.ts        # Task status transitions + guards (leaf)
│   │   ├── helpers.ts            # Pure utilities (leaf)
│   │   ├── state.ts              # In-memory Maps (sessionStats, rootBudgets)
│   │   ├── continuity.ts         # Durable JSON persistence (~635 LOC)
│   │   ├── concurrency.ts        # Keyed semaphore (FIFO queue)
│   │   ├── completion-detector.ts # Two-signal completion detection
│   │   ├── session-api.ts        # Typed OpenCode SDK wrappers
│   │   ├── runtime.ts            # Event→status mapping
│   │   ├── notification-handler.ts # Async completion notification
│   │   ├── lifecycle-manager.ts  # Session lifecycle state machine (~500 LOC)
│   │   └── agent-registry.ts     # Agent config parsing (frontmatter)
│   ├── tools/                    # LLM-facing tools (write-side)
│   │   ├── prompt-skim/          # Fast prompt content scanning
│   │   │   ├── index.ts          # Public API re-export
│   │   │   ├── tools.ts          # Tool implementation
│   │   │   └── types.ts          # Type definitions
│   │   ├── prompt-analyze/       # Line-by-line prompt analysis
│   │   │   ├── index.ts          # Public API re-export
│   │   │   ├── tools.ts          # Tool implementation
│   │   │   └── types.ts          # Type definitions
│   │   ├── context-budget/       # Context budget calculation
│   │   │   ├── index.ts          # Public API re-export
│   │   │   ├── tools.ts          # Tool implementation
│   │   │   └── types.ts          # Type definitions
│   │   └── session-patch/        # Session file section patching
│   │       ├── index.ts          # Public API re-export
│   │       ├── tools.ts          # Tool implementation
│   │       └── types.ts          # Type definitions
│   ├── hooks/                    # Read-side context injection
│   │   ├── system-transform.ts   # Injects prompt-enhance contract into system prompt
│   │   └── messages-transform.ts # Injects context packets for prompt-enhance sessions
│   ├── shared/                   # Transitional utilities (leaf modules)
│   │   ├── tool-helpers.ts       # renderToolResult()
│   │   └── tool-response.ts      # success/error/pending envelope
│   ├── schema-kernel/            # Zod contracts (machine-authoritative)
│   │   ├── index.ts              # Barrel re-export
│   │   └── prompt-enhance.schema.ts # 6 Zod schemas for prompt-enhance pipeline
│   └── plugins/                  # Additional plugin exports
│       └── prompt-enhance.ts     # Standalone prompt-enhance plugin (compaction tracking)
├── tests/                        # Unit + integration tests (vitest)
│   ├── lib/                      # Mirror of src/lib/
│   │   ├── helpers.test.ts
│   │   ├── task-status.test.ts
│   │   ├── session-api.test.ts
│   │   ├── notification-handler.test.ts
│   │   ├── completion-detector.test.ts
│   │   └── agent-registry.test.ts
│   ├── tools/                    # Tool tests
│   │   ├── prompt-skim.test.ts
│   │   ├── prompt-analyze.test.ts
│   │   ├── context-budget.test.ts
│   │   └── session-patch.test.ts
│   ├── schema-kernel/            # Schema validation tests
│   │   └── prompt-enhance.schema.test.ts
│   ├── integration/              # Integration tests
│   │   └── prompt-enhance-pipeline.test.ts
│   └── plugins/                  # Plugin tests
│       └── prompt-enhance-compaction.test.ts
├── .opencode/                    # Soft meta-concepts (user-configurable)
│   ├── agents/                   # Agent definitions (coordinator, builder, etc.)
│   ├── commands/                 # Slash commands (start-work, plan, etc.)
│   ├── rules/                    # Governance rules
│   ├── plugins/                  # Runtime plugin stubs
│   ├── hivefiver/                # Hivefiver workflow definitions
│   ├── trashskills/              # Deprecated/unused skills
│   └── tools/                    # Tool definitions
├── package.json                  # Package manifest
├── tsconfig.json                 # TypeScript config (ES2022, strict)
├── vitest.config.ts              # Vitest config (globals: true)
├── opencode.json                 # OpenCode plugin config
├── AGENTS.md                     # Project governance
├── README.md                     # Package documentation
└── LICENSE                       # MIT license
```

## Directory Purposes

**`src/`** — npm package source. Compiled to `dist/` via `tsc -p tsconfig.json`. Two entry points:
- `src/index.ts` → `opencode-harness` (library exports)
- `src/plugin.ts` → `opencode-harness/plugin` (OpenCode plugin)

**`src/lib/`** — Core business logic. 11 modules with clear dependency ordering:
- Leaf (no imports from lib/): `types.ts`, `task-status.ts`, `helpers.ts`
- Near-leaf: `concurrency.ts`, `completion-detector.ts`
- Mid-level: `state.ts`, `continuity.ts`, `session-api.ts`, `runtime.ts`, `notification-handler.ts`, `agent-registry.ts`
- Deepest: `lifecycle-manager.ts` (depends on most modules, 2 levels deep)

**`src/tools/`** — LLM-facing tools. Each tool follows the pattern: `index.ts` (barrel), `tools.ts` (implementation), `types.ts` (type definitions). Tools use `tool.schema` (Zod) for arg definitions and validate outputs against `src/schema-kernel/` contracts.

**`src/hooks/`** — Read-side OpenCode plugin hooks. No durable writes. Transform system prompts and message history based on session continuity data.

**`src/shared/`** — Transitional utilities. Leaf modules with no internal dependencies. `tool-helpers.ts` provides `renderToolResult()`, `tool-response.ts` provides the `success/error/pending` envelope pattern.

**`src/schema-kernel/`** — Machine-authoritative Zod contracts. 6 schemas for the prompt-enhance pipeline: `PromptSkimResultSchema`, `PromptAnalysisResultSchema`, `ContextBudgetRecordSchema`, `SessionPatchRecordSchema`, `EnhancedPromptOutputSchema`, `PipelineStateSchema`.

**`src/plugins/`** — Additional plugin exports. `prompt-enhance.ts` is a standalone plugin for compaction tracking (separate from the main harness control plane).

**`tests/`** — Mirrors `src/` structure. Uses vitest with globals enabled (no imports needed for `describe`, `it`, `expect`). Coverage targets `src/**/*.ts`, excludes `src/index.ts`.

**`.opencode/`** — User-local runtime configuration. Not part of the npm package. Contains agent definitions, commands, rules, and workflow definitions for OpenCode consumption.

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: OpenCode plugin composition root — exports `HarnessControlPlane`
- `src/index.ts`: Library re-exports — exports all `src/lib/*` modules
- `src/plugins/prompt-enhance.ts`: Standalone prompt-enhance plugin — exports `PromptEnhancePlugin`

**Configuration:**
- `package.json`: Package manifest, build scripts, peer dependencies
- `tsconfig.json`: TypeScript strict mode, ES2022 target, NodeNext module resolution
- `vitest.config.ts`: Test configuration, coverage settings
- `opencode.json`: OpenCode plugin registration

**Core Logic:**
- `src/lib/lifecycle-manager.ts`: Session lifecycle state machine (~500 LOC)
- `src/lib/continuity.ts`: Durable JSON persistence (~635 LOC)
- `src/lib/concurrency.ts`: Keyed semaphore with FIFO queue
- `src/lib/completion-detector.ts`: Two-signal completion detection
- `src/lib/state.ts`: In-memory Maps for fast-path state access

**Testing:**
- `tests/lib/`: Unit tests for library modules
- `tests/tools/`: Unit tests for tools
- `tests/schema-kernel/`: Schema validation tests
- `tests/integration/`: Integration tests for prompt-enhance pipeline
- `tests/plugins/`: Plugin tests for compaction tracking

## Dependency Graph

```
plugin.ts (composition root)
├── lib/continuity.ts
│   └── lib/types.ts (leaf)
├── lib/helpers.ts (leaf)
│   └── lib/types.ts (leaf)
├── lib/lifecycle-manager.ts
│   ├── lib/concurrency.ts
│   │   └── (leaf — no internal deps)
│   ├── lib/completion-detector.ts
│   │   └── (leaf — no internal deps)
│   ├── lib/continuity.ts
│   ├── lib/helpers.ts
│   ├── lib/notification-handler.ts
│   │   └── lib/session-api.ts
│   │       ├── lib/helpers.ts
│   │       └── @opencode-ai/sdk (peer)
│   ├── lib/runtime.ts
│   │   └── lib/helpers.ts
│   ├── lib/session-api.ts
│   ├── lib/state.ts
│   │   └── lib/types.ts
│   └── lib/types.ts
├── lib/session-api.ts
├── lib/state.ts
├── lib/types.ts
├── tools/prompt-skim/index.ts
│   ├── tools/prompt-skim/tools.ts
│   │   ├── shared/tool-helpers.ts (leaf)
│   │   ├── shared/tool-response.ts (leaf)
│   │   └── schema-kernel/prompt-enhance.schema.ts
│   └── tools/prompt-skim/types.ts
│       └── schema-kernel/prompt-enhance.schema.ts
├── tools/prompt-analyze/index.ts (same pattern)
├── tools/context-budget/index.ts (same pattern)
├── tools/session-patch/index.ts (same pattern)
├── hooks/system-transform.ts
│   └── lib/state.ts
└── hooks/messages-transform.ts
    └── lib/continuity.ts
```

**Dependency Rules (enforced by design):**
- `types.ts` is leaf — depends on nothing within the package
- `helpers.ts`, `concurrency.ts`, `completion-detector.ts` — leaf or near-leaf
- `lifecycle-manager.ts` depends on most modules (deepest chain: 2 levels)
- No circular dependencies
- Max module size: 500 LOC (continuity.ts at ~635 LOC exceeds this — known debt)

## Naming Conventions

**Files:**
- kebab-case for all files: `lifecycle-manager.ts`, `completion-detector.ts`
- `*.test.ts` for test files: `helpers.test.ts`, `task-status.test.ts`
- `index.ts` for barrel re-exports in tool directories
- `types.ts` for type definitions co-located with tool implementations
- `tools.ts` for tool implementation

**Directories:**
- kebab-case: `prompt-skim/`, `context-budget/`, `schema-kernel/`
- Singular: `lib/`, `tools/`, `hooks/`, `shared/`

**Exports:**
- PascalCase for classes: `HarnessLifecycleManager`, `DelegationConcurrencyQueue`, `CompletionDetector`
- camelCase for functions: `createHarnessLifecycleManager()`, `buildPromptText()`, `inferContinuityStatusFromEvent()`
- SCREAMING_SNAKE_CASE for constants: `MAX_DESCENDANTS_PER_ROOT`, `VALID_AGENTS`, `CIRCUIT_BREAKER_THRESHOLD`

## Where to Add New Code

**New Tool:**
- Create directory: `src/tools/<tool-name>/`
- Add `tools.ts` with `create<ToolName>Tool()` function using `tool()` from `@opencode-ai/plugin/tool`
- Add `types.ts` with `Action`, `Args`, and result types (re-export from schema-kernel if applicable)
- Add `index.ts` barrel re-export
- Register in `src/plugin.ts` under the `tool` object
- Add Zod schema to `src/schema-kernel/prompt-enhance.schema.ts` if output needs validation
- Add test: `tests/tools/<tool-name>.test.ts`

**New Library Module:**
- Add file: `src/lib/<module-name>.ts`
- Re-export from `src/index.ts`
- Add test: `tests/lib/<module-name>.test.ts`

**New Hook:**
- Add file: `src/hooks/<hook-name>.ts`
- Register in `src/plugin.ts` under the appropriate hook key
- Hooks should be read-only — no durable writes

**New Schema:**
- Add Zod schema to `src/schema-kernel/prompt-enhance.schema.ts`
- Export type via `src/schema-kernel/index.ts`
- Tool types re-export from schema-kernel, not defined locally

## Special Directories

**`.opencode/`** — User-local runtime configuration. Not shipped with npm package. Contains:
- `agents/`: Agent definitions (coordinator, builder, critic, researcher, etc.)
- `commands/`: Slash commands (start-work, plan, deep-init, etc.)
- `rules/`: Governance rules (anti-patterns, commit governance, etc.)
- `plugins/`: Runtime plugin stubs (thin wrappers re-exporting `dist/`)
- `hivefiver/`: Hivefiver-specific workflow definitions
- `trashskills/`: Deprecated/unused skills (should be cleaned up)

**`dist/`** — Compiled output. Generated by `npm run build`. Not committed to git. Contains:
- `dist/index.js`, `dist/index.d.ts` — Library entry point
- `dist/plugin.js`, `dist/plugin.d.ts` — Plugin entry point
- `dist/lib/` — Compiled library modules
- `dist/tools/` — Compiled tools
- `dist/hooks/` — Compiled hooks

**`.opencode/state/opencode-harness/`** — Runtime state directory (outside package source). Contains `session-continuity.json`. Created on first plugin load. Configurable via `OPENCODE_HARNESS_STATE_DIR` or `OPENCODE_HARNESS_CONTINUITY_FILE`.

## Dead Code and Discrepancies

**`.opencode/trashskills/`** — Contains deprecated skills (`wisdom-accumulation`, `shell-safety`, `planning-with-files`, `harness-overview`). These are not referenced by any active code and should be removed.

**`src/plugins/prompt-enhance.ts`** — Standalone plugin for compaction tracking. Not registered in `src/plugin.ts`. Loaded separately via `.opencode/plugins/prompt-enhance.ts`. This is intentional (separate plugin surface) but creates a parallel state file at `.hivemind/state/session-context-prompt.md` that is distinct from the main continuity store.

**`src/lib/continuity.ts` at ~635 LOC** — Exceeds the 500 LOC module size guideline. The bulk is normalization functions (`normalizePermissionRule`, `normalizeToolProfile`, `normalizeDelegationMeta`, etc.). Could be decomposed into a `src/lib/continuity/normalize.ts` module.

**`src/plugins/prompt-enhance.ts` duplicates logic** — The `ensurePromptEnhanceState()` and `recordCompaction()` functions replicate patterns found in `src/tools/context-budget/tools.ts` and `src/tools/session-patch/tools.ts` (file I/O, frontmatter parsing). Consider extracting shared state-file utilities.

**`_projectRoot` parameter unused** — All tool factory functions (`createPromptSkimTool`, `createPromptAnalyzeTool`, `createContextBudgetTool`, `createSessionPatchTool`) accept a `_projectRoot` parameter that is currently unused (reserved for future path resolution).

---

*Structure analysis: 2026-04-06*