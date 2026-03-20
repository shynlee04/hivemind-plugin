---
name: use-hivemind-context-integrity
description: "Entry router for context health and rot detection. Routes to context-intelligence-entry for rot checks, context-entry-verify for truth gates, use-hivemind-context-verify for verification needs. PO entry skill for session start and recovery. Triggers: context health, context rot, drift detection, context integrity, session start, after compaction."
---

# use-hivemind-context-integrity

Entry router for context health and rot detection. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Session start, after `/clear`, context confusion, detected drift, pollution warnings.

**Primary Triggers:** "context health", "context rot", "drift detection", "context integrity", "session start", "after compaction"

**Secondary Triggers:** "check context", "context state", "is context clean", "context recovery"

## Two HiveMind Lineages

| Lineage | Purpose | Confusion Pattern |
|---------|---------|-------------------|
| **hivefiver** | Meta-builder: framework skills, agent orchestration | Confusing framework work with project work |
| **hiveminder** | Project-oriented: product implementation | Confusing project work with framework work |

**Rule:** When in self-referential mode, explicitly state which lineage context this belongs to.

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route, gatekeep, detect issue type | Execute detection and recovery |
| **Reading** | Scan for issue patterns | Deep investigation when delegated |
| **Execution** | Delegate, don't implement | Implement directly |
| **Monitoring** | Gatekeep routing | Report with evidence |

**Never** implement rot detection or recovery directly. Always delegate.

## Do NOT Activate When

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery first |
| Session state | `interrupted`/`degraded` | Skip activation |
| Active skills | ≥3 | Wait for slot |
| Deep implementation | Any | Delegate to specialist |

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
| `use-hivemind` | Parent master entry |
| `context-intelligence-entry` | Implementation for rot detection |
| `context-entry-verify` | Implementation for truth gates |
| `use-hivemind-context-verify` | Sibling verification entry |
| `use-hivemind-delegation` | Sibling handoff entry |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about symptoms
- Present routing alternatives

### Degree 2: Medium Freedom (Teaching Mode)
- Explain issue detection logic
- Show routing matrix mapping

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit routing when issue type is clear
- Mandatory health check routing

## Hard Behavior Rules

1. **Context health is prerequisite.** Cannot proceed with degraded context. Route to recovery first.
2. **Routing ≠ implementation.** Never implement rot recovery directly. Delegate to context-intelligence-entry.
3. **Detection before routing.** Parse issue type (drift/pollution/chain break) before delegating.
4. **Health check first.** Always run entry health check before deciding routing path.

---

**Pattern:** P1 (Entry Routing) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget