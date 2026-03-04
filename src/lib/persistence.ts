import type { FileHandle } from "fs/promises";
/**
 * StateManager - Disk persistence for brain state
 */

import { readFile, readdir, writeFile, mkdir, rename, unlink, copyFile, open, stat } from "fs/promises"
import { existsSync } from "fs"
import { dirname, join } from "path"
import type { BrainState } from "../schemas/brain-state.js"
import type { HiveMindConfig } from "../schemas/config.js"
import type { Logger } from "./logging.js"
import { getEffectivePaths } from "./paths.js"
import { createBrainState, BrainStateSchema, BRAIN_STATE_MIGRATIONS } from "../schemas/brain-state.js"
import { createConfig } from "../schemas/config.js"

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err
}

/** Clean up old backup files, keeping only the last 3 versions */
async function cleanupOldBackups(brainPath: string, logger?: Logger): Promise<void> {
  const dir = dirname(brainPath)
  const backupPattern = /brain\.json\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/

  try {
    const files = await readdir(dir)
    const backupFiles = files
      .filter(file => backupPattern.test(file))
      .sort((a, b) => b.localeCompare(a)) // Fixed format; lexical order matches recency

    // Keep only last 3 backups
    const oldBackups = backupFiles.slice(3)

    // Process in chunks to avoid EMFILE
    const CHUNK_SIZE = 5
    for (let i = 0; i < oldBackups.length; i += CHUNK_SIZE) {
      const chunk = oldBackups.slice(i, i + CHUNK_SIZE)
      await Promise.all(chunk.map(async (backupName) => {
        const backupPath = join(dir, backupName)
        try {
          await unlink(backupPath)
        } catch (err: unknown) {
          await logger?.error(`Failed to delete old backup ${backupPath}: ${err}`)
        }
      }))
    }
  } catch (err: unknown) {
    await logger?.error(`Failed to cleanup old backups in ${dir}: ${err}`)
  }
}

class FileLock {
  private lockPath: string
  private logger?: Logger
  private handle: FileHandle | null = null

  constructor(lockPath: string, logger?: Logger) {
    this.lockPath = lockPath
    this.logger = logger
  }

  async acquire(timeout = 5000): Promise<void> {
    let delay = 50
    const maxDelay = 500
    const start = Date.now()

    while (Date.now() - start < timeout) {
      try {
        // Try to acquire exclusive lock
        this.handle = await open(this.lockPath, "wx")
        return // Lock acquired
      } catch (err: unknown) {
        if (isNodeError(err) && err.code === "EEXIST") {
          // Lock file exists, check if it's stale (older than 5 seconds)
          try {
            const s1 = await stat(this.lockPath)
            if (Date.now() - s1.mtime.getTime() > 5000) {
              // Stale candidate. Wait a bit to reduce race condition
              await new Promise(r => setTimeout(r, Math.random() * 50 + 10))

              // Check again
              try {
                const s2 = await stat(this.lockPath)
                if (s2.mtime.getTime() === s1.mtime.getTime()) {
                  // Still the same old file?
                  await unlink(this.lockPath)
                  await this.logger?.warn(`Removed stale lock file: ${this.lockPath}`)
                  continue // Retry acquisition
                }
              } catch (e) {
                // File might be gone now, which is fine.
                continue
              }
            }
          } catch (statErr: unknown) {
            // Ignore errors when checking stale lock
          }

          // Lock is active, wait and retry
          await new Promise(resolve => setTimeout(resolve, delay))
          delay = Math.min(delay * 2, maxDelay)
        } else {
          throw err // Other error
        }
      }
    }

    throw new Error("Failed to acquire lock within timeout")
  }

  async release(): Promise<void> {
    if (this.handle !== null) {
      try {
        await this.handle.close()
        this.handle = null
        await unlink(this.lockPath).catch(() => {
          // Ignore errors when removing lock file
        })
      } catch (err: unknown) {
        // Ignore errors when releasing lock
      }
    }
  }
}

export interface StateManager {
  load(): Promise<BrainState | null>
  save(state: BrainState): Promise<void>
  /** Atomic read-modify-write: holds lock for entire cycle */
  withState(fn: (state: BrainState) => BrainState | Promise<BrainState>): Promise<BrainState | null>
  initialize(sessionId: string, config: HiveMindConfig): Promise<BrainState>
  exists(): boolean
}

