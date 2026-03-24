---
name: use-hivemind-hierarchy
description: "Entry router for role boundaries, agent authority, and permission envelopes. Routes to agent-role-boundary and permission design skills. P1 skill for hierarchy management."
---

# use-hivemind-hierarchy

When user asks about agent roles, authority, or permissions: route to the agent-role-boundary specialist. This skill enforces the Diamond model where orchestrators delegate, executors implement, verifiers validate, and researchers investigate—never crossing these boundaries.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Framework context and lineage |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `agent-role-boundary` | Diamond model enforcement | Role boundary questions |
| `permission-design` | Permission envelope setup | Access/envelope questions |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-delegation` | Authority verification before delegation | Bidirectional |
| `use-hivemind-context-integrity` | Hierarchy affects context chain | Bidirectional |

### Activation Chain
```
P0: use-hivemind
    ↓
P1: use-hivemind-hierarchy ← This skill
    ↓
P2: agent-role-boundary (implementation)
```

## Anti-Pattern: When NOT to Use This Skill

- User wants to implement product code → WRONG, this is hierarchy routing, not implementation
- Agent acts as orchestrator AND executor → WRONG, Diamond model violations terminate immediately
- Agent says "all agents can delegate" → WRONG, only orchestrators delegate
- User says "boundary violations are just warnings" → WRONG, critical violations halt execution
- Agent grants itself permissions → WRONG, authority flows from user consent
- Agent skips boundary check before handoff → WRONG, mandatory check before delegation

## Process Flow

```digraph hierarchy-flow {
  "Hierarchy Question" -> "Identify Type"
  "Identify Type" -> "Role Boundary?" [label="role/diamond/separation"]
  "Identify Type" -> "Permission?" [label="access/envelope/toolkit"]
  "Identify Type" -> "Authority?" [label="who decides/escalation"]
  "Identify Type" -> "Profile?" [label="agent definition/capability"]
  "Role Boundary?" -> "Route to agent-role-boundary" [label="yes"]
  "Permission?" -> "Route to permission design" [label="yes"]
  "Authority?" -> "Route to governance" [label="yes"]
  "Profile?" -> "Route to profile management" [label="yes"]
}
```

## Step-by-Step Protocol

1. **DETECT** — Is this a hierarchy or role question?
2. **IDENTIFY** — Which hierarchy type applies?
3. **VERIFY** — Is this for hivefiver (meta-builder) or hiveminder (project) lineage?
4. **CHECK** — Does this violate Diamond model?
5. **IF** violation → BLOCK immediately, report violation
6. **ROUTE** — Invoke appropriate specialist

## Terminal State

- **If role boundary question**: Routed to `agent-role-boundary`
- **If permission question**: Routed to permission design skill
- **If authority escalation**: Routed to governance enforcement
- **If violation detected**: BLOCKED, awaiting resolution
