# json-render Deep Research Report

**Investigated:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/json-render/repomix-json-render.xml`  
**Date:** 2026-03-30  
**Scope:** Next.js web app, skills catalog, examples, shadcn components, streaming patterns

---

## 1. Next.js Web App (`apps/web/`)

### Directory Structure
```
apps/web/
├── app/
│   ├── (main)/              # Route group with Header layout
│   │   ├── docs/            # MDX documentation pages
│   │   │   ├── api/         # API reference pages (shadcn, react, etc.)
│   │   │   └── *.md/x       # Guide pages
│   │   ├── examples/page.tsx
│   │   ├── layout.tsx       # Main layout with Header
│   │   └── page.tsx         # Homepage with Hero + Demo
│   ├── api/
│   │   ├── generate/route.ts    # Streaming AI generation endpoint
│   │   ├── docs-chat/route.ts
│   │   ├── docs-markdown/route.ts
│   │   └── search/route.ts
│   ├── playground/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css          # Tailwind + custom CSS variables
│   └── layout.tsx           # Root layout with ThemeProvider
├── components/
│   ├── playground.tsx       # Full playground with multi-tab UI
│   ├── header.tsx
│   ├── demo.tsx
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── render/
    │   ├── catalog.ts        # playgroundCatalog
    │   ├── renderer.tsx     # PlaygroundRenderer
    │   └── catalog-display.ts
    └── use-playground-stream.ts
```

### Main Page Component (`apps/web/app/(main)/page.tsx`)
```tsx
// Line 14723-14772
export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1>AI → json-render → UI</h1>
        <Demo /> {/* Interactive demo component */}
        <Button asChild><Link href="/docs">Get Started</Link></Button>
      </section>

      {/* How it works - 3-column grid */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-3 gap-12">
            {/* ... step-by-step explanation */}
          </div>
        </div>
      </section>
    </>
  );
}
```

### Main Layout (`apps/web/app/(main)/layout.tsx`)
```tsx
// Line 14710-14723
export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Root Layout (`apps/web/app/layout.tsx`)
```tsx
// Line 15772-15778
- GeistSans + GeistMono fonts via localFont
- ThemeProvider (next-themes)
- DocsChat component (AI chat for docs)
- Analytics + SpeedInsights (@vercel)
```

### Playground (`apps/web/app/playground/page.tsx`)
```tsx
// Line 15570-15577
export default function PlaygroundPage() {
  return <Playground />; // Full-featured playground component
}
```

### Playground Component Tabs (`apps/web/components/playground.tsx`)
```tsx
// Line 21961-22200+
type Tab = "spec" | "nested" | "stream" | "catalog" | "visual";
type RenderView = "preview" | "code";
type MobileView = "spec" | "nested" | "stream" | "catalog" | "visual" | "preview" | "generated-code";

// Features:
// - Multi-tab interface (spec editor, nested view, stream view, catalog, visual preview)
// - Resizable panels (ResizablePanelGroup)
// - JSONL/YAML format toggle
// - Edit modes: patch, merge, diff
// - Streaming generation via usePlaygroundStream hook
// - Version history tracking
// - Mobile-responsive with separate views
```

### Streaming API Route (`apps/web/app/api/generate/route.ts`)
```typescript
// Line 15212-15311
export async function POST(req: Request) {
  const { prompt, context, format, editModes } = await req.json();
  const isYaml = format === "yaml";
  
  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    system: playgroundCatalog.prompt({ customRules: PLAYGROUND_RULES, editModes }),
    prompt,
  });
  
  return result.toTextStreamResponse(); // SSE streaming
}
```

### CSS/Theme Setup (`apps/web/app/globals.css`)
```css
/* Line 15572-15619 */
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --radius: 0.5rem;
  --background: oklch(1.0 0 0);
  --foreground: oklch(0.1 0 0);
  --card: oklch(0.98 0 0);
  --primary: oklch(0.1 0 0);
  --border: oklch(0.85 0 0);
  /* ... more CSS variables */
}

.dark {
  --background: oklch(0.0 0 0);
  --foreground: oklch(0.98 0 0);
  /* ... dark theme variants */
}
```

### Routing
- **No visible tab navigation** in the main page
- **Docs** use Next.js App Router with `(main)` route group
- **Playground** is at `/playground` with its own layout
- **Examples** page at `/examples` with tag-based filtering

---

## 2. All Skills in `skills/`

### Skills Found

