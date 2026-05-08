# Structure Restructuring Plan — OMO-Inspired

**Generated:** 2026-05-08  
**Updated:** 2026-05-08  
**Scope:** Full `src/` directory restructuring  
**Maintainability Index:** 4.9/10 (At Risk)  
**Type:** Structural Refactor (multi-module, cross-cutting)  
**Reference:** [oh-my-openagent/src/](https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src)

---

## 1. OMO Naming & Organization Conventions

### 1.1 Directory Naming

| Convention | Example |
|------------|---------|
| **kebab-case everywhere** | `background-agent/`, `auto-slash-command/`, `delegate-task/` |
| **Feature = directory name** | `src/features/background-agent/` = background agent feature |
| **Hook = directory name** | `src/hooks/interactive-bash-session/` = interactive bash hook |
| **Tool = directory name** | `src/tools/background-task/` = background task tool |
| **Shared = domain grouping** | `src/shared/tmux/`, `src/shared/model-capabilities/` |

### 1.2 File Naming

| Convention | Example |
|------------|---------|
| **kebab-case files** | `error-classifier.ts`, `session-idle-event-handler.ts` |
| **Tests colocated** | `manager.ts` + `manager.test.ts` (same directory) |
| **Variant tests** | `manager.test.ts`, `manager.polling.test.ts`, `manager.shutdown.test.ts` |
| **Barrel exports** | `index.ts` in every module directory |
| **Types per module** | `types.ts` in each module |
| **Constants per module** | `constants.ts` in each module |

### 1.3 AGENTS.md Placement

```
src/AGENTS.md                           # Top-level sector guidance
src/hooks/AGENTS.md                     # Hooks sector guidance
src/hooks/interactive-bash-session/AGENTS.md  # Per-hook module guidance
src/features/AGENTS.md                  # Features sector guidance
src/features/background-agent/AGENTS.md # Per-feature module guidance
src/tools/AGENTS.md                     # Tools sector guidance
src/tools/delegate-task/AGENTS.md       # Per-tool module guidance
src/shared/AGENTS.md                    # Shared sector guidance
src/shared/tmux/AGENTS.md              # Per-shared module guidance
```

### 1.4 Module Structure Pattern

```
src/features/background-agent/
├── AGENTS.md                    # Module guidance
├── index.ts                     # Barrel export
├── types.ts                     # Type definitions
├── constants.ts                 # Constants
├── state.ts                     # State management
├── manager.ts                   # Core logic
├── manager.test.ts              # Core tests (colocated)
├── manager.polling.test.ts      # Variant test
├── spawner.ts                   # Sub-module
├── spawner.test.ts              # Sub-module tests
└── spawner/                     # Complex sub-module directory
    ├── index.ts
    └── types.ts
```

---

## 2. Target Structure

