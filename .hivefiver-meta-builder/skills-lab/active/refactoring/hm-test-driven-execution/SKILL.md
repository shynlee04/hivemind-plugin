---
name: hm-test-driven-execution
description: >
  Execute red-green-refactor cycles integrated with planning and phase loops.
  Use when writing tests first, running test suites, verifying coverage claims, when the user
  wants to ensure code quality through testing, or when building features that need comprehensive
  test coverage. Even when the user says "write tests" or "make sure it's tested."
  Triggers: "TDD", "test-driven", "write tests first", "red-green-refactor", "test coverage",
  "test suite", "unit tests", "integration tests", "testing workflow".
  NOT for manual testing or test-after development.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Test-Driven Execution

## The Iron Law

```
Never claim test coverage without running the tests. Fresh output or no claim.
```

## On Load

1. Read `references/red-green-refactor.md` — the canonical TDD cycle
2. Read `references/coverage-verification.md` — how to verify coverage claims honestly

## The Red-Green-Refactor Loop

### Red Phase

```bash
# Write test BEFORE implementation
# Run test — expect FAIL
npm test
# If it passes, test is invalid. Rewrite.
```

**Gate:** If test passes on first run, STOP. The test is not testing what you think it is.

### Green Phase

```bash
# Write MINIMAL code to make test pass
# Run test — expect PASS
npm test
# If it fails, fix until pass. Do NOT refactor yet.
```

**Gate:** If you refactor before green, you are not doing TDD.

### Refactor Phase

```bash
# Clean up code
# Re-run ALL tests
npm test
# All tests must pass. If any fail, revert refactor.
```

**Gate:** If refactor breaks tests, revert and try smaller refactor steps.

## Coverage Claims

### Valid Claim

```
"Coverage: 87% (verified by `npm run test:coverage` at commit `a1b2c3d`)"
```

### Invalid Claim

```
"Coverage: ~90%"  # No command, no commit, no evidence
```

### Verification Command

```bash
# Always run coverage in the current message before claiming
npm run test:coverage
# Copy the output line that shows coverage percentage
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Test-After** | Writes implementation before tests | Delete implementation, write test first, re-implement |
| **The Fake Green** | Test passes because it asserts `true === true` | Test must fail if implementation is removed or broken |
| **The Refactor-First** | Cleans code before making test pass | Green first, then refactor |
| **The Coverage Lie** | Claims coverage without running command | Run command now, fresh output or no claim |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/red-green-refactor.md` | The canonical 3-phase TDD cycle |
| `references/coverage-verification.md` | How to verify and report coverage honestly |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-spec-driven-authoring` | Owns spec→req→test derivation. This skill owns the execution of those tests. |
| `hm-planning-with-files` | Owns task planning. This skill adds test status to progress.md. |
