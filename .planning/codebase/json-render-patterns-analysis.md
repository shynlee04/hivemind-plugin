# json-render Pattern Analysis for Agent-Work-Contract

**Analysis Date:** 2026-03-20
**Source:** json-render codebase (outputId: 2747357c8bc7d541)

---

## ExecutiveSummary

json-render implements a **schema-catalog-registry pattern** with **RFC 6902 JSON Patch streaming** for progressiveAI-generated UI construction. Key patterns transferable to HiveMind agent-work-contract:

1. **Composable Schema Builder** - Type-safe DSL for spec/catalog definitions
2. **SpecStream Incremental Compilation** - Progressive patch application with real-time UI updates
3. **Zod Integration** - Direct schema validation without intermediate types
4. **Mixed Stream Parsing** - Text + patch differentiation for chat+GenUI scenarios

---

## 1. Schema-Catalog-Registry Pattern

### Core Abstractions

```
Schema (defines structure)
   └── defineSchema(builder, options?)
         └── SchemaBuilder DSL: s.object(), s.array(), s.string(), s.ref(), etc.

Catalog (defines vocabulary)
   └── schema.createCatalog(catalogData)
         └── { components: {...}, actions: {...}, ... }

Spec (generated output)
   └── Inferred type from schema + catalog
         └── { root, elements, state, ... }
```

### Implementation Pattern

**`packages/core/src/schema.ts`:**

```typescript
// 1. Schema Builder DSL
export interface SchemaBuilder {
  string(): SchemaType<"string">;
  number(): SchemaType<"number">;
  boolean(): SchemaType<"boolean">;
  array<T extends SchemaType>(item: T): SchemaType<"array", T>;
  object<T extends Record<string, SchemaType>>(shape: T): SchemaType<"object", T>;
  record<T extends SchemaType>(value: T): SchemaType<"record", T>;
  map<T extends SchemaType>(entryShape: T): SchemaType<"map", T>;
  zod(): SchemaType<"zod">;  // Direct Zod integration
  ref(path: string): SchemaType<"ref">;  // Reference to other parts
  propsOf(path: string): SchemaType<"propsOf">;  // Props of referenced type
  optional<T extends SchemaType>(type: T): SchemaType & { optional: true };
}

// 2. defineSchema Function
export function defineSchema<TDef extends SchemaDefinition>(
  builder: (s: SchemaBuilder) => TDef,
  options?: SchemaOptions,
): Schema<TDef> {
  const s = createBuilder();
  const definition = builder(s);
  
  return {
    definition,
    promptTemplate: options?.promptTemplate,
    defaultRules: options?.defaultRules,
    builtInActions: options?.builtInActions,
    createCatalog<TCatalog extends InferCatalogInput<TDef["catalog"]>>(
      catalog: TCatalog,
    ): Catalog<TDef, TCatalog> {
      return createCatalogFromSchema(this as Schema<TDef>, catalog);
    },
  };
}
```

### Transferable to Agent-Work-Contract

```typescript
// Proposed HiveMind Schema
const contractSchema = defineSchema((s) => ({spec: s.object({
    task: s.object({
      id: s.string(),
      type: s.ref("catalog.taskTypes"),
      input: s.propsOf("catalog.taskTypes"),
      output: s.any(),
      status: s.ref("catalog.statuses"),
    }),
    handoff: s.object({...}),
    evidence: s.array(s.ref("catalog.evidenceTypes")),
  }),
  
  catalog: s.object({
    taskTypes: s.map({
      input: s.zod(),  // Zod schema for input
      output: s.zod(), // Zod schema for output
      description: s.string(),
    }),
    statuses: s.map({
      transitions: s.array(s.string()),
    }),
    evidenceTypes: s.map({
      validator: s.zod(),
    }),
  }),
}));
```

---

## 2. SpecStream Pattern (RFC 6902 JSON Patches)

### JSON Patch Operations

**`packages/core/src/types.ts`:**

```typescript
export interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;  // for move/copy}
```

### Streaming Compiler

**`packages/core/src/types.ts`:**