```
src/
├── AGENTS.md                           # Top-level sector guidance
├── index.ts                            # Public API re-exports
├── plugin.ts                           # Plugin composition root
│
├── routing/                            # Intent → session → task → workflow pipeline
│   ├── AGENTS.md
│   ├── index.ts
│   ├── intent-classifier/              # Purpose classification, intake gate
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── classifier.ts + .test.ts
│   │   └── intake-gate.ts + .test.ts
│   ├── session-entry/                  # Session entry, language, profile
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── language-resolution.ts + .test.ts
│   │   └── profile-resolver.ts + .test.ts
│   ├── workflow-router/                # Auto-command chaining, workflow dispatch
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── router.ts + .test.ts
│   └── command-engine/                 # Command parsing, execution
│       ├── AGENTS.md
│       ├── index.ts
│       ├── types.ts
│       └── engine.ts + .test.ts
│
├── task-management/                    # Graph-based, hierarchical, cross-session, persistence
│   ├── AGENTS.md
│   ├── index.ts
│   ├── continuity/                     # Session continuity, persistence
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── store-io.ts + .test.ts      # Disk I/O
│   │   ├── normalizers.ts + .test.ts   # Data normalization
│   │   ├── clone-helpers.ts            # Deep-clone utilities
│   │   ├── api.ts + .test.ts           # CRUD operations
│   │   └── delegation-persistence.ts + .test.ts
│   ├── journal/                        # Session journal, event tracking
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── writer.ts + .test.ts        # Journal writer
│   │   ├── query.ts + .test.ts         # Journal query API
│   │   ├── replay.ts + .test.ts        # Journal time-machine replay
│   │   ├── execution-lineage.ts + .test.ts
│   │   └── event-tracker/              # Event tracking sub-module
│   │       ├── AGENTS.md
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── classifier.ts
│   │       ├── writer.ts
│   │       └── ...
│   ├── trajectory/                     # Trajectory ledger
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── ledger.ts + .test.ts
│   │   └── store-operations.ts
│   ├── recovery/                       # Checkpoint, repair, assess state
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── assess-state.ts + .test.ts
│   │   ├── create-checkpoint.ts
│   │   ├── failure-classes.ts
│   │   └── repair-state.ts
│   └── lifecycle/                      # Session lifecycle state machine
│       ├── AGENTS.md
│       ├── index.ts
│       ├── types.ts
│       └── manager.ts + .test.ts
│
├── coordination/                       # Delegation, orchestration
│   ├── AGENTS.md
│   ├── index.ts
│   ├── delegation/                     # Core delegation orchestrator
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── manager.ts + .test.ts       # DelegationManager (500 LOC cap)
│   │   ├── state-machine.ts + .test.ts # Delegation state transitions
│   │   ├── category-gates.ts + .test.ts
│   │   ├── category-gate-audit.ts
│   │   └── types.ts                    # Delegation types
│   ├── sdk-delegation/                 # SDK child-session delegation
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── handler.ts + .test.ts
│   ├── command-delegation/             # Command delegation (PTY/headless)
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── handler.ts + .test.ts
│   ├── concurrency/                    # Keyed semaphore, queue management
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── queue.ts + .test.ts
│   ├── completion/                     # Two-signal completion
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── detector.ts + .test.ts
│   │   └── notification-handler.ts + .test.ts
│   └── spawner/                        # Session spawning
│       ├── AGENTS.md
│       ├── index.ts
│       ├── types.ts
│       ├── session-creator.ts + .test.ts
│       ├── spawn-request-builder.ts + .test.ts
│       ├── concurrency-key.ts
│       ├── parent-directory.ts
│       ├── agent-primitive-policy.ts
│       ├── auto-loop.ts + .test.ts
│       └── ralph-loop.ts + .test.ts
│
├── features/                           # Standalone feature modules
│   ├── AGENTS.md
│   ├── index.ts
│   ├── background-command/             # Background command execution
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   ├── tool.ts + .test.ts          # run-background-command tool
│   │   └── pty/                        # PTY sub-module
│   │       ├── AGENTS.md
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── manager.ts + .test.ts
│   │       ├── buffer.ts + .test.ts
│   │       ├── runtime.ts + .test.ts
│   │       └── bun-pty.d.ts
│   ├── prompt-enhance/                 # Prompt skimming & analysis
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── skim/                       # Prompt skim sub-module
│   │   │   ├── index.ts
│   │   │   ├── tools.ts
│   │   │   └── types.ts
│   │   └── analyze/                    # Prompt analyze sub-module
│   │       ├── index.ts
│   │       ├── tools.ts
│   │       └── types.ts
│   ├── session-patch/                  # Session patching
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── tools.ts + .test.ts
│   │   └── ...
│   ├── doc-intelligence/               # Doc parsing, chunking, routing
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── parser.ts
│   │   ├── chunker.ts
│   │   └── router.ts
│   ├── agent-work-contracts/           # Agent work contract management
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── store.ts
│   │   └── operations.ts
│   ├── runtime-pressure/               # Pressure model, authority matrix
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── model.ts
│   │   ├── authority-matrix.ts
│   │   └── control-plane.ts
│   ├── sdk-supervisor/                 # SDK supervision
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── types.ts
│   ├── trajectory/                     # Trajectory management
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── ...
│   ├── command-engine/                 # Command engine
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── types.ts
│   ├── bootstrap/                      # Bootstrap init, recover, structure
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── structure.ts
│   │   ├── framework-detector.ts
│   │   ├── primitive-loader.ts
│   │   ├── primitive-registry.ts
│   │   ├── primitive-scanners.ts
│   │   ├── cross-primitive-validator.ts
│   │   ├── runtime-validator.ts
│   │   ├── runtime-detection/
│   │   └── control-plane/
│   ├── config-workflow/                # Config workflow, guards, persistence
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── workflow-guards.ts
│   │   ├── workflow-persistence.ts
│   │   └── workflow-state.ts
│   ├── behavioral-profile/             # Profile resolution
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── profiles.ts
│   │   └── resolve-behavioral-profile.ts
│   └── prompt-packet/                  # Prompt packets
│       ├── AGENTS.md
│       ├── index.ts
│       ├── types.ts
│       ├── compaction-preservation.ts
│       ├── delegation-packet.ts
│       └── kernel-packet.ts
│
├── hooks/                              # Reorganized by purpose
│   ├── AGENTS.md
│   ├── index.ts
│   ├── types.ts
│   ├── lifecycle/                      # Session lifecycle hooks
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── core-hooks.ts + .test.ts
│   │   └── session-hooks.ts + .test.ts
│   ├── guards/                         # Tool guard hooks, governance
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── tool-guard-hooks.ts + .test.ts
│   │   └── governance-block.ts
│   ├── observers/                      # Event observers
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── event-observers.ts + .test.ts
│   ├── transforms/                     # Message/system transforms
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── toggle-gates.ts
│   │   └── tool-after-composer.ts
│   └── composition/                    # Hook composition utilities
│       ├── AGENTS.md
│       ├── index.ts
│       └── cqrs-boundary.ts
│
├── tools/                              # Categorized by domain
│   ├── AGENTS.md
│   ├── index.ts
│   ├── delegation/                     # Delegation tools
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── delegate-task.ts + .test.ts
│   │   └── delegation-status.ts + .test.ts
│   ├── session/                        # Session tools
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── session-journal-export.ts + .test.ts
│   │   └── session-patch/
│   │       ├── index.ts
│   │       ├── tools.ts
│   │       └── types.ts
│   ├── config/                         # Config tools
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── configure-primitive.ts + .test.ts
│   │   ├── configure-primitive-paths.ts
│   │   ├── validate-restart.ts + .test.ts
│   │   ├── bootstrap-init.ts + .test.ts
│   │   └── bootstrap-recover.ts + .test.ts
│   ├── hivemind/                       # Hivemind-specific tools
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── hivemind-doc.ts + .test.ts
│   │   ├── hivemind-trajectory.ts + .test.ts
│   │   ├── hivemind-pressure.ts + .test.ts
│   │   ├── hivemind-agent-work.ts + .test.ts
│   │   ├── hivemind-sdk-supervisor.ts + .test.ts
│   │   ├── hivemind-command-engine.ts + .test.ts
│   │   └── run-background-command.ts + .test.ts
│   └── prompt/                         # Prompt tools
│       ├── AGENTS.md
│       ├── index.ts
│       ├── prompt-skim/
│       │   ├── index.ts
│       │   ├── tools.ts
│       │   └── types.ts
│       └── prompt-analyze/
│           ├── index.ts
│           ├── tools.ts
│           └── types.ts
│
├── shared/                             # Cross-cutting utilities
│   ├── AGENTS.md
│   ├── index.ts
│   ├── types.ts                        # Shared types (from lib/types.ts)
│   ├── helpers.ts                      # Pure utilities (from lib/helpers.ts)
│   ├── state.ts                        # In-memory state (from lib/state.ts)
│   ├── task-status.ts                  # Status type system
│   ├── runtime.ts                      # Event→status mapping
│   ├── runtime-policy.ts               # Runtime policy resolution
│   ├── workspace-runtime-policy.ts     # Workspace policy
│   ├── session-api.ts                  # Typed SDK wrappers
│   ├── app-api.ts                      # SDK app API wrapper
│   ├── plugin-tool-output-summary.ts   # Tool output summary
│   ├── security/                       # Security utilities
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   ├── path-scope.ts
│   │   └── redaction.ts
│   ├── tmux/                           # Tmux utilities (future)
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── ...
│   └── model-capabilities/             # Model capabilities (future)
│       ├── AGENTS.md
│       ├── index.ts
│       └── ...
│
├── config/                             # Config realm
│   ├── AGENTS.md
│   ├── index.ts
│   ├── types.ts
│   ├── subscriber.ts + .test.ts        # Config caching
│   ├── compiler.ts + .test.ts          # Config compilation
│   ├── precedence.ts                   # Config precedence
│   └── workflow/                       # Config workflow
│       ├── AGENTS.md
│       ├── index.ts
│       ├── types.ts
│       ├── guards.ts
│       ├── persistence.ts
│       └── state.ts
│
├── schema-kernel/                      # Zod schemas (unchanged)
│   ├── AGENTS.md
│   ├── index.ts
│   └── ... (existing files)
│
├── plugin/                             # Plugin composition and registration
│   ├── AGENTS.md
│   ├── index.ts                        # Plugin entry
│   ├── types.ts
│   ├── hooks/                          # Hook registration
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── ... (hook registration files)
│   ├── tools/                          # Tool registration
│   │   ├── AGENTS.md
│   │   ├── index.ts
│   │   └── ... (tool registration files)
│   └── config/                         # Plugin config
│       ├── AGENTS.md
│       ├── index.ts
│       └── ...
│
├── cli/                                # CLI substrate (unchanged)
│   ├── AGENTS.md
│   ├── index.ts
│   ├── discovery.ts
│   ├── renderer.ts
│   ├── router.ts
│   └── commands/
│       ├── AGENTS.md
│       ├── doctor.ts
│       ├── help.ts
│       ├── init.ts
│       ├── recover.ts
│       └── version.ts
│
└── sidecar/                            # Read-only state (unchanged)
    ├── AGENTS.md
    ├── index.ts
    └── readonly-state.ts
```

