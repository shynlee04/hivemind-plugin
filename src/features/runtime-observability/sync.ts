import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { discoverSlashCommandBundles } from '../../commands/slash-command/command-discovery.js'
import { createOpencodeAgentRegistry } from '../../shared/opencode-agent-registry.js'
import { createOpencodeSkillRegistry } from '../../shared/opencode-skill-registry.js'

export interface RuntimeSurfaceSyncOptions {
  packageRoot: string
  localPluginFile: string
  packagePluginName: string
  packagePluginEntry: string
  /**
   * When true, returns would-delete list without removing unmanaged files.
   * @default false
   */
  dryRun?: boolean
  /**
   * List of absolute paths to protect from deletion during sync.
   * Files matching these paths will not be listed in wouldDelete.
   * @default []
   */
  protectedPaths?: string[]
}

export interface RuntimeSurfaceSyncResult {
  pluginFile: string
  mirroredCommandFiles: string[]
  mirroredAgentFiles: string[]
  mirroredSkillFiles: string[]
  /**
   * Only present when dryRun is true.
   * List of paths that would be deleted if not in dry-run mode.
   */
  wouldDelete?: string[]
  /**
   * Only present when dryRun is true and protectedPaths were provided.
   * List of paths that were protected from deletion.
   */
  protected?: string[]
  /**
   * Only present when dryRun is true.
   * Always true when present.
   */
  dryRun?: true
}

function renderLocalPluginStub(options: RuntimeSurfaceSyncOptions): string {
  return [
    `import plugin from '${options.packagePluginEntry}'`,
    '',
    'export default plugin',
    '',
  ].join('\n')
}

interface SyncDirectoryResult {
  writtenPaths: string[]
  wouldDelete: string[]
  protectedItems: string[]
}

