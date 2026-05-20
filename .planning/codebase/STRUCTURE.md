---
mapped_date: 2026-05-20
last_mapped_commit: 906b21a055352fdeca3b7a1209c7c7be3f529cf7
focus: arch
---

# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```text
hivemind-plugin-private/
├── src/                          # Hard Harness npm package source
│   ├── plugin.ts                 # OpenCode plugin composition root
│   ├── index.ts                  # Public package re-exports
│   ├── cli/                      # `hivemind` bin command substrate
│   ├── config/                   # Config compiler, subscriber, workflow state
│   ├── coordination/             # Delegation, completion, concurrency, spawner
│   ├── features/                 # Standalone runtime features
│   ├── harness/                  # Reserved harness folder (`.gitkeep` only)
│   ├── hooks/                    # Read-side lifecycle/guard/observer/transform hooks
│   ├── kernel/                   # Reserved kernel folder (`.gitkeep` only)
│   ├── routing/                  # Session entry, behavioral profile, command engine
│   ├── schema-kernel/            # Zod schemas and generated schema support
│   ├── shared/                   # Leaf utilities, shared types, SDK wrappers
│   ├── sidecar/                  # Read-only state projection helpers
│   ├── task-management/          # Continuity, lifecycle, journal, recovery, trajectory
│   └── tools/                    # OpenCode custom tool entrypoints
├── tests/                        # Vitest suite mirroring runtime modules
│   ├── hooks/                    # Hook tests
│   ├── lib/                      # Library/module tests
│   ├── schema-kernel/            # Schema tests
│   ├── sidecar/                  # Sidecar guard tests
│   └── tools/                    # Tool tests
├── bin/                          # Published CLI entry script
├── assets/                       # Packaged static assets
├── dist/                         # Generated TypeScript build output
├── docs/                         # Draft proposals and documentation
├── plans/                        # Phase plans and archives
├── eval/                         # Evaluation artifacts
├── .planning/                    # Governance and codebase maps
├── .hivemind/                    # Internal runtime state root and planning cache
├── .opencode/                    # OpenCode primitives and plugin config wrappers
├── .hivefiver-meta-builder/      # Source-of-truth authoring lab for primitives
├── .github/                      # GitHub metadata/workflows/manifests
├── package.json                  # npm manifest and exports
├── package-lock.json             # npm lockfile
├── tsconfig.json                 # TypeScript strict NodeNext config
├── vitest.config.ts              # Vitest configuration
└── AGENTS.md                     # Root repository instructions and current project state
```

## Directory Purposes

**`src/`:**
- Purpose: Hard Harness TypeScript source that ships through the npm package.
- Contains: plugin, CLI, runtime modules, tools, hooks, schemas, shared helpers.
- Key files: `src/plugin.ts`, `src/index.ts`, `src/AGENTS.md`.

**`src/cli/`:**
- Purpose: Small dependency-light CLI substrate for `hivemind` commands.
- Contains: `commands/`, `discovery.ts`, `renderer.ts`, `router.ts`, `index.ts`.
- Key files: `src/cli/index.ts`, `src/cli/router.ts`, `src/cli/commands/init.ts`, `src/cli/commands/doctor.ts`, `src/cli/commands/recover.ts`.

**`src/config/`:**
- Purpose: Compile and subscribe to Hivemind/OpenCode config, plus turn-based primitive workflow state.
- Contains: `compiler.ts`, `subscriber.ts`, `workflow/`.
- Key files: `src/config/compiler.ts`, `src/config/subscriber.ts`, `src/config/workflow/index.ts`.

**`src/coordination/`:**
- Purpose: Runtime orchestration without durable persistence ownership.
- Contains: `command-delegation/`, `completion/`, `concurrency/`, `delegation/`, `sdk-delegation/`, `spawner/`.
- Key files: `src/coordination/delegation/manager.ts`, `src/coordination/delegation/coordinator.ts`, `src/coordination/completion/detector.ts`, `src/coordination/concurrency/queue.ts`.

**`src/features/`:**
- Purpose: Standalone feature modules consumed by tools, hooks, routing, and plugin composition.
- Contains: `agent-work-contracts/`, `auto-loop/`, `background-command/`, `bootstrap/`, `doc-intelligence/`, `prompt-packet/`, `ralph-loop/`, `runtime-pressure/`, `sdk-supervisor/`, `session-tracker/`.
- Key files: `src/features/session-tracker/index.ts`, `src/features/background-command/pty/pty-runtime.ts`, `src/features/bootstrap/primitive-loader.ts`, `src/features/runtime-pressure/index.ts`.

**`src/hooks/`:**
- Purpose: CQRS read-side OpenCode hooks for observation, response shaping, and guard decisions.
- Contains: `composition/`, `guards/`, `lifecycle/`, `observers/`, `transforms/`, `types.ts`.
- Key files: `src/hooks/composition/cqrs-boundary.ts`, `src/hooks/lifecycle/core-hooks.ts`, `src/hooks/lifecycle/session-hooks.ts`, `src/hooks/transforms/tool-before-guard.ts`.

**`src/routing/`:**
- Purpose: Read-side routing and classification.
- Contains: `behavioral-profile/`, `command-engine/`, `session-entry/`.
- Key files: `src/routing/session-entry/intake-gate.ts`, `src/routing/behavioral-profile/resolve-behavioral-profile.ts`, `src/routing/command-engine/index.ts`.

**`src/schema-kernel/`:**
- Purpose: Validation authority for tools, primitives, config, and runtime feature contracts.
- Contains: `agent-frontmatter.schema.ts`, `command-frontmatter.schema.ts`, `skill-metadata.schema.ts`, `hivemind-configs.schema.ts`, `permission.schema.ts`, `session-tracker.schema.ts`, `session-view.schema.ts`, `trajectory.schema.ts`, and related schemas.
- Key files: `src/schema-kernel/index.ts`, `src/schema-kernel/hivemind-configs.schema.ts`, `src/schema-kernel/generate-config-json-schema.ts`.

**`src/shared/`:**
- Purpose: Leaf utilities and cross-layer contracts.
- Contains: `types.ts`, `helpers.ts`, `session-api.ts`, `state.ts`, `runtime-policy.ts`, `workspace-runtime-policy.ts`, `tool-response.ts`, `tool-helpers.ts`, `security/`.
- Key files: `src/shared/types.ts`, `src/shared/session-api.ts`, `src/shared/state.ts`, `src/shared/security/path-scope.ts`, `src/shared/security/redaction.ts`.

**`src/sidecar/`:**
- Purpose: Read-only state projection helpers for sidecar/dashboard code.
- Contains: `readonly-state.ts`.
- Key files: `src/sidecar/readonly-state.ts`.

**`src/task-management/`:**
- Purpose: Durable state, lifecycle, journal, recovery, and trajectory ownership.
- Contains: `continuity/`, `journal/`, `lifecycle/`, `trajectory/`.
- Key files: `src/task-management/continuity/index.ts`, `src/task-management/continuity/store-cache.ts`, `src/task-management/continuity/delegation-persistence.ts`, `src/task-management/lifecycle/index.ts`, `src/task-management/journal/index.ts`, `src/task-management/trajectory/index.ts`.

**`src/tools/`:**
- Purpose: OpenCode custom tool entrypoint factories.
- Contains: `config/`, `delegation/`, `hivemind/`, `prompt/`, `session/`.
- Key files: `src/tools/delegation/delegate-task.ts`, `src/tools/delegation/delegation-status.ts`, `src/tools/hivemind/run-background-command.ts`, `src/tools/config/configure-primitive.ts`, `src/tools/session/execute-slash-command.ts`.

**`tests/`:**
- Purpose: Vitest evidence for runtime modules, tools, hooks, schema kernel, and sidecar guards.
- Contains: `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`, `tests/sidecar/`.
- Key files: `tests/lib/coordination/delegation/coordinator.test.ts`, `tests/lib/coordination/concurrency/queue.test.ts`, `tests/hooks/observers/session-tracker-consumer.test.ts`, `tests/sidecar/readonly-state.test.ts`.

**`.planning/`:**
- Purpose: Governance, requirements, roadmaps, phase artifacts, codebase maps.
- Contains: `.planning/codebase/`, `.planning/architecture/`, `.planning/phases/`, `.planning/research/`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/AGENTS.md`.