---

## 3. File Mapping (Current → Target)

### 3.1 `src/lib/` → Target Locations

| Current File | Target Location | New Name (if changed) |
|-------------|----------------|----------------------|
| `types.ts` | `src/shared/types.ts` | — |
| `helpers.ts` | `src/shared/helpers.ts` | — |
| `state.ts` | `src/shared/state.ts` | — |
| `task-status.ts` | `src/shared/task-status.ts` | — |
| `runtime.ts` | `src/shared/runtime.ts` | — |
| `runtime-policy.ts` | `src/shared/runtime-policy.ts` | — |
| `workspace-runtime-policy.ts` | `src/shared/workspace-runtime-policy.ts` | — |
| `app-api.ts` | `src/shared/app-api.ts` | — |
| `session-api.ts` | `src/shared/session-api.ts` | — |
| `plugin-tool-output-summary.ts` | `src/shared/plugin-tool-output-summary.ts` | — |
| `security/path-scope.ts` | `src/shared/security/path-scope.ts` | — |
| `security/redaction.ts` | `src/shared/security/redaction.ts` | — |
| `behavioral-profile/*` | `src/features/behavioral-profile/*` | — |
| `prompt-packet/*` | `src/features/prompt-packet/*` | — |
| `continuity.ts` | `src/task-management/continuity/` | Split into `store-io.ts`, `normalizers.ts`, `clone-helpers.ts`, `api.ts` |
| `delegation-persistence.ts` | `src/task-management/continuity/delegation-persistence.ts` | — |
| `session-journal.ts` | `src/task-management/journal/index.ts` | — |
| `journal-query.ts` | `src/task-management/journal/query.ts` | — |
| `journal-replay.ts` | `src/task-management/journal/replay.ts` | — |
| `execution-lineage.ts` | `src/task-management/journal/execution-lineage.ts` | — |
| `event-tracker/*` | `src/task-management/journal/event-tracker/*` | — |
| `trajectory/*` | `src/task-management/trajectory/*` | — |
| `recovery/*` | `src/task-management/recovery/*` | — |
| `lifecycle-manager.ts` | `src/task-management/lifecycle/index.ts` | — |
| `delegation-manager.ts` | `src/coordination/delegation/manager.ts` | — |
| `delegation-state-machine.ts` | `src/coordination/delegation/state-machine.ts` | — |
| `delegation-types.ts` | `src/coordination/delegation/types.ts` | — |
| `category-gates.ts` | `src/coordination/delegation/category-gates.ts` | — |
| `category-gate-audit.ts` | `src/coordination/delegation/category-gate-audit.ts` | — |
| `sdk-delegation.ts` | `src/coordination/sdk-delegation/handler.ts` | — |
| `command-delegation.ts` | `src/coordination/command-delegation/handler.ts` | — |
| `concurrency.ts` | `src/coordination/concurrency/queue.ts` | — |
| `completion-detector.ts` | `src/coordination/completion/detector.ts` | — |
| `notification-handler.ts` | `src/coordination/completion/notification-handler.ts` | — |
| `spawner/*` | `src/coordination/spawner/*` | — |
| `auto-loop.ts` | `src/coordination/spawner/auto-loop.ts` | — |
| `ralph-loop.ts` | `src/coordination/spawner/ralph-loop.ts` | — |
| `config-subscriber.ts` | `src/config/subscriber.ts` | — |
| `config-compiler.ts` | `src/config/compiler.ts` | — |
| `config-workflow/*` | `src/config/workflow/*` | — |
| `session-entry/*` | `src/routing/session-entry/*` | — |
| `framework-detector.ts` | `src/features/bootstrap/framework-detector.ts` | — |
| `primitive-loader.ts` | `src/features/bootstrap/primitive-loader.ts` | — |
| `primitive-registry.ts` | `src/features/bootstrap/primitive-registry.ts` | — |
| `primitive-scanners.ts` | `src/features/bootstrap/primitive-scanners.ts` | — |
| `cross-primitive-validator.ts` | `src/features/bootstrap/cross-primitive-validator.ts` | — |
| `runtime-validator.ts` | `src/features/bootstrap/runtime-validator.ts` | — |
| `bootstrap-structure.ts` | `src/features/bootstrap/structure.ts` | — |
| `runtime-detection/*` | `src/features/bootstrap/runtime-detection/*` | — |
| `control-plane/*` | `src/features/bootstrap/control-plane/*` | — |
| `doc-intelligence/*` | `src/features/doc-intelligence/*` | — |
| `runtime-pressure/*` | `src/features/runtime-pressure/*` | — |
| `agent-work-contracts/*` | `src/features/agent-work-contracts/*` | — |
| `sdk-supervisor/*` | `src/features/sdk-supervisor/*` | — |
| `command-engine/*` | `src/features/command-engine/*` | — |
| `pty/*` | `src/features/background-command/pty/*` | — |

