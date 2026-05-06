# CONTEXT: Hivemind State Architecture Restructuring

**Workstream:** hivemind-state-architecture (WS-1) → restructuring into 3 themed workstreams
**Gathered:** 2026-05-06
**Status:** Ready for restructuring planning
**Supersedes:** Previous WS-1 CONTEXT.md (marked COMPLETE but shallow)

<domain>
## Phase Boundary

Restructure the completed-but-shallow WS-1 (hivemind-state-architecture) into a comprehensive architecture that connects `.hivemind/` state files to actual runtime behavior. This includes:
1. Redesigning configs.json with the full schema from skeleton v2 §9.1
2. Creating the schema-to-runtime binding model
3. Defining the CRUD/Query lifecycle for all `.hivemind/` artifacts
4. Consolidating 5 workstreams into 3 themed workstreams
5. Ensuring every `.hivemind/` artifact has at least 2 lifecycle integrations (agents/commands, CRUD ops, behavioral shaping, config chaining, or OpenCode SDK surfaces)

**This is NOT a new feature phase.** This is an architectural restructuring that fixes the fundamental gap: WS-1 produced empty directories and disconnected schemas. The restructuring produces a runtime-connected state architecture where every artifact is produced and consumed by deterministic tools, hooks, engines, or event subscriptions.

</domain>

<decisions>
## Implementation Decisions

### configs.json Field Redesign
- **D-CONF-01:** Keep 3 modes (`expert-advisor`, `hivemind-powered`, `free-style`) with explicit behavioral profiles:
  - `expert-advisor`: Agent-led with TDD, spec-driven, research-first, systematic planning, atomic executions, context governance, guardrails, dependency validation, best-practice guidance, user confirmation before execution
  - `hivemind-powered`: Stricter granular guardrails, hierarchical tracking, cross-context persistence, auto-routing with thorough explanations and rationales
  - `free-style`: Features/guardrails only available when child control-panes are active or explicitly requested by user
- **D-CONF-02:** `user-expert-level` impacts front-facing agent output style: tech jargon level, elaboration depth, selection of high-level vs E2E feature development approaches. This is a "commands vs. workflows" router for front-facing agents.
- **D-CONF-03:** Each `workflow` toggle controls a separate runtime feature — implemented as OpenCode primitives (commands, skills), custom tools, engines, or event-hook injections. Distributed control, not single middleware.
- **D-CONF-04:** configs.json MUST match skeleton v2 §9.1 full schema, including `workflow` object with ~15 nested toggles (`research`, `discuss_mode`, `task_plus_enabled`, `trajectory_control`, `plan_check`, `verifier`, `use_worktrees`, etc.), plus `parallelization`, `atomic_commit`, `commit_docs`.
- **D-CONF-05:** configs.json is loaded at every front-facing session start and reloaded after each user prompt (main session only). Missing file → defaults apply. Invalid JSON → warning, defaults apply. Unknown fields → stripped.

### Workstream Consolidation
- **D-WS-01:** Consolidate 5 workstreams into 3 themed workstreams:
  1. **Core Architecture** — Absorbs HER (harness-ecosystem-recovery) + WS-1 state architecture fixes + WS-3 primitive registry + configs.json runtime binding
  2. **Agent Workflows** — Absorbs WS-4 auto-commands/workflow-router + WS-5 delegation revamp + WS-6 trajectory/task-plus
  3. **User Experience** — Absorbs WS-2 bootstrap/CLI/init + WS-7 context/compaction + WS-8 sidecar/UI
- **D-WS-02:** `milestone` workstream stays SUSPENDED. `skill-ecosystem` and `agent-synthesis` stay CLOSED. They are historical phases, not active workstreams.
- **D-WS-03:** Dependency order: Core Architecture → Agent Workflows → User Experience. Core must be complete before Workflows can bind to registries. Workflows must exist before UX can expose them.

