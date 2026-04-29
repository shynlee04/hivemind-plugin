# API: Rendering — @json-render/react

**Source:** `packages/react/src/renderer.tsx`, `packages/core/src/props.ts`, `packages/core/src/visibility.ts`

## Rendering Pipeline

```text
1. Renderer receives Spec + Registry
   │
2. Resolve root element from Spec.elements[Spec.root]
   │
3. For each element:
   │
   ├─ Evaluate visibility condition (VisibilityProvider)
   │  └─ Skip if not visible
   │
   ├─ Resolve dynamic props (resolveElementProps)
   │  ├─ $state → read from StateStore
   │  ├─ $cond → evaluate condition, return $then or $else
   │  ├─ $template → interpolate string with state values
   │  ├─ $computed → call registered function with args
   │  ├─ $bindState → two-way binding path
   │  └─ $bindItem → two-way binding in repeat scope
   │
   ├─ Resolve bindings (resolveBindings)
   │  └─ Returns Record<propName, statePath> for bound props
   │
   ├─ Look up component from Registry[element.type]
   │  └─ Use fallback if type not found
   │
   ├─ Handle repeat (if element.repeat is set)
   │  └─ Render element once per array item at statePath
   │     └─ Set repeat scope (item + index available via $item, $index)
   │
   ├─ Process children
   │  └─ For each child key in element.children:
   │     └─ Recursively render Spec.elements[childKey]
   │
   └─ Process event handlers
      └─ For each entry in element.on:
         └─ Wire emit() → ActionProvider.dispatch(actionBinding)
```

## Dynamic Prop Resolution

**Source:** `packages/core/src/props.ts`

### resolvePropValue

Resolves a single prop value, handling all expression types:

```typescript
function resolvePropValue(
  value: unknown,
  ctx: PropResolutionContext,
): { value: unknown; binding?: string }
```

### resolveElementProps

Resolves all props on an element:

```typescript
function resolveElementProps(
  props: Record<string, unknown>,
  ctx: PropResolutionContext,
): Record<string, unknown>
```

### resolveBindings

Extracts binding metadata from props:

```typescript
function resolveBindings(
  props: Record<string, unknown>,
  ctx: PropResolutionContext,
): Record<string, string> | undefined
```

### PropResolutionContext

```typescript
interface PropResolutionContext extends VisibilityContext {
  repeatBasePath?: string;       // Absolute path to current repeat item
  computedFunctions?: Record<string, ComputedFunction>;
}
```

## Visibility Evaluation

**Source:** `packages/core/src/visibility.ts`

```typescript
function evaluateVisibility(
  condition: VisibilityCondition | undefined,
  ctx: VisibilityContext,
): boolean
```

### VisibilityContext

```typescript
interface VisibilityContext {
  state: StateModel;
  repeatItem?: unknown;    // Current repeat item
  repeatIndex?: number;    // Current repeat index
}
```

### Evaluation rules

1. `undefined` → visible (no condition = always visible)
2. `true` → visible
3. `false` → hidden
4. `{ $state: "/path" }` → read state value, check truthiness or comparison
5. `{ $state: "/path", eq: value }` → state value === comparison value
6. `{ $and: [...] }` → ALL conditions must be true
7. `{ $or: [...] }` → AT LEAST ONE must be true
8. Array of conditions → implicit AND

### Helper object

```typescript
import { visibility } from "@json-render/core";

visibility.state("/path")                   // Truthiness check
visibility.state("/path", { eq: "active" }) // Equality check
visibility.item("field")                    // Repeat item field
visibility.index({ lt: 10 })                // Repeat index check
visibility.and(cond1, cond2)                // AND composition
visibility.or(cond1, cond2)                 // OR composition
```

## SpecStream Compilation

**Source:** `packages/core/src/types.ts`

### createSpecStreamCompiler

```typescript
interface SpecStreamCompiler<T = Record<string, unknown>> {
  processLine(line: string): { spec: T | null; applied: boolean };
  getSpec(): T | null;
  reset(): void;
}

function createSpecStreamCompiler<T>(): SpecStreamCompiler<T>
```

### compileSpecStream

One-shot compiler for a full stream:

```typescript
function compileSpecStream<T>(lines: string[]): T | null
```

### applySpecPatch

Apply a single RFC 6902 patch to a spec:

```typescript
function applySpecPatch(spec: Spec, patch: SpecStreamLine): Spec
```

### parseSpecStreamLine

Parse a JSONL line into a patch operation:

```typescript
function parseSpecStreamLine(line: string): SpecStreamLine | null
```

## Edit Modes

For AI-powered editing of existing specs:

```typescript
import { buildEditInstructions, buildEditUserPrompt } from "@json-render/core";

// Build system instructions for edit modes
const instructions = buildEditInstructions(
  { modes: ["patch", "merge", "diff"] },
  "json"
);

// Build user prompt with current spec context
const prompt = buildEditUserPrompt({
  prompt: "Change the title to 'Sales Dashboard'",
  currentSpec: existingSpec,
});
```

## deepMergeSpec

Deep merge two specs (used in merge edit mode):

```typescript
function deepMergeSpec(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown>
```

## AI Prompt Generation

Generate system prompts from catalog for LLM integration:

```typescript
import { buildUserPrompt } from "@json-render/core";

const prompt = catalog.toPrompt({
  system: "You are a dashboard generator.",
  format: "json",
  editConfig: { modes: ["patch"] },
});
```
