# Hivemind Side-Car UI Harness — Architecture Plan

**Date:** 2026-03-30
**Status:** DRAFT — Awaiting user authorization
**Scope:** Full redesign of `apps/side-car/` from static single-page POC to multi-tab, on-demand generative UI harness

---

## 1. Research Synthesis

### json-render Capabilities
- **21 packages**: core, react, ink, shadcn (36 components), mcp, zustand, image, react-pdf, etc.
- **Spec format**: `{ root, elements, state }` — flat element map with dynamic values (`$state`, `$bindState`)
- **36 shadcn components**: Card, Stack, Grid, Tabs, Accordion, Dialog, Drawer, Select, Input, Button, Table, Progress, Badge, Alert, Heading, Text, Image, Avatar, Separator, Pagination, Carousel, Skeleton, Spinner, Tooltip, Popover, DropdownMenu, Checkbox, Radio, Switch, Slider, Toggle, ToggleGroup, ButtonGroup, Link, Textarea, Collapsible
- **Streaming**: JSONL with RFC 6902 patch operations via `useUIStream`
- **MCP server**: `createMcpApp` registers render-ui tool + resource — LLM generates specs directly
- **Actions**: Built-in (`setState`, `pushState`, `removeState`, `log`, `exit`) + custom with Zod params, confirm dialogs, onSuccess/onError chaining
- **State**: `StateStore` with JSON Pointer paths, `useStateStore()` hook, functional updater `SetState`
- **Reference Next.js app**: `apps/web/` has playground with 5 tabs, dashboard example with drag-and-drop widgets

### OpenCode SDK Constraints
- **CAN use externally**: HTTP client, session CRUD, SSE events (`client.event.subscribe()`), TUI control (`client.tui.*`), file ops, project/config
- **CANNOT use externally**: Plugin hooks (`tool.execute.before/after`, `system.transform`, `messages.transform`, `session.compacting`) — these fire in-process only
- **Key gap**: No hook bridge from external side-car to in-process plugins

### Hivemind Data Sources
- `hivemind_runtime_status` — aggregated kernel + supervisor + runtime state (closest to a "dashboard feed")
- `hivemind_agent_work_create_contract` — active contracts, task graphs, workflow phases
- Session journal files — `.hivemind/sessions/journey-events/{sessionId}.json` (SessionV3 records)
- Activity folder — `.hivemind/activity/` (delegation, codescan, agents, state, handoff)
- Plugin hooks write data to disk → side-car reads from disk (file-based bridge)

---

## 2. Architecture Decision: Side-Car Pattern

### Pattern: Read-Observer + TUI-Controller + On-Demand Renderer

```
┌─────────────────────────────────────────────────────────────────────┐
│ OpenCode Process (Plugin)                                          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ Hooks    │  │ Tools    │  │ Features  │  │ Schema Kernel    │ │
│  │ event    │  │ runtime  │  │ contract  │  │ lifecycle records│ │
│  │ tool.exe │  │ doc      │  │ journal   │  │ orchestration    │ │
│  │ compact  │  │ task     │  │ control   │  │ evidence records │ │
│  │ chat.msg │  │ handoff  │  │           │  │ config records   │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘ │
│       │              │              │                  │           │
│       └──────────────┴──────┬───────┴──────────────────┘           │
│                             │                                       │
│                    ┌────────▼────────┐                              │
│                    │  .hivemind/      │  ← File-based bridge        │
│                    │  activity/       │                              │
│                    │  sessions/       │                              │
│                    │  agent-work/     │                              │
│                    └────────┬────────┘                              │
│                             │                                       │
│  ┌──────────────────────────▼─────────────────────────────────┐    │
│  │ OpenCode HTTP/SSE Server                                   │    │
│  │  • client.event.subscribe()  → SSE stream                  │    │
│  │  • client.session.*          → Session CRUD                │    │
│  │  • client.tui.*              → TUI control                 │    │
│  │  • client.file.read()        → File access                 │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTP/SSE
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│ Side-Car (Next.js + json-render)                                    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Shell Layout                                                  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │ Tab 1    │ │ Tab 2    │ │ Tab 3    │ │ Tab N        │   │ │
│  │  │ Dashboard│ │ Settings │ │ Knowledge│ │ On-Demand    │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  │                                                                │ │
│  │  Active Tab Content Area (json-render Renderer)               │ │
│  │  ┌────────────────────────────────────────────────────────┐   │ │
│  │  │  Spec-driven UI via <Renderer spec={spec} registry />  │   │ │
│  │  │  Interactive elements via $bindState + custom actions   │   │ │
│  │  │  Real-time updates via SSE + polling                   │   │ │
│  │  └────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Data sources:                                                       │
│  • SSE from OpenCode → live session events                          │
│  • File reads from .hivemind/ → contract/session/activity data     │
│  • Tool calls via OpenCode client → on-demand queries               │
│  • Spec files written by plugin hooks → dashboard-spec.json etc.   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tab Architecture

### Tab System Design

Each tab is a **spec-driven view** — it receives a JSON spec from a source and renders it via json-render. The shell provides navigation, not content.

```typescript
interface TabDefinition {
  id: string                    // e.g. 'dashboard', 'settings', 'contracts'
  label: string                 // Display name
  icon?: string                 // Optional icon
  specSource: SpecSource        // Where the spec comes from
  refreshInterval?: number      // Auto-refresh in ms (0 = manual only)
  persistent?: boolean          // Keep alive when tab is inactive
}

