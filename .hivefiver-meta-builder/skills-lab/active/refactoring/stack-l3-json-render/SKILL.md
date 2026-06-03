---
name: stack-l3-json-render
version: 0.18.x
description: >
  @json-render/react by Vercel Labs — Generative UI framework that constrains AI output
  to structured JSON mapped to predefined React components. Used as the core rendering
  engine for the Hivemind GUI side-car dashboard.
triggers:
  - "json-render"
  - "JSON render"
  - "generative UI"
  - "dashboard widget"
  - "data visualization"
  - "structured UI"
  - "JSON schema UI"
  - "spec stream"
  - "defineCatalog"
  - "defineRegistry"
  - "JSONUIProvider"
  - "useUIStream"
  - "spec-driven UI"
metadata:
  consumed-by:
    - "hf-l2-tool-builder"
    - "hm-l2-researcher"
  lineage-scope: "stack"
  access: "OPEN"

---

# @json-render/react Stack Reference

**Package:** `@json-render/react` + `@json-render/core`
**Maintainer:** Vercel Labs
**Repo:** `vercel-labs/json-render` on GitHub
**Docs:** https://json-render.dev
**License:** Apache 2.0
**Version tracked:** 0.18.x (latest as of 2026-04-28)
**Context7 ID:** `/vercel-labs/json-render`

## Quick Links

- [TOC](./TOC.md) — Full table of contents
- [Architecture](./references/architecture.md) — How json-render works
- [API: Components](./references/api/components.md) — React components and providers
- [API: Schemas](./references/api/schemas.md) — Spec, Catalog, Element schemas
- [API: Rendering](./references/api/rendering.md) — Rendering pipeline
- [API: Types](./references/api/types.md) — TypeScript type reference
- [Patterns: Dashboard](./references/patterns/dashboard.md) — Dashboard development patterns
- [Patterns: Widgets](./references/patterns/widgets.md) — Widget creation patterns
- [Metadata](./metadata.json) — Version and package metadata

## Core Concepts (30-second overview)

1. **Catalog** (`defineCatalog`) — Declares what components and actions AI can use (Zod schemas)
2. **Registry** (`defineRegistry`) — Maps catalog component names to actual React components
3. **Renderer** — Takes a flat JSON spec + registry and renders the React tree
4. **SpecStream** — Progressive streaming of specs via JSON Patch (RFC 6902)
5. **StateStore** — Built-in state management with `$state`, `$cond`, `$bindState` expressions

## Installation

```bash
npm install @json-render/core @json-render/react
# Peer deps: react ^19.0.0, zod ^4.0.0
```

## Minimal Example

```typescript
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { defineRegistry, Renderer } from "@json-render/react";
import { z } from "zod";

// 1. Define catalog (what AI can use)
const catalog = defineCatalog(schema, {
  components: {
    Card: { props: z.object({ title: z.string() }), description: "Card container" },
    Button: { props: z.object({ label: z.string() }), description: "Clickable button" },
  },
});

// 2. Define registry (React implementations)
const { registry } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => <div><h3>{props.title}</h3>{children}</div>,
    Button: ({ props, emit }) => <button onClick={() => emit("press")}>{props.label}</button>,
  },
});

// 3. Render a spec
const spec = {
  root: "card-1",
  elements: {
    "card-1": { type: "Card", props: { title: "Hello" }, children: ["btn-1"] },
    "btn-1": { type: "Button", props: { label: "Click" }, children: [] },
  },
};

<Renderer spec={spec} registry={registry} />;
```

## Related Packages

| Package | Purpose |
|---------|---------|
| `@json-render/shadcn` | 36 pre-built shadcn/ui components |
| `@json-render/devtools-react` | Inspector panel (tree-shakes to null in prod) |
| `@json-render/mcp` | MCP Apps integration |
| `@json-render/zustand` | Zustand state adapter |
| `@json-render/redux` | Redux state adapter |

## Decision Trees

### When to use json-render vs alternatives

```
Need AI-generated UI from prompts? → json-render
Need static dashboards with known layouts? → plain React
Need SEO-critical pages? → RSC (Server Components)
Need complex form validation? → React Hook Form + Zod
```

### State management

```
Read-only display? → $state (built-in StateStore)
Two-way form binding? → $bindState / $bindItem
Already using Zustand? → @json-render/zustand adapter
Need derived values? → $computed + functions prop
```

### Component strategy

```
36 standard UI components fast? → @json-render/shadcn
Custom dashboard? → Own catalog + registry
3D scenes? → @json-render/react-three-fiber
Dev inspector? → @json-render/devtools-react (null in prod)
```

## Ecosystem Routing

| When working on... | Also load... | Because... |
|---------------------|--------------|------------|
| Dashboard consuming OpenCode events | `stack-opencode` | SSE event types, session state for rendering |
| Testing rendering components | `stack-vitest` | Component test patterns with catalog/registry mocks |
| Dashboard in Next.js sidecar | `stack-nextjs` | Server components, route handlers for state reads |
| Schema validation for AI specs | `stack-zod` | Spec validation with validateSpec + autoFixSpec |

## Cross-Stack Integration

- [Integration Guide](./references/integration.md) — Next.js App Router, Vercel AI SDK chat, error boundaries, Vitest testing, code export, debugging workflow, catalog design methodology

## Self-Correction

> Reference documents provide facts, not workflows. When facts conflict with reality, this section guides resolution.

### When Information Is Outdated
1. **Check the version in frontmatter** (currently: 0.18.x) — the package is pre-1.0; expect API churn.
2. **Verify against live docs:** https://json-render.dev for official examples. Use Context7: `npx --yes ctx7 library @json-render/react "defineCatalog API"`.
3. **Check npm registry:** `npm view @json-render/react version` for latest published version, `npm view @json-render/react versions` for changelog timeline.
4. **If zod version differs:** The package peer-depends on `zod ^4.0.0` — Zod v5 may break catalog/registry schemas. Verify compatibility matrix.

### When Unsure About API Accuracy
1. **Corroborate with source:** Read `node_modules/@json-render/react/dist/index.d.ts` and `@json-render/core/dist/index.d.ts` for type definitions.
2. **Check bundled references** (`references/api/components.md`, `references/api/schemas.md`, `references/api/types.md`) — extracted from source at tracked version.
3. **The minimal example (lines 63-95) is the ground truth:** If it doesn't compile, the skill is stale. Report the specific error.

### When the User Contradicts Reference Content
1. **Cite the source:** "This stack-json-render reference (v0.18.x) documents [specific API]. Your version may differ — check `npm list @json-render/react`."
2. **Offer verification:** Run `npm info @json-render/react` to compare installed vs documented versions.
3. **Do not override:** Reference documents are informational — user's project setup has final authority.

### When an Edge Case Is Encountered
1. **Document the gap:** Missing coverage includes SpecStream update semantics, StateStore write-through behavior, catalog/registry mismatch error messages, and Zod v5 compatibility.
2. **Search bundled references** (`references/`) — integration and pattern docs may cover specific scenarios.
3. **Check GitHub issues:** `vercel-labs/json-render` repo for known bugs and workarounds.
4. **Escalate to skill maintainer:** File an update request for recurring edge cases with reproduction steps.
