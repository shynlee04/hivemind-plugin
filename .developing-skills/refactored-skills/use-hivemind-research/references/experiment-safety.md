# Experiment Safety Protocol

Research investigations are experiments. Every experiment needs safety rails to prevent wasted effort, lost findings, and contaminated evidence. This protocol adapts git-backed experiment safety patterns for HiveMind research agent workflows.

## Core Concepts

| Git Concept | Research Analog | Purpose |
|-------------|----------------|---------|
| Branch | Research thread | Isolates an investigation from stable findings |
| Commit | Safety checkpoint | Captures state before entering a deep dive |
| Revert | Rollback | Discards a dead-end investigation branch |
| Merge | Finding integration | Merges confirmed findings back into the main knowledge base |
| Stash | Temporary suspension | Pauses a research thread to pursue a higher-priority lead |

## Isolation Rules

Every research investigation must be isolated from the main knowledge base until findings are confirmed.

1. **Never investigate on main.** Research threads run in isolated artifact folders or separate branches. Confirmed findings merge back; dead ends get discarded.
2. **One thread per investigation.** Parallel research threads must not share mutable state. Each thread produces its own evidence artifacts.
3. **No cross-contamination.** Findings from an unconfirmed thread must not influence other investigations until the thread is validated.
4. **Scope fencing.** Each thread has a bounded scope declared in the delegation packet. Scope expansion requires a new checkpoint.

## Safety Checkpoints

Checkpoints capture research state before committing to a deep investigation path.

### When to Checkpoint

| Trigger | Action |
|---------|--------|
| Before entering a multi-source deep dive | Commit current findings and thread state |
| Before pivoting research direction | Checkpoint the original path so it can be resumed |
| Before spawning parallel subagents | Save the parent thread's state |
| After confirming a significant finding | Checkpoint so rollback preserves the confirmed data |
| On receiving new context that may invalidate prior work | Checkpoint before incorporating new information |

### Checkpoint Contents

Each checkpoint captures:

- **Thread ID** — unique identifier for the research investigation
- **Findings to date** — all confirmed and inferred findings so far
- **Open questions** — unresolved sub-questions still being investigated
- **Evidence paths** — locations of all artifacts produced
- **Timestamp** — ISO 8601 when the checkpoint was created

## Rollback Procedures

Rollback discards a failed investigation while preserving confirmed findings captured before the dead end.

### Rollback Triggers

| Condition | Action |
|-----------|--------|
| Investigation yields no new findings after 3 source checks | Rollback thread |
| Sources contradict each other with no resolution path | Rollback thread, preserve contradiction record |
| Research direction proves irrelevant to the original question | Rollback to last checkpoint, re-scope |
| Subagent returns `blocked` with no workaround | Rollback that subagent's artifacts |

### Rollback Steps

1. **Capture evidence first.** Before discarding anything, record what was tried and why it failed. This prevents repeating the same dead end.
2. **Extract confirmed findings.** Any validated data discovered during the investigation must be preserved, even if the overall thread is a dead end.
3. **Discard thread artifacts.** Remove unconfirmed findings, intermediate notes, and exploratory artifacts.
4. **Revert to checkpoint.** Restore the research state to the last confirmed-good checkpoint.
5. **Log the abort.** Record the dead-end thread in the abort log with reasons.

### What Rollback Preserves

| Preserved | Discarded |
|-----------|-----------|
| Confirmed findings with evidence | Unconfirmed hypotheses |
| Source credibility assessments | Exploratory notes |
| Abort reason and lessons learned | Intermediate query results |
| Contradiction records | Draft conclusions |

## Abort Conditions

An experiment must be killed early when any of these conditions are met:

| Condition | Rationale |
|-----------|-----------|
| Source is unreliable | Building on bad data produces bad findings |
| 3 parallel threads converge on the same gap | The gap is real; further investigation won't fill it |
| Cost exceeds value | Diminishing returns on MCP calls, time, or context budget |
| Question is unanswerable with available tools | No point investigating what cannot be resolved |
| User redirects or reprioritizes | The original investigation is no longer relevant |
| Context rot detected | Research built on stale context is worse than no research |

### Abort Decision Record

When aborting, record:

```json
{
  "thread_id": "thread-2026-03-28-001",
  "abort_reason": "source_unreliable",
  "sources_checked": 5,
  "confirmed_findings": 2,
  "dead_end_reason": "Official docs contradict community findings; no authoritative source available",
  "preserved_artifacts": ["findings/confirmed/source-credibility.md"],
  "timestamp": "2026-03-28T14:30:00Z"
}
```

## Evidence Preservation Rules

Evidence is the output that survives rollback. It must be captured according to these rules:

1. **Capture before rollback.** Never discard confirmed data. Extract it to a safe location before reverting.
2. **Link evidence to source.** Every finding must reference its origin (URL, commit SHA, doc path).
3. **Timestamp everything.** Research findings lose value over time. Record when each finding was captured.
4. **Confidence tagging.** Mark each finding as `confirmed`, `inferred`, or `unverified`. Only `confirmed` findings survive rollback unconditionally.
5. **Immutable evidence.** Once captured, evidence artifacts must not be modified. New evidence creates new files.

## Thread Lifecycle

```
CREATE thread
  → CHECKPOINT initial state
    → INVESTIGATE (gather sources, extract findings)
      → CHECKPOINT before each deep dive
        → [ABORT if conditions met] → PRESERVE evidence → ROLLBACK → LOG abort
        → [CONFIRM findings] → MERGE into main knowledge base → CLOSE thread
```

## Integration with HiveMind Research

- **Delegation packets** declare the thread scope and abort conditions upfront.
- **Subagent results** include evidence paths so the parent thread can validate before merging.
- **Confidence scoring** (`evidence-contract.md`) determines which findings survive rollback.
- **Results formatting** (`results-format.md`) standardizes how evidence is captured at each checkpoint.
