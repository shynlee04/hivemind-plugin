# API: Types — @json-render/react + @json-render/core

**Source:** `packages/core/src/types.ts`, `packages/react/src/catalog-types.ts`, `packages/react/src/schema.ts`

## Core Types (@json-render/core)

### Spec

```typescript
interface Spec {
  root: string;                          // Root element key
  elements: Record<string, UIElement>;   // Flat map of elements by key
  state?: Record<string, unknown>;       // Optional initial state
}
```

### UIElement

```typescript
interface UIElement<T extends string = string, P = Record<string, unknown>> {
  type: T;
  props: P;
  children?: string[];
  visible?: VisibilityCondition;
  on?: Record<string, ActionBinding | ActionBinding[]>;
  repeat?: { statePath: string; key?: string };
  watch?: Record<string, ActionBinding | ActionBinding[]>;
}
```

### FlatElement

```typescript
interface FlatElement<T extends string = string, P = Record<string, unknown>>
  extends UIElement<T, P> {
  key: string;
  parentKey?: string | null;
}
```

### StateModel & StateStore

```typescript
type StateModel = Record<string, unknown>;

interface StateStore {
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  update: (changes: Array<{ path: string; value: unknown }>) => void;
  subscribe: (listener: () => void) => () => void;
  getState: () => StateModel;
  setState: (state: StateModel) => void;
}
```

### DynamicValue

```typescript
type DynamicValue<T = unknown> = T | { $state: string };
type DynamicString = DynamicValue<string>;
type DynamicNumber = DynamicValue<number>;
type DynamicBoolean = DynamicValue<boolean>;
```

### ActionBinding

```typescript
interface ActionBinding {
  action: string;
  params?: Record<string, DynamicValue>;
  confirm?: ActionConfirm;
  onSuccess?: ActionOnSuccess;
  onError?: ActionOnError;
}

type ActionOnSuccess = { navigate: string } | { set: Record<string, unknown> } | { action: string };
type ActionOnError = { set: Record<string, unknown> } | { action: string };

interface ActionConfirm {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
```

### Action Types

```typescript
interface ActionDefinition<TParams = Record<string, unknown>> {
  params?: z.ZodType<TParams>;
  description: string;
}

interface ResolvedAction {
  action: string;
  params: Record<string, unknown>;
}

type ActionHandler<TParams = Record<string, unknown>, TResult = unknown> =
  (params: TParams) => Promise<TResult>;

type ComputedFunction = (args: Record<string, unknown>) => unknown;
```

### Visibility Types

```typescript
type VisibilityCondition =
  | boolean
  | SingleCondition
  | SingleCondition[]
  | AndCondition
  | OrCondition;

type SingleCondition = StateCondition | ItemCondition | IndexCondition;
type StateCondition = { $state: string } & ComparisonOperators;
type ItemCondition = { $item: string } & ComparisonOperators;
type IndexCondition = { $index: true } & ComparisonOperators;
type AndCondition = { $and: VisibilityCondition[] };
type OrCondition = { $or: VisibilityCondition[] };

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

### Validation Types

```typescript
interface ValidationCheck {
  rule: string;
  message?: string;
  params?: Record<string, unknown>;
}

interface ValidationConfig {
  checks: ValidationCheck[];
  onValid?: ActionBinding;
  onInvalid?: ActionBinding;
}

type ValidationFunction = (value: unknown, params: Record<string, unknown>) => string | null;
type ValidationMode = "strict" | "warn" | "ignore";
```

### Spec Validation Types

```typescript
type SpecIssueSeverity = "error" | "warning";

interface SpecIssue {
  severity: SpecIssueSeverity;
  code: string;
  message: string;
  path: string;
}

interface SpecValidationIssues {
  valid: boolean;
  errors: SpecIssue[];
  warnings: SpecIssue[];
}
```

### Schema & Catalog Types

```typescript
interface SchemaBuilder { /* builder primitives */ }
interface SchemaType<TKind extends string = string, TInner = unknown> { kind: TKind; inner?: TInner; }
interface SchemaDefinition { spec: SchemaType; catalog: SchemaType; }
interface Schema<TDef extends SchemaDefinition> { definition: TDef; /* methods */ }
interface Catalog<TDef, TCatalog, TSchema> { /* methods */ }
```

### Infer Types

```typescript
type InferCatalogComponents<C extends Catalog> = /* extracted component map */;
type InferCatalogActions<C extends Catalog> = /* extracted action map */;
type InferComponentProps<C extends Catalog, K extends string> = /* Zod-inferred props */;
type InferActionParams<C extends Catalog, K extends string> = /* Zod-inferred params */;
type InferSpec<TDef extends SchemaDefinition, TCatalog> = /* full spec type */;
```

### Edit Types

```typescript
type EditMode = "patch" | "merge" | "diff";

