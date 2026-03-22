# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Layered plugin-plus-control-plane architecture with projection-driven runtime surfaces.

**Key Characteristics:**
- `src/plugin/opencode-plugin.ts` is assembly-only: it wires hooks, tool registrations, prompt/context injection, and OpenCode lifecycle hooks without defining business logic inline.
- `src/control-plane/` and `src/commands/slash-command/` split command intent from command execution: slash bundles describe runtime contracts, while control-plane handlers execute the primitives.
- Persistent runtime state is file-backed under `.hivemind/` through path helpers in `src/shared/paths.ts`, workflow authority in `src/core/workflow-management/workflow-authority.ts`, trajectory storage in `src/core/trajectory/trajectory-store.ts`, and recovery logic in `src/recovery/recovery-engine.ts`.

## Layers

**Plugin Assembly Layer:**
- Purpose: Register the OpenCode plugin surface and intercept chat, command, tool, shell, permission, and compaction hooks.
- Location: `src/plugin/opencode-plugin.ts`, `src/plugin/index.ts`, `src/plugin/context-renderer.ts`, `src/plugin/runtime-snapshot.ts`
- Contains: OpenCode `Plugin` export, synthetic prompt/context packet injection, route hints, snapshot loading.
- Depends on: `src/hooks/`, `src/tools/`, `src/features/runtime-entry/`, `src/features/agent-work-contract/`, `src/commands/slash-command/`
- Used by: package export `./plugin` in `package.json`, generated runtime stub in `.opencode/plugins/`

**Hook Layer:**
- Purpose: Read-side interception and event bridging during OpenCode runtime execution.
- Location: `src/hooks/index.ts`, `src/hooks/event-handler.ts`, `src/hooks/start-work/start-work-router.ts`, `src/hooks/runtime-loader/`, `src/hooks/workflow-integration/`
- Contains: event normalization, start-work routing, runtime loader helpers, soft-governance notifications.
- Depends on: `src/core/`, `src/features/session-entry/`, `src/shared/`, `src/recovery/`
- Used by: `src/plugin/opencode-plugin.ts`

**Tool Layer:**
- Purpose: Expose agent-callable write-side tools that mutate or inspect governed runtime state.
- Location: `src/tools/index.ts`, `src/tools/runtime/`, `src/tools/task/`, `src/tools/trajectory/`, `src/tools/handoff/`, `src/tools/doc/`
- Contains: runtime status/command tools, task mutation, trajectory control, handoff persistence, doc intelligence entrypoints.
- Depends on: `src/shared/pressure-contract.ts`, `src/features/`, `src/core/`, `src/delegation/`
- Used by: `src/plugin/opencode-plugin.ts` tool registration and agent workflows

**Control-Plane Layer:**
- Purpose: Define the authoritative bootstrap, repair, harness, and settings primitives and decide when they gate entry.
- Location: `src/control-plane/control-plane-registry.ts`, `src/control-plane/control-plane-types.ts`, `src/control-plane/control-plane-handler.ts`, `src/control-plane/control-plane-intake.ts`
- Contains: primitive metadata, gating rules, intake requirements, CLI mapping, handler dispatch.
- Depends on: `src/features/session-entry/`, `src/features/runtime-entry/`, `src/shared/pressure-contract.ts`
- Used by: `src/features/session-entry/readiness-gates.ts`, `src/cli/command-routing.ts`, `src/features/runtime-entry/command.ts`

**Command Bundle Layer:**
- Purpose: Describe slash-command workflows as typed runtime bundles backed by markdown assets.
- Location: `src/commands/slash-command/command-bundles.ts`, `src/commands/slash-command/command-runner.ts`, `src/features/runtime-entry/instruction-loader.ts`, `commands/*.md`
- Contains: bundle catalog, command lookup, preview/execute wrappers, markdown frontmatter/body contract parsing.
- Depends on: `src/features/runtime-entry/`, `src/control-plane/`
- Used by: plugin command interception, CLI/runtime command execution, runtime surface sync

**Runtime Entry Layer:**
- Purpose: Execute bootstrap, harness, settings, workflow commands, and runtime attachment flows.
- Location: `src/features/runtime-entry/index.ts`, `src/features/runtime-entry/init-project.ts`, `src/features/runtime-entry/init.handler.ts`, `src/features/runtime-entry/harness.ts`, `src/features/runtime-entry/command.ts`
- Contains: init/doctor/harness/settings handlers, runtime invocation creation, turn output projection, runtime attachment persistence, automatic recovery before command execution.
- Depends on: `src/control-plane/`, `src/core/`, `src/governance/`, `src/recovery/`, `src/shared/`, `src/cli/runtime-assets.ts`
- Used by: CLI commands, slash-command runner, plugin auto-routing

