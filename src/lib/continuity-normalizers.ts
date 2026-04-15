import type { CapturedResult, CompactionCheckpointData, DelegationCategory, DelegationExecutionMetadata, DelegationMeta, DelegationPacket, DelegationPacketStatus, DelegationRouteResolution, PendingNotification, PermissionAction, PermissionRule, PerKeyConcurrencyPolicy, SessionConcurrencyOverride, SessionContinuityMetadata, SessionContinuityRecord, SessionLifecycleCleanup, SessionLifecycleObservation, SessionLifecyclePhase, SessionLifecycleQueueState, SessionLifecycleState, SessionPolicyOverride, SessionPromptParams, SessionToolProfile, SpecialistAgent, ToolCallSummary } from "./types.js"
import { VALID_DELEGATION_CATEGORIES } from "./types.js"

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) }

function asString(value: unknown): string | undefined { return typeof value === "string" && value.length > 0 ? value : undefined }

function asNumber(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined }

function asBoolean(value: unknown): boolean | undefined { return typeof value === "boolean" ? value : undefined }

function normalizePermissionAction(value: unknown): PermissionAction | undefined {
  switch (value) {
    case "allow":
    case "deny":
    case "ask":
      return value
    default:
      return undefined
  }
}

function normalizePermissionRule(value: unknown): PermissionRule | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const permission = asString(value.permission)
  const pattern = asString(value.pattern)
  const action = normalizePermissionAction(value.action)

  if (!permission || !pattern || !action) {
    return undefined
  }

  return { permission, pattern, action }
}

function normalizeToolProfile(value: unknown): SessionToolProfile | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const permissionRules = Array.isArray(value.permissionRules)
    ? value.permissionRules
        .map((entry) => normalizePermissionRule(entry))
        .filter((entry): entry is PermissionRule => Boolean(entry))
    : []

  const compatibleTools = Array.isArray(value.compatibleTools)
    ? value.compatibleTools.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []

  return {
    permissionRules,
    compatibleTools,
  }
}

function normalizeSpecialistAgent(value: unknown): SpecialistAgent | undefined {
  switch (value) {
    case "researcher":
    case "builder":
    case "critic":
    case "general":
      return value
    case "build":
    case "plan":
    case "explore":
      return "general"
    default:
      return undefined
  }
}

function normalizeDelegationCategory(value: unknown): DelegationCategory | undefined {
  return VALID_DELEGATION_CATEGORIES.includes(value as DelegationCategory) ? (value as DelegationCategory) : undefined
}

function normalizePerKeyConcurrencyPolicyRecord(
  value: unknown,
): Record<string, PerKeyConcurrencyPolicy> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const entries: Array<[string, PerKeyConcurrencyPolicy]> = []
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      continue
    }

    const limit = asNumber(entry.limit)
    const acquireTimeoutMs = asNumber(entry.acquireTimeoutMs)
    if (limit === undefined) {
      continue
    }

    entries.push([key, { limit, acquireTimeoutMs }])
  }

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function normalizeSessionConcurrencyOverride(
  value: unknown,
): SessionConcurrencyOverride | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const globalLimit = asNumber(value.globalLimit)
  const perKey = normalizePerKeyConcurrencyPolicyRecord(value.perKey)
  if (globalLimit === undefined && !perKey) {
    return undefined
  }

  return {
    globalLimit,
    perKey,
  }
}

function normalizeSessionPolicyOverride(
  value: unknown,
): SessionPolicyOverride | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const concurrency = normalizeSessionConcurrencyOverride(value.concurrency)
  const budget = isRecord(value.budget)
    ? {
        maxToolCallsPerSession: asNumber(value.budget.maxToolCallsPerSession),
        repeatedSignatureThreshold: asNumber(value.budget.repeatedSignatureThreshold),
        warningCap: asNumber(value.budget.warningCap),
        resetOnCompact: asBoolean(value.budget.resetOnCompact),
      }
    : undefined

  const normalizedBudget = budget
    ? Object.fromEntries(
        Object.entries(budget).filter(([, entry]) => entry !== undefined),
      )
    : undefined

  if (!concurrency && (!normalizedBudget || Object.keys(normalizedBudget).length === 0)) {
    return undefined
  }

  return {
    concurrency,
    budget: normalizedBudget,
  }
}

