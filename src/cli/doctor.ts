import type { KernelLineage, SessionScope } from '../context/prompt-packet/index.js'
import type { PurposeClass } from '../hooks/start-work/index.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../tools/slash-command/index.js'

export interface DoctorOptions {
  sessionId: string
  sessionScope?: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
}

/**
 * Run the revamp recovery spine through the canonical hm-doctor command bundle.
 *
 * @param directory Project root containing the runtime state.
 * @param options Runtime command bindings for the recovery call.
 * @returns Canonical command execution result.
 */
export async function runDoctorCommand(directory: string, options: DoctorOptions) {
  const bundle = findSlashCommandBundle('hm-doctor')
  if (!bundle) {
    throw new Error('Missing hm-doctor command bundle.')
  }

  return executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId: options.sessionId,
    sessionScope: options.sessionScope ?? 'main',
    trajectoryId: options.trajectoryId,
    workflowId: options.workflowId,
    taskIds: options.taskIds,
    subtaskIds: options.subtaskIds,
    lineage: options.lineage,
    purposeClass: options.purposeClass ?? 'course-correction',
    userMessage: 'repair runtime entry surfaces and recovery spine',
  })
}
