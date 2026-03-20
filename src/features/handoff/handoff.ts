import {
  closeDelegationHandoff,
  createDelegationHandoff,
  getDelegationHandoffPath,
  listDelegationHandoffs,
  readDelegationHandoff,
  updateDelegationHandoff,
  validateDelegationHandoff,
  type DelegationHandoffRecord,
  type DelegationEvidenceRecord,
} from '../../delegation/index.js'
import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import { dispatchDelegationHandoffPacketAction } from '../agent-work-contract/engine/chain-executor.js'
import { upsertWorkflowDelegationContinuityLinkage } from '../runtime-entry/workflow-continuity.js'
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

async function syncDelegationContinuity(input: {
  projectRoot: string
  record: DelegationHandoffRecord
  actingSessionId: string
}): Promise<{
  continuity: Awaited<ReturnType<typeof upsertWorkflowDelegationContinuityLinkage>>
  chainAction: Awaited<ReturnType<typeof dispatchDelegationHandoffPacketAction>> | null
}> {
  const handoffRef = getDelegationHandoffPath(input.projectRoot, input.record.id)
  const continuity = await upsertWorkflowDelegationContinuityLinkage({
    projectRoot: input.projectRoot,
    identity: {
      workflowId: input.record.packet.workflowId,
      trajectoryId: input.record.packet.trajectoryId,
      sessionId: input.record.packet.sourceSessionId,
    },
    actingSessionId: input.actingSessionId,
    linkedContractId: input.record.packet.evidenceContractId,
    delegation: {
      delegationId: input.record.id,
      handoffRef,
      targetSessionId: input.record.packet.targetSessionId,
      resumeTarget: input.record.packet.resumeTarget,
      status: input.record.status,
    },
  })
  const linkedContractId = continuity?.transaction.linkedContractId ?? input.record.packet.evidenceContractId
  const chainAction = linkedContractId
    ? await dispatchDelegationHandoffPacketAction({
        projectRoot: input.projectRoot,
        contractId: linkedContractId,
        handoff: input.record,
        handoffRef,
        continuity,
      })
    : null

  return {
    continuity,
    chainAction,
  }
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
      {
        const handoffId = args.id
      return {
        kind: 'success',
        message: 'Validated delegation handoff',
        data: {
          ...(await (async () => {
            const result = validateDelegationHandoff(projectRoot, handoffId)
            const linkage = result.record
              ? await syncDelegationContinuity({
                  projectRoot,
                  record: result.record,
                  actingSessionId: context.sessionID,
                })
              : { continuity: null, chainAction: null }

            if (result.record && linkage.chainAction?.executed) {
              await recordHandoffEvent(projectRoot, result.record.packet.trajectoryId, `handoff:${handoffId}:delegation-dispatched`)
            }

            return {
              ...result,
              continuity: linkage.continuity?.transaction,
              chainAction: linkage.chainAction,
            }
          })()),
          pressureContract,
        },
      }
      }
    case 'close':
      if (!args.id || !args.summary) {
        return { kind: 'error', message: 'id and summary are required for close' }
      }
      {
        const result = closeDelegationHandoff(projectRoot, args.id, args.summary)
        await recordHandoffEvent(projectRoot, result.record?.packet.trajectoryId, `handoff:${args.id}:closed`)
        const linkage = result.record
          ? await syncDelegationContinuity({
              projectRoot,
              record: result.record,
              actingSessionId: context.sessionID,
            })
          : { continuity: null, chainAction: null }
        if (result.record && linkage.chainAction?.executed) {
          await recordHandoffEvent(projectRoot, result.record.packet.trajectoryId, `handoff:${args.id}:delegation-dispatched`)
        }
        return {
          kind: 'success',
          message: 'Closed delegation handoff',
          data: {
            ...result,
            continuity: linkage.continuity?.transaction,
            chainAction: linkage.chainAction,
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
        const linkage = await syncDelegationContinuity({
          projectRoot,
          record: result,
          actingSessionId: context.sessionID,
        })
        if (linkage.chainAction?.executed) {
          await recordHandoffEvent(projectRoot, result.packet.trajectoryId, `handoff:${args.id}:delegation-dispatched`)
        }
        return {
          kind: 'success',
          message: 'Updated delegation handoff',
          data: {
            record: result,
            continuity: linkage.continuity?.transaction,
            chainAction: linkage.chainAction,
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
        const linkage = await syncDelegationContinuity({
          projectRoot,
          record,
          actingSessionId: context.sessionID,
        })
        if (linkage.chainAction?.executed) {
          await recordHandoffEvent(projectRoot, record.packet.trajectoryId, `handoff:${record.id}:delegation-dispatched`)
        }
        return {
          kind: 'success',
          message: 'Created delegation handoff',
          data: {
            record,
            continuity: linkage.continuity?.transaction,
            chainAction: linkage.chainAction,
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
