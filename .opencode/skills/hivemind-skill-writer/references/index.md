# hivemind-skill-writer — Reference Index

## Table of Contents

### Main Sections
- [Skill Anatomy](#01-skill-anatomymd) — Template structure
- [Frontmatter Standard](#02-frontmatter-standardmd) — YAML schema
- [Three Patterns](#03-three-patternsmd) — P1/P2/P3 system
- [TDD Workflow](#04-tdd-workflowmd) — Test-driven development
- [Skill Quality Matrix](#05-skill-quality-matrixmd) — Evaluation framework
- [Agent Activation](#06-agent-activationmd) — Agent/sub-agent patterns

---

## Reference Bundle

### 01-skill-anatomy.md
**Purpose:** Standard structure for HiveMind skills  
**Topics:**
- Required elements (SKILL.md, frontmatter)
- Optional elements (references/, scripts/, templates/)
- Pattern-specific requirements
- Naming rules
- Version policy

### 02-frontmatter-standard.md
**Purpose:** YAML frontmatter schema  
**Topics:**
- Complete field definitions
- name, description, version, framework, pack
- entry-level, pattern, stacking
- Validation checklist
- Good/bad examples

### 03-three-patterns.md
**Purpose:** Design patterns for skill authoring  
**Topics:**
- P1: High-level routing
- P2: Domain-specific
- P3: Expertise depth
- Decision tree for choosing pattern
- Stacking rules
- Anti-patterns
- Domain Interconnectedness

### 04-tdd-workflow.md
**Purpose:** Test-driven development for skills  
**Topics:**
- RED phase: Identify failure
- GREEN phase: Write minimal skill
- REFACTOR phase: Improve quality
- Scenario library
- Test templates
- Validation protocol

### 05-skill-quality-matrix.md
**Purpose:** Skill-Judge evaluation framework  
**Topics:**
- 5 dimensions with weights
- Scoring criteria (1-5 scale)
- Cross-reference matrix
- Overall calculation formula
- Grade thresholds
- Evaluation template

### 06-agent-activation.md
**Purpose:** Agent and sub-agent activation patterns  
**Topics:**
- Agent Activation Matrix
- Command Activation Patterns
- Domain Interconnectedness Map
- Subagent Spawn Decision Tree
- Integration with context-intelligence

---

## Quick Reference

### Frontmatter Required Fields

```yaml
name: skill-name
description: Use when [trigger] — [effect]
version: 1.0.0
framework: hivemind
pack: pack-name
entry-level: L1|L2|L3
pattern: P1|P2|P3
stacking: 0-3
owner: hivemind
status: active
```

### Pattern Selection

```
Is entry/routing skill? → P1
Is focused domain skill? → P2
Is complex/expertise skill? → P3
```

### Quality Thresholds

| Metric | Threshold |
|--------|-----------|
| Overall | ≥3.5 |
| Trigger | ≥3.0 |
| Action | ≥4.0 |
| Reference | ≥3.0 |
| Redundancy | ≥3.0 |
| Edge | ≥3.0 |

### Stacking Rules

- Max 3 skills at entry
- hivemind-skill-writer: stacking: 0
- context-intelligence: stacking: 1

### Subagent Routing

| Task Type | Action |
|-----------|--------|
| Single-domain | Primary execution |
|Cross-pack | Subagent for secondary |
| Multi-framework | Subagent for detection |

### Domain Interconnection

```
context-intelligence (Pack 1)
    │
    ├── Session detection → skill routing
    ├── Delegation detection → subagent spawn
    └── Rot detection → recovery activation
```

---

## See Also

- `../context-intelligence/SKILL.md` — Entry pack
- `../../docs/skill-revamp/architecture.md` — System architecture
- `../../docs/skill-revamp/progress.md` — Round progress
