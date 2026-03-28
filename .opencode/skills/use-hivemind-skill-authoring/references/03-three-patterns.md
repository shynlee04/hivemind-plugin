# The 3 Patterns System

## Purpose

Design patterns for HiveMind skills. Choose the right pattern based on purpose and depth needed.

---

## Overview

| Pattern | Purpose | Depth | Stacking | When to Use |
|---------|---------|-------|----------|-------------|
| **P1** | High-level routing | Shallow | 1 | Entry skills, meta skills |
| **P2** | Domain-specific | Medium | 1 | Sub-pack skills, focused guidance |
| **P3** | Expertise depth | Deep | 1 | Complex scenarios, recovery |

---

## Pattern 1: High-Level Routing

### Characteristics

- Thin, must-load entry skills
- Simple routing logic
- Minimal body (<200 lines)
- References for detail

### Structure

```markdown
# Skill Name

## Purpose
Thin routing skill that directs to specialized sub-packs.

## When to Activate
- Condition A
- Condition B
- Condition C

## Routing Logic
IF [condition A] → load [sub-pack-A]
IF [condition B] → load [sub-pack-B]
ELSE → load [default]

## References
See references/ for detailed guidance.
```

### Examples

| Skill | Pack | Routing Target |
|-------|------|---------------|
| `context-intelligence` | context-intelligence | delegation, workflow, recovery |
| `use-hivemind-skill-authoring` | use-hivemind-skill-authoring | anatomy, quality, tdd |
| `explore-context` | explore | deep-scan, surface |

### Stacking with P1

```
P1 (1) + P2 (1) = 2 skills
P1 (1) + P2 (1) + P2 (1) = 3 skills
P1 (1) + P3 (1) = 2 skills
```

---

## Pattern 2: Domain-Specific

### Characteristics

- Deeper guidance for specific domains
- Step-by-step process
- Templates and matrices
- 200-500 lines

### Structure

```markdown
# Skill Name

## Purpose
Domain-specific guidance for [specific area].

## When to Activate
- Condition A
- Condition B

## Core Process

### Step 1: [Name]
Description of step...

### Step 2: [Name]
Description of step...

### Step 3: [Name]
Description of step...

## Templates
- [Template link]

## Anti-Patterns
- What NOT to do
- Common mistakes
- Edge cases to avoid

## References
Detailed reference material...
```

### Examples

| Skill | Domain | Steps |
|-------|--------|-------|
| `delegation-scope` | Delegation | Declare → Inherit → Verify → Execute |
| `workflow-hierarchy` | Workflows | Plan → Implement → Verify → Deliver |
| `skill-anatomy` | Skill Writing | Discover → Design → Implement → Validate |

### Stacking with P2

```
P1 (1) + P2 (1) = 2 skills
P2 (1) + P2 (1) = 2 skills
P1 (1) + P2 (1) + P2 (1) = 3 skills
```

---

## Pattern 3: Expertise Depth

### Characteristics

- Vertical depth for complex scenarios
- Heavy reference bundle
- TOC with jump links
- >500 lines OR reference-heavy

### Structure

```markdown
# Skill Name

## Overview
Brief overview of the expertise area.

## Table of Contents
- [Section A](#section-a)
- [Section B](#section-b)
- [Section C](#section-c)

## Section A
Target content for section A...

## Section B
Target content for section B...

## Section C
Target content for section C...

---

# Reference Bundle

## Detailed Topic A
Heavy content for A...

## Detailed Topic B
Heavy content for B...

---

## index.md (Separate File)

# Table of Contents

## Main Sections
- [Section A](#section-a) — Brief description
- [Section B](#section-b) — Brief description
- [Section C](#section-c) — Brief description

## Reference Bundle
- [Topic A](#detailed-topic-a) — Deep dive
- [Topic B](#detailed-topic-b) — Deep dive

## Jump Links
Main file: [SKILL.md](./SKILL.md)
```

### Examples

| Skill | Scenario | Content |
|-------|----------|---------|
| `context-rot-recovery` | Rot > 9 | Emergency protocols |
| `codebase-deep-scan` | Investigation | Full investigation |

### Stacking with P3

```
P1 (1) + P3 (1) = 2 skills
P1 (1) + P2 (1) + P3 (1) = 3 skills
```

---

## Choosing the Right Pattern

### Decision Tree

```
Is this an entry/routing skill?
├── YES → P1
└── NO
    ├── Is this a focused domain skill?
    │   ├── YES → P2
    │   └── NO
    │       ├── Is this a complex/expertise skill?
    │       ├── YES → P3
    │       └── NO → P2
```

### When to Use P1

- Entry skills that route to sub-packs
- Meta skills (like use-hivemind-skill-authoring)
- Thin skills that just delegate

### When to Use P2

- Sub-pack skills with clear domain focus
- Step-by-step processes
- Skills with templates/matrices

### When to Use P3

- Recovery skills
- Complex investigation skills
- Skills needing heavy reference bundle
- Skills where P1/P2 is insufficient

---

## Anti-Patterns

### P1 Anti-Patterns

- **Too thick**: P1 should be <200 lines
- **Missing routing**: No clear IF-THEN logic
- **No references**: P1 without references means no depth path

### P2 Anti-Patterns

- **Too shallow**: Should have real depth
- **Too many steps**: Max 5-7 steps
- **No templates**: P2 should have practical templates

### P3 Anti-Patterns

- **Unnecessary complexity**: If P1/P2 works, don't use P3
- **Missing TOC**: P3 MUST have table of contents
- **Broken jump links**: Verify all links work

---

## Domain Interconnectedness

Skills must understand their place in the domain ecosystem:

### Cross-Pack Integration

| Pack | Integrates With | Activation |
|------|----------------|------------|
| context-intelligence | All packs | P1 entry, stacking: 1 |
| use-hivemind-skill-authoring | context-intelligence | Companion, stacking: 0 |
| use-hivemind-skill-authoring | use-hivemind-skill-authoring | P3 specialist on demand |
| use-hivemind-skill-authoring | use-hivemind-skill-authoring | P3 specialist when migrating |

### Subagent Routing

P1 skills may need to spawn subagents for:

- **Cross-domain detection** — when work spans multiple skill domains
- **Multi-framework audit** — when checking .claude, .cursor, .opencode surfaces
- **Pack migration coordination** — when refactor affects multiple packs

### Decision Tree

```
Is task single-domain?
├── YES → Primary execution
└── NO → Check domain count
    ├── 2 domains → Subagent for secondary
    └── 3+ domains → Multi-agent orchestration
```

### Integration with context-intelligence

Every skill operation must integrate with Pack 1:

- **Entry State Recognition** — Check session state before operations
- **Trust Threshold** — Verify minimum trust scores
- **Rot Detection** — Watch for degradation signals
- **Recovery Awareness** — Know when to escalate

---

## Reference Depth Rule

```
SKILL.md (Entry Point)
    │
    ├── L1: Overview + TOC
    ├── L2: Core sections
    │
    └── references/ (1-level deep)
            ├── 01-topic-a.md
            ├── 02-topic-b.md
            └── index.md (TOC for P3)

references/ files CANNOT reference other references/
```

**Exception:** P3 index.md can have jump links to SKILL.md sections.
