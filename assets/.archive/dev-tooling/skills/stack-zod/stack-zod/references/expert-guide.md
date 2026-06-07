# Zod v4 Expert Guide — Beyond the Docs

> Knowledge that isn't in the official Zod docs. Sourced from GitHub issues, benchmark data, migration reports, and real-world production patterns.

---

## Decision Trees

### DT-01: Which Zod API Variant?

```
Need full feature set (transform, pipe, coerce, brand)?
  └─ YES → Classic API: import { z } from "zod"
  └─ NO → Need smallest possible bundle?
       └─ YES → Mini API: import { z } from "zod/mini"
            • No transform(), pipe(), coerce, brand
            • Functional style: z.string().check(z.email())
            • ~40% smaller bundle
       └─ NO → Building a library on top of Zod?
            └─ YES → Core: import * as core from "zod/v4/core"
            └─ NO → Use Classic API (safest default)
```

### DT-02: Error Handling Strategy

```
At an API/tool boundary (external input)?
  └─ YES → MUST use safeParse() — never let ZodError propagate to client
       └─ Need all errors at once (form validation)?
            └─ safeParse() + z.treeifyError() — collects every issue
       └─ Need fast-fail (performance-critical path)?
            └─ safeParse(data, { abortEarly: true })
  └─ NO → Internal validation (config, trusted data)?
       └─ OK to crash on invalid → parse() with try/catch
       └─ Need graceful degradation → safeParse()
```

### DT-03: Transform vs Refine vs Check

```
Need to CHANGE the value type (string → number)?
  └─ YES → .transform() — changes output type
       └─ Need to validate the transformed value?
            └─ Chain .pipe() after transform (watch contravariance — see Pitfall-03)
  └─ NO → Need to VALIDATE without changing type?
       └─ Single condition → .refine() — simple, returns same type
       └─ Multiple conditions (report ALL failures)?
            └─ .check() (v4) — single pass, all issues reported
            └─ NEVER chain multiple .refine() — see AP-07
  └─ Need to NORMALIZE (trim, lowercase) without changing type?
       └─ .overwrite() — v4 new method, same type guaranteed
```

### DT-04: Schema Composition Strategy

```
Schema has >10 fields?
  └─ YES → Split into sub-schemas, compose with z.object({ ...SubSchema.shape })
       └─ Shared base across schemas?
            └─ BaseSchema.extend({ ...SpecificSchema.shape }) — replaces .merge()
  └─ NO → Inline is fine

Schema reused in >3 places?
  └─ YES → Extract to named const, register in a z.registry()
  └─ NO → Inline is fine

Need recursive/nested structure?
  └─ ALWAYS use z.lazy() — no exceptions (see AP-02)
```

### DT-05: Object Strictness Strategy

```
Is this an API boundary receiving external data?
  └─ YES → .strict() — catch typos and unexpected fields
  └─ NO → Forwarding to another system that needs extra keys?
       └─ YES → .passthrough() — preserve unknown keys
       └─ NO → Internal use only?
            └─ Default (strip) is fine — but consider .strict() during development
```

---

## Pitfalls Not in the Docs

### Pitfall-01: JSON Schema Conversion Silently Fails [CRITICAL]

`z.toJSONSchema()` throws on types with no JSON Schema equivalent. This crashes at runtime with no compile-time warning.

**Unrepresentable types that THROW by default:**

```typescript
z.bigint()      // ❌ throws
z.int64()       // ❌ throws
z.symbol()      // ❌ throws
z.undefined()   // ❌ throws
z.void()        // ❌ throws
z.date()        // ❌ throws
z.map()         // ❌ throws
z.set()         // ❌ throws
z.transform()   // ❌ throws
z.nan()         // ❌ throws
z.custom()      // ❌ throws
```

**Fix: Use `unrepresentable: "any"` + `override`:**

```typescript
import { z } from "zod";

const schema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  metadata: z.map(z.string(), z.unknown()),
});

try {
  z.toJSONSchema(schema);
} catch {
}

const jsonSchema = z.toJSONSchema(schema, {
  unrepresentable: "any",
  override: (ctx) => {
    const def = ctx.zodSchema._zod.def;
    if (def.type === "date") {
      ctx.jsonSchema.type = "string";
      ctx.jsonSchema.format = "date-time";
    }
    if (def.type === "map") {
      ctx.jsonSchema.type = "object";
      ctx.jsonSchema.additionalProperties = {};
    }
  },
});
```

