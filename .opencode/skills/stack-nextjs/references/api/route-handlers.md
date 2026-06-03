# Route Handlers & Server Actions

> Next.js 16 API endpoints — route handlers for REST, server actions for mutations.

## Route Handlers

Route handlers are defined in `route.ts` files and handle HTTP requests using the Web Request/Response APIs.

### Basic GET Handler

```typescript
// app/api/health/route.ts
export async function GET(request: Request) {
  return Response.json({ status: 'ok', timestamp: Date.now() })
}
```

### POST with JSON Body

```typescript
// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const { name, email } = body

  // Validate
  if (!name || !email) {
    return Response.json({ error: 'Name and email required' }, { status: 400 })
  }

  // Persist
  const user = await createUser({ name, email })

  return Response.json(user, { status: 201 })
}
```

### All HTTP Methods

```typescript
// app/api/items/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ← ASYNC in Next.js 16
) {
  const { id } = await params
  const item = await getItem(id)
  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  return Response.json(item)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const updated = await updateItem(id, body)
  return Response.json(updated)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteItem(id)
  return new Response(null, { status: 204 })
}
```

### Using NextRequest (Extended Request)

```typescript
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('session')
  const search = request.nextUrl.searchParams.get('q')

  // Redirect
  return Response.redirect(new URL('/login', request.url))
}
```

### CORS Headers

```typescript
export async function GET(request: Request) {
  return new Response('Hello, Next.js!', {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

### Streaming Response

```typescript
export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchStreamData()
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

## Server Actions

Server Actions are functions that run on the server. Mark with `'use server'`.

### Inline Server Actions

```tsx
// app/actions/create-post.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.create({ data: { title, content } })

  revalidateTag('posts')  // Invalidate cached posts
}
```

### Using with Forms

```tsx
// app/posts/new/page.tsx
import { createPost } from '@/app/actions/create-post'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

### Using with Client Components

```tsx
// app/components/create-button.tsx
'use client'

import { createPost } from '@/app/actions/create-post'

export function CreateButton() {
  return <button formAction={createPost}>Create</button>
}
```

### Server Action with `useActionState`

```tsx
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions/create-post'

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null)

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  )
}
```

## Cache Management APIs (Next.js 16)

```typescript
'use server'

import { revalidateTag, updateTag } from 'next/cache'

// Mark data as stale (revalidates in background)
export async function refreshPosts() {
  revalidateTag('posts')
}

// Immediate update (read-your-writes)
export async function updateAndRefresh(id: string) {
  await updatePost(id)
  updateTag('posts')  // Immediate cache update
}

// Refresh client router from server action
export async function refreshPage() {
  const { refresh } = await import('next/cache')
  refresh()
}
```

## Pattern: API Route with Error Handling

```typescript
// app/api/data/route.ts
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  value: z.number().positive(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)  // Throws ZodError

    const result = await createData(validated)
    return Response.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', issues: error.issues },
        { status: 400 }
      )
    }
    console.error('[API] Unexpected error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

*Reference: Next.js 16.2.2 · Updated 2026-04-28*
