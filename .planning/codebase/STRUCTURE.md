# Hivemind — Structure Map

> Generated: 2026-06-02
> Source: hm-codebase-mapper

---

## 1. Project Overview

**Package:** `hivemind-3.0` (npm: `hivemind`)  
**Type:** ECMAScript Module (`"type": "module"`)  
**Description:** Runtime composition engine for multi-agent orchestration, session continuity, and compounding intelligence in OpenCode  
**Language:** TypeScript (strict mode, ES2022 target, NodeNext module resolution)  
**License:** MIT  
**Repository:** `github.com/shynlee04/hivemind-plugin`  
**Node requirement:** >= 20.0.0  
**Peer dependency:** `@opencode-ai/plugin` ^1.15.10  

---

## 2. Top-Level Directory Layout

```
hivemind-plugin-private/
├── src/                       # 262 TS source files — Hard Harness (npm package)
├── tests/                     # 258 TS test files — mirrors src/ layout
├── assets/                    # 1,519 files — SOURCE of truth for shipped primitives
├── .opencode/                 # 1,225 files — DEPLOYED primitives (client-side)
├── .hivemind/                 # 374 files — Internal deep module state
├── .planning/                 # 1,920 files — Governance, architecture, phase plans
├── .hivefiver-meta-builder/   # Meta-authoring environment for primitives
├── dist/                      # Compiled output (gitignored)
├── node_modules/              # Dependencies (gitignored)
├── scripts/                   # 3 build/sync scripts
├── bin/                       # CLI substrate
├── docs/                      # Draft architecture proposals
├── templates/                 # Reference templates
├── sidecar/                   # Sidecar dashboard (Next.js)
│
├── package.json               # Manifest, scripts, dependencies
├── tsconfig.json              # TypeScript strict config
├── vitest.config.ts           # Vitest test runner configuration
├── vitest.setup.ts            # Test setup hooks
├── opencode.json              # OpenCode runtime configuration
├── AGENTS.md                  # Master agent instruction file (2,700+ lines)
├── CHANGELOG.md               # Release changelog
├── CONTRIBUTING.md            # Contribution guide
├── README.md                  # Project readme
└── LICENSE                    # MIT license
```

---

## 3. Source Tree (`src/`) — Detailed Breakdown

```
src/
├── index.ts                      # Public API re-exports (30 lines — thin barrel)
├── plugin.ts                     # Composition root — HarnessControlPlane (756 lines)
│
├── shared/                       # Leaf utilities, types, SDK wrappers
│   ├── types.ts                  # Core type definitions: TaskStatus, RuntimePolicy, etc. (422 lines)
│   ├── state.ts                  # TaskStateManager — in-memory session/budget state (251 lines)
│   ├── task-status.ts            # Task status mapping utilities
│   ├── helpers.ts                # Generic helpers: asString, getNestedValue, etc.
│   ├── session-api.ts            # OpenCode SDK wrapper: prompt, messages, abort
│   ├── session-naming.ts         # Session naming conventions
│   ├── tool-response.ts          # Standardized tool response envelope
│   ├── tool-helpers.ts           # Tool helper patterns
│   ├── runtime.ts                # Runtime environment utilities
│   ├── runtime-policy.ts         # Runtime policy loader
│   ├── workspace-runtime-policy.ts  # Workspace-level policy resolver
│   ├── plugin-tool-output-summary.ts # Tool output summarization
│   ├── app-api.ts                # App API abstractions
│   │
│   ├── errors/
│   │   └── commands.ts           # Command error definitions
│   │
│   └── security/
│       ├── redaction.ts          # Sensitive data redaction
│       └── path-scope.ts         # Path traversal protection
│
├── schema-kernel/                # Zod schemas and config generation (21 files)
│   ├── index.ts                  # Barrel re-exports
│   ├── hivemind-configs.schema.ts   # Hivemind configuration schema
│   ├── agent-frontmatter.schema.ts  # Agent frontmatter validation
│   ├── agent-work-contract.schema.ts # Agent work contract schema
│   ├── bootstrap.schema.ts       # Bootstrap configuration schema
│   ├── command-frontmatter.schema.ts # Command frontmatter validation
│   ├── command-engine.schema.ts  # Command engine schema
│   ├── commands.schema.ts        # Command configuration schema
│   ├── config-precedence.schema.ts   # Config precedence rules
│   ├── doc-intelligence.schema.ts # Doc intelligence schema
│   ├── generate-config-json-schema.ts # JSON schema generator
│   ├── mcp-server.schema.ts      # MCP server configuration
│   ├── prompt-enhance.schema.ts  # Prompt enhance schemas
│   ├── runtime-pressure.schema.ts # Runtime pressure schema
│   ├── sdk-supervisor.schema.ts  # SDK supervisor schema
│   ├── session-delegation-query.schema.ts # Delegation query schema
│   ├── session-tracker.schema.ts # Session tracker schema
│   ├── session-view.schema.ts    # Session view schema
│   ├── skill-metadata.schema.ts  # Skill metadata schema
│   ├── tool.schema.ts            # Tool schema
│   └── trajectory.schema.ts      # Trajectory ledger schema
│
├── hooks/                        # OpenCode hook factories — READ-side only
│   ├── types.ts                  # HookDependencies shared bundle type
│   │
│   ├── lifecycle/
│   │   ├── core-hooks.ts         # Core hooks factory: event, system.transform, shell.env (271 lines)
│   │   └── session-hooks.ts      # Session hooks: auto-loop, compaction (423 lines)
│   │
│   ├── observers/
│   │   ├── event-observers.ts    # Delegation + SessionEntry + SessionIsMain observers (135 lines)
│   │   ├── delegation-consumer.ts    # Delegation event consumer
│   │   ├── session-entry-consumer.ts # Session entry consumer
│   │   ├── session-main-consumer.ts  # Main session consumer
│   │   └── session-tracker-consumer.ts # Session tracker consumer
│   │
│   ├── guards/
│   │   ├── tool-guard-hooks.ts   # Tool guard hooks (circuit breaker, budget)
│   │   └── governance-block.ts   # Governance block builder
│   │
│   ├── transforms/
│   │   ├── tool-before-guard.ts  # Tool execute.before guard
│   │   ├── tool-after-composer.ts # Tool execute.after composer
│   │   ├── tool-after-workflow.ts # Tool execute.after workflow
│   │   ├── chat-message-capture.ts # Chat message capture
│   │   └── contract-enforcement.ts # Contract enforcement
│   │
│   └── composition/
│       └── cqrs-boundary.ts      # CQRS boundary classifier (36 lines)
│
├── tools/                        # Tool entrypoints — WRITE-side (26 custom tools)
│   ├── delegation/
│   │   ├── delegate-task.ts          # Subagent delegation dispatch
│   │   └── delegation-status.ts      # Delegation status polling
│   │
│   ├── session/
│   │   ├── execute-slash-command.ts  # Slash command execution
│   │   ├── session-patch/            # Session content patching
│   │   │   ├── index.ts
│   │   │   ├── tools.ts
│   │   │   └── types.ts
│   │   ├── session-journal-export.ts # Session journal export
│   │   ├── session-tracker.ts        # Session tracker tool
│   │   ├── session-hierarchy.ts      # Session hierarchy tool
│   │   ├── session-context.ts        # Session context tool
│   │   ├── session-delegation-query.ts # Delegation query tool
│   │   ├── resolve-command.ts        # Command resolution
│   │   ├── dispatch-command.ts       # Command dispatch
│   │   ├── validate-command.ts       # Command validation
│   │   ├── workflow-parser.ts        # Workflow parsing
│   │   ├── semantic-agent-selector.ts # Agent selection
│   │   └── index.ts                  # Barrel
│   │
│   ├── hivemind/
│   │   ├── hivemind-doc.ts           # Doc intelligence tool
│   │   ├── hivemind-trajectory.ts    # Trajectory inspection tool
│   │   ├── hivemind-pressure.ts      # Pressure classification tool
│   │   ├── hivemind-sdk-supervisor.ts # SDK supervisor tool
│   │   ├── hivemind-command-engine.ts # Command engine tool
│   │   ├── hivemind-session-view.ts  # Unified session view tool
│   │   ├── hivemind-agent-work.ts    # Agent work contract tools
│   │   └── run-background-command.ts # Background command tool
│   │
│   ├── config/
│   │   ├── configure-primitive.ts    # Primitive configuration tool
│   │   ├── validate-restart.ts       # Restart validation tool
│   │   ├── bootstrap-init.ts         # Bootstrap initialization tool
│   │   └── bootstrap-recover.ts      # Bootstrap recovery tool
│   │
│   ├── prompt/
│   │   ├── prompt-skim/              # Prompt skim tool
│   │   └── prompt-analyze/           # Prompt analyze tool
│   │
│   ├── tmux-copilot.ts               # Tmux orchestration tool
│   └── tmux-state-query.ts           # Tmux session metadata tool
│
├── coordination/                 # Delegation, concurrency, completion, spawners
│   ├── delegation/               # Delegation subsystem (21 files — core module)
│   │   ├── types.ts              # Delegation types, error codes, constants (246 lines)
│   │   ├── coordinator.ts        # DelegationCoordinator — dispatch, chain, lifecycle (561 lines)
│   │   ├── manager.ts            # Facade: DelegationManager (409 lines)
│   │   ├── manager-runtime.ts    # Runtime delegation manager
│   │   ├── dispatcher.ts         # DelegationDispatcher — slot-managed dispatch
│   │   ├── lifecycle.ts          # DelegationLifecycle — state transitions
│   │   ├── state-machine.ts      # DelegationStateMachine
│   │   ├── monitor.ts            # DelegationMonitor — failure checkpoints
│   │   ├── notification-router.ts # Route notifications to parent sessions
│   │   ├── notification-formatter.ts # Format notification messages
│   │   ├── periodic-notifier.ts  # Periodic progress notifications
│   │   ├── agent-resolver.ts     # Agent name resolution
│   │   ├── slot-manager.ts       # Slot-based concurrency control
│   │   ├── sdk-child-session-starter.ts # SDK child session creation
│   │   ├── completion-detector.ts # Completion signal detection
│   │   ├── escalation-timer.ts   # Escalation timeout management
│   │   ├── retry-handler.ts      # Retry logic for delegations
│   │   ├── resume-resolver.ts    # Resume session resolution
│   │   ├── session-intelligence.ts # Stacking recommendations
│   │   └── survival-kit.ts       # Survival kit for delegation recovery
│   │
│   ├── completion/               # Completion detection
│   │   ├── detector.ts           # Dual-signal completion detector
│   │   └── notification-handler.ts # Notification handler
│   │
│   ├── concurrency/              # Concurrency control
│   │   └── queue.ts              # Queue-based concurrency (keyed slots)
│   │
│   ├── spawner/                  # Session creation and loops
│   │   ├── auto-loop.ts          # Auto-loop (delegation-packet retries)
│   │   ├── ralph-loop.ts         # Ralph-loop (correction cycles)
│   │   ├── session-creator.ts    # Session creation utility
│   │   ├── spawn-request-builder.ts # Spawn request building
│   │   ├── spawner-types.ts      # Spawner type definitions
│   │   ├── parent-directory.ts   # Parent directory resolution
│   │   └── agent-primitive-policy.ts # Agent primitive policy
│   │
│   ├── sdk-delegation/           # SDK-level delegation
│   │   └── handler.ts            # SDK delegation handler
│   │
│   └── command-delegation/       # Command-level delegation
│
├── task-management/              # Continuity, journal, trajectory, lifecycle
│   ├── continuity/               # Session continuity persistence
│   │   ├── index.ts              # getSessionContinuity, listSessionContinuity, etc.
│   │   ├── delegation-persistence.ts # Delegation record I/O
│   │   └── continuity-reader.ts  # Continuity enrichment with tracker
│   │
│   ├── lifecycle/                # Harness lifecycle management
│   │   └── index.ts              # HarnessLifecycleManager
│   │
│   ├── journal/                  # Session journal (append-only event timeline)
│   │   ├── index.ts              # Journal creation/query
│   │   ├── query.ts              # Journal query
│   │   └── replay.ts             # Journal replay
│   │   └── execution-lineage.ts  # Execution lineage tracking
│   │
│   └── trajectory/               # Trajectory ledger
│       └── index.ts              # Trajectory creation/inspection
│
├── features/                     # Standalone runtime features (15 subdirectories)
│   ├── session-tracker/          # Session knowledge capture (17 files — major feature)
│   │   ├── index.ts              # SessionTracker class (636 lines)
│   │   ├── types.ts              # Type definitions (411 lines)
│   │   ├── initialization.ts     # Lazy initialization
│   │   ├── bootstrap.ts          # Bootstrap logic
│   │   ├── classification.ts     # Session classification
│   │   ├── tool-delegation.ts    # Tool delegation tracking
│   │   ├── tool-delegation-utils.ts # Utilities
│   │   ├── child-recorder.ts     # Child session recording
│   │   ├── project-continuity.ts # Project-level continuity
│   │   ├── orphan-cleanup.ts     # Orphan session cleanup
│   │   ├── session-router.ts     # Session routing
│   │   ├── capture/              # Event/message/tool capture
│   │   ├── hooks/                # Hook integration
│   │   ├── persistence/          # File I/O with retry queue
│   │   ├── recovery/             # Session recovery
│   │   └── transform/            # Data transformations
│   │
│   ├── agent-work-contracts/     # Agent work contract management
│   │   ├── index.ts              # Barrel
│   │   ├── types.ts              # Type definitions
│   │   ├── store.ts              # In-memory contract store
│   │   ├── operations.ts         # CRUD operations
│   │   ├── lifecycle.ts          # Contract lifecycle
│   │   └── bounds.ts             # Contract boundary inference
│   │
│   ├── auto-loop/                # Auto-loop engine
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── ralph-loop/               # Ralph-loop (correction cycle)
│   │   ├── index.ts
│   │   └── types.ts
│   │
│   ├── background-command/       # PTY background command execution
│   │   └── pty/
│   │       ├── pty-runtime.ts    # PTY runtime factory
│   │       ├── pty-manager.ts    # PTY session manager
│   │       ├── pty-types.ts      # PTY type definitions
│   │       ├── pty-buffer.ts     # PTY output buffering
│   │       └── bun-pty.d.ts      # Bun PTY type declarations
│   │
│   ├── bootstrap/                # Bootstrap — primitive installation
│   │   ├── control-plane/        # Control plane bootstrap
│   │   └── primitive-registry/   # Primitive registry
│   │
│   ├── governance-engine/        # Governance session engine
│   │   ├── index.ts              # createGovernanceSessionTool
│   │   ├── config-reader.ts      # Governance config reader
│   │   ├── evaluator.ts          # Governance rule evaluator
│   │   └── create-governance-session.ts # Session creation
│   │
│   ├── governance/               # Governance rules/violations
│   ├── prompt-packet/            # Prompt compaction/preservation
│   │   ├── kernel-packet.ts      # Kernel packet definition
│   │   └── compaction-preservation.ts # Compaction checkpoint
│   │
│   ├── runtime-pressure/         # Runtime pressure classification
│   │   └── index.ts
│   │
│   ├── sdk-supervisor/           # SDK health monitoring
│   │   └── index.ts
│   │
│   ├── doc-intelligence/         # Document skim/read/search
│   │   └── index.ts
│   │
│   ├── tmux/                     # Tmux visual orchestration
│   │   ├── types.ts              # Tmux types
│   │   ├── session-manager.ts    # Tmux session manager
│   │   ├── tmux-multiplexer.ts   # Tmux multiplexer
│   │   └── observers.ts         # Event observers
│   │
│   ├── capability-gate/          # Capability gates
│   └── tool-intelligence/        # Tool intelligence
│
├── config/                       # Configuration subsystem
│   ├── subscriber.ts             # Lazy-load config with caching (114 lines)
│   ├── compiler.ts               # Config compilation
│   └── workflow/                 # Config workflow state machine
│       └── index.ts              # Workflow orchestration
│
├── routing/                      # Session entry, behavioral profiles, command engine
│   ├── session-entry/            # Session intake classification
│   │   ├── index.ts              # Barrel
│   │   ├── intake-gate.ts        # Intake gate — purpose, language, routing
│   │   ├── purpose-classifier.ts # Purpose classification
│   │   ├── language-resolution.ts # Language detection
│   │   └── profile-resolver.ts   # Developer profile resolution
│   │
│   ├── behavioral-profile/       # Behavioral profile management
│   │   ├── index.ts              # Barrel
│   │   ├── types.ts              # Profile types
│   │   ├── profiles.ts           # Profile definitions
│   │   └── resolve-behavioral-profile.ts # Profile resolution
│   │
│   └── command-engine/           # Command routing engine
│       ├── index.ts              # executeCommandEngineAction, listCommands
│       └── types.ts              # Command engine types
│
├── sidecar/                      # Read-only sidecar state
│   └── readonly-state.ts         # Read-only state view
│
└── cli/                          # CLI substrate
    ├── index.ts                  # CLI entrypoint
    ├── router.ts                 # CLI routing
    ├── renderer.ts               # TUI output rendering
    ├── discovery.ts              # Command discovery
    ├── ui/
    │   └── prompts.ts            # Interactive prompts (@clack/prompts)
    └── commands/
        ├── init.ts               # hivemind init
        ├── doctor.ts             # hivemind doctor
        ├── version.ts            # hivemind version
        ├── recover.ts            # hivemind recover
        └── help.ts               # hivemind help
```

