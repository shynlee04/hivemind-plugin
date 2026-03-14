import {
  contextInjectionTool,
  promptTransformationTool,
  runtimeLoaderTool,
  workflowIntegrationTool,
} from '../tools/runtime/index.js'
import { discoverSlashCommandBundles } from '../tools/slash-command/index.js'
import type { ToolRegistryEntry } from './plugin-types.js'

export function createToolRegistry(): ToolRegistryEntry[] {
  const runtimeTools: ToolRegistryEntry[] = [
    contextInjectionTool,
    promptTransformationTool,
    runtimeLoaderTool,
    workflowIntegrationTool,
  ].map((tool) => ({
    id: tool.id,
    kind: 'runtime-tool',
    contractFile: tool.instructionFile,
  }))

  const slashCommands: ToolRegistryEntry[] = discoverSlashCommandBundles().map((bundle) => ({
    id: bundle.id,
    kind: 'slash-command',
    contractFile: bundle.commandFile,
  }))

  return [...runtimeTools, ...slashCommands]
}
