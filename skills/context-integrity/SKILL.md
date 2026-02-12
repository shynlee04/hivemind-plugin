---
name: "context-integrity"
description: "Detects and repairs context drift. Monitors hierarchy staleness, chain breaks, and context decay across compactions."
triggers:
  - "When drift score is low"
  - "After context compaction"
  - "When hierarchy seems stale"
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
list_shelves({})
recall_mems({ shelf: "decisions" })
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
hierarchy_prune({})

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
| "The context is fine" | Check the `<hivemind>` block. If drift > 50, it's not fine. |
| "I'll recover context later" | Later = after more drift. Recover NOW. |
| "Compaction didn't lose anything important" | Prove it. `recall_mems` + `think_back`. |