---

## 4. Test Tree (`tests/`)

```
tests/
├── lib/                              # Module-level unit tests (mirrors src/ structure)
│   ├── continuity.test.ts            # Continuity store tests
│   ├── delegation-manager.test.ts    # Delegation manager facade tests
│   ├── state.test.ts                 # TaskStateManager tests
│   ├── lifecycle-manager.test.ts     # HarnessLifecycleManager tests
│   ├── completion-detector.test.ts   # Completion detection tests
│   ├── concurrency.test.ts           # Concurrency queue tests
│   ├── auto-loop.test.ts             # Auto-loop tests
│   ├── ralph-loop.test.ts            # Ralph-loop tests
│   ├── session-journal.test.ts       # Session journal tests
│   ├── execution-lineage.test.ts     # Execution lineage tests
│   ├── task-status.test.ts           # Task status mapping tests
│   ├── runtime-validator.test.ts     # Runtime validation tests
│   ├── ...
│   │
│   ├── session-tracker/              # Session tracker tests
│   ├── coordination/delegation/      # Delegation module tests (11 files)
│   ├── coordination/completion/      # Completion detector tests
│   ├── coordination/concurrency/     # Concurrency queue tests
│   ├── pty/                          # PTY tests
│   ├── security/                     # Security tests
│   ├── behavioral-profile/           # Profile tests
│   ├── session-entry/                # Intake gate tests
│   ├── delegation/                   # Reader tests
│   ├── config-workflow/              # Config workflow tests
│   ├── control-plane/                # Gatekeeper tests
│   ├── features/                     # Feature tests
│   ├── tmux/                         # Tmux orchestration tests
│   ├── helpers/                      # Helper utilities
│   └── runtime-pressure/             # Pressure module tests
│
├── tools/                            # Tool integration tests
│   ├── delegation/
│   ├── session/
│   ├── config/
│   └── hivemind/
│
├── hooks/                            # Hook tests
├── plugin/                           # Plugin integration tests
├── schema-kernel/                    # Schema validation tests
├── shared/                           # Shared utility tests
├── sidecar/                          # Sidecar tests
├── features/                         # Feature tests
├── integration/                      # Cross-module integration tests
├── kernel/                           # Kernel-level tests
├── cli/                              # CLI tests
├── scripts/                          # Script tests
├── task-management/                  # Task management tests
│
├── CP-ST-03-01-excision.test.ts      # Session-tracker excise tests
└── plugin-diagnostic.md
```

