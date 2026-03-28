# Refactor Techniques Catalog

This catalog expands the core refactor guidance into concrete TypeScript examples. Each technique includes when to use it, semantic risk, test impact, and rollback ease.

## 1. Extract Function

- **Risk level:** Low
- **Test impact:** Existing behavior tests should stay green; add focused unit tests only if extraction reveals missing coverage.
- **Rollback ease:** Easy — restore the original block and delete the helper.

### When to use

Use when one block performs a distinct job inside a larger function and the caller is doing too much work.

### Before

```typescript
type Order = { items: { price: number; quantity: number }[]; coupon?: string }

function summarizeOrder(order: Order) {
  let subtotal = 0
  for (const item of order.items) {
    subtotal += item.price * item.quantity
  }

  const discount = order.coupon === 'VIP' ? subtotal * 0.2 : 0
  const total = subtotal - discount

  return { subtotal, discount, total }
}
```

### After

```typescript
type Order = { items: { price: number; quantity: number }[]; coupon?: string }

function summarizeOrder(order: Order) {
  const subtotal = calculateSubtotal(order.items)
  const discount = calculateDiscount(subtotal, order.coupon)
  const total = subtotal - discount

  return { subtotal, discount, total }
}

function calculateSubtotal(items: Order['items']) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function calculateDiscount(subtotal: number, coupon?: string) {
  return coupon === 'VIP' ? subtotal * 0.2 : 0
}
```

## 2. Inline Function

- **Risk level:** Low
- **Test impact:** Regression tests should prove the wrapper had no independent behavior.
- **Rollback ease:** Easy — reintroduce the wrapper and restore call sites.

### When to use

Use when the function name adds less clarity than the body and the wrapper is only forwarding work.

### Before

```typescript
type FeatureFlags = { betaCheckout: boolean }

function isBetaCheckoutEnabled(flags: FeatureFlags) {
  return flags.betaCheckout
}

function getCheckoutPath(flags: FeatureFlags) {
  return isBetaCheckoutEnabled(flags) ? '/checkout/beta' : '/checkout'
}
```

### After

```typescript
type FeatureFlags = { betaCheckout: boolean }

function getCheckoutPath(flags: FeatureFlags) {
  return flags.betaCheckout ? '/checkout/beta' : '/checkout'
}
```

## 3. Move Function

- **Risk level:** Medium
- **Test impact:** Re-run unit tests plus any module boundary integration tests.
- **Rollback ease:** Moderate — restore original home and caller imports.

### When to use

Use when a function relies more on data from another module than from its current host.

### Before

```typescript
class PricingRules {
  taxRateFor(country: string) {
    return country === 'DE' ? 0.19 : 0.2
  }
}

class Cart {
  constructor(
    public subtotal: number,
    public country: string,
    private pricingRules: PricingRules,
  ) {}

  totalWithTax() {
    return this.subtotal + this.subtotal * this.pricingRules.taxRateFor(this.country)
  }
}
```

### After

```typescript
class PricingRules {
  taxRateFor(country: string) {
    return country === 'DE' ? 0.19 : 0.2
  }
}

class Cart {
  constructor(
    public subtotal: number,
    public country: string,
  ) {}

  totalWithTax(pricingRules: PricingRules) {
    return this.subtotal + this.subtotal * pricingRules.taxRateFor(this.country)
  }
}
```

## 4. Rename

- **Risk level:** Low
- **Test impact:** Type checking plus regression tests are usually enough when the rename is semantic only.
- **Rollback ease:** Easy — rename back with `lsp findReferences` coverage.

### When to use

Use when names force readers to decode intent or the current term mismatches the domain.

### Before

```typescript
type RetryPolicy = { mc: number; md: number }

function exec(policy: RetryPolicy) {
  return { attempts: policy.mc, delayMs: policy.md }
}
```

### After

```typescript
type RetryPolicy = { maxRetries: number; retryDelayMs: number }

function buildRetrySchedule(policy: RetryPolicy) {
  return { attempts: policy.maxRetries, delayMs: policy.retryDelayMs }
}
```

## 5. Collapse Hierarchy

- **Risk level:** Medium
- **Test impact:** Run inheritance or behavior tests because the object graph changed.
- **Rollback ease:** Moderate — restore subclass and update factories.

### When to use

Use when a subclass adds no meaningful behavior and only mirrors its parent.

### Before

```typescript
class NotificationChannel {
  send(message: string) {
    return `sent:${message}`
  }
}

class EmailChannel extends NotificationChannel {}

function deliver(channel: EmailChannel, message: string) {
  return channel.send(message)
}
```

### After

```typescript
class NotificationChannel {
  send(message: string) {
    return `sent:${message}`
  }
}

function deliver(channel: NotificationChannel, message: string) {
  return channel.send(message)
}
```

## 6. Extract Interface

