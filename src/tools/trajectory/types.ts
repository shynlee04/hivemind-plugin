import type { RuntimePressureContract } from '../../shared/pressure-contract.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'

export type HivemindTrajectoryAction =
  | 'inspect'
  | 'traverse'
  | 'attach'
  | 'checkpoint'
  | 'event'
  | 'close'

export interface HivemindTrajectoryToolArgs {
  action: HivemindTrajectoryAction
  trajectoryId?: string
  workflowId?: string
  sessionId?: string
  lineage?: 'hivefiver' | 'hiveminder'
  purposeClass?: 'discovery' | 'brainstorming' | 'research' | 'planning' | 'implementation' | 'gatekeeping' | 'tdd' | 'course-correction'
  taskIds?: string
  subtaskIds?: string
  summary?: string
  source?: string
  resumeTarget?: string
  kind?: 'summary' | 'handoff' | 'evidence' | 'transition' | 'note'
  evidenceRefs?: string
}

export const trajectoryActionPressureContracts: Record<HivemindTrajectoryAction, RuntimePressureContract> = {
  inspect: getRuntimePressureContract('steady-state'),
  traverse: getRuntimePressureContract('trajectory-control'),
  attach: getRuntimePressureContract('trajectory-continuation'),
  checkpoint: getRuntimePressureContract('trajectory-control'),
  event: getRuntimePressureContract('trajectory-control'),
  close: getRuntimePressureContract('trajectory-control'),
}
