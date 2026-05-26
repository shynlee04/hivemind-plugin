# Evidence Framework

## Evidence Types

| Type | Strength | Collection Method |
|------|----------|-------------------|
| Log line | Medium | Read log files |
| Stack trace | High | Reproduce failure |
| Input/output pair | High | Controlled experiment |
| Code review | Medium | Read source |
| User report | Low | Ask clarifying questions |

## Ranking

1. Stack trace + input → highest confidence
2. Log line + code review → medium confidence
3. User report alone → lowest confidence; must verify
