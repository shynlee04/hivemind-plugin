/**
 * Governance config reader — typed access to `.hivemind/governance/config.json`.
 *
 * Provides Zod schema validation, typed config access, agent resolution from
 * brief content, and naming title validation against allowed standards.
 *
 * @module governance-engine/config-reader
 */

import { z } from "zod"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Schema for the naming_standards section of the governance config. */
export const NamingStandardsSchema = z.object({
  allowed_frameworks: z.array(z.string()),
  allowed_workflows: z.array(z.string()),
  allowed_classifications: z.array(z.string()),
  naming_format: z.string(),
  description: z.string(),
})

/** Schema for an individual agent config entry. */
const AgentConfigSchema = z.object({
  description: z.string(),
  model: z.object({ providerID: z.string(), modelID: z.string() }).optional(),
  allowedCommands: z.array(z.string()),
  defaultBrief: z.string().optional(),
})

/** Schema for a command config entry. */
const CommandConfigSchema = z.object({
  description: z.string(),
  agent: z.string().optional(),
  template: z.string().optional(),
})

/** Schema for a template config entry. */
const TemplateConfigSchema = z.object({
  content: z.string(),
})

/** Schema for the full governance config. */
export const GovernanceConfigSchema = z.object({
  version: z.string(),
  defaultAgent: z.string(),
  naming_standards: NamingStandardsSchema.optional(),
  agents: z.record(z.string(), AgentConfigSchema),
  commands: z.record(z.string(), CommandConfigSchema),
  templates: z.record(z.string(), TemplateConfigSchema),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Typed governance configuration. */
export type GovernanceConfig = z.infer<typeof GovernanceConfigSchema>
/** Typed naming standards section. */
export type NamingStandardsConfig = z.infer<typeof NamingStandardsSchema>
/** Typed agent config entry. */
export type AgentConfig = z.infer<typeof AgentConfigSchema>
/** Typed command config entry. */
export type CommandConfig = z.infer<typeof CommandConfigSchema>

// ---------------------------------------------------------------------------
// Config path resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the governance config file path.
 *
 * Supports `HIVEMIND_GOVERNANCE_CONFIG_PATH` env var override.
 * Defaults to `.hivemind/governance/config.json` under the project root.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Absolute path to the governance config file.
 */
function resolveConfigPath(projectRoot: string): string {
  const envPath = process.env.HIVEMIND_GOVERNANCE_CONFIG_PATH
  if (envPath) return envPath
  return join(projectRoot, ".hivemind", "governance", "config.json")
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads and validates the governance config from disk.
 *
 * Uses Zod `safeParse` to validate the JSON payload. Returns a typed
 * `GovernanceConfig` or throws a descriptive `[Harness]`-prefixed error.
 *
 * @param projectRoot - Optional project root (defaults to `process.cwd()`).
 * @returns Validated governance configuration.
 * @throws {Error} When the config file is missing, unparseable, or invalid.
 */
export async function readGovernanceConfig(
  projectRoot?: string,
): Promise<GovernanceConfig> {
  const root = projectRoot ?? process.cwd()
  const configPath = resolveConfigPath(root)

  let raw: string
  try {
    raw = await readFile(configPath, "utf-8")
  } catch (err) {
    throw new Error(
      `[Harness] Governance config not found at "${configPath}": ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(
      `[Harness] Governance config at "${configPath}" is not valid JSON`,
    )
  }

  const result = GovernanceConfigSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `[Harness] Governance config validation failed: ${result.error.message}`,
    )
  }

  return result.data
}

/**
 * Resolves an agent name from a brief by keyword matching.
 *
 * Scans `config.agents` descriptions for case-insensitive keyword matches
 * in the brief. Returns the first matching agent name, or `config.defaultAgent`
 * if no match is found.
 *
 * @param brief - The governance brief text to scan.
 * @param config - The governance configuration.
 * @returns The resolved agent name.
 */
export function resolveAgentForBrief(
  brief: string,
  config: GovernanceConfig,
): string {
  const lowerBrief = brief.toLowerCase()

  // Scan agents in definition order for keyword matches
  for (const [agentName, agentConfig] of Object.entries(config.agents)) {
    const description = agentConfig.description.toLowerCase()
    const descWords = description.split(/\s+/)

    // Match if any word from the agent description appears in the brief
    for (const word of descWords) {
      if (word.length > 3 && lowerBrief.includes(word)) {
        return agentName
      }
    }
  }

  return config.defaultAgent
}

/**
 * Validates a session title against naming standards.
 *
 * Parses the title using simple string splitting (not importing the naming
 * service — keeps config reader dependency-free) and verifies framework,
 * workflow, and classification against the allowed lists.
 *
 * @param title - The session title to validate.
 * @param standards - The naming standards configuration.
 * @returns `true` if the title conforms to the naming standards.
 */
export function validateNamingTitle(
  title: string,
  standards: NamingStandardsConfig,
): boolean {
  const segments = title.split("/")
  if (segments.length !== 5) return false

  const [framework, workflow, classification] = segments

  if (!standards.allowed_frameworks.includes(framework)) return false
  if (!standards.allowed_workflows.includes(workflow)) return false
  if (!standards.allowed_classifications.includes(classification)) return false

  // Validate last segment has @ separator with numeric depth
  const lastSegment = segments[4]
  const atIndex = lastSegment.lastIndexOf("@")
  if (atIndex === -1) return false
  const depthStr = lastSegment.slice(atIndex + 1)
  const depth = Number(depthStr)
  if (!Number.isInteger(depth) || isNaN(depth) || depth < 0) return false

  return true
}
