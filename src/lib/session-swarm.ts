/**
 * Session Swarm — Headless Researcher Actor Model
 *
 * Manages background research tasks (swarms) using the Actor Model pattern.
 * Swarms are headless sub-agents that run in background and save findings
 * to graph/mems.json with origin_task_id for traceability.
 */

import { randomUUID } from "crypto"
import { join } from "path"
import { existsSync, readFileSync, readdirSync } from "fs"
import { mkdir, readFile, writeFile, rename, unlink } from "fs/promises"

import { withFileLock } from "./file-lock.js"
import { loadGraphMems, saveGraphMems } from "./graph-io.js"
import { getEffectivePaths } from "./paths.js"
import type { MemNode } from "../schemas/graph-nodes.js"

// ─── Types ───────────────────────────────────────────────────────────

export interface SwarmConfig {
  parentSessionId: string
  parentTaskId?: string
  outputPath?: string
}

export interface SwarmMeta {
  id: string
  parent_session_id: string
  parent_task_id: string | null
  prompt: string
  status: "spawned" | "completed" | "error"
  created_at: string
  completed_at?: string
  output_path: string
}

export interface SwarmFindings {
  content: string
  shelf: string
  tags: string[]
}

// ─── Constants ───────────────────────────────────────────────────────

const SWARM_DIR_NAME = "swarms"

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Atomic write with temp file + rename pattern.
 * Follows graph-io.ts pattern for safe concurrent writes.
 */
async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(tempPath, JSON.stringify(data, null, 2))
    await rename(tempPath, filePath)
  } catch (error) {
    if (existsSync(tempPath)) {
      await unlink(tempPath).catch(() => {})
    }
    throw error
  }
}

/**
 * Get the swarms directory path.
 */
function getSwarmDir(projectRoot: string): string {
  const paths = getEffectivePaths(projectRoot)
  return join(paths.activeDir, SWARM_DIR_NAME)
}

/**
 * Ensure swarm directory exists.
 */
async function ensureSwarmDir(projectRoot: string): Promise<string> {
  const swarmDir = getSwarmDir(projectRoot)
  if (!existsSync(swarmDir)) {
    await mkdir(swarmDir, { recursive: true })
  }
  return swarmDir
}

/**
 * Get swarm metadata file path.
 */
function getSwarmMetaPath(projectRoot: string, swarmId: string): string {
  const swarmDir = getSwarmDir(projectRoot)
  return join(swarmDir, `${swarmId}.json`)
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Spawn a headless researcher sub-agent for background research.
 *
 * Creates swarm metadata and returns swarmId for tracking.
 * The actual noReply execution happens via OpenCode SDK.
 * Findings should be saved via completeSwarm() after execution.
 */
export async function spawnHeadlessResearcher(
  projectRoot: string,
  config: SwarmConfig,
  prompt: string,
): Promise<{ swarmId: string; status: "spawned" | "error" }> {
  try {
    // 1. Generate swarm ID
    const swarmId = `swarm-${Date.now()}-${randomUUID().slice(0, 8)}`

    // 2. Ensure swarm directory exists
    const swarmDir = await ensureSwarmDir(projectRoot)

    // 3. Build output path
    const outputPath = config.outputPath || join(swarmDir, `${swarmId}.json`)

    // 4. Create swarm metadata
    const swarmMeta: SwarmMeta = {
      id: swarmId,
      parent_session_id: config.parentSessionId,
      parent_task_id: config.parentTaskId || null,
      prompt,
      status: "spawned",
      created_at: new Date().toISOString(),
      output_path: outputPath,
    }

    // 5. Save swarm metadata with atomic write
    await atomicWriteJson(outputPath, swarmMeta)

    return { swarmId, status: "spawned" }
  } catch (error) {
    console.error("[session-swarm] Failed to spawn headless researcher:", error)
    return { swarmId: "", status: "error" }
  }
}

/**
 * Get status of all active swarms.
 */
export function getActiveSwarms(projectRoot: string): SwarmMeta[] {
  const swarmDir = getSwarmDir(projectRoot)

  if (!existsSync(swarmDir)) {
    return []
  }

  try {
    const files = readdirSync(swarmDir).filter((f) => f.endsWith(".json"))
    return files
      .map((f) => {
        try {
          const content = readFileSync(join(swarmDir, f), "utf-8")
          return JSON.parse(content) as SwarmMeta
        } catch {
          return null
        }
      })
      .filter((m): m is SwarmMeta => m !== null && m.status === "spawned")
  } catch {
    return []
  }
}

/**
 * Mark swarm as completed and link findings to task.
 *
 * Uses file lock for concurrent writes to graph/mems.json.
 */
export async function completeSwarm(
  projectRoot: string,
  swarmId: string,
  findings: SwarmFindings,
): Promise<void> {
  const paths = getEffectivePaths(projectRoot)

  // 1. Load existing swarm metadata for origin_task_id (before update)
  const swarmMetaPath = getSwarmMetaPath(projectRoot, swarmId)
  let parentTaskId: string | null = null
  if (existsSync(swarmMetaPath)) {
    const raw = await readFile(swarmMetaPath, "utf-8")
    const meta = JSON.parse(raw) as SwarmMeta
    parentTaskId = meta.parent_task_id

    // Update swarm metadata to completed with atomic write
    meta.status = "completed"
    meta.completed_at = new Date().toISOString()
    await atomicWriteJson(swarmMetaPath, meta)
  }

  // 2. Create mem node with origin_task_id
  const memNode: MemNode = {
    id: `mem_${Date.now()}_${randomUUID().slice(0, 8)}`,
    origin_task_id: parentTaskId,
    shelf: findings.shelf,
    type: "insight",
    content: findings.content,
    relevance_score: 0.8,
    staleness_stamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // 3. Save findings to graph/mems.json with file lock
  const memsFilePath = paths.graphMems
  await withFileLock(memsFilePath, async () => {
    const current = await loadGraphMems(projectRoot)
    current.mems.push(memNode)
    await saveGraphMems(projectRoot, current)
  })
}

/**
 * Get swarm metadata by ID.
 */
export async function getSwarmMeta(
  projectRoot: string,
  swarmId: string,
): Promise<SwarmMeta | null> {
  const swarmMetaPath = getSwarmMetaPath(projectRoot, swarmId)

  if (!existsSync(swarmMetaPath)) {
    return null
  }

  try {
    const raw = await readFile(swarmMetaPath, "utf-8")
    return JSON.parse(raw) as SwarmMeta
  } catch {
    return null
  }
}