**`.hivemind/`:**
- Purpose: Canonical internal state root and planning/runtime cache.
- Contains: state, journals, session tracker, delegation records, planning cache.
- Key paths: `.hivemind/state/session-continuity.json`, `.hivemind/state/delegations.json`, `.hivemind/session-tracker/`.

**`.opencode/`:**
- Purpose: Soft Meta-Concepts and OpenCode project configuration.
- Contains: agents, commands, skills, rules, permissions, plugin loader wrappers.
- Key files: `.opencode/AGENTS.md`, `.opencode/rules/universal-rules.md`, `.opencode/plugins/harness-control-plane.ts`.

**`.hivefiver-meta-builder/`:**
- Purpose: Source-of-truth authoring lab for primitives before reflection to `.opencode/`.
- Contains: agents lab, skills lab, commands lab.
- Use for: Meta-concept authoring workflows; do not treat `.opencode/` as the authoring source when this lab is authoritative.

## Key File Locations

**Entry Points:**
- `src/plugin.ts`: OpenCode `HarnessControlPlane` plugin.
- `src/index.ts`: npm public API barrel.
- `src/cli/index.ts`: CLI runtime entrypoint.
- `bin/hivemind.cjs`: package bin wrapper.

**Configuration:**
- `package.json`: package name, exports, scripts, dependencies, engines.
- `tsconfig.json`: ES2022, NodeNext, strict, no unused locals/parameters, no implicit returns, declaration/source maps.
- `vitest.config.ts`: test configuration.
- `opencode.json`: project OpenCode configuration.
- `.opencode/rules/universal-rules.md`: runtime rule primitive guidance.

