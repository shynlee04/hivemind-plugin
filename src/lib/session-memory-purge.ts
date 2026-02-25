/**
 * Session Memory Purge — auto-purge transient SessionMemory on task completion.
 *
 * Phase 3A: When tasks reach terminal status, purge temporary SessionMemoryNode
 * entries for that session. This is a pure library function (no side effects
 * beyond file I/O).
 *
 * @module lib/session-memory-purge
 */

import { getEffectivePaths } from "./paths.js"
import { readManifest, writeManifest } from "./manifest.js"
import { SessionMemoryStateSchema } from "../schemas/graph-state.js"
import type { SessionMemoryState } from "../schemas/graph-state.js"

const DEFAULT_SESSION_MEMORY_STATE: SessionMemoryState = {
  version: "1.0.0",
  session_memory: [],
}

export interface PurgeResult {
  purgedCount: number
  synthesized: string | null
}

/**
 * Purge transient (temporary) session memory nodes for a given session.
 *
 * - Loads session-memory.json from the graph directory
 * - Finds nodes where: temporary === true AND purged_at is null AND session_id matches
 * - Sets purged_at to current ISO timestamp
 * - Builds a synthesis string from purged nodes' condensed content
 * - Saves back to session-memory.json
 *
 * @param directory - Project root directory
 * @param sessionId - Session ID to purge transient memory for
 * @returns Count of purged nodes and a synthesis string (or null if none purged)
 */
export async function purgeTransientSessionMemory(
  directory: string,
  sessionId: string
): Promise<PurgeResult> {
  const path = `${getEffectivePaths(directory).graphDir}/session-memory.json`
  const raw = await readManifest<unknown>(path, DEFAULT_SESSION_MEMORY_STATE)
  const parsed = SessionMemoryStateSchema.safeParse(raw)
  const state = parsed.success ? parsed.data : DEFAULT_SESSION_MEMORY_STATE

  const nowIso = new Date().toISOString()
  let purgedCount = 0
  const synthesizedParts: string[] = []

  const updatedMemory = state.session_memory.map((node) => {
    const isTarget =
      node.temporary === true &&
      (node.purged_at === null || node.purged_at === undefined) &&
      node.session_id === sessionId

    if (!isTarget) {
      return node
    }

    purgedCount++
    const snippet = node.condensed || node.content.slice(0, 240)
    synthesizedParts.push(snippet)

    return {
      ...node,
      purged_at: nowIso,
    }
  })

  if (purgedCount === 0) {
    return { purgedCount: 0, synthesized: null }
  }

  const updatedState: SessionMemoryState = {
    ...state,
    session_memory: updatedMemory,
  }
  await writeManifest(path, updatedState)

  return {
    purgedCount,
    synthesized: synthesizedParts.join(" | "),
  }
}
