# Server Components vs Client Components

> Next.js 16 component model — Server Components by default, Client Components opt-in.

## Core Model

**Server Components** are the default. All components in the App Router are Server Components unless explicitly marked with `'use client'`.

```
┌────────────────────────────────────────────────────┐
│                  Server Components                  │
│  (Default — no directive needed)                    │
│                                                     │
│  ✅ Direct database/API access                      │
│  ✅ Access server-only env vars                     │
│  ✅ Zero client-side JS bundle impact               │
│  ✅ Streaming and Suspense support                  │
│  ❌ No useState, useEffect, event handlers          │
│  ❌ No browser APIs (window, document)              │
│  ❌ No useState, useReducer                         │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│                  Client Components                  │
│  (Requires 'use client' directive)                  │
│                                                     │
│  ✅ useState, useEffect, useReducer                 │
│  ✅ Event handlers (onClick, onChange)              │
│  ✅ Browser APIs (window, document, localStorage)   │
│  ✅ Custom hooks with state                         │
│  ❌ No direct database access                       │
│  ❌ No server-only env vars                         │
│  ❌ Adds to client JS bundle                        │
└────────────────────────────────────────────────────┘
```

## Server Components (Default)

```tsx
// app/blog/page.tsx — Server Component (default, no directive)
import { db } from '@/lib/db'

// ✅ Direct database access
async function getPosts() {
  return db.post.findMany({ orderBy: { createdAt: 'desc' } })
}

// ✅ Server-only env vars
export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main>
      <h1>Blog</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </main>
  )
}
```

## Client Components (`'use client'`)

```tsx
// app/components/counter.tsx
'use client'  // ← Required directive at top of file

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

## Composition Pattern

Server Components can import and render Client Components. Client Components **cannot** import Server Components directly.

```
Server Component (page.tsx)
├── Server Component (data-fetching.tsx) ✅
├── Client Component (interactive-widget.tsx) ✅
│   └── Cannot import Server Components ❌
└── Server Component (layout.tsx) ✅
```

```tsx
// app/dashboard/page.tsx — Server Component
import { InteractiveChart } from '@/components/chart'  // Client Component
import { getMetrics } from '@/lib/data'                // Server function

export default async function DashboardPage() {
  const metrics = await getMetrics()  // Server-side data fetch

  return (
    <div>
      <h1>Dashboard</h1>
      <MetricsSummary data={metrics} />      {/* Server Component */}
      <InteractiveChart data={metrics} />     {/* Client Component */}
    </div>
  )
}
```

## Environment Variables

```tsx
// Server Component — access ALL env vars
async function fetchData() {
  const dbUrl = process.env.DATABASE_URL  // ✅ Server-only
  return await db.query(dbUrl, 'SELECT * FROM users')
}

export default async function Page() {
  const data = await fetchData()
  return <div>{/* render */}</div>
}
```

```tsx
// Client Component — only NEXT_PUBLIC_ prefix
'use client'

export default function ClientComponent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL  // ✅ Public
  // const dbUrl = process.env.DATABASE_URL        // ❌ undefined
  return <p>API URL: {apiUrl}</p>
}
```

## Passing Server Data to Client Components

```tsx
// ✅ Serialize data as props (no functions, no class instances)
// app/page.tsx — Server Component
import { ClientChart } from './client-chart'

export default async function Page() {
  const data = await fetchChartData()  // Server fetch

  // Data must be serializable (JSON-compatible)
  return <ClientChart data={data} />
}
```

## The `"use cache"` Directive (Next.js 16)

```tsx
// app/components/cached-data.tsx
import { cacheLife } from 'next/cache'

async function getUsers() {
  'use cache'
  cacheLife('hours')
  return db.user.findMany()
}

export default async function UserList() {
  const users = await getUsers()
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
}
```

## `'use server'` Directive

Marks a function as a Server Action — callable from Client Components.

```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  // This runs on the server only
  await db.post.create({
    data: { title: formData.get('title') as string }
  })
  revalidateTag('posts')
}
```

```tsx
// app/components/post-form.tsx
'use client'
import { createPost } from '@/app/actions'

export function PostForm() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

## Rendering Decision Tree

```
Does the component need:
├── useState / useReducer?         → 'use client'
├── useEffect / useLayoutEffect?   → 'use client'
├── Event handlers (onClick)?      → 'use client'
├── Browser APIs (window, etc.)?   → 'use client'
├── Database / file system access? → Server Component
├── Server-only env vars?          → Server Component
└── Static content only?           → Server Component
```

## `after()` — Post-Response Lifecycle Hook

Execute code **after** the response is sent to the user. Useful for analytics, logging, and background tasks.

```tsx
import { after } from 'next/server'
import { log } from '@/app/utils'

export default function Layout({ children }: { children: React.ReactNode }) {
  after(() => {
    log()  // Runs after layout is rendered and sent
  })
  return <>{children}</>
}
```

**Key constraint**: In Server Components, you **cannot** call `cookies()` or `headers()` inside the `after()` callback. Read request data **before** the callback and pass via closure.

```tsx
// ✅ Read request data before after(), pass via closure
export default async function Page() {
  const session = (await cookies()).get('session')?.value || 'anonymous'

  after(() => {
    logAnalytics({ session })  // Uses value from closure
  })

  return <h1>Page</h1>
}
```

Works in: Server Components, `generateMetadata`, Server Functions, Route Handlers, Proxy.

## View Transitions (React 19.2)

Animate elements during navigation using the browser View Transitions API.

```tsx
import { ViewTransition } from 'react'

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid">
      {photos.map((photo) => (
        <ViewTransition key={photo.id} name={`photo-${photo.id}`}>
          <Link href={`/photo/${photo.id}`}>
            <img src={photo.thumbnail} alt={photo.title} />
          </Link>
        </ViewTransition>
      ))}
    </div>
  )
}
```

**Gotchas**:
- Duplicate `view-transition-name` on the same page **crashes** the transition
- Imports use `unstable_` prefix: `unstable_ViewTransition` — API may rename in future minor releases
- Firefox: behind `dom.viewTransitions.enabled` flag (progressive enhancement applies automatically)
- `<ViewTransition>` activates on Suspense, `useDeferredValue`, and route navigations — **not** on plain `setState`

---

*Reference: Next.js 16.2.2 · Updated 2026-04-28*
