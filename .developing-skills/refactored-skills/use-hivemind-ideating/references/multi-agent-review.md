# Multi-Agent Review

Active in **Phase 4** of `use-hivemind-ideating` SKILL.md. Three specialized agents review the validated idea before cross-stack research.

## Table of Contents

- Agent Roles
- Dispatch Protocol
- Disposition Criteria
- Conflict Resolution
- Return Contract
- Escalation
- Anti-Patterns

## Agent Roles

### Skeptic

**Mission:** Find gaps in the design. Assume the approach will fail and prove why.

| Rule | Boundary |
|------|----------|
| **MAY** | Identify missing edge cases, question assumptions, stress-test logic, flag unvalidated claims |
| **MAY NOT** | Propose new features, redesign the solution, add scope |

**Questions the Skeptic asks:**
- "What happens when [edge case]?"
- "How does this handle [failure mode]?"
- "What's the evidence for [assumption]?"
- "What breaks if [dependency] changes?"

### Constraint Guardian

**Mission:** Evaluate architectural and infrastructure concerns.

| Rule | Boundary |
|------|----------|
| **MAY** | Flag violations of CQRS, SDK-first rule, authority principle; identify infra risks; check resource constraints |
| **MAY NOT** | Debate product goals, argue against user needs, propose alternative features |

**Questions the Constraint Guardian asks:**
- "Does this violate [governance rule]?"
- "What's the impact on [existing system]?"
- "Does this create a new authority surface?"
- "Is this compatible with the SDK contract?"

### User Advocate

**Mission:** Evaluate cognitive load, UX, and operator experience.

| Rule | Boundary |
|------|----------|
| **MAY** | Flag complexity for end users, question workflow friction, assess learning curve, evaluate output clarity |
| **MAY NOT** | Redesign architecture, change technical approach, add new features |

**Questions the User Advocate asks:**
- "How many steps does the user need?"
- "Will a new user understand this?"
- "Does this increase or decrease cognitive load?"
- "Is the output actionable?"

## Dispatch Protocol

**Sequential — never parallel.** Each agent builds on the prior agent's findings.

### Order

1. **Skeptic** first — finds logical gaps before others invest in detail
2. **Constraint Guardian** second — evaluates feasibility of surviving Skeptic scrutiny
3. **User Advocate** third — assesses experience of a design that is architecturally sound

### Dispatch Format

Each agent receives:
- The context brief from Phase 1
- The confirmed approach from Phase 2 (post-Lock)
- The quality gate results from Phase 3
- The prior agent's findings (except the first agent)

### Agent Launch

```
Task(
  description: "[Role] review of [feature name]",
  prompt: [Full review brief with constraints],
  subagent_type: "hiveq" or "hivexplorer"
)
```

## Disposition Criteria

| Disposition | Meaning | Evidence Required | Next Step |
|-------------|---------|------------------|-----------|
| **APPROVED** | Design is sound, proceed | ≥2 agents approve with specific evidence | Advance to Phase 5 |
| **REVISE** | Issues found, fixable | Specific issues listed with severity | Return to Phase 2 or 3 |
| **REJECT** | Fundamental flaw | Critical issue that invalidates the approach | Abandon or restart from Phase 1 |

### Approval Counting

- Need **≥2 of 3** agents to approve for APPROVED disposition
- One agent with REVISE + two APPROVED → overall REVISE (address the concern)
- One agent with REJECT → overall REJECT (even if others approve)

## Conflict Resolution

### When Agents Disagree

| Scenario | Resolution |
|----------|-----------|
| Skeptic rejects, others approve | REJECT — Skeptic veto is respected for logical gaps |
| Constraint Guardian rejects, others approve | REJECT — architectural violations are non-negotiable |
| User Advocate rejects, others approve | REVISE — UX concerns are important but fixable |
| Two agents REVISE for different reasons | REVISE — address both, return to Phase 2 |
| All three REVISE | REJECT — too many issues; restart from Phase 1 |

### Arbitration

If the orchestrator disagrees with agent dispositions:
1. Log the disagreement in Decision Log
2. Present the conflict to the user
3. User decides — user authority overrides all agents

## Return Contract

Each agent must return:

```json
{
  "role": "skeptic" | "constraint-guardian" | "user-advocate",
  "disposition": "APPROVED" | "REVISE" | "REJECT",
  "findings": [
    {
      "severity": "critical" | "major" | "minor",
      "category": "logic" | "architecture" | "ux" | "scope",
      "description": "[What the issue is]",
      "evidence": "[Why it's an issue]",
      "suggestion": "[How to fix it — optional]"
    }
  ],
  "summary": "[One-sentence overall assessment]"
}
```

## Escalation

### When to Escalate to User

| Trigger | Action |
|---------|--------|
| All three agents REJECT | Present findings, ask user: "Do you want to abandon or restart?" |
| Agent conflict unresolvable | Present both sides, let user arbitrate |
| Skeptic finds fundamental design flaw | Present the flaw, ask: "Do you want to pivot?" |
| Constraint Guardian flags governance violation | Present the violation, ask: "Should we get architect input?" |

### Escalation Format

> "The [agent role] has identified [issue]. This [blocks/requires] the approach because [reason]. Options: [A] Revise [B] Abandon [C] Override with your approval. What would you like to do?"

## Anti-Patterns

| # | Anti-Pattern | What Happens | Correct Behavior |
|---|--------------|--------------|------------------|
| 1 | Run agents in parallel | No compounding insight — each misses what the prior found | Sequential dispatch, pass findings forward |
| 2 | Proceed with 1/3 REJECT | Technical debt accumulates | Respect Skeptic/Constraint Guardian vetoes |
| 3 | Let Skeptic propose features | Scope creep disguised as review | Skeptic finds gaps — does not add scope |
| 4 | Skip User Advocate | Technically sound but unusable feature | Always evaluate cognitive load |
| 5 | Override agent consensus without user | Hidden risk accepted unilaterally | Escalate to user when overriding |
