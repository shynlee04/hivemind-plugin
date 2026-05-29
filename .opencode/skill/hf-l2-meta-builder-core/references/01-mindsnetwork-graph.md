# MINDNETWORK Graph — Structure and Semantics

## What Is MINDNETWORK

MINDNETWORK is a **hierarchical relational graph** that models multi-agent workflows as traversable node-edge structures. It replaces ad-hoc routing with deterministic execution paths.

## Node Types

### 1. Orchestrator Node (root)
- **Purpose:** Entry point for all meta-builder work
- **Skill:** `meta-builder` (this skill)
- **Behavior:** Receives user intent, determines entry node, initializes traversal
- **State:** Tracks active_node, completed_nodes[], failed_nodes[]

### 2. Skill Node (Layer 1-4)
- **Purpose:** Wraps an existing OpenCode skill as a graph node
- **Examples:** `user-intent-interactive-loop`, `hm-planning-persistence`, `coordinating-loop`, `use-authoring-skills`
- **Behavior:** Loads the skill, executes within its workflow, reports completion
- **State:** Inherits the skill's internal state (question counts, gate status, etc.)

### 3. Validation Node
- **Purpose:** Checks that all dependent nodes completed successfully
- **Behavior:** Runs validate-graph.sh, checks completed_nodes[], verifies no orphans
- **State:** Reports pass/fail, triggers rollback on failure

### 4. Terminal Node
- **Purpose:** Final delivery confirmation
- **Behavior:** Saves checkpoint, reports to user, offers adjustments
- **State:** Marks traversal as complete

## Edge Types

### PARENT_OF
Hierarchical delegation. Parent node spawns child node for sub-work.
```
root ──PARENT_OF──▶ intent-clarifier
```
- Parent retains control of user relationship
- Child executes scoped task, reports back
- Parent aggregates child results

### DEPENDS_ON
Sequential dependency. Node B cannot start until Node A completes.
```
intent-clarifier ──DEPENDS_ON──▶ planner
```
- Blocking dependency
- If A fails, B never starts
- Rollback: if A fails after B started, B is cancelled

### SEQUENCES_WITH
Ordered execution. A then B, but B can start as soon as A finishes.
```
planner ──SEQUENCES_WITH──▶ coordinator
```
- Non-blocking sequence
- B starts immediately after A completes
- Used for pipeline-style workflows

### PARALLEL_TO
Independent execution. A and B run simultaneously.
```
coordinator ──PARALLEL_TO──▶ author
```
- No shared state between nodes
- Both must complete before next sequential node
- If one fails, the other continues

## Graph Traversal Algorithm

```
TRAVERSE(graph, start_node):
  1. Mark start_node as active
  2. Execute start_node's skill workflow
  3. Check start_node's VALIDATES conditions
  4. If FAIL:
     a. Add to failed_nodes[]
     b. Rollback to most recent completed node
     c. Retry with modified approach (max 3)
     d. If 3rd failure → escalate to user
  5. If PASS:
     a. Add to completed_nodes[]
     b. Find all edges FROM this node
     c. For each edge:
        - If PARALLEL_TO: dispatch both nodes simultaneously
        - If SEQUENCES_WITH: traverse to next node
        - If DEPENDS_ON: verify dependency met, then traverse
        - If PARENT_OF: delegate to child, await return
  6. If no more edges → traverse to terminal node
  7. Save checkpoint
```

## Graph JSON Schema

The graph is stored as `.meta-builder/graph.json`:

```json
{
  "version": "1.0.0",
  "name": "meta-builder-mindsnetwork",
  "nodes": [
    {
      "id": "unique-node-id",
      "type": "orchestrator|skill-node|validation-node|terminal-node",
      "label": "human-readable-name",
      "skill": "skill-name-if-applicable",
      "execute_conditions": ["condition1", "condition2"],
      "validates": ["check1", "check2"],
      "depends_on": ["other-node-id"],
      "metadata": {
        "layer": "0-4",
        "role": "orchestrator|front-agent|persistent-memory|coordinator|domain-execution",
        "parallel": true|false,
        "max_retries": 3
      }
    }
  ],
  "edges": [
    {
      "from": "source-node-id",
      "to": "target-node-id",
      "type": "PARENT_OF|DEPENDS_ON|SEQUENCES_WITH|PARALLEL_TO",
      "condition": "when-this-edge-applies"
    }
  ],
  "state": {
    "active_node": null,
    "completed_nodes": [],
    "failed_nodes": [],
    "traversal_path": [],
    "last_checkpoint": null,
    "session_id": null,
    "created_at": null,
    "updated_at": null
  }
}
```

## Node Execution Conditions

Conditions determine which edges to traverse:

| Condition | Triggers When |
|-----------|--------------|
| `user_intent_received` | User sends any message to meta-builder |
| `intent_ambiguous` | User request lacks scope, success criteria, or constraints |
| `intent_confirmed` | User has confirmed what they want |
| `needs_domain_research` | Task requires investigation of unfamiliar domain |
| `multi_step_task` | Task has 2+ discrete steps |
| `needs_persistent_memory` | Task spans sessions or involves subagents |
| `multiple_tasks` | 2+ independent units of work identified |
| `needs_dispatch` | Tasks should be delegated to subagents |
| `creating_skill` | User wants to create a new skill |
| `auditing_skill` | User wants to review an existing skill |
| `doctoring_skill` | User wants to fix a broken skill |
| `phase_complete` | Current node's work is done |
| `all_nodes_complete` | All traversable nodes have completed |

## Validation Checks

Each node defines what "done" looks like via `validates` array:

| Node | Validation Checks |
|------|------------------|
| root | intent_parsed, graph_initialized |
| intent-clarifier | intent_confirmed, scope_bounded, success_defined |
| researcher | findings_documented, patterns_identified |
| planner | task_plan_exists, goal_defined, phases_structured |
| coordinator | envelopes_valid, gates_passed |
| author | skill_valid, no_overlaps, critic_approved |
| validator | all_dependent_nodes_complete, no_orphaned_nodes |
| terminal | user_confirmed_delivery |
