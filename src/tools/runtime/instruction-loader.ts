import { readFile } from 'node:fs/promises'

export async function loadToolInstruction(
  group: 'runtime' | 'commands',
  name: string,
): Promise<string> {
  const instructionUrl = new URL(`../../../tools/${group}/${name}.txt`, import.meta.url)
  return readFile(instructionUrl, 'utf-8')
}

export async function loadRuntimeToolInstruction(name: string): Promise<string> {
  return loadToolInstruction('runtime', name)
}

export interface CommandAssetFrontmatter {
  description?: string
  agent?: string
  subtask?: boolean
}

export interface LoadedCommandAsset {
  fileName: string
  frontmatter: CommandAssetFrontmatter
  body: string
  raw: string
}

function parseCommandFrontmatter(raw: string): LoadedCommandAsset {
  if (!raw.startsWith('---\n')) {
    return {
      fileName: '',
      frontmatter: {},
      body: raw,
      raw,
    }
  }

  const closingIndex = raw.indexOf('\n---\n', 4)
  if (closingIndex === -1) {
    return {
      fileName: '',
      frontmatter: {},
      body: raw,
      raw,
    }
  }

  const frontmatterBlock = raw.slice(4, closingIndex).trim()
  const body = raw.slice(closingIndex + 5).trim()
  const frontmatter = frontmatterBlock.split('\n').reduce<CommandAssetFrontmatter>((result, line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      return result
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, '$1')
    if (key === 'subtask') {
      result.subtask = value === 'true'
      return result
    }

    if (key === 'description' || key === 'agent') {
      result[key] = value
    }

    return result
  }, {})

  return {
    fileName: '',
    frontmatter,
    body,
    raw,
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