export function createStateManager(projectRoot: string, logger?: Logger): StateManager {
  const brainPath = getEffectivePaths(projectRoot).brain
  const bakPath = brainPath + ".bak"
  const lockPath = brainPath + ".lock"
  const tempPath = brainPath + ".tmp"
  const lock = new FileLock(lockPath, logger)

  // Ensure directory exists before any operations
  const ensureDirectory = async () => {
    await mkdir(dirname(brainPath), { recursive: true })
  }

  return {
    async load(): Promise<BrainState | null> {
      try {
        await ensureDirectory()
        await lock.acquire()

        if (!existsSync(brainPath)) {
          return null
        }

        try {
          const data = await readFile(brainPath, "utf-8")
          const raw = JSON.parse(data) as Record<string, unknown>

          // ── Migration pipeline ──
          // Step 1: Run registered migrations by version
          const rawVersion = (raw as { version?: string }).version ?? "1.0.0"
          for (const [fromVersion, migrate] of BRAIN_STATE_MIGRATIONS) {
            if (rawVersion === fromVersion) {
              migrate(raw)
            }
          }

          // Step 2: Legacy field defaults (for files written before these fields existed)
          const session = raw.session as Record<string, unknown> | undefined
          if (session) {
            session.date ??= new Date((session.start_time as number) ?? Date.now()).toISOString().split("T")[0]
            session.meta_key ??= ""
            session.role ??= ""
            session.by_ai ??= true
            session.opencode_session_id ??= null
          }
          const metrics = raw.metrics as Record<string, unknown> | undefined
          if (metrics) {
            metrics.consecutive_failures ??= 0
            metrics.consecutive_same_section ??= 0
            metrics.last_section_content ??= ""
            metrics.keyword_flags ??= []
            metrics.keyword_flags_reset_turn ??= 0
            metrics.write_without_read_count ??= 0
            metrics.files_read_this_session ??= []
            metrics.tool_type_counts ??= { read: 0, write: 0, query: 0, governance: 0 }
            metrics.user_turn_count ??= 0
            metrics.last_context_update_turn ??= 0
            metrics.governance_counters ??= { drift: 0, compaction: 0, out_of_order: 0, evidence_pressure: 0 }
            const gc = metrics.governance_counters as Record<string, unknown>
            gc.out_of_order ??= 0
            gc.evidence_pressure ??= 0
          }
          raw.compaction_count ??= 0
          raw.last_compaction_time ??= 0
          raw.next_compaction_report ??= null
          raw.cycle_log ??= []
          raw.pending_failure_ack ??= false
          raw.first_turn_context_injected ??= false
          raw.framework_selection ??= {
            choice: null,
            active_phase: "",
            active_spec_path: "",
            acceptance_note: "",
            updated_at: 0,
          }
          // Remove deprecated fields
          Reflect.deleteProperty(raw, 'sentiment_signals')

          // Step 3: Validate with Zod schema
          const parseResult = BrainStateSchema.safeParse(raw)
          if (parseResult.success) {
            return parseResult.data as unknown as BrainState
          }

          // Validation failed — log details but still attempt best-effort return
          await logger?.warn(
            `BrainState validation failed (${parseResult.error.issues.length} issues), ` +
            `using raw data with best-effort defaults. First issue: ${parseResult.error.issues[0]?.message ?? 'unknown'}`
          )
          // Return the raw object as-is — it passed JSON parse and has been migrated
          return raw as unknown as BrainState
        } catch (parseErr: unknown) {
          // Attempt to recover from backup if main file is corrupted
          if (existsSync(bakPath)) {
            await logger?.error(`Brain state corrupted at ${brainPath}, attempting to load backup from ${bakPath}`)
            try {
              const backupData = await readFile(bakPath, "utf-8")
              const parsedBackup = JSON.parse(backupData) as BrainState
              return parsedBackup
            } catch (backupErr: unknown) {
              await logger?.error(`Backup file also corrupted at ${bakPath}: ${backupErr}`)
              return null
            }
          }
          if (parseErr instanceof SyntaxError) {
            await logger?.error(`Brain state JSON parse error at ${brainPath}: ${parseErr.message}`)
          } else {
            await logger?.error(`Brain state load error at ${brainPath}: ${parseErr}`)
          }
          return null
        }
      } catch (err: unknown) {
        if (isNodeError(err) && err.code === "ENOENT") {
          return null
        }
        await logger?.error(`Failed to load brain state: ${err}`)
        return null
      } finally {
        await lock.release()
      }
    },

    async save(state: BrainState): Promise<void> {
      try {
        await ensureDirectory()
        await lock.acquire()

        // Atomic write pattern: write to temp file first, then rename
        await writeFile(tempPath, JSON.stringify(state, null, 2))

        // Create backup of existing file if it exists
        if (existsSync(brainPath)) {
          try {
            // Create timestamped backup for better reliability
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
            const timestampedBakPath = brainPath + `.bak.${timestamp}`

            // Copy existing file to timestamped backup
            await copyFile(brainPath, timestampedBakPath)

            // Also maintain simple .bak file for backward compatibility
            await rename(brainPath, bakPath)

            // Cleanup old backup files (keep last 3 backups)
            await cleanupOldBackups(brainPath, logger)
          } catch (backupErr: unknown) {
            // Non-fatal — continue with save even if backup fails
            await logger?.error(`Failed to create backup: ${backupErr}`)
          }
        }

        // Rename temp file to main file
        await rename(tempPath, brainPath)
      } catch (error) {
        // Clean up temp file if save fails
        try {
          if (existsSync(tempPath)) {
            await unlink(tempPath)
          }
        } catch (cleanupErr: unknown) {
          // Ignore cleanup errors
        }
        throw new Error(`Failed to save brain state: ${error}`)
      } finally {
        await lock.release()
      }
    },

    async withState(
      fn: (state: BrainState) => BrainState | Promise<BrainState>
    ): Promise<BrainState | null> {
      try {
        await ensureDirectory()
        await lock.acquire()

        // Read
        if (!existsSync(brainPath)) return null
        const data = await readFile(brainPath, "utf-8")
        const parsed = JSON.parse(data) as BrainState

        // Modify
        const updated = await fn(parsed)

        // Write (atomic)
        await writeFile(tempPath, JSON.stringify(updated, null, 2))
        if (existsSync(brainPath)) {
          try {
            await rename(brainPath, bakPath)
          } catch (backupErr: unknown) {
            // Non-fatal — continue with write even if backup rename fails
            await logger?.error(`Failed to create backup: ${backupErr}`)
          }
        }
        await rename(tempPath, brainPath)

        return updated
      } catch (error) {
        try {
          if (existsSync(tempPath)) await unlink(tempPath)
        } catch { /* ignore cleanup */ }
        await logger?.error(`withState error: ${error}`)
        return null
      } finally {
        await lock.release()
      }
    },

    async initialize(
      sessionId: string,
      config: HiveMindConfig
    ): Promise<BrainState> {
      const state = createBrainState(sessionId, config)
      await this.save(state)
      return state
    },

    exists(): boolean {
      return existsSync(brainPath)
    },
  }
}

