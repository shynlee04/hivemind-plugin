/**
 * GET /api/events
 *
 * Server-Sent Events (SSE) endpoint for real-time side-car updates.
 * Phase 3: heartbeat + mock session events every 3-5 seconds.
 */

/** Mock event types emitted to the Live Events tab. */
const EVENT_TYPES = [
  'session.created',
  'session.resumed',
  'session.closed',
  'tool.executed',
  'tool.failed',
  'message.sent',
  'message.received',
  'task.started',
  'task.completed',
  'contract.created',
] as const

type EventType = (typeof EVENT_TYPES)[number]

/** Agent names for mock events. */
const AGENTS = ['hivemaker', 'hiveq', 'hivexplorer', 'hivehealer', 'hiveminder']

/** Generate a realistic mock event payload. */
function mockEvent(): { type: string; payload: Record<string, unknown> } {
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)] as EventType
  const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
  const sessionId = `ses-${Math.random().toString(36).slice(2, 8)}`
  const ts = new Date().toISOString()

  const base = { agent, sessionId, ts }

  const payloads: Record<EventType, Record<string, unknown>> = {
    'session.created': { ...base, reason: 'New task dispatched by orchestrator' },
    'session.resumed': { ...base, reason: 'Context recovery from prior session' },
    'session.closed': { ...base, reason: 'All tasks completed successfully' },
    'tool.executed': { ...base, tool: 'hivemind_runtime_command', duration: `${Math.floor(Math.random() * 3000)}ms` },
    'tool.failed': { ...base, tool: 'hivemind_doc', error: 'ENOENT: file not found', exitCode: 1 },
    'message.sent': { ...base, role: 'assistant', tokens: Math.floor(Math.random() * 2000) + 200 },
    'message.received': { ...base, role: 'user', tokens: Math.floor(Math.random() * 500) + 50 },
    'task.started': { ...base, taskId: `task-${Math.random().toString(36).slice(2, 6)}`, title: 'Implement feature X' },
    'task.completed': { ...base, taskId: `task-${Math.random().toString(36).slice(2, 6)}`, verdict: 'pass' },
    'contract.created': { ...base, contractId: `c-${Math.random().toString(36).slice(2, 8)}`, tasks: Math.floor(Math.random() * 8) + 1 },
  }

  return { type: eventType, payload: payloads[eventType] }
}

/** Random delay between min and max milliseconds. */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      /** Send an SSE heartbeat comment every 30 seconds. */
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30_000)

      /** Emit mock events every 3-5 seconds. */
      const emitEvent = () => {
        try {
          const event = mockEvent()
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
        } catch {
          clearInterval(eventInterval)
          clearInterval(heartbeat)
        }
      }

      const eventInterval = setInterval(emitEvent, randomDelay(3000, 5000))

      // Initial connection confirmation
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`,
        ),
      )

      // Emit first mock event after 1 second
      setTimeout(emitEvent, 1000)
    },
    cancel() {
      // Intervals cleaned up when client disconnects
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