```typescript
export interface SpecStreamCompiler<T> {
  push(chunk: string): { result: T; newPatches: SpecStreamLine[] };
  getResult(): T;
  getPatches(): SpecStreamLine[];
  reset(initial?: Partial<T>): void;
}

export function createSpecStreamCompiler<T = Record<string, unknown>>(
  initial: Partial<T> = {},
): SpecStreamCompiler<T> {
  let result = { ...initial } as T;
  let buffer = "";
  const appliedPatches: SpecStreamLine[] = [];
  const processedLines = new Set<string>();return {
    push(chunk: string): { result: T; newPatches: SpecStreamLine[] } {
      buffer += chunk;
      const newPatches: SpecStreamLine[] = [];
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || processedLines.has(trimmed)) continue;
        processedLines.add(trimmed);
        
        const patch = parseSpecStreamLine(trimmed);
        if (patch) {
          applySpecStreamPatch(result as Record<string, unknown>, patch);
          appliedPatches.push(patch);
          newPatches.push(patch);
        }
      }
      
      // Return shallow copy to trigger re-renders
      if (newPatches.length > 0) {
        result = { ...result };
      }
      
      return { result, newPatches };
    },
    
    getResult(): T { /* flush remaining buffer */ },
    getPatches(): SpecStreamLine[] { return [...appliedPatches]; },
    reset(newInitial: Partial<T> = {}): void { /* reset state */ },
  };
}
```

### Patch Application

**`packages/core/src/types.ts`:**

```typescript
export function applySpecStreamPatch<T extends Record<string, unknown>>(
  obj: T,
  patch: SpecStreamLine,
): T {
  switch (patch.op) {
    case "add":
      addByPath(obj, patch.path, patch.value);
      break;
    case "replace":
      setByPath(obj, patch.path, patch.value);
      break;
    case "remove":
      removeByPath(obj, patch.path);
      break;
    case "move":
      const moveValue = getByPath(obj, patch.from!);
      removeByPath(obj, patch.from!);
      addByPath(obj, patch.path, moveValue);
      break;
    case "copy":
      const copyValue = getByPath(obj, patch.from!);
      addByPath(obj, patch.path, copyValue);
      break;
    case "test":
      if (!deepEqual(getByPath(obj, patch.path), patch.value)) {
        throw new Error(`Test operation failed`);
      }
      break;
  }
  return obj;
}
```

### Diff to Patches

**`packages/core/src/diff.ts`:**

```typescript
export function diffToPatches(
  oldObj: Record<string, unknown>,newObj: Record<string, unknown>,
  basePath = "",
): JsonPatch[] {
  const patches: JsonPatch[] = [];
  
  // Keys present in newObj
  for (const key of Object.keys(newObj)) {
    const path = buildPath(basePath, key);
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    
    if (!(key in oldObj)) {
      patches.push({ op: "add", path, value: newVal });
      continue;
    }
    
    // Both exist — compare
    if (isPlainObject(oldVal) && isPlainObject(newVal)) {
      patches.push(...diffToPatches(oldVal, newVal, path));
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (!arraysEqual(oldVal, newVal)) {
        patches.push({ op: "replace", path, value: newVal });
      }
    } else if (oldVal !== newVal) {
      patches.push({ op: "replace", path, value: newVal });
    }
  }
  
  // Keys removed from oldObj
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) {
      patches.push({ op: "remove", path: buildPath(basePath, key) });
    }
  }
  
  return patches;
}
```

### Transferable to Agent-Work-Contract

```typescript
// Progressive Task Building
const compiler = createSpecStreamCompiler<WorkContract>();

// Stream patches from LLM
for await (const chunk of llmStream) {
  const { result, newPatches } = compiler.push(chunk);
  if (newPatches.length > 0) {
    // Real-time state updates
    dispatcher.emit("contract:predicate", result);
  }
}

// Or diff-based updates
const patches = diffToPatches(oldContract, newContract);
await dispatcher.emit("contract:patches", patches);
```

---

## 3. Streaming Generation (Mixed Text +Patches)

### Mixed Stream Parser

**`packages/core/src/types.ts`:**