**State and Governance Layer:**
- Purpose: Own workflow authority, trajectory ledgers, recovery checkpoints, and planning projections stored in `.hivemind/`.
- Location: `src/core/trajectory/trajectory-store.ts`, `src/core/workflow-management/workflow-authority.ts`, `src/core/workflow-management/task-lifecycle.ts`, `src/governance/planning-projection.ts`, `src/recovery/recovery-engine.ts`
- Contains: file-backed state bootstrapping, task lifecycle, checkpoint creation, planning projections, repair routines.
- Depends on: `src/shared/paths.ts`, `src/shared/pressure-contract.ts`
- Used by: runtime entry handlers, hooks, runtime status reporting

**Schema/Supervisor Layer:**
- Purpose: Provide stable internal contracts and status projections over runtime/session state.
- Location: `src/schema-kernel/index.ts`, `src/sdk-supervisor/runtime-status.ts`, `src/sdk-supervisor/health.ts`, `src/archive/schema-kernel/`
- Contains: canonical schema export surface, runtime status snapshot builder, supervisor health reports.
- Depends on: `src/core/trajectory/`, `src/shared/runtime-attachment.ts`
- Used by: runtime status/reporting tools and supervisor-facing diagnostics

**Projection/Mirroring Layer:**
- Purpose: Mirror canonical repo assets into OpenCode runtime folders and keep consumer surfaces synchronized.
- Location: `src/features/runtime-observability/sync.ts`, `src/shared/opencode-agent-registry.ts`, `src/shared/opencode-skill-registry.ts`
- Contains: `.opencode/` sync, agent markdown projection, skill runtime projection, local plugin stub generation.
- Depends on: `commands/`, `agents/`, `skills/`
- Used by: `src/features/runtime-entry/init.handler.ts`, runtime sync tests in `tests/sync-dry-run.test.ts` and `tests/runtime-surface-sync.test.ts`

## Data Flow

**User Turn Routing:**

1. OpenCode enters `src/plugin/opencode-plugin.ts`, which loads snapshot state and intercepts `chat.message`, `command.execute.before`, and `experimental.chat.messages.transform`.
2. `src/hooks/start-work/start-work-router.ts` classifies purpose, lineage, readiness, continuity, and pressure to choose a required or recommended command.
3. `src/plugin/opencode-plugin.ts` injects turn hierarchy and HiveMind context packets, optionally auto-dispatches a runtime command via `src/features/runtime-entry/nl-first-dispatch.ts`, and records tool or command events.

**Command Execution:**

1. Slash metadata comes from `src/commands/slash-command/command-bundles.ts` and markdown assets from `commands/*.md`, parsed by `src/features/runtime-entry/instruction-loader.ts`.
2. `src/commands/slash-command/command-runner.ts` delegates execution to `src/features/runtime-entry/command.ts`.
3. `src/features/runtime-entry/command.ts` auto-recovers with `hm-init` or `hm-doctor` when entry state is uninitialized or repair-required, then dispatches to runtime handlers or control-plane handlers.
4. Finalization in `src/features/runtime-entry/command.ts` records trajectory transitions, writes turn output projections, links agent-work contracts, and writes workflow continuity artifacts.

**Bootstrap and Recovery:**

1. `src/features/runtime-entry/init-project.ts` resolves intake and executes `hm-init` through the same slash-command pipeline used in-session.
2. `src/features/runtime-entry/init.handler.ts` creates a managed runtime, syncs `.opencode/` runtime assets, saves runtime attachment settings, bootstraps workflow authority, bootstraps the trajectory ledger, creates a recovery checkpoint, and writes a planning projection.
3. `src/features/runtime-entry/harness.ts` and `src/recovery/recovery-engine.ts` assess health, checkpoint current state, and route the next command to `hm-plan` or `hm-doctor`.

**State Management:**
- Runtime attachment settings are normalized and persisted through `src/features/runtime-entry/attachment.persistence.ts`.
- Workflow task state is mirrored into both `.hivemind/state/tasks.json` and `.hivemind/graph/tasks.json` by `src/core/workflow-management/task-lifecycle.ts`.
- Trajectory events, checkpoints, and recovery outcomes are written through `src/core/trajectory/trajectory-store.ts` and `src/recovery/recovery-engine.ts`.

## Key Abstractions

**SlashCommandBundle:**
- Purpose: Represent the authoritative metadata for each slash command.
- Examples: `src/commands/slash-command/command-bundles.ts`, `src/commands/slash-command/command-types.ts`
- Pattern: static registry + runtime asset lookup