type SpecSource =
  | { type: 'file'; path: string }                                    // Read from .hivemind/
  | { type: 'api'; endpoint: string }                                  // Fetch from side-car API
  | { type: 'tool'; toolName: string; args: Record<string, unknown> }  // Call OpenCode tool
  | { type: 'sse'; event: string }                                     // Subscribe to SSE event
  | { type: 'static'; spec: Spec }                                     // Inline spec
```

### Phase 1 Tabs (MVP)

| Tab | Label | Spec Source | Refresh | Content |
|-----|-------|-------------|---------|---------|
| 1 | Dashboard | `file: .hivemind/activity/state/dashboard-spec.json` | 5000ms | Runtime metrics, health, recent events |
| 2 | Settings | `tool: hivemind_hm_setting` with `dashboard: true` | Manual | Config groups with interactive forms |
| 3 | Contracts | `file: .hivemind/agent-work-contract/` | 3000ms | Active contracts, task graph, workflow state |
| 4 | Sessions | `file: .hivemind/sessions/` | 5000ms | Session list, turn timeline, event feed |

### Phase 2 Tabs (Future)

| Tab | Label | Content |
|-----|-------|---------|
| 5 | Knowledge | Artifacts, research synthesis, rendered handoff docs |
| 6 | Planner | Task planning, dependency graphs, QA quizzes |
| 7 | Builder (Hivefiver) | Workflow builder, skill composition, agent config |
| 8 | On-Demand | Arbitrary spec pushed by agent via tool call |

---

## 4. Component Architecture

### Shell (`apps/side-car/app/`)

```
app/
├── layout.tsx              ← Root: theme provider, global nav
├── page.tsx                ← Shell: tab bar + active tab content
├── globals.css             ← Tailwind v4 + @source + @theme tokens
├── api/
│   ├── dashboard/route.ts  ← Serves dashboard spec (file read)
│   ├── contracts/route.ts  ← Serves contract data (file scan)
│   ├── sessions/route.ts   ← Serves session journal (file scan)
│   ├── settings/route.ts   ← Calls hivemind_hm_setting tool
│   ├── events/route.ts     ← SSE proxy to OpenCode server
│   └── config/route.ts     ← Write-back for settings persistence
├── components/
│   ├── shell.tsx           ← Tab bar + content area
│   ├── tab-panel.tsx       ← Spec renderer wrapper per tab
│   ├── live-indicator.tsx  ← SSE connection status badge
│   └── toast-provider.tsx  ← Action feedback (save/reset confirmations)
lib/
├── registry.tsx            ← defineRegistry with ALL actions
├── catalog.ts              ← defineCatalog with full shadcn + custom components
├── opencode-client.ts      ← OpenCode SDK client singleton
├── spec-sources.ts         ← Tab → spec source resolution logic
├── actions/
│   ├── settings-actions.ts ← saveSettings, resetSettings, updateConfig
│   ├── contract-actions.ts ← viewContract, activateTask, completeTask
│   └── session-actions.ts  ← viewSession, resumeSession
└── hooks/
    ├── use-sse-events.ts   ← SSE subscription hook
    ├── use-spec-source.ts  ← Tab spec loading + refresh
    └── use-opencode.ts     ← OpenCode client hook
```

### Registry Design

```typescript
// lib/catalog.ts
import { defineCatalog } from '@json-render/core'
import { shadcnComponentDefinitions } from '@json-render/shadcn'
import { z } from 'zod'