**Core Runtime Logic:**
- `src/coordination/delegation/manager.ts`: stable DelegationManager facade.
- `src/coordination/delegation/coordinator.ts`: v2 delegate-task flow.
- `src/coordination/completion/detector.ts`: dual-signal completion logic.
- `src/coordination/concurrency/queue.ts`: concurrency queue.
- `src/task-management/lifecycle/index.ts`: lifecycle manager.
- `src/task-management/continuity/index.ts`: session continuity store.
- `src/features/session-tracker/index.ts`: session knowledge capture.
- `src/hooks/composition/cqrs-boundary.ts`: hook write-boundary enforcement.

**Validation and Contracts:**
- `src/schema-kernel/index.ts`: schema barrel and fallback validation helper.
- `src/schema-kernel/hivemind-configs.schema.ts`: Hivemind config shape.
- `src/schema-kernel/agent-frontmatter.schema.ts`: agent frontmatter contract.
- `src/schema-kernel/command-frontmatter.schema.ts`: command frontmatter contract.
- `src/schema-kernel/permission.schema.ts`: permission schema.
- `src/shared/types.ts`: shared runtime contracts.

**Testing:**
- `tests/lib/`: library/module tests.
- `tests/tools/`: tool tests.
- `tests/hooks/`: hook tests.
- `tests/schema-kernel/`: schema tests.
- `tests/sidecar/`: sidecar read-only tests.

## Naming Conventions