```typescript
export interface MixedStreamCallbacks {
  onPatch: (patch: SpecStreamLine) => void;
  onText: (text: string) => void;
}

export interface MixedStreamParser {
  push(chunk: string): void;
  flush(): void;
}

export function createMixedStreamParser(
  callbacks: MixedStreamCallbacks,
): MixedStreamParser {
  let buffer = "";
  let inSpecFence = false;
  
  function processLine(line: string): void {
    const trimmed = line.trim();
    
    // Fence detection
    if (!inSpecFence && trimmed.startsWith("```spec")) {
      inSpecFence = true;
      return;
    }
    if (inSpecFence && trimmed === "```") {
      inSpecFence = false;
      return;
    }
    
    if (!trimmed) return;
    
    if (inSpecFence) {
      const patch = parseSpecStreamLine(trimmed);
      if (patch) callbacks.onPatch(patch);
      return;
    }
    
    // Outside fence: heuristic mode
    const patch = parseSpecStreamLine(trimmed);
    if (patch) {
      callbacks.onPatch(patch);
    } else {
      callbacks.onText(line);
    }
  }
  
  return {
    push(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        processLine(line);
      }
    },
    flush(): void {
      if (buffer.trim()) processLine(buffer);
      buffer = "";
    },
  };
}
```

### AI SDK Transform

**`packages/core/src/types.ts`:**

```typescript
export function createJsonRenderTransform(): TransformStream<StreamChunk, StreamChunk> {
  let lineBuffer = "";
  let inSpecFence = false;
  let buffering = false;
  
  // Classification modes:
  // 1. Fence mode: Lines between ```spec and ``` are patches
  // 2. Heuristic mode: Lines starting with { are patches
  
  return new TransformStream({
    transform(chunk, controller) {
      // Handle text-delta chunks
      // Classify each line as patch or text
      // Emit data-spec parts for patches
      // Emit text-delta parts for prose
    },
    flush(controller) {
      // Flush remaining buffer
    },
  });
}
```

### Transferable to Agent-Work-Contract

```typescript
// Mixed Task Planning + Execution Patches
const parser = createMixedStreamParser({
  onText: (text) => appendToPlan(text),
  onPatch: (patch) => applyTaskPatch(patch),
});

for await (const chunk of plannerStream) {
  parser.push(chunk);
}
parser.flush();
```

---

## 4. Validation Approach (Zod Integration)

### Catalog with Zod Schemas

**`packages/react/src/schema.ts` example:**

```typescript
export const schema = defineSchema((s) => ({
  spec: s.object({
    root: s.string(),
    elements: s.record(
      s.object({
        type: s.ref("catalog.components"),
        props: s.propsOf("catalog.components"),
        children: s.array(s.string()),
        visible: s.any().optional(),
        on: s.any().optional(),
        repeat: s.any().optional(),
      })
    ),
    state: s.record(s.any()).optional(),
  }),
  
  catalog: s.object({
    components: s.map({
      props: s.zod(),  // Zod schema for props
      description: s.string().optional(),
      example: s.any().optional(),
    }),
    actions: s.map({
      params: s.zod(),  // Zod schema for params
      description: s.string().optional(),
    }).optional(),
  }),
}));
```

### Type Inference

```typescript
// Catalog with Zod
const catalog = schema.createCatalog({
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        content: z.string().optional(),
      }),
      description: "A card component",
    },
  },
  actions: {
    submit: {
      params: z.object({
        email: z.string().email(),
      }),
      description: "Submit form",
    },
  },
});

// Inferred types
type AppCatalog = typeof catalog;
type AppSpec = InferSpec<typeof catalog>;
// AppSpec isfully typed with Zod inference
```

### Transferable to Agent-Work-Contract

```typescript
const contractCatalog = contractSchema.createCatalog({
  taskTypes: {
    "analyze-codebase": {
      input: z.object({
        filePaths: z.array(z.string()),
        focus: z.enum(["tech", "arch", "quality", "concerns"]),
      }),
      output: z.object({
        summary: z.string(),findings: z.array(z.object({
          file: z.string(),
          issue: z.string(),
          severity: z.enum(["low", "medium", "high"]),
        })),
      }),
      description: "Analyze codebase for focus area",
    },},
  
  statuses: {
    pending: { transitions: ["running"] },
    running: { transitions: ["completed", "failed"] },
    completed: { transitions: [] },
    failed: { transitions: [] },
  },
});
```

---

## 5. Key Architectural Decisions

### 1. Schema Builder DSL Over Raw Zod

**Why:** Type-safe composition with references (`s.ref()`) enables cross-catalog type linking without circular dependencies.

```typescript
// Instead of:
type Spec = { type: ComponentType; props: ComponentProps };

