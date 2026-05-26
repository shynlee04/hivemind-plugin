# Coverage Verification

## Purpose

Use this reference when reporting coverage or when coverage tooling is absent. Coverage is an evidence claim, not an estimate.

## Claim States

| State | Meaning | Required evidence |
|---|---|---|
| PASS | Coverage command ran and produced usable output. | Command plus exact output summary. |
| PARTIAL | Behavioral tests ran, but coverage command was incomplete or scoped. | Test output plus limitation. |
| MISSING | Coverage tooling or script is unavailable. | Attempted command or inspection evidence. |
| BLOCKED | Coverage command cannot run due to setup/dependency failure. | Error output and next setup step. |

Coverage never upgrades invalid TDD evidence. If RED passed unexpectedly, coverage can be recorded but the TDD gate remains blocked.

## Command Adapters

- Node: prefer `npm run test:coverage`; if absent, inspect package scripts and run the closest test command without inventing coverage.
- Python: prefer `pytest --cov`; if plugin missing, run `pytest` and mark coverage `MISSING`.
- Go: prefer `go test ./... -cover`; if module context missing, run narrower package tests or mark blocked.
- Other stacks: use the project’s documented coverage command or mark `MISSING` with evidence.

## Evidence Labels

| Label | Use when | Limitation |
|---|---|---|
| `runtime-truthful` | Behavior is exercised through public interface or realistic integration seam. | None for the covered behavior. |
| `transport-mocked` | Network/API/process boundary is mocked while domain logic is real. | Does not prove transport configuration. |
| `mock-heavy` | Multiple internals are replaced. | Supports debugging only; needs complementary runtime proof. |
| `manual-only` | Human/browser/CLI observation exists without automated assertion. | Cannot close automated TDD acceptance alone. |

## Report Template

```yaml
coverage_status: PASS | PARTIAL | MISSING | BLOCKED
command: <exact command or inspection>
observed_output: <short excerpt>
test_size_scope: small | medium | large | mixed | not-applicable
evidence_label: runtime-truthful | transport-mocked | mock-heavy | manual-only
limitations: <none or exact gap>
next_step: <none or follow-up>
```

## Valid Report

```text
coverage_status: PASS
command: npm run test:coverage
observed_output: "Statements 88.42% ..."
limitations: none
```

## Invalid Reports

- “About 90% coverage.”
- “Coverage should be high.”
- “Tests passed, so coverage is fine.”
- Any claim based on stale memory or prior sessions.
