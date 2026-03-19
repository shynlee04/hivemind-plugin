---
name: hivemind-skill-writer
description: Use when creating, auditing, refactoring, or packaging HiveMind framework skills. Activates the meta-builder for skill authoring, TDD workflows, and quality validation. Bundles skill-writing guidance, Skill-Judge metrics, and HiveMind-specific packaging patterns. Triggers: "write a skill", "create a new skill", "audit this skill", "is this skill good", "skill quality", "skill design", "skill authoring".
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

**Brainstorming Triggers:**
- "brainstorm" / "ideate" / "explore"
- "what if" / "how might we"
- "generate ideas" / "think through"

**Conflict Detection Triggers:**
- "check skill overlap" / "find conflicts"
- "validate skill stack" / "verify no conflicts"

**Secondary Triggers:**
- Detecting skill quality issues
- Identifying skill redundancy
- Planning skill migration

**TDD-Specific Triggers:**
- "validate this skill" / "test this skill"
- "baseline this skill" / "write test for skill"
- "improve this skill" / "iterate on skill"
- "refine skill quality"
- "TDD for skills" / "test-driven skill development"

**Refinement Triggers:**
- "improve this skill" / "iterate on skill"
- "refine skill quality"
- Skill-Judge score <3.5 validation failure

**Audit-Specific Triggers:**
- "evaluate this skill" / "score this skill"
- "what's wrong with this skill"
- "improve skill quality"
- "skill quality review" / "skill audit"

## Routing Logic

```
IF task == "create skill" → load references/01-skill-anatomy.md + references/03-three-patterns.md
IF task == "audit skill" → load references/05-skill-quality-matrix.md
IF task == "refactor skill" → load references/03-three-patterns.md + references/04-tdd-workflow.md
IF task == "package skill set" → load references/06-agent-activation.md
IF task == "write new skill" → load references/04-tdd-workflow.md + references/01-skill-anatomy.md
IF task == "validate skill" → load references/04-tdd-workflow.md + references/05-skill-quality-matrix.md
IF task == "test skill" → load references/04-tdd-workflow.md
IF task == "iterate skill" → load references/04-tdd-workflow.md + references/03-three-patterns.md
IF task == "improve skill" → load references/07-iterative-refinement.md
IF task == "iterate skill" → load references/07-iterative-refinement.md
```

## Quality Thresholds (from Skill-Judge)

All skills must meet these minimums before release:

| Dimension | Weight | Minimum Score |
|-----------|--------|---------------|
| Overall Score | - | ≥3.5 |
| Trigger Accuracy | 25% | ≥3.0 |
| Action Coherence | 25% | ≥4.0 |
| Reference Integrity | 20% | ≥3.0 |
| Non-Redundancy | 15% | ≥3.0 |
| Edge Case Coverage | 15% | ≥3.0 |

**All thresholds must be met for release.** See `references/05-skill-quality-matrix.md` for full evaluation criteria.

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

## Self-Improvement Integration

Every skill operation integrates with iterative refinement:

- **Pattern Extraction:** Successful skill creation → semantic memory
- **Confidence Threshold:** Only patterns with confidence >0.8
- **Refinement Loop:** Skill-Judge <3.5 → refinement cycle

### Hook Integration

| Hook | When | Action |
|------|------|--------|
| `before_skill_audit` | Pre-audit | Log session context, validate skill structure |
| `after_skill_create` | Post-create | Extract pattern, update semantic memory |
| `on_validation_fail` | Skill-Judge <3.5 | Trigger refinement loop |

## Context-Intelligence Integration

Every skill operation must integrate with context-intelligence:

- **Entry State Recognition**: Check session state before skill operations
- **Trust Threshold**: Verify minimum trust scores for skill operations
- **Rot Detection**: Watch for degradation signals during skill work
- **Recovery Awareness**: Know when to escalate skill issues

## Conflict Prevention

### Overlap Detection

Before activating skills, check:
- Trigger overlap with existing stack
- Domain overlap with loaded skills
- Authority boundary violations
- Stack budget status

### Brainstorming Mode

When user enters brainstorming mode:
1. Load context-intelligence (P1)
2. Assess domain
3. Load domain-specific P2 if needed
4. Maintain stack ≤3

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
- **NEVER** load skills with overlapping triggers
- **NEVER** exceed stack budget of 3 skills

## References

- `references/01-skill-anatomy.md` — Full anatomy template
- `references/02-frontmatter-standard.md` — YAML schema
- `references/03-three-patterns.md` — Pattern system (P1/P2/P3)
- `references/04-tdd-workflow.md` — TDD methodology for skills
- `references/05-skill-quality-matrix.md` — Skill-Judge metrics (120-point system)
- `references/06-agent-activation.md` — Agent/sub-agent activation patterns
- `references/06-knowledge-delta.md` — Expert vs Redundant vs Activation
- `references/07-iterative-refinement.md` — Self-improvement loops and hooks
- `references/08-conflict-detection.md` — Cross-pack overlap detection logic