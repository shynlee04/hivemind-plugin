# Dependency Ordering — Graph Construction and Wave Sequencing

## Building the Dependency Graph

### Node Identification

Each slice is a node. Nodes have:

- `slice_id` — unique identifier
- `concern` — read | write | verify
- `in_scope` — files this slice touches
- `depends_on` — explicit dependencies (from spec analysis)
- `blocks` — slices that depend on this one

### Edge Types

| Edge Type | Condition | Direction |
|---|---|---|
| `output-feeds` | Slice A's output is Slice B's input | A → B |
| `file-conflict` | A and B modify the same file | Order by concern: read → write → verify |
| `import-dependency` | B imports from A's target (when A modifies it) | A → B |
| `explicit` | Plan states "do B after A" | A → B |

### Cycle Detection

If the graph has a cycle, decomposition is invalid. Break the cycle by:

1. Extract the shared concern into its own slice
2. Make both original slices depend on the shared slice
3. Re-run dependency analysis

## Topological Sort

### Kahn's Algorithm

```
1. Compute in-degree for each node
2. Queue all nodes with in-degree 0
3. While queue is not empty:
   a. Pop node N
   b. Emit N into current wave
   c. For each neighbor M of N:
      - Decrement M's in-degree
      - If M's in-degree reaches 0, enqueue M
4. If remaining nodes exist → cycle detected
```

### Wave Construction

Waves are natural boundaries for delegation batches.

| Wave | Contents | Dispatch Mode |
|---|---|---|
| Wave 0 | All in-degree-0 nodes | Parallel (if independent) |
| Wave N | Nodes whose dependencies were in Wave N-1 | Parallel (if independent) |
| Final | Verification-only nodes | Sequential or parallel |

## Parallel Independence Proof

Before dispatching a wave in parallel, verify every pair:

1. **No shared files:** `A.in_scope ∩ B.in_scope = ∅`
2. **No shared types:** Neither imports types the other modifies
3. **No output chain:** Neither produces output the other consumes
4. **No directory conflict:** Different directories or non-overlapping file sets

If ANY check fails, dispatch sequentially within the wave.

## Critical Path

The longest chain of dependent slices. Example:

```
A → B → D → F (length 4, critical path)
A → C → E     (length 3)
```

Critical path length = minimum sequential execution time (in waves).
Parallel candidates reduce wall-clock time but not total work.

## Example

```
Slices: {alpha, beta, gamma, delta, epsilon, verify}
Edges:  alpha → beta, alpha → gamma, beta → delta,
        gamma → delta, delta → epsilon, epsilon → verify

Wave 0: [alpha]           (in-degree 0)
Wave 1: [beta, gamma]     (both depend only on alpha — parallel)
Wave 2: [delta]           (depends on both beta AND gamma)
Wave 3: [epsilon]         (depends on delta)
Wave 4: [verify]          (depends on epsilon)

Critical path: alpha → beta → delta → epsilon → verify (5 waves)
```
