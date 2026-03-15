import type { ToolGrant } from './handler-types.js'
import type { StartWorkDecision } from '../hooks/start-work/index.js'
import type { SlashCommandBundle } from '../commands/slash-command/index.js'
import type { CommandBinding } from './handler-types.js'

function toToolGrant(toolId: string): ToolGrant {
  return {
    toolId,
    permission: 'required',
  }
}

export function resolveToolGrants(
  startWork: StartWorkDecision,
  bundle?: SlashCommandBundle,
  commandBinding?: CommandBinding,
): ToolGrant[] {
  const baseTools = ['prompt-transformation', 'context-injection']
  const commandTools = bundle?.toolGrantIds ?? []
  const scopeTools = startWork.sessionScope === 'sub-session'
    ? ['runtime-loader']
    : ['workflow-integration']
  const controlPlaneTools = commandBinding?.bindingKind === 'control-plane'
    ? ['hivemind_runtime_command', 'hivemind_runtime_status']
    : []

  return [...new Set([...baseTools, ...commandTools, ...scopeTools, ...controlPlaneTools])].map(toToolGrant)
}
