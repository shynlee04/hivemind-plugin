# Test: TDD for Calculator Add

## Scenario
Implement add(a, b) using TDD.

## RED
```typescript
// calculator.test.ts
test('add returns sum', () => {
  expect(add(2, 3)).toBe(5);
});
```
Run: FAIL (add not defined)

## GREEN
```typescript
// calculator.ts
export function add(a: number, b: number): number {
  return a + b;
}
```
Run: PASS

## REFACTOR
No refactor needed — implementation is clean.

## Gate
```bash
npx tsc --noEmit && npm test
```
Output: PASS
