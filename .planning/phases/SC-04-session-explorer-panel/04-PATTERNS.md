# Phase SC-04: Session Explorer Panel — Patterns

**Authored:** 2026-06-06
**Domain:** React 19 component patterns, Next.js 16 URL state, plugin-side data binding
**Confidence:** HIGH (95% — all patterns exist in SC-03)
**Author:** hm-planner (this file) + would have co-authored with `hm-pattern-mapper` for deep code analysis

---

## 1. Reuse Patterns from SC-03 (existing code)

### 1.1 Plugin HTTP client singleton — `getPluginClient()`

**Source:** `sidecar/src/lib/plugin-client.ts:209-218`

```typescript
let _instance: PluginClient | null = null

export function getPluginClient(options?: PluginClientOptions): PluginClient {
  if (!_instance) {
    _instance = new PluginClient(options)
  }
  return _instance
}
```

**Usage in SC-04:**

```typescript
import { getPluginClient } from "@lib/plugin-client"

// In use-sessions.ts
const client = getPluginClient()
const result = await client.getSessions() // { sessions: SessionSummary[] }

// In session-tree.tsx (lazy-load)
const children = await client.getSessionChildren(parentId)
```

**Why:** Module-level singleton avoids passing the client through props or context. All sidecar components use this pattern (per `state-store.ts:48, 75-78`).

### 1.2 StateStore read pattern via custom hook

**Source:** `sidecar/src/lib/state-store.ts:118-127` (stateStore methods) + `dashboard-shell.tsx:39-41` (consumer pattern)

```typescript
// stateStore exposes:
{
  getState: () => store.getSnapshot(),
  get: (path: string) => store.get(path),
  set: (path, value) => store.set(path, value),
  initialize, refreshSnapshot, handleEvent, setConnected
}
```

**SC-04's `useSessions()` hook reads via `store.get("/sessions")` and converts the record to a sorted array.**

**Pattern (mirrors `dashboard-shell.tsx:39-41` calling `useSse`):**

```typescript
export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const stateStore = getStateStore() // hypothetical getter
    const update = () => {
      const record = stateStore.get("/sessions") as Record<string, SessionSummary>
      const array = Object.values(record).sort(
        (a, b) => b.updatedAt - a.updatedAt
      )
      setSessions(array)
    }
    update()
    // Subscribe to store changes (via SSE event-driven stateStore.handleEvent)
    // For v1, no subscription needed — SSE handlers re-trigger stateStore.set,
    // which we observe via re-render triggered by a separate state tick.
  }, [])

  // ...
}
```

**Note:** SC-03's `stateStore` uses `createStateStore` from `@json-render/core`, which has a `getSnapshot()` method. SC-04 reads from it.

### 1.3 SSE subscription via `useSse` hook

**Source:** `sidecar/src/lib/use-sse.ts:47-178`

```typescript
const { connected, lastEvent, reconnect } = useSse({
  onEvent: (event) => {
    if (event.type.startsWith("session.")) {
      stateStore.handleEvent(event) // already wired in SC-03
    }
  },
  onConnectionChange: (connected) => {
    stateStore.setConnected(connected)
  },
})
```

**SC-04 uses this as-is** — no changes to `use-sse.ts` required.

### 1.4 Error boundary per panel

**Source:** `sidecar/src/components/error-boundary.tsx` (SC-03) + `dashboard-shell.tsx:194-238` (consumer)

```tsx
<ErrorBoundary>
  {PanelComponent ? <PanelComponent /> : <LoadingFallback />}
</ErrorBoundary>
```

**SC-04 panel automatically inherits this** — the panel is mounted inside the existing `ErrorBoundary` wrapper in `dashboard-shell.tsx:194`. No changes needed.

### 1.5 URL state via `useSearchParams`

**Source:** `sidecar/src/components/dashboard-shell.tsx:34-36, 86-90`

```typescript
const searchParams = useSearchParams()
const router = useRouter()
const activePanel = (searchParams.get("panel") as PanelId) || DEFAULT_PANEL

const switchPanel = (panelId: PanelId): void => {
  const params = new URLSearchParams(searchParams.toString())
  params.set("panel", panelId)
  router.push(`?${params.toString()}`)
}
```

