import {
  runtimeStatusSchema,
  type RuntimeStatus,
} from '../../../../src/shared/contracts/runtime-status.js'

export interface LoadRuntimeStatusInput {
  projectRoot?: string
  sessionId?: string
  agentId?: string
}

export function parseRuntimeStatus(input: unknown): RuntimeStatus {
  return runtimeStatusSchema.parse(input)
}

export async function loadRuntimeStatus(input: LoadRuntimeStatusInput = {}): Promise<RuntimeStatus> {
  const projectRoot = input.projectRoot ?? process.cwd()
  const sessionId = input.sessionId ?? 'opentui-runtime-status'
  const agentId = input.agentId ?? 'opentui'
  const [{ buildRuntimeStatusSnapshot }, { loadRuntimeBindingsSnapshot }] = await Promise.all([
    import('../../../../src/sdk-supervisor/runtime-status.js'),
    import('../../../../src/shared/runtime-attachment.js'),
  ])
  const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
  const statusSnapshot = await buildRuntimeStatusSnapshot({
    projectRoot,
    sessionId,
    agentId,
    snapshot,
  })

  return parseRuntimeStatus(statusSnapshot)
}
