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
export const runtimeCommandCapabilityModeSchema = z.enum(['handler', 'control-plane', 'preview'])
export const runtimeChainActionSupportModeSchema = z.enum(['live', 'metadata-only'])

export const runtimeEntryDecisionSchema = z.object({
  closeoutStatus: runtimeEntryCloseoutStatusSchema,
  nextCommand: z.string().optional(),
  recommendedCommands: z.array(z.string()),
})

export const runtimeIdentitySchema = z.object({
  cardId: z.literal('hivemind-runtime-identity-v1'),
  harnessFramework: z.literal('HiveMind'),
  runtimeIdentity: z.literal('deterministic-harness-runtime'),
  collaborationIdentity: z.literal('autonomy-oriented-context-integrity-spec-driven'),
  activeRuntimeAuthority: runtimeAuthoritySchema,
  activeAuthorityLabel: z.string(),
  runtimePosture: z.literal('singular-runtime-authority'),
  routeDisposition: z.enum(['bootstrap', 'attach', 'inspection']),
  runtimeInstanceId: z.string().optional(),
  serverBaseUrl: z.string().optional(),
})

export const readinessSignalSchema = z.object({
  cardId: z.literal('hivemind-readiness-signal-v1'),
  readinessState: runtimeEntryCloseoutStatusSchema,
  entryState: z.string().optional(),
  qaState: z.string().optional(),
  exactNextCommand: z.string().optional(),
  recommendedCommands: z.array(z.string()),
  readinessSummary: z.string(),
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
export type RuntimeCommandCapabilityMode = z.infer<typeof runtimeCommandCapabilityModeSchema>
export type RuntimeChainActionSupportMode = z.infer<typeof runtimeChainActionSupportModeSchema>
export type RuntimeEntryDecision = z.infer<typeof runtimeEntryDecisionSchema>
export type RuntimeIdentity = z.infer<typeof runtimeIdentitySchema>
export type ReadinessSignal = z.infer<typeof readinessSignalSchema>
export type RuntimeWorkflowGateState = z.infer<typeof runtimeWorkflowGateStateSchema>
export type RuntimeWorkflowSummary = z.infer<typeof runtimeWorkflowSummarySchema>
export type RuntimeStatus = z.infer<typeof runtimeStatusSchema>

export const DECLARED_CHAIN_ACTIONS = {
  onTaskComplete: ['export-workflow', 'next-task', 'close'],
  onWorkflowEnd: ['export-contract', 'archive'],
  onDelegation: ['export-messages', 'handoff-packet'],
  onCompaction80: ['launch-context-agent', 'export-summary'],
} as const

export function resolveRuntimeCommandCapabilityMode(input: {
  commandId: string
  handlerCommandIds: readonly string[]
  controlPlanePrimitiveId?: string
}): RuntimeCommandCapabilityMode {
  if (input.handlerCommandIds.includes(input.commandId)) {
    return 'handler'
  }

  if (input.controlPlanePrimitiveId) {
    return 'control-plane'
  }

  return 'preview'
}

export function resolveRuntimeChainActionSupportMode(
  action: string,
): RuntimeChainActionSupportMode {
  return action === 'handoff-packet' ? 'live' : 'metadata-only'
}

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

function readStringField(report: Record<string, unknown>, key: string): string | undefined {
  const value = report[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readRuntimeAuthorityReport(report: Record<string, unknown>): {
  runtimeAuthority: z.infer<typeof runtimeAuthoritySchema>
  runtimeInstanceId?: string
  serverBaseUrl?: string
} {
  const nested = report.runtimeAuthority
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const runtimeAuthority = (nested as { runtimeAuthority?: unknown }).runtimeAuthority
    return {
      runtimeAuthority: runtimeAuthoritySchema.parse(runtimeAuthority ?? 'none'),
      runtimeInstanceId: readStringField(nested as Record<string, unknown>, 'runtimeInstanceId'),
      serverBaseUrl: readStringField(nested as Record<string, unknown>, 'serverBaseUrl'),
    }
  }

  return {
    runtimeAuthority: 'none',
  }
}

function resolveAuthorityLabel(authority: z.infer<typeof runtimeAuthoritySchema>): string {
  switch (authority) {
    case 'managed-sdk':
      return 'managed OpenCode SDK runtime authority'
    case 'attached-sdk':
      return 'attached OpenCode runtime authority'
    default:
      return 'no active runtime authority'
  }
}

function resolveRouteDisposition(report: Record<string, unknown>): 'bootstrap' | 'attach' | 'inspection' {
  return readStringField(report, 'routeDisposition') === 'attach' ? 'attach' : 'bootstrap'
}

function buildReadinessSummary(input: {
  closeoutStatus: RuntimeEntryCloseoutStatus
  runtimeAuthority: z.infer<typeof runtimeAuthoritySchema>
  nextCommand?: string
}): string {
  const authorityLabel = resolveAuthorityLabel(input.runtimeAuthority)
  const nextStep = input.nextCommand ?? 'none'
  return `${authorityLabel}; readiness ${input.closeoutStatus}; next ${nextStep}.`
}

export function buildRuntimeIdentityAndReadiness(input: {
  closeoutStatus?: RuntimeEntryCloseoutStatus
  report?: Record<string, unknown>
  serverHealthy?: boolean
}): {
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
} {
  const entryDecision = buildRuntimeEntryDecision(input)
  const report = input.report ?? {}
  const authority = readRuntimeAuthorityReport(report)
  const routeDisposition = resolveRouteDisposition(report)

  return {
    runtime_identity: {
      cardId: 'hivemind-runtime-identity-v1',
      harnessFramework: 'HiveMind',
      runtimeIdentity: 'deterministic-harness-runtime',
      collaborationIdentity: 'autonomy-oriented-context-integrity-spec-driven',
      activeRuntimeAuthority: authority.runtimeAuthority,
      activeAuthorityLabel: resolveAuthorityLabel(authority.runtimeAuthority),
      runtimePosture: 'singular-runtime-authority',
      routeDisposition,
      runtimeInstanceId: authority.runtimeInstanceId,
      serverBaseUrl: authority.serverBaseUrl,
    },
    readiness_signal: {
      cardId: 'hivemind-readiness-signal-v1',
      readinessState: entryDecision.closeoutStatus,
      entryState: readStringField(report, 'entry_state'),
      qaState: readStringField(report, 'qa_state'),
      exactNextCommand: entryDecision.nextCommand,
      recommendedCommands: entryDecision.recommendedCommands,
      readinessSummary: buildReadinessSummary({
        closeoutStatus: entryDecision.closeoutStatus,
        runtimeAuthority: authority.runtimeAuthority,
        nextCommand: entryDecision.nextCommand,
      }),
    },
  }
}

export function attachRuntimeIdentityAndReadiness<T extends Record<string, unknown>>(input: {
  closeoutStatus?: RuntimeEntryCloseoutStatus
  report: T
  serverHealthy?: boolean
}): T & {
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
} {
  const identity = buildRuntimeIdentityAndReadiness(input)
  return {
    ...input.report,
    ...identity,
  }
}