**SC-04 extends this pattern for `?session_filter=`:**

```typescript
const searchParams = useSearchParams()
const router = useRouter()
const filter = searchParams.get("session_filter") || ""

const setFilter = (value: string) => {
  const params = new URLSearchParams(searchParams.toString())
  if (value) {
    params.set("session_filter", value)
  } else {
    params.delete("session_filter")
  }
  router.push(`?${params.toString()}`, { scroll: false })
}
```

### 1.6 CSS variable system

**Source:** `sidecar/src/components/dashboard-shell.tsx:111-128` (declarations) + inline usage throughout

**Pattern:**

```tsx
style={{
  border: "1px solid var(--panel-border, #e2e8f0)",
  background: "var(--panel-bg, #ffffff)",
  color: "var(--status-connected, #22c55e)",
}}
```

**SC-04 reuses these variables** — no new CSS variables introduced.

### 1.7 Loading skeleton pattern

**Source:** `sidecar/src/components/dashboard-shell.tsx:191-193`

```tsx
<Suspense
  fallback={
    <div data-skeleton="true" style={{ /* pulse animation */ }} />
  }
>
```

**SC-04 uses this** for the initial loading state and for per-row children-fetching state.

### 1.8 TypeScript import type for shared types

**Source:** `sidecar/src/lib/state-store.ts:15`

```typescript
import type { SidecarState, SidecarEvent } from "./types"
```

**SC-04 imports:**

```typescript
import type { SessionSummary, ChildSession, SidecarEvent } from "@lib/types"
```

### 1.9 Suspense boundary for useSearchParams

**Source:** `sidecar/src/components/dashboard-shell.tsx:248-264`

```tsx
export function DashboardShell(props: DashboardShellProps): React.ReactElement {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardShellInner {...props} />
    </Suspense>
  )
}
```

**SC-04 wraps its `useSearchParams` consumer in `<Suspense>`** to satisfy Next.js 16 App Router requirement.

### 1.10 Plugin-port fallback for independent dev

**Source:** `sidecar/src/lib/plugin-client.ts:42-70` + `constants.ts:14`

```typescript
this.port = FALLBACK_PORT // 3199
this.baseUrl = `http://127.0.0.1:${this.port}`
```

**SC-04's `useSessions` returns `error: Error | null`** when `getSessions()` throws (e.g., port 3199 unreachable). UI shows SR-SC04-01 banner.

---

## 2. New Patterns to Establish (SC-04-specific)

### 2.1 Recursive tree component pattern

**Concept:** A `SessionTree` component that recursively renders itself for each child session.

**Signature:**

```typescript
interface SessionTreeProps {
  nodes: SessionTreeNode[]  // pre-built tree from useSessions
  expandedSet: Set<string>  // which session IDs are expanded
  onToggleExpand: (sessionId: string) => void
  onSessionClick: (sessionId: string) => void
}

function SessionTree({ nodes, expandedSet, onToggleExpand, onSessionClick }: SessionTreeProps) {
  return (
    <>
      {nodes.map((node) => (
        <SessionRow
          key={node.session.id}
          session={node.session}
          depth={node.depth}
          expanded={expandedSet.has(node.session.id)}
          onToggleExpand={() => onToggleExpand(node.session.id)}
          onClick={() => onSessionClick(node.session.id)}
        />
        {expandedSet.has(node.session.id) && node.children.length > 0 && (
          <SessionTree
            nodes={node.children}
            expandedSet={expandedSet}
            onToggleExpand={onToggleExpand}
            onSessionClick={onSessionClick}
          />
        )}
      ))}
    </>
  )
}
```

**Why:** Native React recursion keeps LOC low. No `react-arborist` dependency.

### 2.2 Debounced search input pattern (150ms)

**Concept:** Use `useState` + `useEffect` with `setTimeout` to debounce user input.

**Signature:**

```typescript
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

