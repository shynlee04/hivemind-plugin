# Patterns: Dashboard Development — @json-render/react

**Source:** `vercel-labs/json-render/examples/dashboard`, official docs

## Dashboard Architecture with json-render

The Hivemind side-car dashboard uses json-render to render AI-generated dashboard specs into React components. The pattern:

```text
User Prompt → AI Model → JSON Spec → Renderer → Dashboard UI
                            ↑
                     Catalog constrains output
```

## Pattern 1: Full Dashboard with Streaming

```tsx
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { defineRegistry, Renderer, JSONUIProvider, useUIStream } from "@json-render/react";
import { z } from "zod";

// 1. Dashboard catalog
const dashboardCatalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({ title: z.string(), description: z.string().nullable() }),
      description: "Card container with title",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(),
        format: z.enum(["currency", "percent", "number"]),
      }),
      description: "Numeric metric display",
    },
    Chart: {
      props: z.object({
        title: z.string(),
        type: z.enum(["bar", "line", "pie"]),
        dataPath: z.string(),
      }),
      description: "Data visualization chart",
    },
    Button: {
      props: z.object({ label: z.string(), variant: z.enum(["primary", "secondary"]).optional() }),
      description: "Clickable button",
    },
    Grid: {
      props: z.object({ columns: z.number().optional() }),
      description: "Layout grid",
    },
  },
  actions: {
    export_report: { description: "Export dashboard to PDF" },
    refresh_data: { description: "Refresh all metrics" },
    filter_data: { description: "Filter data by criteria" },
  },
});

// 2. Dashboard registry with shadcn-style components
const { registry } = defineRegistry(dashboardCatalog, {
  components: {
    Card: ({ props, children }) => (
      <div className="rounded-lg border p-4 shadow-sm">
        <h3 className="font-semibold">{props.title}</h3>
        {props.description && <p className="text-sm text-gray-500">{props.description}</p>}
        {children}
      </div>
    ),
    Metric: ({ props }) => {
      const value = useStateValue(props.valuePath);
      const formatted = formatValue(value, props.format);
      return (
        <div className="text-center">
          <div className="text-2xl font-bold">{formatted}</div>
          <div className="text-sm text-gray-500">{props.label}</div>
        </div>
      );
    },
    Chart: ({ props }) => {
      const data = useStateValue(props.dataPath);
      return <ChartComponent type={props.type} title={props.title} data={data} />;
    },
    Button: ({ props, emit }) => (
      <button className={`btn ${props.variant ?? "primary"}`} onClick={() => emit("click")}>
        {props.label}
      </button>
    ),
    Grid: ({ props, children }) => (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${props.columns ?? 2}, 1fr)`, gap: "1rem" }}>
        {children}
      </div>
    ),
  },
  handlers: {
    export_report: async () => { /* PDF export logic */ },
    refresh_data: async () => { /* Data refresh */ },
    filter_data: async (params) => { /* Apply filters */ },
  },
});

// 3. Streaming dashboard component
function Dashboard() {
  const { spec, isStreaming, send } = useUIStream({ api: "/api/dashboard/generate" });

  return (
    <div>
      <input
        placeholder="Create a revenue dashboard..."
        onKeyDown={(e) => e.key === "Enter" && send(e.target.value)}
      />
      <JSONUIProvider
        spec={spec}
        catalog={dashboardCatalog}
        handlers={{ export_report: doExport, refresh_data: doRefresh }}
        functions={{ formatCurrency: (args) => `$${args.value.toLocaleString()}` }}
        initialState={{ revenue: 125000, growth: 0.15, users: 4500 }}
      >
        <Renderer spec={spec} registry={registry} loading={isStreaming} />
      </JSONUIProvider>
    </div>
  );
}
```

## Pattern 2: Metric Widget with Data Binding

```json
{
  "root": "metric-card",
  "state": { "revenue": 125000, "prevRevenue": 118000 },
  "elements": {
    "metric-card": {
      "type": "Card",
      "props": { "title": "Revenue" },
      "children": ["metric-val", "change-indicator"]
    },
    "metric-val": {
      "type": "Metric",
      "props": {
        "label": "Total Revenue",
        "valuePath": "/revenue",
        "format": "currency"
      }
    },
    "change-indicator": {
      "type": "Text",
      "props": {
        "content": { "$template": "Change: ${/growth}% vs last month" }
      },
      "visible": { "$state": "/revenue", gt: 0 }
    }
  }
}
```

## Pattern 3: Interactive Dashboard with Actions

```json
{
  "root": "dashboard",
  "state": { "timeRange": "7d", "refreshing": false },
  "elements": {
    "dashboard": {
      "type": "Card",
      "props": { "title": "Analytics Dashboard" },
      "children": ["toolbar", "grid"]
    },
    "toolbar": {
      "type": "Toolbar",
      "children": ["btn-refresh", "btn-export"]
    },
    "btn-refresh": {
      "type": "Button",
      "props": { "label": "Refresh" },
      "on": { "click": { "action": "refresh_data", "params": { "range": { "$state": "/timeRange" } } } }
    },
    "btn-export": {
      "type": "Button",
      "props": { "label": "Export PDF" },
      "on": {
        "click": {
          "action": "export_report",
          "confirm": { "title": "Export", "message": "Download dashboard as PDF?" }
        }
      }
    },
    "grid": {
      "type": "Grid",
      "props": { "columns": 3 },
      "children": ["m1", "m2", "m3"]
    }
  }
}
```

## Pattern 4: Repeat (List of Metrics)

```json
{
  "root": "metrics-list",
  "state": { "metrics": [
    { "label": "Revenue", "value": 125000, "format": "currency" },
    { "label": "Users", "value": 4500, "format": "number" },
    { "label": "Growth", "value": 0.15, "format": "percent" }
  ]},
  "elements": {
    "metrics-list": {
      "type": "Grid",
      "props": { "columns": 3 },
      "children": ["metric-item"],
      "repeat": { "statePath": "/metrics", "key": "label" }
    },
    "metric-item": {
      "type": "Metric",
      "props": {
        "label": { "$item": "label" },
        "valuePath": { "$item": "value" },
        "format": { "$item": "format" }
      },
      "visible": { "$item": "value", gt: 0 }
    }
  }
}
```

## Pattern 5: State Watchers (Cascading Dependencies)

```json
{
  "root": "form",
  "state": { "country": "US", "cities": [] },
  "elements": {
    "form": {
      "type": "Card",
      "props": { "title": "Location" },
      "children": ["country-select", "city-select"],
      "watch": {
        "/country": { "action": "load_cities", "params": { "country": { "$state": "/country" } } }
      }
    },
    "country-select": { "type": "Select", "props": { "value": { "$bindState": "/country" } } },
    "city-select": { "type": "Select", "props": { "options": { "$state": "/cities" } } }
  }
}
```

## Using @json-render/shadcn for Quick Dashboard

```tsx
import { registry } from "@json-render/shadcn";

// Pre-built registry with 36 shadcn/ui components
// Just pass to Renderer alongside your catalog
<Renderer spec={spec} registry={registry} />
```

## Integration with Vercel AI SDK

```tsx
import { useChat } from "@ai-sdk/react";
import { useJsonRenderMessage } from "@json-render/react";

function ChatDashboard() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const lastMessage = messages[messages.length - 1];
  const { spec, text, hasSpec } = useJsonRenderMessage(lastMessage?.parts ?? []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
      {text && <p>{text}</p>}
      {hasSpec && <Renderer spec={spec} registry={registry} />}
    </div>
  );
}
```
