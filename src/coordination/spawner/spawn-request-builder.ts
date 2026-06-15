import { generateSessionTitle } from "../../shared/session-naming.js"
import { READ_ONLY_TOOLS, WRITE_CAPABLE_TOOLS, WRITE_TOOLS } from "../../features/capability-gate/index.js"
import type { DelegationSpawnRequest } from "./spawner-types.js"

type PrimitivePermission = Record<string, unknown>

type ValidatedAgent = {
  name: string
  provider?: string
  model?: string
  description?: string
  permission?: PrimitivePermission
  tools?: Record<string, boolean>
}

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  context?: string
  stackOnSessionId?: string
  workingDirectory?: string
  worktree?: string
  provider?: string
  model?: string
}

export type { ValidatedAgent, DelegateParams }

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
    title: params.title ?? generateSessionTitle({
      framework: "hm",
      workflow: "delegate",
      classification: "child",
      agent: agent.name,
      purpose: params.prompt.slice(0, 40).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      depth: 1,
    }),
    prompt: params.prompt,
    workingDirectory,
    executionMode: "sdk",
    permissionProfile: resolveDelegationPermissionProfile(params, agent),
  }
}

/**
 * Merge multiple tool arrays into a deduplicated set.
 * Falls back to WRITE_CAPABLE_TOOLS when the resulting set is empty.
 *
 * @param sets - Variable number of tool name arrays to merge.
 * @returns Deduplicated array of valid tool names.
 */
function mergeToolSets(...sets: (readonly string[] | undefined)[]): readonly string[] {
  const merged = new Set<string>()
  for (const set of sets) {
    if (set) {
      for (const tool of set) {
        merged.add(tool)
      }
    }
  }
  return merged.size > 0 ? Array.from(merged) : [...WRITE_CAPABLE_TOOLS]
}

/**
 * Derive the least-privilege delegated tool profile from selected agent
 * primitive metadata and task intent.
 *
 * Resolution order: explicit metadata → intent → fallback.
 * Tool access is now fully owned by OpenCode's `permission:` field;
 * the harness no longer applies a capability-gate overlay.
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
  params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  agent?: ValidatedAgent,
): DelegationSpawnRequest["permissionProfile"] {
  const explicitTools = agent ? toolsFromAgentMetadata(agent) : undefined

  // No metadata at all → read-only (or review-only for review intent)
  if (!explicitTools) {
    if (isReviewOnlyTask(params, agent)) {
      return { mode: "review-only", tools: [...READ_ONLY_TOOLS] }
    }
    return { mode: "read-only", tools: [...READ_ONLY_TOOLS] }
  }

  const mergedTools = mergeToolSets(explicitTools)
  const writeCapable = mergedTools.some((toolName) => WRITE_TOOLS.has(toolName))
  const reviewOnly = isReviewOnlyTask(params, agent)
  return {
    mode: writeCapable ? "write-capable" : (reviewOnly ? "review-only" : "read-only"),
    tools: mergedTools,
  }
}

function toolsFromAgentMetadata(agent: ValidatedAgent): readonly string[] | undefined {
  let allowed: string[] = []

  if (agent.tools) {
    allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => {
      const value = agent.tools?.[toolName]
      if (value === undefined && (toolName === "read" || toolName === "glob" || toolName === "grep" || toolName === "execute-slash-command")) {
        return true
      }
      return value === true
    })
  } else if (agent.permission) {
    allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => {
      const value = agent.permission?.[toolName]
      if (value === undefined && (toolName === "read" || toolName === "glob" || toolName === "grep" || toolName === "execute-slash-command")) {
        return true
      }
      return isPermissionAllowed(value)
    })
  } else {
    return undefined
  }

  const denied = new Set<string>()
  WRITE_CAPABLE_TOOLS.forEach((toolName) => {
    if (agent.tools?.[toolName] === false || isPermissionDenied(agent.permission?.[toolName])) {
      denied.add(toolName)
    }
  })
  if (agent.permission) {
    addPromptToolDenialsForPrimitivePolicy(agent.permission, denied)
  }

  const result = allowed.filter((toolName) => !denied.has(toolName))
  return result.length > 0 ? result : READ_ONLY_TOOLS
}

/**
 * Expand OpenCode primitive-level ask records into the prompt-time tool IDs
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
  if (value === true || value === "allow" || value === "ask") return true
  if (typeof value !== "object" || value === null) return false
  return Object.values(value as Record<string, unknown>).some(isPermissionAllowed)
}

function isPermissionDenied(value: unknown): boolean {
  if (value === false) return true
  if (typeof value !== "object" || value === null) return false
  const nestedValues = Object.values(value as Record<string, unknown>)
  return nestedValues.length > 0 && nestedValues.every(isPermissionDenied)
}

function isReviewOnlyTask(
  params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  agent?: ValidatedAgent,
): boolean {
  const haystack = [params.agent, params.title, params.prompt, agent?.name, agent?.description]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
  return REVIEW_MARKERS.some((marker) => haystack.includes(marker))
}
