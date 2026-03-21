# Module Inventory with Dependency Ordering

**Created:** 2026-03-21
**Phase:** 03-tui-e2e-server-connection
**Purpose:** Canonical module list with dependency ordering for Phase 3+ execution

---

## Module Catalog

All source modules from `src/` are cataloged below with their paths, purposes, and dependencies.

### Tool Modules (src/tools/)

| Module | Path | Purpose |
|--------|------|---------|
| Runtime Tools | `src/tools/runtime/` | Runtime status inspection and command execution (`hivemind_runtime_status`, `hivemind_runtime_command`) |
| Task Tools | `src/tools/task/` | Task management tool surface |
| Trajectory Tools | `src/tools/trajectory/` | Trajectory tracking tool surface |
| Handoff Tools | `src/tools/handoff/` | Delegation/handoff tool surface |
| Doc Tools | `src/tools/doc/` | Doc intelligence tool surface |
| Tools Barrel | `src/tools/index.ts` | Tool module barrel export |

### SDK Supervisor (src/sdk-supervisor/)

| Module | Path | Purpose |
|--------|------|---------|
| Instance Registry | `src/sdk-supervisor/instance-registry.js` | Supervisor instance registry creation |
| Health | `src/sdk-supervisor/health.js` | Aggregate supervisor health summaries |
| Runtime Status | `src/sdk-supervisor/runtime-status.js` | Runtime-status snapshots combining schema-kernel + supervisor health |

### Hooks (src/hooks/)

| Module | Path | Purpose |
|--------|------|---------|
| Start Work | `src/hooks/start-work/` | Session lifecycle entry — purpose classification, lineage, readiness gates |
| Runtime Loader | `src/hooks/runtime-loader/` | Post-tool state observation via `tool.execute.after` |
| Workflow Integration | `src/hooks/workflow-integration/` | Workflow context injection via `session.compacting` |
| Auto Slash Command | `src/hooks/auto-slash-command/` | Auto-detect and route slash commands |
| SDK Context | `src/hooks/sdk-context.js` | Cached client/shell references |
| Event Handler | `src/hooks/event-handler.js` | Event handling |
| Soft Governance | `src/hooks/soft-governance.js` | Lightweight non-blocking notifications |
| Hooks Barrel | `src/hooks/index.ts` | Hook layer barrel export |

### Schema Kernel (src/schema-kernel/)

| Module | Path | Purpose |
|--------|------|---------|
| Schema Kernel | `src/schema-kernel/index.ts` | Additive Phase 1 contract authority for persisted records |

### Control Plane (src/control-plane/)

| Module | Path | Purpose |
|--------|------|---------|
| Control Plane | `src/control-plane/index.ts` | Gate/intake system for CLI commands |

### Core (src/core/)

| Module | Path | Purpose |
|--------|------|---------|
| Trajectory | `src/core/trajectory/` | Trajectory state management |
| Workflow Management | `src/core/workflow-management/` | Workflow state management |
| Core Barrel | `src/core/index.ts` | Core barrel export |

### Shared (src/shared/)

| Module | Path | Purpose |
|--------|------|---------|
| Paths | `src/shared/paths.js` | Centralized path builders |
| Tool Response | `src/shared/tool-response.js` | Standard response format |
| Logging | `src/shared/logging.js` | Logging utilities |
| Runtime Attachment | `src/shared/runtime-attachment.js` | Settings load/save + runtime bindings |
| Entry Kernel State | `src/shared/entry-kernel-state.js` | Entry lifecycle state |
| OpenCode Knowledge | `src/shared/opencode-knowledge.js` | OpenCode-specific knowledge surfaces |
| OpenCode Agent Registry | `src/shared/opencode-agent-registry.js` | Agent parsing + runtime projection |
| OpenCode Skill Registry | `src/shared/opencode-skill-registry.js` | Skill registry |
| Lifecycle Spine | `src/shared/lifecycle-spine.js` | Shared lifecycle identities |
| Pressure Contract | `src/shared/pressure-contract.js` | Pressure contract registry |
| Bootstrap Profile | `src/shared/bootstrap-profile.js` | User profile normalization |
| Tool Helpers | `src/shared/tool-helpers.js` | Shared JSON/list helpers for tools |
| Intake Record | `src/shared/intake-record.js` | Intake record utilities |
| Shared Barrel | `src/shared/index.ts` | Shared utilities barrel export |

### Context (src/context/)

| Module | Path | Purpose |
|--------|------|---------|
| Prompt Packet | `src/context/prompt-packet/` | Prompt packet compilation and rendering |
| Context Barrel | `src/context/index.ts` | Context barrel export |

### Commands (src/commands/)

| Module | Path | Purpose |
|--------|------|---------|
| Slash Command | `src/commands/slash-command/` | Slash-command bundle registry and execution |
| Commands Barrel | `src/commands/index.ts` | Commands barrel export |

### Intelligence (src/intelligence/)

