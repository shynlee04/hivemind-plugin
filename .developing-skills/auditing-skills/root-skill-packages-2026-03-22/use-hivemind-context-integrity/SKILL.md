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
| `context-intelligence-entry` | Rot recovery | rot_level = SUSPECT or DEGRADED |
| `context-entry-verify` | Truth verification | rot_level = POLLUTED or POISONED |
| `use-hivemind-delegation` | Delegation issues | Delegation chain break detected |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-context-verify` | Verifier checks truth after integrity clears | Bidirectional |
| `use-hivemind-delegation` | Delegation continuity | Bidirectional |

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

## Routing Decision Matrix

| Symptom | rot_level (from script) | Route To |
|---------|-------------------------|---------|
| Stale context | SUSPECT | `context-intelligence-entry` |
| Mild rot | DEGRADED | `context-intelligence-entry` |
| Severe rot | POLLUTED | `context-entry-verify` |
| Hallucination/contamination | POISONED | `context-entry-verify` |
| Clean | CLEAN | Proceed |

## Step-by-Step Protocol

1. **STACK CHECK** — Verify stack budget allows routing (check if this is the right depth)
2. **DETECT** — Is there a context health issue in the session?
3. **RUN** — Execute entry health check script
4. **PARSE** — Determine issue type using Routing Decision Matrix above:
   - `rot_level = SUSPECT` or `DEGRADED` → Route to `context-intelligence-entry`
   - `rot_level = POLLUTED` or `POISONED` → Route to `context-entry-verify`
   - `rot_level = CLEAN` → Proceed without routing
5. **ROUTE** — Invoke the identified specialist skill
6. **BLOCK** — If health check fails, do NOT proceed with work until resolved

## Terminal State

- **If clean**: Proceed with current work, no routing needed
- **If SUSPECT/DEGRADED**: Routed to `context-intelligence-entry` for rot detection
- **If POLLUTED/POISONED**: Routed to `context-entry-verify` for truth verification
- **If delegation issue**: Routed to `use-hivemind-delegation` for chain repair
