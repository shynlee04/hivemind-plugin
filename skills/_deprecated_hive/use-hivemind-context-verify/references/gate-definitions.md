# Gate Definitions

## Build Gate
**Command:** `npx tsc --noEmit`

**What it checks:** TypeScript compilation succeeds without errors.

**Pass criteria:** Exit code 0, no type errors.

## Test Gate
**Command:** `npm test`

**What it checks:** All tests pass.

**Pass criteria:** Exit code 0, all test suites green.

## Git Gate
**Command:** `git status --porcelain`

**What it checks:** Working directory is clean (no uncommitted changes).

**Pass criteria:** Empty output (no changes to commit).

## Truth Gate Chain
When all three gates pass in sequence, the completion claim is verified with deterministic evidence.
