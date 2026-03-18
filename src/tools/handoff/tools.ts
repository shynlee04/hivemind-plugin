import { tool } from '@opencode-ai/plugin/tool'

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
      action: tool.schema.enum(['create', 'read', 'list', 'update', 'validate', 'close']).describe('Delegation handoff action to perform'),
      id: tool.schema.string().optional().describe('Handoff identifier to read, update, validate, or close'),
      sourceSessionId: tool.schema.string().optional().describe('Source session identifier for the handoff packet'),
      targetSessionId: tool.schema.string().optional().describe('Target delegated session identifier'),
      sourceAgent: tool.schema.string().optional().describe('Agent creating or owning the source side of the handoff'),
      targetAgent: tool.schema.string().optional().describe('Agent expected to execute the delegated work'),
      trajectoryId: tool.schema.string().optional().describe('Trajectory identifier bound to the handoff'),
      workflowId: tool.schema.string().optional().describe('Workflow identifier bound to the handoff'),
      taskIds: tool.schema.string().optional().describe('Comma-separated task identifiers carried by the handoff'),
      subtaskIds: tool.schema.string().optional().describe('Comma-separated subtask identifiers carried by the handoff'),
      scope: tool.schema.string().optional().describe('Delegated work scope summary'),
      constraints: tool.schema.string().optional().describe('Comma-separated hard constraints for the delegate'),
      memoryScope: tool.schema.string().optional().describe('Comma-separated memory or context scopes to preserve'),
      successMetrics: tool.schema.string().optional().describe('Comma-separated success metrics for completion'),
      requiredEvidence: tool.schema.string().optional().describe('JSON array of required evidence records'),
      summary: tool.schema.string().optional().describe('Human-readable handoff summary or closeout summary'),
      nextSteps: tool.schema.string().optional().describe('Comma-separated next steps for the delegated session'),
      evidence: tool.schema.string().optional().describe('JSON array of evidence records to attach'),
      returnContract: tool.schema.string().optional().describe('Expected return contract for the delegated agent'),
      evidenceContractId: tool.schema.string().optional().describe('Evidence contract identifier tied to the handoff'),
      returnGate: tool.schema.string().optional().describe('Return gate that must be satisfied before closure'),
      resumeTarget: tool.schema.string().optional().describe('Suggested command or surface to resume from'),
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
