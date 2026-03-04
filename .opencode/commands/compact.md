---
name: hivemind-session-combo
description: "Combo command: Complete session lifecycle management combining close + context validation. Replaces standalone compact_session with full governance enforcement."
owner_agent: hiveminder
kind: utility
alias_resolved_to: hivemind-session-combo
required_skills:
  - delegation-intelligence
  - context-integrity
  - evidence-discipline
required_templates: []
chain_group: hiveminder
group: hiveminder
entry_gate: session_declared
---
# HiveMind Session Combo (Close + Compact)

**Purpose**: Replace the old `compact_session` with a combo that includes pre-flight validation, context preservation, and post-compact handoff.

## Command Structure

```
Step 1: hivemind_inspect({ action: "scan", include_drift: true })
Step 2: hivemind_session({ action: "close", strict_gate: true, summary: "..." })
Step 3: hivemind_cycle({ action: "export" })
```

## Step-by-Step Execution

### Pre-Flight: Verify Session State

```typescript
// Inspect current session - verify what was accomplished
hivemind_inspect({
  action: "scan",
  include_drift: true
})
```

**Expected response:**
- Hierarchy status: complete/incomplete
- Drift score
- Pending tasks

### Pre-Flight: Check Pending Changes

```typescript
// Validate there are no unapplied changes
hivemind_context({
  action: "validate"
})
```

**If validation fails:**
- Run `hivemind_context({ action: "purge" })` to consolidate
- Run `hivemind_context({ action: "doctor" })` to repair

### Execute: Close Session (with strict gate)

```typescript
hivemind_session({
  action: "close",
  strict_gate: true,
  summary: "[What was accomplished in this session]"
})
```

**What this does:**
- Archives session to `.hivemind/sessions/archive/`
- Preserves hierarchy to `.hivemind/state/hierarchy.json`
- Generates compaction report for next session
- Updates brain state with compaction count
- Clears active phase/task IDs
- Validates all pending changes applied

### Post-Compact: Export Handoff

```typescript
hivemind_cycle({
  action: "export",
  format: "markdown"
})
```

**Expected response:**
- Session summary in markdown
- Trajectory → Tactic → Action tree
- Key learnings to carry forward

## Usage

```bash
/hivemind-session-combo
```

or with summary:

```bash
/hivemind-session-combo --summary="Completed Phase 1: Graph schemas and CQRS enforcement"
```

## Key Differences from Old Compact

| Old `compact_session` | New `hivemind-session-combo` |
|-----------------------|------------------------------|
| Single tool call | Multi-step combo |
| No validation | Pre-flight scan + drift check |
| No pending check | Strict gate on unapplied changes |
| No export | Auto-export for handoff |
| Context lost | Context preserved via cycle export |

## Success Criteria

- [ ] scan shows hierarchy complete or documented gaps
- [ ] strict_gate passes (no pending changes)
- [ ] session archived to archive/
- [ ] cycle export returns handoff summary
- [ ] User informed of archive location

## Failure Handling

| Error | Resolution |
|-------|------------|
| "Strict close gate blocked" | Run `hivemind_context validate` then purge/doctor |
| "Session not found" | Start with `hivemind_session({ action: "start" })` |
| "Drift too high" | Run `hivemind_inspect({ action: "scan", include_drift: true })` first |

## Integration

This combo replaces:
- `compact_session({ summary: "..." })` - DEPRECATED
- `declare_intent` (for session close) - USE combo instead

The combo enforces the full lifecycle: investigate → validate → close → export