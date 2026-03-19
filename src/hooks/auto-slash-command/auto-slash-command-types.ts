import type { CommandBinding } from '../../plugin-handlers/index.js'
import type { StartWorkDecision } from '../../features/session-entry/start-work-types.js'

export interface AutoSlashCommandPlan {
  startWork: StartWorkDecision
  commandBinding: CommandBinding
}
