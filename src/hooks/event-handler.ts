import type {
  Event,
  EventSessionCreated,
  EventSessionIdle,
  EventSessionCompacted,
  EventFileEdited,
  EventSessionDiff,
} from "@opencode-ai/sdk"
import type { Logger } from "../lib/logging.js"
// Phase 2: import { createStateManager } from "../lib/persistence.js"

export function createEventHandler(log: Logger, directory: string) {
  // Phase 2: const stateManager = createStateManager(directory)
  void directory // Suppress unused for now

  return async (input: { event: Event }): Promise<void> => {
    try {
      const { event } = input

      switch (event.type) {
        case "session.created":
          await log.info(`[event] session.created: ${(event as EventSessionCreated).properties.info.id}`)
          // Phase 2 will wire this to governance bootstrap
          break

        case "session.idle":
          await log.info(`[event] session.idle: ${(event as EventSessionIdle).properties.sessionID}`)
          // Phase 2 will wire this to Time-to-Stale check
          // (replacing turn-count approximation with real idle detection)
          break

        case "session.compacted":
          await log.info(`[event] session.compacted: ${(event as EventSessionCompacted).properties.sessionID}`)
          // Phase 3 will wire this to integrity check
          // (hierarchy, brain state, mems consistency validation)
          break

        case "file.edited":
          await log.debug(`[event] file.edited: ${(event as EventFileEdited).properties.file}`)
          // Phase 2 will wire this to file-aware governance
          // Track which files are being edited for context enrichment
          break

        case "session.diff":
          await log.debug(`[event] session.diff: ${(event as EventSessionDiff).properties.sessionID} (${(event as EventSessionDiff).properties.diff.length} files)`)
          // Phase 3 will use this for auto-export session diffs
          break

        default:
          // Log unhandled events at debug level for discoverability
          await log.debug(`[event] ${(event as any).type} (unhandled)`)
          break
      }
    } catch (error: unknown) {
      // P3: Never break event handling
      await log.error(`Event handler error: ${error}`)
    }
  }
}