**For this harness project:** OpenCode tool schemas use `z.toJSONSchema()` internally. If your tool schema contains `z.date()` or `z.custom()`, the tool registration will crash at runtime with no type error. Use `z.string().datetime()` instead of `z.date()` for tool input schemas.

### Pitfall-02: zod-to-json-schema Library is INCOMPATIBLE with v4

The third-party `zod-to-json-schema` package imports `ZodFirstPartyTypeKind` from Zod, which was removed in v4. This causes build failures:

```
Export ZodFirstPartyTypeKind doesn't exist in target module
```

**Fix:** Remove `zod-to-json-schema` dependency and use built-in `z.toJSONSchema()`:

```typescript
// ❌ v3 pattern (broken in v4)
import { zodToJsonSchema } from "zod-to-json-schema";
const jsonSchema = zodToJsonSchema(mySchema);

// ✅ v4 pattern
import { z } from "zod";
const jsonSchema = z.toJSONSchema(mySchema);
```

Affected downstream: Vercel AI SDK <v5, older react-hook-form resolvers, some MCP SDK versions.

### Pitfall-03: .pipe() Contravariance Trap

In v4, `.pipe()` has stricter typing. "Zod schemas aren't contravariant in their input type" — this is intentional to fix unsoundness in v3, but it breaks common patterns:

```typescript
import { z } from "zod";

// ❌ Type error in v4 (worked in v3)
const schema = z.string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().positive());
// Error: Type 'number' is not assignable to type 'string'

// ✅ Workaround 1: Explicit unknown return
const schema = z.string()
  .transform((s): unknown => parseInt(s, 10))
  .pipe(z.number().int().positive());

// ✅ Workaround 2: Two-step with type assertion
const schema = z.string()
  .transform((s) => parseInt(s, 10) as unknown as number)
  .pipe(z.number().int().positive());
```

**Why:** The pipe target's input type must match the source's output type exactly. In v3 this was loose (contravariant), allowing mismatches through. v4 makes this strict, which catches real bugs but requires explicit casts.

### Pitfall-04: .check() Replaces .superRefine() in v4

`.superRefine()` is deprecated in v4. The new `.check()` method has a different API:

```typescript
// ❌ v3 (deprecated in v4)
z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Too short",
    });
  }
});

// ✅ v4
z.string().check((ctx) => {
  if (ctx.value.length < 8) {
    ctx.issues.push({
      code: "custom",
      message: "Too short",
    });
  }
});
```

Key differences:
- `ctx.value` replaces the first parameter `val`
- `ctx.issues.push()` replaces `ctx.addIssue()`
- No need for `z.ZodIssueCode.custom` — use string `"custom"` directly
- `ctx.path` is no longer available (removed for performance)

### Pitfall-05: Coerce + Pipe Edge Case

`z.coerce` input type is `unknown` in v4, which changes pipe behavior:

```typescript
import { z } from "zod";

// v3: This worked because coerce input was `string`
// v4: coerce input is `unknown`, pipe may fail differently
const schema = z.coerce.string().pipe(z.email());

// Safer v4 approach:
const schema = z.string().transform((s) => s).pipe(z.email());
// Or just:
const schema = z.email();
```

---

## Performance Characteristics

### Benchmarks (v4 vs v3, official)

| Operation | Speedup |
|-----------|---------|
| String parsing | ~14x faster |
| Array parsing | ~7x faster |
| Object parsing | ~6.5x faster |
| Overall | ~3x faster |

### What Makes v4 Faster

1. **Reduced type instantiations** — `ZodObject` generics simplified. Chaining `.extend()` and `.omit()` no longer causes "instantiation explosions" in tsc.
2. **Checks interleaved with methods** — Refinements stored within schema definition, not as wrapper layers.
3. **Shared core engine** — Classic and Mini both use `zod/v4/core`, no duplication.

### Bundle Size

| Import | Approximate Size |
|--------|-----------------|
| `zod` (Classic) | ~14KB gzipped |
| `zod/mini` | ~3KB gzipped |
| `zod/v4/core` | Variable (tree-shaken) |

### When Mini Matters

- Browser bundles where every KB counts
- Edge functions (Cloudflare Workers, Vercel Edge)
- Validation-only use cases (no transform/pipe/brand)

### When Classic is Required

- Any `.transform()`, `.pipe()`, `.coerce` usage
- `.brand()` for nominal typing
- `z.toJSONSchema()` with `override` callback
- Full error customization with `error` parameter

---

## Cross-Stack Integration

### OpenCode Tool Schemas

