# Anti-Pattern Catalog Reference

## 1. God Component

**Detection:**
- Single component exceeds 300 lines of code
- Handles 3+ unrelated concerns (data fetching, UI rendering, state management, validation)
- Import list references 10+ modules
- Props interface has 10+ fields
- Component name is generic: `Manager`, `Handler`, `Controller`, `Main`, `App`

**Impact:**
- Impossible to test in isolation
- Any change risks breaking unrelated functionality
- Merge conflicts when multiple developers work on it
- Performance — re-renders everything when any part changes

**Fix:**
1. Identify distinct responsibilities (data, presentation, logic)
2. Extract data layer into hooks/services
3. Extract presentation into smaller components
4. Extract business logic into pure functions
5. Compose the God component from smaller pieces
6. Each piece ≤300 LOC

**Anti-pattern example:**
```typescript
// BAD: God Component
function Dashboard() {
  // 50 lines of state
  // 80 lines of data fetching
  // 100 lines of event handlers
  // 120 lines of JSX
  // Total: 350 lines
}
```

**Fix example:**
```typescript
// GOOD: Composed from focused pieces
function Dashboard() {
  const data = useDashboardData();
  const handlers = useDashboardHandlers(data);
  return (
    <DashboardLayout>
      <DashboardHeader data={data} />
      <DashboardChart data={data} onFilter={handlers.filter} />
      <DashboardTable data={data} onSort={handlers.sort} />
    </DashboardLayout>
  );
}
```

---

## 2. God Function

**Detection:**
- Function exceeds 50 lines of code
- Function has more than 3 levels of nesting
- Function name is vague: `handle`, `process`, `doStuff`, `run`
- Function takes 5+ parameters
- Function has multiple return paths (3+)
- Function contains both I/O and business logic

**Impact:**
- Cannot be unit tested
- Cannot be reused
- Any change risks introducing bugs in unrelated logic
- Hard to name because it does too many things

**Fix:**
1. Identify logical sections
2. Extract each section into a named function
3. Each extracted function ≤30 lines, ≤3 parameters
4. Main function becomes orchestrator, ≤15 lines

**Anti-pattern example:**
```typescript
// BAD: God Function
function handleUserAction(action: string, user: User, data: any) {
  // 20 lines of validation
  // 15 lines of business logic
  // 10 lines of database calls
  // 15 lines of response formatting
  // Total: 60 lines
}
```

**Fix example:**
```typescript
// GOOD: Orchestrator delegates to focused functions
function handleUserAction(action: string, user: User, data: any) {
  const validated = validateUserAction(action, user, data);
  const result = executeBusinessLogic(validated);
  const persisted = persistResult(result);
  return formatResponse(persisted);
}
```

---

## 3. Dead Code

**Detection:**
- Function/class with zero callers (IDE "Find Usages" or `grep -r`)
- Import statement references module that's never used
- Conditional branch that can never execute (always true/false)
- Entire file exists but is never imported
- `TODO` comment older than 30 days with no issue link
- Feature flag that is permanently `true` or `false` for >30 days

**Impact:**
- Increases cognitive load (developers read code that doesn't matter)
- Increases build time
- Increases test surface (tests may cover dead code)
- Confuses new team members

**Fix:**
1. Confirm zero callers (check git log, grep, IDE)
2. Check if it's part of a public API (external consumers may use it)
3. Delete it
4. Git history preserves it if needed later

**Detection commands:**
```bash
# Find unused exports
npx ts-prune

# Find unused dependencies
npx depcheck

# Find files with zero imports
grep -r "from.*filename" --include="*.ts" .
```

---

## 4. Zombie Code

**Detection:**
- Code commented out with `//` or `/* */` for >2 weeks
- Code behind a `if (false)` or `if (DEBUG)` that's always false
- Feature flags that have been permanently enabled/disabled for >30 days
- Test files that are skipped (`describe.skip`, `it.skip`, `xtest`)
- Backup files: `*.bak`, `*.old`, `*.orig`, `*~`
- Functions with "deprecated" in the name but no deprecation notice

**Distinction from Dead Code:**
- Dead code: never called, never executes
- Zombie code: looks alive but doesn't execute in production

**Impact:**
- Misleading — looks like active code
- May be accidentally re-enabled
- Clutters search results
- Wastes review time

**Fix:**
1. Delete commented-out code (git preserves history)
2. Remove `if (false)` blocks
3. Remove permanent feature flags
4. Convert skipped tests to issues, then delete
5. Remove backup files

---

## 5. Tight Coupling

**Detection:**
- Module A directly imports concrete class from Module B
- Changing Module B requires modifying Module A
- Cannot test Module A without Module B
- `new` operator used for dependencies inside functions/classes
- Imports reference specific implementations, not interfaces

**Impact:**
- Cannot swap implementations
- Cannot test in isolation
- Changes cascade across modules
- Reuse is impossible (Module A always drags Module B along)

**Fix:**
1. Define interface for the dependency
2. Inject dependency via constructor or parameter
3. Consumer depends on interface, not implementation
4. Factory or DI container provides concrete implementation

**Anti-pattern example:**
```typescript
// BAD: Tight coupling
class OrderService {
  async createOrder(data: OrderData) {
    const db = new PostgresConnection(); // direct dependency
    const email = new SmtpMailer();       // direct dependency
    await db.insert('orders', data);
    await email.send(data.customerEmail, 'Order created');
  }
}
```

**Fix example:**
```typescript
// GOOD: Loose coupling via interfaces
interface Database {
  insert(table: string, data: any): Promise<void>;
}

interface Mailer {
  send(to: string, subject: string): Promise<void>;
}

class OrderService {
  constructor(
    private db: Database,
    private mailer: Mailer
  ) {}

  async createOrder(data: OrderData) {
    await this.db.insert('orders', data);
    await this.mailer.send(data.customerEmail, 'Order created');
  }
}

// Test: inject mocks
const orderService = new OrderService(mockDb, mockMailer);
```

---

## 6. Primitive Obsession (Bonus)

**Detection:**
- Domain concepts represented as raw `string` or `number`
- Same validation logic repeated in multiple places
- String concatenation to build structured data
- Maps/dicts used instead of typed objects

**Impact:**
- Type safety lost
- Validation scattered across codebase
- No domain language in the code

**Fix:**
- Create value objects: `Email`, `PhoneNumber`, `Money`, `DateRange`
- Encapsulate validation in the value object constructor
- Use branded types for type safety: `type UserId = string & { __brand: 'UserId' }`

---

## Anti-Pattern Detection Quick Reference

| Anti-Pattern | LOC Threshold | Primary Symptom | Detection Command |
|-------------|--------------|-----------------|-------------------|
| God Component | >300 | Multiple concerns | `wc -l component.tsx` |
| God Function | >50 | Multiple responsibilities | `rg "function" file.ts \| rg -v "^  "` |
| Dead Code | N/A | Zero callers | `npx ts-prune` |
| Zombie Code | N/A | Commented out | `rg "^\s*//" --include="*.ts"` |
| Tight Coupling | N/A | Direct `new` in functions | `rg "new \w+\(" --include="*.ts"` |
| Primitive Obsession | N/A | Raw strings as IDs | `rg ": string" --include="*.ts" \| rg "Id"` |
