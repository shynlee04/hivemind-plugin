import { z } from 'zod'

import { runtimeRecentEventSchema } from './runtime-events.js'

export const runtimeAuthoritySchema = z.enum(['managed-sdk', 'attached-sdk', 'none'])

export const runtimeStatusEntryStateSchema = z.object({
  state: z.string(),
  interactiveBootstrapRequired: z.boolean(),
  recommendedNext: z.string(),
})

export const runtimeStatusQaStateSchema = z.object({
  state: z.string(),
  releaseState: z.string(),
})

export const runtimeStatusLineageSessionStateSchema = z.object({
  lineage: z.string(),
  purposeClass: z.string(),
  trajectoryId: z.string().optional(),
  workflowId: z.string().optional(),
  taskIds: z.array(z.string()),
  subtaskIds: z.array(z.string()),
  checkpointId: z.string().optional(),
})

export const runtimeEntryCloseoutStatusSchema = z.enum(['open', 'ready', 'blocked', 'qa-pending'])

export const runtimeEntryDecisionSchema = z.object({
  closeoutStatus: runtimeEntryCloseoutStatusSchema,
  nextCommand: z.string().optional(),
  recommendedCommands: z.array(z.string()),
})

export const runtimeWorkflowGateStateSchema = z.enum([
  'idle',
  'bootstrap-required',
  'qa-pending',
  'blocked',
  'ready',
])

export const runtimeWorkflowSummarySchema = z.object({
  workflowId: z.string(),
  gateState: runtimeWorkflowGateStateSchema,
  currentTaskIds: z.array(z.string()),
  currentSubtaskIds: z.array(z.string()),
})

export const runtimeStatusSchema = z.object({
  runtimeAuthority: runtimeAuthoritySchema,
  runtimeInstanceId: z.string().optional(),
  serverBaseUrl: z.string().optional(),
  entryState: runtimeStatusEntryStateSchema,
  qaState: runtimeStatusQaStateSchema,
  lineageSessionState: runtimeStatusLineageSessionStateSchema,
  workflowSummary: runtimeWorkflowSummarySchema.nullable().default(null),
  recentEvents: z.array(runtimeRecentEventSchema).default([]),
})

export type RuntimeStatusEntryState = z.infer<typeof runtimeStatusEntryStateSchema>
export type RuntimeStatusQaState = z.infer<typeof runtimeStatusQaStateSchema>
export type RuntimeStatusLineageSessionState = z.infer<typeof runtimeStatusLineageSessionStateSchema>
export type RuntimeEntryCloseoutStatus = z.infer<typeof runtimeEntryCloseoutStatusSchema>
export type RuntimeEntryDecision = z.infer<typeof runtimeEntryDecisionSchema>
export type RuntimeWorkflowGateState = z.infer<typeof runtimeWorkflowGateStateSchema>
export type RuntimeWorkflowSummary = z.infer<typeof runtimeWorkflowSummarySchema>
export type RuntimeStatus = z.infer<typeof runtimeStatusSchema>

function resolveRecommendedCommands(input: {
  closeoutStatus: RuntimeEntryCloseoutStatus
  nextCommand?: string
  serverHealthy?: boolean
}): string[] {
  if (input.closeoutStatus !== 'ready') {
    if (input.nextCommand === 'hm-init') {
      return ['hm-init', 'hm-doctor', 'opencode serve']
    }

    if (input.nextCommand === 'hm-doctor') {
      return ['hm-doctor', 'hm-harness', 'opencode serve']
    }

    if (input.nextCommand === 'hm-harness') {
      return ['hm-harness', 'opencode attach', '/hm-plan']
    }
  }

  return input.serverHealthy
    ? ['opencode attach', 'hm-harness', '/hm-plan']
    : ['opencode serve', 'hm-doctor', 'hm-init']
}

export function readRuntimeEntryNextCommand(report: Record<string, unknown>): string | undefined {
  const nextCommand = report.next_command
  return typeof nextCommand === 'string' ? nextCommand : undefined
}

export function buildRuntimeEntryDecision(input: {
  closeoutStatus?: RuntimeEntryCloseoutStatus
  report?: Record<string, unknown>
  serverHealthy?: boolean
}): RuntimeEntryDecision {
  const closeoutStatus = input.closeoutStatus ?? 'open'
  const nextCommand = input.report ? readRuntimeEntryNextCommand(input.report) : undefined

  return {
    closeoutStatus,
    nextCommand,
    recommendedCommands: resolveRecommendedCommands({
      closeoutStatus,
      nextCommand,
      serverHealthy: input.serverHealthy,
    }),
  }
}
