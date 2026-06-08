# Multi-Agent Dispatch Patterns

The 3 dispatch patterns from `hm-coord-loop`. Load this when deciding
which pattern to use.

## Pattern 1: Parallel Dispatch

Tasks share **no files, no state, no ordering constraints**.

### When to use
- Independent code audits
- Parallel data fetches
- Independent file edits in disjoint locations

### Protocol
1. Inventory tasks. Write each as discrete work item: "TASK-1: audit module A"
2. Cap at 5 parallel agents. Beyond 5, batch into waves of 4+4.
3. Dispatch all in one turn via `delegate-task`.
4. Track delegation IDs in a list. Poll for completion.
5. Merge results. If any failed, retry individual / escalate / skip with note.

### Anti-patterns
- Tasks modify the same file → merge conflict guarantee
- Sequential dependencies → use wave or pipeline instead
- One task's output is another's input → use pipeline

## Pattern 2: Wave-Based Dispatch

Tasks form **dependency layers** — wave N+1 needs wave N's results.

### Protocol
1. Map the dependency graph. Identify layers.
2. Set a gate between waves: verify all wave N completed, outputs exist, no cascading errors.
3. Enforce max 3 waves. Beyond 3, reconsider architecture.
4. Checkpoint after each wave. Document what was produced, what's pending.
5. Escalate on gate failure. STOP, do NOT dispatch next wave hoping it fixes.

### Wave gate checklist
- [ ] All wave N agents completed
- [ ] Required output files exist
- [ ] No shared-file conflicts
- [ ] Next wave's inputs are satisfied
- [ ] Human approval if human-gate checkpoint

## Pattern 3: Pipeline (Sequential)

Tasks form a **strict linear chain** — each step consumes previous step's output.

### Protocol
1. Define handoff contract BEFORE dispatching agent 1. Specify exact output format.
2. Dispatch sequentially with verification. Agent 1 → verify → Agent 2 → verify → ...
3. Limit to 5 stages. Longer pipelines become fragile.
4. Mid-pipeline failure: resume from last successful stage with corrected input.

## Decision Flowchart

```
How many tasks?
  ├─ 1 → Do inline
  ├─ 2 → Different domains, no shared state? → Parallel (2 max)
  │       Same domain or shared state? → Do inline or pipeline
  └─ 3+ →
        All independent? → Parallel dispatch
        Clear dependency layers? → Wave-based
        Strict chain? → Pipeline
        Can't tell? → Map dependencies first
```
