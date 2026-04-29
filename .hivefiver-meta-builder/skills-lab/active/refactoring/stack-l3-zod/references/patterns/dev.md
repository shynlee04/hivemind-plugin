# Zod v4 Development Patterns

## Pattern: Tool Input Schema (AI/Agent tools)

```typescript
import { z } from "zod";

// Define tool parameter schema
const SearchToolParams = z.object({
  query: z.string().describe("Search query text"),
  max_results: z.number().int().min(1).max(50).default(10)
    .describe("Maximum number of results"),
  search_depth: z.enum(["basic", "advanced"]).default("basic")
    .describe("Search depth level"),
});

type SearchToolParams = z.infer<typeof SearchToolParams>;

// Validate and use
function executeSearch(raw: unknown) {
  const params = SearchToolParams.parse(raw);
  // params is fully typed
  return search(params.query, params.max_results);
}
```

## Pattern: Config Validation

```typescript
import { z } from "zod";

const AppConfig = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  host: z.string().default("localhost"),
  database: z.object({
    url: z.url(),
    pool_size: z.number().int().positive().default(10),
    ssl: z.boolean().default(true),
  }),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: z.enum(["json", "text"]).default("json"),
  }),
});

// Load and validate config from environment/file
function loadConfig() {
  const raw = {
    port: process.env.PORT,
    host: process.env.HOST,
    database: {
      url: process.env.DATABASE_URL,
      pool_size: process.env.DB_POOL_SIZE
        ? parseInt(process.env.DB_POOL_SIZE, 10)
        : undefined,
      ssl: process.env.DB_SSL === "true",
    },
    logging: {
      level: process.env.LOG_LEVEL,
    },
  };
  
  return AppConfig.parse(raw);
}

type AppConfig = z.infer<typeof AppConfig>;
```

## Pattern: API Boundary Validation

```typescript
import { z } from "zod";

// Request schema
const CreateUserRequest = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.email(),
    role: z.enum(["admin", "user"]).default("user"),
  }),
  headers: z.object({
    authorization: z.string().startsWith("Bearer "),
  }),
});

// Response schema
const UserResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(["admin", "user"]),
  created_at: z.string().datetime(),
});

// Validate at boundary
async function createUser(req: unknown) {
  const parsed = CreateUserRequest.parse(req);
  
  const user = await db.users.create(parsed.body);
  
  // Validate output too
  return UserResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at.toISOString(),
  });
}
```

## Pattern: Discriminated Union (Event Handling)

```typescript
import { z } from "zod";

const BaseEvent = z.object({
  id: z.uuid(),
  timestamp: z.string().datetime(),
});

const ClickEvent = BaseEvent.extend({
  type: z.literal("click"),
  x: z.number(),
  y: z.number(),
});

const KeyEvent = BaseEvent.extend({
  type: z.literal("key"),
  key: z.string(),
  modifiers: z.array(z.enum(["ctrl", "alt", "shift", "meta"])).default([]),
});

const ScrollEvent = BaseEvent.extend({
  type: z.literal("scroll"),
  deltaY: z.number(),
  deltaX: z.number().default(0),
});

const Event = z.discriminatedUnion("type", [ClickEvent, KeyEvent, ScrollEvent]);

type Event = z.infer<typeof Event>;

function handleEvent(raw: unknown) {
  const event = Event.parse(raw);
  
  switch (event.type) {
    case "click":
      console.log(`Click at (${event.x}, ${event.y})`);
      break;
    case "key":
      console.log(`Key: ${event.key}`);
      break;
    case "scroll":
      console.log(`Scroll: ${event.deltaY}`);
      break;
  }
}
```

## Pattern: Recursive Schema

```typescript
import { z } from "zod";

interface FileNode {
  name: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
}

const FileNodeSchema: z.ZodType<FileNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    type: z.enum(["file", "directory"]),
    size: z.number().optional(),
    children: z.array(FileNodeSchema).optional(),
  })
);
```

## Pattern: Schema Composition with Registries

```typescript
import { z } from "zod";

const entityRegistry = z.registry<{ id: string; description: string }>();

const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
}).register(entityRegistry, {
  id: "User",
  description: "A user entity",
});

// Generate JSON Schema from registered schemas
const jsonSchema = z.toJSONSchema(entityRegistry);
```

## Pattern: JSON Schema Generation

```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string().describe("User's full name"),
  email: z.email(),
  age: z.number().int().min(0).meta({ examples: [25, 30, 45] }),
});

// Convert to JSON Schema
const jsonSchema = z.toJSONSchema(schema);
// {
//   type: "object",
//   properties: {
//     name: { type: "string", description: "User's full name" },
//     email: { type: "string", format: "email" },
//     age: { type: "integer", minimum: 0, examples: [25, 30, 45] }
//   },
//   required: ["name", "email", "age"],
//   additionalProperties: false
// }
```

## Pattern: Zod Mini (Bundle-Optimized)

```typescript
import { z } from "zod/mini";

// Functional style — better tree-shaking
const schema = z.object({
  name: z.string(),
  email: z.string().check(z.email()),
  age: z.optional(z.number()),
});

// Same parse/safeParse API
const result = schema.safeParse(data);
```

---

*Source: colinhacks/zod v4.0.1 · 2026-04-28*