**Files:**
- Source modules: use `kebab-case.ts` for most implementation files, e.g. `tool-before-guard.ts`, `runtime-policy.ts`.
- Schemas: use `kebab-case.schema.ts`, e.g. `session-tracker.schema.ts`, `agent-work-contract.schema.ts`.
- Tests: use `kebab-case.test.ts`, e.g. `queue.test.ts`, `readonly-state.test.ts`.
- Module barrels: use `index.ts` at submodule boundaries.
- Shared contract files: use `types.ts` close to the module when contracts are local, e.g. `src/coordination/delegation/types.ts`.

**Directories:**
- Layer roots: `src/{layer}/`, e.g. `src/coordination/`, `src/task-management/`.
- Domains: `src/{layer}/{domain}/`, e.g. `src/coordination/delegation/`, `src/routing/command-engine/`.
- Feature modules: `src/features/{feature-name}/`, e.g. `src/features/session-tracker/`.
- Tests mirror source intent under `tests/lib/{domain}/`, `tests/tools/`, `tests/hooks/`, or `tests/schema-kernel/`.

**Symbols:**
- Tool factories: `create{Name}Tool()`, e.g. `createDelegateTaskTool()`.
- Hook factories: `create{Name}Hooks()` or `create{Name}Consumer()`, e.g. `createCoreHooks()`, `createSessionTrackerConsumer()`.
- Managers: `PascalCaseManager`, e.g. `DelegationManager`, `HarnessLifecycleManager`.
- Schemas: `{Name}Schema`, e.g. `SessionTrackerInputSchema`.
- Harness-owned thrown errors: prefix messages with `[Harness]`.

## Source-Plane Boundaries

**Hard Harness (`src/`):**
- Put package runtime implementation here.
- Runtime modules may compile to `dist/` and ship through npm exports.
- Do not store durable runtime data in `src/`.

**Soft Meta-Concepts (`.opencode/`):**
- Put OpenCode primitives here: agents, commands, skills, rules, permissions, plugin loader wrappers.
- Do not put internal state, business logic, or generated build output here.
- Treat `.opencode/` as runtime primitive reflection, not the only authoring source when `.hivefiver-meta-builder/` owns source-of-truth.

**Internal State (`.hivemind/`):**
- Put runtime state here: continuity, delegation records, journals, session tracker, lineage.
- Use code-owned writers such as `src/task-management/continuity/` and `src/features/session-tracker/`.
- Do not commit secrets or runtime state dumps.

**Governance (`.planning/`):**
- Put planning, architecture, research, audits, requirements, roadmaps, and codebase maps here.
- Do not implement runtime behavior here.
- Current codebase intelligence lives in `.planning/codebase/`.

**Generated Build Output (`dist/`):**
- Produced by `npm run build`.
- Do not edit manually.
- Package exports point to `dist/index.js`, `dist/plugin.js`, and `dist/cli/index.js`.

**Third-Party / Local Artifacts:**
- Root `.env` exists and must never be read or copied into docs.
- `node_modules/`, `dist/`, and runtime/generated caches are not source authority.
- Dated markdown/session files in the repository root are historical artifacts; prefer `.planning/` and source files for current architecture decisions.

## Where to Add New Code

**New OpenCode Tool:**
- Implementation: `src/tools/{domain}/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`.
- Schema: `src/schema-kernel/{tool-name}.schema.ts` when input validation is non-trivial.
- Registration: tool map in `src/plugin.ts`.
- Tests: `tests/tools/{tool-name}.test.ts` or `tests/lib/{domain}/{tool-name}.test.ts`.

**New Delegation Behavior:**
- Implementation: `src/coordination/delegation/`.
- Persistence: `src/task-management/continuity/delegation-persistence.ts` only for durable records.
- Tests: `tests/lib/coordination/delegation/`.

**New Completion or Concurrency Logic:**
- Completion: `src/coordination/completion/`.
- Concurrency: `src/coordination/concurrency/`.
- Tests: `tests/lib/coordination/completion/` or `tests/lib/coordination/concurrency/`.

