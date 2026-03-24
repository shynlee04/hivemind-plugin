---
name: hierarchy-retrace
description: |
  Decision tree traversal and retraceability for the Epic→Phase→Slice→Packet→Commit hierarchy. Use when: tracing a decision back to its source evidence, forward-tracing a plan to all its execution artifacts, cross-session decision retrieval, audit trail generation for any workflow, or finding which commit resulted from which delegation. Provides hierarchical indexing, persistence, and query over the full decision chain.
---

# hierarchy-retrace

Local decision hierarchy family for the refactored pack. Governs how decisions in the Epic→Phase→Slice→Packet→Commit chain are indexed, persisted to disk, linked bidirectionally, and queried for traversal or audit.

## Purpose

- Index every decision in the Epic→Phase→Slice→Packet→Return→Commit→Gate-Result hierarchy
- Enable forward traversal: what did this decision produce?
- Enable backward traversal: what produced this decision?
- Persist the decision tree to disk for cross-session retraceability
- Link delegation packets to their returns and their commits
- Support audit queries: "show me all decisions for phase X" or "which commit resulted from this delegation?"
- Provide a single source of truth for the decision chain that outlives any single session

## Use This For

- Tracing a decision back to its source evidence (commit → packet → slice → phase → epic)
- Forward-tracing a plan to all its execution artifacts (epic → all phases → all slices → all packets → all returns → all commits)
- Cross-session decision retrieval after compaction or interruption
- Audit trail generation for any workflow or phase
- Finding which commit resulted from which delegation packet
- Verifying that all slices in a phase were committed before marking the phase complete
- Querying decisions by: phase, agent, status, date range, activity_type, or surface
- Generating hierarchical reports for review or handoff

## Do Not Use This For

- Git commit mechanics — use `hivemind-atomic-commit`
- Session continuity across turns — use `git-continuity-memory`
- Delegation dispatch and return contracts — use `use-hivemind-delegation`
- Iteration loop control — use `hivemind-gatekeeping-delegation`
- Code scanning or seam discovery — use `hivemind-codemap`

## Prerequisites

- `git-continuity-memory` loaded — provides git-level commit anchors that this skill indexes as leaf nodes
- `use-hivemind-delegation` loaded — provides delegation packet structure that this skill persists and indexes

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `git-continuity-memory` | Git-level memory — this skill builds hierarchical index on top of commit anchors |
| `use-hivemind-delegation` | Delegation hierarchy — this skill persists and indexes the packets and returns |
| `hivemind-atomic-commit` | Commit discipline — commits are leaf nodes in this hierarchy |
| `hivemind-gatekeeping-delegation` | Iteration tracking — loop checkpoints and gate results are hierarchy nodes |
| `use-hivemind-git-memory` | Git memory router — this skill is a downstream implementation of hierarchical indexing |
| `hivemind-codemap` | Scan passes — codescan outputs are indexed as slice-level evidence |

`activity_type` and `phase_type` enum values are defined in the pack-level AGENTS.md under Typed Activity Contract.

## Decision Hierarchy Model

### Node Types

The hierarchy consists of 7 node types, ordered from coarsest to finest granularity:

| Node Type | Description | Identity | Example |
|-----------|-------------|----------|---------|
| `epic` | Top-level workflow or initiative | `epic_id` | "detox-refactor-2026-03" |
| `phase` | Major stage within an epic | `phase_id` | "phase-1-surface-audit" |
| `slice` | Bounded work unit within a phase | `slice_id` | "slice-tools-verification" |
| `packet` | Delegation packet dispatched to a subagent | `packet_id` | "pkt-2026-03-24T10:00:00Z-a3f" |
| `return` | Structured return from a delegated agent | `return_id` (matches packet_id) | "pkt-2026-03-24T10:00:00Z-a3f-return" |
| `commit` | Git commit produced by execution | `commit_sha` | "a1b2c3d" |
| `gate-result` | Verification or synthesis gate result | `gate_id` | "gate-synthesis-iteration-3" |