### Schema-to-Runtime Binding Model
- **D-BIND-01:** Support fine-grained granularity with different runtimes/event subscriptions. Utilize both Hivemind plugin AND OpenCode SDK surfaces. NOT a single RuntimeContext module — a subscription-based model where different features react to config values at different lifecycle points.
- **D-BIND-02:** Binding points exist at:
  - `plugin.ts` composition root — reads configs to conditionally register hooks, tools, agent defaults
  - `session.created` hook — reads configs + trajectory + delegation records to produce session context
  - Custom tools — each tool reads the config fields relevant to its domain
  - Skills — front-facing agents load config at skill activation to adapt behavior
  - `messages.transform` hook — reads `mode` + `user-expert-level` to transform agent output
- **D-BIND-03:** Every config field MUST have at least one concrete consumer in `src/`. Fields with no consumer are not allowed.

### CRUD/Query Operation Lifecycle
- **D-CRUD-01:** CLI bootstraps initial state (`configs.json`, directory structure, default registries) via `npx` init (WS-2/UX workstream)
- **D-CRUD-02:** OpenCode hooks read state at runtime events: `session.created` reads configs + trajectory, `tool.use` reads delegation records, `system.transform` reads mode settings
- **D-CRUD-03:** Custom tools write state: `delegate-task` writes to `delegation-managements/`, `task-create` writes to `task-managements/`, `trajectory-update` writes to `hm-brain/trajectory-ledger.json`
- **D-CRUD-04:** hf-* and hm-* agents are the functional units in the f-04 auto-routing system — they don't write state directly but trigger tools that do
- **D-CRUD-05:** Each `.hivemind/` subdirectory has an owning module in `src/` that exposes typed CRUD functions. No direct file writes outside these modules.

### Lifecycle Integration Requirements
- **D-LIFECYCLE-01:** Every file created/updated within `.hivemind/` MUST be the result of either:
  - Agent deterministic tool/function callings, OR
  - Programmatic engines with hooks to event-based subscriptions
- **D-LIFECYCLE-02:** State/roadmap/governance/configuration files MUST contribute to at least TWO of:
  - Agent/command/workflow lifecycle impacts (actors/routers)
  - CRUD and Query operations (MANDATORY for context/state/task-management files)
  - Shaping agent behaviors/pipelines (tool ordering, command chaining, skill stacking, guardrails, output formatting)
  - Configuration field chaining (altering permissions, interceptions, behavioral manipulations)
  - Schema structures with OpenCode SDK interface utilization

### Agent's Discretion
- Specific implementation architecture for the subscription-based binding model (how config changes propagate to consumers)
- Exact file contents for each `.hivemind/` subdirectory (beyond what skeleton v2 §10 specifies)
- Ordering of phases within each themed workstream

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Skeleton (Authoritative)
- `.planning/MASTER-PROJECT-SKELETON.md` — Master project skeleton with 4 feature paths, 2 lineages, workstream landscape, gap classification
- `.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md` — Comprehensive skeleton with 39 gaps, 9 workstreams, configs.json full schema (§9.1), bootstrap tree (§10), CRUD lifecycle patterns
- `.planning/SKELETON-TRACKING-INDEX.md` — Maps skeleton sections to workstream coverage, feature ID ownership, open decisions

### Original User Requirements
- `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` — Original user prompt specifying configs.json fields, behavioral modes, .hivemind/ structure, bootstrap requirements

### Current WS-1 Artifacts (To Be Restructured)
- `.planning/workstreams/hivemind-state-architecture/phases/WS1-01-state-architecture-spec/WS1-01-SPEC.md` — Current (shallow) state architecture spec
- `src/schema-kernel/hivemind-configs.schema.ts` — Current 5-field Zod schema (needs expansion)
- `.hivemind/configs.json` — Current minimal config (needs full schema)

### Harness Ecosystem (Dependency)
- `.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md` — HER workstream (HER-0 through HER-5), ecosystem audit and recovery

### Architecture References
- `AGENTS.md` (project root) — Project overview, dependency rules, state root separation (Q6)
- `src/plugin.ts` — Composition root where config binding must connect
- `src/hooks/plugin-event-observers.ts` — Event subscription hook (consumes session events)
- `src/hooks/messages-transform.ts` — Message transform hook (consumes mode/expert-level)
- `src/tools/delegate-task.ts` — Delegation tool (consumes delegation_systems config)
- `src/lib/continuity.ts` — State persistence module (~401 LOC, owns `.hivemind/state/`)
- `src/lib/delegation-manager.ts` — Delegation orchestrator (owns delegation records)

