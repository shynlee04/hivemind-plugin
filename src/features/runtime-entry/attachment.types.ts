/**
 * @file attachment.types.ts
 * All type definitions for runtime attachment system.
 */

import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import type { EntryKernelQaState, EntryKernelStateKind } from '../../shared/entry-kernel-state.js'
import type { BootstrapProfile } from '../../shared/bootstrap-profile.js'
import type { ControlPlaneProfileFieldId } from '../../control-plane/index.js'

/** Core attachment identity */
export interface AttachmentCore {
  attachmentMode: 'local-worktree' | 'npm-package'
  defaultLineage: KernelLineage
  defaultPurposeClass: PurposeClass
}

export type RuntimeAuthority = 'managed-sdk' | 'attached-sdk' | 'none'

/** Persisted runtime authority identity */
export interface AttachmentRuntimeAuthority {
  runtimeAuthority: RuntimeAuthority
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

/** User profile within attachment */
export interface AttachmentProfile {
  preferredUserName?: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  outputStyle: string
  expertLevel: string
}

/** Feature arrays and contracts */
export interface AttachmentFeatures {
  branchFocus: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
  verificationContract?: string
  returnContract?: string
}

/** Full runtime attachment settings — composed via intersection for backward compatibility */
export type RuntimeAttachmentSettings = AttachmentCore
  & AttachmentRuntimeAuthority
  & AttachmentProfile
  & AttachmentFeatures

export interface RuntimeBindingsSnapshot extends RuntimeAttachmentSettings {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: 'blocked' | 'released'
  hasRuntimeAttachment: boolean
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  profileComplete: boolean
  missingProfileFields: ControlPlaneProfileFieldId[]
  interactiveBootstrapRequired: boolean
  bootstrapProfile: BootstrapProfile
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
}

export interface RuntimeAttachmentEntryDefaults {
  attachmentMode: 'local-worktree' | 'npm-package'
  defaultLineage: KernelLineage
  defaultPurposeClass: PurposeClass
  branchFocus: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
  verificationContract?: string
  returnContract?: string
}

export interface RuntimeAttachmentEntryAuthority {
  runtimeAuthority: RuntimeAuthority
  runtimeInstanceId?: string
  serverBaseUrl?: string
}

export interface RuntimeAttachmentEntryProfile {
  preferredUserName?: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  outputStyle: string
  expertLevel: string
}

export interface RuntimeAttachmentEntryBindings {
  entryState: EntryKernelStateKind
  qaState: EntryKernelQaState
  releaseState: 'blocked' | 'released'
  hasRuntimeAttachment: boolean
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  profileComplete: boolean
  missingProfileFields: ControlPlaneProfileFieldId[]
  interactiveBootstrapRequired: boolean
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
}

export interface RuntimeAttachmentEntryKernel {
  defaults: RuntimeAttachmentEntryDefaults
  authority: RuntimeAttachmentEntryAuthority
  profile: RuntimeAttachmentEntryProfile
  bindings: RuntimeAttachmentEntryBindings
}

export interface RuntimeAttachmentEntryKernelSource extends Partial<RuntimeBindingsSnapshot> {
  taskIds?: string[]
  subtaskIds?: string[]
}