async function syncMirrorDirectory(
  directory: string,
  files: Map<string, string>,
  managedExtension: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<SyncDirectoryResult> {
  await mkdir(directory, { recursive: true })

  const sortedEntries = [...files.entries()].sort(([left], [right]) => left.localeCompare(right))
  const writtenPaths: string[] = []

  for (const [fileName, content] of sortedEntries) {
    const filePath = join(directory, fileName)
    await writeFile(filePath, content)
    writtenPaths.push(filePath)
  }

  const existingEntries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  const managedNames = new Set(files.keys())
  const protectedPathsSet = new Set(options.protectedPaths ?? [])
  const wouldDelete: string[] = []
  const protectedItems: string[] = []

  for (const entry of existingEntries) {
    if (!entry.isFile() || !entry.name.endsWith(managedExtension) || managedNames.has(entry.name)) {
      continue
    }
    const fullPath = join(directory, entry.name)
    if (protectedPathsSet.has(fullPath)) {
      protectedItems.push(fullPath)
      continue
    }
    wouldDelete.push(fullPath)
    if (!options.dryRun) {
      await rm(fullPath, { force: true })
    }
  }

  return { writtenPaths, wouldDelete, protectedItems }
}

async function syncSkillDirectory(
  skillsRoot: string,
  skillFiles: Map<string, string>,
  options: RuntimeSurfaceSyncOptions,
): Promise<SyncDirectoryResult> {
  await mkdir(skillsRoot, { recursive: true })

  const skillDirs = new Set<string>()
  for (const [path] of skillFiles) {
    const [skillId] = path.split('/')
    if (skillId) {
      skillDirs.add(skillId)
    }
  }

  const writtenPaths: string[] = []

  for (const skillId of skillDirs) {
    const skillDirPath = join(skillsRoot, skillId)
    await mkdir(skillDirPath, { recursive: true })

    const skillEntries = [...skillFiles.entries()]
      .filter(([path]) => path.startsWith(`${skillId}/`))
      .sort(([left], [right]) => left.localeCompare(right))

    for (const [relativePath, content] of skillEntries) {
      const filePath = join(skillsRoot, relativePath)
      const parentDir = join(filePath, '..')
      await mkdir(parentDir, { recursive: true })
      await writeFile(filePath, content)
      writtenPaths.push(filePath)
    }
  }

  const existingSkills = await readdir(skillsRoot, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  const protectedPathsSet = new Set(options.protectedPaths ?? [])
  const wouldDelete: string[] = []
  const protectedItems: string[] = []

  for (const entry of existingSkills) {
    if (!entry.isDirectory() || skillDirs.has(entry.name)) {
      continue
    }
    const fullPath = join(skillsRoot, entry.name)
    if (protectedPathsSet.has(fullPath)) {
      protectedItems.push(fullPath)
      continue
    }
    wouldDelete.push(fullPath)
    if (!options.dryRun) {
      await rm(fullPath, { recursive: true, force: true })
    }
  }

  return { writtenPaths, wouldDelete, protectedItems }
}

export async function syncRuntimeSurface(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<RuntimeSurfaceSyncResult> {
  const opencodeRoot = join(directory, '.opencode')
  const commandsRoot = join(opencodeRoot, 'commands')
  const agentsRoot = join(opencodeRoot, 'agents')
  const skillsRoot = join(opencodeRoot, 'skills')
  const pluginsRoot = join(opencodeRoot, 'plugins')
  const pluginFile = join(pluginsRoot, options.localPluginFile)
  const bundles = discoverSlashCommandBundles()
  const commandFiles = new Map<string, string>()
  const agentFiles = new Map<string, string>()
  const skillFiles = new Map<string, string>()

  for (const bundle of bundles) {
    if (commandFiles.has(bundle.commandFile)) {
      continue
    }
    const sourcePath = join(options.packageRoot, 'commands', bundle.commandFile)
    commandFiles.set(bundle.commandFile, await readFile(sourcePath, 'utf-8'))
  }

  for (const entry of createOpencodeAgentRegistry(options.packageRoot)) {
    agentFiles.set(`${entry.id}.md`, entry.runtimeMarkdown)
  }

  for (const entry of createOpencodeSkillRegistry(options.packageRoot)) {
    skillFiles.set(`${entry.id}/SKILL.md`, entry.runtimeMarkdown)
    for (const [refPath, content] of entry.referenceFiles) {
      skillFiles.set(`${entry.id}/${refPath}`, content)
    }
    for (const [templatePath, content] of entry.templateFiles) {
      skillFiles.set(`${entry.id}/${templatePath}`, content)
    }
    for (const [testPath, content] of entry.testFiles) {
      skillFiles.set(`${entry.id}/${testPath}`, content)
    }
  }

  await mkdir(pluginsRoot, { recursive: true })
  await writeFile(pluginFile, renderLocalPluginStub(options))
  const mirroredCommandFiles = await syncMirrorDirectory(commandsRoot, commandFiles, '.md', options)
  const mirroredAgentFiles = await syncMirrorDirectory(agentsRoot, agentFiles, '.md', options)
  const mirroredSkillFiles = await syncSkillDirectory(skillsRoot, skillFiles, options)

  const result: RuntimeSurfaceSyncResult = {
    pluginFile,
    mirroredCommandFiles: mirroredCommandFiles.writtenPaths,
    mirroredAgentFiles: mirroredAgentFiles.writtenPaths,
    mirroredSkillFiles: mirroredSkillFiles.writtenPaths,
  }

  if (options.dryRun) {
    result.dryRun = true
    result.wouldDelete = [
      ...mirroredCommandFiles.wouldDelete,
      ...mirroredAgentFiles.wouldDelete,
      ...mirroredSkillFiles.wouldDelete,
    ]
    result.protected = [
      ...mirroredCommandFiles.protectedItems,
      ...mirroredAgentFiles.protectedItems,
      ...mirroredSkillFiles.protectedItems,
    ]
  }

  return result
}