### OpenCode Platform (External)
- OpenCode SDK — `tool()`, `hook()`, plugin registration surfaces
- OpenCode Hooks — `session.created`, `system.transform`, `tool.use`, `messages` transform, compaction hooks
- OpenCode Commands — Slash command architecture, `$ARGUMENTS` parsing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/schema-kernel/hivemind-configs.schema.ts` — Zod schema with `readConfigs()`/`writeConfigs()` helpers. Needs expansion to full skeleton v2 schema but the read/write pattern is established.
- `src/lib/continuity.ts` — Durable JSON persistence with deep-clone-on-read. Pattern for all `.hivemind/state/` CRUD operations.
- `src/lib/delegation-persistence.ts` — Delegation record persistence. Pattern for `delegation-managements/` CRUD.
- `src/hooks/plugin-event-observers.ts` — Event subscription infrastructure. Where config-driven behavior gets injected.
- `src/hooks/create-tool-guard-hooks.ts` — Tool guard hooks. Where permission/config checks can gate tool access.
- `src/tools/delegate-task.ts` — Delegation dispatch. Where `delegation_systems` config controls available delegation modes.
- `src/cli/` — CLI substrate from Phase 40. Foundation for bootstrap CLI (WS-2).

### Established Patterns
- Dual-layer state: durable JSON file (continuity.ts) + in-memory Maps (state.ts)
- `[Harness]` prefix on all thrown errors
- Max module size: 500 LOC
- `assertPathWithinRoot()` for path containment
- Deep-clone-on-read in state store
- Module ownership: each `.hivemind/` subdirectory owned by one `src/` module

### Integration Points
- `plugin.ts` line ~50-100: Where `readConfigs()` would be called at plugin load time
- `plugin.ts` AGENT_DEFAULTS / AGENT_TOOLS: Where config values could set agent temperature, tool access
- `session.created` hook: Where session context is built from config + state files
- `messages.transform` hook: Where mode/expert-level output adaptation happens
- Custom tools: Where config-driven CRUD operations execute

</code_context>

<specifics>
## Specific Ideas

- The `mode` field should cascade through a "behavioral profile" — a mapping of mode value → concrete behavioral settings (guardrail strictness, delegation depth, tool access, output format). The profile is consumed by multiple hooks/tools, not just one place.
- The `workflow.discuss_mode` field maps directly to GSD discuss-phase modes: "sufficient-phase-discussion", "intensive-phase-discussion", "skip-phase-discussion". The GSD discuss-phase skill already reads this value.
- The `workflow.research` toggle controls whether hm-l3-research-chain skill is loaded by front-facing agents. This is a skill-loading gate.
- The `delegation_systems` object controls which delegation tools are available. `background_delegation: false` means the background PTY lane is disabled in delegate-task.
- configs.json should be "configurable via hf-workflows and hf-commands" — meaning hf-* primitives can modify it safely, not just the CLI.
- The subscription-based binding means: when configs.json changes, consumers that subscribed to specific fields get notified. This could be as simple as re-reading configs after each user prompt (which the skeleton already specifies).

</specifics>

<deferred>
## Deferred Ideas

- `.planning/` → `.hivemind/plannings/` migration (D-2 from tracking index, OPEN — major migration effort)
- Sidecar UI specifics (WS-8, blocked on Core + Workflows)
- Long-haul session survival strategy (WS-7, blocked on WS-6 trajectory)
- Graph-based delegation with checkpoints (GAP-22, blocked on WS-5 delegation revamp)
- MCP tool integration registry (GAP-06 partial, blocked on WS-3 primitive registry)
- Permission compiler per-agent tool access (GAP-07, blocked on WS-3)
- validate-restart drift detection completion (GAP-10, partial — needs WS-3)

</deferred>

---

*Phase: WS-1 Restructuring — Hivemind State Architecture*
*Context gathered: 2026-05-06*
