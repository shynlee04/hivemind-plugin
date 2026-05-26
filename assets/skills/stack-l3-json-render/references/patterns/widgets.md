# Patterns: Widget Creation — @json-render/react

**Source:** Official docs, repo examples, API reference

## Widget = Catalog Component + Registry Implementation

A "widget" in json-render is simply a component registered in the catalog with a corresponding React implementation in the registry.

## Pattern 1: Basic Widget (Display Only)

### Catalog Definition

```typescript
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const catalog = defineCatalog(schema, {
  components: {
    StatusBadge: {
      props: z.object({
        status: z.enum(["active", "inactive", "pending", "error"]),
        label: z.string(),
      }),
      description: "Status indicator badge with color coding",
    },
  },
});
```

### Registry Implementation

```tsx
import { defineRegistry } from "@json-render/react";

const { registry } = defineRegistry(catalog, {
  components: {
    StatusBadge: ({ props }) => {
      const colors = {
        active: "bg-green-100 text-green-800",
        inactive: "bg-gray-100 text-gray-800",
        pending: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
      };
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[props.status]}`}>
          {props.label}
        </span>
      );
    },
  },
});
```

### AI-Generated Spec

```json
{
  "root": "badge-1",
  "elements": {
    "badge-1": {
      "type": "StatusBadge",
      "props": { "status": "active", "label": "System Online" }
    }
  }
}
```

## Pattern 2: Interactive Widget (Events + Actions)

### Catalog with Events

```typescript
const catalog = defineCatalog(schema, {
  components: {
    ToggleSwitch: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
      }),
      description: "Toggle switch that updates state",
    },
  },
  actions: {
    toggle_setting: { description: "Toggle a boolean setting" },
  },
});
```

### Registry with Event Handling

```tsx
const { registry } = defineRegistry(catalog, {
  components: {
    ToggleSwitch: ({ props, emit }) => {
      const value = useStateValue(props.valuePath);
      return (
        <label className="flex items-center gap-2">
          <button
            role="switch"
            aria-checked={!!value}
            onClick={() => emit("toggle")}
            className={`relative inline-flex h-6 w-11 rounded-full ${value ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          {props.label}
        </label>
      );
    },
  },
});
```

### Spec with Action Binding

```json
{
  "root": "toggle-1",
  "state": { "darkMode": false },
  "elements": {
    "toggle-1": {
      "type": "ToggleSwitch",
      "props": { "label": "Dark Mode", "valuePath": "/darkMode" },
      "on": {
        "toggle": { "action": "toggle_setting", "params": { "key": "darkMode" } }
      }
    }
  }
}
```

## Pattern 3: Data-Bound Widget with Two-Way Binding

```tsx
// Input widget with $bindState two-way binding
const { registry } = defineRegistry(catalog, {
  components: {
    TextInput: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp(props.value, bindings?.value);
      return (
        <div>
          <label className="block text-sm font-medium">{props.label}</label>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder={props.placeholder ?? ""}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>
      );
    },
  },
});
```

### Spec using $bindState

```json
{
  "root": "form",
  "state": { "email": "", "name": "" },
  "elements": {
    "form": {
      "type": "Card",
      "props": { "title": "Contact Form" },
      "children": ["name-input", "email-input", "submit-btn"]
    },
    "name-input": {
      "type": "TextInput",
      "props": {
        "label": "Name",
        "placeholder": "Enter name",
        "value": { "$bindState": "/name" }
      }
    },
    "email-input": {
      "type": "TextInput",
      "props": {
        "label": "Email",
        "placeholder": "Enter email",
        "value": { "$bindState": "/email" }
      }
    },
    "submit-btn": {
      "type": "Button",
      "props": { "label": "Submit" },
      "on": { "click": { "action": "submit_form" } }
    }
  }
}
```

## Pattern 4: Widget with Validation

```typescript
import { ValidationConfigSchema } from "@json-render/core";

const catalog = defineCatalog(schema, {
  components: {
    ValidatedInput: {
      props: z.object({
        label: z.string(),
        value: z.string().nullable(),
        placeholder: z.string().nullable(),
        validation: ValidationConfigSchema.optional(),
      }),
      description: "Text input with validation rules",
    },
  },
});
```

### Registry Implementation

```tsx
const { registry } = defineRegistry(catalog, {
  components: {
    ValidatedInput: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp(props.value, bindings?.value);
      const { fieldState } = useFieldValidation(props.validation);

      return (
        <div>
          <label>{props.label}</label>
          <input
            value={value ?? ""}
            onChange={(e) => setValue(e.target.value)}
            className={fieldState?.valid === false ? "border-red-500" : ""}
          />
          {fieldState?.errors?.map((err, i) => (
            <p key={i} className="text-red-500 text-xs">{err}</p>
          ))}
        </div>
      );
    },
  },
});
```

## Pattern 5: Repeatable Widget (List Items)

```json
{
  "root": "todo-list",
  "state": {
    "todos": [
      { "text": "Buy groceries", "done": false },
      { "text": "Walk dog", "done": true },
      { "text": "Write code", "done": false }
    ]
  },
  "elements": {
    "todo-list": {
      "type": "Card",
      "props": { "title": "Todo List" },
      "children": ["todo-item", "add-btn"]
    },
    "todo-item": {
      "type": "TodoItem",
      "props": {
        "text": { "$item": "text" },
        "done": { "$item": "done" }
      },
      "repeat": { "statePath": "/todos" },
      "visible": { "$item": "done", neq: true }
    },
    "add-btn": {
      "type": "Button",
      "props": { "label": "Add Todo" },
      "on": { "click": { "action": "add_todo" } }
    }
  }
}
```

## Pattern 6: Computed Props Widget

```tsx
// Catalog with computed functions
const catalog = defineCatalog(schema, {
  components: {
    FullName: {
      props: z.object({
        firstNamePath: z.string(),
        lastNamePath: z.string(),
      }),
      description: "Displays computed full name",
    },
  },
});

// Registry with functions parameter
<JSONUIProvider
  catalog={catalog}
  functions={{
    joinName: (args) => `${args.first} ${args.last}`.trim(),
  }}
>
  <Renderer spec={spec} registry={registry} />
</JSONUIProvider>

// Spec using $computed
// { "type": "FullName", "props": { "display": { "$computed": "joinName", "args": { "first": "/firstName", "last": "/lastName" } } } }
```

## Widget Creation Checklist

1. **Define in catalog** — Component name + Zod prop schema + description
2. **Add actions (if interactive)** — Action name + param schema + description
3. **Implement in registry** — React component receiving `ComponentContext<P>`
4. **Handle events** — Use `emit(event)` or `on(event)` for action dispatch
5. **Bind state** — Use `$bindState`/`$bindItem` for two-way binding, `$state` for read-only
6. **Add visibility** — Use `visible` conditions for conditional rendering
7. **Test with spec** — Write JSON spec to verify widget renders correctly
8. **Document** — Include example spec in catalog description for AI prompt generation
