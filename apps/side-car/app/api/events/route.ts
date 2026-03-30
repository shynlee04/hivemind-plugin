/**
 * GET /api/events
 *
 * Server-Sent Events (SSE) endpoint for real-time side-car updates.
 * Phase 1: heartbeat-only connection keepalive.
 * Phase 3 will add dashboard-update, session-change, and contract events.
 */
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

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`),
      )

      // Clean up on abort
      // Note: Request.signal is available in Next.js 15 route handlers
    },
    cancel() {
      // Interval is cleaned up when the client disconnects
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
