# Test Quality Guide

## Good Tests (Integration-Style)

- Test through **public interfaces**, not mocks of internal parts.
- Describe **WHAT** the system does, not **HOW** it does it.
- **Survive refactors** — behavior doesn't change, test doesn't change.
- Read like a **specification** — a new developer can understand intent from the test alone.

## Bad Tests (Implementation-Detail)

- **Mock internal collaborators** — tests become coupled to wiring, not behavior.
- **Test private methods** — if it needs testing, it's a sign the method should be extracted to a public module.
- **Assert on call counts/order** — tests break on refactors that preserve behavior.
- **Break when refactoring** without any behavior change.

## Good Example

```typescript
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);

  const result = await checkout(cart, paymentMethod);

  expect(result.status).toBe("confirmed");
});
```

- Tests the **public contract**: given a cart and payment, checkout returns a confirmed order.
- No mocks of internals — the test doesn't care how checkout works internally.
- Survives refactoring of the checkout implementation.

## Bad Example

```typescript
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);

  await checkout(cart, payment);

  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

- Tests an **implementation detail**: which internal service gets called.
- Breaks immediately if the internal wiring changes, even if checkout still works correctly.
- A developer reading this test can't tell what checkout actually *does* — only how it's wired.

## Checklist

| Question | Good Test | Bad Test |
|----------|-----------|----------|
| Tests through public API? | Yes | No (mocks internals) |
| Survives refactors? | Yes | No (breaks on wiring changes) |
| Reads like a spec? | Yes | No (asserts on mock calls) |
| Would pass if behavior broke? | No | Yes (false positive risk) |
