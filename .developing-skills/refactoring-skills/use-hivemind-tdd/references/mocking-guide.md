# Mocking Guide

## Mock at System Boundaries Only

Mock things you **don't control**:

| Boundary | Example |
|----------|---------|
| External APIs | Payment gateway, email service, third-party REST/GraphQL |
| Databases | Prefer a test database; mock only when setup cost is prohibitive |
| Time | `Date.now()`, `setTimeout` — inject a clock interface |
| Randomness | `Math.random()` — inject a seeded generator |
| File System | `fs` operations — use a temp directory or in-memory FS |

## Don't Mock

- **Your own classes/modules** — test them for real.
- **Internal collaborators** — they're part of the unit under test.
- **Anything you control** — if you can change it, you can test it.

## Testing Anti-Patterns

1. **NEVER test mock behavior** — asserting on mock call counts or arguments tests the mock library, not your code.
2. **NEVER add test-only methods to production classes** — if a method exists only for tests, it doesn't belong in production.
3. **NEVER mock without understanding dependencies** — know why a dependency exists before deciding to fake it.
4. **NEVER create incomplete mocks** — a mock that doesn't mirror the real API will produce false signals.

## Gate Function

Before asserting on any mock, ask yourself:

> **"Am I testing real behavior or mock existence?"**

- If **mock existence** → STOP. Test real behavior instead.
- If **real behavior** → proceed, but consider whether the mock is actually necessary.

## Decision Tree

```
Need to isolate a dependency?
  ├─ Is it YOUR code? → No mock. Test it for real.
  ├─ Is it an external API? → Mock at the boundary.
  ├─ Is it a database? → Prefer test DB, mock if cost prohibitive.
  └─ Is it time/randomness? → Inject deterministic interface.
```