// Use:
spec: s.object({
  type: s.ref("catalog.components"),  // Links to catalog
  props: s.propsOf("catalog.components"),  // Infers props schema
})
```

### 2. JSON Patch Over Full Spec Replacement

**Why:** Progressive updates enable real-time UI rendering as LLM streams patches.

```typescript
// Each line is an incremental update:
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Card","props":{},...}}
{"op":"add","path":"/elements/title","value":{"type":"Text",...}}
```

### 3. Catalog Separates "What" from "How"

**Why:** Schema defines structure, Catalog defines vocabulary. Different catalogs can share the same schema.

```typescript
// Same schema, different catalogs
const reactCatalog = schema.createCatalog({ components: { Card: {...} } });
const vueCatalog = schema.createCatalog({ components: { Card: {...} } });
const nativeCatalog = schema.createCatalog({ components: { Card: {...} } });```

### 4. Built-In Actions vs Custom Actions

**Why:** Schema can define built-in actions (e.g., `setState`) that don't require explicit catalog entries.

```typescript
const schema = defineSchema(builder, {
  builtInActions: ["setState", "pushState", "removeState"],
});
```

---

## 6. Code Snippets for Critical Abstractions

### Creating a Custom Schema

```typescript
import { defineSchema } from "@json-render/core";

export const schema = defineSchema((s) => ({
  spec: s.object({
    // Define your spec structure
    root: s.string(),
    elements: s.record(s.object({
      type: s.ref("catalog.components"),
      props: s.propsOf("catalog.components"),
    })),
  }),
  
  catalog: s.object({
    // Define catalog structure
    components: s.map({
      props: s.zod(),
      description: s.string().optional(),
    }),
  }),
}), {
  // Optional: custom prompt template
  promptTemplate: (ctx) => `Custom prompt with ${ctx.componentNames.length} components`,
  
  // Optional: default rules
  defaultRules: ["Always validate input", "Use semantic keys"],
  
  // Optional: built-in actions
  builtInActions: ["navigate", "submit"],
});
```

### Creating a Catalog

```typescript
import { z } from "zod";

export const catalog = schema.createCatalog({
  components: {
    // Each component has Zod-validated props
    Button: {
      props: z.object({
        label: z.string(),
        onClick: z.string().optional(),
        variant: z.enum(["primary", "secondary"]).optional(),
      }),
      description: "A clickable button",
      example: { label: "Click me", variant: "primary" },
    },
  },
  
  actions: {
    // Actions with parameter schemas
    submit: {
      params: z.object({
        endpoint: z.string(),
        method: z.enum(["GET", "POST"]),
      }),
      description: "Submit data to endpoint",
    },
  },
});
```

### Generating AI Prompts

```typescript
// Build prompt from catalog
const prompt = catalog.prompt({
  includeExamples: true,
  rules: ["Use semantic element keys", "Group related elements"],
  currentSpec: existingSpec,  // Optional: for edit mode
  editModes: ["patch", "merge"],  // RFC 6902, RFC 7396
});

// Use with AI SDK
const result = await streamText({
  model: anthropic("claude-3-5-sonnet-20241022"),
  prompt,
});
```

### Processing Streamed Patches

```typescript
import { createSpecStreamCompiler } from "@json-render/core";

const compiler = createSpecStreamCompiler<Spec>();

// Process AI stream
for await (const textChunk of result.textStream) {
  const { result, newPatches } = compiler.push(textChunk);
  
  if (newPatches.length > 0) {
    // Update UI with partial result
    setSpec(result);
    
    // Optionally log patches for debugging
    console.log("Applied patches:", newPatches);
  }
}