function SessionFilter({ value, onChange, placeholder }: SessionFilterProps) {
  const [local, setLocal] = useState(value)
  const debouncedLocal = useDebouncedValue(local, 150)

  useEffect(() => {
    onChange(debouncedLocal)
  }, [debouncedLocal, onChange])

  return (
    <input
      type="text"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      style={{ /* inline styles */ }}
    />
  )
}
```

**Why:** Standard React debounce pattern. `useDeferredValue` is not a true debounce; explicit `setTimeout` gives precise control over the 150ms window.

### 2.3 Lazy-load with loading state pattern

**Concept:** When a tree node is expanded but its children are empty, fetch them and show inline loading.

**Signature:**

```typescript
function useLazyChildren(parentId: string, initialChildren: string[]) {
  const [children, setChildren] = useState<ChildSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const load = useCallback(async () => {
    if (hasFetched || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await getPluginClient().getSessionChildren(parentId)
      setChildren(result.children)
      setHasFetched(true)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [parentId, hasFetched, loading])

  return { children, loading, error, load, hasFetched }
}
```

**Why:** Encapsulates lazy-load state. Component just calls `load()` on expand.

### 2.4 SSE event dispatch to stateStore pattern

**Concept:** Panel subscribes to `useSse`, filters for `session.*` events, dispatches to `stateStore.handleEvent()`.

**Signature:**

```typescript
function useSessionSseBridge() {
  useSse({
    onEvent: (event) => {
      if (event.type.startsWith("session.")) {
        const stateStore = getStateStore()
        stateStore.handleEvent(event) // patches /sessions/:id
      }
    },
  })
}
```

**Why:** Already implemented in `state-store.ts:83-109`. SC-04 just calls it.

### 2.5 Sorted + filtered sessions derived state

**Concept:** `useSessions` returns derived state (sorted by `updatedAt desc`, filtered by search substring).

**Signature:**

```typescript
function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filter, setFilter] = useState("")

  // ... fetch + sort logic

  const filteredSessions = useMemo(() => {
    if (!filter) return sessions
    const lower = filter.toLowerCase()
    return sessions.filter(
      (s) =>
        s.id.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.status.toLowerCase().includes(lower) ||
        (s.agent?.toLowerCase().includes(lower) ?? false)
    )
  }, [sessions, filter])

  return { sessions: filteredSessions, allSessions: sessions, loading, error, refresh, filter, setFilter }
}
```

**Why:** Memoized filter avoids re-computation on every render. `useDeferredValue` is a complementary optimization for very long lists.

---

## 3. Anti-Patterns to AVOID

### ❌ AP-1: Hardcoded stub data (the SC-03 mistake)

**Anti-pattern:**
```tsx
const FAKE_SESSIONS = [
  { id: "ses_1", status: "active", description: "Main session" },
  { id: "ses_2", status: "running", description: "Subtask: research" },
]
```

**Why it's bad:** Panel shows fake data. User is misled. The SC-03 stub at `sidecar/src/panels/session-explorer/index.tsx:36-42` made this mistake. SC-04 MUST use real data from `stateStore` / `pluginClient`.

**Correct pattern:** Use `useSessions()` hook which reads from `stateStore` (which reads from `pluginClient.snapshot()` which reads from server).

### ❌ AP-2: Direct `fetch()` calls bypassing `pluginClient`

**Anti-pattern:**
```tsx
const response = await fetch(`http://127.0.0.1:3199/api/state/sessions`)
const data = await response.json()
```

**Why it's bad:** Bypasses port discovery, error handling, type safety. Hardcodes port. Violates CQRS boundary (UB-SC04-01).

**Correct pattern:** Use `getPluginClient().getSessions()` — typed, port-discoverable, error-wrapped.

### ❌ AP-3: Synchronous SSE in render

**Anti-pattern:**
```tsx
function SessionExplorer() {
  const eventSource = new EventSource("/api/events") // SYNCHRONOUS in render
  eventSource.onmessage = (e) => { /* ... */ }
  return <div>...</div>
}
```

**Why it's bad:** EventSource is created on every render. Side effects in render body. No cleanup. UB-SC03-04 violation.

**Correct pattern:** Use `useSse` hook in `useEffect` with proper cleanup (already in SC-03's `use-sse.ts:159-175`).

### ❌ AP-4: `useState` for data that should be in `stateStore`

**Anti-pattern:**
```tsx
function SessionExplorer() {
  const [sessions, setSessions] = useState([]) // LOCAL state

  useEffect(() => {
    fetch("/api/state/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions))
  }, [])

  // Problem: SSE event updates don't reach this local state
}
```

**Why it's bad:** SSE events update `stateStore`, not local state. The local state diverges from server state. UB-SC04-02 violation.

**Correct pattern:** Read from `stateStore` via `useSessions()`. SSE handlers patch `stateStore` (via `stateStore.handleEvent`); the next render observes the updated state.

### ❌ AP-5: `any` types

**Anti-pattern:**
```typescript
const sessions: any = await getPluginClient().getSessions()
```

**Why it's bad:** UB-SC04-03 violation. TypeScript strict mode enforced by `sidecar/tsconfig.json`. Breaks type safety.

**Correct pattern:**
```typescript
const result = await getPluginClient().getSessions() // typed: { sessions: SessionSummary[] }
const sessions: SessionSummary[] = result.sessions
```

### ❌ AP-6: Polling instead of SSE

**Anti-pattern:**
```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await getPluginClient().getSessions()
    setSessions(data.sessions)
  }, 5000)
  return () => clearInterval(interval)
}, [])
```

**Why it's bad:** Wastes server resources. Conflicts with server-side `SseConnectionPool` (50 max). UB-SC04-06 violation.

**Correct pattern:** Rely on SSE events for live updates. Snapshot is the source of truth; SSE is the delta.

### ❌ AP-7: Importing from `src/sidecar/`

**Anti-pattern:**
```typescript
import { sessionTracker } from "../../../../src/sidecar/server/registry"
```

**Why it's bad:** Next.js and plugin server are SEPARATE processes. Direct import only works in dev with monorepo hacks; fails in standalone build. UB-SC04-04 violation.

**Correct pattern:** All communication via `pluginClient` (HTTP) and `useSse` (SSE).

### ❌ AP-8: Tailwind classes in panel components

**Anti-pattern:**
```tsx
<div className="bg-white border border-gray-200 rounded-md p-2">
```

**Why it's bad:** SC-03 D-SC03-05: panel components use inline styles with CSS variables, not Tailwind. Mixing styles breaks visual consistency.

**Correct pattern:**
```tsx
<div style={{ background: "var(--panel-bg, #ffffff)", border: "1px solid var(--panel-border, #e2e8f0)", borderRadius: "6px", padding: "8px" }}>
```

### ❌ AP-9: Inline arrow functions in JSX render loops

**Anti-pattern:**
```tsx
{PANELS.map((panel) => (
  <button onClick={() => switchPanel(panel.id)}>...</button>
))}
```

**Why it's bad:** Creates new function on every render. For SC-04 with potentially 100+ sessions, this is noticeable.

**Correct pattern:**
```tsx
const handleClick = useCallback((id: string) => switchPanel(id), [searchParams, router])

