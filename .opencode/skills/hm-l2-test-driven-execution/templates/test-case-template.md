# Portable TDD Test Case Template

Adapt syntax to the detected test runner. Keep the evidence fields even when the language changes.

```markdown
## TDD Case: <REQ-ID or bug-id>

**Behavior:** <one observable behavior>
**Public interface:** <API/CLI/UI/function/event>
**Test size:** small | medium | large
**Evidence label target:** runtime-truthful | transport-mocked | mock-heavy | manual-only

### RED
- Test file/name: <path :: test name>
- Command: `<exact focused command>`
- Expected failure reason: <missing behavior, not syntax/setup noise>
- Observed failure excerpt: <paste excerpt>

### GREEN
- Minimal implementation files: <paths>
- Command: `<same focused command>`
- Observed pass excerpt: <paste excerpt>

### REFACTOR
- Refactor performed: yes | no
- Commands rerun: `<focused>` and `<broader suite or reason skipped>`
- Observed output: <paste excerpt>

### Coverage
- coverage_status: PASS | PARTIAL | MISSING | BLOCKED
- Coverage command or inspection: <exact command/inspection>
- Limitations: <none or gap>
```
