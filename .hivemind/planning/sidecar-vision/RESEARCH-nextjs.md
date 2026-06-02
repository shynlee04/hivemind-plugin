[LANGUAGE: Write this file in en per Language Governance.]
# Research: Next.js 16 App Router Patterns for Hivemind Sidecar

> **Date:** 2026-06-02
> **Context:** Hivemind sidecar dashboard — reads `.hivemind/state/*.json` filesystem, renders 4 panels via `@json-render/react` v0.19.0, receives SSE live updates from plugin hooks.
> **Sources:** Next.js v16 docs via Context7, vercel/next.js via DeepWiki, vercel-labs/json-render examples (dashboard + apps/web), ai-evals.md

---

## 1. Recommended Architecture: Standard Next.js App + `output: "standalone"`

**Decision: Standard Next.js app process — NOT a plugin child process.**

| Approach | Verdict | Rationale |
|----------|---------|-----------|
| **Standard Next.js app** (`output: "standalone"`) | ✅ **Recommended** | Full Next.js feature set (RSC, API routes, SSE, dynamic imports, middleware). Standalone mode produces a minimal `server.js` that can be `node`-launched independently. |
| Plugin child process (spawned by Hivemind) | ❌ Rejected | Loses hot reload, static generation, RSC streaming, and development tooling. Adds lifecycle complexity for no architectural gain. |
| Custom Express server | ⚠️ Possible but unnecessary | Next.js `custom-server` works but standalone mode achieves the same goal with less code. Custom server only needed if sidecar must integrate with existing Express middleware. |

### Standalone Mode Setup

```js
// next.config.js
module.exports = {
  output: 'standalone',
  // Add this for filesystem access outside `public/`
  // Not needed — Server Components can read any path via process.cwd()
}
```

```bash
# Build
next build            # produces .next/standalone/

# Run (no next CLI needed)
node .next/standalone/server.js

# Or in dev (for development)
next dev              # full HMR, file watching
```

**Key constraint:** The sidecar MUST run alongside an OpenCode session. In dev mode, `next dev` is fine. In production, standalone output produces a self-contained `server.js` that can be launched as a background process.

---

## 2. Server Component: Reading `.hivemind/state/*.json` from Filesystem

### Pattern: `fs.readFileSync` in RSC — Fully Supported ✅

Next.js Server Components can use Node.js `fs` modules directly. The official blog-starter example confirms this pattern: `fs.readFileSync` + `process.cwd()` in a server component or lib utility.

```typescript
// lib/hivemind-state.ts — Server-only utility (never imported from client)
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const HIVEMIND_DIR = join(process.cwd(), '..', '.hivemind') // sidecar lives in project subdir

export interface ContinuityState {
  sessions: Array<{ id: string; status: string; agent: string }>
}

export interface DelegationState {
  delegations: Array<{ id: string; from: string; to: string; status: string }>
}

export function readContinuity(): ContinuityState {
  const path = join(HIVEMIND_DIR, 'state', 'continuity.json')
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw) as ContinuityState
}

export function readDelegations(): DelegationState {
  const path = join(HIVEMIND_DIR, 'state', 'delegations.json')
  const raw = readFileSync(path, 'utf-8')
  return JSON.parse(raw) as DelegationState
}

export function listStateFiles(): string[] {
  const dir = join(HIVEMIND_DIR, 'state')
  return readdirSync(dir).filter(f => f.endsWith('.json'))
}
```

```typescript
// app/dashboard/page.tsx — Server Component (default)
import { readContinuity, readDelegations } from '@/lib/hivemind-state'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const continuity = readContinuity()
  const delegations = readDelegations()

  // Serialize JSON at the RSC boundary; pass plain data to client
  return (
    <DashboardClient
      initialContinuity={continuity}
      initialDelegations={delegations}
    />
  )
}
```

### Cache Considerations

- **RSC data cache:** By default, `readFileSync` in a Server Component is **dynamic** (not cached) during `next dev`. In production (`next build` + standalone), it behaves like SSR — reads on every request unless you opt into caching.
- **No stale-while-revalidate needed** for filesystem reads — they're fast (sub-millisecond for JSON under 1MB).
- **For SSE live updates**, client components poll or stream, so the Server Component serves initial data only.

### Path Resolution

