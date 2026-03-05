# Task Plan: Multi-Agent Architecture Refactoring

## Goal
Validate, audit, and refactor the multi-agent architecture across 4 domains (Schema, Orchestration, Intent Clarification, and Tool Governance) iteratively using guardrails, matching the implementation dependency graph.

## Current Phase
Phase 1: Requirements & Discovery (Codebase Audit)

## Phases

### Phase 1: Requirements & Discovery (Codebase Audit)
- [ ] Audit Domain 1 foundation (cognitive-packer.ts, schemas)
- [ ] Audit Domain 2 foundation (orchestrator roles, state mutation queue)
- [ ] Audit Domain 3 foundation (clarify loop, session export, injection hooks)
- [ ] Audit Domain 4 foundation (tool detection, gatekeeper)
- [ ] Document findings in findings.md
- **Status:** complete

### Phase 2: Context Integrity Protocols (Domain 3)
- [ ] Implement injection-budget.ts
- [ ] Refactor session-lifecycle.ts and messages-transform.ts to use shared budget
- **Status:** pending

### Phase 3: Ancestor Traversal Enforcement (Domain 1)
- [ ] Implement validateAncestorChain() in hierarchy-tree.ts
- [ ] Refactor map-context.ts to validate parent chain
- **Status:** pending

### Phase 4: Tool Governance Matrix (Domain 4)
- [ ] Add ToolGovernancePolicy type to tool-gate.ts
- [ ] Refactor tool-gate.ts for role-gated enforcement
- **Status:** pending

### Phase 5: Deterministic Triggers (Domain 4)
- [ ] Add pending_mandatory_tools tracking to soft-governance.ts or BrainState
- [ ] Refactor soft-governance.ts for mandatory tool tracking
- **Status:** pending

### Phase 6: Schema Introspection (Domain 1)
- [ ] Add introspect action to hivemind-inspect.ts
- **Status:** pending

### Phase 7: State Tracking & Role Protocols (Domain 2)
- [ ] Add CHECKPOINT mutation type to state-mutation-queue.ts
- [ ] Add role-boundary violation detection (out_of_order) in soft-governance.ts
- **Status:** pending

## Key Questions
1. How tightly coupled are the hooks (session-lifecycle.ts, messages-transform.ts)?
2. Does the BrainState schema need additional modifications beyond pending_mandatory_tools?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Dependency Graph First | The user provided a 12-step dependency graph which serves as the safest structural roadmap without disrupting existing plugins. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions
- Log ALL errors
