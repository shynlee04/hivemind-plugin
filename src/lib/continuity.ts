import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import type {
  ContinuityStoreFile,
  DelegationCategory,
  DelegationMeta,
  DelegationRouteResolution,
  PermissionAction,
  PermissionRule,
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionLifecycleCleanup,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
  SessionPromptParams,
  SessionToolProfile,
  SpecialistAgent,
} from "./types.js"
import { VALID_DELEGATION_CATEGORIES } from "./types.js"

const CONTINUITY_VERSION = 1 as const
const DEFAULT_STATE_DIR = resolve(process.cwd(), ".opencode", "state", "opencode-harness")

let storeCache: ContinuityStoreFile | undefined

function getEnvPath(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function resolveContinuityFilePath(): string {
  const explicitFile = getEnvPath("OPENCODE_HARNESS_CONTINUITY_FILE")
  if (explicitFile) {
    return resolve(explicitFile)
  }

  const explicitStateDir = getEnvPath("OPENCODE_HARNESS_STATE_DIR")
  const stateDir = explicitStateDir ? resolve(explicitStateDir) : DEFAULT_STATE_DIR
  return resolve(stateDir, "session-continuity.json")
}

function getContinuityFile(): string {
  return resolveContinuityFilePath()
}

function ensureStoreLoaded(): ContinuityStoreFile {
  if (storeCache) {
    return storeCache
  }

  storeCache = loadStoreFromDisk()
  return storeCache
}

function loadStoreFromDisk(): ContinuityStoreFile {
  const continuityFile = getContinuityFile()
  if (!existsSync(continuityFile)) {
    return emptyStore()
  }

  try {
    const raw = readFileSync(continuityFile, "utf8")
    if (!raw.trim()) {
      return emptyStore()
    }

    const parsed = JSON.parse(raw) as Partial<ContinuityStoreFile>
    const sessions = isRecord(parsed.sessions) ? parsed.sessions : {}
    const normalizedSessions: Record<string, SessionContinuityRecord> = {}

    for (const [sessionID, value] of Object.entries(sessions)) {
      const record = normalizeContinuityRecord(sessionID, value)
      if (record) {
        normalizedSessions[sessionID] = record
      }
    }

    return {
      version: CONTINUITY_VERSION,
      updatedAt: asNumber(parsed.updatedAt) ?? Date.now(),
      sessions: normalizedSessions,
    }
  } catch {
    return emptyStore()
  }
}

function persistStore(): void {
  const continuityFile = getContinuityFile()
  const store = ensureStoreLoaded()
  store.updatedAt = Date.now()
  mkdirSync(dirname(continuityFile), { recursive: true })
  writeFileSync(continuityFile, `${JSON.stringify(store, null, 2)}\n`, "utf8")
}

function emptyStore(): ContinuityStoreFile {
  return {
    version: CONTINUITY_VERSION,
    updatedAt: Date.now(),
    sessions: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

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
      return value
    default:
      return undefined
  }
}

function normalizeDelegationCategory(value: unknown): DelegationCategory | undefined {
  return VALID_DELEGATION_CATEGORIES.includes(value as DelegationCategory)
    ? (value as DelegationCategory)
    : undefined
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
  const temperature = asNumber(value.temperature)
  const guidanceText = asString(value.guidanceText)
  const modelSource = asString(value.modelSource)
  const agentSource = asString(value.agentSource)
  const temperatureSource = asString(value.temperatureSource)
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry))
    : []

  if (
    !effectiveAgent ||
    temperature === undefined ||
    (modelSource !== "explicit" && modelSource !== "category" && modelSource !== "none") ||
    (agentSource !== "explicit" && agentSource !== "category") ||
    (temperatureSource !== "category" && temperatureSource !== "agent")
  ) {
    return undefined
  }

  return {
    requestedCategory: requestedCategory ?? category,
    category,
    requestedAgent,
    effectiveAgent,
    requestedModel,
    effectiveModel,
    temperature,
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
    case "queued":
    case "running":
    case "completed":
    case "error":
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

function normalizeMetadata(value: unknown): SessionContinuityMetadata | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const parentSessionID = asString(value.parentSessionID)
  const rootSessionID = asString(value.rootSessionID)
  const delegation = normalizeDelegationMeta(value.delegation)
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
  const lastError = asString(value.lastError)
  const lifecycle = normalizeLifecycleState(value.lifecycle)

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
    lastError,
    lifecycle,
  }
}

