# Zod v3 → v4 Migration Guide

## Overview

Zod v4 introduces significant performance improvements (~3x faster), reduced bundle size, built-in JSON Schema support, and a cleaner API. The migration is mostly mechanical but has several breaking changes.

### Upgrade Command

```bash
npm install zod@^4.0.0
```

### Import Path Changes

| Before (v3) | After (v4) |
|-------------|-----------|
| `import { z } from "zod"` | `import { z } from "zod"` (unchanged — now exports v4) |
| `import { z } from "zod/v4"` | `import { z } from "zod"` (root now v4) |
| `import { z } from "zod/v4-mini"` | `import { z } from "zod/mini"` |
| v3 import via root | `import { z } from "zod/v3"` (legacy) |

## Breaking Changes

### 1. Unified Error Parameter (HIGH IMPACT)

**Before (v3)**: Three different error customization mechanisms.

```typescript
// ❌ Zod 3
const schema = z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});
const email = z.string().email({ message: "Invalid email format" });
const age = z.number({
  errorMap: (issue, ctx) => {
    if (issue.code === "too_small") return { message: "Must be 18+" };
    return { message: ctx.defaultError };
  },
});
```

**After (v4)**: Single `error` parameter.

```typescript
// ✅ Zod 4
const schema = z.string({
  error: (issue) => {
    if (issue.input === undefined) return "Name is required";
    return "Name must be a string";
  },
});
const email = z.email({ error: "Invalid email format" });
const age = z.number({
  error: (issue) => issue.code === "too_small" ? "Must be 18+" : undefined,
});
```

### 2. String Format Methods Promoted (MEDIUM IMPACT)

String format validators moved from methods to top-level functions.

| Before (v3) | After (v4) |
|-------------|-----------|
| `z.string().email()` | `z.email()` |
| `z.string().url()` | `z.url()` |
| `z.string().uuid()` | `z.uuid()` (stricter) or `z.guid()` (permissive) |
| `z.string().ip()` | `z.ipv4()` or `z.ipv6()` |
| `z.string().cidr()` | `z.cidrv4()` or `z.cidrv6()` |

> **Note**: Method forms are deprecated but still work. They will be removed in a future version.

### 3. `z.record()` Requires Two Arguments (MEDIUM IMPACT)

**Before (v3)**: `z.record(z.string())` — single arg, key defaults to `z.string()`.

**After (v4)**: `z.record(z.string(), z.string())` — two args required.

```typescript
// ❌ v3
const dict = z.record(z.number());

// ✅ v4
const dict = z.record(z.string(), z.number());

// For partial records (optional keys)
const partial = z.partialRecord(z.enum(["a", "b"]), z.number());
```

### 4. `z.coerce` Input Type is `unknown` (LOW-MEDIUM IMPACT)

```typescript
const schema = z.coerce.string();

// v3: type Input = string
// v4: type Input = unknown
```

If you relied on the specific input type of coerced schemas, you need to update type assertions.

### 5. `.superRefine()` → `.check()` (MEDIUM IMPACT)

```typescript
// ❌ v3
z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password too short",
    });
  }
});

// ✅ v4
z.string().check((ctx) => {
  if (ctx.value.length < 8) {
    ctx.issues.push({
      code: "custom",
      message: "Password too short",
    });
  }
});
```

Key differences:
- `ctx.value` replaces first parameter `val`
- `ctx.issues.push()` replaces `ctx.addIssue()`
- No need for `z.ZodIssueCode.custom`
- `ctx.path` is no longer available (performance optimization)

### 6. `.merge()` Deprecated (LOW IMPACT)

```typescript
// ❌ v3
const merged = schemaA.merge(schemaB);

// ✅ v4 — use .extend() with destructuring for better tsc performance
const merged = schemaA.extend({ ...schemaB.shape });
```

### 7. ZodError Methods Deprecated (MEDIUM IMPACT)

| Before (v3) | After (v4) |
|-------------|-----------|
| `error.flatten()` | `z.treeifyError(error)` |
| `error.format()` | `z.treeifyError(error)` |
| Manual formatting | `z.prettifyError(error)` |

