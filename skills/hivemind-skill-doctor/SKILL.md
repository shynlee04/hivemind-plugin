---
name: hivemind-skill-doctor
description: Use when auditing skills, evaluating skill quality, diagnosing skill problems, validating skill compliance, or fixing skill issues — operates Skill-Judge evaluation, conflict detection, and repair guidance.
---

# hivemind-skill-doctor

Audit, diagnosis, repair, and hardening skill for HiveMind skill quality.

## Purpose

Skill quality evaluation, audit, and repair guidance for:
- Auditing existing skills
- Diagnosing skill problems
- Testing skills as part of audit/improvement
- Repairing weak routing
- Fixing ambiguity
- Improving determinism
- Deconflicting overlapping logic
- Detecting anti-patterns
- Identifying broken assumptions
- Edge-case review
- Compatibility and maintainability improvements

## When to Activate

| Trigger | Task Type |
|---------|-----------|
| `audit this skill` | Quality evaluation |
| `is this skill good` | Skill-Judge scoring |
| `skill quality check` | Comprehensive audit |
| `evaluate skill` | Metric-based evaluation |
| `score this skill` | Quality scoring |
| `fix skill routing` | Trigger repair |
| `diagnose skill problem` | Problem identification |
| `improve determinism` | Clarity enhancement |
| `deconflict skills` | Overlap resolution |
| `validate skill compliance` | Standards verification |
| `anti-pattern detection` | Pattern analysis |
| `edge-case review` | Boundary testing |

## Auto-Activate Signals

Activate immediately when:
- Skill-Judge overall score <3.5
- Clear skill quality issues detected
- Redundant skill logic found
- Trigger ambiguity identified
- Packaging/migration planning needed

## Quality Dimensions

### Evaluation Matrix

| Dimension | Weight | Minimum Score | Description |
|-----------|--------:|---------------:|-------------|
| **Trigger Accuracy** | 25% | ≥3.0 | Does the skill activate when intended? No false positives/negatives. |
| **Action Coherence** | 25% | ≥4.0 | Do instructions lead to consistent, predictable behavior? |
| **Reference Integrity** | 20% | ≥3.0 | Are references valid, accessible, and properly linked? |
| **Non-Redundancy** | 15% | ≥3.0 | Does the skill avoid duplicating model-existing knowledge? |
| **Edge Case Coverage** | 15% | ≥3.0 | Are boundary conditions handled? |
| **Overall Score** | — | ≥3.5 | Weighted average must meet threshold |

### Scoring Scale

| Score | Meaning |
|-------|---------|
| 5.0 | Excellent: No issues, exceeds requirements |
| 4.0 | Good: Minor refinements possible |
| 3.0 | Acceptable: Meets minimum threshold |
| 2.0 | Poor: Significant issues present |
| 1.0 | Failing: Does not meet requirements |

### Edge Case Coverage Matrix

| Scenario | Must Handle |
|----------|-------------|
| **FRESH** | First activation, no context |
| **RESUMED** | Session continuation, existing context |
| **DELEGATED** | Subagent invocation, filtered context |
| **DEGRADED** | Context rot, partial information |
| **POST-CANCEL** | After user cancellation |
| **LATE** | Activation after stack full |

## Audit Process

### Step 1: Pre-Audit Check

```
□ Session health: Entry state known
□ Trust score: Sufficient
□ Context budget: >30% available
□ Stack status: Not overloaded
□ Authority: SOT clear for framework decisions
```

If any fail, document and decide whether to proceed with limitations.

### Step 2: Static Analysis

```
1. Parse skill file structure
2. Extract frontmatter (name, description)
3. Identify trigger phrases in description
4. Map body structure (sections, hierarchy)
5. Check references (if any)
6. Identify patterns used (P1/P2/P3)
```

**Static Checks:**

| Check | Pass Criteria |
|-------|---------------|
| Frontmatter valid | Has `name` and `description` fields |
| Triggers semantic | Uses phrases, not keywords |
| Structure hierarchic | Numbered sections, clear hierarchy |
| References valid | Files exist and are accessible |
| No forbidden patterns | Does not use anti-patterns |

### Step 3: Runtime Behavior Analysis

