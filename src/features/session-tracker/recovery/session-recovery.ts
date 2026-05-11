/**
 * Session recovery and reconsumption after agent disconnection.
 *
 * Enables agents to rebuild session context from persisted tracker files
 * (.md and .json) combined with the OpenCode SDK REST API. Follows D-05:
 * on plugin load, reads `project-continuity.json` to initialize the session
 * map. When an agent reconnects, normal hook flow resumes — this module
 * provides the gap-filling methods for missed messages.
 *
 * All methods are best-effort: they catch errors internally and return
 * partial results rather than throwing.
 *
 * @module session-tracker/recovery/session-recovery
 */

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { sessionTrackerRoot, safeSessionPath } from "../persistence/atomic-write.js"
import { isValidSessionID } from "../types.js"
import { getSessionMessages } from "../../../shared/session-api.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import type { ProjectContinuityIndex, ProjectSessionEntry } from "../types.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Result of a reconsumption operation comparing persisted file
 * content with live SDK messages to identify gaps.
 */
export interface ReconsumptionResult {
  /** The session identifier that was reconsumed. */
  sessionID: string
  /** Messages present in the SDK but missing from the persisted file. */
  missingMessages: unknown[]
  /** Messages present in the persisted file. */
  persistedMessages: string[]
  /** Total message count from SDK. */
  totalSdkMessages: number
  /** Total turn count observed in the persisted file. */
  totalPersistedTurns: number
}

/**
 * Rebuilt context combining persisted file content with SDK messages.
 */
export interface SessionContext {
  /** The session identifier. */
  sessionID: string
  /** Raw content of the persisted .md file. */
  fileContent: string | null
  /** Messages retrieved from the SDK. */
  messages: unknown[]
}

// ---------------------------------------------------------------------------
// SessionRecovery class
// ---------------------------------------------------------------------------

/**
 * Recovers session context after agent disconnection.
 *
 * Reads persisted session tracker files and combines them with
 * live SDK data to provide gap analysis and context rebuilding.
 */
