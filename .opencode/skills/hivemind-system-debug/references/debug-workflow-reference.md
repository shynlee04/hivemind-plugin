# Debug Workflow Reference

## Canonical Loop

1. Reproduce
2. Isolate
3. Hypothesize
4. Test the hypothesis
5. Fix the confirmed cause
6. Verify no regression

## IF/THEN Flow

1. **IF** the issue cannot be reproduced, **THEN** stop and gather a tighter failure report.
2. **IF** reproduction exists but touches many systems, **THEN** isolate with the smallest failing command or test.
3. **IF** multiple hypotheses remain, **THEN** rank by likelihood and test the cheapest first.
4. **IF** the suspected fix changes architecture, **THEN** stop and route to architecture review.
5. **IF** the fix passes the local failing probe but breaks broader checks, **THEN** revert and continue isolating.

## Evidence Rules

- Label every finding as `confirmed`, `inferred`, or `unverified`.
- Keep the failing command and the passing verification command.
- Record the exact file paths touched during remediation.

## Suggested Commands

```bash
npx tsx --test tests/failing.test.ts 2>&1 | head -20
npx tsc --noEmit 2>&1 | head -20
npm run build 2>&1 | head -20
```

## Exit Criteria

- Reproduction command identified
- Root cause either confirmed or explicitly bounded
- Fix validated with the original failing probe and broader gates