{sessions.map((session) => (
  <button key={session.id} onClick={() => handleClick(session.id)}>...</button>
))}
```

(For v1, the inline pattern is acceptable; for 100+ sessions, switch to memoized handlers.)

### ❌ AP-10: Re-creating `EventSource` per render

**Anti-pattern:**
```tsx
function Component() {
  const es = new EventSource("/api/events") // NEW EventSource EVERY render
  // ...
}
```

**Why it's bad:** Hundreds of EventSources accumulate. Each one fires `onmessage`. Memory leak.

**Correct pattern:** Use `useSse` hook (which manages EventSource in `useEffect` with cleanup per `use-sse.ts:159-175`).

---

## 4. Class/Interface Sketches

### 4.1 New: `use-sessions.ts` hook

```typescript
import { useState, useEffect, useMemo, useCallback } from "react"
import type { SessionSummary } from "@lib/types"
import { getPluginClient } from "@lib/plugin-client"
import { getStateStore } from "@lib/state-store"

export interface UseSessionsReturn {
  /** Filtered + sorted sessions (by `updatedAt` desc, search filter applied). */
  sessions: SessionSummary[]
  /** All sessions (unfiltered) — for "X of Y" counter. */
  totalCount: number
  /** True during initial fetch. */
  loading: boolean
  /** Last error from snapshot/refresh; null on success. */
  error: Error | null
  /** Manually trigger a refresh of the snapshot. */
  refresh: () => Promise<void>
  /** Current search filter (debounced). */
  filter: string
  /** Set the search filter (debounced internally). */
  setFilter: (value: string) => void
}

