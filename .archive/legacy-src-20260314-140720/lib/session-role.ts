import type {
  BrainState,
  LineageScope,
  RoleSource,
  SessionKind,
} from "../schemas/brain-state.js"

const MAIN_ROLE_MARKERS = ["hiveminder", "hivefiver", "hiveplanner"]
const SUB_ROLE_MARKERS = ["hivemaker", "hivehealer", "hiveq", "hivexplorer", "hiverd", "hitea", "subagent"]
const META_FRAMEWORK_MARKERS = ["hivefiver", "hiveminder", "hiveplanner"]

function normalizeRole(role: string): string {
  return role.trim().toLowerCase()
}

export function inferSessionKindFromRole(role: string): SessionKind {
  const normalizedRole = normalizeRole(role)
  if (!normalizedRole) return "unresolved"
  if (normalizedRole === "main") return "main"
  if (normalizedRole === "sub") return "sub"
  if (SUB_ROLE_MARKERS.some((marker) => normalizedRole.includes(marker))) return "sub"
  if (MAIN_ROLE_MARKERS.some((marker) => normalizedRole.includes(marker))) return "main"
  return "unresolved"
}

export function inferLineageScopeFromRole(role: string): LineageScope {
  const normalizedRole = normalizeRole(role)
  if (!normalizedRole) return "unknown"
  if (META_FRAMEWORK_MARKERS.some((marker) => normalizedRole.includes(marker))) return "meta-framework"
  return "project"
}

export interface ResolvedSessionRoleContext {
  role: string
  kind: SessionKind
  lineage_scope: LineageScope
  role_source: RoleSource
}

export function resolveSessionRoleContext(state: BrainState): ResolvedSessionRoleContext {
  const normalizedRole = normalizeRole(state.session.role)
  const inferredKind = inferSessionKindFromRole(normalizedRole)
  const inferredLineageScope = inferLineageScopeFromRole(normalizedRole)

  const role_source: RoleSource = normalizedRole
    ? state.session.role_source === "unset"
      ? "inferred"
      : state.session.role_source
    : "unset"

  const kind: SessionKind =
    state.session.kind !== "unresolved"
      ? state.session.kind
      : inferredKind

  const lineage_scope: LineageScope =
    state.session.lineage_scope !== "unknown"
      ? state.session.lineage_scope
      : inferredLineageScope

  return {
    role: normalizedRole,
    kind,
    lineage_scope,
    role_source,
  }
}

export function applyResolvedSessionRoleContext(state: BrainState): BrainState {
  const resolved = resolveSessionRoleContext(state)
  const currentRole = normalizeRole(state.session.role)

  const roleChanged = currentRole !== resolved.role
  const kindChanged = state.session.kind !== resolved.kind
  const scopeChanged = state.session.lineage_scope !== resolved.lineage_scope
  const sourceChanged = state.session.role_source !== resolved.role_source

  if (!roleChanged && !kindChanged && !scopeChanged && !sourceChanged) {
    return state
  }

  return {
    ...state,
    session: {
      ...state.session,
      role: resolved.role,
      kind: resolved.kind,
      lineage_scope: resolved.lineage_scope,
      role_source: resolved.role_source,
    },
  }
}

export function isSubSession(state: BrainState): boolean {
  const resolved = resolveSessionRoleContext(state)
  return resolved.kind === "sub"
}

export function isMainSession(state: BrainState): boolean {
  const resolved = resolveSessionRoleContext(state)
  return resolved.kind === "main"
}

export function shouldSuppressHumanFacingGovernance(state: BrainState): boolean {
  return isSubSession(state)
}
