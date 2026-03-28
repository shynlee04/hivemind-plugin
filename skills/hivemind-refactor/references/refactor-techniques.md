# Refactor Techniques Reference

## 1. Extract Function/Method

**Risk Level:** LOW

**When:** A code fragment can be grouped together. A comment explains what the code does.

**How:** Turn the fragment into a function whose name explains its purpose. Replace the fragment with a call.

**Before:**
```typescript
function printInvoice(invoice: Invoice) {
  let outstanding = 0;
  console.log('***********************');
  console.log('**** Customer Invoice ****');
  console.log('***********************');
  for (const order of invoice.orders) {
    outstanding += order.amount;
  }
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

**After:**
```typescript
function printInvoice(invoice: Invoice) {
  printBanner();
  const outstanding = calculateOutstanding(invoice.orders);
  printDetails(invoice.customer, outstanding);
}

function printBanner() {
  console.log('***********************');
  console.log('**** Customer Invoice ****');
  console.log('***********************');
}

function calculateOutstanding(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + order.amount, 0);
}

function printDetails(customer: string, outstanding: number) {
  console.log(`name: ${customer}`);
  console.log(`amount: ${outstanding}`);
}
```

---

## 2. Inline Function/Method

**Risk Level:** LOW

**When:** The function body is clearer than its name. The function is used only once and isn't expected to be reused.

**How:** Replace the call with the function body. Remove the function.

**Before:**
```typescript
function moreThanFiveDeliveries(order: Order) {
  return order.deliveries.length > 5;
}
function rating(order: Order) {
  return moreThanFiveDeliveries(order) ? 2 : 1;
}
```

**After:**
```typescript
function rating(order: Order) {
  return order.deliveries.length > 5 ? 2 : 1;
}
```

---

## 3. Move Function/Method

**Risk Level:** MEDIUM

**When:** A function is used more in another class than its current host. A function references data from another module more than its own.

**How:** Move the function to the target module. Update all callers. Adjust visibility if needed.

**Before:**
```typescript
// Account.ts
class Account {
  get overdraftCharge() { /* uses AccountType heavily */ }
}
```

**After:**
```typescript
// Account.ts
class Account {
  get overdraftCharge() {
    return this.type.overdraftCharge(this);
  }
}

// AccountType.ts
class AccountType {
  overdraftCharge(account: Account) { /* moved here */ }
}
```

---

## 4. Rename Variable/Function

**Risk Level:** LOW

**When:** A name doesn't reveal its intent. A name requires mental mapping. A name is misleading.

**How:** Search for all references. Rename to a descriptive name. Run tests.

**Before:**
```typescript
const a = 86400;
function tp() { /* process transfer */ }
```

**After:**
```typescript
const SECONDS_PER_DAY = 86400;
function processTransfer() { /* process transfer */ }
```

---

## 5. Collapse Hierarchy

**Risk Level:** MEDIUM

**When:** A subclass does little more than a method in its superclass. Two classes are nearly identical.

**How:** Merge fields and methods from the subclass into the superclass. Update references. Remove the subclass.

**Before:**
```typescript
class Employee { }
class Salesperson extends Employee { } // only inherits, adds nothing
```

**After:**
```typescript
class Employee { } // Salesperson removed
```

---

## 6. Extract Interface/Contract

**Risk Level:** LOW

**When:** Multiple clients use the same subset of a class's interface. A class needs to be decoupled from a specific implementation.

**How:** Create an interface with the shared methods. Implement it on the class. Update consumers to depend on the interface.

**Before:**
```typescript
class PostgresConnection {
  query(sql: string): Row[] { }
  close(): void { }
}
class MongoConnection {
  query(filter: Document): Row[] { }
  close(): void { }
}
```

**After:**
```typescript
interface DatabaseConnection {
  close(): void;
}
class PostgresConnection implements DatabaseConnection { }
class MongoConnection implements DatabaseConnection { }
```

---

## 7. Replace Magic Number with Named Constant

**Risk Level:** LOW

**When:** A literal number has meaning that isn't obvious. The same number appears in multiple places.

**How:** Create a named constant. Replace all occurrences. Name explains the meaning.

**Before:**
```typescript
function calculateGravity(mass: number) {
  return mass * 9.81;
}
function isEligible(age: number) {
  return age >= 18;
}
```

**After:**
```typescript
const GRAVITATIONAL_ACCELERATION = 9.81;
const LEGAL_AGE_THRESHOLD = 18;

function calculateGravity(mass: number) {
  return mass * GRAVITATIONAL_ACCELERATION;
}
function isEligible(age: number) {
  return age >= LEGAL_AGE_THRESHOLD;
}
```

---

## 8. Introduce Parameter Object

**Risk Level:** MEDIUM

**When:** Multiple parameters always travel together. A group of parameters is repeated across functions.

**How:** Create a data class/struct for the parameter group. Replace the group with the new type. Update all callers.

**Before:**
```typescript
function amountInRange(startDate: Date, endDate: Date, minAmount: number, maxAmount: number): boolean { }
function calculateTotal(startDate: Date, endDate: Date, minAmount: number, maxAmount: number): number { }
```

**After:**
```typescript
interface AmountRange {
  startDate: Date;
  endDate: Date;
  minAmount: number;
  maxAmount: number;
}

function amountInRange(range: AmountRange): boolean { }
function calculateTotal(range: AmountRange): number { }
```

---

## 9. Replace Conditional with Polymorphism

**Risk Level:** HIGH

**When:** A switch/if-else chain checks a type field. Adding new types requires modifying all conditionals. The same type check appears in multiple places.

**How:** Create a subclass for each branch. Move the branch logic into a polymorphic method. Replace the conditional with a call to the polymorphic method.

**Before:**
```typescript
function calculateBirdSpeed(bird: Bird): number {
  switch (bird.type) {
    case 'EuropeanSwallow': return bird.baseSpeed;
    case 'AfricanSwallow': return bird.baseSpeed - bird.loadFactor * bird.numberOfCoconuts;
    case 'NorwegianBlueParrot': return bird.isNailed ? 0 : bird.baseSpeed + bird.voltage;
    default: return bird.baseSpeed;
  }
}
```

**After:**
```typescript
abstract class Bird {
  abstract calculateSpeed(): number;
}

class EuropeanSwallow extends Bird {
  calculateSpeed(): number { return this.baseSpeed; }
}

class AfricanSwallow extends Bird {
  calculateSpeed(): number {
    return this.baseSpeed - this.loadFactor * this.numberOfCoconuts;
  }
}

class NorwegianBlueParrot extends Bird {
  calculateSpeed(): number {
    return this.isNailed ? 0 : this.baseSpeed + this.voltage;
  }
}

function calculateBirdSpeed(bird: Bird): number {
  return bird.calculateSpeed();
}
```

---

## Risk Level Summary

| Technique | Risk | Test Impact | Rollback Ease |
|-----------|------|-------------|---------------|
| Extract Function | LOW | Low | Easy — inline back |
| Inline Function | LOW | Low | Easy — extract again |
| Move Function | MEDIUM | Medium | Medium — move back |
| Rename | LOW | Low | Easy — rename back |
| Collapse Hierarchy | MEDIUM | Medium | Hard — recreate class |
| Extract Interface | LOW | Low | Easy — remove interface |
| Replace Magic Number | LOW | Low | Easy — use literal |
| Introduce Parameter Object | MEDIUM | Medium | Medium — expand params |
| Replace Conditional with Polymorphism | HIGH | High | Hard — re-add switch |
