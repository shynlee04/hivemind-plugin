# Design Spec: Meta-Builder MINDNETWORK Rewrite

**Date:** 2026-04-04
**Status:** Implemented
**Author:** HIVEMIND V3 Architecture Team

## Overview

Complete rewrite of the `meta-builder` skill from a thin Layer 0 router to a **hierarchical relational graph MINDNETWORK orchestrator** that manages long-horizon cross-session projects with deterministic control over agent behaviors, tool selection, and workflow execution.

## Architecture

### MINDNETWORK Graph

The meta-builder operates as a traversable graph where:
- **Nodes** = Skills/agents (root, intent-clarifier, researcher, planner, coordinator, author, validator, terminal)
- **Edges** = Relationships (PARENT_OF, DEPENDS_ON, SEQUENCES_WITH, PARALLEL_TO)
- **Traversal** = Deterministic execution following node protocols

### Execution Model

```
User Intent → Graph Root → Determine Entry Node → Traverse Graph → Validate → Deliver
```

Every node follows: PRE-EXECUTION (check deps, load skill) → EXECUTION (within skill's workflow) → POST-EXECUTION (validate, checkpoint, traverse)

### State Persistence

Dual-layer:
1. **Planning Triplet** (human-readable): task_plan.md, findings.md, progress.md
2. **MINDNETWORK State** (machine-readable): checkpoint.json, session snapshots, question tracking

## Files Created/Modified

### New Files
- `.opencode/skills/meta-builder/SKILL.md` (304 lines) — Main orchestrator skill
- `.opencode/skills/meta-builder/.meta-builder/graph.json` — MINDNETWORK graph definition (8 nodes, 11 edges)
- `.opencode/skills/meta-builder/.meta-builder/graph-schema.json` — Graph schema reference
- `.opencode/skills/meta-builder/.meta-builder/state/checkpoint.json` — Traversal state
- `.opencode/skills/meta-builder/.meta-builder/state/question-count.json` — Question tracking
- `.opencode/skills/meta-builder/.meta-builder/state/session-stack.json` — Fork history
- `.opencode/skills/meta-builder/scripts/graph-init.sh` — Graph initialization
- `.opencode/skills/meta-builder/scripts/graph-traverse.sh` — Graph traversal
- `.opencode/skills/meta-builder/scripts/state-persist.sh` — Cross-session state management
- `.opencode/skills/meta-builder/scripts/validate-graph.sh` — Graph structure validation
- `.opencode/skills/meta-builder/references/01-mindsnetwork-graph.md` — Graph structure docs
- `.opencode/skills/meta-builder/references/02-deterministic-control.md` — Execution protocol docs
- `.opencode/skills/meta-builder/references/03-long-horizon-persistence.md` — Session recovery docs
- `.opencode/skills/meta-builder/references/04-skills-chaining.md` — Concept stacking docs
- `.opencode/skills/meta-builder/references/05-hivefiver-agent.md` — Hivefiver agent docs
- `.opencode/agents/hivefiver.md` — Hivefiver orchestrator agent definition

### Modified Files
- `.opencode/agents/coordinator.md` — Added `hivefiver` skill permission, fixed typo `opencode-non-interactive-shel` → `opencode-non-interactive-shell`

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Graph format | JSON | Human-readable, versionable, diffable |
| Traversal | Forward-only with rollback | Prevents infinite loops, enables recovery |
| State persistence | Dual-layer (planning triplet + checkpoint) | Human + machine readable |
| Max skills per stack | 3 | Cognitive limit, prevents overload |
| Max retries per node | 3 | Balance persistence with escalation |
| Scripts | Pure helpers only (exit 0) | Report facts, leave judgment to agent |

## Validation

- `graph-init.sh` → READY=true ✓
- `validate-graph.sh` → VALID=true ✓ (8 nodes, 11 edges, all checks pass)
- `state-persist.sh status` → All state files present ✓
- Scripts executable ✓
- Agent permissions updated ✓

## Success Criteria Met

- [x] MINDNETWORK graph structure defined and validated
- [x] Deterministic execution protocol documented
- [x] Cross-session persistence implemented
- [x] Skills chaining patterns defined (4 recipes)
- [x] Hivefiver orchestrator agent created
- [x] Routing table covers all meta-concept authoring tasks
- [x] Anti-patterns documented with detection/correction
- [x] Platform adaptation table included
- [x] All scripts are pure helpers (exit 0)
