# API Design for Sidecar Applications

> REST API patterns for Next.js 16 sidecar dashboards consuming internal state.

## Route Structure for Sidecar

```
app/api/
├── sessions/
│   ├── route.ts              # GET /api/sessions — list sessions
│   └── [id]/
│       └── route.ts          # GET /api/sessions/:id — session detail
├── delegations/
│   ├── route.ts              # GET /api/delegations — list delegations
│   └── [id]/
│       └── route.ts          # GET /api/delegations/:id — delegation detail
├── continuity/
│   └── route.ts              # GET /api/continuity — current state
├── plans/
│   ├── route.ts              # GET /api/plans — list plans
│   └── [id]/
│       └── route.ts          # GET /api/plans/:id — plan detail
└── health/
    └── route.ts              # GET /api/health — health check
```

## Base Response Envelope

```typescript
// app/api/_lib/response.ts
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

export function success<T>(data: T, meta?: ApiResponse<T>['meta']): Response {
  return Response.json({ success: true, data, meta } satisfies ApiResponse<T>)
}

export function error(message: string, status: number = 500): Response {
  return Response.json({ success: false, error: message } satisfies ApiResponse<never>, { status })
}

export function notFound(resource: string): Response {
  return Response.json(
    { success: false, error: `${resource} not found` } satisfies ApiResponse<never>,
    { status: 404 }
  )
}
```

## READ-ONLY Route Handlers

All sidecar API routes are **GET-only**. Mutations happen through the harness tools, not the sidecar.

```typescript
// app/api/sessions/route.ts
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { success, error } from '../_lib/response'

interface Session {
  id: string
  startedAt: string
  status: string
  delegations: string[]
}

function getStateDir(): string {
  return process.env.OPENCODE_HARNESS_STATE_DIR
    || join(process.cwd(), '.hivemind/state')
}

function readJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export async function GET(request: Request) {
  try {
    const stateDir = getStateDir()
    const filePath = join(stateDir, 'session-continuity.json')
    const sessions = readJsonFile<Session[]>(filePath)

    if (!sessions) {
      return success([] as Session[], { total: 0 })
    }

    // Optional filtering via query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const filtered = status
      ? sessions.filter(s => s.status === status)
      : sessions

    return success(filtered, { total: filtered.length })
  } catch (err) {
    console.error('[API /sessions] Error:', err)
    return error('Failed to read sessions')
  }
}
```

## Detail Route with Params

```typescript
// app/api/sessions/[id]/route.ts
import { success, notFound, error } from '../../_lib/response'
import { readJsonFile, getStateDir } from '../../_lib/state'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params  // ← ASYNC in Next.js 16
    const stateDir = getStateDir()
    const sessions = readJsonFile<any[]>(join(stateDir, 'session-continuity.json'))

    if (!sessions) {
      return notFound('Sessions')
    }

    const session = sessions.find(s => s.id === id)
    if (!session) {
      return notFound(`Session ${id}`)
    }

    return success(session)
  } catch (err) {
    console.error('[API /sessions/:id] Error:', err)
    return error('Failed to read session')
  }
}
```

## Health Check Endpoint

```typescript
// app/api/health/route.ts
import { existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const stateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    || join(process.cwd(), '.hivemind/state')

  const stateExists = existsSync(stateDir)
  const continuityExists = existsSync(join(stateDir, 'continuity.json'))

  return Response.json({
    status: stateExists && continuityExists ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      stateDir: stateExists,
      continuity: continuityExists,
    },
    version: '16.2.2',
  })
}
```

## Error Handling Pattern

```typescript
// app/api/_lib/errors.ts
import { ZodError } from 'zod'

export function handleError(err: unknown): Response {
  if (err instanceof ZodError) {
    return Response.json(
      { success: false, error: 'Validation failed', issues: err.issues },
      { status: 400 }
    )
  }

  if (err instanceof SyntaxError) {
    return Response.json(
      { success: false, error: 'Invalid JSON in state file' },
      { status: 500 }
    )
  }

  console.error('[API] Unhandled error:', err)
  return Response.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
```

## CORS for Sidecar API

If the sidecar runs on a different port than the main app:

```typescript
// app/api/_lib/cors.ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function corsHeaders(): HeadersInit {
  return CORS_HEADERS
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
```

## Caching Strategy for Sidecar

| Data | Cache Profile | Revalidation |
|------|--------------|-------------|
| Session list | `cacheLife('seconds')` | 10s poll |
| Session detail | `cacheLife('seconds')` | On demand |
| Continuity state | `cacheLife('seconds')` | 10s poll |
| Plans | `cacheLife('minutes')` | 5 min |
| Health | No cache | Always fresh |

---

*Patterns: Next.js 16.2.2 · Updated 2026-04-28*
