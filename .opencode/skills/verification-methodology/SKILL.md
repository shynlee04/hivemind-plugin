---
name: verification-methodology
description: "Goal-backward analysis: start from acceptance criteria, trace evidence backward to implementation."
---

# Verification Methodology

Use this skill when verifying that a deliverable (phase, task, feature) meets its acceptance criteria.

## Goal-Backward Analysis

Traditional verification checks "what was done." Goal-backward verification checks "what SHOULD be true" and traces backward to confirm.

### Process

1. **Extract acceptance criteria** from the planning artifact (phase plan, task definition, PRD).
2. **For each criterion**, define what evidence would prove it:
   - Command output (e.g., "npm test shows 0 failures")
   - File existence (e.g., "src/lib/state-queue.ts exists")
   - Code pattern (e.g., "grep finds queueStateMutation in all hooks")
   - Metric (e.g., "all files ≤ 550 LOC")
3. **Collect evidence** by running commands and reading files.
4. **Map evidence to criteria** — does the evidence satisfy the criterion?
5. **Produce verdict** — PASS (evidence confirms), FAIL (evidence contradicts), INCONCLUSIVE (insufficient evidence).

### Evidence Collection Commands

| Evidence Type | Command Pattern |
|--------------|----------------|
| Test results | `npm test 2>&1` |
| Type safety | `npx tsc --noEmit 2>&1` |
| File existence | `ls -la {path}` |
| Code pattern presence | `grep -r "{pattern}" {scope}` |
| Code pattern absence | `grep -r "{pattern}" {scope}` (expect 0 matches) |
| LOC count | `wc -l {files}` |
| Git state | `git status --short`, `git log --oneline -5` |

### Verdict Rules

- **PASS**: Evidence directly confirms the criterion. Command output matches expected result.
- **FAIL**: Evidence directly contradicts the criterion. Test failures, type errors, missing files.
- **INCONCLUSIVE**: Cannot determine from available evidence. Flag for manual review.

### Report Structure

For each criterion:
```
Criterion: [ID] [Description]
Evidence: [Command run and output]
Verdict: PASS | FAIL | INCONCLUSIVE
Notes: [Any caveats or additional context]
```

Overall verdict: PASS (all criteria pass), FAIL (any criterion fails), PARTIAL (some inconclusive).

## Anti-Patterns

- **Checking the wrong thing**: Verify the CRITERION, not the implementation method
- **Assuming from code**: "The code looks right" is not evidence. Run the test.
- **Partial evidence**: If a criterion has 3 sub-conditions, all 3 must be verified
- **Inference without execution**: "It should work because..." is never a valid verdict
