---
name: hm-spec-driven-authoring
description: >
  Turn a specification into falsifiable requirements and acceptance tests.
  Use when locking a spec, turning requirements into tests, verifying implementation against
  a written contract, when the user has a PRD or spec document, or when building features
  that need formal acceptance criteria. Even when the user says "make sure it matches the spec"
  or "verify against the requirements."
  Triggers: "spec", "specification", "requirements", "acceptance tests", "falsifiable",
  "verify implementation", "contract", "PRD", "formal verification".
  NOT for exploratory coding or prototyping without a spec.
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

# Spec-Driven Authoring

## The Iron Law

```
If it is not written as a requirement, it is not a requirement. If it is not tested, it does not exist.
```

## On Load

1. Read `references/spec-to-req-mapping.md` — how to decompose a spec into REQ-* items
2. Read `references/acceptance-test-patterns.md` — test patterns by domain (API, UI, algorithm)

## The Spec → Req → Test Pipeline

### Step 1: Lock the Spec

```
SPEC.md → extract every MUST, SHOULD, MAY
→ assign REQ-ID to each
→ verify no ambiguity (each REQ has exactly one falsifiable condition)
```

### Step 2: Derive Tests

For each REQ-*:
- Write at least one positive test (happy path)
- Write at least one negative test (error path, if applicable)
- If REQ is complex, write integration test

### Step 3: Run Tests (Red Phase)

Before implementation:
```bash
npm test  # or equivalent
# Expect: FAIL (tests exist but implementation does not)
```

If tests pass before implementation → test is invalid. Rewrite.

### Step 4: Implement (Green Phase)

Write minimal code to make tests pass.

### Step 5: Refactor

Clean up. Re-run tests. All must still pass.

## Requirement Format

```markdown
### REQ-01: <short description>
**Condition:** <exactly one falsifiable statement>
**Test:** <test file and function name>
**Status:** [not-tested | red | green | regressed]
```

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Vague Spec** | REQ contains words like "fast", "user-friendly", "robust" | Replace with measurable conditions (latency <100ms, error rate <1%) |
| **The Untestable Req** | REQ requires human judgment to verify | Add automated proxy (screenshot diff, log assertion) |
| **The Green Before Red** | Tests pass before implementation exists | Test is not actually testing the requirement; rewrite |
| **The Missing Negative** | Only happy-path tests exist | Add error-case and boundary tests |

## Reference Map

| File | When to Read |
|------|-------------|
| `references/spec-to-req-mapping.md` | Decomposing a spec into requirements |
| `references/acceptance-test-patterns.md` | Writing tests for specific domains |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-test-driven-execution` | Owns the red-green-refactor execution loop. This skill owns the spec→req→test derivation. |
| `hm-planning-with-files` | Owns task planning. This skill adds REQ-* tracking to the plan. |
