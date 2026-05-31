import { randomUUID } from "node:crypto"
import { existsSync, readFileSync, renameSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { assertPathWithinRoot } from "../../shared/security/path-scope.js"
import { ChildWriter } from "../../features/session-tracker/persistence/child-writer.js"
import { getStoreCache, setStoreCache } from "./store-cache.js"
import type {
  CapturedResult,
  CompactionCheckpointData,
  ContinuityStoreFile,
  DelegationMeta,
  DelegationPacket,
  GovernancePersistenceState,
  PendingNotification,
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionLifecycleState,
} from "../../shared/types.js"

const CONTINUITY_VERSION = 1 as const

export function getCanonicalStateDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd()
  return resolve(root, ".hivemind", "state")
}

export function getLegacyStateDir(projectRoot?: string): string {
  const root = projectRoot || process.cwd()
  const LEGACY_STATE_DIR = resolve(root, ".opencode", "state", "hivemind")
  return LEGACY_STATE_DIR
}

function getEnvPath(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function resolveContinuityFilePath(projectRoot?: string): string {
  const explicitFile = getEnvPath("OPENCODE_HARNESS_CONTINUITY_FILE")
  if (explicitFile) {
    return resolve(explicitFile)
  }

  const explicitStateDir = getEnvPath("OPENCODE_HARNESS_STATE_DIR")
  if (explicitStateDir) {
    return resolve(resolve(explicitStateDir), "session-continuity.json")
  }

  // Q6: canonical path is always .hivemind/state/ for writes
  return assertPathWithinRoot(getCanonicalStateDir(projectRoot), "session-continuity.json", "continuity state")
}

function resolveLegacyFilePath(projectRoot?: string): string {
  return resolve(getLegacyStateDir(projectRoot), "session-continuity.json")
}

function getContinuityFile(projectRoot?: string): string {
  return resolveContinuityFilePath(projectRoot)
}

/**
 * Moves a corrupt continuity file aside so recovery evidence remains auditable.
 *
 * @param filePath - Path to the unreadable continuity JSON file.
 * @returns The quarantine path containing the original corrupt payload.
 */
function quarantineCorruptFile(filePath: string): string {
  const quarantinePath = `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(filePath, quarantinePath)
  return quarantinePath
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

// ---------------------------------------------------------------------------
// Inline deep-clone helpers (replaces deleted continuity-clone.ts)
// ---------------------------------------------------------------------------

function cloneDelegationMeta(meta: DelegationMeta | null): DelegationMeta | null {
  if (!meta) return null
  return { ...meta }
}

function cloneCompactionCheckpoint(cp: CompactionCheckpointData | undefined): CompactionCheckpointData | undefined {
  if (!cp) return undefined
  return {
    ...cp,
    tools: [...cp.tools],
    warnings: [...cp.warnings],
    delegationMeta: cp.delegationMeta ? { ...cp.delegationMeta } : null,
    sessionStats: { ...cp.sessionStats, byTool: { ...cp.sessionStats.byTool } },
  }
}

function cloneDelegationPacket(packet: DelegationPacket | undefined): DelegationPacket | undefined {
  if (!packet) return undefined
  return {
    ...packet,
    artifacts: [...packet.artifacts],
    commits: [...packet.commits],
    parentChain: [...packet.parentChain],
  }
}

function cloneLifecycleState(state: SessionLifecycleState | undefined): SessionLifecycleState | undefined {
  if (!state) return undefined
  return { ...state }
}

function clonePendingNotifications(notifications: PendingNotification[] | undefined): PendingNotification[] {
  if (!Array.isArray(notifications)) return []
  return notifications.map((notification) => ({
    ...notification,
    metadata: notification.metadata ? { ...notification.metadata } : undefined,
    artifacts: notification.artifacts ? [...notification.artifacts] : undefined,
    commits: notification.commits ? [...notification.commits] : undefined,
  }))
}

function cloneCapturedResult(result: CapturedResult | undefined): CapturedResult | undefined {
  if (!result) return undefined
  return {
    ...result,
    artifactPaths: [...result.artifactPaths],
    gitCommits: [...result.gitCommits],
    toolCallSummary: [...result.toolCallSummary],
  }
}

function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      delegation: cloneDelegationMeta(record.metadata.delegation),
      constraints: [...record.metadata.constraints],
      pendingNotifications: clonePendingNotifications(record.metadata.pendingNotifications),
      resultCapture: cloneCapturedResult(record.metadata.resultCapture),
      compactionCheckpoint: cloneCompactionCheckpoint(record.metadata.compactionCheckpoint),
      delegationPacket: cloneDelegationPacket(record.metadata.delegationPacket),
      lifecycle: cloneLifecycleState(record.metadata.lifecycle),
    },
  }
}

// ---------------------------------------------------------------------------
// Inline normalizer (replaces deleted continuity-normalizers.ts)
// ---------------------------------------------------------------------------

function normalizeContinuityRecord(sessionID: string, value: unknown): SessionContinuityRecord | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const rec = value as Record<string, unknown>
  const meta = typeof rec.metadata === "object" && rec.metadata !== null
    ? rec.metadata as Record<string, unknown>
    : {}
  const promptParams = typeof rec.promptParams === "object" && rec.promptParams !== null
    ? rec.promptParams as SessionContinuityRecord["promptParams"]
    : {}

  return {
    sessionID,
    promptParams,
    toolProfile: typeof rec.toolProfile === "object" && rec.toolProfile !== null
      ? rec.toolProfile as SessionContinuityRecord["toolProfile"]
      : undefined,
    metadata: {
      status: (meta.status as SessionContinuityMetadata["status"]) ?? "pending",
      description: typeof meta.description === "string" ? meta.description : "",
      delegation: (meta.delegation as DelegationMeta | null) ?? null,
      category: typeof meta.category === "string" ? meta.category : undefined,
      constraints: Array.isArray(meta.constraints) ? [...(meta.constraints as string[])] : [],
      lifecycle: (meta.lifecycle as SessionLifecycleState | undefined) ?? undefined,
      pendingNotifications: Array.isArray(meta.pendingNotifications)
        ? [...(meta.pendingNotifications as PendingNotification[])]
        : [],
      resultCapture: (meta.resultCapture as CapturedResult | undefined) ?? undefined,
      compactionCheckpoint: (meta.compactionCheckpoint as CompactionCheckpointData | undefined) ?? undefined,
      delegationPacket: (meta.delegationPacket as DelegationPacket | undefined) ?? undefined,
      route: typeof meta.route === "string" ? meta.route : undefined,
      lastToolActivityAt: typeof meta.lastToolActivityAt === "number" ? meta.lastToolActivityAt : undefined,
      updatedAt: typeof meta.updatedAt === "number" && Number.isFinite(meta.updatedAt) ? meta.updatedAt : Date.now(),
    },
  }
}

// ---------------------------------------------------------------------------
// Governance state helpers
// ---------------------------------------------------------------------------

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
        ...rule.condition,
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

// ---------------------------------------------------------------------------
// Store I/O
// ---------------------------------------------------------------------------

function ensureStoreLoaded(projectRoot?: string): ContinuityStoreFile {
  const filePath = getContinuityFile(projectRoot)
  const cached = getStoreCache(filePath)
  if (cached) {
    return cached
  }

  const loaded = loadStoreFromDisk(projectRoot)
  setStoreCache(filePath, loaded)
  return loaded
}

function loadStoreFromDisk(projectRoot?: string): ContinuityStoreFile {
  const continuityFile = getContinuityFile(projectRoot)

  // Q6: try canonical path first, then legacy for backward compatibility
  const filePaths = [continuityFile]
  const legacyFile = resolveLegacyFilePath(projectRoot)
  if (legacyFile !== continuityFile) {
    filePaths.push(legacyFile)
  }

  for (const filePath of filePaths) {
    if (!existsSync(filePath)) continue

    try {
      const raw = readFileSync(filePath, "utf8")
      if (!raw.trim()) continue

      const parsed = JSON.parse(raw) as unknown
      if (!isParsedStore(parsed)) continue

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
    } catch (error) {
      const quarantinePath = quarantineCorruptFile(filePath)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(
        `[Harness] Failed to read continuity store at ${filePath}; corrupt file quarantined at ${quarantinePath}: ${message}`,
      )
    }
  }

  return emptyStore()
}



function persistStore(_projectRoot?: string): void {
  // REQ-P41D-02: No disk write. In-memory store is kept for current-process reads.
  // Session-tracker dual-write is handled by recordSessionContinuity/patchSessionContinuity.
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function listSessionContinuity(): SessionContinuityRecord[] {
  return Object.values(ensureStoreLoaded().sessions).map((record) => cloneContinuityRecord(record))
}

export function getSessionContinuity(sessionID: string): SessionContinuityRecord | undefined {
  const record = ensureStoreLoaded().sessions[sessionID]
  return record ? cloneContinuityRecord(record) : undefined
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

  // --- P41-B: Dual-write to session-tracker (fire-and-forget) ---
  if (record.sessionID.startsWith("ses_")) {
    try {
      const projectRoot = dirname(dirname(dirname(getContinuityFile())))
      const childWriter = new ChildWriter({ projectRoot })
      childWriter.createChildFile(record.sessionID, record.sessionID, {
        sessionID: record.sessionID,
        parentSessionID: record.sessionID,
        delegationDepth: 0,
        delegatedBy: { agentName: "", model: "", tool: "", description: "", subagentType: "" },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: "active",
        mainAgent: { name: "", model: "" },
        turns: [],
        children: [],
        lifecycle: record.metadata.lifecycle,
        pendingNotifications: record.metadata.pendingNotifications?.length ? record.metadata.pendingNotifications : undefined,
        compactionCheckpoint: record.metadata.compactionCheckpoint,
      }).catch((err) => {
        console.error(`[Harness] recordSessionContinuity dual-write error: ${err instanceof Error ? err.message : String(err)}`)
      })
    } catch (err) {
      console.error(`[Harness] recordSessionContinuity dual-write error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

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
      resultCapture: patch.resultCapture
        ? cloneCapturedResult(patch.resultCapture)
        : cloneCapturedResult(current.metadata.resultCapture),
      updatedAt: Date.now(),
    },
  }

  store.sessions[sessionID] = next
  persistStore()

  // --- P41-B: Dual-write to session-tracker (fire-and-forget) ---
  if (sessionID.startsWith("ses_")) {
    const hasLifecycleFields = patch.lifecycle || patch.pendingNotifications || patch.compactionCheckpoint
    if (hasLifecycleFields) {
      void (async () => {
        try {
          const projectRoot = dirname(dirname(dirname(getContinuityFile())))
          const childWriter = new ChildWriter({ projectRoot })
          const continuityRecord = store.sessions[sessionID]
          if (!continuityRecord) return
          const parentID = continuityRecord.metadata.delegation?.rootID ?? sessionID
          const fileExists = await childWriter.childFileExists(parentID, sessionID)
          if (!fileExists) return
          childWriter.createChildFile(parentID, sessionID, {
            sessionID,
            parentSessionID: parentID,
            delegationDepth: continuityRecord.metadata.delegation?.depth ?? 0,
            delegatedBy: { agentName: "", model: "", tool: "", description: "", subagentType: "" },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: "active",
            mainAgent: { name: "", model: "" },
            turns: [],
            children: [],
            lifecycle: patch.lifecycle,
            pendingNotifications: patch.pendingNotifications?.length ? patch.pendingNotifications : undefined,
            compactionCheckpoint: patch.compactionCheckpoint,
          }).catch((err) => {
            console.warn(`[Harness] patchSessionContinuity dual-write error for ${sessionID}: ${err instanceof Error ? err.message : String(err)}`)
          })
        } catch (err) {
          console.warn(`[Harness] patchSessionContinuity dual-write: skipping session-tracker write for ${sessionID}: ${err instanceof Error ? err.message : String(err)}`)
        }
      })()
    }
  }

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

export function getContinuityStoragePath(projectRoot?: string): string {
  return getContinuityFile(projectRoot)
}


