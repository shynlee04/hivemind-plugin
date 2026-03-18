import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import YAML from 'yaml'
import { z } from 'zod'

import type { SlashCommandBundle } from '../commands/slash-command/command-types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..', '..')

const permissionActionSchema = z.enum(['ask', 'allow', 'deny'])
const permissionRuleSchema = z.union([
  permissionActionSchema,
  z.record(z.string(), permissionActionSchema),
])

const toolToggleSchema = z.record(z.string(), z.boolean())

const runtimeAgentFrontmatterSchema = z.object({
  description: z.string().min(1),
  mode: z.enum(['primary', 'subagent', 'all']),
  model: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  prompt: z.string().min(1).optional(),
  tools: toolToggleSchema.optional(),
  permission: z.record(z.string(), permissionRuleSchema).optional(),
  disable: z.boolean().optional(),
  hidden: z.boolean().optional(),
  color: z.string().min(1).optional(),
  steps: z.number().int().positive().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
}).strict()

const canonicalAgentContractSchema = z.object({
  may_execute: z.boolean(),
  may_delegate: z.boolean(),
  terminal: z.boolean(),
  accept_gate: z.string().min(1),
  workflow_order: z.array(z.string().min(1)).min(1),
  verify_gate: z.string().min(1),
  failure_return: z.string().min(1),
  scope_paths: z.array(z.string().min(1)).min(1),
}).strict()

const canonicalAgentFrontmatterSchema = runtimeAgentFrontmatterSchema.extend({
  contract: canonicalAgentContractSchema.optional(),
}).strict()

export type RuntimeAgentFrontmatter = z.infer<typeof runtimeAgentFrontmatterSchema>
export type CanonicalAgentFrontmatter = z.infer<typeof canonicalAgentFrontmatterSchema>

export interface OpencodeAgentRegistryEntry {
  id: string
  sourcePath: string
  canonicalFrontmatter: CanonicalAgentFrontmatter
  runtimeFrontmatter: RuntimeAgentFrontmatter
  body: string
  runtimeMarkdown: string
}

export interface SlashCommandAgentBindingValidation {
  missingAgentIds: string[]
}

function parseMarkdownFrontmatter(raw: string): {
  frontmatter: Record<string, unknown>
  body: string
} {
  if (!raw.startsWith('---\n')) {
    return { frontmatter: {}, body: raw.trimStart() }
  }

  const closingIndex = raw.indexOf('\n---\n', 4)
  if (closingIndex === -1) {
    return { frontmatter: {}, body: raw.trimStart() }
  }

  const frontmatterBlock = raw.slice(4, closingIndex).trim()
  const body = raw.slice(closingIndex + 5).trimStart()
  const parsed = YAML.parse(frontmatterBlock) as Record<string, unknown> | null

  return {
    frontmatter: parsed ?? {},
    body,
  }
}

function renderProjectedAgentMarkdown(frontmatter: RuntimeAgentFrontmatter, body: string): string {
  return `---\n${YAML.stringify(frontmatter).trimEnd()}\n---\n\n${body.trimStart()}`
}

function projectRuntimeFrontmatter(frontmatter: CanonicalAgentFrontmatter): RuntimeAgentFrontmatter {
  const { contract: _contract, ...runtimeFrontmatter } = frontmatter
  return runtimeAgentFrontmatterSchema.parse(runtimeFrontmatter)
}

/**
 * Load the canonical agent authoring files and project them into runtime-safe
 * OpenCode agent markdown with SDK-valid frontmatter only.
 */
export function createOpencodeAgentRegistry(rootDir: string = PACKAGE_ROOT): OpencodeAgentRegistryEntry[] {
  const agentsDir = join(rootDir, 'agents')
  const entries = readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.endsWith('.deprecated.md'))
    .sort((left, right) => left.name.localeCompare(right.name))

  return entries.map((entry) => {
    const sourcePath = join(agentsDir, entry.name)
    const raw = readFileSync(sourcePath, 'utf-8')
    const parsed = parseMarkdownFrontmatter(raw)
    const canonicalFrontmatter = canonicalAgentFrontmatterSchema.parse(parsed.frontmatter)
    const runtimeFrontmatter = projectRuntimeFrontmatter(canonicalFrontmatter)

    return {
      id: entry.name.replace(/\.md$/u, ''),
      sourcePath,
      canonicalFrontmatter,
      runtimeFrontmatter,
      body: parsed.body,
      runtimeMarkdown: renderProjectedAgentMarkdown(runtimeFrontmatter, parsed.body),
    }
  })
}

export function validateSlashCommandAgentBindings(
  bundles: SlashCommandBundle[],
  registry: OpencodeAgentRegistryEntry[],
): SlashCommandAgentBindingValidation {
  const validAgentIds = new Set(registry.map((entry) => entry.id))
  const missingAgentIds = [...new Set(
    bundles
      .map((bundle) => bundle.agent)
      .filter((agentId) => !validAgentIds.has(agentId)),
  )]

  return { missingAgentIds }
}

export function assertSlashCommandAgentBindings(
  bundles: SlashCommandBundle[],
  registry: OpencodeAgentRegistryEntry[] = createOpencodeAgentRegistry(),
): void {
  const validation = validateSlashCommandAgentBindings(bundles, registry)
  if (validation.missingAgentIds.length === 0) {
    return
  }

  throw new Error(`Slash command bundles reference unknown agents: ${validation.missingAgentIds.join(', ')}`)
}