function normalizeContinuityRecord(
  sessionID: string,
  value: unknown
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

function clonePermissionRules(rules: PermissionRule[]): PermissionRule[] {
  return rules.map((rule) => ({ ...rule }))
}

function cloneStringList(values: string[]): string[] {
  return [...values]
}

function cloneLifecycleQueueState(
  queue: SessionLifecycleQueueState | undefined
): SessionLifecycleQueueState | undefined {
  return queue ? { ...queue } : undefined
}

function cloneLifecycleObservation(
  observation: SessionLifecycleObservation | undefined
): SessionLifecycleObservation | undefined {
  return observation ? { ...observation } : undefined
}

function cloneLifecycleCleanup(
  cleanup: SessionLifecycleCleanup | undefined
): SessionLifecycleCleanup | undefined {
  return cleanup ? { ...cleanup } : undefined
}

function cloneLifecycleState(lifecycle: SessionLifecycleState | undefined): SessionLifecycleState | undefined {
  return lifecycle
    ? {
        ...lifecycle,
        queue: cloneLifecycleQueueState(lifecycle.queue),
        observation: cloneLifecycleObservation(lifecycle.observation),
        cleanup: cloneLifecycleCleanup(lifecycle.cleanup),
      }
    : undefined
}

function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    sessionID: record.sessionID,
    toolProfile: {
      permissionRules: clonePermissionRules(record.toolProfile.permissionRules),
      compatibleTools: cloneStringList(record.toolProfile.compatibleTools),
    },
    promptParams: {
      agent: record.promptParams.agent,
      category: record.promptParams.category,
      model: record.promptParams.model,
      temperature: record.promptParams.temperature,
      guidanceText: record.promptParams.guidanceText,
      tools: cloneStringList(record.promptParams.tools),
    },
    metadata: {
      ...record.metadata,
      delegation: { ...record.metadata.delegation },
      route: record.metadata.route
        ? {
            ...record.metadata.route,
            warnings: cloneStringList(record.metadata.route.warnings ?? []),
          }
        : undefined,
      constraints: cloneStringList(record.metadata.constraints),
      lifecycle: cloneLifecycleState(record.metadata.lifecycle),
    },
  }
}

export function listSessionContinuity(): SessionContinuityRecord[] {
  const store = ensureStoreLoaded()
  return Object.values(store.sessions).map((record) => cloneContinuityRecord(record))
}

export function getSessionContinuity(sessionID: string): SessionContinuityRecord | undefined {
  const store = ensureStoreLoaded()
  const record = store.sessions[sessionID]
  return record ? cloneContinuityRecord(record) : undefined
}

export function getSessionToolProfile(sessionID: string): SessionToolProfile | undefined {
  return getSessionContinuity(sessionID)?.toolProfile
}

export function getSessionPromptParams(sessionID: string): SessionPromptParams | undefined {
  return getSessionContinuity(sessionID)?.promptParams
}

export function getSessionContinuityMetadata(sessionID: string): SessionContinuityMetadata | undefined {
  return getSessionContinuity(sessionID)?.metadata
}

export function recordSessionContinuity(record: SessionContinuityRecord): SessionContinuityRecord {
  const store = ensureStoreLoaded()
  const normalized = cloneContinuityRecord({
    ...record,
    metadata: {
      ...record.metadata,
      updatedAt: Date.now(),
    },
  })

  store.sessions[record.sessionID] = normalized
  persistStore()
  return cloneContinuityRecord(normalized)
}

export function patchSessionContinuity(
  sessionID: string,
  patch: Partial<SessionContinuityMetadata>
): SessionContinuityRecord | undefined {
  const store = ensureStoreLoaded()
  const current = store.sessions[sessionID]
  if (!current) {
    return undefined
  }

  const next: SessionContinuityRecord = {
    ...current,
    metadata: {
      ...current.metadata,
      ...patch,
      delegation: patch.delegation
        ? { ...patch.delegation }
        : { ...current.metadata.delegation },
      constraints: patch.constraints ? [...patch.constraints] : [...current.metadata.constraints],
      lifecycle: patch.lifecycle
        ? cloneLifecycleState(patch.lifecycle)
        : cloneLifecycleState(current.metadata.lifecycle),
      updatedAt: Date.now(),
    },
  }

  store.sessions[sessionID] = next
  persistStore()
  return cloneContinuityRecord(next)
}

export function deleteSessionContinuity(sessionID: string): void {
  const store = ensureStoreLoaded()
  if (!store.sessions[sessionID]) {
    return
  }

  delete store.sessions[sessionID]
  persistStore()
}

export function getContinuityStoragePath(): string {
  return getContinuityFile()
}
