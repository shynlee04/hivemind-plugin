# Zod v4 Error Handling — Complete Reference

## Parse Methods

### `.parse(data, options?)`
Validates data. Throws `ZodError` on failure.

```typescript
try {
  const user = UserSchema.parse(rawData);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(err.issues);
  }
}
```

> **v4 change**: The second parameter changed from custom data to `ParseOptions`.

### `.safeParse(data, options?)`
Validates without throwing. Returns discriminated union.

```typescript
const result = UserSchema.safeParse(rawData);

if (result.success) {
  // result.data: typed output
  console.log(result.data);
} else {
  // result.error: ZodError
  console.log(result.error.issues);
}
```

### `.parseAsync(data, options?)` / `.safeParseAsync(data, options?)`
Async variants — required for async refinements and transforms.

```typescript
const result = await schema.safeParseAsync(data);
```

## ZodError

### Structure

```typescript
class ZodError<T = any> extends Error {
  issues: ZodIssue[];
  
  // v4 new methods
  get message(): string;       // Auto-formatted error string
  
  // Deprecated in v4 (use top-level functions instead)
  // .flatten()  → use z.treeifyError()
  // .format()   → use z.treeifyError()
}
```

### ZodIssue Structure

```typescript
interface ZodIssue {
  code: string;              // Issue type code
  path: (string | number)[]; // Path to the error in the data
  message: string;           // Human-readable message
  fatal?: boolean;           // Whether parsing should abort
  
  // Type-specific fields vary by issue code:
  // expected, received, minimum, maximum, inclusive, etc.
}
```

### Issue Codes (v4)

| Code | Description |
|------|-------------|
| `invalid_type` | Value is not the expected type |
| `too_big` | Value exceeds maximum |
| `too_small` | Value below minimum |
| `invalid_string` | String format validation failed |
| `invalid_format` | Format-specific validation failed |
| `not_multiple_of` | Number not a multiple of expected |
| `unrecognized_keys` | Unknown keys in strict object |
| `invalid_key` | Record key validation failed |
| `invalid_union` | No union member matched |
| `invalid_union_discriminator` | Discriminator value not found |
| `invalid_intersection` | Intersection validation failed |
| `invalid_enum_value` | Value not in enum |
| `invalid_literal` | Literal value mismatch |
| `invalid_date` | Invalid Date object |
| `custom` | Custom refinement failed |

## Error Customization (v4)

### Unified `error` Parameter

> **v4 breaking**: Replaces `required_error`, `invalid_type_error`, `errorMap`.

```typescript
// String message
const name = z.string({ error: "Name is required" });

// Function returning string
const age = z.number({
  error: (issue) => {
    if (issue.input === undefined) return "Age is required";
    return "Age must be a number";
  },
});

// Error on validation methods
const email = z.email({ error: "Invalid email format" });
const min = z.string().min(5, { error: "Must be at least 5 characters" });
```

### Precedence (v4)

1. **Schema-level `error`** — highest priority
2. **Contextual `error`** passed to `.parse()` — second priority
3. **Default error map** — fallback

```typescript
// Contextual error map
const result = schema.safeParse(data, {
  error: (issue) => `Custom: ${issue.message}`,
});
```

## Error Formatting (v4)

### `z.prettifyError(error)` (new in v4)
Returns a human-readable string representation of the error.

```typescript
const result = schema.safeParse(badData);
if (!result.success) {
  console.log(z.prettifyError(result.error));
  // Output:
  // ✖ Invalid email at "email"
  // ✖ Expected number at "age"
}
```

### `z.treeifyError(error)` (new in v4)
Converts ZodError into a nested object structure mirroring the schema.

```typescript
const result = schema.safeParse(badData);
if (!result.success) {
  const tree = z.treeifyError(result.error);
  // {
  //   email: { _errors: ["Invalid email"] },
  //   age: { _errors: ["Expected number"] },
  // }
}
```

### `z.toDotPath(path)`
Converts a Zod issue path array to a dot-notation string.

```typescript
z.toDotPath(issue.path); // ["address", "street", 0] → "address.street[0]"
```

### Deprecated Methods (v3)

| v3 Method | v4 Replacement |
|-----------|---------------|
| `error.flatten()` | `z.treeifyError(error)` |
| `error.format()` | `z.treeifyError(error)` |
| `error.message` (formatted) | `z.prettifyError(error)` |

## Error Handling Patterns

### Pattern 1: Safe Parse (recommended)

```typescript
function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(z.prettifyError(result.error));
  }
  return result.data;
}
```

### Pattern 2: Try/Catch

```typescript
try {
  const user = UserSchema.parse(rawData);
} catch (err) {
  if (err instanceof z.ZodError) {
    const messages = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Validation failed:\n${messages.join("\n")}`);
  }
  throw err;
}
```

### Pattern 3: Collect All Errors

```typescript
const result = schema.safeParse(data);
if (!result.success) {
  // All issues are collected (not just first)
  result.error.issues.forEach((issue) => {
    console.log(`[${issue.code}] ${z.toDotPath(issue.path)}: ${issue.message}`);
  });
}
```

### Pattern 4: Abort Early

```typescript
const result = schema.safeParse(data, { abortEarly: true });
// Stops at first error
```

## Internationalization

Zod v4 includes 50+ locale files in `packages/zod/src/v4/locales/`.

```typescript
import { z } from "zod";
import { de } from "zod/v4/locales/de";

z.config({ locale: de }); // Set German error messages
```

---

*Source: colinhacks/zod v4.0.1 · repomix + context7 + deepwiki · 2026-04-28*
