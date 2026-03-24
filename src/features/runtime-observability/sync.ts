import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface RuntimeSurfaceSyncOptions {
  packageRoot: string
  localPluginFile: string
  packagePluginName: string
  packagePluginEntry: string
  dryRun?: boolean
  protectedPaths?: string[]
  excludedSkillIds?: string[]
}

export interface RuntimeSurfaceSyncResult {
  pluginFile: string
}

interface OpenCodeConfig {
  $schema?: string
  plugin?: string[]
  [key: string]: unknown
}

function renderLocalPluginStub(options: RuntimeSurfaceSyncOptions): string {
  return [
    `import plugin from '${options.packagePluginEntry}'`,
    '',
    'export default plugin',
    '',
  ].join('\n')
}

async function writeFileIfChanged(filePath: string, content: string): Promise<void> {
  const existingContent = await readFileIfChanged(filePath, 'utf-8')

  if (existingContent === content) {
    return
  }

  await writeFile(filePath, content)
}

async function readFileIfChanged(filePath: string, encoding: BufferEncoding): Promise<string | undefined> {
  try {
    const { readFile: fsReadFile } = await import('node:fs/promises')
    return await fsReadFile(filePath, encoding)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

/**
 * Adds the plugin reference to opencode.json's plugin array if not already present.
 * The plugin path is relative to the project root (directory).
 */
async function syncPluginConfig(
  directory: string,
  localPluginFile: string,
): Promise<void> {
  const configPath = join(directory, 'opencode.json')
  let config: OpenCodeConfig = {}

  const existingContent = await readFileIfChanged(configPath, 'utf-8')
  if (existingContent) {
    try {
      config = JSON.parse(existingContent)
    } catch {
      // If JSON is invalid, start fresh
      config = {}
    }
  }

  // Initialize plugin array if not present
  if (!config.plugin) {
    config.plugin = []
  }

  // Compute relative path from project root to plugin stub
  const relativePluginPath = `.opencode/plugins/${localPluginFile}`

  // Add plugin reference if not already present
  if (!config.plugin.includes(relativePluginPath)) {
    config.plugin.push(relativePluginPath)
  }

  // Write updated config
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')
}

export async function syncRuntimeSurface(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<RuntimeSurfaceSyncResult> {
  const opencodeRoot = join(directory, '.opencode')
  const pluginsRoot = join(opencodeRoot, 'plugins')
  const pluginFile = join(pluginsRoot, options.localPluginFile)

  await mkdir(pluginsRoot, { recursive: true })
  await writeFileIfChanged(pluginFile, renderLocalPluginStub(options))

  // Also update opencode.json plugin array so OpenCode auto-loads the plugin
  await syncPluginConfig(directory, options.localPluginFile)

  return { pluginFile }
}
