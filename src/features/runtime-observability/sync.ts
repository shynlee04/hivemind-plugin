import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

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

function getPluginStubSource(directory: string, options: RuntimeSurfaceSyncOptions): string {
  if (resolve(directory) === resolve(options.packageRoot)) {
    return 'export { HiveMindPlugin as default, HiveMindPlugin } from "../../src/plugin/opencode-plugin.ts"\n'
  }

  return `export { HiveMindPlugin as default, HiveMindPlugin } from "${options.packagePluginEntry}"\n`
}

async function ensureOpencodeConfig(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<void> {
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
  config.plugin = plugins.filter(
    (entry) => entry !== options.packagePluginName
      && !entry.startsWith(`${options.packagePluginName}@`),
  )

  await writeFile(configPath, JSON.stringify(config, null, 2))
}

async function ensureCommandMirror(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<string[]> {
  const targetDir = join(directory, '.opencode', 'commands')
  await mkdir(targetDir, { recursive: true })
  const mirrored: string[] = []

  for (const bundle of discoverSlashCommandBundles()) {
    const source = join(options.packageRoot, 'commands', bundle.commandFile)
    const target = join(targetDir, bundle.commandFile)
    await copyFile(source, target)
    mirrored.push(target)
  }

  return mirrored
}

async function ensureAgentMirror(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<string[]> {
  const targetDir = join(directory, '.opencode', 'agents')
  await mkdir(targetDir, { recursive: true })
  const mirrored: string[] = []

  for (const agent of createOpencodeAgentRegistry(options.packageRoot)) {
    const target = join(targetDir, `${agent.id}.md`)
    await writeFile(target, agent.runtimeMarkdown, 'utf-8')
    mirrored.push(target)
  }

  return mirrored
}

async function ensurePluginStub(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<string> {
  const targetDir = join(directory, '.opencode', 'plugins')
  const targetFile = join(targetDir, options.localPluginFile)
  await mkdir(targetDir, { recursive: true })
  await writeFile(targetFile, getPluginStubSource(directory, options), 'utf-8')
  return targetFile
}

export async function syncRuntimeSurface(
  directory: string,
  options: RuntimeSurfaceSyncOptions,
): Promise<RuntimeSurfaceSyncResult> {
  await ensureOpencodeConfig(directory, options)
  const mirroredCommandFiles = await ensureCommandMirror(directory, options)
  const mirroredAgentFiles = await ensureAgentMirror(directory, options)
  const pluginFile = await ensurePluginStub(directory, options)

  return {
    pluginFile,
    mirroredCommandFiles,
    mirroredAgentFiles,
  }
}