export class SessionRecovery {
  private client: OpenCodeClient
  private projectRoot: string

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for REST API queries.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
  }

  /**
   * Initializes recovery by reading `project-continuity.json` and building
   * an in-memory session map.
   *
   * Called once during plugin startup per D-05. This is initialization,
   * not a separate recovery phase — normal hook flow handles ongoing capture.
   *
   * @returns A `Map` of session IDs to their project-level metadata entries.
   *   Returns an empty map if the index file is missing or corrupt.
   */
  async initialize(): Promise<Map<string, ProjectSessionEntry>> {
    const map = new Map<string, ProjectSessionEntry>()

    try {
      const index = await this.readProjectIndex()
      if (!index?.sessions) return map

      for (const [sessionID, entry] of Object.entries(index.sessions)) {
        map.set(sessionID, entry as ProjectSessionEntry)
      }
    } catch (err) {
      console.warn(
        "[Harness] Session recovery: failed to initialize session map:",
        err,
      )
    }

    return map
  }

  /**
   * Compares persisted session file content with SDK messages to identify
   * gaps in the captured data.
   *
   * Uses `client.session.messages()` to retrieve the full message history
   * from the OpenCode runtime, then compares it against the content of the
   * persisted `.md` file to detect messages that were missed.
   *
   * @param sessionID - The session identifier to reconsumer.
   * @returns Gap analysis result, or partial data if SDK call fails.
   */
  async reconsumeSession(sessionID: string): Promise<ReconsumptionResult> {
    const result: ReconsumptionResult = {
      sessionID,
      missingMessages: [],
      persistedMessages: [],
      totalSdkMessages: 0,
      totalPersistedTurns: 0,
    }

    try {
      // Read persisted .md file content
      const fileContent = await this.readSessionFile(sessionID)
      if (fileContent) {
        result.persistedMessages = fileContent.split("\n").filter(Boolean)
        // Count ## USER turn headers
        const turnMatches = fileContent.match(/^## USER \(turn \d+\)$/gm)
        result.totalPersistedTurns = turnMatches ? turnMatches.length : 0
      }

      // Query SDK for messages
      if (this.client) {
        try {
          const messages = await getSessionMessages(this.client, sessionID)
          if (Array.isArray(messages)) {
            result.totalSdkMessages = messages.length
            // Detect gaps: any SDK message that doesn't have a corresponding
            // turn in the persisted file
            if (result.totalSdkMessages > result.totalPersistedTurns) {
              result.missingMessages = messages.slice(result.totalPersistedTurns)
            }
          }
        } catch {
          // SDK call may fail if session doesn't exist or client is unavailable
          console.warn(
            `[Harness] Session recovery: SDK messages unavailable for "${sessionID}"`,
          )
        }
      }
    } catch (err) {
      console.warn(
        `[Harness] Session recovery: reconsumption failed for "${sessionID}":`,
        err,
      )
    }

    return result
  }

  /**
   * Rebuilds the full session context by combining persisted file content
   * with SDK message data.
   *
   * @param sessionID - The session identifier to rebuild.
   * @returns The combined session context for agent reconsumption.
   */
  async rebuildSessionContext(sessionID: string): Promise<SessionContext> {
    const context: SessionContext = {
      sessionID,
      fileContent: null,
      messages: [],
    }

    try {
      context.fileContent = await this.readSessionFile(sessionID)

      if (this.client) {
        try {
          const messages = await getSessionMessages(this.client, sessionID)
          if (Array.isArray(messages)) {
            context.messages = messages
          }
        } catch {
          console.warn(
            `[Harness] Session recovery: SDK messages unavailable for "${sessionID}"`,
          )
        }
      }
    } catch (err) {
      console.warn(
        `[Harness] Session recovery: rebuild failed for "${sessionID}":`,
        err,
      )
    }

    return context
  }

  /**
   * Checks whether a session file is parseable and structurally valid.
   *
   * Used to detect incomplete files after a crash. Because all writes use
   * atomic rename (D-03), incomplete files should not exist in normal
   * operation. However, this provides an additional safety check.
   *
   * @param filePath - Absolute path to the session file.
   * @returns `true` if the file exists and is structurally valid.
   */
  async isSessionFileParseable(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, "utf-8")
      // Basic structural validation: file is not empty and has reasonable content
      if (!content || content.trim().length === 0) return false
      // Try to find frontmatter or content markers
      return content.includes("---") || content.includes("## ")
    } catch {
      return false
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Reads and parses `project-continuity.json` from the session tracker root.
   *
   * @returns The parsed project index, or `null` if missing or corrupt.
   */
  private async readProjectIndex(): Promise<ProjectContinuityIndex | null> {
    try {
      const indexPath = resolve(
        sessionTrackerRoot(this.projectRoot),
        "project-continuity.json",
      )
      const raw = await readFile(indexPath, "utf-8")
      const parsed = JSON.parse(raw) as ProjectContinuityIndex

      if (!parsed || typeof parsed !== "object" || !parsed.sessions) {
        return null
      }

      return parsed
    } catch {
      return null
    }
  }

  /**
   * Reads the persisted session `.md` file content using safe path construction.
   *
   * Applies path safety via `safeSessionPath()` and input validation via
   * `isValidSessionID()` before ANY path operations (CR-01).
   *
   * @param sessionID - The session identifier.
   * @returns The file content, or `null` if the file is missing.
   */
  private async readSessionFile(sessionID: string): Promise<string | null> {
    try {
      if (!isValidSessionID(sessionID)) {
        console.warn(
          `[Harness] Session recovery: invalid sessionID rejected: "${sessionID}"`,
        )
        return null
      }
      const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
      const content = await readFile(filePath, "utf-8")
      return content
    } catch {
      return null
    }
  }
}