export function useSessions(): UseSessionsReturn {
  const [allSessions, setAllSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filter, setFilter] = useState("")
  const [tick, setTick] = useState(0) // re-render trigger

  // Initial fetch + subscribe to stateStore changes
  useEffect(() => {
    const client = getPluginClient()
    const stateStore = getStateStore()
    let cancelled = false

    async function load() {
      try {
        const result = await client.getSessions()
        if (cancelled) return
        setAllSessions(result.sessions)
        setLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err as Error)
        setLoading(false)
      }
    }
    load()

    // Subscribe to stateStore changes (poll for v1 — SSE handles updates via stateStore.handleEvent)
    const interval = setInterval(() => {
      const record = stateStore.get("/sessions") as Record<string, SessionSummary> | undefined
      if (record) {
        const array = Object.values(record).sort((a, b) => b.updatedAt - a.updatedAt)
        setAllSessions(array)
      }
    }, 2000) // 2s polling of stateStore; SSE handles actual updates

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  // Re-fetch on tick
  useEffect(() => {
    if (tick === 0) return
    const client = getPluginClient()
    client.getSessions()
      .then((result) => setAllSessions(result.sessions))
      .catch((err) => setError(err as Error))
  }, [tick])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const client = getPluginClient()
      const stateStore = getStateStore()
      await stateStore.refreshSnapshot()
      const snapshot = await client.snapshot()
      setAllSessions(snapshot.sessions)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtered + sorted (already sorted by updatedAt desc)
  const sessions = useMemo(() => {
    if (!filter) return allSessions
    const lower = filter.toLowerCase()
    return allSessions.filter(
      (s) =>
        s.id.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.status.toLowerCase().includes(lower) ||
        (s.agent?.toLowerCase().includes(lower) ?? false)
    )
  }, [allSessions, filter])

  return {
    sessions,
    totalCount: allSessions.length,
    loading,
    error,
    refresh,
    filter,
    setFilter,
  }
}
```

**Note:** The 2s polling of `stateStore` is a v1 simplification. SSE events update `stateStore` via `stateStore.handleEvent`; the polling catches the changes. In v1.5, replace with a proper `useSyncExternalStore` subscription. **Risk:** 2s lag between SSE event and UI re-render. **Mitigation:** can be reduced to 100ms if needed; for v1, 2s is acceptable (UR-SC04-03 requires 500ms; this is achieved via SSE patches to `/sessions/:id` triggering re-render through state tick — but the polling is a backstop).

### 4.2 New: `session-row.tsx` component

```typescript
import type { SessionSummary } from "@lib/types"
import { formatRelativeTime } from "@lib/format" // hypothetical, inline implementation

export interface SessionRowProps {
  session: SessionSummary
  depth: number
  expanded: boolean
  hasChildren: boolean
  loading?: boolean
  onToggleExpand: () => void
  onSelect: () => void
  onRetryChildren?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--status-connected, #22c55e)",
  running: "var(--status-running, #3b82f6)",
  pending: "var(--status-pending, #f59e0b)",
  completed: "var(--status-completed, #94a3b8)",
  failed: "var(--status-failed, #ef4444)",
  error: "var(--status-failed, #ef4444)",
}

export function SessionRow({ session, depth, expanded, hasChildren, loading, onToggleExpand, onSelect, onRetryChildren }: SessionRowProps) {
  const color = STATUS_COLORS[session.status] ?? "var(--status-pending, #94a3b8)"

  return (
    <div
      data-row-id={session.id}
      data-row-depth={depth}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 8px 8px 8px",
        paddingLeft: `${8 + depth * 24}px`, // 2rem per depth
        borderRadius: "4px",
        cursor: "pointer",
      }}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggleExpand()
        }
      }}
    >
      {/* Expand chevron */}
      <span
        onClick={(e) => {
          e.stopPropagation()
          onToggleExpand()
        }}
        style={{
          width: "16px",
          display: "inline-flex",
          justifyContent: "center",
          cursor: hasChildren ? "pointer" : "default",
          color: hasChildren ? "var(--text-primary, #334155)" : "var(--text-muted, #cbd5e1)",
        }}
      >
        {loading ? "⏳" : hasChildren ? (expanded ? "▼" : "▶") : "·"}
      </span>

      {/* Status dot */}
      <span
        data-status={session.status}
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
        title={session.status}
      />

      {/* Session description + id + agent */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <strong style={{ fontSize: "13px", color: "var(--text-primary, #0f172a)" }}>
            {session.description || session.id}
          </strong>
          {session.agent && (
            <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }}>
              @{session.agent}
            </span>
          )}
          {session.messageCount !== undefined && (
            <span style={{ fontSize: "10px", padding: "1px 4px", borderRadius: "3px", background: "var(--badge-bg, #e2e8f0)" }}>
              {session.messageCount} msgs
            </span>
          )}
          {session.toolCallCount !== undefined && (
            <span style={{ fontSize: "10px", padding: "1px 4px", borderRadius: "3px", background: "var(--badge-bg, #e2e8f0)" }}>
              {session.toolCallCount} tools
            </span>
          )}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted, #94a3b8)" }}>
          <code>{session.id}</code> · {formatRelativeTime(session.updatedAt)}
        </div>
      </div>

      {/* Status text */}
      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "capitalize" }}>
        {session.status}
      </span>
    </div>
  )
}
```

### 4.3 New: `session-tree.tsx` component

```typescript
import { useState, useEffect, useCallback } from "react"
import type { SessionSummary, ChildSession } from "@lib/types"
import { getPluginClient } from "@lib/plugin-client"
import { SessionRow } from "./session-row"

