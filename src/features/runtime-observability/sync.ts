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

function renderLocalPluginStub(options: RuntimeSurfaceSyncOptions): string {
  return [
    `import plugin from '${options.packagePluginEntry}'`,
    '',
    'export default plugin',
    '',
  ].join('\n')
}

async function writeFileIfChanged(filePath: string, content: string): Promise<void> {
  const existingContent = await readFile(filePath, 'utf-8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return undefined
    }
    throw error
  })

  if (existingContent === content) {
    return
  }

  await writeFile(filePath, content)
}

async function readFile(filePath: string, encoding: BufferEncoding): Promise<string> {
  const { readFile } = await import('node:fs/promises')
  return readFile(filePath, encoding)
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

  return { pluginFile }
}
