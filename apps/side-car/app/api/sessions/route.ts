import { NextResponse } from 'next/server'

/**
 * @fileoverview Sessions API route — returns a json-render spec for the Sessions tab.
 *
 * Phase 3 mock: returns realistic session data rendered as Cards with status badges.
 * Future phases will read from `.hivemind/activity/sessions/`.
 */

/** CORS headers shared across all HTTP methods. */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Status color mapping for session badges. */
const STATUS_VARIANT: Record<string, string> = {
  active: 'default',
  resumed: 'secondary',
  closed: 'outline',
}

/** Mock session data for Phase 3 development. */
const MOCK_SESSIONS = [
  {
    id: 'ses-a1b2c3',
    agent: 'hivemaker',
    status: 'active',
    task: 'Implement Phase 3 Sessions UI',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: 'ses-d4e5f6',
    agent: 'hiveq',
    status: 'active',
    task: 'Verify Phase 2 Contracts implementation',
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    updatedAt: new Date(Date.now() - 300_000).toISOString(),
  },
  {
    id: 'ses-g7h8i9',
    agent: 'hivexplorer',
    status: 'resumed',
    task: 'Codebase architecture scan — cutover audit',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    updatedAt: new Date(Date.now() - 600_000).toISOString(),
  },
  {
    id: 'ses-j0k1l2',
    agent: 'hivemaker',
    status: 'closed',
    task: 'Phase 1 Shell + Dashboard delivery',
    createdAt: new Date(Date.now() - 172800_000).toISOString(),
    updatedAt: new Date(Date.now() - 86400_000).toISOString(),
  },
  {
    id: 'ses-m3n4o5',
    agent: 'hivehealer',
    status: 'closed',
    task: 'Fix type errors in schema-kernel contracts',
    createdAt: new Date(Date.now() - 259200_000).toISOString(),
    updatedAt: new Date(Date.now() - 172800_000).toISOString(),
  },
]

/**
 * Build a json-render spec from session data.
 *
 * @param sessions - Array of session objects to render
 * @returns A complete Spec with Cards, Badges, and metadata
 */
function buildSessionsSpec(sessions: typeof MOCK_SESSIONS) {
  const cardIds = sessions.map((s) => `session-${s.id}`)
  const activeCount = sessions.filter((s) => s.status === 'active').length

  const elements: Record<string, unknown> = {
    'sessions-root': {
      type: 'Stack',
      props: { gap: 3, className: 'p-4' },
      children: ['heading', 'summary', 'sep', ...cardIds],
    },
    heading: {
      type: 'Heading',
      props: { level: 3, children: `Sessions (${sessions.length})` },
    },
    summary: {
      type: 'Text',
      props: {
        className: 'text-sm text-muted-foreground',
        children: `${activeCount} active · ${sessions.length - activeCount} inactive`,
      },
    },
    sep: { type: 'Separator' },
  }

  for (const s of sessions) {
    const badge = STATUS_VARIANT[s.status] ?? 'outline'
    elements[`session-${s.id}`] = {
      type: 'Card',
      props: { className: 'p-4' },
      children: [
        `hdr-${s.id}`,
        `badge-${s.id}`,
        `task-${s.id}`,
        `meta-${s.id}`,
      ],
    }
    elements[`hdr-${s.id}`] = {
      type: 'Stack',
      props: { direction: 'row', gap: 2, className: 'items-center' },
      children: [`dot-${s.id}`, `id-${s.id}`, `agent-${s.id}`],
    }
    elements[`dot-${s.id}`] = {
      type: 'Text',
      props: {
        className: `inline-block w-2 h-2 rounded-full ${
          s.status === 'active' ? 'bg-green-500' : s.status === 'resumed' ? 'bg-yellow-500' : 'bg-gray-400'
        }`,
      },
    }
    elements[`id-${s.id}`] = {
      type: 'Text',
      props: { className: 'font-mono text-sm font-medium', children: s.id },
    }
    elements[`agent-${s.id}`] = {
      type: 'Text',
      props: { className: 'text-xs text-muted-foreground', children: `agent: ${s.agent}` },
    }
    elements[`badge-${s.id}`] = {
      type: 'Badge',
      props: { variant: badge, children: s.status },
    }
    elements[`task-${s.id}`] = {
      type: 'Text',
      props: { className: 'text-sm mt-1', children: s.task },
    }
    elements[`meta-${s.id}`] = {
      type: 'Text',
      props: {
        className: 'text-xs text-muted-foreground',
        children: `Created ${new Date(s.createdAt).toLocaleString()} · Updated ${new Date(s.updatedAt).toLocaleString()}`,
      },
    }
  }

  return { root: 'sessions-root', elements }
}

/**
 * GET /api/sessions
 *
 * Returns a json-render spec for the Sessions tab.
 * Mock data for Phase 3; will read from .hivemind in future phases.
 */
export async function GET() {
  const spec = buildSessionsSpec(MOCK_SESSIONS)
  return NextResponse.json(spec, { headers: CORS_HEADERS })
}

/** Handle CORS preflight requests. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