// Get final result
const finalSpec = compiler.getResult();
```

---

## 7. Anti-Patterns to Avoid

1. **Don't inline Zod in spec definitions** - Use `s.zod()` in catalog only
   ```typescript
   // ❌ Bad
   spec: s.object({ props: z.object({...}) })
   // ✅ Good
   spec: s.object({ props: s.propsOf("catalog.components") })
   ```

2. **Don't recreate catalogs** - Catalogs are designed to be created once
   ```typescript
   // ❌ Bad - creates new catalog each render
   function MyComponent() {
     const catalog = schema.createCatalog({...});
   }
   // ✅ Good - catalog defined at module level
   export const catalog = schema.createCatalog({...});
   ```

3. **Don't mutate specs directly** - Use patches
   ```typescript
   // ❌ Bad
   spec.elements["new"] = {...};
   // ✅ Good
   applySpecPatch(spec, { op: "add", path: "/elements/new", value: {...} });
   ```

---

## 8. Integration Points for HiveMind

### Agent-Work-Contract Mapping

| json-render | HiveMind Agent-Work-Contract |
|-------------|------------------------------|
| Schema | WorkContractSchema (task, handoff, evidence structures) |
| Catalog | WorkingMemoryCatalog (handlers, validators, templates) |
| Spec | WorkContract (instantiated contract with predicates) |
| `s.ref()` | `workflow.steps[i].type` references |
| `s.propsOf()` | `task.input` schema inference |
| `createCatalog()` | `createWorkMemory()` |
| `prompt()` | `buildPlannerPrompt()` |
| SpecStream | PredicatePatchStream (progressive contract building) |

### Proposed Integration

```typescript
// hivemind-work-contract/src/schema.ts
export const workContractSchema = defineSchema((s) => ({
  spec: s.object({
    workflow: s.object({
      id: s.string(),
      status: s.ref("catalog.statuses"),
      steps: s.array(s.object({
        id: s.string(),
        type: s.ref("catalog.stepTypes"),
        input: s.propsOf("catalog.stepTypes"),
        output: s.any().optional(),
        status: s.ref("catalog.statuses"),
      })),
    }),
    
    tasks: s.record(s.object({
      id: s.string(),
      kind: s.enum(["task", "subtask"]),
      workflowId: s.string(),
      status: s.ref("catalog.statuses"),
      predicates: s.array(s.ref("catalog.predicateTypes")),
    })),
    
    trajectories: s.record(s.object({...})),
    handoffs: s.record(s.object({...})),
  }),
  
  catalog: s.object({
    statuses: s.map({
      transitions: s.array(s.string()),
    }),
    stepTypes: s.map({
      input: s.zod(),
      output: s.zod(),
      description: s.string(),
    }),
    predicateTypes: s.map({
      validate: s.zod(),
      description: s.string(),
    }),
  }),
}));

// Create working memory catalog
export const workingMemoryCatalog = workContractSchema.createCatalog({
  statuses: {
    pending: { transitions: ["running"] },
    running: { transitions: ["completed", "failed", "blocked"] },
    completed: { transitions: [] },
    failed: { transitions: [] },blocked: { transitions: ["running"] },
  },
  
  stepTypes: {
    "plan": {
      input: z.object({ focus: z.string() }),
      output: z.object({ plan: z.string() }),
      description: "Generate implementation plan",
    },
    "implement": {
      input: z.object({ taskIds: z.array(z.string()) }),
      output: z.object({ changedFiles: z.array(z.string()) }),
      description: "Execute implementation",
    },
    // ...
  },
  
  predicateTypes: {
    "files-changed": {
      validate: z.object({ paths: z.array(z.string()) }),
      description: "Predicate: specified files were modified",
    },
    "tests-pass": {
      validate: z.object({ testIds: z.array(z.string()) }),
      description: "Predicate: specified tests pass",
    },
    // ...
  },
});
```

---

## Conclusion

json-render provides a robust pattern for:

1. **Composable type-safe schemas** with Zod integration
2. **Progressive state building** via RFC 6902 JSON Patches
3. **Mixed streaming** for chat + structural generation
4. **Catalog-based vocabulary** separation

These patterns directly translate to HiveMind's agent-work-contract needs:
- WorkContract Schema replaces json-render Spec Schema
- Working Memory replaces json-render Catalog
- Predicate Patches replace json-render SpecStream Patches
- Step Types replace json-render Component Definitions

The key insight is **incremental contract building** via patches rather than full replacement, enabling real-time workflow visualization and predicate tracking as agents collaborate.