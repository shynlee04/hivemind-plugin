# Research Thread Management

## Purpose

Manage the lifecycle of research threads from creation through synthesis.

## Thread Structure

```json
{
  "thread_id": "research_sdk_hooks",
  "question": "What hooks does the OpenCode SDK provide?",
  "sub_questions": [
    "What event hooks exist?",
    "What chat hooks exist?",
    "What permission hooks exist?"
  ],
  "evidence_count": 12,
  "synthesis_status": "partial",
  "open_packet_ids": ["deleg_1711072800_events"],
  "created_at": "2026-03-22T10:00:00Z",
  "updated_at": "2026-03-22T10:45:00Z"
}
```

## Thread Lifecycle

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `open` | Thread created, sub-questions defined | Dispatch packets |
| `collecting` | Packets dispatched, evidence incoming | Wait for returns |
| `synthesizing` | All evidence collected | Run synthesis |
| `complete` | Synthesis done, findings documented | Archive |
| `blocked` | Missing evidence, cannot synthesize | Re-delegate or escalate |

## Checkpoint Compression

Research checkpoints carry forward only:
- Sub-question status (answered/partial/blocked)
- Top 3 findings per answered sub-question
- Open contradictions requiring resolution
- Missing evidence gaps

Do NOT carry full evidence items in the checkpoint — they live in output files.

## Thread Tracking

Track threads via `open_packet_ids` in the loop checkpoint:
- Each open packet represents an active research thread
- When a packet returns, update the thread status
- When all threads are `complete` or `blocked`, the research loop can synthesize or escalate

## Storage

Thread state: `{activity}/delegation/{thread_id}-thread.json`
Evidence output: `{activity}/research/{thread_id}/evidence.json`
Synthesis: `{activity}/research/{thread_id}/synthesis.json`