| Skill | Path | Description |
|-------|------|-------------|
| `core` | `skills/core/SKILL.md` | Schema definition, catalogs, spec streaming, state management |
| `react` | `skills/react/SKILL.md` | React renderer, component registries, providers |
| `shadcn` | `skills/shadcn/SKILL.md` | 36 pre-built shadcn/ui components |
| `shadcn-svelte` | `skills/shadcn-svelte/SKILL.md` | 36 shadcn-svelte components for Svelte |
| `next` | `skills/next/SKILL.md` | Next.js integration, Link component |
| `svelte` | `skills/svelte/SKILL.md` | Svelte 5 renderer with runes |
| `vue` | `skills/vue/SKILL.md` | Vue 3 renderer with full feature parity |
| `solid` | `skills/solid/SKILL.md` | SolidJS renderer |
| `codegen` | `skills/codegen/SKILL.md` | Code generation from specs |
| `image` | `skills/image/SKILL.md` | Satori-based image rendering |
| `ink` | `skills/ink/SKILL.md` | Terminal renderer for Ink |
| `jotai` | `skills/jotai/SKILL.md` | Jotai state management integration |
| `mcp` | `skills/mcp/SKILL.md` | MCP server for AI tool integration |
| `react-email` | `skills/react-email/SKILL.md` | React Email integration |
| `react-native` | `skills/react-native/SKILL.md` | Expo/React Native renderer |
| `react-pdf` | `skills/react-pdf/SKILL.md` | PDF generation |
| `react-three-fiber` | `skills/react-three-fiber/SKILL.md` | 3D scenes with Three.js |
| `redux` | `skills/redux/SKILL.md` | Redux state management |
| `remotion` | `skills/remotion/SKILL.md` | Video generation |
| `xstate` | `skills/xstate/SKILL.md` | XState integration |
| `yaml` | `skills/yaml/SKILL.md` | YAML wire format, streaming |
| `zustand` | `skills/zustand/SKILL.md` | Zustand state management |
| `skill-creator` | `skills/skill-creator/SKILL.md` | Creating new skills |
| `remotion-best-practices` | `skills/remotion-best-practices/SKILL.md` | Remotion video guidelines |

### React Skill Key Components
```tsx
// Line 165408-165620
// Providers:
StateProvider      // State management with JSON Pointer paths
ActionProvider     // Handle actions from event system
VisibilityProvider // Conditional rendering
ValidationProvider // Form field validation

// Hooks:
useUIStream        // Streaming spec compilation
useStateStore      // External state access
useStateValue      // Reactive state read
useActions         // Dispatch actions
useIsVisible       // Visibility check
useFieldValidation // Field validation state
useBoundProp       // Two-way binding

// Functions:
defineRegistry     // Create component registry
Renderer           // Main renderer component
JSONUIProvider     // Combined provider wrapper
```

---

## 3. Examples in `examples/`

### Complete Example List (from `apps/web/app/(main)/examples/page.tsx`)

| Slug | Title | Tags | Description |
|------|-------|------|-------------|
| `chat` | Chat | React, Next.js, AI | AI chat with tool calling, streaming UI, rich components |
| `dashboard` | Dashboard | React, Next.js, AI | AI-generated dashboard with drag-and-drop, charts |
| `no-ai` | No AI | React, Next.js | Static specs from hardcoded JSON |
| `svelte` | Svelte | Svelte, Vite | Counter, todo list, two-way binding |
| `svelte-chat` | Svelte Chat | Svelte, SvelteKit, AI | AI chat built with SvelteKit |
| `vue` | Vue | Vue, Vite | Counter, todo list, two-way binding |
| `solid` | Solid | Solid, Vite | Counter, todo list, two-way binding |
| `vite-renderers` | Multi-Framework Renderers | React, Vue, Svelte, Solid, Vite | Same spec across frameworks |
| `react-email` | React Email | React, Email | HTML emails from specs |
| `react-pdf` | React PDF | React, PDF | PDF documents from specs |
| `react-three-fiber` | React Three Fiber | React, 3D | 3D scenes from specs |
| `react-native` | React Native | React Native, Expo | Mobile app rendering |
| `remotion` | Remotion | React, Video | Videos from specs |
| `image` | Image | React, Image | OG images with Satori |
| `ink-chat` | Ink Chat | Ink, Terminal, AI | Terminal chat with Ink |
| `mcp` | MCP App | React, MCP, Vite | MCP server for Claude/ChatGPT |

### Dashboard Example (`examples/dashboard/`)