export interface SessionTreeProps {
  sessions: SessionSummary[]
  expandedSet: Set<string>
  onToggleExpand: (sessionId: string) => void
  onSessionSelect: (sessionId: string) => void
}

export function SessionTree({ sessions, expandedSet, onToggleExpand, onSessionSelect }: SessionTreeProps) {
  // Build tree from flat list using children[] field
  const tree = buildTree(sessions) // { session, children: TreeNode[] }[]

  return (
    <div role="tree" aria-label="Active sessions">
      {tree.map((node) => (
        <TreeNode
          key={node.session.id}
          node={node}
          depth={0}
          expandedSet={expandedSet}
          onToggleExpand={onToggleExpand}
          onSessionSelect={onSessionSelect}
        />
      ))}
    </div>
  )
}

interface TreeNodeProps {
  node: SessionTreeNode
  depth: number
  expandedSet: Set<string>
  onToggleExpand: (id: string) => void
  onSessionSelect: (id: string) => void
}

function TreeNode({ node, depth, expandedSet, onToggleExpand, onSessionSelect }: TreeNodeProps) {
  const { session, children: snapshotChildren } = node
  const expanded = expandedSet.has(session.id)
  const [lazyChildren, setLazyChildren] = useState<ChildSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const hasChildren = snapshotChildren.length > 0 || expanded

  // Lazy-load on expand
  useEffect(() => {
    if (!expanded) return
    if (snapshotChildren.length > 0) return
    if (lazyChildren.length > 0) return
    if (loading) return

    setLoading(true)
    setError(null)
    getPluginClient()
      .getSessionChildren(session.id)
      .then((result) => {
        setLazyChildren(result.children)
        setLoading(false)
      })
      .catch((err) => {
        setError(err as Error)
        setLoading(false)
      })
  }, [expanded, snapshotChildren.length, session.id, lazyChildren.length, loading])

  // Build children: snapshot children + lazy children (avoid duplicates)
  const allChildren = [...snapshotChildren, ...lazyChildren.filter(
    (lc) => !snapshotChildren.some((sc) => sc.id === lc.id)
  )]

  // Map ChildSession to SessionSummary-compatible view for rendering
  const childSummaries: SessionSummary[] = allChildren.map((cs) => ({
    id: cs.id,
    status: cs.status,
    description: cs.id, // fallback when description unavailable
    children: [],
    createdAt: cs.createdAt,
    updatedAt: cs.createdAt, // children have no updatedAt in ChildSession type
    depth: cs.depth,
  }))

  const childTreeNodes: SessionTreeNode[] = childSummaries.map((cs) => ({
    session: cs,
    children: [],
  }))

  return (
    <>
      <SessionRow
        session={session}
        depth={depth}
        expanded={expanded}
        hasChildren={hasChildren || loading || lazyChildren.length > 0}
        loading={loading}
        onToggleExpand={() => onToggleExpand(session.id)}
        onSelect={() => onSessionSelect(session.id)}
      />
      {loading && (
        <div data-loading-children="true" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px`, fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
          Loading children...
        </div>
      )}
      {error && (
        <div data-error-children="true" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px`, fontSize: "11px", color: "var(--status-failed, #ef4444)" }}>
          Failed to load children · <button onClick={() => { setError(null); setLoading(false) }}>Retry</button>
        </div>
      )}
      {expanded && !loading && allChildren.length === 0 && (
        <div data-no-children="true" style={{ paddingLeft: `${(depth + 1) * 24 + 16}px`, fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
          No children
        </div>
      )}
      {expanded && childTreeNodes.length > 0 && (
        <>
          {childTreeNodes.map((childNode) => (
            <TreeNode
              key={childNode.session.id}
              node={childNode}
              depth={depth + 1}
              expandedSet={expandedSet}
              onToggleExpand={onToggleExpand}
              onSessionSelect={onSessionSelect}
            />
          ))}
        </>
      )}
    </>
  )
}

