import { executeSlashCommandBundle, findSlashCommandBundle } from '../commands/slash-command/index.js'
import {
  buildNonInteractiveIntakeError,
  findControlPlanePrimitive,
  resolveControlPlaneIntakeGate,
  type ControlPlaneProfileGroupId,
  type ControlPlaneRecommendedPresetId,
} from '../control-plane/index.js'
import { loadRuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import { saveRuntimeAttachmentSettings, type RuntimeAttachmentSettings } from '../shared/runtime-attachment.js'

export interface SettingsUpdateOptions extends Partial<RuntimeAttachmentSettings> {}

export interface SettingsUpdateResult {
  settings: RuntimeAttachmentSettings
  updatedFields: string[]
}

export interface SettingsCommandOptions extends SettingsUpdateOptions {
  sessionId: string
  presetId?: ControlPlaneRecommendedPresetId
}

/**
 * Persist revamp runtime-entry settings used by the CLI and local OpenCode plugin adapter.
 *
 * @param directory Project root containing `.hivemind/config`.
 * @param options Fields to update.
 * @returns Updated settings and touched field names.
 */
export async function updateProjectSettings(
  directory: string,
  options: SettingsUpdateOptions,
): Promise<SettingsUpdateResult> {
  const updatedFields = Object.keys(options).filter((key) => options[key as keyof SettingsUpdateOptions] !== undefined)
  const settings = await saveRuntimeAttachmentSettings(directory, options)

  return {
    settings,
    updatedFields,
  }
}

/**
 * Run control-plane reconfiguration through the canonical hm-settings command bundle.
 *
 * @param directory Project root containing runtime configuration.
 * @param options Settings deltas, preset choice, and runtime session bindings.
 * @returns Canonical command execution result.
 */
export async function runSettingsCommand(directory: string, options: SettingsCommandOptions) {
  const bundle = findSlashCommandBundle('hm-settings')
  if (!bundle) {
    throw new Error('Missing hm-settings command bundle.')
  }
  const primitive = findControlPlanePrimitive('hm-settings')
  if (!primitive) {
    throw new Error('Missing hm-settings control-plane primitive.')
  }
  const snapshot = await loadRuntimeBindingsSnapshot(directory)
  const requestedSettingsGroups = [
    (options.preferredUserName !== undefined || options.language !== undefined || options.artifactLanguage !== undefined)
      ? 'identity-language'
      : null,
    (options.expertLevel !== undefined || options.outputStyle !== undefined)
      ? 'expertise-style'
      : null,
    (options.governanceMode !== undefined || options.automationLevel !== undefined)
      ? 'governance-automation'
      : null,
  ].filter((group): group is 'identity-language' | 'expertise-style' | 'governance-automation' => group !== null)
  const normalizedRequestedSettingsGroups: ControlPlaneProfileGroupId[] = options.presetId
    ? ['identity-language', 'expertise-style', 'governance-automation']
    : requestedSettingsGroups
  const intakeResolution = resolveControlPlaneIntakeGate(primitive, {
    projectRoot: directory,
    sessionId: options.sessionId,
    sessionScope: 'main',
    presetId: options.presetId,
    requestedSettingsGroups: normalizedRequestedSettingsGroups,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'reconfigure control-plane runtime settings',
  }, snapshot)
  if (intakeResolution.gate) {
    throw new Error(buildNonInteractiveIntakeError(primitive, intakeResolution.gate))
  }

  return executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId: options.sessionId,
    sessionScope: 'main',
    presetId: options.presetId,
    intakeEvidence: {
      source: options.presetId ? 'preset' : 'cli-flags',
      questionnaireId: 'settings-profile-v1',
      displayLanguage: options.language ?? snapshot.language,
      completedGroups: normalizedRequestedSettingsGroups,
      usedRecommendedPresetGroups: options.presetId ? normalizedRequestedSettingsGroups : [],
    },
    requestedSettingsGroups: normalizedRequestedSettingsGroups,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'reconfigure control-plane runtime settings',
  })
}
