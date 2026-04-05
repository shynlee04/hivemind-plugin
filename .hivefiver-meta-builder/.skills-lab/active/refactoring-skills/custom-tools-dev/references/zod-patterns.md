# Zod Patterns — Tool Schema Design

## Good/Bad: Tool Definition

### Bad
```typescript
const myTool = tool({
  name: "my-tool",
  description: "Does many things",
  parameters: z.any(),
  execute: async (args: any) => {
    // implementation with no type safety
  },
});
```

### Good
```typescript
const myTool = tool({
  name: "audit-skill",
  description: "Audit a skill at the given path and return findings",
  parameters: z.object({
    skillPath: z.string().min(1).describe("Path to the skill directory"),
    checks: z.array(z.enum(["frontmatter", "triggers", "references", "scripts"])).optional(),
  }),
  execute: async ({ skillPath, checks = ["frontmatter", "triggers", "references", "scripts"] }) => {
    // implementation
  },
});
```

## Common Zod Patterns

### Required String
```typescript
z.string().min(1).describe("Description for the agent")
```

### Optional String with Default
```typescript
z.string().optional().default("default-value").describe("Optional field")
```

### Enum (Fixed Options)
```typescript
z.enum(["option1", "option2", "option3"]).describe("Choose one")
```

### Array of Strings
```typescript
z.array(z.string().min(1)).describe("List of items")
```

### Nested Object
```typescript
z.object({
  name: z.string().min(1),
  options: z.object({
    verbose: z.boolean().optional(),
    timeout: z.number().positive().optional(),
  }).optional(),
})
```

### Number with Constraints
```typescript
z.number().int().positive().max(100).describe("Percentage 1-100")
```

## Anti-Patterns

### z.any() — No Interface
```typescript
// BAD: Agent can't see what this tool expects
parameters: z.any()
```

### any Types — Lost Type Safety
```typescript
// BAD: No type checking in execute function
execute: async (args: any) => { ... }
```

### Missing .describe() — Agent Can't Understand
```typescript
// BAD: Agent doesn't know what each param means
parameters: z.object({
  path: z.string(),
  mode: z.enum(["read", "write"]),
})

// GOOD: Agent-readable descriptions
parameters: z.object({
  path: z.string().describe("File path to operate on"),
  mode: z.enum(["read", "write"]).describe("Operation mode"),
})
```

### Overly Broad Schemas
```typescript
// BAD: If the schema accepts everything, it validates nothing
parameters: z.object({
  data: z.any(),
  config: z.any(),
})
```

## Validation Error Handling

When a tool receives invalid input, Zod throws a ZodError. Handle it gracefully:

```typescript
execute: async (input) => {
  try {
    const parsed = schema.parse(input);
    // Use parsed data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: `Invalid input: ${error.errors.map(e => e.message).join(", ")}`,
      };
    }
    throw error;
  }
}
```

Note: OpenCode's tool() helper handles Zod validation automatically — you typically don't need manual parsing. The schema is used for both validation AND agent-readable documentation.
