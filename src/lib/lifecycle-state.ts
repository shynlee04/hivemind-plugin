import { asString, getNestedValue, isObject } from "./helpers.js"
import type {
  DelegationMeta,
  DelegationPacketStatus,
  DelegationRouteResolution,
  SessionContinuityMetadata,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
  SessionPolicyOverride,
  SpecialistAgent,
} from "./types.js"
import { LIFECYCLE_PHASE_TO_PACKET_STATUS } from "./types.js"

export const VALID_LIFECYCLE_TRANSITIONS: Record<SessionLifecyclePhase, SessionLifecyclePhase[]> = {
  created: ["queued", "dispatching"],
  queued: ["dispatching", "failed"],
  dispatching: ["running", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: [],
}

export function isValidLifecycleTransition(
  from: SessionLifecyclePhase,
  to: SessionLifecyclePhase,
): boolean {
  return VALID_LIFECYCLE_TRANSITIONS[from].includes(to)
}

export function getQueuePriority(runMode: "sync" | "async"): "high" | "normal" {
  return runMode === "sync" ? "high" : "normal"
}

export function extractTextFromResponse(response: unknown): string {
  if (!isObject(response)) return ""
  const parts = getNestedValue(response, ["parts"])
  if (!Array.isArray(parts)) return ""
  return parts
    .filter((part) => getNestedValue(part, ["type"]) === "text")
    .map((part) => asString(getNestedValue(part, ["text"])) ?? "")
    .join("")
    .trim()
}

export function buildLifecycleState(args: {
  phase: SessionLifecyclePhase
  runMode: "sync" | "async"
  queueKey: string
  previous?: SessionLifecycleState
  queue?: SessionLifecycleQueueState
  observation?: SessionLifecycleObservation
  cleanup?: SessionLifecycleState["cleanup"]
  launchedAt?: number
  completedAt?: number
}): SessionLifecycleState {
  return {
    phase: args.phase,
    runMode: args.runMode,
    queueKey: args.queueKey,
    launchedAt: args.launchedAt ?? args.previous?.launchedAt,
    completedAt: args.completedAt ?? args.previous?.completedAt,
    queue: args.queue ?? args.previous?.queue,
    observation: args.observation ?? args.previous?.observation,
    cleanup: args.cleanup ?? args.previous?.cleanup,
  }
}

export function buildDelegationMeta(args: {
  rootID: string
  childDepth: number
  budgetUsed: number
  agent: SpecialistAgent
  route: DelegationRouteResolution
  queueKey: string
  runtimePolicyOverride?: SessionPolicyOverride
}): DelegationMeta {
  return {
    rootID: args.rootID,
    depth: args.childDepth,
    budgetUsed: args.budgetUsed,
    agent: args.agent,
    category: args.route.category,
    model: args.route.effectiveModel,
    queueKey: args.queueKey,
    runtimePolicyOverride: args.runtimePolicyOverride,
  }
}

export function mapPhaseToDelegationPacketStatus(
  phase: SessionLifecyclePhase,
): DelegationPacketStatus {
  return LIFECYCLE_PHASE_TO_PACKET_STATUS[phase]
}

export function mapStatusToLifecyclePhase(
  status: SessionContinuityMetadata["status"],
  previousPhase?: SessionLifecyclePhase,
): SessionLifecyclePhase {
  switch (status) {
    case "pending":
      return previousPhase ?? "created"
    case "queued":
      return "queued"
    case "running":
      return previousPhase === "queued" ? "queued" : "running"
    case "completed":
      return "completed"
    case "failed":
    case "error":
    case "cancelled":
      return "failed"
    case "interrupt":
      return previousPhase === "queued" || previousPhase === "dispatching" ? previousPhase : "running"
  }
}
