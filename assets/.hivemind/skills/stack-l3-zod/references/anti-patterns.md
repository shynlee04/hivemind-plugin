# Zod Anti-Patterns Reference

> Common mistakes that silently introduce bugs, performance issues, or type-safety gaps in Zod schemas.

## Decision Tree

```
Before using z.any()        → ask if z.unknown() provides enough safety
Schema exceeds 10 fields    → consider z.object() composition with base schemas
Need recursive types        → MUST use z.lazy()
Input differs from output   → use z.input<> and z.output<>, not z.infer<>
API boundary validation     → always use safeParse(), never parse()
Using .catch()              → ask if .default() or safeParse error handling is safer
Union of primitives         → prefer discriminated unions with z.discriminatedUnion()
Multiple .refine() calls    → consolidate into single .superRefine()
```

---

## AP-01: z.any() vs z.unknown() [CRITICAL]

`z.any()` completely bypasses type checking — every property access is allowed with no narrowing. `z.unknown()` requires type guards before use, preserving safety at API boundaries and tool schemas.

### ❌ WRONG

```typescript
import { z } from "zod";

const toolInput = z.object({
  payload: z.any(),
});

type Input = z.infer<typeof toolInput>;

function handle(input: Input) {
  input.payload.anything.goes.no.type.checks();
  input.payload();
  input.payload + 42;
}
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const toolInput = z.object({
  payload: z.unknown(),
});

type Input = z.infer<typeof toolInput>;

function handle(input: Input) {
  if (typeof input.payload === "string") {
    console.log(input.payload.toUpperCase());
  }

  if (typeof input.payload === "object" && input.payload !== null) {
    const record = input.payload as Record<string, unknown>;
    console.log(Object.keys(record));
  }
}
```

### Why it breaks

`z.any()` is a full escape hatch — it produces `any` at the type level, disabling all further checking. At runtime, malformed data flows unchecked through your system. Tool schemas and API boundaries are the worst place for this because they are the last line of defense against external input.

### Detection

```bash
grep -rn "z\.any()" --include="*.ts" src/
```

---

## AP-02: Missing z.lazy() for recursive schemas [CRITICAL]

Recursive object schemas cause a `ReferenceError` or produce incorrect types without `z.lazy()`. JavaScript cannot reference a variable before it is declared, and Zod schemas are values.

### ❌ WRONG

```typescript
import { z } from "zod";

type TreeNode = {
  value: string;
  children: TreeNode[];
};

const TreeNodeSchema: z.ZodType<TreeNode> = z.object({
  value: z.string(),
  children: z.array(TreeNodeSchema),
});
```

### ✅ CORRECT

```typescript
import { z } from "zod";

interface TreeNode {
  value: string;
  children: TreeNode[];
}

const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    value: z.string(),
    children: z.array(TreeNodeSchema),
  }),
);
```

### Why it breaks

Without `z.lazy()`, the schema references itself during declaration before the `const` binding exists. This either throws at module load time or produces a schema that validates only one level deep. `z.lazy()` defers evaluation, allowing the recursive reference to resolve after the binding exists.

### Detection

```bash
grep -rn "z\.object\|z\.array\|z\.record" --include="*.ts" src/ | grep -i "tree\|node\|nested\|recursive\|children\|parent"
```

---

## AP-03: .catch() silently masking validation errors [WARNING]

`z.string().catch("default")` returns the fallback value whenever parsing fails, discarding the actual error. This makes it impossible to distinguish between valid input that happens to equal the default and malformed input.

### ❌ WRONG

```typescript
import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().url().catch("postgres://localhost:5432/default"),
  port: z.number().int().min(1).max(65535).catch(3000),
  logLevel: z.enum(["debug", "info", "warn", "error"]).catch("info"),
});

const result = configSchema.parse({
  databaseUrl: "not-a-url-at-all",
  port: -999,
  logLevel: "verbose",
});

console.log(result);
// { databaseUrl: 'postgres://localhost:5432/default', port: 3000, logLevel: 'info' }
// No error. No warning. Three fields silently replaced.
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const configSchema = z.object({
  databaseUrl: z.string().url(),
  port: z.number().int().min(1).max(65535),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
});

const result = configSchema.safeParse({
  databaseUrl: "not-a-url-at-all",
  port: -999,
  logLevel: "verbose",
});

if (!result.success) {
  console.error("Config validation failed:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}
```

### Why it breaks

`.catch()` is designed for providing runtime defaults during schema migration, not for error handling. It masks real validation failures, making production bugs invisible. Use `safeParse()` and handle errors explicitly. If you need defaults for missing fields, use `.default()` which only activates when the field is `undefined`, not when it fails validation.

### Detection

```bash
grep -rn "\.catch(" --include="*.ts" src/
```

---

