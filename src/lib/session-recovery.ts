import type { CompactionCheckpointData, DelegationPacketStatus, SessionContinuityRecord } from "./types.js"
import { isTerminal } from "./task-status.js"

export type RecoveryRiskLevel = "low" | "medium" | "high"

export type RecoveryRecommendedAction = "resume" | "review" | "reset"

export type RecoveryRiskAssessment = {
  level: RecoveryRiskLevel
  stale: boolean
  suspicious: boolean
  lastActivityAt: number
  stalenessMs: number
  activeDelegations: number
  warnings: string[]
  recommendedAction: RecoveryRecommendedAction
  reasons: string[]
}

export type RecoveryResumeState = {
  sessionID: string
  assessment: RecoveryRiskAssessment
  checkpoint?: CompactionCheckpointData
  warningSnapshot: string[]
  pendingDelegation: DelegationPacketStatus | null
  lastActivityAt: number
  resumeSummary: string
}

export type RecoveryAssessmentOptions = {
  now?: number
  staleAfterMs?: number
  suspiciousFutureSkewMs?: number
}

const DEFAULT_STALE_AFTER_MS = 30 * 60_000
const DEFAULT_SUSPICIOUS_FUTURE_SKEW_MS = 5 * 60_000

function resolveNow(now?: number): number {
  return typeof now === "number" && Number.isFinite(now) ? now : Date.now()
}

function resolveLastActivity(record: SessionContinuityRecord): number {
  return record.metadata.lastObservedAt ?? record.metadata.updatedAt ?? record.metadata.createdAt
}

function resolveWarnings(record: SessionContinuityRecord): string[] {
  return record.metadata.compactionCheckpoint?.warnings ? [...record.metadata.compactionCheckpoint.warnings] : []
}

function resolveActiveDelegations(record: SessionContinuityRecord): number {
  const status = record.metadata.delegationPacket?.status
  return status === "pending" || status === "running" ? 1 : 0
}

function clampStaleness(now: number, lastActivityAt: number): number {
  return Math.max(0, now - lastActivityAt)
}

function buildReasons(args: {
  stale: boolean
  suspicious: boolean
  activeDelegations: number
  warnings: string[]
}): string[] {
  const reasons: string[] = []

  if (args.suspicious) {
    reasons.push("Persisted timestamps appear inconsistent or are in the future.")
  }
  if (args.stale) {
    reasons.push("Session state is stale and should be reviewed before resuming.")
  }
  if (args.stale && args.activeDelegations > 0) {
    reasons.push("An active delegation was still pending when the session stopped.")
  }
  if (args.warnings.length > 0) {
    reasons.push(`Recovered warning snapshot includes ${args.warnings.length} warning(s).`)
  }

  return reasons
}

function determineLevel(args: {
  suspicious: boolean
  stale: boolean
  activeDelegations: number
  warnings: string[]
}): RecoveryRiskLevel {
  if (args.suspicious) {
    return "high"
  }
  if (args.stale && (args.activeDelegations > 0 || args.warnings.length > 0)) {
    return "high"
  }
  if (args.stale || args.warnings.length > 0) {
    return "medium"
  }
  return "low"
}

function determineRecommendedAction(level: RecoveryRiskLevel): RecoveryRecommendedAction {
  switch (level) {
    case "high":
      return "review"
    case "medium":
      return "review"
    case "low":
      return "resume"
  }
}

export function assessRecoveryRisk(
  record: SessionContinuityRecord,
  options: RecoveryAssessmentOptions = {},
): RecoveryRiskAssessment {
  const now = resolveNow(options.now)
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS
  const suspiciousFutureSkewMs = options.suspiciousFutureSkewMs ?? DEFAULT_SUSPICIOUS_FUTURE_SKEW_MS
  const lastActivityAt = resolveLastActivity(record)
  const warnings = resolveWarnings(record)
  const activeDelegations = resolveActiveDelegations(record)
  const suspicious =
    !Number.isFinite(lastActivityAt) ||
    lastActivityAt <= 0 ||
    lastActivityAt > now + suspiciousFutureSkewMs ||
    record.metadata.createdAt > now + suspiciousFutureSkewMs
  const stalenessMs = clampStaleness(now, lastActivityAt)
  const stale = stalenessMs >= staleAfterMs
  const reasons = buildReasons({ stale, suspicious, activeDelegations, warnings })
  const level = determineLevel({ suspicious, stale, activeDelegations, warnings })

  return {
    level,
    stale,
    suspicious,
    lastActivityAt,
    stalenessMs,
    activeDelegations,
    warnings,
    recommendedAction: determineRecommendedAction(level),
    reasons,
  }
}

export function buildRecoveryResumeState(
  record: SessionContinuityRecord,
  options: RecoveryAssessmentOptions = {},
): RecoveryResumeState {
  const assessment = assessRecoveryRisk(record, options)
  const warningSnapshot = [...assessment.warnings]
  const pendingDelegation = record.metadata.delegationPacket?.status ?? null
  const lastActivityAt = assessment.lastActivityAt
  const summaryBits = [
    `risk=${assessment.level}`,
    `stale=${assessment.stale}`,
    `warnings=${warningSnapshot.length}`,
    `activeDelegations=${assessment.activeDelegations}`,
  ]

  if (assessment.suspicious) {
    summaryBits.push("suspicious=true")
  }

  return {
    sessionID: record.sessionID,
    assessment,
    checkpoint: record.metadata.compactionCheckpoint,
    warningSnapshot,
    pendingDelegation,
    lastActivityAt,
    resumeSummary: summaryBits.join("; "),
  }
}

export function getUnresolvedChildren(
  continuityStore: Map<string, SessionContinuityRecord>,
  parentSessionID: string,
): Array<{
  sessionId: string
  status: string
  launchedAt: number | undefined
  lastObservedAt: number | undefined
  agent: string | undefined
  description: string | undefined
}> {
  const children: Array<{
    sessionId: string
    status: string
    launchedAt: number | undefined
    lastObservedAt: number | undefined
    agent: string | undefined
    description: string | undefined
  }> = []

  for (const record of continuityStore.values()) {
    if (record.metadata.parentSessionID !== parentSessionID) continue
    if (isTerminal(record.metadata.status)) continue
    children.push({
      sessionId: record.sessionID,
      status: record.metadata.status,
      launchedAt: record.metadata.lifecycle?.launchedAt,
      lastObservedAt: record.metadata.lastObservedAt,
      agent: record.metadata.delegation.agent,
      description: record.metadata.description,
    })
  }

  return children
}

export function getChildResultPreviews(
  continuityStore: Map<string, SessionContinuityRecord>,
  parentSessionID: string,
): Array<{
  sessionId: string
  resultPreview: string | undefined
  artifacts: string[]
  commits: string[]
  completedAt: number | undefined
}> {
  const results: Array<{
    sessionId: string
    resultPreview: string | undefined
    artifacts: string[]
    commits: string[]
    completedAt: number | undefined
  }> = []

  for (const record of continuityStore.values()) {
    if (record.metadata.parentSessionID !== parentSessionID) continue
    if (record.metadata.status !== "completed") continue
    if (!record.metadata.resultCapture) continue
    results.push({
      sessionId: record.sessionID,
      resultPreview: record.metadata.resultCapture.resultText,
      artifacts: record.metadata.resultCapture.artifactPaths,
      commits: record.metadata.resultCapture.gitCommits,
      completedAt: record.metadata.lifecycle?.completedAt,
    })
  }

  return results
}
