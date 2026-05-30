# API: Schemas — @json-render/core + @json-render/react

**Source:** `packages/core/src/schema.ts`, `packages/core/src/types.ts`, `packages/react/src/schema.ts`

## Spec (Flat Element Map)

The core data structure. Optimized for LLM generation.

```typescript
interface Spec {
  /** Root element key — entry point of the UI tree */
  root: string;
  /** Flat map of all elements, keyed by unique string ID */
  elements: Record<string, UIElement>;
  /** Optional initial state to seed the StateStore */
  state?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "root": "dashboard",
  "state": { "revenue": 125000, "growth": 0.15 },
  "elements": {
    "dashboard": {
      "type": "Card",
      "props": { "title": "Revenue Dashboard" },
      "children": ["metric-1", "metric-2"]
    },
    "metric-1": {
      "type": "Metric",
      "props": { "label": "Revenue", "valuePath": "/revenue", "format": "currency" }
    },
    "metric-2": {
      "type": "Metric",
      "props": { "label": "Growth", "valuePath": "/growth", "format": "percent" }
    }
  }
}
```

## UIElement

Single element in the flat map.

```typescript
interface UIElement<T extends string = string, P = Record<string, unknown>> {
  /** Component type name — must exist in catalog */
  type: T;
  /** Component props — validated against catalog's Zod schema */
  props: P;
  /** Child element keys — flat references, not nesting */
  children?: string[];
  /** Visibility condition — evaluated at render time */
  visible?: VisibilityCondition;
  /** Event bindings — maps event names to action bindings */
  on?: Record<string, ActionBinding | ActionBinding[]>;
  /** Repeat children once per item in a state array */
  repeat?: { statePath: string; key?: string };
  /** State watchers — fire actions when watched paths change */
  watch?: Record<string, ActionBinding | ActionBinding[]>;
}
```

## FlatElement

Extended UIElement for array-based specs (with explicit key/parentKey).

```typescript
interface FlatElement<T extends string = string, P = Record<string, unknown>>
  extends UIElement<T, P> {
  /** Unique key identifying this element */
  key: string;
  /** Parent element key (null for root) */
  parentKey?: string | null;
}
```

## VisibilityCondition

```typescript
type VisibilityCondition =
  | boolean                                    // Always visible/hidden
  | SingleCondition                            // Single state/item/index check
  | SingleCondition[]                          // Implicit AND (all must be true)
  | AndCondition                               // { $and: [...] }
  | OrCondition;                               // { $or: [...] }

type SingleCondition = StateCondition | ItemCondition | IndexCondition;

// State-based condition
type StateCondition = { $state: string } & ComparisonOperators;
// Repeat item field condition
type ItemCondition = { $item: string } & ComparisonOperators;
// Repeat index condition
type IndexCondition = { $index: true } & ComparisonOperators;

type ComparisonOperators = {
  eq?: unknown;
  neq?: unknown;
  gt?: number | { $state: string };
  gte?: number | { $state: string };
  lt?: number | { $state: string };
  lte?: number | { $state: string };
  not?: true;
};
```

## ActionBinding

```typescript
interface ActionBinding {
  /** Action name — must exist in catalog */
  action: string;
  /** Parameters — may contain dynamic expressions */
  params?: Record<string, DynamicValue>;
  /** Confirmation dialog config */
  confirm?: ActionConfirm;
  /** Success handler */
  onSuccess?: ActionOnSuccess;
  /** Error handler */
  onError?: ActionOnError;
}

type ActionOnSuccess =
  | { navigate: string }
  | { set: Record<string, unknown> }
  | { action: string };

type ActionOnError =
  | { set: Record<string, unknown> }
  | { action: string };

interface ActionConfirm {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
```

## DynamicValue

```typescript
type DynamicValue<T = unknown> = T | { $state: string };
type DynamicString = DynamicValue<string>;
type DynamicNumber = DynamicValue<number>;
type DynamicBoolean = DynamicValue<boolean>;
```

## Catalog

Defined via `defineCatalog`:

```typescript
interface Catalog<TDef, TCatalog, TSchema> {
  definition: TDef;
  catalog: TCatalog;
  schema: TSchema;
  // Methods
  toJsonSchema(options?: JsonSchemaOptions): object;
  toPrompt(options?: PromptOptions): string;
  validateSpec(spec: unknown): SpecValidationResult<InferSpec<TDef, TCatalog>>;
}
```

## Schema

Defined via `defineSchema`:

```typescript
interface Schema<TDef extends SchemaDefinition> {
  definition: TDef;
  // Builder methods for spec and catalog shapes
}

interface SchemaDefinition {
  spec: SchemaType;
  catalog: SchemaType;
}

interface SchemaBuilder {
  string(): SchemaType<"string">;
  number(): SchemaType<"number">;
  boolean(): SchemaType<"boolean">;
  array(item: SchemaType): SchemaType<"array">;
  object(shape: Record<string, SchemaType>): SchemaType<"object">;
  union(...types: SchemaType[]): SchemaType<"union">;
  nullable(inner: SchemaType): SchemaType<"nullable">;
  enum(...values: string[]): SchemaType<"enum">;
  record(value: SchemaType): SchemaType<"record">;
  any(): SchemaType<"any">;
}
```

## React Schema

The default schema for `@json-render/react`:

```typescript
import { schema } from "@json-render/react/schema";
// or
import { schema, type ReactSchema, type ReactSpec } from "@json-render/react";

type ReactSchema = typeof schema;
type ReactSpec<TCatalog> = typeof schema extends { definition: { spec: infer S } }
  ? /* inferred spec type */ : never;
```

## Spec Validation

```typescript
import { validateSpec, autoFixSpec, formatSpecIssues } from "@json-render/core";

// Validate
const result = validateSpec(spec, { checkOrphans: true });
// result.valid, result.issues (errors + warnings)

// Auto-fix common issues
const { spec: fixed, fixes } = autoFixSpec(spec);

// Format issues for AI repair prompt
const prompt = formatSpecIssues(issues);
```

## Infer Types

```typescript
import type {
  InferCatalogComponents,
  InferCatalogActions,
  InferComponentProps,
  InferActionParams,
  InferSpec,
} from "@json-render/core";

type MyComponents = InferCatalogComponents<typeof myCatalog>;
type MyActions = InferCatalogActions<typeof myCatalog>;
type ButtonProps = InferComponentProps<typeof myCatalog, "Button">;
type ExportParams = InferActionParams<typeof myCatalog, "export_report">;
type MySpec = InferSpec<typeof schema, typeof myCatalog>;
```