---

## 5. File Naming Conventions

| Pattern | Rule | Example |
|---------|------|---------|
| `kebab-case.ts` | All source files use kebab-case | `tool-before-guard.ts`, `session-api.ts` |
| `PascalCase.ts` | Class definitions and types only | `SessionTracker`, `DelegationManager` |
| `camelCase.ts` | Module-level exports, helpers | `helpers.ts`, `state.ts`, `session-api.ts` |
| `*.schema.ts` | Zod schema definitions | `hivemind-configs.schema.ts` |
| `*.test.ts` | Test files (vitest) | `continuity.test.ts` |
| `.gitkeep` | Empty directory registration | All feature/agent directories |
| Package entrypoint | `index.ts` in each module barrel | `features/session-tracker/index.ts` |
| Factory pattern | `create*()` for factories | `createCoreHooks()`, `createToolBeforeGuard()` |
| Tool naming | `create*Tool()` for tool factories | `createExecuteSlashCommandTool()` |

---

## 6. Module Organisation Rules

1. **`src/shared/`** — Leaf modules only. No imports from `src/coordination/`, `src/features/`, etc.
2. **`src/hooks/`** — Read-side only. All hooks return early on errors (best-effort). Never write files directly (CQRS boundary enforced by `assertHookWriteBoundary()`).
3. **`src/tools/`** — Write-side entrypoints. Each tool is a factory function returning `tool()` from `@opencode-ai/plugin/tool`.
4. **`src/schema-kernel/`** — Pure Zod schemas. No runtime imports from harness modules.
5. **`src/config/`** — Configuration loading with lazy-cache-per-project pattern.
6. **`src/routing/`** — Session intake classification, behavioral profiles, command engine routing.
7. **Max module size:** 500 LOC (exceptions: `plugin.ts` at 756, `features/session-tracker/index.ts` at 636, `coordination/delegation/coordinator.ts` at 561).
8. **`tests/lib/`** mirrors `src/` structure but flattened — no deep nesting duplication.

