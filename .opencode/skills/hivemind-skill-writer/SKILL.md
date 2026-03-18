---
name: hivemind-skill-writer
description: Use when creating, auditing, refactoring, or packaging HiveMind framework skills. Activates the meta-builder for skill authoring, TDD workflows, and quality validation. Bundles skill-writing guidance, Skill-Judge metrics, and HiveMind-specific packaging patterns. Triggers: "write a skill", "create a new skill", "audit this skill", "is this skill good", "skill quality", "skill design", "skill authoring".
version: 1.0.0
framework: hivemind
pack: hivemind-skill-writer
entry-level: L1
pattern: P1
stacking: 0
owner: hivemind
status: active
tags: [meta, skill-authoring, skill-quality, tdd, hivemind]
---

# hivemind-skill-writer

## Purpose

Meta-builder skill for authoring HiveMind-specific skills. Use when creating, auditing, refactoring, or packaging skills for the HiveMind ecosystem.

## When to Activate

**Primary Triggers (answer WHAT + WHEN + KEYWORDS):**
- "create a new skill"
- "write a skill for..."
- "audit this skill"
- "is this skill good"
- "skill quality check"
- "skill design"
- "skill authoring"
- "refactor this skill"
- "package this skill set"

**Secondary Triggers:**
- Detecting skill quality issues
- Identifying skill redundancy
- Planning skill migration

## Core Philosophy

### The Iron Law

> **NO SKILL WITHOUT A FAILING TEST FIRST**

Every skill must be validated against a real failure scenario before being written.

### Knowledge Delta (The Core Formula)

> **Good Skill = Expert-only Knowledge − What Claude Already Knows**

A Skill's value is measured by its **knowledge delta** — the gap between what it provides and what the model already knows.

| Knowledge Type | Definition | Treatment |
|---------------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | MUST keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | DELETE — wastes tokens |

**Evaluation**: For each section, ask "Does Claude already know this?"

### Tool vs Skill

| Concept | Essence | Function |
|---------|---------|----------|
| **Tool** | What model CAN do | Execute actions (bash, read_file, write_file) |
| **Skill** | What model KNOWS how to do | Guide decisions (PDF processing, MCP building, frontend design) |

**Equation:** `General Agent + Excellent Skill = Domain Expert Agent`

### The 5 Patterns System

| Pattern | ~Lines | Purpose | When to Use |
|---------|--------|---------|--------------|
| **Mindset** | ~50 | Thinking > technique, strong NEVER list | Creative tasks requiring taste |
| **Navigation** | ~30 | Minimal SKILL.md, routes to sub-files | Multiple distinct scenarios |
| **Philosophy** | ~150 | Philosophy → Express, emphasizes craft | Art/creation requiring originality |
| **Process** | ~200 | Phased workflow, checkpoints | Complex multi-step projects |
| **Tool** | ~300 | Decision trees, code examples | Precise operations on specific formats |

### Progressive Disclosure

| Level | Content | When |
|-------|---------|------|
| **L1** | Metadata (name + description) | Always loaded (~100 tokens) |
| **L2** | SKILL.md body | On trigger match (~500 lines) |
| **L3** | references/, scripts/, templates/ | Explicit request |

### Description — THE MOST IMPORTANT FIELD

The description determines if a skill ever gets activated. It MUST answer:

1. **WHAT**: What does this Skill do?
2. **WHEN**: In what situations should it be used?
3. **KEYWORDS**: What terms should trigger this Skill?

```
┌─────────────────────────────────────────────────────────────────────┐
│  SKILL ACTIVATION FLOW                                              │
│                                                                     │
│  User Request → Agent sees ALL skill descriptions → Decides which   │
│                 (only descriptions, not bodies!)      to activate    │
│                                                                     │
│  If description doesn't match → Skill NEVER gets loaded            │
│  If description is vague → Skill might not trigger when it should  │
└─────────────────────────────────────────────────────────────────────┘
```

**Excellent description format:**
```yaml
description: >
  Create, edit, and analyze .docx files. 
  Use when working with Word documents, tracked changes, 
  or professional document formatting.
  Triggers: .docx, tracked changes, Word documents, document editing
```

### Freedom Calibration

Match specificity to task fragility:

| Task Type | Freedom | Why |
|-----------|---------|-----|
| Creative/Design | HIGH | Multiple valid approaches, differentiation is value |
| Code review | MEDIUM | Principles exist but judgment required |
| Precise operations | LOW | One wrong byte corrupts file, consistency critical |

### TDD Workflow (RED-GREEN-REFACTOR)

**RED Phase:**
1. Identify the failing scenario
2. Write test prompt for the scenario
3. Run without skill — observe failure
4. Document exact failure mode

**GREEN Phase:**
1. Write minimal skill addressing failure
2. Run with skill — observe pass
3. Verify failure mode resolved
4. Document success criteria

**REFACTOR Phase:**
1. Remove duplication
2. Tighten trigger accuracy
3. Ensure reference depth compliance
4. Validate stacking ≤3

## Skill-Judge Quality Metrics (120 points)

| Dimension | Max | Focus |
|-----------|-----|-------|
| **D1: Knowledge Delta** | 20 | Expert knowledge not in model |
| **D2: Mindset + Procedures** | 15 | Thinking patterns + domain workflows |
| **D3: Anti-Pattern Quality** | 15 | Specific NEVER lists with WHY |
| **D4: Spec Compliance** | 15 | Description = WHAT + WHEN + KEYWORDS |
| **D5: Progressive Disclosure** | 15 | Layering with triggers |
| **D6: Freedom Calibration** | 15 | Match specificity to fragility |
| **D7: Pattern Recognition** | 10 | Follows established pattern |
| **D8: Practical Usability** | 15 | Decision trees, fallbacks, edge cases |

### Scoring

| Grade | Percentage | Meaning |
|-------|------------|---------|
| **A** | 90%+ (108+) | Excellent — production-ready |
| **B** | 80-89% (96-107) | Good — minor improvements |
| **C** | 70-79% (84-95) | Adequate — clear improvement path |
| **D** | 60-69% (72-83) | Below average — significant issues |
| **F** | <60% (<72) | Poor — fundamental redesign needed |

### Quality Thresholds

| Score | Grade | Action |
|-------|-------|--------|
| 4.5+ | EXCELLENT | Ready for release |
| 4.0+ | GOOD | Minor improvements |
| 3.0+ | ACCEPTABLE | Address gaps |
| <3.0 | NEEDS WORK | Major revision required |

## Context-Intelligence Integration

Every skill must integrate with context-intelligence:

- **Entry State Recognition**: Acknowledge session state
- **Trust Threshold**: Know minimum trust scores
- **Rot Detection**: Watch for degradation signals
- **Recovery Awareness**: Know when to escalate

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
- **NEVER** let length impress you — a 50-line Skill can outperform 500-line
- **NEVER** forgive vague descriptions — poor description = skill never triggers
- **NEVER** put "when to use" only in body — description is what Agent sees first
- **NEVER** skip mentally testing decision trees

## References

- `references/01-skill-anatomy.md` — Full anatomy template
- `references/02-frontmatter-standard.md` — YAML schema
- `references/03-three-patterns.md` — Pattern system (HiveMind + Skill-Judge)
- `references/04-tdd-workflow.md` — TDD methodology
- `references/05-skill-quality-matrix.md` — Skill-Judge metrics (120-point system)
- `references/06-knowledge-delta.md` — Expert vs Redundant vs Activation

