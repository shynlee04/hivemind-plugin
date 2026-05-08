import type { DelegationSpawnRequest } from "./spawner-types.js"
import { DEFAULT_SAFETY_CEILING_MS } from "../../shared/types.js"

type PrimitivePermission = Record<string, unknown>

type ValidatedAgent = {
  name: string
  provider?: string
  model?: string
  category?: string
  description?: string
  permission?: PrimitivePermission
  tools?: Record<string, boolean>
}

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  safetyCeilingMs?: number
  workingDirectory?: string
  worktree?: string
  provider?: string
  model?: string
  category?: string
}

export type { ValidatedAgent, DelegateParams }

const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const
const WRITE_CAPABLE_TOOLS = ["read", "edit", "write", "bash", "glob", "grep"] as const
const WRITE_TOOLS = new Set(["edit", "write", "bash"])
const REVIEW_MARKERS = ["review", "critic", "audit", "verify", "research", "inspect", "read-only"]

/**
 * Build a canonical SDK spawn request from delegation dispatch parameters.
 */
export function buildSdkSpawnRequest(
  params: DelegateParams,
  agent: ValidatedAgent,
  workingDirectory: string,
): DelegationSpawnRequest {
  return {
    parentSessionId: params.parentSessionId,
    agent: agent.name,
    title: params.title ?? `Delegation: ${agent.name}`,
    prompt: params.prompt,
    workingDirectory,
    executionMode: "sdk",
    safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
    permissionProfile: resolveDelegationPermissionProfile(params, agent),
  }
}

/**
 * Derive the least-privilege delegated tool profile from selected agent
 * primitive metadata and task intent.
 *
 * @param params - User delegation request details used for task-intent checks.
 * @param agent - Selected OpenCode agent metadata from live or local primitive data.
 * @returns Conservative prompt-time tool allowlist for the child session.
 *
 * @example
 * ```typescript
 * const profile = resolveDelegationPermissionProfile({ agent: "critic", prompt: "review", parentSessionId: "p" }, { name: "critic" });
 * // profile.mode === "review-only"
 * ```
 */
export function resolveDelegationPermissionProfile(
  params: Pick<DelegateParams, "agent" | "title" | "prompt" | "category">,
  agent: ValidatedAgent,
): DelegationSpawnRequest["permissionProfile"] {
  const explicitTools = toolsFromAgentMetadata(agent)
  const intentTools = isReviewOnlyTask(params, agent) ? READ_ONLY_TOOLS : undefined
  const tools = explicitTools ?? intentTools ?? READ_ONLY_TOOLS
  const writeCapable = tools.some((toolName) => WRITE_TOOLS.has(toolName))
  return {
    mode: writeCapable ? "write-capable" : (isReviewOnlyTask(params, agent) ? "review-only" : "read-only"),
    tools,
  }
}

function toolsFromAgentMetadata(agent: ValidatedAgent): readonly string[] | undefined {
  if (agent.tools) {
    const allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => agent.tools?.[toolName] === true)
    return allowed.length > 0 ? allowed : READ_ONLY_TOOLS
  }
  if (!agent.permission) return undefined
  const allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => isPermissionAllowed(agent.permission?.[toolName]))
  const denied = new Set(WRITE_CAPABLE_TOOLS.filter((toolName) => isPermissionDenied(agent.permission?.[toolName])))
  addPromptToolDenialsForPrimitivePolicy(agent.permission, denied)
  const result = allowed.filter((toolName) => !denied.has(toolName))
  return result.length > 0 ? result : READ_ONLY_TOOLS
}

/**
 * Expand OpenCode primitive-level deny records into the prompt-time tool IDs
 * controlled by the harness delegation layer.
 *
 * @param permission - Agent primitive permission map from OpenCode metadata.
 * @param denied - Mutable set of prompt-time tool names that must not be auto-allowed.
 */
function addPromptToolDenialsForPrimitivePolicy(permission: PrimitivePermission, denied: Set<string>): void {
  if (isPermissionDenied(permission.edit)) {
    denied.add("edit")
    denied.add("write")
  }
  if (isPermissionDenied(permission.write)) {
    denied.add("write")
  }
}

function isPermissionAllowed(value: unknown): boolean {
  if (value === true || value === "allow") return true
  if (typeof value !== "object" || value === null) return false
  return Object.values(value as Record<string, unknown>).some(isPermissionAllowed)
}

function isPermissionDenied(value: unknown): boolean {
  if (value === false || value === "deny") return true
  if (typeof value !== "object" || value === null) return false
  const nestedValues = Object.values(value as Record<string, unknown>)
  return nestedValues.length > 0 && nestedValues.every(isPermissionDenied)
}

function isReviewOnlyTask(
  params: Pick<DelegateParams, "agent" | "title" | "prompt" | "category">,
  agent: ValidatedAgent,
): boolean {
  const haystack = [params.agent, params.title, params.prompt, params.category, agent.name, agent.category, agent.description]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
  return REVIEW_MARKERS.some((marker) => haystack.includes(marker))
}
