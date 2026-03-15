import { tool } from '@opencode-ai/plugin'

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
import { error, success } from '../../shared/tool-response.js'
import { parseList, parseJsonArray, renderToolResult as render } from '../../shared/tool-helpers.js'
import { handoffActionPressureContracts, type HivemindHandoffToolArgs } from './types.js'



async function recordHandoffEvent(projectRoot: string, trajectoryId: string | undefined, summary: string): Promise<void> {
  if (!trajectoryId) {
    return
  }

  await recordTrajectoryEvent(projectRoot, trajectoryId, {
    kind: 'handoff',
    summary,
  })
}

export function createHivemindHandoffTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Delegation and handoff artifact surface for bounded sub-session work. ' +
      'Use this to create, inspect, validate, and close resumable handoffs with evidence requirements.',
    args: {
      action: tool.schema.enum(['create', 'read', 'list', 'update', 'validate', 'close']),
      id: tool.schema.string().optional(),
      sourceSessionId: tool.schema.string().optional(),
      targetSessionId: tool.schema.string().optional(),
      sourceAgent: tool.schema.string().optional(),
      targetAgent: tool.schema.string().optional(),
      trajectoryId: tool.schema.string().optional(),
      workflowId: tool.schema.string().optional(),
      taskIds: tool.schema.string().optional(),
      subtaskIds: tool.schema.string().optional(),
      scope: tool.schema.string().optional(),
      constraints: tool.schema.string().optional(),
      memoryScope: tool.schema.string().optional(),
      successMetrics: tool.schema.string().optional(),
      requiredEvidence: tool.schema.string().optional(),
      summary: tool.schema.string().optional(),
      nextSteps: tool.schema.string().optional(),
      evidence: tool.schema.string().optional(),
      returnContract: tool.schema.string().optional(),
      evidenceContractId: tool.schema.string().optional(),
      returnGate: tool.schema.string().optional(),
      resumeTarget: tool.schema.string().optional(),
    },
    async execute(args: HivemindHandoffToolArgs, context) {
      const pressureContract = handoffActionPressureContracts[args.action]
      switch (args.action) {
        case 'list':
          return render(success('Listed delegation handoffs', {
            handoffs: listDelegationHandoffs(projectRoot),
            pressureContract,
          }))
        case 'read':
          if (!args.id) {
            return render(error('id is required for read'))
          }
          return render(success('Loaded delegation handoff', {
            record: readDelegationHandoff(projectRoot, args.id),
            pressureContract,
          }))
        case 'validate':
          if (!args.id) {
            return render(error('id is required for validate'))
          }
          return render(success('Validated delegation handoff', {
            ...validateDelegationHandoff(projectRoot, args.id),
            pressureContract,
          }))
        case 'close':
          if (!args.id || !args.summary) {
            return render(error('id and summary are required for close'))
          }
          {
            const result = closeDelegationHandoff(projectRoot, args.id, args.summary)
            await recordHandoffEvent(projectRoot, result.record?.packet.trajectoryId, `handoff:${args.id}:closed`)
            return render(success('Closed delegation handoff', {
              ...result,
              pressureContract,
            }))
          }
        case 'update':
          if (!args.id) {
            return render(error('id is required for update'))
          }
          {
            const result = updateDelegationHandoff(projectRoot, {
              id: args.id,
              summary: args.summary,
              nextSteps: parseList(args.nextSteps),
              evidence: parseJsonArray<DelegationEvidenceRecord>(args.evidence),
            })
            if (!result) {
              return render(error(`Handoff ${args.id} was not found`))
            }
            await recordHandoffEvent(projectRoot, result.packet.trajectoryId, `handoff:${args.id}:updated`)
            return render(success('Updated delegation handoff', {
              record: result,
              pressureContract,
            }))
          }
        case 'create':
          if (!args.targetAgent || !args.workflowId || !args.scope || !args.summary) {
            return render(error('targetAgent, workflowId, scope, and summary are required for create'))
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
            context.metadata({
              title: `HiveMind handoff ${record.id}`,
              metadata: {
                workflowId: record.packet.workflowId,
                targetAgent: record.packet.targetAgent,
                safetyLevel: pressureContract.safety.level,
              },
            })
            await recordHandoffEvent(projectRoot, record.packet.trajectoryId, `handoff:${record.id}:created`)
            return render(success('Created delegation handoff', {
              record,
              pressureContract,
            }))
          }
        default:
          return render(error(`Unsupported handoff action: ${args.action}`))
      }
    },
  })
}
