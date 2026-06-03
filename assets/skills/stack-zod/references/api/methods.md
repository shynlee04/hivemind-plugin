# Zod v4 Schema Methods — Complete Reference

## Wrapper Methods

### `.optional()`
Makes the schema accept `undefined`. Output type becomes `T | undefined`.

```typescript
const name = z.string().optional();
// Input: string | undefined → Output: string | undefined
```

### `.nullable()`
Makes the schema accept `null`. Output type becomes `T | null`.

```typescript
const name = z.string().nullable();
// Input: string | null → Output: string | null
```

### `.nullish()`
Shorthand for `.optional().nullable()`. Output type becomes `T | null | undefined`.

```typescript
const name = z.string().nullish();
```

### `.nonoptional()`
Removes optionality — ensures the type is not `undefined`.

```typescript
const required = z.string().optional().nonoptional();
```

### `.default(value)`
Provides a default value when input is `undefined`. Changes the output type to exclude `undefined`.

```typescript
const role = z.string().default("user");
// Input: string | undefined → Output: string
```

### `.catch(value)`
Provides a fallback value on validation failure. Always succeeds.

```typescript
const port = z.number().catch(3000);
// Any invalid input → 3000
```

### `.readonly()`
Marks output as `Readonly`. Calls `Object.freeze()` on the result.

```typescript
const config = z.object({ key: z.string() }).readonly();
type Config = z.infer<typeof config>; // { readonly key: string }
```

### `.array()`
Shorthand for wrapping in `z.array()`.

```typescript
const tags = z.string().array(); // Same as z.array(z.string())
```

### `.or(other)`
Shorthand for `z.union([this, other])`.

```typescript
const id = z.string().or(z.number());
```

### `.and(other)`
Shorthand for `z.intersection(this, other)`.

```typescript
const combined = nameSchema.and(ageSchema);
```

### `.brand<T>()`
Brands the schema type for nominal typing.

```typescript
const Email = z.email().brand<"Email">();
type Email = z.infer<typeof Email>; // string & Brand<"Email">
```

## Validation Methods

### `.refine(check, params?)`
Adds a custom validation check. Returns the same schema type.

```typescript
const adult = z.number().refine((n) => n >= 18, {
  message: "Must be 18 or older",
});

// With path for nested errors
const password = z.string().refine(
  (s) => s.length >= 8,
  { message: "Too short", path: ["password"] }
);
```

### `.check(checkFn)` (v4 — replaces `.superRefine()`)
> **v4**: `.superRefine()` is deprecated. Use `.check()` instead.

```typescript
// v4 style
const schema = z.string().check((ctx) => {
  if (ctx.value.length < 8) {
    ctx.issues.push({
      code: "custom",
      message: "Password too short",
    });
  }
});
```

### `.transform(fn)`
Transforms the output value. Changes the output type.

```typescript
const upper = z.string().transform((s) => s.toUpperCase());
// Output type: string (but transformed)

const length = z.string().transform((s) => s.length);
// Output type: number
```

### `.pipe(targetSchema)`
Pipes output of current schema into another. Useful after transforms.

```typescript
const numericString = z.string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().positive());
```

### `.overwrite(fn)`
Overwrites the value during parsing without changing the type.

```typescript
const trimmed = z.string().overwrite((s) => s.trim());
```

## Metadata Methods

### `.describe(description)`
Adds a description. Used in JSON Schema generation and error messages.

```typescript
const name = z.string().describe("The user's full name");
```

### `.meta(metadata)`
Adds arbitrary metadata. Included in JSON Schema output.

```typescript
const field = z.string().meta({
  title: "Username",
  examples: ["john_doe"],
});
```

### `.register(registry, metadata?)`
Registers the schema in a registry.

```typescript
const registry = z.registry<{ id: string }>();
const schema = z.string().register(registry, { id: "username" });
```

## Parsing Methods

### `.parse(data)`
Validates data. Throws `ZodError` on failure.

```typescript
const user = UserSchema.parse(rawData);
```

### `.safeParse(data)`
Validates without throwing. Returns discriminated union.

```typescript
const result = UserSchema.safeParse(rawData);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error);
}
```

### `.parseAsync(data)`
Async version of `.parse()`. Needed for async refinements/transforms.

```typescript
const user = await schema.parseAsync(data);
```

### `.safeParseAsync(data)`
Async version of `.safeParse()`.

```typescript
const result = await schema.safeParseAsync(data);
```

## Utility Methods

### `.isOptional()` / `.isNullable()`
Runtime checks for optional/nullable state.

```typescript
const schema = z.string().optional();
schema.isOptional(); // true
```

### `.clone()`
Creates a copy of the schema.

```typescript
const copy = originalSchema.clone();
```

## String Validation Methods

```typescript
z.string().min(5);                    // Minimum length
z.string().max(100);                  // Maximum length
z.string().length(10);                // Exact length
z.string().nonempty();                // Min length 1
z.string().regex(/^[a-z]+$/);        // Pattern match
z.string().startsWith("https://");    // Starts with
z.string().endsWith(".com");          // Ends with
z.string().trim();                    // Trim whitespace
z.string().datetime();                // ISO datetime
z.string().date();                    // ISO date
z.string().time();                    // ISO time
z.string().duration();                // ISO duration
```

## Number Validation Methods

```typescript
z.number().gt(5);           // Greater than
z.number().gte(5);          // Greater than or equal
z.number().lt(10);          // Less than
z.number().lte(10);         // Less than or equal
z.number().int();            // Integer
z.number().positive();       // > 0
z.number().nonnegative();    // >= 0
z.number().negative();       // < 0
z.number().nonpositive();    // <= 0
z.number().multipleOf(5);    // Multiple of
z.number().finite();         // Not Infinity
z.number().safe();           // Within Number.MIN/MAX_SAFE_INTEGER
```

## Coercion

### `z.coerce.string()` / `z.coerce.number()` / etc.
Coerces input type before validation.

```typescript
const num = z.coerce.number(); // "42" → 42
const bool = z.coerce.boolean(); // "true" → true
const date = z.coerce.date(); // "2024-01-01" → Date
```

> **v4**: Coercion input type is now `unknown` (was specific type in v3).

---

*Source: colinhacks/zod v4.0.1 · repomix + context7 + deepwiki · 2026-04-28*
