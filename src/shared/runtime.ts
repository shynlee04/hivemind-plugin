import { asString, getNestedValue } from "./helpers.js"
import type { SessionContinuityMetadata } from "./types.js"

function getStatusSignal(event: unknown): string | undefined {
  const paths = [
    ["properties", "status", "type"],
    ["properties", "status"],
    ["properties", "info", "status", "type"],
    ["properties", "info", "status"],
    ["properties", "info", "state"],
    ["status", "type"],
    ["status"],
    ["state"],
  ]

  for (const path of paths) {
    const signal = asString(getNestedValue(event, path))
    if (signal) {
      return signal.trim().toLowerCase()
    }
  }

  return undefined
}

/**
 * Infer a continuity status from an incoming transport event.
 *
 * NOTE: The `"running"` inference for transport "busy" signals (busy, retry,
 * running, queued, working, streaming) is **transport-derived**, not
 * evidence-confirmed. For delegate-task children, the background observer
 * gates these with a start-evidence check before promoting to running.
 *
 * When `requireEvidence` is true, the function will only return `"running"`
 * from transport signals if `existingLastToolActivityAt` is already set
 * (i.e., real tool activity has been observed previously).
 */
export function inferContinuityStatusFromEvent(args: {
  event: unknown
  eventType: string
  currentStatus?: SessionContinuityMetadata["status"]
  /** When true, "running" from transport signals requires prior tool activity. */
  requireEvidence?: boolean
  /** The record's current lastToolActivityAt, used only when requireEvidence is true. */
  existingLastToolActivityAt?: number
}): SessionContinuityMetadata["status"] | undefined {
  const statusSignal = getStatusSignal(args.event)

  if (
    statusSignal &&
    (args.currentStatus === "failed" || args.currentStatus === "error" || args.currentStatus === "completed")
  ) {
    return args.currentStatus
  }

  switch (statusSignal) {
    case "failed":
    case "error":
    case "errored":
    case "cancelled":
    case "canceled":
      return "failed"
    case "busy":
    case "retry":
    case "running":
    case "queued":
    case "working":
    case "streaming":
      if (args.requireEvidence || !args.existingLastToolActivityAt) {
        return args.currentStatus ?? undefined
      }
      return "running"
    case "idle":
    case "completed":
    case "complete":
    case "done":
    case "finished":
      if (args.currentStatus === "failed" || args.currentStatus === "error") {
        return args.currentStatus
      }
      return args.currentStatus === "pending" ? "running" : "completed"
    default:
      break
  }

  if (args.eventType === "session.created") {
    return "pending"
  }

  if (args.eventType === "session.updated") {
    return args.currentStatus
  }

  return undefined
}
