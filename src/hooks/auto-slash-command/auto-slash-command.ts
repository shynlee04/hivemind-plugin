import type { StartWorkDecision } from '../start-work/index.js'
import { resolveCommandBinding } from '../../plugin-handlers/index.js'
import type { AutoSlashCommandPlan } from './auto-slash-command-types.js'

export function createAutoSlashCommandPlan(startWork: StartWorkDecision): AutoSlashCommandPlan {
  return {
    startWork,
    commandBinding: resolveCommandBinding(startWork),
  }
}