### 3.2 `src/hooks/` → Target Locations

| Current File | Target Location | New Name (if changed) |
|-------------|----------------|----------------------|
| `create-core-hooks.ts` | `src/hooks/lifecycle/core-hooks.ts` | `core-hooks.ts` |
| `create-session-hooks.ts` | `src/hooks/lifecycle/session-hooks.ts` | `session-hooks.ts` |
| `create-tool-guard-hooks.ts` | `src/hooks/guards/tool-guard-hooks.ts` | `tool-guard-hooks.ts` |
| `governance-block.ts` | `src/hooks/transforms/governance-block.ts` | — |
| `hook-cqrs-boundary.ts` | `src/hooks/composition/cqrs-boundary.ts` | `cqrs-boundary.ts` |
| `plugin-event-observers.ts` | `src/hooks/observers/event-observers.ts` | `event-observers.ts` |
| `toggle-gates.ts` | `src/hooks/transforms/toggle-gates.ts` | — |
| `tool-after-composer.ts` | `src/hooks/transforms/tool-after-composer.ts` | — |
| `types.ts` | `src/hooks/types.ts` | — |

### 3.3 `src/tools/` → Target Locations

| Current File | Target Location | New Name (if changed) |
|-------------|----------------|----------------------|
| `delegate-task.ts` | `src/tools/delegation/delegate-task.ts` | — |
| `delegation-status.ts` | `src/tools/delegation/delegation-status.ts` | — |
| `session-patch/` | `src/tools/session/session-patch/` | — |
| `session-journal-export.ts` | `src/tools/session/session-journal-export.ts` | — |
| `configure-primitive.ts` | `src/tools/config/configure-primitive.ts` | — |
| `configure-primitive-paths.ts` | `src/tools/config/configure-primitive-paths.ts` | — |
| `validate-restart.ts` | `src/tools/config/validate-restart.ts` | — |
| `bootstrap-init.ts` | `src/tools/config/bootstrap-init.ts` | — |
| `bootstrap-recover.ts` | `src/tools/config/bootstrap-recover.ts` | — |
| `hivemind-doc.ts` | `src/tools/hivemind/hivemind-doc.ts` | — |
| `hivemind-trajectory.ts` | `src/tools/hivemind/hivemind-trajectory.ts` | — |
| `hivemind-pressure.ts` | `src/tools/hivemind/hivemind-pressure.ts` | — |
| `hivemind-agent-work.ts` | `src/tools/hivemind/hivemind-agent-work.ts` | — |
| `hivemind-sdk-supervisor.ts` | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | — |
| `hivemind-command-engine.ts` | `src/tools/hivemind/hivemind-command-engine.ts` | — |
| `run-background-command.ts` | `src/tools/hivemind/run-background-command.ts` | — |
| `prompt-skim/` | `src/tools/prompt/prompt-skim/` | — |
| `prompt-analyze/` | `src/tools/prompt/prompt-analyze/` | — |

