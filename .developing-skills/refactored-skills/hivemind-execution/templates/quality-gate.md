## Quality Gate Result

**slice_id:** {id}
**timestamp:** {ISO 8601}
**agent:** {agent name}

### Gate Results

| Gate | Command | Status | Evidence |
|------|---------|--------|----------|
| Type check | `npx tsc --noEmit` | pass/fail | {output excerpt} |
| Tests | `npm test` | pass/fail | {output excerpt} |
| Lint | `npm run lint` | pass/fail | {output excerpt} |
| Build | `npm run build` | pass/fail | {output excerpt} |
| LOC check | `wc -l {file}` | pass/fail | {count} / 300 max |

### Code Quality Check

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Cyclomatic complexity | {max} | ≤10 | pass/fail |
| Longest function | {lines} lines | ≤50 lines | pass/fail |
| Module size | {lines} lines | ≤300 lines | pass/fail |
| Max parameters | {count} | ≤5 | pass/fail |
| Max nesting | {depth} | ≤3 | pass/fail |

### Summary

**Overall:** pass / fail / partial

{If fail: describe which gates failed and what needs fixing}

{If pass: confirm all evidence captured above}

### Evidence Captures

```bash
# Type check output
{npx tsc --noEmit output}

# Test output
{npm test output — last 5 lines}

# Lint output
{npm run lint output}

# Build output
{npm run build output}
```
