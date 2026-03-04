---
name: "context-integrity"
description: "Detects and repairs context drift with escalation support. Monitors hierarchy staleness, chain breaks, context decay, and turn-based escalation warnings across compactions."
triggers:
  - "When drift score is low"
  - "After context compaction"
  - "When hierarchy seems stale"
  - "turn-based escalation warning"
version: "2.6.0"
---

# Context Integrity

**Core principle:** Detect loss. Repair state. Never work on stale context.

## When to Use

- Drift score warning appears in `<hivemind>` prompt
- Post-compaction (context was just compressed)
- Resuming work after a gap (hours/days between sessions)
- Hierarchy feels wrong ("what was I doing?")
- Multiple compactions in same conversation
- Switching from one subagent's context back to main flow

## Detect — Know When Context Is Broken

### Automatic Detection (hooks do this for you)

The `<hivemind>` block in your system prompt already contains:
- **Drift score** — drops below 50 = you're wandering
- **Turn count** — 5+ turns without `map_context` = stale
- **Timestamp gaps** — hours between hierarchy nodes = context likely lost
- **Post-compaction alert** — context was just compressed
- **Failure flag** — subagent reported failure, not yet acknowledged
- **Tool-hierarchy mismatch** — writing files but no action declared

**You don't need to detect these yourself. Read the `<hivemind>` block.**

### Manual Detection (when you suspect problems)

```bash
# Full hierarchy tree with cursor position
node bin/hivemind-tools.cjs state hierarchy

# Validate parent-child chain integrity
node bin/hivemind-tools.cjs validate chain

# Check all timestamps parse correctly
node bin/hivemind-tools.cjs validate stamps

# See gap between last activity and now
node bin/hivemind-tools.cjs state get metrics.turn_count

# Check if compaction happened
node bin/hivemind-tools.cjs state get compaction_count
```

## Repair — Fix Broken Context

### Blind Agent Remediation (hivefiver)

If the current agent is blind (`read/glob/grep/bash` denied), do not rely on internal memory for repairs. Use this sequence:

1. Delegate to `hivexplorer` to verify current state files (`STATE.md`, `hierarchy.json`, `runtime-profile.json`, `health-metrics.json`).
2. Compare verified evidence against your active assumptions.
3. If contradictions exist, reset to verified facts and update the active plan/checkpoint.
4. Only proceed after a second verification pass confirms the repaired state.

### After Drift Warning

```typescript
// 1. Check where you are
scan_hierarchy({})
// → Shows full tree with cursor marker

// 2. Update to re-engage
map_context({
  level: "action",    // or tactic if action is wrong too
  content: "What you're actually doing right now",
  status: "active"
})
// → Resets turn count, boosts drift score
```

### After Compaction

```typescript
// 1. Refresh context from persistent stores
think_back({})
// → Shows: tree position + anchors + chain analysis + session plan

// 2. Check what mems survived
recall_mems({ shelf: "decisions" })
recall_mems({ shelf: "cycle-intel" })
// → Key decisions and subagent intelligence from before compaction

// 3. Re-declare if trajectory feels wrong
// Only if think_back shows misalignment
map_context({
  level: "tactic",
  content: "Continuing: [what think_back showed as active]"
})
```

### After Session Gap (Hours/Days)

```bash
# 1. What session was active?
node bin/hivemind-tools.cjs session active

# 2. What's the full tree?
node bin/hivemind-tools.cjs state hierarchy

# 3. Trace the last session's work
node bin/hivemind-tools.cjs session trace <stamp>

# 4. What mems exist?
recall_mems({})
recall_mems({ query: "decisions" })
```

Then start a new session:
```typescript
declare_intent({
  mode: "plan_driven",
  focus: "Continuing: [what trace showed]",
  reason: "Resuming after gap — checked trace + mems"
})
```

### After Chaos (User Changed Mind Multiple Times)

```typescript
// 1. See the FULL tree — shows every pivot as a node
scan_hierarchy({})

// 2. Save an anchor at the stable point
save_anchor({
  type: "decision",
  content: "After 3 pivots, settling on: [X]. Reasons: [Y].",
  tags: ["pivot-resolution"]
})

// 3. Prune completed/abandoned branches
hierarchy_manage({ action: "prune" })

// 4. Re-set trajectory clearly
map_context({
  level: "trajectory",
  content: "Final direction: [X]",
  status: "active"
})
```

