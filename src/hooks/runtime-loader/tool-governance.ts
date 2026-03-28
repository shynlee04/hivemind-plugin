import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'

export const HIVEMIND_MANAGED_TOOLS = new Set([
  'hivemind_doc',
  'hivemind_runtime_status',
  'hivemind_runtime_command',
  'hivemind_agent_work_create_contract',
  'hivemind_agent_work_export_contract',
  'hivemind_task',
  'hivemind_trajectory',
  'hivemind_handoff',
  'hivemind_journal',
  'hivemind_hm_init',
  'hivemind_hm_doctor',
  'hivemind_hm_setting',
])

export function isHivemindManagedTool(toolName: string | undefined): boolean {
  return toolName !== undefined && HIVEMIND_MANAGED_TOOLS.has(toolName)
}

export async function recordToolEvent(
  directory: string,
  sessionID: string,
  toolName: string,
): Promise<void> {
  const snapshot = await loadRuntimeBindingsSnapshot(directory)
  if (!snapshot.trajectoryId) {
    return
  }

  await recordTrajectoryEvent(directory, snapshot.trajectoryId, {
    kind: 'transition',
    summary: `tool:${toolName}:${sessionID}`,
    evidenceRefs: snapshot.taskIds,
  })
}
