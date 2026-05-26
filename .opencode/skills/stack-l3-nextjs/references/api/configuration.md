# Configuration — next.config.ts

> Next.js 16 configuration reference — Turbopack, cache components, proxy, images.

## Basic Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable Cache Components / Partial Prerendering
  cacheComponents: true,

  // Turbopack is default — configure here
  turbopack: {
    // Turbopack-specific options
  },

  // Image configuration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.example.com' },
    ],
    minimumCacheTTL: 14400,  // Default changed to 4 hours
    dangerouslyAllowLocalIP: false,  // New security default
  },
}

export default nextConfig
```

## Key Configuration Options

### Cache Components (PPR)

```typescript
const nextConfig: NextConfig = {
  cacheComponents: true,  // Replaces experimental.ppr
}
```

Enables:
- `"use cache"` directive on components and functions
- `cacheLife` and `cacheTag` APIs
- Partial Prerendering (static shell + dynamic holes)

### Turbopack

Turbopack is **default** in Next.js 16. Configuration moved to top level.

```typescript
// Next.js 16 — top-level turbopack config
const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
}

// Next.js 15 (DEPRECATED) — was under experimental
// experimental: { turbopack: { ... } }
```

Opt out of Turbopack:
```bash
next build --webpack   # Use webpack for build
next dev --webpack     # Use webpack for dev
```

### Proxy Configuration (replaces Middleware)

```typescript
const nextConfig: NextConfig = {
  // Renamed from skipMiddlewareUrlNormalize
  skipProxyUrlNormalize: false,
}
```

The proxy file:
```typescript
// proxy.ts (replaces middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Auth checks, redirects, header injection
  const session = request.cookies.get('session')

  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Set headers for downstream
  const response = NextResponse.next()
  response.headers.set('x-request-id', crypto.randomUUID())
  return response
}

// Optional: configure which paths the proxy runs on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**Important**: The `edge` runtime is **NOT supported** in proxy. Proxy uses `nodejs` runtime only.

### Image Configuration Changes

```typescript
const nextConfig: NextConfig = {
  images: {
    // Default minimumCacheTTL changed from 60s to 14400s (4 hours)
    minimumCacheTTL: 14400,

    // New: security restriction blocks local IP by default
    dangerouslyAllowLocalIP: false,

    // New: local images with query strings need explicit config
    localPatterns: [
      { search: '' },           // No query string
      { search: 'width' },      // ?width= allowed
    ],

    // Default image sizes changed (16 removed)
    imageSizes: [32, 48, 64, 96, 128, 256, 384],

    // Default qualities changed from [1..100] to specified values
    qualities: [75],

    // Maximum redirects limited to 3 (was unlimited)
    maximumRedirects: 3,
  },
}
```

### Experimental Flags (Next.js 16.2)

```typescript
const nextConfig: NextConfig = {
  experimental: {
    // Cache navigations for instant back-forward
    cachedNavigations: true,  // Requires cacheComponents: true

    // Inline prefetch data
    prefetchInlining: true,

    // New scroll handler for App Router
    appNewScrollHandler: true,
  },
}
```

## Removed Configuration

| Option | Status | Replacement |
|--------|--------|-------------|
| `experimental.ppr` | **Removed** | `cacheComponents: true` |
| `experimental.turbopack` | **Removed** | Top-level `turbopack` key |
| `serverRuntimeConfig` | **Removed** | Environment variables |
| `publicRuntimeConfig` | **Removed** | `NEXT_PUBLIC_*` env vars |
| `skipMiddlewareUrlNormalize` | **Renamed** | `skipProxyUrlNormalize` |

## `"use cache"` Configuration

```typescript
// app/cached-data.ts
'use cache'

import { cacheLife, cacheTag } from 'next/cache'

export async function getCachedUsers() {
  cacheLife('hours')      // Cache for hours
  cacheTag('users')       // Tag for targeted invalidation

  const users = await db.user.findMany()
  return users
}
```

### Cache Life Profiles

```typescript
// Built-in profiles
cacheLife('default')    // Platform default
cacheLife('seconds')    // 10 seconds
cacheLife('minutes')    // 5 minutes
cacheLife('hours')      // 1 hour
cacheLife('days')       // 1 day
cacheLife('weeks')      // 1 week
cacheLife('max')        // Maximum allowed

// Custom profiles in next.config.ts
const nextConfig: NextConfig = {
  cacheLife: {
    myProfile: {
      stale: 60,         // Revalidate after 60s
      revalidate: 300,   // Background revalidation window
      expire: 3600,      // Hard expiry
    },
  },
}
```

### Cache Invalidation

```typescript
// Server Action — invalidate by tag
'use server'
import { revalidateTag, updateTag } from 'next/cache'

export async function refreshUsers() {
  revalidateTag('users')   // Mark stale, revalidate in background
}

export async function immediateRefresh() {
  updateTag('users')       // Immediate read-your-writes update
}
```

## TypeScript Configuration

```json
// tsconfig.json — recommended for Next.js 16
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

*Reference: Next.js 16.2.2 · Updated 2026-04-28*