function normalizeRouteResolution(value: unknown): DelegationRouteResolution | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const requestedCategory = normalizeDelegationCategory(value.requestedCategory)
  const category = normalizeDelegationCategory(value.category)
  const requestedAgent = normalizeSpecialistAgent(value.requestedAgent)
  const effectiveAgent = normalizeSpecialistAgent(value.effectiveAgent)
  const requestedModel = asString(value.requestedModel)
  const effectiveModel = asString(value.effectiveModel)
  const presetKey = asString(value.presetKey)
  const temperature = asNumber(value.temperature)
  const fallbackUsed = typeof value.fallbackUsed === "boolean" ? value.fallbackUsed : undefined
  const rationale = asString(value.rationale)
  const guidanceText = asString(value.guidanceText)
  const modelSource = asString(value.modelSource)
  const agentSource = asString(value.agentSource)
  const temperatureSource = asString(value.temperatureSource)
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []

  if (
    !effectiveAgent ||
    !presetKey ||
    temperature === undefined ||
    fallbackUsed === undefined ||
    !rationale ||
    (modelSource !== "explicit" && modelSource !== "category" && modelSource !== "none") ||
    (agentSource !== "explicit" && agentSource !== "category" && agentSource !== "signal") ||
    (temperatureSource !== "category" && temperatureSource !== "agent")
  ) {
    return undefined
  }

  return {
    requestedCategory: requestedCategory ?? category,
    category,
    requestedAgent,
    effectiveAgent,
    presetKey,
    requestedModel,
    effectiveModel,
    temperature,
    fallbackUsed,
    rationale,
    guidanceText,
    modelSource,
    agentSource,
    temperatureSource,
    warnings,
  }
}

function normalizeDelegationMeta(value: unknown): DelegationMeta | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const rootID = asString(value.rootID)
  const depth = asNumber(value.depth)
  const budgetUsed = asNumber(value.budgetUsed)
  const agent = normalizeSpecialistAgent(value.agent)
  const category = normalizeDelegationCategory(value.category)
  const model = asString(value.model)
  const queueKey = asString(value.queueKey)
  const runtimePolicyOverride = normalizeSessionPolicyOverride(value.runtimePolicyOverride)

  if (!rootID || depth === undefined || budgetUsed === undefined || !agent || !queueKey) {
    return undefined
  }

  return {
    rootID,
    depth,
    budgetUsed,
    agent,
    category,
    model,
    queueKey,
    runtimePolicyOverride,
  }
}

function normalizeCompactionCheckpoint(value: unknown): CompactionCheckpointData | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const agentValue = value.agent
  const modelValue = value.model
  const agent = agentValue === null ? null : (asString(agentValue) ?? null)
  const model = modelValue === null ? null : (asString(modelValue) ?? null)
  const tools = Array.isArray(value.tools)
    ? value.tools.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const delegationMetaValue = value.delegationMeta
  const delegationMeta =
    delegationMetaValue === null ? null : (normalizeDelegationMeta(delegationMetaValue) ?? null)
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const sessionStats = isRecord(value.sessionStats) ? value.sessionStats : undefined
  const total = asNumber(sessionStats?.total)
  const byTool = isRecord(sessionStats?.byTool)
    ? Object.fromEntries(
        Object.entries(sessionStats.byTool)
          .map(([key, entry]) => {
            const count = asNumber(entry)
            return count === undefined ? undefined : [key, count]
          })
          .filter((entry): entry is [string, number] => entry !== undefined),
      )
    : {}
  const loop = isRecord(sessionStats?.loop) ? sessionStats.loop : undefined
  const signature = asString(loop?.signature) ?? ""
  const count = asNumber(loop?.count)
  const capturedAt = asNumber(value.capturedAt)

  if (total === undefined || count === undefined || capturedAt === undefined) {
    return undefined
  }

  return {
    agent,
    model,
    tools,
    delegationMeta,
    warnings,
    sessionStats: {
      total,
      byTool,
      loop: {
        signature,
        count,
      },
    },
    capturedAt,
  }
}