```
1. Analyze activation triggers:
   ├── Does description trigger on intended inputs?
   ├── Are there false positive triggers?
   └── Are there false negative triggers?

2. Analyze action coherence:
   ├── Do instructions produce predictable behavior?
   ├── Are there ambiguous instructions?
   └── Are there conflicting instructions?

3. Analyze edge cases:
   ├── Is there a "DoNOT Activate When" section?
   ├── Are boundary conditions handled?
   └── Are failure/recovery paths defined?

4. Analyze cross-workflow compatibility:
   ├── Does skill work in isolation?
   ├── Does skill work with other skills?
   └── Are there stack conflicts?
```

### Step 4: Conflict Detection

```
1. Check trigger overlap with loaded skills
2. Check domain overlap
3. Check authority boundary violations
4. Check activation collision scenarios
5. Check stack budget impact
```

**Conflict Severity Levels:**

| Level | Impact | Action |
|-------|--------|--------|
| **Critical** | Both skills activate incorrectly | Must fix before use |
| **High** | Significant overlap or ambiguity | Fix recommended |
| **Medium** | Partial overlap | Document and monitor |
| **Low** | Minor edge overlap | Acceptable with documentation |
| **None** | No overlap detected | Proceed |

### Step 5: Generate Report

```markdown
## Skill Audit Report: [skill-name]

### Summary
- **Overall Score**: X.X/5.0
- **Pass/Fail**: PASS/FAIL
- **Critical Issues**: N

### Dimension Scores
| Dimension | Score | Status |
|-----------|-------|--------|
| Trigger Accuracy | X.X | PASS/FAIL |
| Action Coherence | X.X | PASS/FAIL |
| Reference Integrity | X.X | PASS/FAIL |
| Non-Redundancy | X.X | PASS/FAIL |
| Edge Case Coverage | X.X | PASS/FAIL |

### Findings
[List specific issues found]

### Recommendations
[Prioritized fix recommendations]

### Computed Conflicts
[Overlap analysis with other skills]
```

## Repair Process

### Step 1: Diagnose

For each failing dimension, identify root cause:

```
Trigger Accuracy issues:
├── Vague triggers → Clarify with semantic phrases
├── Missing triggers → Add relevant trigger categories
├── Over-broad triggers → Add "Do NOT Activate When" boundaries
└── Platform-specific triggers → Mark platform specificity

Action Coherence issues:
├── Ambiguous instructions → Rewrite with deterministic language
├── Missing steps → Add structured process
├── Conflicting instructions → Resolve contradictions
└── Missing hierarchy → Add numbered structure

Reference Integrity issues:
├── Broken links → Fix paths
├── Missing references → Add required references
├── Irrelevant references → Remove or update
└── Incorrect pattern import → Fix pattern usage

Non-Redundancy issues:
├── Explaining known concepts → Remove redundant sections
├── Verbose explanationss → Apply Knowledge Delta principle
└── Filler content → Delete

Edge Case Coverage issues:
├── Missing "Do NOT Activate When" → Add boundary section
├── Missing failure handling → Add recovery paths
└── Missing session scenarios → Add edge case handling
```

### Step 2: Plan Repair

```
1. Prioritize by severity (Critical > High > Medium > Low)
2. Group related issues
3. Identify cross-cutting fixes
4. Create atomic repair batches
5. Define validation criteria per batch
```

### Step 3: Execute Repair

```
For each batch:
1. Apply fix
2. Run static analysis
3. Verify fix addresses issue
4. Check for new issues introduced
5. Document change
```

### Step 4: Re-validate

```
□ Re-run Skill-Judge metrics
□ Verify overall score ≥3.5
□ Verify all dimensions ≥ minimum
□ Re-check conflicts with other skills
□ Test activation scenarios
```

If any fail, return to Step 2.

## Anti-Pattern Detection

### Common Anti-Patterns

