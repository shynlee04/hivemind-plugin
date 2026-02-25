/**
 * Watch Integration — connects FileSystemWatcher → IncrementalUpdater → EventBus
 *
 * Bridges the watcher.ts file events to the code-intel incremental updater,
 * producing codemap update events on the event bus.
 *
 * @module lib/code-intel/watch-integration
 */

import { relative } from "node:path"

import { FileSystemWatcher } from "../watcher.js"
import { eventBus, createEvent } from "../event-bus.js"
import type { ArtifactEvent } from "../../schemas/events.js"
import { IncrementalUpdater } from "./incremental-updater.js"
import type { CodeMap } from "./codemap-io.js"

// ─── Types ──────────────────────────────────────────────────────────────

export interface WatchIntegration {
  /** Start watching the project directory for file changes */
  start(): void
  /** Stop watching and clean up all resources */
  stop(): void
  /** Force a rescan of all tracked files for staleness */
  rescanAll(): Promise<string[]>
  /** Get current watcher status */
  getStatus(): WatchStatus
}

export interface WatchStatus {
  isWatching: boolean
  projectRoot: string
  filesWatched: number
  lastUpdate: string | null
  pendingChanges: number
  updatesProcessed: number
  errors: number
}

export interface WatchIntegrationOptions {
  /** Debounce interval for file events (ms). Default: 300 */
  debounceMs?: number
  /** Additional ignore patterns beyond watcher defaults */
  ignorePatterns?: RegExp[]
  /** Whether to emit events to the event bus (default: true) */
  emitEvents?: boolean
  /** Maximum concurrent file updates (default: 5) */
  concurrency?: number
}

// ─── Implementation ─────────────────────────────────────────────────────

/**
 * Create a watch integration that connects the file system watcher
 * to the incremental updater and event bus.
 *
 * Usage:
 * ```ts
 * const codemap = await loadCodeMap(codemapPath)
 * const watch = startWatchIntegration(projectRoot, codemap)
 * watch.start()
 * // ... later ...
 * watch.stop()
 * ```
 */
export function startWatchIntegration(
  projectRoot: string,
  codemap: CodeMap,
  options: WatchIntegrationOptions = {},
): WatchIntegration {
  const {
    debounceMs = 300,
    ignorePatterns = [],
    emitEvents = true,
    concurrency = 5,
  } = options

  const updater = new IncrementalUpdater(projectRoot)
  const watcher = new FileSystemWatcher({
    debounceMs,
    ignorePatterns: [
      /node_modules/,
      /\.git/,
      /\.hivemind/,
      /dist/,
      /build/,
      /\.DS_Store/,
      ...ignorePatterns,
    ],
  })

  let isWatching = false
  let lastUpdate: string | null = null
  let pendingChanges = 0
  let updatesProcessed = 0
  let errorCount = 0

  // Queue for processing file changes (prevents overloading)
  const pendingQueue: Array<{ path: string; type: string }> = []
  let isProcessing = false

  // ── Event Handlers ──────────────────────────────────────────────────

  async function processQueue(): Promise<void> {
    if (isProcessing || pendingQueue.length === 0) return
    isProcessing = true

    // Process up to concurrency items at a time
    while (pendingQueue.length > 0) {
      const batch = pendingQueue.splice(0, concurrency)
      const promises = batch.map(async (item) => {
        try {
          const relativePath = relative(projectRoot, item.path)

          if (item.type === "file:deleted") {
            const result = await updater.removeFile(codemap, relativePath)

            if (emitEvents) {
              const event = createEvent("codemap:updated", {
                filesScanned: codemap.totalFiles,
                totalTokens: codemap.totalTokens,
                duration: 0,
                changeType: result.changeType,
                filePath: relativePath,
                tokenDelta: result.tokenDelta,
              }, "watch-integration")
              eventBus.emitEvent(event)
            }
          } else {
            // file:created or file:modified
            const result = await updater.updateFile(codemap, relativePath)

            if (emitEvents) {
              const event = createEvent("codemap:updated", {
                filesScanned: codemap.totalFiles,
                totalTokens: codemap.totalTokens,
                duration: 0,
                changeType: result.changeType,
                filePath: relativePath,
                tokenDelta: result.tokenDelta,
              }, "watch-integration")
              eventBus.emitEvent(event)
            }
          }

          updatesProcessed++
          lastUpdate = new Date().toISOString()
        } catch {
          errorCount++
        } finally {
          pendingChanges = Math.max(0, pendingChanges - 1)
        }
      })

      await Promise.allSettled(promises)
    }

    isProcessing = false
  }

  function onFileEvent(event: ArtifactEvent): void {
    const path = event.payload.path as string
    if (!path) return

    pendingChanges++
    pendingQueue.push({ path, type: event.type })

    // Trigger processing
    processQueue().catch(() => {
      errorCount++
    })
  }

  // ── Public API ──────────────────────────────────────────────────────

  return {
    start(): void {
      if (isWatching) return

      // Subscribe to watcher file events
      watcher.on("file:created", onFileEvent)
      watcher.on("file:modified", onFileEvent)
      watcher.on("file:deleted", onFileEvent)

      // Start watching the project directory
      watcher.watchDirectory(projectRoot)
      isWatching = true
    },

    stop(): void {
      if (!isWatching) return

      watcher.removeListener("file:created", onFileEvent)
      watcher.removeListener("file:modified", onFileEvent)
      watcher.removeListener("file:deleted", onFileEvent)

      watcher.stopAll()
      isWatching = false

      // Clear pending queue
      pendingQueue.length = 0
      pendingChanges = 0
    },

    async rescanAll(): Promise<string[]> {
      const staleFiles = await updater.getStaleFiles(codemap)

      for (const filePath of staleFiles) {
        await updater.updateFile(codemap, filePath)
        updatesProcessed++
      }

      lastUpdate = new Date().toISOString()

      if (emitEvents && staleFiles.length > 0) {
        const event = createEvent("codemap:updated", {
          filesScanned: codemap.totalFiles,
          totalTokens: codemap.totalTokens,
          duration: 0,
          staleFilesResynced: staleFiles.length,
        }, "watch-integration")
        eventBus.emitEvent(event)
      }

      return staleFiles
    },

    getStatus(): WatchStatus {
      return {
        isWatching,
        projectRoot,
        filesWatched: codemap.totalFiles,
        lastUpdate,
        pendingChanges,
        updatesProcessed,
        errors: errorCount,
      }
    },
  }
}
