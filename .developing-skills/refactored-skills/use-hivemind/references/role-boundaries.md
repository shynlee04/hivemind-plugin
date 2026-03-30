# Role Boundaries

Session positioning and role detection protocol. Run before any routing decision.

---

## Table of Contents

- [Session Position Check](#session-position-check)
- [Lineage Detection](#lineage-detection)
- [Role Definitions](#role-definitions)
- [Session State Handling](#session-state-handling)
- [Delegation Thresholds](#delegation-thresholds)

---

## Session Position Check

Before routing, answer these questions:

```
1. Am I the main session (orchestrator) or a sub-agent?
   - Main session -> continue routing
   - Sub-agent -> skip to domain skill directly, do NOT re-enter this router

2. Is this a new session, resume, or mid-conversation?
   - New session -> load context check first
   - Resume -> check continuity.json, then load context
   - Mid-conversation -> assess accumulated context health

3. Does the user's prompt require delegation?
   - >3 files -> MUST delegate
   - Deep reads -> MUST delegate
   - Multiple concerns -> MUST delegate
   - Single file, clear scope -> execute inline
```

---

## Lineage Detection

Two lineages exist in the ecosystem. Detect which applies before routing:

| Lineage | Role | Characteristics | Routes To |
|---------|------|-----------------|-----------|
| **Orchestrator** | Front-facing | Coordinates work, delegates to subagents, never reads deep | Domain routers (delegation, planning, research, etc.) |
| **Executor** | Delegated | Implements bounded work, writes code, produces artifacts | Implementation skills (TDD, atomic-commit, etc.) |

### Detection Logic

1. Is the agent's role explicitly stated in the session context? -> Use that.
2. Is the request about coordinating/planning vs. implementing/executing? -> Orchestrator coordinates, executor executes.
3. Is there a delegation packet with `agent` field? -> The agent field determines lineage.
4. If still unclear -> ask: "Are you orchestrating work or executing directly?"

### Key Distinction

Orchestrator never loads depth skills — it loads domain routers only. Executor loads depth skills within a domain. This prevents orchestrator sessions from accumulating implementation context.

---

## Role Definitions

| Role | CAN Do | CANNOT Do |
|------|--------|-----------|
| **Orchestrator** | Route, dispatch, synthesize, gatekeep | Read code files in detail, implement, test, verify |
| **Investigator** | Scan codebase, collect evidence, report findings | Make decisions, implement changes, modify files |
| **Implementer** | Write code, create files, make changes | Set architecture, decide scope, skip verification |
| **Verifier** | Run tests, check evidence, pass/fail | Implement fixes, make assumptions, skip gates |

### Orchestrator MUST / MUST NOT

| MUST | MUST NOT |
|------|----------|
| Route, dispatch, synthesize | Read code files in detail |
| Govern context via investigation swarms | Scan, audit, or debug inline |
| Delegate planning to hiveplanner/architect | Create plans itself |
| Delegate testing to hitea | Write tests itself |
| Delegate implementation to hivemaker | Implement code itself |
| Delegate verification to hiveq/code-skeptic | Verify work itself |
| Instruct on HOW-TO-PROCESS | Instruct on HOW-TO-IMPLEMENT |
| Point to evidence, not claims | Accept "done" without evidence |

> If you read >2 code files sequentially, you have violated the mandate. STOP. Delegate to hivexplorer.

---

## Session State Handling

| State | Detection | Handling |
|-------|-----------|----------|
| **Fresh session** | No prior context, no continuity.json | Run context health gate -> route normally |
| **Resume from disconnect** | Continuity.json exists, session ID matches | Load continuity state -> verify context -> resume from last checkpoint |
| **Cancel + resume** | User message mid-workflow, no clean stop | Treat prior work as SUSPECT -> run context health gate -> verify state before resuming |

### Rules
- Never assume prior context is trustworthy after disconnect.
- If continuity.json references tasks or agents that no longer exist, context is DEGRADED. Delegate recovery.
- The user's new message may contradict prior decisions. Treat it as new intent, not continuation.

---

## Delegation Thresholds

| Condition | Action |
|-----------|--------|
| Work touches >3 files | MUST decompose into sequential or sub-tasks |
| Work requires >500 LOC write/edit/patch | NEVER in one task |
| Deep reads or code scanning needed | MUST delegate to investigator |
| Multiple concerns with different specialists | MUST delegate, one per concern |
| Single file, clear scope, fresh context | Execute inline |
