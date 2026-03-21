/**
 * @file attachment.defaults.ts
 * Default factory and path resolution for runtime attachment settings.
 */

import { createBootstrapProfile } from '../../shared/bootstrap-profile.js'
import { getConfigPath } from '../../shared/paths.js'
import type { RuntimeAttachmentSettings } from './attachment.types.js'

/**
 * Get the file path for runtime attachment settings.
 * @param projectRoot - The project root directory
 * @returns The full path to the runtime-attachment.json file
 */
export function getRuntimeAttachmentSettingsPath(projectRoot: string): string {
  return getConfigPath(projectRoot, 'runtime-attachment.json')
}

/**
 * Creates default runtime attachment settings with sensible fallbacks.
 * @returns A fully populated RuntimeAttachmentSettings object with defaults
 */
export function defaultRuntimeAttachmentSettings(): RuntimeAttachmentSettings {
  const profile = createBootstrapProfile({})

  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    runtimeAuthority: 'none',
    runtimeInstanceId: undefined,
    serverBaseUrl: undefined,
    preferredUserName: undefined,
    governanceMode: profile.governanceMode,
    automationLevel: profile.automationLevel,
    language: profile.chatLanguage,
    artifactLanguage: profile.artifactLanguage,
    outputStyle: profile.outputStyle,
    expertLevel: profile.expertiseLevel,
    branchFocus: 'runtime-entry-attachment',
    guardrails: ['workflow-first', 'trajectory-aware', 'bounded-delegation'],
    facilitators: ['hm-init', 'hm-doctor', 'hm-harness'],
    mcpReadiness: ['context7', 'deepwiki', 'tavily', 'repomix'],
    hivebrainDigest: ['runtime-attachment-active'],
  }
}