function normalizeDelegationPacketStatus(value: unknown): DelegationPacketStatus | undefined {
  switch (value) {
    case "pending":
    case "running":
    case "completed":
    case "failed":
      return value
    default:
      return undefined
  }
}

function normalizeExecutionMetadata(value: unknown): DelegationExecutionMetadata | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const family = value.family === "visible-worker" || value.family === "built-in" ? value.family : undefined
  const submode =
    value.submode === "tmux-pane" ||
    value.submode === "builtin-subsession" ||
    value.submode === "builtin-process"
      ? value.submode
      : undefined
  const rationale = asString(value.rationale)
  const characteristics = isRecord(value.characteristics) ? value.characteristics : undefined
  const capabilityEvidence = isRecord(value.capabilityEvidence) ? value.capabilityEvidence : undefined

  if (!family || !submode || !rationale || !characteristics || !capabilityEvidence) {
    return undefined
  }

  const isParallel = asBoolean(characteristics.isParallel)
  const isInteractive = asBoolean(characteristics.isInteractive)
  const isResearch = asBoolean(characteristics.isResearch)
  const isHeadless = asBoolean(characteristics.isHeadless)
  const runInBackground = asBoolean(characteristics.runInBackground)
  const hasTmux = asBoolean(capabilityEvidence.hasTmux)
  const projectRoot = asString(capabilityEvidence.projectRoot)

  if (
    isParallel === undefined ||
    isInteractive === undefined ||
    isResearch === undefined ||
    isHeadless === undefined ||
    runInBackground === undefined ||
    hasTmux === undefined ||
    !projectRoot
  ) {
    return undefined
  }

  return {
    family,
    submode,
    rationale,
    characteristics: {
      isParallel,
      isInteractive,
      isResearch,
      isHeadless,
      runInBackground,
    },
    capabilityEvidence: {
      hasTmux,
      projectRoot,
    },
  }
}

function normalizeDelegationPacket(value: unknown): DelegationPacket | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = asString(value.id)
  const spec = asString(value.spec)
  const plan = value.plan === null ? null : asString(value.plan)
  const artifacts = Array.isArray(value.artifacts)
    ? value.artifacts.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const commits = Array.isArray(value.commits)
    ? value.commits.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const parentChain = Array.isArray(value.parentChain)
    ? value.parentChain.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const status = normalizeDelegationPacketStatus(value.status)
  const createdAt = asNumber(value.createdAt)
  const updatedAt = asNumber(value.updatedAt)

  if (!id || !spec || plan === undefined || !status || createdAt === undefined || updatedAt === undefined) {
    return undefined
  }

  return {
    id,
    spec,
    plan,
    artifacts,
    commits,
    parentChain,
    status,
    createdAt,
    updatedAt,
  }
}

function normalizePromptParams(value: unknown): SessionPromptParams | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const agent = normalizeSpecialistAgent(value.agent)
  const category = normalizeDelegationCategory(value.category)
  const model = asString(value.model)
  const temperature = asNumber(value.temperature)
  const guidanceText = asString(value.guidanceText)
  const tools = Array.isArray(value.tools)
    ? value.tools.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []

  if (!agent) {
    return undefined
  }

  return {
    agent,
    category,
    model,
    temperature,
    guidanceText,
    tools,
  }
}

function normalizeStatus(value: unknown): SessionContinuityMetadata["status"] | undefined {
  switch (value) {
    case "pending":
      return "queued"
    case "queued":
    case "running":
    case "completed":
    case "failed":
      return value
    case "error":
      return "failed"
    case "cancelled":
    case "interrupt":
      return value
    default:
      return undefined
  }
}

function normalizeLifecyclePhase(value: unknown): SessionLifecyclePhase | undefined {
  switch (value) {
    case "created":
    case "queued":
    case "dispatching":
    case "running":
    case "completed":
    case "failed":
      return value
    default:
      return undefined
  }
}

