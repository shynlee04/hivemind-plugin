# Refactor Scenario: Extract Function

## Scenario

A TypeScript function processes an order and prints a report. The function is 45 lines long, mixes calculation with presentation, and contains magic numbers.

## Original Code

```typescript
function processOrder(order: Order) {
  // calculate total
  let total = 0;
  for (const item of order.items) {
    let price = item.price * item.quantity;
    if (item.discount > 0) {
      price = price - (price * item.discount / 100);
    }
    if (price > 100) {
      price = price * 0.9; // 10% bulk discount over $100
    }
    total += price;
  }

  // apply tax
  const tax = total * 0.08; // 8% tax
  total = total + tax;

  // apply shipping
  if (total < 50) {
    total += 5.99; // flat shipping under $50
  }

  // print report
  console.log('=== ORDER REPORT ===');
  console.log(`Customer: ${order.customerName}`);
  console.log(`Date: ${order.date.toISOString().split('T')[0]}`);
  console.log('--- Items ---');
  for (const item of order.items) {
    console.log(`  ${item.name} x${item.quantity} @ $${item.price}`);
  }
  console.log(`Subtotal: $${total - tax}`);
  console.log(`Tax: $${tax.toFixed(2)}`);
  console.log(`Total: $${total.toFixed(2)}`);
  console.log('===================');

  return total;
}
```

## Task

Refactor using **Extract Function** technique. Split into:

1. `calculateItemPrice(item: OrderItem): number` — handles per-item price with discount
2. `calculateSubtotal(items: OrderItem[]): number` — sums all item prices
3. `applyTax(subtotal: number): number` — applies tax rate
4. `applyShipping(amount: number): number` — adds shipping if below threshold
5. `printOrderReport(order: Order, subtotal: number, tax: number, total: number): void` — prints the report
6. `processOrder(order: Order): number` — orchestrates the above

## Expected Result

```typescript
const TAX_RATE = 0.08;
const BULK_DISCOUNT_THRESHOLD = 100;
const BULK_DISCOUNT_RATE = 0.1;
const FREE_SHIPPING_THRESHOLD = 50;
const FLAT_SHIPPING = 5.99;

function calculateItemPrice(item: OrderItem): number {
  let price = item.price * item.quantity;
  if (item.discount > 0) {
    price = price - (price * item.discount / 100);
  }
  if (price > BULK_DISCOUNT_THRESHOLD) {
    price = price * (1 - BULK_DISCOUNT_RATE);
  }
  return price;
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
}

function applyTax(subtotal: number): number {
  return subtotal * TAX_RATE;
}

function applyShipping(amount: number): number {
  return amount < FREE_SHIPPING_THRESHOLD ? FLAT_SHIPPING : 0;
}

function printOrderReport(order: Order, subtotal: number, tax: number, total: number): void {
  console.log('=== ORDER REPORT ===');
  console.log(`Customer: ${order.customerName}`);
  console.log(`Date: ${order.date.toISOString().split('T')[0]}`);
  console.log('--- Items ---');
  for (const item of order.items) {
    console.log(`  ${item.name} x${item.quantity} @ $${item.price}`);
  }
  console.log(`Subtotal: $${subtotal.toFixed(2)}`);
  console.log(`Tax: $${tax.toFixed(2)}`);
  console.log(`Total: $${total.toFixed(2)}`);
  console.log('===================');
}

function processOrder(order: Order): number {
  const subtotal = calculateSubtotal(order.items);
  const tax = applyTax(subtotal);
  const shipping = applyShipping(subtotal);
  const total = subtotal + tax + shipping;
  printOrderReport(order, subtotal, tax, total);
  return total;
}
```

## Verification Criteria

- [ ] Original 45-line function split into 6 focused functions
- [ ] All magic numbers replaced with named constants
- [ ] Each function has a single responsibility
- [ ] Function names clearly describe what they do
- [ ] Output is identical to the original (same console.log lines)
- [ ] `npx tsc --noEmit` passes
- [ ] No function exceeds 15 lines
- [ ] No function has more than 3 parameters

## Test Assertions

```typescript
// Given: order with items totaling $80 before tax
const order: Order = {
  customerName: 'Alice',
  date: new Date('2026-03-25'),
  items: [
    { name: 'Widget', price: 25, quantity: 2, discount: 0 },
    { name: 'Gadget', price: 30, quantity: 1, discount: 0 },
  ],
};

// When: processOrder is called
const total = processOrder(order);

// Then:
// subtotal = 25*2 + 30*1 = 80
// tax = 80 * 0.08 = 6.40
// shipping = 0 (80 >= 50)
// total = 80 + 6.40 = 86.40
expect(total).toBe(86.40);
```