export const catalog = defineCatalog(schema, {
  components: {
    ...shadcnComponentDefinitions,
    // Custom Hivemind components (Phase 2)
    SessionTimeline: { props: z.object({ sessionId: z.string() }), description: '...' },
    TaskGraph: { props: z.object({ contractId: z.string() }), description: '...' },
    HealthGauge: { props: z.object({ status: z.string(), label: z.string() }), description: '...' },
  },
  actions: {
    saveSettings: { params: z.object({}), description: 'Persist current settings' },
    resetSettings: { params: z.object({}), description: 'Reset to defaults' },
    viewContract: { params: z.object({ contractId: z.string() }), description: 'Open contract detail' },
    viewSession: { params: z.object({ sessionId: z.string() }), description: 'Open session timeline' },
    executeCommand: { params: z.object({ command: z.string() }), description: 'Run OpenCode command' },
  },
})
```

```typescript
// lib/registry.tsx
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'
import { catalog } from './catalog'
import { settingsActions } from './actions/settings-actions'
import { contractActions } from './actions/contract-actions'

export const { registry, handlers, executeAction } = defineRegistry(catalog, {
  components: {
    ...shadcnComponents,
    // Custom component implementations (Phase 2)
  },
  actions: {
    ...settingsActions,
    ...contractActions,
  },
})
```

---

## 5. Data Flow Patterns

### Pattern A: File-Based (Plugin writes, Side-car reads)

```
Plugin hook fires → writes JSON to .hivemind/activity/state/
Side-car API route → reads file → returns as spec
Tab panel → fetches from API route on interval
```

Used by: Dashboard tab, Contracts tab, Sessions tab

### Pattern B: Tool-Based (Side-car calls OpenCode tool)

```
Tab activates → API route calls hivemind_runtime_status / hivemind_hm_setting
Tool executes inside OpenCode process → returns structured data
API route transforms data into json-render spec → returns spec
Tab panel → renders spec
```

Used by: Settings tab (interactive form generation)

### Pattern C: SSE-Based (Real-time events)

```
OpenCode server emits SSE events (session.created, tool.executed, etc.)
Side-car API route → subscribes via client.event.subscribe()
Events forwarded to browser via EventSource
Tab panel → updates live feed
```

Used by: Dashboard live events, Session timeline

### Pattern D: On-Demand (Agent pushes spec)

```
Agent calls hivemind_runtime_command with spec payload
Plugin hook writes spec to .hivemind/activity/state/on-demand/{id}.json
Side-car detects new file → opens new tab or updates existing
Tab panel → renders arbitrary spec
```

Used by: On-Demand tab (Phase 2), Knowledge tab, Planner tab

---

## 6. CSS/Theme Architecture

Based on the json-render reference app's theme setup:

```css
/* globals.css — Tailwind v4 with full theme */
@import "tailwindcss";

/* Scan node_modules for shadcn component classes */
@source "../../../node_modules/@json-render/shadcn/dist";

/* Design tokens — light theme (default) */
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0.03 260);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0.03 260);
  --color-primary: oklch(0.47 0.22 265);
  --color-primary-foreground: oklch(0.98 0.01 265);
  --color-secondary: oklch(0.96 0.02 260);
  --color-secondary-foreground: oklch(0.145 0.03 260);
  --color-muted: oklch(0.96 0.02 260);
  --color-muted-foreground: oklch(0.55 0.02 260);
  --color-destructive: oklch(0.60 0.25 25);
  --color-destructive-foreground: oklch(0.98 0.01 25);
  --color-border: oklch(0.90 0.02 260);
  --color-input: oklch(0.90 0.02 260);
  --color-ring: oklch(0.47 0.22 265);
  --color-accent: oklch(0.96 0.02 260);
  --color-accent-foreground: oklch(0.145 0.03 260);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0.03 260);
  --radius: 0.625rem;
  --font-sans: 'GeistSans', system-ui, sans-serif;
  --font-mono: 'GeistMono', monospace;
}

/* Dark theme override */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: oklch(0.145 0.03 260);
    --color-foreground: oklch(0.98 0.01 265);
    --color-card: oklch(0.18 0.03 260);
    --color-card-foreground: oklch(0.98 0.01 265);
    --color-primary: oklch(0.65 0.22 265);
    --color-primary-foreground: oklch(0.145 0.03 260);
    --color-muted: oklch(0.25 0.03 260);
    --color-muted-foreground: oklch(0.65 0.02 260);
    --color-border: oklch(0.30 0.03 260);
    --color-input: oklch(0.30 0.03 260);
    --color-ring: oklch(0.65 0.22 265);
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Shell + Dashboard Tab (Current Cycle)
**Goal:** Replace single-page POC with tabbed shell + working dashboard tab

