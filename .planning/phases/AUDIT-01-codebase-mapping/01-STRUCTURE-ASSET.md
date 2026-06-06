# Codebase Structure

**Analysis Date:** 2026-06-06

## Directory Layout

```
hivemind-plugin-private/
├── src/                            # Hard Harness — TypeScript runtime (npm package)
│   ├── plugin.ts                   # Composition root (HarnessControlPlane: Plugin)
│   ├── index.ts                    # Public API re-exports
│   ├── shared/                     # Leaf utilities, SDK wrappers, runtime policy, types
│   ├── task-management/            # Continuity, journal, lifecycle, trajectory
│   ├── coordination/               # Delegation, completion, concurrency, spawner, command/sdk handlers
│   ├── features/                   # Standalone runtime features (16+ submodules)
│   ├── config/                     # Config subscriber, compiler, workflow
│   ├── routing/                    # Behavioral profile, command engine, session entry
│   ├── hooks/                      # Lifecycle, guards, observers, transforms, composition, pane-monitor
│   ├── tools/                      # Write-side LLM-callable tools (26 tools)
│   ├── schema-kernel/              # Zod schemas (19 schemas) + JSON schema generator
│   ├── cli/                        # CLI substrate (runCli) + help/init/doctor/recover/version
│   └── sidecar/                    # HTTP server factory, route catalog, SSE pool, JSON-render catalog
│
├── tests/                          # Vitest test suite (mirrors src/ structure)
│
├── bin/                            # CLI entrypoints (hivemind.cjs shim, validate scripts)
│
├── scripts/                        # Build helpers (sync-assets.js, sync-oss.sh, generate-registry.cjs)
│
├── assets/                         # OpenCode primitives SOURCE OF TRUTH (agents, commands, skills, workflows)
│
├── .opencode/                      # DEPLOYED copy of .opencode/ primitives (sync via scripts/sync-assets.js)
│   ├── agents/                     # 119 agents (33 gsd-* + 63 hm-* + 22 hf-*)
│   ├── commands/                   # 249 commands
│   ├── command/                    # Plural copy (legacy compat)
│   ├── skills/                     # 82 skills (36 hm-* + 13 hf-* + 6 stack-* + 3 gate-* + 2 hivemind-* + others)
│   ├── workflows/                  # 209 workflows
│   ├── references/                 # 139 reference docs
│   ├── templates/                  # Templates (including .opencode/gsd-core/templates/codebase/)
│   ├── hooks/                      # OpenCode runtime hooks
│   ├── plugins/                    # OpenCode plugin loaders
│   ├── rules/                      # Universal rules (universal-rules.md)
│   ├── get-shit-done/              # Legacy GSD location (preserved during migration)
│   ├── gsd-core/                   # NEW canonical GSD location (VERSION 1.3.1)
│   ├── gsd-file-manifest.json      # Pristine GSD manifest
│   ├── gsd-migration-journal/      # Migration state + rollback snapshots
│   ├── gsd-local-patches/          # Local GSD patches
│   └── gsd-install-state.json      # GSD install tracking
│
├── .hivemind/                      # Internal deep-module state (canonical per Q6)
│   ├── state/                      # configs.json, sidecar-port.json, tmux-port.json, trajectory-ledger.json
│   ├── session-tracker/            # Per-session knowledge capture (markdown + JSON indexes)
│   ├── journal/                    # Append-only event timeline (time-machine)
│   ├── planning/                   # Persistent planning artifacts
│   ├── research/                   # Research artifacts
│   ├── governance/                 # Governance evaluation state
│   ├── audit/                      # Audit records
│   ├── manifests/                  # Session manifests
│   └── registries/                 # Primitive registries
│
├── .hivemind-meta-builder/         # Authoring lab for primitives before reflection to .opencode/
│
├── .planning/                      # Governance: ROADMAP, STATE, REQUIREMENTS, phases, codebase maps
│   ├── codebase/                   # THIS directory — STACK/ARCHITECTURE/STRUCTURE/etc. maps
│   ├── research/                   # Research artifacts
│   ├── architecture/               # Source-plane, runtime-identity, sector-agents architecture
│   ├── phases/                     # Per-phase artifacts (SPEC, CONTEXT, RESEARCH, PATTERNS, PLAN, etc.)
│   ├── ROADMAP.md / STATE.md / REQUIREMENTS.md
│   └── AGENTS.md                   # Planning governance
│
├── docs/                           # Project documentation
├── eval/                           # Eval test suite (vitest glob includes)
├── sidecar/                        # Sidecar Next.js dashboard (read-only)
│
├── package.json                    # npm manifest (hivemind-3.0, dual export: ./plugin and ./cli)
├── tsconfig.json                   # ES2022 / NodeNext / strict / verbatimModuleSyntax
├── vitest.config.ts                # Coverage thresholds: 75/62/80/77 (statements/branches/functions/lines)
├── opencode.json                   # OpenCode config (references AGENTS.md)
├── AGENTS.md                       # Universal constitution (SOURCE vs DEPLOY, two-halves, line, Atomic Commits)
└── README.md / CHANGELOG.md / CONTRIBUTING.md
```

## Directory Purposes