OpenCode's tool system converts Zod schemas to JSON Schema internally. This has specific constraints:

```typescript
import { z } from "zod";

// ✅ SAFE: All types representable in JSON Schema
const ToolInputSchema = z.object({
  query: z.string().describe("Search query"),
  maxResults: z.number().int().min(1).max(50).default(10),
  depth: z.enum(["basic", "advanced"]).default("basic"),
});

// ❌ UNSAFE: z.date() will crash toJSONSchema()
const BrokenSchema = z.object({
  timestamp: z.date(),              // throws in toJSONSchema()
  config: z.map(z.string(), z.any()), // throws in toJSONSchema()
  fn: z.function(),                  // throws in toJSONSchema()
});

// ✅ Use JSON-compatible alternatives
const SafeSchema = z.object({
  timestamp: z.string().datetime(),           // string with format
  config: z.record(z.string(), z.unknown()),  // record instead of map
  callback: z.string().describe("Function name — resolved at runtime"),
});
```

**Rule:** For any schema that will be converted to JSON Schema (tool inputs, API contracts, form generation), only use types with JSON Schema equivalents. See Pitfall-01 for the full list of unrepresentable types.

### tRPC v11+ Integration

```typescript
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const appRouter = t.router({
  getUser: t.procedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      return db.user.findUnique({ where: { id: input.id } });
    }),

  createUser: t.procedure
    .input(z.object({
      name: z.string().min(1),
      email: z.email(),
      role: z.enum(["admin", "user"]).default("user"),
    }))
    .mutation(async ({ input }) => {
      return db.user.create({ data: input });
    }),
});
```

tRPC v11+ has native Zod v4 support. Older tRPC versions require v3.

### drizzle-zod Schema Inference

```typescript
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { users } from "./schema";

const SelectUserSchema = createSelectSchema(users);
const InsertUserSchema = createInsertSchema(users);

type SelectUser = z.infer<typeof SelectUserSchema>;
type InsertUser = z.infer<typeof InsertUserSchema>;
```

### react-hook-form v8+ Integration

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FormSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  remember: z.boolean().default(false),
});

type FormData = z.infer<typeof FormSchema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
      <input {...register("password")} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
    </form>
  );
}
```

Requires `@hookform/resolvers` v4+ for Zod v4 support.

---

## JSON Schema Conversion Reference

### z.toJSONSchema() Full Configuration

```typescript
interface ToJSONSchemaParams {
  target?: "draft-2020-12" | "draft-7";
  metadata?: $ZodRegistry<Record<string, any>>;
  unrepresentable?: "throw" | "any";
  cycles?: "ref" | "throw";
  reused?: "ref" | "inline";
  uri?: (id: string) => string;
  io?: "input" | "output";
  override?: (ctx: { zodSchema: any; jsonSchema: any }) => void;
}
```

### Input vs Output Schema Generation

```typescript
import { z } from "zod";

const schema = z.string().transform((s) => s.length).pipe(z.number());

z.toJSONSchema(schema);
// => { type: "number" }  (output)

z.toJSONSchema(schema, { io: "input" });
// => { type: "string" }  (input)
```

### Handling Cycles in JSON Schema

```typescript
import { z } from "zod";

interface TreeNode {
  name: string;
  children: TreeNode[];
}

const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(TreeNodeSchema),
  })
);

// Default: cycles broken with $defs
z.toJSONSchema(TreeNodeSchema);
// { type: "object", properties: { name: {...}, children: { items: { $ref: "#" } } } }

// Throw on cycles instead
z.toJSONSchema(TreeNodeSchema, { cycles: "throw" });
```

### Bidirectional Conversion

```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number().int().min(0),
});

const jsonSchema = z.toJSONSchema(schema);

const roundTrip = z.fromJSONSchema(jsonSchema);
```

---

## Standard Schema Protocol

Zod v4 implements the Standard Schema (`~standard`) protocol, enabling interop with any Standard Schema-compliant library:

```typescript
import { z } from "zod";

const schema = z.object({ name: z.string() });

// Standard Schema properties available on any compliant schema:
schema["~standard"].validate({ name: "test" });
schema["~standard"].types;
schema["~standard"].vendor;
schema["~standard"].version;
```

This means Zod schemas work directly with any library that accepts Standard Schema inputs — no adapter needed.

---

*Source: colinhacks/zod GitHub issues, zod.dev changelog, Viget migration report, Vercel AI SDK issue #7189, InfoQ coverage, dev.to benchmarks, Context7 deep docs · 2026-04-28*
