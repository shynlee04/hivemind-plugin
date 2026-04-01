import { getSessionContinuity } from "./continuity.js"
import { asString, getNestedValue } from "./helpers.js"
import { getTemperatureForAgent } from "./routing.js"
import { getDelegationMeta } from "./state.js"
import type { DelegationCategory, SessionContinuityMetadata, SpecialistAgent } from "./types.js"
import { VALID_AGENTS } from "./types.js"

export type EffectivePromptState = {
  agent: SpecialistAgent
  category?: DelegationCategory
  requestedCategory?: DelegationCategory
  model?: string
  temperature?: number
  guidanceText?: string
  tools: string[]
  warnings: string[]
  agentSource: string
  modelSource: string
  temperatureSource: string
  continuityStatus?: SessionContinuityMetadata["status"]
}

function normalizeAgent(value: unknown): SpecialistAgent | undefined {
  const normalized = asString(value)?.trim().toLowerCase()
  return VALID_AGENTS.includes(normalized as SpecialistAgent)
    ? (normalized as SpecialistAgent)
    : undefined
}

function cloneStringList(values: string[] | undefined): string[] {
  return Array.isArray(values) ? [...values] : []
}

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

export function getEffectivePromptState(args: {
  sessionID?: string
  agent?: string
}): EffectivePromptState | undefined {
  const continuity = args.sessionID ? getSessionContinuity(args.sessionID) : undefined
  const route = continuity?.metadata.route
  const delegation = args.sessionID ? getDelegationMeta(args.sessionID) : undefined
  const inputAgent = normalizeAgent(args.agent)

  const agent = continuity?.promptParams.agent ?? route?.effectiveAgent ?? delegation?.agent ?? inputAgent
  if (!agent) {
    return undefined
  }

  const model = continuity?.promptParams.model ?? route?.effectiveModel ?? delegation?.model
  const temperature =
    continuity?.promptParams.temperature ?? route?.temperature ?? getTemperatureForAgent(agent)
  const tools = continuity?.promptParams.tools?.length
    ? cloneStringList(continuity.promptParams.tools)
    : cloneStringList(continuity?.toolProfile.compatibleTools)

  return {
    agent,
    category: continuity?.promptParams.category ?? route?.category ?? delegation?.category,
    requestedCategory: route?.requestedCategory ?? continuity?.promptParams.category,
    model,
    temperature,
    guidanceText: continuity?.promptParams.guidanceText ?? route?.guidanceText,
    tools,
    warnings: cloneStringList(route?.warnings),
    agentSource: continuity?.promptParams.agent
      ? "continuity"
      : route?.effectiveAgent
        ? `route:${route.agentSource}`
        : delegation?.agent
          ? "delegation"
          : inputAgent
            ? "chat-input"
            : "none",
    modelSource: continuity?.promptParams.model
      ? "continuity"
      : route?.effectiveModel
        ? `route:${route.modelSource}`
        : delegation?.model
          ? "delegation"
          : "none",
    temperatureSource: continuity?.promptParams.temperature !== undefined
      ? "continuity"
      : route?.temperature !== undefined
        ? `route:${route.temperatureSource}`
        : "agent-default",
    continuityStatus: continuity?.metadata.status,
  }
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
      return "failed"
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
      if (args.currentStatus === "failed") {
        return "failed"
      }
      return args.currentStatus === "created" ? "running" : "completed"
    default:
      break
  }

  if (args.eventType === "session.created") {
    return "created"
  }

  if (args.eventType === "session.updated") {
    return args.currentStatus === "created" ? "running" : args.currentStatus ?? "running"
  }

  return undefined
}
