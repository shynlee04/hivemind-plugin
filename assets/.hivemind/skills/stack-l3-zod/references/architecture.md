# Zod v4 Architecture

## Package Structure

```
colinhacks/zod/
├── packages/
│   ├── zod/                    # Main package
│   │   ├── src/
│   │   │   ├── index.ts        # Public entry — re-exports v4 classic
│   │   │   ├── v4/             # Zod v4 implementation
│   │   │   │   ├── classic/    # Classic API (method chaining)
│   │   │   │   │   ├── schemas.ts    # All schema constructors (88K)
│   │   │   │   │   ├── errors.ts     # Error classes
│   │   │   │   │   ├── parse.ts      # Parse utilities
│   │   │   │   │   ├── coerce.ts     # Coercion wrappers
│   │   │   │   │   ├── compat.ts     # v3 compat layer
│   │   │   │   │   ├── checks.ts     # Validation check definitions
│   │   │   │   │   ├── iso.ts        # ISO format validators
│   │   │   │   │   └── tests/        # Comprehensive test suite
│   │   │   │   ├── core/      # Core engine (shared)
│   │   │   │   │   ├── core.ts       # Base types & interfaces
│   │   │   │   │   ├── schemas.ts    # Core schema definitions (141K)
│   │   │   │   │   ├── api.ts        # Public API surface
│   │   │   │   │   ├── parse.ts      # Core parse logic
│   │   │   │   │   ├── errors.ts     # Core error types
│   │   │   │   │   ├── checks.ts     # Check system
│   │   │   │   │   ├── config.ts     # Configuration
│   │   │   │   │   ├── registries.ts # Schema registries
│   │   │   │   │   ├── standard-schema.ts  # Standard Schema interface
│   │   │   │   │   ├── json-schema.ts      # JSON Schema generation
│   │   │   │   │   ├── zsf.ts        # Zod Schema Function (?)
│   │   │   │   │   └── versions.ts   # Version info
│   │   │   │   ├── mini/      # Mini API (functional)
│   │   │   │   │   ├── schemas.ts    # Mini schema constructors
│   │   │   │   │   ├── checks.ts     # Mini checks
│   │   │   │   │   ├── parse.ts      # Mini parse
│   │   │   │   │   └── tests/        # Mini tests
│   │   │   │   ├── locales/    # i18n error messages (50+ languages)
│   │   │   │   └── index.ts    # v4 barrel
│   │   │   ├── v3/             # Legacy v3 (frozen)
│   │   │   │   ├── types.ts    # v3 types (160K)
│   │   │   │   └── ...
│   │   │   ├── mini/           # Mini re-export
│   │   │   └── v4-mini/        # v4-mini barrel
│   │   └── package.json
│   ├── docs/                   # Documentation site (Next.js)
│   ├── bench/                  # Benchmarks
│   ├── integration/            # Integration tests
│   └── ...
└── package.json
```

## Three API Variants

### Classic API (`zod`)
- **Import**: `import { z } from "zod"`
- **Style**: Method chaining on `z` namespace
- **Use for**: General application code, full feature set
- **File**: `packages/zod/src/v4/classic/schemas.ts`

```typescript
const schema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
}).strict();
```

### Mini API (`zod/mini`)
- **Import**: `import { z } from "zod/mini"`
- **Style**: Functional composition, explicit check application
- **Use for**: Bundle-size-sensitive environments, tree-shaking
- **File**: `packages/zod/src/v4/mini/schemas.ts`

```typescript
import { object, string, check, minLength } from "zod/mini";

const schema = object({
  name: check(string(), minLength(1)),
});
```

### Core (`zod/v4/core`)
- **Import**: `import * as core from "zod/v4/core"`
- **Style**: Low-level primitives, `$ZodType` base class
- **Use for**: Library authors building on top of Zod
- **File**: `packages/zod/src/v4/core/schemas.ts`

## Class Hierarchy (v4 Classic)

```
ZodType<Output, Def, Input>          // Base class
├── ZodString                        // String schemas
├── ZodNumber                        // Number schemas
├── ZodBigInt                        // BigInt schemas
├── ZodBoolean                       // Boolean schemas
├── ZodDate                          // Date schemas
├── ZodSymbol                        // Symbol schemas
├── ZodUndefined                     // Undefined schemas
├── ZodNull                          // Null schemas
├── ZodAny                           // Any (permissive)
├── ZodUnknown                       // Unknown
├── ZodNever                         // Never (reject all)
├── ZodVoid                          // Void schemas
├── ZodArray<T>                      // Array schemas
├── ZodObject<T, UnknownKeys, Catchall>  // Object schemas
├── ZodUnion<T>                      // Union schemas
├── ZodDiscriminatedUnion<D, T>      // Discriminated unions
├── ZodIntersection<T, U>            // Intersection schemas
├── ZodTuple<T, Rest>                // Tuple schemas
├── ZodRecord<Key, Value>            // Record schemas
├── ZodMap<Key, Value>               // Map schemas
├── ZodSet<Value>                    // Set schemas
├── ZodFunction<Args, Returns>       // Function schemas
├── ZodLazy<T>                       // Lazy/recursive schemas
├── ZodLiteral<T>                    // Literal value schemas
├── ZodEnum<T>                       // Enum schemas (string arrays + native enums)
├── ZodNativeEnum<T>                 // Native TS enum (deprecated, use ZodEnum)
├── ZodPromise<T>                    // Promise schemas
├── ZodEffects<T, Output, Input>     // Effects (refine/transform/preprocess)
├── ZodOptional<T>                   // Optional wrapper
├── ZodNullable<T>                   // Nullable wrapper
├── ZodDefault<T>                    // Default value wrapper
├── ZodCatch<T>                      // Catch/fallback wrapper
├── ZodNaN                           // NaN schemas
├── ZodBranded<T, B>                 // Branded types
├── ZodPipeline<A, B>                // Pipeline schemas
└── ZodReadonly<T>                   // Readonly wrapper
```

## Key Architecture Decisions (v4)

1. **Shared Core**: Both Classic and Mini built on `zod/v4/core` — no duplication
2. **Method chaining vs functional**: Classic uses methods, Mini uses functions
3. **Checks stored in schema**: Refinements interleavable with other methods (not deferred)
4. **Standard Schema compliance**: Implements `~standard` protocol for interop
5. **Built-in JSON Schema**: `z.toJSONSchema()` — no external library needed
6. **Built-in from-JSON-Schema**: `z.fromJSONSchema()` — bidirectional
7. **50+ locale support**: Error messages in 50+ languages via `zod/v4/locales/`

## Versioning Strategy

- `zod@^4.0.0` → Package root exports v4 Classic
- `zod/v3` → Legacy v3 (forever available)
- `zod/mini` → v4 Mini
- `zod/v4/core` → Core primitives
- Peer dep pattern: `"zod": "^3.25.0 || ^4.0.0"`

---

*Source: colinhacks/zod repomix output 2026-04-28*
