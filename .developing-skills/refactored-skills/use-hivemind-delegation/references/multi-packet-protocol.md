# Multi-Packet Protocol

## Purpose

Use multi-packet delegation when one question spans multiple authority surfaces, execution modes, or evidence sources. The goal is to keep each packet bounded while still allowing a parent investigation to converge into a unified answer.

## When Multi-Packet Beats Single-Packet

- Split work when a single packet would exceed one concern, one authority surface, or one cognitive window.
- Prefer separate packets when research, implementation, and verification require different agents.
- Break work apart when full-stack analysis crosses frontend, backend, build, docs, or runtime state.
- Use chained packets when later work depends on earlier evidence.
- Use parallel packets only when slices have no shared write target and can be synthesized safely.

## Core Terms

| Term | Meaning |
|------|---------|
| domain | A broad concern area such as UI, API, data, runtime, or docs |
| slice | A bounded sub-question inside a domain |
| finding | A single claim derived from evidence inside a slice |
| packet | The dispatch contract for a subagent |
| synthesis | The parent-level merge of multiple slice returns |
| delta-query | A gap-filling follow-up packet created after synthesis |

## Hierarchical Result Shape

Large investigations should land in a hierarchy instead of a flat list.

```json
{
  "investigation_id": "inv-delegation-2026-03-29",
  "domains": [
    {
      "name": "delegation-runtime",
      "status": "partial",
      "slices": [
        {
          "id": "slice-agent-contracts",
          "agent": "hivexplorer",
          "status": "complete",
          "findings": [
            {
              "claim": "Packets already carry packet_id and mode",
              "evidence_refs": ["ev-001"]
            }
          ]
        }
      ]
    }
  ],
  "cross_domain_claims": [],
  "synthesis_queue": []
}
```

### Recommended Depth

- Domain → slice → finding is the default hierarchy.
- Add a fourth level only when a finding must track multiple mutually exclusive hypotheses.
- Keep findings small; long prose belongs in linked artifacts.

## Packet Construction Rules

### 1. Bound by Domain First

Start by naming the investigation domains:

- `ui`
- `api`
- `data`
- `runtime`
- `docs`
- `verification`

Do not mix unrelated domains in a single packet if the child agent cannot finish them in one pass.

### 2. Bound by Slice Second

Each domain gets bounded slices such as:

- one route
- one pipeline
- one module cluster
- one verification question
- one documentation surface

### 3. Bound by Concern Third

Split by concern when the same domain needs different authority levels:

- read-only discovery
- external research
- implementation
- verification

## Parallel vs Sequential Multi-Packet

### Use Parallel Packets When

- slices are read-only
- slices do not share mutable files
- the parent can merge returns by synthesis
- no slice depends on another slice's output
- the total number of active slices stays inside the parent context budget

### Use Sequential Packets When

- later packets need prior evidence
- a follow-up packet narrows a hypothesis
- implementation must wait for research or verification
- shared state creates a collision risk
- the parent expects delta-queries after a synthesis checkpoint

## Chained Delegation Packets

Sequential investigation should form a chain rather than a restart.

### Packet Chain Pattern

1. Wave 1 gathers broad evidence.
2. Synthesis identifies gaps, conflicts, or unresolved claims.
3. Wave 2 issues delta-queries against those gaps.
4. Wave 3 verifies the merged answer.

Each downstream packet should include:

- `parent_packet_id`
- `investigation_id`
- `depends_on`
- `delta_query` when it only fills known gaps

## Delta-Query Specification

A delta-query is a targeted follow-up, not a new broad scan.

```json
{
  "delta_query": {
    "reason": "missing evidence for blocked route",
    "prior_slice_ids": ["slice-agent-contracts"],
    "question": "Which agent owns evidence validation at ingestion?",
    "success_condition": "one confirmed owner with file-backed evidence"
  }
}
```

Use delta-queries when:

- synthesis reveals a missing proof point
- two slices disagree and need tie-breaking
- one blocked route can be isolated cleanly

Do not use delta-queries to restart a whole domain.

## TOC and Jump-Reading for Large Results

Large outputs should always expose a skimmable entry surface.

### Required TOC Fields

- `investigation_id`
- `produced_at`
- `producer`
- `domain_count`
- `slice_count`
- `finding_count`
- `offset_index`

### TOC Example

```json
{
  "toc": [
    { "domain": "ui", "slice": "routing", "start_line": 40, "end_line": 102 },
    { "domain": "api", "slice": "contract", "start_line": 103, "end_line": 191 }
  ]
}
```

Use the TOC to jump directly to a slice instead of re-reading the full artifact.

## Offset-Reading Protocol

When an output grows large, read it incrementally:

1. Read the header and TOC first.
2. Read only the slice window needed for synthesis.
3. Use stored offsets when returning later in the session.
4. Never re-open the whole artifact unless the TOC changed.

Recommended offset metadata:

```json
{
  "offset_index": {
    "slice-agent-contracts": { "start_line": 40, "end_line": 102 },
    "slice-return-schema": { "start_line": 103, "end_line": 180 }
  }
}
```

## Metadata Grep and Filtering

Investigation JSON should include machine-friendly metadata so later probes can filter by producer, date, or status.

### Recommended `_meta` Shape

```json
{
  "_meta": {
    "created_at": "2026-03-29T12:00:00Z",
    "updated_at": "2026-03-29T12:30:00Z",
    "producer": "hivexplorer",
    "packet_id": "batch-3-delegation-ui",
    "investigation_id": "inv-delegation-2026-03-29"
  }
}
```

Metadata should support grep-like questions such as:

- Which packets were produced today?
- Which agent created this artifact?
- Which slices are still partial?
- Which blocked routes remain open?

## Cognitive Limits

Respect human and model context limits while designing packets.

| Limit | Guidance |
|------|----------|
| 7±2 items | Keep concurrent packet summaries within 5-9 high-level items |
| 15-20 files | Maximum file count per slice before splitting further |
| 1 core concern | Each slice answers one main question |
| ≤5 carry-forward items | Parent synthesis should compress child output aggressively |

### Practical Consequences

- If a slice touches more than 20 files, split by import cluster or interface boundary.
- If the parent is juggling more than 9 summaries, create synthesis waves.
- If one packet must answer two unrelated questions, split it.

## Multi-Packet Workflow

1. Define the investigation and its target domains.
2. Split domains into bounded slices.
3. Choose parallel or sequential execution mode.
4. Emit packets with stable IDs and output paths.
5. Collect structured evidence returns.
6. Synthesize by domain, then across domains.
7. Issue delta-queries for unresolved gaps.
8. Close the investigation only after blocked routes are either resolved or explicitly accepted.

## Common Failure Modes

| Failure | Cause | Correction |
|--------|-------|-----------|
| Packet sprawl | Too many slices started at once | Reduce active wave size |
| Duplicate findings | Two packets asked the same question | Re-scope slices with unique IDs |
| Shared-state collision | Parallel writers touched the same files | Re-run sequentially |
| Synthesis fog | Returns are prose instead of structured objects | Enforce JSON return schema |
| Endless re-reading | Large artifacts lack TOC or offsets | Add TOC and offset index |

## Verification Checklist

- Does each packet have one domain and one slice question?
- Does each large artifact expose TOC and offsets?
- Can the parent filter results by `_meta.producer` and date?
- Are delta-queries narrower than the original packet?
- Are active waves inside the 7±2 summary limit?