The `.hivemind/` directory lives at the project root (alongside `package.json`), NOT inside the sidecar app. The sidecar app may be:
- A sibling directory: `next-app/` + `.hivemind/` → `join(process.cwd(), '..', '.hivemind')`
- Inside the project: `tools/sidecar/` + `../../.hivemind/` → adjust accordingly.
- **Best practice:** Accept `HIVEMIND_DIR` as an environment variable with a `process.cwd()`-relative fallback.

---

## 3. API Routes for `.hivemind/` Data

### Best Pattern: App Router Route Handlers

```typescript
// app/api/state/route.ts — Read-only API for .hivemind state
import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const HIVEMIND_DIR = process.env.HIVEMIND_DIR || join(process.cwd(), '..', '.hivemind')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const file = searchParams.get('file') // e.g., "continuity", "delegations", "session-tracker"

  if (!file) {
    return Response.json({ error: 'file parameter required' }, { status: 400 })
  }

  const allowedFiles = ['continuity.json', 'delegations.json', 'session-tracker.json']
  const safeFile = file.endsWith('.json') ? file : `${file}.json`

  if (!allowedFiles.includes(safeFile)) {
    return Response.json({ error: 'invalid file' }, { status: 400 })
  }

  try {
    const path = join(HIVEMIND_DIR, 'state', safeFile)
    const raw = readFileSync(path, 'utf-8')
    return Response.json(JSON.parse(raw))
  } catch (err) {
    return Response.json({ error: 'file not found' }, { status: 404 })
  }
}
```

### File Watcher Invalidation Strategy

For real-time updates, **do NOT use file watchers for cache invalidation**. Instead:

1. **SSE endpoint** (Section 4) pushes live deltas from the plugin hooks
2. Client components hold state in-memory, patched by SSE events
3. Initial load comes from the Server Component or this API route
4. File watcher (`fs.watch`) on `.hivemind/state/` is possible but adds complexity for minimal gain — SSE is the designed channel

> **Rationale:** The Hivemind plugin already emits state-change events. The sidecar SSE endpoint bridges those events to browser clients. Watching the filesystem is redundant — the events ARE the source of truth, and the filesystem is the persistence layer.

---

## 4. SSE Endpoint Pattern

### Recommended: App Router Route Handler with Web Streams API

Next.js 16 supports `ReadableStream` in Route Handlers natively. This is the canonical pattern for SSE:

```typescript
// app/api/events/route.ts — SSE endpoint for live plugin events
import { NextRequest } from 'next/server'

// In production, this would connect to an EventEmitter from the plugin
// For now, a simple in-memory broadcast pattern:
interface SSEClient {
  controller: ReadableStreamDefaultController
  id: string
}

const clients = new Map<string, SSEClient>()

export function broadcast(event: string, data: unknown) {
  const encoder = new TextEncoder()
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  for (const [id, client] of clients) {
    try {
      client.controller.enqueue(encoder.encode(message))
    } catch {
      clients.delete(id)
    }
  }
}

export async function GET(request: NextRequest) {
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, { controller, id: clientId })

      // Send initial heartbeat
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`event: connected\ndata: {"clientId":"${clientId}"}\n\n`))
    },
    cancel() {
      clients.delete(clientId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',     // Disable nginx buffering
    },
  })
}

// Session stats endpoint — periodic heartbeat
export async function POST(request: NextRequest) {
  const payload = await request.json()
  broadcast('state-update', payload)
  return Response.json({ ok: true })
}
```

### Plugin Hook Integration

The Hivemind plugin hooks (PostToolUse, PostMessage) would call a local HTTP POST to `/api/events`:

```typescript
// In the Hivemind plugin's PostToolUse hook:
await fetch('http://localhost:3456/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'delegation-update', sessionId, status: 'running' }),
})
```

Or more efficiently, use a shared `EventEmitter` if the sidecar runs in the same process as the plugin (not recommended — keep them separate).

### Client-Side SSE Consumption

