import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import YAML from 'yaml'

import type { KernelLineage, SessionScope } from '../context/prompt-packet/prompt-packet-types.js'
import { getHivemindPath } from './paths.js'
import type { RuntimeInvocationV1 } from './runtime-invocation.js'

export interface TurnOutputEnvelopeV1 {
  version: 'v1'
  turnId: string
  invocationId: string
  sessionId: string
  parentSessionId?: string
  sessionScope: SessionScope
  agentId?: string
  agentMode?: 'all' | 'primary' | 'sub'
  lineage?: KernelLineage
  delegationId?: string
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
  subtaskIds: string[]
  status: string
  qaState: string
  pivot?: string
  rationale: string[]
  workflowEffects: string[]
  dependencyEffects: string[]
  sotEffects: string[]
  artifactRefs: string[]
  toolEvidence: string[]
  handoffSummary?: string
  followups: string[]
  resumeHints: string[]
}

export interface TurnExportProjectionV1 {
  version: 'v1'
  sessionScope: SessionScope
  qaState: string
  exportFormats: Array<'yaml' | 'markdown'>
  parentSessionId?: string
  delegationId?: string
  yamlPath?: string
  markdownPath?: string
}

function createTurnId(sessionId: string): string {
  return `turn_${sessionId}_${Date.now()}`
}

export function createTurnOutputEnvelope(input: {
  runtimeInvocation: RuntimeInvocationV1
  status: string
  qaState: string
  pivot?: string
  rationale?: string[]
  workflowEffects?: string[]
  dependencyEffects?: string[]
  sotEffects?: string[]
  artifactRefs?: string[]
  toolEvidence?: string[]
  handoffSummary?: string
  followups?: string[]
  resumeHints?: string[]
}): TurnOutputEnvelopeV1 {
  return {
    version: 'v1',
    turnId: createTurnId(input.runtimeInvocation.sessionId),
    invocationId: input.runtimeInvocation.invocationId,
    sessionId: input.runtimeInvocation.sessionId,
    parentSessionId: input.runtimeInvocation.parentSessionId,
    sessionScope: input.runtimeInvocation.sessionScope,
    agentId: input.runtimeInvocation.agentId,
    agentMode: input.runtimeInvocation.agentMode,
    lineage: input.runtimeInvocation.lineage,
    delegationId: input.runtimeInvocation.delegationId,
    trajectoryId: input.runtimeInvocation.trajectoryId,
    workflowId: input.runtimeInvocation.workflowId,
    taskIds: [...input.runtimeInvocation.taskIds],
    subtaskIds: [...input.runtimeInvocation.subtaskIds],
    status: input.status,
    qaState: input.qaState,
    pivot: input.pivot,
    rationale: input.rationale ?? [],
    workflowEffects: input.workflowEffects ?? [],
    dependencyEffects: input.dependencyEffects ?? [],
    sotEffects: input.sotEffects ?? [],
    artifactRefs: input.artifactRefs ?? [],
    toolEvidence: input.toolEvidence ?? [],
    handoffSummary: input.handoffSummary,
    followups: input.followups ?? [],
    resumeHints: input.resumeHints ?? [],
  }
}

export function createTurnOutputProjection(input: {
  sessionScope: SessionScope
  qaState: string
  parentSessionId?: string
  delegationId?: string
}): TurnExportProjectionV1 {
  return {
    version: 'v1',
    sessionScope: input.sessionScope,
    qaState: input.qaState,
    exportFormats: ['yaml', 'markdown'],
    parentSessionId: input.parentSessionId,
    delegationId: input.delegationId,
  }
}

function renderTurnOutputMarkdown(envelope: TurnOutputEnvelopeV1): string {
  return [
    '# HiveMind Turn Output',
    '',
    `- session: \`${envelope.sessionId}\``,
    `- scope: \`${envelope.sessionScope}\``,
    `- trajectory: \`${envelope.trajectoryId ?? 'none'}\``,
    `- workflow: \`${envelope.workflowId ?? 'none'}\``,
    `- qa_state: \`${envelope.qaState}\``,
    `- status: \`${envelope.status}\``,
    envelope.parentSessionId ? `- parent_session: \`${envelope.parentSessionId}\`` : undefined,
    envelope.delegationId ? `- delegation: \`${envelope.delegationId}\`` : undefined,
    '',
    '## Rationale',
    '',
    ...(envelope.rationale.length > 0 ? envelope.rationale.map((item) => `- ${item}`) : ['- none']),
    '',
    '## Followups',
    '',
    ...(envelope.followups.length > 0 ? envelope.followups.map((item) => `- ${item}`) : ['- none']),
  ].filter((line): line is string => line !== undefined).join('\n')
}

export async function exportTurnOutputProjection(
  projectRoot: string,
  envelope: TurnOutputEnvelopeV1,
): Promise<TurnExportProjectionV1> {
  const turnsDir = path.join(getHivemindPath(projectRoot), 'project', 'runtime-turns', envelope.sessionId)
  await fs.mkdir(turnsDir, { recursive: true })

  const yamlPath = path.join(turnsDir, `${envelope.turnId}.yaml`)
  const markdownPath = path.join(turnsDir, `${envelope.turnId}.md`)

  await fs.writeFile(yamlPath, YAML.stringify(envelope))
  await fs.writeFile(markdownPath, renderTurnOutputMarkdown(envelope))

  return {
    ...createTurnOutputProjection({
      sessionScope: envelope.sessionScope,
      qaState: envelope.qaState,
      parentSessionId: envelope.parentSessionId,
      delegationId: envelope.delegationId,
    }),
    yamlPath,
    markdownPath,
  }
}
