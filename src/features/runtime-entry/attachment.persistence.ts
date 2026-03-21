/**
 * @file attachment.persistence.ts
 * Persistence functions for runtime attachment settings.
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { createBootstrapProfile, normalizePreferredUserName } from '../../shared/bootstrap-profile.js'
import type { RuntimeAttachmentSettings } from './attachment.types.js'
import { defaultRuntimeAttachmentSettings, getRuntimeAttachmentSettingsPath } from './attachment.defaults.js'
import { buildRuntimeAttachmentEntryKernel } from './attachment.builder.js'

/**
 * Load runtime attachment settings from disk.
 * Returns defaults if file doesn't exist or is invalid.
 * @param projectRoot - The project root directory
 * @returns The loaded or default RuntimeAttachmentSettings
 */
export async function loadRuntimeAttachmentSettings(projectRoot: string): Promise<RuntimeAttachmentSettings> {
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeAttachmentSettings>
    const defaults = defaultRuntimeAttachmentSettings()
    const profile = createBootstrapProfile({
      preferredUserName: parsed.preferredUserName,
      language: parsed.language ?? defaults.language,
      artifactLanguage: parsed.artifactLanguage ?? defaults.artifactLanguage,
      expertLevel: parsed.expertLevel ?? defaults.expertLevel,
      governanceMode: parsed.governanceMode ?? defaults.governanceMode,
      automationLevel: parsed.automationLevel ?? defaults.automationLevel,
      outputStyle: parsed.outputStyle ?? defaults.outputStyle,
    })

    return {
      attachmentMode: parsed.attachmentMode === 'npm-package' ? 'npm-package' : defaults.attachmentMode,
      defaultLineage: parsed.defaultLineage === 'hiveminder' ? 'hiveminder' : defaults.defaultLineage,
      defaultPurposeClass: parsed.defaultPurposeClass ?? defaults.defaultPurposeClass,
      runtimeAuthority: buildRuntimeAttachmentEntryKernel({ runtimeAuthority: parsed.runtimeAuthority }).authority.runtimeAuthority,
      runtimeInstanceId: parsed.runtimeInstanceId || undefined,
      serverBaseUrl: parsed.serverBaseUrl || undefined,
      preferredUserName: normalizePreferredUserName(parsed.preferredUserName),
      governanceMode: profile.governanceMode,
      automationLevel: profile.automationLevel,
      language: profile.chatLanguage,
      artifactLanguage: profile.artifactLanguage,
      outputStyle: profile.outputStyle,
      expertLevel: profile.expertiseLevel,
      branchFocus: parsed.branchFocus ?? defaults.branchFocus,
      guardrails: Array.isArray(parsed.guardrails)
        ? parsed.guardrails.filter((item): item is string => typeof item === 'string')
        : defaults.guardrails,
      facilitators: Array.isArray(parsed.facilitators)
        ? parsed.facilitators.filter((item): item is string => typeof item === 'string')
        : defaults.facilitators,
      mcpReadiness: Array.isArray(parsed.mcpReadiness)
        ? parsed.mcpReadiness.filter((item): item is string => typeof item === 'string')
        : defaults.mcpReadiness,
      hivebrainDigest: Array.isArray(parsed.hivebrainDigest)
        ? parsed.hivebrainDigest.filter((item): item is string => typeof item === 'string')
        : defaults.hivebrainDigest,
      verificationContract: parsed.verificationContract,
      returnContract: parsed.returnContract,
    }
  } catch {
    return defaultRuntimeAttachmentSettings()
  }
}

/**
 * Save runtime attachment settings to disk.
 * Merges partial settings with existing settings before saving.
 * @param projectRoot - The project root directory
 * @param partial - Partial settings to merge and save
 * @returns The normalized saved RuntimeAttachmentSettings
 */
export async function saveRuntimeAttachmentSettings(
  projectRoot: string,
  partial: Partial<RuntimeAttachmentSettings>,
): Promise<RuntimeAttachmentSettings> {
  const merged = {
    ...(await loadRuntimeAttachmentSettings(projectRoot)),
    ...partial,
  }
  const normalizedProfile = createBootstrapProfile({
    preferredUserName: merged.preferredUserName,
    language: merged.language,
    artifactLanguage: merged.artifactLanguage,
    expertLevel: merged.expertLevel,
    governanceMode: merged.governanceMode,
    automationLevel: merged.automationLevel,
    outputStyle: merged.outputStyle,
  })
  const filePath = getRuntimeAttachmentSettingsPath(projectRoot)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const normalizedSettings: RuntimeAttachmentSettings = {
    ...merged,
    runtimeAuthority: buildRuntimeAttachmentEntryKernel({ runtimeAuthority: merged.runtimeAuthority }).authority.runtimeAuthority,
    runtimeInstanceId: typeof merged.runtimeInstanceId === 'string' && merged.runtimeInstanceId.length > 0 ? merged.runtimeInstanceId : undefined,
    serverBaseUrl: typeof merged.serverBaseUrl === 'string' && merged.serverBaseUrl.length > 0 ? merged.serverBaseUrl : undefined,
    preferredUserName: normalizedProfile.preferredUserName,
    governanceMode: normalizedProfile.governanceMode,
    automationLevel: normalizedProfile.automationLevel,
    language: normalizedProfile.chatLanguage,
    artifactLanguage: normalizedProfile.artifactLanguage,
    outputStyle: normalizedProfile.outputStyle,
    expertLevel: normalizedProfile.expertiseLevel,
  }
  await fs.writeFile(filePath, JSON.stringify(normalizedSettings, null, 2))
  return normalizedSettings
}

/**
 * Check if runtime attachment settings file exists.
 * @param projectRoot - The project root directory
 * @returns True if the settings file exists
 */
export async function runtimeAttachmentSettingsExist(projectRoot: string): Promise<boolean> {
  try {
    await fs.access(getRuntimeAttachmentSettingsPath(projectRoot))
    return true
  } catch {
    return false
  }
}

/**
 * Save bootstrap runtime attachment settings only if they don't exist.
 * If settings already exist, returns the existing settings without modifying.
 * @param projectRoot - The project root directory
 * @param partial - Partial settings to save if file doesn't exist
 * @returns The existing or newly saved RuntimeAttachmentSettings
 */
export async function saveBootstrapRuntimeAttachmentSettings(
  projectRoot: string,
  partial: Partial<RuntimeAttachmentSettings>,
): Promise<RuntimeAttachmentSettings> {
  if (await runtimeAttachmentSettingsExist(projectRoot)) {
    return loadRuntimeAttachmentSettings(projectRoot)
  }

  return saveRuntimeAttachmentSettings(projectRoot, partial)
}
