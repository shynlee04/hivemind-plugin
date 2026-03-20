---
name: use-hivemind-context-integrity
description: Entry router for context health and rot detection. Routes to context-intelligence-entry for rot checks, context-entry-verify for truth gates, use-hivemind-context-verify for verification needs. PO entry skill for session start and recovery. Triggers: "context health", "context rot", "drift detection", "context integrity", "session start", "after compaction".
---

# use-hivemind-context-integrity

Entry router for context health and rot detection. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Session start, after `/clear`, context confusion, detected drift, pollution warnings.

**Primary Triggers:** "context health", "context rot", "drift detection", "context integrity", "session start", "after compaction"

**Secondary Triggers:** "check context", "context state", "is context clean", "context recovery"

## Do NOT Activate When

| Condition | Action |
|-----------|--------|
| Deep implementation needed | Delegate to context-intelligence-entry |
| Project truth verification | Delegate to context-entry-verify |
| Active skills ≥3 | Skip activation (stack budget) |
| User requests specific skill | Route directly to that skill |

## Routing Decision Matrix

| Detected Issue | Route To | Priority |
|----------------|----------|----------|
| Drift > threshold | `context-intelligence-entry` | HIGH |
| Pollution detected | `context-entry-verify` | HIGH |
| Chain break detected | `use-hivemind-delegation` | MEDIUM |
| Verification needed | `use-hivemind-context-verify` | MEDIUM |
| Clean state | No routing needed | NONE |

## Detection Keywords

| Keyword Pattern | Issue Type | Route |
|-----------------|------------|-------|
| "rot", "drift", "stale" | Context health | `context-intelligence-entry` |
| "pollution", "poison" | Context integrity | `context-entry-verify` |
| "chain break", "handoff failed" | Delegation issue | `use-hivemind-delegation` |
| "verify", "truth", "proof" | Verification | `use-hivemind-context-verify` |
| "clean", "healthy", "good state" | Clean state | Proceed |

## Routing Protocol

1. **DETECT** — Parse issue type from context or user request
2. **MATCH** — Apply detection keywords to routing matrix
3. **ROUTE** — Invoke the appropriate specialist skill
4. **DEFER** — If uncertain, ask clarifying question

## Specialist Skills (Implementation)

| Skill | Purpose | Owned By |
|-------|---------|----------|
| `context-intelligence-entry` | Rot detection, session health | existing |
| `context-entry-verify` | Project truth gates | existing |
| `use-hivemind-delegation` | Handoff recovery | P0 (missing) |
| `use-hivemind-context-verify` | Verification protocol | P1 (pattern) |

## Entry Health Check

Run this check to determine routing:

```bash
node skills/context-intelligence-entry/scripts/context-harness-init.cjs --quick
```

**Result Interpretation:**
- `can_proceed: true` → Clean state, no routing
- `issues: [...]` → Parse issue type, route to specialist

## What This Skill Does NOT Do

| ❌ Not Allowed | Reason |
|----------------|--------|
| Implement rot checks | Delegate to context-intelligence-entry |
| Implement verification | Delegate to context-entry-verify |
| Duplicate context-intelligence-entry content | Routing layer only |
| Implement delegation logic | Delegate to use-hivemind-delegation |

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `context-intelligence-entry` | Implementation for rot detection |
| `context-entry-verify` | Implementation for truth gates |
| `use-hivemind-context-verify` | Entry router for verification |
| `use-hivemind-delegation` | Entry router for handoffs |
| `use-hivemind` | Master entry point (parent) |

## NO-LOAD Rules

Active skills ≥3 → Skip activation. If user specifies skill directly → Route directly. If deep implementation needed → Delegate, do not load.

---

**Pattern:** P1 (Entry Routing) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget