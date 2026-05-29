# Practical Integration Guide — @json-render/react

Cross-stack integration patterns for real-world production use. Covers Next.js App Router, Vercel AI SDK, testing, error boundaries, and debugging workflows.

## Decision Tree: When to Use json-render vs Alternatives

```text
Need AI-generated UI from prompts?
├─ YES → Use json-render
│   ├─ Need progressive streaming? → useUIStream or useChatUI
│   ├─ Need chat + UI mixed? → useJsonRenderMessage + Vercel AI SDK
│   └─ Need static AI output? → validateSpec + Renderer
└─ NO → Use standard React
    ├─ Server-rendered? → RSC (Server Components)
    ├─ Rich interactivity? → Client Components
    └─ Form-heavy? → React Hook Form + Zod
```

### When json-render is NOT the right choice

- **Static dashboards** with known layouts → plain React components are simpler
- **SEO-critical pages** → RSC renders HTML on server, json-render needs client JS
- **Complex form validation** → React Hook Form has better DX for multi-step forms
- **Performance-critical lists** (>10k items) → virtualized React components
- **Authentication/login flows** → standard server actions are more secure

## Decision Tree: State Management

```text
Need state in specs?
├─ Read-only display values? → $state + StateStore (built-in)
├─ Two-way form binding? → $bindState + $bindItem
├─ Already using Zustand? → @json-render/zustand adapter
├─ Already using Redux? → @json-render/redux adapter
├─ Complex state machines? → @json-render/xstate adapter
└─ Need derived/computed values? → $computed + functions prop
```

## Decision Tree: Component Strategy

```text
Choosing components for catalog:
├─ Need 36 standard UI components fast? → @json-render/shadcn
├─ Building custom dashboard? → Define own catalog + registry
├─ Need 3D scenes? → @json-render/react-three-fiber
├─ Export specs as standalone code? → catalog.toCode() (code export)
└─ Need dev inspector? → @json-render/devtools-react (null in prod)
```

---

## Integration 1: Next.js App Router (Server + Client Boundary)

json-render requires client-side React (hooks, state, event handlers). In Next.js App Router, the Renderer must be a Client Component. The server handles data fetching and API routes.

### Server-side: API route for spec generation

```typescript
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { catalog } from "@/lib/catalog";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const systemPrompt = catalog.prompt({ mode: "standalone" });

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    prompt,
  });

  return result.toTextStreamResponse();
}
```

### Client-side: Streaming dashboard component

```tsx
"use client";

import { useUIStream, JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/lib/registry";
import { catalog } from "@/lib/catalog";

export function GenerativeDashboard() {
  const { spec, isStreaming, send, error } = useUIStream({
    api: "/api/dashboard/generate",
    onComplete: (finalSpec) => {
      console.log("[json-render] Stream complete:", Object.keys(finalSpec.elements).length, "elements");
    },
    onError: (err) => {
      console.error("[json-render] Stream error:", err);
    },
  });

  if (error) return <DashboardError error={error} onRetry={() => send(prompt)} />;

  return (
    <div>
      <PromptBar onSend={send} disabled={isStreaming} />
      <JSONUIProvider
        spec={spec}
        catalog={catalog}
        initialState={defaultState}
      >
        {spec ? (
          <Renderer spec={spec} registry={registry} loading={isStreaming} />
        ) : (
          <EmptyState />
        )}
      </JSONUIProvider>
    </div>
  );
}
```

### Server component wrapping the client boundary

```tsx
import { GenerativeDashboard } from "./generative-dashboard";

export default function DashboardPage() {
  return (
    <main>
      <h1>AI Dashboard</h1>
      <GenerativeDashboard />
    </main>
  );
}
```

**Key insight:** The `"use client"` boundary must include the Renderer, JSONUIProvider, and all registry components. The page.tsx itself can remain a Server Component.

---

## Integration 2: Vercel AI SDK Chat + Inline UI

For chatbots that mix text responses with generated UI widgets.

### API route: Inline mode with pipeJsonRender

```typescript
import { streamText } from "ai";
import { pipeJsonRender } from "@json-render/core";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { catalog } from "@/lib/catalog";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: yourModel,
    system: catalog.prompt({ mode: "inline" }),
    messages,
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(result.toUIMessageStream()));
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

### Client: Chat with inline spec rendering

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useJsonRenderMessage, Renderer } from "@json-render/react";
import { registry } from "@/lib/registry";

function ChatMessage({ message }: { message: { parts: Array<{ type: string; text?: string; data?: unknown }> } }) {
  const { spec, text, hasSpec } = useJsonRenderMessage(message.parts);

  return (
    <div className="message">
      {text && <p>{text}</p>}
      {hasSpec && spec && (
        <div className="generated-ui">
          <Renderer spec={spec} registry={registry} />
        </div>
      )}
    </div>
  );
}

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

**Key insight:** `catalog.prompt({ mode: "inline" })` generates a system prompt that instructs the LLM to output JSONL patches interleaved with text. `pipeJsonRender` separates them. `useJsonRenderMessage` reassembles spec from the data parts.

---

## Integration 3: Error Boundary for Renderer

```tsx
"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import type { Spec } from "@json-render/core";

interface RenderErrorBoundaryProps {
  spec: Spec;
  registry: Record<string, unknown>;
  children: ReactNode;
  fallback?: (error: Error, spec: Spec) => ReactNode;
}

