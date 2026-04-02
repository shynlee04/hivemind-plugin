# TDD Workflow for Skills

## Purpose

Test-driven development methodology for HiveMind skill authoring. Every skill MUST be validated against real failure scenarios before being written.

---

## The Iron Law

> **NO SKILL WITHOUT A FAILING TEST FIRST**

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE FOR SKILLS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────────┐            │
│   │   RED   │ →  │  GREEN  │ →  │  REFACTOR   │            │
│   │  Phase  │    │  Phase  │    │    Phase    │            │
│   └─────────┘    └─────────┘    └─────────────┘            │
│        │              │                │                    │
│        │              │                │                    │
│        ▼              ▼                ▼                    │
│   Identify        Write           Remove                     │
│   failure         minimal         duplication                │
│   scenario        skill           Tighten                    │
│                                   triggers                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## RED Phase: Identify Failure

### Step 1: Capture the Failing Scenario

**Question:** What specific scenario does NOT work without this skill?

**Format:**
```markdown
## Failing Scenario: [Name]

### Input
[What triggers the scenario]

### Expected Behavior
[What should happen]

### Without Skill
[What actually happens - THE FAILURE]

### Evidence
[How to verify this fails]
```

### Step 2: Write the Test Prompt

Create a test that would pass WITH the skill but fail WITHOUT it:

```markdown
## Test Prompt: [Scenario Name]

You are in a [session state].

Your task: [specific task]

Without use-hivemind-skill-authoring loaded:
- [Observed behavior - FAIL]

With use-hivemind-skill-authoring loaded:
- [Expected behavior - PASS]
```

### Step 3: Run Baseline

1. Clear any skill loading
2. Execute the test prompt
3. Observe and document the exact failure
4. Capture evidence (output, errors, behavior)

### Step 4: Document Failure Mode

```markdown
## Failure Evidence: [Date]

**Observed:** [Exact behavior]
**Expected:** [What should happen]
**Gap:** [The difference]
**Severity:** [Impact level]
```

---

## GREEN Phase: Write the Skill

### Step 1: Design Minimal Skill

Address ONLY the failure scenario. Do not add features.

**Checklist:**
- [ ] Does this address the failing scenario?
- [ ] Is this the minimum needed?
- [ ] Does this introduce ceremony?
- [ ] Does this conflict with existing skills?

### Step 2: Write SKILL.md

Follow the anatomy template and frontmatter standard.

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggering conditions] — [effect] — [constraints]. Include WHAT, WHEN, and KEYWORDS for activation.
---
```

> **Frontmatter must comply with Agent Skills specification — only `name` and `description` are required; see 02-frontmatter-standard.md for full schema.** All other fields (version, framework, pack, entry-level, pattern, stacking, owner, status, tags, depends-on, enables, complementary) are FORBIDDEN in frontmatter. Internal metadata belongs in the SKILL.md body, not in frontmatter.

### Step 3: Create References (if needed)

For P2/P3, create minimal reference bundle.

### Step 4: Run with Skill

1. Load the skill
2. Execute the same test prompt
3. Verify behavior change
4. Document success criteria

### Step 5: Document Success

```markdown
## Success Evidence: [Date]

**Before:** [Failure mode]
**After:** [Fixed behavior]
**Evidence:** [Verification output]
```

---

## REFACTOR Phase: Improve

### Step 1: Remove Duplication

- Check for overlap with existing skills
- Consolidate common patterns
- Ensure non-redundancy

### Step 2: Tighten Triggers

- Is description specific enough?
- Any false positive triggers?
- Any missed triggering conditions?

### Step 3: Validate Structure

- [ ] Reference depth = 1 level
- [ ] Stacking ≤3
- [ ] Frontmatter contains name + description only (spec-compliant per 02-frontmatter-standard.md)
- [ ] No broken links

### Step 4: Run Skill-Judge (Enhanced)

Quality evaluation uses the 5-dimension rubric in **05-skill-quality-matrix.md**. All dimension thresholds must be met for release.

### Step 5: Pressure Scenarios for Discipline Skills

From writing-skills superpowers, discipline skills require combining 3+ pressures:

**The Four Pressures:**
1. **Rationalization pressure** — When the agent justifies instead of executing
2. **Performance pressure** — When speed conflicts with correctness  
3. **Edge case pressure** — When boundary conditions reveal flaws
4. **Authority conflict pressure** — When competing directives create tension

**Test combination pattern:**
```markdown
## Pressure Test: [Skill Name]

**Rationalization + Edge Case:**
- Given: [edge condition]
- When: [tempted to rationalize]
- Then: [skill should prevent]