- **Risk level:** Medium
- **Test impact:** Re-run consumers that depend on the abstraction boundary.
- **Rollback ease:** Moderate — remove interface and rebind consumers to concrete types.

### When to use

Use when multiple consumers need the same small contract but should not depend on a concrete implementation.

### Before

```typescript
class S3Uploader {
  upload(path: string, body: Uint8Array) {
    return `${path}:${body.byteLength}`
  }

  delete(path: string) {
    return `deleted:${path}`
  }
}

function persistAvatar(uploader: S3Uploader, file: Uint8Array) {
  return uploader.upload('avatars/user.png', file)
}
```

### After

```typescript
interface BinaryUploader {
  upload(path: string, body: Uint8Array): string
}

class S3Uploader implements BinaryUploader {
  upload(path: string, body: Uint8Array) {
    return `${path}:${body.byteLength}`
  }

  delete(path: string) {
    return `deleted:${path}`
  }
}

function persistAvatar(uploader: BinaryUploader, file: Uint8Array) {
  return uploader.upload('avatars/user.png', file)
}
```

## 7. Replace Magic Number

- **Risk level:** Low
- **Test impact:** Confirm semantics did not shift when extracting constants.
- **Rollback ease:** Easy — inline the constant back into the expression.

### When to use

Use when a literal hides business meaning or appears in multiple places.

### Before

```typescript
function sessionExpiresAt(createdAt: number) {
  return createdAt + 30 * 60 * 1000
}

function shouldWarnBeforeExpiry(remainingMs: number) {
  return remainingMs < 5 * 60 * 1000
}
```

### After

```typescript
const SESSION_TTL_MS = 30 * 60 * 1000
const EXPIRY_WARNING_WINDOW_MS = 5 * 60 * 1000

function sessionExpiresAt(createdAt: number) {
  return createdAt + SESSION_TTL_MS
}

function shouldWarnBeforeExpiry(remainingMs: number) {
  return remainingMs < EXPIRY_WARNING_WINDOW_MS
}
```

## 8. Introduce Parameter Object

- **Risk level:** Medium
- **Test impact:** Verify call sites still provide the same semantic inputs.
- **Rollback ease:** Moderate — unwrap the object into positional parameters again.

### When to use

Use when several parameters travel together and call sites are hard to read.

### Before

```typescript
function createReminder(
  title: string,
  channel: 'email' | 'sms',
  sendAtIso: string,
  retryCount: number,
) {
  return { title, channel, sendAtIso, retryCount }
}

const reminder = createReminder('Renew plan', 'email', '2026-04-01T09:00:00Z', 3)
```

### After

```typescript
type ReminderRequest = {
  title: string
  channel: 'email' | 'sms'
  sendAtIso: string
  retryCount: number
}

function createReminder(request: ReminderRequest) {
  return request
}

const reminder = createReminder({
  title: 'Renew plan',
  channel: 'email',
  sendAtIso: '2026-04-01T09:00:00Z',
  retryCount: 3,
})
```

## 9. Replace Conditional with Polymorphism

- **Risk level:** High
- **Test impact:** Full regression coverage is required because behavior selection moved across types.
- **Rollback ease:** Harder — restore the condition tree and collapse strategy classes.

### When to use

Use when a type or mode switch keeps growing and each branch owns distinct behavior.

### Before

```typescript
type BillingMode = 'monthly' | 'annual'

function invoiceTotal(mode: BillingMode, basePrice: number) {
  if (mode === 'monthly') {
    return basePrice
  }

  if (mode === 'annual') {
    return basePrice * 12 * 0.9
  }

  throw new Error(`Unsupported mode: ${mode}`)
}
```

### After

```typescript
interface BillingPlan {
  invoiceTotal(basePrice: number): number
}

class MonthlyPlan implements BillingPlan {
  invoiceTotal(basePrice: number) {
    return basePrice
  }
}

class AnnualPlan implements BillingPlan {
  invoiceTotal(basePrice: number) {
    return basePrice * 12 * 0.9
  }
}
```

## Technique Selection Hints

| Symptom | Technique | Primary review tool |
|---|---|---|
| One function doing two jobs | Extract Function | `lsp documentSymbol` |
| Wrapper is pure indirection | Inline | `lsp findReferences` |
| Logic uses foreign data more than local data | Move | `lsp goToDefinition` |
| Name hides domain meaning | Rename | `lsp findReferences` |
| Subclass adds nothing | Collapse Hierarchy | `lsp documentSymbol` |
| Consumers need only a small contract | Extract Interface | `grep` + `read` |
| Literal hides business rule | Replace Magic Number | `grep` |
| Too many related parameters | Introduce Parameter Object | `read` |
| Branch tree grows by type | Replace Conditional with Polymorphism | `grep` + `npm test` |

## Verification Minimum

After any technique above, run:

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
```