1. Restructure `apps/side-car/` to shell architecture
2. Implement tab bar + tab panel system
3. Wire Dashboard tab to read from `dashboard-spec.json` with 5s polling
4. Fix CSS theme with correct `@source` + `@color-*` prefix + dark mode
5. Redesign dashboard spec to use proper component hierarchy (not text blobs)
6. Wire Save/Reset actions to write back via `/api/config`
7. SSE connection indicator (live status badge)

### Phase 2: Settings + Contracts Tabs
**Goal:** Interactive settings forms + contract/task monitoring

1. Settings tab: spec generated from `hivemind_hm_setting` tool response
2. Settings spec uses proper form components (Input, Select, Tabs) not text dumps
3. Save persists to `.hivemind/` via API route → plugin tool
4. Contracts tab: reads `.hivemind/agent-work-contract/` directory
5. Contract list → click to expand → task graph + workflow phase
6. Actions: viewContract, activateTask (via OpenCode client)

### Phase 3: Sessions + Live Events
**Goal:** Real-time session monitoring

1. Sessions tab: reads `.hivemind/sessions/journey-events/`
2. Session list → click to expand → turn timeline + event feed
3. SSE integration: `client.event.subscribe()` → live event stream
4. Events rendered as real-time feed in dashboard tab
5. Actions: viewSession, resumeSession (via OpenCode client)

### Phase 4: On-Demand Rendering + Knowledge
**Goal:** Agent-driven spec injection

1. On-demand tab: agent pushes spec via tool → appears as new tab
2. Knowledge tab: renders handoff docs, research artifacts, QA quizzes
3. MCP integration: `@json-render/mcp` server for spec generation
4. Custom Hivemind components: SessionTimeline, TaskGraph, HealthGauge

### Phase 5: Builder (Hivefiver)
**Goal:** Visual workflow/skill/agent composition

1. Builder tab: guided wizard for creating commands, skills, agents
2. Drag-and-drop workflow composition (inspired by json-render dashboard example)
3. Schema validation against Hivemind registry
4. Permission conflict detection
5. Generate + download finished artifacts

---

## 8. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | json-render built-in (StateStore) | No need for external state lib — json-render owns component state |
| Tab state | React useState in shell | Simple — tabs are just spec renderers, no complex state |
| Data refresh | Polling (file-based) + SSE (events) | File-based sources poll; SSE for real-time events |
| OpenCode connection | HTTP client (`createOpencodeClient`) | Plugin hooks inaccessible from external — use client API |
| Settings persistence | API route → file write to `.hivemind/` | Side-car can't call tools directly — API route mediates |
| Theme | Tailwind v4 `@theme` with `@source` | Matches json-render reference app |
| Component library | `@json-render/shadcn` (36 components) | Full set covers all UI needs |
| Dark mode | `prefers-color-scheme` media query | System preference, no manual toggle in Phase 1 |
| Spec format | json-render Spec (`{ root, elements, state }`) | Universal across all renderers (React, ink, PDF) |

---

## 9. What Gets Replaced vs. Preserved

### DELETE (POC artifacts)
- `apps/side-car/app/page.tsx` — Replace with shell architecture
- `apps/side-car/app/api/dashboard/route.ts` — Replace with proper API routes
- `apps/side-car/lib/registry.tsx` — Replace with full catalog + actions architecture
- Current `dashboard-spec.json` text-blob spec — Replace with properly structured spec

### PRESERVE
- `apps/side-car/app/globals.css` — Build on the @source + @theme fix already done
- `apps/side-car/app/layout.tsx` — Minor update (add theme provider)
- `apps/side-car/postcss.config.mjs` — Already correct
- `apps/side-car/package.json` — Add dependencies only

### ADD
- Tab shell component
- Tab panel component
- Spec source resolution layer
- OpenCode client singleton
- SSE hook
- Settings write-back API route
- Contracts API route
- Sessions API route
- Actions directory (settings, contracts, sessions)
- Dark mode theme tokens

---

## 10. Dependency Additions

```json
{
  "@json-render/core": "^0.16.0",
  "@json-render/react": "^0.16.0",
  "@json-render/shadcn": "^0.16.0",
  "@opencode-ai/sdk": "^0.6.0",
  "zod": "^4.3.6",
  "lucide-react": "^0.400.0"
}
```

Most already present. New: `lucide-react` for tab icons.