**`src/`:**
- Purpose: Hard Harness — the TypeScript runtime that ships as the `hivemind` npm package. All real code lives here.
- Contains: 294 .ts files across 15 top-level subdirectories. Compiled to `dist/` via `tsc` (ES2022 → NodeNext).
- Key files: `src/plugin.ts` (composition root, 1076 LOC), `src/index.ts` (public API barrel), `src/shared/types.ts` (leaf contract authority).
- Subdirectories:
  - `src/shared/` — leaf utilities and SDK wrappers
  - `src/coordination/` — delegation, completion, concurrency
  - `src/task-management/` — continuity, journal, lifecycle, trajectory
  - `src/tools/` — write-side LLM tools
  - `src/hooks/` — read-side SDK event observers
  - `src/features/` — standalone runtime features (16 submodules)
  - `src/routing/` — command engine, behavioral profile, session entry
  - `src/config/` — config subscriber, workflow persistence
  - `src/schema-kernel/` — Zod schemas
  - `src/cli/` — CLI substrate
  - `src/sidecar/` — HTTP sidecar server

**`src/shared/`:**
- Purpose: Leaf-like utilities. Avoid adding deep runtime imports here without a source-backed decision.
- Contains: `types.ts` (TaskStatus, PendingNotification, SessionStats, DelegationMeta, etc.), `helpers.ts` (`asString`, `getNestedValue`, `isObject`, `makeToolSignature`, deepMerge), `state.ts` (`TaskStateManager` singleton), `session-api.ts` (typed `client.session.*` wrappers), `runtime.ts`, `runtime-policy.ts`, `workspace-runtime-policy.ts`, `session-naming.ts`, `task-status.ts`, `tool-helpers.ts` (`renderToolResult`), `tool-response.ts` (standard envelope), `plugin-tool-output-summary.ts`, `app-api.ts`, `errors/commands.ts`, `security/path-scope.ts`, `security/redaction.ts`.
- Key files: `src/shared/types.ts` is the canonical type contract.

**`src/coordination/`:**
- Purpose: Delegation semantics — concurrency, lifecycle, completion, notification, monitor, spawner.
- Contains:
  - `delegation/` — manager facade + manager-runtime + coordinator + dispatcher + lifecycle + monitor + state-machine + agent-resolver + slot-manager + notification-router + periodic-notifier + escalation-timer + retry-handler + resume-resolver + session-intelligence + sdk-child-session-starter + survival-kit + completion-detector + notification-formatter + types + pool-types (20 modules).
  - `concurrency/queue.ts` — `DelegationConcurrencyQueue` (per-model/per-agent lanes).
  - `completion/detector.ts` + `notification-handler.ts` — dual-signal WaiterModel.
  - `command-delegation/handler.ts` — command-routed delegation.
  - `sdk-delegation/handler.ts` — SDK-routed delegation.
  - `spawner/` — `auto-loop.ts`, `ralph-loop.ts`, `session-creator.ts`, `spawn-request-builder.ts`, `parent-directory.ts`, `agent-primitive-policy.ts`, `spawner-types.ts`.
- Key files: `src/coordination/delegation/manager.ts` (facade), `manager-runtime.ts` (impl), `coordinator.ts`, `state-machine.ts`, `concurrency/queue.ts`, `completion/detector.ts`.

**`src/task-management/`:**
- Purpose: Persistence, event timeline, lifecycle state machine, phase trajectory.
- Contains:
  - `continuity/` — `index.ts` (public), `store-cache.ts`, `continuity-reader.ts`, `delegation-persistence.ts`.
  - `journal/` — `index.ts`, `query.ts`, `replay.ts`, `execution-lineage.ts` (append-only event timeline).
  - `lifecycle/index.ts` — `HarnessLifecycleManager` class.
  - `trajectory/` — `index.ts`, `ledger.ts`, `store-operations.ts`, `types.ts` (phase trajectory ledger).
- Key files: `src/task-management/lifecycle/index.ts` (lifecycle manager surface), `continuity/index.ts` (public continuity API), `trajectory/index.ts`.

**`src/tools/`:**
- Purpose: Write-side LLM-callable tools. Each subdirectory groups a domain; the file naming matches the tool name.
- Contains:
  - `delegation/` — `delegate-task.ts`, `delegation-status.ts`, `readers/`, `types.ts`.
  - `session/` — `execute-slash-command.ts`, `session-journal-export.ts`, `session-tracker.ts`, `session-hierarchy.ts`, `session-context.ts`, `session-delegation-query.ts`, `dispatch-command.ts`, `resolve-command.ts`, `validate-command.ts`, `semantic-agent-selector.ts`, `workflow-parser.ts`, `index.ts`, `session-patch/`, `session-resolver.ts`.
  - `hivemind/` — `hivemind-doc.ts`, `hivemind-trajectory.ts`, `hivemind-pressure.ts`, `hivemind-sdk-supervisor.ts`, `hivemind-command-engine.ts`, `hivemind-session-view.ts`, `hivemind-agent-work.ts`, `hivemind-steer.ts`, `run-background-command.ts`.
  - `config/` — `configure-primitive.ts`, `validate-restart.ts`, `bootstrap-init.ts`, `bootstrap-recover.ts`, `configure-primitive-paths.ts`.
  - `prompt/prompt-skim/` and `prompt/prompt-analyze/` — each has `index.ts`, `tools.ts`, `types.ts`.
  - Top-level standalone: `src/tools/tmux-copilot.ts`, `src/tools/tmux-state-query.ts`.