---

## 4. Phased Migration Plan

### Phase 0: Preparation (Safety Net)

| Step | Action | Verification |
|------|--------|-------------|
| 0.1 | Run full test suite: `npm test` | All tests pass |
| 0.2 | Run typecheck: `npm run typecheck` | No errors |
| 0.3 | Create branch: `git checkout -b refactor/structure-restructuring` | Branch exists |
| 0.4 | Document current import graph (automated) | Graph file created |
| 0.5 | Verify all `.gitkeep` files exist in target dirs | Dirs registered |

**Rollback:** `git checkout main && git branch -D refactor/structure-restructuring`

---

### Phase 1: Leaf Modules → `src/shared/` (Lowest Risk)

**Goal:** Move leaf modules with zero downstream consumers outside `src/lib/`.

**Files to move:**
1. `src/lib/types.ts` → `src/shared/types.ts`
2. `src/lib/helpers.ts` → `src/shared/helpers.ts`
3. `src/lib/state.ts` → `src/shared/state.ts`
4. `src/lib/task-status.ts` → `src/shared/task-status.ts`
5. `src/lib/runtime.ts` → `src/shared/runtime.ts`
6. `src/lib/runtime-policy.ts` → `src/shared/runtime-policy.ts`
7. `src/lib/workspace-runtime-policy.ts` → `src/shared/workspace-runtime-policy.ts`
8. `src/lib/app-api.ts` → `src/shared/app-api.ts`
9. `src/lib/plugin-tool-output-summary.ts` → `src/shared/plugin-tool-output-summary.ts`
10. `src/lib/session-api.ts` → `src/shared/session-api.ts`
11. `src/lib/security/path-scope.ts` → `src/shared/security/path-scope.ts`
12. `src/lib/security/redaction.ts` → `src/shared/security/redaction.ts`