**Performance + Authority:**
- Given: [time pressure + conflicting authority]
- When: [skill triggered]
- Then: [correct behavior]
```

### Step 6: Knowledge Delta Test

Before writing skill content, classify knowledge using the Knowledge Delta:

| Type | Question | Action |
|------|----------|--------|
| **Expert** | "Does the agent genuinely NOT know this?" | KEEP — this is the skill's value |
| **Activation** | "Does the agent know but may not think of?" | Keep brief — serves as reminder |
| **Redundant** | "Does the agent definitely know this?" | DELETE — wastes tokens |

**Knowledge Delta Test Protocol:**
1. Read proposed content
2. Ask: "Would the agent produce this without being told?"
3. If YES → Redundant → DELETE
4. If the agent would think of it but forget → Activation → Keep minimal
5. If the agent genuinely doesn't know → Expert → KEEP

### Step 7: Baseline Recording Protocol

**CRITICAL:** Record baseline behavior verbatim before writing the skill.

```markdown
## Baseline: [Date]

**Context:** [Session state]
**Skill State:** [Loaded or not loaded]
**Prompt:** [Exact test prompt]

**Without Skill Output:**
```
[Exact verbatim output - copy-paste exactly]
```

**Gap:** [Specific failure identified]
**Severity:** [Impact: Low/Medium/High/Critical]
```

**Recording Rules:**
- Copy-paste actual output, never paraphrase
- Include exact formatting/whitespace
- Note session state at time of capture
- Identify specific gap, not vague "could be better"

---

## Scenario Library

### Entry State Scenarios

| Scenario | Description | Pattern |
|----------|-------------|---------|
| FRESH_ENTRY | New session without context | P1 |
| RESUME_GAP | Resume after context prune | P1 |
| DELEGATE_AMBIGUITY | Unclear delegation scope | P2 |
| ROT_DETECTED | Context drift detected | P3 |

### Quality Scenarios

| Scenario | Description | Pattern |
|----------|-------------|---------|
| TRIGGER_VAGUE | Description too broad | Refactor |
| STACK_OVERFLOW | Skills loaded without prerequisites | Refactor |
| REF_DEPTH_2 | 2-level references | Refactor |

### Non-Breaking Scenarios

| Scenario | Description | Expected |
|----------|-------------|----------|
| GSD_AFFECTED | GSD workflows still work | Unaffected |
| NO_CEREMONY | No added workflow friction | No overhead |
| STACK_OK | Prerequisites satisfied | Compliant |

---

## Test Templates

### Template 1: Entry Scenario Test

```markdown
## Test: [Scenario Name]

**Given:** [Preconditions]
**When:** [Action taken]
**Then:** [Expected result]

**Without Skill:**
```
[Observed output]
```

**With Skill:**
```
[Expected output]
```

**PASS/FAIL:** [Result]
```

### Template 2: Non-Breaking Test

```markdown
## Test: GSD Compatibility

**Given:** GSD workflow execution
**When:** Skill is loaded
**Then:** GSD workflow completes normally

**Result:** PASS/FAIL
```

### Template 3: Quality Test

```markdown
## Test: Skill-Judge Evaluation

**Skill:** [Name]
**Dimensions:**
- Trigger Accuracy: [1-5]
- Action Coherence: [1-5]
- Reference Integrity: [1-5]
- Non-Redundancy: [1-5]
- Edge Case Coverage: [1-5]

**Overall:** [Score]
**Grade:** [EXCELLENT/GOOD/ACCEPTABLE/NEEDS WORK]
```

---

## Validation Protocol

### Pre-Commit Checklist

- [ ] RED phase documented
- [ ] GREEN phase passes
- [ ] Failure evidence captured
- [ ] Success evidence captured
- [ ] Skill-Judge score ≥3.5
- [ ] No GSD impact
- [ ] Stacking compliant
- [ ] Reference depth 1-level

### Skill-Judge Thresholds

| Grade | Action |
|-------|--------|
| EXCELLENT (4.5+) | Ready for release |
| GOOD (4.0+) | Minor polish |
| ACCEPTABLE (3.0+) | Address gaps |
| NEEDS WORK (<3.0) | Major revision |

---

## Common Failure Modes

### Mode 1: No Real Failure

**Problem:** Writing skill without identifying actual failure.

**Fix:** Return to RED phase. Identify concrete scenario.

### Mode 2: Scope Creep

**Problem:** Skill does too much.

**Fix:** Focus on minimum viable. Split if needed.

### Mode 3: Vague Trigger

**Problem:** Description too broad/narrow.

**Fix:** Tighten with specific conditions.

### Mode 4: Ceremony Added

**Problem:** Skill adds workflow friction.

**Fix:** Remove mandatory steps. Make optional.