| Anti-Pattern | Detection | Fix |
|--------------|-----------|------|
| **Keyword triggers** | Triggers are single words or too generic | Replace with semantic trigger phrases |
| **Missing boundaries** | No "Do NOT Activate When" section | Add explicit boundary conditions |
| **Implicit hierarchy** | Unstructured instructions | Add numbered steps and exposed branches |
| **Redundant knowledge** | Explaining what model knows | Apply Knowledge Delta, delete redundant |
| **Vague description** | Description doesn't clarify trigger | Rewrite with semantic phrases |
| **Platform confusion** | Unclear platform specificity | Mark platform-specific sections |
| **No validation** | No TDD or test scenarios | Add validation checklist |
| **Stack conflict** | Overlaps with loaded skills | Add conflict avoidance or de-conflict |

### Detection Algorithm

```
FOR each skill file:
  IF frontmatter missing name OR description:
    FLAG "missing frontmatter"
  
  IF description contains single-word triggers:
    FLAG "keyword triggers"
  
  IF body has no numbered structure:
    FLAG "implicit hierarchy"
  
  IF body explains common concepts:
    FLAG "redundant knowledge"
  
  IF no "Do NOT Activate When" section:
    FLAG "missing boundaries"
  
  IF references exist AND files not found:
    FLAG "broken references"
  
  IF overlapping triggers with loaded skills:
    FLAG "activation conflict"
```

## TDD for Skills Validation

### Test Scenarios

Generate test scenarios for each edge case:

```markdown
## Test Scenario: [scenario name]

### Given
[Preconditions]

### When
[Trigger applied]

### Then
[Expected behavior]

### Actual
[Observed behavior]

### Pass/Fail
PASS/FAIL
```

### TDD Checklist

```
□ Identified failure modes before audit
□ Generated test scenarios
□ Ran scenarios against skill
□ Documented failures
□ Applied fixes
□ Re-ran scenarios
□ All scenarios pass
```

## Platform-Specific Validation

### OpenCode

```
□ Skill file at .opencode/skills/*/SKILL.md
□ Frontmatter has name and description
□ Description uses "Use when" pattern
□ Skill loads via `skill` tool
□ Activation matches description triggers
□ No conflict with other loaded skills
```

### Claude Code

```
□ Skill file at .claude/skills/*/SKILL.md
□ Frontmatter compatible with Claude Code
□ Activation matches Claude Code semantics
□ No conflict with Claude Code tools
```

### Cross-Platform

```
□ Platform-agnostic sections clearly marked
□ Platform-specific sections explicitly labeled
□ Behavior consistent across platforms where applicable
```

## Deconfliction Process

When skills overlap:

```
1. Identify overlap type:
   ├── Trigger overlap (same activation phrases)
   ├── Domain overlap (same problem domain)
   ├── Authority overlap (same responsibility)
   └── Stack overlap (activation collision)

2. Determine resolution:
   ├── Merge skills if truly redundant
   ├── Split responsibilities if orthogonal
   ├── Priority-order if hierarchical
   └── Add explicit routing if router/specialist

3. Update affected skills:
   ├── Clarify boundaries in both skills
   ├── Add cross-references if complementary
   └── Document overlap in both descriptions
```

## Delegated Reporting Format

When this skill delegates investigation:

```markdown
## Investigation Request

### Skill Under Review
[skill path]

### Investigation Scope
[what to investigate]

### Specific Questions
1. [Question 1]
2. [Question 2]

### Expected Output
[report format]

### Files to Read
[exact paths]

### Constraints
[boundaries and limits]
```

## References Required

| Reference | Purpose |
|-----------|---------|
| `references/05-skill-quality-matrix.md` | Full 120-point Skill-Judge system |
| `references/04-tdd-workflow.md` | TDD methodology for skills |
| `references/07-iterative-refinement.md` | Self-improvement loops |
| `references/08-conflict-detection.md` | Cross-pack overlap detection logic |

## Post-Audit Actions

After each audit:
1. Store pattern extracted (if confidence>0.8)
2. Flag for iterative refinement (if score <3.5)
3. Generate improvement recommendation
4. Update skill inventory if conflicts resolved

## Never Do

- ❌ Release skill with overall score <3.5
- ❌ Skip dimension-specific validation
- ❌ Ignore computed conflicts
- ❌ Proceed with degraded context
- ❌ Accept "good enough" without metrics
- ❌ Batch incompatible fixes together
- ❌ Skip re-validation after repair
- ❌ Document without specific findings
- ❌ Recommend changes without evidence