import type { CommandExecutionResult, SlashCommandBundle, CommandExecutionInput } from '../../commands/slash-command/command-types.js'

import type { LoadedCommandAsset } from './instruction-loader.js'
import {
  runCourseCorrectHandler,
  runResearchHandler,
  runTddHandler,
  runVerifyHandler,
} from './inspection-command-handler.js'
import { runImplementHandler, runPlanHandler } from './workflow-command-handler.js'

type RuntimeCommandHandler = (
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
) => Promise<CommandExecutionResult>

export const runtimeCommandHandlers: Record<string, RuntimeCommandHandler> = {
  'hm-research': runResearchHandler,
  'hm-plan': runPlanHandler,
  'hm-implement': runImplementHandler,
  'hm-verify': runVerifyHandler,
  'hm-tdd': runTddHandler,
  'hm-course-correct': runCourseCorrectHandler,
}

export const RUNTIME_HANDLER_COMMAND_IDS = Object.freeze(Object.keys(runtimeCommandHandlers))
