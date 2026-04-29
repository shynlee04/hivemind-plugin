# Anti-Patterns and Common Mistakes

> Next.js 16 pitfalls — what breaks, what silently fails, and how to avoid it.

## Migration Gotchas

### Forgetting to `await` request APIs

All request-scoped APIs are now async. Forgetting `await` causes **runtime errors**, not build errors.

```tsx
// ❌ Next.js 15 pattern — RUNTIME ERROR in 16
export default function Page({ params }: { params: { slug: string } }) {
  return <h1>{params.slug}</h1>  // params is Promise, not object
}

// ❌ Also wrong — destructuring without await
export default async function Page({ params }) {
  const { slug } = params  // Destructuring a Promise gives undefined
  return <h1>{slug}</h1>
}

// ✅ Correct — await first, then destructure
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>{slug}</h1>
}
```

Applies to: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`

### Using `middleware.ts` instead of `proxy.ts`

```bash
# ❌ Deprecated — will log warnings, may be removed
middleware.ts

# ✅ Next.js 16 — proxy.ts
proxy.ts
```

The old filename still works but is deprecated. The `export function middleware()` should be renamed to `export function proxy()`.

### Accessing `cookies()`/`headers()` inside `after()` in Server Components

```tsx
// ❌ Fails — cannot access request APIs inside after() in Server Components
import { after } from 'next/server'
import { cookies } from 'next/headers'

export default async function Page() {
  after(async () => {
    const session = (await cookies()).get('session')  // ERROR
  })
  return <div>Content</div>
}

// ✅ Read before after(), pass via closure
export default async function Page() {
  const session = (await cookies()).get('session')?.value || 'anonymous'
  after(() => {
    logAnalytics({ session })  // Uses value from closure
  })
  return <div>Content</div>
}
```

## Component Boundary Mistakes

### Importing Server Components from Client Components

```tsx
// ❌ Client Component importing Server Component
'use client'
import { ServerDataTable } from './server-data-table'  // ERROR at build

export function Dashboard() {
  return <ServerDataTable />
}

// ✅ Pass Server Component as children prop
// page.tsx (Server Component)
import { Dashboard } from './dashboard'
import { ServerDataTable } from './server-data-table'

export default function Page() {
  return (
    <Dashboard>
      <ServerDataTable />
    </Dashboard>
  )
}

// dashboard.tsx (Client Component)
'use client'
export function Dashboard({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}
```

### Passing non-serializable props to Client Components

```tsx
// ❌ Function — not serializable
<ClientChart onData={handleData} />

// ❌ Class instance — not serializable
<ClientChart data={new Map()} />

// ❌ Date object — serializes to string
<ClientChart date={new Date()} />

// ✅ Only JSON-serializable data
<ClientChart data={arrayOfObjects} />
<ClientChart timestamp={Date.now()} />
<ClientChart dateString={new Date().toISOString()} />
```

### Missing `'use client'` on error boundaries

```tsx
// ❌ Error boundary without 'use client' — React requires it
export default function Error({ error }) {
  return <p>{error.message}</p>
}

// ✅ Always add 'use client' to error.tsx
'use client'
export default function Error({ error, unstable_retry }) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={() => unstable_retry()}>Retry</button>
    </div>
  )
}
```

## Caching Anti-Patterns

### Using `"use cache"` on non-serializable returns

```tsx
// ❌ Returns non-serializable data
'use cache'
async function getData() {
  return new Map()          // Map is not JSON-serializable
}

// ✅ Return plain JSON-compatible data
'use cache'
async function getData() {
  const results = await db.query()
  return results.map(r => ({ id: r.id, name: r.name }))  // Plain objects
}
```

### Missing `default.tsx` for parallel routes

```bash
# ❌ Parallel route without default.tsx — causes runtime errors in Next.js 16
app/dashboard/
├── @sidebar/
│   └── page.tsx       # Missing default.tsx!

# ✅ Always include default.tsx
app/dashboard/
├── @sidebar/
│   ├── page.tsx
│   └── default.tsx    # Required fallback
```

## Proxy Mistakes

### Using edge runtime in proxy.ts

```typescript
// ❌ Edge runtime NOT supported in proxy.ts
export const runtime = 'edge'  // ERROR — proxy is Node.js only

// ✅ Proxy uses Node.js runtime by default (omit runtime export)
export function proxy(request: NextRequest) {
  // Node.js APIs available here
}
```

### Using removed `serverRuntimeConfig`

```typescript
// ❌ Removed in Next.js 16
const nextConfig = {
  serverRuntimeConfig: {
    secret: process.env.SECRET,  // ERROR — no longer supported
  },
}

// ✅ Use environment variables directly
// Server Components and Route Handlers can access process.env directly
export default async function Page() {
  const secret = process.env.SECRET  // ✅ Works in Server Components
  // ...
}
```

## Turbopack Gotchas

### Webpack-specific loaders that don't work with Turbopack

```bash
# These webpack loaders have NO Turbopack equivalent:
# - url-loader → Use next/image or import assertions
# - file-loader → Use next/image or public/ directory
# - raw-loader → Use fs.readFile in Server Components
# - null-loader → Remove the import

# If you MUST use webpack-only plugins:
next build --webpack   # Opt out of Turbopack for this build
```

### Custom webpack config ignored under Turbopack

```typescript
// ❌ This is IGNORED when using Turbopack (default in 16)
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(new MyPlugin())  // Never runs
    return config
  },
}

// ✅ Use turbopack config instead
const nextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
}
```

## View Transitions Gotchas

### Duplicate `view-transition-name` crashes transitions

```css
/* ❌ Static name on list items — crashes if multiple items rendered */
.card {
  view-transition-name: card;
}

/* ✅ Unique names per element */
.card[data-id="1"] { view-transition-name: card-1; }
.card[data-id="2"] { view-transition-name: card-2; }
```

### `unstable_` prefix signals API churn

```tsx
// The View Transition exports use unstable_ prefix
// These WILL be renamed when the spec stabilizes
import { unstable_ViewTransition } from 'react'

// Plan for a migration when Next.js 16.x removes the prefix
```

## Hydration Mismatches

### Server/client date or random value differences

```tsx
// ❌ Date renders differently on server vs client
export default function Page() {
  return <span>{new Date().toLocaleString()}</span>  // Hydration mismatch!
}

// ✅ Render date on client only
'use client'
import { useState, useEffect } from 'react'

export function ClientDate() {
  const [date, setDate] = useState<string>('')
  useEffect(() => {
    setDate(new Date().toLocaleString())
  }, [])
  return <span>{date}</span>
}

// ✅ Or suppress hydration warning for one-way display
export default function Page() {
  return (
    <time suppressHydrationWarning>
      {new Date().toISOString()}
    </time>
  )
}
```

---

*Anti-patterns: Next.js 16.2.2 · Updated 2026-04-28*
