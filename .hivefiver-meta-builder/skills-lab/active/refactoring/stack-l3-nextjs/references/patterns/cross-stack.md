# Cross-Stack Integration Examples

> Patterns combining Next.js 16 with other stack skills (Zod, Vitest, OpenCode SDK).

## Next.js + Zod: Route Handler Validation

Validate API inputs with Zod schemas directly in route handlers.

```typescript
import { z } from 'zod'

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  agent: z.enum(['researcher', 'builder', 'critic', 'explorer']),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = CreateSessionSchema.parse(body)

    const session = await createSession(input)
    return Response.json(session, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Next.js + Zod: Server Action Validation

```tsx
// app/actions/create-delegation.ts
'use server'

import { z } from 'zod'
import { revalidateTag } from 'next/cache'

const DelegationSchema = z.object({
  agent: z.string().min(1),
  prompt: z.string().min(10),
  safetyCeilingMs: z.number().positive().max(300000).optional(),
})

export async function createDelegation(formData: FormData) {
  const input = DelegationSchema.parse({
    agent: formData.get('agent'),
    prompt: formData.get('prompt'),
    safetyCeilingMs: formData.get('safetyCeilingMs')
      ? Number(formData.get('safetyCeilingMs'))
      : undefined,
  })

  const delegation = await persistDelegation(input)
  revalidateTag('delegations')
  return { success: true, id: delegation.id }
}
```

## Next.js + Vitest: Server Component Testing

Test Server Components with Vitest by mocking the data layer.

```typescript
// tests/app/dashboard/page.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

vi.mock('@/lib/data', () => ({
  getSessions: vi.fn().mockResolvedValue([
    { id: 'abc-123', status: 'active', taskCount: 5, startedAt: '2026-04-28T10:00:00Z' },
  ]),
}))

describe('DashboardPage', () => {
  it('renders session table with data', async () => {
    const { default: DashboardPage } = await import('@/app/dashboard/page')
    const html = await renderToString(await DashboardPage())
    expect(html).toContain('abc-123')
    expect(html).toContain('active')
  })
})
```

### Next.js + Vitest: Route Handler Testing

```typescript
// tests/app/api/health/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}))

describe('GET /api/health', () => {
  it('returns healthy status', async () => {
    const { GET } = await import('@/app/api/health/route')
    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('healthy')
    expect(data.checks.stateDir).toBe(true)
  })
})
```

### Next.js + Vitest: Server Action Testing

```typescript
// tests/app/actions/create-delegation.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

vi.mock('@/lib/persistence', () => ({
  persistDelegation: vi.fn().mockResolvedValue({ id: 'del-001' }),
}))

describe('createDelegation', () => {
  it('validates and persists delegation', async () => {
    const { createDelegation } = await import('@/app/actions/create-delegation')

    const formData = new FormData()
    formData.set('agent', 'researcher')
    formData.set('prompt', 'Research Next.js 16 caching patterns for the sidecar')

    const result = await createDelegation(formData)
    expect(result.success).toBe(true)
    expect(result.id).toBe('del-001')
  })

  it('rejects invalid input', async () => {
    const { createDelegation } = await import('@/app/actions/create-delegation')

    const formData = new FormData()
    formData.set('agent', '')
    formData.set('prompt', 'short')

    await expect(createDelegation(formData)).rejects.toThrow()
  })
})
```

## Next.js + OpenCode SDK: Plugin Hosting Pattern

Host the OpenCode harness plugin within a Next.js application for the sidecar dashboard.

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  serverExternalPackages: ['opencode-harness'],
  experimental: {
    serverComponentsExternalPackages: ['opencode-harness'],
  },
}

export default nextConfig
```

```tsx
// app/api/sse/delegations/route.ts
// Server-Sent Events endpoint for live delegation updates
export async function GET(request: Request) {
  const stateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    || join(process.cwd(), '.hivemind/state')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }

      const poll = async () => {
        const delegations = readJsonFile(join(stateDir, 'delegations.json'))
        sendEvent(delegations || [])
      }

      poll()
      const interval = setInterval(poll, 3000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

```tsx
// app/components/live-delegations.tsx
'use client'

import { useEffect, useState } from 'react'

interface Delegation {
  id: string
  status: string
  title: string
  agent: string
}

export function LiveDelegations() {
  const [delegations, setDelegations] = useState<Delegation[]>([])

  useEffect(() => {
    const eventSource = new EventSource('/api/sse/delegations')

    eventSource.onmessage = (event) => {
      setDelegations(JSON.parse(event.data))
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }, [])

  return (
    <div>
      {delegations.map((d) => (
        <div key={d.id} data-status={d.status}>
          <span>{d.agent}</span>
          <span>{d.title}</span>
          <span>{d.status}</span>
        </div>
      ))}
    </div>
  )
}
```

## Next.js + Zod + Server Actions: Type-Safe Forms

End-to-end type safety from form to database.

```tsx
// app/lib/schemas.ts
import { z } from 'zod'

export const PlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  phase: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a phase number like 1 or 2.1'),
  dependsOn: z.array(z.string()).default([]),
})

export type PlanInput = z.infer<typeof PlanSchema>
```

```tsx
// app/actions/create-plan.ts
'use server'

import { PlanSchema, type PlanInput } from '@/app/lib/schemas'
import { revalidateTag } from 'next/cache'

export async function createPlan(_: unknown, formData: FormData) {
  const input = PlanSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    phase: formData.get('phase'),
    dependsOn: formData.getAll('dependsOn'),
  })

  if (!input.success) {
    return { error: input.error.issues.map((i) => i.message).join(', ') }
  }

  await persistPlan(input.data)
  revalidateTag('plans')
  return { success: true }
}
```

```tsx
// app/plans/new/page.tsx
'use client'

import { useActionState } from 'react'
import { createPlan } from '@/app/actions/create-plan'

export default function NewPlanPage() {
  const [state, formAction, isPending] = useActionState(createPlan, null)

  return (
    <form action={formAction}>
      <input name="title" placeholder="Plan title" required />
      <textarea name="description" placeholder="Description (min 10 chars)" required />
      <select name="priority">
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <input name="phase" placeholder="Phase (e.g. 1, 2.1)" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Plan'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">Plan created!</p>}
    </form>
  )
}
```

---

*Cross-stack patterns: Next.js 16.2.2 + Zod + Vitest + OpenCode SDK · Updated 2026-04-28*
