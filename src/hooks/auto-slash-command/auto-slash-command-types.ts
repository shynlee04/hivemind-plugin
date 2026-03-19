import type { ControlPlanePrimitive } from '../../control-plane/index.js'
import type { StartWorkDecision } from '../../features/session-entry/start-work-types.js'
import type { SlashCommandBundle } from '../../commands/slash-command/index.js'

export interface CommandBinding {
  bindingKind: 'none' | 'control-plane' | 'workflow-command'
  initiationMode: 'advisory' | 'explicit' | 'programmatic-required'
  controlPlanePrimitive?: ControlPlanePrimitive
  bundle?: SlashCommandBundle
  autoRoute: boolean
  reason: string
}

export interface AutoSlashCommandPlan {
  startWork: StartWorkDecision
  commandBinding: CommandBinding
}
