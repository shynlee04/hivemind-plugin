# TDD Session Workflow

Use this workflow for a locked requirement, bug reproduction, or coverage verification task.

## Action State Table

| Action | Required input | Required output | Stop condition |
|---|---|---|---|
| `start` | Locked REQ or bug reproduction. | Runner detection and focused command. | Ambiguous requirement or missing tooling. |
| `red` | One behavior and public interface. | Failing test output for the right reason. | Test passes, setup failure, or trivial assertion. |
| `green` | Valid RED evidence. | Same focused command passes after minimal implementation. | Still failing after focused retry budget. |
| `refactor` | GREEN output. | Focused and broader relevant tests still pass. | Regression introduced. |
| `coverage` | Passing behavior tests. | PASS/PARTIAL/MISSING/BLOCKED coverage report. | Coverage tooling failure without fallback. |
| `status` | Current evidence. | Inline or file-based progress table. | None. |

## Progress Row

```markdown
| Requirement | Phase | Test size | Evidence label | Command | Observed output | Coverage status | Next step |
|---|---|---|---|---|---|---|---|
```

## Retry Rule

After three focused attempts in RED or GREEN, stop and return a blocked handoff with command output and next hypothesis. Do not keep editing silently.