**New Runtime Feature:**
- Implementation: `src/features/{feature-name}/index.ts` plus `types.ts` and submodules as needed.
- Tool exposure: add a thin tool under `src/tools/` rather than exposing feature internals directly to OpenCode.
- Tests: `tests/lib/features/{feature-name}/`.

**New Hook:**
- Lifecycle hook: `src/hooks/lifecycle/{name}-hooks.ts`.
- Guard hook: `src/hooks/guards/{name}-hooks.ts`.
- Transform hook: `src/hooks/transforms/{name}.ts`.
- Observer consumer: `src/hooks/observers/{name}-consumer.ts`.
- Tests: `tests/hooks/{name}.test.ts`.
- Boundary: keep durable writes out of hook files; use `src/hooks/composition/cqrs-boundary.ts` patterns.

**New Config/Primitive Compiler Behavior:**
- Implementation: `src/config/`.
- Validation: `src/schema-kernel/`.
- Tool wrapper: `src/tools/config/`.
- Tests: `tests/lib/config-*` and `tests/schema-kernel/`.

**New Routing or Command Discovery Behavior:**
- Implementation: `src/routing/{domain}/`.
- Tool wrapper if exposed: `src/tools/hivemind/` or `src/tools/session/`.
- Tests: `tests/lib/command-engine/` or matching routing tests.

**New Shared Utility:**
- Implementation: `src/shared/{name}.ts`.
- Rule: keep it leaf-like; do not import from `src/tools/`, `src/hooks/`, `src/coordination/`, `src/features/`, or `src/task-management/`.
- Tests: `tests/lib/{name}.test.ts` or `tests/lib/shared/{name}.test.ts`.

**New Sidecar Read Surface:**
- Implementation: `src/sidecar/`.
- Rule: sidecar helpers may read `.hivemind/state/` and `.planning/`; they must not write canonical state.
- Tests: `tests/sidecar/`.

**New Planning/Governance Artifact:**
- Location: `.planning/{category}/` or `.planning/codebase/` for current codebase maps.
- Naming: date-stamp generated artifacts except canonical maps such as `.planning/codebase/ARCHITECTURE.md` and `.planning/codebase/STRUCTURE.md`.
- Rule: planning docs do not implement runtime behavior.

## Special Directories

**`src/harness/`:**
- Purpose: Reserved Hard Harness folder.
- Generated: No.
- Committed: Yes, via `.gitkeep`.
- Add code here only with an explicit architecture decision; current runtime surfaces live in existing layer roots.

**`src/kernel/`:**
- Purpose: Reserved kernel folder.
- Generated: No.
- Committed: Yes, via `.gitkeep`.
- Add code here only with an explicit architecture decision; validation contracts currently belong in `src/schema-kernel/`.

**`.opencode/`:**
- Purpose: Soft Meta-Concept runtime primitives.
- Generated: Reflected/synchronized from authoring sources for many primitives.
- Committed: Yes for project primitives.
- Never use for internal runtime state.

**`.hivemind/`:**
- Purpose: Internal state root and Hivemind planning/runtime cache.
- Generated: Yes at runtime and by governance workflows.
- Committed: Selectively; runtime state contents are generally not source authority.
- Canonical state root per Q6 decision.

**`.hivefiver-meta-builder/`:**
- Purpose: Source-of-truth primitive authoring lab.
- Generated: No; authored and reflected.
- Committed: Yes.

**`.planning/`:**
- Purpose: Governance and current codebase intelligence.
- Generated: By planning/mapping/audit workflows.
- Committed: Yes.
- Current assigned maps: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

**`dist/`:**
- Purpose: Compiled package output.
- Generated: Yes by `npm run build`.
- Committed: No.
- Do not modify manually.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes by `npm install`.
- Committed: No.
- Never inspect as source authority unless specifically validating installed package contents.

**Root `.env`:**
- Purpose: Local environment configuration.
- Generated: User/local.
- Committed: No.
- Do not read, quote, or copy contents.

---

*Structure analysis: 2026-05-20*
