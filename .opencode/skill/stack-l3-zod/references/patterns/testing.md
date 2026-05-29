# Zod v4 Testing Patterns

## Pattern: Schema Validation Tests

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("UserSchema", () => {
  const UserSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1),
    email: z.email(),
    age: z.number().int().positive().optional(),
  });

  it("accepts valid input", () => {
    const result = UserSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John",
      email: "john@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = UserSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("invalid_format");
    }
  });
});
```

## Pattern: Testing Error Messages

```typescript
describe("error messages", () => {
  it("produces correct error paths", () => {
    const schema = z.object({
      user: z.object({
        email: z.email(),
      }),
    });

    const result = schema.safeParse({
      user: { email: "bad" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["user", "email"]);
    }
  });

  it("formats errors with prettifyError", () => {
    const schema = z.object({ name: z.string().min(5) });
    const result = schema.safeParse({ name: "ab" });

    if (!result.success) {
      const formatted = z.prettifyError(result.error);
      expect(formatted).toContain("name");
    }
  });

  it("treeifyError creates nested structure", () => {
    const schema = z.object({
      address: z.object({
        street: z.string().min(1),
      }),
    });

    const result = schema.safeParse({ address: { street: "" } });
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      expect(tree.address._errors).toBeDefined();
    }
  });
});
```

## Pattern: Testing Transforms

```typescript
describe("transforms", () => {
  it("transforms string to number", () => {
    const schema = z.string().transform((s) => parseInt(s, 10)).pipe(z.number());
    
    const result = schema.parse("42");
    expect(result).toBe(42);
    expect(typeof result).toBe("number");
  });

  it("preserves input type with z.input", () => {
    const schema = z.string().transform((s) => s.toUpperCase());
    
    type Input = z.input<typeof schema>;  // string
    type Output = z.output<typeof schema>; // string
    
    const input: Input = "hello";
    const output: Output = schema.parse(input);
    expect(output).toBe("HELLO");
  });
});
```

## Pattern: Testing Discriminated Unions

```typescript
describe("discriminated union", () => {
  const Event = z.discriminatedUnion("type", [
    z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
    z.object({ type: z.literal("key"), key: z.string() }),
  ]);

  it("matches correct variant", () => {
    const result = Event.parse({ type: "click", x: 10, y: 20 });
    expect(result.type).toBe("click");
    if (result.type === "click") {
      expect(result.x).toBe(10);
    }
  });

  it("rejects invalid discriminator", () => {
    const result = Event.safeParse({ type: "hover" });
    expect(result.success).toBe(false);
  });
});
```

## Pattern: Testing Async Refinements

```typescript
describe("async refinements", () => {
  it("validates with async check", async () => {
    const uniqueEmail = z.string().check(async (ctx) => {
      const exists = await checkEmailExists(ctx.value);
      if (exists) {
        ctx.issues.push({
          code: "custom",
          message: "Email already taken",
        });
      }
    });

    const result = await uniqueEmail.safeParseAsync("taken@example.com");
    expect(result.success).toBe(false);
  });
});
```

## Pattern: Snapshot Testing Schemas

```typescript
describe("schema JSON Schema output", () => {
  it("generates correct JSON Schema", () => {
    const schema = z.object({
      name: z.string().describe("Full name"),
      age: z.number().int().min(0),
    });

    const jsonSchema = z.toJSONSchema(schema);
    expect(jsonSchema).toMatchSnapshot();
  });
});
```

## Pattern: Property-Based Testing

```typescript
import { fc } from "fast-check";

describe("property-based", () => {
  it("parse output always satisfies schema constraints", () => {
    const schema = z.number().int().min(0).max(100);
    
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (num) => {
        const result = schema.safeParse(num);
        expect(result.success).toBe(true);
      })
    );
  });
});
```

## Pattern: Testing Coercion

```typescript
describe("coercion", () => {
  it("coerces string to number", () => {
    const schema = z.coerce.number();
    expect(schema.parse("42")).toBe(42);
    expect(schema.parse(42)).toBe(42);
    expect(schema.parse(true)).toBe(1);
  });

  it("coerces to date", () => {
    const schema = z.coerce.date();
    const result = schema.parse("2024-01-01");
    expect(result).toBeInstanceOf(Date);
  });
});
```

## Pattern: Testing Optional/Default/Nullable Combinations

```typescript
describe("optional/default/nullable", () => {
  it("default applies when undefined", () => {
    const schema = z.object({
      role: z.string().default("user"),
    });
    
    expect(schema.parse({}).role).toBe("user");
    expect(schema.parse({ role: "admin" }).role).toBe("admin");
  });

  it("catch provides fallback on failure", () => {
    const schema = z.number().catch(0);
    expect(schema.parse("bad")).toBe(0);
    expect(schema.parse(42)).toBe(42);
  });

  it("nullish accepts null and undefined", () => {
    const schema = z.string().nullish();
    expect(schema.parse(null)).toBeNull();
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.parse("hello")).toBe("hello");
  });
});
```

---

*Source: colinhacks/zod v4.0.1 · 2026-04-28*