function normalizeLifecycleQueueState(value: unknown): SessionLifecycleQueueState | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const active = asNumber(value.active)
  const pending = asNumber(value.pending)
  const limit = asNumber(value.limit)
  const acquiredAt = asNumber(value.acquiredAt)
  const releasedAt = asNumber(value.releasedAt)

  if (active === undefined || pending === undefined || limit === undefined) {
    return undefined
  }

  return {
    active,
    pending,
    limit,
    acquiredAt,
    releasedAt,
  }
}

function normalizeLifecycleObservation(value: unknown): SessionLifecycleObservation | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const source = asString(value.source)
  const observedAt = asNumber(value.observedAt)
  const detail = asString(value.detail)
  const statusType = asString(value.statusType)
  const sessionStatusType = asString(value.sessionStatusType)

  if (!source || observedAt === undefined) {
    return undefined
  }

  return {
    source,
    observedAt,
    detail,
    statusType,
    sessionStatusType,
  }
}

function normalizeLifecycleCleanup(value: unknown): SessionLifecycleCleanup | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return {
    scheduledAt: asNumber(value.scheduledAt),
    completedAt: asNumber(value.completedAt),
    reason: asString(value.reason),
  }
}

function normalizeLifecycleState(value: unknown): SessionLifecycleState | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const phase = normalizeLifecyclePhase(value.phase)
  const runMode = value.runMode === "sync" || value.runMode === "async" ? value.runMode : undefined
  const queueKey = asString(value.queueKey)
  const launchedAt = asNumber(value.launchedAt)
  const completedAt = asNumber(value.completedAt)
  const queue = normalizeLifecycleQueueState(value.queue)
  const observation = normalizeLifecycleObservation(value.observation)
  const cleanup = normalizeLifecycleCleanup(value.cleanup)

  if (!phase || !runMode || !queueKey) {
    return undefined
  }

  return {
    phase,
    runMode,
    queueKey,
    launchedAt,
    completedAt,
    queue,
    observation,
    cleanup,
  }
}

function normalizePendingNotification(value: unknown): PendingNotification | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const sessionID = asString(value.sessionID)
  const description = asString(value.description)
  const agent = asString(value.agent)
  const status = value.status
  const error = value.error === undefined ? undefined : asString(value.error)
  const resultPreview = value.resultPreview === undefined ? undefined : asString(value.resultPreview)
  const briefSummary = value.briefSummary === undefined ? undefined : asString(value.briefSummary)
  const outputLink = value.outputLink === undefined ? undefined : asString(value.outputLink)
  const duration = asNumber(value.duration)
  const createdAt = asNumber(value.createdAt)
  const delivered = asBoolean(value.delivered)

  if (
    !sessionID ||
    !description ||
    !agent ||
    (status !== "started" && status !== "completed" && status !== "failed" && status !== "cancelled") ||
    createdAt === undefined ||
    delivered === undefined
  ) {
    return undefined
  }

  return {
    sessionID,
    description,
    agent,
    status,
    error,
    resultPreview,
    briefSummary,
    outputLink,
    duration,
    createdAt,
    delivered,
  }
}

function normalizePendingNotifications(value: unknown): PendingNotification[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const notifications = value
    .map((entry) => normalizePendingNotification(entry))
    .filter((entry): entry is PendingNotification => Boolean(entry))

  return notifications.length > 0 ? notifications : undefined
}

function normalizeToolCallSummary(value: unknown): ToolCallSummary | undefined {
  if (!isRecord(value)) return undefined
  const tool = asString(value.tool)
  if (!tool) return undefined
  return { tool, args: asString(value.args) }
}