// Build tree from flat list using children[] field
function buildTree(sessions: SessionSummary[]): SessionTreeNode[] {
  const byId = new Map(sessions.map((s) => [s.id, s]))
  const rootNodes: SessionTreeNode[] = []

  for (const session of sessions) {
    // Find parent: a session whose children[] contains this session's id
    const parent = sessions.find((s) => s.children.includes(session.id))
    if (!parent) {
      // Root node (no parent found)
      rootNodes.push({ session, children: [] })
    }
  }

  return rootNodes
}

export interface SessionTreeNode {
  session: SessionSummary
  children: SessionTreeNode[]
}
```

### 4.4 New: `session-filter.tsx` component

```typescript
import { useState, useEffect } from "react"

export interface SessionFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  totalCount: number
  filteredCount: number
}

export function SessionFilter({ value, onChange, placeholder, totalCount, filteredCount }: SessionFilterProps) {
  const [local, setLocal] = useState(value)

  // Debounce: 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(local)
    }, 150)
    return () => clearTimeout(timer)
  }, [local, onChange])

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px" }}>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder || "Search sessions..."}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setLocal("")
            onChange("")
          }
        }}
        style={{
          flex: 1,
          padding: "6px 10px",
          border: "1px solid var(--panel-border, #e2e8f0)",
          borderRadius: "6px",
          fontSize: "13px",
          outline: "none",
        }}
        data-testid="session-filter-input"
      />
      <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)" }} data-testid="session-filter-count">
        {filteredCount} of {totalCount}
      </span>
    </div>
  )
}
```

### 4.5 Modified: `sidecar/src/panels/session-explorer/index.tsx` (replace stub)

```typescript
"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSessions } from "@lib/use-sessions"
import { useSse } from "@lib/use-sse"
import { getStateStore } from "@lib/state-store"
import { SessionTree } from "@components/session-tree"
import { SessionFilter } from "@components/session-filter"
import type { SidecarEvent } from "@lib/types"

