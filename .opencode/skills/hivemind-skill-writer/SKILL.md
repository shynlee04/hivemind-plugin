---name: hivemind-skill-writer
description: Use when creating, auditing, refactoring, or packaging HiveMind framework skills. Activates the meta-builder for skill authoring, TDD workflows, and quality validation. Bundles skill-writing guidance, Skill-Judge metrics, and HiveMind-specific packaging patterns. Triggers: "write a skill", "create a new skill", "audit this skill", "is this skill good", "skill quality", "skill design", "skill authoring".
version: 1.0.0
framework: hivemind
pack: hivemind-skill-writer
entry-level: L1
pattern: P1
stacking: 0
owner: hivemind
status: active
integrates_with: [context-intelligence]
domain_interconnection: true
tags: [meta, skill-authoring, skill-quality, tdd, hivemind]
---

# hivemind-skill-writer

## Purpose

P1 routing skill for HiveMind-specific skill authoring, auditing, refactoring, and packaging. Acts as thin router to specialized references.

## When to Activate

**Primary Triggers:**
- "create a new skill" / "write a skill for..."
- "audit this skill" / "is this skill good"
- "skill quality check" / "skill design"
- "refactor this skill" / "package this skill set"

**Secondary Triggers:**
- Detecting skill quality issues
- Identifying skill redundancy
- Planning skill migration

## Routing Logic

```
IF task == "create skill" → load references/01-skill-anatomy.md + references/03-three-patterns.md
IF task == "audit skill" → load references/05-skill-quality-matrix.md
IF task == "refactor skill" → load references/03-three-patterns.md + references/04-tdd-workflow.md
IF task == "package skill set" → load references/06-agent-activation.md
```

## NO-LOAD Rules (Critical)

A P1 router must often decide NOT to activate. This is a success case, not a miss.

**DO NOT activate when:**
- Context depth exceeds 70% — skill operations will exhaust remaining context
- Session state is "degraded" or "interrupted" — defer to context-rot-recovery first
- Task is trivial (e.g., "fix typo in skill") — no specialist depth needed
- Another hivemind-skill-writer instance is already running — prevent duplicate activation
- Stack budget is exhausted (3 skills already loaded) — wait for slot

**FAIL signals — stop immediately when:**
- Entry state is "unknown" — cannot safely route without context-intelligence
- Trust score below threshold — skill work may cause harm
- Context rot severity ≥ 7 — degradation will corrupt skill output
- Cross-framework conflict detected — .claude/.codex collision without clear authority

## Core Philosophy

### The Iron Law> **NO SKILL WITHOUT A FAILING TEST FIRST**

Every skill must be validated against a real failure scenario before being written.

### Knowledge Delta (The Core Formula)

> **Good Skill = Expert-only Knowledge − What Claude Already Knows**

| Knowledge Type | Definition | Treatment |
|---------------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | MUST keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | DELETE — wastes tokens |

### Tool vs Skill

| Concept | Essence | Function ||---------|---------|----------|
| **Tool** | What model CAN do | Execute actions (bash, read_file, write_file) |
| **Skill** | What model KNOWS how to do | Guide decisions (PDF processing, MCP building) |

**Equation:** `General Agent + Excellent Skill = Domain Expert Agent`

## Context-Intelligence Integration

Every skill operation must integrate with context-intelligence:

- **Entry State Recognition**: Check session state before skill operations
- **Trust Threshold**: Verify minimum trust scores for skill operations
- **Rot Detection**: Watch for degradation signals during skill work
- **Recovery Awareness**: Know when to escalate skill issues

## Stacking Discipline

At entry, max **3 skills** may load:

```
context-intelligence (1) — always
delegation-scope (1) — if delegated
workflow-hierarchy (1) — if workflow
context-rot-recovery (1) — if degraded
```

**hivemind-skill-writer does not count** against stack (stacking: 0).

## NEVER Do

- **NEVER** explain what Claude already knows ("what is X", "how to write a for-loop")
- **NEVER** give high scores for well-formatted but redundant content
- **NEVER** let length impress you — a50-line Skill can outperform 500-line
- **NEVER** forgive vague descriptions — poor description = skill never triggers
- **NEVER** put "when to use" only in body — description is what Agent sees first
- **NEVER** skip mentally testing decision trees

## References

- `references/01-skill-anatomy.md` — Full anatomy template
- `references/02-frontmatter-standard.md` — YAML schema
- `references/03-three-patterns.md` — Pattern system (P1/P2/P3)
- `references/04-tdd-workflow.md` — TDD methodology for skills
- `references/05-skill-quality-matrix.md` — Skill-Judge metrics (120-point system)
- `references/06-agent-activation.md` — Agent/sub-agent activation patterns
- `references/06-knowledge-delta.md` — Expert vs Redundant vs Activation