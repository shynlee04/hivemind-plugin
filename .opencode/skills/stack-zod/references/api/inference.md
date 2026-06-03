# Zod v4 Type Inference — Complete Reference

## Core Utility Types

### `z.infer<typeof schema>`
Extracts the **output** type of a Zod schema. Most commonly used.

```typescript
const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  age: z.number().optional(),
});

type User = z.infer<typeof UserSchema>;
// {
//   id: string;
//   name: string;
//   email: string;
//   age?: number | undefined;
// }
```

### `z.output<typeof schema>`
Explicitly refers to the **output** type. Equivalent to `z.infer` for schemas without transforms.

```typescript
const schema = z.string().transform((s) => s.length).pipe(z.number());

type Out = z.output<typeof schema>;  // number
type In = z.input<typeof schema>;    // string
```

### `z.input<typeof schema>`
Extracts the **input** type — the type expected before any transformations.

```typescript
const schema = z.string().transform((s) => parseInt(s, 10));

type Input = z.input<typeof schema>;   // string
type Output = z.output<typeof schema>; // number
```

## Inference with Wrappers

### Optional
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
});

type T = z.infer<typeof schema>;
// { name: string; age?: number | undefined }
```

### Nullable
```typescript
const schema = z.string().nullable();

type T = z.infer<typeof schema>; // string | null
```

### Default
```typescript
const schema = z.string().default("hello");

type Output = z.output<typeof schema>; // string (no undefined)
type Input = z.input<typeof schema>;   // string | undefined
```

### Transform
```typescript
const schema = z.string().transform((s) => s.toUpperCase());

type Output = z.output<typeof schema>; // string (but UPPERCASE at runtime)
type Input = z.input<typeof schema>;   // string
```

### Pipe
```typescript
const schema = z.string()
  .transform((s) => parseInt(s, 10))
  .pipe(z.number().int().positive());

type Output = z.output<typeof schema>; // number
type Input = z.input<typeof schema>;   // string
```

### Brand
```typescript
const Email = z.email().brand<"Email">();

type T = z.infer<typeof Email>; // string & Brand<"Email">
```

### Readonly
```typescript
const schema = z.object({ key: z.string() }).readonly();

type T = z.infer<typeof schema>; // { readonly key: string }
```

## Generic Patterns

### Generic Function Accepting Any Schema

```typescript
function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}
```

### Generic Function with Input/Output Types

```typescript
function transform<T extends z.ZodTypeAny>(
  schema: T,
  fn: (input: z.input<T>) => z.output<T>
): void {
  // ...
}
```

### Conditional Types Based on Schema

```typescript
type SchemaType<T> = T extends z.ZodString
  ? string
  : T extends z.ZodNumber
    ? number
    : T extends z.ZodBoolean
      ? boolean
      : unknown;
```

### Extract Object Shape Types

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type Shape = z.infer<typeof schema>;           // { name: string; age: number }
type PartialShape = Partial<z.infer<typeof schema>>; // { name?: string; age?: number }
```

## ZodType Base Class Generics

```typescript
class ZodType<Output = any, Def = ZodTypeDef, Input = Output> {
  // ...
}
```

- **Output**: What `.parse()` returns
- **Input**: What the schema expects as input
- **Def**: Internal definition type

### Using in Generic Constraints

```typescript
function processSchema<T extends z.ZodType<string>>(schema: T): string {
  return schema.parse("input");
}
```

## Mini API Inference

The Mini API uses the same inference types:

```typescript
import { z } from "zod/mini";

const schema = z.object({ name: z.string() });
type T = z.infer<typeof schema>; // { name: string }
```

## Common Pitfalls

### `z.infer` vs `z.output` after transform

```typescript
const schema = z.string().transform((s) => s.length);

// These are THE SAME:
type A = z.infer<typeof schema>;   // number
type B = z.output<typeof schema>;  // number

// This is DIFFERENT:
type C = z.input<typeof schema>;   // string
```

### Coercion changes input type (v4)

```typescript
const schema = z.coerce.number();

type Input = z.input<typeof schema>;  // unknown (v4) — was string in v3
type Output = z.output<typeof schema>; // number
```

---

*Source: colinhacks/zod v4.0.1 · repomix + context7 + deepwiki · 2026-04-28*
