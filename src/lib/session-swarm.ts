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

import { addGraphMem } from "./graph-io.js"
import { createLogger, noopLogger, type Logger } from "./logging.js"
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
  actual_session_id?: string  // SDK-created session ID
  error?: string              // Error message if status is "error"
}

export interface SwarmFindings {
  content: string
  shelf: string
  tags: string[]
}

/**
 * SDK executor interface for swarm spawning.
 * Implemented by hooks/ layer to keep lib/ SDK-free.
 */
export interface SwarmSdkExecutor {
  createSession(options: {
    title: string
    parentID: string
  }): Promise<{ id: string } | null>
  
  sendPrompt(options: {
    sessionId: string
    noReply: boolean
    parts: Array<{ type: "text"; text: string }>
  }): Promise<void>
}

// ─── Constants ───────────────────────────────────────────────────────

const SWARM_DIR_NAME = "swarms"

const swarmLoggerPromises = new Map<string, Promise<Logger>>()

function getSwarmLogger(projectRoot: string): Promise<Logger> {
  let loggerPromise = swarmLoggerPromises.get(projectRoot)
  if (!loggerPromise) {
    const paths = getEffectivePaths(projectRoot)
    loggerPromise = createLogger(paths.logsDir, "session-swarm").catch(() => noopLogger)
    swarmLoggerPromises.set(projectRoot, loggerPromise)
  }
  return loggerPromise
}

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
 * If SDK executor is provided, actually spawns the sub-agent.
 * Findings should be saved via completeSwarm() after execution.
 *
 * @param projectRoot - The project root directory
 * @param config - Swarm configuration
 * @param prompt - The research task prompt
 * @param sdkExecutor - Optional SDK executor (provided by hooks/ layer)
 */
export async function spawnHeadlessResearcher(
  projectRoot: string,
  config: SwarmConfig,
  prompt: string,
  sdkExecutor?: SwarmSdkExecutor,
): Promise<{ swarmId: string; status: "spawned" | "error" }> {
  const logger = await getSwarmLogger(projectRoot)
  let swarmId = ""
  let meta: SwarmMeta | null = null

  try {
    // 1. Generate swarm ID
    swarmId = `swarm-${Date.now()}-${randomUUID().slice(0, 8)}`

    // 2. Ensure swarm directory exists
    const swarmDir = await ensureSwarmDir(projectRoot)

    // 3. Build output path
    const outputPath = config.outputPath || join(swarmDir, `${swarmId}.json`)

    // 4. Create swarm metadata
    meta = {
      id: swarmId,
      parent_session_id: config.parentSessionId,
      parent_task_id: config.parentTaskId || null,
      prompt,
      status: "spawned",
      created_at: new Date().toISOString(),
      output_path: outputPath,
    }

    // 5. If SDK executor provided, actually spawn the sub-agent
    if (sdkExecutor) {
      try {
        const created = await sdkExecutor.createSession({
          title: `Swarm: ${swarmId}`,
          parentID: config.parentSessionId,
        })

        if (created?.id) {
          const actualSessionId = created.id
          meta.actual_session_id = actualSessionId

          // Dispatch immediately with noReply for background execution.
          // We still await transport acceptance and handle local send errors.
          await sdkExecutor.sendPrompt({
            sessionId: actualSessionId,
            noReply: true,
            parts: [
              {
                type: "text",
                text: `[HEADLESS RESEARCH PROTOCOL]
Task: ${prompt}

Save findings using hivemind_cycle tool with shelf and tags.
Do not ask for clarification. Execute autonomously.

Begin research.`,
              },
            ],
          }).catch(async (err: unknown) => {
            await logger.error(
              `[swarm] ${swarmId} prompt failed: ${err instanceof Error ? err.message : String(err)}`,
            )
          })
        }
      } catch (err: unknown) {
        await logger.error(
          `[swarm] ${swarmId} spawn failed: ${err instanceof Error ? err.message : String(err)}`,
        )
        meta.status = "error"
        meta.error = String(err)
      }
    } else {
      await logger.warn(`[swarm] ${swarmId} no SDK executor provided - metadata only`)
    }

    // 6. Save swarm metadata with atomic write
    await atomicWriteJson(outputPath, meta)

    // Status is either "spawned" or "error" at this point (never "completed")
    return { swarmId, status: meta.status === "error" ? "error" : "spawned" }
  } catch (error: unknown) {
    await logger.error(
      `[session-swarm] Failed to spawn headless researcher: ${error instanceof Error ? error.message : String(error)}`,
    )

    // Try to save error state if we have metadata
    if (meta && swarmId) {
      try {
        meta.status = "error"
        meta.error = String(error)
        await atomicWriteJson(meta.output_path, meta)
      } catch {
        // Ignore write errors in error path
      }
    }

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
  // 1. Load existing swarm metadata for origin_task_id and session_id (before update)
  const swarmMetaPath = getSwarmMetaPath(projectRoot, swarmId)
  let parentTaskId: string | null = null
  let sessionId: string | null = null
  if (existsSync(swarmMetaPath)) {
    const raw = await readFile(swarmMetaPath, "utf-8")
    const meta = JSON.parse(raw) as SwarmMeta
    parentTaskId = meta.parent_task_id
    sessionId = meta.parent_session_id

    // Update swarm metadata to completed with atomic write
    meta.status = "completed"
    meta.completed_at = new Date().toISOString()
    await atomicWriteJson(swarmMetaPath, meta)
  }

  // 2. Create mem node with origin_task_id and session_id
  // Fallback: derive session_id from trajectory if not in swarm metadata
  const effectiveSessionId = sessionId ?? (() => {
    const trajectoryPath = getEffectivePaths(projectRoot).graphTrajectory
    if (existsSync(trajectoryPath)) {
      try {
        const trajectoryRaw = readFileSync(trajectoryPath, "utf-8")
        const trajectory = JSON.parse(trajectoryRaw) as { trajectory?: { session_id?: string } }
        return trajectory.trajectory?.session_id ?? randomUUID()
      } catch {
        return randomUUID()
      }
    }
    return randomUUID()
  })()

  const memNode: MemNode = {
    id: randomUUID(),
    session_id: effectiveSessionId,
    origin_task_id: parentTaskId,
    shelf: findings.shelf,
    type: "insight",
    content: findings.content,
    relevance_score: 0.8,
    staleness_stamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // 3. Save findings to graph/mems.json via addGraphMem (Zod-validated)
  await addGraphMem(projectRoot, memNode)
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