### Edge Types

Relationships between nodes are typed edges:

| Edge | Direction | Meaning |
|------|-----------|---------|
| `produces` | parent → child | An epic produces phases; a phase produces slices; a slice produces packets |
| `depends-on` | sibling → sibling | One slice depends on another's output before it can execute |
| `validates` | gate → target | A gate-result validates a return, commit, or phase |
| `executes` | packet → return | A packet executes and produces a return |
| `commits` | return → commit | A return's execution results in a commit |

### Hierarchy Depth Rules

- An epic has 1+ phases
- A phase has 1+ slices
- A slice has 1+ packets
- A packet has exactly 1 return (or is pending)
- A return has 0+ commits (read-only delegations produce no commits)
- A gate-result may validate any node at any level

### Node Record Schema

Every hierarchy node is stored as a JSON record:

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00.000Z",
    "updated_at": "2026-03-24T10:05:30.000Z",
    "node_type": "packet",
    "schema_version": "1.0.0"
  },
  "node_id": "pkt-2026-03-24T10:00:00Z-a3f",
  "node_type": "packet",
  "parent_id": "slice-tools-verification",
  "parent_type": "slice",
  "epic_id": "detox-refactor-2026-03",
  "phase_id": "phase-1-surface-audit",
  "slice_id": "slice-tools-verification",
  "activity_type": "verification",
  "phase_type": "low-level-proof",
  "status": "complete",
  "agent": "hivemaker",
  "branch": "feature/detox-refactor",
  "worktree": "/Users/apple/hivemind-plugin/.worktrees/product-detox",
  "concern": "Verify all 6 custom tools compile and tests pass",
  "scope": {
    "authority_surfaces": ["src/tools/"],
    "out_of_scope": ["src/hooks/", "src/core/"]
  },
  "edges": {
    "produces": ["pkt-2026-03-24T10:00:00Z-a3f-return"],
    "depends_on": ["pkt-2026-03-24T09:30:00Z-b1e"],
    "commits": ["a1b2c3d4"]
  },
  "evidence": {
    "delegation_packet": ".hivemind/activity/delegation/pkt-2026-03-24T10:00:00Z-a3f.json",
    "return_packet": ".hivemind/activity/delegation/pkt-2026-03-24T10:00:00Z-a3f-return.json",
    "commit_refs": ["a1b2c3d4"],
    "gate_refs": []
  },
  "timestamps": {
    "dispatched_at": "2026-03-24T10:00:00.000Z",
    "returned_at": "2026-03-24T10:05:30.000Z",
    "committed_at": "2026-03-24T10:06:00.000Z"
  }
}
```

## Storage Format

### Directory Structure

All hierarchy data is stored under `{project}/.hivemind/activity/hierarchy/`:

```
.hivemind/activity/hierarchy/
├── index.json                    # Master index: all node IDs, types, parent links
├── epics/
│   └── {epic_id}.json           # Epic node record
├── phases/
│   └── {phase_id}.json          # Phase node record
├── slices/
│   └── {slice_id}.json          # Slice node record
├── packets/
│   └── {packet_id}.json         # Packet node record
├── returns/
│   └── {packet_id}-return.json  # Return node record
├── commits/
│   └── {sha}.json               # Commit node record
├── gates/
│   └── {gate_id}.json           # Gate-result node record
├── edges/
│   └── {source_id}-edges.json   # Edge list for a source node
└── queries/
    └── {query-hash}.json        # Cached audit query results
