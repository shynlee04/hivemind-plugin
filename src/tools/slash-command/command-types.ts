import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../../hooks/start-work/start-work-types.js'
import type { CommandAssetFrontmatter } from '../runtime/instruction-loader.js'

export interface SlashCommandBundle {
  id: string
  title: string
  lineages: KernelLineage[]
  purposeClasses: PurposeClass[]
  commandFile: string
  workflowChain: string[]
  toolGrantIds: string[]
  structuredOutput: string
  continuationMode: 'resume' | 'handoff' | 'iterative'
  autoRouteAllowed: boolean
}

export interface CommandExecutionPreview {
  commandId: string
  title: string
  commandFile: string
  frontmatter: CommandAssetFrontmatter
  body: string
  workflowChain: string[]
  toolGrantIds: string[]
  structuredOutput: string
  continuationMode: SlashCommandBundle['continuationMode']
}
