/**
 * Governance config reader — facade over unified configs.json.
 *
 * Provides typed access to governance configuration via readConfigs().governance.
 * Backward compatible: same function signatures and return types.
 *
 * SR-05: Migrated from reading separate .hivemind/governance/config.json to
 * reading from the unified .hivemind/configs.json.governance via facade pattern.
 * HIVEMIND_GOVERNANCE_CONFIG_PATH env var removed per SPEC.
 *
 * @module governance-engine/config-reader
 */

import { z } from "zod"
import { readConfigs } from "../../schema-kernel/hivemind-configs.schema.js"

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Schema for the naming_standards section of the governance config. */
export const NamingStandardsSchema = z.object({
  allowed_frameworks: z.array(z.string()),
  allowed_workflows: z.array(z.string()).optional(),
  allowed_classifications: z.array(z.string()),
  naming_format: z.string(),
  description: z.string().optional(),
})

/** Schema for an individual agent config entry. */
const AgentConfigSchema = z.object({
  description: z.string(),
  model: z.object({ providerID: z.string(), modelID: z.string() }).optional(),
  allowedCommands: z.array(z.string()).optional(),
  defaultBrief: z.string().optional(),
})

/** Schema for a command config entry. */
const CommandConfigSchema = z.object({
  description: z.string().optional(),
  agent: z.string().optional(),
  template: z.string().optional(),
})

/** Schema for a template config entry. */
const TemplateConfigSchema = z.object({
  content: z.string().optional(),
  description: z.string().optional(),
})

/** Schema for the full governance config. */
export const GovernanceConfigSchema = z.object({
  version: z.string().optional(),
  defaultAgent: z.string().optional(),
  naming_standards: NamingStandardsSchema.optional(),
  agents: z.record(z.string(), AgentConfigSchema).optional(),
  agent_configs: z.record(z.string(), AgentConfigSchema).optional(),
  commands: z.record(z.string(), CommandConfigSchema).optional(),
  command_agent_mappings: z.record(z.string(), CommandConfigSchema).optional(),
  templates: z.record(z.string(), TemplateConfigSchema).optional(),
  rules: z.array(z.unknown()).optional(),
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Reads governance configuration from the unified configs.json.
 *
 * SR-05: Facade pattern — reads from readConfigs().governance instead of
 * a separate governance/config.json file. Backward compatible: same
 * function signature and return type.
 *
 * @param projectRoot - Optional project root (defaults to `process.cwd()`).
 * @returns Validated governance configuration.
 * @throws {Error} When governance config is missing or invalid.
 */
export function readGovernanceConfig(
  projectRoot?: string,
): GovernanceConfig {
  const root = projectRoot ?? process.cwd()
  const configs = readConfigs(root)
  const governance = configs.governance

  // Validate that governance has required structure
  const result = GovernanceConfigSchema.safeParse(governance)
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
 * Scans agent descriptions for case-insensitive keyword matches
 * in the brief. Returns the first matching agent name, or the
 * default agent if no match is found.
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
  const agents = config.agent_configs ?? config.agents ?? {}
  for (const [agentName, agentConfig] of Object.entries(agents)) {
    const description = (agentConfig.description ?? "").toLowerCase()
    const descWords = description.split(/\s+/)

    // Match if any word from the agent description appears in the brief
    for (const word of descWords) {
      if (word.length > 3 && lowerBrief.includes(word)) {
        return agentName
      }
    }
  }

  return config.defaultAgent ?? "hm-codebase-mapper"
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
  if (standards.allowed_workflows && !standards.allowed_workflows.includes(workflow)) return false
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
