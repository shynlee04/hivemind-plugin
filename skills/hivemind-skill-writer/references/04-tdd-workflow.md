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

Without hivemind-skill-writer loaded:
- [Observed behavior - FAIL]

With hivemind-skill-writer loaded:
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
name: skill-name
description: Use when [trigger] — [effect]
version: 1.0.0
framework: hivemind
pack: pack-name
entry-level: L1|L2|L3
pattern: P1|P2|P3
stacking: 0-3
owner: hivemind
status: draft
---
```

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
- [ ] Frontmatter complete
- [ ] No broken links

### Step 4: Run Skill-Judge

Evaluate against 5 dimensions:
1. Trigger Accuracy (25%)
2. Action Coherence (25%)
3. Reference Integrity (20%)
4. Non-Redundancy (15%)
5. Edge Case Coverage (15%)

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
| STACK_OVERFLOW | >3 skills at entry | Refactor |
| REF_DEPTH_2 | 2-level references | Refactor |

### Non-Breaking Scenarios

| Scenario | Description | Expected |
|----------|-------------|----------|
| GSD_AFFECTED | GSD workflows still work | Unaffected |
| NO_CEREMONY | No added workflow friction | No overhead |
| STACK_OK | 3 skills max | Compliant |

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