interface EditConfig {
  modes: EditMode[];
}
```

### Stream Types

```typescript
type SpecStreamLine = JsonPatch;

interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

interface SpecStreamCompiler<T> {
  processLine(line: string): { spec: T | null; applied: boolean };
  getSpec(): T | null;
  reset(): void;
}

type StreamChunk = { type: "spec"; content: string } | { type: "text"; content: string };
```

## React Types (@json-render/react)

### ComponentContext

Typed context received by registry components:

```typescript
interface ComponentContext<P = Record<string, unknown>> {
  props: P;                                      // Typed props from catalog
  children?: React.ReactNode;                    // Rendered children
  emit: (event: string) => void;                 // Emit event (always defined)
  on: (event: string) => EventHandle;            // Get event handle
  loading?: boolean;                             // Loading state
  bindings?: Record<string, string>;             // State paths from $bindState/$bindItem
}
```

### EventHandle

```typescript
interface EventHandle {
  emit: () => void;                    // Fire the event
  shouldPreventDefault: boolean;       // Whether preventDefault was requested
  bound: boolean;                      // Whether any handler is bound
}
```

### BaseComponentProps

Catalog-agnostic base for reusable component libraries:

```typescript
interface BaseComponentProps<P = Record<string, unknown>> {
  props: P;
  children?: React.ReactNode;
  emit: (event: string) => void;
  on: (event: string) => EventHandle;
  loading?: boolean;
  bindings?: Record<string, string>;
}
```

### SetState

```typescript
type SetState = (
  path: string,
  value: unknown,
) => void;
```

### ComponentFn & ComponentMap

```typescript
type ComponentFn<P = Record<string, unknown>> =
  (ctx: ComponentContext<P>) => React.ReactNode;

type ComponentMap<C extends Catalog> = {
  [K in keyof InferCatalogComponents<C>]: ComponentFn<InferComponentProps<C, K>>;
};
```

### Registry Types

```typescript
interface ComponentRenderProps<P = Record<string, unknown>> {
  props: P;
  children?: React.ReactNode;
  emit: (event: string) => void;
  on: (event: string) => EventHandle;
  loading?: boolean;
  bindings?: Record<string, string>;
}

type ComponentRenderer<P = Record<string, unknown>> = ComponentType<ComponentRenderProps<P>>;
type ComponentRegistry = Record<string, ComponentRenderer<any>>;

interface RendererProps {
  spec: Spec | null;
  registry: ComponentRegistry;
  loading?: boolean;
  fallback?: ComponentType<{ type: string }>;
}

interface DefineRegistryResult {
  registry: ComponentRegistry;
}

interface CreateRendererProps {
  catalog: Catalog;
  components: Record<string, ComponentFn>;
  handlers?: Record<string, ActionHandler>;
  functions?: Record<string, ComputedFunction>;
}
```

### Hook Types

```typescript
interface UseUIStreamOptions {
  api: string;
  fetchOptions?: RequestInit;
  formatter?: (line: string) => string;
}

interface UseUIStreamReturn {
  spec: Spec | null;
  isStreaming: boolean;
  send: (prompt: string) => void;
  error: Error | null;
  tokenUsage?: TokenUsage;
}

interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
}

interface DataPart {
  type: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UseChatUIOptions {
  api: string;
  catalog: Catalog;
  registry: ComponentRegistry;
}

interface UseChatUIReturn {
  messages: ChatMessage[];
  spec: Spec | null;
  isStreaming: boolean;
  send: (message: string) => void;
  error: Error | null;
}
```

### Schema Types

```typescript
type ReactSchema = typeof schema;
type ReactSpec<TCatalog> = typeof schema extends { definition: { spec: infer S } }
  ? /* inferred */ : never;
type ElementTreeSchema = ReactSchema;        // Backward compat alias
type ElementTreeSpec<T> = ReactSpec<T>;     // Backward compat alias
```

### Provider Types

```typescript
interface JSONUIProviderProps {
  spec: Spec;
  catalog: Catalog;
  handlers?: Record<string, ActionHandler>;
  functions?: Record<string, ComputedFunction>;
  initialState?: Record<string, unknown>;
  store?: StateStore;
  onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
  validationMode?: ValidationMode;
}

interface StateProviderProps {
  store?: StateStore;
  initialState?: Record<string, unknown>;
  onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
  children: React.ReactNode;
}

interface ActionProviderProps {
  handlers: Record<string, ActionHandler>;
  confirmDialog?: ComponentType<ConfirmDialogProps>;
  children: React.ReactNode;
}

interface ValidationProviderProps {
  functions?: Record<string, ValidationFunction>;
  children: React.ReactNode;
}
```
