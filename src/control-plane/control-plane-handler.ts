import { runInitHandler } from '../features/runtime-entry/init.js'
import { runDoctorHandler } from '../features/runtime-entry/doctor.js'
import { runHarnessHandler } from '../features/runtime-entry/harness.js'
import { runSettingsHandler } from '../features/runtime-entry/settings.js'
import type { CommandExecutionInput, CommandExecutionResult, SlashCommandBundle } from '../commands/slash-command/command-types.js'
import type { LoadedCommandAsset } from '../hooks/runtime-bridge/instruction-loader.js'

type ControlPlaneHandler = (
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
) => Promise<CommandExecutionResult>

const controlPlaneHandlers: Record<string, ControlPlaneHandler> = {
  'hm-init': runInitHandler,
  'hm-doctor': runDoctorHandler,
  'hm-harness': runHarnessHandler,
  'hm-settings': runSettingsHandler,
}

export async function executeControlPlaneHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult | null> {
  const handler = controlPlaneHandlers[bundle.id]
  if (!handler) {
    return null
  }

  return handler(bundle, asset, input)
}