```typescript
// components/use-sse.ts
'use client'

import { useEffect, useState } from 'react'

export function useSSE(url: string) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<{ event: string; data: unknown } | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(url)

    eventSource.onopen = () => setConnected(true)
    eventSource.onerror = () => setConnected(false)

    // Generic handler for all event types
    eventSource.addEventListener('state-update', (e) => {
      setLastEvent({ event: 'state-update', data: JSON.parse(e.data) })
    })

    eventSource.addEventListener('delegation-update', (e) => {
      setLastEvent({ event: 'delegation-update', data: JSON.parse(e.data) })
    })

    return () => eventSource.close()
  }, [url])

  return { connected, lastEvent }
}
```

---

## 5. Client Boundary Strategy

### `"use client"` Boundaries

```
app/
├── layout.tsx              ← SERVER COMPONENT (root layout, metadata)
├── page.tsx                ← SERVER COMPONENT (fetch initial data)
├── dashboard/
│   ├── page.tsx            ← SERVER COMPONENT (read .hivemind/ state)
│   └── dashboard-client.tsx ← CLIENT COMPONENT (json-render Renderer, SSE, interactivity)
├── api/
│   ├── state/route.ts      ← SERVER (Route Handler, filesystem reads)
│   └── events/route.ts     ← SERVER (SSE Route Handler)
└── panels/
    ├── sessions-panel.tsx   ← CLIENT COMPONENT (json-render spec or custom)
    ├── delegations-panel.tsx ← CLIENT COMPONENT
    ├── memory-panel.tsx     ← CLIENT COMPONENT
    └── config-panel.tsx     ← CLIENT COMPONENT
```

### json-render Renderer: `next/dynamic({ ssr: false })` ✅

```typescript
// components/json-render-dashboard.tsx
'use client'

import dynamic from 'next/dynamic'
import { StateProvider, VisibilityProvider, ActionProvider, ValidationProvider } from '@json-render/react'
import { registry } from '@/lib/render/registry'

// SSR: false — json-render's Renderer uses browser APIs for streaming UI
const Renderer = dynamic(
  () => import('@json-render/react').then(mod => mod.Renderer),
  { ssr: false, loading: () => <div className="p-4 animate-pulse">Loading dashboard...</div> }
)

export function JsonRenderDashboard({ spec }: { spec: any }) {
  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider handlers={{ /* ... */ }}>
          <ValidationProvider customFunctions={{}}>
            <Renderer spec={spec} registry={registry} loading={false} />
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  )
}
```

**Why `ssr: false`:** json-render's `Renderer` depends on streaming JSON spec parsing and browser-based rendering — it has no meaningful server-side output. Disabling SSR avoids hydration mismatches and reduces server bundle size.

### Data Flow

```
Filesystem (.hivemind/state/*.json)
      │
      ▼
Server Component (app/dashboard/page.tsx)
  - reads via fs.readFileSync at request time
  - passes serialized JSON as props to client
      │
      ▼
Client Component (app/dashboard/dashboard-client.tsx)
  - receives initial state as props
  - opens SSE connection for live updates
  - dispatches to individual panel components
      │
      ├── sessions-panel (json-render spec or custom React)
      ├── delegations-panel
      ├── memory-panel
      └── config-panel
```

---

## 6. Layout Design: 4-Panel Dashboard

### Recommended: CSS Grid Layout with Route Groups

```typescript
// app/dashboard/layout.tsx — Server Component layout for dashboard section
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen">
      {children}
    </div>
  )
}
```

```typescript
// app/dashboard/page.tsx
import { readContinuity, readDelegations } from '@/lib/hivemind-state'
import DashboardShell from './dashboard-shell'

export default async function DashboardPage() {
  const [continuity, delegations] = await Promise.all([
    readContinuity(),
    readDelegations(),
  ])
  return <DashboardShell initialContinuity={continuity} initialDelegations={delegations} />
}
```

```typescript
// app/dashboard/dashboard-shell.tsx
'use client'

import { SessionsPanel } from '@/components/panels/sessions-panel'
import { DelegationsPanel } from '@/components/panels/delegations-panel'
import { MemoryPanel } from '@/components/panels/memory-panel'
import { ConfigPanel } from '@/components/panels/config-panel'
import { DashboardHeader } from '@/components/dashboard-header'
import { useSSE } from '@/hooks/use-sse'
import type { ContinuityState, DelegationState } from '@/lib/hivemind-state'

interface Props {
  initialContinuity: ContinuityState
  initialDelegations: DelegationState
}

export default function DashboardShell({ initialContinuity, initialDelegations }: Props) {
  const { connected, lastEvent } = useSSE('/api/events')

  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader connected={connected} />
      <main className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
        <SessionsPanel initialData={initialContinuity} />
        <DelegationsPanel initialData={initialDelegations} />
        <MemoryPanel />
        <ConfigPanel />
      </main>
    </div>
  )
}
```