| Module | Path | Purpose |
|--------|------|---------|
| Doc Intelligence | `src/intelligence/doc/` | Doc surface routing + markdown-first read foundation |
| Intelligence Barrel | `src/intelligence/index.ts` | Intelligence barrel export |

### Delegation (src/delegation/)

| Module | Path | Purpose |
|--------|------|---------|
| Delegation | `src/delegation/index.ts` | Handoff packet creation and store |

### Recovery (src/recovery/)

| Module | Path | Purpose |
|--------|------|---------|
| Recovery | `src/recovery/index.ts` | State assessment, checkpoint, repair |

### Governance (src/governance/)

| Module | Path | Purpose |
|--------|------|---------|
| Governance | `src/governance/index.ts` | Planning projection (minimal) |

### Features (src/features/)

| Module | Path | Purpose |
|--------|------|---------|
| Runtime Observability | `src/features/runtime-observability/` | Runtime status building for supervisor |
| Session Entry | `src/features/session-entry/` | Session entry feature |
| Workflow | `src/features/workflow/` | Workflow feature |
| Trajectory | `src/features/trajectory/` | Trajectory feature |
| Handoff | `src/features/handoff/` | Handoff feature |
| Doc Intelligence | `src/features/doc-intelligence/` | Doc intelligence feature |
| Agent Work Contract | `src/features/agent-work-contract/` | Agent work contract feature |
| Runtime Entry | `src/features/runtime-entry/` | Runtime entry feature |

### Plugin (src/plugin/)

| Module | Path | Purpose |
|--------|------|---------|
| Plugin | `src/plugin/index.ts` | Assembly + enforcement wiring |

### CLI (src/cli/)

| Module | Path | Purpose |
|--------|------|---------|
| CLI | `src/cli/` | CLI entrypoint and command routing |

### TUI (src/tui/)

| Module | Path | Purpose |
|--------|------|---------|
| TUI | `src/tui/` | Terminal user interface |

---

## Dependency Map

### Forward Dependencies (what each module depends on)

| Module | Depends On |
|--------|------------|
| `src/tools/runtime/` | `src/shared/tool-helpers.js`, `src/features/runtime-observability/` |
| `src/tools/task/` | `src/shared/tool-helpers.js` |
| `src/tools/trajectory/` | `src/shared/tool-helpers.js` |
| `src/tools/handoff/` | `src/shared/tool-helpers.js` |
| `src/tools/doc/` | `src/shared/` |
| `src/sdk-supervisor/` | `src/schema-kernel/` |
| `src/hooks/start-work/` | `src/shared/`, `src/core/` |
| `src/hooks/runtime-loader/` | `src/shared/` |
| `src/hooks/workflow-integration/` | `src/shared/`, `src/core/workflow-management/` |
| `src/hooks/auto-slash-command/` | `src/shared/` |
| `src/features/runtime-observability/` | `src/shared/`, `src/schema-kernel/` |
| `src/features/runtime-entry/` | `src/shared/`, `src/sdk-supervisor/` |
| `src/features/session-entry/` | `src/shared/` |
| `src/features/workflow/` | `src/shared/`, `src/core/workflow-management/` |
| `src/features/trajectory/` | `src/shared/`, `src/core/trajectory/` |
| `src/features/handoff/` | `src/shared/`, `src/delegation/` |
| `src/features/doc-intelligence/` | `src/shared/`, `src/intelligence/doc/` |
| `src/core/trajectory/` | `src/shared/` |
| `src/core/workflow-management/` | `src/shared/` |
| `src/plugin/` | `src/hooks/`, `src/tools/`, `src/sdk-supervisor/` |
| `src/control-plane/` | `@opencode-ai/sdk` (control plane plane only) |
| `src/cli/` | `@opencode-ai/sdk` (control plane plane only) |

### Reverse Dependencies (what depends on each module)

| Module | Consumed By |
|--------|-------------|
| `src/shared/` | All modules (universal utility layer) |
| `src/schema-kernel/` | `src/sdk-supervisor/`, `src/features/runtime-observability/` |
| `src/core/trajectory/` | `src/features/trajectory/` |
| `src/core/workflow-management/` | `src/features/workflow/`, `src/hooks/workflow-integration/` |
| `src/delegation/` | `src/features/handoff/` |
| `src/intelligence/doc/` | `src/features/doc-intelligence/` |
| `src/sdk-supervisor/` | `src/features/runtime-entry/`, `src/plugin/` |
| `src/hooks/` | `src/plugin/` |
| `src/tools/` | `src/plugin/` |

---

## Execution Order

Following the sequencing heuristic: **"Modules with fewer dependencies first"** and **"Modules that downstream phases depend on take priority"**

### Sequence Numbering

