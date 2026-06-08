# One TDD Cycle

The 5-stage sequence for a single TDD cycle on one REQ.

## Step 0: Pre-flight

- Confirm REQ-NNN is locked in SPEC.md
- Confirm test file path
- Confirm impl file path
- Open the cycle card (see `templates/tdd-cycle-card.md`)

## Step 1: RED

Write the test FIRST. Run it. Confirm it fails for the asserted behavior.

```bash
npm test -- <test_file>
# exit code != 0
# output contains: "expected X, received Y" or similar
```

If the test passes BEFORE impl: test-after detected. ABORT.

## Step 2: GREEN

Write minimum impl to make test pass. NO extra features.

```bash
# Caller writes impl
npm test -- <test_file>
# exit code 0
```

If the test still fails: more impl needed. Don't change approach
unless 3 attempts fail.

## Step 3: Coverage

```bash
npm run typecheck  # 0 errors
npm test -- <pattern>  # green
npm run test:coverage  # PASS / PARTIAL / MISSING / BLOCKED
```

## Step 4: Cross-Ref (if multi-file)

If the impl is in a different file than the test, or if other files
need updating:

1. Update inbound refs in agents/ (Phase A)
2. Update skills/ (Phase B)
3. Update commands/ (Phase C)
4. Update workflows/refs/templates (Phase D)

Run `assets/skills/hm-cross-change/scripts/check-cross-cutting.sh <old> <new>`
to verify completeness.

## Step 5: REFACTOR (optional)

If the GREEN impl has duplication, magic strings, unclear naming —
refactor. Tests must stay green.

Skip if GREEN is already clean.

## Step 6: Commit

```bash
git add <files>
git commit -m "test(REQ-NNN): <one-line description>

Refs: AUDIT-04 / TDD cycle
Evidence: <test output path>"
```

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Test-after | Write test FIRST, see it fail |
| Bundle of failing tests | One REQ per cycle |
| "Just one more try" > 3 | Escalate |
| Refactor before green | Refactor only after green |
| Mock-heavy to skip impl | Use L1 evidence; mock only the seam |
