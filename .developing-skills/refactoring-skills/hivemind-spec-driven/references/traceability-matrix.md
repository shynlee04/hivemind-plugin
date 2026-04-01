# Traceability Matrix Reference

## Purpose

A traceability matrix maps the chain from requirement → acceptance criterion → test → implementation. This ensures:
- Every requirement has test coverage
- Every test traces to a requirement
- Every implementation change can be traced to a business need
- No orphan tests (tests without requirements)
- No orphan requirements (requirements without tests)

---

## Chain Structure

```
Epic (business goal)
  └─ User Story (who/what/why)
      └─ Acceptance Criterion (Given/When/Then)
          └─ Test Case (automated test)
              └─ Implementation (source file / function)
```

---

## Matrix Format

### By User Story

| Story ID | Story Title | AC IDs | Test Files | Implementation Files | Status |
|----------|-------------|--------|------------|---------------------|--------|
| US-001 | User Login | AC-001, AC-002, AC-003 | `tests/auth/login.test.ts` | `src/auth/login.ts`, `src/auth/session.ts` | PASS |
| US-002 | Add to Cart | AC-004, AC-005, AC-006 | `tests/cart/add.test.ts` | `src/cart/cart-service.ts` | PASS |
| US-003 | Paginated Users | AC-007, AC-008 | `tests/api/users.test.ts` | `src/api/users.ts`, `src/db/user-repo.ts` | WIP |

### By Acceptance Criterion

| AC ID | Criterion | Story | Test | Test Status | Implementation | Verified |
|-------|-----------|-------|------|-------------|----------------|----------|
| AC-001 | Valid credentials → dashboard | US-001 | `login.test.ts:15` | PASS | `login.ts:validateCredentials()` | YES |
| AC-002 | Invalid password → error | US-001 | `login.test.ts:32` | PASS | `login.ts:authenticate()` | YES |
| AC-003 | Empty email → validation | US-001 | `login.test.ts:48` | PASS | `login.ts:validateForm()` | YES |

---

## Orphan Detection

### Orphan Tests (no requirement)

These tests exist but don't trace to any user story or acceptance criterion:

| Test File | Test Name | Action |
|-----------|-----------|--------|
| `tests/legacy/migrate.test.ts` | `should convert old format` | Link to story OR delete |

**Resolution:** Either link to a requirement (add AC ID) or delete the test.

### Orphan Requirements (no test)

These acceptance criteria have no automated test coverage:

| AC ID | Criterion | Action |
|-------|-----------|--------|
| AC-009 | "System handles concurrent updates" | Write test OR mark as manual-only |

**Resolution:** Write an automated test, or explicitly mark as manual testing with justification.

---

## Implementation Trace

Each function/module should trace back to its acceptance criteria:

```
src/auth/login.ts
  ├── validateCredentials() → AC-001, AC-002
  ├── validateForm() → AC-003
  ├── rateLimitCheck() → AC-004
  └── createSession() → AC-001

src/cart/cart-service.ts
  ├── addItem() → AC-004, AC-005
  ├── checkStock() → AC-006
  └── calculateSubtotal() → AC-004

src/api/users.ts
  ├── getUsers() → AC-007, AC-008
  └── paginate() → AC-007, AC-008
```

---

## Maintenance Rules

1. **Update matrix when adding features** — Every new user story must be added
2. **Update matrix when writing tests** — Link test to AC ID in matrix
3. **Update matrix when refactoring** — Implementation files change, but AC link stays
4. **Audit monthly** — Check for orphan tests and orphan requirements
5. **Include in PR template** — "Which AC does this PR address?"

---

## Automation

Automate orphan detection:

```typescript
// pseudo-code for traceability check
const allACs = parseSpecFile('spec.md');
const allTests = findTestFiles('tests/**/*.test.ts');
const testToACMapping = parseTestAnnotations(allTests);

// Find orphan tests
const orphanTests = allTests.filter(t => !testToACMapping.has(t));
// Find orphan ACs
const orphanACs = allACs.filter(ac => !testToACMapping.values().includes(ac.id));
```

Annotate tests with AC IDs:

```typescript
// @ac AC-001
describe('User Login', () => {
  // @ac AC-001
  it('redirects to dashboard with valid credentials', () => { ... });

  // @ac AC-002
  it('shows error with invalid password', () => { ... });
});
```
