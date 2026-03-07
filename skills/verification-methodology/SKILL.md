---
name: "verification-methodology"
description: "Use when verifying that a deliverable meets acceptance criteria. Goal-backward analysis: start from what SHOULD be true, trace evidence backward to implementation."
---

# Verification Methodology

## When to Use

Verifying that a deliverable (phase, task, feature) meets its acceptance criteria.

## Goal-Backward Analysis

Traditional verification checks "what was done." Goal-backward checks "what SHOULD be true" and traces backward to confirm.

### Process

1. **Extract acceptance criteria** from the planning artifact (phase plan, task definition, PRD)
2. **For each criterion**, define what evidence would prove it:
   - Command output (e.g., "npm test shows 0 failures")
   - File existence (e.g., "src/lib/state-queue.ts exists")
   - Code pattern (e.g., "grep finds pattern in all hooks")
   - Metric (e.g., "all files ≤ 550 LOC")
3. **Collect evidence** by running commands and reading files
4. **Map evidence to criteria** — does the evidence satisfy the criterion?
5. **Produce verdict** — PASS, FAIL, or INCONCLUSIVE

### Evidence Type → Verification Strategy

| Evidence Type | Strategy |
|--------------|----------|
| Test results | Run test suite, capture output |
| Type safety | Run type checker, capture errors |
| File existence | Check path exists |
| Code pattern presence | Search for pattern in scope |
| Code pattern absence | Search + expect 0 matches |
| Line count | Count lines in target files |
| Version control state | Check working tree, recent commits |

### Verdict Rules

- **PASS**: Evidence directly confirms the criterion
- **FAIL**: Evidence directly contradicts the criterion
- **INCONCLUSIVE**: Cannot determine from available evidence — flag for manual review

### Report Structure

For each criterion:
```
Criterion: [ID] [Description]
Evidence: [Command run and output]
Verdict: PASS | FAIL | INCONCLUSIVE
Notes: [Any caveats]
```

Overall: PASS (all pass), FAIL (any fails), PARTIAL (some inconclusive).

## Anti-Patterns

- **Checking the wrong thing**: Verify the CRITERION, not the implementation method
- **Assuming from code**: "The code looks right" is not evidence. Run the test
- **Partial evidence**: If a criterion has 3 sub-conditions, all 3 must be verified
- **Inference without execution**: "It should work because..." is never a valid verdict
