# Zod v4 Schema Types — Complete Reference

## Primitives

### `z.string()`
Validates strings. Chain validation methods for constraints.

```typescript
const name = z.string();
const name = z.string({ error: "Must be a string" });

// Chained validators (deprecated — use top-level in v4)
z.string().min(5).max(100).email();
```

### `z.number()`
Validates numbers.

```typescript
const age = z.number();
const positiveInt = z.number().int().positive();
const clamped = z.number().min(0).max(100);
```

### `z.boolean()`
```typescript
const active = z.boolean();
```

### `z.bigint()`
```typescript
const big = z.bigint().positive();
```

### `z.date()`
```typescript
const birthday = z.date();
const future = z.date().min(new Date());
```

### `z.symbol()`
```typescript
const sym = z.symbol();
```

### `z.undefined()`
```typescript
const undef = z.undefined();
```

### `z.null()`
```typescript
const nul = z.null();
```

### `z.void()`
```typescript
const voidType = z.void();
```

### `z.any()`
Permissive — accepts anything, outputs `any`.

```typescript
const anything = z.any();
```

### `z.unknown()`
Type-safe permissive — accepts anything, outputs `unknown`.

```typescript
const unknown = z.unknown();
```

### `z.never()`
Rejects everything. Useful in union exhaustiveness checks.

```typescript
const never = z.never();
```

### `z.nan()`
```typescript
const nanVal = z.nan();
```

## String Format Types (v4 — promoted to top-level)

> **v4 change**: These were `z.string().email()` in v3. Now they are standalone schemas.

### `z.email()`
```typescript
const email = z.email();
const email = z.email({ error: "Invalid email address" });
```

### `z.uuid()`
Strict RFC 9562/4122 validation (including variant bits).

```typescript
const id = z.uuid();
```

### `z.guid()`
Permissive UUID-like validation (replaces v3 `z.string().uuid()` behavior).

```typescript
const id = z.guid();
```

### `z.url()`
```typescript
const website = z.url();
```

### `z.ipv4()` / `z.ipv6()`
Replaces v3 `z.string().ip()`.

```typescript
const ip = z.ipv4();
const ip6 = z.ipv6();
```

### `z.cidrv4()` / `z.cidrv6()`
Replaces v3 `z.string().cidr()`.

```typescript
const range = z.cidrv4();
```

### `z.json()`
Validates JSON strings.

```typescript
const jsonStr = z.json();
```

## Complex Types

### `z.object(shape)`
```typescript
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  age: z.number().optional(),
  role: z.enum(["admin", "user"]),
});

// Methods
UserSchema.partial();          // All fields optional
UserSchema.required();         // All fields required
UserSchema.pick({ name: true });
UserSchema.omit({ age: true });
UserSchema.extend({ bio: z.string() }); // Add fields (replaces .merge())
UserSchema.strict();           // No extra keys
UserSchema.passthrough();      // Allow extra keys
UserSchema.strip();            // Remove extra keys (default)
```

### `z.array(schema)`
```typescript
const names = z.array(z.string());
const nums = z.array(z.number()).min(1).max(100);
const nonEmpty = z.array(z.string()).nonempty(); // ZodNonEmptyArray
```

### `z.tuple(schemas)`
```typescript
const pair = z.tuple([z.string(), z.number()]);
const withRest = z.tuple([z.string()]).rest(z.number());
```

### `z.record(keySchema, valueSchema)`
> **v4 breaking**: Requires two arguments (key + value schema).

```typescript
// v4 (required two args)
const scores = z.record(z.string(), z.number());

// Partial record (optional keys)
const partial = z.partialRecord(z.enum(["a", "b"]), z.number());
```

### `z.map(keySchema, valueSchema)`
```typescript
const map = z.map(z.string(), z.number());
```

### `z.set(schema)`
```typescript
const tags = z.set(z.string());
const bounded = z.set(z.number()).min(1).max(10);
```

### `z.union(schemas)`
```typescript
const result = z.union([z.string(), z.number()]);
// Shorthand: z.string().or(z.number())
```

### `z.discriminatedUnion(key, schemas)`
```typescript
const event = z.discriminatedUnion("type", [
  z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ type: z.literal("keypress"), key: z.string() }),
]);
```

### `z.intersection(schemaA, schemaB)`
```typescript
const combined = z.intersection(z.object({ name: z.string() }), z.object({ age: z.number() }));
// Shorthand: schemaA.and(schemaB)
```

### `z.literal(value)`
```typescript
const yes = z.literal("yes");
const num = z.literal(42);
const bool = z.literal(true);
```

### `z.enum(values)`
> **v4**: Now also handles native TypeScript enums. `z.nativeEnum()` deprecated.

```typescript
const role = z.enum(["admin", "user", "moderator"]);

// Access values
role.enum; // { admin: "admin", user: "user", moderator: "moderator" }

// Native enum support
enum Color { Red = "red", Blue = "blue" }
const colorSchema = z.enum(Color); // v4 — replaces z.nativeEnum()
```

### `z.lazy(fn)`
```typescript
interface TreeNode {
  name: string;
  children: TreeNode[];
}

const tree: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(tree),
  })
);
```

### `z.function()`
```typescript
const fn = z.function()
  .args(z.string(), z.number())
  .returns(z.boolean());

const impl = fn.implement((str, num) => str.length > num);
```

### `z.promise(schema)`
```typescript
const asyncResult = z.promise(z.string());
```

### `z.custom(fn)`
```typescript
const positive = z.custom<number>((val) => typeof val === "number" && val > 0);
```

### `z.instanceof(class)`
```typescript
const date = z.instanceof(Date);
const err = z.instanceof(Error);
```

### `z.file()`
```typescript
const avatar = z.file().min(1024).max(5 * 1024 * 1024);
```

## Special Types

### `z.preprocess(fn, schema)` (v3 compat)
```typescript
const asNumber = z.preprocess((val) => Number(val), z.number());
```

### `z.pipe(inputSchema, outputSchema)` / `.pipe()`
```typescript
const pipe = z.string().transform((s) => s.length).pipe(z.number());
```

---

*Source: colinhacks/zod v4.0.1 · repomix + context7 + deepwiki · 2026-04-28*
