# Review Gates

## Purpose

Review gates sit between workflow phases. After a batch completes and before the next phase begins, a review gate verifies output completeness, cross-reference validity, and pattern compliance. Unlike synthesis gates (which control iteration loops), review gates control phase transitions.

## When to Use

| Transition | Review Gate? |
|------------|-------------|
| Between implementation and verification | Yes |
| Between parallel batches | Yes |
| Before committing changes | Yes |
| Before handing off to another agent | Yes |
| Between iterations within a single loop | No — use synthesis gates |
| During a single-pass delegation | No — no phases to transition |

## Review Gate Checks

### Output Completeness

Verify that all expected artifacts exist. Every delegated task has an expected output set.

| Check | Pass Condition |
|-------|---------------|
| Files created match task specification | Every file path in the task's `expected_files` array exists on disk |
| Line counts within limits | SKILL.md <500, references <200, templates <100 |
| Content not empty | Every created file has >0 non-whitespace lines |
| No placeholder content | No `TODO`, `FIXME`, or `PLACEHOLDER` strings in deliverables |

### Cross-Reference Validity

Verify that every reference points to an existing target.

| Check | Pass Condition |
|-------|---------------|
| Markdown links resolve | Every `[text](path)` points to a file that exists |
| Skill YAML references resolve | `parent` field references a skill that exists in the skill tree |
| Reference file list matches disk | Every file listed in Bundled Resources exists in `references/` or `templates/` |
| No orphan references | No file in `references/` is missing from the Bundled Resources table |

### Line Count Compliance

| File Type | Maximum Lines | Hard Limit |
|-----------|--------------|------------|
| SKILL.md | 500 | Yes |
| Reference files | 200 | Yes |
| Template files | 100 | Soft |

Hard limits are non-negotiable. If a file exceeds its hard limit, the gate fails.

### Pattern Compliance

| Pattern | Compliance Check |
|---------|-----------------|
| Pattern 1 (Workflow) | Has YAML frontmatter with `name`, `description`, `parent` |
| Pattern 2 (Conditional) | Conditional Loading section present with trigger conditions |
| Pattern 3 (Decision Tree) | Decision tree reference exists and paths are valid |

## Gate Pass/Fail Criteria

### Hard Fails

Hard fails stop the phase transition immediately. The gate does not pass.

| Condition | Failure Reason |
|-----------|---------------|
| Missing expected file | Output incomplete — task did not finish |
| Broken cross-reference | Referenced file or section does not exist |
| SKILL.md exceeds 500 lines | Skill is too large — must refactor or extract |
| Reference file exceeds 200 lines | Reference is too large — must split |
| YAML frontmatter missing fields | `name`, `description`, or `parent` absent |

### Soft Fails

Soft fails are recorded but do not block the transition. The orchestrator decides.

| Condition | Warning Reason |
|-----------|---------------|
| Template exceeds 100 lines | Consider condensing, but not blocking |
| Minor formatting inconsistency | Style drift, not a structural issue |
| Optional section missing | Gate functions without it, but completeness suffers |

## Gate Result Format

```json
{
  "review_gate_id": "review-phase-2-to-3",
  "source_phase": "implementation",
  "target_phase": "verification",
  "timestamp": "2026-03-28T10:00:00Z",
  "status": "pass | fail | conditional",
  "checks": {
    "output_completeness": {
      "passed": true,
      "missing_files": [],
      "empty_files": []
    },
    "cross_reference_validity": {
      "passed": true,
      "broken_refs": [],
      "orphan_files": []
    },
    "line_count_compliance": {
      "passed": true,
      "violations": []
    },
    "pattern_compliance": {
      "passed": true,
      "violations": []
    }
  },
  "hard_fails": [],
  "soft_fails": [],
  "recommendation": "proceed | fix_and_retry | abort"
}
```

## Integration with Synthesis Gates

Review gates and synthesis gates operate at different levels:

| Aspect | Review Gate | Synthesis Gate |
|--------|------------|----------------|
| Scope | Phase transitions | Iteration loops |
| Timing | Between phases | After each iteration |
| Focus | Output completeness and cross-references | Carry-forward quality and coverage |
| Failure impact | Blocks phase transition | Blocks next iteration |

A typical workflow uses both:

1. Synthesis gates control iterations within a phase (e.g., during implementation)
2. Review gates verify the phase output before moving to the next phase (e.g., before verification)
3. Both require evidence — see `references/evidence-based-gatekeeping.md`

## HiveMind Conventions

Review gates enforce evidence discipline at phase boundaries. Every check must produce verifiable evidence, not claims.

- **Evidence requirements:** See `references/evidence-based-gatekeeping.md` for the full evidence classification system and excuse prevention rules
- **Gate evidence records:** Use the `Gate Evidence Record Format` defined in evidence-based-gatekeeping.md — every check gets a `command`, `exit_code`, `output_excerpt`, and `status`
- **Evidence classification:** Only `confirmed` evidence passes a review gate. `inferred` is acceptable for summaries but not for gate decisions

## Storage

Review gate results are stored at:
- `{activity}/delegation/{phase_id}-review-gate.json`

## Anti-Patterns

**Skipping review gates between phases.** Synthesis gates alone are insufficient. Phase transitions carry different risks (cross-reference drift, line count violations) that synthesis gates do not check.

**Using review gates inside iterations.** Review gates are for phase boundaries. Inside a loop, synthesis gates are the correct mechanism. Using review gates inside iterations creates overhead without adding value.

**Passing on soft fails without recording.** Soft fails must still be recorded. Ignoring them accumulates debt that surfaces at the project-level gate when it is too late to isolate the cause.
