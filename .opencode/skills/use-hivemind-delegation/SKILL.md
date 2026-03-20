---
name: use-hivemind-delegation
description: Entry router for handoff protocol and scope inheritance. Routes to
  delegation implementation for bounded packets, parent context, result
  contracts, and chain auditing. P1 skill for delegation workflows.
---

# use-hivemind-delegation

Entry router for HiveMind delegation workflow. Routes, does NOT implement.

## When to Activate

**Primary Triggers:** "delegate", "handoff", "subagent scope", "parent context", "delegation packet", "bounded context", "handoff protocol"

**Secondary Triggers:** "subagent", "delegation", "scope inheritance", "result contract", "chain audit", "bounded delegation"

## Do NOT Activate When

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery first |
| Session state is degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Skip activation |
| Authority unclear | Conflicting SOT | Escalate first |
| Domain work (not delegation) | User implementing features | Use domain skills directly |

## Two HiveMind Lineages

| Lineage | Purpose | Confusion Pattern |
|---------|---------|-------------------|
| **hivefiver** | Meta-builder lineage: skills that build skills, agent orchestration | Confusing self-referential work with project work |
| **hiveminder** | Project-oriented lineage: skills that apply to project work | Treating project work as framework work |

**Rule:** Delegation applies to both lineages. hivefiver delegates to meta-builder subagents. hiveminder delegates to project subagents.

## Routing Logic

```
DELEGATION CONTEXT DETECTED:
├── incoming-handoff → route to handoff processing
├── scope-declaration → route to scope boundary setting
├── parent-link → route to parent-child relationship documentation
├── result-contract → route to return format establishment
├── chain-audit → route to delegation traceability
│
├── IMPLEMENTATION:
│   ├── hivemind-delegation-write → full implementation
│   └── hivemind-delegation-doctor → audit/repair
│
└── UNKNOWN
    └── Ask clarifying question before routing
```

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route, gatekeep, teach boundaries | Execute delegation implementation |
| **Reading** | Broad delegation context | Deep handoff packet analysis |
| **Execution** | Delegate, don't implement | Process handoff packets |
| **Monitoring** | Gatekeep delegation quality | Report back with results |
| **Depth** | Strategic delegation overview | Detailed packet processing |

**Never** let this skill jump into the specialist implementation role without explicit handoff to a sub-skill.

## NO-LOAD Rules

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to `use-hivemind-context-integrity` |
| Session state is degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Wait for slot |
| Authority unclear | Conflicting SOT | Escalate first |
| No scope declared | No explicit boundaries | Ask for scope before routing |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about delegation intent
- Present delegation alternatives
- "Best when / better when" delegation patterns

### Degree 2: Medium Freedom (Teaching Mode)
- Explain handoff packet structure
- Show result contract templates
- Demonstrate scope inheritance patterns

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit routing when delegation type is clear
- Mandatory result contract enforcement
- Fixed handoff packet processing

## Platform Knowledge

### OpenCode-Specific Delegation

| Concept | OpenCode Implementation |
|---------|------------------------|
| **Delegation** | Task tool with `subagent_type` parameter |
| **Handoff Packet** | JSON package with scope, context, artifacts |
| **Result Contract** | Explicit return format specification |
| **Scope Declaration** | Bounded context in delegation packet |
| **Parent Context** | Session state passed to subagent |
| **Chain Audit** | Delegation history in trajectory |

### TaskTool Pattern

```typescript
// Delegation via TaskTool
{
  subagent_type: "hiverd" | "hiveq" | "hivexplorer" | ...,
  prompt: "Bounded packet with explicit scope",
  task_id: "optional-continuation"
}
```

## Hard Behavior Rules

1. **Delegation requires scope.** Never delegate without explicit scope declaration. Ask for scope before routing.

2. **Result contract is mandatory.** Every delegation needs a return format. Reference template, don't use implementation.

3. **Parent context must be inherited.** Subagent must understand caller context. Handoff packet must include previous turn artifacts.

4. **Chain must be auditable.** Every delegation recorded for traceability. Reference chain audit format, don't implement.

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `use-hivemind-context-integrity` | Prerequisite - context health before delegation |
| `hivemind-delegation-write` | Implementation layer - route to for handoff processing |
| `hivemind-delegation-doctor` | Audit layer - route to for delegation quality check |
| `use-hivemind-session-resume` | Session continuation - coordinates with delegation |
| `harness-architecture` | SDK harness - delegation architecture reference |

## References

| Reference | When to Load |
|-----------|--------------|
| `hivemind-delegation-write/SKILL.md` | When routing for handoff packet implementation |
| `harnes-architecture/SKILL.md` | When OpenCode delegation patterns needed |
| `AGENTS.md` | When delegation network architecture needed |

---

**Pattern:** P1 (Entry Layer) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget