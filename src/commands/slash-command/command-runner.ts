import {
  executeRuntimeEntryCommandBundle,
  previewRuntimeEntryCommandBundle,
} from '../../features/runtime-entry/command.js'
import { executeControlPlaneHandler } from '../../control-plane/index.js'
import type { LoadedCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'
import type {
  CommandExecutionInput,
  CommandExecutionPreview,
  CommandExecutionResult,
  SlashCommandBundle,
} from './command-types.js'

export async function previewSlashCommandBundle(
  bundle: SlashCommandBundle,
): Promise<CommandExecutionPreview> {
  return previewRuntimeEntryCommandBundle(bundle)
}

export async function executeSlashCommandBundle(
  bundle: SlashCommandBundle,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return executeRuntimeEntryCommandBundle(bundle, input, { executeRecoveryHandler })
}

export async function executeRecoveryHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
) {
  return executeControlPlaneHandler(bundle, asset, input)
}
