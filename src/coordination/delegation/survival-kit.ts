import type { Delegation } from "./types.js"

/** Survival kit data extracted from a delegation for compact-context injection. */
export interface DelegationSurvivalKit {
  id: string
  parentId: string
  queueKey: string
  agent: string
  status: string
  task: string
  timestamp: number
}

/** Stale detection warning for a survival kit whose timestamp exceeds the threshold. */
export interface StaleWarning {
  delegationId: string
  ageMs: number
  thresholdMs: number
}

/** Marker prefix for delegation survival manifest lines. */
const SURVIVAL_PREFIX = "[DELEGATION SURVIVAL]"

/** Default stale detection threshold: 5 minutes. */
const DEFAULT_STALE_THRESHOLD_MS = 5 * 60 * 1000

/**
 * REQ-RC-03: Formats delegation records into survival manifest text for pre-compact injection.
 *
 * Each delegation produces a `[DELEGATION SURVIVAL]` line with all fields needed
 * to reconstruct delegation awareness after a context compaction event.
 *
 * @param delegations - Active delegation records to serialize into the manifest.
 * @returns Formatted manifest string with one `[DELEGATION SURVIVAL]` line per delegation.
 */
export function injectSurvivalManifest(delegations: Delegation[]): string {
  if (delegations.length === 0) return ""

  const lines = delegations.map((d) => {
    const taskSummary = d.prompt
      ? d.prompt.length > 120 ? `${d.prompt.slice(0, 120)}...` : d.prompt
      : "(no prompt)"
    return `${SURVIVAL_PREFIX} id=${d.id} parent=${d.parentSessionId} queueKey=${d.queueKey} agent=${d.agent} status=${d.status} task=${taskSummary}`
  })

  return lines.join("\n")
}

/**
 * REQ-RC-03: Parses survival manifest text back into structured kits.
 *
 * Only lines starting with `[DELEGATION SURVIVAL]` are parsed.
 * Malformed lines are silently skipped.
 *
 * @param text - The compacted context text that may contain survival manifest lines.
 * @returns Parsed survival kits with timestamp set to Date.now() (parse time).
 */
export function parseSurvivalManifest(text: string): DelegationSurvivalKit[] {
  const kits: DelegationSurvivalKit[] = []
  const lines = text.split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith(SURVIVAL_PREFIX)) continue

    const id = extractNamedValue(trimmed, "id=")
    const parentId = extractNamedValue(trimmed, "parent=")
    const queueKey = extractNamedValue(trimmed, "queueKey=")
    const agent = extractNamedValue(trimmed, "agent=")
    const status = extractNamedValue(trimmed, "status=")
    const task = extractNamedValue(trimmed, "task=")

    if (!id || !parentId) continue

    kits.push({
      agent: agent ?? "",
      id,
      parentId,
      queueKey: queueKey ?? "",
      status: status ?? "unknown",
      task: task ?? "",
      timestamp: Date.now(),
    })
  }

  return kits
}

/**
 * REQ-RC-03: Detects survival kits that have exceeded the stale threshold.
 *
 * @param kits - Parsed survival kits to check for staleness.
 * @param thresholdMs - Maximum age in milliseconds before a kit is considered stale (default: 5 min).
 * @returns Stale warnings for kits whose age exceeds the threshold.
 */
export function detectStaleKit(
  kits: DelegationSurvivalKit[],
  thresholdMs: number = DEFAULT_STALE_THRESHOLD_MS,
): StaleWarning[] {
  const now = Date.now()
  return kits
    .filter((kit) => (now - kit.timestamp) > thresholdMs)
    .map((kit) => ({
      delegationId: kit.id,
      ageMs: now - kit.timestamp,
      thresholdMs,
    }))
}

/**
 * Extracts a `key=value` pair from a survival manifest line.
 *
 * Handles values that extend to the next space-delimited key or end-of-line.
 * The `task=` value is special: it extends to end-of-line since task summaries may contain spaces.
 */
function extractNamedValue(line: string, prefix: string): string | undefined {
  const startIndex = line.indexOf(` ${prefix}`)
  if (startIndex === -1) return undefined

  const valueStart = startIndex + prefix.length + 1
  if (valueStart >= line.length) return undefined

  if (prefix === "task=") {
    return line.slice(valueStart)
  }

  const nextSpace = line.indexOf(" ", valueStart)
  return nextSpace === -1 ? line.slice(valueStart) : line.slice(valueStart, nextSpace)
}
