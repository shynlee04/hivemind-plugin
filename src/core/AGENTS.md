# src/core/ — State Management

Trajectory ledger, workflow authority, and task lifecycle state.

## Boundary

| Sub-Module | Status | Purpose |
|-----------|--------|---------|
| `trajectory/` | ✅ Active | Trajectory ledger, events, checkpoints, assessment |
| `workflow-management/` | ✅ Active | Workflow authority, task lifecycle, routing, continuity |
| `hierarchy/` | ✅ Active | Hierarchy tree and ancestor chain |
| `planning/` | ✅ Active | Planning framework and materialization |
| `state/` | ✅ Active | State persistence layer |

> [!NOTE]
> `core/session/` was **removed** in L1 cutover (2026-03-15). Session lifecycle is owned by `hooks/start-work/`. Do NOT recreate a session module here — see **Authority Principle** in root AGENTS.md.

## Rules

- Trajectory and workflow modules are the state authority — tools delegate here
- State files live in `.hivemind/` subdirectories (not just `.hivemind/state/`):
  - `.hivemind/state/trajectory-ledger.json` - trajectory events
  - `.hivemind/state/tasks.json` and `.hivemind/graph/tasks.json` - task lifecycle
  - `.hivemind/project/planning/` - planning projections
  - `.hivemind/handoffs/` - delegation handoffs
  - `.hivemind/agent-work-contract/` - work contracts
- All state reads/writes go through store functions, never direct file I/O
- **User consent required** for any tool-triggered writes via `context.ask()`
