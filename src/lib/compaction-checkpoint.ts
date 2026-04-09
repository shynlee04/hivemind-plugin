/**
 * Compaction Checkpoint — Session Recovery / Compaction Checkpoint system.
 *
 * Captures a snapshot of harness session state (delegation metadata, warnings,
 * tool call statistics) at the moment of context compaction, so the LLM can
 * be re-oriented after context window truncation.
 *
 * Three-function public API:
 *   captureCheckpoint  — snapshot current TaskStateManager state
 *   restoreCheckpoint  — rehydrate a snapshot back into TaskStateManager
 *   formatCheckpointContext — render snapshot as Markdown for LLM context
 */
import type { TaskStateManager } from "./state.js"
import type { CompactionCheckpointData, DelegationMeta } from "./types.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CheckpointData = CompactionCheckpointData

export interface CaptureCheckpointOptions {
  readonly tools?: readonly string[]
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * Snapshot the current harness state for a session.
 *
 * All collections are deep-cloned so the caller cannot mutate the returned
 * value by modifying live state, and live state cannot be corrupted by
 * mutating the returned value.
 *
 * @param sessionID - The session to snapshot.
 * @param taskState - The TaskStateManager instance holding live session state.
 * @returns An immutable-by-convention CheckpointData snapshot.
 */
export function captureCheckpoint(
  sessionID: string,
  taskState: TaskStateManager,
  options: CaptureCheckpointOptions = {},
): CheckpointData {
  const meta = taskState.getDelegationMeta(sessionID) ?? null
  const stats = taskState.getStats(sessionID)

  return {
    agent: meta?.agent ?? null,
    model: meta?.model ?? null,
    // DelegationMeta does not carry a tools field; tools live on SessionPromptParams
    // in the continuity store. We expose an empty array to satisfy the interface
    // without coupling this module to the continuity store.
    tools: options.tools ? [...options.tools] : [],
    delegationMeta: meta !== null ? cloneDelegationMeta(meta) : null,
    warnings: stats !== undefined ? [...stats.warnings] : [],
    sessionStats: {
      total: stats?.total ?? 0,
      byTool: stats !== undefined ? { ...stats.byTool } : {},
      loop: stats !== undefined ? { ...stats.loop } : { signature: "", count: 0 },
    },
    capturedAt: Date.now(),
  }
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

/**
 * Rehydrate a CheckpointData snapshot into a TaskStateManager.
 *
 * Idempotent: calling restore twice with the same checkpoint replaces the
 * warnings array rather than appending, so duplicates cannot accumulate.
 *
 * @param sessionID - The session to restore state for.
 * @param checkpoint - The snapshot to restore.
 * @param taskState - The TaskStateManager to receive the restored state.
 */
export function restoreCheckpoint(
  sessionID: string,
  checkpoint: CheckpointData,
  taskState: TaskStateManager,
): void {
  const stats = taskState.ensureStats(sessionID)
  stats.total = checkpoint.sessionStats.total
  stats.byTool = { ...checkpoint.sessionStats.byTool }
  stats.loop = { ...checkpoint.sessionStats.loop }
  stats.warnings = [...checkpoint.warnings]

  if (checkpoint.delegationMeta !== null) {
    taskState.setDelegationMeta(sessionID, cloneDelegationMeta(checkpoint.delegationMeta))
  }
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

/**
 * Render a CheckpointData snapshot as a Markdown context block.
 *
 * Produces a section suitable for injection into the LLM context after
 * compaction so the model retains operational awareness of session state.
 *
 * @param checkpoint - The snapshot to render.
 * @returns A Markdown string.
 */
export function formatCheckpointContext(checkpoint: CheckpointData): string {
  const lines: string[] = [
    "## Compaction Checkpoint",
    "",
    `**Agent**: ${checkpoint.agent ?? "unknown"}`,
    `**Model**: ${checkpoint.model ?? "unknown"}`,
    `**Tools**: ${checkpoint.tools.length > 0 ? checkpoint.tools.join(", ") : "none"}`,
    `**Total tool calls**: ${checkpoint.sessionStats.total}`,
    `**Repeated signature count**: ${checkpoint.sessionStats.loop.count}`,
    `**Captured at**: ${new Date(checkpoint.capturedAt).toISOString()}`,
  ]

  if (checkpoint.delegationMeta !== null) {
    lines.push(
      `**Root session**: ${checkpoint.delegationMeta.rootID}`,
      `**Delegation depth**: ${checkpoint.delegationMeta.depth}`,
      `**Root budget used**: ${checkpoint.delegationMeta.budgetUsed}`,
      `**Concurrency key**: ${checkpoint.delegationMeta.queueKey}`,
    )
  }

  if (checkpoint.sessionStats.loop.signature) {
    lines.push(`**Repeated signature**: ${checkpoint.sessionStats.loop.signature}`)
  }

  if (checkpoint.warnings.length > 0) {
    lines.push("", "### Warnings", "")
    for (const w of checkpoint.warnings) {
      lines.push(`- ${w}`)
    }
  }

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function cloneDelegationMeta(meta: DelegationMeta): DelegationMeta {
  return { ...meta }
}
