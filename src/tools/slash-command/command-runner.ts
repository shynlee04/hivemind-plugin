import { loadCommandAsset } from '../runtime/instruction-loader.js'
import type { CommandExecutionPreview, SlashCommandBundle } from './command-types.js'

export async function previewSlashCommandBundle(
  bundle: SlashCommandBundle,
): Promise<CommandExecutionPreview> {
  const asset = await loadCommandAsset(bundle.id)

  return {
    commandId: bundle.id,
    title: bundle.title,
    commandFile: bundle.commandFile,
    frontmatter: asset.frontmatter,
    body: asset.body,
    workflowChain: bundle.workflowChain,
    toolGrantIds: bundle.toolGrantIds,
    structuredOutput: bundle.structuredOutput,
    continuationMode: bundle.continuationMode,
  }
}