```

### Master Index Schema

The master index (`index.json`) is a lightweight lookup table:

```json
{
  "_meta": {
    "created_at": "2026-03-24T10:00:00.000Z",
    "updated_at": "2026-03-24T10:05:30.000Z",
    "schema_version": "1.0.0",
    "total_nodes": 42
  },
  "nodes": [
    {
      "node_id": "detox-refactor-2026-03",
      "node_type": "epic",
      "parent_id": null,
      "status": "active",
      "activity_type": "refactor",
      "created_at": "2026-03-24T09:00:00.000Z"
    },
    {
      "node_id": "phase-1-surface-audit",
      "node_type": "phase",
      "parent_id": "detox-refactor-2026-03",
      "parent_type": "epic",
      "status": "active",
      "activity_type": "codescan",
      "created_at": "2026-03-24T09:15:00.000Z"
    }
  ],
  "edges": [
    {
      "source": "detox-refactor-2026-03",
      "target": "phase-1-surface-audit",
      "type": "produces"
    }
  ],
  "by_phase_type": {
    "entry": ["node-id-1"],
    "low-level-proof": ["node-id-2", "node-id-3"]
  },
  "by_activity_type": {
    "verification": ["node-id-2"],
    "refactor": ["node-id-4"]
  },
  "by_agent": {
    "hivemaker": ["node-id-2", "node-id-3"],
    "hiveq": ["node-id-5"]
  },
  "by_status": {
    "active": ["node-id-1", "node-id-2"],
    "complete": ["node-id-3", "node-id-4"],
    "blocked": ["node-id-5"]
  }
}
```

## Traversal Operations

### Forward Trace

Traverse from a coarse node down to all its descendants.

```
epic → all phases → all slices → all packets → all returns → all commits
```

**Algorithm:**
1. Read the target node record
2. Load `edges/{node_id}-edges.json` to find `produces` edges
3. For each child, read its node record and recurse
4. Collect all descendant nodes with their types, statuses, and evidence
5. Return the full subtree as a flat list or nested JSON tree

**Output shape:**
```json
{
  "trace_type": "forward",
  "root": "detox-refactor-2026-03",
  "depth": 5,
  "tree": [
    {
      "node_id": "phase-1-surface-audit",
      "node_type": "phase",
      "status": "active",
      "children": [
        {
          "node_id": "slice-tools-verification",
          "node_type": "slice",
          "status": "complete",
          "children": [...]
        }
      ]
    }
  ],
  "leaf_commits": ["a1b2c3d4", "e5f6g7h8"],
  "summary": {
    "total_nodes": 12,
    "by_status": { "complete": 8, "active": 3, "blocked": 1 },
    "commits_produced": 2
  }
}
```

### Backward Trace

Traverse from a fine node up to its ancestors.

```
commit → return → packet → slice → phase → epic
```

**Algorithm:**
1. Read the target node record
2. Follow `parent_id` and `parent_type` up one level
3. Read the parent node record
4. Repeat until reaching an epic (parent_id is null)
5. Return the ancestor chain

**Output shape:**
```json
{
  "trace_type": "backward",
  "leaf": "a1b2c3d4",
  "chain": [
    { "node_id": "a1b2c3d4", "node_type": "commit" },
    { "node_id": "pkt-2026-03-24T10:00:00Z-a3f-return", "node_type": "return" },
    { "node_id": "pkt-2026-03-24T10:00:00Z-a3f", "node_type": "packet" },
    { "node_id": "slice-tools-verification", "node_type": "slice" },
    { "node_id": "phase-1-surface-audit", "node_type": "phase" },
    { "node_id": "detox-refactor-2026-03", "node_type": "epic" }
  ],
  "epic_id": "detox-refactor-2026-03",
  "summary": {
    "total_ancestors": 5,
    "phase_type": "low-level-proof",
    "activity_type": "verification"
  }
}
```

### Audit Query

Filter hierarchy nodes by multiple criteria.

**Supported filters:**
- `node_type`: one or more of [epic, phase, slice, packet, return, commit, gate-result]
- `epic_id`: restrict to a specific epic
- `phase_id`: restrict to a specific phase
- `agent`: filter by agent name
- `status`: filter by node status [active, complete, blocked, partial]
- `activity_type`: filter by activity type
- `phase_type`: filter by phase type
- `date_range`: `{ from: ISO, to: ISO }`
- `branch`: filter by git branch
- `has_commits`: boolean — only nodes with associated commits

**Output shape:**
```json
{
  "query": {
    "phase_id": "phase-1-surface-audit",
    "status": ["complete", "blocked"],
    "agent": "hivemaker"
  },
  "results": [
    {
      "node_id": "slice-tools-verification",
      "node_type": "slice",
      "status": "complete",
      "evidence": { ... }
    }
  ],
  "count": 5,
  "queried_at": "2026-03-24T12:00:00.000Z"
}
```

Audit queries may be cached in `queries/{query-hash}.json` for repeated access. Cache invalidation occurs when any node in the queried scope is updated.

## Persistence Protocol

### When to Write Index Entries

Hierarchy nodes and edges are written at these lifecycle events:

| Event | Node Written | Edge Written | Trigger Source |
|-------|-------------|-------------|----------------|
| Epic created | `epics/{epic_id}.json` | — | Orchestrator planning |
| Phase defined | `phases/{phase_id}.json` | epic → phase `produces` | Orchestrator planning |
| Slice decomposed | `slices/{slice_id}.json` | phase → slice `produces` | Delegation decomposition |
| Packet dispatched | `packets/{packet_id}.json` | slice → packet `produces` | `use-hivemind-delegation` emit |
| Return received | `returns/{packet_id}-return.json` | packet → return `executes` | Subagent return |
| Commit produced | `commits/{sha}.json` | return → commit `commits` | `hivemind-atomic-commit` |
| Gate executed | `gates/{gate_id}.json` | gate → target `validates` | `hivemind-gatekeeping-delegation` |
| Dependency declared | — | slice → slice `depends_on` | Delegation decomposition |

### Write Discipline

1. **Always update `index.json`** when creating or updating any node — the master index is the fast-lookup surface
2. **Edges are append-only** — never delete an edge; if a relationship is revoked, add a `revoked_at` timestamp
3. **`_meta.updated_at`** must be set on every mutation
4. **Status transitions** must be recorded in the node's `timestamps` object with the transition timestamp
5. **All JSON uses 2-space indent, kebab-case filenames, ISO 8601 timestamps** — consistent with the activity folder convention

### Read Discipline

1. **Prefer `index.json` for filtered queries** — it has pre-built `by_*` indices for common lookups
2. **Read full node records only when detail is needed** — node records contain evidence, scope, and edges
3. **Use edge files for traversal** — do not inline edges into node records at query time; read them from `edges/`
4. **Cache audit queries** — repeated queries with the same filter should reuse `queries/{query-hash}.json`

## Core Process

1. **Initialize** — at epic creation, write the epic node and create `index.json` if it does not exist
2. **Index on dispatch** — when `use-hivemind-delegation` emits a packet, write the packet node and the `produces` edge from its parent slice
3. **Index on return** — when a subagent returns, write the return node and the `executes` edge from the packet
4. **Index on commit** — when `hivemind-atomic-commit` produces a commit, write the commit node and the `commits` edge from the return
5. **Index on gate** — when a synthesis or verification gate runs, write the gate-result node and the `validates` edge to its target
6. **Update master index** — after every node/edge write, update `index.json` with the new entry and recompute `by_*` indices
7. **Traverse on query** — forward/backward traces read node records and edge files; audit queries read `index.json` filtered indices
8. **Cache results** — store audit query results in `queries/` for repeated access

## Anti-Patterns

| Anti-Pattern | Why Dangerous |
|--------------|---------------|
| Indexing only commits, not delegations | Breaks the packet→commit link; cannot trace which delegation produced which commit |
| Writing hierarchy state to chat memory | Ephemeral — compaction erases it; no cross-session retrieval |
| Inlining full node records into `index.json` | Index bloat → slow queries; index should be lightweight, details in node files |
| Skipping edge writes | Disconnected graph → traversal produces incomplete results |
| Creating nodes without parent links | Orphan nodes that cannot be traced back to an epic |
| Caching queries without invalidation | Stale results after new nodes are added or status changes |
| Writing to `.opencode/` for hierarchy storage | Violates the write prohibition; hierarchy lives in `.hivemind/activity/hierarchy/` |
| Mixing hierarchy index with delegation packets | Single-responsibility violation; delegation owns packet JSON, hierarchy owns the index |
| Deleting edges instead of revoking | Lost history; append-only with `revoked_at` preserves the full decision timeline |

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/hierarchy-model.md` | Full node type definitions, edge type semantics, depth rules |
| `references/index-schema.md` | Complete master index JSON schema with all `by_*` filter structures |
| `references/node-record-schema.md` | Complete node record JSON schema for all 7 node types |
| `references/traversal-algorithms.md` | Forward trace, backward trace, and audit query algorithms with complexity analysis |
| `references/persistence-protocol.md` | Lifecycle event mapping, write discipline, read discipline, cache invalidation |
| `references/query-language.md` | Audit query filter specification, sort options, pagination |
| `templates/node-record.md` | JSON template for a generic hierarchy node record |
| `templates/master-index.md` | JSON template for the master index file |
| `templates/traversal-result.md` | JSON template for forward/backward trace results |
| `templates/audit-query.md` | JSON template for audit query input and output |
| `tests/forward-trace.md` | Forward traversal scenario: epic → commits |
| `tests/backward-trace.md` | Backward traversal scenario: commit → epic |
| `tests/audit-query.md` | Audit query scenario: filter by phase and status |
| `tests/persistence-flow.md` | Full lifecycle: dispatch → return → commit → index update |