## Survive — Patterns for Long-Haul Sessions

### The Anchor Pattern (Compaction-Proof Decisions)

Before making any significant decision:
```typescript
save_anchor({
  type: "decision",
  content: "Chose JWT over session tokens because: stateless, scales horizontally",
  tags: ["auth", "architecture"]
})
```
This survives compaction. `think_back` will show it.

### The Mem Pattern (Session-Proof Knowledge)

When you learn something that future sessions need:
```typescript
save_mem({
  shelf: "architecture",
  content: "Auth uses jose library for JWT, passport was abandoned at turn 15",
  tags: ["auth", "jwt", "jose"]
})
```
This survives session boundaries. `recall_mems` from any future session.

### The Checkpoint Pattern (Drift-Proof Progress)

Every 3-5 meaningful actions:
```typescript
map_context({
  level: "action",
  content: "Completed: X, Y, Z. Next: W.",
  status: "active"
})
```
This resets drift counter. Keeps the tree current.

## Red Flags

| Thought | Reality |
|---------|---------|
| "I remember what I was doing" | After compaction you're guessing. Use `think_back`. |
| "The context is fine" | Check the `<hivemind>` block. If drift < 50, it's not fine. |
| "I'll recover context later" | Later = after more drift. Recover NOW. |
| "Compaction didn't lose anything important" | Prove it. `recall_mems` + `think_back`. |

## Context Quality Escalation System

> Merged from deprecated `context-quality-escalation` skill (2026-03-03)

This escalation layer complements drift scoring with explicit turn-based actions.

### Four-Level Escalation

| Level | Turns | Severity | Required behavior |
|---|---:|---|---|
| L1 | 1 | MILD | Declare intent, classify task type, snapshot state |
| L2 | 2-3 | URGENT | Run `think_back({})`, identify rot points, consider `map_context` refresh |
| L3 | 4 | CRITICAL | Halt execution for reconstruction and explicit decision |
| L4 | 5+ | EMERGENCY | Mandatory stop and handoff or parent-return |

### Mode-Specific Behavior (MAIN vs SUB)

- **MAIN agents** (`hiveminder`, `hivefiver`):
  - L1-L2: continue with heightened context checks.
  - L3: stop and require explicit user confirmation (continue, pivot, handoff, or collect context).
  - L4: output handoff prompt and refuse further autonomous execution.
- **SUB agents** (`hivemaker`, `hivehealer`, etc.):
  - L1-L3: continue only within delegated scope and surface context concerns to parent.
  - L4: stop and return to parent with `context_limit` status.

### SOT Validation Checklist

Before treating any doc/state file as Source of Truth:

1. Is it in a valid SOT location (`docs/governance/`, `docs/plans/`, `.hivemind/governance/`)?
2. Is naming stable (no timestamp-as-branch naming)?
3. Is it connected to parent governance documents?
4. Is it cross-referenced by related SOTs?
5. Is it fresh (<48h) or does it define an explicit update mechanism?

If any answer is "no", treat it as non-authoritative until validated.

### Assumption Denial Protocol

Use a deny-by-default mindset under drift pressure:

- Prioritize guardrails, safety, and best practices over speed.
- Collect verifiable context before action.
- Do not trust stale docs, cached assumptions, or happy-path recollection.
- Require explicit human confirmation when ambiguity or lineage breaks remain.

### Compact/Purification Triggers

Escalation jumps to purification mode when one or more conditions appear:

- Compaction just occurred.
- Turn count exceeds 4.
- User forces continuation despite critical warnings.
- Context payload becomes large and structurally unclear.

Purification steps:

1. Stop execution immediately.
2. Summarize attempted work and unresolved questions.
3. List contradictions and missing dependencies.
4. Return either a handoff prompt for a fresh session or a risk-stated confirmation gate.

### References

- `references/escalation-examples.md`
- `references/escalation-implementation.md`