---

## 7. Folder Registration

All directories that must be tracked by git contain a `.gitkeep` file. Key registered folder paths:

| Path | Purpose |
|------|---------|
| `src/coordination/delegation/.gitkeep` | Delegation submodule |
| `src/task-management/continuity/.gitkeep` | Continuity persistence |
| `src/features/session-tracker/.gitkeep` | Session tracker feature |
| `src/shared/errors/.gitkeep` | Error definitions |
| `src/shared/security/.gitkeep` | Security utilities |
| `assets/.hivemind/skills/*/.gitkeep` | Source-of-truth skill packages |
| `.hivemind/session-tracker/` | Dynamic runtime session data (no .gitkeep needed) |
| `.hivemind/state/` | Runtime state files (no .gitkeep needed) |
| `.planning/phases/*/` | Phase planning directories |

---

## 8. Dependency Rules (Non-Negotiable)

- **`src/shared/types.ts`** is leaf-like shared contract authority — avoid deep runtime imports.
- **No circular dependencies** between modules. Enforced by code review.
- **`src/hooks/` must NOT import from `src/tools/`** — hooks are read-side, tools are write-side.
- **`src/features/` may import from `src/shared/` and `src/coordination/`** — features are self-contained runtime capabilities.
- **`src/config/` imports only from `src/schema-kernel/`** and `src/shared/`.
- **`src/task-management/` may import from `src/shared/`** and `src/features/session-tracker/` for enrichment.

