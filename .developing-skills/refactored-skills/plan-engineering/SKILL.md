---
name: plan-engineering
description: Manage the full plan lifecycle from validation through execution tracking and retraceability. Use when: creating structured plans from spec candidates, validating plan feasibility against codebase reality, decomposing plans into dependency-ordered phases, tracking execution progress with evidence gates, or building retraceable decision chains linking epic to commit.
---

# plan-engineering

Plan lifecycle management for the HiveMind ecosystem. Governs plan creation from validated specs, phase decomposition with dependency mapping, execution tracking with evidence gates, and harddisk-hierarchical retraceability linking every decision to its source evidence and git commit.

## Purpose

- Validate spec candidates from spec-distillation against codebase feasibility
- Decompose validated plans into dependency-ordered phases with explicit gates
- Map inter-phase dependencies and identify the critical path
- Track execution progress per phase with evidence-based gate verification
- Build retraceable decision chains: Epic → Phase → Slice → Packet → Commit
- Persist plan state to disk for cross-session continuity

## Use This For

- Creating structured plans from distillation output
- Validating plan feasibility before execution begins
- Decomposing multi-concern plans into bounded phases
- Tracking multi-phase execution with gate enforcement
- Building audit trails linking decisions to evidence

## Do Not Use This For

- Requirements extraction from noisy input — use `spec-distillation`
- Task decomposition methodology — use `plan-breakdown`
- Delegation mechanics — use `use-hivemind-delegation`
- Iteration loop control — use `hivemind-gatekeeping-delegation`
- TDD enforcement — use `tdd-delegation` or `tdd-phase-execution`

## Prerequisites

- `use-hivemind-delegation` MUST be loaded — plan execution dispatches through this
- A structured spec candidate must exist (from `spec-distillation` or direct input)

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `spec-distillation` | Upstream — produces spec candidates this skill consumes |
| `plan-breakdown` | Sibling — handles decomposition methodology, this skill manages lifecycle |
| `use-hivemind-delegation` | Base — plan execution dispatches through delegation protocol |
| `hivemind-gatekeeping-delegation` | Loop control — plan validation loops gate through this |
| `hivemind-codemap` | Reference — codebase structure informs plan feasibility |
| `hierarchy-retrace` | Downstream — decision tree index built from plan records |

## Plan Lifecycle

### Phase 1: Plan Validation

Validate the spec candidate before committing to a plan.

- **Completeness check**: All 5 requirement buckets populated (functional, non-functional, integration, risk/operations, operations)
- **Feasibility check**: Delegate to `hivexplorer` to verify target files/modules exist
- **Constraint check**: Resource limits, timeline, dependency availability
- **Ambiguity residual**: Any HIGH-IMPACT ambiguity remaining → BLOCK, return to `spec-distillation`

**Gate**: Plan validation passes only when all 4 checks produce evidence. No claim without JSON proof.

### Phase 2: Phase Decomposition

Break the validated plan into executable phases.

- Each phase: ≤3 concerns, ≤5 files, single explicit gate
- Phases are numbered and dependency-ordered
- Parallel-safe phases flagged with independence proof
- Each phase maps to one or more delegation slices

**Decomposition rules**:
1. Authority surface boundaries first (tools vs hooks vs core vs shared)
2. Concern type second (read-only vs write-capable vs verification)
3. File cluster third (shared imports/interfaces grouped)

**Gate**: Decomposition produces a phase DAG with ≤10 phases, each bounded and testable.

### Phase 3: Dependency Mapping

Build the dependency graph between phases.

- **DAG construction**: Phase A depends on Phase B if A needs B's output
- **Critical path**: Longest dependency chain — determines minimum timeline
- **Parallel candidates**: Phases with zero dependencies or independent slices
- **Conflict detection**: Phases that share authority surfaces marked sequential

**Gate**: Dependency graph is acyclic, critical path identified, parallel candidates have independence proof.

