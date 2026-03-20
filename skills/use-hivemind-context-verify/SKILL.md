---
name: use-hivemind-context-verify
description: "When user claims 'done', 'verify', or 'check': run build/test/git gates against project state. Block completion if any gate fails. Returns pass/fail with evidence."
---

# use-hivemind-context-verify

When user claims work is complete or asks to verify: run gates and block until evidence is shown. This skill routes verification requests to the gate execution specialist and enforces that completion claims are backed by deterministic proof.

## Integration

### Upstream Dependencies
| Skill | Required Before | Why |
|-------|----------------|-----|
| `use-hivemind` | Always | Framework context required |
| `use-hivemind-context-integrity` | Before verification | Context must be healthy before truth-seeking |

### Downstream Routes
| Skill | Routes To | When |
|-------|-----------|------|
| `context-entry-verify` | Gate execution | All verification requests |

### Cross-Domain Coupling
| Coupled Skill | Relationship | Direction |
|---------------|-------------|-----------|
| `use-hivemind-context-integrity` | Verify after integrity cleared | Bidirectional |
| `use-hivemind-delegation` | Completion check before handoff | Bidirectional |

### Activation Chain
```
P0: use-hivemind
    ↓
P1: use-hivemind-context-integrity (health check)
    ↓
P1: use-hivemind-context-verify ← This skill
    ↓
P2: context-entry-verify (implementation)
```

## Anti-Pattern: When NOT to Use This Skill

- User says "just trust me, it's done" → WRONG, must run gates
- Agent thinks "this is a small change, skip verification" → WRONG, never skip
- User says "looks good to me" without evidence → WRONG, need deterministic proof
- Agent bypasses gates to "move faster" → WRONG, gates are non-negotiable
- Agent says "verify = validate" → WRONG, verify is truth-seeking, not compliance-checking
- User asks "check if my context is healthy" → WRONG, route to context-integrity instead

## Process Flow

```digraph context-verify {
  "User claims 'done'" -> "Detect verification need"
  "Detect verification need" -> "Run build gate"
  "Run build gate" -> "Build passes?"
  "Build passes?" -> "Run test gate" [label="yes"]
  "Build passes?" -> "BLOCK + Report" [label="no"]
  "Run test gate" -> "Tests pass?"
  "Tests pass?" -> "Run git gate" [label="yes"]
  "Tests pass?" -> "BLOCK + Report" [label="no"]
  "Run git gate" -> "Git clean?"
  "Git clean?" -> "Report PASS" [label="yes"]
  "Git clean?" -> "BLOCK + Report" [label="no"]
}
```

## Step-by-Step Protocol

1. **DETECT** — Did user claim done OR request verification?
2. **INFORM** — Tell user you are running gates
3. **ROUTE** — Delegate to `context-entry-verify` with appropriate gate type
4. **RUN build gate** — `npx tsc --noEmit` or equivalent
5. **IF fail** → BLOCK, report failure with evidence, STOP
6. **RUN test gate** — `npm test` or equivalent
7. **IF fail** → BLOCK, report failure with evidence, STOP
8. **RUN git gate** — `git status` check
9. **IF all pass** → Report PASS, accept completion

## Terminal State

- **If gates pass**: Completion accepted, proceed
- **If gates fail**: Blocked, awaiting user instruction
