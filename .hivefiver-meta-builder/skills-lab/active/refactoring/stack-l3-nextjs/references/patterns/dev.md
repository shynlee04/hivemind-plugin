# Dashboard Development Patterns

> Patterns for building dashboards and sidecar applications with Next.js 16.

## Sidecar Architecture (HiveMind Q2)

Next.js 16 is the chosen stack for the HiveMind artifact-focused sidecar (Q2 decision).

```
┌─────────────────────────────────────────────────┐
│            Next.js 16 Sidecar (READ-ONLY)       │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  App Router Pages                          │  │
│  │  /                    → Dashboard overview │  │
│  │  /sessions            → Session journal    │  │
│  │  /delegations         → Delegation status  │  │
│  │  /plans               → Plan viewer        │  │
│  │  /timeline            → Execution lineage  │  │
│  └───────────────────┬───────────────────────┘  │
│                      │ READ ONLY                  │
│  ┌───────────────────▼───────────────────────┐  │
│  │  Data Access Layer                         │  │
│  │  Reads .hivemind/ and .planning/           │  │
│  │  No mutations — delegates to CLI/tools     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │ reads
         ▼
┌─────────────────────────────────────────────────┐
│   .hivemind/state/                               │
│   ├── continuity.json                            │
│   ├── delegations.json                           │
│   └── session-continuity.json                    │
│   .hivemind/journal/                             │
│   .planning/                                     │
└─────────────────────────────────────────────────┘
```

**Key constraint**: Sidecar is READ-ONLY for canonical state. Mutations go through the harness tools.

## Data Fetching Patterns

### Server Component Data Fetching

```tsx
// app/sessions/page.tsx
import { readFileSync } from 'fs'
import { join } from 'path'

interface Session {
  id: string
  startedAt: string
  status: string
  taskCount: number
}

async function getSessions(): Promise<Session[]> {
  const stateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    || join(process.cwd(), '.hivemind/state')

  // Read the continuity file (deep-clone pattern)
  const filePath = join(stateDir, 'session-continuity.json')
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default async function SessionsPage() {
  const sessions = await getSessions()

  return (
    <main>
      <h1>Sessions</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Started</th>
            <th>Status</th>
            <th>Tasks</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{s.id.slice(0, 8)}</td>
              <td>{new Date(s.startedAt).toLocaleString()}</td>
              <td>{s.status}</td>
              <td>{s.taskCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
```

### Cached Data Fetching with `"use cache"`

```tsx
// app/lib/data.ts
'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function getDelegations() {
  cacheLife('seconds')  // Refresh every 10s for dashboard
  cacheTag('delegations')

  const stateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    || join(process.cwd(), '.hivemind/state')

  const filePath = join(stateDir, 'delegations.json')
  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}
```

### Client-Side Polling for Live Updates

```tsx
// app/components/live-status.tsx
'use client'

import { useEffect, useState } from 'react'

interface Delegation {
  id: string
  status: string
  title: string
}

export function LiveDelegationStatus() {
  const [delegations, setDelegations] = useState<Delegation[]>([])

  useEffect(() => {
    const poll = async () => {
      const res = await fetch('/api/delegations')
      const data = await res.json()
      setDelegations(data)
    }

    poll()  // Initial fetch
    const interval = setInterval(poll, 3000)  // Poll every 3s

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {delegations.map((d) => (
        <div key={d.id} className="delegation-card">
          <span className="status">{d.status}</span>
          <span className="title">{d.title}</span>
        </div>
      ))}
    </div>
  )
}
```

## Layout Patterns

### Dashboard Layout with Sidebar

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-grid">
      <nav className="sidebar">
        <a href="/dashboard">Overview</a>
        <a href="/dashboard/sessions">Sessions</a>
        <a href="/dashboard/delegations">Delegations</a>
        <a href="/dashboard/plans">Plans</a>
        <a href="/dashboard/timeline">Timeline</a>
      </nav>
      <main className="content">{children}</main>
    </div>
  )
}
```

### Streaming with Suspense

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'

async function SessionMetrics() {
  const data = await getSessionMetrics()  // Slow query
  return <div>{/* metrics */}</div>
}

async function DelegationMetrics() {
  const data = await getDelegationMetrics()  // Slow query
  return <div>{/* metrics */}</div>
}

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Suspense fallback={<div className="skeleton">Loading sessions...</div>}>
        <SessionMetrics />
      </Suspense>
      <Suspense fallback={<div className="skeleton">Loading delegations...</div>}>
        <DelegationMetrics />
      </Suspense>
    </div>
  )
}
```

## Environment Configuration

```bash
# .env.local — sidecar configuration
OPENCODE_HARNESS_STATE_DIR=/path/to/project/.hivemind/state
OPENCODE_HARNESS_CONTINUITY_FILE=/path/to/project/.hivemind/state/continuity.json
NEXT_PUBLIC_DASHBOARD_TITLE=HiveMind Control Plane
```

## Rendering Recommendations for Dashboard

| Component Type | Rendering | Reason |
|---------------|-----------|--------|
| Layout / Navigation | Static / Server | No interactivity needed |
| Data tables | Server Component | Direct file system reads |
| Live status indicators | Client Component | Polling / WebSocket |
| Charts / Visualizations | Client Component | Canvas/SVG interactivity |
| Error boundaries | Client Component | Required by React |
| Loading skeletons | Server Component | Suspense fallback |

---

*Patterns: Next.js 16.2.2 · Updated 2026-04-28*
