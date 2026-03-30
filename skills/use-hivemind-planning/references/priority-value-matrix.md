# Priority × Value Matrix

Use this matrix to classify task urgency after decomposition. Priority drives dispatch order and escalation thresholds.

## Priority Levels

### P0 — Critical

| Attribute | Value |
|-----------|-------|
| **Definition** | Blocks release, introduces security vulnerability, or causes data loss |
| **Response SLA** | Immediate — dispatch within current session |
| **Escalation** | Auto-escalate to user if unresolved after 1 attempt |
| **Examples** | Security hole in auth flow, data corruption bug, build-breaking regression |

**Criteria:**
- Feature is completely broken in production
- Security vulnerability with exploit potential
- Data integrity risk (loss, corruption, unauthorized access)
- Release cannot ship without resolution

### P1 — High

| Attribute | Value |
|-----------|-------|
| **Definition** | Major feature broken or significant performance regression |
| **Response SLA** | This sprint — dispatch in next wave |
| **Escalation** | Escalate if blocked >2 phases |
| **Examples** | Core tool not returning results, API contract broken, 50%+ perf degradation |

**Criteria:**
- Major feature partially or fully non-functional
- Performance regression affecting user experience
- Integration contract violation blocking other work
- Workaround exists but is unacceptable long-term

### P2 — Medium

| Attribute | Value |
|-----------|-------|
| **Definition** | Minor feature issue or tech debt blocking future work |
| **Response SLA** | Next sprint — plan into upcoming phases |
| **Escalation** | Standard — track in plan record |
| **Examples** | Edge case in error handling, missing validation, refactoring prerequisite |

**Criteria:**
- Minor feature defect with workaround available
- Tech debt that will block future features if not addressed
- Missing tests or documentation for critical paths
- Non-blocking integration gap

### P3 — Low

| Attribute | Value |
|-----------|-------|
| **Definition** | Nice-to-have, cosmetic, or documentation improvement |
| **Response SLA** | Backlog — no scheduled dispatch |
| **Escalation** | None — re-evaluate each planning cycle |
| **Examples** | Code style inconsistency, README update, logging improvement |

**Criteria:**
- Cosmetic issue with no functional impact
- Documentation gap that doesn't block onboarding
- Optimization opportunity with marginal benefit
- Future-proofing with no current blocker

## Decision Table: Priority × Business Value

|  | **High Business Value** | **Medium Business Value** | **Low Business Value** |
|--|------------------------|--------------------------|----------------------|
| **P0** | Immediate dispatch — single-agent, single-sprint | Immediate dispatch — confirm scope, then execute | Immediate dispatch — verify not over-scoped |
| **P1** | Next wave — include in current sprint planning | Current sprint — single-slice delegation | Next sprint — batch with related P2s |
| **P2** | Plan for next sprint — allocate dedicated wave | Backlog — review at next planning cycle | Backlog — deprioritize unless blocking |
| **P3** | Backlog — re-assess if value changes | Backlog — no action | Drop — not worth tracking |

## Usage in HiveMind Planning

After decomposition produces slices, apply priority classification:

```
Decomposition complete
  → Classify each slice (P0–P3)
    → Sort by priority, then business value
      → P0 slices: dispatch immediately, bypass wave batching
        → P1 slices: include in current sprint wave
          → P2/P3 slices: schedule or backlog
```

Priority is sticky — it does not change during execution unless new evidence emerges (e.g., a P2 blocker reveals it's actually P0). Re-classification requires a plan record update.
