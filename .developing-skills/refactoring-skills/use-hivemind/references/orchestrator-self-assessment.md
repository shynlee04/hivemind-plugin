# Orchestrator Self-Assessment

Front-agent awareness protocol for session positioning before routing.

---

## Table of Contents

- [Purpose](#purpose)
- [Session Position Check](#session-position-check)
- [Lineage Detection](#lineage-detection)
- [Session State Handling](#session-state-handling)
- [Delegation Thresholds](#delegation-thresholds)

---

## Purpose

Determine the agent's position in the hierarchy, session state, and whether work should be delegated or executed inline. Run this assessment before any routing decision.

---

## Session Position Check

Before routing, answer these questions:

```
1. Am I the main session (hiveminder/orchestrator) or a sub-agent?
   - Main session → continue routing
   - Sub-agent → skip to domain skill directly, do NOT re-enter this router

2. Is this a new session, resume, or mid-conversation?
   - New session → load use-hivemind-context first
   - Resume → check continuity.json, then load context
   - Mid-conversation → assess accumulated context health

3. Does the user's prompt require delegation?
   - >3 files → MUST delegate
   - Deep reads → MUST delegate
   - Multiple concerns → MUST delegate
   - Single file, clear scope → execute inline
```

---

## Lineage Detection

Two lineages exist in the HiveMind ecosystem. Detect which one applies before routing:

| Lineage | Role | Characteristics | Routes To |
|---------|------|-----------------|-----------|
| **Hiveminder** | Orchestrator | Coordinates work, delegates to subagents, never reads deep | Domain routers (`use-hivemind-delegation`, `use-hivemind-planning`, etc.) |
| **Hivefiver** | Executor | Implements bounded work, writes code, produces artifacts | Implementation skills (`use-hivemind-tdd`, `hivemind-atomic-commit`, etc.) |

**Detection logic:**

1. Is the agent's role explicitly stated in the session context? → Use that.
2. Is the request about coordinating/planning vs. implementing/executing? → Hiveminder coordinates, hivefiver executes.
3. Is there a delegation packet with `agent` field? → The agent field determines lineage.
4. If still unclear → ask: "Are you orchestrating work (hiveminder) or executing directly (hivefiver)?"

**Key distinction:** Hiveminder never loads depth skills — it loads domain routers only. Hivefiver loads depth skills within a domain. This prevents orchestrator sessions from accumulating implementation context.

---

## Session State Handling

| State | Detection | Handling |
|-------|-----------|----------|
| **Fresh session** | No prior context, no continuity.json | Run context health gate → route normally |
| **Resume from disconnect** | Continuity.json exists, session ID matches | Load continuity state → verify context → resume from last checkpoint |
| **Cancel + resume** | User message mid-workflow, no clean stop | Treat prior work as SUSPECT → run context health gate → verify state before resuming |

**Rules:**
- Never assume prior context is trustworthy after disconnect. Always run the context health gate first.
- If continuity.json references tasks or agents that no longer exist, context is DEGRADED. Delegate recovery.
- The user's new message may contradict prior decisions. Treat it as new intent, not continuation.

---

## Delegation Thresholds

| Condition | Action |
|-----------|--------|
| Work touches >3 files | MUST decompose into sequential or sub-tasks |
| Work requires >500 LOC write/edit/patch | NEVER in one task |
| Deep reads or code scanning needed | MUST delegate to hivexplorer |
| Multiple concerns with different specialists | MUST delegate, one per concern |
| Single file, clear scope, fresh context | Execute inline |

---

_Meta: purpose=session-positioning-and-lineage-detection | loaded_when=every-session-entry | parent_skill=use-hivemind_
