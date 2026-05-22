# Philosophy — Why Ordered, Test-First Change Management

## The Core Problem

When a change spans multiple layers, three things go wrong without governance:

1. **Contract drift** — the interface layer promises one thing; the implementation delivers another. This happens when implementation changes precede interface changes.
2. **Deceptive correctness** — tests pass, but only because they were written to match already-working code, or because heavy mocking hides the real behavior.
3. **Broken consumers** — downstream services break silently because no one traced the impact before deploying.

These failures share a common root cause: **changes are treated as a single event rather than a cascading sequence with ordering constraints.**

## Why Ordering Matters

### The Interface-Implementation Contract

```
Interface → Implementation → Consumer
    ↓             ↓              ↓
 What is       How it         Who uses
 promised      works          the promise
```

When the implementation changes before the interface:

1. The implementation now behaves differently than the interface advertises
2. The interface still describes the old behavior
3. Consumers read the interface and expect old behavior
4. Runtime mismatch → broken consumers

The reverse — changing the interface first — is safe:

1. New interface describes the intended behavior
2. Implementation updates to match the new contract
3. Consumers update to consume the new contract
4. No mismatch window exists at any point

This is not a preference. It is a logical necessity: **the contract must stabilize before the implementation, which must stabilize before consumers.**

### Why Tests Must Fail First

A test that passes before implementation is not a guard — it is a description of what already exists. The red-first protocol exists for three reasons:

1. **Proof of change** — a failing test proves the change is needed and the test actually tests the right thing. A test written after implementation proves only that the test was written after implementation.
2. **Resistance to regression** — a test that once failed and now passes is a guard against regression. A test that always passed has no failure baseline — it cannot distinguish between "correct behavior" and "test that always returns true."
3. **Honesty about mocking** — when tests are written first, heavy mocking is exposed immediately (the test fails deceptively). When tests are written after, mocking can be tuned to always pass.

### The Mock Honesty Problem

Tests that pass entirely through mocks are not evidence of correctness. Consider:

```typescript
// This test always passes — it tests the mock, not the system
mockService.process.mockReturnValue({ success: true });
const result = await controller.handle(request);
expect(mockService.process).toHaveBeenCalled();
expect(result).toEqual({ success: true });
```

This test proves only that `mockService.process` was called. It does not prove the controller handles errors, validates input, or integrates with the real service. If `mockService.process` is removed and replaced with the real implementation, the test may fail.

The red-first protocol catches this: write the test against the real (or minimally mocked) behavior first. If it passes deceptively, the test is wrong.

## Consumer Impact Tracing: The Radiating Change Model

Every change radiates outward:

```
Core Change
    ↓
Direct Consumers (files that import the changed module)
    ↓
Indirect Consumers (files that import direct consumers)
    ↓
External Consumers (separate services, plugins, downstream apps)
```

Each ring of consumers must be identified and assessed. The most dangerous consumer is the one you did not know existed — it will break silently after deployment.

### Why Consumers Are Frequently Missed

1. **Re-exports** — module A imports from module B and re-exports. Module C imports from A. Changing B breaks C through A. The import chain is invisible without tracing.
2. **Facade modules** — a facade aggregates multiple modules. Consumers import the facade, not the underlying modules. Changing an underlying module breaks facade consumers.
3. **Cross-repository consumers** — a service in a different repository depends on this module's interface. Grep cannot find cross-repo consumers.
4. **Dynamic consumers** — consumers that load modules at runtime (plugin systems, dependency injection) have no static import to search for.

### Consumer Tracing Protocol

1. **Static trace** — follow import/require statements from the changed module outward
2. **Re-export trace** — check for re-exports in intermediate modules; follow the chain to end consumers
3. **Cross-repo trace** — check dependent repositories for import of this module's public API
4. **Dynamic trace** — check for runtime loading patterns (plugin registries, DI containers, module loaders)
5. **Document** — record every consumer found, including indirect and cross-repo consumers

## Why This Matters Across Frameworks

The principles of ordering, red-first, and consumer tracing are framework-agnostic:

| Principle | GSD Context | BMAD Context | Hivemind Context |
|-----------|------------|--------------|------------------|
| Ordering | Phase dependencies determine which phase implements first | Module dependency graph determines ordering | Pan-level ordering (interface → deep module → consumer) |
| Red-first | Tests added before phase implementation | Spec locked before module implementation | Red-first protocol enforced by hm-l2-cross-cutting-change |
| Consumer tracing | Cross-phase dependency analysis | Module-to-module dependency check | Lifecycle impact matrix |

## When to Defer or Simplify

The full methodology may be excessive for:

- Changes that span exactly 2 layers with no consumers
- Changes where the "consumer" is a single downstream module that will be updated simultaneously
- Changes in projects without formal layer separation

In these cases, apply the minimum viable governance:

1. **Write a failing test** (red-first — always required)
2. **Change in order** (interface first, implementation second)
3. **Document the change** (what changed, why, how to rollback)

The methodology scales up for complex changes and scales down for simple ones. The principles do not change — only the formality of documentation changes.

## Summary

| Principle | Why | Non-Negotiable? |
|-----------|-----|-----------------|
| **Ordered change** (interface → implementation → consumer) | Prevents contract drift and broken consumers | Yes — wrong order guarantees problems |
| **Red-first** (tests fail before implementation) | Proves change is real and tests are honest | Yes — no exceptions |
| **Consumer tracing** (identify all downstream effects) | Prevents silent breakage after deployment | Yes — missed consumers = broken consumers |
| **Honesty check** (verify tests are not mock-deceived) | Ensures tests actually verify real behavior | Strongly recommended — at least one real test required |
| **Rollback planning** (document how to reverse) | Enables safe recovery if change causes issues | Strongly recommended — mandatory for production changes |
