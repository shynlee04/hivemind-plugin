import type { ToolGrant } from './handler-types.js'
import type { StartWorkDecision } from '../hooks/start-work/index.js'
import type { SlashCommandBundle } from '../tools/slash-command/index.js'

function toToolGrant(toolId: string): ToolGrant {
  return {
    toolId,
    permission: 'required',
  }
}

export function resolveToolGrants(
  startWork: StartWorkDecision,
  bundle?: SlashCommandBundle,
): ToolGrant[] {
  const baseTools = ['prompt-transformation', 'context-injection']
  const commandTools = bundle?.toolGrantIds ?? []
  const scopeTools = startWork.sessionScope === 'sub-session'
    ? ['runtime-loader']
    : ['workflow-integration']

  return [...new Set([...baseTools, ...commandTools, ...scopeTools])].map(toToolGrant)
}
