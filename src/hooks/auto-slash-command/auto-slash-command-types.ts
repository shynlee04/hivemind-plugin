import type { CommandBinding } from '../../plugin-handlers/index.js'
import type { StartWorkDecision } from '../start-work/index.js'

export interface AutoSlashCommandPlan {
  startWork: StartWorkDecision
  commandBinding: CommandBinding
}
