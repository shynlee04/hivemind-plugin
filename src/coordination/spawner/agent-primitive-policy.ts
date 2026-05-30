import { loadPrimitives } from "../../features/bootstrap/primitive-loader.js"
import type { ValidatedAgent } from "./spawn-request-builder.js"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Convert OpenCode SDK tool metadata into a boolean tool map.
 *
 * @param value - Raw SDK agent `tools` value.
 * @returns Tool allow map when the SDK returned boolean entries.
 */
export function parseToolBooleans(value: unknown): Record<string, boolean> | undefined {
  if (!isRecord(value)) return undefined
  const entries = Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/**
 * Extract a permission map from raw SDK agent metadata.
 *
 * @param value - Raw SDK agent `permission` value.
 * @returns Permission record when present.
 */
export function parsePermissionRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

/**
 * Enrich live SDK agent metadata with local `.opencode/agents` primitive policy.
 *
 * @param agent - Agent metadata returned by the SDK.
 * @param projectRoot - Resolved OpenCode project root for local primitive lookup.
 * @returns Agent metadata with local description, permission, and legacy tools filled when available.
 */
export async function enrichAgentFromPrimitives(agent: ValidatedAgent, projectRoot: string): Promise<ValidatedAgent> {
  try {
    const primitives = await loadPrimitives({ projectRoot })
    const primitive = primitives.agents.get(agent.name)
    if (!primitive) return agent
    return {
      ...agent,
      description: agent.description ?? primitive.frontmatter.description,
      permission: agent.permission ?? primitive.frontmatter.permission,
      tools: agent.tools ?? primitive.frontmatter.tools,
    }
  } catch {
    return agent
  }
}
