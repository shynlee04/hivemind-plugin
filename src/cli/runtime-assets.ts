import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

import { discoverSlashCommandBundles } from '../tools/slash-command/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..', '..')
const LOCAL_PLUGIN_FILE = 'hivemind-context-governance.ts'
const PACKAGE_PLUGIN_NAME = 'hivemind-context-governance'

function getPluginStubSource(targetDirectory: string): string {
  if (resolve(targetDirectory) === PACKAGE_ROOT) {
    return 'export { HiveMindPlugin as default, HiveMindPlugin } from "../../src/plugin/opencode-plugin.ts"\n'
  }

  return `export { HiveMindPlugin as default, HiveMindPlugin } from "${PACKAGE_PLUGIN_NAME}"\n`
}

async function ensureOpencodeConfig(directory: string): Promise<void> {
  const configPath = join(directory, 'opencode.json')
  let config: Record<string, unknown> = {}

  if (existsSync(configPath)) {
    try {
      config = JSON.parse(await readFile(configPath, 'utf-8')) as Record<string, unknown>
    } catch {
      config = {}
    }
  }

  const plugins = Array.isArray(config.plugin)
    ? config.plugin.filter((entry): entry is string => typeof entry === 'string')
    : []
  config.plugin = plugins.filter((entry) => entry !== PACKAGE_PLUGIN_NAME && !entry.startsWith(`${PACKAGE_PLUGIN_NAME}@`))

  await writeFile(configPath, JSON.stringify(config, null, 2))
}

async function ensureCommandMirror(directory: string): Promise<string[]> {
  const targetDir = join(directory, '.opencode', 'commands')
  await mkdir(targetDir, { recursive: true })
  const mirrored: string[] = []

  for (const bundle of discoverSlashCommandBundles()) {
    const source = join(PACKAGE_ROOT, 'commands', bundle.commandFile)
    const target = join(targetDir, bundle.commandFile)
    await copyFile(source, target)
    mirrored.push(target)
  }

  return mirrored
}

async function ensurePluginStub(directory: string): Promise<string> {
  const targetDir = join(directory, '.opencode', 'plugins')
  const targetFile = join(targetDir, LOCAL_PLUGIN_FILE)
  await mkdir(targetDir, { recursive: true })
  await writeFile(targetFile, getPluginStubSource(directory), 'utf-8')
  return targetFile
}

export interface RuntimeSurfaceSyncResult {
  pluginFile: string
  mirroredCommandFiles: string[]
}

export async function syncRuntimeSurface(directory: string): Promise<RuntimeSurfaceSyncResult> {
  await ensureOpencodeConfig(directory)
  const mirroredCommandFiles = await ensureCommandMirror(directory)
  const pluginFile = await ensurePluginStub(directory)

  return {
    pluginFile,
    mirroredCommandFiles,
  }
}
