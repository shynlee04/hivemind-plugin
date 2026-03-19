import type { StartWorkDecision } from '../../features/session-entry/start-work-types.js'
import { resolveCommandBinding } from '../../plugin-handlers/index.js'
import type { AutoSlashCommandPlan } from './auto-slash-command-types.js'

export function createAutoSlashCommandPlan(startWork: StartWorkDecision): AutoSlashCommandPlan {
  return {
    startWork,
    commandBinding: resolveCommandBinding(startWork),
  }
}
