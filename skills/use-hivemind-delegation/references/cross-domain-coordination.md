# Cross-Domain Coordination

## Purpose

Cross-domain coordination prevents packet collisions when one investigation spans multiple agents, domains, or authority surfaces. Use it to decide whether slices can run together, how synthesis should merge them, and how to fill gaps without restarting the whole workflow.

## Coordination Principles

1. Prefer the smallest domain slice that can still answer the question.
2. Treat shared mutable state as a sequential trigger.
3. Merge findings only after evidence normalization.
4. Use delta-queries for gaps; do not relaunch the whole swarm.

## Sequential vs Parallel Decision Matrix

| Condition | Sequential | Parallel |
|----------|------------|----------|
| Shared file mutations | yes | no |
| Same authority owner, read-only slices | optional | yes |
| One slice depends on another slice's evidence | yes | no |
| Independent investigations with later synthesis | no | yes |
| Conflicting hypotheses need tie-break verification | yes | no |
| Same module but distinct read-only questions | maybe | yes if no overlap in output writes |

## Fast Routing Questions

Ask these before dispatch:

1. Do any slices write to the same file set?
2. Does any slice need another slice's output first?
3. Can the parent synthesize the results without opening raw artifacts?
4. Are the slices small enough to keep 7±2 summaries in memory?

If any answer is unsafe, reduce scope or switch to sequential.

## Shared-State Detection

Treat the work as shared-state when any of these are true:

- two packets target the same write path
- two packets update the same schema or type owner
- one packet mutates files another packet reads for correctness
- two packets both regenerate the same derived artifact
- one packet rewrites a contract the other packet verifies

### Shared-State Signals to Record

```json
{
  "shared_state": {
    "detected": true,
    "paths": ["src/tools/task/index.ts"],
    "reason": "implementation and verification target the same contract"
  }
}
```

## Domain Roles

| Domain | Common Agent | Typical Mode |
|------|---------------|--------------|
| local code discovery | hivexplorer | research |
| external ecosystem research | hiverd | research |
| implementation | hivemaker | execution |
| verification | hiveq | verification |

Mix these roles only at the parent synthesis layer, not inside a single packet.

## Merge-by-Synthesis Protocol

When multiple domains return in parallel, merge them through a synthesis pass.

### Inputs

- compressed summary from each packet
- normalized evidence objects
- blocked routes
- output paths

### Merge Steps

1. Group findings by claim or concern.
2. Deduplicate evidence with the same quote and source.
3. Separate confirmed claims from inferred claims.
4. Identify contradictions and unresolved gaps.
5. Emit a unified summary plus targeted delta-queries.

### Output Shape

```json
{
  "synthesis_id": "syn-2026-03-29-delegation",
  "merged_claims": [],
  "conflicts": [],
  "gaps": [],
  "delta_queries": []
}
```

## Conflict Handling

| Conflict Type | Action |
|--------------|--------|
| Same claim, different confidence | keep both and ask verification to arbitrate |
| Different claims, same source | re-read the source via delta-query |
| External research conflicts with local code | local code wins unless scope explicitly prefers external truth |
| Implementation claim lacks verification | route to hiveq before synthesis closes |

## Delta-Query Protocol

Use a delta-query when synthesis reveals a missing or disputed proof point.

### Required Fields

- `origin_synthesis_id`
- `question`
- `target_domain`
- `target_agent`
- `depends_on`
- `success_condition`

### Example

```json
{
  "origin_synthesis_id": "syn-2026-03-29-delegation",
  "question": "Which file owns cross-domain evidence validation?",
  "target_domain": "verification",
  "target_agent": "hiveq",
  "depends_on": ["slice-evidence-schema", "slice-validator-script"],
  "success_condition": "one verified owner with direct quote"
}
```

## Coordination Waves

### Wave 1: Discovery

- Map domains and slice boundaries.
- Detect shared state.
- Decide whether any packet must be sequential.

### Wave 2: Execution or Deeper Research

- Run parallel packets that passed the safety gate.
- Hold back dependent packets until prerequisites return.

### Wave 3: Synthesis and Gap Fill

- Merge evidence.
- Spawn delta-queries only for unresolved issues.
- Close blocked routes or escalate them explicitly.

## Cognitive Limits

| Limit | Operational Rule |
|------|------------------|
| 7±2 summaries | Do not synthesize more than 9 packet summaries at once |
| 15-20 files per slice | Split bigger slices before dispatch |
| 1 mutable owner per wave | One writer per shared surface |

## Failure Patterns

| Pattern | Symptom | Correction |
|--------|---------|-----------|
| Unsafe parallelism | overlapping edits or contradictory returns | switch to sequential |
| Oversized synthesis | parent cannot merge summaries cleanly | reduce wave size |
| Unbounded delta-query | gap-fill becomes a fresh broad search | rewrite the delta question |
| Hidden shared state | tests or generated files collide late | declare owners and rerun |

## Coordination Checklist

- Did every packet declare domain and agent?
- Was shared state checked before parallel dispatch?
- Are synthesis inputs normalized to the evidence schema?
- Are delta-queries narrower than the original slices?
- Are blocked routes explicit instead of implied?