- Key files: `src/tools/delegation/delegate-task.ts` (primary delegation tool), `src/tools/session/execute-slash-command.ts` (slash command execution).

**`src/hooks/`:**
- Purpose: Read-side OpenCode SDK event observers. Each subdirectory groups a hook family; factories return the hook map.
- Contains:
  - `lifecycle/core-hooks.ts` — `event`, `system.transform` / `experimental.chat.system.transform`, `shell.env` (BOOT-09 note: `experimental.chat.system.transform` is the actual SDK name; both returned for backward compat).
  - `lifecycle/session-hooks.ts` — session read hooks.
  - `guards/tool-guard-hooks.ts` — `tool.execute.before` (governance evaluate, circuit breaker, budget, contract enforcement) + `tool.execute.after`.
  - `guards/governance-block.ts` — governance block injection for `system.transform`.
  - `observers/event-observers.ts` — event observer factories (delegation, session entry, session-is-main).
  - `observers/{delegation,session-entry,session-main,session-tracker}-consumer.ts` — observer pass-through wrappers.
  - `transforms/tool-before-guard.ts` — combined `tool.execute.before` (guard + session-tracker detection + contract enforcement).
  - `transforms/tool-after-composer.ts`, `tool-after-workflow.ts` — `tool.execute.after` pipeline.
  - `transforms/chat-message-capture.ts` — `chat.message` capture.
  - `transforms/contract-enforcement.ts` — third step in guard chain.
  - `composition/cqrs-boundary.ts` — `classifyHookEffect` (CQRS read/write classifier).
  - `pane-monitor.ts` — standalone pane-monitor hook for tmux.
  - `types.ts` — shared hook dependency types.
- Key files: `src/hooks/lifecycle/core-hooks.ts` (event → state router), `src/hooks/guards/tool-guard-hooks.ts` (governance + budget + circuit breaker), `src/hooks/composition/cqrs-boundary.ts` (CQRS classifier).

**`src/features/`:**
- Purpose: Standalone runtime features that don't fit the coordination/task-management spine. Each subdirectory is self-contained with `index.ts` and `types.ts`.
- Contains (16 submodules):
  - `bootstrap/` — `primitive-loader.ts`, `primitive-registry.ts`, `primitive-scanners.ts`, `framework-detector.ts`, `runtime-validator.ts`, `cross-primitive-validator.ts`, `structure.ts`, `control-plane/{index,gatekeeper,gate-decision}.ts`.
  - `session-tracker/` — `index.ts` (`SessionTracker` class + barrel), `bootstrap.ts`, `initialization.ts`, `child-recorder.ts`, `classification.ts`, `tool-delegation.ts`, `tool-delegation-utils.ts`, `project-continuity.ts`, `orphan-cleanup.ts`, `session-router.ts`, `types.ts`, plus subdirectories `capture/`, `hooks/`, `persistence/`, `recovery/`, `streaming/`, `transform/`.
  - `tmux/` — `integration.ts`, `multiplexer.ts`, `observers.ts`, `persistence.ts`, `session-manager.ts`, `types.ts`, `grid-planner.ts`.
  - `runtime-pressure/` — `index.ts`, `control-plane.ts`, `authority-matrix.ts`, `model.ts`, `types.ts`.
  - `agent-work-contracts/` — `index.ts`, `store.ts`, `bounds.ts`, `lifecycle.ts`, `operations.ts`, `types.ts`.
  - `governance-engine/` — `index.ts`, `config-reader.ts`, `create-governance-session.ts`, `evaluator.ts`.
  - `governance/persistence.ts`.
  - `auto-loop/` + `ralph-loop/` — `index.ts` + `types.ts` each.
  - `doc-intelligence/` — `index.ts`, `chunker.ts`, `parser.ts`, `router.ts`, `types.ts`.
  - `prompt-packet/` — `kernel-packet.ts`, `compaction-preservation.ts`.
  - `background-command/pty/` — `pty-manager.ts`, `pty-runtime.ts`, `pty-types.ts`, `pty-buffer.ts`, `bun-pty.d.ts`.
  - `sdk-supervisor/` — `index.ts`, `types.ts`.
  - `capability-gate/` — `index.ts`, `agent-capability-profiles.ts`, `types.ts`.
  - `tool-intelligence/` — `index.ts`, `types.ts`.
- Key files: `src/features/session-tracker/index.ts` (CQRS read-side owning module), `src/features/bootstrap/primitive-loader.ts` (loads agents/commands/skills from .opencode/), `src/features/tmux/integration.ts`, `src/features/agent-work-contracts/store.ts` (atomic contract persistence).

**`src/routing/`:**
- Purpose: Classify user intent and resolve routing decisions.
- Contains:
  - `behavioral-profile/` — `index.ts`, `profiles.ts`, `resolve-behavioral-profile.ts`, `types.ts`.
  - `command-engine/` — `index.ts`, `types.ts` (discover, analyze, transform, render_context, list_commands, transform_messages, route_preview).
  - `session-entry/` — `index.ts`, `intake-gate.ts`, `language-resolution.ts`, `profile-resolver.ts`, `purpose-classifier.ts`.
- Key files: `src/routing/command-engine/index.ts` (primitive discovery), `src/routing/session-entry/intake-gate.ts` (purpose classifier + language detection + profile resolution + registry validation).

