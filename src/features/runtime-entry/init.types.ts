import type { KernelLineage, SessionScope } from '../../context/prompt-packet/index.js'
import type { ControlPlaneRecommendedPresetId } from '../../control-plane/control-plane-types.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import type { RuntimeAttachmentSettings } from '../../shared/runtime-attachment.js'
import type { ReadinessSignal, RuntimeIdentity } from '../../shared/contracts/runtime-status.js'


/**
 * Options for initializing a new HiveMind runtime session.
 * @extends RuntimeAttachmentSettings - Core runtime attachment configuration
 * @param presetId - Optional control plane preset identifier
 * @param sessionId - Explicit session ID (generated if not provided)
 * @param sessionScope - Session scope (defaults to 'main')
 * @param trajectoryId - Explicit trajectory ID (generated if not provided)
 * @param workflowId - Explicit workflow ID (generated if not provided)
 * @param taskIds - Task identifiers to associate with this session
 * @param subtaskIds - Subtask identifiers for nested task work
 * @param lineage - Kernel lineage (defaults to 'hivefiver')
 * @param purposeClass - Purpose classification (defaults to 'planning')
 * @param silent - Suppress output when true
 */
export interface InitOptions extends Partial<RuntimeAttachmentSettings> {
  presetId?: ControlPlaneRecommendedPresetId
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

/**
 * Result returned after successfully initializing a HiveMind project.
 * @property sessionId - Unique session identifier
 * @property trajectoryId - Trajectory chain identifier
 * @property workflowId - Associated workflow identifier
 * @property closeoutStatus - Session terminal state
 * @property nextCommand - Suggested next command to execute
 * @property recommendedCommands - List of recommended follow-up commands
 * @property runtime_identity - Runtime identity contract
 * @property readiness_signal - Readiness signal with health and authority info
 * @property commandResult - The executed slash command result
 */
export interface InitProjectResult {
  sessionId: string
  trajectoryId: string
  workflowId: string
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  nextCommand?: string
  recommendedCommands: string[]
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
  commandResult: Awaited<ReturnType<typeof import('../../commands/slash-command/index.js').executeSlashCommandBundle>>
}