## Orchestrator Integration

When the orchestrator (front agent) uses this skill:

1. **At epic creation:** the orchestrator writes the epic node to `epics/{epic_id}.json` and initializes `index.json` if absent. This is a small write — allowed in the main session.
2. **At delegation dispatch:** the orchestrator writes the packet node and `produces` edge. This is a small write triggered by `use-hivemind-delegation` emit.
3. **At delegation return:** the orchestrator writes the return node and `executes` edge. This is a small write triggered by the subagent return.
4. **At commit time:** the orchestrator writes the commit node and `commits` edge. This is a small write triggered by `hivemind-atomic-commit`.
5. **For forward/backward traces:** delegate the traversal to a subagent rather than loading the full hierarchy into the orchestrator session.
6. **For audit queries:** the orchestrator may read `index.json` directly for lightweight filtered lookups. For complex queries, delegate to a subagent.
7. **At phase completion:** verify all slices in the phase have associated commits before marking the phase complete. Use a backward trace from each slice to confirm commit coverage.
8. **At handoff:** include the epic_id and current phase_id in the handoff record so the next session can resume traversal from the correct node.

## Independence Rules

- This package is self-contained for hierarchy indexing and traversal.
- It does not require old router-to-router chains.
- It may be selected directly or composed with `git-continuity-memory`, `use-hivemind-delegation`, and `hivemind-atomic-commit`.
- Hierarchy data is stored in `{project}/.hivemind/activity/hierarchy/` at runtime.
- It does not duplicate delegation packet JSON — it references it via `evidence.delegation_packet` paths.
- It does not duplicate commit data — it references commits via `evidence.commit_refs` (SHAs).
- The master index is a denormalized view for fast lookup; the source of truth is the individual node records and edge files.

## .opencode/ Write Prohibition

**DIRECT_WRITE_BAN**: This skill must NOT write to `.opencode/` directory.

- Hierarchy nodes, edges, and index files are stored in `.hivemind/activity/hierarchy/`
- Cached audit queries are stored in `.hivemind/activity/hierarchy/queries/`
- `.opencode/` is the user's project configuration space — read-only access for context gathering is permitted
- If hierarchy data needs to be surfaced to the user, emit it to stdout as JSON or write it to `.hivemind/activity/` — never to `.opencode/`