**Procedure per file:**
1. Create target directory with `.gitkeep` if needed
2. `git mv` the file
3. Update all imports in the moved file (relative paths)
4. Update all consumers (grep for old import path)
5. Run `npm run typecheck`
6. Run `npm test`
7. Commit: `refactor: move {file} to src/shared/`

**Import path changes:**
- `../lib/types.js` → `../shared/types.js` (in hooks, tools)
- `./types.js` → `./types.js` (within shared/ — no change)
- `../../lib/types.js` → `../../shared/types.js` (in nested tools/hooks)

**Rollback:** `git revert HEAD` per commit

---

### Phase 2: Persistence/Journal → `src/task-management/` (Medium Risk)

**Goal:** Move persistence and journal modules to task-management plane.

**Files to move:**
1. `src/lib/continuity.ts` → `src/task-management/continuity/index.ts` (split first)
2. `src/lib/delegation-persistence.ts` → `src/task-management/continuity/delegation-persistence.ts`
3. `src/lib/session-journal.ts` → `src/task-management/journal/index.ts`
4. `src/lib/journal-query.ts` → `src/task-management/journal/query.ts`
5. `src/lib/journal-replay.ts` → `src/task-management/journal/replay.ts`
6. `src/lib/execution-lineage.ts` → `src/task-management/journal/execution-lineage.ts`
7. `src/lib/event-tracker/*` → `src/task-management/journal/event-tracker/*`
8. `src/lib/trajectory/*` → `src/task-management/trajectory/*`
9. `src/lib/recovery/*` → `src/task-management/recovery/*`
10. `src/lib/lifecycle-manager.ts` → `src/task-management/lifecycle/index.ts`

**Special handling:** `continuity.ts` (465 LOC) must be split into:
- `store-io.ts` — Disk I/O operations
- `normalizers.ts` — Data normalization
- `clone-helpers.ts` — Deep-clone utilities
- `api.ts` — CRUD operations

**Rollback:** `git revert HEAD` per commit

---

### Phase 3: Delegation/Concurrency → `src/coordination/` (High Risk)

**Goal:** Move delegation and orchestration modules to coordination plane.

**Files to move:**
1. `src/lib/delegation-manager.ts` → `src/coordination/delegation/manager.ts`
2. `src/lib/delegation-state-machine.ts` → `src/coordination/delegation/state-machine.ts`
3. `src/lib/delegation-types.ts` → `src/coordination/delegation/types.ts`
4. `src/lib/category-gates.ts` → `src/coordination/delegation/category-gates.ts`
5. `src/lib/category-gate-audit.ts` → `src/coordination/delegation/category-gate-audit.ts`
6. `src/lib/sdk-delegation.ts` → `src/coordination/sdk-delegation/handler.ts`
7. `src/lib/command-delegation.ts` → `src/coordination/command-delegation/handler.ts`
8. `src/lib/concurrency.ts` → `src/coordination/concurrency/queue.ts`
9. `src/lib/completion-detector.ts` → `src/coordination/completion/detector.ts`
10. `src/lib/notification-handler.ts` → `src/coordination/completion/notification-handler.ts`
11. `src/lib/spawner/*` → `src/coordination/spawner/*`
12. `src/lib/auto-loop.ts` → `src/coordination/spawner/auto-loop.ts`
13. `src/lib/ralph-loop.ts` → `src/coordination/spawner/ralph-loop.ts`

**Critical:** `delegation-manager.ts` is at 500 LOC cap. No further growth allowed.

**Rollback:** `git revert HEAD` per commit

---

### Phase 4: Features → `src/features/` (Medium Risk)