interface RenderErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RenderErrorBoundary extends Component<RenderErrorBoundaryProps, RenderErrorBoundaryState> {
  constructor(props: RenderErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RenderErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[json-render] Render error:", error);
    console.error("[json-render] Component stack:", info.componentStack);
    console.error("[json-render] Failed spec:", JSON.stringify(this.props.spec, null, 2));
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.props.spec);
      }
      return (
        <div style={{ border: "2px solid red", padding: 16, borderRadius: 8 }}>
          <h3>Rendering Error</h3>
          <pre style={{ fontSize: 12 }}>{this.state.error.message}</pre>
          <details>
            <summary>Spec Debug Info</summary>
            <pre style={{ fontSize: 10, maxHeight: 200, overflow: "auto" }}>
              {JSON.stringify(this.props.spec, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Usage

```tsx
<RenderErrorBoundary spec={spec} registry={registry}>
  <Renderer spec={spec} registry={registry} />
</RenderErrorBoundary>
```

---

## Integration 4: Testing with Vitest

### Testing catalog definition

```typescript
import { describe, it, expect } from "vitest";
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

describe("dashboard catalog", () => {
  const catalog = defineCatalog(schema, {
    components: {
      Card: {
        props: z.object({ title: z.string() }),
        description: "Card container",
      },
      Button: {
        props: z.object({ label: z.string() }),
        description: "Clickable button",
      },
    },
    actions: {
      submit: { description: "Submit form" },
    },
  });

  it("validates a correct spec", () => {
    const spec = {
      root: "card-1",
      elements: {
        "card-1": { type: "Card", props: { title: "Test" }, children: [] },
      },
    };
    const result = catalog.validateSpec(spec);
    expect(result.valid).toBe(true);
  });

  it("rejects unknown component types", () => {
    const spec = {
      root: "x-1",
      elements: {
        "x-1": { type: "UnknownWidget", props: {}, children: [] },
      },
    };
    const result = catalog.validateSpec(spec);
    expect(result.valid).toBe(false);
  });

  it("generates a system prompt", () => {
    const prompt = catalog.prompt({ mode: "standalone" });
    expect(prompt).toContain("Card");
    expect(prompt).toContain("Button");
    expect(prompt).toContain("submit");
  });
});
```

### Testing registry components

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { defineRegistry } from "@json-render/react";

describe("Button component", () => {
  it("emits event on click", async () => {
    const emitted: string[] = [];

    const { registry } = defineRegistry(catalog, {
      components: {
        Button: ({ props, emit }) => (
          <button onClick={() => { emit("press"); emitted.push("press"); }}>
            {props.label}
          </button>
        ),
      },
    });

    const Component = registry.Button;
    render(<Component props={{ label: "Click Me" }} emit={(e) => emitted.push(e)} />);

    fireEvent.click(screen.getByText("Click Me"));
    expect(emitted).toContain("press");
  });
});
```

### Testing spec validation pipeline

```typescript
import { describe, it, expect } from "vitest";
import { validateSpec, autoFixSpec, formatSpecIssues } from "@json-render/core";

describe("spec validation pipeline", () => {
  it("auto-fixes missing children arrays", () => {
    const raw = {
      root: "card-1",
      elements: {
        "card-1": { type: "Card", props: { title: "Test" } },
      },
    };

    const { spec: fixed, fixes } = autoFixSpec(raw);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixed.elements["card-1"].children).toEqual([]);
  });

  it("detects orphaned child references", () => {
    const spec = {
      root: "card-1",
      elements: {
        "card-1": { type: "Card", props: { title: "Test" }, children: ["ghost"] },
      },
    };

    const result = validateSpec(spec, { checkOrphans: true });
    expect(result.valid).toBe(false);
    const orphanIssue = result.issues?.find((i) => i.code === "orphan_reference");
    expect(orphanIssue).toBeDefined();
  });
});
```

---

## Integration 5: Code Export (Zero Runtime Dependencies)

json-render can export generated specs as standalone React code with no runtime dependency on @json-render packages.

```typescript
import { catalog } from "@/lib/catalog";

const code = catalog.toCode(spec, {
  format: "tsx",
  components: "inline",
});

// Produces standalone React TSX that renders the same UI
// without @json-render/core or @json-render/react
```

**When to use code export:**
- Shipping AI-generated UI to production (remove json-render runtime weight)
- Converting prototypes to production components
- Audit trail of what the AI generated at a point in time

---

## Debugging Workflow

When a spec breaks, follow this systematic approach:

### Step 1: Validate

```typescript
import { validateSpec, autoFixSpec, formatSpecIssues } from "@json-render/core";

const result = validateSpec(rawSpec, { checkOrphans: true });
if (!result.valid) {
  console.log(formatSpecIssues(result.issues));
}
```

### Step 2: Auto-fix

```typescript
const { spec: fixed, fixes } = autoFixSpec(rawSpec);
console.log("Auto-fixes applied:", fixes.map((f) => `${f.type}: ${f.path}`));
```

### Step 3: Visual debug with devtools

```tsx
import { JsonRenderDevtools } from "@json-render/devtools-react";

<div>
  <Renderer spec={spec} registry={registry} />
  <JsonRenderDevtools />
</div>
```

The devtools panel shows the spec tree, state model, resolved props, and visibility evaluations. It tree-shakes to `null` in production builds.

### Step 4: Manual spec inspection

```typescript
function debugSpec(spec: Spec): void {
  const types = new Set<string>();
  const keys = new Set<string>();
  let orphanCount = 0;

  for (const [key, el] of Object.entries(spec.elements)) {
    keys.add(key);
    types.add(el.type);
    for (const childKey of el.children ?? []) {
      if (!spec.elements[childKey]) {
        console.error(`[json-render] Orphan: "${key}" references missing child "${childKey}"`);
        orphanCount++;
      }
    }
  }

  console.log(`[json-render] Spec summary: ${keys.size} elements, ${types.size} types, ${orphanCount} orphans`);
  console.log(`[json-render] Types used:`, [...types].join(", "));
}
```

---

## Catalog Design Methodology

### How many components is too many?

| Catalog Size | AI Behavior | Recommendation |
|-------------|-------------|----------------|
| 1-5 components | High accuracy, fast | Good for focused tools |
| 6-15 components | Good accuracy | Sweet spot for dashboards |
| 16-30 components | Degraded accuracy | Split into domain-specific catalogs |
| 30+ components | Frequent errors | Split mandatory — AI confuses similar components |

### Naming conventions for catalog entries

```text
✅ Good names (unique prefix, clear purpose):
  MetricCard, StatusBadge, DataTable, FilterBar, ChartLine

❌ Bad names (ambiguous, too similar):
  Card1, Card2, Display, View, Component, Item
```

The AI model uses component names as tokens. Names that are distinct and descriptive produce better specs.

### Prompt mode selection

| Mode | When | Output Format |
|------|------|---------------|
| `standalone` | Single prompt → single spec | Pure JSONL patches |
| `inline` | Chat conversation with mixed text+UI | Interleaved text + JSONL |
