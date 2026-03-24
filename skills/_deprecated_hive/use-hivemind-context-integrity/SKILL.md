---
name: use-hivemind-context-integrity
description: "When context rot, drift, or pollution is detected: run context health checks, route to rot/pollution specialists. Block work when context health fails."
---

# use-hivemind-context-integrity

Detect context health issues (rot, drift, pollution) and route to the correct recovery specialist. When context feels stale, contaminated, or broken, this skill diagnoses the issue type and hands off to the appropriate implementation.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Establishes framework context and lineage |
| `context-intelligence-entry` | For rot detection | Cannot detect drift without health baseline |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `context-intelligence-entry` | Rot recovery | rot_level = DRIFT |
| `context-entry-verify` | Truth verification | rot_level = POLLUTION |
| `harness-architecture` | Delegation recovery | rot_level = CHAIN_BREAK |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-context-verify` | Verifier checks truth after integrity clears | Bidirectional |
| `use-hivemind-delegation` | Chain break affects delegation continuity | Bidirectional |

### Activation Chain
```
P0: use-hivemind
    ↓
P1: context-intelligence-entry (session health)
    ↓
P1: use-hivemind-context-integrity ← This skill
    ↓
P2: context-entry-verify (implementation)
```

## Anti-Pattern: When NOT to Use This Skill

- User says "verify my build passed" → WRONG, this is health detection, not verification
- Agent thinks "context is stale but I'll just continue" → WRONG, context health is prerequisite for all work
- Agent says "drift = pollution" → WRONG, drift is gradual staleness, pollution is sudden contamination
- Agent runs rot detection directly → WRONG, never implement in a router, always delegate
- User says "my context is fine" without checking → WRONG, must verify with health check

## Process Flow

```digraph context-integrity {
  "Context Health Issue Detected" -> "Parse Issue Type"
  "Parse Issue Type" -> "Drift?" [label="rot/stale/decay"]
  "Parse Issue Type" -> "Pollution?" [label="poison/contaminated"]
  "Parse Issue Type" -> "Chain Break?" [label="handoff failed"]
  "Parse Issue Type" -> "Clean?" [label="healthy/fresh"]
  "Drift?" -> "Route to context-intelligence-entry" [label="yes"]
  "Pollution?" -> "Route to context-entry-verify" [label="yes"]
  "Chain Break?" -> "Route to harness-architecture" [label="yes"]
  "Clean?" -> "Proceed with work" [label="yes"]
  "Clean?" -> "BLOCK - Unknown issue" [label="no"]
}
```

## Step-by-Step Protocol

1. **DETECT** — Is there a context health issue in the session?
2. **RUN** — Execute entry health check script
3. **PARSE** — Determine issue type:
   - `rot_level = DRIFT` → Route to `context-intelligence-entry`
   - `rot_level = POLLUTION` → Route to `context-entry-verify`
   - `rot_level = CHAIN_BREAK` → Route to `harness-architecture`
   - `rot_level = CLEAN` → Proceed without routing
4. **ROUTE** — Invoke the identified specialist skill
5. **BLOCK** — If health check fails, do NOT proceed with work until resolved

## Terminal State

- **If clean**: Proceed with current work, no routing needed
- **If drift**: Routed to `context-intelligence-entry` for rot detection
- **If pollution**: Routed to `context-entry-verify` for truth verification
- **If chain break**: Routed to `harness-architecture` for delegation recovery