function normalizeCapturedResult(value: unknown): CapturedResult | undefined {
  if (!isRecord(value)) return undefined
  const resultText = asString(value.resultText)
  if (resultText === undefined) return undefined
  const artifactPaths = Array.isArray(value.artifactPaths)
    ? value.artifactPaths.map((e: unknown) => asString(e)).filter((e: string | undefined): e is string => Boolean(e))
    : []
  const gitCommits = Array.isArray(value.gitCommits)
    ? value.gitCommits.map((e: unknown) => asString(e)).filter((e: string | undefined): e is string => Boolean(e))
    : []
  const toolCallSummary = Array.isArray(value.toolCallSummary)
    ? value.toolCallSummary.map(normalizeToolCallSummary).filter((e: ToolCallSummary | undefined): e is ToolCallSummary => Boolean(e))
    : []
  const messageCount = asNumber(value.messageCount)
  const capturedAt = asNumber(value.capturedAt)
  if (messageCount === undefined || capturedAt === undefined) return undefined
  return {
    resultText,
    artifactPaths,
    gitCommits,
    toolCallSummary,
    messageCount,
    capturedAt,
    partial: asBoolean(value.partial),
  }
}

function normalizeMetadata(value: unknown): SessionContinuityMetadata | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const parentSessionID = asString(value.parentSessionID)
  const rootSessionID = asString(value.rootSessionID)
  const delegation = normalizeDelegationMeta(value.delegation)
  const compactionCheckpoint = normalizeCompactionCheckpoint(value.compactionCheckpoint)
  const delegationPacket = normalizeDelegationPacket(value.delegationPacket)
  const execution = normalizeExecutionMetadata(value.execution)
  const title = asString(value.title)
  const description = asString(value.description)
  const category = normalizeDelegationCategory(value.category)
  const route = normalizeRouteResolution(value.route)
  const scope = asString(value.scope)
  const constraints = Array.isArray(value.constraints)
    ? value.constraints.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []
  const runInBackground = asBoolean(value.runInBackground)
  const status = normalizeStatus(value.status)
  const createdAt = asNumber(value.createdAt)
  const updatedAt = asNumber(value.updatedAt)
  const lastObservedAt = asNumber(value.lastObservedAt)
  const lastToolActivityAt = asNumber(value.lastToolActivityAt)
  const lastError = asString(value.lastError)
  const lifecycle = normalizeLifecycleState(value.lifecycle)
  const pendingNotifications = normalizePendingNotifications(value.pendingNotifications)
  const defaultDispatchMode = value.defaultDispatchMode === "async" || value.defaultDispatchMode === "sync"
    ? value.defaultDispatchMode
    : undefined
  const tmuxAvailability = value.tmuxAvailability === "auto" || value.tmuxAvailability === "enabled" || value.tmuxAvailability === "disabled"
    ? value.tmuxAvailability
    : undefined
  const pollIntervalMs = asNumber(value.pollIntervalMs)
  const resultCapture = normalizeCapturedResult(value.resultCapture)

  if (
    !parentSessionID ||
    !rootSessionID ||
    !delegation ||
    !title ||
    !description ||
    runInBackground === undefined ||
    !status ||
    createdAt === undefined ||
    updatedAt === undefined
  ) {
    return undefined
  }

  return {
    parentSessionID,
    rootSessionID,
    delegation,
    compactionCheckpoint,
    delegationPacket,
    execution,
    title,
    description,
    category,
    route,
    scope,
    constraints,
    runInBackground,
    status,
    createdAt,
    updatedAt,
    lastObservedAt,
    lastToolActivityAt,
    lastError,
    lifecycle: lifecycle ?? {
      phase:
        status === "completed"
          ? "completed"
          : status === "failed" || status === "error" || status === "cancelled"
            ? "failed"
            : status === "running"
              ? "running"
              : "queued",
      runMode: runInBackground ? "async" : "sync",
      queueKey: delegation.queueKey,
    },
    pendingNotifications,
    defaultDispatchMode,
    tmuxAvailability,
    pollIntervalMs,
    resultCapture,
  }
}

export function normalizeContinuityRecord(
  sessionID: string,
  value: unknown,
): SessionContinuityRecord | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const toolProfile = normalizeToolProfile(value.toolProfile)
  const promptParams = normalizePromptParams(value.promptParams)
  const metadata = normalizeMetadata(value.metadata)

  if (!toolProfile || !promptParams || !metadata) {
    return undefined
  }

  return {
    sessionID,
    toolProfile,
    promptParams,
    metadata,
  }
}
