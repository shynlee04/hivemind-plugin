# STRUCTURE.md — Project Structure Intelligence

**Last Mapped:** 2026-05-28
**Project:** hivemind (v0.1.0) — Runtime composition engine for OpenCode
**Map Type:** Full Deep Scan (500+ lines, rich context)

---

## 1. Overview

HiveMind is a **TypeScript npm package** (`hivemind`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. It is loaded by OpenCode as a plugin via `.opencode/plugins/harness-control-plane.ts`.

The project has two distinct halves:
- **Hard Harness (npm package):** The compiled `src/` code — tools (write-side), hooks (read-side), plugin (assembly), shared utilities, task management, coordination, features, config, routing, schema-kernel, and CLI substrate. Published to npm.
- **Soft Meta-Concepts (user-configurable):** OpenCode primitives in `.opencode/` — agents, commands, skills, rules, permissions — that compose runtime behavior from outside the npm package. NOT shipped.

Internal state lives in `.hivemind/` (journals, lineage, session-tracker, runtime state). Planning/governance lives in `.planning/` (roadmap, architecture, research, phase artifacts).

---

## 2. Directory Layout

```
hivemind-plugin-private/
│
├── src/                              # TypeScript source (~228 files)
│   ├── plugin.ts                     # Composition root — plugin registration, tool/hook wiring (~554 LOC)
│   ├── index.ts                      # Public API re-exports (~30 LOC)
│   │
│   ├── cli/                          # CLI substrate (10 files)
│   │   ├── commands/                 # Command implementations (init, doctor, recover, version, help)
│   │   ├── ui/                       # Terminal UI components (prompts)
│   │   ├── index.ts                  # CLI barrel
│   │   ├── router.ts                 # Command routing
│   │   ├── discovery.ts              # Command discovery
│   │   └── renderer.ts               # Output rendering
│   │
│   ├── config/                       # Configuration layer (7 files)
│   │   ├── workflow/                 # Config subscriber and workflow (state, guards, persistence, types)
│   │   ├── compiler.ts               # Config compilation
│   │   └── subscriber.ts             # Lazy-load + cache + fallback for Hivemind configs
│   │
│   ├── coordination/                 # Delegation and orchestration (~35 files)
│   │   ├── delegation/               # Core delegation manager (20 files)
│   │   │   ├── manager.ts            # DelegationManager facade (thin public API)
│   │   │   ├── manager-runtime.ts    # Heavy runtime implementation
│   │   │   ├── coordinator.ts        # Delegation coordinator (dispatch, chain, abort)
│   │   │   ├── dispatcher.ts         # Preflight checks, slot allocation
│   │   │   ├── state-machine.ts      # Delegation state transitions, terminal states
│   │   │   ├── slot-manager.ts       # Concurrency slot allocation
│   │   │   ├── monitor.ts            # Dual-signal completion monitoring
│   │   │   ├── completion-detector.ts # Signal detection for delegation completion
│   │   │   ├── notification-router.ts # Routes notifications to parent sessions
│   │   │   ├── notification-formatter.ts # Formats notification messages
│   │   │   ├── periodic-notifier.ts  # Periodic status updates
│   │   │   ├── retry-handler.ts      # Retry with backoff
│   │   │   ├── escalation-timer.ts   # Timeout escalation
│   │   │   ├── resume-resolver.ts    # Session resume resolution
│   │   │   ├── sdk-child-session-starter.ts # SDK child session creation
│   │   │   ├── lifecycle.ts          # Delegation lifecycle management
│   │   │   ├── agent-resolver.ts     # Agent resolution
│   │   │   ├── survival-kit.ts       # Survival kit for delegation
│   │   │   └── types.ts              # Delegation types (DelegationStatus, Delegation interface, etc.)
│   │   │
│   │   ├── completion/               # Completion detection and notification (2 files)
│   │   │   ├── detector.ts           # Completion detector (leaf)
│   │   │   └── notification-handler.ts # Terminal notification handler
│   │   │
│   │   ├── concurrency/              # Queue management (1 file)
│   │   │   └── queue.ts              # Concurrency queue (leaf)
│   │   │
│   │   ├── command-delegation/       # Command delegation handler (2 files)
│   │   │   └── handler.ts            # Command delegation
│   │   │
│   │   ├── sdk-delegation/           # SDK child session delegation (2 files)
│   │   │   └── handler.ts            # SDK delegation handler
│   │   │
│   │   └── spawner/                  # Process spawner (7 files)
│   │       ├── auto-loop.ts          # Auto-loop implementation
│   │       ├── ralph-loop.ts         # Ralph loop implementation
│   │       ├── session-creator.ts    # Session creation
│   │       ├── spawn-request-builder.ts # Spawn request building
│   │       ├── agent-primitive-policy.ts # Agent primitive policy
│   │       ├── parent-directory.ts   # Parent directory resolution
│   │       └── spawner-types.ts      # Spawner types
│   │
│   ├── features/                     # Standalone runtime features (~70 files)
│   │   ├── session-tracker/          # Session tracking (30 files)
│   │   │   ├── index.ts              # SessionTracker class (622 LOC)
│   │   │   ├── types.ts              # Session tracker types (389 LOC)
│   │   │   ├── initialization.ts     # Initialization logic
│   │   │   ├── classification.ts     # Session classification
│   │   │   ├── bootstrap.ts          # Bootstrap logic
│   │   │   ├── session-router.ts     # Session routing
│   │   │   ├── tool-delegation.ts    # Tool delegation tracking
│   │   │   ├── project-continuity.ts # Project continuity checker
│   │   │   ├── child-recorder.ts     # Child session recording
│   │   │   ├── orphan-cleanup.ts     # Orphan session cleanup
│   │   │   ├── capture/              # Session capture (4 files)
│   │   │   │   ├── event-capture.ts
│   │   │   │   ├── message-capture.ts
│   │   │   │   ├── tool-capture.ts
│   │   │   │   └── last-message-capture.ts
│   │   │   ├── persistence/          # Persistence layer (10 files)
│   │   │   │   ├── atomic-write.ts   # Crash-safe atomic write (write-to-temp + rename)
│   │   │   │   ├── session-writer.ts # Session .md knowledge file writer
│   │   │   │   ├── child-writer.ts   # Child session JSON writer
│   │   │   │   ├── session-index-writer.ts # Session index writer
│   │   │   │   ├── project-index-writer.ts # Project index writer
│   │   │   │   ├── hierarchy-manifest.ts # Hierarchy manifest writer
│   │   │   │   ├── hierarchy-index.ts # Hierarchy index writer
│   │   │   │   ├── orphan-quarantine.ts # Orphan quarantine
│   │   │   │   ├── pending-dispatch-registry.ts # Pending dispatch registry
│   │   │   │   └── retry-queue.ts    # Retry queue with flush interval
│   │   │   ├── recovery/             # Session recovery (1 file)
│   │   │   │   └── session-recovery.ts
│   │   │   ├── transform/            # Data transformation (1 file)
│   │   │   │   └── agent-transform.ts
│   │   │   └── hooks/                # Tracker hooks (placeholder)
│   │   │
│   │   ├── bootstrap/                # Bootstrap and primitive registry (8 files)
│   │   │   ├── primitive-registry.ts # Primitive Registry — catalogs all OpenCode primitives
│   │   │   ├── primitive-loader.ts   # Primitive loading
│   │   │   ├── primitive-scanners.ts # Scanning agents, commands, skills
│   │   │   ├── framework-detector.ts # Framework detection
│   │   │   ├── runtime-validator.ts  # Runtime validation
│   │   │   ├── structure.ts          # Structure definition
│   │   │   ├── cross-primitive-validator.ts # Cross-primitive validation
│   │   │   └── control-plane/        # Control plane initialization
│   │   │       ├── index.ts          # Control plane barrel
│   │   │       ├── gatekeeper.ts     # Gatekeeper (blocking/non-blocking gates)
│   │   │       └── gate-decision.ts  # Gate decision classification
│   │   │
│   │   ├── doc-intelligence/         # Document intelligence (5 files)
│   │   │   ├── index.ts              # Barrel re-exports
│   │   │   ├── types.ts              # Doc intelligence types
│   │   │   ├── parser.ts             # Markdown parser
│   │   │   ├── chunker.ts            # Document chunking
│   │   │   └── router.ts             # Action router (skim, read, chunk, search)
│   │   │
│   │   ├── runtime-pressure/         # Runtime pressure monitoring (5 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # Pressure types
│   │   │   ├── model.ts              # Pressure model
│   │   │   ├── authority-matrix.ts   # Authority matrix
│   │   │   └── control-plane.ts      # Control plane integration
│   │   │
│   │   ├── agent-work-contracts/     # Work contract management (4 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # Work contract types
│   │   │   ├── store.ts              # Work contract store
│   │   │   └── operations.ts         # Work contract operations
│   │   │
│   │   ├── sdk-supervisor/           # SDK health monitoring (3 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # SDK supervisor types
│   │   │   └── .gitkeep
│   │   │
│   │   ├── governance-engine/        # Governance engine (4 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── config-reader.ts      # Config reader
│   │   │   └── create-governance-session.ts # Governance session creation
│   │   │
│   │   ├── prompt-packet/            # Prompt packet system (2 files)
│   │   │   ├── kernel-packet.ts      # Kernel packet
│   │   │   └── compaction-preservation.ts # Compaction preservation
│   │   │
│   │   ├── ralph-loop/               # Ralph loop implementation (3 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # Ralph loop types
│   │   │   └── .gitkeep
│   │   │
│   │   ├── auto-loop/                # Auto-loop implementation (3 files)
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # Auto-loop types
│   │   │   └── .gitkeep
│   │   │
│   │   └── background-command/       # Background command execution
│   │       └── pty/                  # PTY integration (bun-pty) (6 files)
│   │           ├── pty-manager.ts    # PTY process manager
│   │           ├── pty-runtime.ts    # PTY runtime detection (Bun-only)
│   │           ├── pty-types.ts      # PTY types
│   │           ├── pty-buffer.ts     # PTY output buffer
│   │           └── bun-pty.d.ts      # bun-pty type declarations
│   │
│   ├── hooks/                        # Lifecycle hooks (15 files)
│   │   ├── composition/              # Hook composition
│   │   │   └── cqrs-boundary.ts      # CQRS boundary classification (hook effect kinds)
│   │   ├── guards/                   # Pre/post guards
│   │   │   ├── tool-guard-hooks.ts   # Circuit breaker, budget, governance guards
│   │   │   └── governance-block.ts   # Governance block logic
│   │   ├── lifecycle/                # Lifecycle hooks
│   │   │   ├── core-hooks.ts         # Core hooks (event, system.transform, shell.env)
│   │   │   └── session-hooks.ts      # Session lifecycle hooks
│   │   ├── observers/                # Event observers (CQRS-compliant read-side)
│   │   │   ├── event-observers.ts    # Delegation/session-entry event observers
│   │   │   ├── session-entry-consumer.ts # Session entry consumer
│   │   │   ├── session-main-consumer.ts # Session main consumer
│   │   │   ├── session-tracker-consumer.ts # Session tracker consumer
│   │   │   └── delegation-consumer.ts # Delegation consumer
│   │   ├── transforms/               # Data transforms
│   │   │   ├── tool-before-guard.ts  # tool.execute.before transform
│   │   │   ├── tool-after-composer.ts # tool.execute.after composer
│   │   │   ├── tool-after-workflow.ts # tool.execute.after workflow
│   │   │   └── chat-message-capture.ts # Chat message capture transform
│   │   └── types.ts                  # Hook types (HookDependencies)
│   │
│   ├── routing/                      # Session and command routing (13 files)
│   │   ├── session-entry/            # Session entry point
│   │   │   ├── index.ts              # Barrel (resolveIntake, classifyPurpose, detectLanguage, resolveProfile)
│   │   │   ├── purpose-classifier.ts # Purpose classification
│   │   │   ├── language-resolution.ts # Language detection
│   │   │   ├── profile-resolver.ts   # Developer profile resolution
│   │   │   └── intake-gate.ts        # Intake gate (full resolution pipeline)
│   │   ├── behavioral-profile/       # Behavioral profile matching
│   │   │   ├── index.ts              # Barrel
│   │   │   ├── types.ts              # Profile types (CommunicationStyle, DecisionSpeed, Expertise)
│   │   │   ├── profiles.ts           # Profile definitions
│   │   │   └── resolve-behavioral-profile.ts # Profile resolution
│   │   └── command-engine/           # Command engine
│   │       ├── index.ts              # Barrel (executeCommandEngineAction, listCommands, discoverCommandBundles)
│   │       └── types.ts              # Command engine types
│   │
│   ├── schema-kernel/                # Zod schemas (20 files)
│   │   ├── index.ts                  # Barrel with validateWithFallback
│   │   ├── agent-frontmatter.schema.ts # Agent frontmatter validation
│   │   ├── agent-work-contract.schema.ts # Agent work contract validation
│   │   ├── bootstrap.schema.ts       # Bootstrap validation
│   │   ├── command-engine.schema.ts  # Command engine validation
│   │   ├── command-frontmatter.schema.ts # Command frontmatter validation
│   │   ├── commands.schema.ts        # Commands validation
│   │   ├── config-precedence.schema.ts # Config precedence validation
│   │   ├── doc-intelligence.schema.ts # Doc intelligence validation
│   │   ├── generate-config-json-schema.ts # Config JSON schema generation
│   │   ├── hivemind-configs.schema.ts # Hivemind configs validation
│   │   ├── mcp-server.schema.ts      # MCP server validation
│   │   ├── prompt-enhance.schema.ts  # Prompt enhance validation (skim/analyze/patch)
│   │   ├── runtime-pressure.schema.ts # Runtime pressure validation
│   │   ├── sdk-supervisor.schema.ts  # SDK supervisor validation
│   │   ├── session-tracker.schema.ts # Session tracker validation
│   │   ├── session-view.schema.ts    # Session view validation
│   │   ├── skill-metadata.schema.ts  # Skill metadata validation
│   │   ├── tool.schema.ts            # Tool validation
│   │   └── trajectory.schema.ts      # Trajectory validation
│   │
│   ├── shared/                       # Leaf utilities and contracts (~25 files)
│   │   ├── types.ts                  # Shared type definitions (420 LOC)
│   │   ├── helpers.ts                # Helper functions (asString, getNestedValue, unwrapData)
│   │   ├── session-api.ts            # SDK wrapper (createSession, getSession, sendPromptAsync, etc.)
│   │   ├── state.ts                  # In-memory state maps (TaskStateManager)
│   │   ├── task-status.ts            # Task status transitions
│   │   ├── tool-response.ts          # Response envelope (success/error)
│   │   ├── tool-helpers.ts           # Tool helper functions
│   │   ├── session-naming.ts         # Session naming service
│   │   ├── runtime.ts                # Runtime utilities
│   │   ├── runtime-policy.ts         # Runtime policy loading
│   │   ├── workspace-runtime-policy.ts # Workspace runtime policy
│   │   ├── plugin-tool-output-summary.ts # Plugin tool output summary
│   │   ├── app-api.ts                # App API
│   │   ├── errors/                   # Error types
│   │   │   └── commands.ts           # Command error types
│   │   └── security/                 # Security utilities
│   │       ├── redaction.ts          # Field redaction
│   │       └── path-scope.ts         # Path scope validation
│   │
│   ├── sidecar/                      # Sidecar functionality
│   │   └── readonly-state.ts         # Read-only state for sidecar
│   │
│   ├── task-management/              # Task lifecycle management (~15 files)
│   │   ├── continuity/               # Session persistence
│   │   │   ├── index.ts              # Continuity store (read/write session continuity JSON)
│   │   │   ├── delegation-persistence.ts # Delegation record I/O
│   │   │   └── store-cache.ts        # Store cache
│   │   ├── journal/                  # Event journaling
│   │   │   ├── index.ts              # Journal barrel
│   │   │   ├── query.ts              # Journal query
│   │   │   ├── replay.ts             # Journal replay
│   │   │   └── execution-lineage.ts  # Execution lineage
│   │   ├── lifecycle/                # Lifecycle manager
│   │   │   └── index.ts              # Lifecycle manager barrel
│   │   └── trajectory/               # Execution trajectory
│   │       ├── index.ts              # Trajectory barrel
│   │       ├── ledger.ts             # Trajectory ledger
│   │       ├── store-operations.ts   # Store operations
│   │       └── types.ts              # Trajectory types
│   │
│   └── tools/                        # Tool implementations (~35 files)
│       ├── config/                   # Config tools
│       │   ├── bootstrap-init.ts     # Bootstrap initialization tool
│       │   ├── bootstrap-recover.ts  # Bootstrap recovery tool
│       │   ├── configure-primitive.ts # Primitive configuration tool
│       │   ├── configure-primitive-paths.ts # Primitive path resolution
│       │   └── validate-restart.ts   # Restart validation tool
│       │
│       ├── delegation/               # Delegation tools
│       │   ├── delegate-task.ts      # Delegate task tool (WaiterModel dispatch)
│       │   ├── delegation-status.ts  # Delegation status polling tool
│       │   └── types.ts              # Delegation tool types
│       │
│       ├── hivemind/                 # Hivemind tools
│       │   ├── hivemind-doc.ts       # Document intelligence tool
│       │   ├── hivemind-trajectory.ts # Trajectory tool
│       │   ├── hivemind-pressure.ts  # Pressure classification tool
│       │   ├── hivemind-agent-work.ts # Agent work contract tools
│       │   ├── hivemind-sdk-supervisor.ts # SDK supervisor tool
│       │   ├── hivemind-command-engine.ts # Command engine tool
│       │   ├── hivemind-session-view.ts # Session view tool
│       │   └── run-background-command.ts # Background command tool
│       │
│       ├── prompt/                   # Prompt tools
│       │   ├── prompt-skim/          # Prompt skim tool
│       │   │   ├── index.ts
│       │   │   ├── types.ts
│       │   │   └── tools.ts
│       │   └── prompt-analyze/       # Prompt analyze tool
│       │       ├── index.ts
│       │       ├── types.ts
│       │       └── tools.ts
│       │
│       └── session/                  # Session tools
│           ├── execute-slash-command.ts # Execute slash command tool
│           ├── resolve-command.ts     # Command resolution
│           ├── dispatch-command.ts    # Command dispatch
│           ├── semantic-agent-selector.ts # Semantic agent selection
│           ├── validate-command.ts    # Command validation
│           ├── workflow-parser.ts     # Workflow parsing
│           ├── session-tracker.ts     # Session tracker tool
│           ├── session-hierarchy.ts   # Session hierarchy tool
│           ├── session-context.ts     # Session context tool
│           ├── session-patch/         # Session patch tool
│           │   ├── index.ts
│           │   ├── tools.ts
│           │   └── types.ts
│           ├── session-journal-export.ts # Session journal export tool
│           ├── session-resolver.ts    # Session resolver
│           └── index.ts              # Barrel
│
├── tests/                            # Test files (~204 files)
│   ├── lib/                          # Unit tests for src/ modules
│   │   ├── coordination/             # Coordination tests
│   │   │   ├── delegation/           # Delegation tests (14 files)
│   │   │   │   ├── manager-decomposition.test.ts
│   │   │   │   ├── coordinator.test.ts
│   │   │   │   ├── dispatcher.test.ts
│   │   │   │   ├── completion-detector.test.ts
│   │   │   │   ├── slot-manager.test.ts
│   │   │   │   ├── status-mapping.test.ts
│   │   │   │   ├── notification-router.test.ts
│   │   │   │   ├── periodic-notifier.test.ts
│   │   │   │   ├── monitor.test.ts
│   │   │   │   ├── escalation-timer.test.ts
│   │   │   │   ├── agent-resolver.test.ts
│   │   │   │   ├── full-pipeline.test.ts
│   │   │   │   ├── deprecated-exports.test.ts
│   │   │   │   └── .gitkeep
│   │   │   ├── concurrency/          # Concurrency tests
│   │   │   │   └── queue.test.ts
│   │   │   └── completion/           # Completion tests
│   │   │       └── detector-v2.test.ts
│   │   ├── features/                 # Feature tests
│   │   │   ├── ralph-loop.test.ts
│   │   │   └── auto-loop.test.ts
│   │   ├── hooks/                    # Hook tests
│   │   ├── shared/                   # Shared utility tests
│   │   ├── task-management/          # Task management tests
│   │   ├── tools/                    # Tool tests
│   │   ├── session-entry/            # Session entry tests
│   │   │   ├── purpose-classifier.test.ts
│   │   │   ├── profile-resolver.test.ts
│   │   │   ├── language-resolution.test.ts
│   │   │   └── intake-gate.test.ts
│   │   ├── behavioral-profile/       # Behavioral profile tests
│   │   ├── command-engine/           # Command engine tests
│   │   ├── config-workflow/          # Config workflow tests
│   │   ├── control-plane/            # Control plane tests
│   │   ├── doc-intelligence/         # Doc intelligence tests
│   │   ├── runtime-pressure/         # Runtime pressure tests
│   │   ├── sdk-supervisor/           # SDK supervisor tests
│   │   ├── spawner/                  # Spawner tests
│   │   ├── security/                 # Security tests
│   │   ├── trajectory/               # Trajectory tests
│   │   └── agent-work-contracts/     # Agent work contract tests
│   ├── plugin/                       # Plugin tests
│   │   └── bootstrap-tools-registration.test.ts
│   ├── shared/                       # Shared tests
│   ├── tools/                        # Tool-specific tests
│   ├── sidecar/                      # Sidecar tests
│   ├── schema-kernel/                # Schema kernel tests
│   ├── hooks/                        # Hook tests
│   ├── cli/                          # CLI tests
│   ├── kernel/                       # Kernel tests
│   ├── integration/                  # Integration tests
│   ├── features/                     # Feature tests
│   └── task-management/              # Task management tests
│
├── bin/                              # CLI entrypoint (4 files)
│   ├── hivemind.cjs                  # Main CLI entrypoint (CommonJS wrapper)
│   ├── validate-agent-config.sh      # Agent config validation script
│   ├── validate-load-order.sh        # Load order validation script
│   └── validate-runtime-paths.sh     # Runtime path validation script
│
├── scripts/                          # Build scripts (2 files)
│   ├── sync-assets.js                # Asset sync script (primitives reflection)
│   └── transform-gsd-to-hm.js        # GSD-to-HM transformation script
│
├── assets/                           # Bootstrap assets (7 directories)
│   ├── .hivemind/                    # Hivemind bootstrap assets
│   ├── agents/                       # Agent template assets
│   ├── commands/                     # Command template assets
│   ├── references/                   # Reference assets
│   ├── skills/                       # Skill template assets
│   ├── templates/                    # Template assets
│   └── workflows/                    # Workflow template assets
│
├── dist/                             # Compiled output (gitignored)
│
├── .opencode/                        # OpenCode primitives (~137 commands, 42 agents, 34 skills)
│   ├── agents/                       # Agent definitions (42 agents)
│   │   ├── hm-*                      # Harness module specialists (31 agents)
│   │   └── hf-*                      # Hivemind framework agents (11 agents)
│   │
│   ├── commands/                     # Slash commands (137 files)
│   │   ├── core/                     # Core commands (start-work, plan, deep-init, etc.)
│   │   ├── extended/                 # Extended commands (hf-absorb, hf-audit, etc.)
│   │   ├── sync/                     # Sync commands (sync-agents-md)
│   │   └── test/                     # Test commands (test-echo, test-list, etc.)
│   │
│   ├── skills/                       # Skill packages (34 skills)
│   │   ├── hf-l2-*                   # Meta-builder skills (13)
│   │   ├── gate-l3-*                 # Quality gate triad (3)
│   │   ├── stack-l3-*                # Stack references (6)
│   │   ├── hivemind-*                # Governance (1)
│   │   └── unprefixed                # Orchestration/patterns (11)
│   │
│   ├── hooks/                        # Hook definitions (14 files)
│   ├── rules/                        # Permission rules (2 files)
│   ├── plugins/                      # Plugin loader wrappers (1 file)
│   ├── workflows/                    # Workflow definitions (106 files)
│   ├── get-shit-done/                # GSD framework (workflows, templates, VERSION)
│   ├── state/                        # Legacy state (migration-only)
│   ├── references/                   # Reference materials
│   ├── research/                     # Research artifacts
│   ├── retired/                      # Retired primitives
│   ├── templates/                    # Templates
│   ├── hivefiver/                    # Hivefiver artifacts
│   └── .gitignore
│
├── .hivemind/                        # Internal state (31 directories)
│   ├── AGENTS.md                     # Sector guidance
│   ├── STACKS-REFERENCES.md          # Stack reference links
│   ├── state/                        # Runtime state files
│   │   ├── session-continuity.json   # Session persistence (Q6 canonical)
│   │   ├── delegations.json          # Delegation state
│   │   ├── trajectory-ledger.json    # Trajectory ledger
│   │   ├── agent-work-contracts.json # Agent work contracts
│   │   ├── config-workflows.json     # Config workflows
│   │   └── version.json              # Version state
│   ├── session-tracker/              # Session tracker data (per-session directories)
│   ├── journal/                      # Event journal (placeholder)
│   ├── lineage/                      # Execution lineage (placeholder)
│   ├── planning/                     # Planning artifacts (24 subdirectories)
│   ├── research/                     # Research artifacts (5 files)
│   ├── audit/                        # Audit records (3 files)
│   ├── governance/                   # Governance state
│   ├── configs.json                  # Runtime config
│   ├── configs.schema.json           # Config schema
│   ├── scripts/                      # Hivemind scripts
│   ├── delegation/                   # Delegation records
│   ├── delegation-managements/       # Delegation management
│   ├── logs/                         # Runtime logs
│   ├── manifests/                    # Session manifests
│   ├── onboarding/                   # Onboarding artifacts
│   ├── hm-brain/                     # HM brain artifacts
│   ├── hf-brain/                     # HF brain artifacts
│   ├── sidecar/                      # Sidecar artifacts
│   ├── task-managements/             # Task management artifacts
│   ├── tracking/                     # Tracking artifacts
│   ├── synthesis/                    # Synthesis artifacts
│   ├── daily-notes/                  # Daily notes
│   ├── artifacts/                    # Generated artifacts
│   ├── poor-prompts/                 # Poor prompt examples
│   ├── uat/                          # UAT artifacts
│   └── registries/                   # Registry artifacts
│
├── .planning/                        # Governance and planning artifacts (24 directories)
│   ├── AGENTS.md                     # Planning sector guidance
│   ├── PROJECT.md                    # Project definition
│   ├── REQUIREMENTS.md               # Requirements
│   ├── ROADMAP.md                    # Roadmap
│   ├── STATE.md                      # Current state
│   ├── config.json                   # Planning config
│   ├── codebase/                     # Codebase intelligence (7 files)
│   │   ├── ARCHITECTURE.md           # CQRS model, 9-surface authority
│   │   ├── STRUCTURE.md              # This file
│   │   ├── CONVENTIONS.md            # Code conventions
│   │   ├── STACK.md                  # Technology stack
│   │   ├── CONCERNS.md               # Known issues
│   │   ├── INTEGRATIONS.md           # Integration points
│   │   └── TESTING.md                # Testing conventions
│   ├── architecture/                 # Architecture decisions (11 files)
│   ├── research/                     # Research artifacts (31 files)
│   ├── phases/                       # Phase artifacts (86 directories)
│   ├── specs/                        # Specifications
│   ├── audits/                       # Audit records
│   ├── lifecycle/                    # Lifecycle notes
│   ├── roadmap/                      # Roadmap details
│   ├── references/                   # Reference materials
│   ├── debug/                        # Debug artifacts
│   ├── forensics/                    # Forensics artifacts
│   ├── spikes/                       # Spike artifacts
│   ├── quick/                        # Quick notes
│   ├── config/                       # Config artifacts
│   ├── migrations/                   # Migration artifacts
│   ├── checklists/                   # Checklists
│   ├── planning/                     # Planning sub-artifacts
│   └── archive/                      # Archived artifacts
│
├── .hivefiver-meta-builder/          # Meta-authoring lab (source-of-truth for primitives)
│   ├── AGENTS.md                     # Meta-builder guidance
│   ├── agents-lab/                   # Agent authoring lab
│   │   ├── active/                   # Active agent definitions
│   │   ├── archive/                  # Archived agent definitions
│   │   └── orchestrator/             # Orchestrator definitions
│   ├── skills-lab/                   # Skill authoring lab
│   │   ├── active/                   # Active skill definitions
│   │   ├── .archive/                 # Archived skills
│   │   ├── .archive-refactoring-skills/ # Archived refactoring skills
│   │   ├── hivemind-power-on/        # Hivemind power-on skill
│   │   └── retired/                  # Retired skills
│   ├── commands-lab/                 # Command authoring lab
│   │   ├── active/                   # Active command definitions
│   │   └── research-analysis-group/  # Research analysis commands
│   ├── references-lab/               # Reference lab
│   ├── workflows-lab/                # Workflow authoring lab
│   ├── plans/                        # Meta-builder plans
│   ├── research/                     # Meta-builder research
│   ├── rules/                        # Meta-builder rules
│   └── .hivemind/                    # Meta-builder state
│
├── package.json                      # npm package definition
├── tsconfig.json                     # TypeScript configuration
├── AGENTS.md                         # Project-level agent instructions
├── vitest.config.ts                  # Vitest configuration
└── .gitignore                        # Git ignore rules
```

---

## 3. Directory Purposes

### 3.1 `src/` — TypeScript Source

**Purpose:** The Hard Harness — the compiled npm package that provides tools, hooks, and a plugin for OpenCode integration.

**Contains:** ~228 TypeScript files organized by architectural concern. Each module follows the 9-surface CQRS model with clear read-side/write-side separation.

**Key Files:**
- `src/plugin.ts` — Composition root (554 LOC). Instantiates shared dependencies, wires hook factories, registers tools. Intentionally thin.
- `src/index.ts` — Public API re-exports (30 LOC). Re-exports key modules for external consumption.
- `src/shared/types.ts` — Shared type definitions (420 LOC). Central type authority for the project.
- `src/shared/session-api.ts` — SDK wrapper (328 LOC). Wraps @opencode-ai/sdk for session operations.
- `src/shared/state.ts` — In-memory state maps (251 LOC). TaskStateManager class for session/budget state.

**Why it exists:** This is the core product — a TypeScript npm package that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

---

### 3.2 `src/shared/` — Leaf Utilities and Contracts

**Purpose:** Leaf-like shared contract authority and utility functions. These modules have minimal or no internal dependencies and serve as the foundation for the rest of the codebase.

**Contains:** Types, helpers, SDK wrappers, runtime policy, security utilities.

**Key Files:**
- `src/shared/types.ts` — Central type definitions (TaskStatus, TaskNotification, PendingNotification, DelegationMeta, etc.)
- `src/shared/helpers.ts` — Utility functions (asString, getNestedValue, unwrapData, isObject)
- `src/shared/session-api.ts` — OpenCode SDK wrapper (createSession, getSession, sendPromptAsync, abortSession, etc.)
- `src/shared/state.ts` — TaskStateManager class (in-memory Maps for root budgets, session stats, delegation meta)
- `src/shared/tool-response.ts` — Response envelope (success/error helpers for tool returns)

**Why it exists:** Provides leaf-like modules that other modules depend on without creating circular dependencies. Max module size: 500 LOC.

---

### 3.3 `src/coordination/` — Delegation and Orchestration

**Purpose:** Core delegation lifecycle management, including dispatch, monitoring, completion detection, notification routing, and concurrency control. This is the "brain" of the delegation system.

**Contains:** ~35 files across delegation/, completion/, concurrency/, command-delegation/, sdk-delegation/, and spawner/.

**Key Files:**
- `src/coordination/delegation/manager.ts` — DelegationManager facade (thin public API, delegates to manager-runtime.ts)
- `src/coordination/delegation/coordinator.ts` — DelegationCoordinator (dispatch, chain, abort, signal handling)
- `src/coordination/delegation/state-machine.ts` — Delegation state transitions, terminal states, safety ceiling timers
- `src/coordination/delegation/types.ts` — DelegationStatus, Delegation interface, DelegationResult, etc.
- `src/coordination/concurrency/queue.ts` — Concurrency queue (leaf module)

**Why it exists:** Implements the WaiterModel delegation pattern with dual-signal completion (doer + verifier must agree). Manages the full delegation lifecycle from dispatch to terminal state.

---

### 3.4 `src/features/` — Standalone Runtime Features

**Purpose:** Self-contained runtime features that can be independently loaded and composed. Each feature is isolated with its own types, persistence, and business logic.

**Contains:** ~70 files across session-tracker/, bootstrap/, doc-intelligence/, runtime-pressure/, agent-work-contracts/, sdk-supervisor/, governance-engine/, prompt-packet/, ralph-loop/, auto-loop/, and background-command/.

**Key Files:**
- `src/features/session-tracker/index.ts` — SessionTracker class (622 LOC). Central session knowledge capture.
- `src/features/bootstrap/primitive-registry.ts` — Primitive Registry (282 LOC). Catalogs all OpenCode primitives.
- `src/features/doc-intelligence/index.ts` — Document intelligence barrel. Markdown skim, read, chunk, search.
- `src/features/runtime-pressure/index.ts` — Runtime pressure barrel. Pressure classification and control plane.
- `src/features/agent-work-contracts/index.ts` — Agent work contracts barrel. Durable work contracts.

**Why it exists:** Each feature is a standalone module that can be independently tested and composed. Features follow CQRS compliance — hooks observe, features own persistence.

---

### 3.5 `src/hooks/` — Lifecycle Hooks

**Purpose:** OpenCode hook implementations that observe lifecycle events, guard tool execution, and shape responses. Hooks are read-side only (CQRS compliance) — they never perform durable writes.

**Contains:** 15 files across composition/, guards/, lifecycle/, observers/, and transforms/.

**Key Files:**
- `src/hooks/composition/cqrs-boundary.ts` — CQRS boundary classification (hook effect kinds: observation, response-shaping, guard-decision)
- `src/hooks/lifecycle/core-hooks.ts` — Core hooks (event, system.transform, shell.env)
- `src/hooks/guards/tool-guard-hooks.ts` — Circuit breaker, budget, governance guards
- `src/hooks/observers/event-observers.ts` — Delegation/session-entry event observers (read-side only)
- `src/hooks/transforms/tool-before-guard.ts` — tool.execute.before transform (runs guard + proactive child discovery)

**Why it exists:** Implements the read-side of the CQRS model. Hooks observe OpenCode lifecycle events and route to write-side consumers (features, coordination) without performing durable writes themselves.

---

### 3.6 `src/tools/` — Tool Implementations

**Purpose:** OpenCode tool implementations that agents can call. Tools are the write-side of the CQRS model — they perform actions and return results.

**Contains:** ~35 files across config/, delegation/, hivemind/, prompt/, and session/.

**Key Files:**
- `src/tools/delegation/delegate-task.ts` — Delegate task tool (WaiterModel dispatch)
- `src/tools/session/execute-slash-command.ts` — Execute slash command tool
- `src/tools/hivemind/hivemind-doc.ts` — Document intelligence tool
- `src/tools/config/configure-primitive.ts` — Primitive configuration tool
- `src/tools/session/session-tracker.ts` — Session tracker tool

**Why it exists:** Provides the write-side tools that agents use to perform actions. Tools are registered in plugin.ts and exposed to the OpenCode runtime.

---

### 3.7 `src/routing/` — Session and Command Routing

**Purpose:** Session entry intake pipeline, behavioral profile matching, and command engine. Classifies user input, detects language, resolves developer profile, and produces routing decisions.

**Contains:** 13 files across session-entry/, behavioral-profile/, and command-engine/.

**Key Files:**
- `src/routing/session-entry/index.ts` — Barrel (resolveIntake, classifyPurpose, detectLanguage, resolveProfile)
- `src/routing/session-entry/intake-gate.ts` — Full intake gate resolution pipeline
- `src/routing/behavioral-profile/resolve-behavioral-profile.ts` — Profile resolution
- `src/routing/command-engine/index.ts` — Command engine (executeCommandEngineAction, listCommands, discoverCommandBundles)

**Why it exists:** Routes user intent through intelligent classification and profile resolution. The intake gate pipeline classifies purpose, detects language, and resolves the developer profile before routing to the appropriate handler.

---

### 3.8 `src/config/` — Configuration Layer

**Purpose:** Configuration management, including lazy-load, caching, fallback, and workflow state management.

**Contains:** 7 files across workflow/ and root.

**Key Files:**
- `src/config/subscriber.ts` — Config subscriber (lazy-load + cache + fallback for Hivemind configs)
- `src/config/compiler.ts` — Config compilation
- `src/config/workflow/index.ts` — Config workflow barrel
- `src/config/workflow/workflow-state.ts` — Workflow state management
- `src/config/workflow/workflow-guards.ts` — Workflow guards

**Why it exists:** Manages Hivemind configuration with lazy-loading, per-project caching, and graceful fallback to defaults. Supports multi-project scenarios.

---

### 3.9 `src/schema-kernel/` — Zod Schemas

**Purpose:** Zod validation schemas for all OpenCode meta-concepts and runtime data structures. Provides type-safe validation with graceful fallback for unknown fields.

**Contains:** 20 schema files.

**Key Files:**
- `src/schema-kernel/index.ts` — Barrel with validateWithFallback (strict-first with graceful unknown-field stripping)
- `src/schema-kernel/hivemind-configs.schema.ts` — Hivemind configs validation
- `src/schema-kernel/agent-frontmatter.schema.ts` — Agent frontmatter validation
- `src/schema-kernel/tool.schema.ts` — Tool validation
- `src/schema-kernel/generate-config-json-schema.ts` — Config JSON schema generation

**Why it exists:** Provides type-safe validation for all data structures in the project. The validateWithFallback pattern ensures strict validation with graceful handling of unknown fields.

---

### 3.10 `src/cli/` — CLI Substrate

**Purpose:** Command-line interface for Hivemind operations (init, doctor, recover, version, help).

**Contains:** 10 files across commands/ and ui/.

**Key Files:**
- `src/cli/index.ts` — CLI barrel
- `src/cli/router.ts` — Command routing
- `src/cli/discovery.ts` — Command discovery
- `src/cli/commands/init.ts` — Init command
- `src/cli/commands/doctor.ts` — Doctor command

**Why it exists:** Provides CLI tooling for project initialization, health checks, and recovery operations. Uses @clack/prompts for interactive terminal UI.

---

### 3.11 `src/sidecar/` — Sidecar Functionality

**Purpose:** Read-only sidecar state for GUI integration. Provides a read-only view of Hivemind state for the sidecar dashboard.

**Contains:** 1 file.

**Key Files:**
- `src/sidecar/readonly-state.ts` — Read-only state for sidecar

**Why it exists:** Provides a read-only interface to Hivemind state for the GUI sidecar dashboard. Follows the Q2 decision (Artifact-Focused Sidecar).

---

### 3.12 `src/task-management/` — Task Lifecycle Management

**Purpose:** Task lifecycle management including session persistence, event journaling, lifecycle management, and execution trajectory.

**Contains:** ~15 files across continuity/, journal/, lifecycle/, and trajectory/.

**Key Files:**
- `src/task-management/continuity/index.ts` — Continuity store (read/write session continuity JSON, 467 LOC)
- `src/task-management/continuity/delegation-persistence.ts` — Delegation record I/O
- `src/task-management/journal/index.ts` — Journal barrel
- `src/task-management/lifecycle/index.ts` — Lifecycle manager barrel
- `src/task-management/trajectory/ledger.ts` — Trajectory ledger

**Why it exists:** Manages the full task lifecycle from creation to completion. Continuity store provides durable session persistence. Journal provides append-only event timeline. Trajectory provides execution lineage tracking.

---

### 3.13 `.opencode/` — OpenCode Primitives

**Purpose:** Soft Meta-Concepts — OpenCode primitives (agents, commands, skills, rules, permissions) that compose runtime behavior from outside the npm package. NOT shipped with the npm package.

**Contains:** 42 agents, 137 commands, 34 skills, 14 hooks, 2 rules, 1 plugin loader, 106 workflows.

**Key Files:**
- `.opencode/agents/hm-l0-orchestrator.md` — Front-facing L0 strategist (806 LOC, mode: primary, temperature: 0.3)
- `.opencode/skills/hivemind-power-on/SKILL.md` — Session governance core (LOAD FIRST)
- `.opencode/plugins/harness-control-plane.ts` — Plugin loader wrapper (7 LOC, re-exports dist/plugin.js)
- `.opencode/rules/universal-rules.md` — Universal rules
- `.opencode/commands/start-work.md` — Start work command

**Why it exists:** Configures OpenCode runtime behavior through primitives. Agents define specialist roles, commands define slash commands, skills define reusable workflows, rules define permissions.

---

### 3.14 `.hivemind/` — Internal State

**Purpose:** Internal deep module persistence — session journals, execution lineage, runtime state, graph/vector memory. Canonical per Q6 decision.

**Contains:** 31 directories including state/, session-tracker/, journal/, lineage/, planning/, research/, audit/, governance/.

**Key Files:**
- `.hivemind/state/session-continuity.json` — Session persistence (Q6 canonical)
- `.hivemind/state/delegations.json` — Delegation state
- `.hivemind/state/trajectory-ledger.json` — Trajectory ledger
- `.hivemind/configs.json` — Runtime config
- `.hivemind/session-tracker/` — Per-session knowledge files (.md + .json)

**Why it exists:** Provides durable persistence for all internal runtime state. Q6 decision locked `.hivemind/` as the canonical state root, preventing corruption by other plugins or user dependencies.

---

### 3.15 `.planning/` — Governance and Planning

**Purpose:** Source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. Explains and gates work; does not implement runtime behavior.

**Contains:** 24 directories including codebase/, architecture/, research/, phases/, specs/, audits/.

**Key Files:**
- `.planning/ROADMAP.md` — Roadmap
- `.planning/REQUIREMENTS.md` — Requirements
- `.planning/PROJECT.md` — Project definition
- `.planning/STATE.md` — Current state
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority

**Why it exists:** Provides governance and planning artifacts that authorize and guide development work. Planning artifacts may document requirements but SHALL NOT claim runtime readiness from docs-only evidence.

---

### 3.16 `.hivefiver-meta-builder/` — Meta-Authoring Lab

**Purpose:** Lab environment for authoring primitives (agents, skills, commands) before reflection to `.opencode/`. Source-of-truth for all project primitives.

**Contains:** agents-lab/, skills-lab/, commands-lab/, references-lab/, workflows-lab/.

**Key Files:**
- `.hivefiver-meta-builder/AGENTS.md` — Meta-builder guidance
- `.hivefiver-meta-builder/agents-lab/active/` — Active agent definitions
- `.hivefiver-meta-builder/skills-lab/active/` — Active skill definitions
- `.hivefiver-meta-builder/commands-lab/active/` — Active command definitions
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — Skills refactor playbook

**Why it exists:** Provides a lab environment for authoring and testing primitives before they are reflected to `.opencode/`. Prevents direct mutation of shipped primitives.

---

### 3.17 `tests/` — Test Files

**Purpose:** Unit tests, integration tests, and tool-specific tests for all src/ modules.

**Contains:** ~204 test files organized to mirror src/ structure.

**Key Files:**
- `tests/lib/coordination/delegation/` — Delegation tests (14 files)
- `tests/lib/session-entry/` — Session entry tests (4 files)
- `tests/lib/runtime-pressure/` — Runtime pressure tests (5 files)
- `tests/lib/doc-intelligence/` — Doc intelligence tests (3 files)
- `tests/plugin/bootstrap-tools-registration.test.ts` — Bootstrap registration test

**Why it exists:** Provides comprehensive test coverage for all modules. Tests use vitest globals and follow the project's TDD discipline.

---

### 3.18 `bin/` — CLI Entrypoint

**Purpose:** CLI entrypoint and validation scripts.

**Contains:** 4 files.

**Key Files:**
- `bin/hivemind.cjs` — Main CLI entrypoint (CommonJS wrapper)
- `bin/validate-agent-config.sh` — Agent config validation script
- `bin/validate-load-order.sh` — Load order validation script
- `bin/validate-runtime-paths.sh` — Runtime path validation script

**Why it exists:** Provides the CLI entrypoint for `npx hivemind` commands and validation scripts for runtime checks.

---

### 3.19 `scripts/` — Build Scripts

**Purpose:** Build and asset management scripts.

**Contains:** 2 files.

**Key Files:**
- `scripts/sync-assets.js` — Asset sync script (primitives reflection from .hivefiver-meta-builder/ to .opencode/)
- `scripts/transform-gsd-to-hm.js` — GSD-to-HM transformation script

**Why it exists:** Manages the build pipeline, including syncing primitives from the meta-builder lab to the .opencode/ directory.

---

### 3.20 `assets/` — Bootstrap Assets

**Purpose:** Bootstrap assets used during project initialization and primitive installation.

**Contains:** 7 directories (.hivemind/, agents/, commands/, references/, skills/, templates/, workflows/).

**Key Files:**
- `assets/.hivemind/` — Hivemind bootstrap assets
- `assets/agents/` — Agent template assets
- `assets/skills/` — Skill template assets

**Why it exists:** Provides template assets for bootstrapping new projects and installing primitives. Used by the bootstrap-init tool.

---

## 4. Naming Conventions

### 4.1 Source Files
- **Kebab-case** for multi-word files: `delegate-task.ts`, `session-tracker.ts`, `atomic-write.ts`
- **Index files** for module entrypoints: `index.ts`
- **Schema files** suffixed: `*.schema.ts` (e.g., `hivemind-configs.schema.ts`)
- **Type files** named: `types.ts`
- **Test files** suffixed: `*.test.ts` (e.g., `delegation-manager.test.ts`)

### 4.2 Directories
- **Kebab-case** for all directories: `task-management/`, `command-delegation/`, `session-tracker/`
- **Nested by concern**: `features/session-tracker/persistence/`, `coordination/delegation/`
- **Gitkeep registration**: Empty directories include `.gitkeep` for git tracking

### 4.3 Agents (`.opencode/agents/`)
- **Prefix lineage**: `hm-*` (harness module), `hf-*` (framework), `gsd-*` (dev tooling, not shipped)
- **Kebab-case** after prefix: `hm-codebase-mapper.ts`, `hf-l2-skill-builder.md`
- **Level indicators**: `hm-l0-orchestrator.md`, `hf-l1-coordinator.md`, `hf-l2-agent-builder.md`
- **Frontmatter required**: name, description, mode, temperature, steps, color, permission, reasoningEffort, depth, lineage, domain

### 4.4 Skills (`.opencode/skills/`)
- **Prefix lineage**: `hf-l2-*` (meta-builder), `gate-l3-*` (quality gate), `stack-l3-*` (stack reference), `hivemind-*` (governance)
- **Unprefixed** for orchestration patterns: `completion-detection/`, `iterative-loop/`, `wave-execution/`
- **Directory structure**: `SKILL.md` + `references/` folder
- **Frontmatter required**: name, description, version, lineage, load_priority, consumed-by, allowed-tools

### 4.5 Commands (`.opencode/commands/`)
- **Kebab-case**: `start-work.md`, `deep-research-synthesis-repomix.md`
- **Prefix groups**: `hm-*` (harness), `hf-*` (framework), `test-*` (test)
- **YAML frontmatter** with command definition

### 4.6 Schema Files
- **Suffix pattern**: `*.schema.ts` (e.g., `agent-frontmatter.schema.ts`)
- **Barrel export**: `src/schema-kernel/index.ts` re-exports all schemas

### 4.7 Test Files
- **Mirror source structure**: `tests/lib/coordination/delegation/manager-decomposition.test.ts` mirrors `src/coordination/delegation/manager.ts`
- **Suffix pattern**: `*.test.ts`
- **Vitest globals**: No imports needed for `describe`, `it`, `expect`

---

## 5. Where to Add New Code

### 5.1 Adding a New Tool

**Location:** `src/tools/<domain>/`

**Template:**
```
src/tools/<domain>/<tool-name>/
├── index.ts          # Tool factory (createXxxTool function)
├── types.ts          # Tool-specific types (optional)
└── tools.ts          # Tool implementation (optional, for complex tools)
```

**Steps:**
1. Create directory under `src/tools/<domain>/`
2. Implement tool factory function following `tool()` pattern from `@opencode-ai/plugin/tool`
3. Register in `src/plugin.ts` (add import + tool registration)
4. Add Zod schema in `src/schema-kernel/<tool-name>.schema.ts`
5. Write tests in `tests/tools/<domain>/<tool-name>.test.ts`

**Example:** `src/tools/delegation/delegate-task.ts`

---

### 5.2 Adding a New Hook

**Location:** `src/hooks/<type>/`

**Template:**
```
src/hooks/<type>/<hook-name>.ts
```

**Steps:**
1. Create file under `src/hooks/<type>/` (guards/, observers/, transforms/, lifecycle/)
2. Implement hook factory function
3. Register in `src/plugin.ts` (add import + hook wiring)
4. Classify hook effect in `src/hooks/composition/cqrs-boundary.ts`
5. Write tests in `tests/hooks/<type>/<hook-name>.test.ts`

**CQRS Rule:** Hooks are read-side only. They observe events and route to write-side consumers. They MUST NOT perform durable writes.

**Example:** `src/hooks/observers/event-observers.ts`

---

### 5.3 Adding a New Feature

**Location:** `src/features/<feature-name>/`

**Template:**
```
src/features/<feature-name>/
├── index.ts          # Feature barrel (re-exports)
├── types.ts          # Feature-specific types
├── <implementation>  # Feature implementation files
└── .gitkeep          # Directory registration
```

**Steps:**
1. Create directory under `src/features/`
2. Implement feature with types, implementation, and barrel
3. Register in `src/plugin.ts` if it needs plugin wiring
4. Export from `src/index.ts` if it's part of the public API
5. Write tests in `tests/lib/features/<feature-name>/`

**Example:** `src/features/session-tracker/`

---

### 5.4 Adding a New Agent

**Location:** `.opencode/agents/`

**Template:**
```markdown
---
name: <lineage>-<name>
description: "<description>"
mode: primary
temperature: 0.3
steps: 100
color: "#3B82F6"
permission:
  read: deny
  edit: deny
  write: deny
  bash:
    "*": deny
    "git *": allow
  glob: allow
  grep: allow
  task:
    "*": ask
reasoningEffort: high
depth: <L0|L1|L2|L3>
lineage: <hm|hf|gate|stack>
domain: <domain>
---

# <Agent Name>

<Agent instructions>
```

**Steps:**
1. Create `.opencode/agents/<lineage>-<name>.md`
2. Follow naming conventions (hm-*, hf-*, gate-*, stack-*)
3. Set appropriate permissions, depth, lineage
4. Author in `.hivefiver-meta-builder/agents-lab/active/` first
5. Reflect to `.opencode/agents/` via sync

**Example:** `.opencode/agents/hm-l0-orchestrator.md`

---

### 5.5 Adding a New Skill

**Location:** `.opencode/skills/<skill-name>/`

**Template:**
```
.opencode/skills/<skill-name>/
├── SKILL.md          # Skill definition with frontmatter
└── references/       # Reference materials
    └── summary.md    # Skill summary
```

**SKILL.md Frontmatter:**
```yaml
---
name: <lineage>-<name>
description: "<description>"
version: 1.0.0
lineage: <hf-l2|gate-l3|stack-l3|hivemind>
load_priority: <1-10>
consumed-by:
  - <agent-types>
allowed-tools:
  - <tool-names>
---
```

**Steps:**
1. Create directory under `.opencode/skills/`
2. Write SKILL.md with proper frontmatter
3. Add references/ directory with summary.md
4. Author in `.hivefiver-meta-builder/skills-lab/active/` first
5. Reflect to `.opencode/skills/` via sync

**Example:** `.opencode/skills/hivemind-power-on/`

---

### 5.6 Adding a New Command

**Location:** `.opencode/commands/`

**Template:**
```markdown
---
name: <lineage>-<name>
description: "<description>"
---

# <Command Name>

<Command instructions with $ARGUMENTS support>
```

**Steps:**
1. Create `.opencode/commands/<lineage>-<name>.md`
2. Follow naming conventions (hm-*, hf-*, test-*)
3. Add YAML frontmatter with command definition
4. Author in `.hivefiver-meta-builder/commands-lab/active/` first
5. Reflect to `.opencode/commands/` via sync

**Example:** `.opencode/commands/start-work.md`

---

### 5.7 Adding a New Schema

**Location:** `src/schema-kernel/`

**Template:**
```typescript
import { z } from "zod"

export const <Name>Schema = z.object({
  // schema definition
})

export type <Name> = z.infer<typeof <Name>Schema>

export const <Name>InputSchema = z.object({
  // input schema definition
})

export type <Name>SchemaInput = z.input<typeof <Name>InputSchema>
```

**Steps:**
1. Create `src/schema-kernel/<name>.schema.ts`
2. Export from `src/schema-kernel/index.ts`
3. Use `validateWithFallback` for strict-first validation
4. Write tests in `tests/schema-kernel/<name>.test.ts`

**Example:** `src/schema-kernel/hivemind-configs.schema.ts`

---

### 5.8 Adding a New Test

**Location:** `tests/lib/<module>/` or `tests/tools/<domain>/`

**Template:**
```typescript
import { describe, it, expect } from "vitest"

describe("<Module Name>", () => {
  describe("<function/class name>", () => {
    it("should <expected behavior>", () => {
      // arrange
      // act
      // assert
    })
  })
})
```

**Steps:**
1. Mirror source structure in tests/
2. Use vitest globals (no imports needed for describe, it, expect)
3. Follow TDD discipline (red-green-refactor)
4. Aim for 80%+ coverage

**Example:** `tests/lib/coordination/delegation/manager-decomposition.test.ts`

---

## 6. Special Directories

### 6.1 `dist/`
**Purpose:** Compiled TypeScript output (gitignored). Generated by `npm run build`.
**Contains:** Compiled .js files, .d.ts declarations, source maps.
**Usage:** Referenced by `package.json` exports and `.opencode/plugins/harness-control-plane.ts`.

### 6.2 `node_modules/`
**Purpose:** Installed npm dependencies. Managed by `npm install`.
**Contains:** All project dependencies and their transitive dependencies.
**Usage:** Runtime dependencies for the project.

### 6.3 `coverage/`
**Purpose:** Test coverage reports. Generated by `npm run test:coverage`.
**Contains:** V8 coverage reports for src/**/*.ts.
**Usage:** Coverage analysis and quality gates.

### 6.4 `.hivefiver-meta-builder/`
**Purpose:** Meta-authoring lab — source-of-truth for all project primitives (agents, skills, commands).
**Contains:** agents-lab/, skills-lab/, commands-lab/, references-lab/, workflows-lab/.
**Usage:** Author primitives here, then reflect to `.opencode/` via sync. Prevents direct mutation of shipped primitives.

### 6.5 `.hivemind/session-tracker/`
**Purpose:** Per-session knowledge files. Each session gets a directory with .md and .json files.
**Contains:** Session directories (ses_*/), project-continuity.json.
**Usage:** SessionTracker writes here. Provides session knowledge for recovery and context.

### 6.6 `.hivemind/state/`
**Purpose:** Runtime state files (Q6 canonical). Durable persistence for all internal state.
**Contains:** session-continuity.json, delegations.json, trajectory-ledger.json, agent-work-contracts.json, config-workflows.json, version.json.
**Usage:** Continuity store and delegation persistence write here. Canonical per Q6 decision.

### 6.7 `.planning/phases/`
**Purpose:** Phase artifacts — one directory per development phase.
**Contains:** 86 phase directories (BOOT-01 through 38, CP-*, SR-*, MCM-*).
**Usage:** Each phase has its own PLAN.md, SPEC.md, and verification artifacts.

### 6.8 `.planning/codebase/`
**Purpose:** Codebase intelligence files — STRUCTURE.md, ARCHITECTURE.md, CONVENTIONS.md, STACK.md, CONCERNS.md.
**Contains:** 7 intelligence files.
**Usage:** Provides codebase context for planning and development.

---

## 7. File Counts Summary

| Area | Files | Description |
|------|-------|-------------|
| `src/` | ~228 | TypeScript source files |
| `tests/` | ~204 | Test files |
| `.opencode/agents/` | 42 | Agent definitions |
| `.opencode/commands/` | 137 | Slash commands |
| `.opencode/skills/` | 34 | Skill packages |
| `.opencode/workflows/` | 106 | Workflow definitions |
| `.planning/phases/` | 86 | Phase directories |
| `.hivemind/session-tracker/` | ~30 | Session directories |

---

## 8. Key Architectural Patterns

### 8.1 CQRS Boundary
- **Read-side:** Hooks observe events, extract facts, route to consumers
- **Write-side:** Tools perform actions, features own persistence
- **Rule:** Hooks MUST NOT perform durable writes (enforced by `cqrs-boundary.ts`)

### 8.2 Feature Isolation
- Each feature in `src/features/` is self-contained
- Features own their types, persistence, and business logic
- Features are independently testable and composable

### 8.3 Leaf Module Pattern
- `src/shared/types.ts`, `src/shared/helpers.ts` are leaf modules
- `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` are near-leaf
- No circular dependencies enforced by TypeScript compilation

### 8.4 Max Module Size
- 500 LOC per file (architectural rule)
- Large modules split into focused sub-modules (e.g., `manager.ts` → `manager.ts` + `manager-runtime.ts`)

### 8.5 Delegation Hierarchy
- L0: Orchestrator (front-facing, never executes)
- L1: Coordinator (delegates to L2/L3)
- L2: Specialist (implements tasks)
- L3: Quality gates (lifecycle → spec → evidence)
