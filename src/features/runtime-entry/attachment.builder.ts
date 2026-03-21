/**
 * @file attachment.builder.ts
 * Kernel builder and normalization helpers for runtime attachment.
 */

import { createBootstrapProfile } from '../../shared/bootstrap-profile.js'
import { CONTROL_PLANE_PROFILE_FIELDS } from '../../control-plane/control-plane-intake.js'
import type { RuntimeAttachmentEntryKernelSource } from './attachment.types.js'
import type { RuntimeAttachmentEntryKernel, RuntimeAuthority } from './attachment.types.js'
import { defaultRuntimeAttachmentSettings } from './attachment.defaults.js'

/**
 * Normalize a candidate value to a valid RuntimeAuthority.
 * @param candidate - The value to normalize
 * @returns A valid RuntimeAuthority value
 */
export function normalizeRuntimeAuthority(candidate: unknown): RuntimeAuthority {
  return candidate === 'managed-sdk' || candidate === 'attached-sdk'
    ? candidate
    : 'none'
}

/**
 * Normalize an optional string value.
 * @param candidate - The value to normalize
 * @returns The string if valid and non-empty, otherwise undefined
 */
export function normalizeOptionalString(candidate: unknown): string | undefined {
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined
}

/**
 * Merge a string array candidate with a fallback.
 * @param candidate - The value to normalize
 * @param fallback - The fallback array if candidate is not a valid string array
 * @returns A string array
 */
export function mergeStringArray(candidate: unknown, fallback: string[]): string[] {
  return Array.isArray(candidate)
    ? candidate.filter((item): item is string => typeof item === 'string')
    : fallback
}

/**
 * Build a RuntimeAttachmentEntryKernel from an optional source object.
 * Composes defaults, profile, authority, and bindings into a structured kernel.
 * @param source - Optional partial source for the kernel
 * @returns A fully populated RuntimeAttachmentEntryKernel
 */
export function buildRuntimeAttachmentEntryKernel(
  source: RuntimeAttachmentEntryKernelSource = {},
): RuntimeAttachmentEntryKernel {
  const defaults = defaultRuntimeAttachmentSettings()
  const profile = createBootstrapProfile({
    preferredUserName: source.preferredUserName,
    language: source.language ?? defaults.language,
    artifactLanguage: source.artifactLanguage ?? defaults.artifactLanguage,
    expertLevel: source.expertLevel ?? defaults.expertLevel,
    governanceMode: source.governanceMode ?? defaults.governanceMode,
    automationLevel: source.automationLevel ?? defaults.automationLevel,
    outputStyle: source.outputStyle ?? defaults.outputStyle,
  })
  const profileComplete = source.profileComplete ?? false

  return {
    defaults: {
      attachmentMode: source.attachmentMode === 'npm-package' ? 'npm-package' : defaults.attachmentMode,
      defaultLineage: source.defaultLineage === 'hiveminder' ? 'hiveminder' : defaults.defaultLineage,
      defaultPurposeClass: source.defaultPurposeClass ?? defaults.defaultPurposeClass,
      branchFocus: source.branchFocus ?? defaults.branchFocus,
      guardrails: mergeStringArray(source.guardrails, defaults.guardrails),
      facilitators: mergeStringArray(source.facilitators, defaults.facilitators),
      mcpReadiness: mergeStringArray(source.mcpReadiness, defaults.mcpReadiness),
      hivebrainDigest: mergeStringArray(source.hivebrainDigest, defaults.hivebrainDigest),
      verificationContract: source.verificationContract,
      returnContract: source.returnContract,
    },
    profile: {
      preferredUserName: profile.preferredUserName,
      governanceMode: profile.governanceMode,
      automationLevel: profile.automationLevel,
      language: profile.chatLanguage,
      artifactLanguage: profile.artifactLanguage,
      outputStyle: profile.outputStyle,
      expertLevel: profile.expertiseLevel,
    },
    authority: {
      runtimeAuthority: normalizeRuntimeAuthority(source.runtimeAuthority),
      runtimeInstanceId: normalizeOptionalString(source.runtimeInstanceId),
      serverBaseUrl: normalizeOptionalString(source.serverBaseUrl),
    },
    bindings: {
      entryState: source.entryState ?? 'uninitialized',
      qaState: source.qaState ?? 'blocked',
      releaseState: source.releaseState ?? 'blocked',
      hasRuntimeAttachment: source.hasRuntimeAttachment ?? false,
      hasHivemind: source.hasHivemind ?? false,
      hivemindHealthy: source.hivemindHealthy ?? false,
      hasWorkflow: source.hasWorkflow ?? false,
      profileComplete,
      missingProfileFields: profileComplete ? [] : [...CONTROL_PLANE_PROFILE_FIELDS],
      interactiveBootstrapRequired: source.interactiveBootstrapRequired ?? !profileComplete,
      trajectoryId: source.trajectoryId,
      workflowId: source.workflowId,
      taskIds: source.taskIds ?? [],
      subtaskIds: source.subtaskIds ?? [],
      checkpointId: source.checkpointId,
    },
  }
}
