# src/governance/ — Planning Projection

Minimal module. Projects trajectory and workflow state into planning artifacts.

## Boundary

| File | Purpose |
|------|---------|
| `planning-projection.ts` | `createPlanningGovernanceProjection()` — aggregates trajectory + workflow state |

## Design

- Reads from `core/trajectory/` and `core/workflow-management/`
- Writes projection to `.hivemind/project/planning/trajectory-projections/`
- Consumed by the `hm-init` and `hm-doctor` control-plane handlers
- **User consent**: Automatic during command execution; projections are internal state