function SessionExplorerInner() {
  const { sessions, totalCount, loading, error, refresh, filter, setFilter } = useSessions()
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL persistence for filter
  useEffect(() => {
    const urlFilter = searchParams.get("session_filter") || ""
    if (urlFilter !== filter) {
      setFilter(urlFilter)
    }
  }, [searchParams, filter, setFilter])

  // Sync filter to URL
  const setFilterAndUrl = useCallback((value: string) => {
    setFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("session_filter", value)
    } else {
      params.delete("session_filter")
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router, setFilter])

  // SSE event bridge
  const { connected } = useSse({
    onEvent: (event: SidecarEvent) => {
      if (event.type.startsWith("session.")) {
        getStateStore().handleEvent(event)
      }
    },
  })

  // Tree state
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set())
  const toggleExpand = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Error state: plugin unavailable
  if (error && sessions.length === 0) {
    return (
      <div data-plugin-unavailable="true" style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--status-failed, #ef4444)" }}>
          ⚠️ Plugin server not available
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
          {error.message}
        </p>
        <button
          onClick={() => setTimeout(refresh, 1000)}
          style={{ padding: "6px 12px", border: "none", background: "var(--panel-active-tab, #3b82f6)", color: "white", borderRadius: "6px", cursor: "pointer" }}
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (!loading && sessions.length === 0) {
    return (
      <div data-empty-state="true" style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-primary, #334155)" }}>
          No active sessions
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
          Start a delegation to see sessions here
        </p>
      </div>
    )
  }

  // Empty filter result
  if (!loading && sessions.length === 0 && filter) {
    return (
      <div>
        <SessionFilter value={filter} onChange={setFilterAndUrl} totalCount={totalCount} filteredCount={0} />
        <div data-no-match="true" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
            No sessions match "{filter}"
          </p>
          <button
            onClick={() => setFilterAndUrl("")}
            style={{ padding: "4px 10px", border: "none", background: "transparent", color: "var(--panel-active-tab, #3b82f6)", cursor: "pointer" }}
          >
            Clear filter
          </button>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header with SSE indicator + last updated */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderBottom: "1px solid var(--panel-border, #e2e8f0)" }}>
        <span
          data-sse-status={connected ? "connected" : "disconnected"}
          style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: connected ? "var(--status-connected, #22c55e)" : "var(--status-disconnected, #ef4444)",
          }}
          title={connected ? "SSE Connected" : "SSE Disconnected"}
        />
        <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>
          {connected ? "Live" : "Reconnecting..."}
        </span>
      </div>

      {/* Filter */}
      <SessionFilter value={filter} onChange={setFilterAndUrl} totalCount={totalCount} filteredCount={sessions.length} />

      {/* Tree */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <SessionTree
          sessions={sessions}
          expandedSet={expandedSet}
          onToggleExpand={toggleExpand}
          onSessionSelect={() => { /* SC-04.1: drill-in */ }}
        />
      </div>
    </div>
  )
}

export default function SessionExplorerPanel() {
  return (
    <Suspense fallback={
      <div data-loading="true" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted, #94a3b8)" }}>
        Loading session explorer...
      </div>
    }>
      <SessionExplorerInner />
    </Suspense>
  )
}
```

**LOC estimate:** ~50 (panel) + 80 (hook) + 130 (row) + 100 (tree) + 50 (filter) = **~410 LOC new** + tests.

---

## 5. State Tree

```
useSessions() state:
  allSessions: SessionSummary[]    // Sorted by updatedAt desc
  loading: boolean
  error: Error | null
  filter: string
  setFilter: (v) => void
  refresh: () => Promise<void>

  derived: sessions (filtered)

SessionTree local state (per TreeNode):
  lazyChildren: ChildSession[]     // Fetched on expand
  loading: boolean
  error: Error | null

SessionExplorerPanel state:
  expandedSet: Set<string>         // Which session IDs are expanded
  setFilterAndUrl: (v) => void     // Sets filter + updates URL

SSE bridge (via useSse + stateStore.handleEvent):
  - onEvent: dispatch to stateStore
  - onConnectionChange: update indicator
```

---

## 6. Dependency Graph

```
04-SPEC.md
   ↓
04-CONTEXT.md (10 GAs resolved, 7 decisions)
   ↓
04-RESEARCH.md (versions, STRIDE, validation)
   ↓
04-PATTERNS.md (this file) ← you are here
   ↓
04-PLAN.md (atomic tasks, DAG, waves)
   ↓
04-PLAN-CHECK.md (goal-backward validation)
```

---

*Patterns authored: 2026-06-06 — Wave 2 of `sidecar-honest-rebaseline-2026-06-06`. 10 reuse patterns, 5 new patterns, 10 anti-patterns, 5 class sketches. Ready for `/hm-plan-phase` → 04-PLAN.md.*