| Order | Module | Rationale |
|-------|--------|-----------|
| 1 | `src/shared/` | Foundation — all modules depend on it, zero forward deps |
| 2 | `src/schema-kernel/` | Contract authority — few deps, high downstream consumption |
| 3 | `src/sdk-supervisor/` | Orchestration control — depends on schema-kernel |
| 4 | `src/hooks/` | Read-side intercept — independent hooks ready after shared |
| 5 | `src/tools/runtime/` | Runtime entry tools — key Phase 3 module, first tool |
| 6 | `src/tools/task/` | Task tools — parallel with other tools |
| 7 | `src/tools/trajectory/` | Trajectory tools — parallel with other tools |
| 8 | `src/tools/handoff/` | Handoff tools — parallel with other tools |
| 9 | `src/tools/doc/` | Doc tools — parallel with other tools |
| 10 | `src/core/trajectory/` | Trajectory state — depends on shared |
| 11 | `src/core/workflow-management/` | Workflow state — depends on shared |
| 12 | `src/delegation/` | Delegation — depends on shared |
| 13 | `src/intelligence/doc/` | Doc intelligence core |
| 14 | `src/commands/` | Command system — depends on hooks and tools |
| 15 | `src/context/` | Context compilation — depends on shared |
| 16 | `src/features/runtime-observability/` | Runtime observability feature — depends on schema-kernel + shared |
| 17 | `src/features/runtime-entry/` | Runtime entry feature — depends on sdk-supervisor |
| 18 | `src/features/session-entry/` | Session entry feature |
| 19 | `src/features/workflow/` | Workflow feature — depends on core/workflow |
| 20 | `src/features/trajectory/` | Trajectory feature — depends on core/trajectory |
| 21 | `src/features/handoff/` | Handoff feature — depends on delegation |
| 22 | `src/features/doc-intelligence/` | Doc intelligence feature |
| 23 | `src/features/agent-work-contract/` | Agent work contract — depends on hooks and tools |
| 24 | `src/plugin/` | Plugin assembly — depends on all hooks, tools, supervisor |
| 25 | `src/control-plane/` | Control plane — control plane plane only |
| 26 | `src/cli/` | CLI entry — control plane plane only |
| 27 | `src/tui/` | Terminal UI — depends on plugin and shared |
| 28 | `src/recovery/` | Recovery — depends on core and shared |
| 29 | `src/governance/` | Governance planning projection |

### Sequence Summary

**Phase 3 Execution Sequence:**
1. `src/shared/` — Foundation
2. `src/schema-kernel/` — Contract authority
3. `src/sdk-supervisor/` — Orchestration control
4. `src/hooks/` — Hook system
5. `src/tools/runtime/` — Runtime entry tools (Phase 3 first module slice)
6. `src/tools/task/` — Task tools
7. `src/tools/trajectory/` — Trajectory tools
8. `src/tools/handoff/` — Handoff tools
9. `src/tools/doc/` — Doc tools
10-14: `src/core/`, `src/delegation/`, `src/intelligence/`, `src/commands/`, `src/context/`
15-23: Feature modules
24-29: Plugin assembly, CLI, control-plane, TUI, recovery, governance

---

## Inheritance Contract

This MODULE-INVENTORY establishes the binding execution sequence for all future Phase 3+ module completion work.

### Sequencing Rule

Future phases **MUST** follow the dependency-ordered sequence above when completing module slices. If a phase wishes to deviate from the sequence, it **MUST** provide explicit justification in the phase planning document and receive approval through the phase governance process.

### Bounded Slice Rule

Each module **MUST** be completed as one bounded slice before starting the next. A bounded slice includes:
- Source ownership clarity (files in correct directories)
- Integration path definition (how data/control flows in and out)
- Validation evidence (proof standards met)

### Evidence Inheritance

Each module slice **MUST** reference and comply with the evidence lane standards defined in `BOUNDED-SLICE-TEMPLATE.md`:
- **Local diagnostics** (VER-01): Type checking, linting
- **Integration checks** (VER-02): Module integration tests
- **Live official-interface proof** (VER-03): Real OpenCode runtime verification

### Blocking Rule

A module slice is **NOT complete** until:
1. All source ownership is unambiguous
2. Integration paths are documented and tested
3. Validation evidence meets the required proof standard for the evidence lane
4. Runtime-facing completion claims have **either**:
   - Live official-interface proof (preferred), OR
   - Explicit `[non-live evidence]` labeling with justification

### Contract Binding

This contract is **binding** on:
- Phase 4 and beyond
- All module completion slices
- All execution agents

Unless explicitly amended by a new Phase 3+ iteration that re-validates the methodology and updates this inventory.

---

## References

- **Sequencing Heuristic:** Modules with fewer dependencies first; modules that downstream phases depend on take priority
- **Bounded Slice Pattern:** Choose one module → finish ownership + integration → validate → authorize next
- **Evidence Standards:** VER-01 (local diagnostics), VER-02 (integration checks), VER-03 (live official-interface proof)
- **Template:** See `BOUNDED-SLICE-TEMPLATE.md` for the standard slice structure
