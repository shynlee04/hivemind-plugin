import type { LineageScope, SessionKind } from "../schemas/brain-state.js"
import type { TaskLineageOwner, TaskSessionKind } from "../schemas/manifest.js"
import { inferSessionKindFromRole } from "./session-role.js"
import { classifyLineageScope } from "./session-intent-classifier.js"

export interface TaskOwnershipContext {
  lineage_owner: TaskLineageOwner
  owner_agent?: string
  origin_session_id?: string
  parent_session_id?: string
  session_kind: TaskSessionKind
}

function normalizeAgentName(agentName?: string): string | undefined {
  if (typeof agentName !== "string") return undefined
  const normalized = agentName.trim().toLowerCase()
  if (!normalized || normalized === "unknown" || normalized === "unresolved") {
    return undefined
  }
  return normalized
}

/**
 * Normalize arbitrary lineage-owner input into the canonical task contract.
 *
 * @param value - Raw lineage owner candidate.
 * @returns Canonical task lineage owner, or `undefined` when invalid.
 */
export function normalizeTaskLineageOwner(value?: string): TaskLineageOwner | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (normalized === "hiveminder" || normalized === "hivefiver" || normalized === "unknown") {
    return normalized
  }
  return undefined
}

/**
 * Normalize arbitrary session-kind input into the canonical task contract.
 *
 * @param value - Raw session-kind candidate.
 * @returns Canonical task session kind, or `undefined` when invalid.
 */
export function normalizeTaskSessionKind(value?: string): TaskSessionKind | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (normalized === "main" || normalized === "sub" || normalized === "unresolved") {
    return normalized
  }
  return undefined
}

/**
 * Convert the current brain-state lineage scope into the explicit task lineage
 * owner labels that will survive across task projections, graph sync, and
 * cross-session monitoring flows.
 *
 * @param lineageScope - Current session lineage scope.
 * @returns Task lineage owner label used by the canonical task contract.
 */
export function mapLineageScopeToTaskOwner(lineageScope?: LineageScope): TaskLineageOwner {
  switch (lineageScope) {
    case "meta-framework":
      return "hivefiver"
    case "project":
      return "hiveminder"
    default:
      return "unknown"
  }
}

/**
 * Resolve canonical task ownership from the best available session/runtime
 * signals without allowing unresolved compatibility fields to become primary
 * authority.
 *
 * @param input - Current agent/session ownership signals.
 * @returns Normalized task ownership metadata for the canonical task contract.
 */
export function resolveTaskOwnershipContext(input: {
  ownerAgent?: string
  lineageScope?: LineageScope
  originSessionId?: string
  parentSessionId?: string | null
  sessionKind?: SessionKind
}): TaskOwnershipContext {
  const owner_agent = normalizeAgentName(input.ownerAgent)
  const parent_session_id =
    typeof input.parentSessionId === "string" && input.parentSessionId.trim().length > 0
      ? input.parentSessionId.trim()
      : undefined

  const session_kind: TaskSessionKind =
    normalizeTaskSessionKind(input.sessionKind)
      ? normalizeTaskSessionKind(input.sessionKind)!
      : parent_session_id
        ? "sub"
        : owner_agent
          ? inferSessionKindFromRole(owner_agent)
          : "unresolved"

  const lineageScope: LineageScope =
    input.lineageScope && input.lineageScope !== "unknown"
      ? input.lineageScope
      : owner_agent
        ? classifyLineageScope(owner_agent)
        : "unknown"

  return {
    lineage_owner: mapLineageScopeToTaskOwner(lineageScope),
    owner_agent,
    origin_session_id:
      typeof input.originSessionId === "string" && input.originSessionId.trim().length > 0
        ? input.originSessionId.trim()
        : undefined,
    parent_session_id,
    session_kind,
  }
}
