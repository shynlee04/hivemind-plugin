import {
  closeDelegationHandoff,
  createDelegationHandoff,
  listDelegationHandoffs,
  readDelegationHandoff,
  updateDelegationHandoff,
  validateDelegationHandoff,
  type DelegationEvidenceRecord,
} from '../../delegation/index.js'
import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import { parseList, parseJsonArray } from '../../shared/tool-helpers.js'
import { handoffActionPressureContracts, type HivemindHandoffToolArgs } from '../../tools/handoff/types.js'

export interface HandoffFeatureContext {
  sessionID: string
  agent: string
}

export type HandoffFeatureResult =
  | { kind: 'error'; message: string }
  | {
      kind: 'success'
      message: string
      data: Record<string, unknown>
      metadata?: {
        title: string
        metadata: Record<string, unknown>
      }
    }

async function recordHandoffEvent(projectRoot: string, trajectoryId: string | undefined, summary: string): Promise<void> {
  if (!trajectoryId) {
    return
  }

  await recordTrajectoryEvent(projectRoot, trajectoryId, {
    kind: 'handoff',
    summary,
  })
}

export async function executeHivemindHandoffAction(
  projectRoot: string,
  args: HivemindHandoffToolArgs,
  context: HandoffFeatureContext,
): Promise<HandoffFeatureResult> {
  const pressureContract = handoffActionPressureContracts[args.action]

  switch (args.action) {
    case 'list':
      return {
        kind: 'success',
        message: 'Listed delegation handoffs',
        data: {
          handoffs: listDelegationHandoffs(projectRoot),
          pressureContract,
        },
      }
    case 'read':
      if (!args.id) {
        return { kind: 'error', message: 'id is required for read' }
      }
      return {
        kind: 'success',
        message: 'Loaded delegation handoff',
        data: {
          record: readDelegationHandoff(projectRoot, args.id),
          pressureContract,
        },
      }
    case 'validate':
      if (!args.id) {
        return { kind: 'error', message: 'id is required for validate' }
      }
      return {
        kind: 'success',
        message: 'Validated delegation handoff',
        data: {
          ...validateDelegationHandoff(projectRoot, args.id),
          pressureContract,
        },
      }
    case 'close':
      if (!args.id || !args.summary) {
        return { kind: 'error', message: 'id and summary are required for close' }
      }
      {
        const result = closeDelegationHandoff(projectRoot, args.id, args.summary)
        await recordHandoffEvent(projectRoot, result.record?.packet.trajectoryId, `handoff:${args.id}:closed`)
        return {
          kind: 'success',
          message: 'Closed delegation handoff',
          data: {
            ...result,
            pressureContract,
          },
        }
      }
    case 'update':
      if (!args.id) {
        return { kind: 'error', message: 'id is required for update' }
      }
      {
        const result = updateDelegationHandoff(projectRoot, {
          id: args.id,
          summary: args.summary,
          nextSteps: parseList(args.nextSteps),
          evidence: parseJsonArray<DelegationEvidenceRecord>(args.evidence),
        })
        if (!result) {
          return { kind: 'error', message: `Handoff ${args.id} was not found` }
        }
        await recordHandoffEvent(projectRoot, result.packet.trajectoryId, `handoff:${args.id}:updated`)
        return {
          kind: 'success',
          message: 'Updated delegation handoff',
          data: {
            record: result,
            pressureContract,
          },
        }
      }
    case 'create':
      if (!args.targetAgent || !args.workflowId || !args.scope || !args.summary) {
        return { kind: 'error', message: 'targetAgent, workflowId, scope, and summary are required for create' }
      }
      {
        const record = createDelegationHandoff(projectRoot, {
          packet: {
            delegationId: args.id,
            sourceSessionId: args.sourceSessionId ?? context.sessionID,
            targetSessionId: args.targetSessionId ?? `${context.sessionID}:delegated`,
            sourceAgent: args.sourceAgent ?? context.agent,
            targetAgent: args.targetAgent,
            trajectoryId: args.trajectoryId,
            workflowId: args.workflowId,
            taskIds: parseList(args.taskIds),
            subtaskIds: parseList(args.subtaskIds),
            scope: args.scope,
            constraints: parseList(args.constraints),
            memoryScope: parseList(args.memoryScope),
            successMetrics: parseList(args.successMetrics),
            requiredEvidence: parseJsonArray(args.requiredEvidence),
            returnContract: args.returnContract,
            evidenceContractId: args.evidenceContractId,
            returnGate: args.returnGate,
            resumeTarget: args.resumeTarget,
          },
          summary: args.summary,
          nextSteps: parseList(args.nextSteps),
          evidence: parseJsonArray<DelegationEvidenceRecord>(args.evidence),
        })
        await recordHandoffEvent(projectRoot, record.packet.trajectoryId, `handoff:${record.id}:created`)
        return {
          kind: 'success',
          message: 'Created delegation handoff',
          data: {
            record,
            pressureContract,
          },
          metadata: {
            title: `HiveMind handoff ${record.id}`,
            metadata: {
              workflowId: record.packet.workflowId,
              targetAgent: record.packet.targetAgent,
              safetyLevel: pressureContract.safety.level,
            },
          },
        }
      }
    default:
      return { kind: 'error', message: `Unsupported handoff action: ${args.action}` }
  }
}