**Architecture:**
```tsx
// Line 32709-32860+
"use client";

function DashboardContent() {
  // DnD Kit for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // State
  const [savedWidgets, setSavedWidgets] = useState<SavedWidget[]>([]);
  const [newWidgetCount, setNewWidgetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved widgets on mount
  useEffect(() => {
    async function loadWidgets() {
      const res = await fetch("/api/v1/widgets");
      const data = await res.json();
      setSavedWidgets(data.data || []);
    }
    loadWidgets();
  }, []);

  // Drag-and-drop handler
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Reorder and persist
      fetch("/api/v1/widgets/reorder", { method: "POST", ... });
    }
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}>
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {savedWidgets.map(w => (
          <SortableWidget key={w.id} {...w} />
        ))}
        {/* New widget slots */}
        {Array.from({ length: newWidgetCount }).map((_, i) => (
          <AddWidgetCard key={`new-${i}`} onAdd={handleWidgetSaved} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**API Endpoints:**
- `GET /api/v1/widgets` - List widgets
- `POST /api/v1/widgets` - Create widget
- `DELETE /api/v1/widgets/[id]` - Delete widget
- `POST /api/v1/widgets/reorder` - Reorder widgets
- `GET /api/v1/customers`, `POST /api/v1/customers`, etc.
- `GET /api/v1/invoices`, `POST /api/v1/invoices`, etc.
- `GET /api/v1/expenses`, `POST /api/v1/expenses`, etc.

### No Multi-Tab Navigation in Dashboard
The dashboard example does **NOT** have tab navigation. It uses:
- **Drag-and-drop grid** for widget reordering
- **AddWidgetCard** for adding new widgets
- **SortableWidget** for each saved widget

---

## 4. shadcn Component Catalog (36 Components)

### Layout
| Component | Props | Description |
|-----------|-------|-------------|
| **Card** | `title?`, `description?`, `maxWidth?`, `centered?` | Container with optional header |
| **Stack** | `direction?`, `gap?`, `align?`, `justify?` | Flex container |
| **Grid** | `columns` (number), `gap?` | CSS grid layout |
| **Separator** | `orientation?` | Visual divider |

### Navigation
| Component | Props | Description |
|-----------|-------|-------------|
| **Tabs** | `tabs[]`, `defaultValue?`, `value?` | Tabbed navigation |
| **Accordion** | `items[]`, `type?` (single/multiple) | Collapsible sections |
| **Collapsible** | `title`, `open?` | Single collapsible |
| **Pagination** | `totalPages`, `page` | Page navigation |

### Overlay
| Component | Props | Description |
|-----------|-------|-------------|
| **Dialog** | `title?`, `description?`, `openPath?` | Modal dialog |
| **Drawer** | `title?`, `description?`, `openPath?` | Bottom drawer |
| **Tooltip** | `content`, `text` | Hover tooltip |
| **Popover** | `trigger`, `content` | Click popover |
| **DropdownMenu** | `label?`, `items[]` | Dropdown menu |

### Content
| Component | Props | Description |
|-----------|-------|-------------|
| **Heading** | `level` (h1-h4), `children?` | Heading text |
| **Text** | `content`, `variant?` (body, caption, muted, lead, code) | Paragraph |
| **Image** | `src`, `alt`, `width?`, `height?` | Image |
| **Avatar** | `src?`, `name`, `size?` | User avatar |
| **Badge** | `text`, `variant?` (default, secondary, destructive, outline) | Status badge |
| **Alert** | `title`, `message`, `type?` (success, warning, info, error) | Alert banner |
| **Carousel** | `items[]` | Scrollable carousel |
| **Table** | `columns[]`, `rows[][]` | Data table |

### Feedback
| Component | Props | Description |
|-----------|-------|-------------|
| **Progress** | `value`, `max?`, `label?` | Progress bar |
| **Skeleton** | `width?`, `height?`, `rounded?` | Loading placeholder |
| **Spinner** | `size?`, `label?` | Loading spinner |

### Input
| Component | Props | Description |
|-----------|-------|-------------|
| **Button** | `label`, `variant?` (primary, secondary, danger), `disabled?` | Button |
| **Link** | `label`, `href` | Anchor link |
| **Input** | `label?`, `name?`, `type?`, `placeholder?`, `value?`, `checks?` | Text input |
| **Textarea** | `label?`, `name?`, `placeholder?`, `rows?`, `value?`, `checks?` | Multi-line |
| **Select** | `label?`, `name?`, `options[]`, `value?`, `checks?` | Dropdown |
| **Checkbox** | `label?`, `name?`, `checked?`, `checks?`, `validateOn?` | Checkbox |
| **Radio** | `label?`, `name?`, `options[]`, `value?`, `checks?`, `validateOn?` | Radio group |
| **Switch** | `label?`, `name?`, `checked?`, `checks?`, `validateOn?` | Toggle switch |
| **Slider** | `label?`, `min?`, `max?`, `step?`, `value` | Range slider |
| **Toggle** | `label?`, `pressed?`, `variant?` | Toggle button |
| **ToggleGroup** | `items[]`, `type?`, `value?` | Button group |
| **ButtonGroup** | `buttons[]`, `selected?` | Grouped buttons |

### Built-in Actions (automatic)
- `setState` - Set state path value
- `pushState` - Push to array
- `removeState` - Remove array item
- `validateForm` - Validate all fields

### Validation Timing (`validateOn`)
- `"change"` - Default for Select, Checkbox, Radio, Switch
- `"blur"` - Default for Input, Textarea
- `"submit"` - Validate only on form submission

---

## 5. SSE/HTTP/Streaming Patterns

### SpecStream Format (JSONL)
```json
// Line 13521-13526
{"op":"add","path":"/root","value":"root"}
{"op":"add","path":"/elements/root","value":{"type":"Card","props":{"title":"Dashboard"},"children":["metric-1","metric-2"]}}
{"op":"add","path":"/elements/metric-1","value":{"type":"Metric","props":{"label":"Revenue"}}}
{"op":"add","path":"/elements/metric-2","value":{"type":"Metric","props":{"label":"Users"}}}
```

### useUIStream Hook
```tsx
// Line 13622-13648
import { useUIStream } from '@json-render/react';

