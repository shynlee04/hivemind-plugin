import type { KernelLineage, SessionScope } from '../context/prompt-packet/prompt-packet-types.js'
import type { DocKnowledgeSurface } from '../intelligence/doc/index.js'
import type { StartWorkDecision } from '../hooks/start-work/index.js'
import type { SlashCommandBundle } from '../tools/slash-command/index.js'

export interface CommandBinding {
  bundle?: SlashCommandBundle
  autoRoute: boolean
  reason: string
}

export interface ToolGrant {
  toolId: string
  permission: 'required' | 'optional'
}

export interface SessionInheritance {
  sessionScope: SessionScope
  promptMode: 'full' | 'delegated'
  todoAuthority: 'main' | 'delegated' | 'none'
  handoffRequired: boolean
}

export interface PluginContext {
  lineage: KernelLineage
  category: string
  commandBinding: CommandBinding
  toolGrants: ToolGrant[]
  sessionInheritance: SessionInheritance
  docSurfaces: DocKnowledgeSurface[]
  startWork: StartWorkDecision
}