### Phase 4: Execution Tracking

Track progress through phases with evidence gates.

- Each phase has: `status` (pending/in-progress/complete/blocked), `evidence`, `gate_result`
- Carry-forward state between phases: ≤5 key findings + blockers + paths
- Phase transition requires gate passage: all phase tests + prior phase tests + build + types
- Blocked phases return `blocked_routes` and `recommended_next_action`

**Gate**: Phase completion requires evidence bundle: files modified, tests passing, build output.

### Phase 5: Retraceability

Build the decision chain linking plan to execution evidence.

- Every plan decision links to: evidence source, git commit SHA, delegation packet ID
- Hierarchical index: Plan → Phase → Slice → Packet → Return → Commit
- Harddisk persistence at `{project}/.hivemind/activity/planning/`
- Cross-session retrieval via `hierarchy-retrace` index queries

**Gate**: Plan completion requires full chain: every phase has linked commits and delegation returns.

## Plan Record Schema

```json
{
  "_meta": {
    "created_at": "ISO 8601",
    "updated_at": "ISO 8601",
    "plan_id": "plan-{timestamp}-{concern}",
    "source_spec": "path to spec candidate"
  },
  "status": "validated | decomposing | executing | complete | blocked",
  "validation": {
    "completeness": { "functional": true, "non_functional": true, "integration": true, "risk": true, "operations": true },
    "feasibility": { "target_exists": true, "evidence": "file:line references" },
    "constraints": { "resource_limits": "...", "timeline": "...", "dependencies": "..." },
    "ambiguity_residual": []
  },
  "phases": [
    {
      "phase_id": "phase-001",
      "name": "Foundation",
      "concerns": ["auth", "types"],
      "files": ["src/core/auth.ts", "src/shared/types.ts"],
      "dependencies": [],
      "parallel_safe": true,
      "status": "pending",
      "gate_command": "npx tsc --noEmit && npm test",
      "evidence": null,
      "linked_packets": [],
      "linked_commits": []
    }
  ],
  "dependency_graph": {
    "critical_path": ["phase-001", "phase-003", "phase-005"],
    "parallel_waves": [["phase-001", "phase-002"], ["phase-003"]],
    "edges": [{ "from": "phase-003", "to": "phase-001", "type": "depends-on" }]
  },
  "carry_forward": [],
  "retraceability": {
    "decisions": [],
    "commit_chain": [],
    "audit_trail": []
  }
}
```

## Gate Protocol

| Gate | Phase | Pass Condition | Evidence Required |
|------|-------|----------------|-------------------|
| Validation Gate | Phase 1 | All 4 checks pass | JSON proof per check |
| Decomposition Gate | Phase 2 | ≤10 phases, each bounded | Phase DAG JSON |
| Dependency Gate | Phase 3 | Acyclic graph, critical path | Dependency graph JSON |
| Execution Gate | Per-phase | Tests + build + prior tests pass | Command output |
| Completion Gate | Phase 5 | Full chain linked | Chain audit JSON |

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Skipping validation gate | Plans built on infeasible assumptions |
| Phases with >5 files | Unbounded scope → delegation failure |
| Circular dependencies | Infinite execution loop |
| No carry-forward between phases | Context loss → duplicate work |
| Claiming complete without chain | No auditability — decisions unretraceable |
| Planning without spec input | Building on ambiguous requirements |
| Parallel phases sharing authority surfaces | Integration conflicts at merge |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/plan-lifecycle.md` | Detailed lifecycle walkthrough with worked examples |
| `templates/plan-record.md` | JSON template for plan records |

## Independence Rules

- Self-contained for plan lifecycle management
- Consumes spec candidates from `spec-distillation`
- Dispatches execution through `use-hivemind-delegation`
- Does not duplicate delegation mechanics or TDD enforcement
- Plan records stored at `{project}/.hivemind/activity/planning/` at runtime