**Goal:** Move feature modules to features plane.

**Files to move:**
1. `src/lib/pty/*` → `src/features/background-command/pty/*`
2. `src/tools/run-background-command.ts` → `src/features/background-command/tool.ts`
3. `src/lib/doc-intelligence/*` → `src/features/doc-intelligence/*`
4. `src/lib/runtime-pressure/*` → `src/features/runtime-pressure/*`
5. `src/lib/agent-work-contracts/*` → `src/features/agent-work-contracts/*`
6. `src/lib/sdk-supervisor/*` → `src/features/sdk-supervisor/*`
7. `src/lib/command-engine/*` → `src/features/command-engine/*`
8. `src/lib/framework-detector.ts` → `src/features/bootstrap/framework-detector.ts`
9. `src/lib/primitive-loader.ts` → `src/features/bootstrap/primitive-loader.ts`
10. `src/lib/primitive-registry.ts` → `src/features/bootstrap/primitive-registry.ts`
11. `src/lib/primitive-scanners.ts` → `src/features/bootstrap/primitive-scanners.ts`
12. `src/lib/cross-primitive-validator.ts` → `src/features/bootstrap/cross-primitive-validator.ts`
13. `src/lib/runtime-validator.ts` → `src/features/bootstrap/runtime-validator.ts`
14. `src/lib/bootstrap-structure.ts` → `src/features/bootstrap/structure.ts`
15. `src/lib/runtime-detection/*` → `src/features/bootstrap/runtime-detection/*`
16. `src/lib/control-plane/*` → `src/features/bootstrap/control-plane/*`
17. `src/lib/behavioral-profile/*` → `src/features/behavioral-profile/*`
18. `src/lib/prompt-packet/*` → `src/features/prompt-packet/*`
19. `src/lib/config-workflow/*` → `src/config/workflow/*`

**Rollback:** `git revert HEAD` per commit

---

### Phase 5: Config → `src/config/` (Low Risk)

**Goal:** Move config modules to config realm.

**Files to move:**
1. `src/lib/config-subscriber.ts` → `src/config/subscriber.ts`
2. `src/lib/config-compiler.ts` → `src/config/compiler.ts`

**Rollback:** `git revert HEAD` per commit

---

### Phase 6: Routing → `src/routing/` (Low Risk)

**Goal:** Move routing modules to routing plane.

**Files to move:**
1. `src/lib/session-entry/*` → `src/routing/session-entry/*`

**Rollback:** `git revert HEAD` per commit

---

### Phase 7: Hooks Reorganization (Low Risk)

**Goal:** Reorganize hooks by purpose.

**Files to move:**
1. `src/hooks/create-core-hooks.ts` → `src/hooks/lifecycle/core-hooks.ts`
2. `src/hooks/create-session-hooks.ts` → `src/hooks/lifecycle/session-hooks.ts`
3. `src/hooks/create-tool-guard-hooks.ts` → `src/hooks/guards/tool-guard-hooks.ts`
4. `src/hooks/governance-block.ts` → `src/hooks/transforms/governance-block.ts`
5. `src/hooks/hook-cqrs-boundary.ts` → `src/hooks/composition/cqrs-boundary.ts`
6. `src/hooks/plugin-event-observers.ts` → `src/hooks/observers/event-observers.ts`
7. `src/hooks/toggle-gates.ts` → `src/hooks/transforms/toggle-gates.ts`
8. `src/hooks/tool-after-composer.ts` → `src/hooks/transforms/tool-after-composer.ts`
9. `src/hooks/types.ts` → `src/hooks/types.ts` (no change)

**Rollback:** `git revert HEAD` per commit

---

### Phase 8: Tools Reorganization (Low Risk)

**Goal:** Categorize tools by domain.

