---
name: use-hivemind-delegation
description: "When user says 'delegate', 'handoff', or 'send to subagent': establish bounded context, verify scope, route to delegation implementation. Block if scope is unclear."
---

# use-hivemind-delegation

When user wants to delegate work to a subagent: establish the bounded context, verify scope declaration, and route to the delegation implementation specialist. This skill ensures every delegation has explicit boundaries before work begins.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Framework context and lineage |
| `use-hivemind-hierarchy` | For authority verification | Cannot delegate without boundary check |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `hivemind-delegation-write` | Handoff implementation | Scope bounded, contract established |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-hierarchy` | Authority envelope for delegation | Bidirectional |
| `use-hivemind-context-verify` | Completion check after delegation | Bidirectional |

### Activation Chain
```
P0: use-hivemind
    ↓
P1: use-hivemind-hierarchy (authority check)
    ↓
P1: use-hivemind-delegation ← This skill
    ↓
P2: hivemind-delegation-write (implementation)
```

## Anti-Pattern: When NOT to Use This Skill

- User says "just delegate this" without scope → WRONG, scope is mandatory
- Agent says "I'll handle this subagent work myself" → WRONG, never implement in router
- Agent skips result contract → WRONG, every delegation needs return format
- User says "delegate = abandon" → WRONG, delegation preserves context
- Agent doesn't pass parent context to subagent → WRONG, continuity must be maintained
- Agent delegates without user consent → WRONG, scope declaration requires approval

## Process Flow

```digraph delegation-flow {
  "Delegation Request" -> "Scope Declared?"
  "Scope Declared?" -> "Yes" [label="yes"]
  "Scope Declared?" -> "Ask for scope" [label="no"]
  "Yes" -> "Parent Context Linked?"
  "Parent Context Linked?" -> "Yes" [label="yes"]
  "Parent Context Linked?" -> "Request parent link" [label="no"]
  "Yes" -> "Result Contract Defined?"
  "Result Contract Defined?" -> "Yes" [label="yes"]
  "Result Contract Defined?" -> "Establish contract" [label="no"]
  "Yes" -> "Route to specialist"
  "Route to specialist" -> "hivemind-delegation-write"
}
```

## Step-by-Step Protocol

1. **DETECT** — Is this a delegation request?
2. **CHECK** — Is scope explicitly declared?
3. **IF** no scope → Ask user to define boundaries before proceeding
4. **VERIFY** — Is parent context being linked?
5. **ESTABLISH** — Is result contract defined?
6. **ROUTE** — Delegate to `hivemind-delegation-write` for implementation

## Terminal State

- **If scope unclear**: Blocked, awaiting scope declaration from user
- **If all prerequisites met**: Routed to `hivemind-delegation-write`
