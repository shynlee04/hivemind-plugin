import { executeControlPlaneHandler } from '../../control-plane/index.js'
import type { CommandExecutionInput, SlashCommandBundle } from './command-types.js'
import type { LoadedCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'

export async function executeRecoveryHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
){
  return executeControlPlaneHandler(bundle, asset, input)
}
