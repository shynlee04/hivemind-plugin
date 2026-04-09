import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { exportDelegationArtifacts, type DelegationExportPolicy } from "./delegation-export.js"
import { buildRecoveryResumeState, type RecoveryAssessmentOptions, type RecoveryResumeState } from "./session-recovery.js"
import type {
  ContinuityStoreFile,
  DelegationPacket,
  GovernancePersistenceState,
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionPromptParams,
  SessionToolProfile,
} from "./types.js"
import {
  cloneCompactionCheckpoint,
  cloneContinuityRecord,
  cloneDelegationMeta,
  cloneDelegationPacket,
  cloneLifecycleState,
  clonePendingNotifications,
} from "./continuity-clone.js"
import { normalizeContinuityRecord } from "./continuity-normalizers.js"

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

function resolveDelegationExportPolicy(): DelegationExportPolicy {
  const enabled = /^(1|true|yes|audit)$/i.test(getEnvPath("OPENCODE_HARNESS_DELEGATION_EXPORTS") ?? "false")
  const explicitDir = getEnvPath("OPENCODE_HARNESS_DELEGATION_EXPORT_DIR")

  return {
    enabled,
    outputDir: explicitDir ? resolve(explicitDir) : resolve(process.cwd(), ".hivemind", "delegation"),
  }
}

function emptyStore(): ContinuityStoreFile {
  return {
    version: CONTINUITY_VERSION,
    updatedAt: Date.now(),
    sessions: {},
    governance: {
      rules: [],
      violations: [],
      updatedAt: Date.now(),
    },
  }
}

function isParsedStore(value: unknown): value is Partial<ContinuityStoreFile> & { sessions?: unknown } {
  return typeof value === "object" && value !== null
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

    const parsed = JSON.parse(raw) as unknown
    if (!isParsedStore(parsed)) {
      return emptyStore()
    }

    const sessions =
      typeof parsed.sessions === "object" && parsed.sessions !== null && !Array.isArray(parsed.sessions)
        ? parsed.sessions
        : {}

    const normalizedSessions: Record<string, SessionContinuityRecord> = {}
    for (const [sessionID, value] of Object.entries(sessions)) {
      const record = normalizeContinuityRecord(sessionID, value)
      if (record) {
        normalizedSessions[sessionID] = record
      }
    }

    return {
      version: CONTINUITY_VERSION,
      updatedAt: typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
      sessions: normalizedSessions,
      governance: isGovernanceState(parsed.governance)
        ? cloneGovernanceState(parsed.governance)
        : emptyStore().governance,
    }
  } catch {
    return emptyStore()
  }
}

function isGovernanceState(value: unknown): value is GovernancePersistenceState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const rules = (value as { rules?: unknown }).rules
  const violations = (value as { violations?: unknown }).violations
  const updatedAt = (value as { updatedAt?: unknown }).updatedAt

  return Array.isArray(rules) && Array.isArray(violations) && typeof updatedAt === "number" && Number.isFinite(updatedAt)
}

function cloneGovernanceState(state: GovernancePersistenceState): GovernancePersistenceState {
  return {
    rules: state.rules.map((rule) => ({
      ...rule,
      condition: {
        toolNames: rule.condition.toolNames ? [...rule.condition.toolNames] : undefined,
        sessionIDs: rule.condition.sessionIDs ? [...rule.condition.sessionIDs] : undefined,
      },
      action: {
        ...rule.action,
        escalation: rule.action.escalation ? { ...rule.action.escalation } : undefined,
      },
    })),
    violations: state.violations.map((violation) => ({
      ...violation,
      escalation: violation.escalation ? { ...violation.escalation } : undefined,
    })),
    updatedAt: state.updatedAt,
  }
}

function persistStore(): void {
  const continuityFile = getContinuityFile()
  const store = ensureStoreLoaded()
  store.updatedAt = Date.now()
  mkdirSync(dirname(continuityFile), { recursive: true })
  writeFileSync(continuityFile, `${JSON.stringify(store, null, 2)}\n`, "utf8")
  exportDelegationArtifacts({
    records: Object.values(store.sessions),
    policy: resolveDelegationExportPolicy(),
  })
}