## AP-04: z.object() without .strict() or .passthrough() [WARNING]

The default behavior of `z.object()` strips unknown keys silently. This hides typos, extra fields, and schema mismatches without any warning.

### ❌ WRONG

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const input = {
  name: "Alice",
  email: "alice@example.com",
  emial: "typo@example.com",
  role: "admin",
};

const result = userSchema.parse(input);
// { name: 'Alice', email: 'alice@example.com' }
// 'emial' typo and 'role' field silently dropped
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).strict();

const input = {
  name: "Alice",
  email: "alice@example.com",
  emial: "typo@example.com",
};

const result = userSchema.safeParse(input);
// { success: false, error: ZodError: Unrecognized key(s) in object: 'emial' }
```

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}).passthrough();

const input = {
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
};

const result = userSchema.parse(input);
// { name: 'Alice', email: 'alice@example.com', role: 'admin' }
// Unknown keys preserved — use when forwarding to another system
```

### Why it breaks

Silent stripping is the most dangerous default because it never fails — it just loses data. At API boundaries, use `.strict()` to catch unexpected fields (which usually indicate client bugs or schema drift). Use `.passthrough()` only when you intentionally need to forward unknown keys to downstream consumers.

### Detection

```bash
grep -rn "z\.object(" --include="*.ts" src/ | grep -v "strict\|passthrough\|extend\|merge\|pick\|omit"
```

---

## AP-05: Confusing z.input<> and z.output<> [INFO]

After transforms, `z.input<typeof schema>` and `z.output<typeof schema>` diverge. Using `z.infer<>` (which aliases `z.output<>`) for function parameters that accept raw input skips the transform and causes type errors.

### ❌ WRONG

```typescript
import { z } from "zod";

const dateSchema = z.string().datetime().transform((s) => new Date(s));

type DateInput = z.infer<typeof dateSchema>;
// DateInput = Date (output type)

function processDate(raw: DateInput) {
  // Expects Date, but caller might pass string
}

processDate("2024-01-15T00:00:00Z");
// Type error: Argument of type 'string' is not assignable to parameter of type 'Date'
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const dateSchema = z.string().datetime().transform((s) => new Date(s));

type DateInput = z.input<typeof dateSchema>;
type DateOutput = z.output<typeof dateSchema>;

function processDate(raw: DateInput): DateOutput {
  return dateSchema.parse(raw);
}

processDate("2024-01-15T00:00:00Z");
```

### Why it breaks

`z.infer<>` returns the output type — what you get after `.parse()` completes including all transforms. When you need to type the raw input (before parsing), use `z.input<>`. This distinction only matters for schemas with `.transform()`, `.pipe()`, `.preprocess()`, or `.default()` that change the type.

### Detection

```bash
grep -rn "\.transform\|\.pipe\|\.preprocess" --include="*.ts" src/
```

---

## AP-06: Deeply nested z.object() chains [WARNING]

Deeply nested inline `z.object()` definitions degrade parse performance and reduce readability. Each nested object is a separate parse pass over the input.

### ❌ WRONG

```typescript
import { z } from "zod";

const requestSchema = z.object({
  user: z.object({
    profile: z.object({
      address: z.object({
        street: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string().length(2),
          zip: z.string().regex(/^\d{5}(-\d{4})?$/),
        }),
        country: z.string().length(2),
      }),
      preferences: z.object({
        notifications: z.object({
          email: z.boolean(),
          sms: z.boolean(),
          push: z.boolean(),
        }),
        language: z.string().length(2),
      }),
    }),
  }),
});
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const streetSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const addressSchema = z.object({
  street: streetSchema,
  country: z.string().length(2),
});

const notificationSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean(),
});

const preferencesSchema = z.object({
  notifications: notificationSchema,
  language: z.string().length(2),
});

const profileSchema = z.object({
  address: addressSchema,
  preferences: preferencesSchema,
});

const requestSchema = z.object({
  user: z.object({
    profile: profileSchema,
  }),
});
```

### Why it breaks

Deep nesting has three costs: (1) each `z.object()` creates a separate parse pass, compounding with depth; (2) error paths become `user.profile.address.street.line1` — long and fragile to match; (3) the schema definition becomes unreadable and untestable. Flat composition lets you unit-test each sub-schema independently and produces shorter error paths.

### Detection

```bash
grep -rn "z\.object(" --include="*.ts" src/ | wc -l
# If a single file has >10 z.object() calls, check for deep nesting
```

---

## AP-07: Chained .refine() instead of .check() [WARNING]

Chaining multiple `.refine()` calls creates multiple parse passes — each one traverses the entire schema and only the first failure is reported. Use `.check()` (v4) to batch all validations into a single pass and report every issue.

### ❌ WRONG