function App() {
  const {
    spec,           // Current spec state
    isStreaming,    // True while streaming
    error,          // Error if any
    send,           // Send a message
    clear,          // Clear spec
  } = useUIStream({
    api: '/api/generate',
    onComplete: (spec) => { /* handle completion */ }
  });
  
  return (
    <>
      <Renderer spec={spec} registry={registry} />
      {isStreaming && <Spinner />}
    </>
  );
}
```

### Server Streaming with AI SDK
```typescript
// Line 13554-13569
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    system: catalog.prompt(),
    prompt,
  });
  
  return result.toTextStreamResponse(); // Returns SSE stream
}
```

### Low-Level SpecStream Compiler
```typescript
// Line 13574-13601
import { createSpecStreamCompiler } from '@json-render/core';

const compiler = createSpecStreamCompiler<MySpec>();
const decoder = new TextDecoder();

async function processStream(reader) {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const { result, newPatches } = compiler.push(chunk);
    
    if (newPatches.length > 0) {
      setSpec(result);
    }
  }
  return compiler.getResult();
}
```

### Playground Multi-Tab Streaming (`apps/web/components/playground.tsx`)
```tsx
// Line 21961-22200
type Tab = "spec" | "nested" | "stream" | "catalog" | "visual";
type StreamFormat = "jsonl" | "yaml";

// Tabs:
// - spec: Raw JSON/YAML spec editor
// - nested: Human-readable nested tree view
// - stream: Real-time JSONL stream output
// - catalog: Component catalog browser
// - visual: Live rendered preview
```

---

## 6. CSS/Theme Setup Summary

### Theme Variables (`apps/web/app/globals.css`)
```css
:root {
  --radius: 0.5rem;
  --background: oklch(1.0 0 0);
  --foreground: oklch(0.1 0 0);
  --card: oklch(0.98 0 0);
  --card-foreground: oklch(0.1 0 0);
  --popover: oklch(0.98 0 0);
  --popover-foreground: oklch(0.1 0 0);
  --primary: oklch(0.1 0 0);
  --primary-foreground: oklch(1.0 0 0);
  --secondary: oklch(0.92 0 0);
  --secondary-foreground: oklch(0.1 0 0);
  --muted: oklch(0.92 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --accent: oklch(0.92 0 0);
  --accent-foreground: oklch(0.1 0 0);
  --destructive: oklch(0.55 0.2 25);
  --border: oklch(0.85 0 0);
  --input: oklch(0.85 0 0);
  --ring: oklch(0.6 0 0);
  --chat-bg: oklch(0.95 0 0);
}

.dark {
  --background: oklch(0.0 0 0);
  --foreground: oklch(0.98 0 0);
  /* ... similar dark variants */
}
```

### Fonts
- **GeistSans** - Via `next/font/local` from `./fonts/GeistVF.woff`
- **GeistMono** - Via `next/font/local` from `./fonts/GeistMonoVF.woff`
- **GeistPixelSquare** - Pixel font for special effects

### Tailwind
- Tailwind CSS v4 with `@import "tailwindcss"`
- Custom variant: `dark (&:is(.dark *))`
- Animations: `tailwindcss-animate`, `@keyframes` for accordion, tool-shimmer

---

## Key Findings

1. **No Multi-Tab in Main Web App** - The main `apps/web` uses a single-page layout with Header + content. The "multi-tab" experience is in the Playground component.

2. **Dashboard Uses Drag-and-Drop** - The dashboard example uses `@dnd-kit` for reordering widgets, not tabs.

3. **Playground Has 5-Tab Interface** - spec/nested/stream/catalog/visual tabs for development workflow.

4. **SSE via AI SDK** - Uses `streamText().toTextStreamResponse()` from Vercel AI SDK.

5. **36 shadcn Components** - Complete component library with layout, navigation, overlay, content, feedback, and input categories.

6. **Examples Showcase Diversity** - 16 examples covering React, Svelte, Vue, Solid, plus specialized renderers (email, PDF, 3D, video, terminal).
