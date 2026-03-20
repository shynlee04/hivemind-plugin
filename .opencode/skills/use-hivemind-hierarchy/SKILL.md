---
name: use-hivemind-hierarchy
description: Entry router for role boundaries, agent authority, and permission
  envelopes. Routes to agent-role-boundary and permission design skills. P1
  skill for hierarchy management.
---

# use-hivemind-hierarchy

Entry router for HiveMind role boundaries and authority management.

## When to Activate

Activate when the user wants to:

| Intent Category | Trigger Phrases |
|------------------|------------------|
| **Role Definition** | `role boundary`, `agent hierarchy`, `what role does...`, `which agent should...`, `orchestrator vs executor` |
| **Authority** | `authority`, `permission envelope`, `who can...`, `delegation authority`, `decision authority` |
| **Agent Profile** | `agent profile`, `define agent`, `agent capabilities`, `agent permissions` |
| **Boundary Enforcement** | `boundary violation`, `role confusion`, `acting outside role`, `delegation recursion` |
| **Escalation** | `escalation rule`, `when to escalate`, `blocked executor`, `verifier finding` |

## Do NOT Activate When

| Condition | Reason | What to Use Instead |
|-----------|--------|---------------------|
| User wants to **implement** product code | This is domain execution, not hierarchy | Load domain-specific skills directly |
| Request is about framework skill authoring | Framework work uses different pattern | Load `use-hivemind-skill-writer` |
| Request is about context health | Context governance is separate domain | Load `use-hivemind-context-integrity` |
| Another hierarchy skill is already active | Conflict | Defer to active skill |

## False Equivalences to Avoid

| Mistaken Assumption | Reality |
|--------------------|---------|
| "Role boundaries are permissions" | Boundaries define WHAT an agent does; permissions define WHAT it CAN access |
| "Orchestrators execute" | Orchestrators delegate and validate—never implement directly |
| "All agents can delegate" | Only orchestrators can delegate; executors, verifiers, researchers cannot |
| "Boundary violations are warnings" | Critical violations terminate execution immediately |

## Two HiveMind Lineages

Hierarchy questions depend on lineage context:

| Lineage | Hierarchy Focus | Confusion Pattern |
|---------|-----------------|-------------------|
| **hivefiver** | Meta-builder authority for framework assets | Confusing framework authority with product authority |
| **hiveminder** | Product development roles and permissions| Confusing product roles with framework roles |

**Rule:** Always clarify which lineage's authority structure applies before routing.

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route to correct boundary skill | Enforce specific boundary rules |
| **Reading** | Light scan for routing signals | Deep investigation when delegated |
| **Execution** | Delegate, never enforce directly | Execute boundary checks |
| **Monitoring** | Gatekeep routing correctness | Report violations with evidence |

**Never** let this skill enforce boundaries directly—always route to specialists.

## Routing Logic

```
HIERARCHY REQUEST:
├── role-boundary ──────────────────→ agent-role-boundary
│   (Diamond model, role separation)
│
├── permission-envelope ─────────────→ [permission design skill]
│   (Access control, toolkit bounds)
│
├── authority-check ─────────────────→ [governance enforcement]
│   (Who decides, escalation paths)
│
├── agent-profile ───────────────────→ [profile management]
│   (Agent definition, capabilities)
│
└── UNKNOWN
    └── Ask clarifying question before routing
```

## NO-LOAD Rules

DoNOT activate this skill when:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds |>70% | Defer to context recovery first |
| Session state is degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Skip activation |
| Delegation packet unclear | Missing scope declaration | Request clarification first |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about lineage context
- Present routing alternatives
- "Best when / better when" distinctions for role questions

### Degree 2: Medium Freedom (Teaching Mode)
- Explain Diamond role model concepts
- Show boundary violation taxonomy
- Guide escalation rule selection

### Degree 3: Low Freedom (Deterministic Mode)
- Direct routing when intent is clear
- Mandatory boundary check before handoff
- Explicit violation severity classification

## Platform Knowledge

### OpenCode Agent Hierarchy

| Agent | Role | Can Delegate |
|-------|------|:------------:|
| `hiveminder` | Orchestrator (project) | ✅ |
| `hivefiver` | Orchestrator (meta-builder) | ✅ |
| `hivexplorer` | Researcher | ❌ |
| `hiverd` | Researcher | ❌ |
| `hiveq` | Verifier | ❌ |
| `hiveplanner` | Planner | ❌ |
| `hivemaker` | Executor | ❌ |
| `hivehealer` | Executor | ❌ |

## Hard Behavior Rules

1. **Orchestrators do not implement.** hivefiver/hiveminder delegate, never execute directly.

2. **Authority flows from user.** Permission envelopes originate from user consent, not agent self-granting.

3. **Boundary violations halt execution.** Role violations must be surfaced immediately—no "fixing while here."

4. **Single-agent platforms collapse roles to phases.** The Diamond model is conceptual; roles become sequential hat-switches on single-agent platforms.

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `agent-role-boundary` | Implementation layer— Diamond model enforcement |
| `use-hivemind-delegation` | Sibling— handoff protocol and scope inheritance |
| `use-hivemind-skill-writer` | Parent— meta-builder entry (for framework roles) |

## References

| Reference | When to Load |
|-----------|--------------|
| `agent-role-boundary/SKILL.md` | When routing to role-boundary specialist |
| `agent-role-boundary/references/role-platform-mapping.md` | When platform adaptation is needed |
| `agent-role-boundary/templates/role-declaration.md` | When agent profiling is requested |