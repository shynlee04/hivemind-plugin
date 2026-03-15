import { randomUUID } from 'node:crypto'

import type { KernelLineage, SessionScope } from '../context/prompt-packet/index.js'
import type { PurposeClass } from '../hooks/start-work/index.js'
import {
  saveBootstrapRuntimeAttachmentSettings,
  type RuntimeAttachmentSettings,
} from '../shared/runtime-attachment.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../commands/slash-command/index.js'
import { syncRuntimeSurface, type RuntimeSurfaceSyncResult } from './runtime-assets.js'

export interface InitOptions extends Partial<RuntimeAttachmentSettings> {
  sessionId?: string
  sessionScope?: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
  silent?: boolean
}

export interface InitProjectResult {
  sessionId: string
  trajectoryId: string
  workflowId: string
  sync: RuntimeSurfaceSyncResult
  commandResult: Awaited<ReturnType<typeof executeSlashCommandBundle>>
}

function createRuntimeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

/**
 * Initialize the revamp runtime entry surfaces and bootstrap the trajectory control plane.
 *
 * @param directory Project root to initialize.
 * @param options Runtime defaults and bootstrap bindings.
 * @returns Structured init result.
 */
export async function initProject(directory: string, options: InitOptions = {}): Promise<InitProjectResult> {
  const sync = await syncRuntimeSurface(directory)
  const sessionId = options.sessionId ?? createRuntimeId('ses')
  const workflowId = options.workflowId ?? createRuntimeId('wf')
  const trajectoryId = options.trajectoryId ?? createRuntimeId('trj')
  const lineage = options.lineage ?? options.defaultLineage ?? 'hivefiver'
  const purposeClass = options.purposeClass ?? options.defaultPurposeClass ?? 'planning'

  await saveBootstrapRuntimeAttachmentSettings(directory, {
    attachmentMode: options.attachmentMode ?? 'local-worktree',
    defaultLineage: lineage,
    defaultPurposeClass: purposeClass,
    preferredUserName: options.preferredUserName,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    outputStyle: options.outputStyle,
    expertLevel: options.expertLevel,
    branchFocus: options.branchFocus,
    guardrails: options.guardrails,
    facilitators: options.facilitators,
    mcpReadiness: options.mcpReadiness,
    hivebrainDigest: options.hivebrainDigest,
    verificationContract: options.verificationContract,
    returnContract: options.returnContract,
  })

  const bundle = findSlashCommandBundle('hm-init')
  if (!bundle) {
    throw new Error('Missing hm-init command bundle.')
  }

  const commandResult = await executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId,
    sessionScope: options.sessionScope ?? 'main',
    lineage,
    purposeClass,
    trajectoryId,
    workflowId,
    taskIds: options.taskIds,
    subtaskIds: options.subtaskIds,
    userMessage: 'initialize hivemind runtime entry surfaces',
  })

  return {
    sessionId,
    trajectoryId,
    workflowId,
    sync,
    commandResult,
  }
}
