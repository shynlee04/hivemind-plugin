# Discussion Log: WS-1 Hivemind State Architecture Restructuring

**Date:** 2026-05-06
**Type:** Architectural restructuring discussion

## Areas Discussed

### Area 1: configs.json Field Redesign
- **Presented:** 4 options for handling the `mode` field (keep with profiles, replace with flags, hybrid presets+overrides, delete entirely)
- **User chose:** Keep 3 modes with defined behavioral profiles. `user-expert-level` impacts front-facing agent output styles. Referenced skeleton v2 §9.1 and poor-prompts file as canonical sources.
- **Key insight:** The skeleton v2 already specified a MUCH richer configs.json than what WS-1 implemented. WS-1 only did the 5-field minimal; skeleton has `workflow` object with ~15 nested toggles plus `parallelization`, `atomic_commit`, `commit_docs`.

### Area 2: Workstream Consolidation
- **Presented:** 4 options for restructuring 5 workstreams (merge all into one, two active, three themed, fix WS-1 only)
- **User chose:** Three themed workstreams
- **Follow-up:** 3 grouping options presented
- **User chose:** Core Architecture + Agent Workflows + User Experience
  - Core: HER + WS-1 fixes + WS-3 + configs runtime binding
  - Workflows: WS-4 + WS-5 + WS-6
  - Experience: WS-2 + WS-7 + WS-8

### Area 3: Schema-to-Runtime Binding Model
- **Presented:** 4 options (RuntimeContext module, distributed reads, plugin composition root)
- **User chose:** Fine-grained granularity with different runtimes/event subscriptions. Utilize both Hivemind plugin AND OpenCode SDK. Not a single point but a subscription model.

### Area 4: CRUD/Query Operation Lifecycle
- **Presented:** 4 options (hooks read/tools write, CLI bootstraps/hf modifies/hm reads, module ownership with CRUD APIs)
- **User chose:** Combination of hooks-read/tools-write + CLI-bootstraps/hf-modifies/hm-reads. Agents are the functional units in the f-04 auto-routing system.

## Decisions Locked

| ID | Decision | Area |
|----|----------|------|
| D-CONF-01 | Keep 3 modes with behavioral profiles | configs.json |
| D-CONF-02 | user-expert-level impacts front-facing agent output style | configs.json |
| D-CONF-03 | workflow toggles control separate runtime features | configs.json |
| D-CONF-04 | configs.json must match skeleton v2 §9.1 full schema | configs.json |
| D-CONF-05 | Loading rules: session start + per-prompt reload | configs.json |
| D-WS-01 | Three themed workstreams | consolidation |
| D-WS-02 | milestone SUSPENDED, skill-ecosystem/agent-synthesis CLOSED | consolidation |
| D-WS-03 | Dependency: Core → Workflows → Experience | consolidation |
| D-BIND-01 | Subscription-based config binding, not single module | binding |
| D-BIND-02 | Binding at plugin.ts, hooks, tools, skills, transforms | binding |
| D-BIND-03 | Every config field must have a concrete src/ consumer | binding |
| D-CRUD-01 | CLI bootstraps initial state | CRUD |
| D-CRUD-02 | Hooks read at runtime events | CRUD |
| D-CRUD-03 | Custom tools write state | CRUD |
| D-CRUD-04 | hf-*/hm-* agents are f-04 auto-routing units | CRUD |
| D-CRUD-05 | Each subdirectory has owning module with typed CRUD | CRUD |
| D-LIFECYCLE-01 | Files created only via tools or engines | lifecycle |
| D-LIFECYCLE-02 | Artifacts must integrate with 2+ lifecycle aspects | lifecycle |

## Files Referenced During Discussion

1. `.planning/SKELETON-TRACKING-INDEX.md` — User provided
2. `.planning/SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2-2026-05-06.md` — User provided
3. `.planning/MASTER-PROJECT-SKELETON.md` — User provided
4. `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` — User provided (lines 68-108 for configs.json, lines 110-159 for directory structure)

## Deferred Ideas

- .planning/ → .hivemind/plannings/ migration
- Sidecar UI specifics
- Long-haul session survival
- Graph-based delegation
- MCP tool integration registry
- Permission compiler
- validate-restart drift detection

---

*Discussion completed: 2026-05-06*
