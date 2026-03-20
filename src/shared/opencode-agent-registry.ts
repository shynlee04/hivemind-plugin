import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import YAML from 'yaml'

import type { SlashCommandBundle } from '../commands/slash-command/command-types.js'

interface CanonicalAgentFrontmatter {
  description?: string
  mode?: string
  tools?: Record<string, unknown>
  permission?: Record<string, unknown>
  [key: string]: unknown
}

interface RuntimeAgentFrontmatter {
  description?: string
  mode?: string
  tools?: Record<string, unknown>
  permission?: Record<string, unknown>
}

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

const RUNTIME_FRONTMATTER_KEYS = ['description', 'mode', 'tools', 'permission'] as const

export const OPENCODE_AGENT_REGISTRY_IDS = [
  'hivefiver',
  'hivemaker',
  'hiveminder',
  'hiveplanner',
  'hiveq',
  'hivehealer',
  'hivexplorer',
  'hiverd',
  'hitea',
] as const

function splitFrontmatter(markdown: string): {
  frontmatter: CanonicalAgentFrontmatter
  body: string
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    throw new Error('Agent markdown must start with YAML frontmatter')
  }

  const [, yamlSource, body = ''] = match
  const parsed = YAML.parse(yamlSource) as CanonicalAgentFrontmatter | null

  return {
    frontmatter: parsed ?? {},
    body,
  }
}

function projectRuntimeFrontmatter(
  frontmatter: CanonicalAgentFrontmatter,
): RuntimeAgentFrontmatter {
  const runtimeFrontmatter: RuntimeAgentFrontmatter = {}

  for (const key of RUNTIME_FRONTMATTER_KEYS) {
    const value = frontmatter[key]
    if (value !== undefined) {
      runtimeFrontmatter[key] = value as never
    }
  }

  return runtimeFrontmatter
}

function renderRuntimeMarkdown(
  runtimeFrontmatter: RuntimeAgentFrontmatter,
  body: string,
): string {
  const renderedFrontmatter = YAML.stringify(runtimeFrontmatter).trimEnd()
  const trimmedBody = body.replace(/^\n+/, '')
  return `---\n${renderedFrontmatter}\n---\n\n${trimmedBody}`
}

function loadAgentMarkdown(packageRoot: string, id: string): string {
  return readFileSync(join(packageRoot, 'agents', `${id}.deprecated.md`), 'utf-8')
}

function buildRegistryEntry(packageRoot: string, id: string): OpencodeAgentRegistryEntry {
  const sourcePath = join(packageRoot, 'agents', `${id}.deprecated.md`)
  const source = loadAgentMarkdown(packageRoot, id)
  const { frontmatter, body } = splitFrontmatter(source)
  const runtimeFrontmatter = projectRuntimeFrontmatter(frontmatter)

  return {
    id,
    sourcePath,
    canonicalFrontmatter: frontmatter,
    runtimeFrontmatter,
    body,
    runtimeMarkdown: renderRuntimeMarkdown(runtimeFrontmatter, body),
  }
}

export function createOpencodeAgentRegistry(packageRoot: string): OpencodeAgentRegistryEntry[] {
  return OPENCODE_AGENT_REGISTRY_IDS.map((id) => buildRegistryEntry(packageRoot, id))
}

export function validateSlashCommandAgentBindings(
  bundles: SlashCommandBundle[],
  registry: OpencodeAgentRegistryEntry[],
): SlashCommandAgentBindingValidation {
  const registryIds = new Set(registry.map((entry) => entry.id))
  const missingAgentIds = [...new Set(
    bundles
      .map((bundle) => bundle.agent)
      .filter((agentId) => !registryIds.has(agentId)),
  )]

  return { missingAgentIds }
}

export function assertSlashCommandAgentBindings(
  bundles: SlashCommandBundle[],
  registry: OpencodeAgentRegistryEntry[] = createOpencodeAgentRegistry(process.cwd()),
): void {
  const validation = validateSlashCommandAgentBindings(bundles, registry)
  if (validation.missingAgentIds.length === 0) {
    return
  }

  throw new Error(
    `Missing projected OpenCode agents: ${validation.missingAgentIds.join(', ')}`,
  )
}
