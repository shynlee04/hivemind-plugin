# RED-GREEN-REFACTOR Protocol

The 3-stage micro-cycle within each TDD iteration.

## RED (failing test first)

Write a test that asserts the behavior. The test MUST fail for the
reason the spec describes.

Verification:
```bash
npm test -- <test-file>
# exit code != 0
# output contains: expected X, received Y (or similar assertion failure)
```

If the test fails for an UNRELATED reason (typo, missing import, etc.),
fix the test, not the impl. The failure must be the asserted behavior.

## GREEN (minimum impl)

The smallest change that makes the test pass.

Anti-patterns:
- Adding error handling "while I'm here"
- Refactoring existing code
- Optimizing performance
- Adding features not in the spec

Each of these is a separate cycle.

## REFACTOR (clean up)

After GREEN, the code may have:
- Duplication
- Magic strings
- Unclear naming
- Inconsistent style

Refactor in a separate cycle. Tests must stay green throughout.

Skip REFACTOR if GREEN is already clean.
