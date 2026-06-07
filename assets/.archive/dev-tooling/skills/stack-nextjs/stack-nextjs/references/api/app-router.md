# App Router — File Routing, Layouts, Pages

> Next.js 16 App Router reference. File-based routing with React Server Components.

## Directory Structure

```
app/
├── layout.tsx          # Root layout (required) — wraps all pages
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading skeleton for /
├── error.tsx           # Error boundary for / (must be client component)
├── not-found.tsx       # 404 page
├── proxy.ts            # Network boundary (replaces middleware.ts)
├── blog/
│   ├── layout.tsx      # Blog layout — wraps all /blog/* pages
│   ├── page.tsx        # /blog
│   ├── [slug]/
│   │   ├── page.tsx    # /blog/:slug
│   │   └── loading.tsx # Loading skeleton for /blog/:slug
│   └── default.tsx     # Fallback for parallel routes
├── api/
│   ├── health/
│   │   └── route.ts    # GET /api/health
│   └── users/
│       └── route.ts    # GET/POST /api/users
└── dashboard/
    ├── layout.tsx
    ├── page.tsx
    └── @sidebar/       # Parallel route slot
        └── default.tsx # Required in Next.js 16
```

## Layouts

Layouts wrap child segments. They **preserve state** and **do not re-render** on navigation.

```tsx
// app/layout.tsx — Root layout (required)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/blog/layout.tsx — Nested layout
export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ team: string }>  // ← ASYNC in Next.js 16
}) {
  const { team } = await params  // ← must await
  return <section data-team={team}>{children}</section>
}
```

### Key: `params` is async in Next.js 16

```tsx
// ❌ Next.js 15 pattern (BREAKS in 16)
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>
}

// ✅ Next.js 16 pattern
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>{slug}</h1>
}
```

## Pages

Pages make a route publicly accessible. They are **Server Components** by default.

```tsx
// app/page.tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>  // ← ASYNC in Next.js 16
}) {
  const { q } = await searchParams  // ← must await
  const data = await fetchData(q)
  return <main>{/* render */}</main>
}
```

## Templates

Templates are like layouts but **re-render on every navigation** (new instance).

```tsx
// app/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="template-wrapper">{children}</div>
}
```

## Loading UI

Uses React Suspense. Automatically wraps the page during loading.

```tsx
// app/loading.tsx
export default function Loading() {
  return <div className="skeleton">Loading...</div>
}
```

## Error Boundaries

Error boundaries **must be Client Components** (`'use client'`).

```tsx
// app/error.tsx
'use client'

import type { ErrorInfo } from 'next/error'

export default function Error({ error, unstable_retry }: ErrorInfo) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => unstable_retry()}>Try again</button>
    </div>
  )
}
```

## Parallel Routes

Parallel routes use `@` named slots. In Next.js 16, **`default.tsx` is required** for every parallel route slot.

```
app/dashboard/
├── layout.tsx          # Receives sidebar and children
├── page.tsx
├── @sidebar/
│   ├── page.tsx        # /dashboard sidebar content
│   └── default.tsx     # Required fallback
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
}) {
  return (
    <div className="flex">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  )
}
```

## Intercepting Routes

```
app/
├── feed/
│   └── page.tsx                    # /feed
├── @modal/
│   ├── (.)photo/[id]/page.tsx      # Intercept /photo/:id from /feed
│   └── default.tsx
└── photo/[id]/page.tsx             # Full /photo/:id page
```

## Route Groups

Use `(groupName)` folders to organize without affecting URL path.

```
app/
├── (marketing)/
│   ├── about/page.tsx     # /about
│   └── contact/page.tsx   # /contact
└── (app)/
    ├── dashboard/page.tsx  # /dashboard
    └── settings/page.tsx   # /settings
```

## Navigation

```tsx
import Link from 'next/link'

// Client-side navigation
<Link href="/blog/hello-world">Read Post</Link>

// Programmatic navigation
'use client'
import { useRouter } from 'next/navigation'

export function NavigateButton() {
  const router = useRouter()
  return <button onClick={() => router.push('/dashboard')}>Go</button>
}
```

---

*Reference: Next.js 16.2.2 · Updated 2026-04-28*