### Alternative: Parallel Routes for Independent Loading

For more complex scenarios where each panel loads independently:

```typescript
// app/(dashboard)/@sessions/page.tsx
// app/(dashboard)/@delegations/page.tsx
// app/(dashboard)/@memory/page.tsx
// app/(dashboard)/@config/page.tsx
```

Parallel routes allow each panel to have its own loading state (`loading.tsx`) and error boundary (`error.tsx`). However, since all panels share the same data source, a single unified client component with sub-components is simpler.

---

## 7. Bundle Optimization

### Estimated Bundle Impact

| Package | Estimated Size (gzip) | Notes |
|---------|-----------------------|-------|
| `@json-render/react` | ~15 KB | Core Renderer + providers + hooks |
| `@json-render/core` | ~8 KB | Schema definition, catalog |
| `@json-render/shadcn` | ~30 KB | 36 pre-built components (tree-shakable) |
| `@radix-ui/*` (via shadcn) | ~40 KB | Primitives (tree-shakable) |
| `shadcn/ui` components | ~50 KB | Depends on which components used |
| Tailwind CSS | ~10 KB | After purge (only used classes) |
| **Total per lazy-loaded panel** | **~50-70 KB** | Only loaded when user visits dashboard |

### Lazy Loading Strategy

```typescript
// Per-panel lazy loading
const SessionsPanel = dynamic(() => import('@/components/panels/sessions-panel'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
})
const DelegationsPanel = dynamic(() => import('@/components/panels/delegations-panel'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
})
const MemoryPanel = dynamic(() => import('@/components/panels/memory-panel'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
})
const ConfigPanel = dynamic(() => import('@/components/panels/config-panel'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
})
```

This ensures each panel is a separate JS chunk, loaded in parallel by the browser.

### Tree-Shaking `@json-render/shadcn`

Import only the components you use:

```typescript
// lib/render/registry.tsx
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'

// Only import Card, Stack, Heading, Badge, Button
const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Badge: shadcnComponents.Badge,
    Button: shadcnComponents.Button,
  },
})
```

Next.js 16's bundler (Turbopack in dev, Webpack/Rust in prod) tree-shakes unused exports from `@json-render/shadcn` automatically.

---

## 8. Static Generation Assessment

### Verdict: `output: "export"` — NOT Recommended ❌

| Feature | Requires Server | Static Export (`output: "export"`) |
|---------|----------------|-------------------------------------|
| SSE live updates | ✅ Yes | ❌ Impossible |
| Dynamic `.hivemind/` file reads | ✅ Yes | ❌ Build-time only |
| API routes | ✅ Yes | ❌ Requires separate server |
| Route handlers | ✅ Yes | ❌ Not available |
| RSC with filesystem reads | ✅ Yes | ❌ Static at build time |
| Deployment simplicity | ❌ Complex | ✅ Just static files |

**Conclusion:** The sidecar MUST be a running server. `output: "standalone"` is the right choice — it produces a minimal Node.js server without requiring Vercel deployment.

### Generate static params for non-dynamic pages if needed

```typescript
// app/(static)/about/page.tsx — could be static, but not valuable for a dashboard
```

---

## 9. Architectural Summary