**`src/config/`:**
- Purpose: Load, cache, compile, validate Hivemind configs.
- Contains: `subscriber.ts` (lazy-load + cache per project), `compiler.ts`, `defaults.ts`, `workflow/` (`index.ts`, `guards.ts`, `persistence.ts`, `state.ts`, `types.ts`).
- Key files: `src/config/subscriber.ts` (`getConfig`, `getFreshConfig`, `invalidateConfigCache`).

**`src/schema-kernel/`:**
- Purpose: Single source of truth for every Zod schema. Generates `.hivemind/configs.schema.json` at build.
- Contains: 19 schemas (hivemind-configs, agent-frontmatter, agent-work-contract, bootstrap, command-engine, command-frontmatter, commands, config-precedence, doc-intelligence, mcp-server, prompt-enhance, runtime-pressure, sdk-supervisor, session-delegation-query, session-tracker, session-view, skill-metadata, tool, trajectory) + `generate-config-json-schema.ts` + `index.ts` barrel.
- Key files: `src/schema-kernel/hivemind-configs.schema.ts` (HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"), `src/schema-kernel/index.ts` (barrel).

**`src/cli/`:**
- Purpose: CLI substrate. Independent of the OpenCode plugin runtime.
- Contains: `index.ts` (`runCli(argv)`), `router.ts`, `renderer.ts`, `discovery.ts`, `commands/{help,init,doctor,recover,version}.ts`, `ui/prompts.ts`.
- Key files: `src/cli/index.ts` (entry), `src/cli/commands/doctor.ts` (harness health check), `src/cli/commands/init.ts` (bootstrap), `src/cli/commands/recover.ts` (state recovery).

**`src/sidecar/`:**
- Purpose: Lightweight HTTP server on `127.0.0.1:0` (random OS-assigned port) for the Next.js dashboard. Read-only state + tool proxy + SSE + WS delegation.
- Contains: `server/factory.ts` (createSidecarServer), `server/handler.ts` (SidecarRouter), `server/registry.ts` (SidecarDependencyRegistry), `server/cache.ts`, `server/routes/{state,sessions,tools,events,catalog,types}.ts`, `server/sse/pool.ts`, `server/ws/{pool,delegation,types.d}.ts`, `server/tool-proxy/{router,handlers}/`, `catalog/{tool,json-render}-catalog.{json,ts}`, `readonly-state.ts`, `readonly-state-extensions.ts`, `types.ts`.
- Key files: `src/sidecar/server/factory.ts`, `src/sidecar/server/registry.ts`.

**`tests/`:**
- Purpose: Vitest test suite. Mirrors `src/` module structure; uses vitest globals (no imports needed for `describe`/`it`/`expect`).
- Contains: `lib/` (legacy grouping for moved runtime modules), `tools/`, `cli/`, `coordination/`, `features/`, `fixtures/`, `hooks/`, `integration/`, `kernel/`, `plugin/`, `plugins/`, `schema-kernel/`, `scripts/`, `shared/`, `sidecar/`, `smoke/`, `task-management/`, plus `CP-ST-03-01-excision.test.ts` at the root.
- Setup: `vitest.setup.ts` at repo root; config in `vitest.config.ts`.
- Coverage: 75/62/80/77 (statements/branches/functions/lines) per `vitest.config.ts`; coverage excludes `src/index.ts` and `src/**/index.ts` (barrel files).

**`bin/`:**
- Purpose: Executable entrypoints.
- Contains: `hivemind.cjs` (CommonJS shim → `dist/cli/index.js`), `validate-agent-config.sh`, `validate-load-order.sh`, `validate-runtime-paths.sh`.

**`scripts/`:**
- Purpose: Build helpers.
- Contains: `sync-assets.js` (mirrors `assets/` → `.opencode/`), `sync-oss.sh`, `generate-registry.cjs`, `transform-gsd-to-hm.js`, `verify-sr11.sh`.

**`assets/`:**
- Purpose: SOURCE OF TRUTH for OpenCode primitives. Edited here, synced to `.opencode/` via `node scripts/sync-assets.js`.
- Contains: Subdirectories for `agent-instructions`, `agents`, `commands`, `references`, `rules`, `skills`, `templates`, `workflows` (all shipped with the npm package per `package.json` `files`).

**`.opencode/`:**
- Purpose: Deployed copy of OpenCode primitives (skills, agents, commands, rules, permissions). NEVER develop directly here. NEVER store runtime state here. NEVER store build artifacts here.
- Contains: All shipped primitives + GSD framework + universal rules + plugin loaders.
- Key subdirectories: `agents/`, `commands/`, `command/` (legacy plural copy), `skills/`, `workflows/`, `references/`, `templates/`, `hooks/`, `plugins/`, `rules/`, `gsd-core/` (canonical GSD location, VERSION 1.3.1), `get-shit-done/` (legacy GSD location, preserved during migration), `gsd-migration-journal/` (rollback snapshots), `gsd-local-patches/`, `gsd-file-manifest.json`, `gsd-install-state.json`.

**`.hivemind/`:**
- Purpose: Internal deep-module state (canonical per Q6). Journals, lineage, runtime state, planning persistence. NEVER mix with `.opencode/`.
- Contains:
  - `state/` — `configs.json`, `configs.schema.json`, `sidecar-port.json`, `tmux-port.json`, `tmux-sessions/`, `trajectory-ledger.json`, `version.json`, `agent-work-contracts.json`, `governance-state.json`, `delegations.json` (legacy, migrated per P41-D).
  - `session-tracker/` — per-session knowledge capture. Each session directory: `{sessionID}.md` (YAML frontmatter) + sibling JSON files for child records, hierarchy index, manifest, quarantine.
  - `journal/` — append-only event timeline (time-machine). Per-session subdirectory: `*.jsonl` or JSON events.
  - `planning/`, `research/`, `governance/`, `audit/`, `manifests/`, `registries/`, `runtime/`, `delegation/`, `lineage/`, `daily-notes/`, `onboarding/`, `poor-prompts/`, `uat/`, `hf-brain/`, `hm-brain/`, `task-managements/`, `delegation-managements/`, `artifacts/`, `audits/`, `scripts/`, `sidecar/`, `state/.hivemind/`.
  - `STACKS-REFERENCES.md` — version-pinned stack references.
  - `AGENTS.md` — runtime-context-aware governance for `.hivemind/`.

**`.hivefiver-meta-builder/`:**
- Purpose: Authoring lab for primitives (agents, skills, commands) before reflection to `.opencode/`. The `.hivefiver-meta-builder/agents-lab/active/refactoring/` and `.hivefiver-meta-builder/skills-lab/active/refactoring/` directories are the SOURCE OF TRUTH for all `hm-*`, `hf-*`, and `gate-*` primitives.
- Contains: `agents-lab/`, `skills-lab/`, `commands-lab/` with `active/refactoring/` and `.archive-refactoring-skills/.archive/` subdirectories.

**`.planning/`:**
- Purpose: Governance — roadmap, state, requirements, phases, codebase maps. NEVER contains runtime code.
- Contains: `codebase/` (this directory), `research/`, `architecture/`, `phases/`, `ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md`, `AGENTS.md`.

## Key File Locations

**Entry Points:**
- `src/plugin.ts` — Plugin composition root (`HarnessControlPlane: Plugin`, 1076 LOC, wires all surfaces)
- `src/index.ts` — Public API barrel
- `bin/hivemind.cjs` — CommonJS CLI shim → `dist/cli/index.js` → `runCli(argv)`
- `.opencode/plugins/harness-control-plane.ts` — OpenCode plugin loader (thin wrapper re-exporting `dist/plugin.js`)

**Configuration:**
- `package.json` — npm manifest (name `hivemind-3.0`, version `0.1.0`, dual export `./plugin` and `./cli`, peer dependency `@opencode-ai/plugin ^1.16.2`, optional `bun-pty` and `@json-render/*` for PTY and dashboard)
- `tsconfig.json` — ES2022 / NodeNext / `strict: true` / `verbatimModuleSyntax: true` / `noUnusedLocals` / `noUnusedParameters` / `noImplicitReturns`
- `vitest.config.ts` — Vitest config (globals on, coverage `v8`, thresholds 75/62/80/77)
- `vitest.setup.ts` — Test setup
- `opencode.json` — OpenCode config (references `AGENTS.md` as instructions)
- `.opencode/opencode.json` — OpenCode config inside .opencode
- `.opencode/gsd-core/VERSION` — GSD version (`1.3.1`)
- `.opencode/gsd-file-manifest.json` — Pristine GSD manifest (pristine = not modified)

**Core Logic:**
- `src/coordination/delegation/manager.ts` — `DelegationManager` facade
- `src/coordination/delegation/manager-runtime.ts` — `RuntimeDelegationManager` implementation
- `src/coordination/delegation/coordinator.ts` — `DelegationCoordinator` (orchestrates dispatcher, monitor, lifecycle, detector, periodicNotifier)
- `src/coordination/delegation/dispatcher.ts` — `DelegationDispatcher.preflightCheck` (depth, concurrency, agent)
- `src/coordination/delegation/state-machine.ts` — `DelegationStateMachine` (transitions, timers)
- `src/coordination/delegation/lifecycle.ts` — `DelegationLifecycle` (getStatus, markTerminal)
- `src/coordination/delegation/monitor.ts` — `DelegationMonitor` (progress, escalation, deadline)
- `src/coordination/concurrency/queue.ts` — `DelegationConcurrencyQueue` (per-lane acquire/release)
- `src/coordination/completion/detector.ts` — `CompletionDetector` (dual-signal WaiterModel)
- `src/coordination/completion/notification-handler.ts` — terminal notification dispatch
- `src/coordination/spawner/auto-loop.ts` + `ralph-loop.ts` — autonomous loops
- `src/shared/state.ts` — `TaskStateManager` singleton
- `src/shared/session-api.ts` — typed `client.session.*` wrappers
- `src/shared/runtime-policy.ts` + `workspace-runtime-policy.ts` — runtime policy resolution
- `src/shared/types.ts` — leaf type contracts (TaskStatus, PendingNotification, DelegationMeta, etc.)

**Tools (26 total):**
- Delegation domain: `src/tools/delegation/{delegate-task,delegation-status}.ts`, `src/tools/hivemind/run-background-command.ts`
- Session domain: `src/tools/session/{execute-slash-command,session-patch,session-journal-export,session-tracker,session-hierarchy,session-context,session-delegation-query,create-governance-session}.ts`, `src/features/governance-engine/create-governance-session.ts`
- Hivemind domain: `src/tools/hivemind/{hivemind-doc,hivemind-trajectory,hivemind-pressure,hivemind-sdk-supervisor,hivemind-command-engine,hivemind-session-view,hivemind-agent-work,hivemind-steer}.ts`
- Config domain: `src/tools/config/{configure-primitive,validate-restart,bootstrap-init,bootstrap-recover}.ts`, `src/tools/prompt/{prompt-skim,prompt-analyze}/tools.ts`
- Pre-constructed: `src/tools/tmux-copilot.ts`, `src/tools/tmux-state-query.ts`

**Hooks (registered in `src/plugin.ts:907-1025`):**
- `src/hooks/lifecycle/core-hooks.ts` — `event`, `system.transform` / `experimental.chat.system.transform`, `shell.env`
- `src/hooks/lifecycle/session-hooks.ts` — session read hooks
- `src/hooks/guards/tool-guard-hooks.ts` — governance + circuit breaker + budget
- `src/hooks/composition/cqrs-boundary.ts` — CQRS classifier
- `src/hooks/pane-monitor.ts` — tmux pane capture
- `src/hooks/observers/event-observers.ts` — delegation/session-entry/session-is-main observers
- `src/hooks/observers/{delegation,session-entry,session-main,session-tracker}-consumer.ts` — observer pass-through wrappers
- `src/hooks/transforms/tool-before-guard.ts` — combined `tool.execute.before`
- `src/hooks/transforms/tool-after-composer.ts` + `tool-after-workflow.ts` — `tool.execute.after` pipeline
- `src/hooks/transforms/chat-message-capture.ts` — `chat.message` capture
- `src/hooks/transforms/contract-enforcement.ts` — third step in guard chain

**Persistence / State (CQRS write side):**
- `src/features/session-tracker/index.ts` — `SessionTracker` class (CQRS read-side owning module)
- `src/features/session-tracker/persistence/{session-writer,child-writer,session-index-writer,project-index-writer,hierarchy-index,hierarchy-manifest,atomic-write,retry-queue,orphan-quarantine,pending-dispatch-registry}.ts`
- `src/features/agent-work-contracts/store.ts` — atomic contract persistence (`tmpFile.${pid}.${uuid}.tmp` then `renameSync`)
- `src/task-management/continuity/{index,store-cache,continuity-reader,delegation-persistence}.ts`
- `src/task-management/journal/{index,query,replay,execution-lineage}.ts`
- `src/task-management/trajectory/{index,ledger,store-operations,types}.ts`
- `src/config/workflow/{index,workflow-guards,workflow-persistence,workflow-state,workflow-types}.ts`

**Testing:**
- `tests/lib/` — legacy grouping for moved runtime modules
- `tests/tools/` — tool-focused unit tests
- `tests/cli/`, `tests/coordination/`, `tests/features/`, `tests/hooks/`, `tests/integration/`, `tests/kernel/`, `tests/plugin/`, `tests/schema-kernel/`, `tests/sidecar/`, `tests/smoke/`, `tests/task-management/`, `tests/shared/` — domain-specific test suites
- `tests/fixtures/` — test fixtures
- `tests/scripts/` — test infrastructure
- `eval/` — eval test suite (also picked up by vitest glob)

**Documentation:**
- `README.md` — project README
- `CHANGELOG.md` — release notes
- `CONTRIBUTING.md` — contributor guide
- `LICENSE` — MIT
- `AGENTS.md` — universal constitution (SOURCE vs DEPLOY, two-halves, line, atomic commits, TDD discipline)
- `SoT-POLICY.md` — source-of-truth policy
- `TMUX-QUICKSTART.md` — tmux integration quickstart
- `TUI-TEST-GUIDE.md` — TUI test guide
- `docs/` — additional docs (architecture, draft, etc.)
- `.opencode/rules/universal-rules.md` — universal rules (binding for multi-agent orchestration)
- `.planning/AGENTS.md` — planning governance
- `.hivemind/STACKS-REFERENCES.md` — version-pinned stack references
- `.opencode/gsd-core/references/` + `.opencode/get-shit-done/references/` — GSD reference docs
- `.hivemind/AGENTS.md` — runtime-context-aware governance for `.hivemind/`

## Naming Conventions

**Files:**
- `kebab-case.ts` — module files (e.g., `delegate-task.ts`, `session-api.ts`, `tool-guard-hooks.ts`)
- `PascalCase.ts` — uncommon, but types-only modules sometimes use this
- `UPPERCASE.md` / `UPPERCASE.json` — important project files (README, CHANGELOG, AGENTS, LICENSE, ARCHITECTURE, STRUCTURE, STACK, INTEGRATIONS, TESTING, CONVENTIONS, CONCERNS)
- `camelCase.ts` — variable-only or script files (e.g., `sync-assets.js`, `generate-registry.cjs`, `validate-agent-config.sh`)
- `kebab-case.md` — agent/skill/command definitions, documentation files
- `index.ts` — directory barrel re-export
- `types.ts` — type-only module (paired with implementation in same directory)

**Directories:**
- `kebab-case/` — all directories (e.g., `task-management/`, `session-tracker/`, `background-command/`)
- Plural for collections: `tools/`, `hooks/`, `features/`, `agents/`, `commands/`, `skills/`, `workflows/`, `references/`
- Singular for abstractions: `shared/`, `coordination/`, `routing/`, `config/`, `schema-kernel/`, `sidecar/`, `cli/`

**Agents / Skills / Commands (lineage prefix):**
- `hm-*` — Hivemind product agents/skills (31 agents, 36 skills). The `hm-l2-*` prefix indicates L2 specialist; `hm-l3-*` is archived.
- `hf-*` — Hivemind meta-builder agents/skills (22 agents, 13 skills). The `hf-l0-orchestrator`, `hf-coordinator`, `hf-agent-builder`, etc.
- `gate-*` — internal quality gate triad (3 skills: `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance`). THIS PROJECT ONLY, not shipped.
- `stack-*` — reference skills (6: `stack-bun-pty`, `stack-json-render`, `stack-nextjs`, `stack-opencode`, `stack-vitest`, `stack-zod`).
- `hivemind-*` — cross-lineage governance (e.g., `hivemind-power-on`).
- `gsd-*` — GSD developer tooling (33 agents, 67 skills). NOT shipped; excluded from asset sync.
- Unprefixed (orchestration/patterns) — 11 skills: `completion-detection`, `cross-cutting-change-mgmt`, `iterative-loop`, `marketing-market-research`, `multi-agent-coordination`, `opencode-config-workflow`, `quality-gate-orchestration`, `session-foundation`, `subagent-delegation-patterns`, `user-intent-patterns`, `wave-execution`.

**Test Files:**
- `*.test.ts` — vitest test files (e.g., `CP-ST-03-01-excision.test.ts`, `helpers.test.ts`)
- Co-located in some directories, mirrored in `tests/{domain}/` for others
- `*.spec.ts` — used occasionally (vitest glob accepts both)

## Where to Add New Code

**New Tool (LLM-callable):**
- Primary code: `src/tools/{domain}/{tool-name}.ts` (returns the `tool()` factory result)
- Type schema: inline Zod schema at top of the file
- Registration: add `createXxxTool` factory call in `src/plugin.ts` to the appropriate `register{Domain}Tools` function
- Tests: `tests/tools/{domain}/{tool-name}.test.ts` (or co-located if mirror convention)
- Helpers: `src/shared/tool-helpers.ts` (`renderToolResult`), `src/shared/tool-response.ts` (`success`/`error`)

**New Hook (SDK event observer):**
- Primary code: `src/hooks/{family}/{hook-name}.ts` (returns a `HookDependencies` consumer)
- Registration: add to `src/plugin.ts` in the appropriate `createXxxHooks` factory or as a top-level return-keyed entry
- CQRS check: `classifyHookEffect("hook-name")` from `src/hooks/composition/cqrs-boundary.ts` to verify the hook is a read or an allowed write
- Tests: `tests/hooks/{family}/{hook-name}.test.ts`

**New Feature (standalone runtime feature):**
- Primary code: `src/features/{feature-name}/{index,types}.ts` (and any supporting modules)
- Index barrel: re-export from `src/index.ts` if it should be public API
- Tests: `tests/features/{feature-name}/`
- Wiring: instantiate in `src/plugin.ts` after `setupDelegationModules`, pass into hook factories via `deps` bag

**New Coordination Module:**
- Primary code: `src/coordination/{delegation,concurrency,completion,spawner}/{module-name}.ts`
- Tests: `tests/coordination/{module-name}.test.ts`
- Wiring: add to `setupDelegationModules` (`src/plugin.ts:372-463`) if it's a delegation v2 surface

**New Schema:**
- Primary code: `src/schema-kernel/{schema-name}.schema.ts` (Zod schema with `parse`/`safeParse` exports)
- Barrel: re-export from `src/schema-kernel/index.ts`
- Generated JSON: re-run `node dist/schema-kernel/generate-config-json-schema.js` after build
- Tests: `tests/schema-kernel/{schema-name}.test.ts`

**New Config Field:**
- Primary code: `src/schema-kernel/hivemind-configs.schema.ts` (extend the Zod schema)
- Defaults: `src/config/defaults.ts` (extend `DEFAULT_GOVERNANCE_CONFIGS`)
- Subscriber: `src/config/subscriber.ts` (already lazy-loads from disk; usually no change)
- Tests: `tests/schema-kernel/hivemind-configs.schema.test.ts`

**New Command (slash command primitive):**
- Source of truth: `assets/commands/{command-name}.md` (YAML frontmatter + markdown body)
- Sync: `node scripts/sync-assets.js` mirrors to `.opencode/commands/`
- Discovery: `src/features/bootstrap/primitive-loader.ts` + `src/routing/command-engine/index.ts` pick it up automatically
- Tests: `tests/commands/{command-name}.test.ts`

**New Agent (Hivemind specialist):**
- Source of truth: `.hivefiver-meta-builder/agents-lab/active/refactoring/{agent-name}.md` (frontmatter + body)
- Sync: reflect to `.opencode/agents/{hm-,hf-,gsd-}{agent-name}.md`
- Discovery: `src/features/bootstrap/primitive-loader.ts` + `src/routing/session-entry/intake-gate.ts` (purpose classifier + registry validation)

**New Skill:**
- Source of truth: `.hivefiver-meta-builder/skills-lab/active/refactoring/{skill-name}/SKILL.md` (plus `references/` subfolder if needed)
- Sync: reflect to `.opencode/skills/{prefix}-{skill-name}/SKILL.md`
- Naming: must use the `hf-naming-syndicate` rules (prefix must match the skill's lineage)

**New CLI Subcommand:**
- Primary code: `src/cli/commands/{command-name}.ts` (export `{command-name}Cmd: CliCommand`)
- Registration: add to `src/cli/index.ts` `createRouter` call
- Tests: `tests/cli/commands/{command-name}.test.ts`

**New Continuation Store Field:**
- Primary code: `src/schema-kernel/agent-work-contract.schema.ts` (or related) → extend Zod schema
- Store: `src/features/agent-work-contracts/store.ts` (atomic persistence pattern)
- Tests: `tests/features/agent-work-contracts/{field}.test.ts`

**New Delegation State Transition:**
- Primary code: `src/coordination/delegation/state-machine.ts` (extend `VALID_DELEGATION_TRANSITIONS` and `canTransitionDelegationStatus`)
- Type: `src/shared/types.ts` (`DelegationStatus` union)
- Tests: `tests/coordination/delegation/state-machine.test.ts`

**New SDK Wrapper:**
- Primary code: `src/shared/session-api.ts` (typed `client.session.*` wrapper)
- Helpers: `src/shared/helpers.ts` (`asString`, `getNestedValue`, `isObject`, `makeToolSignature`)
- Tests: `tests/shared/session-api.test.ts`

**Utilities / Helpers:**
- Shared helpers: `src/shared/helpers.ts` (pure utility functions)
- Type definitions: `src/shared/types.ts` (contract authority)
- Re-exports: `src/index.ts` if public API

## Special Directories

**`dist/`:**
- Purpose: Build artifacts.
- Source: `tsc` compile output of `src/` (ES2022, NodeNext, declarations + source maps).
- Committed: No (gitignored).

**`node_modules/`:**
- Purpose: Installed dependencies.
- Source: `npm install` (per `package.json`).
- Committed: No (gitignored).

**`.hivemind/state/`:**
- Purpose: Durable JSON state files (`configs.json`, `sidecar-port.json`, `tmux-port.json`, `trajectory-ledger.json`, `agent-work-contracts.json`, `governance-state.json`, `version.json`).
- Source: Plugin writes via atomic rename (tmpFile + renameSync).
- Committed: No (gitignored — runtime state).

**`.hivemind/session-tracker/`:**
- Purpose: Per-session knowledge capture (markdown + JSON indexes).
- Source: `SessionTracker` writes via `SessionWriter` and child writers in `src/features/session-tracker/persistence/`.
- Committed: No (gitignored).

**`.hivemind/journal/`:**
- Purpose: Append-only event timeline (time-machine).
- Source: Journal module (`src/task-management/journal/`) and pane-monitor hook.
- Committed: No (gitignored).

**`.opencode/`:**
- Purpose: Deployed OpenCode primitives.
- Source: Mirrored from `assets/` via `node scripts/sync-assets.js` (also runs in `npm install` postinstall and `npm run build`).
- Committed: Yes (full subtree). User-modified files are backed up with `.backup` suffix before overwrite.

**`.hivefiver-meta-builder/`:**
- Purpose: Authoring lab for primitives (source of truth for `hm-*`/`hf-*`/`gate-*`).
- Source: Hand-authored or imported from upstream.
- Committed: Yes (full subtree).

**`sidecar/` (root-level):**
- Purpose: Next.js sidecar dashboard (read-only, consumes sidecar HTTP).
- Source: Hand-authored Next.js app.
- Committed: Yes (full subtree).

**`assets/`:**
- Purpose: SOURCE OF TRUTH for shipped OpenCode primitives (mirrored to `.opencode/` at build/install time).
- Source: Hand-authored.
- Committed: Yes (full subtree).

**`tests/fixtures/`:**
- Purpose: Test fixtures (JSON, markdown, configs).
- Source: Hand-authored test data.
- Committed: Yes.

**`eval/`:**
- Purpose: Eval test suite (picked up by `vitest.config.ts` `include` glob).
- Source: Hand-authored evals.
- Committed: Yes.

**`graphify-out/`, `disablekilo/`, `agents/`, `commands/`, `plans/`, `checkpoints/`, `state/`, `templates/`, `skills/`, `docs/`, `bin/`, `scripts/`, `checkpoints/`, `eval/`, `coverage-report.md`, `*.md` (large session files):**
- Purpose: Various legacy, archive, or auxiliary directories at the repo root. Many are historical artifacts from previous sessions and not part of the active build/test cycle.

**IDEs and tooling:**
- `.trae/`, `.windsurf/`, `.codex/`, `.github/` (with `get-shit-done/`), `.qoder/`, `.qwen/`, `.roo/`, `.claude/`, `.cursor/`, `.codexdisbaled/`, `.bob/`, `.agent/`, `.debug/`, `.commandcode/`, `.coordination/`, `.checkpoints/`, `.vscode/`, `.scratch/`, `.tmp/`, `.research/`, `.opencode-originals/` — IDE-managed, third-party sync artifacts, or scratch directories. Most are gitignored.

---

*Structure analysis: 2026-06-06*
*Update when directory structure changes (additions to `src/`, new features, GSD migration state)*
