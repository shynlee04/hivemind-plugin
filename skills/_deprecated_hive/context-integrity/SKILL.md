---
name: "context-integrity"
description: "Use when context may be stale, after compaction, after session gaps, or when drift signals appear. Detects context loss and provides repair patterns that survive session boundaries."
---

# Context Integrity

**Core principle:** Detect loss. Repair state. Never work on stale context.

## When to Use

- After context compaction (session memory was compressed)
- Resuming work after a gap (hours/days between sessions)
- Multiple compactions in same conversation
- Switching between subagent contexts
- "What was I doing?" feeling

## Platform Adaptation

> This skill teaches WHAT to detect and repair. HOW you detect depends on your platform:
> - **OpenCode**: `<hivemind>` block contains drift score, turn count, timestamps
> - **Claude Code**: Check task artifacts and conversation history length
> - **Antigravity**: Check task_boundary status and artifact state
> - **Cursor/Windsurf**: Check open file context and terminal history
>
> The CONCEPT is universal. Adapt detection to your available tools.

## Detect — Know When Context Is Broken

### Automatic Signals (platform provides these)

| Signal | What it means | Threshold |
|--------|---------------|-----------|
| Drift score drops | You're wandering from intent | Below 50 = broken |
| High turn count without checkpoint | Context is aging without anchoring | 5+ turns = stale |
| Large timestamp gap | Time passed since last checkpoint | Hours = likely lost |
| Post-compaction alert | Memory was compressed | Always repair |
| Tool-hierarchy mismatch | Doing work not aligned to declared intent | Any mismatch |

### Manual Detection (when you suspect problems)

Check these in order:
1. **Full state tree** — what is the hierarchy of current work?
2. **Chain integrity** — is the parent-child chain unbroken?
3. **Timestamp freshness** — when was last activity?
4. **Compaction count** — has memory been compressed?

## Repair — Fix Broken Context

### After Drift Warning

1. Check where you are in the work hierarchy
2. Update your declared intent to match actual work
3. This resets drift indicators

### After Compaction

1. Refresh context from persistent stores (saved decisions, anchors)
2. Check which knowledge survived compression
3. Re-declare trajectory if misaligned with recovered state

### After Session Gap (Hours/Days)

1. Find the last active session
2. Trace the previous session's work
3. Recall saved decisions and knowledge
4. Declare intent as "continuing" with evidence from trace

### After Chaos (User Changed Mind Multiple Times)

1. View full hierarchy — each pivot is visible as a node
2. Anchor the decision at the stable point with reasoning
3. Prune completed/abandoned branches
4. Set trajectory to final direction

## Survival Patterns for Long Sessions

### The Anchor Pattern (Compaction-Proof Decisions)

Before making any significant decision, save it with reasoning. This survives compaction.

### The Knowledge Pattern (Session-Proof Learning)

When you learn something future sessions need, persist it. This survives session boundaries.

### The Checkpoint Pattern (Drift-Proof Progress)

Every 3-5 meaningful actions, update your declared position. This resets drift indicators.

## Escalation System

| Level | Turns | Severity | Required Behavior |
|-------|------:|----------|-------------------|
| L1 | 1 | MILD | Declare intent, classify task, snapshot state |
| L2 | 2-3 | URGENT | Re-read persistent knowledge, identify rot points |
| L3 | 4 | CRITICAL | Halt execution, reconstruct context, require explicit decision |
| L4 | 5+ | EMERGENCY | Mandatory stop — compose handoff or return to parent |

### Mode-Specific Escalation

- **MAIN agents** (orchestrators): L3 = stop + require user confirmation. L4 = output handoff, refuse further autonomous work
- **SUB agents** (executors): L1-L3 = continue within delegated scope. L4 = return to parent with `context_limit` status

## Source-of-Truth Validation Checklist

Before treating any document as authoritative:
1. Is it in a valid governance location?
2. Is naming stable (not timestamp-as-branch)?
3. Connected to parent governance documents?
4. Cross-referenced by related sources?
5. Fresh (<48h) or has explicit update mechanism?

If any answer is "no" → treat as non-authoritative until validated.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I remember what I was doing" | After compaction you're guessing. Check persistent stores. |
| "The context is fine" | Check drift signals. If score < 50, it's not fine. |
| "I'll recover context later" | Later = after more drift. Recover NOW. |
| "Compaction didn't lose anything" | Prove it. Check persisted knowledge. |

## Bundled Resources

| Resource | Trigger | Content |
|----------|---------|---------|
| [repair-checklist.md](references/repair-checklist.md) | Any repair scenario detected | Step-by-step checklists for post-compaction, post-gap, post-chaos, post-handoff |
| [context-recovery-report.md](templates/context-recovery-report.md) | After completing a repair | Fill-in report: lost → recovered → gaps → state declaration |