---

## 9. Key File Sizes (Largest Source Files)

| File | LOC | Purpose |
|------|-----|---------|
| `plugin.ts` | 756 | Composition root |
| `features/session-tracker/index.ts` | 636 | SessionTracker class |
| `coordination/delegation/coordinator.ts` | 561 | Delegation coordinator |
| `hooks/lifecycle/session-hooks.ts` | 423 | Session hook factory |
| `shared/types.ts` | 422 | Core type definitions |
| `hooks/lifecycle/core-hooks.ts` | 271 | Core hook factory |
| `coordination/delegation/types.ts` | 246 | Delegation types |
| `shared/state.ts` | 251 | TaskStateManager |

---

## 10. Data Roots

| Root | Purpose | Managed By |
|------|---------|------------|
| `src/` | Hard harness (npm package) | TypeScript compilation |
| `.opencode/` | Deployed primitives (agents, commands, skills) | `scripts/sync-assets.js` |
| `assets/` | Source of truth for primitives | Manual authoring |
| `.hivemind/session-tracker/` | Runtime session knowledge | SessionTracker class |
| `.hivemind/state/` | Legacy continuity/state files | Migration scripts |
| `.planning/` | Governance, architecture, phase docs | Planning workflow |
| `.hivefiver-meta-builder/` | Meta-authoring lab | hf-l2-* agent development |