**Files to move:**
1. `src/tools/delegate-task.ts` → `src/tools/delegation/delegate-task.ts`
2. `src/tools/delegation-status.ts` → `src/tools/delegation/delegation-status.ts`
3. `src/tools/session-patch/` → `src/tools/session/session-patch/`
4. `src/tools/session-journal-export.ts` → `src/tools/session/session-journal-export.ts`
5. `src/tools/configure-primitive.ts` → `src/tools/config/configure-primitive.ts`
6. `src/tools/configure-primitive-paths.ts` → `src/tools/config/configure-primitive-paths.ts`
7. `src/tools/validate-restart.ts` → `src/tools/config/validate-restart.ts`
8. `src/tools/bootstrap-init.ts` → `src/tools/config/bootstrap-init.ts`
9. `src/tools/bootstrap-recover.ts` → `src/tools/config/bootstrap-recover.ts`
10. `src/tools/hivemind-doc.ts` → `src/tools/hivemind/hivemind-doc.ts`
11. `src/tools/hivemind-trajectory.ts` → `src/tools/hivemind/hivemind-trajectory.ts`
12. `src/tools/hivemind-pressure.ts` → `src/tools/hivemind/hivemind-pressure.ts`
13. `src/tools/hivemind-agent-work.ts` → `src/tools/hivemind/hivemind-agent-work.ts`
14. `src/tools/hivemind-sdk-supervisor.ts` → `src/tools/hivemind/hivemind-sdk-supervisor.ts`
15. `src/tools/hivemind-command-engine.ts` → `src/tools/hivemind/hivemind-command-engine.ts`
16. `src/tools/run-background-command.ts` → `src/tools/hivemind/run-background-command.ts`
17. `src/tools/prompt-skim/` → `src/tools/prompt/prompt-skim/`
18. `src/tools/prompt-analyze/` → `src/tools/prompt/prompt-analyze/`

**Rollback:** `git revert HEAD` per commit

---

### Phase 9: Plugin Composition Root Update (High Risk)

**Goal:** Update `src/plugin.ts` to use new import paths.

**Files to update:**
1. `src/plugin.ts` — Update all imports
2. `src/index.ts` — Update all re-exports

**Procedure:**
1. Update imports one at a time
2. Run `npm run typecheck` after each
3. Run `npm test` after all imports updated
4. Commit: `refactor: update plugin.ts imports for restructured modules`

**Rollback:** `git revert HEAD`

---

### Phase 10: Cleanup + AGENTS.md Updates (Low Risk)

**Goal:** Clean up empty directories and update AGENTS.md files.

**Actions:**
1. Remove empty `src/lib/` directory (if all files moved)
2. Create/update `src/AGENTS.md` with new structure
3. Create/update `src/hooks/AGENTS.md`
4. Create/update `src/features/AGENTS.md`
5. Create/update `src/tools/AGENTS.md`
6. Create/update `src/shared/AGENTS.md`
7. Create/update `src/config/AGENTS.md`
8. Create/update `src/routing/AGENTS.md`
9. Create/update `src/task-management/AGENTS.md`
10. Create/update `src/coordination/AGENTS.md`
11. Update `.planning/codebase/STRUCTURE.md`
12. Update `.planning/codebase/ARCHITECTURE.md`

**Rollback:** `git revert HEAD`

---

## 5. Circular Dependencies to Break

### 5.1 `primitive-scanners.ts` ↔ `primitive-registry.ts`

**Resolution:** Extract shared types to `src/shared/types.ts` or `src/features/bootstrap/types.ts`.

### 5.2 `runtime-validator.ts` ↔ `cross-primitive-validator.ts`

**Resolution:** Extract shared types to `src/shared/types.ts` or `src/features/bootstrap/types.ts`.

---

## 6. Verification Commands

```bash
# After each phase
npm run typecheck
npm test

# After Phase 4 (circular dep fix)
npx madge --circular src/

# After Phase 10 (full restructure)
npm run build
npm run test:coverage
```

---

## 7. Rollback Strategy

- **Per-phase:** `git revert HEAD` (each phase commits independently)
- **Full rollback:** `git checkout main && git branch -D refactor/structure-restructuring`
- **Critical path:** Phase 0 → Phase 1 → Phase 3 → Phase 9 → Phase 10

---

## 8. Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|-----------|
| 0 | Low | Safety net — no code changes |
| 1 | Low | Leaf modules — no downstream consumers |
| 2 | Medium | `continuity.ts` split requires care |
| 3 | High | `delegation-manager.ts` at 500 LOC cap |
| 4 | Medium | Feature modules — moderate import changes |
| 5 | Low | Config modules — few consumers |
| 6 | Low | Routing modules — few consumers |
| 7 | Low | Hook reorganization — internal only |
| 8 | Low | Tool reorganization — internal only |
| 9 | High | Plugin composition root — critical path |
| 10 | Low | Documentation only |

---

## 9. Success Criteria

| Criterion | Verification |
|-----------|-------------|
| All tests pass | `npm test` |
| Typecheck passes | `npm run typecheck` |
| No circular dependencies | `npx madge --circular src/` |
| Build succeeds | `npm run build` |
| All AGENTS.md files exist | `find src/ -name "AGENTS.md"` |
| All `.gitkeep` files exist | `find src/ -name ".gitkeep"` |
| `src/lib/` is empty or removed | `ls src/lib/` |

---

*Last updated: 2026-05-08*
