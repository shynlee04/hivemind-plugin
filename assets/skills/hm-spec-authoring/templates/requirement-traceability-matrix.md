# Requirement Traceability Matrix Template

Use this template in any project. Replace placeholders with project-local paths, commands, or blocked reasons.

```markdown
| REQ ID | Source quote/path | Condition | Positive case | Negative case | Boundary case | Integration case | Verification method | Implementation mapping | Test mapping | Coverage state | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQ-<DOMAIN>-01 | `<path>#section` or exact quote | One falsifiable condition | Given/When/Then | Given/When/Then or N/A with reason | Given/When/Then or blocked threshold | Cross-surface proof or N/A | command/inspection/manual/blocked | file/route/API/CLI or not-inspected | test name/command/gap | mapped/gap/blocked/not-applicable | draft/locked/blocked |
```

## Blocked Row Example

```markdown
| REQ-PERF-01 | `PRD.md#checkout`: "checkout must be fast" | blocked: no latency threshold | blocked | blocked | blocked | N/A | blocked: source lacks metric | not-inspected | gap | blocked | blocked |
```
