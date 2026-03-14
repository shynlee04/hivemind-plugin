import { saveRuntimeAttachmentSettings, type RuntimeAttachmentSettings } from '../shared/runtime-attachment.js'

export interface SettingsUpdateOptions extends Partial<RuntimeAttachmentSettings> {}

export interface SettingsUpdateResult {
  settings: RuntimeAttachmentSettings
  updatedFields: string[]
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
