# API: Components — @json-render/react

**Source:** `packages/react/src/renderer.tsx`, `packages/react/src/contexts/*.tsx`

## Renderer

Core rendering component. Takes a flat spec and component registry, renders the React tree.

```tsx
import { Renderer } from "@json-render/react";

<Renderer
  spec={spec}           // Spec — The UI spec to render
  registry={registry}   // Registry — Component registry (from defineRegistry)
  loading={boolean}     // Optional loading state
  fallback={Component}  // Optional fallback for unknown types
/>
```

**Behavior:**
- Returns `null` for null/empty specs
- Resolves dynamic prop expressions before passing to components
- Evaluates visibility conditions
- Handles repeat scopes (renders element per array item)
- Error boundaries per element (single failure doesn't crash tree)

## JSONUIProvider

Convenience wrapper combining all providers. Use this for most apps.

```tsx
import { JSONUIProvider } from "@json-render/react";

<JSONUIProvider
  spec={spec}
  catalog={catalog}
  handlers={{ submit: async () => { /* ... */ } }}
  functions={{ fullName: (args) => `${args.first} ${args.last}` }}
  initialState={{ count: 0 }}
>
  <Renderer spec={spec} registry={registry} />
</JSONUIProvider>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `spec` | `Spec` | The spec to render |
| `catalog` | `Catalog` | Component catalog |
| `handlers` | `Record<string, ActionHandler>` | Action handlers |
| `functions` | `Record<string, ComputedFunction>` | Computed prop functions |
| `initialState` | `Record<string, unknown>` | Initial state model |
| `store` | `StateStore` | External store (controlled mode) |
| `onStateChange` | `(changes) => void` | State change callback |
| `validationMode` | `"strict" \| "warn" \| "ignore"` | Validation strictness |

## StateProvider

Manages reactive state model. Standalone or controlled mode.

```tsx
import { StateProvider } from "@json-render/react";

// Uncontrolled (manages its own state)
<StateProvider initialState={{ user: "Alice", count: 0 }}>
  {children}
</StateProvider>

// Controlled (external store)
<StateProvider store={zustandAdapter}>
  {children}
</StateProvider>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `store` | `StateStore` | External store. When provided, `initialState` ignored. |
| `initialState` | `Record<string, unknown>` | Initial state model (uncontrolled) |
| `onStateChange` | `(changes: Array<{path, value}>) => void` | Callback on state changes |

## ActionProvider

Dispatches actions to handler functions.

```tsx
import { ActionProvider } from "@json-render/react";

<ActionProvider handlers={{
  export_report: async (params) => downloadPDF(params),
  refresh_data: async () => refetch(),
}}>
  {children}
</ActionProvider>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `handlers` | `Record<string, ActionHandler>` | Maps action names to handler functions |
| `confirmDialog` | `ComponentType<ConfirmDialogProps>` | Optional confirmation dialog component |

## VisibilityProvider

Evaluates `visible` conditions on elements.

```tsx
import { VisibilityProvider } from "@json-render/react";

<VisibilityProvider>
  {children}
</VisibilityProvider>
```

## ValidationProvider

Manages form field validation.

```tsx
import { ValidationProvider } from "@json-render/react";

<ValidationProvider functions={{ customCheck: (val) => val > 0 }}>
  {children}
</ValidationProvider>
```

## RepeatScopeProvider

Provides repeat context (current item + index) for repeated children.

Used internally by Renderer. Access via `useRepeatScope()` hook.

## defineRegistry

Creates type-safe component registry from a catalog.

```tsx
import { defineRegistry } from "@json-render/react";

const { registry } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => <div>{props.title}{children}</div>,
    Button: ({ props, emit }) => (
      <button onClick={() => emit("press")}>{props.label}</button>
    ),
    Input: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp(props.value, bindings?.value);
      return <input value={value ?? ""} onChange={(e) => setValue(e.target.value)} />;
    },
  },
});
```

**Component receives `ComponentContext<P>`:**
| Field | Type | Description |
|-------|------|-------------|
| `props` | `P` | Typed props from catalog (Zod-validated) |
| `children` | `ReactNode` | Rendered children (for slot components) |
| `emit` | `(event: string) => void` | Emit a named event (always defined) |
| `on` | `(event: string) => EventHandle` | Get event handle with metadata |
| `loading` | `boolean` | Loading state |
| `bindings` | `Record<string, string>` | State paths from `$bindState`/`$bindItem` |

## createRenderer

Higher-level helper that creates a pre-configured renderer with providers baked in.

```tsx
import { createRenderer } from "@json-render/react";

const App = createRenderer({
  catalog,
  components: { Card, Button, Input },
  handlers: { submit: handleSubmit },
});

// Usage: <App spec={spec} />
```
