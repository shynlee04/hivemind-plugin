[LANGUAGE: Write this file in en per Language Governance.]
# Hivemind Sidecar Architecture

> **Phase:** Architecture design (pre-implementation)
> **Date:** 2026-06-02
> **Status:** Draft for review
> **Consumes:** Q2 decision (Next.js 16 + `@json-render/react`), Phase 42 foundation, `src/sidecar/readonly-state.ts`
> **Followed by:** SIDECAR-01 (panels) → SIDECAR-02 (SDK bridge) → SIDECAR-03 (read-only enforcement)

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Communication Flow](#2-communication-flow)
3. [Plugin Startup Integration Sequence](#3-plugin-startup-integration-sequence)
4. [API Endpoint Design](#4-api-endpoint-design)
5. [State Bridge Design](#5-state-bridge-design)
6. [Tool Proxy Design](#6-tool-proxy-design)
7. [json-render Integration Design](#7-json-render-integration-design)
8. [Security Model](#8-security-model)
9. [File Structure](#9-file-structure)
10. [Key Architectural Decisions](#10-key-architectural-decisions)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      HUMAN OPERATOR (Browser)                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js 16 App (Standalone Mode, port 3099)                  │  │
│  │                                                               │  │
│  │  ┌──────────────┐ ┌────────────────┐ ┌────────────────────┐  │  │
│  │  │ Panel 1:     │ │ Panel 2:       │ │ Panel 3: MEMS      │  │  │
│  │  │ Session      │ │ Delegation     │ │ Browser: Graph,    │  │  │
│  │  │ Explorer:    │ │ Dashboard:     │ │ Trajectory,        │  │  │
│  │  │ Tree,        │ │ Active/In-     │ │ Pressure           │  │  │
│  │  │ Timeline,    │ │ Flight,        │ │                    │  │  │
│  │  │ Continuity   │ │ Slots, Status  │ │                    │  │  │
│  │  └──────┬───────┘ └───────┬────────┘ └────────┬───────────┘  │  │
│  │         │                 │                    │              │  │
│  │  ┌──────┴─────────────────┴────────────────────┴───────────┐  │  │
│  │  │  @json-render/react + StateProvider + shadcn/ui          │  │  │
│  │  │  • Unified catalog (36 shadcn + 8 custom components)    │  │  │
│  │  │  • StateStore bound to plugin HTTP responses             │  │  │
│  │  │  • Panel filtering via `panel` prop on container         │  │  │
│  │  └────────────────────────┬─────────────────────────────────┘  │  │
│  │                           │                                     │  │
│  │  ┌────────────────────────┴─────────────────────────────────┐  │  │
│  │  │  Next.js API Routes + Server-Sent Events                │  │  │
│  │  │  Route handlers proxy to plugin HTTP server on localhost │  │  │
│  │  └────────────────────────┬─────────────────────────────────┘  │  │
│  └───────────────────────────┼─────────────────────────────────────┘  │
│                              │ HTTP (localhost:random)                 │
│                              ▼                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Hivemind Plugin (embedded in OpenCode runtime)               │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  Sidecar HTTP/WS Server (localhost, random port)         │  │  │
│  │  │                                                         │  │  │
│  │  │  REST /api/state/*    → readCanonicalState()            │  │  │
│  │  │  REST /api/sessions/* → SessionTracker queries          │  │  │
│  │  │  REST /api/tools/*    → Tool proxy (wraps tool impls)   │  │  │
│  │  │  SSE  /api/events     → Event push (session, deleg)     │  │  │
│  │  │  WS   /ws/delegation  → Streaming delegation output     │  │  │
│  │  │  REST /api/catalog    → json-render catalog spec         │  │  │
│  │  └──────────────────────┬──────────────────────────────────┘  │  │
│  │                         │                                      │  │
│  │  ┌──────────────────────┴──────────────────────────────────┐  │  │
│  │  │  Plugin Modules (dependency-injected via factories)      │  │  │
│  │  │                                                         │  │  │
│  │  │  DelegationManager  SessionTracker  ContinuityStore      │  │  │
│  │  │  Trajectory         Pressure         Config Subscriber    │  │  │
│  │  │  LifecycleManager   runtimePolicy    Event Observers      │  │  │
│  │  └──────────────────────┬──────────────────────────────────┘  │  │
│  │                         │ SDK                                 │  │
│  │  ┌──────────────────────┴──────────────────────────────────┐  │  │
│  │  │  @opencode-ai/plugin  ×  OpenCode Runtime                │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Two-Server Model

The sidecar uses a **two-server architecture** — this is intentional and non-negotiable:

| Server | Location | Port | Access | Purpose |
|--------|----------|------|--------|---------|
| **Next.js app** | `sidecar/` | 3099 (user-facing) | Browser via HTTP | UI rendering, json-render, panels |
| **Plugin HTTP** | `src/sidecar/server/` | Random (localhost) | Next.js only | Data API, tool proxy, state bridge |

**Why not embed Next.js in the plugin?** The plugin runs inside OpenCode's Node.js process. Embedding a full Next.js server would bloat the plugin dependency tree, conflict with the host's React version, and tie the sidecar release cycle to the harness. The two-server model keeps separation of concerns: Next.js owns the UI, the plugin owns the data.

**Why not client-side fetch directly to plugin?** The plugin server binds to a random localhost port discovered at startup. The Next.js server proxies all requests so the browser has a stable URL (`http://localhost:3099/api/...`). The random port is communicated via a well-known sentinel file at `.hivemind/state/sidecar-port.json`.

---

## 2. Communication Flow

### 2.1 Data Flow Matrix

| Direction | Protocol | Transport | When | Example |
|-----------|----------|-----------|------|---------|
| State snapshot read | REST GET | HTTP | On panel mount, manual refresh | `GET /api/state/session-tracker/session_abc/session_abc.md` |
| Command dispatch | REST POST | HTTP | User clicks "abort", "cancel" | `POST /api/tools/delegation-status` |
| Live event push | SSE | HTTP long-hold | Plugin emits session/delegation events | `GET /api/events` |
| Delegation output | WebSocket | WS upgrade | User opens delegation detail panel | `WS /ws/delegation?id=ses_xxx` |
| Catalog retrieval | REST GET | HTTP | On app startup | `GET /api/catalog` |
| Port discovery | File read | Filesystem | Next.js startup | `readFile(.hivemind/state/sidecar-port.json)` |

### 2.2 Startup Sequence (Detailed)

```
Plugin Initialization
  │
  ├── 1. Plugin HTTP server starts on random localhost port
  │     └── Write port to .hivemind/state/sidecar-port.json
  │     └── SSE connection pool initializes (empty)
  │     └── WS server starts on same port (path: /ws/*)
  │
  └── 2. Next.js app starts (user runs `npm run sidecar` or next dev)
        ├── Reads .hivemind/state/sidecar-port.json → discovers PLUGIN_PORT
        ├── Sets PLUGIN_PORT as env variable for route handlers
        ├── Fetches /api/catalog on mount → preloads component specs
        └── Opens SSE connection to plugin → /api/events
```

### 2.3 Request Flow (End-to-End Example: Session Explorer)

```
1. Browser mounts Session Explorer panel
2. json-render resolves $state refs → renders panel skeleton
3. Next.js route handler /api/proxy/state/sessions calls:
     fetch(http://localhost:${PLUGIN_PORT}/api/state/session-tracker)
4. Plugin server:
     a. Validates path against extended CANONICAL_PREFIXES
     b. Appends session tracker root to read state from
     c. Returns { sessions: [...] } JSON
        optionally with cache-control: max-age=5, ETag
5. Next.js caches response in StateStore (5s TTL)
6. json-render components bind to StateStore paths
7. Plugin emits "session.updated" event via SSE
8. Next.js SSE handler receives event → invalidates cache → refetches
9. StateStore.set() triggers json-render re-render
```

---

## 3. Plugin Startup Integration Sequence

### 3.1 Where in `src/plugin.ts`

The sidecar server starts **after tmux integration but before delegation modules** — it must be late enough that the project directory and runtime policy are resolved, but early enough that the port is available for the returned context.

```
Existing plugin.ts sequence (17 steps):
 1. Startup diagnostic                     ─── resolves client
 2. Load runtime policy                    ─── resolves project directory
 3. Load Hivemind config                   ─── resolves hivemindConfig
 4. Create PTY manager                     ─── optional
 5. Create tmux integration                ─── optional
 │
 │  *** SIDECAR SERVER STARTS HERE (new step 5.5) ***
 │
 │  const sidecarServer = createSidecarServer({
 │    port: 0,                        // random port
 │    projectDirectory,
 │    opencodeClient: client,
 │  })
 │  // Fire-and-forget: never blocks plugin init
 │  const sidecarPort = await sidecarServer.start()
 │  // Persist port for Next.js discovery
 │  writeFileSync(
 │    join(projectDirectory, ".hivemind", "state", "sidecar-port.json"),
 │    JSON.stringify({ port: sidecarPort })
 │  )
 │
 6. Create SessionTracker                  ─── needs client + projectRoot
 7. Wire delegation modules                ─── needs everything above
 8. Construct lifecycle manager
 9. Recover pending delegations
10. Drain pending notifications
11. Complete dual-signal wiring
12. Initialize session tracker
13. Run legacy migrations
14. Build hook factories
15. Register 27 tools
16. Return hooks + tools
```

### 3.2 Server Factory Signature

```typescript
// src/sidecar/server/factory.ts
export interface SidecarServerDeps {
  projectDirectory: string
  port: number                    // 0 = random, explicit for tests
}

export interface SidecarServer {
  port: number                    // actual bound port
  close: () => Promise<void>      // cleanup on plugin unload
}

export async function createSidecarServer(
  deps: SidecarServerDeps
): Promise<SidecarServer>
```

### 3.3 Lazy Dependency Binding

The sidecar server cannot eagerly import all plugin modules — many don't exist yet when the server starts. Instead, it uses **lazy dependency binding**: modules register themselves with the server after construction.

```typescript
// src/sidecar/server/registry.ts
export class SidecarDependencyRegistry {
  private _delegationManager?: DelegationManager
  private _sessionTracker?: SessionTracker
  private _client?: OpenCodeClient
  // ... etc

  setDelegationManager(m: DelegationManager): void { this._delegationManager = m }
  get delegationManager(): DelegationManager {
    if (!this._delegationManager) throw new Error("[Harness] Sidecar: DelegationManager not bound yet")
    return this._delegationManager
  }
  // ... same pattern for each dependency

  isReady(): boolean {
    return !!this._delegationManager && !!this._sessionTracker && !!this._client
  }
}
```

Binding happens after each module is constructed in the plugin init sequence:

```typescript
// In plugin.ts:
const sidecarRegistry = new SidecarDependencyRegistry()

const sessionTracker = new SessionTracker({ client, projectRoot: projectDirectory })
sidecarRegistry.setSessionTracker(sessionTracker)

const delegationModules = setupDelegationModules({...})
sidecarRegistry.setDelegationManager(delegationModules.delegationManager)
sidecarRegistry.setClient(client)
```

### 3.4 SSE Event Wiring

The server subscribes to events via the **existing observer chain** — not a new event bus. The event observer factory pattern (already proven in `event-observers.ts`) creates a sidecar-specific observer:

```typescript
// src/sidecar/server/sse-observer.ts
export function createSidecarEventObserver(
  ssePool: SseConnectionPool
): (event: { event: Record<string, unknown> }) => Promise<void> {
  return async ({ event }) => {
    const eventType = event?.eventType ?? event?.type
    if (!eventType) return
    // Forward relevant events to SSE pool
    const relevantTypes = [
      "session.created", "session.updated", "session.idle",
      "session.deleted", "session.error",
      "delegation.dispatched", "delegation.completed",
      "delegation.failed", "delegation.timeout",
    ]
    if (relevantTypes.includes(String(eventType))) {
      ssePool.broadcast({ type: eventType, payload: event, timestamp: Date.now() })
    }
  }
}
```

This observer is registered in the event observer chain (step 14), alongside the existing delegation, session, and tracker consumers.

---

## 4. API Endpoint Design

### 4.1 REST Endpoints — State Reads

All state reads go through `readCanonicalStateAsync()` with extended `CANONICAL_PREFIXES`.

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/api/state/:category/*` | Read file under canonical surface | File contents (JSON string or raw text) |
| `GET` | `/api/state/:category` | List directory contents under canonical surface | `{ entries: [{ name, type, size, mtime }] }` |
| `GET` | `/api/state/snapshot` | Bulk state snapshot for panel initialization | `{ sessions, delegations, trajectory, pressure, config }` |

**Category mapping:**

| `:category` | Resolves to CANONICAL_PREFIX path |
|-------------|----------------------------------|
| `state` | `.hivemind/state/` |
| `sessions` | `.hivemind/session-tracker/` |
| `planning` | `.planning/` |
| `config` | `.opencode/` (read-only primitive inspection) |
| `continuity` | `.hivemind/state/project-continuity.json` (legacy) |

**Caching strategy:**
- `GET /api/state/snapshot` → 5s TTL, ETag-based
- `GET /api/state/:category/*` → 2s TTL, ETag-based
- SSE event `invalidate.cache` → immediate eviction

### 4.2 REST Endpoints — Tool Proxy

| Method | Path | Description | Request Body |
|--------|------|-------------|--------------|
| `POST` | `/api/tools/delegate-task` | Dispatch subagent | `{ agent, prompt, context, stackOnSessionId? }` |
| `POST` | `/api/tools/delegation-status` | Query delegation | `{ delegationId?, action? }` |
| `POST` | `/api/tools/execute-slash-command` | Run slash command | `{ command, arguments?, agent?, subtask? }` |
| `POST` | `/api/tools/hivemind-trajectory` | Trajectory query | `{ action, trajectoryId?, ... }` |
| `POST` | `/api/tools/hivemind-session-view` | Unified session view | `{ action, sessionId }` |
| `POST` | `/api/tools/session-patch` | Patch session file | `{ sessionFilePath, section, newContent }` |
| `POST` | `/api/tools/delegate-cancel` | Cancel delegation | `{ delegationId }` |

**Response envelope (all tool endpoints):**

```typescript
interface ToolResponse<T> {
  ok: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta: {
    duration: number
    tool: string
  }
}
```

### 4.3 SSE Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | SSE stream of live harness events |

**Event types pushed:**

```
event: session.created
data: {"type":"session.created","sessionID":"ses_xxx","timestamp":...}

event: session.updated
data: ...

event: delegation.completed
data: {"type":"delegation.completed","delegationId":"del_xxx","status":"completed"}

event: invalidate.cache
data: {"type":"invalidate.cache","categories":["sessions","delegations"]}

event: heartbeat
data: {"type":"heartbeat","timestamp":...}
```

**Connection management:**
- Pool tracked in `SseConnectionPool` class
- Heartbeat every 30s to keep connection alive
- Automatic cleanup of disconnected clients (on `close`/`error` events)
- Max 50 concurrent SSE connections (configurable via runtime policy)

### 4.4 WebSocket Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `WS` | `/ws/delegation` | Bidirectional delegation streaming |

**Client → Server messages:**
```json
{ "type": "subscribe", "delegationId": "del_xxx" }
{ "type": "unsubscribe", "delegationId": "del_xxx" }
{ "type": "abort", "delegationId": "del_xxx" }
```

**Server → Client messages:**
```json
{ "type": "delegation.output", "delegationId": "del_xxx", "text": "...", "timestamp": ... }
{ "type": "delegation.status", "delegationId": "del_xxx", "status": "running", ... }
{ "type": "delegation.notification", "delegationId": "del_xxx", "notification": {...} }
```

### 4.5 Catalog Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/catalog` | Full json-render catalog spec (pre-generated JSON) |

Returns the complete catalog definition (see [Section 7](#7-json-render-integration-design)) so the Next.js app can initialize json-render at startup without bundling it.

---

## 5. State Bridge Design

### 5.1 Extended Canonical Prefixes

The existing `CANONICAL_PREFIXES` in `src/sidecar/readonly-state.ts` is too narrow for the sidecar's full data needs. Extend it:

```typescript
// src/sidecar/readonly-state.ts — extension
const CANONICAL_PREFIXES = [
  ".hivemind/state",            // Existing: continuity, delegations, etc.
  ".hivemind/session-tracker",  // NEW: session knowledge
  ".opencode",                  // NEW: read-only primitive inspection
  ".planning",                  // Existing: governance artifacts
]
```

**Why each prefix is safe:**

| Prefix | Rationale |
|--------|-----------|
| `.hivemind/state` | Durable JSON state files — read-only display |
| `.hivemind/session-tracker` | Session knowledge captures — read-only display |
| `.opencode/` | Agent/command/skill definitions — metadata only |
| `.planning/` | Governance artifacts — read-only display |

**Rejected prefixes:**
- `src/` — development code, not state
- `node_modules/` — irrelevant
- `tests/` — irrelevant

### 5.2 State Directory Endpoint

The sidecar needs to list directories before reading files. A new `readCanonicalDirectory()` function:

```typescript
export interface DirectoryEntry {
  name: string
  type: "file" | "directory"
  size: number
  mtime: number
}

export function listCanonicalDirectory(
  absoluteDirPath: string,
  opts: ReadOnlyStateOptions
): DirectoryEntry[]
```

This uses `readdirSync` with `withFileTypes: true`, filtered through the same `isCanonicalStatePath()` guard.

### 5.3 Cache Invalidation

```typescript
// src/sidecar/server/cache.ts
interface CacheEntry {
  data: string
  etag: string
  mtime: number
  ttl: number
}

class SidecarStateCache {
  private cache = new Map<string, CacheEntry>()

  get(key: string): { data: string; etag: string } | null
  set(key: string, data: string, ttlMs: number): void
  invalidate(category?: string): void    // category = "sessions" | "delegations" | "all"
}
```

**Invalidation triggers:**
- SSE `invalidate.cache` event received from plugin
- Periodic refresh (configurable, default 10s for snapshot, 2s for individual paths)
- Manual refresh button in panel

### 5.4 Bulk Snapshot Endpoint

The `/api/state/snapshot` endpoint aggregates state for panel initialization in a single request:

```typescript
interface StateSnapshot {
  sessions: SessionSummary[]       // from session-tracker
  delegations: DelegationSummary[] // from continuity/state
  trajectory: TrajectorySummary[]  // from trajectory store
  pressure: PressureMetrics        // from hivemind-pressure
  config: Partial<HivemindConfigs> // from config subscriber
  server: {
    uptime: number
    port: number
    version: string
  }
}
```

This is built by the plugin server reading from the canonical state files + calling in-memory module queries. The Next.js app fetches this once on mount, then relies on SSE events + cache invalidation for incremental updates.

---

## 6. Tool Proxy Design

### 6.1 Architecture

Tool proxy is the **write-side** of the sidecar. It wraps plugin tool invocations behind REST endpoints, using the same dependency-injected factory pattern as plugin.ts.

```
Browser POST /api/tools/delegate-task { agent, prompt }
  → Next.js route handler
    → HTTP POST http://localhost:PLUGIN_PORT/api/tools/delegate-task
      → SidecarServer.handleToolRequest("delegate-task", body)
        → registry.delegationManager.dispatch({ agent, prompt, ... })
        → returns ToolResponse<DelegationResult>
```

### 6.2 Server-Side Router

```typescript
// src/sidecar/server/router.ts
type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResponse<unknown>>

const toolHandlers: Record<string, ToolHandler> = {
  "delegate-task": async (params) => {
    const registry = getRegistry()
    const result = await registry.delegationManager.dispatch({
      agent: String(params.agent),
      prompt: String(params.prompt),
    })
    return { ok: true, data: result, meta: { duration: 0, tool: "delegate-task" } }
  },

  "delegation-status": async (params) => {
    const registry = getRegistry()
    if (params.action === "find-stackable") {
      const result = await registry.delegationStatusFindStackable()
      return { ok: true, data: result, meta: { duration: 0, tool: "delegation-status" } }
    }
    // ... other actions
  },

  "session-patch": async (params) => {
    // Only allow patching session context files (NOT canonical state)
    const { sessionFilePath, section, newContent } = params as any
    if (!isSidecarSessionFilePath(sessionFilePath)) {
      return { ok: false, error: { code: "FORBIDDEN_PATH", message: "..." } }
    }
    // ... delegate to session-patch logic
  },
}
```

### 6.3 Path Safety for session-patch

The `session-patch` tool can write to session context files (which are in the user's project tree, not in `.hivemind/`). The sidecar must enforce:

1. Only write to files matching `**/session-context-prompt.md` or `.hivemind/**` (for journal exports)
2. Never write to canonical state surfaces (SIDECAR-03 enforcement)
3. Reject absolute paths that escape the project root

```typescript
function isSidecarSessionFilePath(absolutePath: string): boolean {
  if (isCanonicalStatePath(absolutePath, opts)) {
    return false  // SIDECAR-03: NEVER write to canonical state
  }
  const basename = path.basename(absolutePath)
  return basename === "session-context-prompt.md"
}
```

### 6.4 Tool Availability

Not all 27 plugin tools are exposed via the sidecar. Selection criteria:

| Exposed | Not Exposed | Rationale |
|---------|-------------|-----------|
| `delegate-task` | `configure-primitive` | Config tools require filesystem write to `.opencode/` — SIDECAR-03 violation |
| `delegation-status` | `bootstrap-init` | Bootstrap tools mutate filesystem state |
| `execute-slash-command` | `bootstrap-recover` | Same as above |
| `session-patch` (restricted) | `prompt-skim` | Only useful in-agent, not in browser |
| `hivemind-trajectory` | `prompt-analyze` | Same as above |
| `hivemind-session-view` | `validate-restart` | Only relevant at plugin start |
| `hivemind-pressure` | `run-background-command` | PTY background command is agent-only |
| `session-tracker` (read-only) | `create-governance-session` | Governance sessions are agent-initiated |
| `session-hierarchy` | `tmux-copilot` | Tmux tools require terminal context |
| `session-context` | `tmux-state-query` | Same as above |
| `session-delegation-query` | All 27 tools available for inspection (read catalog) | |
| `hivemind-doc` (read-only) | | |
| `hivemind-command-engine` (discover) | | |

---

## 7. json-render Integration Design

### 7.1 Catalog Strategy: **Single Unified Catalog**

**Decision: One catalog, not per-panel.** Rationale:

1. **Cross-panel references** — e.g., clicking a session in the Session Explorer opens detail in the Delegation Dashboard. A shared catalog enables component reuse.
2. **Simpler spec generation** — One AJAI-generated or pre-compiled catalog to load at startup.
3. **Smaller bundle** — 44 components (36 shadcn + 8 custom) is well within json-render's single-catalog capability.

### 7.2 Catalog Composition

```typescript
// sidecar/src/lib/catalog.ts
import { defineCatalog } from "@json-render/core"
import { schema } from "@json-render/react/schema"
import { z } from "zod"

export const sidecarCatalog = defineCatalog(schema, {
  components: {
    // ─── shadcn/ui primitives (36 total — representative sample shown) ───
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        format: z.enum(["currency", "percent", "number"]).optional(),
        trend: z.enum(["up", "down", "flat"]).optional(),
        change: z.string().optional(),
      }),
      description: "Display a single metric value with optional trend indicator",
    },
    Table: {
      props: z.object({
        columns: z.array(z.object({ key: z.string(), label: z.string() })),
        dataKey: z.string(),
        pageSize: z.number().optional().default(25),
        sortable: z.boolean().optional().default(true),
      }),
      slots: ["default"],
      description: "Sortable data table for session/delegation lists",
    },
    Tree: {
      props: z.object({
        dataKey: z.string(),
        defaultExpanded: z.boolean().optional().default(false),
      }),
      slots: ["default"],
      description: "Hierarchical tree view for session delegation chain",
    },
    Timeline: {
      props: z.object({
        events: z.array(z.object({
          time: z.string(),
          title: z.string(),
          description: z.string().optional(),
          status: z.enum(["running", "completed", "failed", "pending"]).optional(),
        })),
      }),
      description: "Vertical timeline for session lifecycle events",
    },
    Graph: {
      props: z.object({
        dataKey: z.string(),
        layout: z.enum(["force", "tree", "radial"]).optional().default("force"),
        height: z.number().optional().default(400),
      }),
      description: "Interactive knowledge graph visualization (MEMS browser)",
    },
    // ... remaining shadcn: Button, Input, Select, Card, Badge, Tabs, Dialog, etc.

    // ─── Custom sidecar-specific components (8 total) ───

    SessionTree: {
      props: z.object({
        rootSessionId: z.string(),
        maxDepth: z.number().optional().default(5),
      }),
      description: "Delegation hierarchy tree panel for Session Explorer",
    },
    DelegationStatusBadge: {
      props: z.object({
        status: z.enum(["dispatched", "running", "completed", "error", "timeout", "aborted", "cancelled"]),
        elapsed: z.string().optional(),
      }),
      description: "Color-coded status badge for delegation states",
    },
    ConcurrencySlots: {
      props: z.object({
        used: z.number(),
        total: z.number(),
        perKey: z.record(z.object({ used: z.number(), limit: z.number() })).optional(),
      }),
      description: "Concurrency slot visualization for Delegation Dashboard",
    },
    PressureGauge: {
      props: z.object({
        score: z.number().min(0).max(9),
        tier: z.number().min(0).max(9),
        labels: z.array(z.string()).optional(),
      }),
      description: "Radial gauge showing runtime pressure level (MEMS browser)",
    },
    TrajectoryTimeline: {
      props: z.object({
        events: z.array(z.object({
          phase: z.string(),
          checkpoint: z.string().optional(),
          summary: z.string(),
          timestamp: z.number(),
        })),
      }),
      description: "Execution trajectory event timeline for MEMS browser",
    },
    DecisionAnchor: {
      props: z.object({
        id: z.string(),
        summary: z.string(),
        evidenceRefs: z.array(z.string()),
        timestamp: z.number(),
      }),
      description: "Display a single decision anchor with evidence references",
    },
    CommandInput: {
      props: z.object({
        placeholder: z.string().optional().default("Type a command..."),
        history: z.array(z.string()).optional(),
      }),
      description: "Command dispatch input for Control Panel",
    },
    ConfigEditor: {
      props: z.object({
        schema: z.any(),
        values: z.record(z.unknown()),
      }),
      description: "Runtime policy and config editor for Control Panel",
    },
  },
  actions: {
    navigate: {
      params: z.object({ panel: z.string(), context: z.record(z.unknown()).optional() }),
      description: "Navigate between sidecar panels",
    },
    refresh: {
      params: z.object({ category: z.string() }),
      description: "Force refresh a state category",
    },
    dispatchCommand: {
      params: z.object({ command: z.string(), args: z.string().optional() }),
      description: "Dispatch a slash command via the tool proxy",
    },
    abortDelegation: {
      params: z.object({ delegationId: z.string() }),
      description: "Abort a running delegation",
    },
  },
})
```

### 7.3 Spec Generation Strategy: **Pre-built + Hybrid**

Three-tier spec strategy:

| Tier | Content | Storage | Update cadence |
|------|---------|---------|----------------|
| **Pre-built** | 4 panel layouts (fixed component structure) | Compiled into Next.js app at build time | Per-release |
| **AI-generated** | json-render spec for custom views (filtered list, detail view) | Generated at runtime by the LLM using the catalog | On-demand |
| **Hybrid** | Panel layout is pre-built, content slots are AI-filled | Pre-built skeleton + dynamic `$state` bindings | On mount + SSE events |

The **Hybrid** tier is the primary pattern:

```json
{
  "type": "SessionTree",
  "props": {
    "rootSessionId": { "$state": "/ui/selectedSessionId" }
  },
  "children": [
    {
      "type": "DelegationStatusBadge",
      "props": {
        "status": { "$state": "/sessions/selected/status" },
        "elapsed": { "$state": "/sessions/selected/elapsed" }
      }
    }
  ]
}
```

### 7.4 StateStore Binding

```typescript
// sidecar/src/lib/state-store.ts
import { createStateStore } from "@json-render/react"
import type { StateSnapshot } from "./types"

// Initial state — populated from snapshot endpoint
const store = createStateStore({
  sessions: {},
  delegations: {},
  trajectory: [],
  pressure: { score: 0, tier: 0 },
  config: {},
  server: { uptime: 0, port: 0, version: "" },
  ui: {
    activePanel: "sessions",
    selectedSessionId: null,
    selectedDelegationId: null,
  },
})

// Refresh from snapshot endpoint
export async function refreshSnapshot(): Promise<void> {
  const res = await fetch("/api/proxy/state/snapshot")
  const snapshot: StateSnapshot = await res.json()
  store.set("/sessions", snapshot.sessions)
  store.set("/delegations", snapshot.delegations)
  // ...
}
```

### 7.5 Panel → Catalog Component Mapping

| Panel | Primary Components | Data Sources |
|-------|-------------------|-------------|
| **Session Explorer** | `SessionTree`, `Timeline`, `Table`, `DelegationStatusBadge` | `/api/state/sessions/*`, `/api/state/snapshot` |
| **Delegation Dashboard** | `Metric` (4x: active, queued, completed, failed), `ConcurrencySlots`, `Table`, `DelegationStatusBadge` | `/api/state/continuity`, SSE delegation events |
| **MEMS Browser** | `Graph`, `PressureGauge`, `TrajectoryTimeline`, `DecisionAnchor` | `/api/tools/hivemind-trajectory`, `/api/tools/hivemind-pressure` |
| **Control Panel** | `CommandInput`, `ConfigEditor`, `Button`, code editor | `/api/tools/execute-slash-command`, `/api/state/config` |

---

## 8. Security Model

### 8.1 Principles

1. **localhost-only binding** — The plugin HTTP server binds to `127.0.0.1` on a random port. No external network access.
2. **No authentication** — localhost binding is the only authorization. No API keys, tokens, or sessions needed.
3. **Read-only by default** — All state endpoints enforce SIDECAR-03 path containment. Only explicit tool proxy endpoints allow writes.
4. **Tool proxy whitelist** — Only 12 of 27 tools are exposed via REST (see [6.4](#64-tool-availability)). The excluded ones require filesystem or PTY access that violates the read-only contract.
5. **Session-patch path restriction** — Even for allowed tools, `session-patch` only writes to files matching `session-context-prompt.md`.

### 8.2 Threat Model

| Threat | Mitigation |
|--------|-----------|
| Another process on localhost reads sidecar data | No auth needed — localhost-only binding is the security boundary. Sidecar data is not sensitive (it's state derived from agent sessions) |
| CSRF/clickjacking in browser | Sidecar is a standalone app on port 3099, not embedded in an iframe. Standard CORS: Next.js → plugin uses `localhost`, same origin |
| Path traversal in state reads | `isCanonicalStatePath()` rejects `..` escapes and absolute paths outside project root. Symlink traversal is also rejected |
| Plugin server unload without cleanup | `SidecarServer.close()` stops HTTP server, closes all SSE connections, and cleans up the port file. Registered in `plugin.ts` unload handler |

### 8.3 Port Discovery Security

The random port is written to `.hivemind/state/sidecar-port.json`. This file:
- Is inside a canonical state surface (SIDECAR-03 read, not write)
- Must NOT be parsed by any non-sidecar code
- Contains only `{ "port": <number> }` — no secrets

---

## 9. File Structure

### 9.1 Plugin-Side Server (`src/sidecar/`)

```
src/sidecar/
├── readonly-state.ts              # EXISTING: SIDECAR-03 enforcement (extend CANONICAL_PREFIXES)
├── readonly-state-extensions.ts   # NEW: extended prefixes, directory listing
│
├── server/
│   ├── factory.ts                 # createSidecarServer() — composition root
│   ├── registry.ts                # SidecarDependencyRegistry — lazy binding
│   ├── handler.ts                 # Main HTTP request router
│   ├── routes/
│   │   ├── state.ts               # GET /api/state/*
│   │   ├── sessions.ts            # GET /api/sessions/*
│   │   ├── tools.ts               # POST /api/tools/*
│   │   ├── events.ts              # GET /api/events (SSE)
│   │   ├── delegation-ws.ts       # WS /ws/delegation
│   │   └── catalog.ts            # GET /api/catalog
│   ├── sse/
│   │   ├── pool.ts                # SseConnectionPool
│   │   └── observer.ts            # createSidecarEventObserver
│   ├── ws/
│   │   ├── delegation-stream.ts   # Delegation WebSocket handler
│   │   └── pool.ts                # WsConnectionPool
│   ├── tool-proxy/
│   │   ├── router.ts              # Tool handler registry
│   │   └── handlers/              # Individual tool wrappers
│   │       ├── delegate-task.ts
│   │       ├── delegation-status.ts
│   │       ├── execute-slash-command.ts
│   │       ├── session-patch.ts
│   │       ├── hivemind-trajectory.ts
│   │       ├── hivemind-session-view.ts
│   │       ├── hivemind-pressure.ts
│   │       ├── session-tracker.ts
│   │       ├── session-hierarchy.ts
│   │       ├── session-context.ts
│   │       ├── session-delegation-query.ts
│   │       └── hivemind-command-engine.ts
│   └── cache.ts                   # SidecarStateCache
│
└── types.ts                       # Sidecar-specific types
```

### 9.2 Next.js App (`sidecar/`)

```
sidecar/
├── next.config.ts                  # EXISTING (add output: "standalone", proxies)
├── package.json                    # EXISTING (upgrade to Next.js 16)
├── tsconfig.json                   # EXISTING
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # EXISTING (add StateProvider)
│   │   ├── page.tsx               # EXISTING (replace with dashboard shell)
│   │   ├── loading.tsx            # NEW: loading skeleton
│   │   └── error.tsx              # NEW: error boundary
│   │
│   ├── lib/
│   │   ├── catalog.ts             # NEW: unified json-render catalog
│   │   ├── state-store.ts         # NEW: StateStore + snapshot refresh
│   │   ├── types.ts               # NEW: sidecar types
│   │   ├── plugin-client.ts       # NEW: typed HTTP client to plugin server
│   │   └── constants.ts           # NEW: panel definitions, port config
│   │
│   ├── panels/
│   │   ├── session-explorer/
│   │   │   ├── index.tsx          # Panel 1 composition
│   │   │   └── specs.ts           # Pre-built json-render specs
│   │   ├── delegation-dashboard/
│   │   │   ├── index.tsx
│   │   │   └── specs.ts
│   │   ├── mems-browser/
│   │   │   ├── index.tsx
│   │   │   └── specs.ts
│   │   └── control-panel/
│   │       ├── index.tsx
│   │       └── specs.ts
│   │
│   └── components/               # Custom React components (non-json-render)
│       ├── dashboard-shell.tsx    # Tab layout, navigation
│       └── error-boundary.tsx
│
├── tests/                         # Vitest config for sidecar
│   ├── server/
│   │   ├── handler.test.ts
│   │   ├── state.test.ts
│   │   ├── tools.test.ts
│   │   └── sse.test.ts
│   └── panels/
│       └── specs.test.ts
│
└── README.md                      # EXISTING (update with architecture)
```

### 9.3 Test File Expansion

The existing test at `tests/sidecar/readonly-state.test.ts` expands to:

```
tests/sidecar/
├── readonly-state.test.ts          # EXISTING (update for new prefixes)
├── server/
│   ├── factory.test.ts            # Server lifecycle (start/stop/port)
│   ├── state-route.test.ts        # REST state endpoints
│   ├── tool-proxy.test.ts         # Tool proxy routing
│   ├── sse-pool.test.ts           # SSE connection management
│   ├── delegation-ws.test.ts      # WebSocket streaming
│   └── cache.test.ts              # Cache invalidation
└── catalog.test.ts                 # Catalog completeness
```

---

## 10. Key Architectural Decisions

### Decision 1: Two-Server Model (Plugin HTTP + Next.js Standalone)

**Approach:** The sidecar consists of TWO separate servers — a lightweight HTTP/WS server embedded in the plugin (for data access) and a standalone Next.js app (for UI rendering). They communicate over localhost HTTP.

**Why this over embedding Next.js in the plugin:**
- Plugin dependency tree stays lean (no Next.js, React in `src/`)
- No React version conflict between host OpenCode and sidecar
- Sidecar can be developed, tested, and deployed independently
- Next.js standalone mode (`output: "standalone"`) produces a deployable artifact

**Trade-off:** Two processes to manage. Plugin writes port to a sentinel file; Next.js discovers it at startup.

### Decision 2: Singular Unified json-render Catalog

**Approach:** One catalog defining all 44 components (36 shadcn + 8 custom), not separate catalogs per panel.

**Why one catalog:**
- Enables cross-panel component references (e.g., clicking a session in Explorer → Delegation Dashboard detail)
- Single catalog to load at startup — no lazy-loading complexity
- Pre-built + hybrid spec strategy works cleanly with one catalog
- AI spec generation (for custom views) sees all available components

**Trade-off:** Larger initial catalog size (~44 components). json-render handles this well — 44 components is moderate.

### Decision 3: Lazy Dependency Binding via Registry

**Approach:** The sidecar server starts with empty deps, and plugin modules register themselves with a `SidecarDependencyRegistry` after construction.

**Why not eager DI:**
- The server must start early (step 5.5) before delegation modules (step 7) and session tracker (step 6) exist
- Prevents circular init dependencies
- Enables unit testing with partial mocks

**Trade-off:** Runtime errors if a tool endpoint is called before its dependency is registered. Mitigated by returning `503 Service Unavailable` with a `retry-after` hint.

### Decision 4: SSE for Push Events, WebSocket Only for Delegation Streaming

**Approach:** Use SSE (Server-Sent Events) for the main event push channel, and WebSocket specifically for streaming delegation output.

**Why not WebSocket for everything:**
- SSE is simpler, unidirectional (plugin → browser) which covers 90% of use cases (state updates, session events)
- SSE has built-in reconnection (EventSource API) with `last-event-id`
- WebSocket is only needed for bidirectional streaming (abort commands during delegation output)
- WebSocket adds complexity: upgrade handshake, ping/pong, reconnection logic

**Trade-off:** Two protocols to maintain. But each is simpler than a single WS-only solution that has to handle SSE-like reconnection manually.

### Decision 5: Extended CANONICAL_PREFIXES with Explicit session-tracker Support

**Approach:** Add `.hivemind/session-tracker` and `.opencode` to `CANONICAL_PREFIXES` in the existing readonly-state module.

**Why extend existing:**
- Reuses battle-tested path containment logic (`isCanonicalStatePath()`)
- Existing tests provide regression coverage
- Single source of truth for what the sidecar can read

**Why these specific prefixes:**
- `.hivemind/session-tracker/` — required for Session Explorer panel (the primary panel)
- `.opencode/` — required for the Control Panel's primitive inspector (agent definitions, command definitions)
- `.planning/` — already present, used for governance artifact display

**Not extending with:** `src/`, `tests/`, `node_modules/` — these are development artifacts, not runtime state.

---

## Appendix A: Integration Points Count

| Integration Surface | Files | Panels | Complexity |
|--------------------|-------|--------|------------|
| Delegation (27 tools) | `src/coordination/delegation/**/*.ts` | Sessions, Delegation | High |
| Session Tracker | 33 files in `src/features/session-tracker/` | Sessions, MEMS | High |
| Trajectory | `src/task-management/trajectory/` | MEMS | Medium |
| Pressure | `src/features/runtime-pressure/` | MEMS | Low |
| Config | `src/config/subscriber.ts` | Control | Medium |
| Continuity | `src/task-management/continuity/` | Sessions | Medium |
| Container components | 36 shadcn + 8 custom | All | Low (pre-built) |

## Appendix B: Dependency Graph Summary

```
sidecar/ (Next.js app)
  └── @json-render/react
      ├── catalog.ts ← sidecar/src/lib/catalog.ts
      └── StateProvider ← state-store.ts

sidecar/src/lib/plugin-client.ts
  └── HTTP fetch → http://localhost:{PLUGIN_PORT}/api/*

src/sidecar/server/factory.ts
  ├── Node http module          ← No Express/Fastify dependency
  ├── ws (npm package)          ← Lightweight WS server
  ├── readCanonicalStateAsync() ← From readonly-state.ts
  └── SidecarDependencyRegistry

src/sidecar/server/registry.ts
  └── DelegationManager         ← Injected after construction
  └── SessionTracker            ← Injected after construction
  └── OpenCodeClient            ← Injected after construction
```

## Appendix C: State Shape Reference

```typescript
// The canonical shape returned by /api/state/snapshot
interface SidecarState {
  sessions: Record<string, SessionSummary>
  delegations: Record<string, DelegationSummary>
  trajectory: TrajectoryEvent[]
  pressure: {
    score: number
    tier: number
    timestamp: number
  }
  config: Partial<HivemindConfigs>
  server: {
    uptime: number
    port: number
    version: string
    startedAt: number
  }
}

interface SessionSummary {
  id: string
  status: string
  description: string
  agent?: string
  children: string[]           // child session IDs
  createdAt: number
  updatedAt: number
  depth: number
  toolCallCount?: number
  messageCount?: number
}

interface DelegationSummary {
  id: string
  agent: string
  status: string
  parentSessionId: string
  depth: number
  createdAt: number
  updatedAt: number
  duration?: number
  error?: string
}
```
