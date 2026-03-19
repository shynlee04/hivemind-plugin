import { readFile } from 'node:fs/promises'
import YAML from 'yaml'

export async function loadToolInstruction(
  group: 'runtime' | 'commands',
  name: string,
): Promise<string> {
  const instructionUrl = new URL(`../../../tools/${group}/${name}.txt`, import.meta.url)
  return readFile(instructionUrl, 'utf-8')
}

export async function loadRuntimeHookInstruction(name: string): Promise<string> {
  return loadToolInstruction('runtime', name)
}

export interface CommandAssetFrontmatter {
  description?: string
  agent?: string
  subtask?: boolean
  model?: string
  [key: string]: unknown
}

export interface CommandRuntimeContract {
  usesArguments: boolean
  positionalArguments: string[]
  fileReferences: string[]
  shellCommands: string[]
  sections: string[]
  outputFields: string[]
  consumesState: string[]
  producesState: string[]
  verificationContract?: string
  closeoutGate: 'none' | 'advisory' | 'required'
  artifactProjections: string[]
}

export interface LoadedCommandAsset {
  fileName: string
  frontmatter: CommandAssetFrontmatter
  body: string
  raw: string
  contract: CommandRuntimeContract
}

function normalizeFrontmatterList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }

  return []
}

export function analyzeCommandBody(
  body: string,
  frontmatter: CommandAssetFrontmatter = {},
): CommandRuntimeContract {
  const positionalArguments = Array.from(
    new Set((body.match(/\$(?:ARGUMENTS|\d+)/g) ?? [])),
  )
  const fileReferences = Array.from(
    new Set(Array.from(body.matchAll(/(?:^|\s)@([./\w-][^\s`]*)/gm), (match) => match[1])),
  )
  const shellCommands = Array.from(
    new Set(Array.from(body.matchAll(/!\`([^`]+)\`/g), (match) => match[1].trim())),
  )
  const sections = Array.from(
    new Set(Array.from(body.matchAll(/^##\s+(.+)$/gm), (match) => match[1].trim())),
  )

  const outputContractMatch = body.match(/## Output Contract([\s\S]*?)(?:\n## |\s*$)/)
  const outputFields = outputContractMatch
    ? outputContractMatch[1]
        .split('\n')
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean)
    : []

  return {
    usesArguments: positionalArguments.length > 0,
    positionalArguments,
    fileReferences,
    shellCommands,
    sections,
    outputFields,
    consumesState: normalizeFrontmatterList(frontmatter.consumes_state),
    producesState: normalizeFrontmatterList(frontmatter.produces_state),
    verificationContract: typeof frontmatter.verification_contract === 'string'
      ? frontmatter.verification_contract
      : undefined,
    closeoutGate: frontmatter.closeout_gate === 'required' || frontmatter.closeout_gate === 'advisory'
      ? frontmatter.closeout_gate
      : 'none',
    artifactProjections: normalizeFrontmatterList(frontmatter.artifact_projections),
  }
}

function parseCommandFrontmatter(raw: string): LoadedCommandAsset {
  if (!raw.startsWith('---\n')) {
    return {
      fileName: '',
      frontmatter: {},
      body: raw,
      raw,
      contract: analyzeCommandBody(raw, {}),
    }
  }

  const closingIndex = raw.indexOf('\n---\n', 4)
  if (closingIndex === -1) {
    return {
      fileName: '',
      frontmatter: {},
      body: raw,
      raw,
      contract: analyzeCommandBody(raw, {}),
    }
  }

  const frontmatterBlock = raw.slice(4, closingIndex).trim()
  const body = raw.slice(closingIndex + 5).trim()
  const parsedFrontmatter = YAML.parse(frontmatterBlock) as CommandAssetFrontmatter | null
  const frontmatter = parsedFrontmatter ?? {}

  return {
    fileName: '',
    frontmatter,
    body,
    raw,
    contract: analyzeCommandBody(body, frontmatter),
  }
}

export async function loadCommandAsset(name: string): Promise<LoadedCommandAsset> {
  const fileName = `${name}.md`
  const commandUrl = new URL(`../../../commands/${fileName}`, import.meta.url)
  const raw = await readFile(commandUrl, 'utf-8')
  const parsed = parseCommandFrontmatter(raw)

  return {
    ...parsed,
    fileName,
  }
}

export async function loadCommandInstruction(name: string): Promise<string> {
  return (await loadCommandAsset(name)).raw
}
