# src/governance/ — Planning Projection

Minimal module. Projects trajectory and workflow state into planning artifacts.

## Boundary

| File | Purpose |
|------|---------|
| `planning-projection.ts` | `createPlanningGovernanceProjection()` — aggregates trajectory + workflow state |

## Design

- Reads from `core/trajectory/` and `core/workflow-management/`
- Writes projection to `.hivemind/state/planning/`
- Consumed by the `hm-init` and `hm-doctor` control-plane handlers
