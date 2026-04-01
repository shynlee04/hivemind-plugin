# Planning Lifecycle

## Phase 1: Plan Validation
Validate spec candidate before committing to a plan.
- Completeness: all 5 requirement buckets populated
- Feasibility: target files/modules exist
- Constraints: resource limits, timeline, dependencies
- Ambiguity residual: any HIGH-IMPACT ambiguity → BLOCK

## Phase 2: Phase Decomposition
Break into executable phases.
- Each phase: ≤3 concerns, ≤5 files, explicit gate
- Phases numbered 01-99 (2-digit, spaced for insertion)
- Parallel-safe phases flagged

## Phase 3: Dependency Mapping
Build dependency graph.
- DAG construction
- Critical path identification
- Parallel candidate independence proof

## Phase 4: Execution Tracking
Track with evidence.
- Phase status: pending/in-progress/complete/blocked
- Carry-forward: ≤5 key findings + blockers + paths
- Phase transition gate: tests + build + types

## Phase 5: Retraceability
Link decisions to evidence.
- Every decision → git commit SHA, delegation packet ID
- Hierarchy: Plan → Phase → Slice → Packet → Return → Commit
