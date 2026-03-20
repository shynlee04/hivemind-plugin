---
name: use-hivemind-skill-writer
description: "Entry, router, and meta-teaching layer for HiveMind skill design. Routes to hivemind-skill-write for creation, hivemind-skill-doctor for audit."
---

# use-hivemind-skill-writer

When user wants to create, audit, or refactor a HiveMind skill: route to the appropriate implementation specialist. This is the meta-builder entry point that distinguishes between creation (hivemind-skill-write) and audit (hivemind-skill-doctor) workflows.

## Anti-Pattern: When NOT to Use This Skill

- User says "just write the skill for me" without clarifying intent → WRONG, must confirm purpose first
- Agent says "I'll implement this directly" → WRONG, never implement in router
- Agent says "writing = designing" → WRONG, writing is output, designing is reasoning
- User wants to apply an existing skill → WRONG, this is for authoring, not application
- Agent confuses "skill = command" → WRONG, skills are procedures, commands are invocations
- Agent skips clarifying questions → WRONG, complex cases need clarification before routing

## Process Flow

```digraph skill-writer-flow {
  "Skill Work Request" -> "Identify Intent"
  "Identify Intent" -> "Create/Rewrite?" [label="new/refactor/compose"]
  "Identify Intent" -> "Audit/Diagnose?" [label="evaluate/review/fix"]
  "Identify Intent" -> "Validate/Test?" [label="TDD/baseline"]
  "Identify Intent" -> "Package?" [label="stack/conflicts"]
  "Create/Rewrite?" -> "Route to hivemind-skill-write" [label="yes"]
  "Audit/Diagnose?" -> "Route to hivemind-skill-doctor" [label="yes"]
  "Validate/Test?" -> "Route to hivemind-skill-doctor" [label="yes"]
  "Package?" -> "Route to hivemind-skill-write" [label="yes"]
  "Route to hivemind-skill-write" -> "hivemind-skill-write"
  "Route to hivemind-skill-doctor" -> "hivemind-skill-doctor"
}
```

## Activation Triggers (Semantically)

This skill activates when ANY of these scenarios occur:

1. **Creation request**: "create a new skill", "write a skill for...", "design a skill", "build a HiveMind skill"
2. **Audit request**: "audit this skill", "evaluate this skill", "score this skill", "skill quality check"
3. **Refactor request**: "refactor this skill", "improve this skill", "rewrite this skill", "reduce overlap"
4. **Validation request**: "validate this skill", "test a skill", "baseline this skill", "TDD for skills"
5. **Package request**: "package skill set", "verify no conflicts", "check skill overlap"
6. **Tailoring request**: "customize skill", "adapt skill to...", "tailor for..."
7. **Meta-builder work**: "skill routing", "skill system", "skill design"

## Step-by-Step Protocol

1. **DETECT** — Is this a skill authoring request?
2. **CLARIFY** — What is the user trying to accomplish?
   - Create/rewrite/compose → Route to `hivemind-skill-write`
   - Audit/diagnose/repair → Route to `hivemind-skill-doctor`
   - Validate/test/TDD → Route to `hivemind-skill-doctor`
   - Package/conflicts → Route based on primary intent
3. **CONFIRM** — Is this for HiveMind framework (not generic)?
4. **IF** not HiveMind → Route to `skill-creator` or `meta-skill-creator`
5. **ROUTE** — Invoke appropriate specialist skill
6. **AWAIT** — Wait for implementation report

## Key Principles

- **Intent before routing**: Confirm what user wants before sending to specialist
- **Writing ≠ designing**: Writing is output, designing is reasoning about structure
- **Skill ≠ command**: Skills are procedures, commands are invocations
- **Audit ≠ write**: Audit is evaluation, write is creation—different specialists
- **Complex cases need clarification**: Ask questions before routing, not after
- **Orchestrator never implements**: Route, gatekeep, sequence—never execute

## Terminal State

- **If create intent**: Routed to `hivemind-skill-write` for implementation
- **If audit intent**: Routed to `hivemind-skill-doctor` for evaluation
- **If validate intent**: Routed to `hivemind-skill-doctor` with TDD mode
- **Next skill**: Respective specialist based on intent

## No-Load Conditions

- Context depth >70% → Defer to context recovery first
- Session state is degraded → Skip activation entirely
- Stack budget exhausted (Active skills ≥3) → Wait for slot
- Request is trivial (typo fix) → Handle directly without routing
- Another skill-writing skill active → Defer to active skill
- Not HiveMind domain → Route to `skill-creator` instead