```typescript
// ❌ v3
const flat = error.flatten();
const formatted = error.format();

// ✅ v4
const tree = z.treeifyError(result.error);
const pretty = z.prettifyError(result.error);
```

### 8. `z.nativeEnum()` Deprecated (LOW IMPACT)

```typescript
// ❌ v3
enum Color { Red = "red", Blue = "blue" }
const schema = z.nativeEnum(Color);

// ✅ v4 — z.enum() now handles native enums
const schema = z.enum(Color);
```

### 9. UUID Validation Stricter (MEDIUM IMPACT)

```typescript
// v3: z.string().uuid() — permissive
// v4: z.uuid() — strict RFC 9562/4122 (validates variant bits)

// For permissive matching (backward compatible with v3 behavior):
const id = z.guid();
```

**Invalid in v4** (but valid in v3):
- `00000000-0000-0000-0000-000000000000` (variant bits wrong)
- Random hex strings without proper version/variant bits

### 10. `.pipe()` Stricter Typing (LOW-MEDIUM IMPACT)

Zod schemas aren't contravariant in their input type. If `.pipe()` fails:

```typescript
// Workaround 1: Return unknown from transform
const schema = z.string()
  .transform((s): unknown => parseInt(s, 10))
  .pipe(z.number());

// Workaround 2: Use z.any()
const schema = z.string()
  .transform((s) => parseInt(s, 10) as any)
  .pipe(z.number());
```

### 11. `.parse()` Second Parameter Changed (LOW IMPACT)

```typescript
// ❌ v3 — second param was custom data
schema.parse(data, { someContext: true });

// ✅ v4 — second param is ParseOptions
schema.parse(data);
schema.safeParse(data, { error: customErrorMap });
```

### 12. `.default()` / `.catch()` with `.optional()` / `.partial()` (MEDIUM IMPACT)

In v4, when object properties with `.catch()` or `.default()` are made optional (via `.optional()` or `.partial()`), the caught/default values are **always returned** even when absent from input. This differs from v3 where these properties were ignored.

## Automated Migration

### Codemod

```bash
npx zod-v3-to-v4
```

The [zod-v3-to-v4 codemod](https://github.com/nicoespeon/zod-v3-to-v4) handles most mechanical changes:
- `z.string().email()` → `z.email()`
- `z.record(z.string())` → `z.record(z.string(), z.string())`
- `.superRefine()` → `.check()`
- `required_error` / `invalid_type_error` → unified `error`
- `.merge()` → `.extend()`

### Manual Checklist

- [ ] Update `package.json`: `zod@^4.0.0`
- [ ] Run codemod: `npx zod-v3-to-v4`
- [ ] Fix `error` parameter unification (codemod handles simple cases)
- [ ] Update `z.record()` calls to two-argument form
- [ ] Replace `error.flatten()` / `error.format()` with `z.treeifyError()` / `z.prettifyError()`
- [ ] Check UUID validation (use `z.guid()` for permissive matching)
- [ ] Update `z.coerce` type assertions (input is now `unknown`)
- [ ] Test `.pipe()` chains for stricter typing issues
- [ ] Check `.default()` / `.catch()` with `.partial()` behavior
- [ ] Update third-party libraries (tRPC v11+, react-hook-form v8+, etc.)
- [ ] Run full test suite

## Third-Party Compatibility

| Library | Zod 4 Compatible Version |
|---------|------------------------|
| tRPC | v11+ |
| @tanstack/react-form | ✓ |
| Conform | ✓ |
| react-hook-form | v8 with @hookform/resolvers v4+ |
| @modelcontextprotocol/sdk | Pending |
| openai SDK | Pending |

Check compatibility:
```bash
npm ls zod
```

## Peer Dependency Pattern for Library Authors

```json
{
  "peerDependencies": {
    "zod": "^3.25.0 || ^4.0.0"
  }
}
```

This allows consumers to use either v3 or v4.

---

*Source: colinhacks/zod v4.0.1 · dev.to migration guide · Viget Labs · nicoespeon/zod-v3-to-v4 · 2026-04-28*