```typescript
import { z } from "zod";

const passwordSchema = z.string()
  .refine((s) => s.length >= 8, "Must be at least 8 characters")
  .refine((s) => /[A-Z]/.test(s), "Must contain uppercase letter")
  .refine((s) => /[a-z]/.test(s), "Must contain lowercase letter")
  .refine((s) => /[0-9]/.test(s), "Must contain digit")
  .refine((s) => /[^A-Za-z0-9]/.test(s), "Must contain special character");
// 5 separate validation passes over the string, only first failure reported
```

### ✅ CORRECT (v4)

```typescript
import { z } from "zod";

const passwordSchema = z.string().check((ctx) => {
  if (ctx.value.length < 8) {
    ctx.issues.push({
      code: "custom",
      message: "Must be at least 8 characters",
    });
  }
  if (!/[A-Z]/.test(ctx.value)) {
    ctx.issues.push({
      code: "custom",
      message: "Must contain uppercase letter",
    });
  }
  if (!/[a-z]/.test(ctx.value)) {
    ctx.issues.push({
      code: "custom",
      message: "Must contain lowercase letter",
    });
  }
  if (!/[0-9]/.test(ctx.value)) {
    ctx.issues.push({
      code: "custom",
      message: "Must contain digit",
    });
  }
  if (!/[^A-Za-z0-9]/.test(ctx.value)) {
    ctx.issues.push({
      code: "custom",
      message: "Must contain special character",
    });
  }
});
// Single pass, all issues reported at once
```

> **v4 note:** `.superRefine()` is deprecated. Use `.check()` with `ctx.value` and `ctx.issues.push()`. See `references/expert-guide.md` → Pitfall-04 for migration details.

### Why it breaks

Each `.refine()` in a chain wraps the previous schema in a new ZodRefine layer. When parsing, Zod must traverse each layer sequentially. With 5 chained `.refine()` calls, the string is checked 5 times and only the first failure is reported. `.check()` validates everything in one pass and reports all issues simultaneously, giving users complete feedback. The v4 `.check()` API also removes the need for `z.ZodIssueCode.custom` — use the string `"custom"` directly.

### Detection

```bash
grep -rn "\.refine(" --include="*.ts" src/ | grep -A1 "\.refine(" | grep "\.refine("
grep -rn "\.superRefine(" --include="*.ts" src/
```

---

## AP-08: z.union() type widening [WARNING]

A union of primitives like `z.union([z.string(), z.number()])` widens the inferred type to `string | number`, losing the ability to discriminate at the type level. Discriminated unions provide type narrowing through a literal key.

### ❌ WRONG

```typescript
import { z } from "zod";

const resultSchema = z.union([
  z.object({ type: z.literal("success"), data: z.unknown() }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

type Result = z.infer<typeof resultSchema>;

function handle(result: Result) {
  if (result.type === "success") {
    // TypeScript narrows correctly here, but union schemas
    // parse all variants until one matches — O(n) at runtime
    console.log(result.data);
  }
}
```

### ✅ CORRECT

```typescript
import { z } from "zod";

const successSchema = z.object({
  type: z.literal("success"),
  data: z.unknown(),
});

const errorSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
  code: z.number().optional(),
});

const resultSchema = z.discriminatedUnion("type", [
  successSchema,
  errorSchema,
]);

type Result = z.infer<typeof resultSchema>;

function handle(result: Result) {
  switch (result.type) {
    case "success":
      console.log(result.data);
      break;
    case "error":
      console.error(result.message);
      break;
  }
}
```

### Why it breaks

`z.union()` tries each variant in order until one matches — O(n) parsing time. If variants share common keys (like `type`), it may match the wrong one. `z.discriminatedUnion()` reads the discriminator key first and dispatches directly to the matching variant — O(1) parsing. It also enforces that the discriminator value is unique across variants.

### Detection

```bash
grep -rn "z\.union(" --include="*.ts" src/
```

---

## Quick Reference Card

| Anti-Pattern | Severity | Grep Pattern | Fix |
|---|---|---|---|
| AP-01 | CRITICAL | `z.any()` | Replace with `z.unknown()` or specific schema |
| AP-02 | CRITICAL | recursive schema without `z.lazy()` | Wrap in `z.lazy(() => ...)` |
| AP-03 | WARNING | `.catch(` | Use `safeParse()` + explicit error handling |
| AP-04 | WARNING | `z.object(` without `.strict()`/`.passthrough()` | Add `.strict()` for API boundaries |
| AP-05 | INFO | `.transform` + `z.infer<>` | Use `z.input<>` for raw input types |
| AP-06 | WARNING | deeply nested `z.object()` | Compose flat sub-schemas |
| AP-07 | WARNING | chained `.refine()` | Use `.check()` (v4) with `ctx.issues.push()` |
| AP-08 | WARNING | `z.union()` with objects | Use `z.discriminatedUnion()` |
