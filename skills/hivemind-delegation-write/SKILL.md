---
name: hivemind-delegation-write
description: "When delegation packet is ready: execute handoff protocol, build bounded context, establish result contract. Implementation for use-hivemind-delegation."
---

# hivemind-delegation-write

Implementation skill for delegation handoff. Executes the delegation protocol after `use-hivemind-delegation` has validated scope boundedness and established the result contract.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Framework context |
| `use-hivemind-hierarchy` | Authority verification | Cannot handoff without role check |
| `use-hivemind-delegation` | Always | Validates scope and contract |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `use-hivemind-context-verify` | Completion verification | Delegation completes |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `git-atomic-memory` | Record delegation anchor | Bidirectional |

## When to Activate

This skill activates when `use-hivemind-delegation` routes to it with:
1. Validated scope declaration (bounded)
2. Parent context link established
3. Result contract defined

## Process Flow

```digraph delegation-write {
  "Packet Received" -> "Validate Boundedness"
  "Validate Boundedness" -> "Build Parent Link" [label="valid"]
  "Validate Boundedness" -> "REJECT - Unbounded" [label="invalid"]
  "Build Parent Link" -> "Create Result Contract"
  "Create Result Contract" -> "Execute Handoff"
  "Execute Handoff" -> "Record in Trajectory"
  "Record in Trajectory" -> "Return Packet ID"
}
```

## Step-by-Step Protocol

1. **RECEIVE** — Get validated handoff packet from `use-hivemind-delegation`
2. **VALIDATE** — Confirm scope is bounded (run `scope-validator.cjs`)
3. **BUILD** — Construct subagent context with bounded scope
4. **LINK** — Establish parent context inheritance
5. **CONTRACT** — Create result contract with required fields
6. **EXECUTE** — Send packet to subagent
7. **RECORD** — Log delegation in trajectory
8. **RETURN** — Return packet ID to orchestrator

## Key Principles

- **Bounded scope is mandatory**: Never execute unbounded delegation
- **Parent link is immutable**: Once linked, cannot be changed
- **Result contract is binding**: Executor must comply with contract
- **Chain is auditable**: Every handoff recorded for traceability
- **Implementation not routing**: This skill executes, not routes

## Terminal State

- **Handoff complete**: Packet ID returned, delegation active
- **Handoff failed**: Error reported to orchestrator
- **Awaiting result**: Delegation in flight, waiting for completion