export async function loadConfig(projectRoot: string): Promise<HiveMindConfig> {
  const configPath = getEffectivePaths(projectRoot).config
  try {
    if (existsSync(configPath)) {
      const data = await readFile(configPath, "utf-8")
      const parsed = JSON.parse(data)
      return createConfig(parsed)
    }
  } catch (err: unknown) {
    if (isNodeError(err) && err.code !== "ENOENT") {
      // Log non-ENOENT errors (JSON parse, permission, etc.) to stderr
      // since loadConfig has no logger parameter — best-effort observability
      process.stderr.write(`[hivemind] Config load error at ${configPath}: ${err}\n`)
    }
  }

  return createConfig()
}

export async function saveConfig(
  projectRoot: string,
  config: HiveMindConfig
): Promise<void> {
  const configPath = getEffectivePaths(projectRoot).config
  await mkdir(dirname(configPath), { recursive: true })
  const tempPath = configPath + ".tmp"
  const bakPath = configPath + ".bak"

  try {
    // Atomic write pattern for config file as well
    await writeFile(tempPath, JSON.stringify(config, null, 2))
    if (existsSync(configPath)) {
      await rename(configPath, bakPath)
    }
    await rename(tempPath, configPath)
  } catch (error) {
    // Clean up temp file if save fails
    if (existsSync(tempPath)) {
      await unlink(tempPath).catch(() => { })
    }
    throw new Error(`Failed to save config: ${error}`)
  }
}
