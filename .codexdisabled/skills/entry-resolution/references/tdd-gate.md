# TDD Verification Gate

**MANDATORY LOAD**: Before any completion claim or when verification is needed.

## The Gate

Nothing is "done" until this gate passes:

```
Completion Claim
    │
    ├── Was a verification command run? (test/build/lint/type-check)
    │   NO  → GATE FAILS. Run verification first.
    │   YES → Continue
    │
    ├── Was the output inspected? (not just exit code — read the actual output)
    │   NO  → GATE FAILS. Read the output.
    │   YES → Continue
    │
    ├── Does the output confirm the acceptance criteria?
    │   NO  → GATE FAILS. Fix and re-verify.
    │   YES → Continue
    │
    └── Was the work hierarchy updated with accurate status?
        NO  → GATE FAILS. Update status.
        YES → GATE PASSES ✅
```

## RED-GREEN-REFACTOR Checkpoint

When creating or modifying code:

| Phase | What to Check | NEVER Skip |
|-------|--------------|------------|
| **RED** | Test exists and fails for the right reason | Writing code before test |
| **GREEN** | Minimal code makes test pass | Over-engineering to pass |
| **REFACTOR** | Code is clean AND test still passes | Refactoring without re-running tests |

## Evidence Standards

| Claim | Required Evidence |
|-------|------------------|
| "Tests pass" | Actual test runner output showing pass count |
| "Build succeeds" | Actual compiler/bundler output with 0 errors |
| "No regressions" | Full suite output, not just changed tests |
| "Type-safe" | Type checker output showing 0 errors |
| "Fixed the bug" | Before/after evidence (failing → passing) |

## Red Flags — You're About to Skip the Gate

| Thought | Reality |
|---------|---------|
| "I tested it mentally" | Mental models miss edge cases. Run the command. |
| "It's obvious this works" | Obvious things break. 3 seconds to verify. |
| "I'll verify at the end" | Compaction may erase context. Verify NOW. |
| "The subagent said it works" | Subagents hallucinate success. Verify independently. |