export function listSessionContinuity(): SessionContinuityRecord[] {
  return Object.values(ensureStoreLoaded().sessions).map((record) => cloneContinuityRecord(record))
}

export function getSessionContinuity(sessionID: string): SessionContinuityRecord | undefined {
  const record = ensureStoreLoaded().sessions[sessionID]
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

export function getSessionRecoveryState(
  sessionID: string,
  options: RecoveryAssessmentOptions = {},
): RecoveryResumeState | undefined {
  const record = getSessionContinuity(sessionID)
  return record ? buildRecoveryResumeState(record, options) : undefined
}

export function recordSessionContinuity(record: SessionContinuityRecord): SessionContinuityRecord {
  const normalized = cloneContinuityRecord({
    ...record,
    metadata: {
      ...record.metadata,
      updatedAt: Date.now(),
    },
  })

  ensureStoreLoaded().sessions[record.sessionID] = normalized
  persistStore()
  return cloneContinuityRecord(normalized)
}

export function patchSessionContinuity(
  sessionID: string,
  patch: Partial<SessionContinuityMetadata>,
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
        ? cloneDelegationMeta(patch.delegation)!
        : cloneDelegationMeta(current.metadata.delegation)!,
      compactionCheckpoint: patch.compactionCheckpoint
        ? cloneCompactionCheckpoint(patch.compactionCheckpoint)
        : cloneCompactionCheckpoint(current.metadata.compactionCheckpoint),
      delegationPacket: patch.delegationPacket
        ? cloneDelegationPacket(patch.delegationPacket)
        : cloneDelegationPacket(current.metadata.delegationPacket),
      constraints: patch.constraints ? [...patch.constraints] : [...current.metadata.constraints],
      lifecycle: patch.lifecycle
        ? cloneLifecycleState(patch.lifecycle)
        : cloneLifecycleState(current.metadata.lifecycle),
      pendingNotifications: patch.pendingNotifications
        ? clonePendingNotifications(patch.pendingNotifications)
        : clonePendingNotifications(current.metadata.pendingNotifications),
      updatedAt: Date.now(),
    },
  }

  store.sessions[sessionID] = next
  persistStore()
  return cloneContinuityRecord(next)
}

export function patchSessionDelegationPacket(
  sessionID: string,
  patch: Partial<Omit<DelegationPacket, "id" | "createdAt" | "spec">>,
): SessionContinuityRecord | undefined {
  const currentPacket = ensureStoreLoaded().sessions[sessionID]?.metadata.delegationPacket
  if (!currentPacket) {
    return undefined
  }

  return patchSessionContinuity(sessionID, {
    delegationPacket: {
      ...currentPacket,
      plan: patch.plan === undefined ? currentPacket.plan : patch.plan,
      artifacts: patch.artifacts ? [...patch.artifacts] : [...currentPacket.artifacts],
      commits: patch.commits ? [...patch.commits] : [...currentPacket.commits],
      parentChain: patch.parentChain ? [...patch.parentChain] : [...currentPacket.parentChain],
      status: patch.status ?? currentPacket.status,
      updatedAt: Date.now(),
    },
  })
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

export function getDelegationExportPolicy(): DelegationExportPolicy {
  return resolveDelegationExportPolicy()
}

export function getGovernancePersistenceState(): GovernancePersistenceState {
  return cloneGovernanceState(ensureStoreLoaded().governance ?? emptyStore().governance!)
}

export function recordGovernancePersistenceState(state: GovernancePersistenceState): GovernancePersistenceState {
  const next = cloneGovernanceState({
    ...state,
    updatedAt: Date.now(),
  })

  const store = ensureStoreLoaded()
  store.governance = next
  persistStore()
  return cloneGovernanceState(next)
}
