# Code Review Checklist

Multi-dimensional review checklist for post-refactor verification. Each dimension provides pass/fail criteria. Run during VERIFY phase to validate refactor quality beyond test passage.

## How To Use

1. Select dimensions relevant to your refactor scope (not all apply to every change)
2. Walk through each checklist item
3. Mark PASS or FAIL with evidence
4. Any FAIL in Correctness or Security = block merge
5. Aggregate findings by severity using `severity-calibration.md`

## Dimension 1: Correctness

Correctness is the primary concern. If the code doesn't work correctly, nothing else matters.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Logic paths complete | All branches return or throw; no implicit undefined returns | Missing return in if/else, switch without default |
| 2 | Edge cases handled | Null, undefined, empty string/array/object, boundary values tested | Crash on empty input, NaN propagation |
| 3 | Error handling | Every async call has catch/handle; every external call has fallback | Unhandled promise rejection, swallowed errors |
| 4 | Null safety | Null/undefined checks before property access; optional chaining where appropriate | `Cannot read property of undefined` |
| 5 | Type correctness | No unnecessary `any` casts, no type assertions without documented reason | `as unknown as T`, double casting |
| 6 | State mutations | State changes are intentional, documented, and reversible | Silent mutation, side effects without trace |
| 7 | Off-by-one errors | Loop bounds checked, array indices validated, slice operations verified | Fencepost errors, inclusive/exclusive confusion |
| 8 | Concurrency safety | Shared state protected with locks/atomics or avoided entirely; race conditions assessed | Unprotected shared state, lost updates |
| 9 | Boundary values | Min/max handled, empty collection returns safe default, single-element collection handled | `arr[0]` on empty array, `max + 1` overflow |
| 10 | Idempotency | Repeatable operations produce same result on retry; no duplicate side effects | Double-charge on retry, duplicate records |

**Correctness FAIL = Block merge. Fix immediately.**

## Dimension 2: Security

Security findings are never low-severity. A security issue is always P0 or P1.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Input validation | All external input validated at boundary; schema validation for structured data | Raw user input in queries, unvalidated file upload |
| 2 | Auth checks | Authorization verified before every sensitive operation; no auth bypass paths | Missing middleware, commented-out auth |
| 3 | Secrets handling | No hardcoded credentials; env vars used; secrets not in version control | API key in source, password in config committed |
| 4 | Injection risks | Parameterized queries, escaped output, no string concatenation in SQL/commands | String interpolation in SQL, `eval()` with user input |
| 5 | XSS prevention | Output encoding applied; CSP headers configured; no dangerous DOM APIs with user data | `innerHTML` with user content, unescaped template |
| 6 | CSRF protection | Tokens on state-changing requests; SameSite cookies configured | POST without CSRF token, GET mutations |
| 7 | Path traversal | File paths sanitized; `../` stripped from user input; sandboxed file access | Unsanitized file path in serve handler |
| 8 | Dependency risks | No known CVEs; lockfile pinned; transitive deps audited | Vulnerable transitive dependency, unpinned version |
| 9 | Logging safety | No PII, tokens, or secrets in log output; structured logging used | Password in log statement, full credit card in error |
| 10 | Error disclosure | Generic error messages to client; detailed errors only in server logs | Stack trace in API response, DB schema in error |

**Security FAIL = Block merge. Fix immediately.**

## Dimension 3: Performance

Performance review applies when touching hot paths, database queries, or rendering code.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Algorithm complexity | No unintentional O(n²) or worse on unbounded input | Nested loops on large dataset |
| 2 | N+1 queries | Single query with join/IN, not per-entity loops | Query inside forEach/map |
| 3 | Memory leaks | Event listeners cleaned up, refs released, subscriptions unsubscribed | Growing heap, detached DOM nodes |
| 4 | Unnecessary allocations | No objects created in hot loops; reuse where possible | `new Date()` in render path, array concat in loop |
| 5 | Lazy loading | Large resources loaded on demand, not eagerly at startup | Full dataset fetched on page load |
| 6 | Caching | Repeated expensive computations memoized or cached | Same API call 5 times in one render |
| 7 | Bundle size | No unnecessary large imports; tree-shakeable imports used | Importing entire lodash when using 2 functions |
| 8 | Database indexes | Columns used in WHERE/JOIN clauses indexed | Full table scan on filtered query |
| 9 | Network efficiency | Requests batched, deduplicated, paginated | Sequential fetch in loop, unbounded result set |
| 10 | Rendering efficiency | No unnecessary re-renders; memoization where needed | Missing React.memo on expensive child |

## Dimension 4: Readability

Readability affects maintainability. Code is read 10× more than it is written.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Naming intent | Name tells what it does, not how it does it | `processData()`, `handleStuff()`, `temp` |
| 2 | Function length | Under 30 lines; single responsibility; can understand without scrolling | 80-line functions, multiple responsibilities |
| 3 | Comments | Explain WHY, not WHAT; stale comments removed; complex algorithms documented | Comment repeats code verbatim, TODO without date |
| 4 | Consistent style | Follows project naming conventions throughout | camelCase mixed with snake_case, inconsistent imports |
| 5 | Cognitive load | Can understand function without tracing full call chain | 5+ levels of indirection, callback hell |
| 6 | Dead code | Removed entirely, not commented out | Commented-out blocks, unused imports, unreachable code |
| 7 | Magic values | Named constants for every magic number/string | `if (status === 3)`, `sleep(86400)` |
| 8 | File organization | Related items grouped, logical order within file | Random method placement, no grouping |
| 9 | Import clarity | Grouped by type, no wildcard imports, minimal re-exports | `import * as _ from 'lodash'`, 30 random imports |
| 10 | Error messages | Actionable, include context, guide toward resolution | "Error occurred", "Something went wrong" |

## Dimension 5: Architecture

Architecture violations compound. Catch them early before they become systemic.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Separation of concerns | Each module has one reason to change; UI separate from business logic | Validation mixed with rendering, HTTP in domain |
| 2 | Dependency direction | High-level modules don't depend on low-level; abstractions don't depend on details | Business logic imports database driver |
| 3 | Interface design | Small, focused interfaces; no god interfaces | 15+ method interface, interface with optional everything |
| 4 | Abstraction level | Implementation details don't leak across boundaries | Database types in API response, HTTP status in domain |
| 5 | Coupling | Loose coupling via interfaces; no circular dependencies | Import cycles, hard-coded dependencies |
| 6 | Cohesion | Related code lives together; unrelated code separated | Kitchen-sink utility file, unrelated methods in one class |
| 7 | Extensibility | New features add code, don't modify existing | Changing core module for edge case feature |
| 8 | API surface | Clean public API; internals hidden; single entry point | Internal functions exported, multiple entry points |
| 9 | Layer violations | Each layer only communicates with adjacent layers | Controller directly calling database |
| 10 | YAGNI compliance | No speculative abstractions; code for current requirements | Factory of factories for single implementation |

## Dimension 6: Testing

Tests are the refactor safety net. Weak tests mean weak confidence.

| # | Check | Pass Criteria | Fail Signal |
|---|-------|--------------|-------------|
| 1 | Coverage | All changed lines have test coverage; branches covered | Untested new code path, missing error branch |
| 2 | Test quality | Tests assert behavior, not implementation details | `expect(mock).toHaveBeenCalled()` without checking args |
| 3 | Assertion specificity | One behavior per test; specific assertions | 10 loosely related assertions in one test |
| 4 | Test isolation | Tests don't depend on execution order or shared state | Passes alone, fails in suite |
| 5 | Mocking discipline | Minimal mocking; real implementations when practical | Mocking everything including utilities |
| 6 | Edge case tests | Null, empty, boundary, error scenarios tested | Only happy path covered |
| 7 | Test naming | Name describes scenario AND expected behavior | `test1`, `it works`, `should handle` |
| 8 | Setup/teardown | Clean state between tests; proper cleanup | Test pollution, order-dependent failures |
| 9 | Flakiness | Tests are deterministic; no timing dependencies; no random | Intermittent failures, time-dependent assertions |
| 10 | Regression tests | Bug fix includes reproduction test that would have caught the bug | Fix without test, "verified manually" |

## Dimension Weighting

Not all dimensions apply equally to every refactor:

| Refactor Type | Critical Dimensions | Optional Dimensions |
|--------------|-------------------|-------------------|
| Rename | Readability | All others |
| Extract function | Correctness, Readability | Architecture, Testing |
| Move across modules | Architecture, Correctness | Performance, Testing |
| Performance optimization | Performance, Correctness | Readability |
| Security fix | Security, Correctness | All others |
| Dead code removal | Correctness (confirm no callers) | Readability |