```
┌─────────────────────────────────────────────────────┐
│                  Next.js 16 App                      │
│                  output: "standalone"                │
│                  port: 3456                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐    ┌──────────────────────────┐    │
│  │ Server Comp. │    │   Route Handlers (API)   │    │
│  │              │    │                          │    │
│  │ fs.readFile  │    │  /api/state    → JSON    │    │
│  │ .hivemind/*  │    │  /api/events   → SSE     │    │
│  │              │    │                          │    │
│  │ Pass as      │    │  Plugin hooks POST       │    │
│  │ props to     │    │  to /api/events          │    │
│  │ client       │    │                          │    │
│  └──────┬───────┘    └────────────┬─────────────┘    │
│         │                         │                   │
│         ▼                         ▼                   │
│  ┌─────────────────────────────────────────────┐     │
│  │      Client Component (dashboard-shell)      │     │
│  │                                              │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──┐│     │
│  │  │Sessions  │ │Delegation│ │ Memory   │ │  ││     │
│  │  │Panel     │ │Panel     │ │ Panel    │ │Cfg││     │
│  │  │          │ │          │ │          │ │  ││     │
│  │  │json-r    │ │json-r    │ │Custom    │ │  ││     │
│  │  │ender     │ │ender     │ │React     │ │  ││     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──┘│     │
│  │  ┌──────────── SSExEventSource ────────────┐ │     │
│  │  │     Live updates from plugin hooks      │ │     │
│  │  └──────────────────────────────────────────┘ │     │
│  └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
         ▲
         │ localhost POST
         │
┌──────────────────┐
│  Hivemind Plugin  │
│  (OpenCode hooks)  │
│                    │
│  PostToolUse ──────┼──→ POST /api/events { type, data }
│  PostMessage ──────┤
│                    │
│  Writes .hivemind/ │
│  state/*.json      │
└────────────────────┘
```

### Key Recommendations

| # | Recommendation | Rationale |
|---|---------------|-----------|
| 1 | **Standard Next.js app with `output: "standalone"`** | Full RSC/API/SSE support; minimal production server via `node server.js` |
| 2 | **Server Components read `.hivemind/` filesystem via `fs.readFileSync`** | Official Next.js pattern (blog-starter, MDX examples); no DB needed |
| 3 | **SSE via `ReadableStream` in App Router Route Handler** | Canonical Next.js 16 streaming pattern; EventSource on client side |
| 4 | **`next/dynamic({ ssr: false })` for json-render `Renderer`** | Prevents hydration mismatch; splits into separate JS chunks |
| 5 | **Lazy-load per panel with `next/dynamic`** | Each panel is ~50-70 KB; parallel loading from browser |
| 6 | **`HIVEMIND_DIR` environment variable for path resolution** | Sidecar can be located anywhere relative to `.hivemind/` |
| 7 | **Do NOT use static export (`output: "export"`)** | SSE + dynamic API routes require a running server |
| 8 | **Do NOT use `fs.watch` for state invalidation** | SSE events from plugin hooks are the designed live channel; filesystem is persistence layer |
| 9 | **Port: 3456** (unlikely to conflict with 3000/app or 5173/vite) | Configurable via `PORT` env var |
| 10 | **json-render catalog + shadcn is appropriate for panels** | Pre-built components keep bundle small; tree-shaken by Turbopack |

---

## Sources

- Next.js v16 docs (Context7: `/vercel/next.js`)
  - Server Component file reading: `blog-starter/src/lib/api.ts`
  - Route Handler streaming: `docs/01-app/02-guides/streaming.mdx`
  - SSE pattern: `docs/01-app/03-api-reference/03-file-conventions/route.mdx` (ReadableStream + async iterator)
  - Standalone output: `docs/01-app/03-api-reference/05-config/01-next-config-js/output.mdx`
  - Dynamic imports: `docs/01-app/02-guides/lazy-loading.mdx`
  - Custom server: `docs/01-app/02-guides/custom-server.mdx`
  - App Router migration (layouts + client boundaries): `docs/01-app/02-guides/migrating/app-router-migration.mdx`
- vercel/next.js repository (DeepWiki): Build system, rendering pipeline, client router
- vercel-labs/json-render repository:
  - `examples/dashboard/` — Full dashboard example with shadcn/ui, DnD, Recharts, Drizzle ORM
  - `apps/web/` — Docs playground with json-render demo
  - `examples/dashboard/app/api/generate/route.ts` — API route with rate limiting
  - `examples/dashboard/lib/render/registry.tsx` — Component registry with 350+ lines of shadcn + custom components
  - `examples/dashboard/lib/render/renderer.tsx` — DashboardRenderer wrapping StateProvider, VisibilityProvider, ActionProvider
  - `skills/next/SKILL.md` — `@json-render/next` package for full Next.js app generation
- `@json-render/react` v0.19.0: `useUIStream`, `Renderer`, `StateProvider`, `VisibilityProvider`, `ActionProvider`, `DataProvider`
- `@json-render/shadcn`: 36 pre-built shadcn/ui component definitions
