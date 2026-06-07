# Acceptance Test Patterns

## Purpose

Use this reference to derive testable acceptance criteria after requirements are locked. Select patterns that match the project; do not assume Node, GSD, or a specific test runner.

## Scenario Types

| Type | Pattern | Evidence |
|---|---|---|
| Positive | Given valid preconditions, when the user/system acts, then the expected result occurs. | Unit, integration, E2E, command output, or inspection. |
| Negative | Given invalid input or unauthorized state, when action occurs, then a safe error or rejection happens. | Error assertion, status code, validation message, denied event. |
| Boundary | Given empty/min/max/timeout/missing dependency, then behavior remains defined. | Boundary test, timeout test, fallback inspection. |
| Integration | Given multiple components or runtime surfaces, then contract holds across the handoff. | Integration test, trace, event log, or documented manual proof. |

## BDD Coverage Matrix

Use BDD language as an evidence format, not as a dependency on a BDD framework.

| REQ ID | Scenario | Given | When | Then | Evidence type | Gap handling |
|---|---|---|---|---|---|---|
| REQ-* | positive | valid preconditions | target action | expected observable result | unit/integration/e2e/inspection | must map before lock |
| REQ-* | negative | invalid or unauthorized state | target action | safe rejection/error | test/inspection | omit only with reason |
| REQ-* | boundary | min/max/empty/timeout/missing dependency | target action | defined behavior | boundary test/manual proof | block if source lacks threshold |
| REQ-* | integration | interacting surfaces available | cross-surface action | contract holds across seam | integration trace/log/test | mark `gap` if no seam test exists |

## Quality Checks Adapted from Requirements Validation Sources

Before handing off to implementation, verify:

- Each acceptance case proves a requirement condition, not an implementation detail.
- Negative and boundary cases are included when security, data integrity, permissions, or resource limits are involved.
- Orphan tests are listed separately: a test with no requirement mapping does not prove spec completeness.
- Coverage gaps are named with the smallest missing test or inspection, not hidden behind PASS wording.

## Domain Examples

### API

- Validate request/response schema.
- Cover 200/400/401/403/404/409/500 where applicable.
- Verify idempotency and authorization boundaries.

### UI

- Assert accessible names, keyboard flow, and visible states.
- Cover loading, empty, error, and success states.
- Use screenshot or semantic DOM evidence only when appropriate.

### CLI / Agent Workflow

- Validate non-interactive command behavior.
- Capture exact stdout/stderr evidence.
- Preserve blocked and handoff states.

### Existing Implementation Compliance

- Compare public behavior against the requirement before changing the requirement.
- Mark implementation-only behavior as `orphan-implementation` until the source approves it.
- Mark tests with no REQ mapping as `orphan-test`; do not delete them automatically.
- When source and implementation disagree, record both facts and request priority rules.

### Algorithm / Data

- Use known input/output pairs.
- Add boundary values and property-style checks.
- Include performance thresholds only when source defines them.
