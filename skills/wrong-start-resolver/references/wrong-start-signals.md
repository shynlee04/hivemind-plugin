# Wrong-Start Signal Taxonomy

**REFERENCE**: Load this to understand the full spectrum of wrong-start conditions and their resolution paths.

## Signal Categories

### Category 1: Lineage Mismatch

The agent was spawned under the wrong orchestrator lineage.

| Signal | Confidence | Example |
|--------|-----------|---------|
| User says "fix bug in src/" but orchestrator is hivefiver | **High** | Product task routed to framework orchestrator |
| User says "add a skill" but orchestrator is hiveminder | **High** | Framework task routed to product orchestrator |
| Mixed signals: "refactor auth module using new skill pattern" | **Medium** | Could be either — clarify before resolving |
| No explicit lineage signals in user message | **Low** | Default to asking, not assuming |

**Resolution path**: Gather intent → compose restart with correct lineage → STOP.

### Category 2: Domain Mismatch

The agent has the right lineage but wrong domain specialization.

| Signal | Confidence | Example |
|--------|-----------|---------|
| Task requires database expertise, agent is frontend-specialist | **High** | Wrong executor for the domain |
| Task requires research, agent is execution-focused | **High** | Researcher needed, executor spawned |
| Task scope spans multiple domains | **Medium** | May need orchestrator, not executor |

**Resolution path**: Identify required specialization → compose restart with correct agent type → STOP.

### Category 3: Tool Unavailability

The platform doesn't provide the tools needed for the task.

| Signal | Confidence | Example |
|--------|-----------|---------|
| Task needs browser testing, no browser tools available | **High** | Platform limitation |
| Task needs shell execution, non-interactive only | **Medium** | Partial capability — may still work |
| Task needs file creation, only read tools present | **High** | Read-only environment |

**Resolution path**: Document what's needed → suggest platform switch or tool install → STOP.

### Category 4: Command Misroute

The user used wrong command or entry point to start the session.

| Signal | Confidence | Example |
|--------|-----------|---------|
| User explicitly says "wrong command" or "wrong agent" | **Very High** | Direct admission |
| Session loaded skills for domain A, user asks about domain B | **High** | Skill set mismatch |
| Entry protocol detected contradictions | **Medium** | Entry gates failing |

**Resolution path**: Acknowledge misroute → gather correct intent → compose restart → STOP.

## Confidence-Based Routing

```
Confidence = Very High or High
  → Proceed directly to COMPOSE restart message

Confidence = Medium
  → Ask ONE clarifying question first
  → Then re-evaluate

Confidence = Low
  → Do NOT trigger wrong-start
  → Instead: document uncertainty, proceed cautiously
  → Monitor for escalation to Medium/High
```

## Warning: False Positives

Not every mismatch is a wrong-start. Some legitimate scenarios:

- **Cross-domain learning**: User wants a framework agent to review product code patterns
- **Research phase**: Any lineage can do research regardless of domain
- **Exploration**: User is trying different approaches intentionally

Before resolving as wrong-start, check: **"Is the user AWARE this is cross-domain?"** If yes, it's not a wrong-start.
