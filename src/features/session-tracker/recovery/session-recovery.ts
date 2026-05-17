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

import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { sessionTrackerRoot, safeSessionPath } from "../persistence/atomic-write.js"
import { isValidSessionID } from "../types.js"
import { getSessionMessages } from "../../../shared/session-api.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import type { ChildSessionRecord, ProjectContinuityIndex, ProjectSessionEntry } from "../types.js"

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
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session recovery: failed to initialize session map",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
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
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session recovery: SDK messages unavailable for "${sessionID}"`,
            },
          })
        }
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session recovery: reconsumption failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
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
      const mainContent = await this.readSessionFile(sessionID)
      const childContext = await this.readRootOwnedChildContext(sessionID)
      context.fileContent = [mainContent, childContext].filter(Boolean).join("\n") || null

      if (this.client) {
        try {
          const messages = await getSessionMessages(this.client, sessionID)
          if (Array.isArray(messages)) {
            context.messages = messages
          }
        } catch {
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session recovery: SDK messages unavailable for "${sessionID}"`,
            },
          })
        }
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session recovery: rebuild failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
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
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session recovery: invalid sessionID rejected: "${sessionID}"`,
          },
        })
        return null
      }
      const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
      const content = await readFile(filePath, "utf-8")
      return content
    } catch {
      return null
    }
  }

  /**
   * Reads child `.json` records owned by a root main session and renders them
   * into append-only recovery markdown.
   *
   * @param rootSessionID - Root main session whose directory owns child files.
   * @returns Markdown context for child turns, journeys, and last messages.
   */
  private async readRootOwnedChildContext(rootSessionID: string): Promise<string | null> {
    try {
      if (!isValidSessionID(rootSessionID)) return null
      const rootDir = safeSessionPath(this.projectRoot, rootSessionID, "")
      const entries = await readdir(rootDir, { withFileTypes: true })
      const childSections: string[] = []

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue
        if (entry.name === "session-continuity.json" || entry.name === "hierarchy-manifest.json") continue

        const childID = entry.name.slice(0, -".json".length)
        if (!isValidSessionID(childID)) continue

        const filePath = safeSessionPath(this.projectRoot, rootSessionID, entry.name)
        const raw = await readFile(filePath, "utf-8")
        const record = JSON.parse(raw) as ChildSessionRecord
        childSections.push(this.renderChildContext(record))
      }

      return childSections.length > 0 ? childSections.join("\n") : null
    } catch {
      return null
    }
  }

  /**
   * Renders a child session record into recovery markdown.
   *
   * @param record - Child session record loaded from disk.
   * @returns Markdown summary preserving full child context fields.
   */
  private renderChildContext(record: ChildSessionRecord): string {
    const lines = [
      `## CHILD SESSION ${record.sessionID}`,
      "",
      `**parentSessionID:** ${record.parentSessionID}`,
      `**delegationDepth:** ${record.delegationDepth}`,
      `**status:** ${record.status}`,
    ]

    if (record.lastMessage) {
      lines.push("", "### lastMessage", "", record.lastMessage)
    }

    for (const turn of record.turns) {
      lines.push("", `### turn ${turn.turn}: ${turn.actor}`, "", turn.content)
      if (turn.tools.length > 0) {
        lines.push("", "```json", JSON.stringify(turn.tools, null, 2), "```")
      }
    }

    if (record.journey && record.journey.length > 0) {
      lines.push("", "### journey", "", "```json", JSON.stringify(record.journey, null, 2), "```")
    }

    return `${lines.join("\n")}\n`
  }
}
