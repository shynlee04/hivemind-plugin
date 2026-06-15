# Triad Execution Workflow

The 3-gate sequence in fixed order.

## Gate 1: lifecycle-integration

Internal governance. 9 sub-checks.

**Halt rule**: If Gate 1 fails, do NOT proceed to Gate 2.

## Gate 2: spec-compliance

Spec alignment. 8 sub-checks.

**Halt rule**: If Gate 2 fails, do NOT proceed to Gate 3.

## Gate 3: evidence-truth

Terminal gate. 7 sub-checks.

**Halt rule**: If Gate 3 fails, the work is not shippable.

## Run All 3

```bash
bash assets/skills/hm-gate-triad/scripts/run-triad.sh <target> [spec_md]
```

Exits 0 on all-pass, non-zero on first fail with remediation hint.

## Output

VERIFICATION.md per `templates/verification-report.md`:
- Per-gate verdict + findings
- Per-sub-check status
- Aggregate status: passed | human_needed | gaps_found
- Remediation if any FAIL

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Skip Gate 1 to save time | Always start with Gate 1 |
| Gates in parallel | Strict sequential |
| "Gate 3 is just docs" | Gate 3 is mandatory terminal |
| Skip on trivial change | Always run all 3 |
| Bundle gates as passed | Emit per-gate + per-sub-check |
