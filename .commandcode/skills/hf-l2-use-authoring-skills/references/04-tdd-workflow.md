# TDD Workflow for Skills

## Two Workflows: TDD and Template-Driven

Skills are created in two distinct scenarios. Each requires a different workflow.

### Scenario A: Creating from Scratch (Use TDD)

The user has a problem but no existing content. Use RED-GREEN-REFACTOR.

### Scenario B: Converting a Document (Use Template-Driven)

The user has a source document to convert into a skill. Skip RED phase — the "failure" is already known (the document isn't a skill yet).

---

## Workflow A: TDD (RED-GREEN-REFACTOR)

### RED Phase: Identify the Failure

**Question:** What specific scenario fails without this skill?

**Format:**
```markdown
## Failing Scenario: [Name]

### Input
[What triggers the scenario]

### Expected Behavior
[What should happen]

### Without Skill
[What actually happens — THE FAILURE]

### Evidence
[How to verify this fails]
```

**Steps:**
1. Document the failing scenario
2. Write a test prompt that would pass WITH the skill but fail WITHOUT it
3. Run the test prompt without the skill loaded
4. Capture the exact failure output (verbatim, not paraphrased)

### GREEN Phase: Write the Minimum Skill

Address ONLY the failure scenario. Do not add features.

**Checklist:**
- [ ] Does this address the failing scenario?
- [ ] Is this the minimum needed?
- [ ] Does this conflict with existing skills?

**Steps:**
1. Write frontmatter (name + description)
2. Write minimal SKILL.md body
3. Create only the reference files needed for this scenario
4. Run the same test prompt WITH the skill loaded
5. Verify the behavior changed

### REFACTOR Phase: Improve

1. **Remove duplication** — check for overlap with existing skills
2. **Tighten triggers** — is the description specific enough?
3. **Validate structure** — reference depth = 1, no broken links
4. **Score quality** — run 5-dimension evaluation (see 05-skill-quality-matrix.md)

---

## Workflow B: Template-Driven (Document → Skill)

Use this when the user provides a source document to convert.

### Step 1: Analyze the Source

- What is the document's single purpose?
- How many distinct topics does it cover?
- What is the primary workflow?

### Step 2: Choose Pattern

- 1-2 topics → P1
- 3-8 topics → P2 (most common)
- 8+ topics → P3

### Step 3: Extract Frontmatter

```yaml
---
name: [kebab-case-name]
description: [What it does]. Use when [specific trigger conditions].
---
```

### Step 4: Convert Content

- Primary workflow → SKILL.md body
- Supporting topics → references/ files (numbered: 01-topic.md, 02-topic.md)
- Examples → keep inline or move to references/
- Commands/scripts → scripts/ directory

### Step 5: Validate

Run `bash scripts/validate-skill.sh` on the output directory.

---

## Knowledge Delta Test

Before writing any skill content, classify each piece of knowledge:

| Type | Question | Action |
|------|----------|--------|
| **Expert** | "Does the agent genuinely NOT know this?" | KEEP |
| **Activation** | "Does the agent know but may not think of it?" | Keep brief |
| **Redundant** | "Does the agent definitely know this?" | DELETE |

**Protocol:**
1. Read proposed content
2. Ask: "Would the agent produce this without being told?"
3. If YES → Redundant → DELETE
4. If the agent would think of it but forget → Activation → Keep minimal
5. If the agent genuinely doesn't know → Expert → KEEP

---

## Common Failure Modes

| Mode | Problem | Fix |
|------|---------|-----|
| No real failure | Writing skill without identifying actual failure | Return to RED phase |
| Scope creep | Skill does too much | Focus on minimum viable, split if needed |
| Vague trigger | Description too broad/narrow | Tighten with specific conditions |
| Template TDD mismatch | Forcing RED phase on template conversion | Use template-driven workflow instead |
| Ceremony added | Skill adds workflow friction | Remove mandatory steps, make optional |

---

## Pre-Commit Checklist

- [ ] RED phase documented (for TDD workflow) OR source document analyzed (for template workflow)
- [ ] GREEN phase passes — test prompt produces correct behavior
- [ ] Failure evidence captured (verbatim output)
- [ ] Success evidence captured (verbatim output)
- [ ] Quality score ≥ 3.5 on all 5 dimensions
- [ ] No redundant content (Knowledge Delta Test passed)
- [ ] Reference depth = 1 level
- [ ] validate-skill.sh passes
