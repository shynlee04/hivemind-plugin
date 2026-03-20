import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { discoverSlashCommandBundles } from '../../commands/slash-command/command-discovery.js'
import { createOpencodeAgentRegistry } from '../../shared/opencode-agent-registry.js'

export interface RuntimeSurfaceSyncOptions {
  packageRoot: string
  localPluginFile: string
  packagePluginName: string
  packagePluginEntry: string
}

export interface RuntimeSurfaceSyncResult {
  pluginFile: string
  mirroredCommandFiles: string[]
  mirroredAgentFiles: string[]
}

function renderLocalPluginStub(options: RuntimeSurfaceSyncOptions): string {
  return [
    `import plugin from '${options.packagePluginEntry}'`,
    '',
    'export default plugin',
    '',
  ].join('\n')
}

async function syncMirrorDirectory(
  directory: string,
  files: Map<string, string>,
  managedExtension: string,
): Promise<string[]> {
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
  await Promise.all(existingEntries.map(async (entry) => {
    if (!entry.isFile() || !entry.name.endsWith(managedExtension) || managedNames.has(entry.name)) {
      return
    }
    await rm(join(directory, entry.name), { force: true })
  }))

  return writtenPaths
}

export async function syncRuntimeSurface(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<RuntimeSurfaceSyncResult> {
  const opencodeRoot = join(directory, '.opencode')
  const commandsRoot = join(opencodeRoot, 'commands')
  const agentsRoot = join(opencodeRoot, 'agents')
  const pluginsRoot = join(opencodeRoot, 'plugins')
  const pluginFile = join(pluginsRoot, options.localPluginFile)
  const bundles = discoverSlashCommandBundles()
  const commandFiles = new Map<string, string>()
  const agentFiles = new Map<string, string>()

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

  await mkdir(pluginsRoot, { recursive: true })
  await writeFile(pluginFile, renderLocalPluginStub(options))
  const mirroredCommandFiles = await syncMirrorDirectory(commandsRoot, commandFiles, '.md')
  const mirroredAgentFiles = await syncMirrorDirectory(agentsRoot, agentFiles, '.md')

  return {
    pluginFile,
    mirroredCommandFiles,
    mirroredAgentFiles,
  }
}
