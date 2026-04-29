# Architecture — @json-render/react

**Source:** `vercel-labs/json-render` repo analysis (packages/core + packages/react)

## How json-render Works

json-render constrains AI output to structured JSON that maps to predefined React components. The AI never generates raw HTML or React code — it generates a **flat element map** (Spec) that references components from a **Catalog**.

### Core Flow

```
AI Model → JSON Spec (flat element map) → Renderer → React Component Tree
                                          ↑
                            Registry maps component names → React components
                                          ↑
                            Catalog defines what names/props are valid
```

### Three-Layer Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Catalog Layer (defineCatalog)                                │
│  - Declares available components (name + Zod prop schema)    │
│  - Declares available actions (name + param schema)           │
│  - Generates AI system prompts                                │
│  - Validates AI output against schemas                        │
│  Source: `@json-render/core`                                  │
├──────────────────────────────────────────────────────────────┤
│  Registry Layer (defineRegistry)                              │
│  - Maps catalog component names → React component functions  │
│  - Maps catalog action names → action handler functions      │
│  - Provides type-safe ComponentContext to each component      │
│  Source: `@json-render/react`                                 │
├──────────────────────────────────────────────────────────────┤
│  Rendering Layer (Renderer + Providers)                       │
│  - Renderer: resolves flat spec → nested React tree          │
│  - StateProvider: manages reactive state model                │
│  - VisibilityProvider: evaluates visibility conditions        │
│  - ActionProvider: dispatches actions to handlers             │
│  - ValidationProvider: runs validation checks                 │
│  Source: `@json-render/react`                                 │
└──────────────────────────────────────────────────────────────┘
```

## Spec Format (Flat Element Map)

The spec is optimized for LLM generation — flat structure, no nesting, keyed references:

```typescript
interface Spec {
  root: string;                          // Key of the root element
  elements: Record<string, UIElement>;   // Flat map of elements by key
  state?: Record<string, unknown>;       // Optional initial state
}

interface UIElement {
  type: string;                    // Component name from catalog
  props: Record<string, unknown>;  // Component props (may contain dynamic expressions)
  children?: string[];             // Keys of child elements (flat reference, not nesting)
  visible?: VisibilityCondition;   // Conditional visibility
  on?: Record<string, ActionBinding | ActionBinding[]>;  // Event → action bindings
  repeat?: { statePath: string; key?: string };           // Repeat per array item
  watch?: Record<string, ActionBinding | ActionBinding[]>; // State change watchers
}
```

### Why flat instead of nested?
- Fewer LLM tokens (no closing tags)
- Easier patching via JSON Patch (RFC 6902)
- Simpler streaming (append patches incrementally)
- No ambiguity about parent-child relationships

## State Management

### Built-in StateStore

Framework-agnostic in-memory store (`@json-render/core`):

```typescript
interface StateStore {
  get: (path: string) => unknown;         // Read by JSON Pointer
  set: (path: string, value: unknown) => void;  // Write + notify
  update: (changes: Array<{ path: string; value: unknown }>) => void;
  subscribe: (listener: () => void) => () => void;
  getState: () => StateModel;
  setState: (state: StateModel) => void;
}
```

### Dynamic Prop Expressions

Any prop value can be data-driven:

| Expression | Meaning | Example |
|-----------|---------|---------|
| `{ "$state": "/path" }` | Read from state | `{ "$state": "/user/name" }` |
| `{ "$cond": ..., "$then": ..., "$else": ... }` | Conditional | `{ "$cond": { "$state": "/isAdmin" }, "$then": "Admin", "$else": "User" }` |
| `{ "$template": "Hello, ${/user/name}!" }` | Template | `{ "$template": "Count: ${/count}" }` |
| `{ "$computed": "fn", "args": {...} }` | Computed | `{ "$computed": "fullName", "args": { "first": "/f", "last": "/l" } }` |
| `$bindState: "/path"` | Two-way binding | `value: { $bindState: "/form/email" }` |
| `$bindItem: "field"` | Two-way binding in repeat | `value: { $bindItem: "name" }` |

### External State Adapters

Replace built-in store with: Zustand (`@json-render/zustand`), Redux (`@json-render/redux`), Jotai (`@json-render/jotai`), XState (`@json-render/xstate`).

## Streaming (SpecStream)

### How streaming works

1. AI model outputs JSONL patches (RFC 6902)
2. `SpecStreamCompiler` (`@json-render/core`) applies patches incrementally
3. `useUIStream` hook (`@json-render/react`) feeds patches to React state
4. Renderer re-renders on each patch — progressive UI assembly

### Stream compiler

```typescript
import { createSpecStreamCompiler } from "@json-render/core";

const compiler = createSpecStreamCompiler();
// Feed JSONL lines one at a time
compiler.processLine('{"op":"add","path":"/root","value":"card-1"}');
compiler.processLine('{"op":"add","path":"/elements/card-1","value":{"type":"Card","props":{"title":"Hello"}}}');
// Get the current (partial) spec
const spec = compiler.getSpec();
```

### Mixed stream parser

For streams that mix text + spec data (e.g., AI SDK responses):

```typescript
import { createMixedStreamParser } from "@json-render/core";

const parser = createMixedStreamParser({
  onSpecLine: (line) => { /* handle spec patch */ },
  onText: (text) => { /* handle text chunk */ },
});
```

## Visibility System

Conditions evaluated at render time:

```typescript
// Simple state condition
visible: { $state: "/isLoggedIn", eq: true }

// Item condition (inside repeat)
visible: { $item: "active", eq: true }

// Index condition
visible: { $index: true, lt: 5 }

// AND/OR composition
visible: { $and: [{ $state: "/isAdmin" }, { $state: "/isActive" }] }
visible: { $or: [{ $state: "/role", eq: "admin" }, { $state: "/role", eq: "editor" }] }

// Negation
visible: { $state: "/isLocked", not: true }
```

## Validation System

Form field validation via ValidationProvider:

```typescript
// In catalog definition
Input: {
  props: z.object({
    value: z.string(),
    validation: ValidationConfigSchema.optional(),
  }),
}

// ValidationConfig
interface ValidationConfig {
  checks: ValidationCheck[];
  onValid?: ActionBinding;
  onInvalid?: ActionBinding;
}
```

Built-in validation functions: `required`, `minLength`, `maxLength`, `pattern`, `email`, `min`, `max`, `custom`.

## Action System

Actions connect UI events to handlers:

```typescript
// In spec
{ type: "Button", props: { label: "Export" }, on: { click: { action: "export_report" } } }

// In catalog
actions: { export_report: { description: "Export dashboard to PDF" } }

// In registry
defineRegistry(catalog, {
  handlers: { export_report: async () => downloadPDF() },
});
```

### Built-in actions
- `setState` — Update state model directly
- `pushState` — Push value to state array
- `removeState` — Remove state path
- `validateForm` — Trigger form validation

## Edit Modes

For AI-powered spec editing:

| Mode | Description |
|------|-------------|
| `patch` | JSON Patch (RFC 6902) operations |
| `merge` | Deep merge with current spec |
| `diff` | Unified diff against serialized spec |