**ControlPlanePrimitive:**
- Purpose: Represent bootstrap/repair/readiness/settings primitives independent from markdown command bodies.
- Examples: `src/control-plane/control-plane-registry.ts`, `src/control-plane/control-plane-types.ts`
- Pattern: registry object with `detect()` gate function and runtime pressure contract

**RuntimeBindingsSnapshot / Runtime Attachment:**
- Purpose: Represent the attached runtime authority, profile defaults, current workflow links, and readiness state.
- Examples: `src/features/runtime-entry/attachment.ts`, `src/features/runtime-entry/attachment.persistence.ts`, `src/features/runtime-entry/snapshot-loader.ts`
- Pattern: persisted settings + computed snapshot

**Trajectory Ledger:**
- Purpose: Represent long-lived workflow trajectory, events, checkpoints, and recovery log.
- Examples: `src/core/trajectory/trajectory-store.ts`, `src/core/trajectory/trajectory-store.operations.ts`
- Pattern: file-backed append/update ledger with inspection and bootstrap helpers

**Workflow Authority:**
- Purpose: Represent whether `.hivemind/` planning and task ledgers are present and healthy for controlled work.
- Examples: `src/core/workflow-management/workflow-authority.ts`, `src/core/workflow-management/task-lifecycle.ts`
- Pattern: file-system inspection + bootstrap repair

**Command Runtime Contract:**
- Purpose: Derive structured execution metadata from markdown commands.
- Examples: `src/features/runtime-entry/instruction-loader.ts`, `commands/hm-init.md`, `commands/hm-plan.md`
- Pattern: frontmatter/body parser that extracts arguments, sections, outputs, state consumption, and closeout gates

**Runtime Surface Projection:**
- Purpose: Mirror canonical repo assets into consumer-facing `.opencode/` runtime surfaces.
- Examples: `src/features/runtime-observability/sync.ts`, `src/shared/opencode-agent-registry.ts`, `src/shared/opencode-skill-registry.ts`
- Pattern: canonical source projection, not independent authoring

## Entry Points

**Package Barrel:**
- Location: `src/index.ts`
- Triggers: package import from `dist/index.js`
- Responsibilities: export the core, shared, control-plane, hook, delegation, intelligence, recovery, and tool surfaces

**OpenCode Plugin Entry:**
- Location: `src/plugin/opencode-plugin.ts`
- Triggers: `./plugin` export from `package.json` and generated `.opencode/plugins/` stub
- Responsibilities: register hooks and tools, attach prompt context, auto-route runtime commands, emit environment state

**CLI Entry:**
- Location: `src/cli.ts`
- Triggers: `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, `hm-harness` binaries declared in `package.json`
- Responsibilities: parse flags, resolve command aliases through `src/cli/command-routing.ts`, invoke init/doctor/settings/harness handlers

**Slash Command Catalog:**
- Location: `src/commands/slash-command/command-bundles.ts`
- Triggers: command discovery via `findSlashCommandBundle()` and runtime sync
- Responsibilities: define workflow chain, agent, pressure contract, and command file mapping for each command

**Runtime Status Builder:**
- Location: `src/sdk-supervisor/runtime-status.ts`
- Triggers: runtime status inspection/reporting paths
- Responsibilities: synthesize kernel, supervisor, workflow, and event status from snapshot plus trajectory state

## Error Handling

**Strategy:** Fail closed on missing bootstrap or unhealthy state, then route through explicit repair/bootstrap commands.

**Patterns:**
- `src/control-plane/control-plane-registry.ts` produces blocking or advisory gate decisions instead of letting invalid work proceed.
- `src/features/runtime-entry/command.ts` auto-recovers to `hm-init` or `hm-doctor` when entry state is not ready.
- `src/hooks/event-handler.ts` tolerates malformed or unknown events by warning and still recording normalized summaries when possible.
- `src/core/workflow-management/workflow-authority.ts` and `src/recovery/recovery-engine.ts` classify missing files into repairable failure classes.

## Cross-Cutting Concerns

**Logging:** `src/shared/logging.ts` and targeted `console.warn` usage in `src/hooks/event-handler.ts` support diagnostics; runtime evidence reporting lives in `src/plugin/evidence-reporter.ts`.
**Validation:** Zod-backed schemas exist in tool contracts and delegation records such as `src/delegation/delegation-record.schema.ts`; command markdown contracts are parsed in `src/features/runtime-entry/instruction-loader.ts`.
**Authentication:** No application-level auth boundary is implemented in the repo; the runtime assumes OpenCode host/plugin authority and tracks runtime identity through `src/features/runtime-entry/attachment.persistence.ts` and `src/control-plane/sdk-runtime.ts`.

---

*Architecture analysis: 2026-03-21*
