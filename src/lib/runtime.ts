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

export function inferContinuityStatusFromEvent(args: {
  event: unknown
  eventType: string
  currentStatus?: SessionContinuityMetadata["status"]
}): SessionContinuityMetadata["status"] | undefined {
  const statusSignal = getStatusSignal(args.event)

  switch (statusSignal) {
    case "failed":
    case "error":
    case "errored":
    case "cancelled":
    case "canceled":
      return "error"
    case "busy":
    case "retry":
    case "running":
    case "queued":
    case "working":
    case "streaming":
      return "running"
    case "idle":
    case "completed":
    case "complete":
    case "done":
    case "finished":
      if (args.currentStatus === "error") {
        return "error"
      }
      return args.currentStatus === "pending" ? "running" : "completed"
    default:
      break
  }

  if (args.eventType === "session.created") {
    return "pending"
  }

  if (args.eventType === "session.updated") {
    return args.currentStatus === "pending" ? "running" : args.currentStatus ?? "running"
  }

  return undefined
}
