import type {
  DelegationPacket,
  DelegationPacketStatus,
  DelegationRouteResolution,
  SessionContinuityMetadata,
  SessionContinuityRecord,
} from "./types.js"

export type { DelegationPacket, DelegationPacketStatus } from "./types.js"

export type DelegationArtifactPacket = DelegationPacket & {
  lineage: {
    rootSessionID: string
    parentSessionID: string
    sessionID: string
  }
  specialist: {
    requestedCategory?: DelegationRouteResolution["requestedCategory"]
    category?: DelegationRouteResolution["category"]
    requestedAgent?: DelegationRouteResolution["requestedAgent"]
    effectiveAgent: DelegationRouteResolution["effectiveAgent"]
    presetKey: string
    requestedModel?: string
    effectiveModel?: string
    fallbackUsed: boolean
    rationale: string
  }
  execution: {
    runInBackground: boolean
    family?: NonNullable<SessionContinuityMetadata["execution"]>["family"]
    submode?: NonNullable<SessionContinuityMetadata["execution"]>["submode"]
    rationale?: NonNullable<SessionContinuityMetadata["execution"]>["rationale"]
    characteristics?: NonNullable<SessionContinuityMetadata["execution"]>["characteristics"]
    capabilityEvidence?: NonNullable<SessionContinuityMetadata["execution"]>["capabilityEvidence"]
    continuityStatus: SessionContinuityMetadata["status"]
    lifecyclePhase?: NonNullable<SessionContinuityMetadata["lifecycle"]>["phase"]
    updatedAt: number
    lastObservedAt?: number
  }
}

// ---------------------------------------------------------------------------
// Status transition table
// ---------------------------------------------------------------------------

const VALID_STATUS_TRANSITIONS: Record<DelegationPacketStatus, DelegationPacketStatus[]> = {
  pending: ["running", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: [],
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new DelegationPacket.
 *
 * @param spec        Human-readable task description. Must be non-empty.
 * @param parentChain Ordered chain of session IDs from root to current. Must be non-empty.
 * @returns A new packet with status "pending" and empty artifacts/commits.
 * @throws {Error} If spec is empty or parentChain has zero elements.
 */
export function createDelegationPacket(
  spec: string,
  parentChain: readonly string[],
): DelegationPacket {
  if (!spec.trim()) {
    throw new Error("[Harness] Delegation packet spec cannot be empty")
  }
  if (parentChain.length === 0) {
    throw new Error("[Harness] Delegation packet parentChain cannot be empty")
  }

  const now = Date.now()
  return {
    id: `dpkt_${now}_${Math.random().toString(36).slice(2, 8)}`,
    spec,
    plan: null,
    artifacts: [],
    commits: [],
    parentChain,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Mutators
// ---------------------------------------------------------------------------

/**
 * Transition the packet to a new status. Enforces the valid transition table.
 *
 * @throws {Error} If the transition is not permitted.
 */
export function updatePacketStatus(
  packet: DelegationPacket,
  newStatus: DelegationPacketStatus,
): void {
  const allowed = VALID_STATUS_TRANSITIONS[packet.status]
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `[Harness] Invalid delegation packet transition: ${packet.status} → ${newStatus}`,
    )
  }
  packet.status = newStatus
  packet.updatedAt = Date.now()
}

/**
 * Append a file path to the packet's artifact list.
 */
export function addArtifact(packet: DelegationPacket, filePath: string): void {
  packet.artifacts.push(filePath)
  packet.updatedAt = Date.now()
}

/**
 * Append a commit SHA to the packet's commit list.
 */
export function addCommit(packet: DelegationPacket, sha: string): void {
  packet.commits.push(sha)
  packet.updatedAt = Date.now()
}

/**
 * Set or overwrite the packet's plan text.
 */
export function setPlan(packet: DelegationPacket, plan: string): void {
  packet.plan = plan
  packet.updatedAt = Date.now()
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialize a packet to a JSON string.
 */
export function packetToJSON(packet: DelegationPacket): string {
  return JSON.stringify(packet)
}

/**
 * Deserialize a packet from a JSON string.
 *
 * @throws {Error} If the JSON is invalid or missing required fields.
 */
export function packetFromJSON(json: string): DelegationPacket {
  // JSON.parse throws naturally on malformed input — let it propagate.
  const parsed = JSON.parse(json) as Partial<DelegationPacket>

  if (!parsed.id || !parsed.spec || !parsed.parentChain) {
    throw new Error(
      "[Harness] Invalid delegation packet JSON: missing required fields (id, spec, parentChain)",
    )
  }

  return parsed as DelegationPacket
}

// ---------------------------------------------------------------------------
// Parent chain construction
// ---------------------------------------------------------------------------

/**
 * Build a parent chain for a session using the session-to-root mapping from
 * TaskStateManager. Returns an array ordered [root, ..., sessionID].
 *
 * If the session IS the root (no entry in the map, or maps to itself),
 * returns a single-element array [sessionID].
 *
 * @param sessionID    The current session.
 * @param sessionToRoot  Map from sessionID → rootID (mirrors TaskStateManager.sessionToRoot).
 */
export function buildParentChain(
  sessionID: string,
  sessionToRoot: Map<string, string>,
): string[] {
  const rootID = sessionToRoot.get(sessionID)

  // No mapping or self-mapping → this session is the root.
  if (rootID === undefined || rootID === sessionID) {
    return [sessionID]
  }

  // Two-level chain: [root, current].
  // Deeper hierarchies can be extended here when multi-hop mapping is introduced.
  return [rootID, sessionID]
}

export function buildDelegationPacketParentChain(args: {
  rootSessionID: string
  parentSessionID: string
  sessionID: string
}): string[] {
  return [args.rootSessionID, args.parentSessionID, args.sessionID].filter(
    (sessionID, index, chain) => sessionID.length > 0 && chain.indexOf(sessionID) === index,
  )
}

export function buildDelegationArtifactPacket(
  record: SessionContinuityRecord,
): DelegationArtifactPacket {
  const packet = record.metadata.delegationPacket
  const route = record.metadata.route

  if (!packet) {
    throw new Error(`[Harness] Cannot build delegation artifact for ${record.sessionID} without a canonical packet.`)
  }

  if (!route) {
    throw new Error(`[Harness] Cannot build delegation artifact for ${record.sessionID} without routing metadata.`)
  }

  return {
    ...packet,
    artifacts: [...packet.artifacts],
    commits: [...packet.commits],
    parentChain: [...packet.parentChain],
    lineage: {
      rootSessionID: record.metadata.rootSessionID,
      parentSessionID: record.metadata.parentSessionID,
      sessionID: record.sessionID,
    },
    specialist: {
      requestedCategory: route.requestedCategory,
      category: route.category,
      requestedAgent: route.requestedAgent,
      effectiveAgent: route.effectiveAgent,
      presetKey: route.presetKey,
      requestedModel: route.requestedModel,
      effectiveModel: route.effectiveModel,
      fallbackUsed: route.fallbackUsed,
      rationale: route.rationale,
    },
    execution: {
      runInBackground: record.metadata.runInBackground,
      family: record.metadata.execution?.family,
      submode: record.metadata.execution?.submode,
      rationale: record.metadata.execution?.rationale,
      characteristics: record.metadata.execution?.characteristics,
      capabilityEvidence: record.metadata.execution?.capabilityEvidence,
      continuityStatus: record.metadata.status,
      lifecyclePhase: record.metadata.lifecycle?.phase,
      updatedAt: record.metadata.updatedAt,
      lastObservedAt: record.metadata.lastObservedAt,
    },
  }
}
